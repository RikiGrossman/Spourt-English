/**
 * Build-time switches.
 * - VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY: accounts and the league run on Supabase
 *   (used by the static site and the Android app, which have no API server).
 * - Otherwise accounts use the Express server under /api, unless the build sets
 *   VITE_ENABLE_ACCOUNTS=false, which hides sign-in and the league.
 */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
export const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const ACCOUNTS_ENABLED = USE_SUPABASE || import.meta.env.VITE_ENABLE_ACCOUNTS !== 'false';
