// AMP Demo Website - Mock Data
// 24 diverse properties for client presentation

const ALL_PROPERTIES = [
  // RENT - Condos (6 properties)
  {
    id: 'PROP-DEMO-001',
    intent: 'rent',
    type: 'condo',
    area: 'Jomtien',
    title_th: 'คอนโด วิวทะเล 1 ห้องนอน | จอมเทียน',
    title_en: 'Sea View Condo 1BR | Jomtien',
    description_th: 'คอนโดวิวทะเลสวยงาม ขนาด 35 ตารางเมตร ตกแต่งครบพร้อมอยู่ มีสระว่ายน้ำ ฟิตเนส และที่จอดรถ ใกล้ชายหาดจอมเทียน เดินถึงทะเลเพียง 5 นาที',
    description_en: 'Beautiful sea view condo 35 sqm, fully furnished and ready to move in. Pool, gym, parking available. Near Jomtien beach, only 5 minutes walk to the sea.',
    price: 15000,
    currency: 'THB',
    beds: 1,
    baths: 1,
    sqm: 35,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
    ],
    amenities: ['Pool', 'Gym', 'Parking', '24/7 Security', 'Elevator', 'WiFi', 'Cable TV', 'Air Conditioning'],
    badges: ['Featured', 'Available Now'],
    available_date: '2026-02-01',
    updated: '2026-01-25',
    featured: true
  },
  {
    id: 'PROP-DEMO-002',
    intent: 'rent',
    type: 'condo',
    area: 'Pattaya',
    title_th: 'คอนโด สตูดิโอ ใจกลางเมือง | พัทยา',
    title_en: 'Studio Condo City Center | Pattaya',
    description_th: 'สตูดิโอใจกลางเมืองพัทยา ขนาด 28 ตารางเมตร เดินถึง Walking Street เพียง 10 นาที มีฟิตเนส สระว่ายน้ำ และรักษาความปลอดภัย 24 ชั่วโมง',
    description_en: 'Studio condo in Pattaya city center, 28 sqm. Walking distance to Walking Street in 10 minutes. Gym, pool, and 24/7 security.',
    price: 8000,
    currency: 'THB',
    beds: 0,
    baths: 1,
    sqm: 28,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
    ],
    amenities: ['Pool', 'Gym', '24/7 Security', 'Elevator', 'WiFi'],
    badges: ['Available Now'],
    available_date: '2026-02-15',
    updated: '2026-01-24',
    featured: false
  },
  {
    id: 'PROP-DEMO-003',
    intent: 'rent',
    type: 'condo',
    area: 'Na Jomtien',
    title_th: 'คอนโด 2 ห้องนอน วิวสวน | นาจอมเทียน',
    title_en: 'Garden View Condo 2BR | Na Jomtien',
    description_th: 'คอนโด 2 ห้องนอน วิวสวนสวยงาม ขนาด 55 ตารางเมตร บรรยากาศเงียบสงบ เหมาะสำหรับครอบครัว พร้อมสระว่ายน้ำและสนามเด็กเล่น',
    description_en: 'Beautiful 2BR garden view condo, 55 sqm. Peaceful atmosphere, perfect for families. Pool and playground available.',
    price: 22000,
    currency: 'THB',
    beds: 2,
    baths: 2,
    sqm: 55,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
    ],
    amenities: ['Pool', 'Playground', 'Parking', '24/7 Security', 'Elevator', 'WiFi'],
    badges: ['Featured'],
    available_date: '2026-03-01',
    updated: '2026-01-23',
    featured: true
  },
  {
    id: 'PROP-DEMO-004',
    intent: 'rent',
    type: 'condo',
    area: 'Pattaya',
    title_th: 'คอนโด สตูดิโอ ใกล้ชายหาด | พัทยา',
    title_en: 'Beachfront Studio | Pattaya',
    description_th: 'สตูดิโอริมชายหาด ขนาด 30 ตารางเมตร เดินถึงหาดเพียง 2 นาที พร้อมสิ่งอำนวยความสะดวกครบครัน',
    description_en: 'Beachfront studio 30 sqm, only 2 minutes walk to beach. Fully equipped with all amenities.',
    price: 12000,
    currency: 'THB',
    beds: 0,
    baths: 1,
    sqm: 30,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
    ],
    amenities: ['Pool', 'Gym', 'Parking', '24/7 Security'],
    badges: [],
    available_date: '2026-02-20',
    updated: '2026-01-22',
    featured: false
  },
  {
    id: 'PROP-DEMO-005',
    intent: 'rent',
    type: 'condo',
    area: 'Pratumnak',
    title_th: 'คอนโด 1 ห้องนอน วิวทะเล | พระตำหนัก',
    title_en: 'Sea View Condo 1BR | Pratumnak',
    description_th: 'คอนโด 1 ห้องนอน วิวทะเลสวยงาม บนเขาพระตำหนัก ขนาด 40 ตารางเมตร บรรยากาศเงียบสงบ',
    description_en: '1BR condo with stunning sea view on Pratumnak Hill, 40 sqm. Peaceful location.',
    price: 18000,
    currency: 'THB',
    beds: 1,
    baths: 1,
    sqm: 40,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
    ],
    amenities: ['Pool', 'Gym', 'Parking', '24/7 Security', 'Elevator'],
    badges: ['Featured', 'Available Now'],
    available_date: '2026-02-10',
    updated: '2026-01-26',
    featured: true
  },
  {
    id: 'PROP-DEMO-006',
    intent: 'rent',
    type: 'condo',
    area: 'Jomtien',
    title_th: 'คอนโด สตูดิโอ วิวเมือง | จอมเทียน',
    title_en: 'City View Studio | Jomtien',
    description_th: 'สตูดิโอวิวเมือง ขนาด 32 ตารางเมตร ใกล้ตลาด ร้านอาหาร และสิ่งอำนวยความสะดวกต่างๆ',
    description_en: 'City view studio 32 sqm, close to market, restaurants, and all amenities.',
    price: 10000,
    currency: 'THB',
    beds: 0,
    baths: 1,
    sqm: 32,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
    ],
    amenities: ['Pool', 'Gym', 'Parking', 'WiFi'],
    badges: [],
    available_date: '2026-03-15',
    updated: '2026-01-21',
    featured: false
  },

  // RENT - Houses (3 properties)
  {
    id: 'PROP-DEMO-007',
    intent: 'rent',
    type: 'house',
    area: 'Huay Yai',
    title_th: 'บ้านเดี่ยว 3 ห้องนอน พร้อมสระ | ห้วยใหญ่',
    title_en: '3BR House with Pool | Huay Yai',
    description_th: 'บ้านเดี่ยว 3 ห้องนอน พร้อมสระว่ายน้ำส่วนตัว ขนาดพื้นที่ 150 ตารางเมตร มีสวนหน้าบ้านและที่จอดรถ',
    description_en: 'Detached 3BR house with private pool, 150 sqm. Garden and parking space.',
    price: 35000,
    currency: 'THB',
    beds: 3,
    baths: 2,
    sqm: 150,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    ],
    amenities: ['Private Pool', 'Garden', 'Parking', 'Air Conditioning', 'WiFi'],
    badges: ['Featured'],
    available_date: '2026-02-15',
    updated: '2026-01-25',
    featured: true
  },
  {
    id: 'PROP-DEMO-008',
    intent: 'rent',
    type: 'house',
    area: 'Bang Saray',
    title_th: 'บ้าน 2 ห้องนอน ใกล้ชายหาด | บางเสร่',
    title_en: '2BR House Near Beach | Bang Saray',
    description_th: 'บ้าน 2 ห้องนอน ขนาด 100 ตารางเมตร เดินถึงหาดบางเสร่ 5 นาที บรรยากาศเงียบสงบ',
    description_en: '2BR house 100 sqm, 5 minutes walk to Bang Saray beach. Quiet area.',
    price: 25000,
    currency: 'THB',
    beds: 2,
    baths: 2,
    sqm: 100,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    ],
    amenities: ['Garden', 'Parking', 'Air Conditioning', 'WiFi'],
    badges: [],
    available_date: '2026-03-01',
    updated: '2026-01-20',
    featured: false
  },
  {
    id: 'PROP-DEMO-009',
    intent: 'rent',
    type: 'house',
    area: 'Pattaya',
    title_th: 'บ้าน 4 ห้องนอน สไตล์โมเดิร์น | พัทยา',
    title_en: 'Modern 4BR House | Pattaya',
    description_th: 'บ้านสไตล์โมเดิร์น 4 ห้องนอน ขนาด 200 ตารางเมตร พร้อมสระว่ายน้ำ สวน และพื้นที่จอดรถ 2 คัน',
    description_en: 'Modern 4BR house 200 sqm with pool, garden, and parking for 2 cars.',
    price: 45000,
    currency: 'THB',
    beds: 4,
    baths: 3,
    sqm: 200,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    ],
    amenities: ['Private Pool', 'Garden', 'Parking', 'Air Conditioning', 'WiFi', 'Security System'],
    badges: ['Featured'],
    available_date: '2026-02-20',
    updated: '2026-01-26',
    featured: true
  },

  // RENT - Villas (2 properties)
  {
    id: 'PROP-DEMO-010',
    intent: 'rent',
    type: 'villa',
    area: 'Na Jomtien',
    title_th: 'วิลล่า 3 ห้องนอน วิวทะเล | นาจอมเทียน',
    title_en: 'Sea View Villa 3BR | Na Jomtien',
    description_th: 'วิลล่าวิวทะเลสวยงาม 3 ห้องนอน พร้อมสระว่ายน้ำส่วนตัว สวน และศาลากลางน้ำ',
    description_en: 'Beautiful sea view villa 3BR with private pool, garden, and sala.',
    price: 60000,
    currency: 'THB',
    beds: 3,
    baths: 3,
    sqm: 250,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800'
    ],
    amenities: ['Private Pool', 'Garden', 'Sala', 'Parking', 'Air Conditioning', 'WiFi', 'Security System'],
    badges: ['Featured', 'Available Now'],
    available_date: '2026-02-05',
    updated: '2026-01-27',
    featured: true
  },
  {
    id: 'PROP-DEMO-011',
    intent: 'rent',
    type: 'villa',
    area: 'Bang Saray',
    title_th: 'วิลล่า 4 ห้องนอน หรูหรา | บางเสร่',
    title_en: 'Luxury Villa 4BR | Bang Saray',
    description_th: 'วิลล่าหรูหรา 4 ห้องนอน พร้อมสระว่ายน้ำขนาดใหญ่ สวนสวยงาม และวิวทะเล',
    description_en: 'Luxury 4BR villa with large pool, beautiful garden, and sea view.',
    price: 80000,
    currency: 'THB',
    beds: 4,
    baths: 4,
    sqm: 300,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800'
    ],
    amenities: ['Private Pool', 'Garden', 'Sea View', 'Parking', 'Air Conditioning', 'WiFi', 'Security System', 'Maid Service'],
    badges: ['Featured'],
    available_date: '2026-03-10',
    updated: '2026-01-24',
    featured: true
  },

  // RENT - Townhome (1 property)
  {
    id: 'PROP-DEMO-012',
    intent: 'rent',
    type: 'townhome',
    area: 'Pattaya',
    title_th: 'ทาวน์โฮม 2 ห้องนอน | พัทยา',
    title_en: 'Townhome 2BR | Pattaya',
    description_th: 'ทาวน์โฮม 2 ห้องนอน ขนาด 120 ตารางเมตร พร้อมที่จอดรถและสวนเล็กๆ',
    description_en: 'Townhome 2BR, 120 sqm with parking and small garden.',
    price: 20000,
    currency: 'THB',
    beds: 2,
    baths: 2,
    sqm: 120,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    ],
    amenities: ['Parking', 'Garden', 'Air Conditioning', 'WiFi'],
    badges: [],
    available_date: '2026-02-25',
    updated: '2026-01-19',
    featured: false
  },

  // SALE - Condos (4 properties)
  {
    id: 'PROP-DEMO-013',
    intent: 'sale',
    type: 'condo',
    area: 'Jomtien',
    title_th: 'ขายคอนโด 1 ห้องนอน วิวทะเล | จอมเทียน',
    title_en: 'Condo for Sale 1BR Sea View | Jomtien',
    description_th: 'คอนโดวิวทะเล 1 ห้องนอน ชั้นสูง ขนาด 38 ตารางเมตร พร้อมเฟอร์นิเจอร์ครบ',
    description_en: 'Sea view condo 1BR high floor, 38 sqm, fully furnished.',
    price: 3500000,
    currency: 'THB',
    beds: 1,
    baths: 1,
    sqm: 38,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
    ],
    amenities: ['Pool', 'Gym', 'Parking', '24/7 Security', 'Elevator'],
    badges: ['Featured'],
    available_date: '2026-02-01',
    updated: '2026-01-26',
    featured: true
  },
  {
    id: 'PROP-DEMO-014',
    intent: 'sale',
    type: 'condo',
    area: 'Pattaya',
    title_th: 'ขายคอนโด 2 ห้องนอน ใจกลางเมือง | พัทยา',
    title_en: 'Condo for Sale 2BR City Center | Pattaya',
    description_th: 'คอนโด 2 ห้องนอน ใจกลางเมือง ขนาด 60 ตารางเมตร เดินทางสะดวก',
    description_en: '2BR condo city center, 60 sqm, convenient location.',
    price: 5500000,
    currency: 'THB',
    beds: 2,
    baths: 2,
    sqm: 60,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
    ],
    amenities: ['Pool', 'Gym', 'Parking', '24/7 Security'],
    badges: [],
    available_date: '2026-03-01',
    updated: '2026-01-23',
    featured: false
  },
  {
    id: 'PROP-DEMO-015',
    intent: 'sale',
    type: 'condo',
    area: 'Pratumnak',
    title_th: 'ขายคอนโด 2 ห้องนอน วิวทะเล | พระตำหนัก',
    title_en: 'Condo for Sale 2BR Sea View | Pratumnak',
    description_th: 'คอนโด 2 ห้องนอน วิวทะเลสวยงาม บนเขาพระตำหนัก ขนาด 75 ตารางเมตร',
    description_en: '2BR condo stunning sea view on Pratumnak Hill, 75 sqm.',
    price: 8500000,
    currency: 'THB',
    beds: 2,
    baths: 2,
    sqm: 75,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
    ],
    amenities: ['Pool', 'Gym', 'Parking', '24/7 Security', 'Elevator', 'Sea View'],
    badges: ['Featured'],
    available_date: '2026-02-15',
    updated: '2026-01-25',
    featured: true
  },
  {
    id: 'PROP-DEMO-016',
    intent: 'sale',
    type: 'condo',
    area: 'Jomtien',
    title_th: 'ขายคอนโด 3 ห้องนอน | จอมเทียน',
    title_en: 'Condo for Sale 3BR | Jomtien',
    description_th: 'คอนโด 3 ห้องนอน ขนาดใหญ่ 95 ตารางเมตร เหมาะสำหรับครอบครัว',
    description_en: 'Large 3BR condo 95 sqm, perfect for families.',
    price: 7500000,
    currency: 'THB',
    beds: 3,
    baths: 2,
    sqm: 95,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'
    ],
    amenities: ['Pool', 'Gym', 'Playground', 'Parking', '24/7 Security'],
    badges: [],
    available_date: '2026-02-28',
    updated: '2026-01-22',
    featured: false
  },

  // SALE - Houses (3 properties)
  {
    id: 'PROP-DEMO-017',
    intent: 'sale',
    type: 'house',
    area: 'Na Jomtien',
    title_th: 'ขายบ้านเดี่ยว 3 ห้องนอน พร้อมสระ | นาจอมเทียน',
    title_en: 'House for Sale 3BR with Pool | Na Jomtien',
    description_th: 'บ้านเดี่ยว 3 ห้องนอน พร้อมสระว่ายน้ำส่วนตัว ขนาด 180 ตารางเมตร',
    description_en: 'Detached 3BR house with private pool, 180 sqm.',
    price: 9500000,
    currency: 'THB',
    beds: 3,
    baths: 3,
    sqm: 180,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    ],
    amenities: ['Private Pool', 'Garden', 'Parking', 'Air Conditioning', 'WiFi'],
    badges: ['Featured'],
    available_date: '2026-02-10',
    updated: '2026-01-27',
    featured: true
  },
  {
    id: 'PROP-DEMO-018',
    intent: 'sale',
    type: 'house',
    area: 'Bang Saray',
    title_th: 'ขายบ้าน 4 ห้องนอน ใกล้ชายหาด | บางเสร่',
    title_en: 'House for Sale 4BR Near Beach | Bang Saray',
    description_th: 'บ้าน 4 ห้องนอน ขนาด 220 ตารางเมตร ใกล้หาดบางเสร่ พร้อมสระและสวน',
    description_en: '4BR house 220 sqm near Bang Saray beach with pool and garden.',
    price: 12000000,
    currency: 'THB',
    beds: 4,
    baths: 3,
    sqm: 220,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    ],
    amenities: ['Private Pool', 'Garden', 'Parking', 'Air Conditioning', 'WiFi', 'Security System'],
    badges: [],
    available_date: '2026-03-05',
    updated: '2026-01-24',
    featured: false
  },
  {
    id: 'PROP-DEMO-019',
    intent: 'sale',
    type: 'house',
    area: 'Pattaya',
    title_th: 'ขายบ้าน 5 ห้องนอน หรูหรา | พัทยา',
    title_en: 'Luxury House for Sale 5BR | Pattaya',
    description_th: 'บ้านหรูหรา 5 ห้องนอน ขนาด 280 ตารางเมตร พร้อมสระใหญ่และสวนสวยงาม',
    description_en: 'Luxury 5BR house 280 sqm with large pool and beautiful garden.',
    price: 15000000,
    currency: 'THB',
    beds: 5,
    baths: 4,
    sqm: 280,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    ],
    amenities: ['Private Pool', 'Garden', 'Parking', 'Air Conditioning', 'WiFi', 'Security System', 'Home Theater'],
    badges: ['Featured'],
    available_date: '2026-02-20',
    updated: '2026-01-26',
    featured: true
  },

  // SALE - Villas (2 properties)
  {
    id: 'PROP-DEMO-020',
    intent: 'sale',
    type: 'villa',
    area: 'Pratumnak',
    title_th: 'ขายวิลล่า 3 ห้องนอน วิวทะเล | พระตำหนัก',
    title_en: 'Villa for Sale 3BR Sea View | Pratumnak',
    description_th: 'วิลล่าวิวทะเลสวยงาม 3 ห้องนอน บนเขาพระตำหนัก ขนาด 250 ตารางเมตร',
    description_en: 'Beautiful sea view villa 3BR on Pratumnak Hill, 250 sqm.',
    price: 18000000,
    currency: 'THB',
    beds: 3,
    baths: 3,
    sqm: 250,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800'
    ],
    amenities: ['Private Pool', 'Sea View', 'Garden', 'Sala', 'Parking', 'Air Conditioning', 'WiFi', 'Security System'],
    badges: ['Featured'],
    available_date: '2026-02-12',
    updated: '2026-01-27',
    featured: true
  },
  {
    id: 'PROP-DEMO-021',
    intent: 'sale',
    type: 'villa',
    area: 'Na Jomtien',
    title_th: 'ขายวิลล่า 4 ห้องนอน หรูหรา | นาจอมเทียน',
    title_en: 'Luxury Villa for Sale 4BR | Na Jomtien',
    description_th: 'วิลล่าหรูหรา 4 ห้องนอน พร้อมสระขนาดใหญ่ สวนสวยงาม และวิวทะเล',
    description_en: 'Luxury 4BR villa with large pool, beautiful garden, and sea view.',
    price: 25000000,
    currency: 'THB',
    beds: 4,
    baths: 4,
    sqm: 350,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800'
    ],
    amenities: ['Private Pool', 'Sea View', 'Garden', 'Sala', 'Parking', 'Air Conditioning', 'WiFi', 'Security System', 'Gym'],
    badges: ['Featured'],
    available_date: '2026-03-01',
    updated: '2026-01-25',
    featured: true
  },

  // SALE - Townhome (1 property)
  {
    id: 'PROP-DEMO-022',
    intent: 'sale',
    type: 'townhome',
    area: 'Pattaya',
    title_th: 'ขายทาวน์โฮม 3 ห้องนอน | พัทยา',
    title_en: 'Townhome for Sale 3BR | Pattaya',
    description_th: 'ทาวน์โฮม 3 ห้องนอน ขนาด 140 ตารางเมตร พร้อมที่จอดรถและสวน',
    description_en: 'Townhome 3BR, 140 sqm with parking and garden.',
    price: 4500000,
    currency: 'THB',
    beds: 3,
    baths: 2,
    sqm: 140,
    furnishing: 'Fully Furnished',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    ],
    amenities: ['Parking', 'Garden', 'Air Conditioning', 'WiFi'],
    badges: [],
    available_date: '2026-02-18',
    updated: '2026-01-21',
    featured: false
  },

  // SALE - Land (2 properties)
  {
    id: 'PROP-DEMO-023',
    intent: 'sale',
    type: 'land',
    area: 'Huay Yai',
    title_th: 'ขายที่ดิน 400 ตารางวา | ห้วยใหญ่',
    title_en: 'Land for Sale 400 SQW | Huay Yai',
    description_th: 'ที่ดินเปล่า 400 ตารางวา เหมาะสำหรับสร้างบ้านหรือโครงการ มีถนนเข้าถึง',
    description_en: 'Land plot 400 sqw, suitable for house or project development. Road access.',
    price: 2000000,
    currency: 'THB',
    beds: null,
    baths: null,
    sqm: 1600,
    furnishing: 'N/A',
    image: 'https://via.placeholder.com/400x300/F05A43/FFFFFF?text=Land+Huay+Yai',
    images: Array(12).fill(null).map((_, i) => `https://via.placeholder.com/800x600/F05A43/FFFFFF?text=Land+${i+1}`),
    amenities: ['Road Access', 'Electricity Available'],
    badges: [],
    available_date: '2026-02-01',
    updated: '2026-01-20',
    featured: false
  },
  {
    id: 'PROP-DEMO-024',
    intent: 'sale',
    type: 'land',
    area: 'Bang Saray',
    title_th: 'ขายที่ดิน 800 ตารางวา วิวทะเล | บางเสร่',
    title_en: 'Land for Sale 800 SQW Sea View | Bang Saray',
    description_th: 'ที่ดินวิวทะเล 800 ตารางวา ทำเลดีมาก เหมาะสำหรับสร้างวิลล่าหรูหรา',
    description_en: 'Sea view land 800 sqw, excellent location, perfect for luxury villa.',
    price: 6000000,
    currency: 'THB',
    beds: null,
    baths: null,
    sqm: 3200,
    furnishing: 'N/A',
    image: 'https://via.placeholder.com/400x300/16A34A/FFFFFF?text=Land+Sea+View',
    images: Array(12).fill(null).map((_, i) => `https://via.placeholder.com/800x600/16A34A/FFFFFF?text=Sea+View+Land+${i+1}`),
    amenities: ['Sea View', 'Road Access', 'Electricity Available', 'Water Supply'],
    badges: ['Featured'],
    available_date: '2026-02-05',
    updated: '2026-01-26',
    featured: true
  }
];

