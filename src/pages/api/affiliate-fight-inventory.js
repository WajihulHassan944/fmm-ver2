import { buildPublicApiUrl, DEFAULT_PUBLIC_API_BASE_URL, normalizePublicFightRows, safeFetchJson } from '@/Utils/publicApi';
import { getFightId, getFightStatus, parseFightDate } from '@/Utils/fightExperience';

const HOMEPAGE_FEED = '/api/public/homepage/promoted-fights';
const SCHEDULE_FEED = '/api/public/prediction-fights';

export function getPromotableWebsiteFights(featured, scheduled) {
  const listings = new Map();
  for (const fight of normalizePublicFightRows(scheduled)) {
    if (getFightId(fight)) listings.set(String(getFightId(fight)), fight);
  }
  for (const fight of normalizePublicFightRows(featured)) {
    if (!getFightId(fight)) continue;
    const id = String(getFightId(fight));
    listings.set(id, { ...listings.get(id), ...fight, homepagePromoted: true });
  }

  return [...listings.values()].filter((fight) => {
    const source = [fight.sourceType, fight.matchType, fight.collection].join(' ');
    const status = String(fight.matchStatus || fight.status || '');
    return !/shadow/i.test(source)
      && !fight.affiliateId && !fight.sourceLiveMatchId && !fight.sourceShadowId
      && String(fight.matchBy || '').toLowerCase() !== 'affiliate'
      && fight.entryOpen !== false && !fight.prizesSettledAt && !fight.settledAt
      && !/draft|cancel|void|refund|settled/i.test(status)
      // A live record can still carry the Shadow workflow's default "closed".
      // Public entry availability and the live status determine its eligibility.
      && getFightStatus({ ...fight, matchShadowStatus: undefined, matchShadowOpenStatus: undefined }) !== 'past';
  }).sort((left, right) => {
    const slot = (fight) => Number(fight.homepageSlot) > 0 ? Number(fight.homepageSlot) : Infinity;
    return (slot(left) - slot(right))
      || Number(Boolean(right.homepagePromoted)) - Number(Boolean(left.homepagePromoted))
      || (parseFightDate(left)?.getTime() ?? Infinity) - (parseFightDate(right)?.getTime() ?? Infinity);
  });
}

async function readFeed(path, limit) {
  try {
    const data = await safeFetchJson(path, { limit }, { timeoutMs: 4000 });
    if (Array.isArray(data?.items)) return data.items;
  } catch {
    // If the preview's API configuration is unavailable, use the website feed.
  }

  const url = new URL(path, DEFAULT_PUBLIC_API_BASE_URL);
  if (new URL(buildPublicApiUrl(path)).origin === url.origin) throw new Error('Website fight feed unavailable.');
  url.searchParams.set('limit', String(limit));
  const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error('Website fight feed unavailable.');
  const data = await response.json();
  if (!Array.isArray(data?.items)) throw new Error('Website fight feed returned an invalid list.');
  return data.items;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Use GET to load upcoming fights.' });
  }
  const [homepage, schedule] = await Promise.allSettled([
    readFeed(HOMEPAGE_FEED, 24),
    readFeed(SCHEDULE_FEED, 100),
  ]);
  if (homepage.status === 'rejected' && schedule.status === 'rejected') {
    return res.status(502).json({ message: 'The upcoming fight feed is temporarily unavailable.' });
  }
  const items = getPromotableWebsiteFights(homepage.value || [], schedule.value || []);
  if (!items.length && schedule.status === 'rejected') {
    return res.status(502).json({ message: 'The upcoming fight schedule could not be loaded.' });
  }
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return res.status(200).json({ items: items.map((fight) => ({
    _id: getFightId(fight),
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
