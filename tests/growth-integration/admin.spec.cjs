const {test,expect}=require('@playwright/test');
const engine='http://127.0.0.1:4391';
const admin='fixture-administrator-session',growth='fixture-growth-scoped-session';
const titles={overview:'Overview',marketing:'Marketing',pr:'Public Relations',affiliates:'Affiliate Recruitment',publishing:'Publishing',posters:'Marketing',connections:'Connections',automation:'Automation',analytics:'Analytics',revenue:'Revenue Attribution',approvals:'Campaign Approvals'};
const sections=['overview','marketing','pr','affiliates','publishing','posters','connections','automation','analytics','revenue','approvals'];
test.beforeEach(async({request,context})=>{await context.route('**/*',route=>{const url=new URL(route.request().url());return url.hostname==='127.0.0.1'&&['4390','4391','4392'].includes(url.port)?route.continue():route.abort();});await request.post(engine+'/__test/state',{data:{reset:true}});});
async function bridge(page,options={}){
 await page.route('**/api/administration/growth-session',async route=>{
  expect(new URL(route.request().url()).origin).toBe('http://127.0.0.1:4390');
  expect(route.request().headers().authorization).toBe('Bearer '+admin);
  await route.fulfill({status:options.status||200,contentType:'application/json',headers:{'Cache-Control':'no-store'},body:JSON.stringify(options.status?{ok:false,reason:'session_rejected'}:{ok:true,token:growth,expiresAt:Date.now()+(options.ttl||300000),engineOrigin:engine})});
 });
}
async function seed(page){await page.addInitScript(token=>localStorage.setItem('adminAuthToken',token),admin);}
async function open(page){await page.goto('/administration/growth-engine');await expect(page.getByTestId('ge-frame')).toBeVisible();return page.frameLocator('[data-testid=ge-frame]');}
async function ready(frame){await expect(frame.locator('main h1')).toHaveText('Overview');}
async function shot(page,name){await page.screenshot({path:`test-results/screenshots/${name}.png`,fullPage:true});}

test('normal administrator login, API-backed original console, all departments and media previews',async({page,request})=>{
 await bridge(page);await page.goto('/administration/login');
 await page.getByLabel('Email address').fill('fixture-admin@example.invalid');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Login to administration'}).click();
 await expect(page).toHaveURL(/\/administration$/);
 await page.getByRole('link',{name:/FANTASY MMADNESS Growth Engine/}).click();
 const frame=page.frameLocator('[data-testid=ge-frame]');await ready(frame);
 await expect(frame.getByTestId('tile-prospects')).toContainText('37');
 await request.post(engine+'/__test/state',{data:{count:42}});await frame.getByTestId('btn-refresh').click();await expect(frame.getByTestId('tile-prospects')).toContainText('42');
 await shot(page,'desktop-original-console');
 for(const section of sections){await page.getByTestId('ge-tab-'+section).click();await expect(page.getByTestId('ge-tab-'+section)).toHaveAttribute('aria-current','page');await expect(frame.locator('main .spinner')).toHaveCount(0);await expect(frame.getByTestId('page-error')).toHaveCount(0);await expect(frame.locator('main h1')).toHaveText(titles[section]);}
 await page.getByTestId('ge-tab-posters').click();await expect(frame.getByTestId('posters').first()).toBeVisible();
 await expect(frame.getByTestId('poster-portrait').first().locator('img')).toHaveJSProperty('naturalWidth',1080);
 for(const [format,height] of [['portrait',1350],['story',1920]]){const thumb=frame.getByTestId('poster-'+format).first();await expect(thumb.locator('img')).toHaveJSProperty('naturalHeight',height);const [popup]=await Promise.all([page.waitForEvent('popup'),thumb.click()]);await expect(popup.locator('svg')).toHaveAttribute('viewBox',`0 0 1080 ${height}`);await popup.close();}
 await shot(page,'poster-workflow-original-console');
 const requests=(await(await request.get(engine+'/__test/requests')).json()).requests;expect(requests.filter(r=>r.credentialClass==='administrator')).toHaveLength(0);
 expect(requests.some(r=>r.path==='/admin/analytics')).toBeTruthy();expect(requests.some(r=>r.path==='/admin/attribution')).toBeTruthy();expect(requests.some(r=>r.path==='/admin/marketing/coverage')).toBeTruthy();
});

