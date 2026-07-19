export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fantasymmadness-game-server-three.vercel.app';

export const WRESTLING_STATS = [
  { key: 'HP', code: 'HP', short: 'HP', label: 'Head Punches', description: 'Punches, forearms, elbows, and strikes directed at the head.', weight: 1 },
  { key: 'BP', code: 'BP', short: 'BP', label: 'Body Punches', description: 'Punches and strikes directed at the torso or body.', weight: 1 },
  { key: 'K', code: 'K', short: 'K', label: 'Kicks', description: 'Dropkicks, superkicks, roundhouse kicks, and other kicking attacks.', weight: 1.2 },
  { key: 'PM', code: 'PM', short: 'PM', label: 'Power Moves', description: 'Slams, suplexes, powerbombs, and other high-impact maneuvers.', weight: 1.5 },
  { key: 'FM', code: 'FM', short: 'FM', label: 'Finishers', description: 'Signature finishing sequences and match-ending moves.', weight: 2 },
];

export const EMPTY_WRESTLING_STATS = Object.freeze({ HP: 0, BP: 0, K: 0, PM: 0, FM: 0 });
export const WRESTLING_STATUS_ORDER = ['DRAFT', 'OPEN', 'LOCKED', 'LIVE', 'SCORING', 'FINALIZED', 'CANCELLED', 'NO_CONTEST'];
export const WRESTLING_STATUS_COPY = {
  DRAFT: 'Draft', OPEN: 'Open for entry', LOCKED: 'Predictions locked', LIVE: 'Live',
  SCORING: 'Scoring', FINALIZED: 'Finalized', CANCELLED: 'Cancelled', NO_CONTEST: 'No contest',
  JOINED: 'Joined', PREDICTION_SUBMITTED: 'Prediction submitted', SETTLED: 'Settled', REFUNDED: 'Refunded',
};
export const WRESTLING_STATUS_CLASS = {
  DRAFT: 'is-draft', OPEN: 'is-open', LOCKED: 'is-locked', LIVE: 'is-live', SCORING: 'is-scoring',
  FINALIZED: 'is-finalized', CANCELLED: 'is-cancelled', NO_CONTEST: 'is-cancelled',
  JOINED: 'is-open', PREDICTION_SUBMITTED: 'is-scoring', SETTLED: 'is-finalized', REFUNDED: 'is-cancelled',
};

export const safeArray = (value) => (Array.isArray(value) ? value : []);
export const safeWrestlingArray = safeArray;
export const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
export const formatTokenAmount = (value) => safeNumber(value, 0).toLocaleString();

export const getUserToken = () => (typeof window === 'undefined' ? '' : window.localStorage.getItem('authToken') || '');
export const getPlayerToken = getUserToken;
export const getAdminToken = () => (typeof window === 'undefined' ? '' : window.localStorage.getItem('adminAuthToken') || '');
export const getAffiliateToken = () => (typeof window === 'undefined' ? '' : window.localStorage.getItem('affiliateAuthToken') || '');

export class WrestlingApiError extends Error {
  constructor(message, { status = 500, code = 'WRESTLING_REQUEST_FAILED', details = null, payload = null } = {}) {
    super(message);
    this.name = 'WrestlingApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.payload = payload;
  }
}

export const wrestlingRequest = async (path, options = {}) => {
  const {
    method = 'GET', body, token, admin = false, auth = false, affiliate = false,
    formData = false, headers = {}, signal,
  } = options;

  let accessToken = token;
  if (accessToken === undefined) {
    if (admin) accessToken = getAdminToken();
    else if (affiliate) accessToken = getAffiliateToken();
    else if (auth) accessToken = getUserToken();
    else accessToken = '';
  }

  const requestHeaders = { ...headers };
  let requestBody;
  if (body !== undefined) {
    if (formData || (typeof FormData !== 'undefined' && body instanceof FormData)) {
      requestBody = body;
    } else {
      requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
      requestBody = JSON.stringify(body);
    }
  }
  if (accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_BASE}${path}`, { method, headers: requestHeaders, body: requestBody, signal });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    throw new WrestlingApiError(payload?.message || payload?.error || `Request failed with status ${response.status}`, {
      status: response.status,
      code: payload?.code,
      details: payload?.details,
      payload,
    });
  }
  return payload;
};

export const formatWrestlingDate = (value, options = {}) => {
  if (!value) return 'Schedule TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Schedule TBA';
  if (options.dateOnly) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: options.includeYear === false ? undefined : 'numeric' });
  }
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: options.includeYear === false ? undefined : 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

export const timeUntil = (value, now = new Date()) => {
  if (!value) return { expired: true, label: 'Closed', totalMs: 0 };
  const target = new Date(value);
  const diff = target.getTime() - new Date(now).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return { expired: true, label: 'Closed', totalMs: 0 };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const label = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`;
  return { expired: false, label, totalMs: diff, days, hours, minutes, seconds };
};
export const formatWrestlingCountdown = (value, now = new Date()) => timeUntil(value, now).label;

