const fs = require('fs');
const path = require('path');

describe('Developer logos in mock data', () => {
  const mockDataPath = path.join(__dirname, '../../demo-website/assets/js/mock-data.js');
  const source = fs.readFileSync(mockDataPath, 'utf8');
  const developersMatch = source.match(/const DEVELOPERS = \[(?<block>[\s\S]*?)\];\r?\n\r?\n\/\/ Market Statistics/);
  const developersBlock = developersMatch?.groups?.block || '';
  const expectedDeveloperLogoCount = 5;

  test('uses local SVG logo assets for all 5 developers', () => {
    const logoMatches = developersBlock.match(/logo:\s*'(\.\.\/assets\/images\/developers\/[^']+\.svg)'/g) || [];
    expect(logoMatches).toHaveLength(expectedDeveloperLogoCount);
  });

  test('does not use placeholder logo URLs in developers block', () => {
    expect(developersBlock).not.toContain('via.placeholder.com');
  });
});
