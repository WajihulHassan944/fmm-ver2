import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

import {
  fetchPublicBlogs,
  fetchPublicHomeSummary,
  fetchPublicLeaderboard,
  fetchPublicPredictionFights,
  safeFetchJson,
} from '@/Utils/publicApi';
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

export default function FantasyMobileExperience({ initialTab = 'home' }) {
  const router = useRouter();
  const user = useSelector(getUser);
  const isStaff = useSelector((state) => Boolean(state?.adminAuth?.isAdminAuthenticated));
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState({
    fights: [],
    leaderboard: [],
    blogs: [],
    apparel: [],
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
    if (!isMobile) return undefined;
    let active = true;

    Promise.allSettled([
      fetchPublicPredictionFights({ limit: 100, status: 'upcoming', noCache: 'true' }),
      fetchPublicHomeSummary({ fightLimit: 24, leaderboardLimit: 20, noCache: 'true' }),
      fetchPublicLeaderboard({ limit: 50 }),
      fetchPublicBlogs({ limit: 12 }),
      safeFetchJson('/api/public/apparel-products', { limit: 12 }),
    ]).then(([fightsResult, summaryResult, leaderboardResult, blogsResult, apparelResult]) => {
      if (!active) return;
      const summary = summaryResult.status === 'fulfilled' ? summaryResult.value || {} : {};
      const leaderboardPayload = leaderboardResult.status === 'fulfilled' ? leaderboardResult.value || {} : {};
      const blogPayload = blogsResult.status === 'fulfilled' ? blogsResult.value || {} : {};
      const apparelPayload = apparelResult.status === 'fulfilled' ? apparelResult.value || {} : {};
      const fights = fightsResult.status === 'fulfilled' && Array.isArray(fightsResult.value)
        ? fightsResult.value
        : Array.isArray(summary.featuredFights)
          ? summary.featuredFights
          : [];

      setData({
        fights,
        leaderboard: Array.isArray(leaderboardPayload.leaderboard)
          ? leaderboardPayload.leaderboard
          : Array.isArray(summary.leaderboard)
            ? summary.leaderboard
            : [],
        blogs: Array.isArray(blogPayload.rows) ? blogPayload.rows : [],
        apparel: Array.isArray(apparelPayload.products) ? apparelPayload.products : [],
        stats: summary.stats && typeof summary.stats === 'object' ? summary.stats : {},
      });
    });

    return () => {
      active = false;
    };
  }, [isMobile]);

  const initialCoins = useMemo(
    () => toNumber(user?.tokens, user?.walletTokens, user?.wallet?.balance),
    [user?.tokens, user?.walletTokens, user?.wallet?.balance],
  );
  const isAuthenticated = Boolean(user?._id || user?.id || user?.email);

  const goToCheckout = ({ amount, price, product = 'fm-coins' } = {}) => {
    const next = `/checkout?product=${encodeURIComponent(product)}${amount ? `&amount=${encodeURIComponent(amount)}` : ''}${price ? `&price=${encodeURIComponent(price)}` : ''}`;
    router.push(isAuthenticated ? next : `/CreateAccount?next=${encodeURIComponent(next)}`);
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

  const share = async ({ platform, text } = {}) => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://www.fantasymmadness.com';
    if (navigator.share) {
      await navigator.share({ title: 'Fantasy MMAdness', text: text || 'Join my Fantasy MMAdness fight card.', url }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => {});
    if (platform === 'X') window.open(`https://x.com/intent/post?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
  };

  if (!isMobile) return null;

  return (
    <div className="fmm-exact-mobile-portal" data-fmm-mobile-screen={initialTab}>
      <FantasyMobileAppCore
        initialTab={initialTab}
        initialCoins={isAuthenticated ? initialCoins ?? 0 : undefined}
        isStaff={isStaff}
        currentUser={user}
        fights={data.fights}
        leaderboard={data.leaderboard}
        blogs={data.blogs}
        apparel={data.apparel}
        stats={data.stats}
        onPurchaseCoins={goToCheckout}
        onSubscribe={() => goToCheckout({ product: 'fm-plus' })}
        onSubmitPrediction={submitPrediction}
        onJoin={() => router.push('/CreateAccount')}
        onOpenApparel={() => router.push('/apparel')}
        onShare={share}
      />
    </div>
  );
}
