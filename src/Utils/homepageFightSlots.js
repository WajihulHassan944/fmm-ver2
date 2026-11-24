import { isPlaceholderWrestlingPromotion } from '@/Utils/affiliatePromotionFights';
import { getPublicFightDuplicateKey } from '@/Utils/fightExperience';

const pad2 = (value) => String(value).padStart(2, '0');
const TERMINAL_FIGHT_STATUSES = new Set(['finished', 'completed', 'closed', 'settled', 'cancelled', 'canceled', 'void', 'voided']);
const LIVE_FIGHT_STATUSES = new Set(['live', 'ongoing', 'in progress', 'in-progress', 'active']);
const normalizedFightStatus = (fight = {}) => String(fight.matchStatus || fight.status || '').trim().toLowerCase();
export const isTerminalFight = (fight = {}) => Boolean(fight.prizesSettledAt || fight.settledAt || TERMINAL_FIGHT_STATUSES.has(normalizedFightStatus(fight)));
export const isLiveFight = (fight = {}) => LIVE_FIGHT_STATUSES.has(normalizedFightStatus(fight));
export const getFightTimestamp = (fight = {}) => {
  const rawDate = String(fight.matchDate || fight.eventDate || '').split('T')[0];
  if (!rawDate) return Number.POSITIVE_INFINITY;
  const timeMatch = String(fight.matchTime || '23:59').trim().match(/^(\d{1,2}):(\d{2})/);
  const time = timeMatch ? `${pad2(timeMatch[1])}:${pad2(timeMatch[2])}` : '23:59';
  const timestamp = new Date(`${rawDate}T${time}:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
};

export const resolveFightName = (f = {}, side = 'A') => {
  const isA = side === 'A';
  const direct = isA ? (f.matchFighterA || f.fighterAName) : (f.matchFighterB || f.fighterBName);
  if (direct && String(direct).trim()) return String(direct).trim();
  const parts = String(f.matchName || '').split(/\s+vs\.?\s+/i);
  const fromName = isA ? parts[0] : parts[1];
  return fromName && fromName.trim() ? fromName.trim() : '';
};

export function selectHomepageFightSlots({ combatFights = [], promotedFights = [], wrestlingFights = [] }, now = Date.now()) {
  const rawFights = [...wrestlingFights, ...combatFights].filter((fight) => !isPlaceholderWrestlingPromotion(fight));

  const byId = new Map();
  [...rawFights, ...promotedFights].forEach((fight) => {
    const id = String(fight?._id || fight?.id || '');
    if (id) byId.set(id, { ...(byId.get(id) || {}), ...fight });
  });
  const eligible = [...byId.values()]
    .filter((f) => f && resolveFightName(f, 'A') && resolveFightName(f, 'B'))
    // Was matchDate > now, which dropped a fight off the site the instant its
    // scheduled start time passed — even while the admin still had it marked
    // Ongoing and open for predictions. Only prizesSettledAt/Finished actually
    // means "done"; a same-day fight that already started is still live.
    .filter((f) => !isTerminalFight(f))
    // A card whose scheduled time passed but was never scored belongs in the
    // Back Office review queue. It is not an upcoming card and must not remain
    // on the website/app unless an admin explicitly marks it Live/Ongoing.
    .filter((f) => (f.gameMode === 'PRO_WRESTLING' && f.entryOpen) || isLiveFight(f) || getFightTimestamp(f) >= now);

  // Admin "Homepage banner" / "Featured fight" / "Featured this week" toggles
  // must actually surface here — they used to only flip a flag nothing read,
  // so a promoted fight and green success toast never changed the site.
  //
  // A fight the admin explicitly slotted (1-5, via homepageSlot) MUST land in
  // that exact window — not wherever rank/weight/date ordering would put it.
  // Fights with no explicit slot fill whatever windows are left, in the old
  // rank/weight/date order.
  const slots = new Array(5).fill(null);
  const displayedBouts = new Set();
  const boutKey = (fight) => getPublicFightDuplicateKey(fight);
  const promoterId = (fight) => String(fight.affiliateId || '').trim();
  const usedPromoters = new Set();
  // Explicit admin placements stay put, including fights linked to affiliates.
  // When old data assigns the same slot twice, the owner's selection wins.
  [...eligible].sort((a, b) => Number(Boolean(promoterId(a))) - Number(Boolean(promoterId(b)))).forEach((f) => {
    const slot = Number(f.homepageSlot);
    const promoter = promoterId(f);
    if (f.homepagePromoted && slot >= 1 && slot <= 5 && !slots[slot - 1] && !displayedBouts.has(boutKey(f))) {
      slots[slot - 1] = f;
      displayedBouts.add(boutKey(f));
      if (promoter) usedPromoters.add(promoter);
    }
  });
  const placedIds = new Set(slots.filter(Boolean).map((f) => f._id || f.id));
  const remaining = eligible
    .filter((f) => !placedIds.has(f._id || f.id))
    .sort((a, b) => {
      const ownerDiff = Number(Boolean(promoterId(a))) - Number(Boolean(promoterId(b)));
      if (ownerDiff) return ownerDiff;
      const liveDiff = Number(isLiveFight(b)) - Number(isLiveFight(a));
      if (liveDiff) return liveDiff;
      const rankDiff = Number(b.homepagePromotionRank || 0) - Number(a.homepagePromotionRank || 0);
      if (rankDiff) return rankDiff;
      const weight = (f) => (f.homepagePromoted ? 2 : 0) + (f.featuredFight || f.featuredThisWeek ? 1 : 0);
      const diff = weight(b) - weight(a);
      return diff !== 0 ? diff : new Date(a.matchDate || 0) - new Date(b.matchDate || 0);
    });
  for (const fight of remaining) {
    const emptySlot = slots.findIndex((item) => !item);
    if (emptySlot < 0) break;
    const promoter = promoterId(fight);
    if (displayedBouts.has(boutKey(fight)) || (promoter && usedPromoters.has(promoter))) continue;
    slots[emptySlot] = fight;
    displayedBouts.add(boutKey(fight));
    if (promoter) usedPromoters.add(promoter);
  }
  return slots;
}
