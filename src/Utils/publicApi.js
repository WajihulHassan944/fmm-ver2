export const DEFAULT_PUBLIC_API_BASE_URL =
  "https://fantasymmadness-game-server-three.vercel.app";

export const PUBLIC_API_BASE_URL = String(
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_PUBLIC_API_BASE_URL,
).replace(/\/$/, "");


const cleanString = (value) => String(value ?? "").trim();

const isUsableString = (value) => {
  const text = cleanString(value);
  if (!text) return false;
  return !["null", "undefined", "none", "n/a"].includes(text.toLowerCase());
};

const pickUsableString = (...values) => {
  for (const value of values) {
    if (isUsableString(value)) return cleanString(value);
  }
  return "";
};

const normalizeCategorySlug = (value = "") => {
  const normalized = cleanString(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "combat";
  if (normalized.includes("bare") || normalized.includes("bkfc")) return "bareknuckle";
  if (normalized.includes("kick")) return "kickboxing";
  if (normalized.includes("box")) return "boxing";
  if (normalized.includes("mma") || normalized.includes("ufc") || normalized.includes("mixed martial")) return "mma";
  if (normalized.includes("wrestl")) return "pro-wrestling";
  return normalized.replace(/\s+/g, "-");
};

const getFighterDisplayName = (value, fallback = "") => {
  if (typeof value === "string") return "";
  return pickUsableString(
    value?.displayName,
    value?.name,
    value?.fighterName,
    value?.fullName,
    value?.nickname,
    fallback,
  );
};

const getFighterDisplayImage = (value, fallback = "") => {
  if (typeof value === "string") return "";
  return pickUsableString(
    value?.primaryImage,
    value?.profileImage,
    value?.image,
    value?.fighterImage,
    value?.avatar,
    fallback,
  );
};

export const getEffectiveFightCategory = (fight = {}) => {
  const secondary = pickUsableString(
    fight.matchCategoryTwo,
    fight.effectiveCategory,
    fight.displayCategory,
    fight.categoryLabel,
  );
  if (secondary) return secondary;
  return pickUsableString(
    fight.matchCategory,
    fight.sport,
    fight.matchSport,
    fight.category,
    fight.fightSport,
    fight.discipline,
    "MMA",
  );
};

export const normalizePublicFightRow = (fight = {}) => {
  if (!fight || typeof fight !== "object") return fight;

  const effectiveCategory = getEffectiveFightCategory(fight);
  const effectiveSlug = normalizeCategorySlug(
    fight.effectiveCategorySlug || fight.categorySlug || effectiveCategory,
  );
  const primaryCategorySlug = normalizeCategorySlug(fight.matchCategory || "");
  const hasSecondaryCategory = Boolean(
    pickUsableString(fight.matchCategoryTwo) ||
      (effectiveSlug && primaryCategorySlug && effectiveSlug !== primaryCategorySlug),
  );
  const fighterAName = pickUsableString(
    fight.matchFighterA,
    fight.fighterAName,
    fight.fighterOneName,
    fight.fighterA?.displayName,
    fight.fighterA?.name,
    getFighterDisplayName(fight.fighterAId),
    getFighterDisplayName(fight.fighterA),
    getFighterDisplayName(fight.fighterOne),
    "Fighter A",
  );
  const fighterBName = pickUsableString(
    fight.matchFighterB,
    fight.fighterBName,
    fight.fighterTwoName,
    fight.fighterB?.displayName,
    fight.fighterB?.name,
    getFighterDisplayName(fight.fighterBId),
    getFighterDisplayName(fight.fighterB),
    getFighterDisplayName(fight.fighterTwo),
    "Fighter B",
  );
  const fighterAImage = pickUsableString(
    fight.fighterAImage,
    fight.matchFighterAImage,
    fight.fighterA?.primaryImage,
    fight.fighterA?.image,
    getFighterDisplayImage(fight.fighterAId),
    getFighterDisplayImage(fight.fighterA),
    getFighterDisplayImage(fight.fighterOne),
  );
  const fighterBImage = pickUsableString(
    fight.fighterBImage,
    fight.matchFighterBImage,
    fight.fighterB?.primaryImage,
    fight.fighterB?.image,
    getFighterDisplayImage(fight.fighterBId),
    getFighterDisplayImage(fight.fighterB),
    getFighterDisplayImage(fight.fighterTwo),
  );

  return {
    ...fight,
    matchFighterA: fighterAName,
    matchFighterB: fighterBName,
    fighterAImage: fighterAImage || fight.fighterAImage,
    fighterBImage: fighterBImage || fight.fighterBImage,
    effectiveCategory,
    effectiveCategorySlug: fight.effectiveCategorySlug || effectiveSlug,
    displayCategory: fight.displayCategory || effectiveCategory,
    categoryLabel: fight.categoryLabel || effectiveCategory,
    categorySlug: fight.categorySlug || effectiveSlug,
    hasSecondaryCategory,
    matchCategoryTwo: pickUsableString(fight.matchCategoryTwo) || (hasSecondaryCategory ? effectiveCategory : ""),
  };
};

export const normalizePublicFightRows = (rows = []) =>
  (Array.isArray(rows) ? rows : []).map(normalizePublicFightRow);

const DEFAULT_TIMEOUT_MS = 12000;

const withTimeout = (executor, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  if (typeof AbortController === "undefined")
    return Promise.resolve(executor());

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return Promise.resolve(executor(controller.signal)).finally(() =>
    clearTimeout(timer),
  );
};

export const buildPublicApiUrl = (path, query = {}) => {
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path}`;
  const url = new URL(`${PUBLIC_API_BASE_URL}${normalizedPath}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value
        .filter((item) => item !== undefined && item !== null && item !== "")
        .forEach((item) => url.searchParams.append(key, item));
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
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
      signal,
    });

    if (!response.ok) {
      const error = new Error(
        `Public API request failed with ${response.status}`,
      );
      error.status = response.status;
      error.url = url;
      throw error;
    }

    return response.json();
  };

  return withTimeout(execute, timeoutMs);
};

