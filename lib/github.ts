import { normalizeUsername } from './username';

export interface GitHubProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
  blog: string | null;
  twitter_username: string | null;
  email: string | null;
  location: string | null;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  fork: boolean;
  archived: boolean;
  /**
   * Repository topics, already capped to `MAX_TOPICS`. Always an array: a
   * repository without topics is not a special case, it is the common one.
   */
  topics: string[];
}

export type GitHubErrorCode =
  | 'user-not-found'
  | 'auth'
  | 'primary-rate-limit'
  | 'secondary-rate-limit'
  | 'upstream'
  | 'timeout';

export interface GitHubErrorContext {
  status?: number;
  retryAfterMs?: number;
  resetAt?: number;
  cause?: unknown;
}

export class GitHubError extends Error {
  readonly code: GitHubErrorCode;
  readonly status?: number;
  readonly retryAfterMs?: number;
  readonly resetAt?: number;
  readonly cause?: unknown;

  constructor(code: GitHubErrorCode, message: string, context: GitHubErrorContext = {}) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = context.status;
    this.retryAfterMs = context.retryAfterMs;
    this.resetAt = context.resetAt;
    this.cause = context.cause;
  }
}

export class GitHubUserNotFoundError extends GitHubError {
  constructor(context: GitHubErrorContext = {}) {
    super('user-not-found', 'GitHub user not found', context);
  }
}

export class GitHubAuthError extends GitHubError {
  constructor(context: GitHubErrorContext = {}) {
    super('auth', 'GitHub authentication failed', context);
  }
}

export class GitHubPrimaryRateLimitError extends GitHubError {
  constructor(context: GitHubErrorContext = {}) {
    super('primary-rate-limit', 'GitHub API primary rate limit exceeded', context);
  }
}

export class GitHubSecondaryRateLimitError extends GitHubError {
  constructor(context: GitHubErrorContext = {}) {
    super('secondary-rate-limit', 'GitHub API secondary rate limit exceeded', context);
  }
}

export class GitHubUpstreamError extends GitHubError {
  constructor(context: GitHubErrorContext = {}) {
    super('upstream', 'GitHub API request failed', context);
  }
}

export class GitHubTimeoutError extends GitHubError {
  constructor(context: GitHubErrorContext = {}) {
    super('timeout', 'GitHub API request timed out', context);
  }
}

export interface GitHubRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  cache?: 'force-cache' | 'no-store';
}

type GitHubFetchInit = RequestInit & {
  next?: { revalidate: number };
  cache?: 'force-cache' | 'no-store';
};

/** What distinguishes one GitHub call from another; the rest is shared. */
type GitHubCall = {
  method: 'GET' | 'POST';
  body?: string;
};

type UnknownRecord = Record<string, unknown>;

const BASE = 'https://api.github.com';
const GRAPHQL_PATH = '/graphql';
const API_VERSION = '2022-11-28';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 250;
const MAX_RETRIES = 3;
const MAX_RETRY_DELAY_MS = 5_000;
const MAX_REPOS = 100;
/**
 * Topics shown on a project card. The cap is applied where the data is parsed,
 * not where it is rendered, so the payload and the layout agree on one number:
 * GitHub allows twenty topics per repository, all of which would be fetched,
 * serialised through the RSC payload and then dropped.
 */
const MAX_TOPICS = 3;
/** Pinned items the portfolio can display, and therefore the GraphQL page size. */
const MAX_PINNED_REPOS = 6;
/**
 * How many 100-repository pages of a user's listing are ranked locally. One
 * page already covers the large majority of accounts; every extra page costs
 * one more request against the shared core-API quota.
 */
const DEFAULT_REPO_PAGES = 1;
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const RETRYABLE_NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

function headers(contentType?: string): HeadersInit {
  const result: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION,
    'User-Agent': 'git-to-portfolio',
  };
  if (contentType) result['Content-Type'] = contentType;
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    result.Authorization = `Bearer ${token}`;
  }
  return result;
}

/** The shared cache opt-out: either a hard no-store or an hourly revalidate. */
function cacheInit(options: GitHubRequestOptions): Pick<GitHubFetchInit, 'next' | 'cache'> {
  return options.cache === 'no-store' ? { cache: 'no-store' } : { next: { revalidate: 3600 } };
}

function clampInteger(value: number | undefined, fallback: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(0, Math.floor(value)));
}

