# Handoff frontend-dev T2

## ทำอะไรไป
เว็บ one-page ภาษาไทยครบทุก section ตาม content.md (hero, ที่มา, วัตถุประสงค์, สมมติฐาน, คำสำคัญ, เดโม่ TDOA, ระบบ/อุปกรณ์/15 ขั้น/3 การทดลอง, ผลการทดลอง, ค่าชดเชย, สรุป, แกลเลอรี lightbox, ผู้จัดทำ, อ้างอิง) stack: HTML + CSS + vanilla JS (ES modules) ไม่มี build ไม่มี CDN lib (ฟอนต์ Google เท่านั้น)

## ไฟล์ (ทั้งหมดใน site/)
index.html · assets/css/style.css · assets/js/{main,ui,hero,demo}.js · favicon.svg · assets/og.png (1200x630) · robots.txt · sitemap.xml · docs/DESIGN.md
ภาพหน้าจอตรวจงาน: .team/shots/

## รัน
`cd site && python -m http.server 5174` แล้วเปิด http://localhost:5174 (ต้องผ่าน http เพราะใช้ ES modules)

## ตรวจแล้ว
- Playwright 1440 / 390 / 360: ไม่มี horizontal scroll, console ไม่มี error/warning
- เดโม่: คลิก, ปุ่มสุ่ม, คีย์บอร์ด (ลูกศร+Enter) ทำงาน ; lightbox เปิด/ปิด Esc / ลูกศร / โฟกัสกลับปุ่มเดิม ; เมนูมือถือ
- reduced-motion: ตัวเลขแสดงค่าสุดท้าย, hero นิ่ง
- ไม่มี build/typecheck (ไม่มี pipeline) — ยังไม่ได้รัน Lighthouse

## ค้าง / ต้องตัดสินใจ
1. โดเมนจริง: ใช้ placeholder `https://example.com` ใน canonical, og:url, og:image, JSON-LD, sitemap.xml, robots.txt — ต้องแทนที่ทุกจุด (grep example.com)
2. og.png ใช้ข้อความอังกฤษ + ตัวเลข (สร้างจาก HTML ชั่วคราว) ถ้าอยากได้ไทยให้ออกแบบใหม่
3. รูป stm32-board (และอาจรูปอื่นๆ) มีสิ่งของยี่ห้ออื่นติดในฉาก (แล็ปท็อปมีโลโก้ ASUS/Intel) เจ้าของอาจต้องการครอปออกก่อน publish
4. รูป gdop-map พื้นขาวสว่างกว่าธีมมืด (เป็นภาพกราฟต้นฉบับ)
5. ชื่อในฉบับ content: "นายภูริวัจน์เจริญ เจริญบันลือโชติ" ใช้ verbatim ตาม content.md (อาจเว้นวรรคผิด ให้ตรวจกับเจ้าของ)
6. เดโม่คำนวณตำแหน่งจากเวลาแบบไร้สัญญาณรบกวน จึงได้ตรงกับจุดที่คลิก (ระบุไว้บนหน้าแล้ว) ; ตัวเลขทั้งหมดในเดโม่คำนวณสด ไม่ใช่ข้อมูลเครื่อง

## Fix round T2b
QA: lightbox now fits viewport (stage is position:relative, img absolute + object-fit:contain, dialog 100dvh) and closes on backdrop/padding click; demo "-0.0" normalized; "ตำแหน่งที่คำนวณ" label picks a corner that does not collide with sensor labels; calibration bars: wider gap/fixed value column, strikethrough removed (muted color instead); vertical guide lines hidden <=700px; hero canvas dimmed to 0.28 opacity <900px; accuracy table now fits at desktop (compact columns, no scrollbar at 1440), nowrap + dark thin scrollbar when narrow.
SEO: title shortened + school name; hero eyebrow includes school name and ม.5/1; JSON-LD datePublished/dateModified 2026-09-30; og:type website; Thai og:image:alt (+ twitter:image:alt); Google Fonts trimmed to Sans Thai 300/400/500 + Mono 400/500; a.brand aria-label removed (label-in-name); nav "คำสำคัญ" matches h2; added assets/favicon-48.png, favicon-96.png, apple-touch-icon.png (180).
Screenshots: .team/shots/fix-*.png (lightbox-1440, demo-corner-1440, accuracy-1440, hero-390, bars-390, table-390). Console clean at 1440 and 390.

### Domain placeholder (still https://example.com) - replace in ALL of:
- site/index.html: canonical, og:url, og:image, twitter:image, JSON-LD url + image
- site/robots.txt (Sitemap line)
- site/sitemap.xml (<loc>, lastmod)
One-liner: `grep -rl example.com site | xargs sed -i 's#https://example.com#https://REAL-DOMAIN#g'`
