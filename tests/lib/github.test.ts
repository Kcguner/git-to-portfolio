import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GitHubAuthError,
  GitHubPrimaryRateLimitError,
  GitHubSecondaryRateLimitError,
  GitHubTimeoutError,
  GitHubUpstreamError,
  GitHubUserNotFoundError,
  getPinnedRepos,
  getProfile,
  getTopRepos,
} from '../../lib/github';

const profile = {
  login: 'octocat',
  name: 'The Octocat',
  avatar_url: 'https://github.com/images/error/octocat_happy.gif',
  bio: 'GitHub mascot',
  followers: 10,
  following: 2,
  public_repos: 8,
  html_url: 'https://github.com/octocat',
  blog: 'https://github.blog',
  twitter_username: 'github',
  email: 'octocat@github.com',
  location: 'San Francisco',
  created_at: '2011-01-25T18:44:36Z',
};

function repo(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    name: 'hello-world',
    full_name: 'octocat/hello-world',
    html_url: 'https://github.com/octocat/hello-world',
    description: 'My first repository',
    stargazers_count: 10,
    forks_count: 2,
    language: 'TypeScript',
    updated_at: '2026-01-02T03:04:05Z',
    fork: false,
    archived: false,
    ...overrides,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function reposResponse(items: unknown[]): Response {
  return jsonResponse(items);
}

/** One `Repository` node as the pinned-repositories query returns it. */
function pinnedRepo(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    databaseId: 11,
    name: 'hello-world',
    nameWithOwner: 'octocat/hello-world',
    url: 'https://github.com/octocat/hello-world',
    description: 'My first repository',
    stargazers: 10,
    forks: 2,
    primaryLanguage: { name: 'TypeScript' },
    repositoryTopics: {
      nodes: [{ topic: { name: 'octocat' } }, { topic: { name: 'cli' } }],
    },
    isFork: false,
    isArchived: false,
    updatedAt: '2026-01-02T03:04:05Z',
    ...overrides,
  };
}

function pinnedResponse(nodes: unknown[]): Response {
  return jsonResponse({ data: { user: { pinnedItems: { nodes } } } });
}

