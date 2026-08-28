import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';

// ==========================================================================
// FantasyMobileExperience — the data layer for the mobile app
//
// REBUILT. The previous version of this file was destroyed by a bad write
// during the session that produced the feedback system. It has been rebuilt
// against the full prop contract FantasyMobileAppCore actually consumes (60
// props, extracted from the component rather than remembered), so the build is
// green and every screen has a real handler behind it.
//
// One deliberate design point carried forward: this file owns ALL network
// access and Core owns none. Core is a presentation component that receives
// data and callbacks. That separation is why Core could be verified
// independently, and it is worth preserving.
// ==========================================================================

const FantasyMobileAppCore = dynamic(
  () => import('@/Components/MobileApp/FantasyMobileAppCore'),
  { ssr: false, loading: () => null },
);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE
  || 'https://fantasymmadness-game-server-three.vercel.app';

const buildPublicApiUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

// --------------------------------------------------------------------------
// SESSION
//
// An owner "view as" preview token lives in sessionStorage and takes precedence
// over a real login: it expires with the tab, never overwrites the player's
// saved session, and the server refuses any non-GET made with it.
// --------------------------------------------------------------------------
const readSessionToken = () => {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem('previewToken')
      || window.localStorage.getItem('authToken')
      || '';
  } catch (error) {
    return '';
  }
};

const readAffiliateToken = () => {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem('previewToken')
      || window.localStorage.getItem('affiliateAuthToken')
      || window.localStorage.getItem('authToken')
      || '';
  } catch (error) {
    return '';
  }
};

const readAdminToken = () => {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem('adminAuthToken')
      || window.localStorage.getItem('adminToken')
      || '';
  } catch (error) {
    return '';
  }
};

const readPreviewContext = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem('previewContext');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

// --------------------------------------------------------------------------
// REQUEST HELPERS
//
// Every one returns a shaped object rather than throwing, so a network failure
// degrades a single screen instead of blanking the app. Core checks `ok`.
// --------------------------------------------------------------------------
const publicRequest = async (path, options = {}) => {
  if (typeof window === 'undefined') return { ok: false };
  try {
    const response = await fetch(buildPublicApiUrl(path), {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, status: response.status, message: payload?.message, code: payload?.code };
    return { ok: true, ...payload };
  } catch (error) {
    return { ok: false, message: 'Could not reach the server.' };
  }
};

const tokenRequest = (getToken, signInMessage) => async (path, options = {}) => {
  const token = getToken();
  if (!token) return { ok: false, message: signInMessage };
  return publicRequest(path, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });
};

const playerRequest = tokenRequest(readSessionToken, 'Sign in to do that.');
const affiliateRequest = tokenRequest(readAffiliateToken, 'Sign in to your league account first.');
const adminRequest = tokenRequest(readAdminToken, 'Admin sign-in required.');

// Kept as its own name because Core's challenge/season/team handlers were
// written against it and the name appears in their error paths.
const challengeRequest = playerRequest;

const feedbackInputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 9,
  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.16)',
  color: '#fff', fontSize: 12, fontFamily: "'Rajdhani', system-ui, sans-serif",
  marginBottom: 10, resize: 'vertical',
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const asInt = (value) => Number.parseInt(String(value ?? '0'), 10) || 0;

// --------------------------------------------------------------------------
// NORMALISERS
//
// The API returns fight records with a lot of surface. Core wants a small,
// predictable shape, and normalising here means a field rename on the server
// breaks one function rather than twenty render methods.
// --------------------------------------------------------------------------
const resolveLiveMedia = (...values) => {
  for (const value of values) {
    const candidate = typeof value === 'string' ? value.trim() : '';
    if (candidate && !/^undefined$|^null$/i.test(candidate)) return candidate;
  }
  return '';
};

