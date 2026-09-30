# Handoff frontend-dev T9 - fixes after T8 review

## Done
1. Chapter header (shared): `01 / 10  EYEBROW ───` mono line with a rule that fills to chapter/10, big one-line h2, intro under it. 01 no longer uses the sticky two-column split. Removed the outlined-number parallax in motion.js.
2. Hypothesis: bordered/filled tabs, hover lift, chevron on active, hint "เลือกสมมติฐานเพื่อดูรายละเอียด", prev/next + counter + dots, per-tab progress bar with slow auto-advance (6.5 s) until first user action (off under reduced motion). Panel = claim | gauge in an inset panel.
3. Equipment: one kit panel - photo (stm32-board / drop-tube-2 / ui-idle, crossfades per tab), segmented control, item count, single-column list with mono right-aligned spec. No card grid.
4. Accuracy: plot left, three data rows right (table kept as real `<table>`, restyled; rows focusable). Hover/focus/click on a row or hover/tap on a plot point highlights the point, error circle, link and label, both ways; click pins.
5+6. Deck shuffle: new `assets/js/deck.js` (`shuffle`, `cloneCard`, `centerSticky`). 02 = fan sideways, 04 = flip up; reverse direction when scrolling back; reduced motion = crossfade. how.js no longer crossfades old/new canvas states (the ghost snapshot does it). Sticky cards centred on the viewport, 04 text centred against the card.

## Files
site/index.html, site/assets/css/style.css (T9 block at end + small mobile override), site/assets/js/{interact.js,deck.js,how.js,motion.js}, docs/DESIGN.md, .team/BOARD.md.

## Checks
1440 + 375: no console errors, scrollWidth = viewport minus scrollbar. Screenshots `.team/handoffs/t9-*.png` (desktop per item, `t9-m-*` mobile, filmstrips `t9-5-deck-02-filmstrip.png`, `t9-5-deck-02-reverse-filmstrip.png`, `t9-6-deck-04-filmstrip.png` show the shuffle mid-flight).

## Notes
- Headless Chrome only advances WAAPI animations when a frame is painted, so filmstrips are taken with back-to-back screenshots; in a real browser the animation runs normally (~320 ms leave + 380 ms tuck, 560 ms settle).
- Playwright keeps `emulateMedia` between pages in one context; reset to `no-preference` when testing motion.
- New UI microcopy: only the hint "เลือกสมมติฐานเพื่อดูรายละเอียด" and prev/next aria-labels.
