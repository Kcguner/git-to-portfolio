import { getDictionary, type Locale } from '@/lib/i18n';
import ShareButtonClient from './ShareButtonClient';

type ShareButtonProps = {
  locale: Locale;
  title: string;
  url: string;
};

/**
 * The share button, as a server component.
 *
 * The button is interactive, so the interactive part lives in
 * `ShareButtonClient`; this wrapper resolves the copy on the server and passes
 * it down, so the client bundle carries no dictionary.
 */
export default function ShareButton({ locale, title, url }: ShareButtonProps) {
  const dictionary = getDictionary(locale);

  return <ShareButtonClient title={title} url={url} share={dictionary.share} />;
}
