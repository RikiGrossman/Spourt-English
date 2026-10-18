/**
 * Build-time switches. A static deploy with no API server (e.g. GitHub Pages)
 * builds with VITE_ENABLE_ACCOUNTS=false, which hides sign-in and the league.
 */
export const ACCOUNTS_ENABLED = import.meta.env.VITE_ENABLE_ACCOUNTS !== 'false';
