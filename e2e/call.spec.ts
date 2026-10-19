import { expect, test, type Page } from '@playwright/test';
import type { CallTurnRequest, CallTurnResponse } from '../shared/call';
import { openFresh } from './helpers';

/**
 * AI video call: the turn endpoint is mocked, and the learner types (recordSpeech() hides speech
 * recognition, so the keyboard fallback is shown).
 */

async function mockTurn(page: Page, respond: (req: CallTurnRequest) => CallTurnResponse) {
  const requests: CallTurnRequest[] = [];
  await page.route('**/api/call/turn', async (route) => {
    const req = route.request().postDataJSON() as CallTurnRequest;
    requests.push(req);
    await route.fulfill({ json: respond(req) });
  });
  return requests;
}

async function callPersona(page: Page, name: string) {
  await page.locator('.bottom-nav').getByRole('button', { name: 'שיחה' }).click();
  await expect(page.getByText('הדמויות הן בינה מלאכותית, לא אנשים אמיתיים.')).toBeVisible();
  await page
    .locator('.persona-card', { hasText: name })
    .getByRole('button', { name: /התקשרו/ })
    .click();
  await expect(page.locator('.call-screen')).toBeVisible();
  // The character picks up after the ring.
  await expect(page.locator('.call-timer')).toHaveText(/\d\d:\d\d/);
}

async function say(page: Page, text: string) {
  const input = page.getByRole('textbox', { name: 'כתבו באנגלית' });
  await expect(input).toBeEnabled();
  await input.fill(text);
  await page.getByRole('button', { name: 'שליחה' }).click();
}

test('the teacher replies and corrects; hanging up shows the summary', async ({ page }) => {
  await openFresh(page);
  const requests = await mockTurn(page, (req) => ({
    reply: 'Oh nice, you went to the beach! Did you swim?',
    replyHe: 'איזה כיף, הלכת לים! שחית?',
    corrections: [
      { original: req.message, corrected: 'I went to the beach yesterday', explanationHe: 'בעבר אומרים went.' },
    ],
  }));
  await callPersona(page, 'Emma');
  await expect(page.locator('.caption.them')).toContainText("I'm Emma");

  await say(page, 'I go to the beach yesterday');
  await expect(page.locator('.caption.them')).toContainText('Did you swim?');
  const correction = page.locator('.caption-corrections');
  await expect(correction.locator('del')).toHaveText('I go to the beach yesterday');
  await expect(correction.locator('ins')).toHaveText('I went to the beach yesterday');
  await expect(correction).toContainText('בעבר אומרים went.');

  expect(requests[0]).toMatchObject({ persona: 'teacher', message: 'I go to the beach yesterday' });
  expect(requests[0].history).toEqual([
    { role: 'assistant', text: "Hi! I'm Emma, your English teacher. How are you today?" },
  ]);

  await page.getByRole('button', { name: 'תרגום' }).click();
  await expect(page.locator('.caption-he')).toHaveText('איזה כיף, הלכת לים! שחית?');

  await page.getByRole('button', { name: 'ניתוק השיחה' }).click();
  const summary = page.locator('.call-summary');
  await expect(summary.getByRole('heading', { level: 1 })).toContainText('Emma');
  await expect(summary.locator('.call-stat').nth(1)).toContainText('1');
  await expect(summary.getByRole('heading', { name: /מה למדנו/ })).toBeVisible();
  await expect(summary.locator('.call-learned ins')).toHaveText('I went to the beach yesterday');

  await summary.getByRole('button', { name: 'שיחה חדשה' }).click();
  await expect(page.locator('.persona-grid')).toBeVisible();
});

test('the friend never shows corrections', async ({ page }) => {
  await openFresh(page);
  await mockTurn(page, (req) => ({
    reply: 'Haha, cool! Tell me more.',
    replyHe: 'חחח, מגניב! ספרי עוד.',
    // Even if the server sent some, the friend must not show them.
    corrections: [{ original: req.message, corrected: 'I went', explanationHe: 'x' }],
  }));
  await callPersona(page, 'Maya');
  await say(page, 'I go to party');
  await expect(page.locator('.caption.them')).toContainText('Tell me more.');
  await expect(page.locator('.caption.you')).toContainText('I go to party');
  await expect(page.locator('.caption-corrections')).toHaveCount(0);

  await page.getByRole('button', { name: 'ניתוק השיחה' }).click();
  await expect(page.locator('.call-summary')).toBeVisible();
  await expect(page.locator('.call-learned')).toHaveCount(0);
  await page.getByRole('button', { name: 'חזרה' }).click();
  await expect(page.locator('.path')).toBeVisible();
});

test('a failed turn shows a Hebrew error and retries', async ({ page }) => {
  await openFresh(page);
  let calls = 0;
  await page.route('**/api/call/turn', async (route) => {
    calls++;
    if (calls === 1)
      await route.fulfill({ status: 503, json: { error: 'unavailable', message: 'השיחות לא זמינות כרגע.' } });
    else await route.fulfill({ json: { reply: 'One latte, coming up!', replyHe: 'לאטה אחד, מגיע!', corrections: [] } });
  });
  await callPersona(page, 'Sam');
  await say(page, 'A latte please');
  await expect(page.getByRole('alert')).toContainText('השיחות לא זמינות כרגע.');
  await page.getByRole('button', { name: 'נסו שוב' }).click();
  await expect(page.locator('.caption.them')).toContainText('One latte, coming up!');
});
