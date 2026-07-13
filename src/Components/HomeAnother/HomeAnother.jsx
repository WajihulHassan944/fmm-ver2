import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { stopMusic, playMusic } from "../../Redux/musicSlice";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import {
  formatWrestlingDate,
  getWrestlerImage as getPWImage,
  safeWrestlingArray,
  wrestlingRequest,
} from "@/Utils/proWrestling";
import {
  buildPublicApiUrl,
  fetchPromotedHomeFights,
  fetchPublicHomeSummary,
  fetchPublicPredictionFights,
} from "@/Utils/publicApi";
import {
  diversifyFightsBySport,
  getFightSportKey,
  getFightId,
  getFightSportLabel,
  orderFightsForDisplay,
} from "@/Utils/fightOrdering";
import {
  getPublicFightDuplicateKey,
  getFighterName as getResolvedFighterName,
} from "@/Utils/fightExperience";
import {
  FaArrowRight,
  FaBolt,
  FaBullseye,
  FaCalendarAlt,
  FaClock,
  FaCoins,
  FaChevronRight,
  FaCrown,
  FaDollarSign,
  FaFire,
  FaGift,
  FaPlay,
  FaMobileAlt,
  FaShieldAlt,
  FaStar,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";

const FALLBACK_FIGHT_IMAGE = "/images/hero-fight.webp";
const HOME_HERO_IMAGE = "/images/hero-fight-original.webp";
const HOME_FIGHT_ART_IMAGE = "/images/hero-fight.webp";
const HOME_WRESTLING_IMAGE =
  "/images/pro-wrestling/wrestling-match-premium.webp";

const HOME_FIGHT_SPORT_TABS = [
  { key: "boxing", label: "Boxing" },
  { key: "mma", label: "MMA" },
  { key: "bareknuckle", label: "Bare-knuckle" },
  { key: "kickboxing", label: "Kickboxing" },
  { key: "pro-wrestling", label: "Pro Wrestling" },
];

const MOBILE_HOME_SPORT_TABS = [
  {
    key: "boxing",
    label: "Boxing",
    image: "/images/mobile-home/categories/boxing.png",
  },
  {
    key: "mma",
    label: "MMA",
    image: "/images/mobile-home/categories/mma.png",
  },
  {
    key: "bareknuckle",
    label: "Bare-knuckle",
    image: "/images/mobile-home/categories/bare-knuckle.png",
  },
  {
    key: "kickboxing",
    label: "Kickboxing",
    image: "/images/mobile-home/categories/kickboxing.png",
  },
];

const MOBILE_FALLBACK_FIGHT_IMAGES = [
  "/images/fmm-experience/fighter-chris-eubank-jr.webp",
  "/images/fmm-experience/fighter-conor-benn.webp",
  "/images/fmm-experience/fighter-anthony-yarde.webp",
  "/images/fmm-experience/fighter-david-benavidez.webp",
];

const MOBILE_FALLBACK_SPORT_LABELS = {
  boxing: "Boxing",
  mma: "MMA",
  bareknuckle: "Bare-knuckle",
  kickboxing: "Kickboxing",
  "pro-wrestling": "Pro Wrestling",
};

const HOME_FIGHT_FEED_LIMIT = 200;
const HOME_CATEGORY_PREVIEW_LIMIT = 4;
const PLAYER_SIGNUP_HREF = "/CreateAccount";

const SCORING_ROWS = [
  ["Correct Winner", "100"],
  ["Correct Method", "75"],
  ["Correct Round", "50"],
  ["Exact Score", "25"],
  ["Perfect Fight", "250"],
];

const STATIC_WINNERS = [
  {
    name: "Tasha",
    contest: "Won UFC 301 Contest",
    amount: "$2,500",
    icon: "🏆",
  },
  {
    name: "Kelly",
    contest: "Won Boxing Showdown",
    amount: "$1,000",
    icon: "🥈",
  },
  {
    name: "Wajih ul Hassan",
    contest: "Won Kickboxing Clash",
    amount: "$750",
    icon: "🥉",
  },
];

const FALLBACK_LEADERBOARD = [
  { name: "Kelly", points: 2986 },
  { name: "Tasha", points: 2261 },
  { name: "Shane O.", points: 1878 },
  { name: "Wajih ul Hassan", points: 1566 },
  { name: "TheGhost", points: 1347 },
];

const getMatchTimestamp = (match) => {
  const rawDate = match?.matchDate?.split?.("T")?.[0];
  const rawTime = String(match?.matchTime || "00:00").trim() || "00:00";
  const candidate = new Date(`${rawDate || ""}T${rawTime}:00`);
  return Number.isNaN(candidate.getTime())
    ? Number.MAX_SAFE_INTEGER
    : candidate.getTime();
};

const getMatchPriorityScore = (match, now = new Date()) => {
  const status = String(
    match?.matchStatus ||
      match?.matchShadowOpenStatus ||
      match?.matchType ||
      "",
  ).toLowerCase();
  const category = String(
    match?.matchCategoryTwo ||
      match?.effectiveCategory ||
      match?.displayCategory ||
      match?.categoryLabel ||
      match?.matchCategory ||
      "",
  ).toLowerCase();
  const matchTime = getMatchTimestamp(match);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isLive = status.includes("live") || status.includes("ongoing");
  const isClosed =
    status.includes("finished") ||
    status.includes("closed") ||
    status.includes("complete");
  const isToday =
    matchTime >= today.getTime() && matchTime < tomorrow.getTime();
  const isFuture = matchTime >= now.getTime();
  const isFeatured = Boolean(
    match?.featured ||
    match?.isFeatured ||
    match?.pinToTop ||
    match?.promoteTonight ||
    match?.isPromoted,
  );
  const sportBoost =
    category.includes("box") ||
    category.includes("mma") ||
    category.includes("kick") ||
    category.includes("bare") ||
    category.includes("bkfc")
      ? 5
      : 0;

  if (isFeatured) return 1000 + sportBoost;
  if (isLive) return 900 + sportBoost;
  if (isToday && !isClosed) return 800 + sportBoost;
  if (isFuture && !isClosed) return 700 + sportBoost;
  if (!isClosed) return 500 + sportBoost;
  return 100 + sportBoost;
};

const getOrderedMatches = (matches) => orderFightsForDisplay(matches);

const hasUsableFightImage = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return Boolean(
    text && !["null", "undefined", "none", "n/a"].includes(text.toLowerCase()),
  );
};

const pickHomeValue = (...values) => {
  for (const value of values) {
    if (hasUsableFightImage(value)) return value.trim();
  }
  return "";
};

const getNestedHomeValue = (value, fields = []) => {
  if (!value || typeof value === "string") return "";
  for (const field of fields) {
    const parts = String(field).split(".");
    let current = value;
    for (const part of parts) current = current?.[part];
    if (hasUsableFightImage(current)) return String(current).trim();
  }
  return "";
};

const getHomeFighterName = (match = {}, side = "A") => {
  const isA = String(side).toUpperCase() === "A";
  const fighter = isA ? match?.fighterA : match?.fighterB;
  const fighterRef = isA ? match?.fighterAId : match?.fighterBId;
  const fallback = getResolvedFighterName(match, side);

  return pickHomeValue(
    getNestedHomeValue(fighter, [
      "displayName",
      "name",
      "fighterName",
      "fullName",
    ]),
    getNestedHomeValue(fighterRef, [
      "displayName",
      "name",
      "fighterName",
      "fullName",
    ]),
    isA ? match?.fighterAName : match?.fighterBName,
    isA ? match?.fighterOneName : match?.fighterTwoName,
    isA ? match?.matchFighterA : match?.matchFighterB,
    fallback,
    isA ? "Fighter A" : "Fighter B",
  );
};

