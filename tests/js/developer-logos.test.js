const fs = require('fs');
const path = require('path');

describe('Developer logos in mock data', () => {
  const mockDataPath = path.join(__dirname, '../../demo-website/assets/js/mock-data.js');
  const source = fs.readFileSync(mockDataPath, 'utf8');
  const developersBlock = source.match(/const DEVELOPERS = \[(.*?)\];/s)?.[1] || '';

  test('uses local SVG logo assets for all 5 developers', () => {
    const logoMatches = developersBlock.match(/logo:\s*'(\.\.\/assets\/images\/developers\/[^']+\.svg)'/g) || [];
    expect(logoMatches).toHaveLength(5);
  });

  test('does not use placeholder logo URLs in developers block', () => {
    expect(developersBlock).not.toContain('via.placeholder.com');
  });
});