// Get featured properties (6 for home page)
const FEATURED_PROPERTIES = ALL_PROPERTIES.filter(p => p.featured).slice(0, 6);

// Popular areas
const POPULAR_AREAS = [
  {
    name: 'Pattaya',
    name_th: 'พัทยา',
    image: 'https://via.placeholder.com/400x300/1744BE/FFFFFF?text=Pattaya',
    count: ALL_PROPERTIES.filter(p => p.area === 'Pattaya').length
  },
  {
    name: 'Jomtien',
    name_th: 'จอมเทียน',
    image: 'https://via.placeholder.com/400x300/F05A43/FFFFFF?text=Jomtien',
    count: ALL_PROPERTIES.filter(p => p.area === 'Jomtien').length
  },
  {
    name: 'Na Jomtien',
    name_th: 'นาจอมเทียน',
    image: 'https://via.placeholder.com/400x300/16A34A/FFFFFF?text=Na+Jomtien',
    count: ALL_PROPERTIES.filter(p => p.area === 'Na Jomtien').length
  },
  {
    name: 'Bang Saray',
    name_th: 'บางเสร่',
    image: 'https://via.placeholder.com/400x300/1744BE/FFFFFF?text=Bang+Saray',
    count: ALL_PROPERTIES.filter(p => p.area === 'Bang Saray').length
  },
  {
    name: 'Pratumnak',
    name_th: 'พระตำหนัก',
    image: 'https://via.placeholder.com/400x300/F05A43/FFFFFF?text=Pratumnak',
    count: ALL_PROPERTIES.filter(p => p.area === 'Pratumnak').length
  },
  {
    name: 'Huay Yai',
    name_th: 'ห้วยใหญ่',
    image: 'https://via.placeholder.com/400x300/16A34A/FFFFFF?text=Huay+Yai',
    count: ALL_PROPERTIES.filter(p => p.area === 'Huay Yai').length
  }
];

