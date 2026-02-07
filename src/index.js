require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const { createWebhookMiddleware, webhookHandler } = require('./line-webhook/receiver');
const { startAutoPublisher } = require('./publisher/facebook-publisher');
const { startInsightsTracker } = require('./analytics/performance-tracker');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'amp-content-automation',
    timestamp: new Date().toISOString()
  });
});

/**
 * LINE Webhook endpoint
 * Validates signature and processes LINE events
 */
app.post('/webhook/line', createWebhookMiddleware(), webhookHandler);

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

/**
 * Initialize application
 */
async function init() {
  try {
    console.log('🚀 Starting Content Automation System...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Validate required environment variables
    validateEnv();
    
    // Connect to MongoDB
    await connectDB();
    
    // Start schedulers
    startAutoPublisher();
    startInsightsTracker();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📍 LINE Webhook: http://localhost:${PORT}/webhook/line`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

/**
 * Validate required environment variables
 */
function validateEnv() {
  const required = [
    'LINE_CHANNEL_SECRET',
    'LINE_CHANNEL_ACCESS_TOKEN',
    'OPENAI_API_KEY',
    'FB_PAGE_ID',
    'FB_PAGE_ACCESS_TOKEN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('⚠️  Some features may not work correctly');
  }
  
  // Check optional but recommended
  const optional = [
    'LINE_GROUP_DEVELOPER_ID',
    'LINE_GROUP_RESALE_ID',
    'LINE_GROUP_RENT_ID'
  ];
  
  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`ℹ️  Optional variables not set: ${missingOptional.join(', ')}`);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('🔒 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔒 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the application
init();

module.exports = app;
