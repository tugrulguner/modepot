import { test, expect } from '@playwright/test';

test('SkillPot is discoverable with canonical art and current collection status', async ({ page }, info) => {
  await page.route('**/*posthog*', (route) => route.abort());
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const card = page.locator('#skillpot');
    await card.scrollIntoViewIfNeeded();
    await expect(card).toContainText('In development');
    await expect(card).toContainText('v0.2.0 collection published');
    await expect(card).toContainText('broad usefulness evaluation not established');
    await expect(card.locator('.skillpot-mechanism')).toContainText('Task + constraints');
    await expect(card.locator('.skillpot-mechanism')).toContainText('Checked artifact + evidence');
    await expect(card.getByRole('link', { name: 'Explore SkillPot on GitHub' })).toHaveAttribute('href', 'https://github.com/tugrulguner/skillpot');
    await expect(card.getByRole('link', { name: 'Explore SkillPot on GitHub' })).toHaveAttribute('data-posthog-event', 'modepot_resource_clicked');
    await expect(card.getByRole('link', { name: 'Explore SkillPot on GitHub' })).toHaveAttribute('data-posthog-resource-type', 'repository');
    await expect(card.getByRole('link', { name: 'Quickstart' })).toHaveAttribute('href', 'https://github.com/tugrulguner/skillpot/blob/main/docs/quickstart.md');
    await expect(card.getByRole('link', { name: /Latest recorded release · v0.2.0/ })).toHaveAttribute('href', 'https://github.com/tugrulguner/skillpot/releases/tag/v0.2.0');
    await expect(card).not.toContainText('No release recorded');
    await expect(card.locator('a[href*="skillpot.modepot.io"]')).toHaveCount(0);
    await expect(card.locator('.product-art img')).toHaveAttribute('src', '/products/skillpot-lockup.svg');
    await expect(card.locator('.product-mark')).toHaveAttribute('src', '/marks/skillpot-mark.svg');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await card.screenshot({ path: info.outputPath(`skillpot-card-${width}.png`) });
  }
});
