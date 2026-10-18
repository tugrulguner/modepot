import{test,expect}from'@playwright/test';
for(const width of[1280,390,320])test(`project feedback is beside every project action at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/?private=PRIVATE_SENTINEL#PRIVATE_SENTINEL');
 for(const name of['dexpot','intpot','summonpot','lifepot','refpot','utilitypot']){
  const card=page.locator(`article.product#${name}`),action=card.locator('.product-actions a[href*="/issues/new"]');await action.scrollIntoViewIfNeeded();await expect(action).toBeVisible();await expect(action).toContainText('Feedback');
  const href=new URL(await action.getAttribute('href'));expect(href.origin+href.pathname).toBe(`https://github.com/tugrulguner/${name}/issues/new`);expect(href.searchParams.get('body')).toContain('https://');expect(href.href).not.toContain('PRIVATE_SENTINEL');await expect(action).toHaveAttribute('target','_blank');await expect(action).toHaveAttribute('rel','noopener noreferrer');await expect(action).toHaveClass(/ph-no-autocapture/);
  const hit=await action.evaluate(e=>{const r=e.getBoundingClientRect(),p=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{height:r.height,width:r.width,hit:p===e||e.contains(p)}});expect(hit.height).toBeGreaterThanOrEqual(44);expect(hit.width).toBeGreaterThanOrEqual(44);expect(hit.hit).toBe(true);await action.focus();await expect(action).toBeFocused();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
