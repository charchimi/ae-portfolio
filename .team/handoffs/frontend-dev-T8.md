# Handoff frontend-dev T8 - one interaction per chapter

## What changed
T7 hairline/table look is out. Surfaces are back but every chapter has its own interaction. Thai text is unchanged; comparison (08) and equipment (05) text is only split/re-arranged, nothing invented. Derived label in 08: "บรรลุ 2 จาก 3 ข้อ · บรรลุบางส่วน 1 ข้อ" (counts the three status items).

| Chapter | Pattern |
|---|---|
| 01 ที่มา | Full-width plate + crack, 3 role=tab switcher: eye = scan line, ultrasonic = probe checks one point at a time with rings, AE = waves from crack reach 4 sensors one by one. AE tab glows. Auto plays eye -> us -> AE once when visible, stops on AE; any click cancels. |
| 02 วัตถุประสงค์ | Pinned schematic + 4 objectives scrolling (IntersectionObserver sets `data-step`): sensors+STM32 -> 3 hyperbolas meeting -> 3-ring energy meter -> plate tilts to iso + 3D bar. Mobile: schematic sticky on top, text scrolls under. |
| 03 สมมติฐาน | Vertical tablist H1-H4, animated panel: H1 5-segment risk meter with "เสี่ยงที่สุด", H2 arc gauge (<= 5 ซม.), H3 3-level bars, H4 dot converging on theory-limit line. |
| 05 ระบบ | (a) signal flow: 4 nodes, pulse loops sensor->board->PC->web, hover/focus/tap a node to read it (loop pauses 8 s); (b) equipment: filter chips with staggered list swap; (c) experiments: horizontal expanding panels (hover on fine pointers, click/tap/keyboard everywhere; accordion on mobile). 15-step timeline unchanged. |
| 06 ผล | Oscilloscope panel: grid + scanline, mono glow digits, scramble on reveal, sweep line over the comb SVG. Tables/plot/callout sit on soft surfaces; tables stack as label:value on mobile. |
| 07 ค่าชดเชย | Scroll-driven timeline: centre line fills with progress, cards light as they pass, alternating sides on desktop. Turning point = red enlarged card + pulsing node. |
| 08 สรุป | 2/3 counter + status cards tick one by one (check draws, bar fills). Comparison = per-aspect "งานอื่น / งานเรา" sliding switch with cross-fade. |
| 10 ผู้จัดทำ | Tilt + cursor glow cards (only place). |

## Files
- site/index.html (new markup for 01,02,03,05,06 class hooks,07 wrapper,08,10)
- site/assets/css/style.css (T7 block removed; new "T8" block at the end, plus a few small overrides after it)
- site/assets/js/interact.js (new, imported from main.js via `initInteractions`)
- docs/DESIGN.md (policy + per-chapter table), .team/BOARD.md (T8 done)

## Checks
Served on :5187 (stopped). 1440 and 375: no console errors, scrollWidth == viewport minus scrollbar. Keyboard: arrow keys move tabs (lens, hypothesis, equipment). Reduced motion: lens on AE, timeline fully lit, ticks shown final, counter 2. Screenshots: `.team/handoffs/t8-*.png` (desktop) and `t8-m-*.png` (375).

## Notes / left
- 02 (pinned scrollytelling) and 04 (existing sticky canvas) are both scroll-pinned; the mechanics differ (schematic reacts vs. canvas storyboard) but a strict reading of "no repeats" may want one changed.
- Content is visible without JS (tab controls hidden until `.is-on`, all panels stacked). Not tested with JS fully disabled in a browser.
- The custom cursor ring shows in Playwright screenshots; it is the site cursor, not a bug.
- Old T7 shots (t7-*.png) are still in this folder and are obsolete.
