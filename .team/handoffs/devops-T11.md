# devops T11 — เตรียม GitHub Pages (local เท่านั้น ยังไม่ push)

## ทำอะไรไป
- แทน placeholder ทั้งหมดเป็น https://charchimi.github.io/ae-portfolio/ (canonical, og:url, og:image, twitter:image, JSON-LD url/image, robots.txt Sitemap, sitemap.xml loc; lastmod 2026-09-30)
- ตรวจ asset path ใน index.html / CSS / JS: เป็น relative ทั้งหมด ไม่มี "/" นำหน้า
- เพิ่ม site/.nojekyll, site/404.html (dark, noindex; ใช้ลิงก์ /ae-portfolio/ แบบ root-relative เพราะ 404 ถูกเสิร์ฟที่ path ลึกใดก็ได้ relative จะพัง), ลบ site/.gitkeep
- git init (branch main) + .gitignore + commit แรก `2d3984c`
- .github/workflows/pages.yml: deploy โฟลเดอร์ site/ ด้วย checkout@v7, configure-pages@v6, upload-pages-artifact@v5, deploy-pages@v5 (เวอร์ชันล่าสุดจาก gh api releases ณ 2026-09-30) trigger เมื่อ push main + manual
- .gitignore ตัด .team/shots (110MB) และ .team/handoffs/*.png (~46MB) ออก (เกิน 20MB) repo .git ~1.8MB
- ไม่มี .env ในโปรเจกต์; ไม่ใส่ google-site-verification

## คำสั่งที่หัวหน้าจะรันหลังผู้ใช้อนุมัติ (จาก projects/ae-portfolio)
```
gh repo create charchimi/ae-portfolio --public --source . --push
gh api -X POST repos/charchimi/ae-portfolio/pages -f build_type=workflow
# ถ้าตอบว่ามี Pages อยู่แล้ว:
gh api -X PUT repos/charchimi/ae-portfolio/pages -f build_type=workflow
gh run list -R charchimi/ae-portfolio --limit 3     # ดูสถานะ workflow
gh run watch -R charchimi/ae-portfolio
```
หมายเหตุ: workflow จะรันตอน push แรก ซึ่งอาจล้มเพราะ Pages ยังไม่เปิด ถ้าล้ม เปิด Pages แล้วรัน `gh workflow run pages.yml -R charchimi/ae-portfolio` (หรือ `gh run rerun`)
เสร็จแล้วตรวจ: https://charchimi.github.io/ae-portfolio/ , /robots.txt , /sitemap.xml , /assets/og.png , และหน้า 404 (เช่น /ae-portfolio/xyz)
Rollback: `git revert <commit> && git push` (workflow deploy ใหม่) หรือปิด Pages: `gh api -X DELETE repos/charchimi/ae-portfolio/pages`

## คู่มือ Google Search Console (สำหรับผู้ใช้)
1. เข้า https://search.google.com/search-console แล้วล็อกอินด้วยบัญชี Google
2. กด "เพิ่มพร็อพเพอร์ตี้" เลือกแบบ "คำนำหน้า URL" (URL prefix) ใส่ `https://charchimi.github.io/ae-portfolio/` (ต้องมี / ท้าย)
3. เลือกวิธียืนยัน "แท็ก HTML" จะได้โค้ดหน้าตา `<meta name="google-site-verification" content="...">` ยังไม่ต้องกดยืนยัน
4. คัดลอกทั้งบรรทัดส่งให้หัวหน้า (main) หัวหน้าจะใส่ใน <head> ของ index.html แล้ว push/deploy ใหม่ (รอ ~1-2 นาที)
5. กลับไปกด "ยืนยัน" ใน Search Console (ต้องรอ deploy เสร็จก่อน) ห้ามลบ meta tag นี้ออกภายหลัง
6. เมนู "แผนผังเว็บไซต์" (Sitemaps) ใส่ `sitemap.xml` แล้วกดส่ง สถานะควรเป็น "สำเร็จ"
7. เมนู "ตรวจสอบ URL" ใส่ `https://charchimi.github.io/ae-portfolio/` แล้วกด "ขอให้จัดทำดัชนี" (Request indexing)
8. ระยะเวลา: โดยทั่วไป 2 วัน ถึง 2 สัปดาห์ (บางครั้งนานกว่า) เว็บใหม่ที่ไม่มีลิงก์จากที่อื่นอาจช้า ตรวจได้โดยค้น `site:charchimi.github.io/ae-portfolio` ช่วยให้เร็วขึ้นถ้าโรงเรียน/โซเชียลลิงก์มาที่เว็บ

## ข้อควรแจ้งผู้ใช้ก่อนอนุมัติ
- repo จะเป็น **public**: ใครก็ดูโค้ด รูปภาพ และเนื้อหาได้ รวมถึง **ชื่อนักเรียนและรูปถ่ายนักเรียน** ที่อยู่ในเว็บ/assets ควรยืนยันว่าได้รับความยินยอมจากนักเรียน/ผู้ปกครอง/โรงเรียนแล้ว
- GitHub Pages บนบัญชีฟรีต้องใช้ repo public; เมื่อขึ้นเว็บแล้ว Google จะเก็บชื่อ/รูปในผลค้นหาได้
- โฟลเดอร์ .team/, SCOPE.md, content/, docs/ จะอยู่ใน repo ด้วย (ไม่มีความลับ แต่เป็นเอกสารภายในทีม) ถ้าไม่ต้องการ ให้บอกเพื่อตัดออกก่อน push

## ค้าง
- ขออนุมัติผู้ใช้ก่อน push/เปิด Pages
- รอ meta google-site-verification จากผู้ใช้
