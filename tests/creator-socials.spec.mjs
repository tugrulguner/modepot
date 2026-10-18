import {test,expect} from '@playwright/test';
for(const width of[1280,1050,768,390,320])for(const mode of['light','dark'])test(`creator-adjacent social links use restrained text at ${width}px system-${mode}`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:mode});await page.goto('/?private=DO_NOT_TRANSFER#DO_NOT_TRANSFER');
 await page.evaluate(()=>document.fonts.ready);
 const row=page.locator('.creator-row');await expect(row).toContainText('Created by Tugrul Guner');const links=row.locator('.creator-social-links a');await expect(links).toHaveText(['GitHub','LinkedIn','X']);
 const urls=['https://github.com/tugrulguner','https://www.linkedin.com/in/tugrulguner/','https://x.com/Tugrul_Guner'];for(let i=0;i<3;i++){const a=links.nth(i);await expect(a).toHaveAttribute('href',urls[i]);await expect(a).toHaveCSS('font-size','15px');await expect(a).toHaveCSS('font-weight','400');await expect(a).toHaveAttribute('target','_blank');await expect(a).toHaveAttribute('rel','noopener noreferrer');await a.scrollIntoViewIfNeeded();await a.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(a).toBeFocused();}
 await expect(page.locator('.site-header a[href*="linkedin.com"],.site-header a[href*="x.com/"]')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await row.scrollIntoViewIfNeeded();await page.evaluate(()=>document.activeElement?.blur());await page.screenshot({path:info.outputPath(`creator-${width}-${mode}.png`)});
});
