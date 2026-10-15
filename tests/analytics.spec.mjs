import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
// Execute the actual built listener, not a handwritten copy of its implementation.
const tracker = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  .map(([, source]) => source).find(source => source.includes('const captureOutboundEvent'));
if (!tracker) throw new Error('Built conversion listener is missing');
const isolatedHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
const projects = {
  dexpot: ['https://dexpot.modepot.io/playground/', 'https://dexpot.modepot.io/quick-start/'],
  intpot: ['https://intpot.modepot.io/playground/', 'https://intpot.modepot.io/quickstart/'],
  summonpot: ['https://summonpot.modepot.io/playground/', 'https://summonpot.modepot.io/quick-start/'],
  lifepot: ['https://lifepot.modepot.io/learn', 'https://github.com/tugrulguner/lifepot/blob/main/docs/simulation-contract.md'],
  utilitypot: ['https://utilitypot.modepot.io/', 'https://github.com/tugrulguner/utilitypot/blob/main/README.md'],
  refpot: ['https://refpot.modepot.io/', 'https://refpot.modepot.io/package/'],
};

test('project-entry links are tracked; GitHub documentation remains excluded', async ({ page }) => {
  await page.setContent(isolatedHtml);
  const expectedCount = Object.keys(projects).length * 2 + 2;
  await expect(page.locator('a[data-posthog-event="modepot_project_clicked"]')).toHaveCount(expectedCount);
  for (const [project, [playground, docs]] of Object.entries(projects)) {
    if (!['refpot', 'utilitypot'].includes(project)) {
      const play = page.locator(`.demo-route[href="${project === 'lifepot' ? 'https://lifepot.modepot.io/play' : playground}"]`);
      await expect(play).toHaveClass(/ph-no-autocapture/);
      await expect(play).toHaveAttribute('data-posthog-event', 'modepot_project_clicked');
      await expect(play).toHaveAttribute('data-posthog-project', project);
      await expect(play).toHaveAttribute('data-posthog-surface', 'modepot_homepage');
    }
    const doc = page.locator(`.product-actions > .product-resource[href="${docs}"]`);
    await expect(doc).toHaveClass(/ph-no-autocapture/);
    if (['lifepot', 'utilitypot'].includes(project)) {
      expect(await doc.getAttribute('data-posthog-event')).toBeNull();
    } else {
      await expect(doc).toHaveAttribute('data-posthog-event', 'modepot_project_clicked');
      await expect(doc).toHaveAttribute('data-posthog-project', project);
      await expect(doc).toHaveAttribute('data-posthog-surface', 'modepot_homepage');
    }
  }
});

test('built handler captures every project link once per activation and preserves navigation', async ({ page }) => {
  await page.setContent(isolatedHtml);
  const expectedCount = Object.keys(projects).length * 2 + 2;
  await page.evaluate(() => {
    window.__captures = [];
    window.posthog = { capture: (...args) => window.__captures.push(args) };
  });
  await page.addScriptTag({ content: tracker });
  // Observe production's navigation decision before a test-only later listener prevents leaving the fixture.
  await page.evaluate(() => {
    window.__preventedByProduction = [];
    for (const type of ['click', 'auxclick']) document.addEventListener(type, event => {
      window.__preventedByProduction.push(event.defaultPrevented);
      event.preventDefault();
    });
  });
  const checks = await page.evaluate(() => {
    const links = [...document.querySelectorAll('[data-posthog-event="modepot_project_clicked"]')];
    return links.map(link => {
      window.__captures.length = 0;
      window.__preventedByProduction.length = 0;
      /** @type {Record<string, string>} */
      const expected = { surface: link.dataset.posthogSurface, destination: link.href, project: link.dataset.posthogProject };
      if (link.dataset.posthogDestinationType) expected.destination_type = link.dataset.posthogDestinationType;
      const href = link.href;
      // Cancelable synthetic events allow checking the production handler does not prevent navigation.
      link.dispatchEvent(new MouseEvent('click', { button: 0, bubbles: true, cancelable: true }));
      link.dispatchEvent(new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }));
      link.dispatchEvent(new MouseEvent('auxclick', { button: 2, bubbles: true }));
      return { expected, captures: [...window.__captures], primary: !window.__preventedByProduction[0], middle: !window.__preventedByProduction[1], unchanged: href === link.href };
    });
  });
  expect(checks).toHaveLength(expectedCount);
  for (const result of checks) {
    expect(result.primary && result.middle && result.unchanged).toBe(true);
    expect(result.captures).toEqual(Array(2).fill(['modepot_project_clicked', result.expected, { transport: 'sendBeacon', send_instantly: true }]));
  }
  await page.evaluate(() => {
    window.__captures.length = 0;
    document.querySelector('.demo-route').addEventListener('click', event => event.preventDefault());
  });
  await page.locator('.demo-route').first().focus();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__captures.length)).toBe(1);
});

