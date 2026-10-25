import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { FaArrowRight, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { fetchUser } from '@/Redux/authSlice';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';

// Landing page after the email verification link.
// The server sends a ONE-TIME handoff code in the URL fragment (#code=...), which is never
// sent to any server. This page erases it from the address bar immediately, exchanges it
// once for a normal player session, then opens the player dashboard. Anything unusual
// (used, expired or invalid link) shows a clear "Continue to Sign In" instead.

const SIGN_IN = '/auth?mode=login&role=player';
const WELCOME_KEY = 'fmm_verified_welcome';
const PENDING_AUTH_KEY = 'fmm_pending_auth_return';
const safePath = (value) => {
  const path = String(value || '');
  return path.startsWith('/') && !path.startsWith('//') ? path : '';
};

// Same-device sign-ups remember the fight/page they came from.
const rememberedReturn = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PENDING_AUTH_KEY) || 'null');
    if (!saved || Date.now() - Number(saved.at || 0) > 24 * 60 * 60 * 1000) return '';
    if (safePath(saved.next)) return safePath(saved.next);
    if (saved.fight && /^[a-f\d]{24}$/i.test(saved.fight)) return `/fight/${saved.fight}?play=1`;
  } catch (_ignored) { /* storage unavailable */ }
  return '';
};

const MESSAGES = {
  signin: { title: 'Email Verified — Welcome to FANTASY MMADNESS', body: 'Your email is verified. For your security, please sign in to continue.', ok: true },
  expired: { title: 'Email Verified — Welcome to FANTASY MMADNESS', body: 'Your email is verified, but this sign-in link has already been used or has expired. Please sign in to continue.', ok: true },
  invalid: { title: 'This link can no longer be used', body: 'This verification link has already been used or has been replaced by a newer one. If you have already verified, simply sign in. If not, sign in and press "Resend verification email" for a fresh link.', ok: false },
  error: { title: 'We could not finish verifying just yet', body: 'Something went wrong on our side. Please open the link in your email again in a minute. Your account is safe.', ok: false },
  none: { title: 'Continue to FANTASY MMADNESS', body: 'Sign in to continue.', ok: false },
};

export default function VerifiedPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const started = useRef(false);
  const [state, setState] = useState({ phase: 'checking', message: null });

  useEffect(() => {
    if (started.current || typeof window === 'undefined') return;
    started.current = true;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    // Erase the one-time code from the address bar and history right away.
    try { window.history.replaceState(null, '', window.location.pathname); } catch (_ignored) { /* ignore */ }
    const code = params.get('code') || '';
    const status = params.get('status') || '';

    if (!code) {
      setState({ phase: 'message', message: MESSAGES[status] || MESSAGES.none });
      return;
    }

    (async () => {
      try {
        const response = await fetch(`${PUBLIC_API_BASE_URL}/api/auth/verification-handoff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.token) {
          setState({ phase: 'message', message: MESSAGES.expired });
          return;
        }
        window.localStorage.setItem('authToken', data.token);
        await dispatch(fetchUser(data.token)).unwrap();
        const returnTo = safePath(data.returnTo) || rememberedReturn();
        try {
          window.localStorage.removeItem(PENDING_AUTH_KEY);
          window.sessionStorage.setItem(WELCOME_KEY, JSON.stringify({ returnTo, returnLabel: data.returnLabel || (returnTo ? 'Continue where you left off' : ''), at: Date.now() }));
        } catch (_ignored) { /* storage unavailable: dashboard still shows a generic welcome */ }
        setState({ phase: 'signed-in', message: null });
        setTimeout(() => router.replace('/UserDashboard?welcome=verified'), 1200);
      } catch (_error) {
        setState({ phase: 'message', message: MESSAGES.expired });
      }
    })();
  }, [dispatch, router]);

  const message = state.message;
  return (
    <>
      <Head>
        <title>Email verified | FANTASY MMADNESS</title>
        <meta name="robots" content="noindex" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <main className="theme-container" style={{ maxWidth: 640, margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
        {state.phase === 'checking' ? (
          <section aria-live="polite"><FaCheckCircle style={{ fontSize: 48, color: '#f2b544' }} /><h1>Verifying…</h1><p>One moment while we sign you in.</p></section>
        ) : null}
        {state.phase === 'signed-in' ? (
          <section aria-live="polite">
            <FaCheckCircle style={{ fontSize: 56, color: '#2fbf71' }} />
            <h1>Email Verified — Welcome to FANTASY MMADNESS</h1>
            <p>You are signed in. Opening your Player Dashboard…</p>
            <Link href="/UserDashboard?welcome=verified" className="theme-btn theme-btn-primary">Go to my dashboard <FaArrowRight /></Link>
          </section>
        ) : null}
        {state.phase === 'message' && message ? (
          <section aria-live="polite">
            {message.ok ? <FaCheckCircle style={{ fontSize: 56, color: '#2fbf71' }} /> : <FaExclamationTriangle style={{ fontSize: 48, color: '#f2b544' }} />}
            <h1>{message.title}</h1>
            <p>{message.body}</p>
            <Link href={SIGN_IN} className="theme-btn theme-btn-primary">Continue to Sign In <FaArrowRight /></Link>
          </section>
        ) : null}
      </main>
    </>
  );
}
