const { sortProjects, getCompletionSortValue } = require('../../demo-website/assets/js/projects.js');

describe('Projects sorting', () => {
  const projects = [
    {
      project_id: 'p1',
      pricing: { min: 5000000 },
      estimated_yield: 5.2,
      timeline: { completion: '2028-Q2' },
      units: { available: 20 }
    },
    {
      project_id: 'p2',
      pricing: { min: 3000000 },
      estimated_yield: 6.8,
      timeline: { completion: '2027-Q4' },
      units: { available: 45 }
    },
    {
      project_id: 'p3',
      pricing: { min: 7000000 },
      estimated_yield: 4.8,
      timeline: { completion: '2026-Q3' },
      units: { available: 12 }
    }
  ];

  test('sorts by price low to high', () => {
    const result = sortProjects(projects, 'price-low');
    expect(result.map(p => p.project_id)).toEqual(['p2', 'p1', 'p3']);
  });

  test('sorts by price high to low', () => {
    const result = sortProjects(projects, 'price-high');
    expect(result.map(p => p.project_id)).toEqual(['p3', 'p1', 'p2']);
  });

  test('sorts by yield high to low', () => {
    const result = sortProjects(projects, 'yield-high');
    expect(result.map(p => p.project_id)).toEqual(['p2', 'p1', 'p3']);
  });

  test('sorts by completion date nearest first', () => {
    const result = sortProjects(projects, 'completion-nearest');
    expect(result.map(p => p.project_id)).toEqual(['p3', 'p2', 'p1']);
  });

  test('sorts by units available most first', () => {
    const result = sortProjects(projects, 'units-available');
    expect(result.map(p => p.project_id)).toEqual(['p2', 'p1', 'p3']);
  });

  test('maps completion quarter string to sortable number', () => {
    expect(getCompletionSortValue('2027-Q1')).toBeLessThan(getCompletionSortValue('2027-Q4'));
    expect(getCompletionSortValue('invalid')).toBe(Number.MAX_SAFE_INTEGER);
  });

  test('handles empty project array', () => {
    expect(sortProjects([], 'price-low')).toEqual([]);
    expect(sortProjects([], 'completion-nearest')).toEqual([]);
  });

  test('handles missing pricing, yield, and units fields safely', () => {
    const incompleteProjects = [
      { project_id: 'm1', timeline: { completion: '2027-Q2' } },
      { project_id: 'm2', pricing: { min: 2000000 }, estimated_yield: 6.2, units: { available: 10 }, timeline: { completion: '2027-Q1' } },
      { project_id: 'm3', pricing: {}, estimated_yield: undefined, units: {}, timeline: { completion: '2028-Q1' } }
    ];

    expect(() => sortProjects(incompleteProjects, 'price-low')).not.toThrow();
    expect(() => sortProjects(incompleteProjects, 'yield-high')).not.toThrow();
    expect(() => sortProjects(incompleteProjects, 'units-available')).not.toThrow();

    expect(sortProjects(incompleteProjects, 'price-high').map(p => p.project_id)).toEqual(['m2', 'm1', 'm3']);
    expect(sortProjects(incompleteProjects, 'yield-high').map(p => p.project_id)).toEqual(['m2', 'm1', 'm3']);
    expect(sortProjects(incompleteProjects, 'units-available').map(p => p.project_id)).toEqual(['m2', 'm1', 'm3']);
  });

  test('sorts mixed valid and invalid completion dates with valid dates first', () => {
    const mixedCompletionProjects = [
      { project_id: 'c1', timeline: { completion: 'invalid' } },
      { project_id: 'c2', timeline: { completion: '2026-Q4' } },
      { project_id: 'c3', timeline: { completion: '2025-Q3' } },
      { project_id: 'c4', timeline: {} }
    ];

    expect(sortProjects(mixedCompletionProjects, 'completion-nearest').map(p => p.project_id)).toEqual(['c3', 'c2', 'c1', 'c4']);
  });
});
