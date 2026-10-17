import { test, expect } from '@playwright/test';
const suffixes = {dexpot:'rgb(102, 217, 255)',intpot:'rgb(242, 184, 75)',summonpot:'rgb(169, 135, 255)',lifepot:'rgb(119, 229, 189)',refpot:'rgb(244, 242, 234)',utilitypot:'rgb(242, 140, 190)'};

for (const width of [1280, 390]) {
  test(`project-name suffixes match their flasks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.hero-wordmark strong')).toHaveCSS('color','rgb(242, 184, 75)');
    const headings = page.locator('.product-heading h2');
    const names = await headings.allTextContents();
    expect(names).toContain('refpot');
    for (let i = 0; i < names.length; i++) {
      const heading = headings.nth(i);
      const prefix = await heading.locator('span').evaluate(e => getComputedStyle(e).color);
      const suffix = await heading.locator('strong').evaluate(e => getComputedStyle(e).color);
      expect(suffix, `${names[i]} pot suffix`).toBe(suffixes[names[i]]);
      expect(prefix, `${names[i]} prefix must keep its neutral identity`).toBe('rgb(244, 240, 231)');
    }
    await expect(page.locator('.product-refpot')).toHaveCSS('--accent', '#f4f2ea');
  });
}
