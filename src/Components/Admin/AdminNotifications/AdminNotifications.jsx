import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { adminHeaders } from '@/Utils/authFetch';
import styles from './AdminNotifications.module.css';

const API = 'https://fantasymmadness-game-server-three.vercel.app';
const safeLink = (n) => {
  const value = n.actionUrl || n.action_url || n.link;
  return typeof value === 'string' && /^\/administration\/[a-zA-Z0-9/_?=&%-]+$/.test(value) && !value.startsWith('//') ? value : null;
};
const category = (n) => {
  const title = String(n.title || '').toLowerCase();
  const severity = String(n.severity || n.level || '').toLowerCase();
  const details = String(n.message || n.description || '').toLowerCase();
  const status = String(n.status || n.incidentStatus || '').toLowerCase();
  if (['resolved','closed','fixed','success','completed'].includes(status)) return 'history';
  if (/^(new fight|fight added|fight updated|fight deleted|user deleted|shadow fight deleted|new user|user verified|affiliate auto-approved|affiliate approved|match added|match updated)/.test(title) && !/failed|error|problem/.test(title + ' ' + details)) return 'history';
  if (['critical','fatal','error'].includes(severity) || /failed|failure|outage|security breach|payment error|payout error|scoring error|publishing error/.test(title)) return 'critical';
  if (['warning','review','action_required'].includes(severity) || /pending approval|requires review|needs review|flagged|dispute|requires action/.test(title)) return 'review';
  // Do not manufacture an alert merely because an activity event exists.
  if (/failed|error/.test(details) && /publish|payment|scor|delivery|security/.test(details)) return 'review';
  return 'history';
};
const detailsText = (n) => String(n.message || n.description || n.details || '').trim();
const AdminNotifications = () => {
  const [items, setItems] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [incidentError, setIncidentError] = useState('');
  const [view, setView] = useState('alerts');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState(null);
  const [authFailed, setAuthFailed] = useState(false);
  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetch(API + '/api/notifications', {headers:adminHeaders(),cache:'no-store'});
      if (!res.ok) {
        setAuthFailed(res.status === 401 || res.status === 403);
        throw new Error(res.status === 401 || res.status === 403 ? 'Admin session expired. Sign in again.' : 'Notification service returned HTTP ' + res.status);
      }
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Notification service returned invalid data.');
      setItems(data.filter((n) => n && n._id));
      try {
        const incidentRes = await fetch(API + '/api/admin/incidents', {headers:adminHeaders(),cache:'no-store'});
        if (!incidentRes.ok) throw new Error('Incident service returned HTTP ' + incidentRes.status);
        const incidentData = await incidentRes.json();
        if (!Array.isArray(incidentData.incidents)) throw new Error('Invalid incident response');
        setIncidents(incidentData.incidents);
        setIncidentError('');
      } catch (incidentFailure) {
        setIncidents([]);
        setIncidentError(incidentFailure.message || 'Incident service unavailable');
      }
      setLastChecked(new Date());
      setError('');
      setAuthFailed(false);
    } catch (e) {
      setError(e.message || 'Unable to contact notification service.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(true); const timer = setInterval(() => load(false), 60000); return () => clearInterval(timer); }, [load]);
  const counts = {critical:0,review:0,history:0};
  items.forEach((n) => { counts[category(n)] += 1; });
  const alerts = counts.critical + counts.review + incidents.length;
  const shown = items.filter((n) => view === 'alerts' ? category(n) !== 'history' : category(n) === view);
  const markRead = async (n) => {
    try {
      const res = await fetch(API + '/api/notifications/' + encodeURIComponent(n._id) + '/read', {method:'PATCH',headers:adminHeaders()});
      if (!res.ok) throw new Error('Server could not mark this event as read.');
      setItems((prev) => prev.map((item) => item._id === n._id ? {...item,read:true} : item));
    } catch (e) { setError(e.message); }
  };
  return <div className={styles.notificationContainer}>
    <h2 className={styles.heading}>System Health & Action Center</h2>
    <p style={{color:'#bac6d5',marginBottom:20}}>Only problems and required actions appear in this workspace. Successful events are hidden from alerts and retained in the existing event history.</p>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:18}}>
      <div style={{flex:'1 1 190px',padding:16,border:'1px solid #485365',borderRadius:10,background:'#172131'}}>
        <div style={{color:'#cbd5e1',fontSize:13}}>Notification API</div>
        <strong style={{color:error ? '#ffb65b' : lastChecked ? '#7ce0a2' : '#cbd5e1'}}>{error ? 'Check failed' : lastChecked ? 'Responding' : 'Checking…'}</strong>
        <div style={{fontSize:12,color:'#aab8cc'}}>Only this service is actively checked</div>
      </div>
      <div style={{flex:'1 1 160px',padding:16,border:'1px solid #485365',borderRadius:10,background:'#172131'}}>
        <div style={{color:'#cbd5e1',fontSize:13}}>Critical events</div><strong style={{fontSize:25}}>{error ? '—' : counts.critical}</strong>
      </div>
      <div style={{flex:'1 1 160px',padding:16,border:'1px solid #485365',borderRadius:10,background:'#172131'}}>
        <div style={{color:'#cbd5e1',fontSize:13}}>Review events</div><strong style={{fontSize:25}}>{error ? '—' : counts.review}</strong>
      </div>

    </div>
    <p style={{fontSize:12,color:'#aab8cc',marginBottom:14}}>Routine event history is excluded from this problem-only dashboard. Fight publishing, scoring, payments, payouts, email and other services are <strong>not yet monitored</strong> by this page. A zero count does not mean every system is healthy.</p>
    <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center',marginBottom:20}}>
      {[['alerts','Action required',alerts],['critical','Critical',counts.critical],['review','Needs review',counts.review]].map(([key,label,count]) =>
        <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)}
          style={{border:'1px solid #596474',borderRadius:8,padding:'9px 12px',background:view === key ? '#b71927' : '#202b3a',color:'white',cursor:'pointer'}}>{label} ({count})</button>
      )}
      <button type="button" onClick={() => load(false)} disabled={refreshing} style={{padding:'9px 12px',borderRadius:8,background:'#344156',color:'white',border:'1px solid #64748b',cursor:'pointer'}}>{refreshing ? 'Checking…' : 'Check now'}</button>
    </div>
    {incidentError && <p role="alert" style={{color:'#ffbd71'}}>Structured incident monitoring unavailable: {incidentError}. Legacy notifications may not include direct links.</p>}
    {incidents.length > 0 && <div style={{marginBottom:20}}><h3>Verified incidents ({incidents.length})</h3>{incidents.map((incident) => <div key={incident._id} style={{padding:14,marginBottom:10,border:'1px solid #d98b31',borderRadius:8,background:'#1a2636'}}><strong>{incident.title}</strong><p>{incident.description}</p><p>Affected {incident.affectedType}: {incident.affectedId} · {incident.status}</p>{safeLink(incident) && <Link href={safeLink(incident)} style={{color:'#fff',background:'#ad1524',padding:'9px 12px',borderRadius:7,display:'inline-block'}}>Open exact affected record →</Link>}</div>)}</div>}
    {lastChecked && <p style={{fontSize:12,color:'#9eafc4'}}>Last checked: {lastChecked.toLocaleString()} · Refreshes every 60 seconds while open</p>}
    {error && <div role="alert" className={styles.statusMessage}><strong>Monitoring unavailable:</strong> {error} {authFailed && <Link href="/administration/login?reason=session-expired&next=%2Fadministration%2Fnotifications">Sign in</Link>}</div>}
    {loading && <p role="status">Checking notification service…</p>}
    {!loading && !error && shown.length === 0 && <p role="status" style={{padding:24,background:'#172131',borderRadius:10}}>No events in this category. This does not confirm that unmonitored services are healthy.</p>}
    <ul className={styles.notificationList}>
      {!loading && shown.map((n) => {
        const type = category(n);
        const action = safeLink(n);
        const message = detailsText(n);
        const hasAction = Boolean(action && message);
        return <li key={n._id} className={styles.notificationItem} style={{borderLeft:'4px solid ' + (type === 'critical' ? '#e52e40' : type === 'review' ? '#f0b43b' : '#3e9c79'),alignItems:'stretch',flexDirection:'column'}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:'.06em',color:type === 'critical' ? '#ff7882' : type === 'review' ? '#f5c45a' : '#8bdbad'}}>{type === 'critical' ? 'CRITICAL EVENT' : type === 'review' ? 'REVIEW EVENT' : 'ACTIVITY HISTORY'}</div>
              <div style={{fontWeight:800,overflowWrap:'anywhere'}}>{String(n.title || 'Untitled event')}</div>
              <div style={{fontSize:12,color:'#b3c0d0'}}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Time unavailable'} · {n.read ? 'Read' : 'Unread'}</div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <button type="button" onClick={() => setExpanded(expanded === n._id ? null : n._id)} style={{background:'#2a394d',color:'white',border:'1px solid #64748b',borderRadius:7,padding:'8px 12px',cursor:'pointer'}}>{expanded === n._id ? 'Hide investigation' : 'Investigate'}</button>
              {!n.read && <button type="button" onClick={() => markRead(n)} style={{background:'transparent',color:'#d4dfed',border:'1px solid #64748b',borderRadius:7,padding:'8px 12px',cursor:'pointer'}}>Mark read</button>}
            </div>
          </div>
          {expanded === n._id && <div style={{borderTop:'1px solid #455268',paddingTop:12,color:'#dce5ef',fontSize:14}}>
            <div><strong>Recorded event:</strong> {String(n.title || 'Unknown')}</div>
            <div style={{marginTop:6}}><strong>Diagnostic details:</strong> {message || 'No diagnostic details were supplied by the server.'}</div>
            <div style={{marginTop:6}}><strong>Next step:</strong> {type === 'history' ? 'No action required by this event alone.' : hasAction ? 'Open the specific linked record and investigate the reported issue.' : 'This event lacks a verified record link or diagnostic detail. It cannot be resolved from this alert yet.'}</div>
            {hasAction && <Link href={action} style={{display:'inline-block',marginTop:10,padding:'8px 12px',background:'#b71927',borderRadius:7,color:'white',textDecoration:'none'}}>Open affected record →</Link>}
            <div style={{marginTop:8,fontSize:12,color:'#aebed0'}}>Mark read only acknowledges the event; it does not resolve a problem.</div>
          </div>}
        </li>;
      })}
    </ul>
  </div>;
};
export default AdminNotifications;
