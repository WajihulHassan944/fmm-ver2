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

    Promise.allSettled([
      fetchPublicPredictionFights({ limit: 300, hydrateImages: false }),
      fetchPublicFights({ limit: 300, hydrateImages: false }),
      fetchPromotedHomeFights({ limit: 24 }),
      fetchPublicHomeSummary({ fightLimit: 24, leaderboardLimit: 20 }),
      fetchPublicLeaderboard({ limit: 50 }),
      fetchPublicBlogs({ limit: 12 }),
      safeFetchJson('/api/public/apparel-products', { limit: 12 }),
      safeFetchJson('/api/public/leagues', { limit: 30 }),
      userId ? fetchSignedInEntries() : Promise.resolve([]),
      userId ? fetchSignedInNotifications(userId) : Promise.resolve([]),
    ]).then(([playableResult, publicResult, promotedResult, summaryResult, leaderboardResult, blogsResult, apparelResult, leaguesResult, entriesResult, notificationsResult]) => {
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
      const notificationRows = notificationsResult.status === 'fulfilled' && Array.isArray(notificationsResult.value) ? notificationsResult.value : [];
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
        notifications: notificationRows,
        shadowFights: fights.filter((fight) => Boolean(fight.isShadow || fight.is_shadow || String(fight.fightType || fight.collection || '').toLowerCase().includes('shadow'))),
        affiliateCampaigns: Array.isArray(leaguePayload.affiliateCampaigns) ? leaguePayload.affiliateCampaigns : [],
        stats: summary.stats && typeof summary.stats === 'object' ? summary.stats : {},
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
  }, [cacheKey, forceRender, isMobile, userId]);

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
    const destination = id ? `/fight/${id}?play=1${selectedWinner ? `&pick=${selectedWinner}` : ''}` : '/UserDashboard';
    // Prediction CTAs must open the real fight/prediction flow first. Guests can
    // review the fight there and are asked to authenticate only when entry is required.
    router.push(destination);
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
        onJoin={({ name = '', email = '' } = {}) => {
          const query = new URLSearchParams();
          if (name.trim()) query.set('playerName', name.trim());
          if (email.trim()) query.set('email', email.trim());
          router.push(`/CreateAccount${query.toString() ? `?${query.toString()}` : ''}`);
        }}
        onOpenApparel={() => router.push('/apparel')}
        onOpenAffiliateDashboard={() => router.push(isAuthenticated ? '/AffiliateDashboard' : `/login?next=${encodeURIComponent('/AffiliateDashboard')}`)}
        onEnablePush={enableBrowserAlerts}
        onShare={share}
      />
    </div>
  );
}
