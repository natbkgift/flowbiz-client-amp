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
    
    // Contact Page
    contact_title: 'ติดต่อเรา',
    contact_subtitle: 'เราพร้อมให้บริการและตอบคำถามของคุณ',
    contact_info: 'ข้อมูลติดต่อ',
    contact_hours: 'เวลาทำการ',
    contact_form_title: 'ส่งข้อความถึงเรา',
    contact_address: 'ที่อยู่',
    
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
  },
  en: {
    // Navigation
    nav_home: 'Home',
    nav_rent: 'Rent',
    nav_buy: 'Buy',
    nav_about: 'About',
    nav_contact: 'Contact',
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
    
    // Contact Page
    contact_title: 'Contact Us',
    contact_subtitle: 'We are here to help and answer your questions',
    contact_info: 'Contact Information',
    contact_hours: 'Business Hours',
    contact_form_title: 'Send Us a Message',
    contact_address: 'Address',
    
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
  const langButton = document.querySelector('.btn-lang span, .lang-switch');
  if (langButton) {
    langButton.textContent = lang === 'th' ? 'EN' : 'TH';
  }
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
  const langButton = document.querySelector('.btn-lang span, .lang-switch');
  if (langButton) {
    langButton.textContent = savedLang === 'th' ? 'EN' : 'TH';
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
