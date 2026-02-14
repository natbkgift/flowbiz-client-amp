const {
  sanitizeCompareList,
  toggleCompareProjectId,
  readCompareList,
  writeCompareList
} = require('../../demo-website/assets/js/projects.js');

describe('Projects compare helpers', () => {
  test('sanitizeCompareList keeps unique ids and max 3 items', () => {
    expect(sanitizeCompareList(['p1', 'p1', 'p2', null, 'p3', 'p4'])).toEqual(['p1', 'p2', 'p3']);
  });

  test('toggleCompareProjectId adds and removes project ids', () => {
    const added = toggleCompareProjectId(['p1'], 'p2');
    expect(added).toEqual({ list: ['p1', 'p2'], added: true, maxReached: false });

    const removed = toggleCompareProjectId(['p1', 'p2'], 'p2');
    expect(removed).toEqual({ list: ['p1'], added: false, maxReached: false });
  });

  test('toggleCompareProjectId blocks when reaching max 3', () => {
    const result = toggleCompareProjectId(['p1', 'p2', 'p3'], 'p4');
    expect(result).toEqual({ list: ['p1', 'p2', 'p3'], added: false, maxReached: true });
  });

  test('readCompareList and writeCompareList use storage safely', () => {
    const store = new Map();
    const storage = {
      getItem: key => store.get(key) || null,
      setItem: (key, value) => store.set(key, value)
    };

    expect(readCompareList(storage)).toEqual([]);
    writeCompareList(['p1', 'p2', 'p3', 'p4'], storage);
    expect(readCompareList(storage)).toEqual(['p1', 'p2', 'p3']);
  });
});
