// Interactive TDOA explainer. Purely a simulation: ideal arrival times, no noise.
const V = 675;               // m/s (calibrated value from the project)
const CM_PER_S = V * 100;    // cm/s
const SLOW = 4000;           // animation slow-down factor
const L = 30;                // plate side, cm
const SENSORS = [
  { name: 'S1', x: 0, y: 0 },
  { name: 'S2', x: 30, y: 0 },
  { name: 'S3', x: 30, y: 30 },
  { name: 'S4', x: 0, y: 30 },
];
const ACC = '63,216,230';
const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

export function initDemo(reduced) {
  const canvas = document.getElementById('demoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rows = [...document.querySelectorAll('#demoRows tr')];
  const posEl = document.getElementById('demoPos');
  const msgEl = document.getElementById('demoMsg');

  let S = 0, pad = 0, sc = 1, dpr = 1;
  let src = null;          // {x,y}
  let cursor = { x: 15, y: 15 };
  let sim = null;          // running simulation
  let raf = 0;

  const toPx = (x, y) => [pad + x * sc, pad + (L - y) * sc];

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    S = canvas.clientWidth;
    canvas.width = Math.round(S * dpr);
    canvas.height = Math.round(S * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pad = S * 0.12;
    sc = (S - 2 * pad) / L;
    render(performance.now());
  }

  /* ---- maths ---- */
  function solve(dts) {
    // dts: arrival time offsets (us) relative to first sensor; recover position by grid search
    const dd = dts.map((t) => (t * CM_PER_S) / 1e6);
    const first = dts.indexOf(0);
    const cost = (x, y) => {
      const d0 = dist(x, y, SENSORS[first].x, SENSORS[first].y);
      let c = 0;
      SENSORS.forEach((s, i) => {
        if (i === first) return;
        const e = dist(x, y, s.x, s.y) - d0 - dd[i];
        c += e * e;
      });
      return c;
    };
    let best = { x: 0, y: 0, c: Infinity };
    for (let x = 0; x <= L; x += 0.1) for (let y = 0; y <= L; y += 0.1) {
      const c = cost(x, y);
      if (c < best.c) best = { x, y, c };
    }
    const b0 = best;
    for (let x = b0.x - 0.1; x <= b0.x + 0.1; x += 0.01) for (let y = b0.y - 0.1; y <= b0.y + 0.1; y += 0.01) {
      const c = cost(x, y);
      if (c < best.c) best = { x, y, c };
    }
    return best;
  }

  // Marching squares for f(p) = |p-Si| - |p-S0| - dd_i = 0 over the plate
  function contour(i0, i, ddi) {
    const N = 90, h = L / N, segs = [];
    const f = (x, y) => dist(x, y, SENSORS[i].x, SENSORS[i].y) - dist(x, y, SENSORS[i0].x, SENSORS[i0].y) - ddi;
    const g = [];
    for (let a = 0; a <= N; a++) { g[a] = []; for (let b = 0; b <= N; b++) g[a][b] = f(a * h, b * h); }
    const lerp = (p, q, vp, vq) => p + ((q - p) * vp) / (vp - vq);
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
      const v = [g[a][b], g[a + 1][b], g[a + 1][b + 1], g[a][b + 1]];
      const x0 = a * h, y0 = b * h;
      const pts = [];
      if ((v[0] > 0) !== (v[1] > 0)) pts.push([lerp(x0, x0 + h, v[0], v[1]), y0]);
      if ((v[1] > 0) !== (v[2] > 0)) pts.push([x0 + h, lerp(y0, y0 + h, v[1], v[2])]);
      if ((v[3] > 0) !== (v[2] > 0)) pts.push([lerp(x0, x0 + h, v[3], v[2]), y0 + h]);
      if ((v[0] > 0) !== (v[3] > 0)) pts.push([x0, lerp(y0, y0 + h, v[0], v[3])]);
      for (let k = 0; k + 1 < pts.length; k += 2) segs.push([pts[k], pts[k + 1]]);
    }
    return segs;
  }

  /* ---- simulation ---- */
  function fire(x, y, instant) {
    src = { x, y };
    const d = SENSORS.map((s) => dist(x, y, s.x, s.y));
    const dmin = Math.min(...d);
    const first = d.indexOf(dmin);
    const dts = d.map((v) => ((v - dmin) * 1e6) / CM_PER_S);
    const order = d.map((v, i) => i).sort((a, b) => d[a] - d[b]);
    const rank = []; order.forEach((idx, r) => { rank[idx] = r + 1; });
    const est = solve(dts);
    const curves = SENSORS.map((_, i) => (i === first ? [] : contour(first, i, d[i] - dmin)));
    sim = {
      t0: performance.now(), d, dts, rank, first, est, curves,
      hit: [false, false, false, false], hitAt: [0, 0, 0, 0], doneAt: 0, dmax: Math.max(...d),
    };
    resetTable();
    posEl.textContent = 'กำลังจำลอง…';
    msgEl.textContent = 'คลื่นกำลังแผ่ออกจากจุดที่เลือก (ภาพช้าลงราว 4,000 เท่า)';
    if (instant || reduced.matches) {
      sim.hit = [true, true, true, true];
      sim.t0 = performance.now() - 1e6;
      sim.doneAt = sim.t0;
      SENSORS.forEach((_, i) => { sim.hitAt[i] = sim.t0; fillRow(i); });
      finish();
      render(performance.now());
      return;
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function resetTable() {
    rows.forEach((r, i) => {
      r.classList.remove('first');
      const c = r.querySelectorAll('td');
      c.forEach((td) => { td.textContent = '–'; });
    });
  }
  function fillRow(i) {
    const c = rows[i].querySelectorAll('td');
    c[0].textContent = sim.rank[i];
    c[1].textContent = sim.d[i].toFixed(1);
    c[2].textContent = sim.dts[i].toFixed(1);
    if (i === sim.first) rows[i].classList.add('first');
  }
  function finish() {
    const e = sim.est;
    const z = (v) => (Math.abs(v) < 0.05 ? 0 : v).toFixed(1);
    posEl.textContent = `(${z(e.x)}, ${z(e.y)}) ซม.`;
    msgEl.textContent = `คำนวณย้อนกลับจาก Δt ทั้งสามคู่ ได้ตรงกับจุดที่วาง (${z(src.x)}, ${z(src.y)}) เพราะในการจำลองไม่มีสัญญาณรบกวนหรือความหน่วงของเซนเซอร์`;
  }

  function loop(now) {
    if (!sim) return;
    const el = now - sim.t0;
    const r = radius(el);
    let all = true;
    SENSORS.forEach((_, i) => {
      if (!sim.hit[i] && r >= sim.d[i]) {
        sim.hit[i] = true; sim.hitAt[i] = now; fillRow(i);
      }
      if (!sim.hit[i]) all = false;
    });
    if (all && !sim.doneAt) { sim.doneAt = now; finish(); }
    render(now);
    const settled = sim.doneAt && now - sim.doneAt > 1400 && r > sim.dmax + 4;
    if (!settled) raf = requestAnimationFrame(loop); else raf = 0;
  }
  const radius = (elMs) => (Math.max(0, elMs) / 1000 / SLOW) * CM_PER_S;

  /* ---- drawing ---- */
  function render(now) {
    if (!S) return;
    ctx.clearRect(0, 0, S, S);
    // plate
    ctx.save();
    const [px0, py0] = toPx(0, L);
    ctx.beginPath(); ctx.rect(px0, py0, L * sc, L * sc); ctx.clip();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(190,220,230,0.09)';
    ctx.beginPath();
    for (let k = 5; k < L; k += 5) {
      const [gx] = toPx(k, 0); const [, gy] = toPx(0, k);
      ctx.moveTo(gx, py0); ctx.lineTo(gx, py0 + L * sc);
      ctx.moveTo(px0, gy); ctx.lineTo(px0 + L * sc, gy);
    }
    ctx.stroke();

    // hyperbolas
    if (sim && sim.doneAt) {
      const a = reduced.matches ? 1 : Math.min(1, Math.max(0, (now - sim.doneAt) / 700));
      ctx.strokeStyle = `rgba(${ACC},${0.75 * a})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      sim.curves.forEach((segs) => segs.forEach(([p, q]) => {
        const [x1, y1] = toPx(p[0], p[1]); const [x2, y2] = toPx(q[0], q[1]);
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      }));
      ctx.stroke();
    }

    // wave rings
    if (sim && !reduced.matches) {
      const r = radius(now - sim.t0);
      if (r < sim.dmax + 6) {
        const [cx, cy] = toPx(src.x, src.y);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = `rgba(${ACC},0.85)`;
        ctx.beginPath(); ctx.arc(cx, cy, r * sc, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = `rgba(${ACC},0.25)`;
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, r * sc - 8), 0, 6.2832); ctx.stroke();
      }
    }
    ctx.restore();

    // frame
    ctx.strokeStyle = 'rgba(190,220,230,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px0 + 0.5, py0 + 0.5, L * sc, L * sc);

    // source marker
    if (sim && src) {
      const [cx, cy] = toPx(src.x, src.y);
      ctx.fillStyle = '#e9eef1';
      ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 6.2832); ctx.fill();
      if (sim.doneAt) {
        const [ex, ey] = toPx(sim.est.x, sim.est.y);
        ctx.strokeStyle = '#e9eef1'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ex, ey, 9, 0, 6.2832); ctx.stroke();
      }
    }

    // keyboard cursor
    if (document.activeElement === canvas) {
      const [kx, ky] = toPx(cursor.x, cursor.y);
      ctx.strokeStyle = 'rgba(233,238,241,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(kx - 10, ky); ctx.lineTo(kx + 10, ky); ctx.moveTo(kx, ky - 10); ctx.lineTo(kx, ky + 10);
      ctx.stroke();
    }

    // sensors
    const rects = [];
    const fs = Math.max(10, S * 0.021);
    ctx.font = `${fs}px "Geist Mono", "IBM Plex Sans Thai", monospace`;
    SENSORS.forEach((s, i) => {
      const [sx, sy] = toPx(s.x, s.y);
      const hit = sim && sim.hit[i];
      const age = hit && !reduced.matches ? Math.min(1, Math.max(0, (now - sim.hitAt[i]) / 700)) : 1;
      const isFirst = sim && sim.first === i && hit;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = hit ? `rgb(${ACC})` : 'rgba(214,176,106,0.9)';
      const half = Math.max(6, S * 0.014);
      ctx.strokeRect(sx - half, sy - half, half * 2, half * 2);
      if (hit) {
        ctx.fillStyle = isFirst ? '#e9eef1' : `rgb(${ACC})`;
        ctx.fillRect(sx - half + 3, sy - half + 3, half * 2 - 6, half * 2 - 6);
        if (age < 1) {
          ctx.strokeStyle = `rgba(${ACC},${1 - age})`;
          ctx.beginPath(); ctx.arc(sx, sy, half + age * 26, 0, 6.2832); ctx.stroke();
        }
      }
      // name outside corner
      const right = s.x > 0, top = s.y > 0;
      ctx.fillStyle = hit ? '#e9eef1' : '#9aa7ae';
      ctx.textAlign = right ? 'left' : 'right';
      ctx.textBaseline = top ? 'bottom' : 'top';
      const ox = right ? half + 6 : -half - 6, oy = top ? -half - 2 : half + 2;
      ctx.fillText(s.name, sx + ox, sy + oy);
      if (hit) {
        ctx.fillStyle = `rgb(${ACC})`;
        const txt = `#${sim.rank[i]}  ${sim.dts[i].toFixed(0)} µs`;
        ctx.textAlign = right ? 'right' : 'left';
        ctx.textBaseline = top ? 'top' : 'bottom';
        const tx = sx + (right ? -half - 4 : half + 4), ty = sy + (top ? half + 4 : -half - 4);
        const tw = ctx.measureText(txt).width;
        ctx.fillText(txt, tx, ty);
        rects.push({ x: right ? tx - tw : tx, y: top ? ty : ty - fs, w: tw, h: fs });
      }
    });


    // estimated-position label, placed where it does not collide with sensor labels
    if (sim && sim.doneAt) {
      const [ex, ey] = toPx(sim.est.x, sim.est.y);
      const text = 'ตำแหน่งที่คำนวณ';
      const lf = Math.max(10, S * 0.02);
      ctx.font = `${lf}px "Geist Mono", "IBM Plex Sans Thai", monospace`;
      ctx.fillStyle = '#e9eef1'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const lw = ctx.measureText(text).width;
      const cands = [[12, -lf - 10], [12, 10], [-lw - 12, -lf - 10], [-lw - 12, 10]];
      const hitR = (r, x, y) => x < r.x + r.w + 4 && x + lw + 4 > r.x && y < r.y + r.h + 4 && y + lf + 4 > r.y;
      let pick = cands[0];
      for (const c of cands) {
        const x = Math.max(4, Math.min(ex + c[0], S - lw - 4)), y = ey + c[1];
        if (y > 2 && y + lf < S - 2 && !rects.some((r) => hitR(r, x, y))) { pick = c; break; }
      }
      ctx.fillText(text, Math.max(4, Math.min(ex + pick[0], S - lw - 4)), ey + pick[1]);
    }

    // axis hints
    ctx.fillStyle = '#7d8b93';
    ctx.font = `${Math.max(9, S * 0.018)}px "Geist Mono", "IBM Plex Sans Thai", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('30 ซม.', pad + (L * sc) / 2, S - pad * 0.62);
    ctx.save(); ctx.translate(pad * 0.4, pad + (L * sc) / 2); ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle'; ctx.fillText('30 ซม.', 0, 0); ctx.restore();

    // idle prompt
    if (!sim) {
      ctx.fillStyle = '#9aa7ae';
      ctx.font = `${Math.max(12, S * 0.026)}px "IBM Plex Sans Thai", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('คลิกหรือแตะบนแผ่นเพื่อวางแหล่งกำเนิดคลื่น', S / 2, S / 2);
    }
  }

  /* ---- input ---- */
  const fromEvent = (e) => {
    const r = canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * S;
    const py = ((e.clientY - r.top) / r.height) * S;
    return {
      x: Math.min(L, Math.max(0, (px - pad) / sc)),
      y: Math.min(L, Math.max(0, L - (py - pad) / sc)),
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = fromEvent(e);
    cursor = { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
    fire(cursor.x, cursor.y);
  });
  canvas.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 5 : 1;
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (mv) {
      e.preventDefault();
      cursor = { x: Math.min(L, Math.max(0, cursor.x + mv[0])), y: Math.min(L, Math.max(0, cursor.y + mv[1])) };
      msgEl.textContent = `เป้าอยู่ที่ (${cursor.x}, ${cursor.y}) ซม. กด Enter เพื่อปล่อยคลื่น`;
      if (!raf) render(performance.now());
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fire(cursor.x, cursor.y);
    }
  });
  canvas.addEventListener('focus', () => { if (!raf) render(performance.now()); });
  canvas.addEventListener('blur', () => { if (!raf) render(performance.now()); });

  document.getElementById('demoRandom').addEventListener('click', () => {
    const x = Math.round((2 + Math.random() * 26) * 10) / 10;
    const y = Math.round((2 + Math.random() * 26) * 10) / 10;
    cursor = { x, y };
    fire(x, y);
  });
  document.getElementById('demoReset').addEventListener('click', () => {
    cancelAnimationFrame(raf); raf = 0;
    sim = null; src = null;
    resetTable();
    posEl.textContent = 'ยังไม่ได้วางจุด';
    msgEl.textContent = 'เลือกจุดบนแผ่นเพื่อเริ่มจำลอง';
    render(performance.now());
  });

  new ResizeObserver(resize).observe(canvas);
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render(performance.now()));
}
