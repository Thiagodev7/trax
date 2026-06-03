import { extractList, parseNectarDate } from './nectar-crm.service';

describe('parseNectarDate', () => {
  it('parses ISO dates', () => {
    expect(parseNectarDate('2024-06-15T10:00:00Z')).toBe('2024-06-15');
  });

  it('parses BR dd/mm/yyyy', () => {
    expect(parseNectarDate('15/06/2024')).toBe('2024-06-15');
  });

  it('returns null for invalid input', () => {
    expect(parseNectarDate(null)).toBeNull();
    expect(parseNectarDate('invalid')).toBeNull();
  });
});

describe('extractList', () => {
  it('returns array as-is', () => {
    expect(extractList([{ id: 1 }])).toEqual([{ id: 1 }]);
  });

  it('extracts nested results key', () => {
    expect(extractList({ results: [{ id: 2 }] })).toEqual([{ id: 2 }]);
  });

  it('returns empty for non-objects', () => {
    expect(extractList('x')).toEqual([]);
  });
});
