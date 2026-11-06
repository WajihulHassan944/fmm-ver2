const {test,expect}=require('@playwright/test');
const admin='fixture-administrator-session',growth='fixture-growth-scoped-session';
test.beforeEach(async({page,request})=>{await page.route('**/*',route=>['4390','4391'].includes(new URL(route.request().url()).port)?route.continue():route.abort());await request.post('http://127.0.0.1:4391/__test/state',{data:{reset:true}});});
async function bridge(page,status=200){await page.route('**/api/admin/growth-social-session',async route=>{expect(route.request().headers().authorization).toBe('Bearer '+admin);await route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===200?{ok:true,token:growth,expiresAt:Date.now()+300000,engineOrigin:'http://127.0.0.1:4391'}:{ok:false,reason:'administrator_session_rejected'})});});}
test('normal Administration Growth contains existing departments and verified connection controls with one session',async({page,request})=>{
 await bridge(page);await page.goto('/administration/login?next='+encodeURIComponent('/administration/growth?engine=connections'));
 await page.getByLabel('Email address').fill('fixture-admin@example.invalid');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Login to administration'}).click();
 await expect(page).toHaveURL(/\/administration\/growth\?engine=connections/);const frame=page.frameLocator('[data-testid=ge-frame]');await expect(frame.getByTestId('oauth-tiktok')).toContainText('Status: connected');await expect(frame.getByTestId('oauth-x')).toContainText('@FMmadness2024');await expect(frame.getByRole('button',{name:'Connect X',exact:true})).toBeEnabled();await expect(frame.locator('input[type=password]')).toHaveCount(0);await expect(page.getByTestId('ge-session-notice')).toHaveCount(0);
 for(const section of ['marketing','pr','affiliates']){await page.getByTestId('ge-tab-'+section).click();await expect(page).toHaveURL(new RegExp('engine='+section));await expect(frame.locator('main h1')).toHaveText({marketing:'Marketing',pr:'Public Relations',affiliates:'Affiliate Recruitment'}[section]);await expect(frame.getByTestId('page-error')).toHaveCount(0);}
 await page.getByTestId('ge-tab-automation').click();await expect(page.getByTestId('autonomy-controls')).toContainText('No worker heartbeat');await page.getByText('Review automation policy',{exact:true}).click();await expect(page.getByRole('button',{name:'Save owner policy',exact:true})).toBeDisabled();
 const rows=(await(await request.get('http://127.0.0.1:4391/__test/requests')).json()).requests;expect(rows.some(r=>r.path==='/social/connections')).toBeTruthy();expect(rows.filter(r=>r.credentialClass==='administrator')).toHaveLength(0);
});
test('managed preparation remains active with zero pending jobs and automatic approval off; pause is explicit',async({page})=>{
 await page.addInitScript(token=>localStorage.setItem('adminAuthToken',token),admin);await bridge(page);let paused=false;
 await page.route('**/api/growth/admin/autonomy',async route=>{if(route.request().method()==='OPTIONS')return route.continue();const original=await route.fetch();const data=await original.json();await route.fulfill({response:original,json:{...data,policy:{...data.policy,enabled:false,paused},operations:{departments:{marketing:{awaitingOwnerReview:2,ready:2,held:0,receipts:2},pr:{awaitingOwnerReview:3,ready:3,held:0,receipts:3},affiliate:{awaitingOwnerReview:1,ready:0,held:1,receipts:1}}},scheduler:{generation:'poster-status-repair-v3',schedulerEnabled:true,healthy:true,preparationPaused:paused,preparationEnabled:!paused,schedule:'every 15 minutes',generationScheduledExecutions:7,lastScheduledAt:'2026-11-05T17:00:00Z',nextWakeAt:'2026-11-05T17:15:00Z'}}});});
 await page.goto('/administration/growth?engine=automation');const panel=page.getByTestId('autonomy-controls');await expect(panel).toContainText('Scheduled sandbox preparation active');await expect(panel).toContainText('Completed scheduled runs in this generation: 7');await expect(panel).toContainText('0 pending');await expect(panel).toContainText('Owner approval required');await expect(page.getByTestId('owner-preparation-summary')).toContainText('Preparation only');await expect(page.getByTestId('owner-preparation-summary')).toContainText('Affiliate recruitment: 1 awaiting owner review');await expect(panel).not.toContainText('does not enable unattended processing');await expect(panel.getByText('Enable unattended processing under this policy')).toHaveCount(0);
 paused=true;await panel.getByRole('button',{name:'Refresh recorded status'}).click();await expect(panel).toContainText('Scheduled preparation paused');await expect(panel).toContainText('Emergency stop active');
});
test('owner resume requires explicit confirmation and stays pending until a real timer verifies it',async({page})=>{
 await page.addInitScript(token=>localStorage.setItem('adminAuthToken',token),admin);await bridge(page);let posts=0;
 await page.route('**/api/growth/admin/autonomy',async route=>{if(route.request().method()==='OPTIONS')return route.continue();const response=await route.fetch();const data=await response.json();await route.fulfill({response,json:{...data,ownerPolicyEditable:true,policy:{...data.policy,version:1,paused:true},scheduler:{generation:'fixture-release',workerBindingReady:true,schedulerEnabled:false,healthy:false,preparationPaused:true,schedule:'every 15 minutes'}}});});
 await page.route('**/api/growth/admin/autonomy/resume',async route=>{if(route.request().method()==='OPTIONS')return route.continue();posts++;expect(route.request().postDataJSON()).toEqual({expectedVersion:1,confirmation:'RESUME PREPARATION'});const response=await route.fetch();await route.fulfill({response,status:200,json:{ok:true,policy:{enabled:false,paused:false,mode:'sandbox',version:2,departments:['marketing','pr','affiliate'],genres:['boxing'],channels:['x'],approvedRecipients:[],affiliateIds:[],maxCampaignsPerDepartmentPerDay:10},scheduler:{generation:'fixture-release--new',workerBindingReady:true,schedulerEnabled:true,healthy:false,resumePending:true,schedule:'every 15 minutes'}}});});
 await page.goto('/administration/growth?engine=automation');const button=page.getByRole('button',{name:'Resume sandbox preparation',exact:true});await expect(button).toBeDisabled();await page.getByLabel('Resume preparation confirmation').fill('RESUME PREPARATION');await button.click();await expect(page.getByTestId('autonomy-scheduler')).toContainText('awaiting timer verification');await expect(page.getByTestId('autonomy-state')).toContainText('Owner approval required');expect(posts).toBe(1);
});
test('unauthorized and rejected website sessions cannot obtain connection controls',async({page})=>{await page.goto('/administration/growth?engine=connections');await expect(page).toHaveURL(/administration\/login/);await expect(page.getByTestId('ge-frame')).toHaveCount(0);await page.addInitScript(token=>localStorage.setItem('adminAuthToken',token),admin);await bridge(page,401);await page.goto('/administration/growth?engine=connections');await expect(page.getByTestId('ge-session-notice')).toContainText('not accepted');await expect(page.frameLocator('[data-testid=ge-frame]').getByTestId('oauth-x')).toHaveCount(0);});
test('selected fight context survives department navigation and the existing launch desk remains available',async({page})=>{await page.addInitScript(token=>localStorage.setItem('adminAuthToken',token),admin);await bridge(page);const fight='0123456789abcdef01234567';await page.goto('/administration/growth?engine=marketing&fightId='+fight);await expect(page.getByTestId('ge-frame')).toHaveAttribute('src',new RegExp('fightId='+fight));await page.getByTestId('ge-tab-approvals').click();await expect(page).toHaveURL(new RegExp('fightId='+fight));await expect(page.getByRole('link',{name:'Fight launch desk',exact:true})).toHaveAttribute('href',new RegExp('engine=launch&fightId='+fight));});

