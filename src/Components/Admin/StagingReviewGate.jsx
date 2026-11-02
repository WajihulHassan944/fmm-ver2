import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { growthEngineApi, growthToken } from '@/Utils/growthEngineApi';
import { isStagingReviewPath } from '@/Utils/adminFeatures';

// Access check for the test back office (staging review mode). A valid Growth Engine
// session is required; live admin tokens are ignored. Screens that would read or change
// live data are shown as a notice instead of being opened.
export default function StagingReviewGate({ children }) {
  const router = useRouter();
  const [state, setState] = useState('checking'); // checking | ok
  const path = (router.asPath || '').split(/[?#]/)[0];

  useEffect(() => {
    if (!router.isReady) return;
    // Never keep a live admin session in the test copy.
    try { window.localStorage.removeItem('adminAuthToken'); window.localStorage.removeItem('adminToken'); } catch (_error) { /* storage disabled */ }
    const toLogin = (reason) => { window.location.replace(`/administration/login?${reason ? `reason=${reason}&` : ''}next=${encodeURIComponent(path)}`); };
    if (!growthToken.get()) { toLogin(''); return; }
    let alive = true;
    growthEngineApi.session()
      .then(() => {
        if (!alive) return;
        if (path === '/administration' || path === '/administration/') { router.replace('/administration/growth-engine'); return; }
        setState('ok');
      })
      .catch((e) => { if (!alive) return; if (e.unreachable) { setState('ok'); return; } growthToken.set(''); toLogin('session-ended'); });
    return () => { alive = false; };
  }, [router, router.isReady, path]);

  if (state !== 'ok') return <main style={{ padding: 24 }} data-testid="staging-checking"><p>Checking your test session…</p></main>;
  if (isStagingReviewPath(path)) return children;
  return (
    <main className="admin-dashboard-experience" data-testid="staging-review-notice" style={{ padding: 24, maxWidth: 760 }}>
      <p className="admin-page-eyebrow">Test back office · staging</p>
      <h1>This screen opens on the live site only</h1>
      <p>This test copy is connected to the Growth Engine staging system only. To protect your live fights, players, affiliates, payouts and payments, it does not open screens that use live data.</p>
      <p>Nothing has been changed. This screen works as before on www.fantasymmadness.com.</p>
      <p><Link href="/administration/growth-engine" className="admin-action-secondary">Back to the Growth Engine</Link></p>
    </main>
  );
}
