/**
 * Hashtag Strategy Configuration
 * Manages hashtags for different categories, locations, and languages
 */

const HASHTAGS = {
  // Brand hashtags (always used)
  brand: [
    '#AssetManagementProperty',
    '#AMPPattaya',
    '#อสังหาพัทยา',
    '#PattayaRealEstate'
  ],
  
  // Location hashtags
  location: {
    pattaya: ['#Pattaya', '#พัทยา', '#PattayaCity'],
    jomtien: ['#Jomtien', '#จอมเทียน', '#JomtienBeach'],
    naklua: ['#Naklua', '#นาเกลือ', '#NakluaBeach'],
    pratumnak: ['#Pratumnak', '#ประตูน้ำ', '#PratumnakHill'],
    central: ['#CentralPattaya', '#พัทยากลาง', '#PattayaCentral'],
    huayYai: ['#HuayYai', '#ห้วยใหญ่', '#EastPattaya']
  },
  
  // Category hashtags
  category: {
    sale: ['#PropertyForSale', '#ขายบ้าน', '#CondoForSale', '#ขายคอนโด'],
    rent: ['#PropertyForRent', '#เช่าบ้าน', '#CondoForRent', '#เช่าคอนโด'],
    investment: ['#PropertyInvestment', '#ลงทุนอสังหา', '#RealEstateInvest', '#ROI'],
    newLaunch: ['#NewProject', '#โครงการใหม่', '#NewLaunch', '#Presale'],
    knowledge: ['#PropertyKnowledge', '#ความรู้อสังหา', '#RealEstateTips'],
    legal: ['#PropertyLaw', '#กฎหมายอสังหา', '#ThaiPropertyLaw']
  },
  
  // Trending hashtags
  trending: {
    th: ['#อสังหา2026', '#บ้านในฝัน', '#ซื้อบ้าน', '#ลงทุนอสังหา'],
    en: ['#RealEstate2026', '#DreamHome', '#PropertyInvestment'],
    cn: ['#泰国房产', '#芭提雅', '#海景房', '#投资'],
    ru: ['#НедвижимостьТаиланда', '#Паттайя', '#Инвестиции']
  },
  
  // Engagement boosters
  engagement: [
    '#HomeSweet',
    '#DreamHome',
    '#SeaView',
    '#LuxuryLiving',
    '#BeachLife',
    '#InvestSmart',
    '#PropertyGoals'
  ]
};

/**
 * Generate hashtags for a post based on category, location, and language
 * @param {string} category - Content category (resale, rent, new_project, etc.)
 * @param {string} location - Property location (pattaya, jomtien, etc.)
 * @param {string} language - Content language (th, en, cn, ru)
 * @returns {Array<string>} Array of unique hashtags (max 15)
 */
function generateHashtags(category, location, language = 'th') {
  const tags = new Set();
  
  // Always add brand hashtags
  HASHTAGS.brand.forEach(tag => tags.add(tag));
  
  // Add location hashtags if available
  if (location && HASHTAGS.location[location]) {
    HASHTAGS.location[location].forEach(tag => tags.add(tag));
  }
  
  // Map content categories to hashtag categories
  const categoryMap = {
    resale: 'sale',
    rent: 'rent',
    new_project: 'newLaunch',
    investment: 'investment',
    knowledge: 'knowledge',
    legal: 'legal',
    news: 'knowledge', // Use knowledge tags for news
    lifestyle: 'engagement' // Use engagement tags for lifestyle
  };
  
  const hashtagCategory = categoryMap[category] || 'sale';
  
  // Add category hashtags
  if (HASHTAGS.category[hashtagCategory]) {
    HASHTAGS.category[hashtagCategory].forEach(tag => tags.add(tag));
  }
  
  // Add trending hashtags for language
  if (HASHTAGS.trending[language]) {
    HASHTAGS.trending[language].slice(0, 2).forEach(tag => tags.add(tag));
  }
  
  // Add some engagement hashtags
  HASHTAGS.engagement.slice(0, 2).forEach(tag => tags.add(tag));
  
  // Convert to array and limit to 15 hashtags
  return Array.from(tags).slice(0, 15);
}

module.exports = {
  HASHTAGS,
  generateHashtags
};
