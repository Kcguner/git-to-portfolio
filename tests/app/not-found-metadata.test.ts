import { beforeEach, describe, expect, it, vi } from 'vitest';

const headerMocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: headerMocks.headers,
}));

import { generateMetadata as generatePageNotFound } from '../../app/not-found';
import { generateMetadata as generateUserNotFound } from '../../app/[username]/not-found';

const NO_INDEX = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

type MetadataResult = Awaited<ReturnType<typeof generatePageNotFound>>;

function titleOf(metadata: MetadataResult): string {
  const { title } = metadata;
  if (typeof title === 'string') return title;
  if (title && typeof title === 'object') {
    // Metadata's `title` is a union of the default-template and absolute shapes.
    const template = title as { absolute?: string; default?: string };
    return template.absolute ?? template.default ?? '';
  }
  return '';
}

function setLocaleHeader(value: string | null) {
  headerMocks.headers.mockResolvedValue({
    get: (name: string) => (name === 'x-site-locale' ? value : null),
  });
}

describe('not-found metadata', () => {
  beforeEach(() => {
    headerMocks.headers.mockReset();
  });

  // The SSR <title> is the whole point of moving the locale resolution into
  // Proxy: before this, every 404 was titled "404" in English regardless of
  // the requested language.
  it.each([
    ['tr', 'Aradığın sayfa yok | Git-to-Portfolio'],
    ['en', 'The page you requested does not exist | Git-to-Portfolio'],
    ['de', 'Die gewünschte Seite gibt es nicht | Git-to-Portfolio'],
    ['es', 'La página que buscas no existe | Git-to-Portfolio'],
  ])('titles the global 404 in %s', async (locale, expected) => {
    setLocaleHeader(locale);
    expect(titleOf(await generatePageNotFound())).toBe(expected);
  });

  // The user 404 titles itself from `metadata.userNotFoundTitle`, which is also
  // what the removed client-side effect used, so the rendered title is unchanged.
  it.each([
    ['tr', 'Kullanıcı bulunamadı | Git-to-Portfolio'],
    ['en', 'User not found | Git-to-Portfolio'],
    ['de', 'Benutzer nicht gefunden | Git-to-Portfolio'],
    ['es', 'Usuario no encontrado | Git-to-Portfolio'],
  ])('titles the user 404 in %s', async (locale, expected) => {
    setLocaleHeader(locale);
    expect(titleOf(await generateUserNotFound())).toBe(expected);
  });

  it.each([
    ['a missing header', null],
    ['a spoofed locale', 'xx'],
    ['a repeated locale', 'en,de'],
  ])('falls back to Turkish for %s', async (_label, value) => {
    setLocaleHeader(value);

    expect(titleOf(await generatePageNotFound())).toBe(
      'Aradığın sayfa yok | Git-to-Portfolio',
    );
    expect(titleOf(await generateUserNotFound())).toBe(
      'Kullanıcı bulunamadı | Git-to-Portfolio',
    );
  });

  it.each([
    ['global', generatePageNotFound],
    ['user', generateUserNotFound],
  ])('keeps the %s 404 out of the index', async (_label, generate) => {
    setLocaleHeader('en');
    expect((await generate()).robots).toMatchObject(NO_INDEX);
  });
});
