import { beforeEach, describe, expect, it } from 'vitest';

import {
  generateMetadata as generatePageNotFound,
  default as PageNotFound,
} from '../../app/[locale]/not-found';
import {
  generateMetadata as generateUserNotFound,
  default as UserNotFound,
} from '../../app/[locale]/[username]/not-found';
import { resetRootLocale, setRootLocale } from '../mocks/next-root-params';

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

describe('not-found metadata', () => {
  beforeEach(() => {
    resetRootLocale();
  });

  // The locale of the URL is a path segment, so the 404 that belongs to it
  // knows its language without reading a request header.
  it.each([
    ['tr', 'Aradığın sayfa yok | Git-to-Portfolio'],
    ['en', 'The page you requested does not exist | Git-to-Portfolio'],
    ['de', 'Die gewünschte Seite gibt es nicht | Git-to-Portfolio'],
    ['es', 'La página que buscas no existe | Git-to-Portfolio'],
  ])('titles the global 404 in %s', async (locale, expected) => {
    setRootLocale(locale);
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
    setRootLocale(locale);
    expect(titleOf(await generateUserNotFound())).toBe(expected);
  });

  it.each([
    ['a missing segment', undefined],
    ['a spoofed locale', 'xx'],
  ])('falls back to Turkish for %s', async (_label, value) => {
    setRootLocale(value);

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
    setRootLocale('en');
    expect((await generate()).robots).toMatchObject(NO_INDEX);
  });
});

describe('not-found body', () => {
  beforeEach(() => {
    resetRootLocale();
  });

  // The body used to be a client component reading useSearchParams, so the
  // visible markup only existed after hydration. Rendering it from the locale
  // segment puts it in the static HTML the 404 response ships.
  it.each([
    ['tr', 'Aradığın sayfa yok', 'Kullanıcı bulunamadı'],
    ['en', 'The page you requested does not exist', 'User not found'],
    ['de', 'Die gewünschte Seite gibt es nicht', 'Benutzer nicht gefunden'],
    ['es', 'La página que buscas no existe', 'Usuario no encontrado'],
  ])('renders the %s 404 body server-side', async (locale, pageHeading, userHeading) => {
    setRootLocale(locale);
    const { renderToStaticMarkup } = await import('react-dom/server');

    const pageHtml = renderToStaticMarkup(await PageNotFound());
    const userHtml = renderToStaticMarkup(await UserNotFound());

    expect(pageHtml).toContain('<h1');
    expect(pageHtml).toContain(pageHeading);
    expect(userHtml).toContain('<h1');
    expect(userHtml).toContain(userHeading);
    // Exactly one heading and one home link in each document.
    expect(pageHtml.match(/<h1/g)).toHaveLength(1);
    expect(userHtml.match(/<h1/g)).toHaveLength(1);
    // The home link keeps the language of the URL it was reached through.
    expect(pageHtml).toContain(`href="/${locale}"`);
    expect(userHtml).toContain(`href="/${locale}"`);
  });

  it('falls back to Turkish when the URL carries no locale segment', async () => {
    resetRootLocale();
    const { renderToStaticMarkup } = await import('react-dom/server');

    const html = renderToStaticMarkup(await UserNotFound());
    expect(html).toContain('Kullanıcı bulunamadı');
    expect(html).toContain('href="/tr"');
  });
});
