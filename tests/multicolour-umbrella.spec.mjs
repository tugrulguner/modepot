import { test, expect } from '@playwright/test';

const rgb = hex => `rgb(${hex.slice(1).match(/../g).map(v => parseInt(v, 16)).join(', ')})`;
for (const width of [1280, 820, 390, 320]) {
  test(`multicolour umbrella identity is legible and distinct at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const hero = page.locator('.hero-wordmark strong');
    await expect(hero).toHaveCSS('background-image', /linear-gradient/);
    await expect(page.locator('.site-header .brand strong')).toHaveCSS('background-image', /linear-gradient/);
    await expect(page.locator('.open-source-seal b')).toHaveCSS('background-image', /linear-gradient/);
    await expect(page.locator('.site-header .brand img')).toHaveAttribute('src', /modepot-mark\.svg\?v=multicolour-1/);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg?v=multicolour-1');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://modepot.io/modepot-og.webp?v=wordmark-parity-1');
    const palette = await page.evaluate(async () => {
      const img = new Image(); img.src = '/modepot-og.webp?v=wordmark-parity-1'; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
      return [[102,217,255],[169,135,255],[119,229,189]].map(color => { let count=0; for(let i=0;i<d.length;i+=4) if(color.every((v,k)=>Math.abs(d[i+k]-v)<20)) count++; return count; });
    });
    expect(palette.every(count => count > 100)).toBe(true);
    await expect(page.locator('#dexpot h2 strong')).toHaveCSS('color', rgb('#66d9ff'));
    await expect(page.locator('#intpot h2 strong')).toHaveCSS('color', rgb('#f2b84b'));
    await expect(page.locator('#summonpot h2 strong')).toHaveCSS('color', rgb('#a987ff'));
    await expect(page.locator('#lifepot h2 strong')).toHaveCSS('color', rgb('#77e5bd'));
    await expect(page.locator('#refpot h2 strong')).toHaveCSS('color', rgb('#f4f2ea'));
    await expect(page.locator('#utilitypot h2 strong')).toHaveCSS('color', rgb('#f28cbe'));
    await expect(page.locator('.hero-wordmark span')).toHaveCSS('color', 'rgb(244, 240, 231)');
    await expect(page.locator('#refpot h2 > span')).toHaveCSS('color', 'rgb(244, 240, 231)');
    await page.keyboard.press('Tab');
    const focus = await page.locator(':focus-visible').evaluate(el => getComputedStyle(el).outlineColor);
    expect(focus).not.toBe('rgba(0, 0, 0, 0)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`multicolour-${width}.png`), fullPage: true });
  });
}