// Area Guides - Comprehensive information about 6 Pattaya areas
const AREA_GUIDES = {
  'pattaya': {
    name: { th: 'พัทยากลาง', en: 'Central Pattaya' },
    description: {
      th: 'ใจกลางเมืองพัทยา เต็มไปด้วยแหล่งบันเทิง ร้านอาหาร และห้างสรรพสินค้า เหมาะสำหรับผู้ที่ชื่นชอบไลฟ์สไตล์เมือง',
      en: 'Heart of Pattaya city filled with entertainment, restaurants, and shopping malls. Perfect for those who enjoy urban lifestyle.'
    },
    avg_price_sqm: 85000,
    price_trend_yoy: 8.5,
    residents: {
      th: 'นักท่องเที่ยว, นักลงทุน, ชาวต่างชาติ',
      en: 'Tourists, Investors, Expats'
    },
    highlights: {
      th: ['ใกล้ Walking Street', 'ห้างสรรพสินค้าหลายแห่ง', 'ชายหาดพัทยา', 'ร้านอาหารนานาชาติ', 'ชีวิตกลางคืนที่คึกคัก'],
      en: ['Near Walking Street', 'Multiple Shopping Malls', 'Pattaya Beach', 'International Restaurants', 'Vibrant Nightlife']
    },
    nearby: {
      th: {
        hospital: 'โรงพยาบาลพัทยา - 2 กม.',
        mall: 'เซ็นทรัลพัทยา - 0.5 กม.',
        airport: 'สนามบินอู่ตะเภา - 35 กม.'
      },
      en: {
        hospital: 'Pattaya Hospital - 2 km',
        mall: 'Central Pattaya - 0.5 km',
        airport: 'U-Tapao Airport - 35 km'
      }
    }
  },
  'jomtien': {
    name: { th: 'จอมเทียน', en: 'Jomtien' },
    description: {
      th: 'ชายหาดเงียบสงบ เหมาะสำหรับครอบครัวและผู้เกษียณ มีสิ่งอำนวยความสะดวกครบครัน ไม่วุ่นวายเหมือนพัทยากลาง',
      en: 'Peaceful beach area suitable for families and retirees. Well-equipped facilities without the hustle of Central Pattaya.'
    },
    avg_price_sqm: 75000,
    price_trend_yoy: 7.2,
    residents: {
      th: 'ครอบครัว, ผู้เกษียณ, Long-stay tourists',
      en: 'Families, Retirees, Long-stay tourists'
    },
    highlights: {
      th: ['ชายหาดยาว 6 กม.', 'บรรยากาศเงียบสงบ', 'ร้านอาหารริมทะเล', 'ตลาดสดและห้างสรรพสินค้า', 'กิจกรรมทางน้ำ'],
      en: ['6 km Long Beach', 'Peaceful Atmosphere', 'Beachfront Restaurants', 'Fresh Markets and Malls', 'Water Sports']
    },
    nearby: {
      th: {
        hospital: 'โรงพยาบาลกรุงเทพพัทยา - 5 กม.',
        mall: 'Harbor Pattaya - 3 กม.',
        airport: 'สนามบินอู่ตะเภา - 30 กม.'
      },
      en: {
        hospital: 'Bangkok Hospital Pattaya - 5 km',
        mall: 'Harbor Pattaya - 3 km',
        airport: 'U-Tapao Airport - 30 km'
      }
    }
  },
  'na-jomtien': {
    name: { th: 'นาจอมเทียน', en: 'Na Jomtien' },
    description: {
      th: 'พื้นที่เงียบสงบที่สุดในพัทยา บรรยากาศธรรมชาติ เหมาะสำหรับผู้ต้องการความเป็นส่วนตัวและพักผ่อน',
      en: 'The most peaceful area in Pattaya with natural atmosphere. Perfect for those seeking privacy and relaxation.'
    },
    avg_price_sqm: 65000,
    price_trend_yoy: 9.1,
    residents: {
      th: 'ผู้เกษียณ, นักลงทุนระยะยาว',
      en: 'Retirees, Long-term investors'
    },
    highlights: {
      th: ['ชายหาดสะอาด', 'ราคาย่อมเยา', 'พื้นที่กว้างขวาง', 'โครงการใหม่หลายแห่ง', 'น้อยคน ไม่แออัด'],
      en: ['Clean Beach', 'Affordable Prices', 'Spacious Areas', 'Many New Projects', 'Less Crowded']
    },
    nearby: {
      th: {
        hospital: 'โรงพยาบาลกรุงเทพพัทยา - 10 กม.',
        mall: 'Harbor Pattaya - 8 กม.',
        airport: 'สนามบินอู่ตะเภา - 25 กม.'
      },
      en: {
        hospital: 'Bangkok Hospital Pattaya - 10 km',
        mall: 'Harbor Pattaya - 8 km',
        airport: 'U-Tapao Airport - 25 km'
      }
    }
  },
  'pratumnak': {
    name: { th: 'พระตำหนัก', en: 'Pratumnak' },
    description: {
      th: 'พื้นที่พรีเมียม วิวทะเลสวยงาม ระหว่างพัทยาและจอมเทียน เหมาะสำหรับผู้มีกำลังซื้อสูง',
      en: 'Premium area with beautiful sea views between Pattaya and Jomtien. Ideal for high-net-worth individuals.'
    },
    avg_price_sqm: 120000,
    price_trend_yoy: 6.8,
    residents: {
      th: 'นักลงทุนต่างชาติ, Executive expats',
      en: 'Foreign investors, Executive expats'
    },
    highlights: {
      th: ['วิวทะเลพาโนรามา', 'โครงการหรูหรา', 'บิ๊กพุทธา', 'ติดเขา เย็นสบาย', 'ร้านอาหารชั้นนำ'],
      en: ['Panoramic Sea View', 'Luxury Projects', 'Big Buddha', 'Hill Location - Cool', 'Top Restaurants']
    },
    nearby: {
      th: {
        hospital: 'โรงพยาบาลพัทยา - 4 กม.',
        mall: 'Terminal 21 - 5 กม.',
        airport: 'สนามบินอู่ตะเภา - 32 กม.'
      },
      en: {
        hospital: 'Pattaya Hospital - 4 km',
        mall: 'Terminal 21 - 5 km',
        airport: 'U-Tapao Airport - 32 km'
      }
    }
  },
  'wong-amat': {
    name: { th: 'วงศ์อมาตย์', en: 'Wong Amat' },
    description: {
      th: 'ชายหาดสวยที่สุดในพัทยา เงียบสงบ มีโครงการคอนโดหรู เหมาะสำหรับผู้ต้องการ Luxury lifestyle',
      en: 'The most beautiful beach in Pattaya. Peaceful with luxury condos. Perfect for luxury lifestyle seekers.'
    },
    avg_price_sqm: 110000,
    price_trend_yoy: 7.5,
    residents: {
      th: 'นักลงทุนต่างชาติ, ผู้บริหาร',
      en: 'Foreign investors, Executives'
    },
    highlights: {
      th: ['หาดทรายขาวสะอาด', 'โครงการคอนโดหรู', 'ร้านอาหารริมทะเล', 'ไกลจากความวุ่นวาย', 'สนามกอล์ฟใกล้เคียง'],
      en: ['White Sandy Beach', 'Luxury Condos', 'Beachfront Dining', 'Away from Crowds', 'Nearby Golf Courses']
    },
    nearby: {
      th: {
        hospital: 'โรงพยาบาลพัทยา - 6 กม.',
        mall: 'เซ็นทรัลพัทยา - 7 กม.',
        airport: 'สนามบินอู่ตะเภา - 40 กม.'
      },
      en: {
        hospital: 'Pattaya Hospital - 6 km',
        mall: 'Central Pattaya - 7 km',
        airport: 'U-Tapao Airport - 40 km'
      }
    }
  },
  'bang-saray': {
    name: { th: 'บางเสร่', en: 'Bang Saray' },
    description: {
      th: 'หมู่บ้านชาวประมงสงบ ห่างจากตัวเมือง เหมาะสำหรับผู้ต้องการหนีความวุ่นวาย ราคาย่อมเยา',
      en: 'Peaceful fishing village away from the city. Perfect for those escaping the hustle. Affordable prices.'
    },
    avg_price_sqm: 55000,
    price_trend_yoy: 10.2,
    residents: {
      th: 'ผู้เกษียณ, นักลงทุนระยะยาว',
      en: 'Retirees, Long-term investors'
    },
    highlights: {
      th: ['บรรยากาศชนบท', 'ราคาที่ดินถูก', 'ใกล้สนามกอล์ฟ', 'ร้านอาหารซีฟู้ดสด', 'เติบโตรวดเร็ว'],
      en: ['Rural Atmosphere', 'Cheap Land Prices', 'Near Golf Courses', 'Fresh Seafood', 'Fast Growing']
    },
    nearby: {
      th: {
        hospital: 'โรงพยาบาลกรุงเทพพัทยา - 15 กม.',
        mall: 'Harbor Pattaya - 12 กม.',
        airport: 'สนามบินอู่ตะเภา - 20 กม.'
      },
      en: {
        hospital: 'Bangkok Hospital Pattaya - 15 km',
        mall: 'Harbor Pattaya - 12 km',
        airport: 'U-Tapao Airport - 20 km'
      }
    }
  }
};

