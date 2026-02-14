const line = require('@line/bot-sdk');
const { classifyAndStore } = require('../ai-engine/classifier');

// LINE Bot configuration
const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

// Create LINE Bot client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

// Group ID mappings
const GROUP_CATEGORIES = {
  [process.env.LINE_GROUP_DEVELOPER_ID]: 'new_project',
  [process.env.LINE_GROUP_RESALE_ID]: 'resale',
  [process.env.LINE_GROUP_RENT_ID]: 'rent'
};

/**
 * Process LINE webhook events
 * @param {Array} events - Array of LINE events
 * @returns {Promise<void>}
 */
async function handleWebhook(events) {
  try {
    const results = await Promise.all(events.map(handleEvent));
    return results;
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}

/**
 * Handle individual LINE event
 * @param {Object} event - LINE event object
 * @returns {Promise<Object>}
 */
async function handleEvent(event) {
  // Only process message events
  if (event.type !== 'message') {
    return { status: 'ignored', reason: 'not_a_message' };
  }
  
  // Get source information
  const source = event.source;
  const sourceId = source.groupId || source.roomId || source.userId;
  
  // Classify source category
  const sourceCategory = GROUP_CATEGORIES[sourceId] || 'unknown';
  
  if (sourceCategory === 'unknown') {
    console.log(`⚠️  Message from unknown group: ${sourceId}`);
    return { status: 'ignored', reason: 'unknown_source' };
  }
  
  console.log(`📨 Received message from ${sourceCategory} group`);
  
  // Extract message data
  const messageData = await extractMessageData(event);
  
  // Add source metadata
  messageData.source_category = sourceCategory;
  messageData.source_group = sourceId;
  messageData.owner_line_id = source.userId;
  
  // Send to AI classifier for processing
  try {
    const result = await classifyAndStore(messageData);
    console.log(`✅ Message classified and stored: ${result.propertyId}`);
    return { status: 'success', propertyId: result.propertyId };
  } catch (error) {
    console.error('❌ Classification error:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Extract message data from LINE event
 * @param {Object} event - LINE event object
 * @returns {Promise<Object>}
 */
async function extractMessageData(event) {
  const message = event.message;
  const data = {
    timestamp: new Date(event.timestamp),
    messageId: message.id,
    messageType: message.type,
    raw_message: '',
    images: [],
    contact: null
  };
  
  // Extract text content
  if (message.type === 'text') {
    data.raw_message = message.text;
    
    // Try to extract contact info from text
    const phoneMatch = data.raw_message.match(/(\+66|0)[0-9]{8,9}/);
    if (phoneMatch) {
      data.contact = phoneMatch[0];
    }
  }
  
  // Extract image URLs
  if (message.type === 'image') {
    try {
      // Note: In production, you would download and store these images
      data.images.push(message.id);
      data.raw_message = '[Image attached]';
    } catch (error) {
      console.error('Error extracting image:', error);
    }
  }
  
  return data;
}

/**
 * Create Express middleware for LINE webhook
 * @returns {Function} Express middleware
 */
function createWebhookMiddleware() {
  return line.middleware(config);
}

/**
 * Express route handler for LINE webhook
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function webhookHandler(req, res) {
  try {
    const events = req.body.events || [];
    
    if (events.length === 0) {
      return res.status(200).json({ message: 'No events to process' });
    }
    
    // Process events asynchronously
    handleWebhook(events).catch(error => {
      console.error('Async webhook handling error:', error);
    });
    
    // Respond immediately to LINE
    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createWebhookMiddleware,
  webhookHandler,
  handleWebhook,
  handleEvent
};
