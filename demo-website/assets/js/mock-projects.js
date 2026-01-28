// AMP Demo Website - Mock Projects Data
// Mock data for Project Showcase feature

window.AMP = window.AMP || {};
window.AMP.projects = [
  // Pre-Sale Projects
  {
    project_id: 'proj_001',
    name: {
      th: 'เดอะ โอเชี่ยน พาราไดซ์',
      en: 'The Ocean Paradise'
    },
    developer: {
      name: 'Paradise Property Group',
      rating: 4.8
    },
    type: 'condo',
    status: 'pre-sale',
    location: 'Wong Amat',
    timeline: {
      launch: '2026-Q2',
      construction_start: '2026-Q3',
      completion: '2028-Q4',
      progress: 0
    },
    units: {
      total: 320,
      available: 320,
      foreign_quota: 192
    },
    pricing: {
      min: 2800000,
      max: 15000000,
      currency: 'THB',
      per_sqm: 85000
    },
    size: {
      min: 28,
      max: 120
    },
    estimated_yield: 6.5,
    promotions: [
      { th: 'ส่วนลดพิเศษ 10% สำหรับ 10 ยูนิตแรก', en: '10% special discount for first 10 units' },
      { th: 'ฟรีเฟอร์นิเจอร์ครบชุด มูลค่า 500,000 บาท', en: 'Free furniture package worth 500,000 THB' }
    ],
    facilities: ['Swimming Pool', 'Fitness Center', 'Co-working Space', 'Sky Lounge', 'Private Beach Access', 'Parking', 'Security 24/7', 'Kids Club'],
    images: [
      'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
    ],
    description: {
      th: 'โครงการคอนโดหรูติดชายหาดวงอมาด ออกแบบโดยสถาปนิกชื่อดัง พร้อมวิวทะเลพาโนรามา',
      en: 'Luxury beachfront condo in Wong Amat designed by award-winning architects with panoramic sea views'
    }
  },
  {
    project_id: 'proj_002',
    name: {
      th: 'บลิส เรสซิเดนซ์',
      en: 'Bliss Residence'
    },
    developer: {
      name: 'Green Living Development',
      rating: 4.6
    },
    type: 'villa',
    status: 'pre-sale',
    location: 'Huay Yai',
    timeline: {
      launch: '2026-Q1',
      construction_start: '2026-Q2',
      completion: '2027-Q4',
      progress: 0
    },
    units: {
      total: 45,
      available: 45,
      foreign_quota: 0
    },
    pricing: {
      min: 4500000,
      max: 8500000,
      currency: 'THB',
      per_sqm: 45000
    },
    size: {
      min: 120,
      max: 200
    },
    estimated_yield: 5.2,
    promotions: [
      { th: 'ผ่อนชำระ 0% นาน 2 ปี', en: '0% installment for 2 years' },
      { th: 'ฟรีค่าโอน ค่าจดจำนอง', en: 'Free transfer and mortgage fees' }
    ],
    facilities: ['Clubhouse', 'Fitness Center', 'Swimming Pool', 'Garden', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
    ],
    description: {
      th: 'บ้านเดี่ยวสไตล์โมเดิร์นทรอปิคอล ในย่านเขาไผ่ใหญ่ เหมาะสำหรับครอบครัว',
      en: 'Modern tropical villas in Huay Yai, perfect for families'
    }
  },
  {
    project_id: 'proj_003',
    name: {
      th: 'ซัมเมอร์ บรีซ คอนโด',
      en: 'Summer Breeze Condo'
    },
    developer: {
      name: 'Breeze Development',
      rating: 4.5
    },
    type: 'condo',
    status: 'pre-sale',
    location: 'Jomtien',
    timeline: {
      launch: '2026-Q1',
      construction_start: '2026-Q3',
      completion: '2028-Q2',
      progress: 0
    },
    units: {
      total: 280,
      available: 280,
      foreign_quota: 168
    },
    pricing: {
      min: 1800000,
      max: 9000000,
      currency: 'THB',
      per_sqm: 65000
    },
    size: {
      min: 26,
      max: 95
    },
    estimated_yield: 7.0,
    promotions: [
      { th: 'จอง 50,000 บาท รับส่วนลด 5%', en: 'Book with 50,000 THB and get 5% discount' }
    ],
    facilities: ['Swimming Pool', 'Gym', 'Sauna', 'Rooftop Bar', 'Co-working Space', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1502672260066-6bc35f0a3e1d?w=800'
    ],
    description: {
      th: 'คอนโดติดชายหาดจอมเทียน ใกล้แหล่งท่องเที่ยว ระยะห่างจากหาดเพียง 100 เมตร',
      en: 'Beachfront condo in Jomtien, near tourist attractions, just 100m from the beach'
    }
  },
  {
    project_id: 'proj_004',
    name: {
      th: 'โกลเด้น วิลล่า เรสซิเดนซ์',
      en: 'Golden Villa Residence'
    },
    developer: {
      name: 'Golden Properties',
      rating: 4.7
    },
    type: 'villa',
    status: 'pre-sale',
    location: 'Na Jomtien',
    timeline: {
      launch: '2026-Q2',
      construction_start: '2026-Q3',
      completion: '2028-Q1',
      progress: 0
    },
    units: {
      total: 38,
      available: 38,
      foreign_quota: 0
    },
    pricing: {
      min: 5200000,
      max: 12000000,
      currency: 'THB',
      per_sqm: 48000
    },
    size: {
      min: 140,
      max: 250
    },
    estimated_yield: 4.8,
    promotions: [
      { th: 'ฟรีส่วนกลาง 3 ปี', en: 'Free common area fees for 3 years' }
    ],
    facilities: ['Private Pool Option', 'Clubhouse', 'Fitness Center', 'Garden', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    description: {
      th: 'บ้านเดี่ยวหรู พร้อมสระส่วนตัว ในทำเลนาจอมเทียนที่เงียบสงบ',
      en: 'Luxury pool villas in peaceful Na Jomtien location'
    }
  },
  {
    project_id: 'proj_005',
    name: {
      th: 'เดอะ เพรสทีจ พัทยา',
      en: 'The Prestige Pattaya'
    },
    developer: {
      name: 'Prestige Group',
      rating: 4.9
    },
    type: 'condo',
    status: 'pre-sale',
    location: 'Pratumnak',
    timeline: {
      launch: '2026-Q3',
      construction_start: '2026-Q4',
      completion: '2029-Q2',
      progress: 0
    },
    units: {
      total: 420,
      available: 420,
      foreign_quota: 252
    },
    pricing: {
      min: 3500000,
      max: 25000000,
      currency: 'THB',
      per_sqm: 95000
    },
    size: {
      min: 32,
      max: 180
    },
    estimated_yield: 6.8,
    promotions: [
      { th: 'ส่วนลดพิเศษ 15% สำหรับ Early Bird', en: '15% Early Bird discount' },
      { th: 'Guaranteed Rental 6% ปีแรก', en: 'Guaranteed 6% rental return first year' }
    ],
    facilities: ['Infinity Pool', 'Fitness Center', 'Spa', 'Restaurant', 'Sky Garden', 'Concierge', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
    ],
    description: {
      th: 'คอนโดหรูระดับ 5 ดาวบนเนินพระตำหนัก วิวทะเลสุดอลังการ',
      en: '5-star luxury condo on Pratumnak Hill with spectacular sea views'
    }
  },

  // Under Construction Projects
  {
    project_id: 'proj_006',
    name: {
      th: 'มาริน่า เบย์ รีสอร์ท',
      en: 'Marina Bay Resort'
    },
    developer: {
      name: 'Bay Development Co.',
      rating: 4.6
    },
    type: 'condo',
    status: 'under-construction',
    location: 'Pattaya',
    timeline: {
      launch: '2025-Q1',
      construction_start: '2025-Q2',
      completion: '2027-Q4',
      progress: 35
    },
    units: {
      total: 350,
      available: 145,
      foreign_quota: 210
    },
    pricing: {
      min: 2200000,
      max: 12000000,
      currency: 'THB',
      per_sqm: 72000
    },
    size: {
      min: 30,
      max: 110
    },
    estimated_yield: 6.2,
    promotions: [
      { th: 'จองวันนี้ ราคาพิเศษ ลดทันที 8%', en: 'Book today, special price with 8% discount' }
    ],
    facilities: ['Swimming Pool', 'Gym', 'Restaurant', 'Beach Club', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
    ],
    description: {
      th: 'คอนโดรีสอร์ทสไตล์ติดชายหาดพัทยากลาง ใกล้แหล่งบันเทิง',
      en: 'Resort-style beachfront condo in Central Pattaya, near entertainment areas'
    }
  },
  {
    project_id: 'proj_007',
    name: {
      th: 'ทรอปิคัล พาราไดซ์ วิลล่า',
      en: 'Tropical Paradise Villa'
    },
    developer: {
      name: 'Paradise Living',
      rating: 4.5
    },
    type: 'villa',
    status: 'under-construction',
    location: 'Huay Yai',
    timeline: {
      launch: '2024-Q4',
      construction_start: '2025-Q1',
      completion: '2026-Q4',
      progress: 60
    },
    units: {
      total: 52,
      available: 18,
      foreign_quota: 0
    },
    pricing: {
      min: 3800000,
      max: 7500000,
      currency: 'THB',
      per_sqm: 42000
    },
    size: {
      min: 110,
      max: 180
    },
    estimated_yield: 5.0,
    promotions: [
      { th: 'โอนก่อนครบโครงการ ฟรีค่าส่วนกลาง 2 ปี', en: 'Transfer before completion, free common fees for 2 years' }
    ],
    facilities: ['Clubhouse', 'Swimming Pool', 'Garden', 'Playground', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    description: {
      th: 'บ้านสไตล์ทรอปิคอลในเขาไผ่ใหญ่ บรรยากาศสงบ เหมาะกับครอบครัว',
      en: 'Tropical-style homes in Huay Yai with peaceful atmosphere, perfect for families'
    }
  },
  {
    project_id: 'proj_008',
    name: {
      th: 'เดอะ ริเวอร์ไซด์',
      en: 'The Riverside'
    },
    developer: {
      name: 'Riverside Development',
      rating: 4.7
    },
    type: 'condo',
    status: 'under-construction',
    location: 'Jomtien',
    timeline: {
      launch: '2024-Q3',
      construction_start: '2024-Q4',
      completion: '2027-Q2',
      progress: 45
    },
    units: {
      total: 310,
      available: 125,
      foreign_quota: 186
    },
    pricing: {
      min: 1900000,
      max: 8500000,
      currency: 'THB',
      per_sqm: 68000
    },
    size: {
      min: 28,
      max: 88
    },
    estimated_yield: 6.8,
    promotions: [
      { th: 'ฟรีเฟอร์นิเจอร์และเครื่องใช้ไฟฟ้า', en: 'Free furniture and appliances' }
    ],
    facilities: ['Swimming Pool', 'Fitness Center', 'Garden', 'Rooftop Lounge', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1502672260066-6bc35f0a3e1d?w=800',
      'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800'
    ],
    description: {
      th: 'คอนโดสไตล์รีสอร์ทริมชายหาดจอมเทียน วิวทะเล ใกล้ร้านอาหาร',
      en: 'Resort-style condo by Jomtien Beach with sea views, near restaurants'
    }
  },
  {
    project_id: 'proj_009',
    name: {
      th: 'เซเรนิตี้ วิลล่า',
      en: 'Serenity Villa'
    },
    developer: {
      name: 'Serenity Homes',
      rating: 4.8
    },
    type: 'villa',
    status: 'under-construction',
    location: 'Na Jomtien',
    timeline: {
      launch: '2025-Q1',
      construction_start: '2025-Q2',
      completion: '2027-Q1',
      progress: 40
    },
    units: {
      total: 42,
      available: 22,
      foreign_quota: 0
    },
    pricing: {
      min: 4800000,
      max: 9500000,
      currency: 'THB',
      per_sqm: 46000
    },
    size: {
      min: 130,
      max: 210
    },
    estimated_yield: 4.5,
    promotions: [
      { th: 'พิเศษ! ฟรีสระว่ายน้ำส่วนตัว', en: 'Special! Free private pool' }
    ],
    facilities: ['Private Pool', 'Garden', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
    ],
    description: {
      th: 'บ้านเดี่ยวพร้อมสระส่วนตัวในนาจอมเทียน บรรยากาศเงียบสงบ',
      en: 'Pool villas in Na Jomtien with peaceful atmosphere'
    }
  },
  {
    project_id: 'proj_010',
    name: {
      th: 'สกายไลน์ เรสซิเดนซ์',
      en: 'Skyline Residence'
    },
    developer: {
      name: 'Skyline Group',
      rating: 4.6
    },
    type: 'condo',
    status: 'under-construction',
    location: 'Pratumnak',
    timeline: {
      launch: '2024-Q2',
      construction_start: '2024-Q3',
      completion: '2027-Q1',
      progress: 50
    },
    units: {
      total: 380,
      available: 156,
      foreign_quota: 228
    },
    pricing: {
      min: 3200000,
      max: 18000000,
      currency: 'THB',
      per_sqm: 88000
    },
    size: {
      min: 35,
      max: 140
    },
    estimated_yield: 6.5,
    promotions: [
      { th: 'ผ่อน 0% นาน 12 เดือน', en: '0% installment for 12 months' }
    ],
    facilities: ['Infinity Pool', 'Fitness Center', 'Sky Lounge', 'Co-working Space', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
    ],
    description: {
      th: 'คอนโดหรูบนพระตำหนักพร้อมวิวพาโนรามา ใกล้หาดคร้อฟท์',
      en: 'Luxury condo on Pratumnak with panoramic views, near Cosy Beach'
    }
  },

  // Ready to Move Projects
  {
    project_id: 'proj_011',
    name: {
      th: 'โอเชี่ยน วิว คอนโด',
      en: 'Ocean View Condo'
    },
    developer: {
      name: 'Ocean Development',
      rating: 4.7
    },
    type: 'condo',
    status: 'ready-to-move',
    location: 'Wong Amat',
    timeline: {
      launch: '2022-Q1',
      construction_start: '2022-Q2',
      completion: '2025-Q4',
      progress: 100
    },
    units: {
      total: 290,
      available: 32,
      foreign_quota: 174
    },
    pricing: {
      min: 2600000,
      max: 14000000,
      currency: 'THB',
      per_sqm: 82000
    },
    size: {
      min: 30,
      max: 115
    },
    estimated_yield: 6.3,
    promotions: [
      { th: 'พร้อมอยู่ ลดราคาพิเศษ 10%', en: 'Ready to move, special 10% discount' }
    ],
    facilities: ['Swimming Pool', 'Gym', 'Beach Access', 'Restaurant', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
    ],
    description: {
      th: 'คอนโดพร้อมอยู่ติดหาดวงอมาด วิวทะเลสวยงาม',
      en: 'Ready-to-move condo on Wong Amat Beach with beautiful sea views'
    }
  },
  {
    project_id: 'proj_012',
    name: {
      th: 'การ์เด้น โฮม วิลล่า',
      en: 'Garden Home Villa'
    },
    developer: {
      name: 'Garden Living',
      rating: 4.5
    },
    type: 'villa',
    status: 'ready-to-move',
    location: 'Huay Yai',
    timeline: {
      launch: '2022-Q4',
      construction_start: '2023-Q1',
      completion: '2025-Q3',
      progress: 100
    },
    units: {
      total: 48,
      available: 8,
      foreign_quota: 0
    },
    pricing: {
      min: 4200000,
      max: 7800000,
      currency: 'THB',
      per_sqm: 44000
    },
    size: {
      min: 115,
      max: 185
    },
    estimated_yield: 5.1,
    promotions: [
      { th: 'ฟรีค่าโอน', en: 'Free transfer fees' }
    ],
    facilities: ['Clubhouse', 'Swimming Pool', 'Garden', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
    ],
    description: {
      th: 'บ้านเดี่ยวพร้อมอยู่ในเขาไผ่ใหญ่ สวนสวย บรรยากาศดี',
      en: 'Ready-to-move villas in Huay Yai with beautiful garden'
    }
  },
  {
    project_id: 'proj_013',
    name: {
      th: 'บีช ฟร้อนท์ คอนโด',
      en: 'Beach Front Condo'
    },
    developer: {
      name: 'Beach Properties',
      rating: 4.8
    },
    type: 'condo',
    status: 'ready-to-move',
    location: 'Jomtien',
    timeline: {
      launch: '2023-Q1',
      construction_start: '2023-Q2',
      completion: '2025-Q4',
      progress: 100
    },
    units: {
      total: 265,
      available: 28,
      foreign_quota: 159
    },
    pricing: {
      min: 1750000,
      max: 8200000,
      currency: 'THB',
      per_sqm: 66000
    },
    size: {
      min: 26,
      max: 90
    },
    estimated_yield: 7.2,
    promotions: [
      { th: 'ฟรีเฟอร์นิเจอร์ครบชุด', en: 'Free complete furniture package' }
    ],
    facilities: ['Swimming Pool', 'Fitness Center', 'Rooftop Garden', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1502672260066-6bc35f0a3e1d?w=800',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
    ],
    description: {
      th: 'คอนโดพร้อมอยู่หน้าหาดจอมเทียน ติดหาดเพียง 50 เมตร',
      en: 'Ready-to-move beachfront condo in Jomtien, just 50m from the beach'
    }
  },
  {
    project_id: 'proj_014',
    name: {
      th: 'โมเดิร์น วิลล่า',
      en: 'Modern Villa'
    },
    developer: {
      name: 'Modern Homes',
      rating: 4.6
    },
    type: 'villa',
    status: 'ready-to-move',
    location: 'Na Jomtien',
    timeline: {
      launch: '2023-Q2',
      construction_start: '2023-Q3',
      completion: '2025-Q3',
      progress: 100
    },
    units: {
      total: 35,
      available: 6,
      foreign_quota: 0
    },
    pricing: {
      min: 5000000,
      max: 9800000,
      currency: 'THB',
      per_sqm: 47000
    },
    size: {
      min: 135,
      max: 215
    },
    estimated_yield: 4.7,
    promotions: [
      { th: 'พร้อมอยู่ทันที มีเฟอร์นิเจอร์', en: 'Ready to move with furniture' }
    ],
    facilities: ['Private Pool', 'Garden', 'Parking', 'Security 24/7'],
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
    ],
    description: {
      th: 'บ้านเดี่ยวสไตล์โมเดิร์นพร้อมสระส่วนตัว ในนาจอมเทียน',
      en: 'Modern pool villas ready to move in Na Jomtien'
    }
  },
  {
    project_id: 'proj_015',
    name: {
      th: 'เดอะ วิสต้า',
      en: 'The Vista'
    },
    developer: {
      name: 'Vista Development',
      rating: 4.9
    },
    type: 'condo',
    status: 'ready-to-move',
    location: 'Pratumnak',
    timeline: {
      launch: '2022-Q3',
      construction_start: '2022-Q4',
      completion: '2025-Q2',
      progress: 100
    },
    units: {
      total: 340,
      available: 42,
      foreign_quota: 204
    },
    pricing: {
      min: 3400000,
      max: 22000000,
      currency: 'THB',
      per_sqm: 92000
    },
    size: {
      min: 34,
      max: 160
    },
    estimated_yield: 6.4,
    promotions: [
      { th: 'ส่วนลด 12% สำหรับยูนิตที่เหลือ', en: '12% discount for remaining units' }
    ],
    facilities: ['Infinity Pool', 'Spa', 'Fitness Center', 'Restaurant', 'Sky Lounge', 'Parking', 'Security 24/7', 'Concierge'],
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800'
    ],
    description: {
      th: 'คอนโดหรูพร้อมอยู่บนเนินพระตำหนัก วิวทะเล 270 องศา',
      en: 'Luxury ready-to-move condo on Pratumnak Hill with 270-degree sea views'
    }
  }
];