test('launch desk keeps affiliate alerts and passes the newly selected fight into Growth',async({page})=>{await page.addInitScript(token=>localStorage.setItem('adminAuthToken',token),admin);await bridge(page);await page.goto('/administration/growth?engine=launch');await page.getByLabel('Choose an open fight').selectOption('1123456789abcdef01234567');await expect(page.getByRole('link',{name:/Prepare affiliate alerts/})).toHaveAttribute('href',/launchFight=1123456789abcdef01234567/);const link=page.getByRole('navigation',{name:'Growth departments'}).getByRole('link',{name:'Growth Engine',exact:true});await expect(link).toHaveAttribute('href',/fightId=1123456789abcdef01234567/);await link.click();await page.getByTestId('ge-tab-marketing').click();await expect(page.getByTestId('ge-frame')).toHaveAttribute('src',/fightId=1123456789abcdef01234567/);});
// Fixture-only diagnostics: never emit credential headers, tokens or browser storage.
test.afterEach(async({page,request},info)=>{if(info.status===info.expectedStatus)return;const notices=await page.getByTestId('ge-session-notice').allTextContents().catch(()=>[]);const requests=await request.get('http://127.0.0.1:4391/__test/requests').then(r=>r.json()).catch(()=>({requests:[]}));console.info(JSON.stringify({fixtureFailureUrl:page.url(),notices,frames:page.frames().map(f=>f.url()),apiRequests:requests.requests.slice(-15)}));});

test('exact November 5 dashboard restoration has every department and preserved approved frame presentation',async({page})=>{
 await page.addInitScript(token=>localStorage.setItem('adminAuthToken',token),admin);await bridge(page);await page.setViewportSize({width:1280,height:1000});
 for(const section of ['marketing','pr','affiliates','connections','automation','analytics']){await page.goto('/administration/growth?engine='+section);const frame=page.frameLocator('[data-testid=ge-frame]');await expect(frame.locator('main h1')).toBeVisible();await expect(frame.getByTestId('page-error')).toHaveCount(0);if(section==='marketing'){await expect(frame.getByTestId('nav-marketing')).toBeHidden();expect(await frame.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor)).toBe('rgb(244, 245, 247)');await page.screenshot({path:'test-results/issue203-exact-restored-desktop.png',fullPage:true});}}
 await page.setViewportSize({width:390,height:844});await page.goto('/administration/growth?engine=connections');await expect(page.frameLocator('[data-testid=ge-frame]').getByTestId('oauth-x')).toBeVisible();await page.screenshot({path:'test-results/issue203-exact-restored-mobile.png',fullPage:true});
});

