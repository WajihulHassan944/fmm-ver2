import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildPublicApiUrl } from "@/Utils/publicApi";
import { dateOnlyToLocalDate, getDateOnlyKey } from "@/Utils/dateOnly";
import {
  FaBell,
  FaBullseye,
  FaChartLine,
  FaCheck,
  FaCoins,
  FaCrown,
  FaFistRaised,
  FaGift,
  FaHome,
  FaPlus,
  FaShieldAlt,
  FaSignal,
  FaTimes,
  FaTrophy,
  FaUserAlt,
  FaUsers,
} from "react-icons/fa";

const ASSET_BASE = "/images/mobile-home/final-v35";
const SIGNUP_HREF = "/CreateAccount";

const sportAssets = {
  boxing: {
    label: "BOXING",
    longLabel: "BOXING",
    color: "#ef4444",
    image: `${ASSET_BASE}/sport-boxing.webp`,
    frames: [`${ASSET_BASE}/sport-boxing.webp`, `${ASSET_BASE}/sport-boxing-0.webp`, `${ASSET_BASE}/sport-boxing-1.webp`, `${ASSET_BASE}/sport-boxing-2.webp`],
    count: "0",
    href: "/upcomingfights?status=all&category=boxing",
  },
  mma: {
    label: "UFC / MMA",
    longLabel: "UFC / MMA",
    color: "#4d8dff",
    image: `${ASSET_BASE}/sport-mma.webp`,
    frames: [`${ASSET_BASE}/sport-mma.webp`, `${ASSET_BASE}/sport-mma-2.webp`, `${ASSET_BASE}/sport-mma-3.webp`],
    count: "0",
    href: "/upcomingfights?status=all&category=mma",
  },
  bareknuckle: {
    label: "BARE KNUCKLE",
    longLabel: "BARE KNUCKLE",
    color: "#f2b544",
    image: `${ASSET_BASE}/sport-bareknuckle.webp`,
    frames: [`${ASSET_BASE}/sport-bareknuckle.webp`, `${ASSET_BASE}/sport-bareknuckle-0.webp`],
    count: "0",
    href: "/upcomingfights?status=all&category=bareknuckle",
  },
  kickboxing: {
    label: "KICKBOXING",
    longLabel: "KICKBOXING",
    color: "#22c55e",
    image: `${ASSET_BASE}/sport-kickboxing.webp`,
    frames: [`${ASSET_BASE}/sport-kickboxing.webp`, `${ASSET_BASE}/sport-kickboxing-0.webp`],
    count: "0",
    href: "/upcomingfights?status=all&category=kickboxing",
  },
  "pro-wrestling": {
    label: "PRO WRESTLING",
    longLabel: "PRO WRESTLING",
    color: "#a855f7",
    image: `${ASSET_BASE}/sport-wrestling.webp`,
    frames: [`${ASSET_BASE}/sport-wrestling.webp`, `${ASSET_BASE}/sport-wrestling-4.webp`],
    count: "0",
    href: "/pro-wrestling",
  },
};

const fallbackApparelItems = [
  { name: "MMADNESS HOODIE", price: "$49.99", image: `${ASSET_BASE}/ap1.webp` },
  { name: "FIGHT TEE", price: "$29.99", image: `${ASSET_BASE}/ap2.webp` },
  { name: "SNAPBACK CAP", price: "$24.99", image: `${ASSET_BASE}/ap3.webp` },
  { name: "FIGHT SHORTS", price: "$39.99", image: `${ASSET_BASE}/ap1-2.webp` },
  { name: "TRAINING GLOVES", price: "$34.99", image: `${ASSET_BASE}/ap2-2.webp` },
];

const HOME_APPAREL_IMAGE_FALLBACKS = [
  `${ASSET_BASE}/ap1.webp`,
  `${ASSET_BASE}/ap2.webp`,
  `${ASSET_BASE}/ap3.webp`,
  `${ASSET_BASE}/ap1-2.webp`,
  `${ASSET_BASE}/ap2-2.webp`,
];

const getHomeApparelFallbackImage = (index = 0) => HOME_APPAREL_IMAGE_FALLBACKS[index % HOME_APPAREL_IMAGE_FALLBACKS.length];

const unwrapHomeMaybeMarkdownUrl = (value = "") => {
  const text = String(value || "").trim();
  const markdownMatch = text.match(/\((https?:\/\/[^)]+)\)/i);
  if (markdownMatch?.[1]) return markdownMatch[1];
  const bracketMatch = text.match(/^\[(https?:\/\/[^\]]+)\]$/i);
  if (bracketMatch?.[1]) return bracketMatch[1];
  return text;
};

const normalizeHomeApparelImageUrl = (value, fallbackIndex = 0) => {
  const raw = unwrapHomeMaybeMarkdownUrl(value);
  if (!raw) return getHomeApparelFallbackImage(fallbackIndex);
  if (raw.includes("/images/mobile-home/app-fixed-v15/")) {
    return raw.replace("/images/mobile-home/app-fixed-v15/", "/images/mobile-home/app-fixed-v32/");
  }
  return raw;
};

const formatHomeApparelPrice = (price, currency = "USD") => {
  const amount = Number(price || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "VIEW";
  return currency === "USD" ? `$${amount.toFixed(2)}` : `${amount.toFixed(2)} ${currency}`;
};

const pickHomeApparelImage = (item = {}, fallbackIndex = 0) => {
  const firstImage = Array.isArray(item.images) ? item.images[0] : null;
  if (typeof firstImage === "string") return normalizeHomeApparelImageUrl(firstImage, fallbackIndex);
  if (firstImage && typeof firstImage === "object") {
    return normalizeHomeApparelImageUrl(firstImage.url_fullxfull || firstImage.url_570xN || firstImage.url_170x135 || "", fallbackIndex);
  }
  return normalizeHomeApparelImageUrl(item.image, fallbackIndex);
};

const normalizeHomeApparelItem = (item = {}, fallbackIndex = 0) => ({
  name: cleanText(item.name || item.title || "FANTASY MMADNESS GEAR", "FANTASY MMADNESS GEAR").toUpperCase(),
  price: item.displayPrice || formatHomeApparelPrice(item.price, item.currency),
  image: pickHomeApparelImage(item, fallbackIndex),
  href: "/apparel",
});

const formatCompactMetric = (value, fallback = 'LIVE') => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return number >= 1000 ? `${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(number)}+` : number.toLocaleString();
};

