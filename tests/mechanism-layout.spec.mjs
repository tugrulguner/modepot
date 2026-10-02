import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

for (const width of [320, 360, 768, 1280]) {
  for (const reducedMotion of ['reduce', 'no-preference']) {
    test(`all card labels fit at ${width}px, motion=${reducedMotion}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 390 : 800 });
      await page.emulateMedia({ reducedMotion });
      // Optional baseline CSS makes the original overflow reproducible without changing source.
      if (process.env.BASELINE_STYLESHEET) {
        await page.route('**/_astro/*.css', (route) => route.fulfill({
          contentType: 'text/css', body: readFileSync(process.env.BASELINE_STYLESHEET, 'utf8'),
        }));
      }
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const cards = page.locator('.demo-preview');
      await expect(cards).toHaveCount(4);
      for (const card of await cards.all()) {
        await card.scrollIntoViewIfNeeded();
        const failures = await card.evaluate((section) => {
          const problems = [];
          for (const el of section.querySelectorAll('.mechanism-node, .mechanism-branches span, .demo-caption, .demo-route, .life-caption')) {
            const box = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (parseFloat(style.fontSize) < 12) problems.push(`${el.textContent}: text below 12px`);
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              if (!walker.currentNode.textContent.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(walker.currentNode);
              for (const line of range.getClientRects()) {
                if (line.left < box.left - 1 || line.right > box.right + 1) problems.push(`${el.textContent}: text spills outside its box`);
              }
            }
          }
          const root = document.documentElement;
          if (root.scrollWidth > root.clientWidth + 1 || document.body.scrollWidth > root.clientWidth + 1) problems.push('horizontal document/body overflow');
          if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            for (const frame of section.querySelectorAll('.life-generation')) {
              if (getComputedStyle(frame).opacity !== '1') problems.push('static generation hidden');
            }
          } else {
            for (const animation of section.getAnimations({ subtree: true })) {
              for (const time of [0, 800, 1600, 2400, 4000, 6000]) {
                animation.pause();
                animation.currentTime = time;
                for (const node of section.querySelectorAll('.mechanism-node, .mechanism-branches span')) {
                  if (getComputedStyle(node).opacity !== '1') problems.push('animation dims meaningful labels');
                }
              }
            }
          }
          return problems;
        });
        expect(failures).toEqual([]);
      }
    });
  }
}
