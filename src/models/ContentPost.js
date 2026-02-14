const mongoose = require('mongoose');

const contentPostSchema = new mongoose.Schema({
  // Reference to property
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  
  // Content classification
  category: {
    type: String,
    enum: ['resale', 'rent', 'new_project', 'knowledge', 'legal', 'news', 'lifestyle', 'investment'],
    required: true
  },
  language: {
    type: String,
    enum: ['th', 'en', 'cn', 'ru'],
    required: true
  },
  
  // Content
  content_text: { type: String, required: true },
  hashtags: [{ type: String }],
  media_urls: [{ type: String }],
  
  // Publishing workflow
  status: {
    type: String,
    enum: ['drafted', 'approved', 'scheduled', 'published', 'failed', 'archived'],
    default: 'drafted'
  },
  
  // Scheduling
  suggested_publish_time: { type: Date },
  published_at: { type: Date },
  fb_post_id: { type: String },
  
  // Analytics
  analytics: {
    reach: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    reactions: { type: Number, default: 0 },
    leads_generated: { type: Number, default: 0 }
  },
  
  // Error tracking
  error_log: { type: String }
}, {
  timestamps: true
});

// Indexes for performance
contentPostSchema.index({ status: 1, suggested_publish_time: 1 });
contentPostSchema.index({ category: 1, language: 1 });
contentPostSchema.index({ published_at: -1 });

const ContentPost = mongoose.model('ContentPost', contentPostSchema);

module.exports = ContentPost;
