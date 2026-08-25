import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

import {
  buildPublicApiUrl,
  fetchPublicBlogs,
  fetchPublicFights,
  fetchPublicHomeSummary,
  fetchPublicLeaderboard,
  fetchPublicPredictionFights,
  fetchPromotedHomeFights,
  safeFetchJson,
} from '@/Utils/publicApi';
import { dedupePublicFights, getFightId, getPublicFightDuplicateKey, sortFights } from '@/Utils/fightExperience';
import FantasyMobileAppCore from './FantasyMobileAppCore';

const MOBILE_QUERY = '(max-width: 767px)';
const EXPERIENCE_CACHE_PREFIX = 'fmm-mobile-v7:';
const EMPTY_DATA = Object.freeze({ fights: [], leaderboard: [], blogs: [], apparel: [], leagues: [], leagueUsers: [], notifications: [], shadowFights: [], affiliateCampaigns: [], stats: {} });
const memoryExperienceCache = new Map();

const readExperienceCache = (key) => {
  if (memoryExperienceCache.has(key)) return memoryExperienceCache.get(key);
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(EXPERIENCE_CACHE_PREFIX + key) || 'null');
    if (parsed?.data && Date.now() - Number(parsed.savedAt || 0) < 30 * 60 * 1000) {
      memoryExperienceCache.set(key, parsed.data);
      return parsed.data;
    }
  } catch (_error) {}
  return null;
};

const writeExperienceCache = (key, value) => {
  memoryExperienceCache.set(key, value);
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(EXPERIENCE_CACHE_PREFIX + key, JSON.stringify({ savedAt: Date.now(), data: value }));
  } catch (_error) {}
};

