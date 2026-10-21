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
  [REVENUE_EVENTS.FIRST_PREDICTION]: 'First picks',
  [REVENUE_EVENTS.PREDICTION_COMPLETE]: 'Cards completed',
  [REVENUE_EVENTS.SIGNUP_GATE]: 'Signup gates',
  [REVENUE_EVENTS.PAID_ENTRY]: 'Paid entries',
  [REVENUE_EVENTS.FREE_ENTRY]: 'Free entries',
  [REVENUE_EVENTS.CHALLENGE_SHARE]: 'Friend challenges',
};

function RevenueCommandCenter(){
 const [events,setEvents]=useState([]);
 const [serverSummary,setServerSummary]=useState(null);
 const [sourceStatus,setSourceStatus]=useState('loading');
 const [merchantStatements,setMerchantStatements]=useState([]);
 const [merchantStatus,setMerchantStatus]=useState('loading');
 const [statementDraft,setStatementDraft]=useState({period:'2026-09',grossSales:'8.94',refunds:'0',adjustments:'0',cardFees:'-2.11',otherFees:'-42.97',reportedNetFunding:'-36.14'});
 const [statementSave,setStatementSave]=useState('');
 const [statementSaving,setStatementSaving]=useState(false);
 const refreshMerchantStatements=async()=>{try{const response=await fetch(buildPublicApiUrl('/api/admin/revenue/merchant-statements'),{headers:adminHeaders()});if(!response.ok)throw new Error('Merchant statement service is not available.');const data=await response.json();if(!data?.ok||!Array.isArray(data.statements))throw new Error('Unexpected merchant statement response.');setMerchantStatements(data.statements);setMerchantStatus('connected');return true;}catch{setMerchantStatus('unavailable');return false;}};
 const saveStatement=async(event)=>{event.preventDefault();if(merchantStatus!=='connected')return;setStatementSaving(true);setStatementSave('');try{const body=Object.fromEntries(Object.entries(statementDraft).map(([key,value])=>[key,key==='period'?value:Number(value)]));const response=await fetch(buildPublicApiUrl('/api/admin/revenue/merchant-statements'),{method:'POST',headers:{...adminHeaders(),'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||'Statement could not be saved.');setStatementSave('Statement saved in the protected backend. Bank deposits are not independently verified.');await refreshMerchantStatements();}catch(error){setStatementSave(error.message||'Statement save failed.');}finally{setStatementSaving(false)}};

 useEffect(()=>{fetch(buildPublicApiUrl('/api/admin/revenue/merchant-statements'),{headers:adminHeaders()}).then(r=>r.ok?r.json():null).then(data=>{if(data?.ok&&Array.isArray(data.statements)){setMerchantStatements(data.statements);setMerchantStatus('connected')}else setMerchantStatus('unavailable')}).catch(()=>setMerchantStatus('unavailable'))},[]);
 useEffect(()=>{const load=()=>setEvents(getLocalRevenueEvents());load();window.addEventListener('fmm:revenue-event',load);fetch(buildPublicApiUrl('/api/admin/revenue/summary?days=30'),{headers:adminHeaders()}).then(r=>r.ok?r.json():null).then(data=>{if(data?.ok){setServerSummary(data);setSourceStatus('server')}else setSourceStatus('browser')}).catch(()=>setSourceStatus('browser'));return()=>window.removeEventListener('fmm:revenue-event',load)},[]);
 const localCounts=useMemo(()=>events.reduce((a,e)=>{a[e.event]=(a[e.event]||0)+1;return a},{}),[events]);
 const counts=serverSummary ? Object.fromEntries(Object.entries(serverSummary.byEvent||{}).map(([key,value])=>[key,Number(value?.count||0)])) : localCounts;
 const views=counts[REVENUE_EVENTS.FIGHT_VIEW]||0, starts=counts[REVENUE_EVENTS.PREDICTION_START]||0, paid=counts[REVENUE_EVENTS.PAID_ENTRY]||0;
 const pct=(n,d)=>d?((n/d)*100).toFixed(1)+'%':'—';
 const revenue=serverSummary ? Number(serverSummary.fmCoinsCommitted||0) : events.filter(e=>e.event===REVENUE_EVENTS.PAID_ENTRY).reduce((s,e)=>s+Number(e.entryFee||0),0);
 const localFightRows=useMemo(()=>{const byFight=new Map();for(const e of events){const id=String(e.fightId||e.fight_id||'').trim();if(!id)continue;const row=byFight.get(id)||{fightId:id,fightName:e.fightName||e.fightTitle||e.matchName||'',category:e.category||'',views:0,uniqueVisitors:0,playClicks:0,predictionStarts:0,firstPredictions:0,predictionCompletes:0,signupGates:0,checkoutStarts:0,paidEntries:0,fmCoinsCommitted:0,conversionRate:0,_visitors:new Set()};if(!row.fightName)row.fightName=e.fightName||e.fightTitle||e.matchName||'';const metric={[REVENUE_EVENTS.FIGHT_VIEW]:'views',[REVENUE_EVENTS.PLAY_CLICK]:'playClicks',[REVENUE_EVENTS.PREDICTION_START]:'predictionStarts',[REVENUE_EVENTS.FIRST_PREDICTION]:'firstPredictions',[REVENUE_EVENTS.PREDICTION_COMPLETE]:'predictionCompletes',[REVENUE_EVENTS.SIGNUP_GATE]:'signupGates',[REVENUE_EVENTS.PAID_ENTRY]:'paidEntries'}[e.event];if(metric)row[metric]++;if(e.event===REVENUE_EVENTS.PAID_ENTRY)row.fmCoinsCommitted+=Number(e.entryFee||0);if(e.visitorId)row._visitors.add(e.visitorId);byFight.set(id,row)}return [...byFight.values()].map(row=>({...row,uniqueVisitors:row._visitors.size,conversionRate:row.views?100*row.paidEntries/row.views:0,_visitors:undefined})).sort((a,b)=>b.views-a.views)},[events]);
 const fightRows=(serverSummary?.fights?.length ? serverSummary.fights : localFightRows);
 const exportAuditCsv=()=>{const source=sourceStatus==='server'?'SERVER_EVENT_AGGREGATION':'BROWSER_ONLY_UNVERIFIED';const rows=[['Report','FANTASY MMADNESS revenue event audit'],['Generated UTC',new Date().toISOString()],['Source',source],['Period',sourceStatus==='server'?'Last 30 days':'Local browser event history'],['Financial status','UNRECONCILED - NOT PROOF OF CASH REVENUE'],[],['Event','Count'],...Object.keys(LABELS).map(k=>[LABELS[k],Number(counts[k]||0)]),[],['Fight ID','Fight','Views','Paid entry events','FM coins committed'],...fightRows.map(row=>[row.fightId,row.fightName||'',Number(row.views||0),Number(row.paidEntries||0),Number(row.fmCoinsCommitted||0)])];const csv=rows.map(row=>row.map(cell=>'"'+String(cell??'').replace(/"/g,'""')+'"').join(',')).join('\\r\\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const href=URL.createObjectURL(blob);const link=document.createElement('a');link.href=href;link.download='fmm-revenue-event-audit-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);};
 const channels=[['Contest entries','Event tracking available; payment settlement not reconciled'],['Advertising','Contracts, impressions, and invoices not yet connected'],['Sponsorships','Contracts and payment records not yet connected'],['Affiliate partnerships','Attribution and payout reconciliation not yet connected'],['Promoter partnerships','Agreement and settlement records not yet connected'],['Merchandise and licensing','Sales, refunds, and royalties not yet reconciled']];
 const cards=[REVENUE_EVENTS.FIGHT_VIEW,REVENUE_EVENTS.PLAY_CLICK,REVENUE_EVENTS.PREDICTION_START,REVENUE_EVENTS.SIGNUP_GATE,REVENUE_EVENTS.PAID_ENTRY,REVENUE_EVENTS.CHALLENGE_SHARE];
 return <div className="admin-dashboard-experience"><Head><title>Revenue Command Center | FANTASY MMADNESS</title></Head>
  <section className="admin-dashboard-hero"><div className="admin-dashboard-hero-copy"><span>FANTASY MMADNESS REVENUE ENGINE</span><h1>Turn fight-night traffic into players, purchases and partners.</h1><p>Track the player funnel, identify the leak, then use fight inventory to create consumer and business revenue. </p></div><div className="admin-dashboard-live"><i/><span>{sourceStatus==='server'?'Server event data':sourceStatus==='loading'?'Checking source':'Browser-only data'}</span></div></section>
  <section className="admin-dashboard-panel" style={{marginBottom:20}}>
    <div className="admin-dashboard-panel-heading"><h2>Merchant statement reconciliation</h2><span>{merchantStatus==='connected'?'Protected backend records':'Integration pending'}</span></div>
    <p style={{opacity:.75}}>Monthly merchant sales, fees and settlement reconciliation. Figures appear only when provided by the authenticated backend. This is not a live bank deposit verification.</p>
    {merchantStatus==='connected'&&<details style={{marginBottom:16}}><summary style={{cursor:'pointer',fontWeight:700}}>Enter a merchant statement (admin only)</summary>
      <form onSubmit={saveStatement} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginTop:12}}>
        {Object.entries(statementDraft).map(([key,value])=><label key={key} style={{display:'grid',gap:4,fontSize:12}}><span>{({period:'Statement month',grossSales:'Gross sales',refunds:'Refunds',adjustments:'Adjustments',cardFees:'Card fees (negative)',otherFees:'Other fees (negative)',reportedNetFunding:'Net funded'})[key]}</span><input required type={key==='period'?'month':'number'} step={key==='period'?undefined:'0.01'} value={value} onChange={event=>setStatementDraft(old=>({...old,[key]:event.target.value}))} style={{padding:10,borderRadius:6,border:'1px solid #666',background:'#151515',color:'white'}} /></label>)}
        <button disabled={statementSaving} type="submit" style={{padding:10,alignSelf:'end',borderRadius:6,background:'#bb202d',color:'white',fontWeight:700}}>{statementSaving?'Saving…':'Validate and save'}</button>
      </form><p style={{fontSize:12,opacity:.75}}>Enter statement-level totals only. Do not enter account numbers, card data, or credentials. A successful save verifies arithmetic, not actual bank deposits.</p>
      {statementSave&&<p role="status">{statementSave}</p>}
    </details>}
    <div className="admin-data-table-scroll"><table className="admin-data-table"><thead><tr><th>Month</th><th>Gross sales</th><th>Refunds</th><th>Fees</th><th>Net funded</th><th>Check</th></tr></thead><tbody>
      {merchantStatements.length?merchantStatements.map(row=><tr key={row.period}><td>{row.period}</td><td>${Number(row.grossSales||0).toFixed(2)}</td><td>${Number(row.refunds||0).toFixed(2)}</td><td>${Number((row.cardFees||0)+(row.otherFees||0)).toFixed(2)}</td><td>${Number(row.reportedNetFunding||0).toFixed(2)}</td><td>{row.status==='STATEMENT_ARITHMETIC_MATCH'?'Statement balances':'Review required'}</td></tr>):<tr><td colSpan="6">{merchantStatus==='loading'?'Loading protected records…':merchantStatus==='unavailable'?'Merchant statement API is not connected yet.':'No imported statements yet.'}</td></tr>}
    </tbody></table></div>
  </section>
  <section className="admin-dashboard-panel" style={{marginBottom:18}}>
   <div className="admin-dashboard-panel-heading"><h2>Data source and verification</h2><span>{sourceStatus==='server'?'Server event records':sourceStatus==='loading'?'Checking source…':'Browser-only fallback'}</span></div>
   <p><strong>{sourceStatus==='server'?'Backend event aggregation connected.':'Financial reporting is not verified.'}</strong> {sourceStatus==='server'?'These figures are collected event counts, not independently reconciled payment transactions.':'Backend event reporting is unavailable. These figures may only reflect activity captured in this browser.'}</p>
   <p style={{opacity:.8,fontSize:13}}>Paid-entry events and FM coins committed are not confirmed cash receipts. Gross sales, refunds, processing fees, net proceeds, sponsorship invoices and affiliate payouts must be reconciled with payment and contract records before use in financial reports.</p>
  </section>
  <section className="admin-dashboard-panel" style={{marginBottom:18}}>
    <div className="admin-dashboard-panel-heading"><h2>Revenue channel readiness</h2><span>Verification before monetization reports</span></div>
    <div className="admin-data-table-scroll"><table className="admin-data-table"><thead><tr><th>Channel</th><th>Accounting status</th></tr></thead><tbody>{channels.map(([name,status])=><tr key={name}><td><strong>{name}</strong></td><td>{status}</td></tr>)}</tbody></table></div>
    <p style={{opacity:.7,fontSize:12}}>This is a connectivity and reconciliation checklist, not a ledger or a claim of earned income.</p>
    <button type="button" onClick={exportAuditCsv} style={{padding:'10px 16px',borderRadius:8,cursor:'pointer'}}>Export event audit CSV</button>
  </section>
  <section className="admin-dashboard-panel" style={{marginBottom:18}}>
    <div className="admin-dashboard-panel-heading"><h2>Financial reconciliation · merchant statements</h2><span>Payment-source connection required</span></div>
    <p>Cash revenue must come from verified payment transactions and settlement reports, not predictions or FM coin commitments. No payment provider has been connected to this reporting view yet.</p>
    <div className="admin-data-table-scroll"><table className="admin-data-table"><thead><tr><th>Ledger measure</th><th>Verified value</th><th>Required evidence</th></tr></thead><tbody>
    {[
      ['Gross captured payments','Not connected','Processor transaction IDs and captured amounts'],
      ['Refunds and chargebacks','Not connected','Processor refund and dispute records'],
      ['Processing fees','Not connected','Processor balance or settlement records'],
      ['Net settled proceeds','Not connected','Payout and bank settlement records'],
      ['Affiliate commissions','Not reconciled','Attributed paid transaction and approved commission'],
      ['Sponsorship and advertising','Not reconciled','Signed agreement, invoice, and payment record']
    ].map(([name,value,evidence])=><tr key={name}><td><strong>{name}</strong></td><td>{value}</td><td>{evidence}</td></tr>)}
    </tbody></table></div>
    <p style={{opacity:.75,fontSize:12}}>No amounts are estimated or filled with zeros while the payment source is missing. This section is not a bookkeeping ledger.</p>
  </section>
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
   <div className="admin-data-table-scroll"><table className="admin-data-table"><thead><tr><th>Fight</th><th>Views</th><th>Visitors</th><th>Play</th><th>Opened picks</th><th>First pick</th><th>Card finished</th><th>Signup</th><th>Checkout</th><th>Paid</th><th>Conversion</th><th>FM COINS</th></tr></thead><tbody>
    {fightRows.length ? fightRows.map(row=><tr key={row.fightId}><td><Link href={`/fight/${encodeURIComponent(row.fightId)}`} style={{color:'inherit',textDecoration:'none',display:'inline-block'}}><strong style={{textDecoration:'underline',textUnderlineOffset:3}}>{row.fightName||`Fight …${String(row.fightId||'').slice(-6)}`}</strong><small style={{display:'block',opacity:.62,marginTop:4}}>{[row.category,row.matchDate ? new Date(row.matchDate).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''].filter(Boolean).join(' · ')}{(row.category||row.matchDate) ? ' · ' : ''}View Fight →</small></Link></td><td>{Number(row.views||0).toLocaleString()}</td><td>{Number(row.uniqueVisitors||0).toLocaleString()}</td><td>{Number(row.playClicks||0).toLocaleString()}</td><td>{Number(row.predictionStarts||0).toLocaleString()}</td><td>{Number(row.firstPredictions||0).toLocaleString()}</td><td>{Number(row.predictionCompletes||0).toLocaleString()}</td><td>{Number(row.signupGates||0).toLocaleString()}</td><td>{Number(row.checkoutStarts||0).toLocaleString()}</td><td>{Number(row.paidEntries||0).toLocaleString()}</td><td>{Number(row.conversionRate||0).toFixed(1)}%</td><td>{Number(row.fmCoinsCommitted||0).toLocaleString()}</td></tr>) : <tr><td colSpan="12" style={{opacity:.65}}>No per-fight analytics are available from the server or this browser. Existing fight records are not deleted.</td></tr>}
   </tbody></table></div>
  </section>
 </div>;
}
export default function RevenuePage(){return <AdminPrivateRoute><RevenueCommandCenter/></AdminPrivateRoute>}
