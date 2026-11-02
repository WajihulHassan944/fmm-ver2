import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FaArrowRight, FaEye, FaEyeSlash, FaLock, FaShieldAlt } from 'react-icons/fa';
import { growthEngineApi, growthToken } from '@/Utils/growthEngineApi';
import { isStagingReviewPath } from '@/Utils/adminFeatures';

// Test back office sign-in (staging review mode). Uses the Growth Engine owner
// password, checked by the isolated staging engine. Live admin email/password are
// never asked for or sent from this test copy.
export default function StagingReviewLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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

  return (
    <div className="admin-login-experience" data-testid="staging-review-login">
      <section className="admin-login-panel" style={{ margin: '0 auto' }}>
        <div className="admin-login-card">
          <p className="admin-page-eyebrow"><FaShieldAlt aria-hidden="true" /> Test back office · staging</p>
          <h1>Sign in to review the Growth Engine</h1>
          <p>This is a test copy. It signs in with your <strong>Growth Engine password</strong>, not your live administrator email and password, so it can never change live fights, players or payments.</p>
          {notice && <p role="status">{notice}</p>}
          <form onSubmit={submit}>
            <label htmlFor="staging-password">Growth Engine password</label>
            <div className="admin-login-input">
              <FaLock aria-hidden="true" />
              <input id="staging-password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required autoFocus data-testid="staging-password" />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <FaEyeSlash /> : <FaEye />}</button>
            </div>
            {error && <p className="admin-login-error" role="alert" data-testid="staging-login-error">{error}</p>}
            <button type="submit" className="admin-login-submit" disabled={busy} data-testid="staging-login-submit">{busy ? 'Signing in…' : 'Sign in'} <FaArrowRight aria-hidden="true" /></button>
          </form>
        </div>
      </section>
    </div>
  );
}
