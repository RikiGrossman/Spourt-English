/**
 * Premium access for the AI video call (shared/call.ts). For now premium is a server-side
 * allowlist of emails in the PREMIUM_EMAILS environment variable – never hardcode an email here.
 * Pure TypeScript, no imports, so the Supabase Edge Function (Deno) can import it as is.
 */

/** PREMIUM_EMAILS (comma-separated) → a set of trimmed, lowercased emails. Empty entries are ignored. */
export function parsePremiumEmails(raw?: string): Set<string> {
  const set = new Set<string>();
  for (const part of (raw ?? '').split(',')) {
    const email = part.trim().toLowerCase();
    if (email) set.add(email);
  }
  return set;
}

/** Whether the account's email is on the allowlist (case-insensitive). */
export function isPremium(email: string | null | undefined, premium: Set<string>): boolean {
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return normalized !== '' && premium.has(normalized);
}

/**
 * A turn whose history has no learner message starts a new call (counts toward
 * CALL_LIMITS.callsPerDay). Anything that isn't an array counts as an empty history.
 */
export function isNewCall(history: unknown): boolean {
  if (!Array.isArray(history)) return true;
  return !history.some((m) => (m as { role?: unknown } | null)?.role === 'user');
}

/**
 * The day usage is counted on, as YYYY-MM-DD. With `timeZone` (e.g. 'Asia/Jerusalem') the date in
 * that zone; without it the process's local date (the Express server sets TZ=Asia/Jerusalem).
 */
export function usageDay(now: number = Date.now(), timeZone?: string): string {
  const d = new Date(now);
  if (timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
