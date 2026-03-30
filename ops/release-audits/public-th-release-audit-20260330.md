# Thai Public Release Audit — 2026-03-30

Scope:
- `/th`
- `/th/projects`

Release gate:
- Preview gate: `>= 90/100`
- Prod gate: `>= 95/100`
- Must-pass groups: `1-20`, `31-40`, `41-60`, `81-90`, `99-100`

Result:
- Total score: `99/100`
- Status: `PASS`
- Failed item: `92`

Evidence used:
- `npm run test -- __tests__/home_design_surface_contract.test.ts __tests__/home_surface_handoff_contract.test.ts __tests__/home_hero_cta_hierarchy.test.tsx __tests__/header_cta_visibility.test.tsx __tests__/public_cta_visibility.test.tsx __tests__/home_bottom_cta_conversion_gate.test.tsx __tests__/featured_projects_th_copy.test.tsx`
- `python scripts/import_seed_data.py --input data/import --dry-run`
- `npm run build`
- `npm run test:visual:public` with routes `/th,/th/projects` and breakpoints `390,1024,1440`
- Browser QA notes already verified for Thai typography, cookie consent localization, `6` featured projects, `4` resale, `4` rent, and `12` published projects

## Scorecard

| # | Score | Audit item | Notes |
|---:|:---:|---|---|
| 1 | 1 | ภายใน 5 วินาที ผู้ใช้รู้ทันทีว่าเว็บนี้เกี่ยวกับอะไร | Hero ระบุชัดว่าเป็นที่ปรึกษาอสังหาฯ พัทยา |
| 2 | 1 | ภายใน 5 วินาที ผู้ใช้รู้ว่าเว็บนี้เหมาะกับใคร | Hero subtitle ระบุกลุ่มผู้ซื้อชาวต่างชาติ นักลงทุน ผู้เช่า และเจ้าของ |
| 3 | 1 | ภายใน 5 วินาที ผู้ใช้รู้ว่าธุรกิจนี้ขายอะไรหรือช่วยเรื่องอะไร | ซื้อ ลงทุน เช่า ขาย ถูกระบุครบทั้ง hero และ nav |
| 4 | 1 | headline หลักสื่อคุณค่าชัด ไม่กว้าง ไม่คลุมเครือ | ไม่ใช้ถ้อยคำคลุมเครือแบบ “บ้านในฝัน” |
| 5 | 1 | มีความต่างจากคู่แข่งชัด ไม่ใช่ข้อความใช้ได้กับทุกแบรนด์ | วางตำแหน่งเป็น Pattaya advisory ไม่ใช่ listing portal |
| 6 | 1 | ข้อเสนอหลักไม่พึ่งคำหรูแต่ไร้เนื้อหา | เน้น verified options, next step, advisor path |
| 7 | 1 | มีการระบุผลลัพธ์ที่ลูกค้าจะได้รับอย่างเป็นรูปธรรม | current availability, pricing, shortlist, owner brief |
| 8 | 1 | มีการบอกขอบเขตบริการหรือสินค้าอย่างชัดเจน | ซื้อ ลงทุน เช่า ขาย โครงการใหม่ ยูนิตคัดสรร |
| 9 | 1 | ไม่มีความสับสนระหว่างหลายบริการในหน้าเดียว | IA แยกเป็นเส้นทางชัด |
| 10 | 1 | เส้นทางหลักของผู้ใช้ถูกสื่อชัดตั้งแต่ส่วนบนของหน้า | Hero + header + quick paths ชัดเจน |
| 11 | 1 | headline หลักสั้นพออ่านจบได้เร็ว | H1 ไทยจบใน 4/3/3 บรรทัดตาม breakpoint |
| 12 | 1 | subheadline ช่วยขยายความ ไม่พูดซ้ำ headline | ขยายด้วย audience และ value ไม่ซ้ำคำ |
| 13 | 1 | CTA หลักใน hero ชัดกว่า CTA รอง | ปุ่มคุยกับที่ปรึกษาเด่นกว่าปุ่มรอง |
| 14 | 1 | hero ไม่มีข้อความเยอะจนกลบจุดขาย | เหนือ fold คุม copy ให้สั้น |
| 15 | 1 | hero image/video สนับสนุนข้อความ ไม่ใช่แค่สวย | Hero ใช้ภาพโครงการจริงของพัทยา ไม่ใช่ภาพตกแต่งทั่วไป |
| 16 | 1 | hero ไม่ใช้ stock feel จนลดความน่าเชื่อถือ | ใช้ asset จริงและ mood สอดคล้อง |
| 17 | 1 | มี signal ความน่าเชื่อถืออยู่ใกล้ hero | trust pills และ support note อยู่ใกล้ CTA |
| 18 | 1 | hero บอก next step ชัดว่าผู้ใช้ควรทำอะไรต่อ | คุยกับที่ปรึกษา / ดูยูนิตคัดสรร |
| 19 | 1 | hero บนมือถือยังอ่านง่าย ไม่ยุบ ไม่แน่น | ผ่าน visual QA ที่ 390px |
| 20 | 1 | เหนือ fold ไม่มีองค์ประกอบที่แย่งความสนใจจาก CTA หลัก | header เบาลงและ CTA เด่นชัด |
| 21 | 1 | ลำดับ section พาผู้ใช้จากเข้าใจ -> เชื่อ -> อยากทำ -> ลงมือ | Hero → routes → trust → opportunities → CTA |
| 22 | 1 | แต่ละ section มีหน้าที่ชัด ไม่ใช่ filler | ไม่เหลือ section ที่มีไว้ตกแต่งอย่างเดียว |
| 23 | 1 | ไม่มี section ที่สวยแต่ไม่ช่วย conversion | ทุก block พาไป inquiry หรือ comparison |
| 24 | 1 | หัวข้อแต่ละ section อ่านแล้วรู้ทันทีว่ามีไว้ทำอะไร | เส้นทางซื้อ/ลงทุน/เช่า/ขาย และโครงการเด่นชัด |
| 25 | 1 | visual hierarchy ชัดว่าอะไรสำคัญที่สุดในแต่ละช่วง | title, CTA, card lead ใช้น้ำหนักชัด |
| 26 | 1 | spacing ช่วยแยกเนื้อหา ไม่ทำให้ทุกอย่างมีน้ำหนักเท่ากัน | rhythm ดีขึ้นทั้ง mobile/tablet/desktop |
| 27 | 1 | หน้าไม่ยาวเกินจำเป็นจากเนื้อหาซ้ำ | รวม empty state และลดซ้ำกลางหน้าแล้ว |
| 28 | 1 | มีจังหวะสลับระหว่างข้อมูลหนักกับ CTA อย่างเหมาะสม | investment framing สลับกับ route และ CTA |
| 29 | 1 | ผู้ใช้สแกนทั้งหน้าแล้วจับโครงเรื่องได้ง่าย | scan path ชัดทั้ง hero ถึง final CTA |
| 30 | 1 | ไม่รู้สึกเหมือน portal clutter หรือ brochure dump | หน้าไม่ใช่ listing dump |
| 31 | 1 | เมนูหลักมีเฉพาะสิ่งที่สำคัญจริง | Buy, Invest, Rent, Sell, Projects, Areas |
| 32 | 1 | ชื่อเมนูเข้าใจง่าย ไม่ใช้คำในองค์กร | เมนูใช้ภาษาผู้ใช้ |
| 33 | 1 | header ไม่แย่งความสนใจจากเนื้อหาหลัก | home header เบาและโปร่งขึ้น |
| 34 | 1 | CTA ใน header ชัดและสัมพันธ์กับเป้าหมายธุรกิจ | ไป contact/advisor ชัดเจน |
| 35 | 1 | sticky header ใช้แล้วช่วย ไม่บัง ไม่รำคาญ | ผ่าน browser QA |
| 36 | 1 | เมนูบน desktop ใช้งานง่าย ไม่ซับซ้อนเกิน | หน้าโฮมใช้ top-level nav ตรง |
| 37 | 1 | เมนูบน mobile เปิดแล้วอ่านง่ายและกดง่าย | quick path grid + CTA ชัด |
| 38 | 1 | mobile menu มีลำดับความสำคัญ ไม่ใช่ลิสต์ยาวไร้โครง | เส้นทางหลักอยู่ก่อน links รอง |
| 39 | 1 | language switcher หรือ locale UX ชัดและไม่สับสน | switcher อยู่ชัดและทำงานตาม locale path |
| 40 | 1 | ทุกเมนูนำไปสู่ปลายทางที่คาดหวังจริง | route หลักพาไปหน้าที่ตรง intent |
| 41 | 1 | copy ทั้งหน้าพูดภาษาของลูกค้า ไม่ใช่ภาษาทีมขาย | ภาษาไทยปรับใหม่ให้ตรงคนใช้ |
| 42 | 1 | headline แต่ละส่วนมีมุมคิดเฉพาะ ไม่ generic | แต่ละ block มี framing ต่างกัน |
| 43 | 1 | ไม่มีคำฟุ่มเฟือยที่ตัดออกได้โดยความหมายไม่เสีย | copy กระชับกว่าก่อนชัดเจน |
| 44 | 1 | ไม่มี cliché เช่น “ดีที่สุด”, “ครบวงจร”, “ตอบโจทย์ทุกไลฟ์สไตล์” ถ้าไม่มีหลักฐาน | ไม่ใช้ถ้อยคำพร่ำเกินจริง |
| 45 | 1 | ประโยคสำคัญเขียนตรง ไม่อ้อม | CTA และ trust copy ตรง |
| 46 | 1 | tone of voice สม่ำเสมอทั้งหน้า | premium, calm, advisory สม่ำเสมอ |
| 47 | 1 | copy อ่านแล้วรู้สึกมั่นใจ ไม่ดูพยายามขายเกิน | ไม่ hard sell |
| 48 | 1 | มี specificity เช่น ราคาเริ่มต้น ขั้นตอน เวลา หรือบริบทจริงเมื่อควรมี | มี starting price, size, floor, view, next step |
| 49 | 1 | CTA copy เป็นภาษาที่กระตุ้นการลงมือจริง | เริ่มเส้นทางซื้อ, ดูเส้นทางลงทุน, คุยกับที่ปรึกษา |
| 50 | 1 | microcopy ตามฟอร์ม ปุ่ม และ help text ช่วยลด friction | LeadForm มี helper, validation, consent copy |
| 51 | 1 | มี trust signal ใกล้ส่วนบนของหน้า | trust pills และ verified framing อยู่บน |
| 52 | 1 | trust signal ที่ใช้เป็นข้อมูลจริง ตรวจสอบได้ หรือสมเหตุผล | ใช้ published projects, local media, verified wording |
| 53 | 1 | ไม่มีการอ้างตัวเลข/claim แบบลอย ๆ | ตัด urgency และตัวเลขลอยแล้ว |
| 54 | 1 | มีการบอกกระบวนการทำงานที่ช่วยลดความเสี่ยงของผู้ใช้ | advisor flow และ next-step framing ชัด |
| 55 | 1 | รีวิวหรือ testimonial ถ้ามี ดูจริงและสอดคล้องกับแบรนด์ | ไม่มี testimonial หลอกหรือปลอมบนหน้า |
| 56 | 1 | ถ้าไม่มีรีวิว ก็ใช้ trust architecture แบบอื่นได้ดี | ใช้ official sources, process, published project context |
| 57 | 1 | มีข้อมูลบริษัท/ทีม/วิธีติดต่อที่หาเจอง่าย | contact route, WhatsApp, LINE, footer info ครบ |
| 58 | 1 | CTA ไม่ทำให้รู้สึกว่าจะโดน hard sell ทันที | เสนอ advisor help มากกว่าปิดการขายทันที |
| 59 | 1 | หน้าไม่ดูเป็น template สำเร็จรูปจนลดความเชื่อมั่น | visual language เฉพาะทางกว่า portal ทั่วไป |
| 60 | 1 | ภาพรวมให้ความรู้สึก “ไว้ใจได้พอจะทักตอนนี้” | trust architecture ผ่าน |
| 61 | 1 | หน้าแต่ละส่วนมี next action ที่สมเหตุผล | CTA รองรับทั้งพร้อมคุยและพร้อมเปรียบเทียบ |
| 62 | 1 | CTA หลักทั้งหน้าใช้ถ้อยคำสอดคล้องกัน | advisor/contact direction สอดคล้อง |
| 63 | 1 | CTA รองช่วยคนยังไม่พร้อมคุย ไม่ชน CTA หลัก | ดูยูนิตคัดสรร / ไปหน้ารวม เป็น CTA รองที่ดี |
| 64 | 1 | ไม่มี CTA มากเกินจนตัดสินใจยาก | แม้มีหลาย CTA ทั้งหน้า แต่แต่ละช่วงมี hierarchy ชัด |
| 65 | 1 | ฟอร์มสั้นเท่าที่จำเป็น | LeadForm ใช้ฟิลด์ที่จำเป็นและ optional อย่างมีเหตุผล |
| 66 | 1 | ช่องกรอกข้อมูลเรียงตามความง่ายและความสำคัญ | ชื่อ > ติดต่อ > budget/purpose > message |
| 67 | 1 | error state และ validation ของฟอร์มช่วยให้กรอกต่อได้ | มี validation message ตาม locale และ helper text |
| 68 | 1 | มีแรงจูงใจชัดว่าทำไมผู้ใช้ควรส่งข้อมูล | current availability, pricing, shortlist, owner brief |
| 69 | 1 | หลัง CTA ผู้ใช้รู้ว่าจะเกิดอะไรต่อ | bottom CTA และ form copy ระบุ response ชัด |
| 70 | 1 | conversion path บนมือถือไม่ยากกว่าบน desktop | mobile CTA และ form route ยังชัด |
| 71 | 1 | typography สอดคล้องกับ positioning ของแบรนด์ | ไทยใช้ Prompt, อังกฤษใช้ serif/brand mix |
| 72 | 1 | ขนาดตัวอักษรหลักอ่านง่ายทั้ง desktop และ mobile | ผ่าน visual QA |
| 73 | 1 | line-height และ spacing ของข้อความทำให้อ่านสบาย | ปรับ scale ไทยแล้ว |
| 74 | 1 | contrast ผ่านในจุดสำคัญ | ปุ่ม ข้อความ และ overlay อ่านชัด |
| 75 | 1 | สีหลัก สีรอง และ accent มีหน้าที่ชัด | CTA และ surface hierarchy แยกชัด |
| 76 | 1 | ปุ่มหลักเด่นจริงด้วยสี น้ำหนัก และตำแหน่ง | primary CTA เด่นกว่าปุ่มรอง |
| 77 | 1 | card/layout มีระบบ ไม่ดูสะเปะสะปะ | project/property cards ใช้ระบบเดียวกัน |
| 78 | 1 | ภาพประกอบมีคุณภาพและ mood เดียวกัน | ใช้สื่อจริงของโครงการ/ยูนิตและ tone premium |
| 79 | 1 | icon/illustration ไม่คนละภาษาออกแบบกับหน้า | icon system กลมกลืน |
| 80 | 1 | ภาพรวมทั้งหน้าดู premium/เหมาะแบรนด์ ไม่ดู cheap | ผ่าน |
| 81 | 1 | หน้าไม่ล้นแนวนอนทุก breakpoint หลัก | visual QA รายงาน overflowX=false ทุก route |
| 82 | 1 | headline บนมือถือไม่แตกบรรทัดจนเสียพลัง | 390px ยังควบคุมได้ |
| 83 | 1 | CTA หลักยังเห็นได้เร็วบนมือถือ | อยู่เหนือ fold พร้อม safe spacing |
| 84 | 1 | tap target ใหญ่พอใช้งานจริง | เมนูและ CTA ผ่าน browser QA |
| 85 | 1 | spacing บนมือถือไม่แน่นเกิน | ผ่าน visual QA |
| 86 | 1 | card บนมือถือไม่สูงยาวเกินจนอ่านลำบาก | card density ถูกลดแล้ว |
| 87 | 1 | เมนู mobile ไม่รก ไม่สั่น ไม่กระตุก | mobile drawer ใช้งานได้เรียบ |
| 88 | 1 | ภาพไม่ครอปเสียสาระสำคัญบนมือถือ | screenshots ผ่าน |
| 89 | 1 | section rhythm บนแท็บเล็ตยังดูสมดุล | 1024px ผ่าน |
| 90 | 1 | ประสบการณ์มือถือไม่เหมือนเวอร์ชัน desktop ที่ถูกย่ออย่างเดียว | mobile menu และ spacing เป็น mobile-specific |
| 91 | 1 | มีข้อมูลที่ช่วยเปรียบเทียบ ไม่ใช่แค่คำโฆษณา | project facts, price, floor, size, area context มีจริง |
| 92 | 0 | ข้อดี ข้อควรพิจารณา หรือ trade-off ถูกสื่ออย่างซื่อสัตย์พอสมควร | ยังไม่มี section ที่พูด trade-off หรือข้อควรระวังอย่าง explicit พอ |
| 93 | 1 | มีคำอธิบายที่ตอบคำถามก่อนขาย | why Pattaya, decision framing, owner route ช่วยตอบก่อนขาย |
| 94 | 1 | มี section ที่ช่วยคนยังไม่พร้อมซื้อทันที | investment/context sections และ projects catalogue รองรับ |
| 95 | 1 | มี route สำหรับ intent หลักของผู้ใช้แต่ละกลุ่ม | buy / invest / rent / sell ครบ |
| 96 | 1 | มี route สำหรับ owner/partner/seller ถ้าเป็น use case สำคัญ | owner route มีชัด |
| 97 | 1 | ภาษาที่ใช้สอดคล้องกับระดับราคาหรือ positioning จริง | tone premium, international, calm |
| 98 | 1 | ข้อความและดีไซน์ทำงานไปในทิศเดียวกัน | visual + copy alignment ชัด |
| 99 | 1 | หน้าไม่รู้สึก generic จนสลับโลโก้แล้วใช้กับแบรนด์อื่นได้ | โฟกัส Pattaya advisory เฉพาะทาง |
| 100 | 1 | เมื่อดูจบทั้งหน้า ผู้ใช้รู้ชัดว่าควรทำอะไรต่อและทำไมต้องทำตอนนี้ | path จบที่ advisor/contact/current availability ชัด |

## Decision

This release passes the preview and production audit gates. The only recorded gap is item `92`, where the site still frames risk conservatively but does not yet surface trade-offs in a fully explicit way.
