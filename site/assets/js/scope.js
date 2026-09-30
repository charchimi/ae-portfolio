// Simulated 4-channel oscilloscope. Waveforms are generated at the project's real sampling
// rate (38,462 S/s per channel) for a random source on the 30x30 plate with v = 675 m/s.
// The first-break marker is found on the generated samples at 3% of each channel's own peak.
// Illustration only (badge on the page says so).
const FS = 38462;             // samples per second per channel
const V = 675;                // m/s
const WIN = 0.0034;           // s shown
const PRE = 0.0006;           // s before the earliest arrival
const F0 = 1750;              // Hz, near the measured median dominant frequency (1,712 Hz)
const SENS = [[0, 0], [30, 0], [30, 30], [0, 30]];
const ACC = '63,216,230';

export function initScope(reduced) {
  const canvas = document.getElementById('scopeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dtEl = document.getElementById('scopeDt');
  let W = 0, H = 0, raf = 0, visible = false, ev = null, t0 = 0;
  const N = Math.round(WIN * FS);

  function gen() {
    const sx = 4 + Math.random() * 22, sy = 4 + Math.random() * 22;
    const d = SENS.map(([x, y]) => Math.hypot(x - sx, y - sy) / 100);  // m
    const tA = d.map((v) => v / V);                                    // s
    const tMin = Math.min(...tA);
    const ch = tA.map((ta, i) => {
      const amp = 0.9 / Math.sqrt(1 + d[i] * 18);
      const s = new Float32Array(N); let pk = 0;
      for (let n = 0; n < N; n++) {
        const t = n / FS - PRE + tMin; const k = t - ta;
        let v = (Math.random() - 0.5) * 0.012;
        if (k > 0) v += amp * Math.sin(2 * Math.PI * F0 * k) * (1 - Math.exp(-k * 9000)) * Math.exp(-k * 1100);
        s[n] = v; if (Math.abs(v) > pk) pk = Math.abs(v);
      }
      let fb = 0; for (let n = 0; n < N; n++) if (Math.abs(s[n]) >= 0.03 * pk && n / FS > PRE * 0.8) { fb = n; break; }
      return { s, pk, fb, dt: (ta - tMin) * 1e6 };
    });
    const firstN = Math.min(...ch.map((c) => c.fb));
    ch.forEach((c) => { c.dtMeas = ((c.fb - firstN) / FS) * 1e6; });
    return { ch, sx, sy };
  }

  function resize() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }

  function draw(now) {
    if (!W || !ev) return;
    const el = reduced.matches ? 99 : (now - t0) / 1000;
    const sweep = Math.min(1, el / 1.4);
    const fade = el > 3.6 ? Math.max(0, 1 - (el - 3.6) / 0.5) : 1;
    ctx.clearRect(0, 0, W, H);
    const padL = Math.max(44, W * 0.07), padR = 16, rowH = H / 4;
    // graticule
    ctx.strokeStyle = 'rgba(170,215,230,.06)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 0; k <= 10; k++) { const x = padL + (W - padL - padR) * k / 10; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let r = 0; r <= 4; r++) { ctx.moveTo(padL, r * rowH); ctx.lineTo(W - padR, r * rowH); }
    ctx.stroke();
    const X = (n) => padL + (W - padL - padR) * (n / (N - 1));
    const lf = Math.max(10, Math.min(12, W / 70));
    ev.ch.forEach((c, i) => {
      const mid = rowH * i + rowH / 2, A = rowH * 0.42 / Math.max(...ev.ch.map((q) => q.pk));
      ctx.font = `${lf}px "Geist Mono", monospace`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(214,176,106,1)'; ctx.fillText(`S${i + 1}`, 10, mid);
      // 3% threshold of this channel (drawn at true scale)
      const th = c.pk * 0.03 * A;
      ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(214,176,106,.55)'; ctx.beginPath();
      ctx.moveTo(padL, mid - th); ctx.lineTo(W - padR, mid - th); ctx.moveTo(padL, mid + th); ctx.lineTo(W - padR, mid + th); ctx.stroke(); ctx.setLineDash([]);
      // trace (sample by sample)
      const end = Math.floor((N - 1) * sweep);
      ctx.strokeStyle = `rgba(${ACC},${0.95 * fade})`; ctx.lineWidth = 1.3; ctx.shadowColor = `rgba(${ACC},.7)`; ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let n = 0; n <= end; n++) { const x = X(n), y = mid - c.s[n] * A; if (n) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); ctx.shadowBlur = 0;
      if (end >= c.fb) {
        const x = X(c.fb);
        ctx.strokeStyle = `rgba(236,242,245,${0.85 * fade})`; ctx.beginPath(); ctx.moveTo(x, mid - rowH * 0.46); ctx.lineTo(x, mid + rowH * 0.46); ctx.stroke();
        ctx.fillStyle = `rgba(236,242,245,${fade})`; ctx.textAlign = 'left';
        ctx.fillText(c.dtMeas < 1 ? 'ตัวแรก' : `+${Math.round(c.dtMeas)} µs`, x + 6, mid - rowH * 0.34);
      }
    });
    // time axis
    ctx.fillStyle = 'rgba(123,139,148,1)'; ctx.textAlign = 'right'; ctx.font = `${lf - 1}px "Geist Mono", monospace`;
    ctx.fillText(`${(WIN * 1000).toFixed(1)} ms`, W - padR, H - 8);
  }

  function next(now) {
    ev = gen(); t0 = now;
    if (dtEl) dtEl.textContent = `จุดสุ่ม (${ev.sx.toFixed(1)}, ${ev.sy.toFixed(1)}) ซม. · Δt คำนวณจาก v = 675 m/s`;
  }
  function loop(now) {
    if (!ev || now - t0 > 4200) next(now);
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf && visible && !reduced.matches && !document.hidden) raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  next(performance.now());
  new ResizeObserver(resize).observe(canvas);
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  resize();
}
