import 'server-only';

export type LocalizedText = {
  en: string;
  th: string;
};

export type ContentLink = {
  label: LocalizedText;
  href: string;
};

export type BlogPostEntity = {
  slug: string;
  title: LocalizedText;
  excerpt?: LocalizedText;
  category?: LocalizedText;
  readTime?: LocalizedText;
  publishedAt: string;
  updatedAt?: string;
  heroImageUrl?: string | null;
  body?: {
    en: string[];
    th: string[];
  };
  relatedGuides?: string[];
  links?: ContentLink[];
};

export type GuideEntity = {
  slug: string;
  title: LocalizedText;
  summary?: LocalizedText;
  publishedAt: string;
  updatedAt?: string;
  heroImageUrl?: string | null;
  checklist?: {
    en: string[];
    th: string[];
  };
  relatedBlogPosts?: string[];
  links?: ContentLink[];
};

const BLOG_POSTS: BlogPostEntity[] = [
  {
    slug: 'pattaya-real-estate-investment-guide-2025',
    title: {
      en: 'Pattaya Property Investment: Practical Framework',
      th: 'ลงทุนอสังหาฯ พัทยา: กรอบคิดใช้งานจริง',
    },
    excerpt: {
      en: 'A practical framework to shortlist Pattaya properties by goal, budget, and risk tolerance.',
      th: 'กรอบคิดแบบใช้งานจริงในการ shortlist อสังหาฯ พัทยาตามเป้าหมาย งบประมาณ และความเสี่ยงที่รับได้',
    },
    category: { en: 'Investment', th: 'การลงทุน' },
    readTime: { en: '8 min read', th: 'อ่าน 8 นาที' },
    publishedAt: '2025-01-15',
    updatedAt: '2026-02-01',
    heroImageUrl: null,
    body: {
      en: [
        'Start by defining your primary objective: own-use, rental income, or long-term capital preservation. This objective should drive every shortlist decision.',
        'Compare candidate projects with the same checklist: legal readiness, building condition, rental demand context, and total carrying cost.',
        'Use area context and project fit together. A good area does not guarantee a good unit, and a good unit can still underperform in the wrong context.',
      ],
      th: [
        'เริ่มจากระบุเป้าหมายหลักให้ชัด: อยู่เอง ปล่อยเช่า หรือรักษามูลค่าในระยะยาว แล้วใช้เป้าหมายนั้นเป็นตัวนำการตัดสินใจทุกครั้ง',
        'เปรียบเทียบโครงการด้วยเช็กลิสต์เดียวกัน เช่น ความพร้อมด้านเอกสาร สภาพอาคาร บริบทดีมานด์เช่า และต้นทุนรวมการถือครอง',
        'พิจารณาทั้งทำเลและยูนิตร่วมกันเสมอ ทำเลดีอย่างเดียวไม่การันตีผลลัพธ์ และยูนิตดีอาจไม่ตอบโจทย์หากบริบทไม่เหมาะ',
      ],
    },
    relatedGuides: ['roi-pattaya-condos', 'foreign-condo-ownership-thailand'],
    links: [
      { label: { en: 'Browse projects', th: 'ดูโครงการ' }, href: '/projects' },
      { label: { en: 'Talk to advisor', th: 'คุยกับที่ปรึกษา' }, href: '/contact' },
    ],
  },
  {
    slug: 'buying-condo-thailand-foreigner-complete-guide',
    title: {
      en: 'Buying Condo in Thailand: Foreigner Checklist',
      th: 'ซื้อคอนโดในไทยสำหรับต่างชาติ: เช็กลิสต์สำคัญ',
    },
    excerpt: {
      en: 'A concise checklist for documentation flow, transfer readiness, and advisor handover items.',
      th: 'เช็กลิสต์สั้น ๆ สำหรับลำดับเอกสาร ความพร้อมวันโอน และข้อมูลที่ต้องส่งต่อให้ที่ปรึกษา',
    },
    category: { en: 'Guide', th: 'คู่มือ' },
    readTime: { en: '10 min read', th: 'อ่าน 10 นาที' },
    publishedAt: '2025-01-10',
    updatedAt: '2026-01-22',
    heroImageUrl: null,
    body: {
      en: [
        'Prepare a complete document pack before reservation so each next step can be validated quickly.',
        'Confirm payment path and transfer-day responsibilities in writing before signing.',
        'When uncertain, ask for written clarification and keep all timelines and conditions in one checklist.',
      ],
      th: [
        'เตรียมชุดเอกสารให้ครบก่อนจองเพื่อให้ตรวจสอบแต่ละขั้นตอนถัดไปได้รวดเร็ว',
        'ยืนยันเส้นทางการชำระเงินและความรับผิดชอบในวันโอนเป็นลายลักษณ์อักษรก่อนลงนาม',
        'หากมีจุดไม่ชัดเจน ให้ขอคำอธิบายเป็นข้อความ และรวบ timeline/เงื่อนไขไว้ในเช็กลิสต์เดียว',
      ],
    },
    relatedGuides: ['foreign-condo-ownership-thailand'],
    links: [
      { label: { en: 'Open condo listings', th: 'ดูคอนโดทั้งหมด' }, href: '/buy/condo-pattaya' },
      { label: { en: 'Request consultation', th: 'ขอคำปรึกษา' }, href: '/contact' },
    ],
  },
  {
    slug: 'top-areas-pattaya-investment-2025',
    title: {
      en: 'How to Compare Pattaya Areas for Investment',
      th: 'วิธีเทียบทำเลพัทยาเพื่อการลงทุน',
    },
    excerpt: {
      en: 'Use one comparison sheet across areas to keep decision quality consistent.',
      th: 'ใช้ตารางเทียบชุดเดียวกันทุกทำเล เพื่อรักษาคุณภาพการตัดสินใจให้สม่ำเสมอ',
    },
    category: { en: 'Market Context', th: 'บริบทตลาด' },
    readTime: { en: '7 min read', th: 'อ่าน 7 นาที' },
    publishedAt: '2024-12-20',
    updatedAt: '2026-02-03',
    heroImageUrl: null,
    body: {
      en: [
        'Define your acceptable variance for budget, commute, and property management complexity before comparing areas.',
        'Use validated project and property data in each area instead of headline claims.',
      ],
      th: [
        'กำหนดช่วงความยืดหยุ่นของงบ ระยะทาง และความซับซ้อนในการบริหารทรัพย์ก่อนเริ่มเทียบทำเล',
        'ใช้ข้อมูลโครงการและทรัพย์ที่ตรวจสอบได้ในแต่ละทำเล แทนการตัดสินใจจากคำโฆษณาเพียงอย่างเดียว',
      ],
    },
    relatedGuides: ['best-condos-jomtien', 'luxury-condos-pattaya'],
  },
  {
    slug: 'pattaya-rental-yield-analysis',
    title: {
      en: 'Rental Performance Review: What to Check First',
      th: 'ทบทวนศักยภาพปล่อยเช่า: ควรเช็กอะไรเป็นอันดับแรก',
    },
    publishedAt: '2024-12-10',
    updatedAt: '2026-02-04',
    heroImageUrl: null,
    body: {
      en: [],
      th: [],
    },
    links: [
      { label: { en: 'Browse rental-ready options', th: 'ดูตัวเลือกที่พร้อมปล่อยเช่า' }, href: '/rent/condo-pattaya' },
    ],
  },
];

