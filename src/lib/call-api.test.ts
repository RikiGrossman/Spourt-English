import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CallTurnRequest } from '../../shared/call';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const req: CallTurnRequest = {
  persona: 'teacher',
  history: [{ role: 'assistant', text: 'Hi!' }],
  message: 'I go yesterday',
};
const ok = {
  reply: 'Oh, you went yesterday? Where?',
  replyHe: 'אה, הלכת אתמול? לאן?',
  corrections: [{ original: 'I go yesterday', corrected: 'I went yesterday', explanationHe: 'עבר' }],
};

async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import('./call-api');
}

describe('sendTurn', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('POSTs the turn to the Express API', async () => {
    const { sendTurn, CALLS_ENABLED } = await load({ VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' });
    expect(CALLS_ENABLED).toBe(true);
    fetchMock.mockResolvedValue(json(200, ok));
    await expect(sendTurn(req)).resolves.toEqual(ok);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/call/turn');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(req);
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('sends the learner’s token when signed in', async () => {
    vi.stubGlobal(
      'localStorage',
      memoryStorage({ 'spourt-english:auth:v1': JSON.stringify({ token: 'tok', user: { id: '1' } }) }),
    );
    const { sendTurn } = await load({ VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' });
    fetchMock.mockResolvedValue(json(200, ok));
    await sendTurn(req);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('calls the Supabase Edge Function in Supabase builds', async () => {
    const { sendTurn, CALLS_ENABLED } = await load({
      VITE_SUPABASE_URL: 'https://x.supabase.co/',
      VITE_SUPABASE_ANON_KEY: 'anon',
    });
    expect(CALLS_ENABLED).toBe(true);
    fetchMock.mockResolvedValue(json(200, ok));
    await sendTurn(req);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://x.supabase.co/functions/v1/call-turn');
    expect(init.headers.apikey).toBe('anon');
    expect(init.headers.Authorization).toBe('Bearer anon');
  });

  it('is disabled in a static build without a backend', async () => {
    const { CALLS_ENABLED } = await load({
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_ENABLE_ACCOUNTS: 'false',
    });
    expect(CALLS_ENABLED).toBe(false);
  });

  it('fills in optional fields and drops malformed corrections', async () => {
    const { sendTurn } = await load();
    fetchMock.mockResolvedValue(json(200, { reply: 'Hi', corrections: [{ original: 1 }], ended: true }));
    await expect(sendTurn(req)).resolves.toEqual({ reply: 'Hi', replyHe: '', corrections: [], ended: true });
  });

  it('throws the server’s Hebrew message', async () => {
    const { sendTurn } = await load();
    fetchMock.mockResolvedValue(json(429, { error: 'rate_limited', message: 'יותר מדי הודעות' }));
    await expect(sendTurn(req)).rejects.toMatchObject({
      status: 429,
      code: 'rate_limited',
      message: 'יותר מדי הודעות',
    });
  });

  it('treats network failures and gateway errors as offline', async () => {
    const { sendTurn, CALL_OFFLINE_MESSAGE } = await load();
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(sendTurn(req)).rejects.toMatchObject({ offline: true, message: CALL_OFFLINE_MESSAGE });
    fetchMock.mockResolvedValueOnce(new Response('<html>bad gateway</html>', { status: 502 }));
    await expect(sendTurn(req)).rejects.toMatchObject({ offline: true });
  });

  it('reports a timeout in Hebrew', async () => {
    const { sendTurn, CALL_TIMEOUT_MESSAGE } = await load();
    fetchMock.mockRejectedValueOnce(Object.assign(new Error('timed out'), { name: 'TimeoutError' }));
    await expect(sendTurn(req)).rejects.toMatchObject({ code: 'timeout', message: CALL_TIMEOUT_MESSAGE });
  });

  it('rejects a response without a reply', async () => {
    const { sendTurn } = await load();
    fetchMock.mockResolvedValue(json(200, { replyHe: 'x' }));
    await expect(sendTurn(req)).rejects.toMatchObject({ code: 'bad-response' });
  });
});
