// AMP Demo Website - i18n (Internationalization)
// Complete bilingual support (Thai/English)

const TRANSLATIONS = {
  th: {
    // Navigation
    nav_home: 'หน้าหลัก',
    nav_rent: 'เช่า',
    nav_buy: 'ซื้อ',
    nav_about: 'เกี่ยวกับเรา',
    nav_contact: 'ติดต่อเรา',
    nav_projects: 'โครงการ',
    nav_invest: 'ลงทุน',
    nav_admin: 'แอดมิน',

    // Hero
    hero_title: 'ค้นหาทรัพย์สินในพัทยา',
    hero_subtitle: 'ข้อมูลชัด ตอบไว ดูแลครบ',

    // Search
    search_intent_rent: 'เช่า',
    search_intent_buy: 'ซื้อ',
    search_type: 'ประเภท',
    search_area: 'พื้นที่',
    search_price: 'ราคา',
    search_beds: 'ห้องนอน',
    search_button: 'ค้นหา',
    search_looking_to: 'ต้องการ',
    search_property_type: 'ประเภททรัพย์สิน',
    search_all_types: 'ทุกประเภท',
    search_all_areas: 'ทุกพื้นที่',

    // Property
    prop_beds: 'ห้องนอน',
    prop_baths: 'ห้องน้ำ',
    prop_sqm: 'ตร.ม.',
    prop_view_detail: 'ดูรายละเอียด',
    prop_featured: 'แนะนำ',
    prop_available: 'พร้อมเข้าอยู่',
    prop_new: 'ใหม่',
    prop_per_month: '/เดือน',
    prop_month: 'เดือน',

    // Sections
    section_featured: 'อสังหาแนะนำ',
    section_popular_areas: 'พื้นที่ยอดนิยม',
    section_latest: 'ประกาศล่าสุด',

    // Lead Form
    form_name: 'ชื่อ-นามสกุล',
    form_phone: 'เบอร์โทรศัพท์',
    form_email: 'อีเมล',
    form_message: 'ข้อความ',
    form_submit: 'ส่งข้อมูล',
    form_success: 'ส่งข้อมูลสำเร็จ!',
    form_send: 'ส่ง',

    // Footer
    footer_contact: 'ติดต่อเรา',
    footer_quick_links: 'ลิงก์ด่วน',
    footer_follow: 'ติดตามเรา',
    footer_copyright: '© 2026 Asset Management Property. สงวนลิขสิทธิ์.',
    footer_about_us: 'เกี่ยวกับเรา',
    footer_properties: 'รายการอสังหา',
    footer_services: 'บริการ',
    footer_contact_us: 'ติดต่อเรา',

    // Admin
    admin_login: 'เข้าสู่ระบบ',
    admin_email: 'อีเมล',
    admin_password: 'รหัสผ่าน',
    admin_dashboard: 'แดชบอร์ด',
    admin_properties: 'รายการอสังหา',
    admin_leads: 'ลีด',
    admin_reports: 'รายงาน',
    admin_settings: 'ตั้งค่า',
    admin_logout: 'ออกจากระบบ',
    admin_total_properties: 'อสังหาทั้งหมด',
    admin_active: 'เปิดใช้งาน',
    admin_leads_today: 'ลีดวันนี้',
    admin_leads_week: 'ลีดสัปดาห์นี้',
    admin_recent_leads: 'ลีดล่าสุด',
    admin_recent_activities: 'กิจกรรมล่าสุด',
    admin_sync_sheet: 'Sync จาก Sheet',
    admin_export_data: 'Export ข้อมูล',
    admin_qa_report: 'รายงาน QA',
    admin_view_site: 'ดูเว็บไซต์',
    admin_remember_me: 'จดจำฉัน',
    admin_forgot_password: 'ลืมรหัสผ่าน?',
    admin_welcome_back: 'ยินดีต้อนรับกลับ',
    admin_login_subtitle: 'เข้าสู่ระบบเพื่อจัดการอสังหาและลีด',

    // About Page
    about_title: 'เกี่ยวกับเรา',
    about_subtitle: 'บริษัทจัดการอสังหาที่คุณไว้ใจ',
    about_intro: 'Asset Management Property เป็นบริษัทบริหารและจัดการอสังหาริมทรัพย์ชั้นนำในพัทยา',
    about_why_choose: 'ทำไมต้องเลือก AMP',
    about_team: 'ทีมงานของเรา',
    about_location: 'สำนักงานของเรา',
    about_hero_title: 'เกี่ยวกับเรา / About Us',
    about_hero_subtitle: 'พาร์ทเนอร์ที่คุณไว้วางใจในการจัดการอสังหาริมทรัพย์ในพัทยา',
    about_intro_title: 'เกี่ยวกับบริษัท',
    about_intro_p1: 'Asset Management Property (AMP) เป็นบริษัทจัดการอสังหาริมทรัพย์ชั้นนำในพัทยา ที่เชี่ยวชาญด้านอสังหาที่อยู่อาศัยและเชิงพาณิชย์ ด้วยประสบการณ์กว่า 10 ปีในอุตสาหกรรมอสังหาริมทรัพย์ เราได้ช่วยเหลือลูกค้าหลายพันรายในการค้นหาทรัพย์สินในฝันและบริหารการลงทุนอย่างมีประสิทธิภาพ',
    about_intro_p2: 'ทีมงานมืออาชีพของเรามีความเข้าใจในตลาดท้องถิ่น และให้บริการที่ปรับแต่งตามความต้องการเฉพาะของลูกค้าแต่ละราย ไม่ว่าคุณจะต้องการเช่า ซื้อ หรือขายอสังหาริมทรัพย์ในพัทยา เราพร้อมเสนอโซลูชันที่ครบครันด้วยความเชี่ยวชาญและความมุ่งมั่นสู่ความเป็นเลิศ',
    about_intro_p3: 'ที่ AMP เราเชื่อในการสร้างความสัมพันธ์ระยะยาวกับลูกค้าผ่านความโปร่งใส ความเป็นมืออาชีพ และการบริการที่เหนือชั้น พันธกิจของเราคือการทำให้ธุรกรรมอสังหาริมทรัพย์เป็นเรื่องที่ราบรื่น ไร้ความยุ่งยาก และคุ้มค่าสำหรับทุกคนที่เกี่ยวข้อง',
    about_why_title: 'ทำไมต้องเลือก AMP',
    about_why_subtitle: 'สิ่งที่ทำให้เราแตกต่าง',
    about_feature_clear_title: 'ข้อมูลชัดเจน',
    about_feature_clear_desc: 'ข้อมูลชัด - รายละเอียดทรัพย์สินที่ครบถ้วนและถูกต้อง พร้อมราคาและเงื่อนไขที่โปร่งใส ไม่มีค่าใช้จ่ายแอบแฝง',
    about_feature_fast_title: 'ตอบกลับรวดเร็ว',
    about_feature_fast_desc: 'ตอบไว - ตอบกลับทุกคำถามอย่างรวดเร็ว เราให้ความสำคัญกับเวลาของคุณและรับประกันการสื่อสารที่รวดเร็วผ่านหลายช่องทาง',
    about_feature_service_title: 'บริการครบวงจร',
    about_feature_service_desc: 'ดูแลครบ - บริการจัดการอสังหาริมทรัพย์อย่างครบวงจร ตั้งแต่การค้นหาจนถึงการเซ็นสัญญาและอื่นๆ เราอยู่เคียงข้างคุณทุกขั้นตอน',
    about_feature_team_title: 'ทีมผู้เชี่ยวชาญ',
    about_feature_team_desc: 'ทีมมืออาชีพ - ทีมมืออาชีพที่มีความรู้ตลาดท้องถิ่นอย่างกว้างขวางและประสบการณ์หลายปีในการจัดการอสังหาริมทรัพย์',
    about_team_title: 'พบกับทีมของเรา',
    about_team_subtitle: 'ผู้เชี่ยวชาญที่เชี่ยวชาญเพื่อความสำเร็จของคุณ',
    about_team_member1_name: 'สมชาย ทานากะ',
    about_team_member1_position: 'กรรมการผู้จัดการ',
    about_team_member1_bio: 'ประสบการณ์ 15+ ปีในการจัดการอสังหาริมทรัพย์ โดยเชี่ยวชาญด้านอสังหาหรูและการบริการลูกค้าต่างชาติ',
    about_team_member2_name: 'ซาร่าห์ จอห์นสัน',
    about_team_member2_position: 'ที่ปรึกษาอสังหาริมทรัพย์อาวุโส',
    about_team_member2_bio: 'เชี่ยวชาญด้านอสังหาที่อยู่อาศัย พูดภาษาอังกฤษ ไทย และเยอรมัน ประสบการณ์ 10 ปี',
    about_team_member3_name: 'อเล็กซ์ เฉิน',
    about_team_member3_position: 'ผู้จัดการฝ่ายการตลาด',
    about_team_member3_bio: 'ผู้เชี่ยวชาญด้านการตลาดดิจิทัลและการโปรโมทอสังหา ประสบการณ์ 8 ปีในการตลาดอสังหาริมทรัพย์',
    about_team_member4_name: 'ณัฐธิดา เปรม',
    about_team_member4_position: 'ผู้จัดการฝ่ายลูกค้าสัมพันธ์',
    about_team_member4_bio: 'มุ่งมั่นสร้างประสบการณ์ที่ดีให้กับลูกค้า ประสบการณ์ 12 ปีในการบริการและอสังหาริมทรัพย์',
    about_location_title: 'เยี่ยมชมสำนักงานของเรา',
    about_location_subtitle: 'เราพร้อมช่วยเหลือคุณ',
    about_location_address_title: 'ที่อยู่สำนักงาน',
    about_location_address: '123/45 ถนนหาดพัทยา<br>พัทยา ชลบุรี 20150<br>ประเทศไทย',
    about_location_phone_title: 'โทรศัพท์',
    about_location_email_title: 'อีเมล',
    about_location_hours_title: 'เวลาทำการ',
    about_location_hours: 'จันทร์ - อาทิตย์<br>9:00 - 18:00 น.',

    // Contact Page
    contact_title: 'ติดต่อเรา',
    contact_subtitle: 'เราพร้อมให้บริการและตอบคำถามของคุณ',
    contact_info: 'ข้อมูลติดต่อ',
    contact_hours: 'เวลาทำการ',
    contact_form_title: 'ส่งข้อความถึงเรา',
    contact_address: 'ที่อยู่',
    contact_property_interest: 'สนใจอสังหาประเภท',

    // Property Types
    type_condo: 'คอนโด',
    type_house: 'บ้าน',
    type_villa: 'วิลล่า',
    type_townhouse: 'ทาวน์เฮาส์',

    // Common
    common_view_all: 'ดูทั้งหมด',
    common_loading: 'กำลังโหลด...',
    common_search: 'ค้นหา',
    common_filter: 'กรอง',
    common_sort: 'เรียงลำดับ',
    common_save: 'บันทึก',
    common_cancel: 'ยกเลิก',
    common_edit: 'แก้ไข',
    common_delete: 'ลบ',
    common_close: 'ปิด',

    // Thank You Page
    thank_you_title: 'ขอบคุณที่ติดต่อเรา!',
    thank_you_message: 'เราได้รับข้อมูลของคุณแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด<br>โดยปกติภายใน 24 ชั่วโมง',
    back_to_home: 'กลับหน้าหลัก',
    view_properties: 'ดูอสังหา',
    need_urgent_help: 'ต้องการความช่วยเหลือด่วน?',

    // Projects
    nav_projects: 'โครงการ',
    nav_all_projects: 'โครงการทั้งหมด',
    nav_pre_sale: 'โครงการ Pre-Sale',
    nav_condos: 'คอนโด',
    nav_villas: 'วิลล่า',
    projects_title: 'โครงการพัทยา',
    projects_subtitle: 'ค้นหาโครงการใหม่และโครงการกำลังพัฒนา',
    project_status: 'สถานะ',
    project_type: 'ประเภท',
    project_area: 'พื้นที่',
    project_price_range: 'ช่วงราคา',
    project_all: 'ทั้งหมด',
    project_pre_sale: 'Pre-Sale',
    project_under_construction: 'กำลังก่อสร้าง',
    project_ready_to_move: 'พร้อมอยู่',
    project_condo: 'คอนโด',
    project_villa: 'วิลล่า/บ้าน',
    project_progress: 'ความคืบหน้า',
    project_units_available: 'ยูนิตว่าง',
    project_yield: 'ผลตอบแทน',
    project_foreign_quota: 'โควต้าต่างชาติ',
    project_developer: 'ผู้พัฒนา',
    project_promotions: 'โปรโมชั่น',
    project_facilities: 'สิ่งอำนวยความสะดวก',
    project_unit_types: 'ประเภทยูนิต',
    project_floor_plans: 'แปลนห้อง',
    project_location: 'ทำเล',
    project_view_detail: 'ดูรายละเอียด',
    project_contact: 'ติดต่อสอบถาม',

    // Investment
    nav_invest: 'การลงทุน',
    nav_invest_hub: 'Investment Hub',
    nav_calculator: 'คำนวณผลตอบแทน',
    nav_thai_investor: 'นักลงทุนไทย',
    nav_foreign_investor: 'นักลงทุนต่างชาติ',
    nav_rental_management: 'บริการให้เช่า',
    invest_title: 'ลงทุนอสังหาพัทยา',
    invest_subtitle: 'ข้อมูลครบ เริ่มต้นง่าย ผลตอบแทนดี',
    invest_why_pattaya: 'ทำไมต้องลงทุนพัทยา',
    invest_calculator: 'คำนวณผลตอบแทน',
    invest_guides: 'คู่มือการลงทุน',
    calc_title: 'เครื่องคำนวณผลตอบแทนการลงทุน',
    calc_subtitle: 'คำนวณผลตอบแทนจากการลงทุนอสังหาฯ',
    calc_property_price: 'ราคาอสังหา (บาท)',
    calc_down_payment: 'เงินดาวน์ (%)',
    calc_interest_rate: 'อัตราดอกเบี้ย (%/ปี)',
    calc_loan_term: 'ระยะเวลาผ่อน (ปี)',
    calc_monthly_rent: 'ค่าเช่ารายเดือน (บาท)',
    calc_monthly_expense: 'ค่าใช้จ่ายรายเดือน (บาท)',
    calc_calculate: 'คำนวณ',
    calc_results: 'ผลการคำนวณ',
    calc_gross_yield: 'ผลตอบแทนขั้นต้น',
    calc_net_yield: 'ผลตอบแทนสุทธิ',
    calc_monthly_cash_flow: 'กระแสเงินสดรายเดือน',
    calc_payback_period: 'ระยะเวลาคืนทุน',
    calc_download_pdf: 'ดาวน์โหลด PDF',
    calc_error_invalid_price: 'กรุณากรอกราคาอสังหาที่ถูกต้อง',
    calc_error_invalid_rent: 'กรุณากรอกค่าเช่ารายเดือนที่ถูกต้อง',
    calc_error_invalid_down_payment: 'เงินดาวน์ต้องอยู่ระหว่าง 0-100%',
    calc_error_negative_value: 'กรุณากรอกค่าที่มากกว่า 0',
    thai_investor_title: 'คู่มือนักลงทุนไทย',
    thai_investor_subtitle: 'ข้อมูลครบถ้วนสำหรับการลงทุนอสังหาในพัทยา',
    thai_investor_steps: 'ขั้นตอนการลงทุน',
    thai_investor_benefits: 'ข้อดีของการลงทุน',
    thai_investor_tips: 'เทคนิคสำหรับมือใหม่',
    thai_investor_faq: 'คำถามที่พบบ่อย',
    foreign_investor_title: 'Foreign Investor Guide',
    foreign_investor_subtitle: 'Complete guide for foreign property investment in Pattaya',
    foreign_investor_ownership: 'Ownership Rules',
    foreign_investor_visa: 'Visa Options',
    foreign_investor_money_transfer: 'Money Transfer Guide',
    rental_mgmt_title: 'บริการบริหารการให้เช่า',
    rental_mgmt_subtitle: 'ให้เราดูแลอสังหาของคุณ รับเงินค่าเช่าทุกเดือน',

    // Area Guide
    nav_area_guide: 'คู่มือพื้นที่',
    area_guide_title: 'คู่มือพื้นที่พัทยา',
    area_guide_subtitle: 'เลือกทำเลที่เหมาะกับคุณ',
    area_avg_price: 'ราคาเฉลี่ย/ตร.ม.',
    area_price_trend: 'แนวโน้มราคา',
    area_demographics: 'กลุ่มคนอยู่',
    area_pros: 'ข้อดี',
    area_cons: 'ข้อเสีย',
    area_projects_in_area: 'โครงการในพื้นที่',
    area_explore: 'สำรวจพื้นที่',

    // Quiz
    quiz_title: 'ค้นหาอสังหาที่ใช่สำหรับคุณ',
    quiz_subtitle: 'ตอบคำถาม 5 ข้อ เพื่อรับคำแนะนำที่เหมาะกับคุณ',
    quiz_start: 'เริ่มทำแบบทดสอบ',
    quiz_next: 'ถัดไป',
    quiz_prev: 'ย้อนกลับ',
    quiz_finish: 'ดูผลลัพธ์',
    quiz_q1: 'วัตถุประสงค์หลักของคุณคืออะไร?',
    quiz_q1_live: 'อยู่อาศัย',
    quiz_q1_invest: 'ลงทุนให้เช่า',
    quiz_q1_vacation: 'บ้านพักตากอากาศ',
    quiz_q1_retire: 'เกษียณ',
    quiz_q2: 'งบประมาณของคุณเท่าไหร่?',
    quiz_q2_under2: 'ต่ำกว่า 2 ล้านบาท',
    quiz_q2_2to5: '2-5 ล้านบาท',
    quiz_q2_5to10: '5-10 ล้านบาท',
    quiz_q2_over10: 'มากกว่า 10 ล้านบาท',
    quiz_q3: 'คุณชอบอสังหาประเภทไหน?',
    quiz_q3_condo: 'คอนโด (บำรุงรักษาง่าย)',
    quiz_q3_villa: 'วิลล่า/บ้าน (มีพื้นที่ส่วนตัว)',
    quiz_q3_both: 'ทั้งคู่ (ยืดหยุ่น)',
    quiz_q4: 'ความชอบด้านไลฟ์สไตล์?',
    quiz_q4_beach: 'ติดชายหาด',
    quiz_q4_city: 'ใจกลางเมือง',
    quiz_q4_quiet: 'เงียบสงบ',
    quiz_q4_family: 'เหมาะครอบครัว',
    quiz_q5: 'ต้องการซื้อเมื่อไหร่?',
    quiz_q5_immediately: 'พร้อมอยู่ทันที',
    quiz_q5_3months: '1-3 เดือน',
    quiz_q5_6months: '3-6 เดือน',
    quiz_q5_1year: 'มากกว่า 1 ปี',
    quiz_results_title: 'ผลการค้นหาของคุณ',
    quiz_results_subtitle: 'นี่คือคำแนะนำที่เหมาะสมกับคุณ',
    quiz_recommended_areas: 'พื้นที่แนะนำ',
    quiz_recommended_types: 'ประเภทอสังหาแนะนำ',
    quiz_recommended_projects: 'โครงการแนะนำ',
    quiz_restart: 'ทำใหม่อีกครั้ง',
    quiz_contact_us: 'ติดต่อเราเพื่อคำแนะนำเพิ่มเติม',

    // Investment Calculator
    calc_title: 'เครื่องคำนวณ ROI การลงทุน',
    calc_subtitle: 'คำนวณผลตอบแทนที่คาดหวัง',
    calc_property_price: 'ราคาอสังหา (฿)',
    calc_down_payment: 'เงินดาวน์ (%)',
    calc_interest_rate: 'ดอกเบี้ย (%/ปี)',
    calc_loan_term: 'ระยะเวลากู้ (ปี)',
    calc_monthly_rent: 'ค่าเช่าต่อเดือน (฿)',
    calc_monthly_expense: 'ค่าใช้จ่ายต่อเดือน (฿)',
    calc_calculate: 'คำนวณ',
    calc_gross_yield: 'Gross Yield',
    calc_net_yield: 'Net Yield',
    calc_cash_flow: 'กระแสเงินสดต่อเดือน',
    calc_payback_period: 'ระยะเวลาคืนทุน',
    calc_download_pdf: 'ดาวน์โหลดรายงาน PDF',
    calc_consult: 'ปรึกษาผู้เชี่ยวชาญ',
    calc_error_invalid_price: 'กรุณากรอกราคาอสังหาที่ถูกต้อง',
    calc_error_invalid_down_payment: 'เงินดาวน์ต้องอยู่ระหว่าง 0-100%',
    calc_error_invalid_rent: 'กรุณากรอกค่าเช่าต่อเดือนที่ถูกต้อง',
    calc_error_negative_value: 'ค่าต้องไม่ติดลบ',

    // Mortgage Calculator
    mortgage_title: 'เครื่องคำนวณสินเชื่อบ้าน',
    mortgage_subtitle: 'คำนวณยอดผ่อนต่อเดือน',
    mortgage_monthly_payment: 'ผ่อนต่อเดือน',
    mortgage_total_interest: 'ดอกเบี้ยรวม',
    mortgage_total_payment: 'ยอดชำระรวม',
    mortgage_recommended_banks: 'ธนาคารที่แนะนำ',

    // Area Guide
    area_description: 'คำอธิบาย',
    area_residents: 'กลุ่มผู้อยู่อาศัย',
    area_highlights: 'จุดเด่น',
    area_nearby: 'สถานที่ใกล้เคียง',
    area_hospital: 'โรงพยาบาล',
    area_mall: 'ห้างสรรพสินค้า',
    area_airport: 'สนามบิน',
    area_view_properties: 'ดูอสังหาในพื้นที่นี้',

    // Trust Signals
    trust_licensed: 'ได้รับใบอนุญาตจากกรมที่ดิน',
    trust_experience: 'ปีของประสบการณ์',
    trust_properties_sold: 'ทรัพย์ที่ขายสำเร็จ',
    trust_languages: 'ภาษา',
    trust_google_rating: 'คะแนน Google',
    trust_reviews: 'รีวิว',
    trust_why_amp: 'ทำไมต้องเลือก AMP',
    trust_professional: 'ทีมมืออาชีพ',
    trust_multilingual: 'รองรับหลายภาษา',
    trust_full_service: 'บริการครบวงจร',

    // Market Stats
    market_title: 'ข้อมูลตลาด',
    market_subtitle: 'แนวโน้มและสถิติตลาดล่าสุด',
    market_avg_price_by_type: 'ราคาเฉลี่ยตามประเภท',
    market_hot_areas: 'พื้นที่ฮอต',
    market_rental_yield: 'ผลตอบแทนจากการเช่า',
    market_occupancy_rate: 'อัตราการเข้าพัก',
    market_download_report: 'ดาวน์โหลดรายงานฉบับเต็ม',
    market_price_per_sqm: 'ต่อ ตร.ม.',
    market_yoy_change: 'เปลี่ยนแปลง YoY',
    market_gross: 'ขั้นต้น',
    market_net: 'สุทธิ',

    // Testimonials
    testimonial_title: 'ความคิดเห็นจากลูกค้า',
    testimonial_subtitle: 'รีวิวจริงจากลูกค้าจริง',
    testimonial_verified: 'ซื้อยืนยันแล้ว',

    // Compare Properties
    compare_title: 'เปรียบเทียบอสังหา',
    compare_add: 'เพิ่มเพื่อเปรียบเทียบ',
    compare_remove: 'ลบออกจากการเปรียบเทียบ',
    compare_view: 'ดูการเปรียบเทียบ',
    compare_coming_soon: 'เร็วๆ นี้',
    compare_max_3: 'เปรียบเทียบได้สูงสุด 3 ทรัพย์',

    // Saved Searches
    saved_title: 'การค้นหาที่บันทึก',
    saved_create: 'บันทึกการค้นหานี้',
    saved_alerts: 'รับการแจ้งเตือน',
    saved_frequency: 'ความถี่การแจ้งเตือน',
    saved_immediately: 'ทันที',
    saved_daily: 'รายวัน',
    saved_weekly: 'รายสัปดาห์',
    saved_coming_soon: 'เร็วๆ นี้',
    saved_description: 'บันทึกเกณฑ์การค้นหาและรับการแจ้งเตือนเมื่อมีอสังหาใหม่ที่ตรงกัน',
    saved_example1_title: 'คอนโดในจอมเทียน 2 ห้องนอน ต่ำกว่า 3 ล้าน',
    saved_example1_alert: 'แจ้งเตือน: รายวัน',
    saved_example2_title: 'วิลล่าในพระตำหนัก วิวทะเล',
    saved_example2_alert: 'แจ้งเตือน: ทันที',
    saved_edit: 'แก้ไข',

    // Compare Properties  
    compare_property_1: 'อสังหา 1',
    compare_property_2: 'อสังหา 2',
    compare_property_3: 'อสังหา 3',
    compare_property_metrics: 'ราคา, ขนาด, ผลตอบแทน',

    // Mobile
    mobile_line: 'LINE',
    mobile_call: 'โทร',
    mobile_calculate: 'คำนวณ',
    mobile_save: 'บันทึก',

    // Rental Management
    rental_title: 'บริการบริหารการเช่า',
    rental_subtitle: 'เราดูแลอสังหาของคุณแทนคุณ',
    rental_services: 'บริการของเรา',
    rental_tenant_finding: 'หาผู้เช่า',
    rental_maintenance: 'ซ่อมบำรุง',
    rental_collection: 'เก็บค่าเช่า',
    rental_reporting: 'รายงานรายเดือน',
    rental_pricing: 'ค่าบริการ',
    rental_performance: 'ผลงานของเรา',
    rental_occupancy: 'อัตราการเช่าเฉลี่ย',
    rental_response_time: 'เวลาตอบกลับเฉลี่ย',

    // Developer Profiles
    developer_rating: 'คะแนน',
    developer_delivered: 'โครงการที่ส่งมอบแล้ว',
    developer_ongoing: 'โครงการที่กำลังดำเนินการ',
    developer_established: 'ก่อตั้ง',
    developer_specialties: 'ความเชี่ยวชาญ',
    developer_reviews: 'รีวิวจากลูกค้า',
  },
  en: {
    // Navigation
    nav_home: 'Home',
    nav_rent: 'Rent',
    nav_buy: 'Buy',
    nav_about: 'About',
    nav_contact: 'Contact',
    nav_projects: 'Projects',
    nav_invest: 'Invest',
    nav_admin: 'Admin',

    // Hero
    hero_title: 'Find Properties in Pattaya',
    hero_subtitle: 'Clear Info, Fast Response, Full Service',

    // Search
    search_intent_rent: 'Rent',
    search_intent_buy: 'Buy',
    search_type: 'Type',
    search_area: 'Area',
    search_price: 'Price',
    search_beds: 'Bedrooms',
    search_button: 'Search',
    search_looking_to: 'Looking to',
    search_property_type: 'Property Type',
    search_all_types: 'All Types',
    search_all_areas: 'All Areas',

    // Property
    prop_beds: 'Beds',
    prop_baths: 'Baths',
    prop_sqm: 'sqm',
    prop_view_detail: 'View Details',
    prop_featured: 'Featured',
    prop_available: 'Available Now',
    prop_new: 'New',
    prop_per_month: '/month',
    prop_month: 'month',

    // Sections
    section_featured: 'Featured Properties',
    section_popular_areas: 'Popular Areas',
    section_latest: 'Latest Listings',

    // Lead Form
    form_name: 'Full Name',
    form_phone: 'Phone Number',
    form_email: 'Email',
    form_message: 'Message',
    form_submit: 'Submit',
    form_success: 'Submitted Successfully!',
    form_send: 'Send',

    // Footer
    footer_contact: 'Contact Us',
    footer_quick_links: 'Quick Links',
    footer_follow: 'Follow Us',
    footer_copyright: '© 2026 Asset Management Property. All rights reserved.',
    footer_about_us: 'About Us',
    footer_properties: 'Properties',
    footer_services: 'Services',
    footer_contact_us: 'Contact Us',

    // Admin
    admin_login: 'Login',
    admin_email: 'Email',
    admin_password: 'Password',
    admin_dashboard: 'Dashboard',
    admin_properties: 'Properties',
    admin_leads: 'Leads',
    admin_reports: 'Reports',
    admin_settings: 'Settings',
    admin_logout: 'Logout',
    admin_total_properties: 'Total Properties',
    admin_active: 'Active',
    admin_leads_today: 'Leads Today',
    admin_leads_week: 'Leads This Week',
    admin_recent_leads: 'Recent Leads',
    admin_recent_activities: 'Recent Activities',
    admin_sync_sheet: 'Sync from Sheet',
    admin_export_data: 'Export Data',
    admin_qa_report: 'QA Report',
    admin_view_site: 'View Site',
    admin_remember_me: 'Remember me',
    admin_forgot_password: 'Forgot password?',
    admin_welcome_back: 'Welcome Back',
    admin_login_subtitle: 'Sign in to manage properties and leads',

    // About Page
    about_title: 'About Us',
    about_subtitle: 'Your Trusted Property Management Company',
    about_intro: 'Asset Management Property is a leading real estate management company in Pattaya',
    about_why_choose: 'Why Choose AMP',
    about_team: 'Our Team',
    about_location: 'Our Office',
    about_hero_title: 'เกี่ยวกับเรา / About Us',
    about_hero_subtitle: 'Your trusted partner for property management in Pattaya',
    about_intro_title: 'Who We Are',
    about_intro_p1: 'Asset Management Property (AMP) is a leading property management company in Pattaya, specializing in residential and commercial properties. With over 10 years of experience in the real estate industry, we have helped thousands of clients find their dream properties and manage their investments effectively.',
    about_intro_p2: 'Our team of experienced professionals understands the local market dynamics and provides personalized services tailored to each client\'s unique needs. Whether you\'re looking to rent, buy, or sell properties in Pattaya, we offer comprehensive solutions backed by market expertise and unwavering commitment to excellence.',
    about_intro_p3: 'At AMP, we believe in building long-term relationships with our clients through transparency, professionalism, and exceptional service. Our mission is to make property transactions smooth, hassle-free, and rewarding for everyone involved.',
    about_why_title: 'Why Choose AMP',
    about_why_subtitle: 'What makes us different',
    about_feature_clear_title: 'Clear Information',
    about_feature_clear_desc: 'ข้อมูลชัด - Complete and accurate property details with transparent pricing and conditions. No hidden fees or surprises.',
    about_feature_fast_title: 'Fast Response',
    about_feature_fast_desc: 'ตอบไว - Quick responses to all inquiries. We value your time and ensure prompt communication through multiple channels.',
    about_feature_service_title: 'Full Service',
    about_feature_service_desc: 'ดูแลครบ - Comprehensive property management services from search to contract signing and beyond. We\'re with you every step.',
    about_feature_team_title: 'Expert Team',
    about_feature_team_desc: 'ทีมมืออาชีพ - Professional team with extensive local market knowledge and years of experience in property management.',
    about_team_title: 'Meet Our Team',
    about_team_subtitle: 'Experienced professionals dedicated to your success',
    about_team_member1_name: 'Somchai Tanaka',
    about_team_member1_position: 'Managing Director',
    about_team_member1_bio: '15+ years in property management with expertise in luxury properties and international client relations.',
    about_team_member2_name: 'Sarah Johnson',
    about_team_member2_position: 'Senior Property Consultant',
    about_team_member2_bio: 'Specializes in residential properties with fluency in English, Thai, and German. 10 years of experience.',
    about_team_member3_name: 'Alex Chen',
    about_team_member3_position: 'Marketing Manager',
    about_team_member3_bio: 'Expert in digital marketing and property promotion. 8 years of experience in real estate marketing.',
    about_team_member4_name: 'Natthida Prem',
    about_team_member4_position: 'Customer Relations Manager',
    about_team_member4_bio: 'Dedicated to ensuring excellent customer experience. 12 years in hospitality and property services.',
    about_location_title: 'Visit Our Office',
    about_location_subtitle: 'We\'re here to help you',
    about_location_address_title: 'Office Address',
    about_location_address: '123/45 Pattaya Beach Road<br>Pattaya, Chonburi 20150<br>Thailand',
    about_location_phone_title: 'Phone',
    about_location_email_title: 'Email',
    about_location_hours_title: 'Office Hours',
    about_location_hours: 'Monday - Sunday<br>9:00 AM - 6:00 PM',

    // Contact Page
    contact_title: 'Contact Us',
    contact_subtitle: 'We are here to help and answer your questions',
    contact_info: 'Contact Information',
    contact_hours: 'Business Hours',
    contact_form_title: 'Send Us a Message',
    contact_address: 'Address',
    contact_property_interest: 'Property Interest',

    // Property Types
    type_condo: 'Condo',
    type_house: 'House',
    type_villa: 'Villa',
    type_townhouse: 'Townhouse',

    // Common
    common_view_all: 'View All',
    common_loading: 'Loading...',
    common_search: 'Search',
    common_filter: 'Filter',
    common_sort: 'Sort',
    common_save: 'Save',
    common_cancel: 'Cancel',
    common_edit: 'Edit',
    common_delete: 'Delete',
    common_close: 'Close',

    // Thank You Page
    thank_you_title: 'Thank You for Contacting Us!',
    thank_you_message: 'We have received your information. Our team will get back to you as soon as possible,<br>typically within 24 hours',
    back_to_home: 'Back to Home',
    view_properties: 'View Properties',
    need_urgent_help: 'Need Urgent Help?',

    // Projects
    nav_projects: 'Projects',
    nav_all_projects: 'All Projects',
    nav_pre_sale: 'Pre-Sale Projects',
    nav_condos: 'Condos',
    nav_villas: 'Villas',
    projects_title: 'Pattaya Projects',
    projects_subtitle: 'Discover new and developing projects',
    project_status: 'Status',
    project_type: 'Type',
    project_area: 'Area',
    project_price_range: 'Price Range',
    project_all: 'All',
    project_pre_sale: 'Pre-Sale',
    project_under_construction: 'Under Construction',
    project_ready_to_move: 'Ready to Move',
    project_condo: 'Condo',
    project_villa: 'Villa/House',
    project_progress: 'Progress',
    project_units_available: 'Units Available',
    project_yield: 'Yield',
    project_foreign_quota: 'Foreign Quota',
    project_developer: 'Developer',
    project_promotions: 'Promotions',
    project_facilities: 'Facilities',
    project_unit_types: 'Unit Types',
    project_floor_plans: 'Floor Plans',
    project_location: 'Location',
    project_view_detail: 'View Details',
    project_contact: 'Contact Us',

    // Investment
    nav_invest: 'Invest',
    nav_invest_hub: 'Investment Hub',
    nav_calculator: 'ROI Calculator',
    nav_thai_investor: 'Thai Investors',
    nav_foreign_investor: 'Foreign Investors',
    nav_rental_management: 'Rental Management',
    invest_title: 'Invest in Pattaya Real Estate',
    invest_subtitle: 'Complete information, easy start, great returns',
    invest_why_pattaya: 'Why Invest in Pattaya',
    invest_calculator: 'ROI Calculator',
    invest_guides: 'Investment Guides',
    calc_title: 'Investment ROI Calculator',
    calc_subtitle: 'Calculate returns on property investment',
    calc_property_price: 'Property Price (THB)',
    calc_down_payment: 'Down Payment (%)',
    calc_interest_rate: 'Interest Rate (%/year)',
    calc_loan_term: 'Loan Term (years)',
    calc_monthly_rent: 'Monthly Rent (THB)',
    calc_monthly_expense: 'Monthly Expenses (THB)',
    calc_calculate: 'Calculate',
    calc_results: 'Results',
    calc_gross_yield: 'Gross Yield',
    calc_net_yield: 'Net Yield',
    calc_monthly_cash_flow: 'Monthly Cash Flow',
    calc_payback_period: 'Payback Period',
    calc_download_pdf: 'Download PDF',
    calc_error_invalid_price: 'Please enter a valid property price',
    calc_error_invalid_rent: 'Please enter a valid monthly rent',
    calc_error_invalid_down_payment: 'Down payment must be between 0-100%',
    calc_error_negative_value: 'Please enter a value greater than 0',
    thai_investor_title: 'Thai Investor Guide',
    thai_investor_subtitle: 'Complete guide for Thai property investors in Pattaya',
    thai_investor_steps: 'Investment Steps',
    thai_investor_benefits: 'Investment Benefits',
    thai_investor_tips: 'Tips for Beginners',
    thai_investor_faq: 'Frequently Asked Questions',
    foreign_investor_title: 'Foreign Investor Guide',
    foreign_investor_subtitle: 'Complete guide for foreign property investment in Pattaya',
    foreign_investor_ownership: 'Ownership Rules',
    foreign_investor_visa: 'Visa Options',
    foreign_investor_money_transfer: 'Money Transfer Guide',
    rental_mgmt_title: 'Rental Management Services',
    rental_mgmt_subtitle: 'Let us manage your property and receive monthly rental income',

    // Area Guide
    nav_area_guide: 'Area Guide',
    area_guide_title: 'Pattaya Area Guide',
    area_guide_subtitle: 'Choose the right location for you',
    area_avg_price: 'Avg Price/sqm',
    area_price_trend: 'Price Trend',
    area_demographics: 'Demographics',
    area_pros: 'Pros',
    area_cons: 'Cons',
    area_projects_in_area: 'Projects in Area',
    area_explore: 'Explore Area',

    // Quiz
    quiz_title: 'Find Your Perfect Property',
    quiz_subtitle: 'Answer 5 questions to get personalized recommendations',
    quiz_start: 'Start Quiz',
    quiz_next: 'Next',
    quiz_prev: 'Previous',
    quiz_finish: 'See Results',
    quiz_q1: 'What is your main purpose?',
    quiz_q1_live: 'Living',
    quiz_q1_invest: 'Investment/Rental',
    quiz_q1_vacation: 'Vacation Home',
    quiz_q1_retire: 'Retirement',
    quiz_q2: 'What is your budget?',
    quiz_q2_under2: 'Under 2M THB',
    quiz_q2_2to5: '2-5M THB',
    quiz_q2_5to10: '5-10M THB',
    quiz_q2_over10: 'Over 10M THB',
    quiz_q3: 'What property type do you prefer?',
    quiz_q3_condo: 'Condo (Low maintenance)',
    quiz_q3_villa: 'Villa/House (Private space)',
    quiz_q3_both: 'Both (Flexible)',
    quiz_q4: 'Lifestyle preference?',
    quiz_q4_beach: 'Beachfront',
    quiz_q4_city: 'City Center',
    quiz_q4_quiet: 'Quiet Area',
    quiz_q4_family: 'Family-friendly',
    quiz_q5: 'When do you want to buy?',
    quiz_q5_immediately: 'Move in immediately',
    quiz_q5_3months: '1-3 months',
    quiz_q5_6months: '3-6 months',
    quiz_q5_1year: 'More than 1 year',
    quiz_results_title: 'Your Results',
    quiz_results_subtitle: 'Here are our recommendations for you',
    quiz_recommended_areas: 'Recommended Areas',
    quiz_recommended_types: 'Recommended Property Types',
    quiz_recommended_projects: 'Recommended Projects',
    quiz_restart: 'Start Over',
    quiz_contact_us: 'Contact us for more advice',

    // Investment Calculator
    calc_title: 'Investment ROI Calculator',
    calc_subtitle: 'Calculate your potential returns',
    calc_property_price: 'Property Price (฿)',
    calc_down_payment: 'Down Payment (%)',
    calc_interest_rate: 'Interest Rate (%/year)',
    calc_loan_term: 'Loan Term (years)',
    calc_monthly_rent: 'Monthly Rent (฿)',
    calc_monthly_expense: 'Monthly Expenses (฿)',
    calc_calculate: 'Calculate',
    calc_gross_yield: 'Gross Yield',
    calc_net_yield: 'Net Yield',
    calc_cash_flow: 'Monthly Cash Flow',
    calc_payback_period: 'Payback Period',
    calc_download_pdf: 'Download PDF Report',
    calc_consult: 'Consult Expert',
    calc_error_invalid_price: 'Please enter a valid property price',
    calc_error_invalid_down_payment: 'Down payment must be between 0-100%',
    calc_error_invalid_rent: 'Please enter a valid monthly rent',
    calc_error_negative_value: 'Value cannot be negative',

    // Mortgage Calculator
    mortgage_title: 'Mortgage Calculator',
    mortgage_subtitle: 'Calculate your monthly payments',
    mortgage_monthly_payment: 'Monthly Payment',
    mortgage_total_interest: 'Total Interest',
    mortgage_total_payment: 'Total Payment',
    mortgage_recommended_banks: 'Recommended Banks',

    // Area Guide
    area_description: 'Description',
    area_residents: 'Residents',
    area_highlights: 'Highlights',
    area_nearby: 'Nearby',
    area_hospital: 'Hospital',
    area_mall: 'Shopping Mall',
    area_airport: 'Airport',
    area_view_properties: 'View Properties in this Area',

    // Trust Signals
    trust_licensed: 'Licensed by Department of Lands',
    trust_experience: 'Years of Experience',
    trust_properties_sold: 'Properties Sold',
    trust_languages: 'Languages',
    trust_google_rating: 'Google Rating',
    trust_reviews: 'Reviews',
    trust_why_amp: 'Why Choose AMP',
    trust_professional: 'Professional Team',
    trust_multilingual: 'Multilingual Support',
    trust_full_service: 'Full Service',

    // Market Stats
    market_title: 'Market Insights',
    market_subtitle: 'Latest market trends and statistics',
    market_avg_price_by_type: 'Average Price by Type',
    market_hot_areas: 'Hot Areas',
    market_rental_yield: 'Rental Yield',
    market_occupancy_rate: 'Occupancy Rate',
    market_download_report: 'Download Full Report',
    market_price_per_sqm: 'per sqm',
    market_yoy_change: 'YoY Change',
    market_gross: 'Gross',
    market_net: 'Net',

    // Testimonials
    testimonial_title: 'What Our Clients Say',
    testimonial_subtitle: 'Real reviews from real customers',
    testimonial_verified: 'Verified Purchase',

    // Compare Properties
    compare_title: 'Compare Properties',
    compare_add: 'Add to Compare',
    compare_remove: 'Remove from Compare',
    compare_view: 'View Comparison',
    compare_coming_soon: 'Coming Soon',
    compare_max_3: 'Compare up to 3 properties',

    // Saved Searches
    saved_title: 'Saved Searches',
    saved_create: 'Save this Search',
    saved_alerts: 'Get Alerts',
    saved_frequency: 'Alert Frequency',
    saved_immediately: 'Immediately',
    saved_daily: 'Daily',
    saved_weekly: 'Weekly',
    saved_coming_soon: 'Coming Soon',
    saved_description: 'Save your search criteria and get notified when new properties match',
    saved_example1_title: 'Condo in Jomtien, 2BR, Under 3M',
    saved_example1_alert: 'Alert: Daily',
    saved_example2_title: 'Villa in Pratumnak, Sea View',
    saved_example2_alert: 'Alert: Immediately',
    saved_edit: 'Edit',

    // Compare Properties
    compare_property_1: 'Property 1',
    compare_property_2: 'Property 2',
    compare_property_3: 'Property 3',
    compare_property_metrics: 'Price, Size, Yield',

    // Mobile
    mobile_line: 'LINE',
    mobile_call: 'Call',
    mobile_calculate: 'Calculate',
    mobile_save: 'Save',

    // Rental Management
    rental_title: 'Rental Management Services',
    rental_subtitle: 'We manage your property so you don\'t have to',
    rental_services: 'Our Services',
    rental_tenant_finding: 'Tenant Finding',
    rental_maintenance: 'Maintenance',
    rental_collection: 'Rent Collection',
    rental_reporting: 'Monthly Reporting',
    rental_pricing: 'Service Fee',
    rental_performance: 'Our Performance',
    rental_occupancy: 'Average Occupancy Rate',
    rental_response_time: 'Average Response Time',

    // Developer Profiles
    developer_rating: 'Rating',
    developer_delivered: 'Projects Delivered',
    developer_ongoing: 'Ongoing Projects',
    developer_established: 'Established',
    developer_specialties: 'Specialties',
    developer_reviews: 'Customer Reviews',
  }
};

// i18n functions
let currentLang = localStorage.getItem('lang') || 'th';

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  updatePageText();

  // Update language toggle button
  const langText = document.querySelector('#lang-text');
  if (langText) {
    langText.textContent = lang === 'th' ? 'EN' : 'TH';
  }

  // Dispatch event for dynamic content to re-render
  document.dispatchEvent(new Event('languageChanged'));
}

function toggleLanguage() {
  setLanguage(currentLang === 'th' ? 'en' : 'th');
}

function updatePageText() {
  // Update elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);

    // Check if element is an input/button value
    if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) {
      el.value = translation;
    } else {
      el.textContent = translation;
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // Update titles
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });

  // Update aria-labels
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });
}

// Initialize language on page load
function initI18n() {
  // Set initial language
  const savedLang = localStorage.getItem('lang') || 'th';
  currentLang = savedLang;
  document.documentElement.lang = savedLang;

  // Update all text on page
  updatePageText();

  // Update language toggle button
  const langText = document.querySelector('#lang-text');
  if (langText) {
    langText.textContent = savedLang === 'th' ? 'EN' : 'TH';
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