const getHomeFighterImage = (
  match = {},
  side = "A",
  index = 0,
  options = {},
) => {
  const isA = String(side).toUpperCase() === "A";
  const fighter = isA ? match?.fighterA : match?.fighterB;
  const fighterRef = isA ? match?.fighterAId : match?.fighterBId;
  const direct = isA
    ? pickHomeValue(
        match?.fighterAPrimaryImage,
        match?.resolvedFighterAImage,
        match?.fighterAResolvedImage,
        getNestedHomeValue(fighter, [
          "primaryImage",
          "resolvedImage",
          "imageHealth.url",
          "imageHealth.secure_url",
          "profileImage",
          "fighterImage",
          "image",
          "avatar",
        ]),
        getNestedHomeValue(fighterRef, [
          "primaryImage",
          "resolvedImage",
          "imageHealth.url",
          "imageHealth.secure_url",
          "profileImage",
          "fighterImage",
          "image",
          "avatar",
        ]),
        match?.fighterAImage,
        match?.matchFighterAImage,
        match?.fighterOneImage,
        match?.imageA,
      )
    : pickHomeValue(
        match?.fighterBPrimaryImage,
        match?.resolvedFighterBImage,
        match?.fighterBResolvedImage,
        getNestedHomeValue(fighter, [
          "primaryImage",
          "resolvedImage",
          "imageHealth.url",
          "imageHealth.secure_url",
          "profileImage",
          "fighterImage",
          "image",
          "avatar",
        ]),
        getNestedHomeValue(fighterRef, [
          "primaryImage",
          "resolvedImage",
          "imageHealth.url",
          "imageHealth.secure_url",
          "profileImage",
          "fighterImage",
          "image",
          "avatar",
        ]),
        match?.fighterBImage,
        match?.matchFighterBImage,
        match?.fighterTwoImage,
        match?.imageB,
      );

  if (direct) return direct;
  return options.allowFallback === false ? "" : getFighterImage("");
};

const hasCompleteHomeFightVisuals = (fight = {}) =>
  Boolean(
    getHomeFighterImage(fight, "A", 0, { allowFallback: false }) &&
    getHomeFighterImage(fight, "B", 1, { allowFallback: false }),
  );

const hydrateHomeFightVisuals = (fight = {}) => ({
  ...fight,
  matchFighterA: getHomeFighterName(fight, "A"),
  matchFighterB: getHomeFighterName(fight, "B"),
  fighterAImage:
    getHomeFighterImage(fight, "A", 0, { allowFallback: false }) ||
    fight?.fighterAImage,
  fighterBImage:
    getHomeFighterImage(fight, "B", 1, { allowFallback: false }) ||
    fight?.fighterBImage,
});

const getHomepageFightQualityScore = (fight = {}) => {
  const sourceScore =
    String(fight?.matchType || "").toUpperCase() === "LIVE" ? 600 : 0;
  const imageScore =
    [
      getHomeFighterImage(fight, "A", 0, { allowFallback: false }),
      getHomeFighterImage(fight, "B", 1, { allowFallback: false }),
      fight?.promotionBackground,
    ].filter(hasUsableFightImage).length * 80;
  const playerScore = getPlayerCount(fight) * 2;
  return getMatchPriorityScore(fight) + sourceScore + imageScore + playerScore;
};

const dedupeHomepageFights = (matches = []) => {
  const selected = new Map();

  (Array.isArray(matches) ? matches : []).forEach((fight) => {
    if (!fight) return;
    const key =
      getPublicFightDuplicateKey(fight) ||
      getFightId(fight) ||
      getFightTitle(fight);
    const current = selected.get(key);
    if (
      !current ||
      getHomepageFightQualityScore(fight) >
        getHomepageFightQualityScore(current)
    ) {
      selected.set(key, fight);
    }
  });

  return orderFightsForDisplay(Array.from(selected.values()));
};

const getFightDetailHref = (match = {}) => {
  const id = getFightId(match);
  if (!id) return "/upcomingfights";
  if (match.__source === "pro-wrestling") return `/pro-wrestling/matches/${id}`;
  return `/fight/${id}`;
};

const pad = (value) => String(value).padStart(2, "0");

const parseMatchDate = (match) => {
  const rawDate = match?.matchDate?.split?.("T")?.[0];
  const rawTime = String(match?.matchTime || "00:00").trim() || "00:00";
  const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})/);

  if (!rawDate) return null;

  const hour = timeMatch?.[1] || "00";
  const minute = timeMatch?.[2] || "00";
  const date = new Date(`${rawDate}T${pad(hour)}:${minute}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (match) => {
  const date = parseMatchDate(match);
  if (!date) return "Schedule pending";

  const datePart = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart} • ${timePart} EST`;
};

const getFeaturedDateLabel = (match) => {
  const date = parseMatchDate(match);
  if (!date) return "Schedule pending";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
};

const getFeaturedTimeLabel = (match) => {
  const date = parseMatchDate(match);
  if (!date) return "Time TBA";

  return `${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} EST`;
};

const getCountdownParts = (match, now) => {
  const date = parseMatchDate(match);
  if (!date || !now) return null;

  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: "Days", value: pad(days) },
    { label: "Hrs", value: pad(hours) },
    { label: "Min", value: pad(minutes) },
    { label: "Sec", value: pad(seconds) },
  ];
};

const getMiniCalendarDays = (match) => {
  const date = parseMatchDate(match);
  if (!date) return { date: null, days: [] };
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  const offset = first.getDay();
  const days = [];
  for (let i = 0; i < offset; i += 1)
    days.push({ key: `blank-${i}`, label: "", blank: true });
  for (let day = 1; day <= lastDay; day += 1) {
    days.push({ key: String(day), label: day, active: day === date.getDate() });
  }
  return { date, days };
};

const MiniFightCalendar = ({ match }) => {
  const { date, days } = getMiniCalendarDays(match);
  if (!date) return null;
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const monthLong = date.toLocaleDateString("en-US", { month: "long" });
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });

  return (
    <div
      className="fmm-promoted-calendar"
      aria-label="Featured fight calendar date"
    >
      <div className="fmm-promoted-calendar-head">
        <span>{month}</span>
        <strong>{date.getDate()}</strong>
        <small>{weekday}</small>
      </div>
      <div className="fmm-mini-calendar-body">
        <div className="fmm-mini-calendar-title" aria-hidden="true">
          <span>‹</span>
          <i>✦</i>
          <strong>{monthLong} {date.getFullYear()}</strong>
          <i>↯</i>
          <span>›</span>
        </div>
        <div className="fmm-mini-calendar-grid" aria-hidden="true">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <b key={`${day}-${index}`}>{day}</b>
          ))}
          {days.slice(0, 42).map((day) => (
            <i
              key={day.key}
              className={
                day.active ? "is-fight-day" : day.blank ? "is-blank" : ""
              }
            >
              {day.label}
            </i>
          ))}
        </div>
      </div>
    </div>
  );
};

const getLockLabel = (match, now) => {
  const parts = getCountdownParts(match, now);
  if (parts) {
    const [days, hours, minutes, seconds] = parts;
    return Number(days.value) > 0
      ? `${Number(days.value)}D ${hours.value}:${minutes.value}:${seconds.value}`
      : `${hours.value}:${minutes.value}:${seconds.value}`;
  }

  const status = String(
    match?.matchStatus || match?.matchShadowOpenStatus || "",
  ).toLowerCase();
  if (status.includes("ongoing") || status.includes("live")) return "LIVE NOW";
  if (status.includes("finished") || status.includes("closed"))
    return "FINISHED";
  return "OPEN";
};

const getCategory = (match) => getFightSportLabel(match);

const getCategoryClass = (matchOrCategory) => {
  const key =
    typeof matchOrCategory === "object"
      ? getFightSportKey(matchOrCategory)
      : getFightSportKey({ matchCategory: matchOrCategory });
  if (key === "boxing") return "is-boxing";
  if (key === "kickboxing") return "is-kickboxing";
  if (key === "bareknuckle") return "is-bare-knuckle";
  if (key === "pro-wrestling") return "is-pro-wrestling";
  return "is-mma";
};

const getFightTitle = (match) => {
  if (!match) return "Next Fight Loading";
  const fighterA = getHomeFighterName(match, "A");
  const fighterB = getHomeFighterName(match, "B");
  return `${fighterA} vs ${fighterB}`;
};

const getPrizePool = (match) => {
  const amount = Number(match?.pot || match?.currentPot || match?.prizePool || 0);
  if (!amount) return "Prize TBA";
  return `$${amount.toLocaleString()}`;
};

const getPotTokenLabel = (match) => {
  const amount = Number(
    match?.potTokens ||
      match?.tokenPot ||
      match?.currentPot ||
      match?.pot ||
      match?.prizePool ||
      0,
  );
  return amount > 0 ? `${amount.toLocaleString()} POT` : "POT TBA";
};

const getRoundLabel = (match) => {
  const rounds = Number(match?.maxRounds || match?.rounds || match?.scheduledRounds || 0);
  return rounds > 0 ? `${rounds} rounds` : "Rounds TBA";
};

const getFighterImage = (imageUrl) => imageUrl || FALLBACK_FIGHT_IMAGE;

