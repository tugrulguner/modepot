import {test,expect} from '@playwright/test';
test('UtilityPot uses canonical artwork and a live product destination in the family directory',async({page},info)=>{
 await page.route('**/*posthog*',route=>route.abort());
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});await page.goto('/');
  const card=page.locator('#utilitypot');await card.scrollIntoViewIfNeeded();
  const image=card.locator('.product-art img');await expect(image).toHaveAttribute('src','/products/utilitypot-lockup-v1.png?v=flask-rose-1');
  await image.evaluate(async e=>{if(!e.complete)await new Promise((resolve,reject)=>{e.addEventListener('load',resolve,{once:true});e.addEventListener('error',reject,{once:true});});await e.decode();});
  await expect(card.getByRole('link',{name:'Explore UtilityPot',exact:false})).toHaveAttribute('href','https://utilitypot.modepot.io/');
  await expect(card).toContainText('Illustrative mechanism');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await card.screenshot({path:info.outputPath('utilitypot-card-'+width+'.png')});
 }
});