function isRetryableNetworkError(error: unknown, depth = 0): boolean {
  if (error instanceof TypeError || error instanceof GitHubTimeoutError) return true;
  if (depth >= 2 || typeof error !== 'object' || error === null) return false;

  const record = error as { code?: unknown; cause?: unknown };
  const hasRetryableCode =
    typeof record.code === 'string' && RETRYABLE_NETWORK_ERROR_CODES.has(record.code);
  return hasRetryableCode || isRetryableNetworkError(record.cause, depth + 1);
}

function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (value === null) return undefined;

  const trimmed = value.trim();
  if (trimmed === '') return undefined;

  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1_000);
  }

  const timestamp = Date.parse(trimmed);
  if (Number.isFinite(timestamp)) return Math.max(0, timestamp - now);
  return undefined;
}

function parseResetAt(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.round(seconds * 1_000);
}

function errorContext(res: Response, cause?: unknown): GitHubErrorContext {
  return {
    status: res.status,
    retryAfterMs: parseRetryAfter(res.headers.get('retry-after')),
    resetAt: parseResetAt(res.headers.get('x-ratelimit-reset')),
    cause,
  };
}

function hasRateLimitRemaining(res: Response): boolean {
  const value = res.headers.get('x-ratelimit-remaining');
  return value !== null && Number(value.trim()) === 0;
}

function throwResponseError(res: Response): never {
  const context = errorContext(res);

  if (res.status === 404) throw new GitHubUserNotFoundError(context);
  if (res.status === 401) throw new GitHubAuthError(context);
  if (res.status === 403 && hasRateLimitRemaining(res)) {
    throw new GitHubPrimaryRateLimitError(context);
  }
  if (res.status === 429 || (res.status === 403 && context.retryAfterMs !== undefined)) {
    throw new GitHubSecondaryRateLimitError(context);
  }
  throw new GitHubUpstreamError(context);
}

function retryDelay(attempt: number, baseDelayMs: number, res?: Response): number {
  const backoff = Math.min(MAX_RETRY_DELAY_MS, baseDelayMs * 2 ** attempt);
  const serverDelay = res ? parseRetryAfter(res.headers.get('retry-after')) : undefined;
  return Math.min(MAX_RETRY_DELAY_MS, serverDelay ?? backoff);
}

function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOnce(
  url: string,
  call: GitHubCall,
  options: GitHubRequestOptions,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const externalSignal = options.signal;
  let timedOut = false;

  const onExternalAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort(externalSignal.reason);
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException('GitHub API request timed out', 'TimeoutError'));
  }, timeoutMs);

  const init: GitHubFetchInit = {
    method: call.method,
    headers: headers(call.body ? 'application/json' : undefined),
    signal: controller.signal,
    ...cacheInit(options),
    ...(call.body ? { body: call.body } : {}),
  };

  try {
    return await fetch(url, init);
  } catch (error) {
    if (timedOut) throw new GitHubTimeoutError({ cause: error });
    throw error;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

/**
 * One GitHub call with the shared timeout, bounded retry and error mapping, so
 * the REST and GraphQL paths fail (or survive) in exactly the same way.
 */
async function githubRequest(
  url: string,
  call: GitHubCall,
  options: GitHubRequestOptions
): Promise<Response> {
  const timeoutMs = clampInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 120_000);
  const maxRetries = clampInteger(options.maxRetries, DEFAULT_MAX_RETRIES, MAX_RETRIES);
  const retryBaseDelayMs = clampInteger(
    options.retryBaseDelayMs,
    DEFAULT_RETRY_BASE_DELAY_MS,
    MAX_RETRY_DELAY_MS
  );

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    let res: Response;

    try {
      res = await fetchOnce(url, call, options, timeoutMs);
    } catch (error) {
      if (options.signal?.aborted) throw error;
      if (isRetryableNetworkError(error) && attempt < maxRetries) {
        await wait(retryDelay(attempt, retryBaseDelayMs));
        continue;
      }
      if (error instanceof GitHubError) throw error;
      throw new GitHubUpstreamError({ cause: error });
    }

    if (RETRYABLE_STATUSES.has(res.status) && attempt < maxRetries) {
      await wait(retryDelay(attempt, retryBaseDelayMs, res));
      continue;
    }

    if (!res.ok) throwResponseError(res);
    return res;
  }

  throw new GitHubUpstreamError();
}

