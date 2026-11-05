// TEST ONLY: serves the ORIGINAL backend console at a pinned commit, with local
// API contract fixtures. Never mounts in Next or contacts a production service.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const sha='5f74baa486ba8dab9cd9c64b3f2e0806fc5ebf6d',dir=process.env.GROWTH_CONSOLE_SOURCE_DIR||path.resolve('.cache/growth-original-console-'+sha);fs.mkdirSync(dir,{recursive:true});
for(const f of ['index.html','app.js','app.css'])if(!fs.existsSync(path.join(dir,f)))fs.writeFileSync(path.join(dir,f),cp.execFileSync('curl',['--fail','--silent','--show-error','--max-time','30',`https://raw.githubusercontent.com/WajihulHassan944/fantasymmadness-game-server-three/${sha}/growth-console/${f}`]));
const ui='http://127.0.0.1:4390',engine='http://127.0.0.1:4391',growth='fixture-growth-scoped-session',admin='fixture-administrator-session';
let requests=[],paused=true,expired=false,review='needs_owner_review',count=37;
const now=()=>new Date().toISOString();
const contest={id:'fixture-fight',fighterA:'Ciryl Gane',fighterB:'Josh Hokit',sport:'mma-ufc',dateKey:'2027-04-10',timeTba:true,eventName:'TEST FIXTURE — UFC 334',contestUrl:'https://example.invalid/fight/fixture',open:true};
function draft(){return {id:'fixture-draft',kind:'marketing',genre:'mma-ufc',headline:'TEST FIXTURE — approved API data',text:'Fixture campaign. No real posting.',status:review,contestId:contest.id,contest,createdAt:now(),posts:{facebook:'Facebook fixture caption',instagram:'Instagram fixture caption',tiktok:'TikTok fixture caption',x:'X fixture caption'},poster:{portrait:{url:engine+'/api/growth/posters/fixture-portrait.svg',width:1080,height:1350},story:{url:engine+'/api/growth/posters/fixture-story.svg',width:1080,height:1920},status:'ready',qrUrl:'https://example.invalid/fight/fixture',art:{mode:'contest_artwork',used:true,fighters:[]}}};}
const status=()=>({ok:true,database:{name:'fmgrowthtest (LOCAL CONTRACT FIXTURE)',hostPinned:true},scheduler:{healthy:true,lastRunAt:now(),runsLast24h:3,schedule:'TEST ONLY'},delivery:{provider:'sandbox-capture',realDelivery:false},warnings:[]});
function payload(p,q){
 if(p==='/social/connections')return {ok:true,providers:['tiktok','x'].map(provider=>({provider,configured:true,blockers:[],callbackUrl:engine+'/api/growth/social/'+provider+'/callback'})),connections:[{provider:'tiktok',identity:'fixture_verified_open_id',displayName:'TEST FIXTURE TikTok',status:'connected'},{provider:'x',identity:'123456789',username:'FMmadness2024',displayName:'TEST FIXTURE X',status:'connected'}],pending:[]};
 if(p==='/admin/autonomy')return {ok:true,ownerPolicyEditable:false,liveApproved:false,policy:{enabled:false,paused:false,mode:'sandbox',version:0,departments:['marketing','pr','affiliate'],genres:['boxing'],channels:['x'],approvedRecipients:[],affiliateIds:[],maxCampaignsPerDepartmentPerDay:10},queue:{pending:0,retrying:0,running:0,failed:0},heartbeat:null,activeAffiliates:[]};
 if(p==='/admin/session')return {ok:true,admin:'fixture-admin',exp:Math.floor(Date.now()/1000)+60};
 if(p==='/admin/status')return status();
 if(p==='/admin/overview')return {ok:true,overview:{draftsAwaitingReview:review==='needs_owner_review'?1:0,approvedAwaitingDelivery:0,prospects:count,delivered:0,suppressions:0,lastRuns:[],latestReport:null}};
 if(p==='/admin/alerts')return {ok:true,alerts:[]};
 if(p==='/admin/funnel')return {ok:true,funnel:{stages:[{key:'discovered',label:'Fixture prospects',value:count,source:'Local contract fixture'}]}};
 if(p==='/admin/executive')return {ok:true,departments:[],exceptions:[],autonomy:{automatic:[],needsOwner:[],notConnected:[]}};
 if(p==='/admin/drafts')return {ok:true,drafts:(!q.get('kind')||q.get('kind')==='marketing')&&(!q.get('contestId')||q.get('contestId')===contest.id)?[draft()]:[]};
 if(p==='/admin/marketing/coverage')return {ok:true,coverage:{sports:['mma-ufc'],horizonNote:'LOCAL CONTRACT FIXTURE',latest:{checkedAt:now(),sourceReachable:true,verifiedContests:1,sports:{'mma-ufc':{verifiedContests:1,campaignsActive:1,rejectedContests:0,rejected:[]}}}}};
 if(p==='/admin/fighter-assets')return {ok:true,assets:[]};
 if(p==='/admin/research')return {ok:true,counts:{researched:0,waitingForResearch:0,publishedContacts:0,drafted:0},bySport:{},shows:[]};
 if(p==='/admin/affiliates')return {ok:true,affiliates:[]};
 if(p==='/admin/social')return {ok:true,posts:[],paused:{paused},channels:{},capabilities:{},provider:'sandbox'};
 if(['/admin/jobs','/admin/runs','/admin/suppressions','/admin/audit'].includes(p))return {ok:true,[p==='/admin/audit'?'entries':p.split('/').pop()]:[]};
 if(p==='/admin/analytics')return {ok:true,analytics:{generatedAt:now(),workstreams:{matrix:{},departments:[],genres:[],total:0},runs:{byDay:[],last7Days:0},drafts:{byGenreKind:{},byStatus:{},total:1,approvalRate:null},prospects:{total:count,withVerifiedContact:0,byGenre:{}},deliveries:{real:0},reports:[]}};
 if(p==='/admin/attribution')return {ok:true,attribution:{rejectedEvents:{},paymentSource:{note:'CONTRACT FIXTURE: no payment service connected'},totalRevenueCents:0,creditedEntries:0,funnel:{visits:0,signups:0,unverifiedExcluded:0},byGenre:[],affiliates:[],byCampaign:[],byAffiliate:[],revenueByCampaign:[],revenueByAffiliate:[],recentCredits:[],registrations:[],liveRegistrations:{configured:false}}};
 if(p==='/admin/connections')return {ok:true,connections:{meta:{configured:false,state:'not_set_up',connectionLabel:'LOCAL FIXTURE — not connected',setup:[{done:false,text:'Local contract fixture; no provider account'},{done:false,text:'No Meta app configured'}],publishing:{provider:'sandbox',facebook:'sandbox',instagram:'sandbox'},redirectUri:engine+'/api/growth/meta/callback'},social:{provider:'sandbox',paused:{paused},channels:{x:{mode:'sandbox',blockers:[]},tiktok:{mode:'sandbox',blockers:[]}}},email:{sender:'contact@fantasymmadnesscom.com',realDelivery:false},liveRegistrationReport:{configured:false},verifiedEventIngest:{configured:false,path:'/api/growth/events'},contestFeed:{url:'Local contract fixture only'}}};
 if(p==='/admin/email/readiness')return {ok:true,readiness:{steps:[],dns:{}}};
 if(p==='/admin/email/sandbox')return {ok:true,messages:[],provider:'sandbox-capture',realDelivery:false};
 return {ok:true};
}
http.createServer(async(req,res)=>{
 const u=new URL(req.url,engine);res.setHeader('Cache-Control','no-store');
 const json=(code,body)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
 if(u.pathname==='/__test/state'&&req.method==='POST'){let b='';for await(const c of req)b+=c;const x=JSON.parse(b||'{}');if(x.reset){requests=[];expired=false;review='needs_owner_review';count=37;paused=true;}if(x.expired!==undefined)expired=x.expired;if(x.count!==undefined)count=x.count;return json(200,{ok:true});}
 if(u.pathname==='/__test/requests')return json(200,{requests});
 if(u.pathname.startsWith('/api/growth/console')){
  const f=u.pathname.endsWith('app.js')?'app.js':u.pathname.endsWith('app.css')?'app.css':'index.html';
  res.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors ${ui}; base-uri 'none'; form-action 'none'`);
  res.setHeader('Content-Type',f.endsWith('js')?'application/javascript':f.endsWith('css')?'text/css':'text/html');return res.end(f==='index.html'?fs.readFileSync(path.join(dir,f),'utf8').replace('<html lang="en">','<html lang="en" data-integrated-preview="true">'):fs.readFileSync(path.join(dir,f)));
 }
 if(u.pathname.startsWith('/api/growth/posters/')){const story=u.pathname.includes('story');res.setHeader('Content-Type','image/svg+xml');return res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${story?1920:1350}" viewBox="0 0 1080 ${story?1920:1350}"><rect width="100%" height="100%" fill="#171717"/><text x="50" y="140" fill="white" font-size="50">MEDIA CONTRACT FIXTURE</text></svg>`);}
 // Deliberately omit CORS on health: iframe/same-origin API still works.
 if(u.pathname==='/api/growth/health')return json(200,{ok:true,service:'growth-engine-isolated',console:{embedOrigins:[ui]}});
 res.setHeader('Access-Control-Allow-Origin',ui);res.setHeader('Access-Control-Allow-Credentials','true');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');if(req.method==='OPTIONS')return json(200,{});
 if(u.pathname==='/api/admin/fights')return json(200,{ok:true,items:['0123456789abcdef01234567','1123456789abcdef01234567'].map((_id,i)=>({_id,matchFighterA:'TEST FIXTURE Fighter '+i,matchFighterB:'TEST FIXTURE Opponent '+i,matchCategory:'boxing',matchStatus:'Scheduled',matchDate:new Date(Date.now()+86400000*4).toISOString(),matchDateKey:new Date(Date.now()+86400000*4).toISOString().slice(0,10)}))});
 if(u.pathname==='/admin/login'){let b='';for await(const c of req)b+=c;return json(JSON.parse(b||'{}').password==='fixture-password'?200:401,JSON.parse(b||'{}').password==='fixture-password'?{token:admin}:{message:'Incorrect password'});}
 if(/^\/api\/public\/affiliates\/(611111111111111111111111|622222222222222222222222)$/.test(u.pathname))return json(200,{_id:u.pathname.split('/').pop(),firstName:'Fixture',lastName:'Same Name',verified:true});
 if(u.pathname==='/api/public/fights/633333333333333333333333')return json(200,{_id:'633333333333333333333333',matchFighterA:'FIXTURE Fighter A',matchFighterB:'FIXTURE Fighter B'});
 if(u.pathname==='/dashboard-counts')return json(200,{matchesCount:1,usersCount:0,affiliatesCount:0});
 if(!u.pathname.startsWith('/api/growth/'))return json(200,{ok:true,configured:false,items:[],data:[],counts:{}});
 const p=u.pathname.replace('/api/growth','');
 const kind=req.headers.authorization===`Bearer ${growth}`?'growth':req.headers.authorization===`Bearer ${admin}`?'administrator':'missing-or-other';requests.push({method:req.method,path:p,credentialClass:kind});
 if(p.startsWith('/admin/')&&(kind!=='growth'||expired))return json(401,{ok:false,message:'Session expired'});
 if(req.method==='POST'){
  if(p==='/admin/drafts/fixture-draft/approve'){review='approved';return json(200,{ok:true});}
  if(p==='/admin/drafts/fixture-draft/reject'){review='rejected';return json(200,{ok:true});}
  if(p==='/admin/social/pause'){paused=!paused;return json(200,{ok:true});}
  return json(403,{ok:false,reason:'Real actions are disabled in contract fixtures'});
 }
 return json(200,payload(p,u.searchParams));
}).listen(4391,'127.0.0.1',()=>console.log('Original Growth console with LOCAL CONTRACT API fixtures on 4391; no production services'));
