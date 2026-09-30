# DECISIONS — ae-portfolio

- 2026-09-30 · Stack: static site ล้วน (HTML + CSS + vanilla JS ES modules) ไม่มี build step — deploy ได้ทุก static host (GitHub Pages / Netlify / Vercel / Cloudflare Pages). ไลบรารีภายนอกโหลดจาก CDN เท่านั้นถ้าจำเป็น
- 2026-09-30 · ตัวเลขผลการทดลองยึดตามสไลด์ (เวอร์ชันล่าสุด) ไม่ใช้ตัวเลขในบทคัดย่อของรายงานซึ่งเป็นเวอร์ชันเก่า
- 2026-09-30 · เดโม่ TDOA บนเว็บเป็น "การจำลองเพื่ออธิบาย" ต้องติดป้ายชัดเจน ห้ามทำให้ดูเหมือนข้อมูลจริงจากเครื่อง
- 2026-09-30 · dev server port 5174
- 2026-09-30 · T6 redesign v2: ยังเป็น static ไม่มี build แต่อนุญาตให้โหลด lib จาก CDN (jsdelivr, pin version): GSAP 3.15.0 + ScrollTrigger (defer), Lenis 1.3.26 (defer), three 0.186.1 (ES module ผ่าน importmap, dynamic import หลัง first paint — map three.core.js → three.core.min.js). ทุกส่วนทำงานได้แม้ CDN ล่ม (IO + CSS fallback, 3D fallback เป็น canvas 2D เดิม)
- 2026-09-30 · ฟอนต์ v2: Geist (Latin display/ตัวเลข) + IBM Plex Sans Thai (ไทย) + Geist Mono (readout) จาก Google Fonts แทน IBM Plex Mono
- 2026-09-30 · ภาพ/ข้อมูลจำลองทุกจุด (hero 3D + HUD, เดโม่, oscilloscope, slider พลังงาน, canvas อธิบายหลักการ) ต้องมีป้าย "จำลอง"; oscilloscope สุ่มจุดแล้วคำนวณ Δt จาก v = 675 m/s ที่อัตรา 38,462 S/s จริง; slider ใช้เกณฑ์จริง 172/594 บนสเกลลอการิทึม
- 2026-09-30 · dev server ของ frontend-dev T6 ใช้ port 5177 (5174 เป็น preview ของเจ้าของ)

## 2026-09-30 — Host
- Deploy บน GitHub Pages บัญชี charchimi → https://charchimi.github.io/ae-portfolio/ (ผู้ใช้เลือก)
- Google Search Console ผู้ใช้ยืนยันเอง
- push/เปิด public repo ต้องขออนุมัติผู้ใช้อีกครั้งก่อนทำจริง
