const OpenAI = require('openai');
const Property = require('../models/Property');
const { generateContent } = require('./content-generator');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Classify and extract property data from LINE message using AI
 * @param {Object} messageData - Raw message data from LINE
 * @returns {Promise<Object>} Classification result with property ID
 */
async function classifyAndStore(messageData) {
  try {
    console.log('🤖 Starting AI classification...');
    
    // Call OpenAI GPT-4o to analyze message
    const extractedData = await extractPropertyData(messageData.raw_message, messageData.source_category);
    
    // Validate confidence score
    if (extractedData.confidence_score < 0.3) {
      console.log(`⚠️  Low confidence score: ${extractedData.confidence_score}`);
    }
    
    // Create property document
    const propertyData = {
      ...extractedData,
      source_category: messageData.source_category,
      source_group: messageData.source_group,
      raw_message: messageData.raw_message,
      images: messageData.images || [],
      contact: messageData.contact,
      owner_line_id: messageData.owner_line_id,
      content_status: 'pending'
    };
    
    // Save to database
    const property = new Property(propertyData);
    await property.save();
    
    console.log(`✅ Property saved: ${property._id}`);
    
    // Check if this is a priority property (new launch or hot deal)
    const isPriority = property.is_new_launch || 
                      (property.confidence_score > 0.8 && property.price.amount);
    
    if (isPriority) {
      console.log('🚀 Priority property detected - triggering content generation');
      // Trigger immediate content generation
      await generateContent(property._id);
    }
    
    return {
      success: true,
      propertyId: property._id,
      confidence: extractedData.confidence_score,
      isPriority
    };
    
  } catch (error) {
    console.error('❌ Classification error:', error);
    throw error;
  }
}

/**
 * Extract structured property data from text using OpenAI GPT-4o
 * @param {string} text - Raw message text
 * @param {string} category - Source category (new_project, resale, rent)
 * @returns {Promise<Object>} Extracted property data
 */
async function extractPropertyData(text, category) {
  const systemPrompt = `You are a Thai real estate data extraction AI. Extract property information from Thai/English messages.

Extract these fields:
- property_type: condo, house, villa, townhouse, land, or commercial
- transaction_type: sale, rent, or investment
- project_name: Name of the project/building
- location: Location in Pattaya area
- price: {amount: number, currency: "THB"|"USD", period: "total"|"monthly"|"yearly"}
- bedrooms: number of bedrooms
- bathrooms: number of bathrooms
- area_sqm: area in square meters
- floor: floor number or level
- view: description of view
- amenities: array of amenities/facilities
- contact: phone number or contact
- highlights: array of key selling points
- is_new_launch: true if new project launch
- developer: developer/owner name
- confidence_score: 0-1 score of extraction confidence

Return ONLY valid JSON. If information is missing, use null.`;

  const userPrompt = `Category: ${category}
Message: ${text}

Extract property data as JSON:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0].message.content;
    const extracted = JSON.parse(content);
    
    // Set default confidence if not provided
    if (typeof extracted.confidence_score !== 'number') {
      extracted.confidence_score = 0.5;
    }
    
    // Validate and normalize data
    return normalizePropertyData(extracted);
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return minimal data with low confidence on error
    return {
      property_type: 'condo',
      transaction_type: category === 'rent' ? 'rent' : 'sale',
      confidence_score: 0.1,
      project_name: null,
      location: null,
      price: { amount: null, currency: 'THB', period: 'total' }
    };
  }
}

/**
 * Normalize and validate extracted property data
 * @param {Object} data - Raw extracted data
 * @returns {Object} Normalized property data
 */
function normalizePropertyData(data) {
  const normalized = {
    property_type: validatePropertyType(data.property_type),
    transaction_type: validateTransactionType(data.transaction_type),
    project_name: data.project_name || null,
    location: data.location || null,
    developer: data.developer || null,
    price: {
      amount: parseFloat(data.price?.amount) || null,
      currency: data.price?.currency || 'THB',
      period: data.price?.period || 'total'
    },
    bedrooms: parseInt(data.bedrooms) || null,
    bathrooms: parseInt(data.bathrooms) || null,
    area_sqm: parseFloat(data.area_sqm) || null,
    floor: data.floor || null,
    view: data.view || null,
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
    highlights: Array.isArray(data.highlights) ? data.highlights : [],
    is_new_launch: Boolean(data.is_new_launch),
    confidence_score: Math.min(1, Math.max(0, parseFloat(data.confidence_score) || 0.5))
  };
  
  return normalized;
}

/**
 * Validate property type
 */
function validatePropertyType(type) {
  const valid = ['condo', 'house', 'villa', 'townhouse', 'land', 'commercial'];
  return valid.includes(type) ? type : 'condo';
}

/**
 * Validate transaction type
 */
function validateTransactionType(type) {
  const valid = ['sale', 'rent', 'investment'];
  return valid.includes(type) ? type : 'sale';
}

module.exports = {
  classifyAndStore,
  extractPropertyData
};
