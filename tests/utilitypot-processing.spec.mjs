import {test,expect} from '@playwright/test';
for(const width of [1280,390])test(`UtilityPot directory explains its fixed local and AI workflows at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');const card=page.locator('#utilitypot');await card.scrollIntoViewIfNeeded();
 await expect(card).toContainText('Eight browser-local utilities');await expect(card).toContainText('Eleven tools');await expect(card).toContainText('Three AI-assisted tools');
 await expect(card).not.toContainText('Describe the task. Review the plan. Run the tool.');
 const local=card.locator('[data-utility-path="local"]'),ai=card.locator('[data-utility-path="ai"]');await expect(local).toContainText('Browser-only computation');await expect(local).not.toContainText('Jev');await expect(ai).toContainText('Disclosed Jev interpretation');
 for(const node of await card.locator('.utility-mechanism .mechanism-node').all())expect(await node.evaluate(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:test.info().outputPath(`utility-workflows-${width}.png`)});
});
