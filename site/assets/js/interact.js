// T8: one interaction per chapter. Vanilla JS + CSS. Every widget renders its full content
// without JS; this file only adds the switching / sequencing on top.
import { shuffle, cloneCard, centerSticky } from './deck.js';
const fine = matchMedia('(hover: hover) and (pointer: fine)');

const inView = (el, cb, threshold = 0.35) => {
  if (!el) return;
  if (!('IntersectionObserver' in window)) { cb(); return; }
  const o = new IntersectionObserver((en) => { if (en[0].isIntersecting) { o.disconnect(); cb(); } }, { threshold });
  o.observe(el);
};

/* Accessible tabs: roving tabindex, arrows / Home / End, hidden panels. */
function makeTabs(list, panels, onSelect, vertical = false) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = (i, focus = false, user = false) => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (panels[k]) panels[k].hidden = !on;
    });
    if (focus) tabs[i].focus();
    if (onSelect) onSelect(i, user);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i, false, true));
    t.addEventListener('keydown', (e) => {
      const next = vertical ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight', 'ArrowDown'];
      const prev = vertical ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft', 'ArrowUp'];
      let k = -1;
      if (next.includes(e.key)) k = (i + 1) % tabs.length;
      else if (prev.includes(e.key)) k = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') k = 0;
      else if (e.key === 'End') k = tabs.length - 1;
      if (k >= 0) { e.preventDefault(); select(k, true, true); }
    });
  });
  return { select, tabs };
}

/* 01 - one plate, three ways of "seeing" the crack */
function initLens(rm) {
  const root = document.querySelector('[data-lens]');
  if (!root) return;
  const list = root.querySelector('[role="tablist"]');
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const modes = ['eye', 'us', 'ae'];
  let touched = false, timers = [];
  const t = makeTabs(list, panels, (i, user) => {
    root.dataset.mode = modes[i];
    if (user) { touched = true; timers.forEach(clearTimeout); }
  });
  root.classList.add('is-on');
  t.select(2);
  if (rm) return;
  // once visible: eye -> ultrasonic -> AE, then stay on AE (the winner)
  inView(root, () => {
    if (touched) return;
    t.select(0);
    timers.push(setTimeout(() => !touched && t.select(1), 3400));
    timers.push(setTimeout(() => !touched && t.select(2), 6800));
  }, 0.5);
}

/* 02 - pinned schematic lights up the part each objective is about; cards fan on step change */
function initObjectives(rm) {
  const root = document.querySelector('[data-obj]');
  if (!root || !('IntersectionObserver' in window)) return;
  const steps = [...root.querySelectorAll('.obj-step')];
  const no = document.getElementById('objNo');
  const front = root.querySelector('.obj-viz-in'), deck = front && front.parentElement;
  centerSticky(root.querySelector('.obj-viz'));
  let cur = 0;
  const go = (i) => {
    if (i === cur) return;
    const dir = i > cur ? 1 : -1;
    const ghost = cloneCard(front);
    const wrap = document.createElement('div');
    wrap.className = 'obj deck-ghost'; wrap.dataset.step = String(cur); wrap.appendChild(ghost);
    cur = i;
    root.dataset.step = String(i);
    shuffle({ deck, front, ghost: wrap, dir, flavor: 'fan', reduced: rm });
  };
  const io = new IntersectionObserver((en) => {
    en.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.step;
      go(i);
      steps.forEach((s) => s.classList.toggle('is-active', s === e.target));
      if (no) no.textContent = `${i + 1} / ${steps.length}`;
    });
  }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
  steps.forEach((s) => io.observe(s));
}

