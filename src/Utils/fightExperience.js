export const FMM_ASSET_BASE = '/images/fmm-experience';

const GENERIC_FIGHTER_FALLBACKS = {
  A: 'fighter-action-blue.webp',
  B: 'fighter-action-red.webp',
};

export const safeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const getFallbackFighterImage = (side = 'A') => {
  const key = String(side).toUpperCase() === 'A' ? 'A' : 'B';
  return `${FMM_ASSET_BASE}/${GENERIC_FIGHTER_FALLBACKS[key]}`;
};

export const getFightId = (match) => match?._id || match?.id || match?.matchId || '';

export const getFightCategory = (match) => {
  const value = match?.matchCategoryTwo
    || match?.matchCategory
    || match?.effectiveCategory
    || match?.displayCategory
    || match?.categoryLabel
    || match?.sport
    || match?.category
    || 'MMA';
  return String(value || 'MMA').trim() || 'MMA';
};


export const getFighterName = (match, side = 'A') => {
  const isA = String(side).toUpperCase() === 'A';
  const ref = isA ? match?.fighterAId : match?.fighterBId;
  const fighter = isA ? match?.fighterA : match?.fighterB;
  const candidates = isA
    ? [fighter?.displayName, fighter?.name, ref?.displayName, ref?.name, match?.fighterAName, match?.fighterOneName, match?.matchFighterA]
    : [fighter?.displayName, fighter?.name, ref?.displayName, ref?.name, match?.fighterBName, match?.fighterTwoName, match?.matchFighterB];
  const direct = candidates.find((value) => typeof value === 'string' && value.trim() && value.trim().toLowerCase() !== 'null');
  return direct || (isA ? 'Fighter A' : 'Fighter B');
};

export const getFightName = (match) => {
  if (match?.matchName) return match.matchName;
  return `${getFighterName(match, 'A')} vs ${getFighterName(match, 'B')}`;
};

const pickRenderableImage = (...values) => values.find((value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text && !['null', 'undefined', 'none', 'n/a'].includes(text.toLowerCase());
});

const getNestedImageValue = (value) => {
  if (!value || typeof value === 'string') return '';
  return pickRenderableImage(
    value.primaryImage,
    value.resolvedImage,
    value.imageUrl,
    value.profileImage,
    value.fighterImage,
    value.avatar,
    value.image,
    value.imageHealth?.url,
    value.imageHealth?.secure_url,
    value.imageHealth?.primaryImage,
  ) || '';
};

export const getFighterImage = (match, side = 'A', index = 0) => {
  const isA = String(side).toUpperCase() === 'A';
  const candidates = isA
    ? [
        // Highest priority: normalized fighter-library/database image fields.
        match?.fighterAPrimaryImage,
        match?.fighterAResolvedImage,
        match?.resolvedFighterAImage,
        getNestedImageValue(match?.fighterA),
        getNestedImageValue(match?.fighterAId),
        getNestedImageValue(match?.fighterOne),
        getNestedImageValue(match?.fighterOneId),
        // Fallback only: legacy fight-side images kept for old records.
        match?.fighterAImage,
        match?.matchFighterAImage,
        match?.fighterOneImage,
        match?.imageA,
      ]
    : [
        match?.fighterBPrimaryImage,
        match?.fighterBResolvedImage,
        match?.resolvedFighterBImage,
        getNestedImageValue(match?.fighterB),
        getNestedImageValue(match?.fighterBId),
        getNestedImageValue(match?.fighterTwo),
        getNestedImageValue(match?.fighterTwoId),
        match?.fighterBImage,
        match?.matchFighterBImage,
        match?.fighterTwoImage,
        match?.imageB,
      ];
  const direct = pickRenderableImage(...candidates);
  if (direct) return direct;
  return getFallbackFighterImage(side, index);
};

const normalizeTime = (value) => {
  const matchedTime = String(value || '').trim().match(/^(\d{1,2}):(\d{2})/);
  if (!matchedTime) return '00:00';
  return `${String(matchedTime[1]).padStart(2, '0')}:${matchedTime[2]}`;
};

