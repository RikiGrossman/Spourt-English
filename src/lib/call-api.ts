import type { ApiError } from '../../shared/api';
import type { CallTurnRequest, CallTurnResponse, Correction } from '../../shared/call';
import { loadAuth } from './api';
import { ApiRequestError } from './api-error';
import { ACCOUNTS_ENABLED, SUPABASE_ANON_KEY, SUPABASE_URL, USE_SUPABASE } from './config';

/**
 * Client for the AI call turn (shared/call.ts): POST /api/call/turn on the Express server, or
 * the `call-turn` Edge Function in Supabase builds.
 */

/** Calls need a backend: the Express server or Supabase. A static build without either has none. */
export const CALLS_ENABLED = USE_SUPABASE || ACCOUNTS_ENABLED;

/** The model can take a while to answer. */
const TIMEOUT_MS = 25_000;

export const CALL_OFFLINE_MESSAGE = 'אין חיבור לשרת כרגע. בדקו את החיבור לאינטרנט ונסו שוב.';
export const CALL_TIMEOUT_MESSAGE = 'התשובה מתעכבת. נסו שוב בעוד רגע.';
const GENERIC_MESSAGE = 'משהו השתבש בשיחה. נסו שוב בעוד רגע.';

function isApiError(body: unknown): body is ApiError {
  return typeof body === 'object' && body !== null && typeof (body as ApiError).message === 'string';
}

function isCorrection(c: unknown): c is Correction {
  const x = c as Correction;
  return (
    typeof x === 'object' &&
    x !== null &&
    typeof x.original === 'string' &&
    typeof x.corrected === 'string' &&
    typeof x.explanationHe === 'string'
  );
}

/** Checks the response shape, filling in optional parts; null when it is not a turn response. */
export function parseTurnResponse(data: unknown): CallTurnResponse | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Partial<CallTurnResponse>;
  if (typeof d.reply !== 'string' || !d.reply.trim()) return null;
  const res: CallTurnResponse = {
    reply: d.reply,
    replyHe: typeof d.replyHe === 'string' ? d.replyHe : '',
    corrections: Array.isArray(d.corrections) ? d.corrections.filter(isCorrection) : [],
  };
  if (d.flagged === 'inappropriate' || d.flagged === 'personal_info' || d.flagged === 'self_harm') {
    res.flagged = d.flagged;
  }
  if (d.ended === true) res.ended = true;
  return res;
}

function endpoint(): { url: string; headers: Record<string, string> } {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (USE_SUPABASE) {
    headers.apikey = SUPABASE_ANON_KEY;
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    return { url: `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/call-turn`, headers };
  }
  // Auth is optional; a signed-in learner's token lets the server rate-limit per account.
  const token = loadAuth()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return { url: '/api/call/turn', headers };
}

/** Sends what the learner said and returns the character's reply. Throws ApiRequestError (Hebrew message). */
export async function sendTurn(req: CallTurnRequest, signal?: AbortSignal): Promise<CallTurnResponse> {
  const { url, headers } = endpoint();
  const timeout =
    typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(TIMEOUT_MS) : undefined;
  const signals = [timeout, signal].filter((s): s is AbortSignal => s !== undefined);
  const combined = signals.length > 1 && 'any' in AbortSignal ? AbortSignal.any(signals) : signals[0];

  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(req), signal: combined });
  } catch (e) {
    if (signal?.aborted) throw new ApiRequestError(0, 'aborted', GENERIC_MESSAGE);
    const timedOut = timeout?.aborted || (e instanceof Error && e.name === 'TimeoutError');
    throw timedOut
      ? new ApiRequestError(0, 'timeout', CALL_TIMEOUT_MESSAGE)
      : new ApiRequestError(0, 'network', CALL_OFFLINE_MESSAGE);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Not JSON – e.g. the dev proxy's error page when no server is running.
  }

  if (!res.ok) {
    if (isApiError(data)) throw new ApiRequestError(res.status, data.error, data.message);
    const unreachable = res.status >= 500 || res.status === 404;
    throw new ApiRequestError(
      unreachable ? 0 : res.status,
      'http',
      unreachable ? CALL_OFFLINE_MESSAGE : GENERIC_MESSAGE,
    );
  }
  const parsed = parseTurnResponse(data);
  if (!parsed) throw new ApiRequestError(0, 'bad-response', GENERIC_MESSAGE);
  return parsed;
}
