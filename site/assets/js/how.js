// "How it works" sticky visual: one canvas that morphs through 6 explanatory states
// as the reader scrolls the steps (AE, TDOA, first-break, over-determined, LOO, source).
// Illustrative drawings, not measured data. Runs only while the section is on screen.
import { shuffle, cloneCard, centerSticky } from './deck.js';
const ACC = '63,216,230';
const BRASS = '214,176,106';
const INK = '236,242,245';
const L = 30;
const SENS = [[0, 0], [30, 0], [30, 30], [0, 30]];
const SRC = [19, 11.5];
const NAMES = ['Acoustic Emission', 'TDOA', 'First-break 3%', 'Least squares', 'Leave-One-Out', 'mgh source'];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function contour(i, j, c) {
  // points p with |p-Si| - |p-Sj| = c  (marching squares)
  const N = 70, h = L / N, g = [], segs = [];
  const f = (x, y) => Math.hypot(x - SENS[i][0], y - SENS[i][1]) - Math.hypot(x - SENS[j][0], y - SENS[j][1]) - c;
  for (let a = 0; a <= N; a++) { g[a] = []; for (let b = 0; b <= N; b++) g[a][b] = f(a * h, b * h); }
  const lp = (p, q, vp, vq) => p + ((q - p) * vp) / (vp - vq);
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    const v = [g[a][b], g[a + 1][b], g[a + 1][b + 1], g[a][b + 1]], x0 = a * h, y0 = b * h, pts = [];
    if ((v[0] > 0) !== (v[1] > 0)) pts.push([lp(x0, x0 + h, v[0], v[1]), y0]);
    if ((v[1] > 0) !== (v[2] > 0)) pts.push([x0 + h, lp(y0, y0 + h, v[1], v[2])]);
    if ((v[3] > 0) !== (v[2] > 0)) pts.push([lp(x0, x0 + h, v[3], v[2]), y0 + h]);
    if ((v[0] > 0) !== (v[3] > 0)) pts.push([x0, lp(y0, y0 + h, v[0], v[3])]);
    for (let k = 0; k + 1 < pts.length; k += 2) segs.push([pts[k], pts[k + 1]]);
  }
  return segs;
}