// Developer Profiles - Top 5 developers in Pattaya
const DEVELOPERS = [
  {
    id: 'dev-001',
    name: 'Sansiri',
    logo: 'https://via.placeholder.com/120x60/1744BE/FFFFFF?text=Sansiri',
    rating: 4.8,
    projects_delivered: 45,
    projects_ongoing: 3,
    established_year: 1988,
    description: {
      th: 'ผู้พัฒนาอสังหาริมทรัพย์ชั้นนำของไทย มีประสบการณ์กว่า 35 ปี',
      en: 'Leading Thai property developer with over 35 years of experience'
    },
    specialties: {
      th: ['คอนโดหรู', 'บ้านเดี่ยว', 'โครงการพัทยา'],
      en: ['Luxury Condos', 'Single Houses', 'Pattaya Projects']
    },
    reviews_count: 1250,
    avg_rating: 4.8
  },
  {
    id: 'dev-002',
    name: 'Raimon Land',
    logo: 'https://via.placeholder.com/120x60/F05A43/FFFFFF?text=Raimon',
    rating: 4.7,
    projects_delivered: 12,
    projects_ongoing: 2,
    established_year: 2004,
    description: {
      th: 'ผู้เชี่ยวชาญด้านคอนโดหรูในพัทยา มุ่งเน้นคุณภาพและดีไซน์',
      en: 'Luxury condo specialist in Pattaya focused on quality and design'
    },
    specialties: {
      th: ['คอนโดริมทะเล', 'ดีไซน์โมเดิร์น', 'วิวทะเล'],
      en: ['Beachfront Condos', 'Modern Design', 'Sea Views']
    },
    reviews_count: 580,
    avg_rating: 4.7
  },
  {
    id: 'dev-003',
    name: 'Heights Holdings',
    logo: 'https://via.placeholder.com/120x60/16A34A/FFFFFF?text=Heights',
    rating: 4.6,
    projects_delivered: 8,
    projects_ongoing: 2,
    established_year: 2012,
    description: {
      th: 'พัฒนาคอนโดระดับไฮเอนด์ในพัทยา มีชื่อเสียงด้านการส่งมอบตรงเวลา',
      en: 'High-end condo developer in Pattaya known for on-time delivery'
    },
    specialties: {
      th: ['คอนโดหรู', 'สระว่ายน้ำสวย', 'สิ่งอำนวยความสะดวกครบ'],
      en: ['Luxury Condos', 'Beautiful Pools', 'Full Facilities']
    },
    reviews_count: 420,
    avg_rating: 4.6
  },
  {
    id: 'dev-004',
    name: 'Nova Group',
    logo: 'https://via.placeholder.com/120x60/1744BE/FFFFFF?text=Nova',
    rating: 4.5,
    projects_delivered: 15,
    projects_ongoing: 4,
    established_year: 2009,
    description: {
      th: 'ผู้พัฒนาที่หลากหลาย ตั้งแต่คอนโดราคาประหยัดถึงโครงการหรู',
      en: 'Versatile developer from budget condos to luxury projects'
    },
    specialties: {
      th: ['คอนโดราคาประหยัด', 'โครงการขนาดใหญ่', 'ทำเลดี'],
      en: ['Affordable Condos', 'Large Projects', 'Prime Locations']
    },
    reviews_count: 890,
    avg_rating: 4.5
  },
  {
    id: 'dev-005',
    name: 'Laguna Property',
    logo: 'https://via.placeholder.com/120x60/F05A43/FFFFFF?text=Laguna',
    rating: 4.7,
    projects_delivered: 6,
    projects_ongoing: 1,
    established_year: 2015,
    description: {
      th: 'เชี่ยวชาญด้านโครงการริมทะเล มุ่งเน้นไลฟ์สไตล์รีสอร์ท',
      en: 'Beachfront project specialist focused on resort lifestyle'
    },
    specialties: {
      th: ['โครงการริมทะเล', 'สไตล์รีสอร์ท', 'สระว่ายน้ำใหญ่'],
      en: ['Beachfront Projects', 'Resort Style', 'Large Pools']
    },
    reviews_count: 320,
    avg_rating: 4.7
  }
];

