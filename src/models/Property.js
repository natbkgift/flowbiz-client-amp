const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  // Property classification
  property_type: {
    type: String,
    enum: ['condo', 'house', 'villa', 'townhouse', 'land', 'commercial'],
    required: true
  },
  transaction_type: {
    type: String,
    enum: ['sale', 'rent', 'investment'],
    required: true
  },
  
  // Basic information
  project_name: { type: String, trim: true },
  location: { type: String, trim: true },
  developer: { type: String, trim: true },
  
  // Pricing
  price: {
    amount: { type: Number },
    currency: { type: String, default: 'THB' },
    period: { type: String, enum: ['total', 'monthly', 'yearly'], default: 'total' }
  },
  
  // Property details
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  area_sqm: { type: Number },
  floor: { type: String },
  view: { type: String },
  
  // Features
  amenities: [{ type: String }],
  highlights: [{ type: String }],
  
  // Project status
  is_new_launch: { type: Boolean, default: false },
  
  // Source information
  source_category: {
    type: String,
    enum: ['new_project', 'resale', 'rent', 'unknown'],
    default: 'unknown'
  },
  source_group: { type: String },
  raw_message: { type: String },
  images: [{ type: String }],
  contact: { type: String },
  owner_line_id: { type: String },
  
  // Content workflow
  content_status: {
    type: String,
    enum: ['pending', 'drafted', 'approved', 'published', 'archived'],
    default: 'pending'
  },
  
  // AI confidence
  confidence_score: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
propertySchema.index({ source_category: 1, content_status: 1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ 'price.amount': 1 });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
