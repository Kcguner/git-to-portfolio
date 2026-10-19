import { describeFailure, getPinnedRepos, getTopRepos } from '@/lib/github';
import type { GitHubProfile, GitHubRepo } from '@/lib/github';
import { getProfileBasePathname, type Locale } from '@/lib/i18n';
import { getProfileJsonLd } from '@/lib/seo';
import { calculateTopLanguages } from '@/lib/skills';
import FeaturedLanguages from '@/components/FeaturedLanguages';
import JsonLd from '@/components/JsonLd';
import RepoGrid, { type RepoSource } from '@/components/RepoGrid';

/** Number of repositories shown on the portfolio, and used for language stats. */
const FEATURED_REPO_COUNT = 6;

type Props = {
  /** The confirmed, canonical login: everything below is looked up for it. */
  username: string;
  locale: Locale;
  /** The already-loaded profile, forwarded so the data block names the person. */
  profile: GitHubProfile;
  /** The person's display name, resolved by the page that renders this block. */
  displayName: string;
  /** Their own description, falling back to the localized portfolio line. */
  description: string;
};

/**
 * The repositories, the languages derived from them, and the structured data
 * that describes both.
 *
 * This is the slow half of the profile page and the page renders it behind a
 * Suspense boundary, so nothing in here may run before the boundary: the
 * profile lookup and the two canonical-username redirects have to stay in the
 * page body, where a missing user is still a real `404` and a renamed account
 * is still a real `308`. A repository lookup that failed is not allowed to fail
 * the page, which is why the fallback below degrades instead of throwing.
 */
export default async function ProfileRepos({
  username,
  locale,
  profile,
  displayName,
  description,
}: Props) {
  // Which six repositories are on the sheet, and who chose them.
  //
  // Pinned repositories come first, because they are the only list here the
  // user chose themselves. The lookup is a separate GraphQL call that answers
  // `null` whenever it cannot (see `getPinnedRepos`), so the ranking below is
  // the fallback rather than the default.
  //
  // The fallback ranks `GET /users/:username/repos` by stars itself: the core
  // API cannot sort, and the Search API it replaced rejects some public
  // accounts outright and is rate limited ten times harder. A failure there
  // must not take the whole page down, so the languages block and the
  // repository empty state still render.
  let repos: GitHubRepo[] = [];
  let repoSource: RepoSource = 'starred';
  let reposUnavailable = false;

  // The two lookups start together, so the fallback costs no extra round
  // trip.
  //
  // They used to be one after the other: the pinned list was awaited first
  // and the ranking was only asked for when it came back empty. That made
  // the fallback pay for two round trips back to back, and the pinned lookup
  // is the slow one - a GraphQL failure waits for the ten second timeout
  // before the ranking even starts. Asking for both at once turns the sum of
  // the two into the slower of the two.
  //
  // The price is one listing per view that the pinned list would have made
  // unnecessary. It is the same `GET` the fallback would have made anyway,
  // and it goes through the same shared cache as every other GitHub
  // response, so it is normally a cache read rather than a second trip to
  // GitHub.
  const [pinned, ranked] = await Promise.all([
    getPinnedRepos(username),
    // The rejection is turned into a value here, not left to the caller: the
    // ranking is only the fallback, so a failure in it must not become an
    // unhandled rejection when the pinned list answers the question.
    getTopRepos(username, FEATURED_REPO_COUNT).then(
      (repos): { repos: GitHubRepo[]; error: null } => ({ repos, error: null }),
      (error: unknown): { repos: null; error: unknown } => ({ repos: null, error })
    ),
  ]);

  if (pinned && pinned.length > 0) {
    repos = pinned;
    repoSource = 'pinned';
  } else if (ranked.repos) {
    repos = ranked.repos;
    repoSource = 'starred';
  } else {
    reposUnavailable = true;
    // Warn, not error: the page renders successfully with an empty repository
    // state. `console.error` would trip the Next.js dev error overlay and make
    // a working page look broken.
    console.warn(
      `[profile] repository lookup failed (${describeFailure(ranked.error)}); rendering the profile without repositories`
    );
  }

  const topRepos = repos.slice(0, FEATURED_REPO_COUNT);
  const topLanguages = calculateTopLanguages(topRepos);

  return (
    <>
      {/* The structured data describes exactly what this block draws, so it is
          emitted with it rather than by the shell: a data block that promised
          projects the stream has not delivered yet would describe a page nobody
          can see.

          The pathname is the **base** one — `/octocat`, not `/en/octocat` —
          because the block's `url` is derived from it by adding the locale in
          front of it. The base path is the unambiguous form here: the base
          path of the GitHub account called `en` is `/en`, and a builder that
          reads a lone leading segment as a language would point the block at
          the English home instead of at the person's page. */}
      <JsonLd
        data={getProfileJsonLd({
          locale,
          pathname: getProfileBasePathname(username),
          displayName,
          login: profile.login,
          description,
          avatarUrl: profile.avatar_url,
          profileUrl: profile.html_url,
          blogUrl: profile.blog,
          twitterUsername: profile.twitter_username,
          repositories: topRepos.map((repo) => ({
            name: repo.name,
            url: repo.html_url,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
          })),
          topLanguages,
        })}
      />
      <div className="mt-10 sm:mt-12">
        {topLanguages.length > 0 && (
          <section className="card-premium mb-10 p-6 sm:mb-12 sm:p-8">
            <FeaturedLanguages languages={topLanguages} locale={locale} />
          </section>
        )}
        <RepoGrid repos={topRepos} locale={locale} source={repoSource} unavailable={reposUnavailable} />
      </div>
    </>
  );
}
