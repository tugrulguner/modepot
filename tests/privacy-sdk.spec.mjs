import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const sentinel = 'MODEPOT_NETWORK_PRIVATE_SENTINEL';
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const token = html.match(/posthog\.init\('([^']+)'/)[1];
const persistenceKey = `ph_${token}_posthog`;
const origin = 'https://modepot.io';
test.use({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
async function prepare(context, page, optedOut = false) {
  const events = [], requests = [];
  await context.addInitScript(({ key, token, sentinel, optedOut }) => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'userAgentData', { get: () => ({ brands: [{ brand: 'Chromium', version: '140' }, { brand: 'Google Chrome', version: '140' }], mobile: false, platform: 'macOS' }) });
    if (location.origin === 'https://modepot.io') {
      localStorage.setItem(key, JSON.stringify({ distinct_id: 'privacy-persisted-fixture', $device_id: 'privacy-device', $initial_utm_source: sentinel, $initial_referrer: `https://ref.test/a?secret=${sentinel}`, $session_entry_gclid: sentinel }));
      if (optedOut) localStorage.setItem(`__ph_opt_in_out_${token}`, '0');
    }
  }, { key: persistenceKey, token, sentinel, optedOut });
  await context.route('**/*', async route => {
    const request = route.request(), url = request.url();
    if (url.includes('posthog.com') && request.method() === 'POST') {
      const buffer = request.postDataBuffer();
      let text = buffer?.toString() ?? '';
      if (buffer?.[0] === 0x1f && buffer?.[1] === 0x8b) text = gunzipSync(buffer).toString();
      requests.push({ url, text });
      if (/\/(?:i\/v0\/)?e\//.test(url)) {
        const parsed = JSON.parse(text);
        events.push(...(Array.isArray(parsed) ? parsed : parsed.batch ?? [parsed]));
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' });
    } else if (url.startsWith(origin) && request.isNavigationRequest()) {
      await route.fulfill({ status: 200, contentType: 'text/html', body: html });
    } else if (url.startsWith(origin)) await route.fulfill({ status: 204, body: '' });
    else await route.continue();
  });
  return { events, requests };
}
test('real SDK sends clean positive pageview and keyboard CTA with persisted acquisition removed', async ({ context, page }) => {
  const captured = await prepare(context, page);
  await page.goto(`${origin}/?utm_source=${sentinel}&gclid=${sentinel}#${sentinel}`);
  await expect.poll(() => captured.events.filter(e => e.event === '$pageview').length, { timeout: 20000 }).toBe(1);
  expect(await page.evaluate(() => window.posthog.get_distinct_id())).toBe('privacy-persisted-fixture');
  const link = page.locator('[data-posthog-event="modepot_project_clicked"]').first();
  await link.evaluate((el, sentinel) => { el.href += `?secret=${sentinel}#${sentinel}`; }, sentinel);
  await page.evaluate(() => document.addEventListener('click', e => e.preventDefault()));
  await link.focus(); await page.keyboard.press('Enter');
  await expect.poll(() => captured.events.filter(e => e.event === 'modepot_project_clicked').length, { timeout: 10000 }).toBe(1);
  const view = captured.events.find(e => e.event === '$pageview');
  expect(view.properties.$current_url).toBe(`${origin}/`);
  const click = captured.events.find(e => e.event === 'modepot_project_clicked');
  expect(click.properties.destination).not.toMatch(/[?#]/);
  expect(click.properties.project).toBeTruthy();
  expect(JSON.stringify(captured.requests)).not.toContain(sentinel);
  expect(captured.requests.some(r => /\/(?:flags|decide)\//.test(r.url))).toBe(false);
  expect(await page.evaluate(() => window.posthog.config.disable_session_recording)).toBe(true);
});
test('real SDK respects persisted opt-out', async ({ context, page }) => {
  const captured = await prepare(context, page, true);
  await page.goto(origin);
  await page.waitForFunction(() => window.posthog?.__loaded);
  expect(await page.evaluate(() => window.posthog.has_opted_out_capturing())).toBe(true);
  await page.locator('[data-posthog-event]').first().evaluate(el => el.click());
  await page.waitForTimeout(3500);
  expect(captured.requests).toHaveLength(0);
});