test('health CORS failure never hides the original iframe',async({page})=>{await seed(page);await bridge(page);const frame=await open(page);await ready(frame);await expect(page.getByTestId('ge-frame')).toBeVisible();await expect(page.getByTestId('ge-unreachable')).toHaveCount(0);});

test('missing/failed normal authentication cannot open protected console',async({page})=>{
 await page.goto('/administration/growth-engine');await expect(page).toHaveURL(/\/administration\/login/);await expect(page.getByTestId('ge-frame')).toHaveCount(0);
 await page.getByLabel('Email address').fill('fixture-admin@example.invalid');await page.getByLabel('Password',{exact:true}).fill('wrong-password');await page.getByRole('button',{name:'Login to administration'}).click();await expect(page.getByText('Incorrect password',{exact:true})).toBeVisible();await expect(page.getByTestId('ge-frame')).toHaveCount(0);
});

test('rejected bridge is actionable and never becomes an authenticated Growth session',async({page})=>{await seed(page);await bridge(page,{status:401});const frame=await open(page);await expect(page.getByTestId('ge-session-notice')).toContainText('not accepted');await expect(frame.getByTestId('login')).toBeVisible();expect(await page.evaluate(()=>sessionStorage.getItem('fmmGrowthBridgeToken'))).toBeNull();});

test('foreign origin and wrong-window messages cannot navigate the parent or receive credentials',async({page})=>{
 await seed(page);await bridge(page);await ready(await open(page));
 await page.evaluate(origin=>{
  const source=document.querySelector('[data-testid=ge-frame]').contentWindow;
  window.dispatchEvent(new MessageEvent('message',{origin:'https://attacker.invalid',source,data:{type:'fmm-growth-console',section:'revenue'}}));
  window.dispatchEvent(new MessageEvent('message',{origin,source:window,data:{type:'fmm-growth-console',section:'revenue'}}));
 },engine);
 await expect(page).toHaveURL(/\/administration\/growth-engine$/);
 const sandbox=await page.getByTestId('ge-frame').getAttribute('sandbox');expect(sandbox).not.toContain('allow-top-navigation');expect(await page.getByTestId('ge-frame').getAttribute('referrerpolicy')).toBe('no-referrer');
});

test('approval and rejection controls stay inside original console, with no real publishing',async({page,request})=>{
 await seed(page);await bridge(page);const frame=await open(page);await ready(frame);await page.getByTestId('ge-tab-approvals').click();await frame.getByTestId('btn-approve').first().click();await frame.getByTestId('modal-confirm').click();await expect(frame.getByTestId('toast').last()).toContainText('Approved');
 const calls=(await(await request.get(engine+'/__test/requests')).json()).requests;expect(calls.some(r=>r.method==='POST'&&r.path==='/admin/drafts/fixture-draft/approve')).toBeTruthy();expect(calls.some(r=>/live-test|publish$/.test(r.path))).toBeFalsy();
});

test('session expiry removes the iframe and clears its parent bridge cache',async({page})=>{await seed(page);await bridge(page,{ttl:3000});await ready(await open(page));await expect(page.getByTestId('ge-frame')).toHaveCount(0,{timeout:10000});await expect(page.getByTestId('ge-session-notice')).toContainText('session ended');expect(await page.evaluate(()=>sessionStorage.getItem('fmmGrowthBridgeToken'))).toBeNull();});

