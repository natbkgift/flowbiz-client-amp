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
});