const GUIDES: GuideEntity[] = [
  {
    slug: 'best-condos-jomtien',
    title: { en: 'Best Condos in Jomtien', th: 'คอนโดน่าอยู่ในจอมเทียน' },
    summary: {
      en: 'A practical guide for filtering condo options in Jomtien by use case and operating constraints.',
      th: 'คู่มือใช้งานจริงในการคัดคอนโดในจอมเทียนตามการใช้งานและข้อจำกัดด้านการถือครอง',
    },
    publishedAt: '2025-01-05',
    updatedAt: '2026-01-25',
    heroImageUrl: null,
    checklist: {
      en: ['Confirm building policy and common fee context', 'Review unit layout fit for your use case', 'Validate sale and transfer readiness'],
      th: ['ตรวจสอบนโยบายอาคารและบริบทค่าส่วนกลาง', 'ดูความเหมาะสมของผังห้องต่อการใช้งาน', 'ยืนยันความพร้อมด้านเอกสารซื้อขายและโอน'],
    },
    relatedBlogPosts: ['top-areas-pattaya-investment-2025'],
    links: [
      { label: { en: 'See Jomtien options', th: 'ดูตัวเลือกในจอมเทียน' }, href: '/buy/condo-pattaya' },
    ],
  },
  {
    slug: 'luxury-condos-pattaya',
    title: { en: 'Luxury Condos Pattaya', th: 'คอนโดหรูพัทยา' },
    summary: {
      en: 'A checklist to compare premium inventory without over-weighting marketing claims.',
      th: 'เช็กลิสต์เปรียบเทียบ inventory ระดับพรีเมียมโดยไม่ยึดติดกับคำโฆษณามากเกินไป',
    },
    publishedAt: '2025-01-06',
    updatedAt: '2026-01-25',
    heroImageUrl: null,
    checklist: {
      en: ['Check unit privacy and view permanence assumptions', 'Review building operations and service reliability', 'Align holding plan with exit flexibility'],
      th: ['ตรวจสอบความเป็นส่วนตัวยูนิตและสมมติฐานเรื่องวิว', 'ทบทวนคุณภาพการบริหารอาคารและบริการ', 'จัดแผนถือครองให้สอดคล้องกับความยืดหยุ่นตอนขายต่อ'],
    },
    relatedBlogPosts: ['pattaya-real-estate-investment-guide-2025'],
  },
  {
    slug: 'foreign-condo-ownership-thailand',
    title: { en: 'Foreign Ownership Guide (Thailand)', th: 'คู่มือโควต้าต่างชาติ (ไทย)' },
    summary: {
      en: 'A straightforward sequence for foreign condo buyers to reduce process uncertainty.',
      th: 'ลำดับขั้นตอนแบบตรงไปตรงมาสำหรับผู้ซื้อต่างชาติ เพื่อลดความไม่แน่นอนระหว่างดำเนินการ',
    },
    publishedAt: '2025-01-03',
    updatedAt: '2026-01-20',
    heroImageUrl: null,
    checklist: {
      en: ['Prepare identity and transfer documents early', 'Confirm contract checkpoints in writing', 'Coordinate advisor, bank, and legal timeline'],
      th: ['เตรียมเอกสารยืนยันตัวตนและโอนเงินล่วงหน้า', 'ยืนยัน checkpoint ในสัญญาเป็นลายลักษณ์อักษร', 'จัด timeline ร่วมกันระหว่างที่ปรึกษา ธนาคาร และฝ่ายกฎหมาย'],
    },
    relatedBlogPosts: ['buying-condo-thailand-foreigner-complete-guide'],
  },
  {
    slug: 'roi-pattaya-condos',
    title: { en: 'ROI Analysis: Pattaya Condos', th: 'วิเคราะห์ผลตอบแทนคอนโดพัทยา' },
    publishedAt: '2024-12-29',
    updatedAt: '2026-02-02',
    heroImageUrl: null,
    checklist: {
      en: [],
      th: [],
    },
    relatedBlogPosts: ['pattaya-rental-yield-analysis'],
  },
  {
    slug: 'pool-villa-pattaya',
    title: { en: 'Pool Villas in Pattaya', th: 'พูลวิลล่าพัทยา' },
    summary: {
      en: 'Key checks for pool-villa inventory, operation model, and maintenance planning.',
      th: 'หัวข้อสำคัญในการตรวจพูลวิลล่า โมเดลการใช้งาน และการวางแผนดูแลรักษา',
    },
    publishedAt: '2024-12-15',
    updatedAt: '2026-01-30',
    heroImageUrl: null,
    checklist: {
      en: ['Map occupancy goals to operating model', 'Plan maintenance and service workflows', 'Validate location fit for target guest profile'],
      th: ['จับคู่เป้าหมายการใช้งานกับโมเดลบริหาร', 'วางแผน workflow งานดูแลและบริการ', 'ตรวจความเหมาะสมของทำเลกับกลุ่มผู้ใช้งานเป้าหมาย'],
    },
  },
  {
    slug: 'cost-of-living-pattaya',
    title: { en: 'Cost of Living in Pattaya', th: 'ค่าครองชีพในพัทยา' },
    summary: {
      en: 'A planning template to estimate recurring living costs by lifestyle scenario.',
      th: 'เทมเพลตวางแผนค่าใช้จ่ายประจำตามรูปแบบการใช้ชีวิต',
    },
    publishedAt: '2024-12-12',
    updatedAt: '2026-01-28',
    heroImageUrl: null,
    checklist: {
      en: ['List fixed monthly costs first', 'Track optional lifestyle spending separately', 'Plan reserve for seasonality and one-off expenses'],
      th: ['แยกรายจ่ายคงที่รายเดือนก่อน', 'ติดตามรายจ่ายไลฟ์สไตล์แยกต่างหาก', 'กันงบสำรองสำหรับฤดูกาลและค่าใช้จ่ายครั้งคราว'],
    },
  },
];

export function getBlogPosts(): BlogPostEntity[] {
  return BLOG_POSTS;
}

export function getBlogPostBySlug(slug: string): BlogPostEntity | null {
  return BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export function getGuideArticles(): GuideEntity[] {
  return GUIDES;
}

export function getGuideArticleBySlug(slug: string): GuideEntity | null {
  return GUIDES.find((guide) => guide.slug === slug) ?? null;
}

export function getBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}

export function getGuideSlugs(): string[] {
  return GUIDES.map((guide) => guide.slug);
}