const canUseNextImage = (src = "") => {
  if (!src || typeof src !== "string") return false;
  return (
    src.startsWith("/") ||
    src.startsWith("https://res.cloudinary.com/") ||
    src.startsWith("https://cdn-icons-png.flaticon.com/") ||
    src.startsWith("https://fantasymmadness-game-server-three.vercel.app/")
  );
};

const FightImage = ({
  src,
  alt,
  width = 120,
  height = 120,
  priority = false,
  sizes = "120px",
}) => {
  const imageSrc = getFighterImage(src);

  if (!canUseNextImage(imageSrc)) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  const loadingProps = priority
    ? { priority: true, fetchPriority: "high" }
    : { loading: "lazy" };

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      {...loadingProps}
    />
  );
};

const getPlayerCount = (match) => {
  if (Array.isArray(match?.userPredictions))
    return match.userPredictions.length;
  return 0;
};

const normalizeWrestlingFightForHome = (match = {}) => ({
  ...match,
  __source: "pro-wrestling",
  matchName: match.eventName || match.matchName || "Pro Wrestling Match",
  matchFighterA:
    match.competitorA?.displayName ||
    match.wrestlerA?.displayName ||
    match.wrestlerAName ||
    "Wrestler A",
  matchFighterB:
    match.competitorB?.displayName ||
    match.wrestlerB?.displayName ||
    match.wrestlerBName ||
    "Wrestler B",
  fighterAImage: getPWImage(match.competitorA || match.wrestlerA, "A"),
  fighterBImage: getPWImage(match.competitorB || match.wrestlerB, "B"),
  matchCategory: "Pro Wrestling",
  matchCategoryTwo: "Pro Wrestling",
  matchStatus: match.status || match.matchStatus || "Open",
  matchDate: match.matchDate || match.date,
  matchTime: match.matchTime || match.time,
  pot: match.currentPot || match.pot || 0,
});

const getLeaderboardName = (player) =>
  player?.firstName ||
  player?.username ||
  player?.name ||
  player?.email?.split?.("@")?.[0] ||
  "Player";

const getMobileFallbackFight = (sportKey = "mma", index = 0) => {
  const label = MOBILE_FALLBACK_SPORT_LABELS[sportKey] || "Combat";
  const times = ["20:00", "21:30", "22:00"];
  const dates = ["2099-07-14", "2099-07-15", "2099-07-16"];
  return {
    _id: `mobile-${sportKey}-preview-${index}`,
    matchName: `${label} Fight Card`,
    matchFighterA: `${label} Red`,
    matchFighterB: `${label} Blue`,
    fighterAImage: MOBILE_FALLBACK_FIGHT_IMAGES[index % MOBILE_FALLBACK_FIGHT_IMAGES.length],
    fighterBImage: MOBILE_FALLBACK_FIGHT_IMAGES[(index + 1) % MOBILE_FALLBACK_FIGHT_IMAGES.length],
    matchCategory: label,
    matchCategoryTwo: label,
    matchStatus: "Open",
    matchDate: dates[index % dates.length],
    matchTime: times[index % times.length],
    pot: [25000, 10000, 5000][index % 3],
    currentPot: [25000, 10000, 5000][index % 3],
    entryFee: [10, 5, 5][index % 3],
    userPredictions: Array.from({ length: [1245, 598, 321][index % 3] }),
  };
};

const getMobileFallbackWrestlingFight = (index = 0) => ({
  ...getMobileFallbackFight("pro-wrestling", index),
  __source: "pro-wrestling",
  _id: `mobile-pro-wrestling-preview-${index}`,
  matchName: [
    "Pro Wrestling Main Event",
    "Wrestling Featured Card",
    "Top Prize Wrestling Card",
  ][index % 3],
  matchFighterA: ["Red Corner", "Powerhouse", "Iron Champion"][index % 3],
  matchFighterB: ["Blue Corner", "High Flyer", "Mat Specialist"][index % 3],
  fighterAImage: "/images/pro-wrestling/wrestler-a.webp",
  fighterBImage: "/images/pro-wrestling/wrestler-b.webp",
  matchCategory: "Pro Wrestling",
  matchCategoryTwo: "Pro Wrestling",
});

