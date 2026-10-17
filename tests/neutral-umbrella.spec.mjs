import { test, expect } from '@playwright/test';
const neutral = 'rgb(244, 242, 234)';
for (const width of [1280, 820, 390]) {
  test(`umbrella branding is neutral without repainting sibling accents at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.hero-wordmark strong')).toHaveCSS('color', neutral);
    await expect(page.locator('.site-header .brand strong')).toHaveCSS('color', neutral);
    await expect(page.locator('.brand-flask-outline')).toHaveCSS('stroke', neutral);
    await expect(page.locator('.open-source-seal b')).toHaveCSS('color', neutral);
    await expect(page.locator('#intpot h2 strong')).toHaveCSS('color', 'rgb(242, 184, 75)');
    await expect(page.locator('#dexpot h2 strong')).toHaveCSS('color', 'rgb(102, 217, 255)');
    await expect(page.locator('#utilitypot h2 strong')).toHaveCSS('color', 'rgb(242, 140, 190)');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg?v=neutral-1');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://modepot.io/modepot-og.webp?v=neutral-1');
    const image = await page.evaluate(async () => {
      const im = new Image(); im.src = '/modepot-og.webp?v=neutral-1'; await im.decode();
      const canvas = document.createElement('canvas');canvas.width = im.naturalWidth;canvas.height = im.naturalHeight;
      const ctx = canvas.getContext('2d');ctx.drawImage(im, 0, 0);const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;let white = 0, amber = 0;
      for (let i=0;i<data.length;i+=4) {
        if ([244,242,234].every((v,k)=>Math.abs(data[i+k]-v)<14)) white++;
        if ([242,184,75].every((v,k)=>Math.abs(data[i+k]-v)<14)) amber++;
      }
      return { white, amber };
    });
    expect(image.white).toBeGreaterThan(1000);expect(image.amber).toBeLessThan(30);
    await page.screenshot({ path: test.info().outputPath(`neutral-hero-${width}.png`) });
  });
}
