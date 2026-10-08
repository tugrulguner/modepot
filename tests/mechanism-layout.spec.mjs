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
      const refpotArt = page.locator('#refpot .product-art img');
      await refpotArt.scrollIntoViewIfNeeded();
      await refpotArt.evaluate(async image => { await image.decode(); });
      await expect(refpotArt).toHaveCSS('object-fit', 'contain');
      await expect(page.locator('#refpot .product-heading h2 strong')).toHaveCSS('color', 'rgb(244, 242, 234)');
      const surfaces = await page.evaluate(() => ['refpot', 'intpot', 'dexpot', 'summonpot', 'lifepot'].map(id => {
        const card = document.getElementById(id);
        return ['.product-copy', '.demo-preview'].map(selector => getComputedStyle(card.querySelector(selector)).backgroundColor);
      }));
      for (const surface of surfaces) expect(surface).toEqual(surfaces[0]);
      await expect(page.locator('#refpot .product-mark')).toHaveCSS('filter', 'none');
      await expect(page.locator('#refpot .product-mark')).toHaveAttribute('src', '/marks/refpot-mark.svg?v=2');
      await refpotArt.hover();
      await expect(refpotArt).toHaveCSS('transform', 'none');
      const cards = page.locator('.demo-preview');
      await expect(cards).toHaveCount(5);
      for (const card of await cards.all()) {
        await card.scrollIntoViewIfNeeded();
        const failures = await card.evaluate((section) => {
          const problems = [];
          for (const el of section.querySelectorAll('.mechanism-node, .mechanism-branches span, .ref-kind, .ref-detail, .demo-caption, .demo-route, .life-caption')) {
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

test('RefPot architecture animation changes flow over time without reducing label readability', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const path = page.locator('#refpot .ref-mechanism');
  await path.scrollIntoViewIfNeeded();
  const state = await path.evaluate(async (mechanism) => {
    const entry = mechanism.querySelector('.ref-sql');
    const core = mechanism.querySelector('.ref-core');
    const flow = mechanism.querySelector('.ref-flow-sql');
    const read = () => ({
      entry: getComputedStyle(entry).borderTopColor,
      core: getComputedStyle(core).borderTopColor,
      flow: getComputedStyle(flow.querySelector('.ref-packet')).transform,
      labels: [...mechanism.querySelectorAll('.ref-kind, .ref-detail')].map((label) => getComputedStyle(label).opacity),
    });
    const first = read();
    await new Promise((resolve) => setTimeout(resolve, 900));
    const second = read();
    return { first, second, animations: mechanism.getAnimations({ subtree: true }).length };
  });
  expect(state.animations).toBeGreaterThan(0);
  expect(state.second).not.toEqual(state.first);
  expect(state.first.labels.every((opacity) => opacity === '1')).toBe(true);
  expect(state.second.labels.every((opacity) => opacity === '1')).toBe(true);
});

test('RefPot packets visibly travel and alternate paths into the shared core', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const card = page.locator('#refpot');
  await card.scrollIntoViewIfNeeded();
  const sample = async (time) => page.locator('.ref-mechanism').evaluate((mechanism, time) => {
    for (const animation of mechanism.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = time;
    }
    return [...mechanism.querySelectorAll('.ref-packet')].map(packet => ({
      y: packet.getBoundingClientRect().top,
      opacity: Number(getComputedStyle(packet).opacity),
    }));
  }, time);
  const early = await sample(520);
  const late = await sample(1200);
  expect(early[0].opacity).toBe(1);
  expect(late[0].opacity).toBe(1);
  expect(late[0].y - early[0].y).toBeGreaterThan(18);
  expect(late[1].opacity).toBe(0);
  await card.screenshot({ path: testInfo.outputPath('refpot-desktop-transfer.png') });
  const orm = await sample(2800);
  expect(orm[1].opacity).toBe(1);
  expect(orm[0].opacity).toBe(0);
  await card.screenshot({ path: testInfo.outputPath('refpot-desktop-orm.png') });
  await page.setViewportSize({ width: 320, height: 800 });
  await card.scrollIntoViewIfNeeded();
  await sample(1200);
  await card.screenshot({ path: testInfo.outputPath('refpot-mobile-transfer.png') });
});

test('RefPot reduced-motion state is static, complete, and readable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 390 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const path = page.locator('#refpot .ref-mechanism');
  await path.scrollIntoViewIfNeeded();
  await expect(path.locator('.ref-sql')).toBeVisible();
  await expect(path.locator('.ref-orm')).toBeVisible();
  await expect(path.locator('.ref-core')).toBeVisible();
  await expect(path.locator('.ref-entry')).toHaveCount(2);
  await expect(path.locator('.ref-flow')).toHaveCount(2);
  const state = await path.evaluate(async (mechanism) => {
    const initial = [...mechanism.querySelectorAll('.ref-entry, .ref-core, .ref-flow')].map((element) => getComputedStyle(element).borderTopColor + getComputedStyle(element).color + getComputedStyle(element).opacity);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const later = [...mechanism.querySelectorAll('.ref-entry, .ref-core, .ref-flow')].map((element) => getComputedStyle(element).borderTopColor + getComputedStyle(element).color + getComputedStyle(element).opacity);
    return { initial, later, animations: mechanism.getAnimations({ subtree: true }).length, labels: [...mechanism.querySelectorAll('.ref-kind, .ref-detail')].map((label) => getComputedStyle(label).opacity) };
  });
  expect(state.animations).toBe(0);
  expect(state.later).toEqual(state.initial);
  expect(state.labels.every((opacity) => opacity === '1')).toBe(true);
});
