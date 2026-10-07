import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const projects = {
  dexpot: ['https://dexpot.modepot.io/playground/', 'https://dexpot.modepot.io/quick-start/'],
  intpot: ['https://intpot.modepot.io/playground/', 'https://intpot.modepot.io/quickstart/'],
  summonpot: ['https://summonpot.modepot.io/playground/', 'https://summonpot.modepot.io/quick-start/'],
  lifepot: ['https://lifepot.modepot.io/', 'https://github.com/tugrulguner/lifepot/blob/main/docs/simulation-contract.md'],
};
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const tracker = `const captureOutboundEvent = (event) => {
  if (event.type === 'auxclick' && event.button !== 1) return;
  if (event.type === 'click' && event.button !== 0) return;
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest('[data-posthog-event]');
  if (!link || !window.posthog) return;
  const properties = { surface: link.dataset.posthogSurface, destination: link.href };
  if (link.dataset.posthogProject) properties.project = link.dataset.posthogProject;
  if (link.dataset.posthogPlatform) properties.platform = link.dataset.posthogPlatform;
  window.posthog.capture(link.dataset.posthogEvent, properties, { transport: 'sendBeacon', send_instantly: true });
};
document.addEventListener('click', captureOutboundEvent);
document.addEventListener('auxclick', captureOutboundEvent);`;

test('seven playground and docs project links have explicit events and autocapture exclusions', async ({ page }) => {
  await page.setContent(html);
  await expect(page.locator('.product-actions > .product-link[data-posthog-project]')).toHaveCount(4);
  await expect(page.locator('a[data-posthog-event="modepot_project_clicked"]')).toHaveCount(12);
  await expect(page.locator('.demo-route')).toHaveCount(4);
  for (const [project, [playground, docs]] of Object.entries(projects)) {
    const play = page.locator(`.demo-route[href="${playground}"]`);
    await expect(play).toHaveClass(/ph-no-autocapture/);
    await expect(play).toHaveAttribute('data-posthog-event', 'modepot_project_clicked');
    await expect(play).toHaveAttribute('data-posthog-project', project);
    await expect(play).toHaveAttribute('data-posthog-surface', 'modepot_homepage');
    const doc = page.locator(`.product-actions > .product-resource[href="${docs}"]`);
    await expect(doc).toHaveClass(/ph-no-autocapture/);
    await expect(doc).toHaveAttribute('data-posthog-event', 'modepot_project_clicked');
    await expect(doc).toHaveAttribute('data-posthog-project', project);
    await expect(doc).toHaveAttribute('data-posthog-surface', 'modepot_homepage');
  }
  await expect(page.locator('.demo-route:has-text("Explore LifePot and choose a preset")')).toHaveCount(1);
});

test('primary, keyboard, and middle activation capture once; right click is excluded; navigation and beacon options remain', async ({ page }) => {
  await page.setContent(html);
  await page.evaluate((source) => {
    for (const script of document.querySelectorAll('script')) script.remove();
    window.__captures = [];
    window.posthog = { capture: (...args) => window.__captures.push(args) };
    const handler = document.createElement('script');
    handler.textContent = source;
    document.body.append(handler);
    window.__analyticsLink = document.querySelector('.demo-route[data-posthog-project="dexpot"]');
    window.__analyticsLink.href = 'https://dexpot.modepot.io/playground/';
    window.__analyticsLink.addEventListener('click', (event) => event.preventDefault());
    window.__analyticsLink.addEventListener('auxclick', (event) => event.preventDefault());
  }, tracker);
  const link = page.locator('.demo-route[data-posthog-project="dexpot"]');
  await link.click();
  expect(await page.evaluate(() => window.__captures.length)).toBe(1);
  expect(await link.getAttribute('href')).toBe('https://dexpot.modepot.io/playground/');
  await page.evaluate(() => {
    window.__analyticsLink.focus();
    window.__analyticsLink.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    window.__analyticsLink.click();
  });
  expect(await page.evaluate(() => window.__captures.length)).toBe(2);
  await link.dispatchEvent('auxclick', { button: 1, bubbles: true });
  expect(await page.evaluate(() => window.__captures.length)).toBe(3);
  await link.dispatchEvent('auxclick', { button: 2, bubbles: true });
  expect(await page.evaluate(() => window.__captures.length)).toBe(3);
  const captures = await page.evaluate(() => window.__captures);
  expect(captures.map(([name]) => name)).toEqual(Array(3).fill('modepot_project_clicked'));
  expect(captures.every(([, properties, options]) => properties.project === 'dexpot' && properties.surface === 'modepot_homepage' && properties.destination === 'https://dexpot.modepot.io/playground/' && options.transport === 'sendBeacon' && options.send_instantly)).toBe(true);
});
