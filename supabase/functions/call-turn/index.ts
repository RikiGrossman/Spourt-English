/**
 * Supabase Edge Function: one turn of the AI video call, for the GitHub Pages site and the Android app
 * (which have no Express server). Same contract and logic as server/src/routes/call.ts:
 * request `CallTurnRequest`, response `CallTurnResponse`, errors `ApiError` (shared/api.ts).
 *
 * Deploy: `supabase functions deploy call-turn` and `supabase secrets set ANTHROPIC_API_KEY=...`
 * (docs/supabase.md). The shared modules import './call' without an extension; deno.json next to this
 * file maps that specifier to '../../../shared/call.ts' so Deno resolves it.
 *
 * Message content is never logged or stored.
 */
import { CALL_LIMITS, findPersona } from '../../../shared/call.ts';
import type { CallMessage, CallTurnResponse } from '../../../shared/call.ts';
import { buildSystemPrompt, parseModelOutput } from '../../../shared/call-prompts.ts';
import { checkModelReply, checkUserMessage, safeReply, sanitizeTurnRequest } from '../../../shared/call-safety.ts';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_CALL_MODEL = 'claude-haiku-5-5';
/** Room for the reply, its Hebrew translation and up to three corrections (truncated JSON is unusable). */
const MAX_TOKENS = 800;
const TIMEOUT_MS = 20_000;
const CALL_START = '(The call starts.)';
/** Requests per minute per IP, per function instance (best effort; instances are short-lived). */
const RATE_LIMIT = 30;

/**
 * Structured outputs (output_config.format): the model must answer with exactly this JSON shape, even though
 * the history it sees has plain-text assistant turns. parseModelOutput still validates and caps the fields.
 */
export const CALL_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    replyHe: { type: 'string' },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          corrected: { type: 'string' },
          explanationHe: { type: 'string' },
        },
        required: ['original', 'corrected', 'explanationHe'],
        additionalProperties: false,
      },
    },
  },
  required: ['reply', 'replyHe', 'corrections'],
  additionalProperties: false,
} as const;

const ALLOWED_ORIGINS = new Set(['https://rikigrossman.github.io', 'https://localhost']);
const DEV_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const FALLBACK = { reply: 'Sorry, could you say that again?', replyHe: 'סליחה, אפשר לחזור על זה?' };
const GOODBYE = {
  reply: "It was so nice talking with you! We're out of time for this call. Bye for now!",
  replyHe: 'היה ממש כיף לדבר איתך! נגמר לנו הזמן לשיחה הזאת. ביי בינתיים!',
};

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly hebrew: string,
  ) {
    super(code);
  }
}

const failed = () => new HttpError(502, 'call_failed', 'השיחה נתקעה לרגע, נסו לומר את זה שוב');

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (origin && (ALLOWED_ORIGINS.has(origin) || DEV_ORIGIN.test(origin))) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  let entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    if (hits.size > 10_000) hits.clear();
    entry = { count: 0, resetAt: now + 60_000 };
    hits.set(ip, entry);
  }
  return ++entry.count > RATE_LIMIT;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Starts with `user` and alternates, as the Messages API requires. */
function toAnthropicMessages(history: CallMessage[], message: string): AnthropicMessage[] {
  const all: CallMessage[] = [...history, { role: 'user', text: message }];
  const out: AnthropicMessage[] = [];
  if (all[0].role !== 'user') out.push({ role: 'user', content: CALL_START });
  for (const m of all) {
    const last = out.at(-1);
    if (last?.role === m.role) last.content += `\n${m.text}`;
    else out.push({ role: m.role, content: m.text });
  }
  return out;
}

async function callModel(apiKey: string, system: string, messages: AnthropicMessage[]): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: Deno.env.get('CALL_MODEL') || DEFAULT_CALL_MODEL,
        max_tokens: MAX_TOKENS,
        output_config: { effort: 'low', format: { type: 'json_schema', schema: CALL_OUTPUT_SCHEMA } },
        system,
        messages,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    console.warn(`[call-turn] upstream request failed: ${(err as Error)?.name ?? 'error'}`);
    throw failed();
  }
  if (!res.ok) {
    console.warn(`[call-turn] upstream status ${res.status}`);
    throw failed();
  }
  const data = (await res.json().catch(() => null)) as {
    content?: { type: string; text?: string }[];
    stop_reason?: string;
  } | null;
  if (!data || !Array.isArray(data.content)) throw failed();
  if (data.stop_reason === 'refusal') return null;
  return data.content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('');
}

async function callTurn(body: unknown): Promise<CallTurnResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new HttpError(503, 'call_unavailable', 'שיחות הווידאו לא זמינות כרגע');
  const req = sanitizeTurnRequest(body);
  const persona = req && findPersona(req.persona);
  if (!req || !persona) throw new HttpError(400, 'invalid_call', 'הבקשה לשיחה אינה תקינה');

  const rawHistory = (body as { history?: unknown }).history;
  const learnerTurns = Array.isArray(rawHistory)
    ? rawHistory.filter((m) => (m as { role?: unknown })?.role === 'user').length
    : 0;
  if (learnerTurns >= CALL_LIMITS.maxTurns) return { ...GOODBYE, corrections: [], ended: true };

  const check = checkUserMessage(req.message);
  if (check.flagged) return { ...safeReply(check.flagged, persona), corrections: [], flagged: check.flagged };

  const raw = await callModel(apiKey, buildSystemPrompt(persona), toAnthropicMessages(req.history, req.message));
  if (raw === null) return { ...safeReply('inappropriate', persona), corrections: [] };
  const parsed = parseModelOutput(raw, persona);
  if (!parsed) return { ...FALLBACK, corrections: [] };
  if (!checkModelReply(parsed.reply)) return { ...safeReply('inappropriate', persona), corrections: [] };
  return { reply: parsed.reply, replyHe: parsed.replyHe, corrections: persona.corrects ? parsed.corrections : [] };
}

Deno.serve(async (request) => {
  const cors = corsHeaders(request.headers.get('origin'));
  const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, ...extra, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed', message: 'הבקשה אינה תקינה' });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return json(
      429,
      { error: 'rate_limited', message: 'יותר מדי ניסיונות, נסו שוב בעוד כמה דקות' },
      { 'Retry-After': '60' },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'invalid_json', message: 'הבקשה אינה תקינה' });
  }

  try {
    return json(200, await callTurn(body));
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.code, message: err.hebrew });
    console.error('[call-turn] unexpected error');
    return json(500, { error: 'internal', message: 'אירעה שגיאה בשרת, נסו שוב מאוחר יותר' });
  }
});
