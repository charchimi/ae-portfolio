# Handoff frontend-dev T7 — ลดการ์ด เป็น editorial layout

## ทำอะไรไป
ลบการ์ดกระจก/ขอบ gradient/ไอคอน/เลขจาง/hover glow ออกทั้งหน้า แทนด้วย hairline, แถวเลขลำดับ, ตารางจริง, datasheet, timeline. ข้อความไทยเดิมทั้งหมดคงไว้ (ตาราง BOM แยกชื่อรายการ/จำนวนออกเป็นสองเซลล์ ข้อความเดิมครบ).

| ส่วน | ใหม่ |
|---|---|
| 01 ที่มา | `table.cmp` 3 แถว (ประเภท/วิธี/รายละเอียด) แถว AE มีเส้นซ้าย signal + คลื่น SVG |
| 02 วัตถุประสงค์ | `ol.idx-list` เลข 01-04 mono ทองเหลือง ซ้าย, วลีหลักตัวใหญ่ (`<strong>` ตัดจากประโยคเดิม) + คำอธิบาย |
| 03 สมมติฐาน | `table.hyp` ข้อ / สมมติฐาน / เกณฑ์วัด; H1 มีข้อความ "▲ เสี่ยงที่สุด" + เส้นซ้ายเหลือง; H2 "≤ 5 ซม.", H3 "3 ระดับ", H1/H4 ใช้ "–" |
| 05 ระบบ | `ol.flow` แผนภาพ 3 ขั้น (เส้น+จุด+ลูกศร desktop, เส้นตั้งบนมือถือ) · อุปกรณ์ `table.bom` แยก ฮาร์ดแวร์/วัสดุทดสอบ/ซอฟต์แวร์ · timeline 15 ขั้นเดิม · การทดลอง `ol.exp-rows` |
| 06 ผล | `dl.datasheet` (38,462 + comb SVG แถวบน, 5 ค่าที่เหลือคั่นเส้นตั้ง) · ตารางความแม่นยำ/ระดับพลังงานเป็น `.ed--kv` (มือถือ = label: value ต่อแถว ผ่าน `data-label`) · plot ไม่มีกรอบ · callout เป็นเส้นซ้ายเหลือง · self-check ไม่มีแผงครอบ · calibration ไม่มีกล่อง |
| 07 ค่าชดเชย | `ol.story` timeline แนวตั้ง (เส้น+จุด, จุดแดงที่ขั้นตัดสินใจ) |
| 08 สรุป | `ul.checks` แถวสถานะ (เช็ก/ขีดในช่อง 26px) · เทียบงานวิจัย 3 คอลัมน์คั่นเส้นตั้ง · ข้อเสนอแนะ `details.fold` แบบเส้น |
| 10 ผู้จัดทำ | เครดิต: ชื่อ ซ้าย / ม.5/1 เลขที่ ขวา, ครูที่ปรึกษา label|ชื่อ|โรงเรียน (ตัดเลขใหญ่ตกแต่ง aria-hidden ออก) |

กล่องที่เหลือ: `.instrument` เฉพาะจอโต้ตอบ (เดโม่, scope, energy, how-viz) radius 6px, กรอบรูป 4px. นโยบายเต็มอยู่ใน docs/DESIGN.md.

## ไฟล์ที่แก้
- site/index.html (markup ของ section ข้างต้น; ลบ class `card`, `bento*`, `glyph`, `acc`(details -> `fold`))
- site/assets/css/style.css (ลบ CSS การ์ด/bento/method/pipe/eq/exp/spec/story/status/compare/acc/team เดิม แล้วเพิ่มบล็อก "T7 - editorial" ท้ายไฟล์)
- site/assets/js/fx.js, main.js (ลบ `initSpotlight` ที่ตามเมาส์บนการ์ด)
- docs/DESIGN.md, .team/BOARD.md

## วิธีรัน/ตรวจ
`cd site && python -m http.server 5187` แล้วเปิด http://localhost:5187 (ปิดเซิร์ฟเวอร์แล้ว). ตรวจแล้วที่ 1440 และ 375: ไม่มี console error, ไม่มี horizontal scroll (scrollWidth = viewport - scrollbar). ภาพเต็มหน้า: `.team/handoffs/t7-desktop.png`, `t7-mobile.png`.

## ค้าง / ควรรู้
- ไม่มี build step (static) จึงไม่มี typecheck/lint.
- ตาราง BOM ซอฟต์แวร์และบางแถวฮาร์ดแวร์มีเซลล์จำนวน/สเปกว่าง (ต้นฉบับไม่ระบุ ไม่ได้แต่งเพิ่ม)
- H1/H4 ไม่มีเกณฑ์ตัวเลขในต้นฉบับ แสดง "–"
- เลขใหญ่ outline ของ chapter (01-10) และ pill ปุ่มยังคงเดิม ถ้าลูกค้ายังรู้สึกเป็นเทมเพลต ตัวถัดไปที่ควรปรับคือเลข chapter
- ไม่ได้ทดสอบ reduced-motion รอบนี้ (CSS reduced-motion เดิมยังอยู่ครบ)
