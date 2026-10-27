import { normalizeWrestlingPromotion, isPlaceholderWrestlingPromotion } from '@/Utils/affiliatePromotionFights';

// Read-only copy of the homepage's position rules (src/pages/welcome.js,
// buildWelcomeProps). The Fight Launch Desk uses it only to label which fight
// is in which homepage position, including positions the homepage fills
// automatically. It never changes a position. If the homepage rules change,
// change them here too (the desk test compares both against the live site).
const TERMINAL_FIGHT_STATUSES = new Set(['finished', 'completed', 'closed', 'settled', 'cancelled', 'canceled', 'void', 'voided']);
const LIVE_FIGHT_STATUSES = new Set(['live', 'ongoing', 'in progress', 'in-progress', 'active']);
const normalizedFightStatus = (fight = {}) => String(fight.matchStatus || fight.status || '').trim().toLowerCase();
const isTerminalFight = (fight = {}) => Boolean(fight.prizesSettledAt || fight.settledAt || TERMINAL_FIGHT_STATUSES.has(normalizedFightStatus(fight)));
const isLiveFight = (fight = {}) => LIVE_FIGHT_STATUSES.has(normalizedFightStatus(fight));
const pad2 = (v) => String(v).padStart(2, '0');
const getFightTimestamp = (fight = {}) => {
  const rawDate = String(fight.matchDate || fight.eventDate || '').split('T')[0];
  if (!rawDate) return Number.POSITIVE_INFINITY;
  const timeMatch = String(fight.matchTime || '23:59').trim().match(/^(\d{1,2}):(\d{2})/);
  const time = timeMatch ? `${pad2(timeMatch[1])}:${pad2(timeMatch[2])}` : '23:59';
  const timestamp = new Date(`${rawDate}T${time}:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
};
const resolveFightName = (f = {}, side = 'A') => {
  const isA = side === 'A';
  const direct = isA ? (f.matchFighterA || f.fighterAName) : (f.matchFighterB || f.fighterBName);
  if (direct && String(direct).trim()) return String(direct).trim();
  const parts = String(f.matchName || '').split(/\s+vs\.?\s+/i);
  const fromName = isA ? parts[0] : parts[1];
  return fromName && fromName.trim() ? fromName.trim() : '';
};

// Inputs are the same three public responses the homepage reads.
// Returns { [fightId]: { slot: 1-5, automatic: boolean } }.
export function computeHomepagePositions({ fightData, promotedData, wrestlingData, now = Date.now() }) {
  const combatFights = Array.isArray(fightData?.items) ? fightData.items
    : Array.isArray(fightData?.fights) ? fightData.fights
      : Array.isArray(fightData?.matches) ? fightData.matches
        : Array.isArray(fightData) ? fightData : [];
  const rawFights = [...(Array.isArray(wrestlingData?.data) ? wrestlingData.data.map(normalizeWrestlingPromotion) : []), ...combatFights].filter((fight) => !isPlaceholderWrestlingPromotion(fight));
  const promotedFights = Array.isArray(promotedData?.items) ? promotedData.items : [];
  const byId = new Map();
  [...rawFights, ...promotedFights].forEach((fight) => {
    const id = String(fight?._id || fight?.id || '');
    if (id) byId.set(id, { ...(byId.get(id) || {}), ...fight });
  });
  const eligible = [...byId.values()]
    .filter((f) => f && resolveFightName(f, 'A') && resolveFightName(f, 'B'))
    .filter((f) => !isTerminalFight(f))
    .filter((f) => (f.gameMode === 'PRO_WRESTLING' && f.entryOpen) || isLiveFight(f) || getFightTimestamp(f) >= now);
  const slots = new Array(5).fill(null);
  const manual = new Set();
  const promoterId = (fight) => String(fight.affiliateId || '').trim();
  const usedPromoters = new Set();
  const slotPickedAt = (f) => {
    const time = new Date(f.homepageSlotAssignedAt || f.homepagePromotionUpdatedAt || f.homepagePromotion?.updatedAt || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  };
  [...eligible].sort((a, b) => (Number(Boolean(promoterId(a))) - Number(Boolean(promoterId(b)))) || (slotPickedAt(b) - slotPickedAt(a))).forEach((f) => {
    const slot = Number(f.homepageSlot);
    const promoter = promoterId(f);
    if (f.homepagePromoted && slot >= 1 && slot <= 5 && !slots[slot - 1]) {
      slots[slot - 1] = f;
      manual.add(slot - 1);
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
    if (promoter && usedPromoters.has(promoter)) continue;
    slots[emptySlot] = fight;
    if (promoter) usedPromoters.add(promoter);
  }
  const positions = {};
  slots.forEach((fight, index) => {
    const id = fight ? String(fight._id || fight.id || '') : '';
    if (id) positions[id] = { slot: index + 1, automatic: !manual.has(index) };
  });
  return positions;
}
