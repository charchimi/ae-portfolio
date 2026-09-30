# T4 audit (seo-perf-auditor) 2026-09-30
Lighthouse (local, mobile+desktop): A11y 100, Best Practices 100, SEO 100 (Perf category not produced by tool). Only failed audit: label-content-name-mismatch on `a.brand` (aria-label "ไปยังส่วนบนสุด" vs visible "AE Localization").
Trace: desktop LCP 170ms, CLS 0.01; mobile Fast3G + 4x CPU: LCP 998ms (text, h1; render delay = Google Fonts CSS blocking), CLS 0.00.

## Findings (by impact)
1. MED SEO - index.html <title> ~95 chars; Thai SERP truncates ~55-60 chars. Fix: "ระบบระบุตำแหน่งแหล่งกำเนิดคลื่นเสียง | โรงเรียนมัธยมวัดด่านสำโรง" and move rest to H1/description. Puts school name in title (target query).
2. MED SEO - school name/students only in description + footer + JSON-LD. Add school name to visible hero eyebrow (`.hero-eyebrow`) so it is in the first screen text.
3. MED SEO - JSON-LD ScholarlyArticle has no datePublished/dateModified; add. Optionally add `WebSite`/`@graph`. Valid otherwise.
4. LOW SEO - og:type "article" -> "website" (single page, no article:* tags). og:image:alt is English; make Thai.
5. LOW PERF - Google Fonts CSS is render-blocking, 6 weights (Sans Thai 300/400/500/600 + Mono 400/500). Drop unused weights (check 300/500/600 use), or self-host woff2 + preload. display=swap and preconnect already OK.
6. LOW A11y - `a.brand` aria-label breaks label-in-name; remove aria-label or use "AE Localization - ไปยังส่วนบนสุด".
7. LOW UX/SEO - nav says "หลักการ" but section h2 is "คำสำคัญ" (#h-how); align.
8. LOW - no apple-touch-icon / PNG fallback favicon (Google likes >=48px multiple of 48; SVG accepted but add favicon.png 48/192px).
9. LOW - h1 contains EN + TH spans; OK (one h1). Consider ensuring Thai span appears first for snippet or add lang attr on .h-th (`lang="th"` not needed since html is th).
10. INFO - `hero-canvas` and demo pause off-screen/hidden/reduced-motion correctly (IntersectionObserver + visibilitychange; demo rAF stops when settled). JS total ~28KB, no main-thread problem.

## OK
Images: webp, width/height set, srcset+sizes, lazy (all below fold, no hero image => no LCP image issue). Gallery full-size loaded on demand. Contrast passes (muted #9aa7ae, faint #7d8b93 ~5.6:1, yellow badge #f2c744 on #07090b ~11:1). Focus-visible outline, skip link, dialog lightbox (native showModal, Esc), demo canvas has role/aria-label/tabindex + keyboard + aria-live, prefers-reduced-motion handled in CSS and JS, lang="th", single h1, no heading skips found, robots.txt/sitemap present.

## Must change on deploy (example.com placeholder)
index.html: canonical, og:url, og:image, twitter:image, JSON-LD url+image; robots.txt Sitemap line; sitemap.xml <loc> (+ update lastmod). og.png is 1200x630 OK. Set host headers: gzip/br (doc 51KB uncompressed), long cache for /assets, HTTPS. Then submit in Google Search Console.