const formatMoneyMetric = (value, fallback = 'OPEN') => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return number >= 1000 ? `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(number)}+` : `$${number.toLocaleString()}`;
};

const buildHomeStatCards = ({ homepageStats = {}, fightCount = 0, leaderboardCount = 0, prizePool = 0 }) => {
  const registered = numberFrom(homepageStats.players, homepageStats.registeredUsers, homepageStats.predictors, homepageStats.totalUsers);
  const todayJoined = numberFrom(homepageStats.todayUsers, homepageStats.playersToday, homepageStats.joinedToday);
  const totalPrize = numberFrom(homepageStats.totalPrizePool, homepageStats.prizePools, homepageStats.prizes, prizePool);
  const todayPaid = numberFrom(homepageStats.paidOutToday, homepageStats.todayPayouts, homepageStats.dailyPrizes);
  const activeFights = numberFrom(homepageStats.activeFights, homepageStats.liveEvents, fightCount);
  const rankedPlayers = numberFrom(homepageStats.leaderboardPlayers, homepageStats.rankedPlayers, leaderboardCount);

  return [
    { Icon: FaUsers, value: formatCompactMetric(registered, activeFights > 0 ? `${activeFights}` : 'LIVE'), label: registered > 0 ? 'PREDICTORS' : 'ACTIVE CARDS', sub: todayJoined > 0 ? `+${todayJoined.toLocaleString()} today` : '', tone: 'purple', href: '/leaderboard' },
    { Icon: FaTrophy, value: formatMoneyMetric(totalPrize, 'PRIZES'), label: totalPrize > 0 ? 'IN PRIZES' : 'PRIZE TERMS', sub: todayPaid > 0 ? `$${todayPaid.toLocaleString()} today` : '', tone: 'gold', href: '/fights-rewards' },
    { Icon: FaSignal, value: activeFights > 0 ? activeFights.toLocaleString() : 'OPEN', label: activeFights > 0 ? 'LIVE EVENTS' : 'FIGHT CARDS', tone: 'blue', href: '/upcomingfights' },
    { Icon: FaChartLine, value: rankedPlayers > 0 ? rankedPlayers.toLocaleString() : 'LIVE', label: 'LEADERBOARDS', tone: 'green', href: '/leaderboard' },
    { Icon: FaShieldAlt, value: 'REAL FIGHTS', label: 'REAL ACTION', tone: 'yellow', href: '/guides' },
  ];
};

const socialLinks = [
  { href: "https://x.com/FMmadness2024", label: "X", short: "X", bg: "#030305", path: "M18.9 3H22l-7.5 8.6L23 21h-6.9l-5.4-6.4L4.4 21H1.3l8-9.2L1 3h7l4.9 5.8L18.9 3z" },
  { href: "https://www.instagram.com/fantasymmadness", label: "Instagram", short: "IG", bg: "#dd2a7b", path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm0 2A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5zM17.75 6a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" },
  { href: "https://www.facebook.com/fantasymmadness", label: "Facebook", short: "FB", bg: "#1877f2", path: "M13 22v-9h3l.5-4H13V6.5c0-1.15.3-1.9 2-1.9h2V1.1C16.6 1 15.4.9 14 .9c-2.9 0-4.9 1.8-4.9 5V9H6v4h3v9h4z" },
  { href: "https://www.tiktok.com/@fantasymmadness", label: "TikTok", short: "TT", bg: "#25f4ee", path: "M16 2h3.2a5.6 5.6 0 0 0 4 3.9v3.3a8.9 8.9 0 0 1-4-1v6.9a6.9 6.9 0 1 1-6.9-6.9c.3 0 .6 0 .9.1v3.4a3.5 3.5 0 1 0 3.5 3.5V2z" },
];

const pick = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

const numberFrom = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
};

const compact = (value, fallback = "") => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return new Intl.NumberFormat("en-US", {
    notation: number >= 10000 ? "compact" : "standard",
    maximumFractionDigits: number >= 10000 ? 1 : 0,
  }).format(number);
};

const cleanText = (value, fallback = "") => String(value || fallback || "").replace(/[_-]+/g, " ").trim();

const firstName = (name) => cleanText(name, "Fighter").split(/\s+/)[0] || "Fighter";

const getFightId = (fight = {}) => fight?._id || fight?.id || fight?.matchId || fight?.slug || "";

const getFightHref = (fight = {}) => {
  const id = getFightId(fight);
  if (!id || String(id).startsWith("fallback")) return "/upcomingfights";
  const rawSport = String(
    pick(
      fight?.__source,
      fight?.sport,
      fight?.category,
      fight?.fightCategory,
      fight?.matchCategoryTwo,
      fight?.matchCategory,
      fight?.combatSport,
      fight?.type,
    ),
  ).toLowerCase();
  if (rawSport.includes("wrestl") || rawSport.includes("pro-wrestling")) return `/pro-wrestling/matches/${id}`;
  return `/fight/${id}?play=1`;
};

