import { initMotion } from './motion.js';
import { initUI } from './ui.js';
import { initDemo } from './demo.js';
import { initHow } from './how.js';
import { initScope } from './scope.js';
import { initEnergy } from './energy.js';
import { initInteractions } from './interact.js';
import { initCursor, initMagnetic, initTilt, countUp } from './fx.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;

/* boot overlay: click / key skips it */
const boot = document.getElementById('boot');
const ready = () => root.classList.add('is-ready');
if (boot && !root.classList.contains('no-boot')) {
  const skip = () => { boot.classList.add('is-skip'); ready(); removeEventListener('keydown', skip); removeEventListener('pointerdown', skip); };
  addEventListener('keydown', skip, { once: true });
  addEventListener('pointerdown', skip, { once: true });
  boot.addEventListener('animationend', (e) => { if (e.animationName === 'bootOut') boot.remove(); });
}

const motion = initMotion(reduced);
initUI(reduced, motion);
initDemo(reduced);
initHow(reduced);
initScope(reduced);
initEnergy();
initInteractions(reduced);
initCursor(reduced);
initMagnetic(reduced);
initTilt(reduced);

/* hero stats count up once the title has revealed */
const nums = [...document.querySelectorAll('.stats .num[data-to]')];
if (!reduced.matches) {
  const go = () => nums.forEach((n, i) => setTimeout(() => countUp(n), 700 + i * 90));
  if (root.classList.contains('is-ready')) go();
  else new MutationObserver((_, o) => { if (root.classList.contains('is-ready')) { o.disconnect(); go(); } }).observe(root, { attributes: true, attributeFilter: ['class'] });
}

/* hero 3D: load three.js after first paint; fall back to the 2D canvas */
const stage = document.getElementById('heroStage');
const start2D = () => import('./hero.js').then((m) => m.initHero(document.getElementById('heroCanvas'), reduced));
const start3D = () => import('./hero3d.js')
  .then((m) => m.initHero3D(stage, reduced))
  .then((ok) => { if (!ok) start2D(); })
  .catch(() => start2D());
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
if (stage) idle(start3D, { timeout: 1200 });
