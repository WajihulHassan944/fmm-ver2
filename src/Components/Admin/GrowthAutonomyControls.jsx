import React, { useCallback, useEffect, useState } from 'react';
import { growthEngineApi } from '@/Utils/growthEngineApi';
import styles from './GrowthEngineCommandCenter.module.css';
const departments = [['marketing', 'Marketing'], ['pr', 'Public relations'], ['affiliate', 'Affiliate recruitment']];
export default function GrowthAutonomyControls() {
  const [data, setData] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [edited, setEdited] = useState(false);
  const load = useCallback(async () => {
    try { const r = await growthEngineApi.autonomy(); if (!r.policy || !r.queue || !Number.isInteger(r.policy.version) || !Array.isArray(r.policy.departments) || !Array.isArray(r.policy.genres) || !Array.isArray(r.policy.channels) || !Array.isArray(r.policy.approvedRecipients)) throw new Error('The Growth Engine returned an incomplete automation status.'); setData(r); if (!edited) setPolicy(r.policy); setError(''); }
    catch (e) { setError(e.status === 404 ? 'Automation controls are not available on this Growth Engine deployment yet.' : e.message || 'Could not load automation status.'); }
  }, [edited]);
  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [load]);
  const change = (key, value) => { setEdited(true); setPolicy(p => ({ ...p, [key]: value })); };
  const save = async event => {
    event.preventDefault(); if (!data?.scheduler?.generation && policy.enabled && confirmation !== 'ENABLE AUTONOMY') { setError('Type ENABLE AUTONOMY to approve this policy.'); return; }
    setBusy(true); setError('');
    try { const r = await growthEngineApi.saveAutonomy(policy, policy.version); setData(d => ({ ...d, policy: r.policy })); setPolicy(r.policy); setEdited(false); setConfirmation(''); }
    catch (e) { setError(e.message || 'The owner policy was not saved.'); }
    finally { setBusy(false); }
  };
  const stop = async () => {
    setBusy(true); setError('');
    try { const r = await growthEngineApi.stopAutonomy(); setData(d => ({ ...d, policy: r.policy })); setPolicy(r.policy); setEdited(false); }
    catch (e) { setError(e.message || 'The emergency stop could not be confirmed.'); }
    finally { setBusy(false); }
  };
  return <section className={`${styles.card} ${styles.autonomy}`} data-testid="autonomy-controls" aria-label="Autonomous Growth owner controls">
    <h2>Autonomous Growth operation</h2>
    <p>Scheduled sandbox preparation, pending jobs and owner approval policy.</p>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">Loading recorded worker and policy status…</p>}
    {data && policy && <>
      {data.scheduler?.generation && <div data-testid="autonomy-scheduler">
        <p><strong>{data.policy.paused || data.scheduler.preparationPaused ? 'Scheduled preparation paused' : !data.scheduler.schedulerEnabled ? 'Scheduled preparation stopped' : data.scheduler.healthy ? 'Scheduled sandbox preparation active' : 'Scheduled worker needs attention'}</strong> · {data.scheduler.schedule} · generation {data.scheduler.generation}</p>
        <p>Completed scheduled runs in this generation: {data.scheduler.generationScheduledExecutions || 0}. Last scheduled run: {data.scheduler.lastScheduledAt || 'Not yet verified'}. Next wake: {data.scheduler.nextWakeAt || 'Unavailable'}.</p>
        <p>Campaigns await owner approval. Scheduled run history is separate from pending background jobs; an empty queue does not mean the scheduler is off.</p>
      </div>}
      <p data-testid="autonomy-state"><strong>{data.policy.paused ? 'Emergency stop active' : data.scheduler?.generation ? 'Owner approval required' : data.policy.enabled ? 'Owner policy enabled' : 'Automatic approval is off'}</strong> · {data.policy.mode} · policy version {data.policy.version}</p>
      <p data-testid="autonomy-heartbeat">{data.heartbeat ? `Last worker observation: ${data.heartbeat.at} (${data.heartbeat.healthy ? 'recent' : 'stale'})` : 'No worker heartbeat has been recorded.'}</p>
      <p>Pending background jobs (not scheduled runs): {data.queue.pending} pending · {Number.isInteger(data.queue.retrying) ? `${data.queue.retrying} retrying` : 'retry count unavailable'} · {data.queue.running} running · {data.queue.failed} failed. Paid advertising/spend is disabled.</p>
      {data.operations && <div data-testid="owner-preparation-summary">
        <p><strong>Preparation only — no messages sent or posts published.</strong></p>
        {departments.map(([id,label]) => { const d = data.operations.departments[id]; return <p key={id}>{label}: {d.awaitingOwnerReview} awaiting owner review · {d.ready} ready · {d.held} held · {d.receipts} preparation receipts.</p>; })}
        <p>Receipts record prepared evidence, not delivery, approval or paying conversions. Source failures retry with bounded backoff; exhausted attempts cool down before another automatic attempt.</p>
      </div>}
      <p>A recent heartbeat is not proof of 24/7 uptime. Emergency stop prevents new work; requests already accepted by a provider cannot be unsent.</p>
      {data.lastCycle && <p>Last policy cycle: {data.lastCycle.at} · {data.lastCycle.approved.length} approved · {data.lastCycle.held.length} held for review.</p>}
      {data.ownerPolicyEditable === false && <p>Policy changes require an explicitly configured automation owner. Read-only status remains available.</p>}
      <details><summary>Review automation policy</summary><form onSubmit={save} className={styles.policyForm}>
        {!data.scheduler?.generation && <label><input type="checkbox" checked={policy.enabled} disabled={busy || data?.ownerPolicyEditable === false} onChange={e => change('enabled', e.target.checked)} /> Enable unattended processing under this policy</label>}
        <label><input type="checkbox" checked={policy.paused} disabled={busy || data?.ownerPolicyEditable === false} onChange={e => change('paused', e.target.checked)} /> Pause all engine work</label>
        <label>Delivery mode <select value={policy.mode} disabled={busy || data?.ownerPolicyEditable === false} onChange={e => change('mode', e.target.value)}><option value="sandbox">Sandbox — no real delivery</option><option value="approved-delivery" disabled={!data.liveApproved}>Previously authorized live delivery</option></select></label>
        <fieldset><legend>Departments</legend>{departments.map(([id,label]) => <label key={id}><input type="checkbox" checked={policy.departments.includes(id)} disabled={busy || data?.ownerPolicyEditable === false} onChange={e => change('departments', e.target.checked ? [...policy.departments,id] : policy.departments.filter(x=>x!==id))} /> {label}</label>)}</fieldset>
        <fieldset><legend>Social channels</legend>{[['facebook','Facebook'],['instagram','Instagram'],['tiktok','TikTok'],['x','X']].map(([id,label]) => <label key={id}><input type="checkbox" checked={policy.channels.includes(id)} disabled={busy || data?.ownerPolicyEditable === false} onChange={e => change('channels', e.target.checked ? [...policy.channels,id] : policy.channels.filter(x=>x!==id))} /> {label}</label>)}</fieldset>
        <fieldset><legend>Combat sports (men and women)</legend>{[['boxing','Boxing'],['mma-ufc','MMA/UFC'],['bare-knuckle','Bare-knuckle'],['kickboxing','Kickboxing'],['pro-wrestling','Pro wrestling']].map(([id,label]) => <label key={id}><input type="checkbox" checked={policy.genres.includes(id)} disabled={busy || data?.ownerPolicyEditable === false} onChange={e => change('genres', e.target.checked ? [...policy.genres,id] : policy.genres.filter(x=>x!==id))} /> {label}</label>)}</fieldset>
        <fieldset><legend>Include active mapped affiliates (maximum 10)</legend>{(data.activeAffiliates || []).length ? data.activeAffiliates.map(a => <label key={a.id}><input type="checkbox" checked={(policy.affiliateIds || []).includes(a.id)} disabled={busy || data?.ownerPolicyEditable === false || ((policy.affiliateIds || []).length >= 10 && !(policy.affiliateIds || []).includes(a.id))} onChange={e => change('affiliateIds', e.target.checked ? [...(policy.affiliateIds || []),a.id] : policy.affiliateIds.filter(x=>x!==a.id))} /> {a.name} · {a.liveAffiliateId}</label>) : <p>No active affiliates with verified account mappings are available. The owner’s account is never substituted.</p>}</fieldset>
        <label>Campaigns and affiliate variants per department per day <input aria-label="Daily campaign limit" type="number" min="1" max="100" value={policy.maxCampaignsPerDepartmentPerDay} disabled={busy || data?.ownerPolicyEditable === false} onChange={e => change('maxCampaignsPerDepartmentPerDay', Number(e.target.value))} /></label>
        <label><input type="checkbox" checked={policy.allowPublishedBusinessContacts} disabled={busy || data?.ownerPolicyEditable === false} onChange={e => change('allowPublishedBusinessContacts', e.target.checked)} /> Permit verified public business contacts in sandbox drafts (not consent for real outreach)</label>
        <label>Explicitly authorized outreach recipients <textarea aria-label="Approved outreach recipients" rows="2" value={policy.approvedRecipients.join('\n')} disabled={busy || data?.ownerPolicyEditable === false} onChange={e => change('approvedRecipients', e.target.value.split(/[\n,]/).map(x=>x.trim()).filter(Boolean))} /></label>
        {!data.scheduler?.generation && policy.enabled && <label>Type ENABLE AUTONOMY to approve <input aria-label="Approve automation policy" value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy || data?.ownerPolicyEditable === false} autoComplete="off" /></label>}
        <div><button type="submit" className={styles.primary} disabled={busy || data?.ownerPolicyEditable === false}>Save owner policy</button></div>
      </form></details><div><button type="button" className={styles.stopButton} disabled={busy || data?.ownerPolicyEditable === false} onClick={stop}>Emergency stop</button> <button type="button" className={styles.linkButton} onClick={load} disabled={busy}>Refresh recorded status</button></div>
    </>}
  </section>;
}
