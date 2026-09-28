import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LANGUAGE_COLOR,
  getLanguageColor,
  LANGUAGE_COLORS,
} from '../../lib/language-colors';

describe('getLanguageColor', () => {
  it.each([
    ['TypeScript', '#3178c6'],
    ['Python', '#3572A5'],
    ['Go', '#00ADD8'],
    ['C++', '#f34b7d'],
    ['Jupyter Notebook', '#DA5B0B'],
    ['Shell', '#89e051'],
  ])('resolves %s to its Linguist color', (name, color) => {
    expect(getLanguageColor(name)).toBe(color);
  });

  it('falls back to a case-insensitive match', () => {
    // GitHub is consistent about language names, but a chart keyed on data
    // should not break on `typescript` or `TYPESCRIPT`.
    expect(getLanguageColor('typescript')).toBe('#3178c6');
    expect(getLanguageColor('c++')).toBe('#f34b7d');
  });

  it('falls back to the default for an unknown or missing language', () => {
    expect(getLanguageColor('Brainfuck')).toBe(DEFAULT_LANGUAGE_COLOR);
    expect(getLanguageColor('')).toBe(DEFAULT_LANGUAGE_COLOR);
    expect(getLanguageColor(null)).toBe(DEFAULT_LANGUAGE_COLOR);
    expect(getLanguageColor(undefined)).toBe(DEFAULT_LANGUAGE_COLOR);
  });

  it('is a pure function of its argument', () => {
    const first = getLanguageColor('Rust');
    const second = getLanguageColor('Rust');

    expect(first).toBe(second);
    expect(LANGUAGE_COLORS.Rust).toBe(first);
  });

  it('publishes only opaque hex colors', () => {
    // The values are applied as inline styles, so they must never be tokens,
    // color functions or anything else the browser would have to resolve.
    for (const [name, color] of Object.entries(LANGUAGE_COLORS)) {
      expect(color, name).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