export const isDraftFight = (fight = {}) => {
  const values = [
    fight.matchStatus,
    fight.status,
    fight.matchShadowStatus,
    fight.publicStatus,
  ].map((value) =>
    String(value || "")
      .trim()
      .toLowerCase(),
  );
  return Boolean(
    fight.draft ||
    fight.isDraft ||
    fight.publicVisible === false ||
    values.includes("draft"),
  );
};

export const filterPublicFights = (
  fights = [],
  { includeDrafts = false } = {},
) => {
  const rows = Array.isArray(fights) ? fights : [];
  return includeDrafts ? rows : rows.filter((fight) => !isDraftFight(fight));
};

export const normalizePaginatedPayload = (payload, fallback = []) => {
  if (Array.isArray(payload)) {
    return {
      rows: payload,
      pagination: {
        page: 1,
        limit: payload.length,
        total: payload.length,
        pages: 1,
      },
    };
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

  const pagination = payload?.pagination ||
    payload?.meta || {
      page: Number(payload?.page || 1),
      limit: Number(payload?.limit || rows.length),
      total: Number(payload?.total || rows.length),
      pages: Number(payload?.pages || 1),
    };

  return { rows, pagination };
};

const getFightIdentity = (fight = {}) =>
  String(
    fight._id || fight.id || fight.matchId || fight.matchName || "",
  ).trim();

const dedupeFightRows = (rows = []) => {
  const seen = new Set();
  return rows.filter((fight) => {
    const key = getFightIdentity(fight);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchLegacyFightRows = async (
  path,
  query = {},
  includeDrafts = false,
  sourceType = "legacy",
) => {
  const response = await fetch(
    buildPublicApiUrl(path, {
      ...query,
      includeDrafts: includeDrafts ? "true" : undefined,
    }),
  );
  if (!response.ok) return [];
  const payload = await response.json();
  return normalizePublicFightRows(filterPublicFights(normalizePaginatedPayload(payload).rows, {
    includeDrafts,
  })).map((fight) => ({ ...fight, __source: fight.__source || sourceType }));
};

const fetchLegacyCombinedFights = async (query = {}, includeDrafts = false) => {
  const [matchRows, shadowRows] = await Promise.all([
    fetchLegacyFightRows("/match", query, includeDrafts, "match"),
    fetchLegacyFightRows("/shadow", query, includeDrafts, "shadow"),
  ]);
  return dedupeFightRows([...matchRows, ...shadowRows]);
};

export const fetchPublicFights = async (query = {}) => {
  const includeDrafts = ["true", "1", "yes"].includes(
    String(query.includeDrafts || query.admin || "").toLowerCase(),
  );
  const publicQuery = { limit: 100, ...query };

  try {
    const payload = await safeFetchJson("/api/public/fights", publicQuery);
    const rows = normalizePublicFightRows(filterPublicFights(normalizePaginatedPayload(payload).rows, {
      includeDrafts,
    }));
    if (rows.length) return rows;
  } catch (error) {
    console.warn(
      "Public fights API unavailable, falling back to legacy fight endpoints:",
      error.message,
    );
  }

  try {
    return await fetchLegacyCombinedFights(publicQuery, includeDrafts);
  } catch (fallbackError) {
    console.warn("Legacy fight endpoints unavailable:", fallbackError.message);
    return [];
  }
};

export const fetchPublicPredictionFights = async (query = {}) => {
  const includeDrafts = ["true", "1", "yes"].includes(
    String(query.includeDrafts || query.admin || "").toLowerCase(),
  );
  const requestQuery = { limit: 100, ...query };

  const normalizePlayableRows = (payload) =>
    normalizePublicFightRows(filterPublicFights(normalizePaginatedPayload(payload).rows, {
      includeDrafts,
    })).map((fight) => ({
      ...fight,
      __source:
        fight.__source || fight.sourceType || fight.collection || "playable",
      __playable: fight.__playable !== false,
    }));

  try {
    const payload = await safeFetchJson(
      "/api/public/prediction-fights",
      requestQuery,
    );
    const rows = normalizePlayableRows(payload);
    if (rows.length) return rows;
  } catch (error) {
    console.warn(
      "Prediction-ready fights API unavailable, falling back to legacy playable filters:",
      error.message,
    );
  }

  try {
    const legacyRows = await fetchLegacyCombinedFights(
      { ...requestQuery, playable: "true", status: "playable" },
      includeDrafts,
    );
    if (legacyRows.length)
      return legacyRows.map((fight) => ({ ...fight, __playable: true }));
  } catch (error) {
    console.warn("Legacy playable fight filters unavailable:", error.message);
  }

  return fetchPublicFights(requestQuery);
};

export const fetchPublicLeaderboard = async (query = {}) => {
  try {
    const payload = await safeFetchJson(
      "/api/public/leaderboard",
      { limit: 10, ...query },
      { timeoutMs: 8000 },
    );
    return {
      leaderboard: Array.isArray(payload?.leaderboard)
        ? payload.leaderboard
        : [],
      playerCount: Number(payload?.playerCount || 0),
      generatedAt: payload?.generatedAt,
    };
  } catch (error) {
    console.warn("Public leaderboard API unavailable:", error.message);
    return { leaderboard: [], playerCount: 0, generatedAt: null };
  }
};

export const fetchPublicHomeSummary = async (query = {}) => {
  try {
    const payload = await safeFetchJson(
      "/api/public/home-summary",
      {
        fightLimit: 8,
        leaderboardLimit: 5,
        ...query,
      },
      { timeoutMs: 9000 },
    );

    return {
      featuredFights: Array.isArray(payload?.featuredFights)
        ? normalizePublicFightRows(payload.featuredFights)
        : [],
      leaderboard: Array.isArray(payload?.leaderboard)
        ? payload.leaderboard
        : [],
      stats: payload?.stats || {},
      generatedAt: payload?.generatedAt,
    };
  } catch (error) {
    console.warn("Public home-summary API unavailable:", error.message);
    return {
      featuredFights: [],
      leaderboard: [],
      stats: {},
      generatedAt: null,
    };
  }
};

export const fetchPublicBlogs = async (query = {}) => {
  try {
    const payload = await safeFetchJson("/api/public/blogs", {
      limit: 24,
      ...query,
    });
    return normalizePaginatedPayload(payload);
  } catch (error) {
    console.warn(
      "Public blogs API unavailable, falling back to legacy /api/blogs endpoint:",
      error.message,
    );
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/blogs`);
    if (!response.ok) throw error;
    const data = await response.json();
    const blogs = Array.isArray(data) ? data : data?.data || [];
    return normalizePaginatedPayload(blogs);
  }
};

const normalizeListPayload = (payload, fallback = []) =>
  normalizePaginatedPayload(payload, fallback).rows;

const filterByText = (items, terms = []) => {
  const normalizedTerms = terms
    .map((term) => String(term || "").toLowerCase())
    .filter(Boolean);
  if (!normalizedTerms.length) return items;
  return items.filter((item) => {
    const blob = JSON.stringify(item || {}).toLowerCase();
    return normalizedTerms.some((term) => blob.includes(term));
  });
};

const normalizePublicFighter = (fighter = {}) => {
  const id = fighter.id || fighter._id || fighter.slug || fighter.normalizedName || fighter.displayName || fighter.name;
  const name = fighter.displayName || fighter.name || fighter.fighterName || 'Unnamed fighter';
  const image = fighter.primaryImage || fighter.image || fighter.fighterImage || '';
  const category = fighter.category || fighter.discipline || 'Combat sports';
  return {
    ...fighter,
    id,
    _id: fighter._id || id,
    name,
    displayName: fighter.displayName || name,
    image,
    primaryImage: fighter.primaryImage || image,
    category,
    description: fighter.description || fighter.bio || `${name} is part of the Fantasy MMAdness fighter library and appears across combat sports cards.`,
  };
};

export const fetchPublicFighters = async (query = {}) => {
  const requestQuery = { limit: 80, page: 1, ...query };
  const endpoints = [
    '/api/public/combat-fighters',
    '/api/public/fighters',
    '/api/combat-fighters',
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await safeFetchJson(endpoint, requestQuery);
      const rows = normalizeListPayload(payload).map(normalizePublicFighter);
      if (rows.length || payload?.ok) return rows;
    } catch (error) {
      console.warn(`${endpoint} unavailable for public fighters:`, error.message);
    }
  }

  return [];
};

export const fetchPublicWrestlers = async (query = {}) => {
  try {
    const payload = await safeFetchJson("/api/public/wrestlers", {
      limit: 80,
      ...query,
    });
    return normalizeListPayload(payload);
  } catch (error) {
    console.warn("Public wrestlers API unavailable:", error.message);
    return [];
  }
};

export const fetchPublicProWrestlingMatches = async (query = {}) => {
  try {
    const payload = await safeFetchJson("/api/public/pro-wrestling-matches", {
      limit: 60,
      ...query,
    });
    return normalizeListPayload(payload);
  } catch (error) {
    console.warn("Public pro-wrestling match API unavailable:", error.message);
    return [];
  }
};

export const fetchPublicFightById = async (matchId) => {
  if (!matchId) return null;
  try {
    const payload = await safeFetchJson(
      `/api/public/fights/${encodeURIComponent(matchId)}`,
    );
    return (
      payload?.data ||
      payload?.item ||
      payload?.fight ||
      payload?.match ||
      payload
    );
  } catch (error) {
    const fights = await fetchPublicFights({ limit: 100 });
    return (
      fights.find(
        (fight) =>
          String(fight._id || fight.id || fight.matchId) === String(matchId),
      ) || null
    );
  }
};

export const fetchPublicFighterById = async (fighterId) => {
  if (!fighterId) return null;
  try {
    const payload = await safeFetchJson(
      `/api/public/fighters/${encodeURIComponent(fighterId)}`,
    );
    return payload?.data || payload?.item || payload?.fighter || payload;
  } catch (error) {
    const fighters = await fetchPublicFighters({ limit: 100 });
    const normalized = String(fighterId).toLowerCase();
    return (
      fighters.find(
        (fighter) =>
          String(
            fighter._id || fighter.id || fighter.name || "",
          ).toLowerCase() === normalized ||
          String(fighter.name || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-") === normalized,
      ) || null
    );
  }
};

export const fetchPublicWrestlerById = async (wrestlerId) => {
  if (!wrestlerId) return null;
  try {
    const payload = await safeFetchJson(
      `/api/public/wrestlers/${encodeURIComponent(wrestlerId)}`,
    );
    return payload?.data || payload?.item || payload?.wrestler || payload;
  } catch (error) {
    const wrestlers = await fetchPublicWrestlers({ limit: 100 });
    const normalized = String(wrestlerId).toLowerCase();
    return (
      wrestlers.find(
        (wrestler) =>
          String(
            wrestler._id ||
              wrestler.id ||
              wrestler.name ||
              wrestler.wrestlerName ||
              "",
          ).toLowerCase() === normalized ||
          String(wrestler.name || wrestler.wrestlerName || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-") === normalized,
      ) || null
    );
  }
};

export const fetchPublicRelatedBlogs = async ({
  entityId,
  category,
  search,
  limit = 6,
} = {}) => {
  try {
    const payload = await safeFetchJson("/api/public/blogs/related", {
      entityId,
      category,
      search,
      limit,
    });
    return normalizeListPayload(payload);
  } catch (error) {
    const { rows } = await fetchPublicBlogs({ limit: 24, category });
    return filterByText(rows, [search, category]).slice(0, limit);
  }
};