const getMobileShortDate = (match) => {
  const date = parseMatchDate(match);
  if (!date) return "TBA";
  const datePart = date
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .replace(",", "");
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart} EST`.toUpperCase();
};

const getMobileDateChip = (match) => {
  const date = parseMatchDate(match);
  if (!date) return { month: "TBA", day: "--", weekday: "" };
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(date.getDate()).padStart(2, "0"),
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
  };
};

const getMobileDisplayFights = (fights = [], sportKey = "mma", limit = 3) => {
  const visible = Array.isArray(fights) ? fights.filter(Boolean).slice(0, limit) : [];
  if (visible.length) return visible;
  return Array.from({ length: limit }, (_, index) =>
    getMobileFallbackFight(sportKey, index),
  );
};

const getMobileWrestlingContests = (fights = [], limit = 3) => {
  const visible = Array.isArray(fights) ? fights.filter(Boolean).slice(0, limit) : [];
  if (visible.length) return visible;
  return Array.from({ length: limit }, (_, index) =>
    getMobileFallbackWrestlingFight(index),
  );
};

const getMobileEntryFee = (match = {}) => {
  const amount = Number(match?.entryFee || match?.fee || match?.cost || 0);
  return amount > 0 ? `$${amount.toLocaleString()}` : "$5";
};

const getMobileSpotsLeft = (index = 0, match = {}) => {
  const raw = Number(match?.spotsLeft || match?.remainingSpots || match?.availableSpots || 0);
  const fallback = [3, 6, 4][index % 3];
  return raw > 0 ? raw : fallback;
};

const getHomeSportViewAllHref = (sportKey) =>
  sportKey === "pro-wrestling"
    ? "/pro-wrestling"
    : `/upcomingfights?status=all&category=${encodeURIComponent(sportKey || "all")}`;

const MobilePhoneHome = ({
  activeFightSport,
  setActiveFightSport,
  activeHeroFight,
  activeHeroIndex,
  setActiveHeroIndex,
  heroSlides,
  homeFightSections,
  liveLeaderboardRows,
  matchError,
  matchStatus,
  now,
}) => {
  const mobileSections = useMemo(
    () =>
      MOBILE_HOME_SPORT_TABS.map((tab) => {
        const existing = homeFightSections.find((section) => section.key === tab.key);
        return {
          ...tab,
          count: existing?.count || 3,
          fights: existing?.fights || [],
        };
      }),
    [homeFightSections],
  );

  const activeSection =
    mobileSections.find((section) => section.key === activeFightSport) ||
    mobileSections[0];
  const selectedUpcomingFights = getMobileDisplayFights(
    activeSection?.fights,
    activeSection?.key,
    5,
  );
  const mobileHeroSlides =
    Array.isArray(heroSlides) && heroSlides.length
      ? heroSlides
      : selectedUpcomingFights;
  const mobileHeroFight =
    activeHeroFight || mobileHeroSlides[activeHeroIndex % mobileHeroSlides.length];
  const heroCountdown = getCountdownParts(mobileHeroFight, now);
  const dateChip = getMobileDateChip(mobileHeroFight);
  const wrestlingSection = homeFightSections.find(
    (section) => section.key === "pro-wrestling",
  );
  const mobileOpenContests = getMobileWrestlingContests(
    wrestlingSection?.fights,
    3,
  );
  const topLeaderboard = (liveLeaderboardRows || FALLBACK_LEADERBOARD).slice(0, 3);
  const visibleHeroDots = mobileHeroSlides.slice(0, 4);

  return (
    <div className="fmm-mobile-home" aria-label="Fantasy MMAdness mobile homepage">
      <section className="fmm-mobile-featured-card" aria-label="Featured fight">
        <div className="fmm-mobile-featured-bg" aria-hidden="true" />
        <span className="fmm-mobile-featured-label">Featured Fight</span>
        <div className="fmm-mobile-date-chip" aria-label="Featured fight date">
          <span>{dateChip.month}</span>
          <strong>{dateChip.day}</strong>
          <small>{dateChip.weekday}</small>
        </div>

        <div className="fmm-mobile-hero-fighters">
          <figure className="mobile-fighter-avatar is-left">
            <FightImage
              src={getHomeFighterImage(mobileHeroFight, "A", 0)}
              alt={getHomeFighterName(mobileHeroFight, "A")}
              width={176}
              height={176}
              priority
              sizes="42vw"
            />
          </figure>
          <figure className="mobile-fighter-avatar is-right">
            <FightImage
              src={getHomeFighterImage(mobileHeroFight, "B", 1)}
              alt={getHomeFighterName(mobileHeroFight, "B")}
              width={176}
              height={176}
              priority
              sizes="42vw"
            />
          </figure>
        </div>

        <div className="fmm-mobile-hero-copy">
          <h1>
            <span>{getHomeFighterName(mobileHeroFight, "A")}</span>
            <em>VS</em>
            <span>{getHomeFighterName(mobileHeroFight, "B")}</span>
          </h1>
          <p>
            <FaCalendarAlt aria-hidden="true" />
            {formatDateTime(mobileHeroFight)}
          </p>
          <div className="fmm-mobile-countdown" aria-label="Featured fight countdown">
            {heroCountdown ? (
              heroCountdown.slice(-3).map(({ label, value }) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))
            ) : (
              <div className="is-wide">
                <strong>{mobileHeroFight?.matchStatus || "Open"}</strong>
                <span>Contest</span>
              </div>
            )}
          </div>
          <Link href={getFightDetailHref(mobileHeroFight)} className="fmm-mobile-primary-btn">
            Pick Fights <FaArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div className="fmm-mobile-dots" aria-label="Featured fight slides">
          {visibleHeroDots.map((fight, index) => (
            <button
              key={getFightId(fight) || `mobile-dot-${index}`}
              type="button"
              aria-label={`Show fight ${index + 1}`}
              className={index === activeHeroIndex % mobileHeroSlides.length ? "is-active" : ""}
              onClick={() => setActiveHeroIndex(index)}
            />
          ))}
        </div>
      </section>

      <section className="fmm-mobile-category-row" aria-label="Fight categories">
        {mobileSections.map((section) => (
          <button
            type="button"
            key={section.key}
            className={activeSection?.key === section.key ? "is-active" : ""}
            onClick={() => setActiveFightSport(section.key)}
          >
            <img src={section.image} alt="" loading="lazy" />
            <strong>{section.label}</strong>
            <span>{section.count.toLocaleString()} fights</span>
          </button>
        ))}
      </section>

      <section className="fmm-mobile-section fmm-mobile-upcoming" aria-labelledby="mobile-upcoming-title">
        <div className="fmm-mobile-section-heading">
          <h2 id="mobile-upcoming-title">Top Upcoming Fights</h2>
          <Link href={getHomeSportViewAllHref(activeSection?.key)}>
            View All <FaArrowRight aria-hidden="true" />
          </Link>
        </div>

        {matchStatus === "failed" && (
          <div className="fmm-mobile-inline-alert">{matchError}</div>
        )}

        <div className="fmm-mobile-fight-rail">
          {selectedUpcomingFights.map((match, index) => (
            <Link
              href={getFightDetailHref(match)}
              className="fmm-mobile-upcoming-card"
              key={getFightId(match) || `${activeSection?.key}-${index}`}
            >
              <div className="fmm-mobile-upcoming-top">
                <span>{getFightSportLabel(match)}</span>
                <small>{getMobileShortDate(match)}</small>
              </div>
              <div className="fmm-mobile-card-fighters">
                <figure className="mobile-fighter-avatar">
                  <FightImage
                    src={getHomeFighterImage(match, "A", index)}
                    alt={getHomeFighterName(match, "A")}
                    width={96}
                    height={96}
                    sizes="72px"
                  />
                </figure>
                <b>VS</b>
                <figure className="mobile-fighter-avatar">
                  <FightImage
                    src={getHomeFighterImage(match, "B", index)}
                    alt={getHomeFighterName(match, "B")}
                    width={96}
                    height={96}
                    sizes="72px"
                  />
                </figure>
              </div>
              <div className="fmm-mobile-card-names">
                <strong>{getHomeFighterName(match, "A")}</strong>
                <strong>{getHomeFighterName(match, "B")}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="fmm-mobile-section fmm-mobile-open-contests" aria-labelledby="mobile-open-contests-title">
        <div className="fmm-mobile-section-heading">
          <h2 id="mobile-open-contests-title">Open Contests</h2>
          <Link href="/pro-wrestling">
            View All <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="fmm-mobile-contest-list">
          {mobileOpenContests.map((match, index) => (
            <article className="fmm-mobile-contest-row" key={getFightId(match) || `mobile-contest-${index}`}>
              <Link href={getFightDetailHref(match)} className="fmm-mobile-contest-visual">
                <span>{["Live", "Featured", "Top Prize"][index % 3]}</span>
                <div>
                  <figure className="mobile-fighter-avatar">
                    <FightImage
                      src={getHomeFighterImage(match, "A", index)}
                      alt={getHomeFighterName(match, "A")}
                      width={70}
                      height={70}
                      sizes="48px"
                    />
                  </figure>
                  <figure className="mobile-fighter-avatar">
                    <FightImage
                      src={getHomeFighterImage(match, "B", index)}
                      alt={getHomeFighterName(match, "B")}
                      width={70}
                      height={70}
                      sizes="48px"
                    />
                  </figure>
                </div>
              </Link>
              <div className="fmm-mobile-contest-info">
                <h3>{match.matchName || getFightTitle(match)}</h3>
                <div className="fmm-mobile-contest-meta">
                  <span>
                    <small>Prize Pool</small>
                    <strong>{getPrizePool(match)}</strong>
                  </span>
                  <span>
                    <small>Entry Fee</small>
                    <strong>{getMobileEntryFee(match)}</strong>
                  </span>
                  <span>
                    <small>Players</small>
                    <strong>{getPlayerCount(match).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
              <Link href={getFightDetailHref(match)} className="fmm-mobile-join">
                Join
                <small>{getMobileSpotsLeft(index, match)} spots left</small>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="fmm-mobile-section fmm-mobile-leaderboard" aria-labelledby="mobile-leaderboard-title">
        <div className="fmm-mobile-section-heading">
          <h2 id="mobile-leaderboard-title">Leaderboard</h2>
          <Link href="/leaderboard">
            View Full <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="fmm-mobile-leaderboard-podium">
          {topLeaderboard.map((player, index) => (
            <Link href="/leaderboard" className="fmm-mobile-rank-card" key={`${player.name}-${index}`}>
              <span>{index + 1}</span>
              {player.avatar ? (
                <FightImage
                  src={player.avatar}
                  alt={player.name}
                  width={58}
                  height={58}
                  sizes="42px"
                />
              ) : (
                <b>{player.name.charAt(0).toUpperCase()}</b>
              )}
              <strong>{player.name}</strong>
              <small>{Number(player.points || 0).toLocaleString()} PTS</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="fmm-mobile-metrics" aria-label="Platform stats">
        <div>
          <FaUsers aria-hidden="true" />
          <strong>128,547+</strong>
          <span>Players competing worldwide</span>
        </div>
        <div>
          <FaCoins aria-hidden="true" />
          <strong>4.2M+</strong>
          <span>Predictions made in the last 30 days</span>
        </div>
        <div>
          <FaTrophy aria-hidden="true" />
          <strong>$1.7M+</strong>
          <span>Total prizes won by champions</span>
        </div>
        <div>
          <FaShieldAlt aria-hidden="true" />
          <strong>100%</strong>
          <span>Fair play and secure gaming</span>
        </div>
      </section>

      <section className="fmm-mobile-bottom-cta">
        <div className="fmm-mobile-cta-cards" aria-hidden="true">
          <span />
          <span />
        </div>
        <div>
          <h2>Find Open Fight Cards</h2>
          <p>Make your predictions and compete to win big prizes.</p>
        </div>
        <Link href="/upcomingfights">
          Browse Events <FaArrowRight aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
};

const HomeAnother = () => {
  const dispatch = useDispatch();
  const howlerRef = useRef(null);
  const homeSportSectionRefs = useRef({});
  const homeFightRailDragRef = useRef({
    activeRail: null,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    moved: false,
    pointerId: null,
  });
  const [homepageMatches, setHomepageMatches] = useState([]);
  const [promotedHeroFights, setPromotedHeroFights] = useState([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [homepageLeaderboard, setHomepageLeaderboard] = useState([]);
  const [matchStatus, setMatchStatus] = useState("loading");
  const [matchError, setMatchError] = useState(null);
  const [buttonText, setButtonText] = useState("Send Message");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(null);
  const [activeFightSport, setActiveFightSport] = useState("boxing");
  const [expandedHomeSports, setExpandedHomeSports] = useState({});
  const [wrestlingMatches, setWrestlingMatches] = useState([]);

  useEffect(() => {
    const currentSeek = howlerRef.current?.seek?.() || 0;
    dispatch(stopMusic(currentSeek));
    return () => dispatch(playMusic());
  }, [dispatch]);

  useEffect(() => {
    let active = true;

    const loadHomepageFights = async () => {
      setMatchStatus("loading");
      setMatchError(null);

      try {
        const [summaryResult, predictionResult, promotedResult] =
          await Promise.allSettled([
            fetchPublicHomeSummary({
              fightLimit: HOME_FIGHT_FEED_LIMIT,
              leaderboardLimit: 5,
            }),
            fetchPublicPredictionFights({ limit: HOME_FIGHT_FEED_LIMIT }),
            fetchPromotedHomeFights({ limit: 10 }),
          ]);
        const summary =
          summaryResult.status === "fulfilled" ? summaryResult.value || {} : {};
        const summaryFights = Array.isArray(summary.featuredFights)
          ? summary.featuredFights
          : [];
        const predictionFights =
          predictionResult.status === "fulfilled" &&
          Array.isArray(predictionResult.value)
            ? predictionResult.value
            : [];
        const promotedFights =
          promotedResult.status === "fulfilled" &&
          Array.isArray(promotedResult.value)
            ? promotedResult.value
            : [];
        const fights =
          predictionFights.length >= summaryFights.length
            ? predictionFights
            : summaryFights;

        if (!active) return;

        setHomepageMatches(orderFightsForDisplay(fights || []));
        setPromotedHeroFights(
          orderFightsForDisplay(promotedFights.map(hydrateHomeFightVisuals)),
        );
        setHomepageLeaderboard(
          Array.isArray(summary.leaderboard) ? summary.leaderboard : [],
        );
        setMatchStatus("succeeded");
      } catch (error) {
        if (!active) return;
        setHomepageMatches([]);
        setPromotedHeroFights([]);
        setMatchStatus("failed");
        setMatchError(error.message || "Unable to load fights");
      }
    };

    loadHomepageFights();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      wrestlingRequest(
        "/api/wrestling/matches?limit=3&status=OPEN,LIVE,SCORING",
      )
        .then((payload) => {
          if (active) setWrestlingMatches(safeWrestlingArray(payload?.data));
        })
        .catch((requestError) =>
          console.info(
            "Pro Wrestling homepage module unavailable:",
            requestError.message,
          ),
        );
    }, 1800);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const orderedMatches = useMemo(
    () => getOrderedMatches(homepageMatches),
    [homepageMatches],
  );
  const homepageFightPool = useMemo(() => {
    const hydrated = dedupeHomepageFights(orderedMatches).map(
      hydrateHomeFightVisuals,
    );
    const completeVisuals = hydrated.filter(hasCompleteHomeFightVisuals);
    return diversifyFightsBySport(completeVisuals);
  }, [orderedMatches]);
  const normalizedWrestlingFights = useMemo(
    () => wrestlingMatches.map(normalizeWrestlingFightForHome),
    [wrestlingMatches],
  );
  const homeFightSections = useMemo(
    () =>
      HOME_FIGHT_SPORT_TABS.map((tab) => {
        const fights =
          tab.key === "pro-wrestling"
            ? normalizedWrestlingFights
            : homepageFightPool.filter(
                (fight) => getFightSportKey(fight) === tab.key,
              );

        return {
          ...tab,
          count: fights.length,
          fights,
        };
      }),
    [homepageFightPool, normalizedWrestlingFights],
  );

  const sportCounts = useMemo(
    () =>
      homeFightSections.reduce((acc, section) => {
        acc[section.key] = section.count;
        return acc;
      }, {}),
    [homeFightSections],
  );

  const totalHomeFightCount = useMemo(
    () =>
      homeFightSections.reduce((total, section) => total + section.count, 0),
    [homeFightSections],
  );

  const contestMatches = useMemo(() => {
    const activeSection = homeFightSections.find(
      (section) => section.key === activeFightSport,
    );
    return activeSection?.fights?.slice(0, HOME_CATEGORY_PREVIEW_LIMIT) || [];
  }, [activeFightSport, homeFightSections]);

  const primaryFight = homepageFightPool[0] || null;
  const heroSlides = promotedHeroFights.length
    ? promotedHeroFights
    : primaryFight
      ? [primaryFight]
      : [];
  const activeHeroFight = heroSlides.length
    ? heroSlides[activeHeroIndex % heroSlides.length]
    : primaryFight;
  const primaryCountdown = getCountdownParts(activeHeroFight, now);

  useEffect(() => {
    setActiveHeroIndex(0);
  }, [promotedHeroFights.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const liveLeaderboardRows = useMemo(() => {
    if (!Array.isArray(homepageLeaderboard) || homepageLeaderboard.length === 0)
      return FALLBACK_LEADERBOARD;

    return homepageLeaderboard.slice(0, 5).map((player) => ({
      name: getLeaderboardName(player),
      points: Number(player?.totalPoints || 0),
      avatar: player?.profileUrl,
    }));
  }, [homepageLeaderboard]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setButtonText("Sending");
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const data = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch(
        buildPublicApiUrl("/contact-us-fantasymmadness"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (response.ok) {
        setButtonText("Message Sent");
        e.target.reset();
      } else {
        setButtonText("Try Again");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setButtonText("Try Again");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setButtonText("Send Message"), 2500);
    }
  };

  const handleHomeSportJump = (sportKey, event) => {
    setActiveFightSport(sportKey);

    if (typeof window === "undefined") return;
    event?.currentTarget?.scrollIntoView?.({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    window.requestAnimationFrame(() => {
      const section = homeSportSectionRefs.current?.[sportKey];
      if (!section) return;

      const scrollOffset = window.innerWidth > 760 ? 104 : 86;
      const targetTop =
        section.getBoundingClientRect().top + window.pageYOffset - scrollOffset;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    });
  };

  const stopHomeFightRailDrag = (rail, pointerId) => {
    const dragState = homeFightRailDragRef.current;
    const activeRail = rail || dragState.activeRail;

    if (activeRail) {
      activeRail.classList.remove("is-dragging");
      if (dragState.pointerId !== null) {
        try {
          activeRail.releasePointerCapture?.(pointerId || dragState.pointerId);
        } catch (_) {
          // Pointer capture can already be released by the browser.
        }
      }
      window.setTimeout(() => {
        if (activeRail?.dataset?.dragMoved === "true") {
          activeRail.dataset.dragMoved = "false";
        }
      }, 80);
    }

    homeFightRailDragRef.current = {
      activeRail: null,
      startX: 0,
      startY: 0,
      scrollLeft: 0,
      moved: false,
      pointerId: null,
    };
  };

  const handleFightRailPointerDown = (event) => {
    const rail = event.currentTarget;
    if (!rail || rail.scrollWidth <= rail.clientWidth) return;

    homeFightRailDragRef.current = {
      activeRail: rail,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: rail.scrollLeft,
      moved: false,
      pointerId: event.pointerId,
    };

    rail.dataset.dragMoved = "false";
    rail.classList.add("is-dragging");
    try {
      rail.setPointerCapture?.(event.pointerId);
    } catch (_) {
      // Some mobile browsers do not allow capture for every pointer type.
    }
  };

  const handleFightRailPointerMove = (event) => {
    const dragState = homeFightRailDragRef.current;
    const rail = event.currentTarget;

    if (dragState.activeRail !== rail) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const isHorizontalDrag =
      Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 4;

    if (!isHorizontalDrag && !dragState.moved) return;

    event.preventDefault();
    dragState.moved = true;
    rail.dataset.dragMoved = "true";
    rail.scrollLeft = dragState.scrollLeft - deltaX;
  };

  const handleFightRailPointerUp = (event) => {
    stopHomeFightRailDrag(event.currentTarget, event.pointerId);
  };

  const handleFightRailClickCapture = (event) => {
    if (event.currentTarget?.dataset?.dragMoved === "true") {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.dataset.dragMoved = "false";
    }
  };

  const toggleHomeSportSection = (sportKey) => {
    setActiveFightSport(sportKey);
    setExpandedHomeSports((current) => ({
      ...current,
      [sportKey]: !current?.[sportKey],
    }));
  };

  const getHomeSportViewAllHref = (sportKey) =>
    sportKey === "pro-wrestling"
      ? "/pro-wrestling"
      : `/upcomingfights?status=all&category=${encodeURIComponent(sportKey)}`;

  const renderHomeFightCard = (match, index, sectionKey) => {
    const category = getCategory(match);
    const categoryClass = getCategoryClass(match);
    const isFinished = String(match?.matchStatus || "")
      .toLowerCase()
      .includes("finished");

    return (
      <article
        className={`fmm-contest-card ${categoryClass}`}
        key={`${sectionKey}-${match._id || getFightTitle(match)}`}
      >
        <div className="fmm-contest-card-top">
          <span className="fmm-category-pill">{category}</span>
          <span className="fmm-fresh-pill">
            {index === 0 ? "Newest" : getLockLabel(match, now)}
          </span>
          {index === 0 && (
            <span className="fmm-featured-pill">
              <FaStar aria-hidden="true" /> First in section
            </span>
          )}
        </div>

        <div className="fmm-contest-fighters">
          <figure>
            <FightImage
              src={getHomeFighterImage(match, "A", index)}
              alt={getHomeFighterName(match, "A")}
              width={184}
              height={184}
              sizes="(max-width: 760px) 42vw, 92px"
            />
            <figcaption>{getHomeFighterName(match, "A")}</figcaption>
          </figure>
          <span>VS</span>
          <figure>
            <FightImage
              src={getHomeFighterImage(match, "B", index)}
              alt={getHomeFighterName(match, "B")}
              width={184}
              height={184}
              sizes="(max-width: 760px) 42vw, 92px"
            />
            <figcaption>{getHomeFighterName(match, "B")}</figcaption>
          </figure>
        </div>

        <h3>{match.matchName || getFightTitle(match)}</h3>
        <p className="fmm-contest-matchup">
          {getHomeFighterName(match, "A")} vs {getHomeFighterName(match, "B")}
        </p>

        <div className="fmm-contest-card-meta">
          <span>
            <FaCalendarAlt aria-hidden="true" /> {formatDateTime(match)}
          </span>
          <span>
            <FaUsers aria-hidden="true" />{" "}
            {getPlayerCount(match).toLocaleString()} Players
          </span>
          <span>
            <FaDollarSign aria-hidden="true" /> {getPrizePool(match)}{" "}
            <small>Prize Pool</small>
          </span>
        </div>

        <div className="fmm-contest-lock">
          <span>Locks In</span>
          <strong>{getLockLabel(match, now)}</strong>
        </div>

        <Link href={getFightDetailHref(match)} className="fmm-card-action">
          {match.__source === "pro-wrestling"
            ? "Open Wrestling"
            : isFinished
              ? "View Contest"
              : "Enter Card"}{" "}
          <FaChevronRight aria-hidden="true" />
        </Link>
      </article>
    );
  };

  return (
    <>
      <Head>
        <title>Fantasy MMAdness | Fantasy Combat Sports, MMA, Boxing</title>
        <meta
          name="description"
          content="Predict MMA, Boxing, Kickboxing, Bare Knuckle, Pro Wrestling, and combat sports contests. Pick winners, score every round, climb leaderboards, and win real fantasy rewards."
        />
        <meta
          property="og:title"
          content="Fantasy MMAdness - Predict Combat Sports"
        />
        <meta
          property="og:description"
          content="Join Fantasy MMAdness and compete in premium MMA, Boxing, Kickboxing, Bare-Knuckle, and Pro Wrestling prediction contests."
        />
        <meta property="og:url" content="https://www.fantasymmadness.com/" />
        <meta
          name="keywords"
          content="Fantasy MMA, Fantasy UFC, Fantasy BKFC, Fantasy Boxing, Fantasy Kickboxing, Fantasy Bare Knuckle, Fantasy Combat, Fantasy Fighting, Fantasy Fighter Rankings"
        />
        <link
          rel="preload"
          as="image"
          href={HOME_HERO_IMAGE}
          fetchPriority="high"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Fantasy MMAdness",
              url: "https://www.fantasymmadness.com",
              description:
                "Play fantasy MMA, boxing, kickboxing, and combat sports prediction contests.",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://www.fantasymmadness.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </Head>

      <div className="theme-home fmm-home page-shell">
        <MobilePhoneHome
          activeFightSport={activeFightSport}
          setActiveFightSport={setActiveFightSport}
          activeHeroFight={activeHeroFight}
          activeHeroIndex={activeHeroIndex}
          setActiveHeroIndex={setActiveHeroIndex}
          heroSlides={heroSlides}
          homeFightSections={homeFightSections}
          liveLeaderboardRows={liveLeaderboardRows}
          matchError={matchError}
          matchStatus={matchStatus}
          now={now}
        />
        <div className="fmm-desktop-home-shell">
          <section
            className="fmm-home-hero"
            aria-label="Fantasy combat sports hero"
          >
          <div className="theme-container fmm-hero-grid">
            <div className="fmm-hero-copy">
              <div className="fmm-premium-eyebrow">
                <FaBolt aria-hidden="true" /> Fight card command center
              </div>
              <h1>
                Pick The Card.
                <span>
                  Beat The <em>Crowd.</em>
                </span>
              </h1>
              <p className="fmm-hero-subtitle">
                Browse promoted combat cards, inspect the matchup, and lock your prediction before the bell.
              </p>

              <div className="fmm-hero-actions">
                <Link
                  href={PLAYER_SIGNUP_HREF}
                  className="theme-btn theme-btn-primary"
                >
                  Create Account <FaArrowRight aria-hidden="true" />
                </Link>
                <Link
                  href={
                    activeHeroFight
                      ? getFightDetailHref(activeHeroFight)
                      : "/upcomingfights"
                  }
                  className="theme-btn theme-btn-secondary"
                >
                  Open Featured Fight <FaPlay aria-hidden="true" />
                </Link>
                <Link href="/mock-game" className="theme-btn theme-btn-secondary fmm-mock-game-link">
                  Mock Game <FaBolt aria-hidden="true" />
                </Link>
              </div>

              <div
                className="fmm-premium-hero-stats"
                aria-label="Fantasy MMAdness live experience stats"
              >
                <div>
                  <strong>
                    {totalHomeFightCount || contestMatches.length || 0}
                  </strong>
                  <span>Ready fights</span>
                </div>
                <div>
                  <strong>
                    {activeHeroFight
                      ? getLockLabel(activeHeroFight, now)
                      : "OPEN"}
                  </strong>
                  <span>Next lock</span>
                </div>
                <div>
                  <strong>5</strong>
                  <span>Sports</span>
                </div>
              </div>

              {activeHeroFight && (
                <div className="fmm-tonight-callout">
                  <span>Featured entry</span>
                  <strong>
                    {activeHeroFight.matchName ||
                      getFightTitle(activeHeroFight)}
                  </strong>
                  <Link href={getFightDetailHref(activeHeroFight)}>
                    Open this fight <FaArrowRight aria-hidden="true" />
                  </Link>
                </div>
              )}

              <div className="fmm-proof-strip">
                <div>
                  <FaGift aria-hidden="true" />
                  <strong>Fight Cards</strong>
                  <span>Ready</span>
                </div>
                <div>
                  <FaTrophy aria-hidden="true" />
                  <strong>Leaderboard</strong>
                  <span>Live</span>
                </div>
                <div>
                  <FaCoins aria-hidden="true" />
                  <strong>Predictions</strong>
                  <span>Open</span>
                </div>
                <div>
                  <FaShieldAlt aria-hidden="true" />
                  <strong>Secure</strong>
                  <span>Platform</span>
                </div>
              </div>
            </div>

            <div className="fmm-hero-fight-area">
              {activeHeroFight && (
                <aside
                  key={getFightId(activeHeroFight) || activeHeroIndex}
                  className="fmm-hero-event-card fmm-promoted-slide-card fmm-featured-fight-banner"
                >
                  <div className="fmm-featured-badge">
                    <FaStar aria-hidden="true" /> Featured Fight
                  </div>
                  {heroSlides.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="fmm-featured-arrow is-left"
                        aria-label="Previous promoted fight"
                        onClick={() => setActiveHeroIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="fmm-featured-arrow is-right"
                        aria-label="Next promoted fight"
                        onClick={() => setActiveHeroIndex((current) => (current + 1) % heroSlides.length)}
                      >
                        ›
                      </button>
                    </>
                  )}
                  <div className="fmm-featured-duel-stage">
                    <div className="fmm-featured-fighter is-left">
                      <FightImage
                        src={getHomeFighterImage(activeHeroFight, "A", 0)}
                        alt={getHomeFighterName(activeHeroFight, "A")}
                        width={420}
                        height={560}
                        priority
                        sizes="(max-width: 760px) 42vw, 30vw"
                      />
                    </div>
                    <div className="fmm-featured-center">
                      <p>{activeHeroFight.matchName || getFightSportLabel(activeHeroFight)}</p>
                      <h2>
                        <span>{getHomeFighterName(activeHeroFight, "A")}</span>
                        <small>vs</small>
                        <span>{getHomeFighterName(activeHeroFight, "B")}</span>
                      </h2>
                      <div className="fmm-hero-event-meta">
                        <FaCalendarAlt aria-hidden="true" />
                        <span>{getFeaturedDateLabel(activeHeroFight)}</span>
                        <span className="fmm-featured-date-divider" aria-hidden="true" />
                        <FaClock aria-hidden="true" />
                        <span>{getFeaturedTimeLabel(activeHeroFight)}</span>
                      </div>
                      <div className="fmm-promoted-details fmm-featured-details-grid">
                        <span><FaBullseye aria-hidden="true" /> {getFightSportLabel(activeHeroFight)}</span>
                        <span><FaClock aria-hidden="true" /> {activeHeroFight.matchStatus || "Open"}</span>
                        <span><FaUsers aria-hidden="true" /> {getPlayerCount(activeHeroFight).toLocaleString()} players</span>
                        <span><FaCoins aria-hidden="true" /> {getPotTokenLabel(activeHeroFight)}</span>
                        <span><FaTrophy aria-hidden="true" /> {getPrizePool(activeHeroFight)}</span>
                        <span><FaShieldAlt aria-hidden="true" /> {getRoundLabel(activeHeroFight)}</span>
                      </div>
                      <div className="fmm-countdown-box" aria-label="Fight countdown">
                        {primaryCountdown ? (
                          primaryCountdown.slice(-3).map(({ label, value }) => (
                            <div key={label}>
                              <strong>{value}</strong>
                              <span>{label}</span>
                            </div>
                          ))
                        ) : (
                          <div className="fmm-countdown-state">
                            <strong>{activeHeroFight.matchStatus || "Open"}</strong>
                            <span>{activeHeroFight.matchName || "Contest"}</span>
                          </div>
                        )}
                      </div>
                      <div className="fmm-featured-actions">
                        <Link href={getFightDetailHref(activeHeroFight)} className="fmm-featured-primary-cta theme-btn theme-btn-primary">
                          Pick fights <FaArrowRight aria-hidden="true" />
                        </Link>
                        <Link href={getFightDetailHref(activeHeroFight)} className="fmm-featured-secondary-cta theme-btn theme-btn-secondary">
                          View details <FaPlay aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                    <div className="fmm-featured-fighter is-right">
                      <FightImage
                        src={getHomeFighterImage(activeHeroFight, "B", 1)}
                        alt={getHomeFighterName(activeHeroFight, "B")}
                        width={420}
                        height={560}
                        priority
                        sizes="(max-width: 760px) 42vw, 30vw"
                      />
                    </div>
                  </div>

                  <div className="fmm-featured-status-panel">
                    <span>{activeHeroFight.matchStatus || activeHeroFight.matchShadowOpenStatus || "Ongoing"}</span>
                    <strong>{activeHeroFight.matchName || getFightTitle(activeHeroFight)}</strong>
                  </div>

                  <MiniFightCalendar match={activeHeroFight} />

                  {heroSlides.length > 1 && (
                    <div className="fmm-promoted-dots" aria-label="Promoted fight slides">
                      {heroSlides.map((fight, index) => (
                        <button
                          key={getFightId(fight) || index}
                          type="button"
                          className={index === activeHeroIndex % heroSlides.length ? "is-active" : ""}
                          onClick={() => setActiveHeroIndex(index)}
                          aria-label={`Show promoted fight ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </aside>
              )}
            </div>
          </div>
        </section>

        <main className="theme-container fmm-home-main">
          <section
            className="fmm-signup-fast-strip"
            aria-label="Fast player signup"
          >
            <div>
              <span>
                <FaMobileAlt aria-hidden="true" /> Quick signup path
              </span>
              <h2>
                Find open fight cards and make your predictions on Fantasy
                MMADNESS.
              </h2>
            </div>
            <div className="fmm-signup-fast-actions">
              <Link
                href={PLAYER_SIGNUP_HREF}
                className="theme-btn theme-btn-primary"
              >
                Create Account <FaArrowRight aria-hidden="true" />
              </Link>
              <Link
                href={
                  activeHeroFight
                    ? getFightDetailHref(activeHeroFight)
                    : "/upcomingfights"
                }
                className="theme-btn theme-btn-secondary"
              >
                Open featured fight <FaPlay aria-hidden="true" />
              </Link>
              <Link href="/mock-game" className="theme-btn theme-btn-secondary">
                Mock game <FaBolt aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section
            className="fmm-active-section"
            aria-labelledby="active-contests-title"
          >
            <div className="fmm-section-title-row">
              <div>
                <span className="fmm-section-kicker">
                  <FaFire aria-hidden="true" /> Fight-first browsing
                </span>
                <h2 id="active-contests-title">Choose Your Fight Category</h2>
              </div>
              <div className="fmm-section-actions">
                <span className="fmm-swipe-hint">
                  Tap a category and jump straight to that section
                </span>
                <Link href="/upcomingfights?status=all">
                  All fight cards <FaArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div
              className="fmm-home-fight-tabs fmm-home-section-nav"
              role="tablist"
              aria-label="Jump to homepage fight sections"
            >
              {homeFightSections.map((section) => (
                <button
                  type="button"
                  key={section.key}
                  className={
                    activeFightSport === section.key ? "is-active" : ""
                  }
                  onClick={(event) => handleHomeSportJump(section.key, event)}
                >
                  <span>{section.label}</span>
                  <strong>{section.count}</strong>
                </button>
              ))}
            </div>

            <div className="fmm-home-category-stack">
              {matchStatus === "loading" && (
                <div className="fmm-empty-card">Loading active contests...</div>
              )}
              {matchStatus === "failed" && (
                <div className="fmm-empty-card">
                  Unable to load fights: {matchError}
                </div>
              )}

              {matchStatus !== "loading" &&
                matchStatus !== "failed" &&
                homeFightSections.map((section) => {
                  const isExpanded = Boolean(expandedHomeSports?.[section.key]);
                  const visibleFights = isExpanded
                    ? section.fights
                    : section.fights.slice(0, HOME_CATEGORY_PREVIEW_LIMIT);
                  const hasMore =
                    section.fights.length > HOME_CATEGORY_PREVIEW_LIMIT;

                  return (
                    <section
                      className={`fmm-home-sport-section ${getCategoryClass(section.key)} ${
                        isExpanded ? "is-expanded" : ""
                      }`}
                      id={`home-${section.key}-fights`}
                      key={section.key}
                      ref={(node) => {
                        homeSportSectionRefs.current[section.key] = node;
                      }}
                    >
                      <header className="fmm-home-sport-section-head">
                        <div>
                          <span className="fmm-section-kicker">
                            <FaBullseye aria-hidden="true" /> {section.count}{" "}
                            contest{section.count === 1 ? "" : "s"}
                          </span>
                          <h3>{section.label} section</h3>
                          <p>
                            Newest uploaded fights appear first. Cards without
                            fighter images stay off the front page.
                          </p>
                        </div>
                        <div className="fmm-home-sport-section-actions">
                          {hasMore && (
                            <button
                              type="button"
                              onClick={() =>
                                toggleHomeSportSection(section.key)
                              }
                            >
                              {isExpanded
                                ? "Show less"
                                : `Show ${section.label}`}
                            </button>
                          )}
                          <Link href={getHomeSportViewAllHref(section.key)}>
                            Browse all {section.label} fights{" "}
                            <FaArrowRight aria-hidden="true" />
                          </Link>
                        </div>
                      </header>

                      <div
                        className="fmm-contest-grid fmm-category-contest-grid"
                        onPointerDown={handleFightRailPointerDown}
                        onPointerMove={handleFightRailPointerMove}
                        onPointerUp={handleFightRailPointerUp}
                        onPointerCancel={handleFightRailPointerUp}
                        onPointerLeave={handleFightRailPointerUp}
                        onClickCapture={handleFightRailClickCapture}
                      >
                        {visibleFights.length === 0 ? (
                          <div className="fmm-empty-card">
                            No {section.label.toLowerCase()} contests are
                            currently available.
                          </div>
                        ) : (
                          visibleFights.map((match, index) =>
                            renderHomeFightCard(match, index, section.key),
                          )
                        )}
                      </div>
                    </section>
                  );
                })}
            </div>
          </section>

          <section className="fmm-home-wrestling-feature">
            <div className="fmm-home-wrestling-copy">
              <p>
                <FaCrown /> New game mode
              </p>
              <h2>Pro Wrestling is now part of Fantasy MMADNESS.</h2>
              <span>
                Predict head punches, body punches, kicks, power moves,
                finishers, and the official winner across the entire match.
              </span>
              <div>
                <Link
                  href="/pro-wrestling"
                  className="theme-btn theme-btn-primary"
                >
                  Enter wrestling mode <FaArrowRight />
                </Link>
                <Link
                  href="/pro-wrestling/how-to-play"
                  className="theme-btn theme-btn-secondary"
                >
                  How wrestling scores
                </Link>
              </div>
            </div>
            <div className="fmm-home-wrestling-visual">
              <Image
                src={HOME_WRESTLING_IMAGE}
                alt="Fantasy MMADNESS Pro Wrestling"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1180px) 90vw, 50vw"
              />
              {wrestlingMatches[0] ? (
                <article>
                  <header>
                    <small>{wrestlingMatches[0].status}</small>
                    <strong>{wrestlingMatches[0].eventName}</strong>
                  </header>
                  <div>
                    <figure>
                      <FightImage
                        src={getPWImage(wrestlingMatches[0].competitorA, "A")}
                        alt="Pro wrestling competitor"
                        width={80}
                        height={90}
                        sizes="55px"
                      />
                      <figcaption>
                        {wrestlingMatches[0].competitorA?.displayName}
                      </figcaption>
                    </figure>
                    <b>VS</b>
                    <figure>
                      <FightImage
                        src={getPWImage(wrestlingMatches[0].competitorB, "B")}
                        alt="Pro wrestling competitor"
                        width={80}
                        height={90}
                        sizes="55px"
                      />
                      <figcaption>
                        {wrestlingMatches[0].competitorB?.displayName}
                      </figcaption>
                    </figure>
                  </div>
                  <p>
                    {formatWrestlingDate(wrestlingMatches[0].matchDate)} ·{" "}
                    {wrestlingMatches[0].currentPot || 0} token pot
                  </p>
                  <Link
                    href={`/pro-wrestling/matches/${wrestlingMatches[0]._id}`}
                  >
                    Open featured card <FaArrowRight />
                  </Link>
                </article>
              ) : (
                <article className="is-empty">
                  <FaCrown />
                  <strong>Wrestling contest cards will appear here.</strong>
                  <Link href="/pro-wrestling">Explore the new game mode</Link>
                </article>
              )}
            </div>
          </section>

          <section
            className="fmm-dashboard-grid"
            aria-label="Gameplay summary and leaderboard"
          >
            <div className="fmm-panel fmm-how-score-panel">
              <div className="fmm-how-block">
                <h2>How It Works</h2>
                {[
                  [
                    "Predict",
                    "Pick the winner, method, round and score for each fight.",
                  ],
                  [
                    "Score Points",
                    "Earn points based on accuracy and depth of your predictions.",
                  ],
                  [
                    "Climb & Win",
                    "Compete on leaderboards and win real prizes.",
                  ],
                ].map(([title, copy], index) => (
                  <div className="fmm-step-row" key={title}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{copy}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="fmm-score-block">
                <h2>Scoring Preview</h2>
                <div className="fmm-score-table">
                  <div>
                    <strong>Prediction</strong>
                    <strong>Points</strong>
                  </div>
                  {SCORING_ROWS.map(([label, points]) => (
                    <div
                      key={label}
                      className={label === "Perfect Fight" ? "is-perfect" : ""}
                    >
                      <span>{label}</span>
                      <strong>{points}</strong>
                    </div>
                  ))}
                </div>
                <Link href="/guides">
                  Full rules &amp; scoring breakdown in How To Play
                </Link>
              </div>
            </div>

            <div className="fmm-panel fmm-winners-panel">
              <div className="fmm-panel-title-row">
                <h2>Recent Winners</h2>
                <Link href="/global-leaderboard">
                  View All Winners <FaArrowRight aria-hidden="true" />
                </Link>
              </div>
              {STATIC_WINNERS.map((winner) => (
                <div className="fmm-winner-row" key={winner.name}>
                  <span className="fmm-winner-medal">{winner.icon}</span>
                  <div>
                    <strong>{winner.name}</strong>
                    <p>{winner.contest}</p>
                  </div>
                  <strong>{winner.amount}</strong>
                </div>
              ))}
              <p className="fmm-panel-note">
                <FaCrown aria-hidden="true" /> Become the next champion.
              </p>
            </div>

            <div className="fmm-panel fmm-leaderboard-panel">
              <div className="fmm-panel-title-row">
                <h2>Live Leaderboard</h2>
                <Link href="/leaderboard">
                  View Full Leaderboard <FaArrowRight aria-hidden="true" />
                </Link>
              </div>
              <div className="fmm-leaderboard-head">
                <span>Rank</span>
                <span>Player</span>
                <span>Points</span>
              </div>
              {liveLeaderboardRows.map((player, index) => (
                <div
                  className={`fmm-leaderboard-row ${index === 3 ? "is-highlighted" : ""}`}
                  key={`${player.name}-${index}`}
                >
                  <span>{index + 1}</span>
                  <div>
                    {player.avatar ? (
                      <FightImage
                        src={player.avatar}
                        alt={player.name}
                        width={48}
                        height={48}
                        sizes="40px"
                      />
                    ) : (
                      <span>{player.name.charAt(0).toUpperCase()}</span>
                    )}
                    <strong>{player.name}</strong>
                  </div>
                  <strong>{Number(player.points || 0).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </section>

          <section
            className="fmm-metrics-partners"
            aria-label="Platform metrics and partners"
          >
            <div className="fmm-metrics-grid">
              <div>
                <FaUsers aria-hidden="true" />
                <strong>128,547+</strong>
                <span>Players</span>
                <p>Worldwide community</p>
              </div>
              <div>
                <FaBullseye aria-hidden="true" />
                <strong>4.2M+</strong>
                <span>Predictions Submitted</span>
                <p>Across all time</p>
              </div>
              <div>
                <FaTrophy aria-hidden="true" />
                <strong>$1.7M+</strong>
                <span>Tokens Awarded</span>
                <p>To our champions</p>
              </div>
              <div>
                <FaShieldAlt aria-hidden="true" />
                <strong>100%</strong>
                <span>Secure &amp; Fair</span>
                <p>Provably fair contests</p>
              </div>
            </div>
            <div className="fmm-partners-card">
              <p>Trusted by fans. Backed by partners.</p>
              <div>
                <span>UFC</span>
                <span>BKFC</span>
                <span>GLORY</span>
                <span>ESPN</span>
                <span>DAZN</span>
              </div>
            </div>
          </section>

          <section
            className="fmm-fight-art-section"
            aria-label="Fight night experience"
          >
            <div className="fmm-fight-art-copy">
              <p>Fight Night Experience</p>
              <h2>Built for every punch, round and prediction.</h2>
              <span>
                Premium fight cards, live leaderboards and clean prediction
                flows stay focused on the contest, not hidden stat tables.
              </span>
              <Link href="/upcomingfights" className="fmm-art-link">
                Explore contests <FaArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="fmm-fight-art-media">
              <Image
                src={HOME_FIGHT_ART_IMAGE}
                alt="Combat sports fight night"
                width={1280}
                height={720}
                sizes="(max-width: 760px) 100vw, 58vw"
              />
            </div>
          </section>

          <section
            className="fmm-contact-panel"
            aria-labelledby="contact-home-title"
          >
            <div>
              <p>Contact Fantasy MMAdness</p>
              <h2 id="contact-home-title">
                Questions about leagues, sponsors, or fight cards?
              </h2>
              <span>
                Send a message and the team will follow up. The existing
                production contact endpoint is unchanged.
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="fullName"
                placeholder="Full name"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                required
              />
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                required
              />
              <textarea name="message" placeholder="Message" required />
              <button
                type="submit"
                className="theme-btn theme-btn-primary"
                disabled={isSubmitting}
              >
                {buttonText}
              </button>
            </form>
          </section>
        </main>
        </div>
      </div>
    </>
  );
};

export default HomeAnother;