/* 03 - hypothesis selector: visible tabs, prev/next, progress, slow auto-advance until first touch */
function initHyp(rm) {
  const root = document.querySelector('[data-hyp]');
  if (!root) return;
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const stage = root.querySelector('.hyp2-stage');
  const nav = document.createElement('div');
  nav.className = 'hyp2-nav';
  nav.innerHTML = '<button type="button" class="hn-btn hn-prev" aria-label="สมมติฐานก่อนหน้า"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>'
    + '<div class="hn-mid"><span class="hn-count" aria-live="polite"></span><span class="hn-dots" aria-hidden="true">' + panels.map(() => '<i></i>').join('') + '</span></div>'
    + '<button type="button" class="hn-btn hn-next" aria-label="สมมติฐานถัดไป"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>';
  stage.appendChild(nav);
  const count = nav.querySelector('.hn-count'), dots = [...nav.querySelectorAll('.hn-dots i')];
  let cur = 0, timer = 0;
  const stop = () => { clearInterval(timer); root.classList.remove('is-auto'); };
  const t = makeTabs(root.querySelector('[role="tablist"]'), panels, (i, user) => {
    cur = i;
    count.textContent = `H${i + 1} / H${panels.length}`;
    dots.forEach((d, k) => d.classList.toggle('on', k <= i));
    if (user) stop();
  }, true);
  nav.querySelector('.hn-prev').addEventListener('click', () => t.select((cur - 1 + panels.length) % panels.length, false, true));
  nav.querySelector('.hn-next').addEventListener('click', () => t.select((cur + 1) % panels.length, false, true));
  t.select(0);
  root.classList.add('is-on');
  if (rm) return;
  inView(root, () => {
    root.classList.add('is-auto');
    timer = setInterval(() => { if (!document.hidden) t.select((cur + 1) % panels.length); }, 6500);
  }, 0.5);
}

/* 05 - signal flow: pulse loops sensor -> board -> PC -> web; hover / tap a node to read it */
function initSignal(rm) {
  const root = document.querySelector('[data-sig]');
  if (!root) return;
  const nodes = [...root.querySelectorAll('.sig-node')];
  const details = [...root.querySelectorAll('.sd')];
  const track = root.querySelector('.sig-track');
  let cur = 0, timer = 0, resume = 0, visible = false;
  const show = (i) => {
    cur = i;
    nodes.forEach((n, k) => { n.classList.toggle('is-on', k === i); n.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    details.forEach((d, k) => d.classList.toggle('is-on', k === i));
    track.style.setProperty('--p', String(i / (nodes.length - 1)));
  };
  const loop = () => { clearInterval(timer); if (rm || !visible) return; timer = setInterval(() => show((cur + 1) % nodes.length), 2600); };
  const user = (i) => { clearInterval(timer); clearTimeout(resume); show(i); resume = setTimeout(loop, 8000); };
  nodes.forEach((n, i) => {
    n.addEventListener('click', () => user(i));
    n.addEventListener('focus', () => user(i));
    if (fine.matches) n.addEventListener('pointerenter', () => user(i));
  });
  root.classList.add('is-on');
  show(0);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; visible ? loop() : clearInterval(timer); }, { threshold: 0.3 }).observe(root);
  }
}

/* 05 - equipment kit: segmented control, photo + count follow the tab */
function initEquip() {
  const root = document.querySelector('[data-eqp]');
  if (!root) return;
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const imgs = [...root.querySelectorAll('.kit-fig img')];
  const n = document.getElementById('kitN');
  makeTabs(root.querySelector('[role="tablist"]'), panels, (i) => {
    imgs.forEach((m, k) => m.classList.toggle('is-on', k === i));
    if (n) n.textContent = String(panels[i].querySelectorAll('li').length);
  }).select(0);
  root.classList.add('is-on');
}

/* 05 - experiments: expanding panels (hover on fine pointers, click / tap / keyboard everywhere) */
function initExperiments() {
  const root = document.querySelector('[data-xp]');
  if (!root) return;
  const items = [...root.querySelectorAll('.xp-i')];
  const open = (i) => items.forEach((it, k) => {
    const on = k === i;
    it.classList.toggle('is-open', on);
    it.querySelector('button').setAttribute('aria-expanded', on ? 'true' : 'false');
  });
  items.forEach((it, i) => {
    it.querySelector('button').addEventListener('click', () => open(i));
    if (fine.matches) it.addEventListener('pointerenter', () => open(i));
  });
  root.classList.add('is-on');
  open(0);
}

/* 07 - timeline line draws with scroll, nodes light as they pass */
function initTimeline(rm) {
  const root = document.querySelector('[data-tl]');
  if (!root) return;
  const items = [...root.querySelectorAll('.story-c')];
  if (rm) { root.style.setProperty('--prog', '1'); items.forEach((i) => i.classList.add('is-lit')); return; }
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = root.getBoundingClientRect(), vh = innerHeight, mark = vh * 0.62;
    root.style.setProperty('--prog', String(Math.max(0, Math.min(1, (mark - r.top) / r.height))));
    items.forEach((it) => { const b = it.getBoundingClientRect(); if (b.top < mark) it.classList.add('is-lit'); else it.classList.remove('is-lit'); });
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  update();
}

