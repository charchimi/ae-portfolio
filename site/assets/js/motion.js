// Scroll + motion layer. Lenis smooth scroll and GSAP ScrollTrigger when available
// (CDN, deferred); everything degrades to IntersectionObserver + CSS transitions.
// Under prefers-reduced-motion: no smooth scroll, no pinning, no scrubbing, final states.
import { scramble } from './fx.js';

export function splitWords(el) {
  if (el.classList.contains('is-split')) return;
  const text = el.textContent;
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  const parts = seg ? [...seg.segment(text)].map((s) => s.segment) : text.split(/(\s+)/);
  el.textContent = '';
  let i = 0;
  parts.forEach((p) => {
    if (/^\s+$/.test(p)) { el.appendChild(document.createTextNode(p)); return; }
    const w = document.createElement('span');
    w.className = 'w'; w.style.setProperty('--wi', i++); w.textContent = p;
    el.appendChild(w);
  });
  el.classList.add('is-split');
}

export function initMotion(reduced) {
  const gsap = window.gsap, ST = window.ScrollTrigger, Lenis = window.Lenis;
  const rm = reduced.matches;
  const api = { lenis: null, gsap: null, scrollTo: null };
  document.documentElement.classList.add('mo');

  /* ---- smooth scroll ---- */
  if (!rm && Lenis) {
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, anchors: false, allowNestedScroll: true, autoRaf: !gsap });
    api.lenis = lenis;
    if (gsap && ST) {
      lenis.on('scroll', ST.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  api.scrollTo = (el) => {
    if (api.lenis) api.lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    else el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth' });
  };

  /* ---- split headings ---- */
  document.querySelectorAll('[data-split]').forEach(splitWords);

  /* ---- reveal (IO; CSS does the easing) ---- */
  const revealSel = '[data-reveal], [data-split], .plot, .st, .story-c';
  const all = [...document.querySelectorAll(revealSel)];
  if (rm || !('IntersectionObserver' in window)) {
    all.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      const batch = entries.filter((e) => e.isIntersecting);
      batch.forEach((e, i) => {
        e.target.style.setProperty('--rd', `${Math.min(i, 6) * 0.08}s`);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px 35% 0px', threshold: 0 });
    all.forEach((el) => io.observe(el));
  }

  /* ---- one-shot sequences ---- */
  const once = (el, fn, threshold = 0.35) => {
    if (!el) return;
    if (rm || !('IntersectionObserver' in window)) { fn(true); return; }
    const o = new IntersectionObserver((en) => { if (en[0].isIntersecting) { o.disconnect(); fn(false); } }, { threshold });
    o.observe(el);
  };

  // number scramble
  document.querySelectorAll('[data-scramble]').forEach((el) => once(el, (still) => { if (!still) scramble(el, 1100); }, 0.6));

  // calibration story: 826 -> 996 -> 1,041 (struck out) -> 675 locks in
  const calib = document.getElementById('calib');
  once(calib, (still) => {
    const v = document.getElementById('calibV');
    if (still) { calib.classList.add('is-play', 'is-locked'); return; }
    calib.classList.add('is-play');
    const seq = [['826', 250], ['996', 600], ['1,041', 950]];
    seq.forEach(([val, at]) => setTimeout(() => { v.textContent = val; v.style.color = 'var(--muted)'; }, at));
    setTimeout(() => { v.style.textDecoration = 'line-through'; v.style.textDecorationColor = 'var(--r)'; v.style.textDecorationThickness = '2px'; }, 1700);
    setTimeout(() => { v.style.textDecoration = ''; v.style.color = ''; v.dataset.final = '675'; scramble(v, 600); calib.classList.add('is-locked'); }, 2450);
  }, 0.45);

  // self-validation drops
  document.querySelectorAll('.drops').forEach((dr) => {
    [...dr.children].forEach((d, i) => d.style.setProperty('--di', i));
    once(dr, () => dr.classList.add('is-play'), 0.6);
  });

  // clip reveal band (fallback when no GSAP)
  const band = document.querySelector('.band-reveal');

  /* ---- GSAP scroll choreography ---- */
  if (!gsap || !ST || rm) {
    if (band) once(band, () => band.classList.add('is-open'), 0.2);
    progressFallback();
    return api;
  }
  gsap.registerPlugin(ST);
  api.gsap = gsap;

  // hero content drifts up and fades as you leave
  gsap.to('.hero-in', { yPercent: -12, opacity: 0.1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-stage', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // parallax photo band
  document.querySelectorAll('.band-parallax .band-media').forEach((m) => {
    gsap.fromTo(m, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: m.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // clip-path band opens with scroll
  if (band) {
    gsap.fromTo(band, { clipPath: 'inset(14% 12% 14% 12% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: band, start: 'top 95%', end: 'top 15%', scrub: true } });
    gsap.fromTo(band.querySelector('img'), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  // triptych: columns move at different speeds
  gsap.utils.toArray('.tri img').forEach((img, i) => {
    gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.triptych', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.fromTo('.tri-b', { y: 60 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '.triptych', start: 'top bottom', end: 'bottom top', scrub: true } });
  // timeline fill
  const tl = document.getElementById('tlFill');
  if (tl) gsap.to(tl, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  // page progress on the rail
  const pr = document.getElementById('progress');
  if (pr) gsap.to(pr, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
  // decision quote aura
  gsap.fromTo('.decision-aura', { scale: 0.8, opacity: 0.4 }, { scale: 1.1, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.decision', start: 'top bottom', end: 'center center', scrub: true } });

  // horizontal gallery (desktop, fine pointer or wide screens)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const sec = document.querySelector('.gallery-sec');
    const track = document.querySelector('.gallery');
    const fill = document.getElementById('galFill');
    if (!sec || !track) return undefined;
    sec.classList.add('is-hscroll');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: sec.querySelector('.gallery-pin'), start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (s) => { if (fill) fill.style.transform = `scaleX(${s.progress})`; },
      },
    });
    // keyboard: bring focused item into view by scrolling the page to the matching progress
    const onFocus = (e) => {
      const li = e.target.closest('li'); if (!li) return;
      const st = tween.scrollTrigger; const d = dist(); if (!d) return;
      const want = Math.min(d, Math.max(0, li.offsetLeft - innerWidth * 0.3));
      const y = st.start + (want / d) * (st.end - st.start);
      if (api.lenis) api.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    };
    track.addEventListener('focusin', onFocus);
    return () => { sec.classList.remove('is-hscroll'); track.removeEventListener('focusin', onFocus); gsap.set(track, { x: 0 }); };
  });

  // refresh after fonts/images settle
  const refresh = () => ST.refresh();
  if (document.fonts) document.fonts.ready.then(refresh);
  addEventListener('load', refresh);
  return api;

  function progressFallback() {
    const pr = document.getElementById('progress'), tlf = document.getElementById('tlFill');
    const tlEl = document.querySelector('.timeline');
    let ticking = false;
    const up = () => {
      const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      if (pr) pr.style.transform = `scaleY(${max > 0 ? Math.min(1, h.scrollTop / max) : 0})`;
      if (tlf && tlEl) { const r = tlEl.getBoundingClientRect(); const p = (innerHeight * 0.7 - r.top) / r.height; tlf.style.transform = `scaleY(${Math.max(0, Math.min(1, p))})`; }
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(up); } }, { passive: true });
    up();
    if (rm && tlf) tlf.style.transform = 'scaleY(1)';
  }
}