// Market Statistics - Price trends and insights
const MARKET_STATS = {
  avg_price_by_type: [
    { type: 'condo', type_th: 'คอนโด', avg_price_sqm: 85000, yoy_change: 7.5 },
    { type: 'house', type_th: 'บ้าน', avg_price_sqm: 65000, yoy_change: 6.2 },
    { type: 'villa', type_th: 'วิลล่า', avg_price_sqm: 95000, yoy_change: 8.1 }
  ],
  hot_areas: [
    { area: 'Na Jomtien', area_th: 'นาจอมเทียน', growth: 10.2, reason_th: 'โครงการใหม่หลายแห่ง', reason_en: 'Many new projects' },
    { area: 'Bang Saray', area_th: 'บางเสร่', growth: 9.8, reason_th: 'ใกล้สนามบิน', reason_en: 'Near airport' },
    { area: 'Pattaya', area_th: 'พัทยากลาง', growth: 8.5, reason_th: 'ความต้องการสูง', reason_en: 'High demand' }
  ],
  rental_yields: {
    condo: { gross: 6.5, net: 4.8 },
    villa: { gross: 5.2, net: 3.5 },
    house: { gross: 5.8, net: 4.0 }
  },
  occupancy_rates: {
    short_term: 72,
    long_term: 85,
    annual: 78
  }
};