/* 08 - status items tick one by one while the counter climbs */
function initTally(rm) {
  const checks = document.querySelector('[data-checks]');
  if (!checks) return;
  const tally = document.querySelector('.tally');
  const n = document.getElementById('tallyN');
  const bars = tally ? [...tally.querySelectorAll('.tally-bar i')] : [];
  const items = [...checks.querySelectorAll('.st')];
  if (rm) return;
  checks.classList.add('is-seq'); tally && tally.classList.add('is-seq');
  if (n) n.textContent = '0';
  inView(checks, () => {
    let ok = 0;
    items.forEach((it, i) => setTimeout(() => {
      it.classList.add('is-ticked');
      bars[i] && bars[i].classList.add('on');
      if (it.querySelector('.st-ico.ok')) { ok += 1; if (n) n.textContent = String(ok); }
    }, 500 + i * 750));
  }, 0.4);
}

/* 08 - other work vs ours, per aspect */
function initVs() {
  const root = document.querySelector('[data-vs]');
  if (!root) return;
  root.classList.add('is-on');
  root.querySelectorAll('.vs-row').forEach((row) => {
    const btns = [...row.querySelectorAll('.vs-sw button')];
    btns.forEach((b) => b.addEventListener('click', () => {
      row.dataset.side = b.dataset.s;
      btns.forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    }));
  });
}

/* 10 - tilt + cursor-following glow (fine pointers only, this section only) */
function initTeam(rm) {
  if (!fine.matches) return;
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--mx', `${x}px`); el.style.setProperty('--my', `${y}px`);
      if (!rm) el.style.transform = `perspective(900px) rotateY(${(x / r.width - 0.5) * 8}deg) rotateX(${-(y / r.height - 0.5) * 8}deg) translateZ(0)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* 06 - accuracy: table rows and plot points highlight each other (hover, focus, tap) */
function initAccuracy() {
  const plot = document.getElementById('plot');
  const rows = [...document.querySelectorAll('.cols-plot tbody tr[data-pt]')];
  if (!plot || !rows.length) return;
  const groups = ['.pl-err circle', '.pl-links path', '.pl-true circle', '.pl-meas circle', '.pl-lab-pt text'];
  const pts = [];
  groups.forEach((g) => plot.querySelectorAll(g).forEach((el, i) => { el.classList.add('pt'); (pts[i] = pts[i] || []).push(el); }));
  const svg = plot.querySelector('svg');
  const ns = 'http://www.w3.org/2000/svg';
  const hitG = document.createElementNS(ns, 'g'); hitG.setAttribute('class', 'pl-hits');
  plot.querySelectorAll('.pl-true circle').forEach((c, i) => {
    const h = document.createElementNS(ns, 'circle');
    h.setAttribute('cx', c.getAttribute('cx')); h.setAttribute('cy', c.getAttribute('cy')); h.setAttribute('r', '26'); h.dataset.i = String(i);
    hitG.appendChild(h);
  });
  svg.appendChild(hitG);
  let pinned = null;
  const set = (i) => {
    rows.forEach((r, k) => r.classList.toggle('is-hl', k === i));
    pts.forEach((arr, k) => arr.forEach((el) => { el.classList.toggle('hl', k === i); el.classList.toggle('dim', i !== null && k !== i); }));
  };
  const pin = (k) => { pinned = pinned === k ? null : k; set(pinned === null ? k : pinned); };
  rows.forEach((r, k) => {
    r.addEventListener('pointerenter', () => set(k));
    r.addEventListener('pointerleave', () => set(pinned));
    r.addEventListener('focus', () => set(k));
    r.addEventListener('blur', () => set(pinned));
    r.addEventListener('click', () => pin(k));
    r.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin(k); } });
  });
  hitG.querySelectorAll('circle').forEach((h) => {
    const k = +h.dataset.i;
    h.addEventListener('pointerenter', () => set(k));
    h.addEventListener('pointerleave', () => set(pinned));
    h.addEventListener('click', () => pin(k));
  });
}

/* Shared chapter header: progress fill on the rule = chapter / 10 */
function initChapters() {
  document.querySelectorAll('.chapter[data-chapter]').forEach((sec) => {
    const n = parseInt(sec.dataset.chapter, 10);
    const h = sec.querySelector('.chap');
    if (h && n) h.style.setProperty('--ch', String(n / 10));
  });
}

export function initInteractions(reduced) {
  const rm = reduced.matches;
  initLens(rm);
  initChapters();
  initObjectives(rm);
  initHyp(rm);
  initAccuracy();
  initSignal(rm);
  initEquip();
  initExperiments();
  initTimeline(rm);
  initTally(rm);
  initVs();
  initTeam(rm);
}
