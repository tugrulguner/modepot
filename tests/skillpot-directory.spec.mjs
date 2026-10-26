import { test, expect } from '@playwright/test';

test('SkillPot is discoverable with canonical art and repository-first development status', async ({ page }, info) => {
  await page.route('**/*posthog*', (route) => route.abort());
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const card = page.locator('#skillpot');
    await card.scrollIntoViewIfNeeded();
    await expect(card).toContainText('In development');
    await expect(card).toContainText('no installable skills or compatibility results yet');
    await expect(card).toContainText('evidence-backed demo');
    await expect(card.getByRole('link', { name: 'Explore SkillPot on GitHub' })).toHaveAttribute('href', 'https://github.com/tugrulguner/skillpot');
    await expect(card.getByRole('link', { name: 'Explore SkillPot on GitHub' })).toHaveAttribute('data-posthog-event', 'modepot_resource_clicked');
    await expect(card.getByRole('link', { name: 'Explore SkillPot on GitHub' })).toHaveAttribute('data-posthog-resource-type', 'repository');
    await expect(card.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', 'https://github.com/tugrulguner/skillpot/blob/main/README.md');
    await expect(card).not.toContainText('No release recorded');
    await expect(card.locator('a[href*="skillpot.modepot.io"]')).toHaveCount(0);
    await expect(card.locator('.product-art img')).toHaveAttribute('src', '/products/skillpot-lockup.svg');
    await expect(card.locator('.product-mark')).toHaveAttribute('src', '/marks/skillpot-mark.svg');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await card.screenshot({ path: info.outputPath(`skillpot-card-${width}.png`) });
  }
});
