const OpenAI = require('openai');
const Property = require('../models/Property');
const ContentPost = require('../models/ContentPost');
const { generateHashtags } = require('../config/hashtags');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Content templates and prompts for different categories and languages
const CONTENT_TEMPLATES = {
  resale: {
    th: {
      systemPrompt: `คุณเป็น Content Creator มืออาชีพสำหรับธุรกิจอสังหาริมทรัพย์ Asset Management Property ในพัทยา
เขียนโพสต์ขายห้อง Resale ภาษาไทยที่น่าสนใจ มืออาชีพแต่เป็นกันเอง
- เน้นรายละเอียดที่สำคัญ: ราคา ขนาด จำนวนห้อง วิว สิ่งอำนวยความสะดวก
- ใส่ข้อดีของทำเลและโครงการ
- CTA ชัดเจน: ติดต่อเราวันนี้
- ความยาว: 150-250 คำ
- ใช้ emoji ให้เหมาะสม`,
      userPrompt: (property) => `สร้างโพสต์ขายห้อง:
โครงการ: ${property.project_name || 'N/A'}
ทำเล: ${property.location || 'Pattaya'}
ประเภท: ${property.property_type}
ราคา: ${formatPrice(property.price)}
${property.bedrooms ? `ห้องนอน: ${property.bedrooms}` : ''}
${property.bathrooms ? `ห้องน้ำ: ${property.bathrooms}` : ''}
${property.area_sqm ? `พื้นที่: ${property.area_sqm} ตร.ม.` : ''}
${property.view ? `วิว: ${property.view}` : ''}
${property.amenities.length ? `สิ่งอำนวยความสะดวก: ${property.amenities.join(', ')}` : ''}`
    },
    en: {
      systemPrompt: `You are a professional Content Creator for Asset Management Property real estate in Pattaya.
Write engaging property listing in English, professional but friendly tone.
- Focus on key details: price, size, rooms, view, amenities
- Highlight location benefits
- Clear CTA: Contact us today
- Length: 150-250 words
- Use emojis appropriately`,
      userPrompt: (property) => `Create property listing:
Project: ${property.project_name || 'N/A'}
Location: ${property.location || 'Pattaya'}
Type: ${property.property_type}
Price: ${formatPrice(property.price)}
${property.bedrooms ? `Bedrooms: ${property.bedrooms}` : ''}
${property.bathrooms ? `Bathrooms: ${property.bathrooms}` : ''}
${property.area_sqm ? `Area: ${property.area_sqm} sqm` : ''}
${property.view ? `View: ${property.view}` : ''}
${property.amenities.length ? `Amenities: ${property.amenities.join(', ')}` : ''}`
    },
    cn: {
      systemPrompt: `你是泰国芭提雅Asset Management Property房地产公司的专业内容创作者。
用中文撰写吸引人的房产销售帖子，专业而友好。
- 重点突出：价格、面积、房间数、景观、设施
- 强调地理位置优势
- 明确号召：今天联系我们
- 长度：150-250字
- 适当使用表情符号`,
      userPrompt: (property) => `创建房产销售帖：
项目: ${property.project_name || '待定'}
位置: ${property.location || '芭提雅'}
类型: ${property.property_type}
价格: ${formatPrice(property.price)}
${property.bedrooms ? `卧室: ${property.bedrooms}` : ''}
${property.bathrooms ? `浴室: ${property.bathrooms}` : ''}
${property.area_sqm ? `面积: ${property.area_sqm} 平方米` : ''}
${property.view ? `景观: ${property.view}` : ''}
${property.amenities.length ? `设施: ${property.amenities.join(', ')}` : ''}`
    }
  },
  
  rent: {
    th: {
      systemPrompt: `คุณเป็น Content Creator สำหรับการให้เช่าคอนโดในพัทยา
เขียนโพสต์ให้เช่าภาษาไทยที่น่าสนใจ เน้นความสะดวกสบาย
- เน้นราคาเช่า ความสะดวกในการเดินทาง สิ่งอำนวยความสะดวก
- เหมาะกับ Expats และคนทำงาน
- CTA: ติดต่อดูห้อง
- ความยาว: 120-200 คำ`,
      userPrompt: (property) => `สร้างโพสต์ให้เช่า:
โครงการ: ${property.project_name || 'N/A'}
ทำเล: ${property.location || 'Pattaya'}
ราคา: ${formatPrice(property.price)}/เดือน
${property.bedrooms ? `ห้องนอน: ${property.bedrooms}` : ''}
${property.area_sqm ? `พื้นที่: ${property.area_sqm} ตร.ม.` : ''}
${property.amenities.length ? `สิ่งอำนวยความสะดวก: ${property.amenities.join(', ')}` : ''}`
    },
    en: {
      systemPrompt: `You are a Content Creator for condo rentals in Pattaya.
Write engaging rental listing in English, focus on convenience and lifestyle.
- Highlight: rental price, convenient location, amenities
- Target: Expats and professionals
- CTA: Contact to view
- Length: 120-200 words`,
      userPrompt: (property) => `Create rental listing:
Project: ${property.project_name || 'N/A'}
Location: ${property.location || 'Pattaya'}
Rent: ${formatPrice(property.price)}/month
${property.bedrooms ? `Bedrooms: ${property.bedrooms}` : ''}
${property.area_sqm ? `Area: ${property.area_sqm} sqm` : ''}
${property.amenities.length ? `Amenities: ${property.amenities.join(', ')}` : ''}`
    }
  },
  
  new_project: {
    th: {
      systemPrompt: `คุณเป็น Content Creator สำหรับการประกาศเปิดตัวโครงการใหม่
สร้างความตื่นเต้น มืออาชีพ น่าเชื่อถือ
- เน้นความพิเศษของโครงการใหม่
- ข้อมูลผู้พัฒนา โปรโมชั่น
- สร้าง FOMO และ urgency
- CTA: จองด่วน / สอบถามรายละเอียด
- ความยาว: 200-300 คำ`,
      userPrompt: (property) => `สร้างโพสต์เปิดตัวโครงการใหม่:
โครงการ: ${property.project_name || 'โครงการใหม่'}
ผู้พัฒนา: ${property.developer || 'N/A'}
ทำเล: ${property.location || 'Pattaya'}
ราคาเริ่มต้น: ${formatPrice(property.price)}
${property.highlights.length ? `จุดเด่น: ${property.highlights.join(', ')}` : ''}
${property.amenities.length ? `สิ่งอำนวยความสะดวก: ${property.amenities.join(', ')}` : ''}`
    },
    en: {
      systemPrompt: `You are a Content Creator for new project launches.
Create excitement, professional, trustworthy tone.
- Highlight: project uniqueness and benefits
- Developer info, promotions
- Create FOMO and urgency
- CTA: Book now / Inquire today
- Length: 200-300 words`,
      userPrompt: (property) => `Create new project launch post:
Project: ${property.project_name || 'New Project'}
Developer: ${property.developer || 'N/A'}
Location: ${property.location || 'Pattaya'}
Starting Price: ${formatPrice(property.price)}
${property.highlights.length ? `Highlights: ${property.highlights.join(', ')}` : ''}
${property.amenities.length ? `Amenities: ${property.amenities.join(', ')}` : ''}`
    }
  },
  
  knowledge: {
    th: {
      systemPrompt: `คุณเป็นผู้เชี่ยวชาญอสังหาริมทรัพย์พัทยา
เขียนบทความให้ความรู้ มีประโยชน์ ง่ายต่อการเข้าใจ
- แชร์เคล็ดลับการลงทุน การซื้อขาย
- ข้อมูลตลาด แนวโน้ม
- สร้างความน่าเชื่อถือ
- ความยาว: 250-350 คำ`,
      userPrompt: (topic) => `เขียนบทความความรู้เรื่อง: ${topic || 'การลงทุนอสังหาพัทยา'}`
    },
    en: {
      systemPrompt: `You are a Pattaya real estate expert.
Write educational content, valuable, easy to understand.
- Share investment tips, buying/selling advice
- Market insights, trends
- Build trust and authority
- Length: 250-350 words`,
      userPrompt: (topic) => `Write knowledge article about: ${topic || 'Pattaya Real Estate Investment'}`
    }
  },
  
  legal: {
    th: {
      systemPrompt: `คุณเป็นผู้เชี่ยวชาญกฎหมายอสังหาริมทรัพย์ไทย
เขียนบทความให้ความรู้ทางกฎหมาย เข้าใจง่าย แม่นยำ
- กฎหมายสำหรับชาวต่างชาติ
- ขั้นตอนการซื้อ-ขาย
- ภาษีและค่าธรรมเนียม
- ความยาว: 300-400 คำ`,
      userPrompt: (topic) => `เขียนบทความกฎหมายเรื่อง: ${topic || 'ชาวต่างชาติซื้ออสังหาในไทย'}`
    },
    en: {
      systemPrompt: `You are a Thai property law expert.
Write legal knowledge content, easy to understand, accurate.
- Property laws for foreigners
- Buying/selling procedures
- Taxes and fees
- Length: 300-400 words`,
      userPrompt: (topic) => `Write legal article about: ${topic || 'Foreigners Buying Property in Thailand'}`
    }
  }
};

