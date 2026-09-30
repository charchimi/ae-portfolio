// Micro-interactions: custom cursor, magnetic buttons, number scramble, count-up.
const fine = matchMedia('(hover: hover) and (pointer: fine)');

export function initCursor(reduced) {
  if (!fine.matches) return;
  const root = document.querySelector('.cursor');
  if (!root) return;
  document.documentElement.classList.add('has-cursor');
  const dot = root.querySelector('.cursor-dot'), ring = root.querySelector('.cursor-ring');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0;
  const k = reduced.matches ? 1 : 0.2;
  const tick = () => {
    rx += (x - rx) * k; ry += (y - ry) * k;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(tick) : 0;
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (root.classList.contains('is-hidden')) { rx = e.clientX; ry = e.clientY; ring.style.transform = `translate3d(${rx}px,${ry}px,0)`; }
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate3d(${x}px,${y}px,0)`;
    root.classList.remove('is-hidden');
    if (!raf) raf = requestAnimationFrame(tick);
    const t = e.target;
    root.classList.toggle('is-target', !!t.closest('[data-cursor="target"]'));
    root.classList.toggle('is-link', !t.closest('[data-cursor="target"]') && !!t.closest('a, button, summary, input, .g-item'));
  }, { passive: true });
  document.addEventListener('pointerleave', () => root.classList.add('is-hidden'));
  addEventListener('pointerdown', () => root.classList.add('is-down'));
  addEventListener('pointerup', () => root.classList.remove('is-down'));
  // native cursor inside modal dialog (top layer covers our cursor)
  const dlg = document.getElementById('lightbox');
  if (dlg) {
    new MutationObserver(() => root.classList.toggle('is-hidden', dlg.open)).observe(dlg, { attributes: true, attributeFilter: ['open'] });
  }
}

export function initMagnetic(reduced) {
  if (!fine.matches || reduced.matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const inner = el.querySelector('span');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height;
      el.style.transform = `translate(${dx * 14}px, ${dy * 12}px)`;
      if (inner) inner.style.transform = `translate(${dx * 6}px, ${dy * 5}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .6s cubic-bezier(.2,.7,.1,1), border-color .3s, color .3s';
      el.style.transform = ''; if (inner) { inner.style.transition = 'transform .6s cubic-bezier(.2,.7,.1,1)'; inner.style.transform = ''; }
      setTimeout(() => { el.style.transition = ''; if (inner) inner.style.transition = ''; }, 600);
    });
  });
}

// Hover tilt for gallery items
export function initTilt(reduced) {
  if (!fine.matches || reduced.matches) return;
  document.querySelectorAll('.g-item').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg) translateZ(0)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// Scramble digits of an element's text then settle to the real value (left to right).
export function scramble(el, dur = 1000) {
  const final = el.dataset.final || el.textContent;
  el.dataset.final = final;
  const chars = [...final];
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const settled = Math.floor(p * chars.length * 1.05);
    el.textContent = chars.map((c, i) => (/\d/.test(c) && i >= settled ? String((Math.random() * 10) | 0) : c)).join('');
    if (p < 1) requestAnimationFrame(step); else el.textContent = final;
  };
  requestAnimationFrame(step);
}

export function countUp(el, dur = 1600) {
  const to = +el.dataset.to, d = +(el.dataset.dec || 0);
  const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(step);
  };
  el.textContent = fmt(0);
  requestAnimationFrame(step);
}
