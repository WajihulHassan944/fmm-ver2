export const FMM_ASSET_BASE = '/images/fmm-experience';

const FALLBACK_FIGHTERS = [
  'fighter-jadden-addison.png',
  'fighter-zaveer-davis.png',
  'fighter-conor-benn.png',
  'fighter-chris-eubank-jr.png',
  'fighter-anthony-yarde.png',
  'fighter-david-benavidez.png',
];

export const safeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const getFightId = (match) => match?._id || match?.id || match?.matchId || '';

export const getFightCategory = (match) => {
  const value = match?.matchCategoryTwo || match?.matchCategory || match?.category || 'MMA';
  return String(value || 'MMA').trim() || 'MMA';
};

export const getFightName = (match) => {
  if (match?.matchName) return match.matchName;
  return `${match?.matchFighterA || 'Fighter A'} vs ${match?.matchFighterB || 'Fighter B'}`;
};

export const getFighterImage = (match, side = 'A', index = 0) => {
  const isA = String(side).toUpperCase() === 'A';
  const candidates = isA
    ? [match?.fighterAImage, match?.matchFighterAImage, match?.fighterA?.image, match?.fighterOneImage, match?.imageA]
    : [match?.fighterBImage, match?.matchFighterBImage, match?.fighterB?.image, match?.fighterTwoImage, match?.imageB];
  const direct = candidates.find((value) => typeof value === 'string' && value.trim());
  if (direct) return direct;
  const offset = isA ? index * 2 : index * 2 + 1;
  return `${FMM_ASSET_BASE}/${FALLBACK_FIGHTERS[offset % FALLBACK_FIGHTERS.length]}`;
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
  const source = `${match?.matchStatus || ''} ${match?.matchShadowStatus || ''} ${match?.matchShadowOpenStatus || ''}`.toLowerCase();
  if (/(finished|completed|closed|past|result)/.test(source)) return 'past';
  const date = parseFightDate(match);
  if (/\blive\b/.test(source)) return 'live';
  // Legacy records use "Ongoing" for every non-finished fight. Only call it
  // live once the scheduled start has arrived; future cards remain upcoming.
  if (/(ongoing|active)/.test(source) && (!date || date.getTime() <= now.getTime())) return 'live';
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
  match?.matchFighterA,
  match?.matchFighterB,
  getFightCategory(match),
  match?.location,
  match?.venue,
].filter(Boolean).join(' ').toLowerCase();

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