test('all original Growth tabs remain readable and usable at desktop and mobile sizes',async({page})=>{
 test.setTimeout(240000);
 await page.addInitScript(token=>localStorage.setItem('adminAuthToken',token),admin);await bridge(page);
 const phase=process.env.GROWTH_VISUAL_PHASE||'after';
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  for(const section of ['overview','approvals','marketing','pr','affiliates','publishing','posters','automation','analytics','revenue','connections']){
   await page.goto('/administration/growth?engine='+section);
   const frame=page.frameLocator('[data-testid=ge-frame]');
   await expect(frame.locator('main h1')).toBeVisible();await expect(frame.getByTestId('page-error')).toHaveCount(0);
   await expect(page.getByTestId('ge-tab-'+section)).toHaveAttribute('aria-current','page');
   if(section==='affiliates'){
    const acceptance=page.getByTestId('affiliate-acceptance-controls');await expect(acceptance.getByLabel('Acceptance fight')).toBeVisible();
    await acceptance.getByLabel('Staging acceptance confirmation').fill('NOT AUTHORIZED');await expect(acceptance.getByRole('button',{name:'Run isolated signup-to-entry acceptance'})).toBeDisabled();
    if(phase==='after')for(const selector of ['h2','p','label','input','select','button']){
     const colors=await acceptance.locator(selector).first().evaluate(n=>({color:getComputedStyle(n).color,background:getComputedStyle(n).backgroundColor}));
     expect(colors.color).not.toBe('rgb(255, 255, 255)');
    }
    await acceptance.getByRole('button',{name:'Refresh acceptance evidence'}).click();
    await acceptance.getByText('Owner recruitment terms review',{exact:true}).click();await expect(acceptance.getByLabel('Document version')).toBeVisible();
   }
   if(section==='automation'){await page.getByText('Review automation policy',{exact:true}).click();await expect(page.getByRole('button',{name:'Save owner policy',exact:true})).toBeDisabled();}
   await frame.locator('main h1').evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));
   await page.waitForTimeout(150);
   await frame.locator('body').screenshot({path:`test-results/department-${phase}-${viewport.width}-${section}.png`});
   await page.screenshot({path:`test-results/ui-${phase}-${viewport.width}-${section}.png`,fullPage:true});
  }
 }
});

test('embedded sizing rejects spoofed, oversized and wrong-department messages without altering authentication',async({page})=>{
 await page.addInitScript(token=>localStorage.setItem('adminAuthToken',token),admin);await bridge(page);await page.goto('/administration/growth?engine=marketing');
 await expect(page.frameLocator('[data-testid=ge-frame]').locator('main h1')).toHaveText('Marketing');
 await page.waitForTimeout(300);
 const original=await page.getByTestId('ge-frame').evaluate(n=>n.style.height);expect(original).toMatch(/^\d+px$/);
 for(const data of [{section:'marketing',height:999999},{section:'connections',height:800},{section:'marketing',height:NaN}]){
  await page.evaluate(data=>window.dispatchEvent(new MessageEvent('message',{origin:'http://127.0.0.1:4391',source:document.querySelector('[data-testid=ge-frame]').contentWindow,data:{type:'fmm-growth-console',event:'content-size',...data}})),data);
  expect(await page.getByTestId('ge-frame').evaluate(n=>n.style.height)).toBe(original);
 }
 await page.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://attacker.invalid',source:window,data:{type:'fmm-growth-console',event:'content-size',section:'marketing',height:180}})));
 expect(await page.getByTestId('ge-frame').evaluate(n=>n.style.height)).toBe(original);await expect(page).toHaveURL(/engine=marketing/);
 await expect(page.getByTestId('ge-session-notice')).toHaveCount(0);
 const support=page.locator('.fmm-support-widget');await expect(support).toHaveCSS('position','relative');
 await support.getByRole('button',{name:'Open Help and Support'}).click();await expect(support.getByRole('dialog')).toBeVisible();
 await support.getByRole('button',{name:/close/i}).click();await expect(support.getByRole('dialog')).toHaveCount(0);
 const draft=page.frameLocator('[data-testid=ge-frame]').getByTestId('draft').first();await draft.getByTestId('btn-approve').click();
 const modal=page.frameLocator('[data-testid=ge-frame]').getByTestId('modal');await expect(modal.getByTestId('campaign-final-review')).toContainText('separate explicit owner authorization');
 await modal.getByTestId('modal-cancel').click();await expect(modal).toHaveCount(0);
});
