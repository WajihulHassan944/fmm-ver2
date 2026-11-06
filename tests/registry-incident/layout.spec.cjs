const {test,expect}=require('@playwright/test');
const rows=require('./records.json');
test('registry retains readable original columns and blocks all real mutations',async({page})=>{
 const mutations=[];await page.addInitScript(()=>localStorage.setItem('adminAuthToken','local-incident-fixture'));
 await page.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.origin==='http://127.0.0.1:4400')return route.continue();
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,OPTIONS'}});
  if(u.origin==='http://127.0.0.1:4401'&&u.pathname==='/track-click')return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"ok":true,"fixtureOnly":true}'});
  if(req.method()!=='GET'){mutations.push({method:req.method(),path:u.pathname});return route.abort();}
  if(u.origin==='http://127.0.0.1:4401'){
   let body={ok:true,items:[],data:[],matches:[]};
   if(u.pathname==='/match'||u.pathname==='/shadow')body=rows;
   if(u.pathname==='/api/admin/fights'||u.pathname==='/api/admin/shadow-fights/library'||u.pathname==='/api/public/fights'||u.pathname==='/api/public/prediction-fights')body={ok:true,items:rows,matches:rows,fights:rows};
   if(u.pathname==='/api/admin/ufc-event-discovery/proposals')body={ok:true,registryWritesEnabled:false,ownerApprovalRequired:true,proposals:[{_id:'local-read-only-proposal',status:'needs_owner_review',firstSeenAt:'2026-11-06T00:00:00Z',latestCandidate:{eventName:'Local browser proposal fixture',fighterA:'Fixture A',fighterB:'Fixture B',eventDate:'2027-01-01T12:00:00Z',articleSource:'Local fixture',articleUrl:'https://news.google.com/rss/fixture-only'}}]};
   if(u.pathname==='/dashboard-counts')body={matchesCount:rows.length,usersCount:0,affiliatesCount:0};
   return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)});
  }
  return route.abort();
 });
 for(const size of [{width:1440,height:1000},{width:1920,height:1080},{width:390,height:844}]){
  await page.setViewportSize(size);await page.goto('/administration/fights');const table=page.locator('table.admin-fights-table');await expect(table).toBeVisible();await expect(table.getByText(/Jacqueline Cavalcanti vs Michelle Montague/i).first()).toBeVisible();await expect(table.locator('tbody tr').first().getByText('Draft',{exact:true})).toBeVisible();
  await page.screenshot({path:`test-results/registry-${process.env.REGISTRY_PHASE||'after'}-${size.width}.png`,fullPage:true});
  const geometry=await table.locator('tbody tr').first().evaluate(tr=>{const td=tr.children[1],cell=tr.querySelector('.admin-fight-cell'),text=cell.querySelector('div');return{td:td.getBoundingClientRect().width,cell:cell.getBoundingClientRect().width,text:text.getBoundingClientRect().width,layout:getComputedStyle(tr.closest('table')).tableLayout,scroll:tr.closest('.admin-data-table-scroll').scrollWidth,client:tr.closest('.admin-data-table-scroll').clientWidth};});console.info(JSON.stringify({viewport:size.width,geometry}));
  if(process.env.REGISTRY_PHASE!=='before'){expect(geometry.text).toBeGreaterThan(170);expect(geometry.td).toBeGreaterThan(270);expect(geometry.layout).toBe('auto');}
  await table.locator('thead th').last().scrollIntoViewIfNeeded();await expect(table.locator('thead th').last()).toBeVisible();const more=table.locator('tbody tr').first().getByRole('button',{name:/^More/});await more.click();await expect(table.locator('tbody tr').first().getByRole('button',{name:'Homepage banner',exact:true})).toBeVisible();await more.click();
 }
 await page.goto('/administration/fight-data-quality');await page.getByRole('button',{name:'Fight proposals',exact:true}).click();await expect(page.getByRole('heading',{name:'Discovered fight proposals',exact:true})).toBeVisible();await expect(page.getByText('Local browser proposal fixture')).toBeVisible();await expect(page.getByText('Reported date (unverified):',{exact:false})).toBeVisible();await expect(page.getByRole('link',{name:'Review using the existing Create Fight form'})).toHaveAttribute('href','/administration/AddNewMatch');
 for(const width of [390,1440]){await page.setViewportSize({width,height:1000});await page.screenshot({path:`test-results/registry-proposals-${width}.png`,fullPage:true});}
 expect(mutations.filter(x=>/(?:^|\/)(?:match|shadow|fight|fights|payment|payments|prize|prizes)(?:\/|$)/i.test(x.path))).toEqual([]);
});