const getSportKey = (fight = {}) => {
  const raw = String(
    pick(
      fight?.sport,
      fight?.category,
      fight?.fightCategory,
      fight?.matchCategoryTwo,
      fight?.matchCategory,
      fight?.combatSport,
      fight?.type,
      "mma",
    ),
  ).toLowerCase();
  if (raw.includes("box") && !raw.includes("kick")) return "boxing";
  if (raw.includes("bare") || raw.includes("bkfc")) return "bareknuckle";
  if (raw.includes("kick")) return "kickboxing";
  if (raw.includes("wrestl") || raw.includes("pro")) return "pro-wrestling";
  return "mma";
};

const getFighter = (fight = {}, side = "A") => {
  const isA = side === "A";
  const candidate = isA
    ? fight?.fighterA || fight?.fighterAId || fight?.redCorner || fight?.competitorA || fight?.playerA
    : fight?.fighterB || fight?.fighterBId || fight?.blueCorner || fight?.competitorB || fight?.playerB;
  if (candidate && typeof candidate === "object") return candidate;
  return {};
};

const getFighterName = (fight = {}, side = "A") => {
  const isA = side === "A";
  const fighter = getFighter(fight, side);
  return cleanText(
    pick(
      isA ? fight?.fighterAName : fight?.fighterBName,
      isA ? fight?.fighter1Name : fight?.fighter2Name,
      isA ? fight?.redCornerName : fight?.blueCornerName,
      isA ? fight?.homeFighter : fight?.awayFighter,
      isA ? fight?.matchFighterA : fight?.matchFighterB,
      isA ? fight?.f1 : fight?.f2,
      fighter?.displayName,
      fighter?.fullName,
      fighter?.name,
      fighter?.firstName && fighter?.lastName ? `${fighter.firstName} ${fighter.lastName}` : "",
      isA ? "FIGHTER A" : "FIGHTER B",
    ),
  ).toUpperCase();
};

const getFighterImage = (fight = {}, side = "A") => {
  const isA = side === "A";
  const fighter = getFighter(fight, side);
  return pick(
    isA ? fight?.fighterAImage : fight?.fighterBImage,
    isA ? fight?.fighter1Image : fight?.fighter2Image,
    isA ? fight?.redCornerImage : fight?.blueCornerImage,
    isA ? fight?.cornerAImage : fight?.cornerBImage,
    fighter?.profileUrl,
    fighter?.profileImage,
    fighter?.image,
    fighter?.imageUrl,
    fighter?.avatar,
    sportAssets[getSportKey(fight)]?.image || sportAssets.mma.image,
  );
};

const isDesignFallbackPoster = (value = "") => {
  const src = String(value || "");
  return src.includes("/images/mobile-home/") || src.includes("/images/fmm-experience/");
};

const getExplicitPoster = (fight = {}) => {
  const posterFields = [
    fight?.fightPosterMobileImage,
    fight?.fightPosterImage,
    fight?.posterImage,
    fight?.poster,
    fight?.bannerImage,
    fight?.eventPoster,
    fight?.homepagePromotion?.posterImage,
    fight?.homepagePromotion?.image,
    fight?.promotionBackground,
  ];
  const posterSrc = posterFields.find((item) => item && !String(item).startsWith("data:") && !isDesignFallbackPoster(item));
  if (posterSrc) return posterSrc;

  // Some older records store a generic UI/fighter asset in `image`; do not pair
  // those local design fallbacks with live fight names because it creates the
  // exact poster/name mismatch reported by the client.
  const imageSrc = fight?.image && !String(fight.image).startsWith("data:") && !isDesignFallbackPoster(fight.image) ? fight.image : "";
  return imageSrc || "";
};

const buildUpcomingEvent = (fight = {}, index = 0) => {
  const explicitPoster = getExplicitPoster(fight);
  const key = getSportKey(fight);
  return {
    id: getFightId(fight) || `fallback-${index}`,
    f1: getFighterName(fight, "A"),
    f2: getFighterName(fight, "B"),
    tag: cleanText(pick(fight?.tag, fight?.league, fight?.promotion, sportAssets[key]?.longLabel), sportAssets[key]?.longLabel).toUpperCase(),
    color: sportAssets[key]?.color || "#ef4444",
    date: getDateLabel(fight),
    prize: getPrize(fight),
    image: explicitPoster || getFighterImage(fight, "A") || getFighterImage(fight, "B") || sportAssets[key]?.image || sportAssets.mma.image,
    fallbackImage: sportAssets[key]?.image || sportAssets.mma.image,
    href: getFightHref(fight),
  };
};

const getPrize = (fight = {}, fallback = "PRIZE TERMS PENDING") => {
  const raw = pick(fight?.prizePool, fight?.prize, fight?.winningAmount, fight?.cashPrize, fight?.currentPot, fight?.pot);
  if (!raw) return fallback;
  const numeric = numberFrom(raw);
  if (String(raw).includes("$")) return String(raw);
  if (numeric > 0) return `$${numeric.toLocaleString()}`;
  return String(raw);
};

const getEntry = (fight = {}) => {
  const raw = pick(fight?.entryFee, fight?.fee, fight?.entryCost, fight?.cost, fight?.matchTokens, fight?.tokensRequired);
  const numeric = numberFrom(raw);
  if (numeric > 0) return `${numeric.toLocaleString()} FM`;
  return "FREE";
};

const getEntries = (fight = {}) => {
  const predictions = Array.isArray(fight?.userPredictions) ? fight.userPredictions.length : 0;
  return numberFrom(fight?.entryCount, fight?.entries, fight?.playerCount, fight?.players, predictions);
};

