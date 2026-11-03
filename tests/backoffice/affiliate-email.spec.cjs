const {test,expect}=require('@playwright/test');
const fightId='6ad629a60df141df46931a8b';
const recipients=[{_id:'611111111111111111111111',firstName:'Alex',lastName:'Fixture',email:'alex@example.invalid',verified:true},{_id:'622222222222222222222222',firstName:'Sam',lastName:'Fixture',email:'sam@example.invalid',verified:true}];
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#171717"/><text x="30" y="90" fill="white" font-size="42">ISOLATED CUSTOM POSTER FIXTURE</text></svg>';
async function setup(page,context,artwork=true){
 let mailRequests=0,imageError=false;
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.hostname!=='127.0.0.1'||!['4390','4391','4392'].includes(u.port))return route.abort();
  const json=body=>route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
  if(u.pathname==='/send-email-affiliate'){mailRequests++;return route.abort();}
  if(u.pathname==='/api/admin/affiliate-network')return json({affiliates:recipients});
  if(u.pathname.endsWith('/social-poster')&&req.method()==='POST')return json({poster:'http://127.0.0.1:4391/custom-poster-v2.png'});
  if(u.pathname==='/api/fight-share-image')return imageError?route.fulfill({status:502,body:''}):route.fulfill({contentType:'image/svg+xml',body:svg});
  if(u.pathname.endsWith('.png'))return route.fulfill({contentType:'image/svg+xml',body:svg});
  if(u.pathname==='/api/public/prediction-fights'||u.pathname==='/matches')return json({items:[{_id:fightId,matchFighterA:'Elif Nur Turhan',matchFighterB:'Alycia Baumgardner',matchDate:'2027-04-10',matchStatus:'open',matchCategory:'Boxing',entryOpen:true,fightPosterImage:artwork?'http://127.0.0.1:4391/custom-poster-v1.png':'',fighterAImage:'http://127.0.0.1:4391/a.png',fighterBImage:'http://127.0.0.1:4391/b.png',matchTokens:6266,pot:125313}]});
  if(u.pathname==='/api/wrestling/matches')return json({data:[]});
  return route.continue();
 });
 await page.addInitScript(()=>localStorage.setItem('adminAuthToken','fixture-administrator-session'));
 await page.goto(`/administration/AffiliateUsers?launchFight=${fightId}&launchTitle=Elif+Nur+Turhan+vs+Alycia+Baumgardner`);
 const modal=page.getByRole('dialog',{name:'Choose affiliates and send fight poster'});
 await expect(modal).toBeVisible();await modal.getByText('Preview affiliate message and poster',{exact:true}).click();
 return {modal,mailRequests:()=>mailRequests,failImages:()=>{imageError=true;}};
}
test('affiliate email has correct footer and recipient-specific custom poster preview; no email sent',async({page,context})=>{
 const f=await setup(page,context),preview=f.modal.getByTestId('affiliate-email-preview');
 await expect(preview.locator('pre')).toContainText('contact@fantasymmadnesscom.com');
 await expect(preview.locator('pre')).not.toContainText('contact@fantasymmadness.com.');
 await expect(preview.locator('pre')).toContainText('Hi Alex,');
 const image=preview.getByRole('img');await expect(image).toHaveJSProperty('naturalWidth',1200);
 const first=await image.getAttribute('src');expect(new URL(first,'http://localhost').searchParams.get('fightId')).toBe(fightId);expect(new URL(first,'http://localhost').searchParams.get('affiliateId')).toBe(recipients[0]._id);
 await preview.getByLabel('Preview recipient').selectOption(recipients[1]._id);await expect(preview.locator('pre')).toContainText('Hi Sam,');await expect(image).toHaveAttribute('src',new RegExp(recipients[1]._id));
 const before=await image.getAttribute('src');
 await f.modal.locator('input[type=file]').setInputFiles({name:'custom-poster.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6oZsAAAAASUVORK5CYII=','base64')});
 await expect(image).not.toHaveAttribute('src',before);await expect(image).toHaveJSProperty('naturalWidth',1200);
 await expect(preview.getByText(/not an email attachment/)).toBeVisible();
 await preview.getByRole('link',{name:'Open affiliate poster full size'}).scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/screenshots/affiliate-email-custom-poster-preview.png',fullPage:true});
 f.failImages();await preview.getByLabel('Preview recipient').selectOption(recipients[0]._id);await expect(preview.getByRole('alert')).toContainText('poster could not be loaded');
 expect(f.mailRequests()).toBe(0);
});
test('missing saved artwork is clearly identified instead of showing another fight poster',async({page,context})=>{
 const f=await setup(page,context,false),preview=f.modal.getByTestId('affiliate-email-preview');await expect(preview.getByText(/No saved fight poster was found/)).toBeVisible();await expect(preview.getByRole('img')).toHaveCount(0);expect(f.mailRequests()).toBe(0);
});
