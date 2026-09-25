import { describe, expect, it } from 'vitest';
import { calculateTopLanguages } from '../../lib/skills';

describe('calculateTopLanguages', () => {
  it('ignores null and blank languages', () => {
    const languages = calculateTopLanguages([
      { language: 'TypeScript' },
      { language: null },
      { language: '   ' },
      { language: 'TypeScript' },
    ]);

    expect(languages).toEqual([{ name: 'TypeScript', count: 2, percent: 100 }]);
  });

  it('calculates percentages over all non-null repositories, not only topN', () => {
    const languages = calculateTopLanguages(
      [
        { language: 'TypeScript' },
        { language: 'TypeScript' },
        { language: 'Rust' },
        { language: 'Go' },
      ],
      2
    );

    expect(languages).toEqual([
      { name: 'TypeScript', count: 2, percent: 50 },
      { name: 'Go', count: 1, percent: 25 },
    ]);
  });

  it('uses a stable alphabetical order when counts are tied', () => {
    const languages = calculateTopLanguages(
      [
        { language: 'Zig' },
        { language: 'Go' },
        { language: 'Rust' },
        { language: 'Go' },
      ],
      null
    );

    expect(languages.map((language) => language.name)).toEqual(['Go', 'Rust', 'Zig']);
  });

  it('defaults to three languages and supports explicit topN', () => {
    const repos = [
      { language: 'A' },
      { language: 'B' },
      { language: 'C' },
      { language: 'D' },
    ];

    expect(calculateTopLanguages(repos)).toHaveLength(3);
    expect(calculateTopLanguages(repos, 4)).toHaveLength(4);
  });

  it('handles zero, negative, and fractional topN deterministically', () => {
    const repos = [
      { language: 'TypeScript' },
      { language: 'TypeScript' },
      { language: 'Rust' },
    ];

    expect(calculateTopLanguages(repos, 0)).toEqual([]);
    expect(calculateTopLanguages(repos, -1)).toEqual([]);
    expect(calculateTopLanguages(repos, 1.9)).toEqual([
      { name: 'TypeScript', count: 2, percent: 67 },
    ]);
  });

  it('returns an empty list when no language is available', () => {
    expect(calculateTopLanguages([{ language: null }, { language: '' }])).toEqual([]);
    expect(calculateTopLanguages([])).toEqual([]);
  });

  it('trims language names before counting', () => {
    expect(calculateTopLanguages([{ language: ' TypeScript ' }])).toEqual([
      { name: 'TypeScript', count: 1, percent: 100 },
    ]);
  });
});

