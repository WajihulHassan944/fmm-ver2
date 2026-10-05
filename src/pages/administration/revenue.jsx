import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import { FaArrowRight, FaBullhorn, FaChartLine, FaHandshake, FaRocket, FaTrophy } from 'react-icons/fa';
import { getLocalRevenueEvents, REVENUE_EVENTS } from '@/Utils/revenueAnalytics';

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
 useEffect(()=>{const load=()=>setEvents(getLocalRevenueEvents());load();window.addEventListener('fmm:revenue-event',load);return()=>window.removeEventListener('fmm:revenue-event',load)},[]);
 const counts=useMemo(()=>events.reduce((a,e)=>{a[e.event]=(a[e.event]||0)+1;return a},{}),[events]);
 const views=counts[REVENUE_EVENTS.FIGHT_VIEW]||0, starts=counts[REVENUE_EVENTS.PREDICTION_START]||0, paid=counts[REVENUE_EVENTS.PAID_ENTRY]||0;
 const pct=(n,d)=>d?((n/d)*100).toFixed(1)+'%':'—';
 const revenue=events.filter(e=>e.event===REVENUE_EVENTS.PAID_ENTRY).reduce((s,e)=>s+Number(e.entryFee||0),0);
 const cards=[REVENUE_EVENTS.FIGHT_VIEW,REVENUE_EVENTS.PLAY_CLICK,REVENUE_EVENTS.PREDICTION_START,REVENUE_EVENTS.SIGNUP_GATE,REVENUE_EVENTS.PAID_ENTRY,REVENUE_EVENTS.CHALLENGE_SHARE];
 return <div className="admin-dashboard-experience"><Head><title>Revenue Command Center | FANTASY MMADNESS</title></Head>
  <section className="admin-dashboard-hero"><div className="admin-dashboard-hero-copy"><span>FANTASY MMADNESS REVENUE ENGINE</span><h1>Turn fight-night traffic into players, purchases and partners.</h1><p>Track the player funnel, identify the leak, then use fight inventory to create consumer and business revenue.</p></div><div className="admin-dashboard-live"><i/><span>Conversion tracking active</span></div></section>
  <section className="admin-metric-grid">{cards.map(k=><article className="admin-metric-card" key={k}><FaChartLine/><strong>{Number(counts[k]||0).toLocaleString()}</strong><span>{LABELS[k]}</span></article>)}</section>
  <section className="admin-dashboard-grid">
   <div className="admin-dashboard-panel"><div className="admin-dashboard-panel-heading"><h2>Conversion funnel</h2><span>This browser's captured funnel</span></div><div className="admin-data-table-scroll"><table className="admin-data-table"><thead><tr><th>Metric</th><th>Rate</th><th>Why it matters</th></tr></thead><tbody>
    <tr><td><strong>View → prediction start</strong></td><td>{pct(starts,views)}</td><td>Measures fight-page persuasion.</td></tr>
    <tr><td><strong>Prediction start → paid entry</strong></td><td>{pct(paid,starts)}</td><td>Measures signup, eligibility and purchase conversion.</td></tr>
    <tr><td><strong>FM COINS committed</strong></td><td>{revenue.toLocaleString()}</td><td>Entry value represented by captured paid entries.</td></tr>
   </tbody></table></div><p style={{opacity:.65,fontSize:12}}>This first version proves the event funnel in-browser. Server aggregation is the next step for all-user totals across devices.</p></div>
   <aside className="admin-dashboard-panel"><div className="admin-dashboard-panel-heading"><h2>Bigger-money channels</h2><span>Build beyond entry fees</span></div><div className="admin-quick-actions">
    <Link className="admin-quick-action" href="/administration/growth"><span><FaRocket/></span><div><strong>Fight Night Growth</strong><small>Drive traffic into the prediction funnel around every event.</small></div><FaArrowRight/></Link>
    <Link className="admin-quick-action" href="/administration/AffiliateUsers"><span><FaBullhorn/></span><div><strong>Affiliate + Fighter Distribution</strong><small>Give every promoter and fighter a measurable acquisition channel.</small></div><FaArrowRight/></Link>
    <Link className="admin-quick-action" href="/administration/sponsors"><span><FaHandshake/></span><div><strong>Sponsored Fight Inventory</strong><small>Sell branded prediction cards, fight-night placements and sponsored prizes.</small></div><FaArrowRight/></Link>
    <Link className="admin-quick-action" href="/administration/full-cards"><span><FaTrophy/></span><div><strong>Promotion / Broadcaster Package</strong><small>Use full cards as an interactive second-screen product for partners.</small></div><FaArrowRight/></Link>
   </div></aside>
  </section>
 </div>;
}
export default function RevenuePage(){return <AdminPrivateRoute><RevenueCommandCenter/></AdminPrivateRoute>}
