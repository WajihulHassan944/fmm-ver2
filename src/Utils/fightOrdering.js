export const isDraftFightForDisplay = (fight = {}) => {
  const statusValues = [fight.matchStatus, fight.status, fight.matchShadowStatus, fight.publicStatus]
    .map((value) => String(value || '').trim().toLowerCase());
  return Boolean(fight.draft || fight.isDraft || fight.publicVisible === false || statusValues.includes('draft'));
};

export const getFightId = (fight) => fight?._id || fight?.id || fight?.matchId || '';

export const normalizeCombatSportKey = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (!normalized) return 'mma';
  if (normalized.includes('bare') || normalized.includes('bkfc') || normalized.includes('bareknuckle') || normalized.includes('bare knuckle')) return 'bareknuckle';
  if (normalized.includes('kick')) return 'kickboxing';
  if (normalized.includes('box')) return 'boxing';
  if (normalized.includes('mixed') || normalized.includes('mma') || normalized.includes('ufc') || normalized.includes('combat')) return 'mma';
  return normalized.replace(/[^a-z0-9]+/g, '-') || 'mma';
};

export const getFightSport = (fight) => {
  const raw = fight?.matchCategoryTwo
    || fight?.matchCategory
    || fight?.sport
    || fight?.matchSport
    || fight?.category
    || fight?.fightSport
    || fight?.discipline
    || fight?.matchDiscipline
    || fight?.matchName
    || 'mma';
  const value = String(raw || '').trim();
  return value || 'mma';
};

export const getFightSportKey = (fight) => normalizeCombatSportKey(getFightSport(fight));

export const getFightSportLabel = (fight) => {
  const key = getFightSportKey(fight);
  if (key === 'bareknuckle') return 'Bareknuckle';
  if (key === 'kickboxing') return 'Kickboxing';
  if (key === 'boxing') return 'Boxing';
  if (key === 'mma') return 'MMA';
  return String(getFightSport(fight) || 'MMA').trim();
};

export const getFightTimestamp = (fight) => {
  const rawDate = fight?.matchDate?.split?.('T')?.[0] || fight?.date?.split?.('T')?.[0];
  const rawTime = String(fight?.matchTime || fight?.time || '00:00').trim() || '00:00';
  const candidate = new Date(`${rawDate || ''}T${rawTime}:00`);
  return Number.isNaN(candidate.getTime()) ? 0 : candidate.getTime();
};

export const getFightUpdatedTimestamp = (fight) => {
  const values = [fight?.updatedAt, fight?.createdAt, fight?.publishedAt, fight?._id?.toString?.().substring?.(0, 8)]
    .filter(Boolean);

  for (const value of values) {
    if (/^[0-9a-f]{8}$/i.test(String(value))) {
      const parsedObjectIdTime = parseInt(String(value), 16) * 1000;
      if (Number.isFinite(parsedObjectIdTime)) return parsedObjectIdTime;
    }

    const parsed = new Date(value).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
};

export const getFightPriorityScore = (fight, now = new Date()) => {
  const status = String(fight?.matchStatus || fight?.matchShadowOpenStatus || fight?.matchShadowStatus || fight?.status || fight?.matchType || '').toLowerCase();
  const type = String(fight?.matchType || '').toLowerCase();
  const fightTime = getFightTimestamp(fight);
  const updatedTime = getFightUpdatedTimestamp(fight);
  const nowMs = now.getTime();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const recentWindowMs = 48 * 60 * 60 * 1000;
  const isFeatured = Boolean(fight?.featured || fight?.isFeatured || fight?.pinToTop || fight?.promoteTonight || fight?.isPromoted);
  const isLive = status.includes('live') || status.includes('ongoing') || status.includes('scoring');
  const isClosed = status.includes('finished') || status.includes('closed') || status.includes('complete') || status.includes('settled');
  const isToday = fightTime >= today.getTime() && fightTime < tomorrow.getTime();
  const isFuture = fightTime >= nowMs;
  const happenedRecently = fightTime > 0 && fightTime < nowMs && nowMs - fightTime <= recentWindowMs;
  const updatedRecently = updatedTime > 0 && nowMs - updatedTime <= recentWindowMs;
  const isPublicPlayable = type.includes('live') || type.includes('shadow') || status.includes('open') || status.includes('active');

  if (isFeatured) return 10000;
  if (isLive) return 9500;
  if (isToday && !isClosed) return 9000;
  if (happenedRecently || updatedRecently) return 8500;
  if (isFuture && !isClosed) return 8000;
  if (isPublicPlayable && !isClosed) return 7000;
  if (!isClosed) return 6000;
  return 1000;
};

export const orderFightsForDisplay = (fights = [], options = {}) => {
  const now = new Date();
  const includeDrafts = Boolean(options.includeDrafts);
  return [...(Array.isArray(fights) ? fights : [])].filter((fight) => fight && (includeDrafts || !isDraftFightForDisplay(fight))).sort((a, b) => {
    const scoreDiff = getFightPriorityScore(b, now) - getFightPriorityScore(a, now);
    if (scoreDiff) return scoreDiff;

    const aFightTime = getFightTimestamp(a);
    const bFightTime = getFightTimestamp(b);
    const aFuture = aFightTime >= now.getTime();
    const bFuture = bFightTime >= now.getTime();

    if (aFuture && bFuture) return aFightTime - bFightTime;
    if (!aFuture && !bFuture) return bFightTime - aFightTime;

    const updatedDiff = getFightUpdatedTimestamp(b) - getFightUpdatedTimestamp(a);
    if (updatedDiff) return updatedDiff;

    return String(getFightId(b)).localeCompare(String(getFightId(a)));
  });
};

export const diversifyFightsBySport = (fights = [], limit) => {
  const ordered = orderFightsForDisplay(fights);
  const firstBySport = [];
  const rest = [];
  const seenSports = new Set();

  ordered.forEach((fight) => {
    const sport = getFightSportKey(fight);
    if (!seenSports.has(sport)) {
      seenSports.add(sport);
      firstBySport.push(fight);
    } else {
      rest.push(fight);
    }
  });

  const merged = [...firstBySport, ...rest];
  return Number.isFinite(Number(limit)) ? merged.slice(0, Number(limit)) : merged;
};
