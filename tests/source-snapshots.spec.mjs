import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const records = JSON.parse(await readFile(new URL('../src/data/projects.json', import.meta.url), 'utf8'));
for (const width of [1280, 390]) {
  test(`project source and release snapshots match human and agent surfaces at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const json = await request.get('/project-sources.json');
    expect(json.ok()).toBe(true);
    expect(await json.json()).toEqual(records);
    const agent = await request.get('/llms.txt');
    const text = await agent.text();
    for (const record of records) {
      const card = page.locator(`article#${record.name}`);
      const link = card.getByRole('link', { name: /^Source snapshot/ });
      await expect(link).toHaveAttribute('href', record.commitUrl);
      await expect(link).toBeVisible();
      await expect(card.locator('time')).toHaveAttribute('datetime', record.checkedAt);
      await expect(card.locator('time')).toContainText(record.checkedAt.slice(0, 10));
      expect(text).toContain(record.commitUrl);
      if (record.latestRelease) {
        await expect(card.getByRole('link', { name: /^Latest recorded release/ })).toHaveAttribute('href', record.latestRelease.url);
        await expect(card).not.toContainText('No release recorded');
        expect(text).toContain(record.latestRelease.url);
      } else {
        await expect(card).toContainText('No release recorded');
        await expect(card.getByRole('link', { name: /^Latest recorded release/ })).toHaveCount(0);
      }
      expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await card.locator('.product-actions').screenshot({ path: test.info().outputPath(`${record.name}-sources-${width}.png`) });
    }
    await page.screenshot({ path: test.info().outputPath(`snapshots-${width}.png`), fullPage: true });
  });
}
