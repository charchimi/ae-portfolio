# seo-perf-auditor T11 - pre-launch audit (2026-09-30)
Target: site/index.html served locally (port 5191, now stopped). Read-only; no site files edited.

## Lighthouse (navigation)
| | Desktop | Mobile |
|---|---|---|
| Accessibility | 97 | 97 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |
| Performance | not in this tool's categories; measured by trace instead | |

Trace (mobile 390x844, 4x CPU, Fast 4G): LCP 2.43 s (borderline vs 2.5 s), CLS 0.00, TTFB 4 ms (local). INP not measurable without interaction; no long-task red flags seen.

## Ranked findings
1. LCP 2.43 s is 99.8% "render delay" (medium, fix optional)
   - LCP element = `p.hero-lead` (text, no network). It is hidden by the boot preloader (1.05s delay + .45s fade, `setTimeout 1250`) and by `.hero-lead` opacity transition (.9s + .45s delay). GitHub Pages TTFB/CPU will be worse than this local run, so real first-visit mobile LCP will likely exceed 2.5 s.
   - Fix: site/assets/css/style.css lines ~78-79 (`.boot` animation delay 1.05s -> ~.5s) and line ~220-222 (`.is-ready .hero-lead` transition-delay .45s -> 0, duration .9s -> .5s); site/index.html line ~40 `setTimeout(...,1250)` -> ~600. Alternative: exempt `.hero-lead` from the fade (keep only translate). Repeat visits in the same session already skip the boot.
2. Colour contrast fails (a11y 97, the only failed audit) (medium)
   - Dimmed "inactive" states in scroll-highlight lists: `.obj-steps .obj-step` (`span.obj-n` #433a27 = 1.8:1, `p` #33393e = 1.72:1, `strong` #4a4e51 = 2.4:1) and `.how-steps .how-step` (`.how-k` #1a565e = 2.43:1, `h3` #5c6063 = 3.18:1, `p` #3f464b = 2.1:1) on bg #04070a.
   - Fix: site/assets/css/style.css - raise inactive colours to >= 4.5:1 (e.g. p ~#8a9298, h3 ~#8a9298, .how-k ~#3fb8c4, .obj-n ~#9a8a5c), or express the dim state via a lighter-weight/opacity effect on the active item only. Also confirm the text is readable when JS/scroll-trigger has not activated the item (mobile users often see them dim).
3. Third-party runtime dependencies on CDN (low-medium)
   - index.html loads gsap, ScrollTrigger, lenis (deferred, non-blocking) and three@0.186.1 (importmap, modules) from cdn.jsdelivr.net, plus Google Fonts CSS (render-blocking, ~7 woff2 files). Site breaks/degrades if the CDN is blocked; no SRI.
   - Fix (optional): add `integrity`+`crossorigin="anonymous"` to the three gsap/lenis script tags (index.html lines 898-900); or self-host to assets/vendor/. Google Fonts CSS could be made non-blocking (`media="print" onload="this.media='all'"` + noscript fallback) - render-blocking insight shows only ~12 ms on this run, so low value.
4. Console issue: "Lazy-loaded images should have explicit dimensions" x2 (low)
   - Likely `img.is-on` gallery/lightbox images (`#lbImg` has dimensions; check the 3 `.is-on` swap images at index.html 446-448 and the hero3d/demo JS-created images). Add width/height where missing. CLS is already 0.00, so cosmetic.
5. Images (pass)
   - All 12 photos are WebP with `-sm` (800/450 px, 13-62 KB) and full versions (15-165 KB, only used in the lightbox); `srcset`/`sizes`, width/height, `loading=lazy`, `decoding=async` all present; alt text present (decorative ones have `alt=""`). Total 1.47 MB on disk but nothing large loads above the fold. No change needed. Optional: ui-debug.webp (165 KB) and firmware-dev.webp (134 KB) could be re-encoded at quality ~70.
6. JS weight (pass, informational)
   - Own JS 96 KB raw across 12 modules (hero3d.js 18 KB largest); style.css 123 KB raw (about 20 KB gzip on GH Pages). Third party: gsap+ScrollTrigger+lenis+three. Local python server has no gzip, so the "document latency 76 KB wasted" insight is a local artefact; GitHub Pages compresses. Sequential module fan-out (main.js -> 10 modules) is fine over HTTP/2.

## SEO / metadata (all pass; devops still owns URL replacement)
- `<html lang="th">`, viewport, theme-color present.
- Title: "ระบบระบุตำแหน่งแหล่งกำเนิดคลื่นเสียง | โรงเรียนมัธยมวัดด่านสำโรง" - good Thai, 60ish chars, unique (single page).
- Meta description (Thai, ~150 chars): includes school, TDOA, budget, error - good. No advisor/class number.
- OG/Twitter: complete (type, locale th_TH, title, description, url, image 1200x630 + alt, summary_large_image). Only remaining work: swap example.com to https://charchimi.github.io/ae-portfolio/ in canonical, og:url, og:image, twitter:image, JSON-LD url/image, robots.txt Sitemap, sitemap.xml loc (devops in progress). Note: og:image must be absolute and og.png is on the same host - OK.
- Headings: single h1 (contains an EN span + TH span - fine); h2 sections -> h3 -> h4 with no skipped levels found; footer "เอกสารอ้างอิง" is an h2 (`.foot-h`), acceptable.
- JSON-LD: valid JSON, `ScholarlyArticle`, inLanguage th, 3 authors, publisher = school + parent org. NO advisor/teacher, NO class/room number. Pass. Suggestion (low): consider `"@type":"CreativeWork"`/`Article` is fine as-is; Google shows no rich result for ScholarlyArticle anyway.
- robots.txt / sitemap.xml present and well-formed (placeholder host only).
- Favicons: svg + 48/96 png + apple-touch-icon present.

## assets/og.png (opened and viewed, 1200x630)
Baked-in text: "Science Project · Physics · M.5", "Real-time Acoustic Emission Source Localization", Thai subtitle "ระบบระบุตำแหน่งแหล่งกำเนิดคลื่นเสียงในวัสดุ พร้อมแสดงผลสามมิติ", footer "< 2,000 THB · 1.33 cm mean error · 4 piezo sensors".
- NO teacher/advisor mention. NO "ม.5/1" or room number.
- It DOES contain the grade level "M.5" (top eyebrow). This is grade level, not class/room. Confirm with owner it is acceptable; if not, edit the image source and re-export to remove " · M.5" (file: site/assets/og.png, 61.9 KB - size fine).
- Minor: og:image:alt in index.html mentions the school name, which is not in the image itself - harmless.

## Verdict
No blockers. Ship after devops URL swap. Recommended before launch: item 2 (contrast, only Lighthouse failure) and item 1 (shave the boot/hero delay so real-world mobile LCP stays < 2.5 s).
