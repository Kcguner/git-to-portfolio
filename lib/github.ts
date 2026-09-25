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

type UnknownRecord = Record<string, unknown>;

const BASE = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 250;
const MAX_RETRIES = 3;
const MAX_RETRY_DELAY_MS = 5_000;
const MAX_REPOS = 100;
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

function headers(): HeadersInit {
  const result: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION,
    'User-Agent': 'git-to-portfolio',
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    result.Authorization = `Bearer ${token}`;
  }
  return result;
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
  path: string,
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
    method: 'GET',
    headers: headers(),
    signal: controller.signal,
    ...(options.cache === 'no-store'
      ? { cache: 'no-store' as const }
      : { next: { revalidate: 3600 } }),
  };

  try {
    return await fetch(`${BASE}${path}`, init);
  } catch (error) {
    if (timedOut) throw new GitHubTimeoutError({ cause: error });
    throw error;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

async function githubGet(
  path: string,
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
      res = await fetchOnce(path, options, timeoutMs);
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
  };

  if (repo.name === '' || repo.full_name === '') {
    throw new TypeError(`GitHub response field ${path} contains an empty repository name`);
  }
  return repo;
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
