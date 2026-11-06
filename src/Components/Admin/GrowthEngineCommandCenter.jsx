import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { GROWTH_ENGINE_V2, GROWTH_SECTIONS } from '@/Utils/adminFeatures';
import { GROWTH_ENGINE_URL, growthEngineApi, growthToken } from '@/Utils/growthEngineApi';
import { engineLocation, trustedConsoleMessage, sectionTarget, consoleFrameHeight } from '@/Utils/growthEngineEmbed.cjs';
import styles from './GrowthEngineCommandCenter.module.css';
import GrowthAffiliateAcceptance from './GrowthAffiliateAcceptance';
import GrowthAutonomyControls from './GrowthAutonomyControls';

const SLUGS = new Set(GROWTH_SECTIONS.map(s => s.slug));
const legacyHrefFor = slug => slug === 'overview' ? '/administration/growth-engine' : `/administration/growth-engine/${slug}`;
const engine = engineLocation(GROWTH_ENGINE_URL);

// This is the existing console, not a second implementation of its departments.
export default function GrowthEngineCommandCenter({ growthRoute = false }) {
  const router = useRouter();
  const authenticated = useSelector(state => Boolean(state.adminAuth?.isAdminAuthenticated));
  const fightContext = typeof router.query.fightId === 'string' ? router.query.fightId : '';
  const hrefFor = useCallback(slug => growthRoute ? `/administration/growth?engine=${slug}${fightContext ? `&fightId=${encodeURIComponent(fightContext)}` : ''}` : legacyHrefFor(slug), [growthRoute, fightContext]);
  const requested = growthRoute ? router.query.engine : Array.isArray(router.query.section) ? router.query.section[0] : '';
  const section = SLUGS.has(requested) ? requested : 'overview';
  const [mounted, setMounted] = useState(false);
  const [reach, setReach] = useState('checking');
  const [confirmed, setConfirmed] = useState(false);
  const [frameHeight, setFrameHeight] = useState(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [session, setSession] = useState('connecting');
  const verifiedToken = useRef('');
  const frame = useRef(null);
  const handover = useRef(false);
  const lastRenew = useRef(0);
  const sessionState = useRef('connecting');
  const enabled = GROWTH_ENGINE_V2 && mounted && router.isReady && authenticated && Boolean(engine);
  const baseTarget = sectionTarget(section, GROWTH_SECTIONS);
  const target = growthRoute && /^[a-f\d]{24}$/i.test(fightContext) && ['marketing','posters','approvals'].includes(section) ? `${baseTarget}${baseTarget.includes('?') ? '&' : '?'}fightId=${encodeURIComponent(fightContext)}` : baseTarget;
  const src = engine ? `${engine.consoleUrl}?embed=1#/${target}` : '';

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { sessionState.current = session; }, [session]);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const controller = new AbortController();
    setReach('checking');
    // A health failure may be CORS, a proxy or disabled optional capabilities.
    // None of those proves that a top-level iframe navigation cannot load.
    growthEngineApi.health({ signal: controller.signal }).then(() => {
      if (alive) setReach('ok');
    }).catch(error => {
      if (alive && error.name !== 'AbortError') setReach('unavailable');
    });
    const timer = window.setTimeout(() => { if (alive) setSlow(true); }, 15000);
    return () => { alive = false; controller.abort(); window.clearTimeout(timer); };
  }, [enabled, attempt]);

  const handOverSession = useCallback(async () => {
    if (!enabled || handover.current || !frame.current?.contentWindow) return;
    // refused administrator: the console (loaded now) must not keep an earlier session
    if (sessionState.current === 'rejected') { try { frame.current.contentWindow.postMessage({ type: 'fmm-growth-logout' }, engine.origin); } catch (_) { /* ignore */ } return; }
    const token = growthToken.get();
    if (!token) return;
    handover.current = true;
    try {
      // Never send a browser admin-login token. Only a Growth token that the
      // existing isolated backend independently accepts can reach the iframe.
      if (verifiedToken.current !== token) await growthEngineApi.session();
      if (growthToken.get() === token && frame.current?.contentWindow) {
        frame.current.contentWindow.postMessage({ type: 'fmm-growth-session', token }, engine.origin);
      }
    } catch (_) { growthToken.set(''); }
    finally { handover.current = false; }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    let expiryTimer;
    const controller = new AbortController();
    sessionState.current = 'connecting';
    setSession('connecting');
    growthEngineApi.exchangeAdminSession({ signal: controller.signal }).then(result => {
      if (!alive) return;
      verifiedToken.current = result.token;
      setSession('connecting'); // The embedded console must independently accept this session.
      handOverSession();
      expiryTimer = window.setTimeout(() => { growthToken.set(''); verifiedToken.current = ''; lastRenew.current = Date.now(); setAttempt(value => value + 1); }, Math.max(0, result.expiresAt - Date.now() - 30000));
    }).catch(error => {
      if (!alive || error.name === 'AbortError') return;
      growthToken.set('');
      verifiedToken.current = '';
      const rejected = error.status === 401 || error.status === 403;
      sessionState.current = rejected ? 'rejected' : 'unavailable';
      setSession(sessionState.current);
      // a refused administrator must not keep an earlier console session in this tab
      if (rejected) { try { frame.current?.contentWindow?.postMessage({ type: 'fmm-growth-logout' }, engine.origin); } catch (_) { /* ignore */ } }
    });
    // tell the console to revoke and forget its copy before the frame is removed
    const onLogout = () => { try { frame.current?.contentWindow?.postMessage({ type: 'fmm-growth-logout' }, engine.origin); } catch (_) { /* ignore */ } verifiedToken.current = ''; setSession('expired'); };
    window.addEventListener('fmm-growth-logout', onLogout);
    return () => { alive = false; controller.abort(); window.clearTimeout(expiryTimer); window.removeEventListener('fmm-growth-logout', onLogout); };
  }, [enabled, attempt, handOverSession]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onMessage = event => {
      if (!trustedConsoleMessage(event, engine.origin, frame.current?.contentWindow)) return;
      if (event.data.event === 'resize') { const height = consoleFrameHeight(event.data.height); if (height !== null) setFrameHeight(height); return; }
      setConfirmed(true);
      setSlow(false);
      const incoming = event.data.section;
      if (event.data.event === 'session-ready' && event.data.signedIn && verifiedToken.current && growthToken.get() === verifiedToken.current) { sessionState.current = 'connected'; setSession('connected'); }
      // console session protocol: signed out inside the console -> stay signed out; ended/revoked -> renew from the administrator session
      // the administrator session was not accepted: the console must not stay signed in with an earlier session
      if (event.data.signedIn && !verifiedToken.current && sessionState.current === 'rejected') { try { frame.current?.contentWindow?.postMessage({ type: 'fmm-growth-logout' }, engine.origin); } catch (_) { /* ignore */ } return; }
      if (event.data.event === 'signed-out') { growthToken.set(''); verifiedToken.current = ''; if (sessionState.current !== 'rejected') setSession('expired'); return; }
      if (event.data.event === 'session-expired') { growthToken.set(''); verifiedToken.current = ''; if (Date.now() - lastRenew.current < 30000) { setSession('expired'); return; } lastRenew.current = Date.now(); setAttempt(value => value + 1); return; }
      if (incoming === 'signin') { if (verifiedToken.current && !growthToken.get()) setSession('expired'); else handOverSession(); return; }
      // Posters are the original Marketing poster workflow, not another page.
      if (section === 'posters' && incoming === 'marketing') return;
      if (SLUGS.has(incoming) && incoming !== section) router.replace(hrefFor(incoming), undefined, { shallow: true });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [enabled, handOverSession, router, section, hrefFor]);

  if (!GROWTH_ENGINE_V2) return <main className={styles.page} data-testid="ge-disabled"><p>The Growth Engine is turned off. <Link href="/administration">Back to administration</Link></p></main>;
  if (!mounted || !router.isReady || !authenticated) return <main className={styles.page}><p role="status">Checking administrator session…</p></main>;
  if (!engine) return <main className={styles.page}><p role="alert">The Growth Engine address is not configured securely. Contact the staging administrator.</p></main>;

  const retry = () => { setConfirmed(false); setSlow(false); setAttempt(value => value + 1); };
  return (
    <main className={styles.page} data-testid="growth-engine-command-center">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>FANTASY MMADNESS · GROWTH ENGINE</span>
          <h1>Growth Engine</h1>
          <p className={styles.muted}>The original Growth Engine console. Staging delivery controls and campaign approvals remain enforced.</p>
        </div>
        <a className={styles.linkButton} href={`${engine.consoleUrl}#/${target}`} target="_blank" rel="noopener noreferrer">Open in a new tab <FaExternalLinkAlt aria-hidden="true" /></a>
      </header>
      <nav className={styles.tabs} aria-label="Growth Engine sections">
        {GROWTH_SECTIONS.map(s => <Link key={s.slug} href={hrefFor(s.slug)} shallow className={`${styles.tab} ${s.slug === section ? styles.tabActive : ''}`} aria-current={s.slug === section ? 'page' : undefined} data-testid={`ge-tab-${s.slug}`}>{s.label}</Link>)}
      </nav>
      {reach === 'checking' && !confirmed && <p className={styles.muted} role="status">Opening the Growth Engine…</p>}
      {(reach === 'unavailable' || slow) && !confirmed && <section className={styles.notice} data-testid="ge-connection-notice" role="status">
        <p>{slow ? 'The console has not confirmed that it is ready.' : 'The status check is unavailable. The console can still open below.'} If it does not open, retry or use the secure new-tab link.</p>
        <button type="button" className={styles.linkButton} onClick={retry}>Retry connection</button>
      </section>}
      {['unavailable', 'rejected', 'expired'].includes(session) && <section className={styles.notice} data-testid="ge-session-notice" role="status">
        <p>{session === 'unavailable' ? 'The secure administrator connection is not configured or is temporarily unavailable. Existing console access remains below.' : session === 'rejected' ? 'Your administrator session was not accepted by the Growth Engine.' : 'Your Growth Engine session ended.'}</p>
        <button type="button" className={styles.linkButton} onClick={retry}>Reconnect administrator session</button>
        {session === 'rejected' && <Link href={`/administration/login?next=${encodeURIComponent(hrefFor(section))}`}>Sign in again</Link>}
      </section>}
      {session === 'connected' && section === 'automation' && <GrowthAutonomyControls />}
      {session === 'connected' && section === 'affiliates' && process.env.NEXT_PUBLIC_GROWTH_AFFILIATE_ACCEPTANCE_ENABLED === 'true' && <GrowthAffiliateAcceptance />}
      {session !== 'expired' && <iframe key={`${attempt}:${target}`} ref={frame} className={styles.frame} src={src} style={frameHeight ? { height: `${frameHeight}px`, minHeight: 0 } : undefined}
        title={`Growth Engine — ${GROWTH_SECTIONS.find(s => s.slug === section)?.label}`}
        data-testid="ge-frame" referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        allow="clipboard-write" onLoad={handOverSession} />}
    </main>
  );
}
