import { normalizeWrestlingPromotion } from '@/Utils/affiliatePromotionFights';
import { selectHomepageFightSlots } from '@/Utils/homepageFightSlots';
import { buildPublicApiUrl, DEFAULT_PUBLIC_API_BASE_URL, normalizePublicFightRows, safeFetchJson } from '@/Utils/publicApi';
import { getFightId, getFightStatus } from '@/Utils/fightExperience';

const HOMEPAGE_FEED = '/api/public/homepage/promoted-fights';
const SCHEDULE_FEED = '/api/public/prediction-fights';

function isPastCoverFight(fight) {
  return getFightStatus({ ...fight, matchShadowStatus: undefined, matchShadowOpenStatus: undefined }) === 'past';
}

function canPromoteCoverFight(fight) {
  const source = [fight.sourceType, fight.matchType, fight.collection].join(' ');
  const status = String(fight.matchStatus || fight.status || '');
  return fight.gameMode !== 'PRO_WRESTLING'
    && !/shadow/i.test(source)
    && !fight.affiliateId && !fight.sourceLiveMatchId && !fight.sourceShadowId
    && String(fight.matchBy || '').toLowerCase() !== 'affiliate'
    && fight.entryOpen !== false && !fight.prizesSettledAt && !fight.settledAt
    && !/draft|cancel|void|refund|settled/i.test(status)
    && !isPastCoverFight(fight);
}

async function readFeed(path, limit) {
  try {
    const data = await safeFetchJson(path, { limit }, { timeoutMs: 4000 });
    if (Array.isArray(data?.items || data?.data)) return data.items || data.data;
  } catch {
    // If the preview's API configuration is unavailable, use the website feed.
  }

  const url = new URL(path, DEFAULT_PUBLIC_API_BASE_URL);
  if (new URL(buildPublicApiUrl(path)).origin === url.origin) throw new Error('Website fight feed unavailable.');
  url.searchParams.set('limit', String(limit));
  const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error('Website fight feed unavailable.');
  const data = await response.json();
  if (!Array.isArray(data?.items || data?.data)) throw new Error('Website fight feed returned an invalid list.');
  return data.items || data.data;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Use GET to load upcoming fights.' });
  }
  const [homepage, schedule, wrestling] = await Promise.allSettled([
    readFeed(HOMEPAGE_FEED, 24),
    readFeed(SCHEDULE_FEED, 100),
    readFeed('/api/wrestling/matches?status=OPEN,LOCKED,LIVE,SCORING', 100),
  ]);
  if (homepage.status === 'rejected' && schedule.status === 'rejected') {
    return res.status(502).json({ message: 'The upcoming fight feed is temporarily unavailable.' });
  }
  const items = selectHomepageFightSlots({
    combatFights: schedule.value || [],
    promotedFights: homepage.value || [],
    wrestlingFights: (wrestling.value || []).map(normalizeWrestlingPromotion),
  }).flatMap((fight, index) => fight && !isPastCoverFight(fight) ? [{ ...normalizePublicFightRows([fight])[0], homepageSlot: index + 1 }] : []);
  if (!items.length && schedule.status === 'rejected') {
    return res.status(502).json({ message: 'The upcoming fight schedule could not be loaded.' });
  }
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return res.status(200).json({ items: items.map((fight) => ({
    _id: getFightId(fight),
    canPromote: canPromoteCoverFight(fight),
    homepagePromoted: fight.homepagePromoted,
    homepageSlot: fight.homepageSlot,
    matchStatus: fight.matchStatus,
    matchType: fight.matchType,
    matchName: fight.matchName,
    matchCategory: fight.matchCategory,
    matchCategoryTwo: fight.matchCategoryTwo,
    matchDate: fight.matchDate,
    matchDateKey: fight.matchDateKey,
    matchTime: fight.matchTime,
    matchDescription: fight.matchDescription,
    matchVideoUrl: fight.matchVideoUrl,
    maxRounds: fight.maxRounds,
    matchFighterA: fight.matchFighterA,
    matchFighterB: fight.matchFighterB,
    fighterAId: fight.fighterAId?._id || fight.fighterAId?.id || (typeof fight.fighterAId === 'string' ? fight.fighterAId : undefined),
    fighterBId: fight.fighterBId?._id || fight.fighterBId?.id || (typeof fight.fighterBId === 'string' ? fight.fighterBId : undefined),
    fighterAImage: fight.resolvedFighterAImage || fight.fighterAImage,
    fighterBImage: fight.resolvedFighterBImage || fight.fighterBImage,
    promotionBackground: fight.promotionBackground,
  })) });
}