export const parseFightDate = (match) => {
  const raw = match?.matchDate || match?.date || match?.scheduledAt || match?.startDate;
  if (!raw) return null;
  const dateOnly = String(raw).split('T')[0];
  const time = normalizeTime(match?.matchTime || match?.time || (String(raw).includes('T') ? String(raw).split('T')[1] : ''));
  const parsed = new Date(`${dateOnly}T${time}:00`);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export const getFightStatus = (match, now = new Date()) => {
  const source = `${match?.matchStatus || ''} ${match?.matchShadowStatus || ''} ${match?.matchShadowOpenStatus || ''} ${match?.timelineBucket || ''}`.toLowerCase();
  const type = `${match?.matchType || ''} ${match?.sourceType || ''} ${match?.__source || ''} ${match?.collection || ''}`.toLowerCase();
  const date = parseFightDate(match);
  const isFuture = date && date.getTime() >= now.getTime();

  if (source.includes('upcoming')) return 'upcoming';
  if (source.includes('past')) return 'past';

  // Product rule: all LIVE fight records are upcoming cards. They move to
  // Shadow/past after the scheduled date rollover handled by the backend.
  if (type.includes('live') || source.includes('live fight')) return 'upcoming';

  // Product rule: Shadow templates are past/template records unless an
  // affiliate gives them a future promotion date, then they become upcoming.
  if (type.includes('shadow')) return isFuture ? 'upcoming' : 'past';

  if (/(finished|completed|closed|past|result)/.test(source)) return 'past';
  if (/live now|scoring/.test(source)) return 'live';
  if (date && date.getTime() < now.getTime()) return 'past';
  return 'upcoming';
};

export const getFightStatusLabel = (match) => {
  const status = getFightStatus(match);
  if (status === 'live') return 'Live now';
  if (status === 'past') return 'Final result';
  return 'Entry open';
};

export const formatFightDate = (match, options = {}) => {
  const date = parseFightDate(match);
  if (!date) return 'Schedule pending';
  const base = options.short
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const datePart = date.toLocaleDateString('en-US', base);
  if (options.dateOnly) return datePart;
  const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${datePart} · ${timePart}`;
};

export const getFightDayParts = (match) => {
  const date = parseFightDate(match);
  if (!date) return { day: '--', month: 'TBA' };
  return {
    day: date.toLocaleDateString('en-US', { day: '2-digit' }),
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
};

export const getFightPlayerCount = (match) => {
  const predictions = safeArray(match?.userPredictions);
  return Number(match?.playerCount || match?.players || predictions.length || 0);
};

export const getFightPrize = (match) => {
  const raw = match?.pot ?? match?.prizePool ?? match?.prize ?? 0;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return 'Prize TBA';
  return `$${amount.toLocaleString()}`;
};

export const getFightRounds = (match) => {
  const rounds = match?.maxRounds || match?.rounds || match?.numberOfRounds;
  return rounds ? `${rounds} rounds` : 'Rounds TBA';
};

export const getFightSearchText = (match) => [
  match?.matchName,
  getFighterName(match, 'A'),
  getFighterName(match, 'B'),
  getFightCategory(match),
  match?.location,
  match?.venue,
].filter(Boolean).join(' ').toLowerCase();


const normalizeFightKeyPart = (value = '') => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const hasRenderableImage = (value) => typeof value === 'string' && value.trim() && value.trim().toLowerCase() !== 'null';

const getFightQualityScore = (match = {}) => {
  const status = getFightStatus(match);
  const statusScore = status === 'live' ? 9000 : status === 'upcoming' ? 7000 : 5000;
  const typeScore = String(match?.matchType || '').toUpperCase() === 'LIVE' ? 400 : 0;
  const imageScore = [
    match?.fighterAPrimaryImage,
    match?.fighterBPrimaryImage,
    match?.resolvedFighterAImage,
    match?.resolvedFighterBImage,
    match?.fighterAResolvedImage,
    match?.fighterBResolvedImage,
    getNestedImageValue(match?.fighterA),
    getNestedImageValue(match?.fighterB),
    getNestedImageValue(match?.fighterAId),
    getNestedImageValue(match?.fighterBId),
    match?.fighterAImage,
    match?.fighterBImage,
    match?.promotionBackground,
  ].filter(hasRenderableImage).length * 40;
  const statScore = safeArray(match?.BoxingMatch?.fighterOneStats).length || safeArray(match?.MMAMatch?.fighterOneStats).length ? 80 : 0;
  const videoScore = hasRenderableImage(match?.matchVideoUrl) ? 25 : 0;
  const dateScore = parseFightDate(match)?.getTime() || 0;
  return statusScore + typeScore + imageScore + statScore + videoScore + Math.min(dateScore / 100000000000, 50);
};

export const getPublicFightDuplicateKey = (match = {}) => {
  const fighterA = normalizeFightKeyPart(getFighterName(match, 'A'));
  const fighterB = normalizeFightKeyPart(getFighterName(match, 'B'));
  if (!fighterA || !fighterB || fighterA === 'fighter a' || fighterB === 'fighter b') {
    return normalizeFightKeyPart(getFightId(match)) || normalizeFightKeyPart(match?.matchName);
  }
  const orderedPair = [fighterA, fighterB].sort().join('::');
  const rawDate = String(match?.matchDate || match?.date || match?.scheduledAt || '').split('T')[0];
  const datePart = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '';
  return [
    orderedPair,
    normalizeFightKeyPart(getFightCategory(match)),
    String(match?.maxRounds || match?.rounds || ''),
    datePart,
  ].filter(Boolean).join('|');
};

export const dedupePublicFights = (matches = []) => {
  const selected = new Map();

  safeArray(matches).forEach((match) => {
    const key = getPublicFightDuplicateKey(match) || normalizeFightKeyPart(getFightId(match));
    if (!key) return;

    const current = selected.get(key);
    if (!current || getFightQualityScore(match) > getFightQualityScore(current)) {
      selected.set(key, match);
    }
  });

  return Array.from(selected.values());
};

export const sortFights = (matches, direction = 'asc') => [...safeArray(matches)].sort((a, b) => {
  const aDate = parseFightDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bDate = parseFightDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return direction === 'desc' ? bDate - aDate : aDate - bDate;
});

export const splitFightsByStatus = (matches) => {
  const groups = { upcoming: [], live: [], past: [] };
  safeArray(matches).forEach((match) => groups[getFightStatus(match)].push(match));
  groups.upcoming = sortFights(groups.upcoming, 'asc');
  groups.live = sortFights(groups.live, 'asc');
  groups.past = sortFights(groups.past, 'desc');
  return groups;
};
