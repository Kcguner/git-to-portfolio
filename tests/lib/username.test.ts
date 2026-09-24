import { describe, expect, it } from 'vitest';
import { normalizeUsername, validateUsername } from '../../lib/username';

describe('validateUsername', () => {
  it('accepts 1-39 ASCII letters, numbers and internal hyphens', () => {
    expect(validateUsername('a')).toBe(true);
    expect(validateUsername('tor-valds9')).toBe(true);
    expect(validateUsername('a'.repeat(39))).toBe(true);
  });

  it('rejects invalid length, characters and edge hyphens', () => {
    expect(validateUsername('')).toBe(false);
    expect(validateUsername('a'.repeat(40))).toBe(false);
    expect(validateUsername('-torvalds')).toBe(false);
    expect(validateUsername('torvalds-')).toBe(false);
    expect(validateUsername('tor valds')).toBe(false);
    expect(validateUsername('törvalds')).toBe(false);
  });
});

describe('normalizeUsername', () => {
  it.each([
    ['torvalds', 'torvalds'],
    ['  @Torvalds  ', 'torvalds'],
    ['https://github.com/torvalds', 'torvalds'],
    ['https://GitHub.com/torvalds/', 'torvalds'],
    ['https://github.com/torvalds?tab=repositories', 'torvalds'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeUsername(input)).toBe(expected);
  });

  it.each([
    '',
    '   ',
    '@',
    '@-torvalds',
    'torvalds-',
    'a'.repeat(40),
    'torvalds.git',
    'http://github.com/torvalds',
    'https://gitlab.com/torvalds',
    'https://github.com.evil.test/torvalds',
    'https://evil.test/github.com/torvalds',
    '//github.com/torvalds',
    'https://user@github.com/torvalds',
    'https://github.com/orgs/github',
    'javascript:alert(1)',
  ])('rejects %j', (input) => {
    expect(normalizeUsername(input)).toBeNull();
  });
});
