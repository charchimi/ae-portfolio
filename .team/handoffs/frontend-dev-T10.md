# Handoff frontend-dev T10

## Done
1. Advisor removed everywhere in site/: advisor card, name, "ครูที่ปรึกษา", JSON-LD `contributor`. `ม.5/1` and `เลขที่ N` removed from meta description, og/twitter alt, JSON-LD description, hero eyebrow, footer note and the team cards. `grep -rn "นิชรัชชา|ครูที่ปรึกษา|เลขที่ |ม.5/1|contributor|advisor" site/` returns nothing (content/ untouched). School line and project/year line kept (team band, footer, menu foot). Note: assets/og.png is a raster; I did not inspect it for baked-in text.
2. #team: three name cards in one row (tilt + cursor glow kept, index 01-03 is decorative aria-hidden ordering, not a class number), then a school band. Compact, no dead space; stacks on mobile.
3. Menu: 2-column overlay (single aligned list + live preview: thumbnail, number, eyebrow, title, first lines of the chapter's own text), demo = play icon, hover = sliding highlight + arrow, active = dot (no indent), staggered open, grid/aurora background. Mobile: single column, no preview, 58px rows. Focus trap and Esc unchanged (Tab from toggle goes to list; Esc returns focus to toggle). Opens focused on the current chapter link.
4. Stray cursor ring at the top-left: fx.js now positions the ring at the first pointer move before un-hiding it.

## Files
site/index.html, site/assets/css/style.css (T10 block at end; old menu/advisor rules removed), site/assets/js/ui.js (preview builder), site/assets/js/fx.js, docs/DESIGN.md, .team/BOARD.md.

## Checks
1440 + 375, no console errors, no horizontal scroll. Screenshots: `.team/handoffs/t10-*.png` (team desktop/hover/mobile, menu desktop/hover/demo/mobile).
