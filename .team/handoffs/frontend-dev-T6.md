# Handoff frontend-dev T6 — Redesign v2

## What I did
Rewrote the site's look and motion ("listening plate": void black, signal cyan from the real 3D UI, brass from the piezo discs; Geist + IBM Plex Sans Thai + Geist Mono). All content is still verbatim from content.md. Every section and data point from v1 is kept. The SEO meta, JSON-LD, favicons, lightbox fixes, the demo (Δt=Δd/675) and the "จำลอง" badge are unchanged.
- Boot preloader: SVG oscilloscope trace + "SYSTEM ONLINE · 4 CH · 38,462 S/s". Shows once per session for ≤1.3s. Skippable. Off under reduced motion.
- Hero: a Three.js scene of the real prototype. It has an acrylic plate with glow edges, a dashed 30×30 frame, 4 brass piezo discs with red/black wires, and foam feet. The 10 cm guide tube appears, a nut drops, and a shader ripple spreads (vertex displacement plus glow). Sensors pulse in arrival order. An energy bar in green/yellow/red rises with a brass base ring, and the last 4 bars stay. Mouse/gyro parallax plus a slow orbit. The HUD reads "ภาพจำลอง 3 มิติ" with the event/xy/level. It pauses off-screen or when the tab is hidden. Reduced motion renders one still frame. If WebGL fails or the CDN is unavailable, it falls back to the old 2D canvas (hero.js).
- Nav: slim bar showing the current chapter. Full-screen menu overlay (focus trap, Esc). Chapter rail with progress on the right (≥1180px). Nav hides when scrolling down.
- Spec ticker marquee. Outlined chapter numbers. Thai headings revealed word by word (Intl.Segmenter, so Thai clusters are never split).
- 04 คำสำคัญ: sticky scrollytelling canvas (how.js) with 6 states: AE rings, TDOA hyperbola, first-break at 3% on strong vs weak channels, 3 hyperbolas → least squares, Leave-One-Out clustering, E=mgh drop side view. On mobile the visual sticks at the top and the steps stack under it.
- 05: simulated 4-channel oscilloscope (scope.js). Samples at 38,462 S/s with a random source and v=675. First-break is detected on the samples at 3% of each channel's peak. Also: pipeline with flowing signal line, equipment chips bento, 15-step timeline with scroll fill.
- 06: spec bento with scramble numbers. Calibration sequence: 826 → 996 → 1,041 struck out → 675 locks. Accuracy table plus plot with animated mean-error circles. Self-check: 10 drops per position fall in, and rejected drops flash red and fall away (0/10, 4/10, 7/10). GDOP / frequency big numbers. Energy slider (energy.js) on a log scale from 50 to 2,047 with the real thresholds 172/594; shows the dB range from the table, the level chip, a bar and a gauge; keyboard and aria-valuetext supported.
- 07: huge quote plus 4 story cards with mini figures (0.33 / 1.43 / 2.62 bars, 1.80 → 2.65).
- 08: status cards with animated checks (partial = dash). 0.71 + 1.20 set in large type. Limitations as a numbered list. Future work as `<details>` accordions. Closing statement in huge type.
- Photos: parallax band (piezo), clip-path reveal band (prototype), triptych (firmware, drop tube, assembly). Gallery is pinned horizontal scroll on desktop (keyboard focus scrolls to the item) and a native swipe/scroll-snap row on mobile. Lightbox kept.
- Micro-interactions (pointer:fine only): custom cursor (square brass target over the demo), magnetic buttons, card spotlight borders, gallery tilt.

## Files
- site/index.html (rewritten), site/assets/css/style.css (rewritten)
- site/assets/js/: main.js, motion.js (new: Lenis/GSAP/reveal/sequences), fx.js (new), hero3d.js (new), how.js (new), scope.js (new), energy.js (new), ui.js (rewritten: nav/menu/rail/anchors/lightbox)
- demo.js: font changed to Geist Mono and idle sensor stroke to brass; logic untouched. hero.js: fallback sizing only.
- docs/DESIGN.md (v2), .team/DECISIONS.md, .team/BOARD.md (T6)

## Libraries (CDN jsdelivr, pinned)
- gsap 3.15.0 (~29 KB br) + ScrollTrigger (~18 KB br), loaded with `defer`
- lenis 1.3.26 (~5.5 KB br), loaded with `defer`
- three 0.186.1 via importmap, dynamic import on requestIdleCallback after first paint: three.module.min (~90 KB br) + three.core.min (~104 KB br)
- Own code: HTML 20.7 KB gz, CSS 15.6 KB gz, JS ~31 KB gz total.

## How to run / check
`cd site && python -m http.server 5177` → http://localhost:5177 (ES modules need http).
Verified with Playwright at 1440×900, 390×844 and 360:
- No horizontal scroll.
- Console clean: 0 errors, 0 warnings. The ANGLE shader-log warning is suppressed with `renderer.debug.checkShaderErrors=false`.
- Tested and working: demo (click + arrows/Enter), slider (arrows/Home/End, boundary 172 → Warning, 595 → Critical), menu (focus, Esc, link → scroll + focus h2), lightbox (arrows, Esc), reduced motion (no boot/Lenis/pin, final states, still 3D frame).
Screenshots in .team/shots/:
- Full scroll sequences: `v2-d-00..40.png` (1440) and `v2-m-00..44.png` (390)
- Hero: `v2-hero-1440.png`, `v2-hero-390.png`, `v2-hero-360.png`
- Sections: `v2-demo/energy/menu/lightbox/how/scope/specs/accuracy/decision/conclusion/closing/team/triptych-1440.png`, `v2-menu-390.png`, `v2-how-390.png`, `v2-gallery-390.png`
- Reduced motion: `v2-reduced-*.png`

## Open items / for the next person
1. Lighthouse not run. The Playwright window here throttles rAF to about 2fps for every localhost page, including v1 on 5174, so I couldn't measure fps. Please run Lighthouse and a performance trace on real hardware; the heaviest items are the 3D hero and the gallery pin.
2. Everything reveal-related is gated on the `.mo` class, which is added by motion.js. If the CDN scripts stall, content stays visible. The hero reveal uses an inline timer.
3. The gallery and lightbox still show stm32-board, which has ASUS/Intel logos (known from T2). I swapped it out of the triptych, but the owner should decide whether to crop it.
4. The domain placeholder https://example.com is unchanged (see T2 handoff).
5. The custom cursor hides the native cursor (restored inside the lightbox). If the owner dislikes it, remove `initCursor` in main.js.
6. The hero 3D energy levels and positions are random visuals. They are labelled "ภาพจำลอง 3 มิติ" in the HUD, not data.
