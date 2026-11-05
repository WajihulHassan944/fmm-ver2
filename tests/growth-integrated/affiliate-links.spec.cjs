const {test,expect}=require('@playwright/test');
const campaign='combat_fans_aff_fixture_recruitment',fight='633333333333333333333333';
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test.beforeEach(async({page})=>{await page.route('**/*',route=>['4390','4391'].includes(new URL(route.request().url()).port)?route.continue():route.abort());});
test('mobile legacy recruitment redirect preserves complete campaign and does not promise an existing league',async({page})=>{
 await page.goto('/affiliate-create-account?utm_source=fan_acquisition&utm_medium=partner_outreach&utm_campaign='+campaign+'&utm_content=onboarding');
 await expect(page).toHaveURL(/\/auth\?.*role=affiliate/);const u=new URL(page.url());expect(u.searchParams.get('utm_campaign')).toBe(campaign);expect(u.searchParams.get('utm_content')).toBe('onboarding');await expect(page.getByRole('button',{name:'Apply as an affiliate',exact:true})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('fmm_fan_acquisition_attribution')||'null')?.utm_campaign)).toBe(campaign);await expect(page.getByRole('link',{name:/join.*league/i})).toHaveCount(0);
});
test('mobile same-name league signup keeps the full referring account and fight IDs with campaign context',async({page})=>{
 for(const id of ['611111111111111111111111','622222222222222222222222']){
  await page.goto('/league/fixture-same-name?affiliateId='+id+'&fightId='+fight+'&utm_source=fan_acquisition&utm_medium=partner_outreach&utm_campaign='+campaign);
  await expect(page.getByRole('button',{name:'Join this league',exact:true})).toBeVisible();await page.getByRole('button',{name:'Join this league',exact:true}).click();await expect(page).toHaveURL(/\/auth\?.*referrer=/);const u=new URL(page.url());expect(u.searchParams.get('referrer')).toBe(id);expect(u.searchParams.get('fight')).toBe(fight);expect(u.searchParams.get('utm_campaign')).toBe(campaign);const next=new URL(u.searchParams.get('next'),'http://127.0.0.1:4390');expect(next.pathname).toBe('/league/fixture-same-name');expect(next.searchParams.get('affiliateId')).toBe(id);expect(next.searchParams.get('fightId')).toBe(fight);expect(next.searchParams.get('utm_campaign')).toBe(campaign);
 }
});
test('mobile affiliate application retains campaign context without creating a live account or issuing a league',async({page})=>{
 await page.addInitScript(()=>{window.grecaptcha={ready:cb=>cb(),render(_el,options){window.__fixtureCaptcha=true;setTimeout(()=>options.callback('LOCAL_FIXTURE_CAPTCHA'),0);return 1;},reset(){},getResponse:()=> 'LOCAL_FIXTURE_CAPTCHA'};});
 let count=0,body='';await page.route('**/registerAffiliate',async route=>{count++;body=route.request().postData()||'';await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({message:'LOCAL FIXTURE pending application',instantApproved:false})});});
 await page.goto('/auth?mode=signup&role=affiliate&utm_source=fan_acquisition&utm_medium=partner_outreach&utm_campaign='+campaign+'&utm_content=onboarding');await expect(page.getByRole('button',{name:'Apply as an affiliate',exact:true})).toBeVisible();
 for(const [name,value]of Object.entries({firstName:'Fixture',lastName:'Applicant',playerName:'Fixture Applicant',email:'fixture@example.invalid',phone:'2025550100',zipCode:'10001',hearing:'LOCAL FIXTURE',password:'LOCAL-fixture-only-password'}))await page.locator('input[name="'+name+'"]').fill(value);
 await page.locator('input[name=isAgreed]').check();await expect.poll(()=>page.evaluate(()=>Boolean(window.__fixtureCaptcha))).toBe(true);await page.getByRole('button',{name:'Apply as an affiliate',exact:true}).click();await expect.poll(()=>count).toBe(1);expect(body).toContain('name="campaignAttribution"');expect(body).toContain(campaign);await expect(page.getByRole('link',{name:/join.*league/i})).toHaveCount(0);
});
