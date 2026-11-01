import React, { useCallback, useEffect, useState } from 'react';
import { FaExternalLinkAlt, FaSyncAlt } from 'react-icons/fa';
import { GROWTH_CONSOLE_URL, GROWTH_ENGINE_URL, growthEngineApi, growthToken } from '@/Utils/growthEngineApi';
import styles from './GrowthEngineBridge.module.css';

const SPORT = { boxing: 'Boxing', 'mma-ufc': 'MMA / UFC', kickboxing: 'Kickboxing', 'bare-knuckle': 'Bare-Knuckle', 'pro-wrestling': 'Pro Wrestling' };
const KIND = { marketing: 'Fight post', pr: 'PR email', affiliate: 'Affiliate invite' };
const consoleLink = (section) => `${GROWTH_CONSOLE_URL}#/${section}`;

function OpenConsole({ section = 'overview', children }) {
  return <a className={styles.linkButton} href={consoleLink(section)} target="_blank" rel="noopener noreferrer">{children} <FaExternalLinkAlt aria-hidden="true" /></a>;
}

export default function GrowthEngineBridge() {
  const [phase, setPhase] = useState('checking'); // checking | unreachable | signin | ready
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      await growthEngineApi.health();
    } catch (e) {
      if (e.unreachable) { setPhase('unreachable'); return; }
    }
    if (!growthToken.get()) { setPhase('signin'); return; }
    try {
      const [status, funnel, pending, alerts, social] = await Promise.all([growthEngineApi.status(), growthEngineApi.funnel(), growthEngineApi.pending(), growthEngineApi.alerts(), growthEngineApi.social()]);
      setData({ status, funnel: funnel.funnel, pending: pending.drafts || [], alerts: alerts.alerts || [], social });
      setPhase('ready');
    } catch (e) {
      if (e.status === 401) { setPhase('signin'); return; }
      if (e.unreachable) { setPhase('unreachable'); return; }
      setError(e.message); setPhase('ready');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const signIn = async (event) => {
    event.preventDefault(); setBusy('signin'); setError('');
    try { await growthEngineApi.login(password); setPassword(''); await load(); }
    catch (e) { setError(e.unreachable ? 'The Growth Engine could not be reached.' : e.message); }
    finally { setBusy(''); }
  };
  const act = async (key, fn, done) => {
    setBusy(key); setError('');
    try { await fn(); if (done) done(); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>FANTASY MMADNESS · GROWTH ENGINE (STAGING)</span>
          <h1>Growth Engine</h1>
          <p>Fight campaigns, PR and affiliate outreach, publishing and results from the isolated Growth Engine. Nothing here changes the live website, payments or player data.</p>
        </div>
        <div className={styles.headerActions}>
          {phase === 'ready' && <button type="button" className={styles.secondary} onClick={load} disabled={Boolean(busy)}><FaSyncAlt aria-hidden="true" /> Refresh</button>}
          <OpenConsole>Open full Growth Engine console</OpenConsole>
        </div>
      </header>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {phase === 'checking' && <p className={styles.muted}>Connecting to the Growth Engine…</p>}

      {phase === 'unreachable' && (
        <section className={styles.card}>
          <h2>Open the Growth Engine in its own tab</h2>
          <p>This page cannot reach the Growth Engine directly yet, because its staging address ({GROWTH_ENGINE_URL}) is protected by Vercel sign-in. Use the button below: it opens the full console in a new tab, where you sign in with the Growth Engine password.</p>
          <OpenConsole>Open Growth Engine console</OpenConsole>
        </section>
      )}

      {phase === 'signin' && (
        <section className={styles.card}>
          <h2>Sign in to the Growth Engine</h2>
          <p>The Growth Engine has its own owner password (separate from this admin login).</p>
          <form onSubmit={signIn} className={styles.signin}>
            <label htmlFor="growth-password">Growth Engine password</label>
            <input id="growth-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className={styles.primary} disabled={busy === 'signin'}>{busy === 'signin' ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </section>
      )}

      {phase === 'ready' && data && (
        <>
          <section className={`${styles.banner} ${data.status.scheduler.healthy ? styles.good : styles.warn}`}>
            <strong>{data.status.scheduler.healthy ? 'Running automatically.' : 'No automatic run in the last 35 minutes.'}</strong>{' '}
            Last run: {data.status.scheduler.lastRunAt ? new Date(data.status.scheduler.lastRunAt).toLocaleString() : '—'} · {data.status.scheduler.runsLast24h} runs in 24 hours · email sending {data.status.delivery.realDelivery ? 'ON' : 'OFF'}
          </section>

          <section className={styles.card}>
            <h2>Campaign funnel</h2>
            <div className={styles.funnel}>
              {data.funnel.stages.map((s) => (
                <div key={s.key} className={styles.stage}>
                  <span className={styles.stageLabel}>{s.label}</span>
                  <strong className={styles.stageValue}>{s.connected === false && !s.value ? '—' : Number(s.value).toLocaleString()}</strong>
                  <span className={styles.muted}>{s.source}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><h2>Waiting for your approval ({data.pending.length})</h2><OpenConsole section="approvals">Review all</OpenConsole></div>
            {data.pending.length === 0 ? <p className={styles.muted}>Nothing is waiting for approval.</p> : (
              <ul className={styles.list}>
                {data.pending.map((d) => (
                  <li key={d.id} className={styles.item}>
                    <div>
                      <span className={styles.chip}>{KIND[d.kind] || d.kind}</span> <span className={styles.chip}>{SPORT[d.genre] || d.genre}</span>
                      <div className={styles.itemTitle}>{d.kind === 'marketing' ? d.headline : d.subject}</div>
                      {d.kind === 'marketing' && d.contest && <div className={styles.muted}>Verified contest: {d.contest.fighterA} vs {d.contest.fighterB} · {d.contest.dateKey}</div>}
                      {d.kind !== 'marketing' && <div className={styles.muted}>To: {d.recipient}</div>}
                    </div>
                    <div className={styles.itemActions}>
                      <button type="button" className={styles.approve} disabled={Boolean(busy)} onClick={() => act(`a:${d.id}`, () => growthEngineApi.approve(d.id))}>{busy === `a:${d.id}` ? 'Approving…' : 'Approve'}</button>
                      <button type="button" className={styles.danger} disabled={Boolean(busy)} onClick={() => act(`r:${d.id}`, () => growthEngineApi.reject(d.id, 'Rejected from the admin back office'))}>Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHead}><h2>Publishing</h2><OpenConsole section="publishing">Open</OpenConsole></div>
              <p>{data.social.paused?.paused ? 'Paused: nothing will be posted.' : `${(data.social.posts || []).length} post(s) scheduled.`} Mode: {data.social.provider}.</p>
              <button type="button" className={data.social.paused?.paused ? styles.approve : styles.danger} disabled={Boolean(busy)} onClick={() => act('pause', () => growthEngineApi.setPaused(!data.social.paused?.paused))}>
                {data.social.paused?.paused ? 'Resume publishing' : 'Pause all publishing'}
              </button>
            </div>
            <div className={styles.card}>
              <div className={styles.cardHead}><h2>Alerts</h2><OpenConsole section="automation">Open</OpenConsole></div>
              <p>{data.alerts.length ? `${data.alerts.length} open alert(s) need a look.` : 'No open alerts.'}</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardHead}><h2>Affiliates</h2><OpenConsole section="affiliates">Open</OpenConsole></div>
              <p>{data.funnel.affiliates.active} active · {data.funnel.affiliates.invited} invited · {data.funnel.affiliates.invite_prepared} invitation(s) approved</p>
            </div>
          </section>

          <p className={styles.muted}>Signed in to the Growth Engine for this browser tab. <button type="button" className={styles.textButton} onClick={() => { growthEngineApi.logout(); setPhase('signin'); }}>Sign out of the Growth Engine</button></p>
        </>
      )}
    </main>
  );
}
