import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
for(const width of [1280,390])test(`ModePot partner uses the supplied wordmark below the family content at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');
 const feature=page.locator('[data-partner-feature]');await expect(feature).toHaveCount(1);await feature.scrollIntoViewIfNeeded();
 await expect(feature).toContainText('Partner');await expect(feature.getByRole('heading')).toHaveText('Making math fun and thinking a habit.');await expect(feature).toContainText('5–10');
 await expect(page.getByText('Partner advertisement',{exact:true})).toHaveCount(0);await expect(page.locator('article.product [data-partner-feature]')).toHaveCount(0);
 const logo=feature.getByRole('img',{name:'Circles & Cookies',exact:true});await expect(logo).toBeVisible();const asset=readFileSync(new URL('../public/partners/circles-and-cookies-wordmark.png',import.meta.url));expect(createHash('sha256').update(asset).digest('hex')).toBe('23c66e8217d0cd8602a3e6f0a4d1d8dda797e14768df2684d0abf563a2629de0');
 await expect.poll(()=>logo.evaluate(e=>e.complete&&e.naturalWidth===251&&e.naturalHeight===49)).toBe(true);const box=await logo.boundingBox();expect(box.width).toBeLessThanOrEqual(251);expect(box.x).toBeGreaterThanOrEqual(20);expect(box.width/box.height).toBeCloseTo(251/49,2);
 const link=feature.getByRole('link',{name:/Explore Circles/});await expect(link).toHaveAttribute('href','https://circlesandcookies.com/');await expect(link).toHaveClass(/ph-no-autocapture/);expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
 const about=await page.locator('#about').boundingBox();expect((await feature.boundingBox()).y).toBeGreaterThanOrEqual(about.y+about.height);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:test.info().outputPath(`modepot-partner-${width}.png`)});
});
