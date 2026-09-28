import { describeFailure, getPinnedRepos, getTopRepos } from '@/lib/github';
import type { GitHubProfile, GitHubRepo } from '@/lib/github';
import { getProfilePathname, type Locale } from '@/lib/i18n';
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
  // the fallback rather than the default, and it is only spent when the pinned
  // list is genuinely empty.
  //
  // The fallback ranks `GET /users/:username/repos` by stars itself: the core
  // API cannot sort, and the Search API it replaced rejects some public
  // accounts outright and is rate limited ten times harder. A failure there
  // must not take the whole page down, so the languages block and the
  // repository empty state still render. Ask for exactly as many repositories
  // as are displayed - the featured language percentages are derived from the
  // same six, so a larger page only burns transfer size - and the slice below
  // keeps the page's own contract independent of the data layer's count
  // handling.
  let repos: GitHubRepo[] = [];
  let repoSource: RepoSource = 'starred';
  let reposUnavailable = false;

  const pinned = await getPinnedRepos(username);
  if (pinned && pinned.length > 0) {
    repos = pinned;
    repoSource = 'pinned';
  } else {
    try {
      repos = await getTopRepos(username, FEATURED_REPO_COUNT);
    } catch (error) {
      reposUnavailable = true;
      // Warn, not error: the page renders successfully with an empty repository
      // state. `console.error` would trip the Next.js dev error overlay and make
      // a working page look broken.
      console.warn(
        `[profile] repository lookup failed (${describeFailure(error)}); rendering the profile without repositories`
      );
    }
  }

  const topRepos = repos.slice(0, FEATURED_REPO_COUNT);
  const topLanguages = calculateTopLanguages(topRepos);

  return (
    <>
      {/* The structured data describes exactly what this block draws, so it is
          emitted with it rather than by the shell: a data block that promised
          projects the stream has not delivered yet would describe a page nobody
          can see. */}
      <JsonLd
        data={getProfileJsonLd({
          locale,
          pathname: getProfilePathname(username),
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