// Testimonials - Customer reviews
const TESTIMONIALS = [
  {
    id: 'test-001',
    name: 'John Miller',
    nationality: 'USA',
    photo: 'https://i.pravatar.cc/150?img=12',
    rating: 5,
    comment: {
      th: 'บริการยอดเยี่ยม! ทีมงานช่วยเหลือดีมากตั้งแต่ต้นจนจบ พบทรัพย์ที่ใช่ภายใน 2 สัปดาห์',
      en: 'Excellent service! The team was very helpful from start to finish. Found my perfect property within 2 weeks.'
    },
    property_type: 'Condo',
    date: '2025-12-15'
  },
  {
    id: 'test-002',
    name: 'สมชาย วงศ์ใหญ่',
    nationality: 'Thailand',
    photo: 'https://i.pravatar.cc/150?img=33',
    rating: 5,
    comment: {
      th: 'ขอบคุณครับที่ช่วยหาคอนโดให้ลูกค้า ROI ดีมาก คุ้มค่าที่ลงทุน แนะนำเลยครับ',
      en: 'Thank you for helping me find a great investment condo. Excellent ROI, worth the investment. Highly recommended.'
    },
    property_type: 'Condo',
    date: '2026-01-10'
  },
  {
    id: 'test-003',
    name: 'Emma Thompson',
    nationality: 'UK',
    photo: 'https://i.pravatar.cc/150?img=45',
    rating: 5,
    comment: {
      th: 'ตัวแทนมืออาชีพมาก อธิบายทุกขั้นตอนชัดเจน ช่วยเรื่องเอกสารและกฎหมายด้วย',
      en: 'Very professional agents. Clear explanations of every step. Helped with documents and legal matters.'
    },
    property_type: 'Villa',
    date: '2025-11-22'
  },
  {
    id: 'test-004',
    name: 'Hans Schmidt',
    nationality: 'Germany',
    photo: 'https://i.pravatar.cc/150?img=52',
    rating: 4,
    comment: {
      th: 'ประทับใจบริการหลังการขาย ช่วยดูแลอสังหาและหาผู้เช่าให้ พอใจมากครับ',
      en: 'Impressed with after-sales service. They help manage the property and find tenants. Very satisfied.'
    },
    property_type: 'Condo',
    date: '2025-10-05'
  },
  {
    id: 'test-005',
    name: 'Wei Chen',
    nationality: 'China',
    photo: 'https://i.pravatar.cc/150?img=68',
    rating: 5,
    comment: {
      th: 'ทีมงานพูดภาษาจีนได้ ทำให้สื่อสารสะดวก บริการดีเยี่ยม แนะนำเพื่อนมาหลายคน',
      en: 'Team speaks Chinese which made communication easy. Excellent service. Recommended to many friends.'
    },
    property_type: 'House',
    date: '2025-12-28'
  },
  {
    id: 'test-006',
    name: 'นิภา ศรีสวัสดิ์',
    nationality: 'Thailand',
    photo: 'https://i.pravatar.cc/150?img=47',
    rating: 5,
    comment: {
      th: 'ซื้อคอนโดเป็นของขวัญเกษียณให้ตัวเอง บริการดีมาก ช่วยจัดการทุกอย่าง ขอบคุณค่ะ',
      en: 'Bought a condo as a retirement gift for myself. Great service, handled everything. Thank you.'
    },
    property_type: 'Condo',
    date: '2026-01-18'
  },
  {
    id: 'test-007',
    name: 'Alexey Petrov',
    nationality: 'Russia',
    photo: 'https://i.pravatar.cc/150?img=59',
    rating: 4,
    comment: {
      th: 'ทีมงานพูดภาษารัสเซียได้ เข้าใจความต้องการดี แนะนำอสังหาที่เหมาะสมมาก',
      en: 'Team speaks Russian. Understood my needs well. Recommended very suitable properties.'
    },
    property_type: 'Villa',
    date: '2025-11-30'
  },
  {
    id: 'test-008',
    name: 'Sarah Johnson',
    nationality: 'Australia',
    photo: 'https://i.pravatar.cc/150?img=26',
    rating: 5,
    comment: {
      th: 'บริการหลังการขายดีมาก ช่วยดูแลบ้านตอนที่ไม่อยู่ ไว้วางใจได้ ขอบคุณค่ะ',
      en: 'Excellent after-sales service. They take care of my house when I\'m away. Very trustworthy. Thank you.'
    },
    property_type: 'House',
    date: '2026-01-05'
  }
];

// Trust Signals - Company credentials and achievements
const TRUST_SIGNALS = {
  license: {
    th: 'ได้รับใบอนุญาตจากกรมที่ดิน',
    en: 'Licensed by Department of Lands'
  },
  experience_years: 10,
  properties_sold: 500,
  languages: ['TH', 'EN', 'RU', 'CN'],
  google_rating: 4.9,
  google_reviews: 450,
  achievements: [
    { th: 'รางวัลตัวแทนอสังหายอดเยี่ยม 2024', en: 'Best Real Estate Agent Award 2024' },
    { th: 'สมาชิก AREA (สมาคมตัวแทนอสังหาฯ)', en: 'AREA Member (Real Estate Agent Association)' }
  ]
};

// Make data globally available
if (typeof window !== 'undefined') {
  window.AMP = window.AMP || {};
  window.AMP.areaData = AREA_GUIDES;
  window.AMP.developers = DEVELOPERS;
  window.AMP.marketStats = MARKET_STATS;
  window.AMP.testimonials = TESTIMONIALS;
  window.AMP.trustSignals = TRUST_SIGNALS;
}
