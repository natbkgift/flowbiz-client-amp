/**
 * Tests for hashtag configuration and generation
 */

const { HASHTAGS, generateHashtags } = require('../../../src/config/hashtags');

describe('Hashtag Configuration', () => {
  
  describe('HASHTAGS constant', () => {
    test('should have brand hashtags', () => {
      expect(HASHTAGS.brand).toBeDefined();
      expect(Array.isArray(HASHTAGS.brand)).toBe(true);
      expect(HASHTAGS.brand.length).toBeGreaterThan(0);
      expect(HASHTAGS.brand).toContain('#AssetManagementProperty');
    });
    
    test('should have location hashtags', () => {
      expect(HASHTAGS.location).toBeDefined();
      expect(HASHTAGS.location.pattaya).toBeDefined();
      expect(HASHTAGS.location.jomtien).toBeDefined();
      expect(Array.isArray(HASHTAGS.location.pattaya)).toBe(true);
    });
    
    test('should have category hashtags', () => {
      expect(HASHTAGS.category).toBeDefined();
      expect(HASHTAGS.category.sale).toBeDefined();
      expect(HASHTAGS.category.rent).toBeDefined();
      expect(HASHTAGS.category.investment).toBeDefined();
    });
    
    test('should have trending hashtags by language', () => {
      expect(HASHTAGS.trending).toBeDefined();
      expect(HASHTAGS.trending.th).toBeDefined();
      expect(HASHTAGS.trending.en).toBeDefined();
      expect(HASHTAGS.trending.cn).toBeDefined();
      expect(HASHTAGS.trending.ru).toBeDefined();
    });
  });
  
  describe('generateHashtags', () => {
    test('should generate hashtags for resale category', () => {
      const tags = generateHashtags('resale', 'pattaya', 'th');
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.length).toBeLessThanOrEqual(15);
      
      // Should include brand hashtags
      expect(tags).toContain('#AssetManagementProperty');
    });
    
    test('should generate hashtags for rent category', () => {
      const tags = generateHashtags('rent', 'jomtien', 'en');
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeLessThanOrEqual(15);
      
      // Should include brand hashtags
      expect(tags.some(tag => tag === '#AssetManagementProperty')).toBe(true);
    });
    
    test('should generate hashtags for new_project category', () => {
      const tags = generateHashtags('new_project', 'naklua', 'th');
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeLessThanOrEqual(15);
    });
    
    test('should handle Chinese language', () => {
      const tags = generateHashtags('resale', 'pattaya', 'cn');
      
      expect(Array.isArray(tags)).toBe(true);
      // Should include some Chinese hashtags
      expect(tags.some(tag => tag.includes('泰国') || tag.includes('芭提雅'))).toBe(true);
    });
    
    test('should handle Russian language', () => {
      const tags = generateHashtags('rent', 'pattaya', 'ru');
      
      expect(Array.isArray(tags)).toBe(true);
    });
    
    test('should limit hashtags to 15', () => {
      const tags = generateHashtags('new_project', 'pattaya', 'th');
      
      expect(tags.length).toBeLessThanOrEqual(15);
    });
    
    test('should return unique hashtags', () => {
      const tags = generateHashtags('resale', 'pattaya', 'th');
      
      const uniqueTags = new Set(tags);
      expect(uniqueTags.size).toBe(tags.length);
    });
    
    test('should handle unknown location gracefully', () => {
      const tags = generateHashtags('resale', 'unknown_location', 'th');
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });
    
    test('should handle knowledge category', () => {
      const tags = generateHashtags('knowledge', null, 'en');
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });
    
    test('should handle lifestyle category', () => {
      const tags = generateHashtags('lifestyle', 'pattaya', 'th');
      
      expect(Array.isArray(tags)).toBe(true);
      // Lifestyle uses engagement hashtags
      expect(tags.some(tag => 
        tag === '#HomeSweet' || 
        tag === '#DreamHome' || 
        tag === '#SeaView'
      )).toBe(true);
    });
  });
});
