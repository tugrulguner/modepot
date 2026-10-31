import { test, expect } from '@playwright/test';

test('SkillPot is discoverable with canonical art and current collection status', async ({ page }, info) => {
  await page.route('**/*posthog*', (route) => route.abort());
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const card = page.locator('#skillpot');
    await card.scrollIntoViewIfNeeded();
    await expect(card).toContainText('In development');
    await expect(card).toContainText('v0.3.0 collection published');
    await expect(card).not.toContainText('v0.2.0 collection published');
    await expect(card).toContainText('Nine skills in current source; eight in v0.3.0.');
    await expect(card).toContainText('decision-brief is reviewed but unreleased');
    await expect(card).toContainText('repository-readiness remains experimental');
    const sourceSetup = card.getByRole('link', { name: 'decision-brief · source-only setup', exact: true });
    await expect(sourceSetup).toHaveAttribute('href', 'https://skillpot.modepot.io/host-setup/#try-decision-brief-from-reviewed-source');
    await expect(sourceSetup).toHaveAttribute('data-posthog-event', 'modepot_resource_clicked');
    await expect(sourceSetup).toHaveAttribute('data-posthog-resource-type', 'documentation');
    await expect(sourceSetup).toHaveAttribute('data-posthog-surface', 'modepot_project_card');
    await sourceSetup.focus();
    await expect(sourceSetup).toBeFocused();
    await expect(card.getByRole('link', { name: /^Source snapshot/ })).toHaveAttribute('href', 'https://github.com/tugrulguner/skillpot/commit/524d3a06303362aaafae0fbfdf2ebae38782875e');
    await expect(card).toContainText('broad usefulness evaluation not established');
    await expect(card.locator('.skillpot-mechanism')).toContainText('Task + constraints');
    await expect(card.locator('.skillpot-mechanism')).toContainText('Checked artifact + evidence');
    await expect(card.getByRole('link', { name: 'Explore SkillPot', exact: true })).toHaveAttribute('href', 'https://skillpot.modepot.io/');
    await expect(card.getByRole('link', { name: 'Explore SkillPot', exact: true })).toHaveAttribute('data-posthog-event', 'modepot_project_clicked');
    await expect(card.getByRole('link', { name: 'Explore SkillPot', exact: true })).toHaveAttribute('data-posthog-destination-type', 'site');
    await expect(card.getByRole('link', { name: 'Quickstart' })).toHaveAttribute('href', 'https://skillpot.modepot.io/quickstart/');
    await expect(card.getByRole('link', { name: /Latest recorded release · v0.3.0/ })).toHaveAttribute('href', 'https://github.com/tugrulguner/skillpot/releases/tag/v0.3.0');
    await expect(card).not.toContainText('No release recorded');
    await expect(card.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/tugrulguner/skillpot');
    await expect(card.locator('.product-art img')).toHaveAttribute('src', '/products/skillpot-lockup.svg');
    await expect(card.locator('.product-mark')).toHaveAttribute('src', '/marks/skillpot-mark.svg');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await card.screenshot({ path: info.outputPath(`skillpot-card-${width}.png`) });
  }
});
