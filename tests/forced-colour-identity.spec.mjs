import {test,expect} from '@playwright/test';
test('umbrella gradient lettering remains readable in forced colours',async({page})=>{
 await page.emulateMedia({forcedColors:'active'});await page.goto('/');
 for(const selector of ['.hero-wordmark strong','.site-header .brand strong','.footer-brand strong','.open-source-seal b']){
  const fill=await page.locator(selector).evaluate(el=>getComputedStyle(el).webkitTextFillColor);
  expect(fill,selector).not.toBe('rgba(0, 0, 0, 0)');
 }
});
