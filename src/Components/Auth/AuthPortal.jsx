import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';
import { GoogleLogin } from '@react-oauth/google';
import GoogleOAuthBoundary from './GoogleOAuthBoundary';
import { toast } from 'react-toastify';
import {
  FaArrowRight,
  FaCheck,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaHandshake,
  FaLock,
  FaShieldAlt,
  FaTrophy,
  FaUpload,
  FaUser,
  FaUserFriends,
} from 'react-icons/fa';
import { loginUser, fetchUser } from '@/Redux/authSlice';
import { loginAffiliate, fetchAffiliate } from '@/Redux/affiliateAuthSlice';
import UploadAvatar from '@/Components/CreateAccount/UploadAvatar';
import Membership from '@/Components/CreateAccount/Membership';
import { FMM_ASSET_BASE } from '@/Utils/fightExperience';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';


const API_BASE_URL = PUBLIC_API_BASE_URL;

const parseApiPayload = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try { return await response.json(); } catch { return null; }
  }
  const rawText = await response.text();
  return rawText ? { message: rawText } : null;
};

const apiRequest = async (path, { method = 'GET', body, headers = {}, token = null } = {}) => {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    credentials: 'include',
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });
  const payload = await parseApiPayload(response);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed with status ${response.status}`);
  }
  return payload;
};

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeLErwpAAAAAD3s3QWddvNAWULeDdLGUu3_-5lK';

const roles = [
  { id: 'player', label: 'Player', icon: FaUser, loginCopy: 'Enter fights, manage predictions, and view your wallet.', signupCopy: 'Create a player account and start predicting combat sports.' },
  { id: 'affiliate', label: 'Affiliate', icon: FaUserFriends, loginCopy: 'Manage promotions, creator leagues, and audience growth.', signupCopy: 'Apply for an affiliate account and launch creator-led leagues.' },
  { id: 'sponsor', label: 'Sponsor', icon: FaHandshake, loginCopy: 'Review your live partner profile and sponsored placement.', signupCopy: 'Start a sponsorship conversation with the Fantasy MMAdness team.' },
];

const playerInitialState = {
  firstName: '', lastName: '', playerName: '', email: '', phone: '', zipCode: '', password: '',
  isNotificationsEnabled: false, isSubscribed: false, isUSCitizen: false, isAgreed: false,
};

const affiliateInitialState = {
  ...playerInitialState,
  hearing: '',
  affiliateImage: null,
};

const sponsorInitialState = { fullName: '', company: '', email: '', website: '', message: '' };

const queryValue = (value) => Array.isArray(value) ? value[0] : value;
const getSafeNextPath = (value, fallback) => {
  const candidate = String(queryValue(value) || '');
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : fallback;
};

const AuthPortal = ({ initialMode, initialRole, onSuccess, redirectTo }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [mode, setMode] = useState(initialMode || 'login');
  const [role, setRole] = useState(initialRole || 'player');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [playerForm, setPlayerForm] = useState(playerInitialState);
  const [affiliateForm, setAffiliateForm] = useState(affiliateInitialState);
  const [sponsorForm, setSponsorForm] = useState(sponsorInitialState);
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [playerRegistration, setPlayerRegistration] = useState({ state: 'idle', email: '' });
  const [affiliateRegistered, setAffiliateRegistered] = useState(false);
  const [sponsorSubmitted, setSponsorSubmitted] = useState(false);
  const [membershipEmail, setMembershipEmail] = useState('');
  const [affiliateImagePreview, setAffiliateImagePreview] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const requestedMode = queryValue(router.query.mode) === 'signup' ? 'signup' : 'login';
    const requestedRole = queryValue(router.query.role);
    setMode(initialMode || requestedMode);
    setRole(initialRole || (roles.some((item) => item.id === requestedRole) ? requestedRole : 'player'));
  }, [initialMode, initialRole, router.isReady, router.query.mode, router.query.role]);

  useEffect(() => {
    setRecaptchaToken('');
    setForgotPassword(false);
  }, [mode, role]);

  useEffect(() => {
    if (playerRegistration.state !== 'polling' || !playerRegistration.email) return undefined;
    let cancelled = false;
    const startedAt = Date.now();

    const checkVerification = async () => {
      try {
        const data = await apiRequest(`/user/${encodeURIComponent(playerRegistration.email)}`, { token: null });
        if (!cancelled && data?.verified) {
          setPlayerRegistration((current) => ({ ...current, state: 'verified' }));
        } else if (!cancelled && Date.now() - startedAt > 120000) {
          setPlayerRegistration((current) => ({ ...current, state: 'timed-out' }));
        }
      } catch (error) {
        console.error('Verification status check failed:', error);
      }
    };

    checkVerification();
    const interval = setInterval(checkVerification, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [playerRegistration.email, playerRegistration.state]);

  const selectedRole = useMemo(() => roles.find((item) => item.id === role) || roles[0], [role]);

  const updateRouteState = (nextMode, nextRole = role) => {
    setMode(nextMode);
    setRole(nextRole);
    if (!router.isReady || initialMode || initialRole) return;
    router.replace({ pathname: '/auth', query: { ...router.query, mode: nextMode, role: nextRole } }, undefined, { shallow: true });
  };

  const navigateAfterAuth = (fallback) => {
    let pathname = getSafeNextPath(router.query.next || router.query.returnTo, fallback);
    if (redirectTo?.type === 'view-thread' && redirectTo.threadId) pathname = `/threads/${redirectTo.threadId}`;
    if (redirectTo?.type === 'create-thread') pathname = '/create-thread';
    const query = {};
    if (queryValue(router.query.fight)) query.fight = queryValue(router.query.fight);
    if (queryValue(router.query.league)) query.league = queryValue(router.query.league);
    router.push(Object.keys(query).length ? { pathname, query } : pathname);
    onSuccess?.();
  };

  const requireRecaptcha = () => {
    if (recaptchaToken) return true;
    toast.error('Please verify that you are not a robot.');
    return false;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!requireRecaptcha()) return;
    setIsSubmitting(true);

    try {
      if (role === 'player') {
        const result = await dispatch(loginUser(loginForm)).unwrap();
        const loggedInUser = result?.user || await dispatch(fetchUser(result.token)).unwrap();
        if (loggedInUser?.currentPlan === 'None') {
          setMembershipEmail(loggedInUser.email || loginForm.email);
        } else {
          toast.success('Welcome back to the fight room.');
          navigateAfterAuth('/UserDashboard');
        }
      } else if (role === 'affiliate') {
        const result = await dispatch(loginAffiliate(loginForm)).unwrap();
        const affiliate = result?.user || await dispatch(fetchAffiliate(result.token)).unwrap();
        await dispatch(fetchAffiliate(result.token));
        if (!affiliate?.verified) {
          toast.warning('Your affiliate account is awaiting administrator approval.');
        } else {
          toast.success('Affiliate login successful.');
          navigateAfterAuth('/AffiliateDashboard');
        }
      } else {
        const data = await apiRequest(`/sponsors/email/${encodeURIComponent(loginForm.email)}`, { token: null });
        localStorage.setItem('isSponsorAuthenticated', 'true');
        localStorage.setItem('sponsorData', JSON.stringify(data));
        toast.success('Sponsor access confirmed.');
        navigateAfterAuth('/sponsor-dashboard');
      }
    } catch (error) {
      toast.error(typeof error === 'string' ? error : error?.message || 'Login failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    if (!forgotEmail) return;
    setIsSubmitting(true);
    try {
      await apiRequest(role === 'affiliate' ? '/forgotPassword' : '/forgotPassword-user', {
        method: 'POST',
        token: null,
        body: { email: forgotEmail },
      });
      toast.success('A password reset link has been sent.');
      setForgotPassword(false);
    } catch (error) {
      toast.error(error.message || 'Unable to send the reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayerSignup = async (event) => {
    event.preventDefault();
    if (!requireRecaptcha()) return;
    if (!playerForm.isAgreed) {
      toast.error('Please agree to the terms and conditions.');
      return;
    }

    setIsSubmitting(true);
    try {
      const referrerId = queryValue(router.query.referrer);
      await apiRequest('/register', {
        method: 'POST',
        token: null,
        body: { ...playerForm, ...(referrerId ? { referrerId } : {}) },
      });
      setPlayerRegistration({ state: 'polling', email: playerForm.email });
      toast.success('Account created. Check your email to verify it.');
    } catch (error) {
      toast.error(error.message || 'Unable to create the account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAffiliateSignup = async (event) => {
    event.preventDefault();
    if (!requireRecaptcha()) return;
    if (!affiliateForm.isAgreed) {
      toast.error('Please agree to the terms and conditions.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(affiliateForm).forEach(([key, value]) => {
        if (key !== 'affiliateImage') payload.append(key, value);
      });
      if (affiliateForm.affiliateImage) payload.append('image', affiliateForm.affiliateImage);

      await apiRequest('/registerAffiliate', { method: 'POST', token: null, body: payload });
      setAffiliateRegistered(true);
      toast.success('Affiliate application submitted.');
    } catch (error) {
      toast.error(error.message || 'Unable to submit the affiliate application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSponsorSignup = async (event) => {
    event.preventDefault();
    if (!requireRecaptcha()) return;
    setIsSubmitting(true);
    try {
      await apiRequest('/contact-us-fantasymmadness', {
        method: 'POST',
        token: null,
        body: {
          fullName: sponsorForm.fullName,
          email: sponsorForm.email,
          subject: `Sponsorship enquiry — ${sponsorForm.company}`,
          message: `Company: ${sponsorForm.company}\nWebsite: ${sponsorForm.website || 'Not provided'}\n\n${sponsorForm.message}`,
        },
      });
      setSponsorSubmitted(true);
      toast.success('Sponsorship enquiry sent.');
    } catch (error) {
      toast.error(error.message || 'Unable to send your enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async ({ credential }) => {
    if (!credential || role === 'sponsor') return;
    setIsSubmitting(true);
    try {
      const referrerId = queryValue(router.query.referrer);
      const endpoint = role === 'affiliate' ? '/affiliate-google-login' : '/google-login';
      const data = await apiRequest(endpoint, {
        method: 'POST',
        token: null,
        body: { token: credential, ...(role === 'player' && referrerId ? { referrerId } : {}) },
      });
      const accessToken = data?.accessToken || data?.token;
      if (!accessToken) throw new Error(data?.message || 'Google authentication failed');

      if (role === 'affiliate') {
        localStorage.setItem('affiliateAuthToken', accessToken);
        const affiliate = await dispatch(fetchAffiliate(accessToken)).unwrap();
        if (!affiliate?.verified) toast.warning('Your affiliate application is awaiting approval.');
        else navigateAfterAuth('/AffiliateDashboard');
      } else {
        localStorage.setItem('authToken', accessToken);
        const account = await dispatch(fetchUser(accessToken)).unwrap();
        if (account?.currentPlan === 'None') setMembershipEmail(account.email);
        else navigateAfterAuth('/UserDashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePlayer = (event) => {
    const { name, value, type, checked } = event.target;
    setPlayerForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };
  const updateAffiliate = (event) => {
    const { name, value, type, checked, files } = event.target;
    if (name === 'affiliateImage') {
      const file = files?.[0] || null;
      setAffiliateForm((current) => ({ ...current, affiliateImage: file }));
      setAffiliateImagePreview(file ? URL.createObjectURL(file) : '');
      return;
    }
    setAffiliateForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };
  const updateSponsor = (event) => setSponsorForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  if (membershipEmail) {
    return <div className="experience-page xp-auth-completion"><Membership email={membershipEmail} /></div>;
  }
  if (playerRegistration.state === 'verified') {
    return <div className="experience-page xp-auth-completion"><UploadAvatar email={playerRegistration.email} /></div>;
  }

  const completionCard = (() => {
    if (playerRegistration.state === 'polling') return { title: 'Verify your email', copy: `We sent a verification link to ${playerRegistration.email}. This page will continue automatically after verification.`, icon: FaEnvelope };
    if (playerRegistration.state === 'timed-out') return { title: 'Verification window ended', copy: 'The account was created, but verification was not detected within two minutes. Open the email link, then sign in.', icon: FaShieldAlt };
    if (affiliateRegistered) return { title: 'Application received', copy: 'Your affiliate account is pending administrator review. You can sign in after the account is approved.', icon: FaUserFriends };
    if (sponsorSubmitted) return { title: 'Your enquiry is in the corner', copy: 'The partnerships team will review your goals and follow up using the email address provided.', icon: FaHandshake };
    return null;
  })();

  return (
    <GoogleOAuthBoundary>
      <>
      <Head>
        <title>{mode === 'login' ? 'Login' : 'Create Account'} | Fantasy MMAdness</title>
        <meta name="description" content="One secure access point for Fantasy MMAdness players, affiliates, and sponsors." />
      </Head>
      <div className="experience-page auth-experience-page">
        <div className="xp-auth-shell">
          <aside className="xp-auth-art">
            <div className="xp-auth-art-grid" />
            <div className="xp-auth-art-copy">
              <Link href="/" className="xp-auth-logo"><img src={`${FMM_ASSET_BASE}/fantasy-mmadness-logo.webp`} alt="Fantasy MMAdness" /></Link>
              <p className="xp-eyebrow">One account portal</p>
              <h1>Step inside the <span>fight room.</span></h1>
              <p>Players predict. Affiliates build leagues. Sponsors own meaningful fight-night moments. Choose your role and continue in one consistent experience.</p>
              <div className="xp-auth-proof">
                <div><FaShieldAlt /><span><strong>Secure access</strong><small>Role-aware login</small></span></div>
                <div><FaTrophy /><span><strong>One platform</strong><small>Multiple fight journeys</small></span></div>
              </div>
            </div>
          </aside>

          <main className="xp-auth-panel">
            <div className="xp-auth-panel-inner">
              <div className="xp-auth-mode-switch" role="tablist">
                <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => updateRouteState('login')}>Login</button>
                <button type="button" className={mode === 'signup' ? 'is-active' : ''} onClick={() => updateRouteState('signup')}>{role === 'sponsor' ? 'Partner enquiry' : 'Create account'}</button>
              </div>

              <div className="xp-auth-heading">
                <span>{mode === 'login' ? 'Welcome back' : role === 'sponsor' ? 'Partner with Fantasy MMAdness' : 'Join the platform'}</span>
                <h2>{mode === 'login' ? 'Continue to your corner.' : selectedRole.signupCopy}</h2>
                <p>{mode === 'login' ? selectedRole.loginCopy : 'The same production account workflows remain connected behind the redesigned interface.'}</p>
              </div>

              <div className="xp-auth-role-switcher" role="tablist" aria-label="Account type">
                {roles.map(({ id, label, icon: Icon }) => (
                  <button type="button" className={role === id ? 'is-active' : ''} onClick={() => updateRouteState(mode, id)} key={id}><Icon /><span>{label}</span></button>
                ))}
              </div>

              {completionCard ? (
                <div className="xp-auth-completion-card">
                  <completionCard.icon />
                  <h3>{completionCard.title}</h3>
                  <p>{completionCard.copy}</p>
                  {playerRegistration.state === 'polling' && <div className="xp-auth-pulse"><i /><span>Waiting for verification</span></div>}
                  <button type="button" className="theme-btn theme-btn-secondary" onClick={() => { setPlayerRegistration({ state: 'idle', email: '' }); setAffiliateRegistered(false); setSponsorSubmitted(false); updateRouteState('login'); }}>Back to login</button>
                </div>
              ) : forgotPassword ? (
                <form className="xp-auth-form" onSubmit={handleForgotPassword}>
                  <label><span>Email address</span><div className="xp-auth-input"><FaEnvelope /><input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} placeholder="you@example.com" required /></div></label>
                  <button type="submit" className="theme-btn theme-btn-primary xp-auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send reset link'} <FaArrowRight /></button>
                  <button type="button" className="xp-auth-inline-action" onClick={() => setForgotPassword(false)}>Return to login</button>
                </form>
              ) : mode === 'login' ? (
                <form className="xp-auth-form" onSubmit={handleLogin}>
                  <label><span>{role === 'sponsor' ? 'Approved sponsor email' : 'Email address'}</span><div className="xp-auth-input"><FaEnvelope /><input type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" required /></div></label>
                  {role !== 'sponsor' && (
                    <label><span>Password</span><div className="xp-auth-input"><FaLock /><input type={showPassword ? 'text' : 'password'} value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} placeholder="Enter your password" required /><button type="button" className="xp-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <FaEye /> : <FaEyeSlash />}</button></div></label>
                  )}
                  <div className="xp-auth-recaptcha"><ReCAPTCHA key={`${mode}-${role}`} sitekey={RECAPTCHA_SITE_KEY} onChange={setRecaptchaToken} theme="dark" /></div>
                  {role !== 'sponsor' && <button type="button" className="xp-auth-inline-action" onClick={() => setForgotPassword(true)}>Forgot password?</button>}
                  <button type="submit" className="theme-btn theme-btn-primary xp-auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Opening your corner...' : role === 'sponsor' ? 'Open sponsor profile' : `Login as ${selectedRole.label}`} <FaArrowRight /></button>
                  {role !== 'sponsor' && (
                    <div className="xp-auth-google"><span>or continue with Google</span><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google authentication was cancelled.')} theme="filled_black" shape="rectangular" width="100%" /></div>
                  )}
                </form>
              ) : role === 'player' ? (
                <form className="xp-auth-form xp-auth-signup-form" onSubmit={handlePlayerSignup}>
                  <div className="xp-auth-field-grid">
                    <label><span>First name</span><input name="firstName" value={playerForm.firstName} onChange={updatePlayer} required /></label>
                    <label><span>Last name</span><input name="lastName" value={playerForm.lastName} onChange={updatePlayer} required /></label>
                    <label><span>Player name</span><input name="playerName" value={playerForm.playerName} onChange={updatePlayer} required /></label>
                    <label><span>Email address</span><input type="email" name="email" value={playerForm.email} onChange={updatePlayer} required /></label>
                    <label><span>Phone</span><input name="phone" value={playerForm.phone} onChange={updatePlayer} required /></label>
                    <label><span>ZIP code</span><input name="zipCode" value={playerForm.zipCode} onChange={updatePlayer} required /></label>
                    <label className="is-wide"><span>Password</span><input type="password" name="password" value={playerForm.password} onChange={updatePlayer} required /></label>
                  </div>
                  <div className="xp-auth-checks">
                    <label><input type="checkbox" name="isNotificationsEnabled" checked={playerForm.isNotificationsEnabled} onChange={updatePlayer} /><span>Send activity notifications by SMS</span></label>
                    <label><input type="checkbox" name="isSubscribed" checked={playerForm.isSubscribed} onChange={updatePlayer} /><span>Subscribe to fight updates and promotions</span></label>
                    <label><input type="checkbox" name="isUSCitizen" checked={playerForm.isUSCitizen} onChange={updatePlayer} /><span>I am a US citizen residing in the United States</span></label>
                    <label><input type="checkbox" name="isAgreed" checked={playerForm.isAgreed} onChange={updatePlayer} required /><span>I agree to the <Link href="/terms-of-service">terms of service</Link> and <Link href="/privacy-policy">privacy policy</Link></span></label>
                  </div>
                  <div className="xp-auth-recaptcha"><ReCAPTCHA key={`${mode}-${role}`} sitekey={RECAPTCHA_SITE_KEY} onChange={setRecaptchaToken} theme="dark" /></div>
                  <button type="submit" className="theme-btn theme-btn-primary xp-auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create player account'} <FaArrowRight /></button>
                  <div className="xp-auth-google"><span>or create with Google</span><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google authentication was cancelled.')} theme="filled_black" shape="rectangular" width="100%" /></div>
                </form>
              ) : role === 'affiliate' ? (
                <form className="xp-auth-form xp-auth-signup-form" onSubmit={handleAffiliateSignup}>
                  <div className="xp-auth-upload-card">
                    <div>{affiliateImagePreview ? <img src={affiliateImagePreview} alt="Affiliate preview" /> : <FaUpload />}</div>
                    <label><strong>Creator or affiliate image</strong><span>Upload the image used on your public league card.</span><input type="file" name="affiliateImage" accept="image/*" onChange={updateAffiliate} /></label>
                  </div>
                  <div className="xp-auth-field-grid">
                    <label><span>First name</span><input name="firstName" value={affiliateForm.firstName} onChange={updateAffiliate} required /></label>
                    <label><span>Last name</span><input name="lastName" value={affiliateForm.lastName} onChange={updateAffiliate} required /></label>
                    <label><span>Creator / league name</span><input name="playerName" value={affiliateForm.playerName} onChange={updateAffiliate} required /></label>
                    <label><span>Email address</span><input type="email" name="email" value={affiliateForm.email} onChange={updateAffiliate} required /></label>
                    <label><span>Phone</span><input name="phone" value={affiliateForm.phone} onChange={updateAffiliate} required /></label>
                    <label><span>ZIP code</span><input name="zipCode" value={affiliateForm.zipCode} onChange={updateAffiliate} required /></label>
                    <label className="is-wide"><span>How did you hear about us?</span><input name="hearing" value={affiliateForm.hearing} onChange={updateAffiliate} required /></label>
                    <label className="is-wide"><span>Password</span><input type="password" name="password" value={affiliateForm.password} onChange={updateAffiliate} required /></label>
                  </div>
                  <div className="xp-auth-checks">
                    <label><input type="checkbox" name="isNotificationsEnabled" checked={affiliateForm.isNotificationsEnabled} onChange={updateAffiliate} /><span>Send activity notifications by SMS</span></label>
                    <label><input type="checkbox" name="isSubscribed" checked={affiliateForm.isSubscribed} onChange={updateAffiliate} /><span>Subscribe to platform and promotion updates</span></label>
                    <label><input type="checkbox" name="isUSCitizen" checked={affiliateForm.isUSCitizen} onChange={updateAffiliate} /><span>I am a US citizen residing in the United States</span></label>
                    <label><input type="checkbox" name="isAgreed" checked={affiliateForm.isAgreed} onChange={updateAffiliate} required /><span>I agree to the <Link href="/terms-of-service">terms of service</Link> and <Link href="/privacy-policy">privacy policy</Link></span></label>
                  </div>
                  <div className="xp-auth-recaptcha"><ReCAPTCHA key={`${mode}-${role}`} sitekey={RECAPTCHA_SITE_KEY} onChange={setRecaptchaToken} theme="dark" /></div>
                  <button type="submit" className="theme-btn theme-btn-primary xp-auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting application...' : 'Apply as an affiliate'} <FaArrowRight /></button>
                  <div className="xp-auth-google"><span>or apply with Google</span><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google authentication was cancelled.')} theme="filled_black" shape="rectangular" width="100%" /></div>
                </form>
              ) : (
                <form className="xp-auth-form xp-auth-signup-form" onSubmit={handleSponsorSignup}>
                  <div className="xp-auth-field-grid">
                    <label><span>Full name</span><input name="fullName" value={sponsorForm.fullName} onChange={updateSponsor} required /></label>
                    <label><span>Company</span><input name="company" value={sponsorForm.company} onChange={updateSponsor} required /></label>
                    <label><span>Business email</span><input type="email" name="email" value={sponsorForm.email} onChange={updateSponsor} required /></label>
                    <label><span>Website</span><input type="url" name="website" value={sponsorForm.website} onChange={updateSponsor} placeholder="https://" /></label>
                    <label className="is-wide"><span>Campaign goals</span><textarea name="message" value={sponsorForm.message} onChange={updateSponsor} placeholder="Tell us about your audience, objective, and preferred fight activation." required /></label>
                  </div>
                  <div className="xp-auth-recaptcha"><ReCAPTCHA key={`${mode}-${role}`} sitekey={RECAPTCHA_SITE_KEY} onChange={setRecaptchaToken} theme="dark" /></div>
                  <button type="submit" className="theme-btn theme-btn-primary xp-auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Sending enquiry...' : 'Start sponsorship conversation'} <FaArrowRight /></button>
                </form>
              )}

              <p className="xp-auth-footer-copy">Protected by account verification and the existing Fantasy MMAdness production API.</p>
            </div>
          </main>
        </div>
      </div>
      </>
    </GoogleOAuthBoundary>
  );
};

export default AuthPortal;