const fetchSignedInEntries = async () => {
  if (typeof window === 'undefined') return [];
  const token = window.localStorage.getItem('authToken');
  if (!token) return [];
  const response = await fetch(buildPublicApiUrl('/api/users/me/fight-entries?limit=150'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];
  const payload = await response.json().catch(() => ({}));
  return Array.isArray(payload.entries) ? payload.entries : [];
};

const fetchSignedInNotifications = async (userId) => {
  if (!userId) return [];
  const response = await fetch(buildPublicApiUrl(`/notifications/${encodeURIComponent(userId)}`));
  if (!response.ok) return [];
  const payload = await response.json().catch(() => []);
  return Array.isArray(payload) ? payload : Array.isArray(payload.notifications) ? payload.notifications : [];
};

const getUser = (state) => {
  const direct = state?.user;
  if (direct?._id || direct?.email || direct?.playerName) return direct;
  if (direct?.user?._id || direct?.user?.email) return direct.user;
  return state?.auth?.user || null;
};

const toNumber = (...values) => {
  for (const value of values) {
    const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};


const composeExperienceData = ({
  playableRows = [],
  publicRows = [],
  promotedRows = [],
  summary = {},
  leaderboardPayload = {},
  blogPayload = {},
  apparelPayload = {},
  leaguePayload = {},
  entryRows = [],
  notificationRows = [],
}, base = EMPTY_DATA) => {
  const summaryRows = Array.isArray(summary.featuredFights) ? summary.featuredFights : [];
  const predictionByKey = new Map();
  playableRows.forEach((fight) => {
    [String(getFightId(fight) || '').trim(), getPublicFightDuplicateKey(fight)]
      .filter(Boolean)
      .forEach((key) => {
        if (!predictionByKey.has(key)) predictionByKey.set(key, fight);
      });
  });
  const playableKeys = new Set(playableRows.flatMap((fight) => [
    String(getFightId(fight) || '').trim(),
    getPublicFightDuplicateKey(fight),
  ]).filter(Boolean));
  const promotedKeys = new Set(promotedRows.flatMap((fight) => [
    String(getFightId(fight) || '').trim(),
    getPublicFightDuplicateKey(fight),
  ]).filter(Boolean));
  const entryByKey = new Map();
  entryRows.forEach((fight) => {
    [String(getFightId(fight) || '').trim(), getPublicFightDuplicateKey(fight)]
      .filter(Boolean)
      .forEach((key) => entryByKey.set(key, fight));
  });

  const fights = sortFights(dedupePublicFights([
    ...promotedRows,
    ...playableRows,
    ...entryRows,
    ...summaryRows,
    ...publicRows,
  ]), 'asc')
    .map((fight) => {
      const keys = [String(getFightId(fight) || '').trim(), getPublicFightDuplicateKey(fight)].filter(Boolean);
      const predictionFight = keys.map((key) => predictionByKey.get(key)).find(Boolean);
      const entryFight = keys.map((key) => entryByKey.get(key)).find(Boolean);
      const mergedFight = predictionFight ? {
        ...fight,
        ...predictionFight,
        homepagePromotion: predictionFight.homepagePromotion || fight.homepagePromotion,
        fightPosterMobileImage: predictionFight.fightPosterMobileImage || fight.fightPosterMobileImage,
        fightPosterImage: predictionFight.fightPosterImage || fight.fightPosterImage,
        posterImage: predictionFight.posterImage || fight.posterImage,
        matchPosterImage: predictionFight.matchPosterImage || fight.matchPosterImage,
        bannerImage: predictionFight.bannerImage || fight.bannerImage,
        promotionBackground: predictionFight.promotionBackground || fight.promotionBackground,
      } : fight;
      const withEntry = entryFight ? {
        ...mergedFight,
        ...entryFight,
        homepagePromotion: mergedFight.homepagePromotion || entryFight.homepagePromotion,
        fightPosterMobileImage: mergedFight.fightPosterMobileImage || entryFight.fightPosterMobileImage,
        fightPosterImage: mergedFight.fightPosterImage || entryFight.fightPosterImage,
        posterImage: mergedFight.posterImage || entryFight.posterImage,
        matchPosterImage: mergedFight.matchPosterImage || entryFight.matchPosterImage,
        bannerImage: mergedFight.bannerImage || entryFight.bannerImage,
        promotionBackground: mergedFight.promotionBackground || entryFight.promotionBackground,
      } : mergedFight;
      return {
        ...withEntry,
        __playable: keys.some((key) => playableKeys.has(key)),
        __homepagePromoted: keys.some((key) => promotedKeys.has(key)),
      };
    })
    .sort((left, right) => Number(Boolean(right.__homepagePromoted)) - Number(Boolean(left.__homepagePromoted)));

  return {
    ...base,
    fights: fights.length ? fights : base.fights,
    leaderboard: Array.isArray(leaderboardPayload.leaderboard)
      ? leaderboardPayload.leaderboard
      : Array.isArray(summary.leaderboard)
        ? summary.leaderboard
        : base.leaderboard,
    blogs: Array.isArray(blogPayload.rows) ? blogPayload.rows : base.blogs,
    apparel: Array.isArray(apparelPayload.products) ? apparelPayload.products : base.apparel,
    leagues: Array.isArray(leaguePayload.leagues) ? leaguePayload.leagues : base.leagues,
    leagueUsers: Array.isArray(leaguePayload.users) ? leaguePayload.users : base.leagueUsers,
    notifications: notificationRows.length ? notificationRows : base.notifications,
    shadowFights: (fights.length ? fights : base.fights).filter((fight) => Boolean(
      fight.isShadow || fight.is_shadow || String(fight.fightType || fight.collection || '').toLowerCase().includes('shadow')
    )),
    affiliateCampaigns: Array.isArray(leaguePayload.affiliateCampaigns) ? leaguePayload.affiliateCampaigns : base.affiliateCampaigns,
    stats: summary.stats && typeof summary.stats === 'object' ? summary.stats : base.stats,
  };
};

export default function FantasyMobileExperience({ initialTab = 'home', forceRender = false }) {
  const router = useRouter();
  const user = useSelector(getUser);
  const isStaff = useSelector((state) => Boolean(state?.adminAuth?.isAdminAuthenticated));
  const userId = String(user?._id || user?.id || '').trim();
  const cacheKey = userId || 'guest';
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (!isMobile && !forceRender) return undefined;
    let active = true;
    const cached = readExperienceCache(cacheKey);
    if (cached) {
      setData(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    // Keep the initial product view fast. The hero is static and paints immediately;
    // only the small fight/summary payload is required before live sections unlock.
    const criticalPromise = Promise.allSettled([
      fetchPublicPredictionFights({ limit: 80, hydrateImages: false }),
      fetchPromotedHomeFights({ limit: 12 }),
      fetchPublicHomeSummary({ fightLimit: 12, leaderboardLimit: 12 }),
      userId ? fetchSignedInEntries() : Promise.resolve([]),
    ]);

    // Secondary collections are intentionally parallel but are not allowed to block
    // the first useful render. This removes the old "wait for the slowest of 10 APIs" behavior.
    const secondaryPromise = Promise.allSettled([
      fetchPublicFights({ limit: 100, hydrateImages: false }),
      fetchPublicLeaderboard({ limit: 24 }),
      fetchPublicBlogs({ limit: 6 }),
      safeFetchJson('/api/public/apparel-products', { limit: 8 }),
      safeFetchJson('/api/public/leagues', { limit: 12 }),
      userId ? fetchSignedInNotifications(userId) : Promise.resolve([]),
    ]);

    criticalPromise.then(([playableResult, promotedResult, summaryResult, entriesResult]) => {
      if (!active) return;
      const partial = composeExperienceData({
        playableRows: playableResult.status === 'fulfilled' && Array.isArray(playableResult.value) ? playableResult.value : [],
        promotedRows: promotedResult.status === 'fulfilled' && Array.isArray(promotedResult.value) ? promotedResult.value : [],
        summary: summaryResult.status === 'fulfilled' ? summaryResult.value || {} : {},
        entryRows: entriesResult.status === 'fulfilled' && Array.isArray(entriesResult.value) ? entriesResult.value : [],
      }, cached || EMPTY_DATA);
      setData(partial);
      setIsLoading(false);
    }).catch(() => {
      if (active) setIsLoading(false);
    });

    Promise.all([criticalPromise, secondaryPromise]).then(([criticalResults, secondaryResults]) => {
      if (!active) return;
      const [playableResult, promotedResult, summaryResult, entriesResult] = criticalResults;
      const [publicResult, leaderboardResult, blogsResult, apparelResult, leaguesResult, notificationsResult] = secondaryResults;
      const nextData = composeExperienceData({
        playableRows: playableResult.status === 'fulfilled' && Array.isArray(playableResult.value) ? playableResult.value : [],
        publicRows: publicResult.status === 'fulfilled' && Array.isArray(publicResult.value) ? publicResult.value : [],
        promotedRows: promotedResult.status === 'fulfilled' && Array.isArray(promotedResult.value) ? promotedResult.value : [],
        summary: summaryResult.status === 'fulfilled' ? summaryResult.value || {} : {},
        leaderboardPayload: leaderboardResult.status === 'fulfilled' ? leaderboardResult.value || {} : {},
        blogPayload: blogsResult.status === 'fulfilled' ? blogsResult.value || {} : {},
        apparelPayload: apparelResult.status === 'fulfilled' ? apparelResult.value || {} : {},
        leaguePayload: leaguesResult.status === 'fulfilled' ? leaguesResult.value || {} : {},
        entryRows: entriesResult.status === 'fulfilled' && Array.isArray(entriesResult.value) ? entriesResult.value : [],
        notificationRows: notificationsResult.status === 'fulfilled' && Array.isArray(notificationsResult.value) ? notificationsResult.value : [],
      }, cached || EMPTY_DATA);
      setData(nextData);
      writeExperienceCache(cacheKey, nextData);
      setIsLoading(false);
    }).catch(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [cacheKey, forceRender, isMobile, userId]);

  const initialCoins = useMemo(
    () => toNumber(user?.tokens, user?.walletTokens, user?.wallet?.balance),
    [user?.tokens, user?.walletTokens, user?.wallet?.balance],
  );
  const isAuthenticated = Boolean(user?._id || user?.id || user?.email);

  // In-app auth. Returns { ok, message } so the app core can show inline errors
  // instead of navigating the user out to /auth.
  const persistSession = (payload) => {
    if (payload?.token && typeof window !== 'undefined') {
      window.localStorage.setItem('authToken', payload.token);
      // A guest may have bought coins before creating an account. Attach any
      // completed order made with this email so the purchase is never stranded.
      fetch(buildPublicApiUrl('/api/checkout/claim-guest-orders'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${payload.token}` },
      }).catch(() => {});
    }
  };

  const loginInApp = async ({ email, password } = {}) => {
    try {
      const response = await fetch(buildPublicApiUrl('/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return { ok: false, message: payload?.message || 'Invalid email or password.' };
      persistSession(payload);
      router.replace(router.asPath);
      return { ok: true, user: payload?.user };
    } catch (error) {
      return { ok: false, message: 'Could not reach the server.' };
    }
  };

  const signupInApp = async ({ email, password, name } = {}) => {
    try {
      const [firstName, ...rest] = String(name || '').trim().split(/\s+/);
      const response = await fetch(buildPublicApiUrl('/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          playerName: name,
          firstName: firstName || name,
          lastName: rest.join(' '),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return { ok: false, message: payload?.message || 'Could not create that account.' };
      // Registration may require email verification before a token is issued.
      if (payload?.token) {
        persistSession(payload);
        router.replace(router.asPath);
        return { ok: true, user: payload?.user };
      }
      return { ok: false, message: payload?.message || 'Check your email to verify your account, then sign in.' };
    } catch (error) {
      return { ok: false, message: 'Could not reach the server.' };
    }
  };

  // Affiliate dashboard data, loaded in-app.
  const loadAffiliateInApp = async () => {
    if (typeof window === 'undefined') return { ok: false, message: 'Unavailable.' };
    const token = window.localStorage.getItem('authToken');
    if (!token) return { ok: false, message: 'Sign in to view your affiliate dashboard.' };
    try {
      const profileResponse = await fetch(buildPublicApiUrl('/profileAffiliate'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileResponse.ok) {
        return { ok: false, message: profileResponse.status === 404 ? 'No affiliate account found for this login.' : 'Could not load your affiliate profile.' };
      }
      const profilePayload = await profileResponse.json().catch(() => ({}));
      const profile = profilePayload?.user || null;
      const affiliateId = String(profile?._id || '').trim();

      let promoted = [];
      if (affiliateId) {
        const promotedResponse = await fetch(
          buildPublicApiUrl(`/api/affiliate/${encodeURIComponent(affiliateId)}/promoted-fights?limit=100&includeShadow=true`)
        ).catch(() => null);
        if (promotedResponse?.ok) {
          const promotedPayload = await promotedResponse.json().catch(() => ({}));
          promoted = Array.isArray(promotedPayload) ? promotedPayload
            : Array.isArray(promotedPayload?.fights) ? promotedPayload.fights
            : Array.isArray(promotedPayload?.data) ? promotedPayload.data
            : [];
        }
      }
      return { ok: true, profile, promoted };
    } catch (error) {
      return { ok: false, message: 'Could not reach the server.' };
    }
  };

  const requestPayoutInApp = async ({ amount } = {}) => {
    if (typeof window === 'undefined') return { ok: false };
    const token = window.localStorage.getItem('authToken');
    if (!token) return { ok: false, message: 'Sign in first.' };
    try {
      const profileResponse = await fetch(buildPublicApiUrl('/profileAffiliate'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profilePayload = await profileResponse.json().catch(() => ({}));
      const affiliateId = String(profilePayload?.user?._id || '').trim();
      if (!affiliateId) return { ok: false, message: 'Affiliate account not found.' };

      const response = await fetch(buildPublicApiUrl(`/affiliate/${encodeURIComponent(affiliateId)}/payout`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return { ok: false, message: payload?.message || 'Payout request failed.' };
      return { ok: true };
    } catch (error) {
      return { ok: false, message: 'Could not reach the server.' };
    }
  };

  // Renew the session on launch so an active player is never logged out at the
  // moment they try to enter a fight.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem('authToken');
    if (!token) return;
    fetch(buildPublicApiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.token) window.localStorage.setItem('authToken', payload.token);
      })
      .catch(() => {});
  }, []);

  // Admin money tools (staff only). Refundable fights + the payout work queue.
  const loadAdminMoneyInApp = async () => {
    if (typeof window === 'undefined') return { refundable: [], payouts: [] };
    const token = window.localStorage.getItem('adminToken') || window.localStorage.getItem('authToken');
    if (!token) return { refundable: [], payouts: [] };
    const auth = { Authorization: `Bearer ${token}` };
    try {
      const payoutResponse = await fetch(buildPublicApiUrl('/api/admin/affiliate-payouts?status=pending'), { headers: auth }).catch(() => null);
      const payoutPayload = payoutResponse?.ok ? await payoutResponse.json().catch(() => ({})) : {};
      const payouts = (payoutPayload?.payouts || []).map((row) => ({
        id: `${row.affiliateId}:${row.payoutIndex}`,
        affiliateId: row.affiliateId,
        payoutIndex: row.payoutIndex,
        name: row.name || 'Affiliate',
        email: row.email || '',
        method: row.preferredPaymentMethod || '',
        amount: Number(row.amount) || 0,
        status: String(row.status || 'pending').toLowerCase(),
      }));

      // Fights that currently hold entries, offered as refund candidates.
      const refundable = (data.fights || [])
        .filter((fight) => (Array.isArray(fight.userPredictions) ? fight.userPredictions.length : 0) > 0)
        .slice(0, 12)
        .map((fight) => ({
          id: String(fight._id || fight.id || ''),
          name: `${fight.matchFighterA || 'Fighter A'} vs ${fight.matchFighterB || 'Fighter B'}`,
          players: Array.isArray(fight.userPredictions) ? fight.userPredictions.length : 0,
          pot: Number(fight.pot) || 0,
          refunded: false,
        }));

      return { refundable, payouts };
    } catch (error) {
      return { refundable: [], payouts: [] };
    }
  };

  const refundFightInApp = async ({ fightId, reason } = {}) => {
    if (typeof window === 'undefined') return false;
    const token = window.localStorage.getItem('adminToken') || window.localStorage.getItem('authToken');
    if (!token || !fightId) return false;
    const response = await fetch(buildPublicApiUrl(`/api/admin/fights/${encodeURIComponent(fightId)}/refund`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    }).catch(() => null);
    return Boolean(response?.ok);
  };

  const resolvePayoutInApp = async ({ payout, action } = {}) => {
    if (typeof window === 'undefined' || !payout) return false;
    const token = window.localStorage.getItem('adminToken') || window.localStorage.getItem('authToken');
    if (!token) return false;
    const response = await fetch(
      buildPublicApiUrl(`/api/admin/affiliate-payouts/${encodeURIComponent(payout.affiliateId)}/${payout.payoutIndex}/${action}`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      }
    ).catch(() => null);
    return Boolean(response?.ok);
  };

  // Password reset. Uses the existing backend endpoint, and deliberately does
  // not reveal whether an email is registered — that would let anyone probe for
  // valid accounts.
  const requestPasswordResetInApp = async ({ email } = {}) => {
    try {
      const response = await fetch(buildPublicApiUrl('/forgotPassword-user'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok || response.status === 404) return { ok: true };
      const payload = await response.json().catch(() => ({}));
      return { ok: false, message: payload?.message || 'Could not start a reset.' };
    } catch (error) {
      return { ok: false, message: 'Could not reach the server.' };
    }
  };

  // Paid micro-purchases. The server owns the price — we never send a cost, so
  // a caller cannot set their own. FM+ discount is applied server-side from the
  // real subscription state.
  const walletSpend = async (purpose) => {
    if (typeof window === 'undefined') return { ok: false };
    const token = window.localStorage.getItem('authToken');
    if (!token) return { ok: false, message: 'Sign in first.' };
    try {
      const response = await fetch(buildPublicApiUrl('/api/wallet/spend'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ purpose }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        // Short on coins? Send them to buy, not to a dead end.
        if (payload?.code === 'INSUFFICIENT_FUNDS') goToCheckout({ product: 'fm-coins' });
        return { ok: false, message: payload?.message };
      }
      return { ok: true, coins: payload.coins, streakExpiresIn: payload.streakExpiresIn };
    } catch (error) {
      return { ok: false, message: 'Could not reach the server.' };
    }
  };

  const saveStreakInApp = () => walletSpend('streak_save');
  const skipWaitInApp = () => walletSpend('skip_wait');

  const claimDailyRewardInApp = async () => {
    if (typeof window === 'undefined') return { ok: false };
    const token = window.localStorage.getItem('authToken');
    if (!token) return { ok: false, message: 'Sign in to claim your daily reward.' };
    try {
      const response = await fetch(buildPublicApiUrl('/api/rewards/claim-daily'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return { ok: false, message: payload?.message };
      return { ok: true, coins: payload.coins, awarded: payload.awarded, streak: payload.streak };
    } catch (error) {
      return { ok: false, message: 'Could not reach the server.' };
    }
  };

  // Persists the read timestamp so the badge stays cleared across reopens.
  // Returns true on failure too — a network hiccup should not leave the badge
  // stuck on a number the user has already looked at.
  const markNotificationsReadInApp = async () => {
    if (typeof window === 'undefined') return true;
    const token = window.localStorage.getItem('authToken');
    if (!token) return true;
    try {
      await fetch(buildPublicApiUrl('/api/users/me/notifications/read'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      // non-fatal
    }
    return true;
  };

  const goToCheckout = ({ amount, price, product = 'fm-coins', plan = '', items = [] } = {}) => {
    const serializedCart = Array.isArray(items) && items.length
      ? items
          .map((item) => `${String(item.sku || '').trim()}:${Math.max(1, Number(item.quantity || 1))}`)
          .filter((item) => !item.startsWith(':'))
          .join(',')
      : '';
    // Send the user back into the app after a successful payment instead of the
    // website home page. MembershipCheckout already honours `returnTo` (and
    // validates it is a relative path) — it just was never being passed.
    const returnTo = String(router.asPath || '').split('?')[0] || '';
    const next = `/checkout?product=${encodeURIComponent(product)}${plan ? `&plan=${encodeURIComponent(plan)}` : ''}${amount ? `&amount=${encodeURIComponent(amount)}` : ''}${price ? `&price=${encodeURIComponent(price)}` : ''}${serializedCart ? `&cart=${encodeURIComponent(serializedCart)}` : ''}${returnTo.startsWith('/') && !returnTo.startsWith('//') ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`;
    router.push(next);
  };

  // Point values must match src/Utils/scoringRules.js — the backend scores off
  // these numbers, not off labels.
  const SCORE_RW = 100;
  const SCORE_RL = 25;
  const SCORE_KO = 500;
  const SCORE_SP = 25;

  // The app's scorecards are whole-fight (one card), while the API stores an
  // array of round objects. A fight-level pick becomes a single round entry.
  const draftToRounds = (type, prediction = {}) => {
    const num = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : '';
    };
    const finish = String(prediction.outcome || prediction.finishTypePrediction || '').toLowerCase();
    const isFinish = ['ko', 'tko', 'submission', 'finish', 'pinfall'].some((token) => finish.includes(token));
    const finishSide = String(prediction.outcome || '').toLowerCase();

    const buildRound = (source, index, roundWinner) => {
      const a = source.a || {};
      const b = source.b || {};
      const winner = String(roundWinner || '').toLowerCase();
      const aWins = winner === 'a';
      const hasWinner = winner === 'a' || winner === 'b';
      // The finish bonus belongs to the round the fight is predicted to end in.
      // With no explicit finish round, attribute it to the last round.
      const koAppliesHere = isFinish && (index === (Array.isArray(prediction.rounds) ? prediction.rounds.length - 1 : 0));
      const koA = koAppliesHere && finishSide === 'a';
      const koB = koAppliesHere && finishSide === 'b';

      return {
        round: index + 1,
        hpPrediction1: num(a.hp), hpPrediction2: num(b.hp),
        bpPrediction1: num(a.bp), bpPrediction2: num(b.bp),
        tpPrediction1: num(a.tp), tpPrediction2: num(b.tp),
        kiPrediction1: num(a.kicks ?? a.k), kiPrediction2: num(b.kicks ?? b.k),
        knPrediction1: num(a.knees), knPrediction2: num(b.knees),
        elPrediction1: num(a.elbows), elPrediction2: num(b.elbows),
        pmPrediction1: num(a.pm), pmPrediction2: num(b.pm),
        fmPrediction1: num(a.fm), fmPrediction2: num(b.fm),
        rwPrediction1: hasWinner ? (aWins ? SCORE_RW : SCORE_RL) : 0,
        rwPrediction2: hasWinner ? (aWins ? SCORE_RL : SCORE_RW) : 0,
        koPrediction1: koA ? SCORE_KO : koB ? SCORE_SP : 0,
        koPrediction2: koB ? SCORE_KO : koA ? SCORE_SP : 0,
        rwText: hasWinner && aWins ? 'RW' : 'RL',
        rlText: hasWinner && aWins ? 'RL' : 'RW',
        koText: 'KO',
        spText: 'SP',
      };
    };

    // Round-based sports send one object PER ROUND — the scoring engine indexes
    // predictions[i] against that round's actual stats, so a single-object card
    // would score against round 1 only and silently forfeit every other round.
    if (Array.isArray(prediction.rounds) && prediction.rounds.length) {
      return prediction.rounds.map((round, index) => buildRound(round, index, round.winner));
    }

    // Pro Wrestling: one continuous match, one card.
    return [buildRound(prediction, 0, prediction.winner)];
  };

  // Submits the prediction WITHOUT leaving the app. Returns true so the app core
  // continues into its own confirmation, coin update and receipt.
  const submitPrediction = async ({ type, event, prediction } = {}) => {
    const id = String(event?.backendId || event?.id || '').trim();
    if (!id) return true;

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
    if (!token) {
      // Guest: the app core opens its own auth modal and re-runs this submit
      // afterwards, so the picks are never lost to a page navigation.
      return false;
    }

    const idempotencyKey = typeof window !== 'undefined' && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `fmm-app-entry-${id}-${Date.now()}`;

    try {
      const response = await fetch(buildPublicApiUrl(`/api/fights/${id}/entries`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          predictions: draftToRounds(type, prediction),
          category: event?.sport || event?.category || '',
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Not enough coins — open the in-app coin flow instead of a dead end.
        if (payload?.code === 'INSUFFICIENT_FUNDS') {
          goToCheckout({ product: 'fm-coins' });
          return false;
        }
        if (payload?.code === 'UNAUTHENTICATED') {
          return false;
        }
        // Locked / already entered / validation — let the app core show its own
        // message rather than navigating the user away mid-flow.
        console.warn('Entry rejected:', payload?.code, payload?.message);
        return false;
      }

      // Server balance is authoritative — never subtract locally. The next data
      // refresh pulls the real wallet value; the app core shows an optimistic
      // figure until then.
      return true;
    } catch (error) {
      console.error('In-app entry failed:', error);
      return false;
    }
  };

  const joinLeague = async ({ league } = {}) => {
    const leagueId = String(league?._id || league?.id || '').trim();
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent('/FantasyLeagues')}`);
      return false;
    }
    if (!leagueId || !user?._id || !user?.email) return false;
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('authToken') : '';
    const response = await fetch(buildPublicApiUrl(`/affiliate/${encodeURIComponent(leagueId)}/join`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // userId is derived server-side from the token; only the email is sent.
      body: JSON.stringify({ userEmail: user.email }),
    }).catch(() => null);
    return Boolean(response?.ok);
  };

  const share = async ({ platform, text } = {}) => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://www.fantasymmadness.com';
    if (navigator.share) {
      await navigator.share({ title: 'Fantasy MMAdness', text: text || 'Join my Fantasy MMAdness fight card.', url }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => {});
    if (platform === 'X') window.open(`https://x.com/intent/post?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
  };

  const enableBrowserAlerts = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { ok: false, message: 'This browser does not support alerts.' };
    }
    const permission = await window.Notification.requestPermission();
    return permission === 'granted'
      ? { ok: true, message: 'Browser alerts enabled.' }
      : { ok: false, message: 'Browser alert permission was not granted.' };
  };

  return (
    <div
      className={`fmm-exact-mobile-portal ${forceRender ? (isMobile ? 'is-phone-shell' : 'is-desktop-shell') : 'is-responsive-shell is-phone-shell'}`}
      data-fmm-mobile-screen={initialTab}
    >
      <FantasyMobileAppCore
        initialTab={initialTab}
        initialCoins={isAuthenticated ? initialCoins ?? 0 : undefined}
        isStaff={isStaff}
        currentUser={user}
        fights={data.fights}
        leaderboard={data.leaderboard}
        blogs={data.blogs}
        apparel={data.apparel}
        leagues={data.leagues}
        leagueUsers={data.leagueUsers}
        notifications={data.notifications}
        unreadNotificationCount={data.notifications.filter((item) => !(item.read || item.isRead)).length}
        shadowFights={data.shadowFights}
        affiliateCampaigns={data.affiliateCampaigns}
        livePresence={{ viewerCount: toNumber(data.stats?.watchPartyViewers, data.stats?.liveViewerCount) || 0 }}
        stats={data.stats}
        onPurchaseCoins={goToCheckout}
        dataLoading={isLoading}
        onSubscribe={() => goToCheckout({ product: 'fm-plus', plan: 'pass' })}
        onSubmitPrediction={submitPrediction}
        onOpenFight={({ event } = {}) => {
          const id = String(event?.backendId || event?.id || '').trim();
          router.push(id ? `/fight/${id}` : '/upcomingfights');
        }}
        onJoinLeague={joinLeague}
        onSaveStreak={saveStreakInApp}
        onSkipWait={skipWaitInApp}
        onClaimReward={claimDailyRewardInApp}
        onMarkNotificationsRead={markNotificationsReadInApp}
        onLogin={loginInApp}
        onRequestPasswordReset={requestPasswordResetInApp}
        onSignup={signupInApp}
        onLoadAffiliate={loadAffiliateInApp}
        onRequestPayout={requestPayoutInApp}
        onLoadAdminMoney={loadAdminMoneyInApp}
        onRefundFight={refundFightInApp}
        onResolvePayout={resolvePayoutInApp}
        onJoin={({ name = '', email = '' } = {}) => {
          const query = new URLSearchParams();
          if (name.trim()) query.set('playerName', name.trim());
          if (email.trim()) query.set('email', email.trim());
          router.push(`/CreateAccount${query.toString() ? `?${query.toString()}` : ''}`);
        }}
        onOpenApparel={() => router.push('/apparel')}        onOpenAffiliateDashboard={() => router.push(isAuthenticated ? '/AffiliateDashboard' : `/login?next=${encodeURIComponent('/AffiliateDashboard')}`)}
        onEnablePush={enableBrowserAlerts}
        onShare={share}
      />
    </div>
  );
}