export function initHow(reduced) {
  const canvas = document.getElementById('howCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const steps = [...document.querySelectorAll('.how-step')];
  const dots = [...document.querySelectorAll('.how-dots li')];
  const noEl = document.getElementById('howNo'), nameEl = document.getElementById('howName');
  let W = 0, H = 0, S = 0, ox = 0, oy = 0, sc = 1;
  let cur = 0, prev = -1, tSwitch = 0, raf = 0, visible = false;

  // precomputed geometry
  const d = SENS.map((s) => dist(s, SRC));
  const first = d.indexOf(Math.min(...d));
  const hyp12 = contour(1, 0, d[1] - d[0]);
  const hypAll = SENS.map((_, i) => (i === first ? null : [
    contour(i, first, d[i] - d[first] + (i === 0 ? 0.5 : i === 2 ? -0.45 : 0.35)),
  ][0]));
  const loo = [[-2.2, 1.6], [1.9, 1.2], [1.5, -1.9], [-1.4, -1.5]];

  const P = (x, y) => [ox + x * sc, oy + (L - y) * sc];
  function resize() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = W < 560 ? Math.min(W * 0.7, H * 0.72) : Math.min(W * 0.62, H * 0.7);
    sc = S / L; ox = (W - S) / 2; oy = (H - S) / 2 + H * 0.01;
    draw(performance.now());
  }

  const font = (px, mono) => `${Math.round(px)}px ${mono ? '"Geist Mono", ' : ''}"IBM Plex Sans Thai", sans-serif`;
  function label(txt, x, y, col = `rgba(${INK},.9)`, size = 12, align = 'left', mono = false) {
    ctx.font = font(Math.max(10, size * (W / 620)), mono);
    ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y);
  }

  function plate(a, hl = []) {
    ctx.globalAlpha = a;
    const [x0, y0] = P(0, L);
    ctx.strokeStyle = 'rgba(170,215,230,.07)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 5; k < L; k += 5) { const [gx] = P(k, 0), [, gy] = P(0, k); ctx.moveTo(gx, y0); ctx.lineTo(gx, y0 + S); ctx.moveTo(x0, gy); ctx.lineTo(x0 + S, gy); }
    ctx.stroke();
    ctx.setLineDash([6, 5]); ctx.strokeStyle = `rgba(${ACC},.35)`; ctx.strokeRect(x0, y0, S, S); ctx.setLineDash([]);
    SENS.forEach((s, i) => {
      const [sx, sy] = P(s[0], s[1]); const on = hl.includes(i);
      ctx.fillStyle = on ? `rgba(${BRASS},1)` : `rgba(${BRASS},.35)`;
      ctx.beginPath(); ctx.arc(sx, sy, Math.max(5, S * 0.022), 0, 7); ctx.fill();
      if (on) { ctx.strokeStyle = `rgba(${BRASS},.5)`; ctx.beginPath(); ctx.arc(sx, sy, Math.max(9, S * 0.04), 0, 7); ctx.stroke(); }
    });
    ctx.globalAlpha = 1;
  }
  function rings(a, t, period, maxR, src = SRC) {
    const [cx, cy] = P(src[0], src[1]);
    for (let k = 0; k < 3; k++) {
      const ph = ((t / period) + k / 3) % 1;
      const r = ph * maxR * sc;
      ctx.strokeStyle = `rgba(${ACC},${a * (1 - ph) * 0.9})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    }
  }
  function segsDraw(segs, R, col, lw = 1.6) {
    const [cx, cy] = P(SRC[0], SRC[1]);
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    segs.forEach(([p, q]) => {
      const [x1, y1] = P(p[0], p[1]), [x2, y2] = P(q[0], q[1]);
      if (Math.hypot((x1 + x2) / 2 - cx, (y1 + y2) / 2 - cy) > R) return;
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    });
    ctx.stroke();
  }
  function srcDot(a, r = 4) {
    const [cx, cy] = P(SRC[0], SRC[1]);
    ctx.fillStyle = `rgba(${INK},${a})`; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  }
  const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

  const STATES = [
    // 0 AE: crack emits waves
    (t, a) => {
      plate(a);
      rings(a, t, 2.4, 22);
      const [cx, cy] = P(SRC[0], SRC[1]);
      ctx.globalAlpha = a; ctx.strokeStyle = `rgba(${INK},.95)`; ctx.lineWidth = 2; ctx.beginPath();
      const c = [[-3.2, 1.4], [-2, .6], [-1.1, 1.1], [0, 0], [1, .5], [1.8, -.4], [3, -.1]];
      c.forEach(([x, y], i) => { const px = cx + x * sc * .9, py = cy + y * sc * .9; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      ctx.stroke(); ctx.globalAlpha = 1;
      label('รอยร้าวปล่อยคลื่นออกมาเอง', cx + 3.6 * sc, cy - 1.2 * sc, `rgba(${INK},${a})`, 13);
    },
    // 1 TDOA: one pair, one hyperbola
    (t, a) => {
      plate(a, [0, 1]);
      const tt = reduced.matches ? 9 : t % 6;
      const R = tt * 9;
      const [cx, cy] = P(SRC[0], SRC[1]);
      if (R < 32) { ctx.strokeStyle = `rgba(${ACC},${a * 0.8})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R * sc, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = a;
      segsDraw(hyp12, ease((tt - 1.6) / 2.2) * S * 1.4, `rgba(${ACC},.95)`, 2);
      srcDot(a);
      [0, 1].forEach((i) => {
        const [sx, sy] = P(SENS[i][0], SENS[i][1]);
        const hit = R >= d[i];
        if (hit) label(i === 0 ? 't₁' : 't₂', sx + (i ? -14 : 14), sy - 16, `rgba(${ACC},1)`, 13, i ? 'right' : 'left', true);
      });
      const [lx, ly] = P(15, -3.6);
      label('Δt = t₂ − t₁  ∝  Δd  →  เส้นไฮเพอร์โบลา', lx, ly, `rgba(${INK},${a * ease((tt - 2) / 1)})`, 12.5, 'center');
      ctx.globalAlpha = 1;
    },
    // 2 first-break at 3% of each channel's own peak
    (t, a) => {
      const tt = reduced.matches ? 9 : t % 5.5;
      const sweep = ease(tt / 2.6);
      const x0 = W * 0.08, x1 = W * 0.92, mid1 = H * 0.36, mid2 = H * 0.74, A1 = H * 0.2, A2 = H * 0.09;
      const onset = 0.3, fb = x0 + (x1 - x0) * onset;
      const wave = (u, A, seed) => {
        if (u < onset) return Math.sin(u * 190 + seed) * A * 0.012 + Math.sin(u * 77 + seed * 2) * A * 0.008;
        const k = u - onset; return A * Math.sin(k * 46) * (1 - Math.exp(-k * 26)) * Math.exp(-k * 5.2);
      };
      ctx.globalAlpha = a;
      [[mid1, A1, 1, 'ช่องแรง'], [mid2, A2, 3, 'ช่องเบา']].forEach(([m, A, seed, name]) => {
        ctx.strokeStyle = 'rgba(170,215,230,.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, m); ctx.lineTo(x1, m); ctx.stroke();
        // ±3% threshold of this channel's own peak
        const th = A * 0.03 * 0.85 * 6; // drawn 6x taller so it is visible at this scale
        ctx.setLineDash([4, 4]); ctx.strokeStyle = `rgba(${BRASS},.8)`; ctx.beginPath();
        ctx.moveTo(x0, m - th); ctx.lineTo(x1, m - th); ctx.moveTo(x0, m + th); ctx.lineTo(x1, m + th); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = `rgba(${ACC},1)`; ctx.lineWidth = 1.6; ctx.beginPath();
        const end = x0 + (x1 - x0) * sweep;
        for (let x = x0; x <= end; x += 1.5) { const u = (x - x0) / (x1 - x0); const y = m - wave(u, A, seed); if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
        label(name, x0, m - A - 12, 'rgba(160,174,182,1)', 11.5);
        if (end > fb + 4) {
          ctx.fillStyle = `rgba(${INK},1)`; ctx.beginPath(); ctx.arc(fb + 3, m, 4, 0, 7); ctx.fill();
        }
      });
      if (sweep > onset + 0.02) {
        ctx.strokeStyle = `rgba(${INK},.8)`; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(fb + 3, H * 0.1); ctx.lineTo(fb + 3, H * 0.9); ctx.stroke(); ctx.setLineDash([]);
        label('จุดเริ่มคลื่น (3% ของยอดช่องนั้น)', fb + 12, H * 0.1, `rgba(${INK},1)`, 12);
      }
      const pk = x0 + (x1 - x0) * (onset + 0.052);
      if (sweep > onset + 0.08) {
        ctx.strokeStyle = 'rgba(255,93,93,.7)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(pk, H * 0.14); ctx.lineTo(pk, mid1 - A1 * 0.7); ctx.stroke(); ctx.setLineDash([]);
        label('ยอดคลื่นมาช้ากว่า', pk + 8, H * 0.18, 'rgba(255,140,140,1)', 11.5);
      }
      label('เส้นประสีทอง = เกณฑ์ ±3% (ขยายให้มองเห็น)', W * 0.5, H * 0.95, 'rgba(160,174,182,1)', 11, 'center');
      ctx.globalAlpha = 1;
    },
    // 3 over-determined: 3 hyperbolas -> least-squares point
    (t, a) => {
      plate(a, [0, 1, 2, 3]);
      const tt = reduced.matches ? 9 : t % 6.5;
      ctx.globalAlpha = a;
      hypAll.forEach((segs, i) => { if (segs) segsDraw(segs, ease((tt - i * 0.45) / 1.6) * S * 1.5, `rgba(${ACC},${0.55 + 0.15 * i})`, 1.6); });
      if (tt > 2.4) {
        const k = ease((tt - 2.4) / 0.8); const [cx, cy] = P(SRC[0], SRC[1]);
        ctx.strokeStyle = `rgba(${INK},${k})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 10 + (1 - k) * 30, 0, 7); ctx.stroke();
        srcDot(k, 3.5);
        label('คำตอบกำลังสองน้อยสุด', cx + 16, cy + 22, `rgba(${INK},${k})`, 12.5);
      }
      const [lx, ly] = P(15, -3.6);
      label('3 สมการ · 2 ตัวแปร', lx, ly, `rgba(${ACC},1)`, 13, 'center', true);
      ctx.globalAlpha = 1;
    },
    // 4 leave-one-out: 4 solutions cluster
    (t, a) => {
      plate(a, [0, 1, 2, 3]);
      const tt = reduced.matches ? 9 : t % 5.5;
      const k = ease((tt - 0.4) / 1.8);
      const [cx, cy] = P(SRC[0], SRC[1]);
      ctx.globalAlpha = a;
      loo.forEach(([dx, dy], i) => {
        const far = [[-9, 8], [8, 9], [9, -8], [-8, -9]][i];
        const x = SRC[0] + far[0] * (1 - k) + dx * 0.45 * k, y = SRC[1] + far[1] * (1 - k) + dy * 0.45 * k;
        const [px, py] = P(x, y);
        ctx.strokeStyle = `rgba(${ACC},1)`; ctx.lineWidth = 1.8; const s = 6;
        ctx.beginPath(); ctx.moveTo(px - s, py - s); ctx.lineTo(px + s, py + s); ctx.moveTo(px + s, py - s); ctx.lineTo(px - s, py + s); ctx.stroke();
        if (k < 0.7) label(`ไม่ใช้ S${i + 1}`, px + 9, py - 11, `rgba(${INK},${(1 - k / 0.7) * 0.9})`, 10.5);
      });
      if (k > 0.95) {
        const r = 2.3 * sc;
        ctx.strokeStyle = 'rgba(61,218,132,.9)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        label('เกาะกลุ่ม = เชื่อถือได้', cx, cy + r + 18, 'rgba(61,218,132,1)', 12.5, 'center');
      }
      const [lx, ly] = P(15, -3.6);
      label('ตัดเซนเซอร์ออกทีละตัว คำนวณใหม่ 4 รอบ', lx, ly, `rgba(${INK},.85)`, 12, 'center');
      ctx.globalAlpha = 1;
    },
    // 5 source: nut dropped through a guide tube, E = mgh (side view)
    (t, a) => {
      const tt = reduced.matches ? 0.95 : t % 2.6;
      const px0 = W * 0.14, px1 = W * 0.86, py = H * 0.7, th = Math.max(6, H * 0.025);
      const cx = W * 0.56, tubeTop = H * 0.16, tubeBot = py - 2, tw = Math.max(16, W * 0.035);
      ctx.globalAlpha = a;
      // foam feet + plate
      ctx.fillStyle = 'rgba(60,70,78,1)';
      [px0 + 8, px1 - 38].forEach((x) => ctx.fillRect(x, py + th, 30, H * 0.05));
      const g = ctx.createLinearGradient(0, py, 0, py + th); g.addColorStop(0, `rgba(${ACC},.55)`); g.addColorStop(1, `rgba(${ACC},.15)`);
      ctx.fillStyle = g;
      // plate with bending wave after impact
      const fall = 0.9, k = tt / fall;
      const aft = tt - fall;
      ctx.beginPath();
      for (let x = px0; x <= px1; x += 3) {
        const dd = Math.abs(x - cx);
        const w = aft > 0 ? Math.sin((dd - aft * W * 0.35) / 11) * Math.exp(-aft * 2) * 5 * (dd < aft * W * 0.35 ? 1 : 0) : 0;
        if (x === px0) ctx.moveTo(x, py + w); else ctx.lineTo(x, py + w);
      }
      for (let x = px1; x >= px0; x -= 3) ctx.lineTo(x, py + th);
      ctx.closePath(); ctx.fill();
      // tube
      ctx.strokeStyle = 'rgba(220,235,240,.5)'; ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - tw / 2, tubeTop, tw, tubeBot - tubeTop);
      // nut
      const ny = k < 1 ? tubeTop + 6 + (tubeBot - tubeTop - 16) * k * k : tubeBot - 10;
      ctx.fillStyle = 'rgba(200,208,212,1)'; ctx.fillRect(cx - tw * 0.32, ny, tw * 0.64, 9);
      if (aft > 0 && aft < 0.5) { ctx.fillStyle = `rgba(${ACC},${(0.5 - aft) * 2})`; ctx.beginPath(); ctx.arc(cx, py, 14 + aft * 40, 0, 7); ctx.fill(); }
      // dimension h
      ctx.strokeStyle = `rgba(${BRASS},.9)`; ctx.lineWidth = 1; const hx = cx + tw / 2 + 22;
      ctx.beginPath(); ctx.moveTo(hx, tubeTop); ctx.lineTo(hx, tubeBot); ctx.moveTo(hx - 5, tubeTop); ctx.lineTo(hx + 5, tubeTop); ctx.moveTo(hx - 5, tubeBot); ctx.lineTo(hx + 5, tubeBot); ctx.stroke();
      label('h', hx + 10, (tubeTop + tubeBot) / 2, `rgba(${BRASS},1)`, 14, 'left', true);
      label('น็อต 5.4 กรัม', cx - tw / 2 - 14, tubeTop + 12, `rgba(${INK},.9)`, 12, 'right');
      label('E = mgh  คงที่ทุกครั้ง', W * 0.5, H * 0.9, `rgba(${ACC},1)`, 14, 'center', true);
      ctx.globalAlpha = 1;
    },
  ];

  function draw(now) {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    const t = (now - tSwitch) / 1000;
    const mix = reduced.matches ? 1 : Math.min(1, t / 0.5);
    if (prev >= 0 && mix < 1) STATES[prev](t + 3, 1 - mix);
    STATES[cur](t, mix);
  }
  function loop(now) { draw(now); raf = requestAnimationFrame(loop); }
  const start = () => { if (!raf && visible && !reduced.matches && !document.hidden) raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  function setStep(i) {
    if (i === cur) return;
    const front = canvas.closest('.how-viz-in'), deck = front && front.parentElement;
    const dir = i > cur ? 1 : -1;
    const ghost = front && cloneCard(front, (g) => {
      const c = g.querySelector('canvas'); c.width = canvas.width; c.height = canvas.height;
      c.getContext('2d').drawImage(canvas, 0, 0);
    });
    prev = -1; cur = i; tSwitch = performance.now();
    if (ghost) shuffle({ deck, front, ghost, dir, flavor: 'flip', reduced: reduced.matches });
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d2, k) => d2.classList.toggle('is-on', k === i));
    noEl.textContent = `${i + 1} / 6`; nameEl.textContent = NAMES[i];
    if (!raf) draw(performance.now());
  }
  steps[0].classList.add('is-active');
  centerSticky(canvas.closest('.how-viz'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => {
      en.forEach((e) => { if (e.isIntersecting) setStep(+e.target.dataset.step); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  new ResizeObserver(resize).observe(canvas);
  if (document.fonts) document.fonts.ready.then(() => draw(performance.now()));
  tSwitch = performance.now() - 5000;
  resize();
}
