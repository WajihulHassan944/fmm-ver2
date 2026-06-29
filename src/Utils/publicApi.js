export const DEFAULT_PUBLIC_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';

export const PUBLIC_API_BASE_URL = String(
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_PUBLIC_API_BASE_URL
).replace(/\/$/, '');

const DEFAULT_TIMEOUT_MS = 12000;

const withTimeout = (executor, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  if (typeof AbortController === 'undefined') return Promise.resolve(executor());

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return Promise.resolve(executor(controller.signal)).finally(() => clearTimeout(timer));
};

export const buildPublicApiUrl = (path, query = {}) => {
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;
  const url = new URL(`${PUBLIC_API_BASE_URL}${normalizedPath}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.filter((item) => item !== undefined && item !== null && item !== '').forEach((item) => url.searchParams.append(key, item));
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

export const safeFetchJson = async (path, query = {}, options = {}) => {
  const url = buildPublicApiUrl(path, query);
  const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);

  const execute = async (signal) => {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      signal,
    });

    if (!response.ok) {
      const error = new Error(`Public API request failed with ${response.status}`);
      error.status = response.status;
      error.url = url;
      throw error;
    }

    return response.json();
  };

  return withTimeout(execute, timeoutMs);
};


export const isDraftFight = (fight = {}) => {
  const values = [fight.matchStatus, fight.status, fight.publicStatus]
    .map((value) => String(value || '').trim().toLowerCase());
  return Boolean(fight.draft === true || fight.isDraft === true || values.includes('draft'));
};

export const filterPublicFights = (fights = [], { includeDrafts = false } = {}) => {
  const rows = Array.isArray(fights) ? fights : [];
  return includeDrafts ? rows : rows.filter((fight) => !isDraftFight(fight));
};

export const normalizePaginatedPayload = (payload, fallback = []) => {
  if (Array.isArray(payload)) {
    return { rows: payload, pagination: { page: 1, limit: payload.length, total: payload.length, pages: 1 } };
  }

  const rows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.rows)
        ? payload.rows
        : Array.isArray(payload?.results)
          ? payload.results
          : fallback;

  const pagination = payload?.pagination || payload?.meta || {
    page: Number(payload?.page || 1),
    limit: Number(payload?.limit || rows.length),
    total: Number(payload?.total || rows.length),
    pages: Number(payload?.pages || 1),
  };

  return { rows, pagination };
};

export const fetchPublicFights = async (query = {}) => {
  const includeDrafts = ['true', '1', 'yes'].includes(String(query.includeDrafts || query.admin || '').toLowerCase());
  try {
    const payload = await safeFetchJson('/api/public/fights', { limit: 60, ...query });
    return filterPublicFights(normalizePaginatedPayload(payload).rows, { includeDrafts });
  } catch (error) {
    console.warn('Public fights API unavailable, falling back to legacy /match endpoint:', error.message);
    const response = await fetch(buildPublicApiUrl('/match', { ...query, includeDrafts: includeDrafts ? 'true' : undefined }));
    if (!response.ok) throw error;
    return filterPublicFights(await response.json(), { includeDrafts });
  }
};

export const fetchPublicBlogs = async (query = {}) => {
  try {
    const payload = await safeFetchJson('/api/public/blogs', { limit: 24, ...query });
    return normalizePaginatedPayload(payload);
  } catch (error) {
    console.warn('Public blogs API unavailable, falling back to legacy /api/blogs endpoint:', error.message);
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/blogs`);
    if (!response.ok) throw error;
    const data = await response.json();
    const blogs = Array.isArray(data) ? data : data?.data || [];
    return normalizePaginatedPayload(blogs);
  }
};

const normalizeListPayload = (payload, fallback = []) => normalizePaginatedPayload(payload, fallback).rows;

const filterByText = (items, terms = []) => {
  const normalizedTerms = terms.map((term) => String(term || '').toLowerCase()).filter(Boolean);
  if (!normalizedTerms.length) return items;
  return items.filter((item) => {
    const blob = JSON.stringify(item || {}).toLowerCase();
    return normalizedTerms.some((term) => blob.includes(term));
  });
};

