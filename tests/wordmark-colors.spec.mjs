import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) {
  test(`project-name suffixes match the family wordmark at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const expectedGold = await page.locator('.hero-wordmark strong').evaluate(e => getComputedStyle(e).color);
    const headings = page.locator('.product-heading h2');
    const names = await headings.allTextContents();
    expect(names).toContain('refpot');
    for (let i = 0; i < names.length; i++) {
      const heading = headings.nth(i);
      const prefix = await heading.locator('span').evaluate(e => getComputedStyle(e).color);
      const suffix = await heading.locator('strong').evaluate(e => getComputedStyle(e).color);
      expect(suffix, `${names[i]} pot suffix`).toBe(expectedGold);
      expect(prefix, `${names[i]} prefix must keep its neutral identity`).not.toBe(suffix);
    }
    await expect(page.locator('.product-refpot')).toHaveCSS('--accent', '#f4f2ea');
  });
}