// Suggested publish times by language/target audience
const PUBLISH_TIMES = {
  th: { hour: 18, minute: 0 }, // 6 PM - Thai audience after work
  en: { hour: 15, minute: 0 }, // 3 PM - European audience
  cn: { hour: 11, minute: 0 }, // 11 AM - Chinese audience
  ru: { hour: 13, minute: 0 }  // 1 PM - Russian audience
};

/**
 * Generate content for a property
 * @param {string} propertyId - Property ID
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated content post
 */
async function generateContent(propertyId, options = {}) {
  try {
    console.log(`📝 Generating content for property: ${propertyId}`);
    
    // Load property
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }
    
    // Determine category and languages
    const category = options.category || mapSourceToCategory(property.source_category);
    const languages = options.languages || determineLanguages(category);
    
    // Generate content for each language
    const results = [];
    for (const language of languages) {
      try {
        const content = await generateSingleContent(property, category, language);
        results.push(content);
        console.log(`✅ Generated ${language} content for ${category}`);
      } catch (error) {
        console.error(`❌ Error generating ${language} content:`, error);
      }
    }
    
    // Update property status
    property.content_status = 'drafted';
    await property.save();
    
    return { success: true, generated: results.length, posts: results };
    
  } catch (error) {
    console.error('Content generation error:', error);
    throw error;
  }
}

