import type {
  ApiError,
  AuthResponse,
  CompleteLessonRequest,
  HealthResponse,
  LeaderboardResponse,
  LoginRequest,
  MeResponse,
  Progress,
  ProgressResponse,
  RegisterRequest,
  User,
} from '../../shared/api';

/** Typed client for the HTTP contract in shared/api.ts. All URLs are relative (`/api/...`). */

const AUTH_KEY = 'spourt-english:auth:v1';
const TIMEOUT_MS = 10_000;

export const OFFLINE_MESSAGE = 'אין חיבור לשרת כרגע. אפשר להמשיך ללמוד – נסנכרן אחר כך.';
const GENERIC_MESSAGE = 'משהו השתבש. נסו שוב בעוד רגע.';

/** Error thrown for every failed request. `message` is Hebrew and safe to show as-is. */
export class ApiRequestError extends Error {
  /** HTTP status, or 0 when the server could not be reached. */
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }

  get offline() {
    return this.status === 0;
  }

  get unauthorized() {
    return this.status === 401;
  }
}

export interface StoredAuth {
  token: string;
  user: User;
}

export function loadAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    return parsed && typeof parsed.token === 'string' && parsed.user ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch {
    // Storage unavailable – the session lasts until reload.
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // Ignore.
  }
}

function isApiError(body: unknown): body is ApiError {
  return typeof body === 'object' && body !== null && typeof (body as ApiError).message === 'string';
}

async function request<T>(method: string, path: string, body?: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = loadAuth()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (auth) throw new ApiRequestError(401, 'unauthorized', 'צריך להתחבר כדי לעשות את זה.');

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal:
        typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(TIMEOUT_MS) : undefined,
    });
  } catch {
    throw new ApiRequestError(0, 'network', OFFLINE_MESSAGE);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Not JSON – e.g. the dev proxy's error page when no server is running.
  }

  if (!res.ok) {
    if (isApiError(data)) throw new ApiRequestError(res.status, data.error, data.message);
    // A proxy/gateway failure without our JSON body means the API is unreachable.
    const unreachable = res.status >= 500 || res.status === 404;
    throw new ApiRequestError(unreachable ? 0 : res.status, 'http', unreachable ? OFFLINE_MESSAGE : GENERIC_MESSAGE);
  }
  if (data === null) throw new ApiRequestError(0, 'bad-response', OFFLINE_MESSAGE);
  return data as T;
}

export const api = {
  health: () => request<HealthResponse>('GET', '/health'),
  register: (req: RegisterRequest) => request<AuthResponse>('POST', '/auth/register', req),
  login: (req: LoginRequest) => request<AuthResponse>('POST', '/auth/login', req),
  me: () => request<MeResponse>('GET', '/me', undefined, true),
  getProgress: () => request<ProgressResponse>('GET', '/progress', undefined, true),
  putProgress: (progress: Progress) => request<ProgressResponse>('PUT', '/progress', progress, true),
  completeLesson: (lessonId: string, req: CompleteLessonRequest) =>
    request<ProgressResponse>('POST', `/lessons/${encodeURIComponent(lessonId)}/complete`, req, true),
  /** Works signed out too; with a token the server marks the learner's own row (`isMe`). */
  leaderboard: () => request<LeaderboardResponse>('GET', '/leaderboard'),
};

/** Hebrew message for any thrown value. */
export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : GENERIC_MESSAGE;
}
