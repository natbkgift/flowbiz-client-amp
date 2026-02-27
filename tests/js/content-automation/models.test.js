/**
 * Tests for database models structure
 * Note: These tests verify model structure without requiring a database connection
 */

describe('Database Models', () => {
  
  describe('Property Model', () => {
    test('should be importable', () => {
      const Property = require('../../../src/models/Property');
      expect(Property).toBeDefined();
      expect(typeof Property).toBe('function');
    });
    
    test('should have correct schema structure', () => {
      const Property = require('../../../src/models/Property');
      const schema = Property.schema;
      
      expect(schema.paths.property_type).toBeDefined();
      expect(schema.paths.transaction_type).toBeDefined();
      expect(schema.paths.project_name).toBeDefined();
      expect(schema.paths.location).toBeDefined();
      // Price is a nested object, check nested path
      expect(schema.paths['price.amount']).toBeDefined();
      expect(schema.paths.content_status).toBeDefined();
      expect(schema.paths.confidence_score).toBeDefined();
    });
    
    test('should have proper enums for property_type', () => {
      const Property = require('../../../src/models/Property');
      const propertyTypeEnum = Property.schema.paths.property_type.enumValues;
      
      expect(propertyTypeEnum).toContain('condo');
      expect(propertyTypeEnum).toContain('house');
      expect(propertyTypeEnum).toContain('villa');
      expect(propertyTypeEnum).toContain('townhouse');
      expect(propertyTypeEnum).toContain('land');
      expect(propertyTypeEnum).toContain('commercial');
    });
    
    test('should have proper enums for transaction_type', () => {
      const Property = require('../../../src/models/Property');
      const transactionTypeEnum = Property.schema.paths.transaction_type.enumValues;
      
      expect(transactionTypeEnum).toContain('sale');
      expect(transactionTypeEnum).toContain('rent');
      expect(transactionTypeEnum).toContain('investment');
    });
    
    test('should have proper enums for source_category', () => {
      const Property = require('../../../src/models/Property');
      const sourceCategoryEnum = Property.schema.paths.source_category.enumValues;
      
      expect(sourceCategoryEnum).toContain('new_project');
      expect(sourceCategoryEnum).toContain('resale');
      expect(sourceCategoryEnum).toContain('rent');
      expect(sourceCategoryEnum).toContain('unknown');
    });
    
    test('should have timestamps enabled', () => {
      const Property = require('../../../src/models/Property');
      expect(Property.schema.options.timestamps).toBe(true);
    });
  });
  
  describe('ContentPost Model', () => {
    test('should be importable', () => {
      const ContentPost = require('../../../src/models/ContentPost');
      expect(ContentPost).toBeDefined();
      expect(typeof ContentPost).toBe('function');
    });
    
    test('should have correct schema structure', () => {
      const ContentPost = require('../../../src/models/ContentPost');
      const schema = ContentPost.schema;
      
      expect(schema.paths.property_id).toBeDefined();
      expect(schema.paths.category).toBeDefined();
      expect(schema.paths.language).toBeDefined();
      expect(schema.paths.content_text).toBeDefined();
      expect(schema.paths.status).toBeDefined();
      expect(schema.paths.hashtags).toBeDefined();
    });
    
    test('should have proper enums for category', () => {
      const ContentPost = require('../../../src/models/ContentPost');
      const categoryEnum = ContentPost.schema.paths.category.enumValues;
      
      expect(categoryEnum).toContain('resale');
      expect(categoryEnum).toContain('rent');
      expect(categoryEnum).toContain('new_project');
      expect(categoryEnum).toContain('knowledge');
      expect(categoryEnum).toContain('legal');
      expect(categoryEnum).toContain('news');
      expect(categoryEnum).toContain('lifestyle');
      expect(categoryEnum).toContain('investment');
    });
    
    test('should have proper enums for language', () => {
      const ContentPost = require('../../../src/models/ContentPost');
      const languageEnum = ContentPost.schema.paths.language.enumValues;
      
      expect(languageEnum).toContain('th');
      expect(languageEnum).toContain('en');
      expect(languageEnum).toContain('cn');
      expect(languageEnum).toContain('ru');
    });
    
    test('should have proper enums for status', () => {
      const ContentPost = require('../../../src/models/ContentPost');
      const statusEnum = ContentPost.schema.paths.status.enumValues;
      
      expect(statusEnum).toContain('drafted');
      expect(statusEnum).toContain('approved');
      expect(statusEnum).toContain('scheduled');
      expect(statusEnum).toContain('published');
      expect(statusEnum).toContain('failed');
      expect(statusEnum).toContain('archived');
    });
    
    test('should have analytics structure', () => {
      const ContentPost = require('../../../src/models/ContentPost');
      const schema = ContentPost.schema;
      
      // Analytics is a nested object, check nested paths
      expect(schema.paths['analytics.reach']).toBeDefined();
      expect(schema.paths['analytics.engagement']).toBeDefined();
      expect(schema.paths['analytics.clicks']).toBeDefined();
    });
    
    test('should have timestamps enabled', () => {
      const ContentPost = require('../../../src/models/ContentPost');
      expect(ContentPost.schema.options.timestamps).toBe(true);
    });
  });
});
