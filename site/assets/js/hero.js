// Hero background: a 30x30 plate with 4 sensors and expanding wave rings.
// Paused when off-screen or tab hidden; one static frame under prefers-reduced-motion.
export function initHero(canvas, reduced) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  const ACC = '63,216,230';
  let W = 0, H = 0, size = 0, ox = 0, oy = 0;
  let rings = [], nextSpawn = 0, raf = 0, last = 0, visible = true;
  const sensors = [[0, 0], [1, 0], [1, 1], [0, 1]]; // unit coords, y up
  const lit = [0, 0, 0, 0];
  const P = (u, v) => [ox + u * size, oy + (1 - v) * size];
  const staticRing = () => [{ u: 0.4, v: 0.6, t0: 0, hit: [false, false, false, false] }];

  function draw(t, still) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(190,220,230,0.10)';
    ctx.beginPath();
    for (let i = 1; i < 6; i++) {
      const k = (i / 6) * size;
      ctx.moveTo(ox + k, oy); ctx.lineTo(ox + k, oy + size);
      ctx.moveTo(ox, oy + k); ctx.lineTo(ox + size, oy + k);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190,220,230,0.28)';
    ctx.strokeRect(ox + 0.5, oy + 0.5, size, size);

    const speed = size * 0.5; // px per second
    for (const r of rings) {
      const rad = still ? size * 0.42 : ((t - r.t0) * speed) / 1000;
      const [cx, cy] = P(r.u, r.v);
      const a = Math.max(0, 1 - rad / (size * 1.25));
      if (a <= 0) continue;
      ctx.strokeStyle = `rgba(${ACC},${0.5 * a})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 6.2832); ctx.stroke();
      ctx.strokeStyle = `rgba(${ACC},${0.16 * a})`;
      ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, rad - 14), 0, 6.2832); ctx.stroke();
      if (a > 0.5) { ctx.fillStyle = `rgba(${ACC},${0.7 * a})`; ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3); }
      sensors.forEach((s, i) => {
        const [sx, sy] = P(s[0], s[1]);
        if (!r.hit[i] && Math.hypot(sx - cx, sy - cy) <= rad) { r.hit[i] = true; lit[i] = 1; }
      });
    }
    sensors.forEach((s, i) => {
      const [sx, sy] = P(s[0], s[1]);
      const l = still ? (i === 0 ? 0.8 : 0.2) : lit[i];
      ctx.strokeStyle = `rgba(${ACC},${0.35 + 0.65 * l})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx - 6, sy - 6, 12, 12);
      if (l > 0.02) {
        ctx.fillStyle = `rgba(${ACC},${l})`;
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
        ctx.strokeStyle = `rgba(${ACC},${0.4 * l})`;
        ctx.beginPath(); ctx.arc(sx, sy, 10 + (1 - l) * 16, 0, 6.2832); ctx.stroke();
      }
      if (!still) lit[i] = Math.max(0, lit[i] - 0.02);
    });
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wide = W > 900;
    size = wide ? Math.min(W * 0.3, H * 0.62) : Math.min(W * 0.7, H * 0.78);
    ox = wide ? W * 0.74 - size / 2 : W * 0.5 - size / 2;
    oy = wide ? H * 0.44 - size / 2 : H * 0.5 - size / 2;
    if (reduced.matches) draw(0, true);
  }

  function frame(t) {
    if (t - last > 30) {
      last = t;
      if (t >= nextSpawn) {
        rings.push({ u: 0.15 + Math.random() * 0.7, v: 0.15 + Math.random() * 0.7, t0: t, hit: [false, false, false, false] });
        if (rings.length > 3) rings.shift();
        nextSpawn = t + 2600;
      }
      draw(t, false);
    }
    raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && !reduced.matches && visible && !document.hidden) raf = requestAnimationFrame(frame); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  rings = staticRing();
  resize();
  new ResizeObserver(resize).observe(hero);
  if (reduced.matches) { draw(0, true); return; }
  rings = [];
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) start(); else stop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { stop(); rings = staticRing(); draw(0, true); } else { rings = []; start(); }
  });
  start();
}
