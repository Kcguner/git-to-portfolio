import { getDictionary, type Locale } from '@/lib/i18n';
import SearchFormClient from './SearchFormClient';

/**
 * The search field, as a server component.
 *
 * The form itself is interactive, so the interactive part lives in
 * `SearchFormClient`. This wrapper is what keeps the dictionary on the
 * server: it resolves the copy for the current locale and hands the client
 * part the eight strings it needs. The browser therefore never sees a
 * dictionary — only the labels of one language, and only as props.
 */
export default function SearchForm({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);

  return <SearchFormClient locale={locale} search={dictionary.search} />;
}