export const getWrestlingImage = (competitor, fallbackSide = 'A') => (
  competitor?.image || competitor?.profileImage || "/images/pro-wrestling/wrestler-placeholder-a.webp"
);
export const getWrestlerImage = getWrestlingImage;
export const getWrestlingMatchHref = (match) => `/pro-wrestling/matches/${match?._id || match?.slug || ''}`;

export const getMatchProgress = (match) => {
  const max = safeNumber(match?.maximumParticipants, 0);
  const current = safeNumber(match?.participantCount, 0);
  if (max <= 0) return Math.min(100, current > 0 ? 60 : 10);
  return Math.max(0, Math.min(100, (current / max) * 100));
};

export const getWinnerName = (match, winnerValue) => {
  const winner = String(winnerValue || '').toUpperCase();
  if (winner === 'A') return match?.competitorA?.displayName || 'Competitor A';
  if (winner === 'B') return match?.competitorB?.displayName || 'Competitor B';
  if (winner === 'DRAW') return 'Draw';
  if (winner === 'NO_CONTEST') return 'No contest';
  return 'Pending';
};
export const winnerLabel = (winnerValue, match) => getWinnerName(match, winnerValue);

export const normalizePredictionStats = (value = {}) => WRESTLING_STATS.reduce((result, stat) => {
  result[stat.key] = Math.max(0, Math.round(safeNumber(value?.[stat.key] ?? value?.[stat.key.toLowerCase()], 0)));
  return result;
}, {});
export const normalizeWrestlingStats = normalizePredictionStats;
export const emptyPrediction = () => ({ competitorA: normalizePredictionStats(), competitorB: normalizePredictionStats(), winnerPrediction: '' });

export const buildWrestlingFormData = (values, fileFields = []) => {
  const form = new FormData();
  Object.entries(values || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (fileFields.includes(key) && typeof File !== 'undefined' && value instanceof File) {
      form.append(key, value);
    } else if (typeof value === 'object') {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, String(value));
    }
  });
  return form;
};

export const statusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'LIVE') return 'live';
  if (normalized === 'OPEN') return 'open';
  if (normalized === 'FINALIZED' || normalized === 'SETTLED') return 'finalized';
  if (['SCORING', 'LOCKED', 'PREDICTION_SUBMITTED'].includes(normalized)) return 'locked';
  if (['CANCELLED', 'NO_CONTEST', 'REFUNDED'].includes(normalized)) return 'cancelled';
  return 'draft';
};

export const nextStatusOptions = (status) => {
  const transitions = {
    DRAFT: ['OPEN'], OPEN: ['LOCKED', 'LIVE'], LOCKED: ['LIVE', 'SCORING'], LIVE: ['SCORING'], SCORING: ['LIVE'],
  };
  return transitions[String(status || '').toUpperCase()] || [];
};

export const isWrestlingLive = (match) => ['LIVE', 'SCORING'].includes(String(match?.status || '').toUpperCase());
export const hasWrestlingResults = (match) => ['SCORING', 'FINALIZED'].includes(String(match?.status || '').toUpperCase());
export const canEditWrestlingPrediction = (match, now = new Date()) => {
  if (!match || String(match.status || '').toUpperCase() !== 'OPEN') return false;
  const lockAt = match.lockAt ? new Date(match.lockAt) : null;
  return !lockAt || Number.isNaN(lockAt.getTime()) || lockAt.getTime() > new Date(now).getTime();
};
