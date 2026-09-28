import { getDictionary, LOCALE_TAGS, type Locale } from '@/lib/i18n';
import { getLanguageColor } from '@/lib/language-colors';
import type { TopLanguage } from '@/lib/skills';

type Props = {
  languages: TopLanguage[];
  locale: Locale;
};

/**
 * A share is already in the page's own language, so the percentage is not
 * assembled from a bare number: Turkish writes `%60` where German writes `60 %`.
 */
function formatPercent(percent: number, localeTag: string): string {
  return new Intl.NumberFormat(localeTag, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(percent / 100);
}

/**
 * The three languages the featured repositories are written in, as tolerances.
 *
 * This block is rendered behind the same Suspense boundary as the repositories
 * it is derived from, so it is a pure projection of the list its caller already
 * has. The percentage is the only computed value in the sheet that comes from
 * outside the data, and it is formatted for the reader rather than assembled.
 */
export default function FeaturedLanguages({ languages, locale }: Props) {
  const dictionary = getDictionary(locale);
  const localeTag = LOCALE_TAGS[locale];
  // The sheet has room for three tolerances; anything past that is not shown.
  const top3 = languages.slice(0, 3);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="section-label">{dictionary.profile.featuredLanguages}</span>
          <h2 className="mt-2 font-sans text-lg font-black tracking-tight text-text-primary">{dictionary.profile.topLanguages}</h2>
        </div>
        <span className="font-mono text-xs text-text-muted">{dictionary.profile.topThree}</span>
      </div>

      {/*
        One row per language, drawn as a tolerance: the name on a fixed
        measure, a hairline-framed bar, the share in mono. The bar stays the
        `role="progressbar"` element with a single `div` fill, which is the
        pair of selectors the print stylesheet repaints in flat greys.
      */}
      <ul className="mt-6 space-y-2">
        {top3.map((language) => {
          const formattedPercent = formatPercent(language.percent, localeTag);

          return (
            <li
              key={language.name}
              className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-3 sm:grid-cols-[9rem_1fr_3.5rem]"
            >
              <span className="truncate font-mono text-xs text-text-primary">{language.name}</span>
              <div
                className="h-2 overflow-hidden border border-border bg-surface-elevated"
                role="progressbar"
                aria-valuenow={language.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={dictionary.profile.languagePercent(language.name, formattedPercent)}
              >
                <div
                  className="h-full"
                  style={{ width: `${language.percent}%`, backgroundColor: getLanguageColor(language.name) }}
                />
              </div>
              <span className="text-right font-mono text-xs tabular-nums text-text-secondary">
                {formattedPercent}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