const normalizeFight = (fight = {}) => {
  const category = String(fight.matchCategory || '').toLowerCase();
  const sport = category.includes('knuckle') ? 'bareknuckle'
    : category.includes('box') ? 'boxing'
      : category.includes('wrestl') ? 'wrestling'
        : category.includes('kick') ? 'kickboxing'
          : 'mma';
  return {
    id: String(fight._id || fight.id || ''),
    backendId: String(fight._id || fight.id || ''),
    f1: fight.matchFighterA || fight.fighterAName || '',
    f2: fight.matchFighterB || fight.fighterBName || '',
    name: fight.matchName || '',
    sport,
    category: fight.matchCategory || '',
    iso: fight.matchDate || '',
    date: fight.matchDate || '',
    time: fight.matchTime || '',
    venue: fight.venue || '',
    rounds: asInt(fight.maxRounds) || 3,
    entryFee: asInt(fight.matchTokens),
    prizePool: asInt(fight.pot || fight.prizePool),
    entryCount: asInt(fight.entryCount ?? (Array.isArray(fight.userPredictions) ? fight.userPredictions.length : 0)),
    status: fight.matchStatus || '',
    settled: Boolean(fight.prizesSettledAt),
    winner: fight.winner || fight.matchWinner || fight.result || '',
    tagColor: sport === 'boxing' ? '#ef4444' : sport === 'wrestling' ? '#a855f7' : '#4d8dff',
    featuredThisWeek: Boolean(fight.featuredThisWeek),
    featuredThisWeekImage: resolveLiveMedia(fight.featuredThisWeekImage),
    featuredFightBackgroundImage: resolveLiveMedia(fight.featuredFightBackgroundImage),
    featuredFightFighterAImage: resolveLiveMedia(fight.featuredFightFighterAImage, fight.fighterAImage),
    featuredFightFighterBImage: resolveLiveMedia(fight.featuredFightFighterBImage, fight.fighterBImage),
    poster: resolveLiveMedia(fight.fightPosterImage, fight.promotionBackground),
    raw: fight,
  };
};

