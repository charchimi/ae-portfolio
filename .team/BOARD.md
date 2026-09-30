# กระดานงาน — ae-portfolio

รูปแบบ: `| ID | งาน | owner | สถานะ | ไฟล์ที่ถือ | ขึ้นกับ |`
สถานะ: todo · doing · done · blocked (ระบุเหตุผล)

| ID | งาน | owner | สถานะ | ไฟล์ที่ถือ | ขึ้นกับ |
|---|---|---|---|---|---|
| T1 | ดึงข้อมูลจาก PDF + คัดคอนเทนต์ + optimize รูป | หัวหน้า | done | content/, site/assets/img/ | - |
| T2 | design direction + สร้างเว็บ one-page ทั้งหมด | frontend-dev | done | docs/DESIGN.md, site/** (ยกเว้น assets/img) | T1 |
| T3 | ทดสอบในเบราว์เซอร์ desktop/mobile, console, ลิงก์ | qa-tester | done (พบ bug ดู handoffs/qa-tester-T3.md) | tests/ (ถ้ามี) | T2 |
| T4 | SEO / perf / a11y audit | seo-perf-auditor | done | อ่านอย่างเดียว | T2 |
| T5 | เลือก host + deploy (รออนุมัติผู้ใช้) | devops | blocked (รอผู้ใช้เลือก host/บัญชี) | - | T3,T4 |
| T6 | Redesign v2: 3D hero, scrollytelling, micro-interactions, layout ใหม่ทุก chapter | frontend-dev | done | docs/DESIGN.md, site/index.html, site/assets/css/style.css, site/assets/js/** | T2 |
| T7 | ลดการ์ด → layout แบบ editorial/technical (hairline, ตาราง, spec sheet) ทุก chapter | frontend-dev | done | site/index.html, site/assets/css/style.css, site/assets/js/**, docs/DESIGN.md | T6 |
| T8 | แต่ละ chapter มี interaction/รูปแบบของตัวเองไม่ซ้ำกัน (แทน hairline ของ T7) | frontend-dev | done | site/index.html, site/assets/css/style.css, site/assets/js/**, docs/DESIGN.md | T7 |
| T9 | แก้ตาม feedback ลูกค้า 6 จุด: chapter header, H-selector ให้รู้ว่ากดได้, อุปกรณ์, ตาราง+กราฟความแม่นยำ, การ์ด 02/04 สลับแบบสับไพ่ | frontend-dev | done | site/index.html, site/assets/css/style.css, site/assets/js/** | T8 |
| T10 | ลบครูที่ปรึกษา + ม.5/1 เลขที่ ออกทั้งเว็บ (รวม JSON-LD), ออกแบบทีมใหม่, จัดหน้าเมนูใหม่ | frontend-dev | done | site/index.html, site/assets/css/style.css, site/assets/js/** | T9 |
| T11 | เตรียมขึ้น Google: meta/OG/JSON-LD/sitemap/robots + deploy + Search Console | devops + seo-perf-auditor | todo (host = GitHub Pages, charchimi.github.io/ae-portfolio · รอ T10) | site/robots.txt, site/sitemap.xml, deploy config | T10 |
