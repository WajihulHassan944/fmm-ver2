import { fetchPublicPredictionFights } from '@/Utils/publicApi';
import { wrestlingRequest, safeWrestlingArray } from '@/Utils/proWrestling';

export const normalizeWrestlingPromotion = (match) => ({
  _id: match._id, gameMode: 'PRO_WRESTLING', sourceType: 'PRO_WRESTLING',
  matchName: match.eventName, matchTitle: match.matchTitle,
  matchFighterA: match.competitorA?.displayName || '', matchFighterB: match.competitorB?.displayName || '',
  fighterAImage: match.competitorA?.image || '', fighterBImage: match.competitorB?.image || '',
  matchCategory: 'Pro Wrestling', matchCategoryTwo: 'Pro Wrestling',
  matchStatus: match.status, status: match.status, matchDate: match.matchDate,
  entryOpen: match.status === 'OPEN' && (!match.lockAt || new Date(match.lockAt) > new Date()),
  createdAt: match.createdAt, updatedAt: match.updatedAt,
  matchDateKey: match.eventDate || '', eventDate: match.eventDate || '',
  matchTime: match.matchTime, timeTba: Boolean(match.timeTba), lockAt: match.lockAt,
  matchTokens: match.entryFeeTokens || 0, pot: match.currentPot ?? match.basePot ?? 0,
  fightPosterImage: match.fightPosterImage || match.bannerImage || '', promotionBackground: match.bannerImage || '',
});

export const fetchPublishedWrestlingPromotions = async (status = 'OPEN,LOCKED,LIVE,SCORING') => {
  const payload = await wrestlingRequest(`/api/wrestling/matches?status=${encodeURIComponent(status)}&limit=100`);
  return safeWrestlingArray(payload?.data).map(normalizeWrestlingPromotion);
};

export const fetchHomepagePromotionFights = async (query = {}) => {
  const [fights, wrestling] = await Promise.all([
    fetchPublicPredictionFights(query), fetchPublishedWrestlingPromotions().catch(() => []),
  ]);
  return [...wrestling, ...fights];
};

export const fetchAffiliatePromotionFights = async (query = {}) => {
  const [fights, wrestling] = await Promise.all([
    fetchPublicPredictionFights(query), fetchPublishedWrestlingPromotions('OPEN').catch(() => []),
  ]);
  const eligible = wrestling.filter((match) => match.status === 'OPEN' && (!match.lockAt || new Date(match.lockAt) > new Date()));
  return [...eligible, ...fights];
};