/**
 * Generate content for single language
 */
async function generateSingleContent(property, category, language) {
  // Get template
  const template = CONTENT_TEMPLATES[category]?.[language];
  if (!template) {
    throw new Error(`No template for ${category}/${language}`);
  }
  
  // Generate content with OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: template.systemPrompt },
      { role: 'user', content: template.userPrompt(property) }
    ],
    temperature: 0.7,
    max_tokens: 500
  });
  
  const contentText = response.choices[0].message.content.trim();
  
  // Extract location for hashtags
  const location = extractLocation(property.location);
  
  // Generate hashtags
  const hashtags = generateHashtags(category, location, language);
  
  // Calculate suggested publish time
  const suggestedTime = calculatePublishTime(language);
  
  // Create content post
  const contentPost = new ContentPost({
    property_id: property._id,
    category,
    language,
    content_text: contentText,
    hashtags,
    media_urls: property.images || [],
    status: 'drafted',
    suggested_publish_time: suggestedTime
  });
  
  await contentPost.save();
  
  return contentPost;
}

/**
 * Map source category to content category
 */
function mapSourceToCategory(sourceCategory) {
  const mapping = {
    'new_project': 'new_project',
    'resale': 'resale',
    'rent': 'rent',
    'unknown': 'resale'
  };
  return mapping[sourceCategory] || 'resale';
}

/**
 * Determine languages to generate based on category
 */
function determineLanguages(category) {
  if (category === 'new_project') {
    return ['th', 'en', 'cn']; // New projects for all major audiences
  }
  if (category === 'rent') {
    return ['th', 'en']; // Rentals mainly for Thai and expats
  }
  return ['th', 'en']; // Default: Thai and English
}

/**
 * Extract location keyword from location string
 */
function extractLocation(locationStr) {
  if (!locationStr) return 'pattaya';
  
  const lower = locationStr.toLowerCase();
  if (lower.includes('jomtien')) return 'jomtien';
  if (lower.includes('naklua')) return 'naklua';
  if (lower.includes('pratumnak')) return 'pratumnak';
  if (lower.includes('central')) return 'central';
  if (lower.includes('huay yai') || lower.includes('huaiyai')) return 'huayYai';
  
  return 'pattaya';
}

/**
 * Calculate suggested publish time
 */
function calculatePublishTime(language) {
  const time = PUBLISH_TIMES[language] || PUBLISH_TIMES.th;
  const publishDate = new Date();
  
  // Schedule for next occurrence of the target time
  publishDate.setHours(time.hour, time.minute, 0, 0);
  
  // If time has passed today, schedule for tomorrow
  if (publishDate < new Date()) {
    publishDate.setDate(publishDate.getDate() + 1);
  }
  
  return publishDate;
}

/**
 * Format price for display
 */
function formatPrice(price) {
  if (!price || !price.amount) return 'Price on request';

  const currency = price.currency || 'THB';
  const locale = currency === 'THB' ? 'th-TH' : 'en-US';
  const amount = price.amount.toLocaleString(locale);
  return `${amount} ${currency}`;
}

module.exports = {
  generateContent,
  CONTENT_TEMPLATES,
  PUBLISH_TIMES
};