// Area data with market statistics
window.AMP.areaData = {
  'pattaya': {
    name: {
      th: 'พัทยากลาง',
      en: 'Central Pattaya'
    },
    avg_price_sqm: 75000,
    trend: 8.5,
    demographics: {
      th: 'นักท่องเที่ยว, นักลงทุนต่างชาติ, ครอบครัวไทย',
      en: 'Tourists, Foreign investors, Thai families'
    },
    pros: {
      th: ['ใกล้แหล่งบันเทิง', 'สะดวกสบาย', 'ศักยภาพให้เช่าสูง', 'ใกล้ร้านอาหาร'],
      en: ['Near entertainment', 'Convenient', 'High rental potential', 'Near restaurants']
    },
    cons: {
      th: ['คนเยอะ', 'เสียงดัง', 'จราจรติด'],
      en: ['Crowded', 'Noisy', 'Traffic congestion']
    },
    description: {
      th: 'พัทยากลางเป็นศูนย์กลางความบันเทิงและธุรกิจ มีชายหาด ร้านอาหาร ห้างสรรพสินค้า และสถานบันเทิงมากมาย',
      en: 'Central Pattaya is the entertainment and business hub with beaches, restaurants, malls, and nightlife'
    }
  },
  'jomtien': {
    name: {
      th: 'จอมเทียน',
      en: 'Jomtien'
    },
    avg_price_sqm: 68000,
    trend: 7.2,
    demographics: {
      th: 'ครอบครัว, ผู้สูงอายุ, คนทำงาน',
      en: 'Families, Retirees, Working professionals'
    },
    pros: {
      th: ['เงียบกว่าพัทยากลาง', 'หาดสวย', 'เหมาะกับครอบครัว', 'ราคาดี'],
      en: ['Quieter than Central Pattaya', 'Beautiful beach', 'Family-friendly', 'Good value']
    },
    cons: {
      th: ['ไกลจากแหล่งบันเทิง', 'รถติดตอนเย็น'],
      en: ['Far from entertainment', 'Evening traffic']
    },
    description: {
      th: 'จอมเทียนเป็นพื้นที่ที่เงียบสงบกว่า เหมาะสำหรับครอบครัวและผู้ที่ชอบบรรยากาศผ่อนคลาย',
      en: 'Jomtien is a quieter area, perfect for families and those who prefer a relaxed atmosphere'
    }
  },
  'na-jomtien': {
    name: {
      th: 'นาจอมเทียน',
      en: 'Na Jomtien'
    },
    avg_price_sqm: 48000,
    trend: 9.5,
    demographics: {
      th: 'ครอบครัวไทย, ผู้สูงอายุ, นักลงทุนต่างชาติ',
      en: 'Thai families, Retirees, Foreign investors'
    },
    pros: {
      th: ['เงียบสงบ', 'ราคาถูก', 'เหมาะสร้างบ้าน', 'ธรรมชาติสวยงาม'],
      en: ['Peaceful', 'Affordable', 'Good for house building', 'Beautiful nature']
    },
    cons: {
      th: ['ไกลจากเมือง', 'สาธารณูปโภคจำกัด'],
      en: ['Far from city', 'Limited facilities']
    },
    description: {
      th: 'นาจอมเทียนเป็นพื้นที่ที่กำลังพัฒนา เหมาะสำหรับผู้ที่ต้องการความเป็นส่วนตัวและบรรยากาศธรรมชาติ',
      en: 'Na Jomtien is a developing area, ideal for those seeking privacy and natural surroundings'
    }
  },
  'pratumnak': {
    name: {
      th: 'พระตำหนัก',
      en: 'Pratumnak'
    },
    avg_price_sqm: 92000,
    trend: 6.8,
    demographics: {
      th: 'นักลงทุนต่างชาติ, คนรวย, ผู้บริหาร',
      en: 'Foreign investors, Wealthy, Executives'
    },
    pros: {
      th: ['วิวทะเลสวย', 'พรีเมียม', 'ใกล้ทั้งพัทยาและจอมเทียน', 'ความเป็นส่วนตัว'],
      en: ['Beautiful sea views', 'Premium', 'Close to both Pattaya and Jomtien', 'Privacy']
    },
    cons: {
      th: ['ราคาสูง', 'ทางลาดชัน'],
      en: ['High prices', 'Steep roads']
    },
    description: {
      th: 'พระตำหนักเป็นทำเลพรีเมียมบนเนินเขา มีวิวทะเลสวยงาม เป็นที่นิยมของนักลงทุนต่างชาติและคนรวย',
      en: 'Pratumnak is a premium hillside location with stunning sea views, popular among foreign investors and wealthy individuals'
    }
  },
  'wong-amat': {
    name: {
      th: 'วงศ์อมาตย์',
      en: 'Wong Amat'
    },
    avg_price_sqm: 85000,
    trend: 8.0,
    demographics: {
      th: 'นักลงทุนต่างชาติ, ครอบครัวไทย, ผู้สูงอายุ',
      en: 'Foreign investors, Thai families, Retirees'
    },
    pros: {
      th: ['หาดสวย', 'เงียบสงบ', 'โครงการใหม่เยอะ', 'ใกล้นาเกลือ'],
      en: ['Beautiful beach', 'Peaceful', 'Many new projects', 'Near Naklua']
    },
    cons: {
      th: ['ราคาค่อนข้างสูง', 'ไกลจากแหล่งบันเทิง'],
      en: ['Relatively expensive', 'Far from entertainment']
    },
    description: {
      th: 'วงศ์อมาตย์เป็นพื้นที่ริมหาดที่สวยงามและเงียบสงบ เหมาะสำหรับผู้ที่ชอบความเป็นส่วนตัว',
      en: 'Wong Amat is a beautiful and peaceful beachfront area, perfect for those who value privacy'
    }
  },
  'huay-yai': {
    name: {
      th: 'เขาไผ่ใหญ่',
      en: 'Huay Yai'
    },
    avg_price_sqm: 44000,
    trend: 10.5,
    demographics: {
      th: 'ครอบครัวไทย, ผู้สูงอายุ, คนทำงาน',
      en: 'Thai families, Retirees, Working professionals'
    },
    pros: {
      th: ['ราคาถูก', 'เหมาะสำหรับครอบครัว', 'บรรยากาศธรรมชาติ', 'พื้นที่กว้าง'],
      en: ['Affordable', 'Family-friendly', 'Natural atmosphere', 'Spacious']
    },
    cons: {
      th: ['ไกลจากหาด', 'ต้องมีรถยนต์'],
      en: ['Far from beach', 'Car needed']
    },
    description: {
      th: 'เขาไผ่ใหญ่เป็นพื้นที่ที่กำลังเติบโตอย่างรวดเร็ว เหมาะสำหรับครอบครัวที่ต้องการบ้านที่กว้างขวางในราคาย่อมเยา',
      en: 'Huay Yai is a rapidly growing area, ideal for families seeking spacious homes at affordable prices'
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MOCK_PROJECTS, AREA_DATA };
}
