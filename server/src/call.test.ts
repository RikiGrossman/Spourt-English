import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CALL_LIMITS, PERSONAS, type CallMessage, type CallTurnRequest } from '../../shared/call';
import { createApp, type AppOptions } from './app';
import { openDb } from './db';
import { CALL_OUTPUT_SCHEMA, CALL_START } from './routes/call';

interface SentRequest {
  url: string;
  headers: Record<string, string>;
  body: {
    model: string;
    max_tokens: number;
    system: string;
    output_config: { effort?: string; format?: { type: string; schema: unknown } };
    messages: { role: string; content: string }[];
  };
}

let sent: SentRequest[];
let app: ReturnType<typeof createApp>;

/** A fetch that records the request and answers like the Messages API with `text`. */
function fakeFetch(text: string | (() => Response | Promise<Response>)) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    sent.push({
      url: String(url),
      headers: init?.headers as Record<string, string>,
      body: JSON.parse(String(init?.body)),
    });
    if (typeof text === 'function') return text();
    return new Response(
      JSON.stringify({ content: [{ type: 'text', text }], stop_reason: 'end_turn', role: 'assistant' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as unknown as typeof fetch;
}

function setup(fetchImpl: typeof fetch, options: AppOptions = {}) {
  app = createApp(openDb(':memory:'), {
    secret: 'test-secret',
    staticDir: false,
    anthropic: { apiKey: 'test-key', model: 'test-model', fetch: fetchImpl },
    ...options,
  });
}

const modelJson = (reply: string, corrections: unknown[] = []) =>
  JSON.stringify({ reply, replyHe: 'תרגום', corrections });

const greeting = (persona: CallTurnRequest['persona']): CallMessage => ({
  role: 'assistant',
  text: PERSONAS.find((p) => p.id === persona)!.greeting,
});

const turn = (body: unknown) =>
  request(app)
    .post('/api/call/turn')
    .send(body as object);

const correction = { original: 'I goed to school', corrected: 'I went to school', explanationHe: 'went הוא עבר של go' };

beforeEach(() => {
  sent = [];
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('POST /api/call/turn', () => {
  it('returns the teacher reply with corrections', async () => {
    setup(fakeFetch(modelJson('Oh, you went to school! What did you learn?', [correction])));
    const res = await turn({ persona: 'teacher', history: [greeting('teacher')], message: 'I goed to school' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      reply: 'Oh, you went to school! What did you learn?',
      replyHe: 'תרגום',
      corrections: [correction],
    });
    expect(res.headers['cache-control']).toBe('no-store');

    expect(sent).toHaveLength(1);
    const [req] = sent;
    expect(req.url).toBe('https://api.anthropic.com/v1/messages');
    expect(req.headers['x-api-key']).toBe('test-key');
    expect(req.headers['anthropic-version']).toBe('2023-06-01');
    expect(req.body.model).toBe('test-model');
    expect(req.body.max_tokens).toBeGreaterThan(0);
    expect(req.body.system).toContain('Emma');
    expect(req.body.output_config.format).toEqual({ type: 'json_schema', schema: CALL_OUTPUT_SCHEMA });
    expect(CALL_OUTPUT_SCHEMA.required).toEqual(['reply', 'replyHe', 'corrections']);
  });

  it('strips corrections for characters that do not correct', async () => {
    setup(fakeFetch(modelJson('Cool! What did you do there?', [correction])));
    const res = await turn({ persona: 'friend', history: [greeting('friend')], message: 'I goed to school' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Cool! What did you do there?');
    expect(res.body.corrections).toEqual([]);
  });

  it('sends messages that start with user and alternate', async () => {
    setup(fakeFetch(modelJson('Nice!')));
    const history: CallMessage[] = [
      greeting('barista'),
      { role: 'user', text: 'Hi' },
      { role: 'user', text: 'A latte please' },
      { role: 'assistant', text: 'Small or large?' },
    ];
    const res = await turn({ persona: 'barista', history, message: 'Large' });
    expect(res.status).toBe(200);
    const roles = sent[0].body.messages.map((m) => m.role);
    expect(roles[0]).toBe('user');
    expect(roles.at(-1)).toBe('user');
    roles.forEach((role, i) => i > 0 && expect(role).not.toBe(roles[i - 1]));
    expect(sent[0].body.messages[0].content).toBe(CALL_START);
    expect(sent[0].body.messages.at(-1)!.content).toBe('Large');
    expect(sent[0].body.messages.map((m) => m.content).join('\n')).toContain('Hi\nA latte please');
  });

  it('does not call the model for a flagged message', async () => {
    const fetchImpl = fakeFetch(modelJson('should not be used'));
    setup(fetchImpl);
    const res = await turn({
      persona: 'friend',
      history: [greeting('friend')],
      message: 'My phone number is 052-123-4567',
    });
    expect(res.status).toBe(200);
    expect(res.body.flagged).toEqual(expect.any(String));
    expect(res.body.reply).toEqual(expect.any(String));
    expect(res.body.corrections).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('says goodbye without calling the model after the turn limit', async () => {
    const fetchImpl = fakeFetch(modelJson('should not be used'));
    setup(fetchImpl);
    const history: CallMessage[] = [greeting('teacher')];
    for (let i = 0; i < CALL_LIMITS.maxTurns; i++) {
      history.push({ role: 'user', text: `Sentence ${i}` }, { role: 'assistant', text: 'Nice!' });
    }
    const res = await turn({ persona: 'teacher', history, message: 'One more' });
    expect(res.status).toBe(200);
    expect(res.body.ended).toBe(true);
    expect(res.body.reply).toEqual(expect.any(String));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('replaces an unsafe model reply with a safe one', async () => {
    setup(fakeFetch(modelJson("Cool! What's your phone number?")));
    const res = await turn({ persona: 'friend', history: [greeting('friend')], message: 'I like music' });
    expect(res.status).toBe(200);
    expect(res.body.reply).not.toMatch(/phone number\?/);
    expect(res.body.corrections).toEqual([]);
  });

  it('falls back to a generic reply when the model output is not JSON', async () => {
    setup(fakeFetch('not json at all'));
    const res = await turn({ persona: 'teacher', history: [greeting('teacher')], message: 'Hello' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toMatch(/again/i);
    expect(res.body.corrections).toEqual([]);
  });

  it('answers 503 when no API key is configured', async () => {
    const fetchImpl = fakeFetch(modelJson('x'));
    setup(fetchImpl, { anthropic: { apiKey: '', fetch: fetchImpl } });
    const res = await turn({ persona: 'teacher', history: [greeting('teacher')], message: 'Hello' });
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'call_unavailable', message: 'שיחות הווידאו לא זמינות כרגע' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    ['an error status', () => new Response('{"type":"error"}', { status: 529 })],
    [
      'a network error',
      () => {
        throw new TypeError('fetch failed');
      },
    ],
  ])('answers 502 on %s from Anthropic', async (_name, respond) => {
    setup(fakeFetch(respond));
    const res = await turn({ persona: 'teacher', history: [greeting('teacher')], message: 'Hello' });
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('call_failed');
    expect(res.body.message).toMatch(/[֐-׿]/);
  });

  it.each([
    [{}],
    [{ persona: 'pirate', history: [], message: 'Hello' }],
    [{ persona: 'teacher', history: [], message: '' }],
    [{ persona: 'teacher', history: [], message: 'x'.repeat(CALL_LIMITS.maxMessageChars + 1) }],
    [{ persona: 'teacher', history: [], message: 42 }],
    [[{ persona: 'teacher', history: [], message: 'Hello' }]],
  ])('rejects an invalid body %#', async (body) => {
    const fetchImpl = fakeFetch(modelJson('x'));
    setup(fetchImpl);
    const res = await turn(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_call');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rate limits per IP', async () => {
    setup(fakeFetch(modelJson('Hi!')), { callRateLimit: { max: 2, windowMs: 60_000 } });
    const body = { persona: 'friend', history: [greeting('friend')], message: 'Hello' };
    expect((await turn(body)).status).toBe(200);
    expect((await turn(body)).status).toBe(200);
    expect((await turn(body)).status).toBe(429);
  });
});