test('mobile original-console embedding, navigation and media render',async({page})=>{await page.setViewportSize({width:390,height:844});await seed(page);await bridge(page);await ready(await open(page));await page.getByTestId('ge-tab-marketing').click();const frame=page.frameLocator('[data-testid=ge-frame]');await expect(frame.getByTestId('posters').first()).toBeVisible();await expect(page.getByTestId('ge-frame')).toHaveCSS('width',/\d+px/);await shot(page,'mobile-original-console');});

test('feature OFF rolls back navigation and iframe; legacy sample redirects to protected route',async({page})=>{await seed(page);await page.goto('http://127.0.0.1:4392/administration/growth-engine');await expect(page.getByTestId('ge-disabled')).toBeVisible();await expect(page.getByTestId('ge-frame')).toHaveCount(0);await expect(page.getByRole('link',{name:'Growth Engine',exact:true})).toHaveCount(0);await page.goto('http://127.0.0.1:4392/growth-engine-public-preview');await expect(page).toHaveURL(/\/administration\/growth-engine$/);await expect(page.getByTestId('ge-disabled')).toBeVisible();});

test('administrator logout clears bridge credentials and removes console access',async({page})=>{await seed(page);await bridge(page);await ready(await open(page));await page.getByRole('button',{name:'Logout',exact:true}).last().click();await expect(page).toHaveURL(/\/administration\/login/);await expect(page.getByTestId('ge-frame')).toHaveCount(0);expect(await page.evaluate(()=>sessionStorage.getItem('fmmGrowthBridgeToken'))).toBeNull();});

test('original rejection dialog records a reason and a sandbox rejection only',async({page,request})=>{await seed(page);await bridge(page);const frame=await open(page);await ready(frame);await page.getByTestId('ge-tab-approvals').click();await frame.getByTestId('btn-reject').first().click();await frame.getByTestId('reject-reason').fill('Isolated browser verification');await frame.getByTestId('modal-confirm').click();await expect(frame.getByTestId('toast').last()).toContainText('Rejected');const calls=(await(await request.get(engine+'/__test/requests')).json()).requests;expect(calls.some(r=>r.method==='POST'&&r.path==='/admin/drafts/fixture-draft/reject')).toBeTruthy();});

test('console CSP rejects an unapproved embedding origin',async({page})=>{
 const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto('http://127.0.0.1:4392/administration/login');
 await page.evaluate(origin=>{const f=document.createElement('iframe');f.id='unapproved-frame';f.src=origin+'/api/growth/console?embed=1';document.body.appendChild(f);},engine);
 await expect.poll(()=>errors.some(message=>message.includes('frame-ancestors'))).toBeTruthy();
 await expect(page.frameLocator('#unapproved-frame').getByTestId('login')).toHaveCount(0);
});

test('proposed original-console CSS repair eliminates mobile document overflow',async({page})=>{
 // Backend-owned CSS handoff; deliberately tested separately from deployed assets.
 const fs=require('node:fs');
 const css=fs.readFileSync('.cache/growth-original-console/app.css','utf8').replace('html.embedded .layout{grid-template-columns:1fr;min-height:0}','html.embedded .layout{grid-template-columns:minmax(0,1fr);min-height:0}').replace('html.embedded main{padding:16px 18px 40px}','html.embedded main{padding:16px 18px 40px;min-width:0;overflow-wrap:anywhere}');
 await page.route('**/api/growth/console/app.css',route=>route.fulfill({contentType:'text/css',body:css}));
 await page.setViewportSize({width:390,height:844});await seed(page);await bridge(page);await ready(await open(page));
 const frame=page.frameLocator('[data-testid=ge-frame]');
 for(const section of ['overview','marketing','approvals','connections','analytics','revenue']){await page.getByTestId('ge-tab-'+section).click();await expect(frame.locator('main h1')).toHaveText(titles[section]);await expect.poll(()=>frame.locator('html').evaluate(el=>el.scrollWidth<=window.innerWidth+1)).toBeTruthy();}
 await page.getByTestId('ge-tab-posters').click();await expect(frame.getByTestId('posters').first()).toBeVisible();await shot(page,'mobile-original-console-css-repair-candidate');
});
