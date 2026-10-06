import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import { FaArrowRight, FaBullhorn, FaChartLine, FaHandshake, FaRocket, FaTrophy } from 'react-icons/fa';
import { getLocalRevenueEvents, REVENUE_EVENTS } from '@/Utils/revenueAnalytics';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { adminHeaders } from '@/Utils/authFetch';

const LABELS = {
  [REVENUE_EVENTS.FIGHT_VIEW]: 'Fight views',
  [REVENUE_EVENTS.PLAY_CLICK]: 'Play clicks',
  [REVENUE_EVENTS.PREDICTION_START]: 'Prediction starts',
  [REVENUE_EVENTS.SIGNUP_GATE]: 'Signup gates',
  [REVENUE_EVENTS.PAID_ENTRY]: 'Paid entries',
  [REVENUE_EVENTS.FREE_ENTRY]: 'Free entries',
  [REVENUE_EVENTS.CHALLENGE_SHARE]: 'Friend challenges',
};

function RevenueCommandCenter(){
 const [events,setEvents]=useState([]);
 const [serverSummary,setServerSummary]=useState(null);
 useEffect(()=>{const load=()=>setEvents(getLocalRevenueEvents());load();window.addEventListener('fmm:revenue-event',load);fetch(buildPublicApiUrl('/api/admin/revenue/summary?days=30'),{headers:adminHeaders()}).then(r=>r.ok?r.json():null).then(data=>{if(data?.ok)setServerSummary(data)}).catch(()=>{});return()=>window.removeEventListener('fmm:revenue-event',load)},[]);
 const localCounts=useMemo(()=>events.reduce((a,e)=>{a[e.event]=(a[e.event]||0)+1;return a},{}),[events]);
 const counts=serverSummary ? Object.fromEntries(Object.entries(serverSummary.byEvent||{}).map(([key,value])=>[key,Number(value?.count||0)])) : localCounts;
 const views=counts[REVENUE_EVENTS.FIGHT_VIEW]||0, starts=counts[REVENUE_EVENTS.PREDICTION_START]||0, paid=counts[REVENUE_EVENTS.PAID_ENTRY]||0;
 const pct=(n,d)=>d?((n/d)*100).toFixed(1)+'%':'—';
 const revenue=serverSummary ? Number(serverSummary.fmCoinsCommitted||0) : events.filter(e=>e.event===REVENUE_EVENTS.PAID_ENTRY).reduce((s,e)=>s+Number(e.entryFee||0),0);
 const cards=[REVENUE_EVENTS.FIGHT_VIEW,REVENUE_EVENTS.PLAY_CLICK,REVENUE_EVENTS.PREDICTION_START,REVENUE_EVENTS.SIGNUP_GATE,REVENUE_EVENTS.PAID_ENTRY,REVENUE_EVENTS.CHALLENGE_SHARE];
 return <div className="admin-dashboard-experience"><Head><title>Revenue Command Center | FANTASY MMADNESS</title></Head>
  <section className="admin-dashboard-hero"><div className="admin-dashboard-hero-copy"><span>FANTASY MMADNESS REVENUE ENGINE</span><h1>Turn fight-night traffic into players, purchases and partners.</h1><p>Track the player funnel, identify the leak, then use fight inventory to create consumer and business revenue. </p></div><div className="admin-dashboard-live"><i/><span>Conversion tracking active</span></div></section>
  <section className="admin-metric-grid">{cards.map(k=><article className="admin-metric-card" key={k}><FaChartLine/><strong>{Number(counts[k]||0).toLocaleString()}</strong><span>{LABELS[k]}</span></article>)}</section>
  <section className="admin-dashboard-grid">
   <div className="admin-dashboard-panel"><div className="admin-dashboard-panel-heading"><h2>Conversion funnel</h2><span>30-day account-wide funnel</span></div><div className="admin-data-table-scroll"><table className="admin-data-table"><thead><tr><th>Metric</th><th>Rate</th><th>Why it matters</th></tr></thead><tbody>
    <tr><td><strong>View → prediction start</strong></td><td>{pct(starts,views)}</td><td>Measures fight-page persuasion.</td></tr>
    <tr><td><strong>Prediction start → paid entry</strong></td><td>{pct(paid,starts)}</td><td>Measures signup, eligibility and purchase conversion.</td></tr>
    <tr><td><strong>FM COINS committed</strong></td><td>{revenue.toLocaleString()}</td><td>Entry value represented by captured paid entries.</td></tr>
   </tbody></table></div><p style={{opacity:.65,fontSize:12}}>Server analytics aggregate the last 30 days across visitors and devices. Until the backend route is available, this page safely falls back to this browser’s captured events.</p></div>
   <aside className="admin-dashboard-panel"><div className="admin-dashboard-panel-heading"><h2>Bigger-money channels</h2><span>Build beyond entry fees</span></div><div className="admin-quick-actions">
    <Link className="admin-quick-action" href="/administration/growth"><span><FaRocket/></span><div><strong>Fight Night Growth</strong><small>Drive traffic into the prediction funnel around every event.</small></div><FaArrowRight/></Link>
    <Link className="admin-quick-action" href="/administration/AffiliateUsers"><span><FaBullhorn/></span><div><strong>Affiliate + Fighter Distribution</strong><small>Give every promoter and fighter a measurable acquisition channel.</small></div><FaArrowRight/></Link>
    <Link className="admin-quick-action" href="/administration/sponsors"><span><FaHandshake/></span><div><strong>Sponsored Fight Inventory</strong><small>Sell branded prediction cards, fight-night placements and sponsored prizes.</small></div><FaArrowRight/></Link>
    <Link className="admin-quick-action" href="/administration/full-cards"><span><FaTrophy/></span><div><strong>Promotion / Broadcaster Package</strong><small>Use full cards as an interactive second-screen product for partners.</small></div><FaArrowRight/></Link>
   </div></aside>
  </section>
  <section className="admin-dashboard-panel" style={{marginTop:18}}>
   <div className="admin-dashboard-panel-heading"><h2>Fight-by-fight revenue</h2><span>Last 30 days</span></div>
   <p style={{opacity:.72,marginTop:0}}>See which fights are attracting attention and which ones are turning viewers into paid players.</p>
   <div className="admin-data-table-scroll"><table className="admin-data-table"><thead><tr><th>Fight</th><th>Views</th><th>Unique visitors</th><th>Play clicks</th><th>Prediction starts</th><th>Paid entries</th><th>Conversion</th><th>FM COINS</th></tr></thead><tbody>
    {(serverSummary?.fights||[]).length ? serverSummary.fights.map(row=><tr key={row.fightId}><td><Link href={`/fight/${encodeURIComponent(row.fightId)}`} style={{color:'inherit',textDecoration:'none',display:'inline-block'}}><strong style={{textDecoration:'underline',textUnderlineOffset:3}}>{row.fightName||`Fight …${String(row.fightId||'').slice(-6)}`}</strong><small style={{display:'block',opacity:.62,marginTop:4}}>{[row.category,row.matchDate ? new Date(row.matchDate).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''].filter(Boolean).join(' · ')}{(row.category||row.matchDate) ? ' · ' : ''}View Fight →</small></Link></td><td>{Number(row.views||0).toLocaleString()}</td><td>{Number(row.uniqueVisitors||0).toLocaleString()}</td><td>{Number(row.playClicks||0).toLocaleString()}</td><td>{Number(row.predictionStarts||0).toLocaleString()}</td><td>{Number(row.paidEntries||0).toLocaleString()}</td><td>{Number(row.conversionRate||0).toFixed(1)}%</td><td>{Number(row.fmCoinsCommitted||0).toLocaleString()}</td></tr>) : <tr><td colSpan="8" style={{opacity:.65}}>Per-fight activity will appear here as fight traffic is recorded.</td></tr>}
   </tbody></table></div>
  </section>
 </div>;
}
export default function RevenuePage(){return <AdminPrivateRoute><RevenueCommandCenter/></AdminPrivateRoute>}
