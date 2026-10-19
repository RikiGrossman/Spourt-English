/**
 * "Video call" practice: a spoken English conversation with an AI character.
 * Contract between the web app (src/components/call/, src/lib/call-api.ts) and the
 * server (server/src/routes/call.ts, supabase/functions/call-turn). Pure TypeScript,
 * no imports, so the Supabase Edge Function (Deno) can import it as is.
 *
 * The characters are AI and say so if asked – never real people.
 */

export type PersonaId = 'teacher' | 'friend' | 'barista' | 'interviewer';

export interface Persona {
  id: PersonaId;
  /** The character's English name, shown on the call screen. */
  name: string;
  /** Hebrew role shown on the picker, e.g. "מורה לאנגלית". */
  roleHe: string;
  /** One Hebrew sentence on the picker card. */
  descriptionHe: string;
  emoji: string;
  /** Avatar accent colour (CSS colour). */
  color: string;
  /** Whether the character corrects grammar and wording. Only the teacher does. */
  corrects: boolean;
  /** The character's first line when the call connects. */
  greeting: string;
}

export const PERSONAS: readonly Persona[] = [
  {
    id: 'teacher',
    name: 'Emma',
    roleHe: 'מורה לאנגלית',
    descriptionHe: 'שיחה סבלנית עם תיקוני דקדוק וניסוח בעדינות, כדי שתדברו נכון יותר.',
    emoji: '👩‍🏫',
    color: '#4f8cff',
    corrects: true,
    greeting: "Hi! I'm Emma, your English teacher. How are you today?",
  },
  {
    id: 'friend',
    name: 'Maya',
    roleHe: 'חברה',
    descriptionHe: 'שיחה זורמת וכיפית בלי תיקונים – רק לדבר, להבין ולהנות.',
    emoji: '😊',
    color: '#ff7aa8',
    corrects: false,
    greeting: "Hey! It's Maya! So good to see you. What's new?",
  },
  {
    id: 'barista',
    name: 'Sam',
    roleHe: 'בריסטה בבית קפה',
    descriptionHe: 'משחק תפקידים: מזמינים קפה ומאפה בבית קפה בלונדון.',
    emoji: '☕',
    color: '#c58b4e',
    corrects: false,
    greeting: 'Hi there, welcome to Sunny Café! What can I get for you today?',
  },
  {
    id: 'interviewer',
    name: 'Daniel',
    roleHe: 'מראיין עבודה',
    descriptionHe: 'מתאמנים על ראיון עבודה או התנדבות באנגלית, עם משוב קצר בסוף.',
    emoji: '💼',
    color: '#5bbf8a',
    corrects: false,
    greeting: "Hello, I'm Daniel. Thanks for coming in today. Could you tell me a little about yourself?",
  },
];

export function findPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

/** One line of the conversation. `assistant` is the AI character. */
export interface CallMessage {
  role: 'user' | 'assistant';
  text: string;
}

/** A teacher's correction of the learner's last sentence. */
export interface Correction {
  /** What the learner said (the wrong part or the whole sentence). */
  original: string;
  /** The corrected English. */
  corrected: string;
  /** A short Hebrew explanation. */
  explanationHe: string;
}

/** Limits enforced on both sides. */
export const CALL_LIMITS = {
  /** Characters in one learner message. */
  maxMessageChars: 400,
  /** Messages kept in the history sent with each turn (older ones are dropped by the client). */
  maxHistory: 20,
  /** Learner turns in one call; after that the character says goodbye. */
  maxTurns: 40,
  /** Calls a premium learner can start per local day. */
  callsPerDay: 10,
  /** Learner turns per day across all calls, so a client can't stretch one "call" forever. */
  turnsPerDay: 100,
} as const;

/**
 * Calls need a signed-in premium account. For now premium is a server-side allowlist of
 * emails (PREMIUM_EMAILS); app-store subscriptions come later (docs/subscriptions.md).
 *
 * A turn whose `history` has no learner message starts a new call and counts toward
 * `callsPerDay`. Errors: 401 `unauthorized` (not signed in), 403 `premium_required`,
 * 429 `daily_limit` (callsPerDay or turnsPerDay reached).
 */

/** GET /api/call/status (auth) – whether the learner can call, and today's usage. */
export interface CallStatusResponse {
  premium: boolean;
  callsToday: number;
  callsPerDay: number;
}

/**
 * POST /api/call/turn (auth, premium) – the learner said something; get the character's reply.
 * `history` is the conversation so far (including the greeting), oldest first, NOT including
 * `message`.
 */
export interface CallTurnRequest {
  persona: PersonaId;
  history: CallMessage[];
  message: string;
}

export interface CallTurnResponse {
  /** The character's spoken English reply (1–3 short sentences). */
  reply: string;
  /** Hebrew translation of `reply`, for the "translate" button. */
  replyHe: string;
  /** Grammar/wording corrections of `message`. Always empty unless the persona corrects. */
  corrections: Correction[];
  /**
   * Set when the learner's message was blocked or steered away (inappropriate, personal
   * details, self-harm…). `reply` is then a safe in-character redirect.
   */
  flagged?: 'inappropriate' | 'personal_info' | 'self_harm';
  /** True when the character ended the call (turn limit reached). */
  ended?: boolean;
  /** Calls started today including this one, after this turn. */
  callsToday?: number;
}
