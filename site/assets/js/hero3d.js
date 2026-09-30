// Hero 3D: the real prototype as a scene. Acrylic plate 40x40 cm, 30x30 sensor frame,
// 4 brass piezo discs with wires, foam feet. A nut drops through the 10 cm guide tube,
// the plate ripples, sensors light in arrival order and an energy bar rises.
// Visual simulation only (slowed down, levels chosen at random) - labelled in the HUD.
// Returns false if WebGL is unavailable so the caller can fall back to the 2D canvas.

const LV = [
  { name: 'ระดับ 1', color: 0x3dda84, h: 5 },
  { name: 'ระดับ 2', color: 0xf2c744, h: 9 },
  { name: 'ระดับ 3', color: 0xff5d5d, h: 13.5 },
];
const SENS = [[0, 0], [30, 0], [30, 30], [0, 30]]; // project coords (cm), S1..S4
const W = (x, y) => [x - 15, 15 - y];             // project -> world (X, Z)
const WAVE = 24;                                  // visual wave speed cm/s (real 675 m/s, slowed)

export async function initHero3D(stage, reduced) {
  let THREE;
  try {
    THREE = await import('three');
  } catch (e) { return false; }
  const canvas = document.createElement('canvas');
  canvas.className = 'gl';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { return false; }
  if (!renderer.getContext()) return false;
  stage.appendChild(canvas);
  const fallback = stage.querySelector('.hero-canvas');
  if (fallback) fallback.style.display = 'none';

  const mobile = matchMedia('(max-width: 899px)').matches || matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 1);
  renderer.debug.checkShaderErrors = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 400);

  /* ---- studio environment for reflections (cheap, generated once) ---- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshBasicMaterial({ color: 0x05080b, side: THREE.BackSide })));
  const softbox = (w, h, rgb, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...rgb), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); env.add(m);
  };
  softbox(60, 16, [5, 5, 5], [0, 45, 0], [Math.PI / 2, 0, 0]);
  softbox(10, 60, [0.6, 3.2, 3.6], [-45, 10, 0], [0, Math.PI / 2, 0]);
  softbox(10, 40, [3.2, 2.2, 1.1], [45, 5, -10], [0, -Math.PI / 2, 0]);
  softbox(40, 6, [1.5, 1.8, 2], [0, 10, -45], [0, 0, 0]);
  const envRT = pmrem.fromScene(env, 0.035);
  scene.environment = envRT.texture;
  pmrem.dispose();

  const root = new THREE.Group();
  scene.add(root);

  /* ---- acrylic plate ---- */
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.5, 40),
    new THREE.MeshPhysicalMaterial({ color: 0xa8eef8, emissive: 0x0b4652, emissiveIntensity: 0.45, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.22, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.7, depthWrite: false })
  );
  root.add(plate);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(plate.geometry), new THREE.LineBasicMaterial({ color: 0x9ff3fb, transparent: true, opacity: 0.9 }));
  root.add(edges);
  // thin bright underside edge = light caught in acrylic
  const glowEdge = new THREE.Mesh(new THREE.BoxGeometry(40.2, 0.08, 40.2), new THREE.MeshBasicMaterial({ color: 0x3fd8e6, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
  glowEdge.position.y = -0.26; root.add(glowEdge);

  // foam feet
  const foamMat = new THREE.MeshStandardMaterial({ color: 0x20262b, roughness: 0.9 });
  [[-17.5, -17.5], [17.5, -17.5], [17.5, 17.5], [-17.5, 17.5]].forEach(([x, z]) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 4), foamMat); f.position.set(x, -0.76, z); root.add(f);
  });

  // grid (5 cm) + dashed 30x30 frame
  const gridPts = [];
  for (let k = -20; k <= 20; k += 5) { gridPts.push(k, 0.27, -20, k, 0.27, 20, -20, 0.27, k, 20, 0.27, k); }
  const gridGeo = new THREE.BufferGeometry(); gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
  root.add(new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: 0x7fd0de, transparent: true, opacity: 0.22 })));
  const frameGeo = new THREE.BufferGeometry().setFromPoints([[-15, -15], [15, -15], [15, 15], [-15, 15], [-15, -15]].map(([x, z]) => new THREE.Vector3(x, 0.29, z)));
  const frameLine = new THREE.Line(frameGeo, new THREE.LineDashedMaterial({ color: 0x3fd8e6, dashSize: 1.1, gapSize: 0.8, transparent: true, opacity: 0.75 }));
  frameLine.computeLineDistances(); root.add(frameLine);

  /* ---- ripple surface (shader) ---- */
  const seg = mobile ? 72 : 140;
  const rippleGeo = new THREE.PlaneGeometry(40, 40, seg, seg); rippleGeo.rotateX(-Math.PI / 2);
  const MAXI = 3;
  const uni = { uTime: { value: 0 }, uImp: { value: Array.from({ length: MAXI }, () => new THREE.Vector4(0, 0, -99, 0)) }, uSpeed: { value: WAVE } };
  const ripple = new THREE.Mesh(rippleGeo, new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime; uniform vec4 uImp[${MAXI}]; uniform float uSpeed;
      varying float vGlow; varying vec2 vP;
      void main(){
        vec3 p = position; float g = 0.0; float h = 0.0;
        for(int i=0;i<${MAXI};i++){
          vec4 im = uImp[i]; float age = uTime - im.z; if(age < 0.0 || age > 4.0) continue;
          float d = distance(p.xz, im.xy); float r = age * uSpeed;
          float behind = r - d; float fade = exp(-age * 0.9) * im.w;
          float front = exp(-pow(behind / 1.1, 2.0));
          float trail = behind > 0.0 ? sin(behind * 1.6) * exp(-behind * 0.22) : 0.0;
          h += (front * 0.55 + trail * 0.35) * fade;
          g += (front + max(trail, 0.0) * 0.45) * fade;
        }
        p.y += h; vGlow = g; vP = p.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      varying float vGlow; varying vec2 vP;
      void main(){
        float edge = smoothstep(20.0, 18.5, max(abs(vP.x), abs(vP.y)));
        vec3 c = vec3(0.25, 0.85, 0.9) * vGlow * 0.9 * edge;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  ripple.position.y = 0.3; root.add(ripple);

  /* ---- glow sprite texture ---- */
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const sprite = (color, scale) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    s.scale.setScalar(scale); return s;
  };

  /* ---- piezo sensors + wires ---- */
  const brass = new THREE.MeshStandardMaterial({ color: 0xd2aa5f, metalness: 1, roughness: 0.3, envMapIntensity: 1.3 });
  const ceramic = new THREE.MeshStandardMaterial({ color: 0xe8e3d6, metalness: 0, roughness: 0.55 });
  const wireR = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.5 });
  const wireB = new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.5 });
  const sensors = SENS.map(([sx, sy], i) => {
    const [x, z] = W(sx, sy);
    const g = new THREE.Group(); g.position.set(x, 0.25, z);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.1, 40), brass); disc.position.y = 0.05; g.add(disc);
    const cer = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.14, 36), ceramic); cer.position.y = 0.08; g.add(cer);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), brass); dot.position.set(0.35, 0.17, 0.2); g.add(dot);
    const glow = sprite(0x3fd8e6, 7); glow.position.y = 0.6; g.add(glow);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.7, 48), new THREE.MeshBasicMaterial({ color: 0x3fd8e6, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12; g.add(ring);
    root.add(g);
    // wires: leave the disc outward and droop off the plate edge
    const out = new THREE.Vector2(Math.sign(x), Math.sign(z));
    [wireR, wireB].forEach((mat, k) => {
      const off = (k ? -0.35 : 0.35);
      const pts = [
        new THREE.Vector3(x + out.x * 0.6 + off * out.y, 0.42, z + out.y * 0.6 - off * out.x),
        new THREE.Vector3(x + out.x * 2.6 + off * 1.6, 0.8, z + out.y * 1.8 - off),
        new THREE.Vector3(x + out.x * 4.5 + off, 0.4, z + out.y * 4.9 + off * 0.6),
        new THREE.Vector3(x + out.x * 6.2, -1.6, z + out.y * 6.4 + off),
        new THREE.Vector3(x + out.x * 7.5 + off, -4.5, z + out.y * 8),
      ];
      root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), mobile ? 24 : 48, 0.075, 6), mat));
    });
    return { g, glow, ring, x, z, lit: 0, hitAt: -1 };
  });

  /* ---- drop tube + nut ---- */
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 10, 32, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xdfeef3, roughness: 0.15, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.5 }));
  root.add(tube);
  const tubeRim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: 0x9fe3f0, transparent: true, opacity: 0.5 }));
  tubeRim.rotation.x = Math.PI / 2; root.add(tubeRim);
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 6), new THREE.MeshStandardMaterial({ color: 0xb9c2c7, metalness: 1, roughness: 0.28 }));
  root.add(nut);
  const flash = sprite(0xffffff, 10); root.add(flash);

  /* ---- energy bars (keep a few, like the real UI history) ---- */
  const barGeo = new THREE.CylinderGeometry(0.42, 0.42, 1, 20); barGeo.translate(0, 0.5, 0);
  const capGeo = new THREE.SphereGeometry(0.95, 24, 16);
  const ringGeo = new THREE.RingGeometry(1.25, 1.55, 48);
  const bars = [];
  const makeBar = (x, z, lv) => {
    const col = new THREE.Color(LV[lv].color);
    const g = new THREE.Group(); g.position.set(x, 0.3, z);
    const bar = new THREE.Mesh(barGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
    const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.1, transparent: true }));
    const halo = sprite(LV[lv].color, 7);
    const base = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xd6b06a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    base.rotation.x = -Math.PI / 2; base.position.y = 0.03;
    g.add(bar, cap, halo, base); root.add(g);
    const b = { g, bar, cap, halo, base, lv, h: LV[lv].h, born: 0, a: 1 };
    bars.push(b);
    while (bars.length > 4) { const old = bars.shift(); root.remove(old.g); old.bar.material.dispose(); old.cap.material.dispose(); old.halo.material.dispose(); old.base.material.dispose(); }
    return b;
  };

  /* ---- lights ---- */
  scene.add(new THREE.HemisphereLight(0x9fdcff, 0x05080a, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-20, 40, 25); scene.add(key);
  const rim = new THREE.PointLight(0x3fd8e6, 120, 90, 1.6); rim.position.set(18, 10, -22); scene.add(rim);

  /* ---- HUD ---- */
  const hudEv = document.getElementById('hudEv'), hudXY = document.getElementById('hudXY'), hudLv = document.getElementById('hudLv');
  let evNo = 0;

  /* ---- event cycle ---- */
  const CYCLE = 4.2, FALL = 0.42;
  let ev = null;
  const lvSeq = [1, 0, 2, 1, 0, 1, 2];
  function newEvent(t) {
    const px = 5 + Math.random() * 20, py = 5 + Math.random() * 20;
    const [x, z] = W(px, py);
    ev = { t0: t, x, z, px, py, lv: lvSeq[evNo % lvSeq.length], impact: false, bar: null };
    tube.position.set(x, 5.3, z); tubeRim.position.set(x, 10.3, z);
    sensors.forEach((s) => { s.hitAt = -1; });
  }
  function impact(t) {
    ev.impact = true; ev.tImp = t;
    const slot = evNo % MAXI;
    uni.uImp.value[slot].set(ev.x, ev.z, t, 1);
    sensors.forEach((s) => { s.hitAt = t + Math.hypot(s.x - ev.x, s.z - ev.z) / WAVE; });
    ev.bar = makeBar(ev.x, ev.z, ev.lv); ev.bar.born = t;
    evNo++;
    if (hudEv) {
      hudEv.textContent = String(evNo).padStart(3, '0');
      hudXY.textContent = `${ev.px.toFixed(1)}, ${ev.py.toFixed(1)}`;
      hudLv.textContent = LV[ev.lv].name;
      hudLv.className = `lv-${ev.lv + 1}`;
    }
  }

  /* ---- camera + input ---- */
  const target = new THREE.Vector3(0, 1.5, 0);
  let pxT = 0, pyT = 0, px = 0, py = 0;
  addEventListener('pointermove', (e) => { pxT = (e.clientX / innerWidth) * 2 - 1; pyT = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    pxT = Math.max(-1, Math.min(1, e.gamma / 30)); pyT = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  }, { passive: true });

  let wide = false;
  function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    wide = innerWidth >= 1200;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = wide ? 30 : 34;
    if (wide) camera.setViewOffset(w, h, -w * 0.2, -h * 0.02, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    if (!running) render(clock);
  }

  function place(t) {
    px += (pxT - px) * 0.04; py += (pyT - py) * 0.04;
    const az = -0.55 + Math.sin(t * 0.11) * 0.32 + px * 0.22;
    const el = 0.62 + py * -0.08 + Math.sin(t * 0.07) * 0.03;
    const dist = wide ? 138 : 92;
    camera.position.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(target);
  }

  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  function update(t) {
    uni.uTime.value = t;
    if (!ev || t - ev.t0 > CYCLE) newEvent(t);
    const e = t - ev.t0;
    // tube fades in, nut falls under gravity, tube fades out after impact
    const tubeA = e < 0.35 ? e / 0.35 : ev.impact ? Math.max(0, 1 - (t - ev.tImp) / 0.9) : 1;
    tube.material.opacity = 0.16 * tubeA; tubeRim.material.opacity = 0.5 * tubeA;
    if (!ev.impact) {
      const k = Math.max(0, (e - 0.35) / FALL);
      nut.visible = true;
      nut.position.set(ev.x, 10.2 - 9.7 * Math.min(1, k * k), ev.z);
      nut.rotation.y = e * 3;
      if (k >= 1) impact(t);
    } else {
      const a = t - ev.tImp;
      nut.position.y = 0.52 + Math.max(0, Math.sin(a * 14) * 0.5 * Math.exp(-a * 6));
      nut.visible = a < 1.4;
      flash.position.set(ev.x, 0.8, ev.z);
      flash.material.opacity = Math.max(0, 1 - a * 3);
      flash.scale.setScalar(6 + a * 20);
    }
    // sensors
    sensors.forEach((s) => {
      const since = s.hitAt > 0 ? t - s.hitAt : -1;
      const on = since >= 0 ? Math.exp(-since * 1.6) : 0;
      s.glow.material.opacity = 0.15 + on * 0.95;
      s.glow.scale.setScalar(5 + on * 5);
      const rr = since >= 0 && since < 1.2 ? since / 1.2 : 1;
      s.ring.material.opacity = since >= 0 ? (1 - rr) * 0.9 : 0;
      s.ring.scale.setScalar(1 + rr * 2.4);
    });
    // bars
    bars.forEach((b, i) => {
      const age = t - b.born;
      const grow = easeOut(Math.min(1, age / 0.9));
      const h = Math.max(0.01, b.h * grow);
      const fadeA = i === bars.length - 1 ? 1 : Math.max(0.12, 0.55 - (bars.length - 1 - i) * 0.14);
      b.bar.scale.y = h; b.cap.position.y = h + 0.9;
      b.bar.material.opacity = 0.7 * fadeA; b.cap.material.opacity = fadeA;
      b.halo.position.y = h + 0.9; b.halo.material.opacity = 0.65 * fadeA * grow;
      b.base.material.opacity = 0.75 * fadeA;
      b.base.scale.setScalar(1 + Math.max(0, 1 - age * 1.5) * 0.8);
    });
  }

  const clock = { t: 0 };
  function render() { place(clock.t); renderer.render(scene, camera); }

  // reduced motion: a single composed frame
  function still() {
    clock.t = 30;
    newEvent(26.6); impact(27.2);
    update(30); render();
  }

  let running = false, raf = 0, last = 0, visible = true;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    clock.t += dt;
    update(clock.t); render();
    raf = requestAnimationFrame(frame);
  }
  const start = () => { if (running || reduced.matches || !visible || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  new ResizeObserver(resize).observe(stage);
  resize();
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  reduced.addEventListener('change', () => { if (reduced.matches) { stop(); still(); } else start(); });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); canvas.remove(); if (fallback) fallback.style.display = ''; });

  if (reduced.matches) still(); else { clock.t = 0.2; update(clock.t); render(); start(); }
  requestAnimationFrame(() => canvas.classList.add('is-on'));
  return true;
}
