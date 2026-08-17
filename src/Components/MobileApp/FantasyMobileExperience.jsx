import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/Redux/authSlice';
import { clearUser, setUser } from '@/Redux/userSlice';

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
const EXPERIENCE_CACHE_PREFIX = 'fmm-mobile-v12:';
const EMPTY_DATA = Object.freeze({ fights: [], leaderboard: [], blogs: [], apparel: [], leagues: [], leagueUsers: [], stats: {}, retention: {} });
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

export default function FantasyMobileExperience({ initialTab = 'home', forceRender = false }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(getUser);
  const isStaff = useSelector((state) => Boolean(state?.adminAuth?.isAdminAuthenticated));
  const userId = String(user?._id || user?.id || '').trim();
  const cacheKey = userId || 'guest';
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState(initialTab);
  const [liveRefreshTick, setLiveRefreshTick] = useState(0);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (activeMobileTab !== 'watch' || (!isMobile && !forceRender)) return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setLiveRefreshTick((value) => value + 1);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [activeMobileTab, forceRender, isMobile]);

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

    Promise.allSettled([
      fetchPublicPredictionFights({ limit: 300, hydrateImages: false }),
      fetchPublicFights({ limit: 300, hydrateImages: false }),
      fetchPromotedHomeFights({ limit: 24 }),
      fetchPublicHomeSummary({ fightLimit: 24, leaderboardLimit: 20 }),
      fetchPublicLeaderboard({ limit: 100 }),
      fetchPublicBlogs({ limit: 12 }),
      safeFetchJson('/api/public/apparel-products', { limit: 12 }),
      safeFetchJson('/api/public/leagues', { limit: 30 }),
      userId ? fetchSignedInEntries() : Promise.resolve([]),
    ]).then(([playableResult, publicResult, promotedResult, summaryResult, leaderboardResult, blogsResult, apparelResult, leaguesResult, entriesResult]) => {
      if (!active) return;
      const playableRows = playableResult.status === 'fulfilled' && Array.isArray(playableResult.value) ? playableResult.value : [];
      const publicRows = publicResult.status === 'fulfilled' && Array.isArray(publicResult.value) ? publicResult.value : [];
      const promotedRows = promotedResult.status === 'fulfilled' && Array.isArray(promotedResult.value) ? promotedResult.value : [];
      const summary = summaryResult.status === 'fulfilled' ? summaryResult.value || {} : {};
      const leaderboardPayload = leaderboardResult.status === 'fulfilled' ? leaderboardResult.value || {} : {};
      const blogPayload = blogsResult.status === 'fulfilled' ? blogsResult.value || {} : {};
      const apparelPayload = apparelResult.status === 'fulfilled' ? apparelResult.value || {} : {};
      const leaguePayload = leaguesResult.status === 'fulfilled' ? leaguesResult.value || {} : {};
      const entryRows = entriesResult.status === 'fulfilled' && Array.isArray(entriesResult.value) ? entriesResult.value : [];
      const summaryRows = Array.isArray(summary.featuredFights) ? summary.featuredFights : [];
      const predictionRows = playableRows;
      const predictionByKey = new Map();
      predictionRows.forEach((fight) => {
        [String(getFightId(fight) || '').trim(), getPublicFightDuplicateKey(fight)]
          .filter(Boolean)
          .forEach((key) => {
            if (!predictionByKey.has(key)) predictionByKey.set(key, fight);
          });
      });
      const playableKeys = new Set(predictionRows.flatMap((fight) => [
        String(getFightId(fight) || '').trim(),
        getPublicFightDuplicateKey(fight),
      ]).filter(Boolean));
      const promotedKeys = new Set(promotedRows.flatMap((fight) => [
        String(getFightId(fight) || '').trim(),
        getPublicFightDuplicateKey(fight),
      ]).filter(Boolean));
      const entryByKey = new Map();
      entryRows.forEach((fight) => {
        [String(getFightId(fight) || '').trim(), getPublicFightDuplicateKey(fight)].filter(Boolean).forEach((key) => entryByKey.set(key, fight));
      });
      const fights = sortFights(dedupePublicFights([
        ...promotedRows,
        ...predictionRows,
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

      const nextData = {
        fights,
        leaderboard: Array.isArray(leaderboardPayload.leaderboard)
          ? leaderboardPayload.leaderboard
          : Array.isArray(summary.leaderboard)
            ? summary.leaderboard
            : [],
        blogs: Array.isArray(blogPayload.rows) ? blogPayload.rows : [],
        apparel: Array.isArray(apparelPayload.products) ? apparelPayload.products : [],
        leagues: Array.isArray(leaguePayload.leagues) ? leaguePayload.leagues : [],
        leagueUsers: Array.isArray(leaguePayload.users) ? leaguePayload.users : [],
        stats: summary.stats && typeof summary.stats === 'object' ? summary.stats : {},
        retention: summary.retention && typeof summary.retention === 'object' ? summary.retention : {},
      };
      setData(nextData);
      writeExperienceCache(cacheKey, nextData);
      setIsLoading(false);
    }).catch(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [cacheKey, forceRender, isMobile, liveRefreshTick, userId]);

  const initialCoins = useMemo(
    () => toNumber(user?.tokens, user?.walletTokens, user?.wallet?.balance),
    [user?.tokens, user?.walletTokens, user?.wallet?.balance],
  );
  const isAuthenticated = Boolean(user?._id || user?.id || user?.email);

  const goToCheckout = ({ amount, price, product = 'fm-coins', plan = '', items = [] } = {}) => {
    const serializedCart = Array.isArray(items) && items.length
      ? items
          .map((item) => `${String(item.sku || '').trim()}:${Math.max(1, Number(item.quantity || 1))}`)
          .filter((item) => !item.startsWith(':'))
          .join(',')
      : '';
    const next = `/checkout?product=${encodeURIComponent(product)}${plan ? `&plan=${encodeURIComponent(plan)}` : ''}${amount ? `&amount=${encodeURIComponent(amount)}` : ''}${price ? `&price=${encodeURIComponent(price)}` : ''}${serializedCart ? `&cart=${encodeURIComponent(serializedCart)}` : ''}`;
    router.push(next);
  };

  const submitPrediction = ({ event, prediction } = {}) => {
    const id = String(event?.backendId || event?.id || '').trim();
    const selectedWinner = ['a', 'b'].includes(String(prediction?.winner || '').toLowerCase())
      ? String(prediction.winner).toLowerCase()
      : '';
    if (!isAuthenticated) {
      const destination = id ? `/fight/${id}?play=1${selectedWinner ? `&pick=${selectedWinner}` : ''}` : '/UserDashboard';
      router.push(`/login?next=${encodeURIComponent(destination)}`);
      return false;
    }
    router.push(id ? `/fight/${id}?play=1${selectedWinner ? `&pick=${selectedWinner}` : ''}` : '/UserDashboard');
    return false;
  };

  const joinLeague = async ({ league } = {}) => {
    const leagueId = String(league?._id || league?.id || '').trim();
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent('/FantasyLeagues')}`);
      return false;
    }
    if (!leagueId || !user?._id || !user?.email) return false;
    const response = await fetch(buildPublicApiUrl(`/affiliate/${encodeURIComponent(leagueId)}/join`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id, userEmail: user.email }),
    }).catch(() => null);
    return Boolean(response?.ok);
  };

  const applyAccountResponse = async (response) => {
    if (!response) return false;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.user) return false;
    dispatch(setUser(payload.user));
    return payload;
  };

  const updateProfile = async (draft = {}) => {
    if (!isAuthenticated || !userId || typeof window === 'undefined') return false;
    const token = window.localStorage.getItem('authToken');
    if (!token) return false;
    const body = {};
    ['firstName', 'lastName', 'playerName'].forEach((field) => { body[field] = String(draft[field] || '').trim(); });
    const response = await fetch(buildPublicApiUrl('/api/users/me/profile'), {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null);
    return applyAccountResponse(response);
  };

  const runStreakAction = async (action) => {
    if (!isAuthenticated || typeof window === 'undefined') return false;
    const token = window.localStorage.getItem('authToken');
    if (!token) return false;
    const response = await fetch(buildPublicApiUrl(`/api/users/me/streak/${action}`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).catch(() => null);
    return applyAccountResponse(response);
  };

  const logOut = () => {
    dispatch(logout());
    dispatch(clearUser());
    router.replace('/');
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
        stats={data.stats}
        retention={data.retention}
        onPurchaseCoins={goToCheckout}
        dataLoading={isLoading}
        onSubscribe={({ plan = 'monthly' } = {}) => goToCheckout({ product: 'fm-plus', plan })}
        onSubmitPrediction={submitPrediction}
        onOpenFight={({ event } = {}) => {
          const id = String(event?.backendId || event?.id || '').trim();
          router.push(id ? `/fight/${id}` : '/upcomingfights');
        }}
        onJoinLeague={joinLeague}
        onJoin={({ name = '', email = '' } = {}) => {
          const query = new URLSearchParams();
          if (name.trim()) query.set('playerName', name.trim());
          if (email.trim()) query.set('email', email.trim());
          router.push(`/CreateAccount${query.toString() ? `?${query.toString()}` : ''}`);
        }}
        onOpenApparel={() => router.push('/apparel')}
        onUpdateProfile={updateProfile}
        onLogout={logOut}
        onClaimReward={() => runStreakAction('claim')}
        onSaveStreak={() => runStreakAction('save')}
        onSkipStreakWait={() => runStreakAction('skip-wait')}
        onOpenFaqs={() => router.push('/faqs')}
        onSupport={({ message = '' } = {}) => {
          router.push(`/contact${message ? `?message=${encodeURIComponent(message)}` : ''}`);
          return true;
        }}
        onOpenAffiliateDashboard={() => router.push('/AffiliateDashboard')}
        onTabChange={setActiveMobileTab}
        onShare={share}
      />
    </div>
  );
}
