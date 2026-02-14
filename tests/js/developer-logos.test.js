const fs = require('fs');
const path = require('path');

describe('Developer logos in mock data', () => {
  const mockDataPath = path.join(__dirname, '../../demo-website/assets/js/mock-data.js');
  const source = fs.readFileSync(mockDataPath, 'utf8');
  const startMarker = 'const DEVELOPERS = [';
  const endMarker = '\n];\n\n// Market Statistics';
  const startIndex = source.indexOf(startMarker);
  const endIndex = source.indexOf(endMarker);
  const developersBlock = startIndex >= 0 && endIndex > startIndex
    ? source.slice(startIndex, endIndex)
    : '';
  const expectedDeveloperLogoCount = 5;

  test('uses local SVG logo assets for all 5 developers', () => {
    const logoMatches = developersBlock.match(/logo:\s*'(\.\.\/assets\/images\/developers\/[^']+\.svg)'/g) || [];
    expect(logoMatches).toHaveLength(expectedDeveloperLogoCount);
  });

  test('does not use placeholder logo URLs in developers block', () => {
    expect(developersBlock).not.toContain('via.placeholder.com');
  });
});
