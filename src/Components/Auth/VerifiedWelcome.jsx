import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaArrowRight, FaCheckCircle, FaTimes } from 'react-icons/fa';

// One-time welcome shown on the Player Dashboard right after a new player verifies
// their email and is signed in (see /verified). Works on top of either dashboard view
// (the full-screen app or the website page), on desktop and mobile.
const WELCOME_KEY = 'fmm_verified_welcome';

export default function VerifiedWelcome() {
  const router = useRouter();
  const [welcome, setWelcome] = useState(null);

  useEffect(() => {
    if (!router.isReady || router.pathname !== '/UserDashboard' || router.query.welcome !== 'verified') { setWelcome(null); return; }
    let saved = {};
    try { saved = JSON.parse(window.sessionStorage.getItem(WELCOME_KEY) || 'null') || {}; } catch (_ignored) { saved = {}; }
    const returnTo = String(saved.returnTo || '');
    setWelcome({ returnTo: returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '', returnLabel: String(saved.returnLabel || '') });
  }, [router.isReady, router.pathname, router.query.welcome]);

  if (!welcome) return null;
  const close = () => {
    try { window.sessionStorage.removeItem(WELCOME_KEY); } catch (_ignored) { /* ignore */ }
    setWelcome(null);
    router.replace('/UserDashboard', undefined, { shallow: true });
  };
  const toFight = welcome.returnTo.startsWith('/fight/');
  const primaryHref = toFight ? welcome.returnTo : '/fights';
  const primaryLabel = toFight ? (welcome.returnLabel || 'Continue to your fight') : 'Start predicting';

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="fmm-verified-welcome-title"
      style={{ position: 'fixed', left: 0, right: 0, top: 12, zIndex: 2147483000, display: 'flex', justifyContent: 'center', padding: '0 12px', pointerEvents: 'none' }}>
      <section style={{ pointerEvents: 'auto', width: 'min(560px, 100%)', boxSizing: 'border-box', background: '#10141b', color: '#fff', border: '1px solid rgba(47,191,113,.65)', borderRadius: 16, boxShadow: '0 18px 50px rgba(0,0,0,.55)', padding: '18px 18px 16px', position: 'relative' }}>
        <button type="button" onClick={close} aria-label="Close welcome" style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 0, color: '#bbb', fontSize: 18, cursor: 'pointer' }}><FaTimes /></button>
        <h2 id="fmm-verified-welcome-title" style={{ margin: '0 28px 6px 0', fontSize: 20, lineHeight: 1.25, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <FaCheckCircle style={{ color: '#2fbf71', flex: '0 0 auto', marginTop: 3 }} /> Email Verified — Welcome to FANTASY MMADNESS
        </h2>
        <p style={{ margin: '0 0 14px', color: '#d8d8de', fontSize: 15 }}>You are signed in and your account is ready. Make your first predictions now.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={primaryHref} onClick={() => { try { window.sessionStorage.removeItem(WELCOME_KEY); } catch (_ignored) { /* ignore */ } }}
            style={{ background: '#e11d2e', color: '#fff', fontWeight: 800, padding: '11px 16px', borderRadius: 10, textDecoration: 'none', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            {primaryLabel} <FaArrowRight />
          </Link>
          {welcome.returnTo && !toFight ? (
            <Link href={welcome.returnTo} style={{ border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontWeight: 700, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              {welcome.returnLabel || 'Continue to your league'} <FaArrowRight />
            </Link>
          ) : null}
          <button type="button" onClick={close} style={{ border: '1px solid rgba(255,255,255,.3)', background: 'transparent', color: '#fff', fontWeight: 700, padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Explore my dashboard</button>
        </div>
      </section>
    </div>
  );
}