describe('GitHub data layer', () => {
  const originalToken = process.env.GITHUB_TOKEN;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    process.env.GITHUB_TOKEN = 'test-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = originalToken;
  });

  describe('getProfile', () => {
    it('returns a validated profile and sends versioned authenticated headers', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(profile));

      await expect(getProfile(' octocat ')).resolves.toEqual(profile);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.github.com/users/octocat');
      expect(init).toMatchObject({
        method: 'GET',
        next: { revalidate: 3600 },
      });
      expect(init?.headers).toMatchObject({
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer test-token',
        'X-GitHub-Api-Version': '2022-11-28',
      });
    });

    it('normalizes supported username forms before calling GitHub', async () => {
      fetchMock.mockImplementation(async () =>
        jsonResponse({ ...profile, login: 'OctoCat' })
      );

      await expect(getProfile(' @OctoCat ')).resolves.toMatchObject({ login: 'OctoCat' });
      await expect(getProfile('https://github.com/OctoCat')).resolves.toMatchObject({ login: 'OctoCat' });
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://api.github.com/users/octocat',
        expect.anything()
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://api.github.com/users/octocat',
        expect.anything()
      );
    });

    it.each([
      '',
      '@',
      'bad/name',
      'https://github.com/octocat/repository',
      'a'.repeat(40),
    ])('rejects invalid username %j without calling GitHub', async (username) => {
      await expect(getProfile(username)).rejects.toBeInstanceOf(GitHubUserNotFoundError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('can opt out of the shared Next fetch cache for quota-sensitive callers', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(profile));

      await expect(getProfile('octocat', { cache: 'no-store' })).resolves.toEqual(profile);

      const [, init] = fetchMock.mock.calls[0];
      expect(init).toMatchObject({ cache: 'no-store' });
      expect(init).not.toHaveProperty('next');
    });

    it('rejects malformed runtime data as an upstream error', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ ...profile, followers: '10' }));

      await expect(getProfile('octocat')).rejects.toBeInstanceOf(GitHubUpstreamError);
    });

    it('classifies 404 as user-not-found', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));

      const request = getProfile('missing');
      await expect(request).rejects.toBeInstanceOf(GitHubUserNotFoundError);
      await expect(request).rejects.toMatchObject({ code: 'user-not-found', status: 404 });
    });

    it('classifies 401 as auth', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

      const request = getProfile('octocat');
      await expect(request).rejects.toBeInstanceOf(GitHubAuthError);
      await expect(request).rejects.toMatchObject({
        code: 'auth',
        status: 401,
      });
    });

    it('classifies 403 with an exhausted primary limit and preserves reset time', async () => {
      const resetSeconds = Math.floor(Date.now() / 1_000) + 600;
      fetchMock.mockResolvedValueOnce(
        new Response(null, {
          status: 403,
          headers: {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(resetSeconds),
          },
        })
      );

      const request = getProfile('octocat');
      await expect(request).rejects.toBeInstanceOf(GitHubPrimaryRateLimitError);
      await expect(request).rejects.toMatchObject({
        code: 'primary-rate-limit',
        resetAt: resetSeconds * 1_000,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('classifies 403 with retry-after as a secondary limit', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(null, { status: 403, headers: { 'retry-after': '12' } })
      );

      await expect(getProfile('octocat')).rejects.toMatchObject({
        code: 'secondary-rate-limit',
        retryAfterMs: 12_000,
      });
    });

    it('classifies 429 as a secondary limit and preserves retry-after', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(null, { status: 429, headers: { 'retry-after': '2' } })
      );

      const request = getProfile('octocat');
      await expect(request).rejects.toBeInstanceOf(GitHubSecondaryRateLimitError);
      await expect(request).rejects.toMatchObject({
        code: 'secondary-rate-limit',
        retryAfterMs: 2_000,
      });
    });

    it('classifies other failures as upstream without retrying unsafe responses', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

      await expect(getProfile('octocat')).rejects.toBeInstanceOf(GitHubUpstreamError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('times out through AbortSignal', async () => {
      vi.useFakeTimers();
      fetchMock.mockImplementation((_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        })
      );

      const request = getProfile('octocat', { timeoutMs: 25, maxRetries: 0 });
      const assertion = expect(request).rejects.toBeInstanceOf(GitHubTimeoutError);
      await vi.advanceTimersByTimeAsync(25);
      await assertion;
    });

    it('retries a transient timeout and succeeds on the next attempt', async () => {
      vi.useFakeTimers();
      let attempt = 0;
      fetchMock.mockImplementation((_url, init) => {
        attempt += 1;
        if (attempt === 1) {
          return new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
          });
        }
        return Promise.resolve(jsonResponse(profile));
      });

      const request = getProfile('octocat', {
        timeoutMs: 25,
        maxRetries: 1,
        retryBaseDelayMs: 0,
      });
      const assertion = expect(request).resolves.toEqual(profile);
      await vi.runAllTimersAsync();
      await assertion;
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('keeps the timeout error class after all timeout retries fail', async () => {
      vi.useFakeTimers();
      fetchMock.mockImplementation((_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        })
      );

      const request = getProfile('octocat', {
        timeoutMs: 25,
        maxRetries: 1,
        retryBaseDelayMs: 0,
      });
      const assertion = expect(request).rejects.toBeInstanceOf(GitHubTimeoutError);
      await vi.runAllTimersAsync();
      await assertion;
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('getTopRepos', () => {
    it('ranks the core API listing by stars and removes fork/archived items', async () => {
      fetchMock.mockResolvedValueOnce(
        reposResponse([
          repo({ id: 2, name: 'z-last', full_name: 'octocat/z-last', stargazers_count: 5 }),
          repo({
            id: 1,
            name: 'tie-b',
            full_name: 'octocat/tie-b',
            stargazers_count: 5,
          }),
          repo({
            id: 3,
            name: 'fork',
            full_name: 'octocat/fork',
            stargazers_count: 100,
            fork: true,
          }),
          repo({
            id: 4,
            name: 'archived',
            full_name: 'octocat/archived',
            stargazers_count: 90,
            archived: true,
          }),
          repo({
            id: 5,
            name: 'tie-a',
            full_name: 'octocat/tie-a',
            stargazers_count: 5,
          }),
        ])
      );

      const repos = await getTopRepos(' octocat ');

      const [url] = fetchMock.mock.calls[0];
      const parsed = new URL(String(url));
      // The core API, never /search/repositories: unauthenticated search
      // rejects some public accounts with 422 Validation Failed, and it costs
      // 10 requests/minute instead of the core API's 60 per hour.
      expect(`${parsed.origin}${parsed.pathname}`).toBe(
        'https://api.github.com/users/octocat/repos'
      );
      expect(Object.fromEntries(parsed.searchParams)).toEqual({
        type: 'owner',
        sort: 'pushed',
        direction: 'desc',
        per_page: '100',
        page: '1',
      });
      expect(repos.map((item) => item.full_name)).toEqual([
        'octocat/tie-a',
        'octocat/tie-b',
        'octocat/z-last',
      ]);
    });

    it('returns at most the requested count', async () => {
      fetchMock.mockResolvedValueOnce(
        reposResponse([
          repo({ id: 1, full_name: 'octocat/a', stargazers_count: 3 }),
          repo({ id: 2, full_name: 'octocat/b', stargazers_count: 2 }),
        ])
      );

      await expect(getTopRepos('octocat', 1)).resolves.toHaveLength(1);
    });

    it('asks for one full page regardless of the requested count', async () => {
      // The core API cannot sort by stars, so the page size is the ranking
      // window rather than the number of displayed cards. Asking for exactly
      // `count` items would rank a partial window and return noise.
      fetchMock.mockImplementation(async () => reposResponse([]));

      await getTopRepos('octocat', 3);
      await getTopRepos('octocat', 12);
      await getTopRepos('octocat', 2.9);
      await expect(getTopRepos('octocat', Number.POSITIVE_INFINITY)).resolves.toEqual([]);

      const perPage = fetchMock.mock.calls.map(
        ([url]) => new URL(String(url)).searchParams.get('per_page')
      );
      expect(perPage).toEqual(['100', '100', '100']);
    });

    it('stops paging once a short page arrives', async () => {
      fetchMock.mockImplementation(async () => reposResponse([]));

      await getTopRepos('octocat');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not call the API for a zero or negative count', async () => {
      await expect(getTopRepos('octocat', 0)).resolves.toEqual([]);
      await expect(getTopRepos('octocat', -2)).resolves.toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('validates and normalizes the owner before building the repository path', async () => {
      fetchMock.mockResolvedValueOnce(reposResponse([]));

      await expect(getTopRepos(' @OctoCat ')).resolves.toEqual([]);
      expect(String(fetchMock.mock.calls[0][0])).toContain('/users/octocat/repos');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rejects an invalid owner without calling the repository API', async () => {
      await expect(getTopRepos('../octocat')).rejects.toBeInstanceOf(GitHubUserNotFoundError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects malformed repository items as an upstream error', async () => {
      fetchMock.mockResolvedValueOnce(reposResponse([repo({ fork: 'false' })]));

      await expect(getTopRepos('octocat')).rejects.toBeInstanceOf(GitHubUpstreamError);
    });

    it('rejects a non-array repository listing as an upstream error', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ total_count: 1, items: [] })
      );

      await expect(getTopRepos('octocat')).rejects.toBeInstanceOf(GitHubUpstreamError);
    });

    it('keeps at most three topics, the most a card has room for', async () => {
      fetchMock.mockResolvedValueOnce(
        reposResponse([
          repo({
            topics: ['a', 'b', 'c', 'd', 'e'],
          }),
        ])
      );

      const [first] = await getTopRepos('octocat');
      expect(first?.topics).toEqual(['a', 'b', 'c']);
    });

    it('reports no topics when the listing has none or has them malformed', async () => {
      // A missing `topics` field is the norm on older responses; a wrong one is
      // not worth failing a whole profile over, since the field is decoration.
      fetchMock
        .mockResolvedValueOnce(reposResponse([repo({ topics: undefined })]))
        .mockResolvedValueOnce(reposResponse([repo({ topics: 'cli' })]))
        .mockResolvedValueOnce(reposResponse([repo({ topics: ['cli', 7] })]));

      for (const call of [1, 2, 3]) {
        const [fetched] = await getTopRepos('octocat');
        expect(fetched?.topics).toEqual([]);
        expect(fetchMock).toHaveBeenCalledTimes(call);
      }
    });

    it('retries idempotent transient 503 responses with bounded backoff', async () => {
      fetchMock
        .mockResolvedValueOnce(new Response(null, { status: 503 }))
        .mockResolvedValueOnce(jsonResponse(profile));

      await expect(
        getProfile('octocat', { maxRetries: 1, retryBaseDelayMs: 0 })
      ).resolves.toEqual(profile);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('retries transient network errors and wraps a persistent failure as upstream', async () => {
      const networkError = new TypeError('fetch failed', {
        cause: Object.assign(new Error('socket reset'), { code: 'ECONNRESET' }),
      });
      fetchMock.mockRejectedValue(networkError);

      await expect(
        getProfile('octocat', { maxRetries: 1, retryBaseDelayMs: 0 })
      ).rejects.toMatchObject({
        code: 'upstream',
        cause: networkError,
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not retry when the caller aborts the request', async () => {
      const controller = new AbortController();
      fetchMock.mockImplementation((_url, init) => {
        controller.abort('cancelled by caller');
        return Promise.reject(init?.signal?.reason);
      });

      await expect(
        getProfile('octocat', { signal: controller.signal, maxRetries: 2, retryBaseDelayMs: 0 })
      ).rejects.toBe('cancelled by caller');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPinnedRepos', () => {
    /** The fallback is a silent one, so the warning itself is the contract. */
    function silenceWarnings() {
      return vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    }

    it('maps pinned items onto the REST repository shape over GraphQL', async () => {
      fetchMock.mockResolvedValueOnce(
        pinnedResponse([pinnedRepo(), pinnedRepo({ databaseId: 12, name: 'no-language', nameWithOwner: 'octocat/no-language', primaryLanguage: null, repositoryTopics: { nodes: [] } })])
      );

      await expect(getPinnedRepos(' octocat ')).resolves.toEqual([
        {
          id: 11,
          name: 'hello-world',
          full_name: 'octocat/hello-world',
          html_url: 'https://github.com/octocat/hello-world',
          description: 'My first repository',
          stargazers_count: 10,
          forks_count: 2,
          language: 'TypeScript',
          updated_at: '2026-01-02T03:04:05Z',
          fork: false,
          archived: false,
          topics: ['octocat', 'cli'],
        },
        {
          id: 12,
          name: 'no-language',
          full_name: 'octocat/no-language',
          html_url: 'https://github.com/octocat/hello-world',
          description: 'My first repository',
          stargazers_count: 10,
          forks_count: 2,
          language: null,
          updated_at: '2026-01-02T03:04:05Z',
          fork: false,
          archived: false,
          topics: [],
        },
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      // Pinned items only exist in GraphQL; the REST API has no pinned endpoint.
      expect(url).toBe('https://api.github.com/graphql');
      expect(init).toMatchObject({ method: 'POST' });
      expect(init?.headers).toMatchObject({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      });
      const body = JSON.parse(String(init?.body));
      expect(body.query).toContain('pinnedItems(first: $first, types: REPOSITORY)');
      expect(body.variables).toEqual({ login: 'octocat', first: 6 });
    });

    it('skips the request entirely without a token', async () => {
      // The GraphQL API has no anonymous quota, so the call could only fail.
      const warn = silenceWarnings();
      delete process.env.GITHUB_TOKEN;

      await expect(getPinnedRepos('octocat')).resolves.toBeNull();

      expect(fetchMock).not.toHaveBeenCalled();
      // A missing token is a configuration, not a failure to report.
      expect(warn).not.toHaveBeenCalled();
    });

    it('ignores a blank token and reports an unusable username without a request', async () => {
      const warn = silenceWarnings();
      process.env.GITHUB_TOKEN = '   ';

      await expect(getPinnedRepos('octocat')).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();

      process.env.GITHUB_TOKEN = 'test-token';
      await expect(getPinnedRepos('../octocat')).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    });

    it('returns an empty list when the user pinned nothing', async () => {
      fetchMock.mockResolvedValueOnce(pinnedResponse([]));

      // An empty list is a successful answer, not a reason to fall back twice:
      // the caller decides, and it treats it the same as `null`.
      await expect(getPinnedRepos('octocat')).resolves.toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns null and warns once for a rejected token', async () => {
      const warn = silenceWarnings();
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

      await expect(getPinnedRepos('octocat')).resolves.toBeNull();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledOnce();
      const [message] = warn.mock.calls[0] as [string];
      expect(message).toContain('auth');
      expect(message).toContain('status 401');
      expect(message).not.toContain('test-token');
    });

    it('returns null for rate limits, timeouts and transport failures', async () => {
      const warn = silenceWarnings();
      fetchMock.mockResolvedValueOnce(
        new Response(null, {
          status: 403,
          headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1' },
        })
      );

      await expect(getPinnedRepos('octocat')).resolves.toBeNull();
      expect(warn.mock.calls[0]?.[0]).toContain('primary-rate-limit');

      fetchMock.mockResolvedValueOnce(
        new Response(null, { status: 429, headers: { 'retry-after': '2' } })
      );
      await expect(getPinnedRepos('octocat')).resolves.toBeNull();
      expect(warn.mock.calls[1]?.[0]).toContain('secondary-rate-limit');

      fetchMock.mockRejectedValue(new TypeError('fetch failed'));
      await expect(
        getPinnedRepos('octocat', { maxRetries: 0, retryBaseDelayMs: 0 })
      ).resolves.toBeNull();
      expect(warn.mock.calls[2]?.[0]).toContain('upstream');
    });

    it('returns null when the request times out', async () => {
      vi.useFakeTimers();
      const warn = silenceWarnings();
      fetchMock.mockImplementation((_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        })
      );

      const request = getPinnedRepos('octocat', { timeoutMs: 25, maxRetries: 0 });
      const assertion = expect(request).resolves.toBeNull();
      await vi.advanceTimersByTimeAsync(25);
      await assertion;

      expect(warn.mock.calls[0]?.[0]).toContain('timeout');
    });

    it('returns null for GraphQL errors reported inside a 200 response', async () => {
      const warn = silenceWarnings();
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ data: null, errors: [{ type: 'NOT_FOUND' }] })
      );

      await expect(getPinnedRepos('octocat')).resolves.toBeNull();
      expect(warn).toHaveBeenCalledOnce();
    });

    it.each([
      ['a missing data object', jsonResponse({})],
      ['a missing user', jsonResponse({ data: { user: null } })],
      [
        'a non-array node list',
        jsonResponse({ data: { user: { pinnedItems: { nodes: {} } } } }),
      ],
      ['a malformed node', pinnedResponse([pinnedRepo({ stargazers: 'ten' })])],
      [
        'a malformed topic wrapper',
        pinnedResponse([pinnedRepo({ repositoryTopics: { nodes: [{ name: 'cli' }] } })]),
      ],
      [
        'a repository without an id',
        pinnedResponse([pinnedRepo({ databaseId: null })]),
      ],
    ])('returns null for %s', async (_label, response) => {
      const warn = silenceWarnings();
      fetchMock.mockResolvedValueOnce(response);

      await expect(getPinnedRepos('octocat')).resolves.toBeNull();
      expect(warn).toHaveBeenCalledOnce();
    });

    it('skips null union nodes instead of failing the whole list', async () => {
      fetchMock.mockResolvedValueOnce(pinnedResponse([null, pinnedRepo(), undefined]));

      const pinned = await getPinnedRepos('octocat');
      expect(pinned?.map(({ id }) => id)).toEqual([11]);
    });

    it('caps the topic list at three, like the REST parser', async () => {
      fetchMock.mockResolvedValueOnce(
        pinnedResponse([
          pinnedRepo({
            repositoryTopics: {
              nodes: ['a', 'b', 'c', 'd', 'e'].map((name) => ({ topic: { name } })),
            },
          }),
        ])
      );

      const [first] = (await getPinnedRepos('octocat')) ?? [];
      expect(first?.topics).toEqual(['a', 'b', 'c']);
    });

    it('reuses the shared retry and cache behaviour of the REST calls', async () => {
      fetchMock
        .mockResolvedValueOnce(new Response(null, { status: 503 }))
        .mockResolvedValueOnce(pinnedResponse([pinnedRepo()]));

      await expect(
        getPinnedRepos('octocat', { maxRetries: 1, retryBaseDelayMs: 0 })
      ).resolves.toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      fetchMock.mockResolvedValueOnce(pinnedResponse([pinnedRepo()]));
      await getPinnedRepos('octocat', { cache: 'no-store' });
      const init = fetchMock.mock.calls[2]?.[1];
      expect(init).toMatchObject({ cache: 'no-store' });
      expect(init).not.toHaveProperty('next');
    });
  });
});
