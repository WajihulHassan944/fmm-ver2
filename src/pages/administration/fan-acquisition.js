import React,{useEffect,useState} from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import {adminHeaders} from '@/Utils/authFetch';
import {PUBLIC_API_BASE_URL} from '@/Utils/publicApi';
const names=['Boxing','MMA / UFC','Bare Knuckle','Kickboxing / Muay Thai','Pro Wrestling'];
function Dashboard(){
 const [audiences,setAudiences]=useState([]); const [campaigns,setCampaigns]=useState([]); const [runningAll,setRunningAll]=useState(false); const [campaignError,setCampaignError]=useState('');
 const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const [runStatus,setRunStatus]=useState('Ready to run all five agents.'),[lastCompleted,setLastCompleted]=useState(null);
 const load=async(runNow=false)=>{
  setLoading(true);setError('');
  try{const r=await fetch(PUBLIC_API_BASE_URL+(runNow?'/api/admin/fan-acquisition/run':'/api/admin/fan-acquisition/discover'),{method:runNow?'POST':'GET',headers:adminHeaders(),cache:'no-store'});
   const j=await r.json();if(!r.ok)throw Error(j.message||'Research unavailable');setData(j);
  }catch(e){setError(e.message);}finally{setLoading(false);}
 };
 const refreshAudiences=async()=>{try{const r=await fetch(PUBLIC_API_BASE_URL+'/api/admin/fan-acquisition/audiences',{headers:adminHeaders()});if(r.ok)setAudiences((await r.json()).audiences||[]);}catch(e){}};
 const refreshCampaigns=async()=>{try{const r=await fetch(PUBLIC_API_BASE_URL+'/api/admin/fan-acquisition/campaigns',{headers:adminHeaders()});if(r.ok)setCampaigns((await r.json()).campaigns||[]);}catch(e){setCampaignError('Campaign queue unavailable');}};
 const runPipeline=async()=>{setRunningAll(true);setCampaignError('');setRunStatus('Running five research agents. Searching public sources and saving results…');try{const r=await fetch(PUBLIC_API_BASE_URL+'/api/admin/fan-acquisition/run',{method:'POST',headers:adminHeaders()});const j=await r.json();if(!r.ok)throw Error(j.message||'Research failed');setData(j);setRunStatus('Research complete. Preparing campaign drafts and refreshing saved audiences…');const c=await fetch(PUBLIC_API_BASE_URL+'/api/admin/fan-acquisition/campaigns/generate',{method:'POST',headers:adminHeaders()});const v=await c.json();if(!c.ok)throw Error(v.message||'Campaign generation failed');await refreshCampaigns();await refreshAudiences();setLastCompleted(new Date().toLocaleString());setRunStatus('Completed: five agents returned results and campaign drafts were refreshed.');}catch(e){setRunStatus('Run failed. Please review the error below.');setCampaignError(e.message);}finally{setRunningAll(false);}};
 const updateOutreach=async(c,status)=>{setCampaignError('');try{const r=await fetch(PUBLIC_API_BASE_URL+'/api/admin/fan-acquisition/campaigns/'+encodeURIComponent(c._id)+'/status',{method:'PATCH',headers:{...adminHeaders(),'Content-Type':'application/json'},body:JSON.stringify({status})});const j=await r.json();if(!r.ok)throw Error(j.message||'Status update failed');await refreshCampaigns();}catch(e){setCampaignError(e.message);}};
 const openContact=async(c)=>{const subject='FANTASY MMADNESS partnership invitation';const body=c.message+'\\n\\nSource: '+c.sourceUrl;try{await navigator.clipboard?.writeText(subject+'\\n\\n'+body);}catch(e){}window.open(c.sourceUrl,'_blank','noopener,noreferrer');};
 const generate=async()=>{setCampaignError('');try{const r=await fetch(PUBLIC_API_BASE_URL+'/api/admin/fan-acquisition/campaigns/generate',{method:'POST',headers:adminHeaders()});const j=await r.json();if(!r.ok)throw Error(j.message||'Campaign generation failed');await refreshCampaigns();}catch(e){setCampaignError(e.message);}};
 useEffect(()=>{load();refreshCampaigns();refreshAudiences();},[]);
 return <main style={{minHeight:'100vh',background:'#080b12',color:'#f7f7f7',padding:'32px',fontFamily:'Arial,sans-serif'}}>
  <div style={{maxWidth:1160,margin:'auto'}}>
   <a href="/administration" style={{color:'#ddd'}}>← Back to Command Center</a>
   <h1 style={{fontSize:34,marginBottom:8}}>FAN ACQUISITION COMMAND CENTER</h1>
   <p style={{color:'#bbb'}}>Automatic daily audience discovery is enabled. This page shows verified activity; outreach delivery and paid advertising require connected, authorized channels.</p>
   <button onClick={runPipeline} disabled={runningAll} style={{background:'#cb1028',color:'white',border:0,borderRadius:8,padding:'12px 20px',cursor:'pointer'}}>{runningAll?'Running five agents and preparing campaigns…':'RUN FAN ACQUISITION NOW'}</button>
   <div role="status" aria-live="polite" style={{marginTop:14,padding:14,border:'1px solid #596174',borderRadius:10,background:'#171d29'}}><strong>{runningAll?'⏳ RUNNING':'AGENT STATUS'}</strong><p style={{margin:'8px 0'}}>{runStatus}</p>{lastCompleted&&<small>Last completed on this screen: {lastCompleted}</small>}{runningAll&&<p style={{color:'#ffb7b7'}}>Please wait. This may take time while the agents search public sources.</p>}</div>
   {data?.lastRunAt&&<p style={{color:'#bbb'}}>Last saved research run: {new Date(data.lastRunAt).toLocaleString()}</p>}
   {error&&<p role="alert" style={{color:'#ff9b9b'}}>{error}</p>}
   <p style={{color:'#aaa'}}>Daily research runs automatically; you do not need to press RUN every day. This button starts an extra research run. It does not send messages or buy ads.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,margin:'24px 0'}}>
    {[['Fans reached','Not measured'],['New visitors','Not measured'],['New signups','Not measured'],['New players','Not measured']].map(([label,value])=><div key={label} style={{padding:18,border:'1px solid #394152',borderRadius:12}}><small>{label}</small><h2 style={{marginBottom:0}}>{value}</h2></div>)}
   </div>
   <details style={{border:'1px solid #394152',borderRadius:12,padding:18,marginBottom:18}}><summary style={{cursor:'pointer',fontWeight:'bold'}}>Audience research — {audiences.length} saved leads (optional details)</summary><h2>Real audience pipeline</h2><p>{audiences.length} saved audience candidates shown. These are public communities or creators, not individual fan identities.</p><p style={{color:'#bbb'}}>Podcast discovery: {data?.agents?.[0]?.podcastSearchStatus||'Not yet confirmed'} · Optional YouTube: {data?.agents?.[0]?.videoSearchStatus||'Not configured'}. Podcast discovery works without an API key; YouTube is an optional additional source.</p>{audiences.slice(0,30).map((a,i)=><div key={a._id||i} style={{borderTop:'1px solid #394152',padding:'12px 0'}}><strong>{a.sportName} · {a.name}</strong><p><a href={a.url} target="_blank" rel="noopener noreferrer" style={{color:'#ffb7b7'}}>Open audience source ↗</a> · {a.type} · {a.outreachStatus||'Not contacted'}</p><small style={{color:'#aaa'}}>{a.source||'Public directory candidate'} · {a.contactMethod}</small></div>)}</details>
   <section style={{background:'#171d29',borderRadius:12,padding:18,marginBottom:18}}><h2 style={{marginTop:0}}>What has the machine actually done?</h2><p>Latest saved research: {data?.lastRunAt?new Date(data.lastRunAt).toLocaleString():'No saved run confirmed yet'}</p><p>Audience candidates: {data?.agents?.reduce((n,a)=>n+(a.audiencesIdentified||0),0)??'Unavailable'} · Public news leads: {data?.agents?.reduce((n,a)=>n+(a.discovered||0),0)??'Unavailable'} · Campaign drafts: {campaigns.length} · Published campaigns: 0 verified</p><p style={{color:'#aaa'}}>Research and drafts do not mean fans have been reached. Publishing and attribution still need to be connected.</p></section>
   <p style={{color:'#bcbcbc'}}>Research results are public articles and possible campaign opportunities—not identified individual fans. No automated posting or messaging is enabled.</p>
   <details style={{border:'1px solid #394152',padding:20,borderRadius:14,marginBottom:22}}><summary style={{cursor:'pointer',fontWeight:'bold'}}>Manual outreach tools (optional)</summary>
    <h2 style={{marginTop:0}}>Today's fan outreach playbook</h2>
    <p>Each agent searches public fan conversations, identifies appropriate communities, and prepares a sport-specific invitation. Review community rules before participating. Never mass-message strangers.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
    {[
     ['Boxing','boxing','boxing'],
     ['MMA / UFC','ufc','ufc'],
     ['Bare Knuckle','bkfc','bareknuckle'],
     ['Kickboxing / Muay Thai','muay thai','MuayThai'],
     ['Pro Wrestling','wwe aew','SquaredCircle']
    ].map(([name,query,community])=><div key={name} style={{background:'#171d29',padding:14,borderRadius:10}}>
     <strong>{name}</strong>
     <p><a style={{color:'#ffb7b7'}} href={'https://www.reddit.com/r/'+community+'/'} target="_blank" rel="noopener noreferrer">Explore public fan community ↗</a></p>
     <p><a style={{color:'#ffb7b7'}} href={'https://www.google.com/search?q='+encodeURIComponent(query+' fight fan communities podcasts creators')} target="_blank" rel="noopener noreferrer">Find fan pages and creators ↗</a></p>
     <button type="button" style={{padding:'9px',background:'#b7152a',color:'white',border:0,borderRadius:6}} onClick={()=>navigator.clipboard?.writeText('FIGHT FANS: Your fight IQ has a home. Predict the punches, rounds and finishes with FANTASY MMADNESS. We predict history—we predict history. Join the action at https://www.fantasymmadness.com')}>Copy fan invitation</button>
    </div>)}
    </div>
   </details>
   <section style={{border:'1px solid #394152',padding:20,borderRadius:14,marginBottom:22,background:'#111725'}}>
    <h2 style={{marginTop:0}}>Automated Outreach Center</h2>
    <p style={{color:'#bbb'}}>The five agents automatically research public audiences and prepare invitations. Message delivery is not active until an authorized sending channel is connected. No manual review queue is required for daily research.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>
     {[['Invitations prepared',campaigns.length],['Messages delivered','Not connected'],['Replies received','Not measured'],['New players from outreach','Not measured']].map(([label,value])=><div key={label} style={{background:'#080b12',padding:14,borderRadius:8}}><small style={{color:'#bbb'}}>{label}</small><p style={{fontSize:20,fontWeight:700,margin:'8px 0 0'}}>{value}</p></div>)}
    </div>
    {campaignError&&<p role="alert" style={{color:'#ffb7b7'}}>{campaignError}</p>}
   </section>
   <details style={{marginBottom:20}}><summary style={{cursor:'pointer',fontWeight:'bold',padding:12}}>Five-agent research breakdown (optional details)</summary>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18}}>
   {names.map((name,index)=>{const a=data?.agents?.[index];return <section key={name} style={{padding:20,border:'1px solid #394152',borderRadius:14,background:'#111725'}}>
    <h2 style={{marginTop:0}}>{name}</h2><p style={{color:'#c5c5c5'}}>{a?.status==='research_ready'?'Public research active':a?.status==='research_unavailable'?'Feed unavailable':'Waiting for research'}</p>
    <p><strong>{a?.audiencesIdentified??'—'}</strong> audience candidates · {a?.discovered??'—'} news leads</p>
    {(a?.audiences||[]).map((o,i)=><p key={'audience-'+i} style={{borderTop:'1px solid #333',paddingTop:10}}><a href={o.url} target="_blank" rel="noopener noreferrer" style={{color:'#fff'}}>{o.name}</a><br/><small style={{color:'#a7acb5'}}>Candidate only · {o.contactMethod} · No outreach sent</small></p>)}
    {(a?.opportunities||[]).slice(0,8).map((o,i)=><p key={i} style={{borderTop:'1px solid #333',paddingTop:10}}><a href={o.url} target="_blank" rel="noopener noreferrer" style={{color:'#fff'}}>{o.title}</a><br/><small style={{color:'#a7acb5'}}>{o.publishedAt?new Date(o.publishedAt).toLocaleDateString():''} · Public news research</small></p>)}
   </section>;})}
   </div></details>
  </div>
 </main>;
}
export default function Page(){return <AdminPrivateRoute><Head><title>Fan Acquisition Command Center | FANTASY MMADNESS</title></Head><Dashboard/></AdminPrivateRoute>;}