const getDateLabel = (fight = {}, fallback = "TBA · LIVE NOW") => {
  const raw = pick(fight?.matchDateKey, fight?.eventDateKey, fight?.date, fight?.matchDate, fight?.startDate, fight?.scheduledAt, fight?.eventDate, fight?.iso);
  if (!raw) return fallback;
  const dateKey = getDateOnlyKey(raw);
  const date = dateOnlyToLocalDate(dateKey, fight?.matchTime || fight?.time || "23:59");
  if (!date || Number.isNaN(date.getTime())) return String(raw);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const days = Math.max(0, Math.floor(diffMs / 86400000));
  const hours = Math.max(0, Math.floor((diffMs % 86400000) / 3600000));
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${date.getDate()} · ${days}D : ${String(hours).padStart(2, "0")}H`;
};

const getShortDate = (fight = {}) => {
  const label = getDateLabel(fight, "DATE TBA");
  return label.split("·")[0].trim();
};
const parseFinalMonthDayTextDate = (text = "") => {
  const match = String(text).match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})\b/i);
  if (!match) return null;
  const date = new Date(`${match[1]} ${match[2]}, ${new Date().getFullYear()}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseFinalFightDate = (fight = {}) => {
  const raw = pick(
    fight?.matchDate,
    fight?.date,
    fight?.fightDate,
    fight?.scheduledAt,
    fight?.startDate,
    fight?.eventDate,
    fight?.iso,
    fight?.dateLabel,
    fight?.scheduleLabel,
    fight?.matchDateLabel,
    fight?.homepagePromotionStartsAt,
    fight?.homepagePromotion?.startsAt,
    fight?.homepagePromotion?.subtitle,
    fight?.homepagePromotionSubtitle,
  );

  const searchableText = [
    raw,
    fight?.matchName,
    fight?.matchDescription,
    fight?.homepagePromotion?.title,
    fight?.homepagePromotion?.subtitle,
  ].filter(Boolean).join(" ").trim();

  if (!searchableText) return null;

  const text = String(raw || searchableText).trim();
  const timeText = String(fight?.matchTime || fight?.time || fight?.fightTime || "").trim();
  const timeMatch = timeText.match(/^(\d{1,2}):(\d{2})/);
  const isIsoLike = /^\d{4}-\d{2}-\d{2}/.test(text) || text.includes("T");
  let date = null;

  if (isIsoLike) {
    const base = text.includes("T") ? text : `${text}T${String(timeMatch?.[1] || "23").padStart(2, "0")}:${String(timeMatch?.[2] || "59").padStart(2, "0")}:00`;
    date = new Date(base);
  }
  if (!date || Number.isNaN(date.getTime())) date = new Date(text);
  if (!date || Number.isNaN(date.getTime())) {
    date = parseFinalMonthDayTextDate(text) || parseFinalMonthDayTextDate(searchableText);
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  if (timeMatch && !text.includes("T")) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) date.setHours(hours, minutes, 0, 0);
  } else if (!text.includes("T")) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

const isPastFinalFight = (fight = {}, nowValue = new Date()) => {
  const statusText = [
    fight?.matchStatus,
    fight?.matchShadowOpenStatus,
    fight?.matchShadowStatus,
    fight?.status,
    fight?.timelineBucket,
    fight?.publicTimelineBucket,
    fight?.resultStatus,
  ].filter(Boolean).join(" ");
  if (/(finished|complete|completed|closed|cancelled|canceled|past|result|final)/i.test(statusText)) return true;
  const date = parseFinalFightDate(fight);
  const now = nowValue instanceof Date ? nowValue : new Date(nowValue || Date.now());
  return Boolean(date && !Number.isNaN(now.getTime()) && date.getTime() < now.getTime());
};


const FinalHomeV35 = ({
  currentUser,
  leaderboardRows = [],
  homepageStats = {},
  activeFightSport = "boxing",
  setActiveFightSport = () => {},
  heroSlides = [],
  homeFightSections = [],
  now,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [coinModalOpen, setCoinModalOpen] = useState(false);
  const [aiScoutOpen, setAiScoutOpen] = useState(false);
  const [layout, setLayout] = useState("classic");

  const [homeApparelItems, setHomeApparelItems] = useState(() => fallbackApparelItems.map((item, index) => normalizeHomeApparelItem(item, index)));

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    document.body.classList.add("fmm-final-home-route-v41");
    return () => document.body.classList.remove("fmm-final-home-route-v41");
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadEtsyApparel = async () => {
      try {
        const response = await fetch(buildPublicApiUrl("/api/public/apparel-products?limit=8&v=45"), {
          headers: { Accept: "application/json" },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(payload?.products) || !payload.products.length) return;
        if (!cancelled) setHomeApparelItems(payload.products.map((item, index) => normalizeHomeApparelItem(item, index)).slice(0, 8));
      } catch (_error) {
        // Keep the bundled design products when Etsy credentials/API are unavailable.
      }
    };
    loadEtsyApparel();
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoggedIn = Boolean(currentUser?._id || currentUser?.email || currentUser?.username);
  const resolvedTokenBalance = numberFrom(currentUser?.tokens, currentUser?.walletTokens, currentUser?.wallet?.balance);
  // Match the standalone design wallet and use one balance value everywhere.
  // A missing/zero anonymous balance falls back to the same demo value shown in the wallet section.
  const tokenBalance = resolvedTokenBalance > 0 ? resolvedTokenBalance : 0;
  const notificationCount = isLoggedIn ? numberFrom(currentUser?.notificationsUnread, currentUser?.unreadNotifications) : 0;
  const playerLevel = Math.max(1, numberFrom(currentUser?.fightIqLevel, currentUser?.level) || 1);
  const xpValue = numberFrom(currentUser?.xp, currentUser?.totalXp);
  const xpTarget = Math.max(1000, Math.ceil(Math.max(1, xpValue) / 1000) * 1000);
  const xpPct = Math.min(100, Math.max(0, Math.round((xpValue / xpTarget) * 100)));

  const sports = useMemo(() => {
    const sectionMap = new Map((homeFightSections || []).map((section) => [section.key, section]));
    return Object.entries(sportAssets).map(([key, sport]) => {
      const section = sectionMap.get(key);
      return {
        key,
        ...sport,
        count: section?.count ? Number(section.count).toLocaleString() : sport.count,
        fights: Array.isArray(section?.fights)
          ? section.fights.filter((fight) => !isPastFinalFight(fight, now))
          : [],
      };
    });
  }, [homeFightSections, now]);

  const activeSport = sportAssets[activeFightSport] ? activeFightSport : "boxing";
  const activeSection = sports.find((sport) => sport.key === activeSport) || sports[0];
  const realFights = Array.isArray(activeSection?.fights)
    ? activeSection.fights.filter((fight) => fight && !isPastFinalFight(fight, now))
    : [];
  const allRealFights = useMemo(
    () => [
      ...(Array.isArray(heroSlides) ? heroSlides : []),
      ...sports.flatMap((sport) => sport.fights || []),
    ].filter((fight) => fight && !isPastFinalFight(fight, now)),
    [heroSlides, sports, now],
  );

  const realPrizePoolTotal = allRealFights.reduce((sum, fight) => sum + numberFrom(fight?.prizePool, fight?.prize, fight?.winningAmount, fight?.cashPrize, fight?.currentPot, fight?.pot), 0);
  const liveStatCards = useMemo(() => buildHomeStatCards({
    homepageStats,
    fightCount: allRealFights.length,
    leaderboardCount: Array.isArray(leaderboardRows) ? leaderboardRows.length : 0,
    prizePool: realPrizePoolTotal,
  }), [homepageStats, allRealFights.length, leaderboardRows, realPrizePoolTotal]);

  const featuredFight = realFights[0] || allRealFights[0] || {
    id: "fallback-main",
    sport: "boxing",
    f1: "FIGHTER A",
    f2: "FIGHTER B",
  };

  const upcomingEvents = allRealFights
    .filter((fight, index, rows) => rows.findIndex((row) => String(getFightId(row)) === String(getFightId(fight))) === index)
    .slice(0, 8)
    .map(buildUpcomingEvent);

  const fighterA = getFighterName(featuredFight, "A");
  const fighterB = getFighterName(featuredFight, "B");
  const fighterAFirst = firstName(fighterA);
  const fighterBFirst = firstName(fighterB);
  const featuredHref = getFightHref(featuredFight);
  const featuredSport = sportAssets[getSportKey(featuredFight)] || sportAssets.boxing;
  const featuredPrize = getPrize(featuredFight);
  const featuredEntry = getEntry(featuredFight);
  const featuredEntries = getEntries(featuredFight);
  const featuredEntriesLabel = featuredEntries > 0 ? featuredEntries.toLocaleString() : "NO ENTRIES YET";
  const predictionHref = featuredHref || "/upcomingfights";
  const watchPartyHref = "/watch-party";
  const leaguesHref = "/FantasyLeagues";
  const demoHref = "/free-demo";
  const coinCheckoutHref = "/checkout?product=fm-coins";

  const hasRealLeaders = Array.isArray(leaderboardRows) && leaderboardRows.length > 0;
  const leaders = (hasRealLeaders ? leaderboardRows : []).slice(0, 4).map((row, index) => ({
    rank: row.rank || index + 1,
    name: cleanText(row.name || row.username || row.playerName || "Player"),
    points: numberFrom(row.points, row.totalPoints, row.score),
  }));

  const scoutingReport = featuredFight?.aiScoutingReport && typeof featuredFight.aiScoutingReport === 'object'
    ? featuredFight.aiScoutingReport
    : null;
  const communityPickCount = Number(scoutingReport?.pickCount || 0);
  const communityA = communityPickCount > 0 ? Number(scoutingReport?.pickSplit?.fighterA) : null;
  const communityB = communityPickCount > 0 ? Number(scoutingReport?.pickSplit?.fighterB) : null;
  const liveTickerItems = [
    ["🔥", allRealFights.length ? `${allRealFights.length} published fight card${allRealFights.length === 1 ? "" : "s"} available` : "New fight cards publish here automatically", "#ff6b3b"],
    ["🥊", "Contest dates, fees and prize terms come from the registered fight", "#f2b544"],
    ["🏆", leaders.length ? `${leaders.length} ranked predictor${leaders.length === 1 ? "" : "s"} currently shown` : "Leaderboard opens after scored predictions", "#22c55e"],
    ["⚡", "Fight status and entries refresh from the production feed", "#4d8dff"],
  ];

  return (
    <div className={`fmm-home-v35-final ${coinModalOpen ? "is-coin-modal-open" : ""} ${aiScoutOpen ? "is-ai-scout-open" : ""}`} data-layout={layout}>
      <div className="fmm-v35-page-bg" aria-hidden="true" />

      <header className="fmm-v35-topbar">
        <button type="button" className="fmm-v35-icon-button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <span /><span /><span />
        </button>
        <button type="button" className="fmm-v35-wallet" onClick={() => setCoinModalOpen(true)} aria-label="Open FM coin wallet">
          <b>FM</b><strong>{tokenBalance.toLocaleString()}</strong><i><FaPlus /></i>
        </button>
        <Link href={isLoggedIn ? "/profile" : "/login?next=/profile"} className="fmm-v35-notify" aria-label={`Notifications and profile: ${notificationCount} unread`}>
          <FaBell /><span className="fmm-v42-sr-only">Notifications</span>{notificationCount > 0 ? <em>{notificationCount}</em> : null}
        </Link>
      </header>

      {menuOpen && (
        <div className="fmm-v35-menu-layer" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close menu" className="fmm-v35-menu-backdrop" onClick={() => setMenuOpen(false)} />
          <aside className="fmm-v35-menu">
            <div>
              <img src={`${ASSET_BASE}/crown-title-final.png`} alt="Fantasy MMAdness" />
              <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><FaTimes /></button>
            </div>
            <nav>
              {[
                ["/", "Home"],
                ["/upcomingfights", "Contests"],
                [predictionHref, "Make Predictions"],
                ["/leaderboard", "Leaderboard"],
                ["/FantasyLeagues", "Leagues"],
                ["/apparel", "Apparel"],
                ["/blogs", "Fight News"],
                ["/affiliate-create-account", "Affiliates"],
              ].map(([href, label]) => <Link href={href} key={label} onClick={() => setMenuOpen(false)}>{label}<span>›</span></Link>)}
            </nav>
          </aside>
        </div>
      )}

      <main className="fmm-v35-shell">
        <section className="fmm-v35-layout-switch" aria-label="Homepage display style">
          <button type="button" className={layout === "classic" ? "is-active" : ""} onClick={() => setLayout("classic")}>CLASSIC</button>
          <button type="button" className={layout === "bold" ? "is-active" : ""} onClick={() => setLayout("bold")}>⚡ BOLD</button>
        </section>

        <section className="fmm-v35-hero" aria-label="Fantasy MMAdness combat prediction game">
          <img src={`${ASSET_BASE}/hero-banner-crop.png`} alt="Fantasy MMAdness combat prediction game" />
          <span className="fmm-v35-hero-flame is-red" aria-hidden="true" />
          <span className="fmm-v35-hero-flame is-blue" aria-hidden="true" />
          <span className="fmm-v35-hero-sparks" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, index) => <i key={index} />)}
          </span>
          <span className="fmm-v36-hero-rays" aria-hidden="true" />
          <span className="fmm-v36-hero-scan" aria-hidden="true" />
          <span className="fmm-v36-hero-burst" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, index) => <i key={index} />)}
          </span>
          <Link href={isLoggedIn ? predictionHref : SIGNUP_HREF} className="fmm-v35-hero-hit" aria-label={isLoggedIn ? "Make predictions" : "Join free"} />
        </section>

        <section className="fmm-v35-ticker" aria-label="Live ticker">
          <div>
            {liveTickerItems.concat(liveTickerItems).map(([icon, copy, color], index) => (
              <span key={`${copy}-${index}`} style={{ "--ticker-color": color }}><b>{icon}</b>{copy}</span>
            ))}
          </div>
        </section>

        <section className="fmm-v35-stats" aria-label="Fantasy MMAdness stats">
          {liveStatCards.map(({ Icon, value, label, sub, tone, href }) => (
            <Link href={href} key={label} className={`is-${tone}`}>
              <Icon /><strong>{value}</strong><span>{label}</span>{sub ? <small>{sub}</small> : null}
            </Link>
          ))}
        </section>

        <div className="fmm-v35-section-label is-sport"><span>››</span><strong>CHOOSE YOUR COMBAT SPORT</strong><span>‹‹</span></div>
        <section className="fmm-v35-sports" aria-label="Choose your combat sport">
          {sports.map((sport) => (
            <button
              type="button"
              key={sport.key}
              className={activeSport === sport.key ? "is-active" : ""}
              style={{ "--sport-color": sport.color }}
              onClick={() => setActiveFightSport(sport.key)}
            >
              <span className="fmm-v36-sport-frames" aria-hidden="true">
                {(sport.frames?.length ? sport.frames : [sport.image]).map((src, frameIndex) => (
                  <img src={src} alt="" key={`${sport.key}-${frameIndex}`} />
                ))}
              </span>
              <strong>{sport.label}</strong>
              <span><FaUsers /> {sport.count}</span>
              <small><i />{activeSport === sport.key ? "SELECTED" : "LIVE"}</small>
            </button>
          ))}
        </section>

        <section className="fmm-v35-featured-week" aria-labelledby="fmm-v35-featured-week-title">
          <img className="fmm-v35-fw-bg" src={`${ASSET_BASE}/pasted-1785015130714-0.png`} alt="" aria-hidden="true" />
          <img className="fmm-v35-fw-fighter is-left" src={getFighterImage(featuredFight, "A")} alt="" />
          <img className="fmm-v35-fw-fighter is-right" src={getFighterImage(featuredFight, "B")} alt="" />
          <div className="fmm-v35-fw-top"><span>★ FEATURED THIS WEEK</span><b>⏱ LIVE NOW</b></div>
          <div className="fmm-v35-fw-copy">
            <small>{featuredSport.longLabel}</small>
            <h2 id="fmm-v35-featured-week-title">{fighterA} <em>VS</em> {fighterB}</h2>
            <div className="fmm-v35-fw-meta">
              <strong>{featuredPrize}<small> CASH POOL</small></strong>
              <strong>{featuredEntry}<small> ENTRY FEE</small></strong>
              <strong>{featuredEntriesLabel}<small> ENTRIES</small></strong>
            </div>
            <Link href={predictionHref}>MAKE PREDICTIONS</Link>
          </div>
        </section>

        <section className="fmm-v35-upcoming" aria-labelledby="fmm-v35-upcoming-title">
          <div className="fmm-v35-heading-row"><h2 id="fmm-v35-upcoming-title">UPCOMING EVENTS</h2><Link href="/upcomingfights">VIEW ALL ›</Link></div>
          <div className="fmm-v35-event-rail">
            {upcomingEvents.length ? upcomingEvents.map((event, index) => (
              <article key={event.id} style={{ "--event-color": event.color }}>
                <Link href={event.href}>
                  <figure>
                    <img src={event.image} alt="" onError={(error) => { error.currentTarget.onerror = null; error.currentTarget.src = event.fallbackImage || sportAssets.mma.image; }} />
                    <figcaption>{event.tag}</figcaption>
                  </figure>
                  <h3>{event.f1} <em>VS</em> {event.f2}</h3>
                  <time>{event.date}</time>
                  <strong>{event.prize}</strong>
                </Link>
                <div><Link href={event.href}>⚡ {firstName(event.f1)}</Link><Link href={event.href}>⚡ {firstName(event.f2)}</Link></div>
                <Link href={event.href} className="fmm-v35-enter">ENTER NOW</Link>
              </article>
            )) : <div className="fmm-v41-leader-empty"><span>New fight cards will appear here as soon as they are published.</span></div>}
          </div>
        </section>

        <section className="fmm-v35-feature-detail" aria-labelledby="fmm-v35-detail-title">
          <img className="fmm-v35-detail-bg" src={`${ASSET_BASE}/pasted-1785011607947-0.png`} alt="" aria-hidden="true" />
          <img className="fmm-v35-detail-fighter is-left" src={getFighterImage(featuredFight, "A")} alt="" />
          <img className="fmm-v35-detail-fighter is-right" src={getFighterImage(featuredFight, "B")} alt="" />
          <div className="fmm-v35-detail-copy">
            <span>FEATURED FIGHT · {featuredSport.longLabel}</span>
            <h2 id="fmm-v35-detail-title">{fighterA} <em>VS</em> {fighterB}</h2>
            <div className="fmm-v35-detail-meta"><b>{getShortDate(featuredFight)}</b><b>{cleanText(featuredFight?.matchTime || featuredFight?.time || "TIME TBA")}</b><b>{cleanText(featuredFight?.venue || "VENUE TBA")}</b></div>
            <div className="fmm-v35-detail-money"><p><small>PRIZE POOL</small><strong>{featuredPrize}</strong></p><p><small>FM ENTRY FEE</small><strong>{featuredEntry}</strong></p><p><small>ENTRIES</small><strong>{featuredEntriesLabel}</strong></p></div>
            <button type="button" className="fmm-v35-ai" onClick={() => setAiScoutOpen(true)}>🤖 AI SCOUTING REPORT — NEW FOR THIS FIGHT</button>
            <Link href={predictionHref} className="fmm-v35-red-btn">MAKE PREDICTIONS</Link>
          </div>
        </section>

        <section className="fmm-v35-promos" aria-label="Watch party and leagues">
          <Link href={watchPartyHref}><img src={`${ASSET_BASE}/pasted-1785015130714-0.png`} alt="" /><span>🔴 LIVE NOW</span><strong>WATCH PARTY</strong><small>Live scoring · crowd reactions</small></Link>
          <Link href={leaguesHref}><img src={`${ASSET_BASE}/pasted-1785012202182-0.png`} alt="" /><span>⚔ COMPETE</span><strong>LEAGUES · H2H</strong><small>Private leagues & wagers</small></Link>
        </section>

        <Link href={demoHref} className="fmm-v35-demo"><b>NEW HERE?</b><span>TRY A FREE DEMO FIGHT — NO COINS NEEDED</span></Link>

        <section className="fmm-v35-dashboard" aria-label="Predictions and progression">
          <article className="fmm-v35-dash-card fmm-v35-community">
            <img src={`${ASSET_BASE}/pasted-1785014371576-0.png`} alt="" />
            <div><span>COMMUNITY PREDICTIONS</span><small>{fighterAFirst} VS {fighterBFirst}</small>{communityPickCount > 0 ? <><div className="fmm-v35-donut" style={{ "--pct": communityA }}><b /></div><p><b>{fighterAFirst}</b><strong>{communityA}%</strong></p><p><b>{fighterBFirst}</b><strong>{communityB}%</strong></p></> : <p className="fmm-v41-leader-empty"><span>No submitted picks yet.</span></p>}</div>
          </article>
          <article className="fmm-v35-dash-card fmm-v35-progress">
            <img src={`${ASSET_BASE}/pasted-1785013690779-0.png`} alt="" />
            <div><span>YOUR PROGRESSION</span><i>{playerLevel}</i><small>FIGHT IQ</small><strong>{xpValue.toLocaleString()} XP</strong><em><b style={{ width: `${xpPct}%` }} /></em><p>NEXT LEVEL: {xpTarget.toLocaleString()} XP</p><u>♛ FIGHT IQ · LEVEL {playerLevel}</u></div>
          </article>
          <Link href="/leaderboard" className="fmm-v35-dash-card fmm-v35-leader">
            <img src={`${ASSET_BASE}/pasted-1785012542538-0.png`} alt="" />
            <div><header><span>LEADERBOARD</span><small>VIEW ALL ›</small></header>{leaders.length ? leaders.slice(0, 3).map((row) => <p key={`${row.rank}-${row.name}`}><b>{row.rank}.</b><span>{row.name}</span><strong>{row.points.toLocaleString()}</strong></p>) : <p className="fmm-v41-leader-empty"><span>Scores publish after official results.</span></p>}</div>
          </Link>
          <button type="button" className="fmm-v35-dash-card fmm-v35-streak" onClick={() => setCoinModalOpen(true)}>
            <img src={`${ASSET_BASE}/pasted-1785014166827-0.png`} alt="" />
            <div><span>STREAK BONUS</span><h3>🔥 7 DAY STREAK</h3><section>{[1, 2, 3, 4, 5, 6, 7].map((day) => <i key={day}>✓</i>)}</section><strong>+250 FM</strong><small>🏆 Streak expires in 5h 56m</small></div>
          </button>
        </section>

        <section className="fmm-v35-wallet-grid" aria-label="Rewards and wallet">
          <button type="button" className="fmm-v35-mini-card is-daily-reward" onClick={() => setCoinModalOpen(true)}><span>DAILY REWARD</span><FaGift className="fmm-v49-reward-icon" aria-hidden="true" /><small>COME BACK EVERY DAY & BUILD YOUR STREAK!</small><strong>CLAIM REWARD</strong></button>
          <button type="button" className="fmm-v35-mini-card is-coins" onClick={() => setCoinModalOpen(true)}><span>COINS WALLET</span><FaCoins /><b>{tokenBalance.toLocaleString()}</b><small>COINS</small><strong>ADD COINS <FaPlus /></strong></button>
        </section>

        <section className="fmm-v35-apparel" aria-labelledby="fmm-v35-apparel-title">
          <div className="fmm-v35-heading-row"><h2 id="fmm-v35-apparel-title">APPAREL</h2><Link href="/apparel">VIEW ALL ›</Link></div>
          <div>{homeApparelItems.map((item, index) => <Link href={item.href || "/apparel"} key={`${item.name}-${item.price}`}><img src={item.image} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getHomeApparelFallbackImage(index); }} /><span>{item.name}</span><strong>{item.price}</strong></Link>)}</div>
        </section>

        <section className="fmm-v35-affiliate" aria-label="Affiliate promoter and socials">
          <Link href="/affiliate-create-account" className="fmm-v35-aff-card"><img src={`${ASSET_BASE}/handshake-cutout-v49.png`} alt="Affiliate partnership hands" /><span>🤝 AFFILIATES & CREATORS</span><strong>YOU'RE THE PROMOTER NOW</strong><small>Promote fights. Build a league. Get players moving.</small><b>BECOME A PARTNER →</b></Link>
          <button type="button" className="fmm-v35-chest" onClick={() => setCoinModalOpen(true)} aria-label="Open coin funnel"><img src={`${ASSET_BASE}/chest-transparent.png`} alt="Treasure chest" />{Array.from({ length: 12 }).map((_, index) => <i key={index} />)}</button>
          <div className="fmm-v35-socials">{socialLinks.map(({ href, label, bg, path }) => <a href={href} target="_blank" rel="noreferrer" key={label} aria-label={label} title={label} style={{ "--social-bg": bg }}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={path} /></svg></a>)}</div>
        </section>
      </main>

      <nav className="fmm-v35-bottom-nav" aria-label="Mobile bottom navigation">
        {[
          ["/", "HOME", FaHome, "home"],
          ["/upcomingfights", "CONTESTS", FaTrophy, "contests"],
          [predictionHref, "MAKE\nPREDICTIONS", FaBullseye, "predict"],
          ["/leaderboard", "LEADERBOARD", FaCrown, "leaderboard"],
          [isLoggedIn ? "/profile" : "/login?next=/profile", "PROFILE", FaUserAlt, "profile"],
        ].map(([href, label, Icon, key]) => <Link href={href} key={key} className={`is-${key}`}><Icon /><span>{label}</span></Link>)}
      </nav>


      {aiScoutOpen && (
        <div className="fmm-v39-ai-scout-modal" role="dialog" aria-modal="true" aria-labelledby="fmm-v39-ai-title">
          <button type="button" className="fmm-v39-modal-backdrop" aria-label="Close AI scouting assistant" onClick={() => setAiScoutOpen(false)} />
          <section className="fmm-v39-ai-card">
            <button type="button" className="fmm-v39-ai-close" aria-label="Close AI scouting assistant" onClick={() => setAiScoutOpen(false)}><FaTimes /></button>
            <header>
              <span>🤖</span>
              <div>
                <h2 id="fmm-v39-ai-title">AI SCOUTING ASSISTANT</h2>
                <p>{fighterA} vs {fighterB} · {cleanText(featuredFight?.matchName || featuredFight?.eventName || featuredSport.longLabel)}</p>
              </div>
            </header>
            <blockquote>
              {scoutingReport?.summary || "Verified scouting metrics are not published for this contest yet. The assistant will show sourced matchup data here when it is available."}
            </blockquote>
            {scoutingReport?.pickSplitNote ? <p className="fmm-v39-ai-note">{scoutingReport.pickSplitNote}</p> : null}
            {scoutingReport?.underdogAngle ? <p className="fmm-v39-ai-note">{scoutingReport.underdogAngle}</p> : null}
            <div className="fmm-v39-ai-stats">
              <article><strong>{getShortDate(featuredFight)}</strong><span>FIGHT DATE</span></article>
              <article><strong>{featuredFight?.maxRounds || "TBA"}</strong><span>ROUNDS</span></article>
              <article><strong>{featuredEntries > 0 ? featuredEntries.toLocaleString() : "—"}</strong><span>ENTRIES</span></article>
            </div>
            <p className="fmm-v39-ai-note">💡 No inferred or promotional statistics are substituted for missing fight data.</p>
            <Link href={predictionHref} className="fmm-v39-ai-cta" onClick={() => setAiScoutOpen(false)}>USE THIS INSIGHT — MAKE MY PICK</Link>
          </section>
        </div>
      )}

      {coinModalOpen && (
        <div className="fmm-v35-coin-modal" role="dialog" aria-modal="true">
          <button type="button" className="fmm-v35-modal-backdrop" aria-label="Close coin modal" onClick={() => setCoinModalOpen(false)} />
          <section>
            <button type="button" className="fmm-v35-modal-close" aria-label="Close coin modal" onClick={() => setCoinModalOpen(false)}><FaTimes /></button>
            <img src={`${ASSET_BASE}/chest-transparent.png`} alt="FM coin chest" />
            <span>FM COINS</span>
            <h2>Power your next picks</h2>
            <p>Buy FM coins for scorecards, fantasy cards, streak saves, and high-intent fight entries.</p>
            <div>{[
              ["1,000 FM", "$0.99", "Starter"],
              ["5,000 FM", "$3.99", "Most Popular"],
              ["15,000 FM", "$9.99", "Power Pack"],
            ].map(([amount, price, label]) => <Link href={`${coinCheckoutHref}&amount=${encodeURIComponent(amount.replace(/[^0-9]/g, ""))}`} key={amount}><small>{label}</small><strong>{amount}</strong><b>{price}</b></Link>)}</div>
          </section>
        </div>
      )}
    </div>
  );
};

export default FinalHomeV35;