export const fetchPublicFighters = async (query = {}) => {
  try {
    const payload = await safeFetchJson('/api/public/fighters', { limit: 80, ...query });
    return normalizeListPayload(payload);
  } catch (error) {
    console.warn('Public fighters API unavailable, deriving fighters from fights:', error.message);
    const fights = await fetchPublicFights({ limit: 100 });
    const map = new Map();
    fights.forEach((fight) => {
      [
        { name: fight.matchFighterA || fight.fighterAName, image: fight.fighterAImage || fight.matchFighterAImage },
        { name: fight.matchFighterB || fight.fighterBName, image: fight.fighterBImage || fight.matchFighterBImage },
      ].forEach((fighter) => {
        if (!fighter.name || map.has(fighter.name)) return;
        map.set(fighter.name, {
          id: fighter.name,
          _id: fighter.name,
          name: fighter.name,
          image: fighter.image,
          category: fight.matchCategoryTwo || fight.matchCategory,
          description: `${fighter.name} appears in Fantasy MMAdness fight cards and prediction opportunities.`,
        });
      });
    });
    return Array.from(map.values());
  }
};

export const fetchPublicWrestlers = async (query = {}) => {
  try {
    const payload = await safeFetchJson('/api/public/wrestlers', { limit: 80, ...query });
    return normalizeListPayload(payload);
  } catch (error) {
    console.warn('Public wrestlers API unavailable:', error.message);
    return [];
  }
};

export const fetchPublicProWrestlingMatches = async (query = {}) => {
  try {
    const payload = await safeFetchJson('/api/public/pro-wrestling-matches', { limit: 60, ...query });
    return normalizeListPayload(payload);
  } catch (error) {
    console.warn('Public pro-wrestling match API unavailable:', error.message);
    return [];
  }
};

export const fetchPublicFightById = async (matchId) => {
  if (!matchId) return null;
  try {
    const payload = await safeFetchJson(`/api/public/fights/${encodeURIComponent(matchId)}`);
    return payload?.data || payload?.item || payload?.fight || payload?.match || payload;
  } catch (error) {
    const fights = await fetchPublicFights({ limit: 100 });
    return fights.find((fight) => String(fight._id || fight.id || fight.matchId) === String(matchId)) || null;
  }
};

export const fetchPublicFighterById = async (fighterId) => {
  if (!fighterId) return null;
  try {
    const payload = await safeFetchJson(`/api/public/fighters/${encodeURIComponent(fighterId)}`);
    return payload?.data || payload?.item || payload?.fighter || payload;
  } catch (error) {
    const fighters = await fetchPublicFighters({ limit: 100 });
    const normalized = String(fighterId).toLowerCase();
    return fighters.find((fighter) => String(fighter._id || fighter.id || fighter.name || '').toLowerCase() === normalized || String(fighter.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalized) || null;
  }
};

export const fetchPublicWrestlerById = async (wrestlerId) => {
  if (!wrestlerId) return null;
  try {
    const payload = await safeFetchJson(`/api/public/wrestlers/${encodeURIComponent(wrestlerId)}`);
    return payload?.data || payload?.item || payload?.wrestler || payload;
  } catch (error) {
    const wrestlers = await fetchPublicWrestlers({ limit: 100 });
    const normalized = String(wrestlerId).toLowerCase();
    return wrestlers.find((wrestler) => String(wrestler._id || wrestler.id || wrestler.name || wrestler.wrestlerName || '').toLowerCase() === normalized || String(wrestler.name || wrestler.wrestlerName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalized) || null;
  }
};

export const fetchPublicRelatedBlogs = async ({ entityId, category, search, limit = 6 } = {}) => {
  try {
    const payload = await safeFetchJson('/api/public/blogs/related', { entityId, category, search, limit });
    return normalizeListPayload(payload);
  } catch (error) {
    const { rows } = await fetchPublicBlogs({ limit: 24, category });
    return filterByText(rows, [search, category]).slice(0, limit);
  }
};