function githubGet(path: string, options: GitHubRequestOptions): Promise<Response> {
  return githubRequest(`${BASE}${path}`, { method: 'GET' }, options);
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch (error) {
    throw new GitHubUpstreamError({ status: res.status, cause: error });
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function requireRecord(value: unknown, path: string): UnknownRecord {
  if (!isRecord(value)) throw new TypeError(`GitHub response field ${path} must be an object`);
  return value;
}

function requireString(record: UnknownRecord, field: string, path: string): string {
  const value = record[field];
  if (!isString(value)) throw new TypeError(`GitHub response field ${path}.${field} must be a string`);
  return value;
}

function requireNullableString(record: UnknownRecord, field: string, path: string): string | null {
  const value = record[field];
  if (!isNullableString(value)) {
    throw new TypeError(`GitHub response field ${path}.${field} must be a string or null`);
  }
  return value;
}

function requireNonNegativeInteger(record: UnknownRecord, field: string, path: string): number {
  const value = record[field];
  if (!isNonNegativeInteger(value)) {
    throw new TypeError(`GitHub response field ${path}.${field} must be a non-negative integer`);
  }
  return value;
}

function requireBoolean(record: UnknownRecord, field: string, path: string): boolean {
  const value = record[field];
  if (typeof value !== 'boolean') {
    throw new TypeError(`GitHub response field ${path}.${field} must be a boolean`);
  }
  return value;
}

/**
 * REST `topics` is a plain string array. A response that carries anything else
 * has nothing to show, so it degrades to an empty list rather than rejecting
 * the whole page over a decorative field.
 */
function parseTopics(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every(isString)) return [];
  return value.slice(0, MAX_TOPICS);
}

/** The same list as GraphQL returns it, as a connection of topic wrappers. */
function parsePinnedTopics(value: unknown, path: string): string[] {
  const topicsPath = `${path}.repositoryTopics`;
  const nodes = requireRecord(value, topicsPath).nodes;
  if (!Array.isArray(nodes)) {
    throw new TypeError(`GitHub response field ${topicsPath}.nodes must be an array`);
  }

  const topics: string[] = [];
  for (const [index, node] of nodes.entries()) {
    const nodePath = `${topicsPath}.nodes[${index}]`;
    const topicPath = `${nodePath}.topic`;
    const topic = requireRecord(requireRecord(node, nodePath).topic, topicPath);
    topics.push(requireString(topic, 'name', topicPath));
  }
  return topics.slice(0, MAX_TOPICS);
}

function requireNamedRepo(repo: GitHubRepo, path: string): GitHubRepo {
  if (repo.name === '' || repo.full_name === '') {
    throw new TypeError(`GitHub response field ${path} contains an empty repository name`);
  }
  return repo;
}

function parseProfile(value: unknown): GitHubProfile {
  const path = 'profile';
  const record = requireRecord(value, path);
  const profile: GitHubProfile = {
    login: requireString(record, 'login', path),
    name: requireNullableString(record, 'name', path),
    avatar_url: requireString(record, 'avatar_url', path),
    bio: requireNullableString(record, 'bio', path),
    followers: requireNonNegativeInteger(record, 'followers', path),
    following: requireNonNegativeInteger(record, 'following', path),
    public_repos: requireNonNegativeInteger(record, 'public_repos', path),
    html_url: requireString(record, 'html_url', path),
    blog: requireNullableString(record, 'blog', path),
    twitter_username: requireNullableString(record, 'twitter_username', path),
    email: requireNullableString(record, 'email', path),
    location: requireNullableString(record, 'location', path),
    created_at: requireString(record, 'created_at', path),
  };

  if (profile.login === '') throw new TypeError('GitHub response field profile.login must not be empty');
  return profile;
}

function parseRepo(value: unknown, path: string): GitHubRepo {
  const record = requireRecord(value, path);
  const repo: GitHubRepo = {
    id: requireNonNegativeInteger(record, 'id', path),
    name: requireString(record, 'name', path),
    full_name: requireString(record, 'full_name', path),
    html_url: requireString(record, 'html_url', path),
    description: requireNullableString(record, 'description', path),
    stargazers_count: requireNonNegativeInteger(record, 'stargazers_count', path),
    forks_count: requireNonNegativeInteger(record, 'forks_count', path),
    language: requireNullableString(record, 'language', path),
    updated_at: requireString(record, 'updated_at', path),
    fork: requireBoolean(record, 'fork', path),
    archived: requireBoolean(record, 'archived', path),
    topics: parseTopics(record.topics),
  };

  return requireNamedRepo(repo, path);
}

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function normalizeRepoCount(count: number | undefined): number {
  if (count === undefined) return 6;
  if (!Number.isFinite(count)) return 0;
  return Math.min(MAX_REPOS, Math.max(0, Math.floor(count)));
}

function requireUsername(username: string): string {
  const login = normalizeUsername(username);
  if (!login) throw new GitHubUserNotFoundError();
  return login;
}

export async function getProfile(
  username: string,
  options: GitHubRequestOptions = {}
): Promise<GitHubProfile> {
  const login = requireUsername(username);
  const res = await githubGet(`/users/${encodeURIComponent(login)}`, options);
  const body = await readJson(res);

  try {
    return parseProfile(body);
  } catch (error) {
    if (error instanceof GitHubError) throw error;
    throw new GitHubUpstreamError({ status: res.status, cause: error });
  }
}

function parseReposResponse(value: unknown): GitHubRepo[] {
  if (!Array.isArray(value)) {
    throw new TypeError('GitHub response field repos must be an array');
  }
  return value.map((item, index) => parseRepo(item, `repos[${index}]`));
}

/**
 * Reads one page of a user's repositories from the core API.
 *
 * The Search API is deliberately not used here. Two reasons:
 *  - It is rate limited an order of magnitude more aggressively (10 requests
 *    per minute unauthenticated versus 60 per hour for the core API), which
 *    made a single profile view the most expensive call on the site.
 *  - Unauthenticated search refuses some public accounts outright with
 *    `422 Validation Failed` ("the resources do not exist or you do not have
 *    permission to view them"), so a perfectly valid profile could render with
 *    no repositories at all. The core endpoint has no such blind spot.
 *
 * The trade-off is ranking: the core API cannot sort by stars, so the caller
 * ranks the fetched window locally. The window is the repositories most
 * recently pushed, capped at `MAX_PAGES` pages, which covers the great
 * majority of accounts exactly.
 */
async function fetchRepoWindow(
  login: string,
  maxPages: number,
  options: GitHubRequestOptions
): Promise<GitHubRepo[]> {
  const collected: GitHubRepo[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const params = new URLSearchParams({
      type: 'owner',
      sort: 'pushed',
      direction: 'desc',
      per_page: String(MAX_REPOS),
      page: String(page),
    });
    const res = await githubGet(`/users/${encodeURIComponent(login)}/repos?${params.toString()}`, options);
    const body = await readJson(res);

    let repos: GitHubRepo[];
    try {
      repos = parseReposResponse(body);
    } catch (error) {
      if (error instanceof GitHubError) throw error;
      throw new GitHubUpstreamError({ status: res.status, cause: error });
    }

    collected.push(...repos);
    // A short page means there is nothing left to page through.
    if (repos.length < MAX_REPOS) break;
  }

  return collected;
}

export async function getTopRepos(
  username: string,
  count?: number,
  options: GitHubRequestOptions = {}
): Promise<GitHubRepo[]> {
  const login = requireUsername(username);
  const limit = normalizeRepoCount(count);
  if (limit === 0) return [];

  const repos = await fetchRepoWindow(login, DEFAULT_REPO_PAGES, options);

  return repos
    .filter((repo) => !repo.fork && !repo.archived)
    .sort((left, right) => {
      const starDifference = right.stargazers_count - left.stargazers_count;
      return starDifference !== 0 ? starDifference : compareStrings(left.full_name, right.full_name);
    })
    .slice(0, limit);
}

/**
 * The repositories a user pinned on their profile, in the order they chose.
 *
 * `pinnedItems` is GraphQL-only - the REST API has no pinned endpoint at all -
 * so this is the one lookup on the site that needs the GraphQL API. The fields
 * are aliased to their REST names, which keeps a single repository shape in the
 * rest of the app: the ranking and the pinned list are then interchangeable and
 * only the section heading differs.
 *
 * `databaseId` is the REST `id`; the GraphQL `id` is an opaque node id with no
 * place in a shape that also has to hold REST repositories. Only the columns
 * the page renders are requested, and `updatedAt` alone is the date it shows.
 */
const PINNED_REPOS_QUERY = `query PinnedRepositories($login: String!, $first: Int!) {
  user(login: $login) {
    pinnedItems(first: $first, types: REPOSITORY) {
      nodes {
        ... on Repository {
          databaseId
          name
          nameWithOwner
          url
          description
          stargazers: stargazerCount
          forks: forkCount
          primaryLanguage { name }
          repositoryTopics(first: 5) { nodes { topic { name } } }
          isFork
          isArchived
          updatedAt
        }
      }
    }
  }
}`;

function parsePinnedRepo(value: unknown, path: string): GitHubRepo {
  const record = requireRecord(value, path);
  const languagePath = `${path}.primaryLanguage`;
  const primaryLanguage = record.primaryLanguage;

  const repo: GitHubRepo = {
    id: requireNonNegativeInteger(record, 'databaseId', path),
    name: requireString(record, 'name', path),
    full_name: requireString(record, 'nameWithOwner', path),
    html_url: requireString(record, 'url', path),
    description: requireNullableString(record, 'description', path),
    stargazers_count: requireNonNegativeInteger(record, 'stargazers', path),
    forks_count: requireNonNegativeInteger(record, 'forks', path),
    language:
      primaryLanguage === null || primaryLanguage === undefined
        ? null
        : requireString(requireRecord(primaryLanguage, languagePath), 'name', languagePath),
    updated_at: requireString(record, 'updatedAt', path),
    fork: requireBoolean(record, 'isFork', path),
    archived: requireBoolean(record, 'isArchived', path),
    topics: parsePinnedTopics(record.repositoryTopics, path),
  };

  return requireNamedRepo(repo, path);
}

function parsePinnedResponse(value: unknown): GitHubRepo[] {
  const response = requireRecord(value, 'response');
  // GraphQL reports its failures inside a 200 response, so a body carrying
  // errors is a failed query, not a successful one with data.
  if (Array.isArray(response.errors) && response.errors.length > 0) {
    throw new GitHubUpstreamError();
  }

  const data = requireRecord(response.data, 'response.data');
  const user = requireRecord(data.user, 'response.data.user');
  const pinnedItems = requireRecord(
    user.pinnedItems,
    'response.data.user.pinnedItems'
  );
  const nodes = pinnedItems.nodes;
  if (!Array.isArray(nodes)) {
    throw new TypeError('GitHub response field response.data.user.pinnedItems.nodes must be an array');
  }

  return nodes
    // A union selection yields null for every type the fragment does not
    // describe. `types: REPOSITORY` should rule them out; one that slips
    // through is not a repository and is simply not shown.
    .filter((node) => node !== null && node !== undefined)
    .map((node, index) => parsePinnedRepo(node, `pinnedItems.nodes[${index}]`));
}

/**
 * A short, non-sensitive description of a GitHub failure for logs: the error
 * code and the HTTP status only, never the response body or the token.
 *
 * Exported so every caller that logs a failed lookup - the page and the pinned
 * lookup below - describes the same failure the same way.
 */
export function describeFailure(error: unknown): string {
  if (error instanceof GitHubError) {
    return error.status === undefined ? error.code : `${error.code} (status ${error.status})`;
  }
  return 'unknown';
}

/**
 * The user's own picks, or `null` for "use the fallback".
 *
 * This never throws, because a missing feature is a far better outcome than a
 * broken page: the caller falls back to the starred ranking and the reader sees
 * the same six cells either way. Every failure - no token, auth, rate limit,
 * timeout, unexpected shape, a user who pinned nothing - returns `null`.
 */
export async function getPinnedRepos(
  username: string,
  options: GitHubRequestOptions = {}
): Promise<GitHubRepo[] | null> {
  // The GraphQL API has no anonymous quota, so without a token the request
  // could only ever fail. Not having a token is a configuration, not a fault,
  // and it is not warned about.
  if (!process.env.GITHUB_TOKEN?.trim()) return null;

  let login: string;
  try {
    login = requireUsername(username);
  } catch {
    return null;
  }

  try {
    const res = await githubRequest(
      `${BASE}${GRAPHQL_PATH}`,
      {
        method: 'POST',
        body: JSON.stringify({
          query: PINNED_REPOS_QUERY,
          variables: { login, first: MAX_PINNED_REPOS },
        }),
      },
      options
    );
    const body = await readJson(res);

    try {
      return parsePinnedResponse(body);
    } catch (error) {
      if (error instanceof GitHubError) throw error;
      throw new GitHubUpstreamError({ status: res.status, cause: error });
    }
  } catch (error) {
    // Warn, not error: the fallback renders a complete page, and `console.error`
    // would trip the Next.js dev error overlay for a handled degradation.
    console.warn(
      `[github] pinned repository lookup failed (${describeFailure(error)}); falling back to the starred list`
    );
    return null;
  }
}