test('creator social links emit the bounded social event contract', async ({ page }) => {
  await page.setContent(isolatedHtml);
  await page.evaluate(() => {
    window.__captures = [];
    window.posthog = { capture: (...args) => window.__captures.push(args) };
  });
  await page.addScriptTag({ content: tracker });
  const captures = await page.evaluate(() => {
    const links = [...document.querySelectorAll('[data-posthog-event="modepot_creator_social_clicked"]')];
    for (const link of links) link.dispatchEvent(new MouseEvent('click', { button: 0, bubbles: true }));
    return { links: links.map(link => ({ platform: link.dataset.posthogPlatform, surface: link.dataset.posthogSurface, destination: link.href })), events: window.__captures };
  });
  expect(captures.links.map(link => link.platform)).toEqual(['github', 'linkedin', 'x']);
  expect(captures.events).toEqual(captures.links.map(link => [
    'modepot_creator_social_clicked', link, { transport: 'sendBeacon', send_instantly: true },
  ]));
});

test('project events distinguish site, documentation, and playground destinations', async ({ page }) => {
  await page.setContent(isolatedHtml);
  await page.evaluate(() => {
    window.__captures = [];
    window.posthog = { capture: (...args) => window.__captures.push(args) };
  });
  await page.addScriptTag({ content: tracker });
  const events = await page.evaluate(() => {
    const links = [...document.querySelectorAll('[data-posthog-event="modepot_project_clicked"]')];
    for (const link of links) link.dispatchEvent(new MouseEvent('click', { button: 0, bubbles: true }));
    return window.__captures.map(([name, properties]) => ({ name, properties }));
  });
  expect(events.filter(event => event.properties.destination_type === 'site')).toHaveLength(Object.keys(projects).length);
  expect(events.filter(event => event.properties.destination_type === 'docs')).toHaveLength(4);
  expect(events.filter(event => event.properties.destination_type === 'playground')).toHaveLength(4);
  expect(events.every(event => event.name === 'modepot_project_clicked')).toBe(true);
});

test('LifePot directory learning CTAs and direct game callout route independently', async ({ page }) => {
  await page.setContent(isolatedHtml);
  const card = page.locator('#lifepot');
  const learningLinks = card.locator('.product-link').filter({ hasText: 'Explore LifePot' });
  await expect(learningLinks).toHaveCount(1);
  for (const link of await learningLinks.all()) {
    await expect(link).toHaveAttribute('href', 'https://lifepot.modepot.io/learn');
    await expect(link).toBeVisible();
    const observed = await link.evaluate(el => {
      el.addEventListener('click', event => event.preventDefault(), { once: true });
      el.click();
      return el.href;
    });
    expect(observed).toBe('https://lifepot.modepot.io/learn');
  }
  const gameLink = card.locator('a.demo-route');
  await expect(gameLink).toHaveCount(1);
  await expect(gameLink).toHaveText('Play the game ↗');
  await expect(gameLink).toHaveAttribute('href', 'https://lifepot.modepot.io/play');
  await expect(gameLink).toBeVisible();
  expect(await gameLink.evaluate(el => {
    el.addEventListener('click', event => event.preventDefault(), { once: true });
    el.click();
    return el.href;
  })).toBe('https://lifepot.modepot.io/play');
});
