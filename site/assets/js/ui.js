// Nav (scrolled/hide state, current chapter), full-screen menu, chapter rail, anchor scrolling, lightbox.
export function initUI(reduced, motion) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const lenis = () => motion && motion.lenis;

  /* nav scrolled / hide on scroll down */
  const nav = $('#nav');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    const menuOpen = !$('#menu').hidden;
    nav.classList.toggle('is-hidden', !menuOpen && y > 400 && y > lastY + 2 && !nav.contains(document.activeElement));
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    lastY = y; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* anchor links: smooth (Lenis) + move focus to the target for keyboard/screen reader users */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const el = id ? document.getElementById(id) : null;
    if (!el || (a.classList.contains('skip'))) return;
    e.preventDefault();
    if (!$('#menu').hidden) setMenu(false, false);
    motion.scrollTo(el);
    history.replaceState(null, '', `#${id}`);
    const focusEl = id === 'top' ? el : (el.querySelector('h2') || el);
    if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
    focusEl.focus({ preventScroll: true });
  });

  /* full-screen menu */
  const toggle = $('#navToggle'), menu = $('#menu'), lbl = $('.nt-l', toggle);
  const links = $$('#navList a');
  links.forEach((a, i) => a.parentElement.style.setProperty('--i', i));
  /* live preview panel: follows hover / focus, falls back to the current chapter */
  const IMG = { background: 'piezo-sensors', objectives: 'stm32-board', hypothesis: 'prototype-plate', how: 'ui-3d-events', demo: 'ui-idle', system: 'ui-debug', results: 'gdop-map', decision: 'student-assembly', conclusion: 'prototype-plate', gallery: 'drop-tube-2', team: 'firmware-dev' };
  const TXT = { background: '.lede', objectives: '.intro', hypothesis: '.intro', how: '.how-step p:last-child', demo: '.demo-hint', system: '.lede', results: '.intro', decision: '.pull p', conclusion: '.lede', gallery: '.gal-hint', team: '.ts-name' };
  const prevBox = $('#menuPrev');
  const previews = new Map();
  let curId = 'background', shown = '';
  links.forEach((a) => {
    const id = a.getAttribute('href').slice(1), sec = document.getElementById(id);
    if (!sec || !prevBox) return;
    const en = sec.querySelector('.chap-en'), tx = sec.querySelector(TXT[id] || '.intro');
    const el = document.createElement('div');
    el.className = 'mp';
    const no = $('.m-no', a).textContent.trim();
    el.innerHTML = `<div class="mp-img"><span class="mp-no">${no || '▶'}</span><img src="assets/img/${IMG[id]}-sm.webp" alt="" loading="lazy" decoding="async"></div><div class="mp-body"><p class="mp-en"></p><h3 class="mp-t"></h3><p class="mp-p"></p></div>`;
    $('.mp-en', el).textContent = en ? en.textContent : '';
    $('.mp-t', el).textContent = $('.m-t', a).textContent;
    $('.mp-p', el).textContent = tx ? tx.textContent.replace(/\s+/g, ' ').trim() : '';
    prevBox.appendChild(el); previews.set(id, el);
    ['pointerenter', 'focus'].forEach((ev) => a.addEventListener(ev, () => showPrev(id)));
    a.addEventListener('pointerleave', () => showPrev(curId));
    a.addEventListener('blur', () => showPrev(curId));
  });
  function showPrev(id) {
    if (id === shown || !previews.has(id)) return;
    shown = id;
    previews.forEach((el, k) => el.classList.toggle('is-on', k === id));
  }
  function setMenu(open, focusBack = true) {
    menu.hidden = !open;
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    lbl.textContent = open ? 'ปิด' : 'เมนู';
    nav.classList.remove('is-hidden');
    if (open) { lenis() && lenis().stop(); showPrev(curId); (menuLinks.get(curId) || links[0]).focus(); } else { lenis() && lenis().start(); if (focusBack) toggle.focus(); }
  }
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); setMenu(false); }
    if (e.key === 'Tab') {
      const f = [toggle, ...links];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* current chapter: nav label, rail, menu */
  const railLinks = new Map($$('.rail a').map((a) => [a.getAttribute('href').slice(1), a]));
  const menuLinks = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const noEl = $('#navNo'), tEl = $('#navT');
  const setCurrent = (sec) => {
    const id = sec ? sec.id : 'top';
    if (previews.has(id)) curId = id;
    noEl.textContent = sec ? sec.dataset.chapter : '00';
    tEl.textContent = sec ? sec.dataset.title : 'หน้าแรก';
    [railLinks, menuLinks].forEach((m) => m.forEach((a, k) => {
      const on = k === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    }));
  };
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((en) => {
      en.forEach((e) => { if (e.isIntersecting) setCurrent(e.target.id === 'top' ? null : e.target); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('section[data-chapter], #top').forEach((s) => spy.observe(s));
  }

  /* hero count-up happens after boot (see main.js) */

  /* lightbox */
  const dlg = $('#lightbox');
  const items = $$('.g-item');
  if (!dlg || !items.length) return;
  const img = $('#lbImg'), cap = $('#lbCap'), count = $('#lbCount');
  let idx = 0;
  const show = (i) => {
    idx = (i + items.length) % items.length;
    const b = items[idx];
    const thumb = $('img', b);
    img.src = b.dataset.full;
    img.width = +b.dataset.w;
    img.height = +b.dataset.h;
    img.alt = thumb.alt;
    cap.textContent = thumb.alt;
    count.textContent = `${idx + 1} / ${items.length}`;
  };
  items.forEach((b, i) => b.addEventListener('click', () => { show(i); dlg.showModal(); lenis() && lenis().stop(); }));
  $('#lbClose').addEventListener('click', () => dlg.close());
  $('#lbPrev').addEventListener('click', () => show(idx - 1));
  $('#lbNext').addEventListener('click', () => show(idx + 1));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
  });
  dlg.addEventListener('click', (e) => {
    if (!e.target.closest('button, .lb-cap, .lb-count') && e.target.id !== 'lbImg') dlg.close();
  });
  dlg.addEventListener('close', () => { img.removeAttribute('src'); lenis() && lenis().start(); });
}
