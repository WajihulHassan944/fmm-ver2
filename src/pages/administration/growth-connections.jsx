import React, { useEffect, useState } from 'react';
import { getAdminToken } from '@/Utils/authFetch';

// Popup on the website origin. Only a Preview Growth token crosses to the opener.
export default function GrowthConnectionsSignIn({ engineOrigin, enabled }) {
  const [message, setMessage] = useState('Checking website administrator session…');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled) { setMessage('This sign-in page is available only in the isolated Preview.'); return; }
    const state = window.location.hash.slice(1);
    if (!/^[a-f0-9]{64}$/.test(state) || !window.opener) { setMessage('Open Connections Preview and choose Sign in with FANTASY MMADNESS.'); return; }
    if (!getAdminToken()) {
      const next = '/administration/growth-connections#' + state;
      window.location.replace('/administration/login?next=' + encodeURIComponent(next)); return;
    }
    setReady(true); setMessage('Continue using your signed-in website administrator account. Publishing stays disabled.');
  }, [enabled]);
  async function connect() {
    setReady(false); setMessage('Verifying your administrator session…');
    try {
      const response = await fetch('/api/admin/growth-social-session', { method: 'POST', cache: 'no-store', redirect: 'error', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getAdminToken() }, body: '{}' });
      const result = await response.json();
      if (!response.ok) { if (response.status === 401 || response.status === 403) { const next = '/administration/growth-connections' + window.location.hash; window.location.replace('/administration/login?next=' + encodeURIComponent(next)); return; } throw Error('Administrator verification is temporarily unavailable. Try again.'); }
      if (!window.opener || result.ok !== true || result.engineOrigin !== engineOrigin || typeof result.token !== 'string' || result.token.length > 4096 || result.expiresAt <= Date.now()) throw Error('The staging session was rejected. Open Connections Preview and sign in again.');
      window.opener.postMessage({ type: 'fmm-growth-social-session', state: window.location.hash.slice(1), token: result.token }, engineOrigin);
      setMessage('Administrator verified. Return to Connections Preview. No campaigns have been published.'); window.close();
    } catch (error) { setMessage(error.message); setReady(true); }
  }
  return <main style={{ padding: 40, maxWidth: 750, margin: 'auto' }}><h1>Connect to Growth Engine Preview</h1><p role="status">{message}</p>{ready && <button type="button" onClick={connect}>Continue as website administrator</button>}</main>;
}
export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
  const { socialBridgeEnv } = require('@/server/growthSocialSessionBridge.cjs');
  const env = socialBridgeEnv(process.env);
  return { props: { enabled: Boolean(env?.GROWTH_SSO_SITE_PRIVATE_KEY), engineOrigin: env?.GROWTH_ENGINE_SERVER_URL || '' } };
}
