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
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState({
    fights: [],
    leaderboard: [],
    blogs: [],
    apparel: [],
    leagues: [],
    leagueUsers: [],
    stats: {},
  });

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

    Promise.allSettled([
      fetchPublicPredictionFights({ limit: 300, status: 'upcoming', noCache: 'true' }),
      fetchPublicPredictionFights({ limit: 300, noCache: 'true' }),
      fetchPublicFights({ limit: 300, noCache: 'true' }),
      fetchPromotedHomeFights({ limit: 24, noCache: 'true' }),
      fetchPublicHomeSummary({ fightLimit: 24, leaderboardLimit: 20, noCache: 'true' }),
      fetchPublicLeaderboard({ limit: 50 }),
      fetchPublicBlogs({ limit: 12 }),
      safeFetchJson('/api/public/apparel-products', { limit: 12 }),
      safeFetchJson('/api/public/leagues', { limit: 30 }),
    ]).then(([upcomingResult, playableResult, publicResult, promotedResult, summaryResult, leaderboardResult, blogsResult, apparelResult, leaguesResult]) => {
      if (!active) return;
      const upcomingRows = upcomingResult.status === 'fulfilled' && Array.isArray(upcomingResult.value) ? upcomingResult.value : [];
      const playableRows = playableResult.status === 'fulfilled' && Array.isArray(playableResult.value) ? playableResult.value : [];
      const publicRows = publicResult.status === 'fulfilled' && Array.isArray(publicResult.value) ? publicResult.value : [];
      const promotedRows = promotedResult.status === 'fulfilled' && Array.isArray(promotedResult.value) ? promotedResult.value : [];
      const summary = summaryResult.status === 'fulfilled' ? summaryResult.value || {} : {};
      const leaderboardPayload = leaderboardResult.status === 'fulfilled' ? leaderboardResult.value || {} : {};
      const blogPayload = blogsResult.status === 'fulfilled' ? blogsResult.value || {} : {};
      const apparelPayload = apparelResult.status === 'fulfilled' ? apparelResult.value || {} : {};
      const leaguePayload = leaguesResult.status === 'fulfilled' ? leaguesResult.value || {} : {};
      const summaryRows = Array.isArray(summary.featuredFights) ? summary.featuredFights : [];
      const predictionRows = [...upcomingRows, ...playableRows];
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
      const fights = sortFights(dedupePublicFights([
        ...promotedRows,
        ...predictionRows,
        ...summaryRows,
        ...publicRows,
      ]), 'asc')
        .map((fight) => {
          const keys = [String(getFightId(fight) || '').trim(), getPublicFightDuplicateKey(fight)].filter(Boolean);
          const predictionFight = keys.map((key) => predictionByKey.get(key)).find(Boolean);
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
          return {
            ...mergedFight,
            __playable: keys.some((key) => playableKeys.has(key)),
            __homepagePromoted: keys.some((key) => promotedKeys.has(key)),
          };
        })
        .sort((left, right) => Number(Boolean(right.__homepagePromoted)) - Number(Boolean(left.__homepagePromoted)));

      setData({
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
      });
    });

    return () => {
      active = false;
    };
  }, [forceRender, isMobile]);

  const initialCoins = useMemo(
    () => toNumber(user?.tokens, user?.walletTokens, user?.wallet?.balance),
    [user?.tokens, user?.walletTokens, user?.wallet?.balance],
  );
  const isAuthenticated = Boolean(user?._id || user?.id || user?.email);

  const goToCheckout = ({ amount, price, product = 'fm-coins', items = [] } = {}) => {
    const serializedCart = Array.isArray(items) && items.length
      ? items
          .map((item) => `${String(item.sku || '').trim()}:${Math.max(1, Number(item.quantity || 1))}`)
          .filter((item) => !item.startsWith(':'))
          .join(',')
      : '';
    const next = `/checkout?product=${encodeURIComponent(product)}${amount ? `&amount=${encodeURIComponent(amount)}` : ''}${price ? `&price=${encodeURIComponent(price)}` : ''}${serializedCart ? `&cart=${encodeURIComponent(serializedCart)}` : ''}`;
    router.push(next);
  };

  const submitPrediction = ({ event } = {}) => {
    const id = String(event?.backendId || event?.id || '').trim();
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(id ? `/fight/${id}` : '/UserDashboard')}`);
      return false;
    }
    router.push(id ? `/fight/${id}?play=1` : '/UserDashboard');
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

  if (!isMobile && !forceRender) return null;

  return (
    <div
      className={`fmm-exact-mobile-portal ${isMobile ? 'is-phone-shell' : 'is-desktop-shell'}`}
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
        onPurchaseCoins={goToCheckout}
        onSubscribe={() => goToCheckout({ product: 'fm-plus' })}
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
        onShare={share}
      />
    </div>
  );
}