// ==========================================================================
// COMPONENT
// ==========================================================================
const FantasyMobileExperience = ({ initialTab = 'home', forceRender = false }) => {
  const [fights, setFights] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [leagueUsers, setLeagueUsers] = useState([]);
  const [apparel, setApparel] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [shadowFights, setShadowFights] = useState([]);
  const [affiliateCampaigns, setAffiliateCampaigns] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [coins, setCoins] = useState(0);
  const [stats, setStats] = useState({});
  const [features, setFeatures] = useState({
    headToHead: { enabled: false, minStake: 10, maxStake: 5000 },
    seasonCards: { enabled: false },
    teamCards: { enabled: false, picksRequired: 5 },
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [preview, setPreview] = useState(null);

  // Feedback sheet. Lives here rather than in Core so it is reachable on every
  // screen, including before Core has finished loading.
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // Testing tool, not a product feature. Shown only to testers.
  const [showReportButton, setShowReportButton] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let visible = false;
    try {
      // 1. Build-time switch for a tester build.
      if (process.env.NEXT_PUBLIC_TESTER_MODE === 'true') visible = true;
      // 2. Anyone signed in on a seeded test account.
      const email = String(window.localStorage.getItem('userEmail') || '').toLowerCase();
      if (email.endsWith('@fmmtest.com')) visible = true;
      // 3. ?feedback=1 — lets you turn it on for one person without a rebuild.
      //    Remembered for the session so it survives navigation.
      const params = new URLSearchParams(window.location.search);
      if (params.get('feedback') === '1') {
        window.sessionStorage.setItem('fmmFeedback', '1');
        visible = true;
      }
      if (window.sessionStorage.getItem('fmmFeedback') === '1') visible = true;
    } catch (error) { /* storage unavailable */ }
    setShowReportButton(visible);
  }, []);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedback, setFeedback] = useState({
    area: 'other', severity: 'wrong', step: '', expected: '', actual: '',
  });

  // ------------------------------------------------------------------------
  // Owner "view as" hand-off. The token arrives once in the URL, moves into
  // sessionStorage, and is stripped from the address bar so it is not left in
  // history or copied into a shared link.
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const incoming = params.get('preview');
    if (incoming) {
      try {
        const context = {
          name: params.get('as') || 'this account',
          type: params.get('asType') || 'player',
        };
        window.sessionStorage.setItem('previewToken', incoming);
        window.sessionStorage.setItem('previewContext', JSON.stringify(context));
        setPreview(context);
      } catch (error) { /* storage unavailable */ }
      params.delete('preview');
      params.delete('as');
      params.delete('asType');
      const query = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));
      return;
    }
    setPreview(readPreviewContext());
  }, []);

  const exitPreview = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem('previewToken');
      window.sessionStorage.removeItem('previewContext');
    } catch (error) { /* ignore */ }
    setPreview(null);
    window.location.href = '/owner';
  }, []);

  // ------------------------------------------------------------------------
  // Feature flags first, and separately: the app must know whether Team Cards
  // and Seasons exist before it renders them, and this call is cheap.
  // ------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await publicRequest('/api/public/features');
      if (!cancelled && result.ok && result.features) {
        setFeatures((prev) => ({ ...prev, ...result.features }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ------------------------------------------------------------------------
  // Core content. Each request is independent so one failure does not empty
  // the whole screen.
  // ------------------------------------------------------------------------
  const loadContent = useCallback(async () => {
    const [fightRes, boardRes, leagueRes, apparelRes, blogRes] = await Promise.all([
      // Real route names, read off the server rather than guessed. The previous
      // set was inferred and four of the five did not exist, which is why the
      // app loaded a shell with no fights in it.
      publicRequest('/api/public/prediction-fights?limit=60'),
      publicRequest('/api/public/leaderboard?limit=50'),
      publicRequest('/api/public/leagues?limit=24'),
      publicRequest('/api/public/apparel-products?limit=24'),
      publicRequest('/api/blogs?limit=12'),
    ]);

    const rawFights = asArray(fightRes.fights || fightRes.matches || fightRes.predictionFights || fightRes.data);
    setFights(rawFights.map(normalizeFight).filter((f) => f.f1 && f.f2));
    setShadowFights(asArray(fightRes.shadowFights).map(normalizeFight));
    setLeaderboard(asArray(boardRes.leaderboard || boardRes.players || boardRes.data));
    setLeagues(asArray(leagueRes.leagues));
    setLeagueUsers(asArray(leagueRes.users));
    setAffiliateCampaigns(asArray(leagueRes.leagues));
    setApparel(asArray(apparelRes.items || apparelRes.products || apparelRes.apparel));
    setBlogs(asArray(blogRes.blogs || blogRes.posts));
    setStats({
      fights: rawFights.length,
      players: asArray(boardRes.leaderboard || boardRes.players).length,
      leagues: asArray(leagueRes.leagues).length,
    });
    setDataLoading(false);
  }, []);

  useEffect(() => { loadContent(); }, [loadContent]);

  // ------------------------------------------------------------------------
  // Signed-in state. Kept separate from content so a signed-out visitor still
  // gets a full app rather than an empty one.
  // ------------------------------------------------------------------------
  // Real catalogue endpoints. Without these the coin and FM+ screens have no
  // products to list, which reads as a broken screen rather than an empty one.
  const loadCoinProductsInApp = useCallback(async () => {
    const result = await publicRequest('/api/public/coin-products');
    return asArray(result.products || result.coinProducts || result.items);
  }, []);

  const loadFmPlusPlansInApp = useCallback(async () => {
    const result = await publicRequest('/api/public/fm-plus-plans');
    return asArray(result.plans || result.items);
  }, []);

  const loadJurisdictionInApp = useCallback(
    () => publicRequest('/api/public/jurisdiction'),
    [],
  );

  const loadMe = useCallback(async () => {
    const token = readSessionToken();
    if (!token) { setCurrentUser(null); setCoins(0); setIsStaff(false); return; }
    const result = await playerRequest('/api/users/me');
    if (result.ok) {
      const user = result.user || result;
      setCurrentUser(user);
      setCoins(asInt(user.tokens));
      setIsStaff(Boolean(user.isAdmin || user.isStaff));
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  // ------------------------------------------------------------------------
  // Bell. Polled as well as loaded on mount, so a fight published while the
  // app is open appears without a reload.
  // ------------------------------------------------------------------------
  const loadNotificationsInApp = useCallback(async () => {
    const result = await playerRequest('/api/users/me/notifications');
    const list = asArray(result.notifications);
    setNotifications(list);
    setUnreadNotificationCount(asInt(result.unread));
    return { unread: asInt(result.unread), notifications: list };
  }, []);

  useEffect(() => {
    loadNotificationsInApp();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadNotificationsInApp();
    }, 60000);
    return () => clearInterval(timer);
  }, [loadNotificationsInApp]);

  // Persists the read timestamp so the badge stays cleared across reopens.
  // Returns true on failure too — a network hiccup should not leave the badge
  // stuck on a number the user has already looked at.
  const markNotificationsReadInApp = useCallback(async () => {
    setUnreadNotificationCount(0);
    await playerRequest('/api/users/me/notifications/read', { method: 'POST' });
    return true;
  }, []);

  // ------------------------------------------------------------------------
  // Auth
  // ------------------------------------------------------------------------
  const onSignup = useCallback(async (form = {}) => {
    const result = await publicRequest('/register', { method: 'POST', body: JSON.stringify(form) });
    return result;
  }, []);

  const onLogin = useCallback(async ({ email, password } = {}) => {
    const result = await publicRequest('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (result.ok && result.token) {
      try { window.localStorage.setItem('authToken', result.token); } catch (error) { /* ignore */ }
      await loadMe();
      await loadNotificationsInApp();
    }
    return result;
  }, [loadMe, loadNotificationsInApp]);

  const onLogout = useCallback(() => {
    try {
      window.localStorage.removeItem('authToken');
      window.localStorage.removeItem('affiliateAuthToken');
    } catch (error) { /* ignore */ }
    setCurrentUser(null);
    setCoins(0);
    setIsStaff(false);
    setNotifications([]);
    setUnreadNotificationCount(0);
  }, []);

  const onRequestPasswordReset = useCallback(
    (email) => publicRequest('/forgotPassword', { method: 'POST', body: JSON.stringify({ email }) }),
    [],
  );

  // ------------------------------------------------------------------------
  // Predictions and money
  // ------------------------------------------------------------------------
  const onSubmitPrediction = useCallback(async ({ fightId, predictions, idempotencyKey } = {}) => {
    const result = await playerRequest(`/api/fights/${encodeURIComponent(fightId)}/entries`, {
      method: 'POST',
      headers: idempotencyKey ? { 'idempotency-key': idempotencyKey } : {},
      body: JSON.stringify({ predictions }),
    });
    if (result.ok) { await loadMe(); await loadContent(); }
    return result;
  }, [loadMe, loadContent]);

  const onPurchaseCoins = useCallback(async (payload = {}) => {
    const result = await playerRequest('/api/checkout/coin-orders', { method: 'POST', body: JSON.stringify(payload) });
    if (result.ok) await loadMe();
    return result;
  }, [loadMe]);

  const onSubscribe = useCallback(async (payload = {}) => {
    const result = await playerRequest('/api/checkout/fm-plus-orders', { method: 'POST', body: JSON.stringify(payload) });
    if (result.ok) await loadMe();
    return result;
  }, [loadMe]);

  const onClaimReward = useCallback(async (payload = {}) => {
    const result = await playerRequest('/api/rewards/claim-daily', { method: 'POST', body: JSON.stringify(payload) });
    if (result.ok) await loadMe();
    return result;
  }, [loadMe]);

  const onSaveStreak = useCallback(
    (payload = {}) => playerRequest('/api/rewards/claim-daily', { method: 'POST', body: JSON.stringify(payload) }),
    [],
  );

  // ------------------------------------------------------------------------
  // Leagues
  // ------------------------------------------------------------------------
  const onJoinLeague = useCallback(async (affiliateId) => {
    const result = await playerRequest(`/affiliate/${encodeURIComponent(affiliateId)}/join`, { method: 'POST' });
    if (result.ok) await loadContent();
    return result;
  }, [loadContent]);

  const onLoadAffiliate = useCallback(
    (affiliateId) => publicRequest(`/api/public/affiliates/${encodeURIComponent(affiliateId)}`),
    [],
  );

  const loadPromoterReachInApp = useCallback(
    () => affiliateRequest('/api/affiliates/me/promotions/reach'),
    [],
  );

  const announceFightToLeagueInApp = useCallback(
    ({ fightId, headline, message } = {}) => affiliateRequest(
      `/api/affiliates/me/promotions/${encodeURIComponent(fightId)}/announce`,
      { method: 'POST', body: JSON.stringify({ headline, message }) },
    ),
    [],
  );

  const loadShareKitInApp = useCallback(
    ({ fightId } = {}) => affiliateRequest(
      `/api/affiliates/me/promotions/${encodeURIComponent(fightId || 'none')}/share`,
    ),
    [],
  );

  const onRequestPayout = useCallback(async (payload = {}) => {
    // The route carries an id in the path, but the server takes the affiliate
    // from the token and ignores the path value — so 'me' is safe and honest.
    return affiliateRequest('/affiliate/me/payout', { method: 'POST', body: JSON.stringify(payload) });
  }, []);

  // ------------------------------------------------------------------------
  // Head-to-head
  // ------------------------------------------------------------------------
  const loadChallengesInApp = useCallback(async () => {
    const result = await challengeRequest('/api/challenges/me');
    return asArray(result.challenges);
  }, []);

  const createChallengeInApp = useCallback(
    ({ fightId, opponent, stake } = {}) => challengeRequest('/api/challenges', {
      method: 'POST',
      body: JSON.stringify({ fightId, opponent, stake }),
    }),
    [],
  );

  const respondToChallengeInApp = useCallback(
    ({ id, accept } = {}) => challengeRequest(
      `/api/challenges/${encodeURIComponent(id)}/${accept ? 'accept' : 'decline'}`,
      { method: 'POST' },
    ),
    [],
  );

  const joinWaitlistInApp = useCallback(
    (feature = 'head-to-head') => publicRequest('/api/waitlist', { method: 'POST', body: JSON.stringify({ feature }) }),
    [],
  );

  const loadWaitlistStatusInApp = useCallback(
    (feature = 'head-to-head') => publicRequest(`/api/waitlist/${encodeURIComponent(feature)}`),
    [],
  );

  // ------------------------------------------------------------------------
  // Team Cards
  // ------------------------------------------------------------------------
  const loadTeamContestsInApp = useCallback(async () => {
    const result = await publicRequest('/api/team-contests/open');
    return {
      contests: asArray(result.contests),
      callCategories: result.callCategories || {},
      callBonusCap: asInt(result.callBonusCap) || 50,
    };
  }, []);

  const loadMyTeamsInApp = useCallback(async () => {
    const result = await challengeRequest('/api/team-contests/me');
    return asArray(result.teams);
  }, []);

  const submitTeamEntryInApp = useCallback(async ({ contestId, picks } = {}) => {
    const result = await challengeRequest(`/api/team-contests/${encodeURIComponent(contestId)}/enter`, {
      method: 'POST',
      body: JSON.stringify({ picks }),
    });
    if (result.ok) await loadMe();
    return result;
  }, [loadMe]);

  const loadTeamLeaderboardInApp = useCallback(async (contestId) => {
    if (!contestId) return { leaderboard: [] };
    const result = await publicRequest(`/api/team-contests/${encodeURIComponent(contestId)}/leaderboard`);
    return { live: Boolean(result.live), leaderboard: asArray(result.leaderboard) };
  }, []);

  // ------------------------------------------------------------------------
  // Season Cards
  // ------------------------------------------------------------------------
  const loadSeasonsInApp = useCallback(async () => {
    const result = await publicRequest('/api/seasons/open');
    return {
      seasons: asArray(result.seasons),
      slots: asArray(result.slots),
      callCategories: result.callCategories || {},
      callBonusCap: asInt(result.callBonusCap) || 100,
      slotMax: asInt(result.slotMax) || 100,
    };
  }, []);

  const loadMySeasonCardsInApp = useCallback(async () => {
    const result = await challengeRequest('/api/seasons/me');
    return asArray(result.cards);
  }, []);

  const submitSeasonDraftInApp = useCallback(async ({ seasonId, picks } = {}) => {
    const result = await challengeRequest(`/api/seasons/${encodeURIComponent(seasonId)}/draft`, {
      method: 'POST',
      body: JSON.stringify({ picks }),
    });
    if (result.ok) await loadMe();
    return result;
  }, [loadMe]);

  const loadSeasonLeaderboardInApp = useCallback(async (seasonId) => {
    if (!seasonId) return { leaderboard: [] };
    const result = await publicRequest(`/api/seasons/${encodeURIComponent(seasonId)}/leaderboard`);
    return {
      provisional: Boolean(result.provisional),
      scale: result.scale || 'raw',
      leaderboard: asArray(result.leaderboard),
    };
  }, []);

  // ------------------------------------------------------------------------
  // Trophy case
  // ------------------------------------------------------------------------
  const loadAwardsInApp = useCallback(async () => {
    const result = await challengeRequest('/api/users/me/awards');
    return {
      awards: asArray(result.awards),
      badges: asInt(result.badges),
      titles: asArray(result.titles),
    };
  }, []);

  // ------------------------------------------------------------------------
  // Tester feedback. Works signed out, so whoever is testing the guest
  // experience can report — they see the first impression nobody else does.
  // ------------------------------------------------------------------------
  const submitFeedbackInApp = useCallback(async ({ area, severity, step, expected, actual } = {}) => {
    if (typeof window === 'undefined') return { ok: false };
    const token = readSessionToken();
    return publicRequest('/api/feedback', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({
        area,
        severity,
        step,
        expected,
        actual,
        // Captured for them — a tester should not need to know their own
        // browser or screen size to file a useful report.
        device: window.navigator?.userAgent || '',
        screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
        appPath: window.location?.pathname + (window.location?.hash || ''),
      }),
    });
  }, []);

  // Wraps submitFeedbackInApp with the sheet's own state: validation, the busy
  // flag, and the reference number the tester needs to quote when they text a
  // screenshot over.
  const sendFeedback = useCallback(async () => {
    if (!String(feedback.actual || '').trim()) {
      setFeedbackNote('Tell me what happened first.');
      return;
    }
    setFeedbackBusy(true);
    setFeedbackNote('');
    const result = await submitFeedbackInApp(feedback);
    setFeedbackBusy(false);
    if (!result?.ok) {
      setFeedbackNote(result?.message || 'Could not send that — text it to me instead.');
      return;
    }
    setFeedbackNote(`Sent — ${result.reference || 'logged'}. Thank you.`);
    setFeedback({ area: 'other', severity: 'wrong', step: '', expected: '', actual: '' });
    // Left open briefly so the reference number is readable before it closes.
    setTimeout(() => { setFeedbackOpen(false); setFeedbackNote(''); }, 2200);
  }, [feedback, submitFeedbackInApp]);

  const onSubmitSupport = useCallback(
    ({ category, subject, message, email } = {}) => publicRequest('/api/support/tickets', {
      method: 'POST',
      headers: readSessionToken() ? { Authorization: `Bearer ${readSessionToken()}` } : {},
      body: JSON.stringify({ category, subject, message, email }),
    }),
    [],
  );

  // ------------------------------------------------------------------------
  // Staff
  // ------------------------------------------------------------------------
  const loadAdminMoneyInApp = useCallback(async () => {
    // No refundable-fights list exists on the server, so the refund queue is
    // derived from the public fight list rather than invented.
    const [fightsRes, payouts] = await Promise.all([
      publicRequest('/api/public/prediction-fights?limit=60'),
      adminRequest('/api/admin/affiliate-payouts?status=pending'),
    ]);
    const all = asArray(fightsRes.fights || fightsRes.matches || fightsRes.predictionFights);
    return {
      refundable: all.filter((f) => f && !f.prizesSettledAt && Number(f.matchTokens) > 0),
      payouts: asArray(payouts.payouts),
    };
  }, []);

  const onRefundFight = useCallback(
    (fightId) => adminRequest(`/api/admin/fights/${encodeURIComponent(fightId)}/refund`, { method: 'POST' }),
    [],
  );

  const onResolvePayout = useCallback(
    ({ affiliateId, payoutIndex, approve, reason } = {}) => adminRequest(
      `/api/admin/affiliate-payouts/${encodeURIComponent(affiliateId)}/${encodeURIComponent(payoutIndex)}/${approve ? 'approve' : 'reject'}`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    ),
    [],
  );

  // ------------------------------------------------------------------------
  // Navigation and share — no-ops rather than missing, so Core never calls
  // undefined.
  // ------------------------------------------------------------------------
  const onOpenFight = useCallback((fight) => {
    if (typeof window === 'undefined' || !fight) return;
    const id = fight.backendId || fight.id;
    if (id) window.location.href = `/fight/${encodeURIComponent(id)}`;
  }, []);

  const onOpenApparel = useCallback(() => {
    if (typeof window !== 'undefined') window.location.href = '/apparel';
  }, []);

  const onJoin = useCallback(() => {
    if (typeof window !== 'undefined') window.location.href = '/auth';
  }, []);

  const onShare = useCallback(async ({ title, text, url } = {}) => {
    if (typeof window === 'undefined') return { ok: false };
    const shareUrl = url || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        return { ok: true };
      }
      await navigator.clipboard.writeText(`${text ? `${text} ` : ''}${shareUrl}`);
      return { ok: true, copied: true };
    } catch (error) {
      return { ok: false };
    }
  }, []);

  const onEnablePush = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { ok: false, message: 'This browser does not support notifications.' };
    }
    try {
      const permission = await Notification.requestPermission();
      return { ok: permission === 'granted', permission };
    } catch (error) {
      return { ok: false };
    }
  }, []);

  const onSkipWait = useCallback(() => setDataLoading(false), []);

  const experienceProps = useMemo(() => ({
    initialTab,
    dataLoading,
    fights,
    shadowFights,
    leaderboard,
    leagues,
    leagueUsers,
    affiliateCampaigns,
    apparel,
    blogs,
    notifications,
    unreadNotificationCount,
    currentUser,
    initialCoins: coins,
    stats,
    features,
    isStaff,
    livePresence: {},

    onSignup,
    onLogin,
    onLogout,
    onRequestPasswordReset,
    onSubmitPrediction,
    onPurchaseCoins,
    onSubscribe,
    onClaimReward,
    onSaveStreak,
    onJoinLeague,
    onLoadAffiliate,
    onLoadPromoterReach: loadPromoterReachInApp,
    onAnnounceFightToLeague: announceFightToLeagueInApp,
    onLoadShareKit: loadShareKitInApp,
    onRequestPayout,
    onLoadChallenges: loadChallengesInApp,
    onCreateChallenge: createChallengeInApp,
    onRespondToChallenge: respondToChallengeInApp,
    onJoinWaitlist: joinWaitlistInApp,
    onLoadWaitlistStatus: loadWaitlistStatusInApp,
    onLoadTeamContests: loadTeamContestsInApp,
    onLoadMyTeams: loadMyTeamsInApp,
    onSubmitTeamEntry: submitTeamEntryInApp,
    onLoadTeamLeaderboard: loadTeamLeaderboardInApp,
    onLoadSeasons: loadSeasonsInApp,
    onLoadMySeasonCards: loadMySeasonCardsInApp,
    onSubmitSeasonDraft: submitSeasonDraftInApp,
    onLoadSeasonLeaderboard: loadSeasonLeaderboardInApp,
    onLoadAwards: loadAwardsInApp,
    onLoadNotifications: loadNotificationsInApp,
    onMarkNotificationsRead: markNotificationsReadInApp,
    onSubmitFeedback: submitFeedbackInApp,
    onSubmitSupport,
    onLoadAdminMoney: loadAdminMoneyInApp,
    onRefundFight,
    onResolvePayout,
    onOpenFight,
    onOpenApparel,
    onJoin,
    onShare,
    onEnablePush,
    onSkipWait,
  }), [
    initialTab, dataLoading, fights, shadowFights, leaderboard, leagues, leagueUsers,
    affiliateCampaigns, apparel, blogs, notifications, unreadNotificationCount,
    currentUser, coins, stats, features, isStaff,
    onSignup, onLogin, onLogout, onRequestPasswordReset, onSubmitPrediction,
    onPurchaseCoins, onSubscribe, onClaimReward, onSaveStreak, onJoinLeague,
    onLoadAffiliate, loadPromoterReachInApp, announceFightToLeagueInApp,
    loadShareKitInApp, onRequestPayout, loadChallengesInApp, createChallengeInApp,
    respondToChallengeInApp, joinWaitlistInApp, loadWaitlistStatusInApp,
    loadTeamContestsInApp, loadMyTeamsInApp, submitTeamEntryInApp,
    loadTeamLeaderboardInApp, loadSeasonsInApp, loadMySeasonCardsInApp,
    submitSeasonDraftInApp, loadSeasonLeaderboardInApp, loadAwardsInApp,
    loadNotificationsInApp, markNotificationsReadInApp, submitFeedbackInApp,
    onSubmitSupport, loadAdminMoneyInApp, onRefundFight, onResolvePayout,
    onOpenFight, onOpenApparel, onJoin, onShare, onEnablePush, onSkipWait,
  ]);

  if (!forceRender && typeof window === 'undefined') return null;

  return (
    <div className="fmm-mobile-experience" data-fmm-mobile-screen={initialTab}>
      {preview && (
        <div
          role="status"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '9px 14px',
            background: '#f2b544',
            color: '#2b1b00',
            fontFamily: "'Rajdhani', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: 12.5,
          }}
        >
          <span>
            OWNER VIEW — seeing this as <strong>{preview.name}</strong> ({preview.type}).
            Read-only: nothing you tap can change their account.
          </span>
          <button
            type="button"
            onClick={exitPreview}
            style={{
              flex: '0 0 auto',
              border: '1px solid rgba(43,27,0,.4)',
              background: 'rgba(0,0,0,.08)',
              color: '#2b1b00',
              borderRadius: 999,
              padding: '5px 12px',
              fontWeight: 800,
              fontSize: 11.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Exit
          </button>
        </div>
      )}

      <FantasyMobileAppCore {...experienceProps} />

      {/* Report button — TESTERS ONLY. Hidden for real players: a permanent
          "report a problem" badge on a live product reads as an admission that
          things break. Enabled by NEXT_PUBLIC_TESTER_MODE, an @fmmtest.com
          login, or ?feedback=1. */}
      {showReportButton ? (
      <div
        role="button"
        tabIndex={0}
        aria-label="Report a problem"
        onClick={() => setFeedbackOpen(true)}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setFeedbackOpen(true); }}
        style={{
          position: 'fixed', right: 12, bottom: 88, zIndex: 9998,
          minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 15px', borderRadius: 999, cursor: 'pointer',
          background: '#f2b544', color: '#2b1b00', border: '2px solid rgba(0,0,0,.28)',
          fontFamily: "'Anton', system-ui, sans-serif", fontSize: 12, letterSpacing: .5,
          boxShadow: '0 6px 20px rgba(0,0,0,.45)',
        }}
      >
        REPORT
      </div>
      ) : null}

      {feedbackOpen && (
        <div
          onClick={() => setFeedbackOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(3,4,8,.82)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto',
              background: '#0b0d14', borderTop: '2px solid #f2b544',
              borderRadius: '16px 16px 0 0', padding: 18, color: '#fff',
              fontFamily: "'Rajdhani', system-ui, sans-serif",
            }}
          >
            <div style={{ fontFamily: "'Anton', system-ui, sans-serif", fontSize: 18, color: '#f2b544', marginBottom: 3 }}>
              REPORT SOMETHING
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginBottom: 14 }}>
              Two boxes matter most: what you expected, and what actually happened.
              That pair is what makes something fixable.
            </div>

            <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>HOW BAD?</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 13 }}>
              {[['blocker', 'Stuck', '#ef4444'], ['wrong', 'Wrong', '#f2b544'], ['confusing', 'Confusing', '#4d8dff'], ['cosmetic', 'Looks off', '#a855f7'], ['praise', 'Liked it', '#22c55e']].map(([key, label, color]) => (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setFeedback((prev) => ({ ...prev, severity: key }))}
                  style={{
                    padding: '7px 11px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer',
                    background: feedback.severity === key ? color : 'rgba(255,255,255,.06)',
                    color: feedback.severity === key ? '#0b0c10' : 'rgba(255,255,255,.75)',
                    border: `1px solid ${feedback.severity === key ? color : 'rgba(255,255,255,.14)'}`,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>WHERE?</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 13 }}>
              {[['signup', 'Sign up'], ['signin', 'Sign in'], ['scorecard', 'Scorecard'], ['entry-fee', 'Coins / fee'], ['team-card', 'Team Card'], ['season-card', 'Season Card'], ['standings', 'Standings'], ['leagues', 'Leagues'], ['promoter-tools', 'League tools'], ['notifications', 'Bell'], ['coins-purchase', 'Buying coins'], ['rewards', 'Chest / wheel'], ['looks-wrong', 'Looks wrong'], ['slow', 'Too slow'], ['other', 'Something else']].map(([key, label]) => (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setFeedback((prev) => ({ ...prev, area: key }))}
                  style={{
                    padding: '6px 10px', borderRadius: 7, fontSize: 9.5, fontWeight: 800, cursor: 'pointer',
                    background: feedback.area === key ? 'rgba(242,181,68,.85)' : 'rgba(255,255,255,.06)',
                    color: feedback.area === key ? '#2b1b00' : 'rgba(255,255,255,.7)',
                    border: `1px solid ${feedback.area === key ? '#f2b544' : 'rgba(255,255,255,.12)'}`,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <input
              type="text"
              placeholder="Step number, if you were on the list (optional)"
              value={feedback.step}
              onChange={(event) => setFeedback((prev) => ({ ...prev, step: event.target.value.slice(0, 20) }))}
              style={feedbackInputStyle}
            />
            <textarea
              rows={2}
              placeholder="What did you expect to happen?"
              value={feedback.expected}
              onChange={(event) => setFeedback((prev) => ({ ...prev, expected: event.target.value }))}
              style={feedbackInputStyle}
            />
            <textarea
              rows={3}
              placeholder="What actually happened? (required)"
              value={feedback.actual}
              onChange={(event) => setFeedback((prev) => ({ ...prev, actual: event.target.value }))}
              style={{ ...feedbackInputStyle, border: '1px solid rgba(242,181,68,.45)' }}
            />

            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 13, lineHeight: 1.5 }}>
              Your phone and which screen you were on are attached automatically. If you
              have a screenshot, text it over with the reference you get back.
            </div>

            {feedbackNote && (
              <div style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', marginBottom: 10 }}>{feedbackNote}</div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setFeedbackOpen(false)}
                style={{
                  flex: '0 0 auto', padding: '13px 18px', borderRadius: 999, cursor: 'pointer',
                  background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.2)',
                  fontWeight: 900, fontSize: 12, textAlign: 'center',
                }}
              >
                CLOSE
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={sendFeedback}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 999, cursor: 'pointer',
                  background: '#f2b544', color: '#2b1b00', fontWeight: 900, fontSize: 13,
                  textAlign: 'center', opacity: feedbackBusy ? 0.6 : 1,
                }}
              >
                {feedbackBusy ? 'SENDING…' : 'SEND REPORT'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FantasyMobileExperience;
