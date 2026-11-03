import React, { useState } from 'react';
import Head from 'next/head';

// Public, read-only preview. Never imports authenticated admin routes, fetches
// secrets, calls Growth Engine admin APIs, or enables mutations.
const departments = [
  { key: 'overview', label: 'Overview', title: 'Growth Engine overview', lines: ['Marketing campaigns: sample MMA fight promotion', 'Public relations: researched outreach pipeline', 'Affiliate recruitment: proposal and review pipeline', 'Social publishing: sandbox-only scheduling and receipts', 'Monitoring: staging acceptance checks'] },
  { key: 'marketing', label: 'Marketing', title: 'Marketing studio', lines: ['Genre-specific poster templates: Boxing / MMA / Bare-Knuckle / Kickboxing / Pro Wrestling', 'Approved fighter photographs and rights review', 'Feed and vertical social poster sizes', 'QR verification against exact fight URL', 'Campaigns require owner approval before public delivery'] },
  { key: 'pr', label: 'PR', title: 'Public relations', lines: ['Research relevant combat-sports shows and outlets', 'Create personalized outreach drafts', 'Review recipient and rights requirements', 'Queue only authorized external communications'] },
  { key: 'affiliates', label: 'Affiliate recruitment', title: 'Affiliate recruitment', lines: ['Discover combat-sports partners and talent', 'Draft personalized recruitment proposals', 'Review owner approval, attribution, and campaign eligibility', 'No real outreach is triggered from this preview'] },
  { key: 'publishing', label: 'Social publishing', title: 'Publishing and approvals', lines: ['Facebook, Instagram, TikTok and X sandbox adapters', 'Campaign approval gate and scheduled publishing', 'Pause, retry, cancellation and duplicate protection', 'Real publishing remains disabled in isolated staging'] },
  { key: 'analytics', label: 'Analytics', title: 'Performance and attribution', lines: ['Campaign engagement and channel summaries', 'Affiliate attribution and FM COINS reporting', 'Synthetic conversion checks in staging', 'No private player or financial records exposed here'] },
];
const tile = { background:'#171e2d',border:'1px solid #344054',borderRadius:13,padding:20 };
export default function GrowthEnginePublicReview() {
  const [active,setActive]=useState('overview');
  const section=departments.find(d=>d.key===active)||departments[0];
  return <>
    <Head><title>Growth Engine · Read-only Preview | FANTASY MMADNESS</title></Head>
    <main style={{minHeight:'100vh',background:'#0c111b',color:'#f4f6fa',fontFamily:'Arial,sans-serif',padding:'clamp(16px,3vw,40px)'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:20,flexWrap:'wrap'}}>
          <div><p style={{color:'#ff4653',fontWeight:900,letterSpacing:2,margin:'0 0 8px'}}>FANTASY MMADNESS</p>
          <h1 style={{fontSize:'clamp(28px,4vw,46px)',margin:'0 0 12px'}}>GROWTH ENGINE</h1>
          <p style={{color:'#b8c3d5',maxWidth:690,lineHeight:1.55}}>Password-free, read-only demonstration of the built departments and workflows. No live or confidential records are accessible from this page.</p></div>
          <span style={{padding:'10px 15px',border:'1px solid #6d7c90',borderRadius:22,color:'#cbd5e1',fontSize:13}}>DEMO · NO ACCOUNT REQUIRED</span>
        </header>
        <section style={{background:'#201923',border:'1px solid #743c46',padding:'16px 20px',borderRadius:12,margin:'22px 0'}}>
          <strong style={{color:'#ff99a2'}}>READ-ONLY SAMPLE</strong>
          <p style={{margin:'7px 0 0',lineHeight:1.5,color:'#e0d7db'}}>This shows the Growth Engine's features and representative staging workflows—not a live dashboard, current campaign data, or an authenticated administration session. Public emails, posts, payments and database changes cannot be performed here.</p>
        </section>
        <nav aria-label="Growth Engine departments" style={{display:'flex',flexWrap:'wrap',gap:9,margin:'20px 0 24px'}}>{departments.map(d=><button key={d.key} type="button" onClick={()=>setActive(d.key)} style={{padding:'12px 15px',background:active===d.key?'#c81b2b':'#1d293b',color:'#fff',border:'1px solid #485568',borderRadius:8,cursor:'pointer',fontWeight:'bold'}}>{d.label}</button>)}</nav>
        <section style={{...tile,marginBottom:20}}><h2 style={{fontSize:26,marginTop:0}}>{section.title}</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:14}}>{section.lines.map((line,i)=><article key={line} style={{...tile,background:'#101724'}}><div style={{fontWeight:900,color:'#ff4653',fontSize:13,marginBottom:12}}>WORKFLOW {String(i+1).padStart(2,'0')}</div><p style={{lineHeight:1.55,margin:0}}>{line}</p></article>)}</div></section>
        <section style={{...tile,marginTop:18}}><h2 style={{marginTop:0}}>Integration progress</h2><p style={{lineHeight:1.65}}>Isolated Growth Engine staging and premium poster generator have passed automated testing. Frontend integration PR #193 is still unmerged. The separate owner-authenticated console is currently blocked by credential configuration, and public publishing remains disabled.</p><p style={{color:'#b9c6d8',marginBottom:0}}>Next gate: resolve real owner sign-in, test admin iframe and rollback, then request explicit production approval.</p></section>
      </div>
    </main>
  </>;
}
