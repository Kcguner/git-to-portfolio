import { getDictionary, type Locale } from '@/lib/i18n';

type Props = {
  locale: Locale;
};

/** One block of unprinted content. Square: nothing in this sheet is rounded. */
function Pulse({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse bg-surface-elevated ${className}`} />;
}

/** One tolerance row: name on a fixed measure, a framed bar, the share. */
function ToleranceRow() {
  return (
    <div className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-3 sm:grid-cols-[9rem_1fr_3.5rem]">
      <Pulse className="h-3 w-full" />
      <Pulse className="h-2 w-full" />
      <Pulse className="h-3 w-full" />
    </div>
  );
}

/**
 * The fallback for the repository block of the profile page.
 *
 * It is a Server Component that takes its locale as a prop, so unlike the
 * route-level `loading.tsx` it reads nothing from the request: the page already
 * resolved the language and hands it straight down. It stands in for the
 * languages block and the six-cell grid only - the profile card above is
 * already rendered by the time this appears.
 *
 * Every block is square and sized like the element it stands in for, and the
 * hairlines are real, so the real block drops into the same frame without
 * moving anything. Colours are token-only, which is what keeps the pulses
 * readable in both themes without a second set of dark values.
 */
export default function ReposSkeleton({ locale }: Props) {
  const dictionary = getDictionary(locale);

  return (
    // The skeleton only ever exists before the real block replaces it, so it
    // never reaches paper: `no-print` keeps a printed sheet free of grey boxes.
    <div className="no-print mt-10 sm:mt-12" role="status" aria-busy="true">
      <p className="sr-only">{dictionary.profile.profileLoading}</p>

      <div className="mt-8 border-t border-border pt-6">
        <Pulse className="h-3 w-36" />
        <Pulse className="mt-2 h-5 w-44" />
        <div className="mt-6 space-y-2">
          <ToleranceRow />
          <ToleranceRow />
          <ToleranceRow />
        </div>
      </div>

      <div className="mt-8">
        <div className="border-t border-border pt-4">
          <Pulse className="h-3 w-24" />
          <Pulse className="mt-2 h-7 w-56 max-w-full" />
        </div>

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Six cells, the number of featured repositories the page shows. */}
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="card-premium flex min-h-[220px] flex-col p-5">
              <Pulse className="h-3 w-24" />
              <Pulse className="mt-3 h-6 w-40" />
              <div className="mt-2 flex flex-col gap-2">
                <Pulse className="h-3 w-full" />
                <Pulse className="h-3 w-full" />
                <Pulse className="h-3 w-2/3" />
              </div>
              <div className="mt-auto flex border border-border">
                <Pulse className="h-6 flex-1 border-r border-border" />
                <Pulse className="h-6 flex-1 border-r border-border" />
                <Pulse className="h-6 flex-1" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
