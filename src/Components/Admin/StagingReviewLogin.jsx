import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FaArrowRight, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaShieldAlt } from 'react-icons/fa';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { growthEngineApi, growthToken } from '@/Utils/growthEngineApi';
import { isStagingReviewPath } from '@/Utils/adminFeatures';

// Test back office sign-in (staging review mode). Two ways in, both Growth Engine only:
//  - the Growth Engine owner password (checked by the isolated staging engine), or
//  - your website administrator account: the browser signs in to the website exactly as the
//    live admin login does, the Growth Engine verifies that admin session on its server, and the
//    website admin token is then DISCARDED (never stored here), so this test copy still cannot
//    open live admin screens or change live fights, players or payments.
export default function StagingReviewLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState('admin'); // admin | password
  const [email, setEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const destination = () => {
    const next = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('next') || '';
    return isStagingReviewPath(next) && !next.startsWith('//') ? next : '/administration/growth-engine';
  };

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('reason');
    // Never keep a live admin session in the test copy.
    try { window.localStorage.removeItem('adminAuthToken'); window.localStorage.removeItem('adminToken'); } catch (_error) { /* storage disabled */ }
    if (reason === 'session-ended') setNotice('Your test session ended. Please sign in again.');
    if (!growthToken.get()) return;
    growthEngineApi.session().then(() => router.replace(destination())).catch(() => growthToken.set(''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await growthEngineApi.login(password);
      router.push(destination());
    } catch (e) {
      setError(e.unreachable ? 'The Growth Engine could not be reached. Check your internet connection and try again.' : (e.message === 'Incorrect password.' ? 'That is not the Growth Engine password. Please try again.' : e.message));
      setBusy(false);
    }
  };

  const submitAdmin = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await fetch(buildPublicApiUrl('/admin/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: adminPassword }), credentials: 'omit' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.token) throw new Error(j.message || 'Invalid email or password.');
      // used once for the Growth Engine sign-in, then dropped (never stored in this test copy)
      await growthEngineApi.sso(j.token);
      setAdminPassword('');
      router.push(destination());
    } catch (e) {
      setError(e.unreachable ? 'The Growth Engine could not be reached. Check your internet connection and try again.' : (e.message || 'Sign-in failed.'));
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-experience" data-testid="staging-review-login">
      <section className="admin-login-panel" style={{ margin: '0 auto' }}>
        <div className="admin-login-card">
          <p className="admin-page-eyebrow"><FaShieldAlt aria-hidden="true" /> Test back office · staging</p>
          <h1>Sign in to review the Growth Engine</h1>
          <p>This is a test copy. Signing in here opens <strong>only the Growth Engine</strong>. It can never change live fights, players or payments.</p>
          {notice && <p role="status">{notice}</p>}
          <div role="tablist" style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
            <button type="button" role="tab" aria-selected={mode === 'admin'} className={mode === 'admin' ? 'admin-login-submit' : 'admin-login-secondary'} onClick={() => { setMode('admin'); setError(''); }} data-testid="staging-mode-admin">My administrator account</button>
            <button type="button" role="tab" aria-selected={mode === 'password'} className={mode === 'password' ? 'admin-login-submit' : 'admin-login-secondary'} onClick={() => { setMode('password'); setError(''); }} data-testid="staging-mode-password">Growth Engine password</button>
          </div>
          {mode === 'admin' && (
          <form onSubmit={submitAdmin} data-testid="staging-admin-form">
            <p>Use the same email and password as your website administration. Your website session is only used to open the Growth Engine and is not kept in this test copy.</p>
            <label htmlFor="staging-admin-email">Administrator email</label>
            <div className="admin-login-input">
              <FaEnvelope aria-hidden="true" />
              <input id="staging-admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required data-testid="staging-admin-email" />
            </div>
            <label htmlFor="staging-admin-password">Administrator password</label>
            <div className="admin-login-input">
              <FaLock aria-hidden="true" />
              <input id="staging-admin-password" type={show ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} autoComplete="current-password" required data-testid="staging-admin-password" />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <FaEyeSlash /> : <FaEye />}</button>
            </div>
            {error && <p className="admin-login-error" role="alert" data-testid="staging-login-error">{error}</p>}
            <button type="submit" className="admin-login-submit" disabled={busy} data-testid="staging-admin-submit">{busy ? 'Signing in…' : 'Sign in'} <FaArrowRight aria-hidden="true" /></button>
          </form>
          )}
          {mode === 'password' && (
          <form onSubmit={submit}>
            <label htmlFor="staging-password">Growth Engine password</label>
            <div className="admin-login-input">
              <FaLock aria-hidden="true" />
              <input id="staging-password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required data-testid="staging-password" />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <FaEyeSlash /> : <FaEye />}</button>
            </div>
            {error && <p className="admin-login-error" role="alert" data-testid="staging-login-error">{error}</p>}
            <button type="submit" className="admin-login-submit" disabled={busy} data-testid="staging-login-submit">{busy ? 'Signing in…' : 'Sign in'} <FaArrowRight aria-hidden="true" /></button>
          </form>
          )}
        </div>
      </section>
    </div>
  );
}
