const { getFiltersFromSearch, buildSearchFromFilters } = require('../../demo-website/assets/js/projects.js');

describe('Projects query params', () => {
  test('reads supported query params from URL search', () => {
    const filters = getFiltersFromSearch('?status=pre-sale&type=condo&area=Jomtien&price=2to5&sort=yield-high');
    expect(filters).toEqual({
      status: 'pre-sale',
      type: 'condo',
      area: 'Jomtien',
      priceRange: '2to5',
      sortBy: 'yield-high'
    });
  });

  test('uses default values when query params are missing', () => {
    expect(getFiltersFromSearch('')).toEqual({
      status: 'all',
      type: 'all',
      area: 'all',
      priceRange: 'all',
      sortBy: 'completion-nearest'
    });
  });

  test('builds query string only for non-default filters', () => {
    const query = buildSearchFromFilters({
      status: 'pre-sale',
      type: 'all',
      area: 'Jomtien',
      priceRange: '2to5',
      sortBy: 'completion-nearest'
    });
    expect(query).toBe('status=pre-sale&area=Jomtien&price=2to5');
  });

  test('returns empty query string when all filters are default', () => {
    const query = buildSearchFromFilters({
      status: 'all',
      type: 'all',
      area: 'all',
      priceRange: 'all',
      sortBy: 'completion-nearest'
    });
    expect(query).toBe('');
  });
});
