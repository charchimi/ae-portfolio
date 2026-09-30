// Card-shuffle transition for pinned step visuals (T9). The outgoing card is a snapshot
// (ghost) that leaves the deck, tucks behind it, and fades; the live card, already showing
// the new step, settles to the front. transform/opacity only. Reduced motion: crossfade.
const EASE_OUT = 'cubic-bezier(.2,.8,.2,1)';

export function shuffle({ deck, front, ghost, dir = 1, flavor = 'fan', reduced = false }) {
  if (!deck || !front || !front.animate) return;
  if (reduced) { front.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' }); return; }
  const s = dir >= 0 ? 1 : -1;
  const small = innerWidth < 700;
  Object.assign(ghost.style, { position: 'absolute', left: '0', top: '0', width: front.offsetWidth + 'px', height: front.offsetHeight + 'px', zIndex: '4', margin: '0', pointerEvents: 'none' });
  ghost.setAttribute('aria-hidden', 'true');
  deck.appendChild(ghost);

  let leave, tuck, enter;
  if (flavor === 'flip') {
    ghost.style.transformOrigin = s > 0 ? '50% 0%' : '50% 100%';
    const away = `perspective(1300px) rotateX(${s > 0 ? -78 : 78}deg) translateY(${s > 0 ? -6 : 6}%)`;
    leave = [{ transform: 'perspective(1300px) rotateX(0deg)', opacity: 1 }, { transform: away, opacity: 0.9 }];
    tuck = [{ transform: away, opacity: 0.9 }, { transform: 'perspective(1300px) translateY(5%) scale(.93)', opacity: 0 }];
    enter = { transform: 'translateY(28px) scale(.94)', opacity: 0.55 };
  } else {
    const x = (small ? 40 : 60) * s, r = 14 * s;
    const away = `translate(${x}%, -6%) rotate(${r}deg)`;
    leave = [{ transform: 'none', opacity: 1 }, { transform: away, opacity: 1 }];
    tuck = [{ transform: away, opacity: 1 }, { transform: `translate(${-2 * s}%, 2%) rotate(${-3 * s}deg) scale(.94)`, opacity: 0 }];
    enter = { transform: `translate(${-8 * s}px, 14px) rotate(${-2.5 * s}deg) scale(.95)`, opacity: 0.6 };
  }
  const a1 = ghost.animate(leave, { duration: 320, easing: 'cubic-bezier(.45,0,.85,.4)', fill: 'forwards' });
  front.animate([enter, { transform: 'none', opacity: 1 }], { duration: 560, delay: 180, easing: EASE_OUT, fill: 'backwards' });
  a1.finished
    .then(() => { ghost.style.zIndex = '2'; return ghost.animate(tuck, { duration: 380, easing: EASE_OUT, fill: 'forwards' }).finished; })
    .then(() => ghost.remove())
    .catch(() => ghost.remove());
}

/* Snapshot helpers */
export function cloneCard(front, fix) {
  const g = front.cloneNode(true);
  g.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
  g.removeAttribute('id');
  if (fix) fix(g);
  return g;
}

/* Keep a sticky visual centred in the viewport regardless of its height. */
export function centerSticky(el) {
  if (!el || !('ResizeObserver' in window)) return;
  const set = () => el.style.setProperty('--card-h', el.offsetHeight + 'px');
  new ResizeObserver(set).observe(el);
  set();
}
