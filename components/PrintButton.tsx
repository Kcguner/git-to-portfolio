import { getDictionary, type Locale } from '@/lib/i18n';
import PrintButtonClient from './PrintButtonClient';

/**
 * The print button, as a server component.
 *
 * The button is interactive, so the interactive part lives in
 * `PrintButtonClient`; this wrapper resolves the label on the server and
 * passes it down, so the client bundle carries no dictionary.
 */
export default function PrintButton({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);

  return <PrintButtonClient label={dictionary.print.label} />;
}
