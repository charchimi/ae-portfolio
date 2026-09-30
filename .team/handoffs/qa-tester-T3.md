# QA T3 - ผลทดสอบ (2026-09-30)
ทดสอบ Playwright 1440/1024/768/390/360, reduced-motion, touch. Console: ไม่มี error/warning, ไม่มี request fail. ไม่มี horizontal scroll ทุกความกว้าง. Anchor/nav/active/mobile menu/count-up/demo/lightbox keyboard ผ่านหมด. ตัวเลขทุกจุดตรง content.md (ไม่พบตัวเลขแต่ง).

## Bugs
1. [HIGH] Lightbox: รูป portrait (900x1600: stm32-board, firmware-dev, student-assembly, drop-tube-1/2) ล้นจอบน desktop. ที่ 1440x900 รูปสูง 1600px, caption/นับ/ปุ่มถูกทับ. Repro: เปิดแกลเลอรี คลิกรูปที่ 3. ควรพอดีจอ (contain). สาเหตุ: `.lb-stage img{max-height:100%}` ไม่ resolve เพราะ grid track ไม่มีความสูงชัดเจน + JS ตั้ง img.height เป็นค่าจริง. แก้: `.lb-stage{position:relative;min-height:0}` + `img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}` หรือ max-height:calc(100dvh - 160px). Shot: qa-lightbox-portrait-overflow-1440.png
2. [MED] canonical/og:url/og:image/JSON-LD url/sitemap/robots ใช้ https://example.com/ (placeholder) - ต้องแก้ก่อน deploy.
3. [LOW] Demo แสดง "-0.0": (30.0, -0.0) และ (-0.0, 30.0) เมื่อคลิกมุม S2/S4 (demo.js finish: e.x.toFixed(1)). ควร normalize (Math.abs หรือ +0).
4. [LOW] Demo: ป้าย "ตำแหน่งที่คำนวณ" ทับป้าย "#1 0 µs" เมื่อคลิกใกล้มุมเซนเซอร์ (เช่น 3,27). Shot: qa-demo-label-overlap.png
5. [LOW] Bars สอบเทียบ (390px): ตัวเลข "1,041" ทับปลายแท่งเต็มความกว้าง อ่านยาก. Shot: qa-bars-label-overlap-390.png
6. [LOW] Lightbox คลิก backdrop/ขอบไม่ปิด (คลิกที่ padding ของ .lb-in ไม่ตรงเงื่อนไข e.target===dlg / .lb-stage). Esc และปุ่มปิดใช้ได้.
7. [LOW] มือถือ 390: เส้นไกด์แนวตั้งซ้ายวิ่งทับอักษรตัวแรกของข้อความ (qa-guide-line-over-text-390.png).
8. [INFO] ฟอนต์โหลดจาก Google Fonts (ออฟไลน์จะ fallback). Nav เป็นแฮมเบอร์เกอร์ถึง 1024px. ไม่มี nav active ตอนอยู่ hero. Demo ที่จุดกึ่งกลาง (15,15) ลำดับ 1-4 ทั้งที่ Δt เท่ากันหมด. ตาราง conclusion กว้าง 660px เลื่อนแนวนอนในกล่องบนมือถือ (โอเค มี tabindex).
