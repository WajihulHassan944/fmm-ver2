import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  FaChartLine,
  FaCheck,
  FaCoins,
  FaChevronRight,
  FaCrown,
  FaDollarSign,
  FaFire,
  FaHandshake,
  FaFistRaised,
  FaGift,
  FaHome,
  FaNewspaper,
  FaPlus,
  FaPlay,
  FaShieldAlt,
  FaSignal,
  FaTshirt,
  FaStar,
  FaTimes,
  FaTrophy,
  FaUserAlt,
  FaUsers,
} from "react-icons/fa";

const FALLBACK_FIGHT_IMAGE = "/images/hero-fight.webp";
const HOME_HERO_IMAGE =
  "/images/home-premium/fantasy-mmadness-fighters-prize-arena-bg.webp";
const HOME_FIGHT_ART_IMAGE = "/images/home-premium/fight-action-clash.webp";
const HOME_WRESTLING_IMAGE =
  "/images/pro-wrestling/wrestling-live-premium.webp";

const HOME_FIGHT_SPORT_TABS = [
  {
    key: "boxing",
    label: "Boxing",
    image: "/images/home-premium/category-icons/boxing.png",
    fallbackCount: 128,
  },
  {
    key: "mma",
    label: "MMA",
    image: "/images/home-premium/category-icons/mma.png",
    fallbackCount: 214,
  },
  {
    key: "bareknuckle",
    label: "Bare-knuckle",
    image: "/images/home-premium/category-icons/bareknuckle.png",
    fallbackCount: 36,
  },
  {
    key: "kickboxing",
    label: "Kickboxing",
    image: "/images/home-premium/category-icons/kickboxing.png",
    fallbackCount: 58,
  },
  {
    key: "pro-wrestling",
    label: "Pro Wrestling",
    image: "/images/home-premium/category-icons/pro-wrestling.png",
    fallbackCount: 42,
  },
];

const MOBILE_HOME_SPORT_TABS = [
  {
    ...HOME_FIGHT_SPORT_TABS[0],
    label: "Boxing",
    symbol: "🥊",
  },
  {
    ...HOME_FIGHT_SPORT_TABS[1],
    label: "UFC / MMA",
    symbol: "🥋",
  },
  {
    ...HOME_FIGHT_SPORT_TABS[2],
    label: "Bare Knuckle",
    symbol: "👊",
  },
  {
    ...HOME_FIGHT_SPORT_TABS[3],
    label: "Kickboxing",
    symbol: "🦵",
  },
  {
    ...HOME_FIGHT_SPORT_TABS[4],
    label: "Pro Wrestling",
    symbol: "🤼",
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

const getMobileUpcomingHeading = (section = {}) => {
  const label =
    section?.label || MOBILE_FALLBACK_SPORT_LABELS[section?.key] || "Combat";
  return `Upcoming ${label} Fights`;
};

const getHomeFightPosterImage = (fight = {}) =>
  pickHomeValue(
    fight?.fightPosterMobileImage,
    fight?.fightPosterImage,
    fight?.posterMobileImage,
    fight?.posterImage,
    fight?.homepagePromotion?.mobilePosterImage,
    fight?.homepagePromotion?.posterImage,
    fight?.homepagePromotion?.image,
    fight?.bannerImage,
    fight?.promotionPoster,
    fight?.promotionBackground,
    fight?.eventPoster,
  );

const HOME_FIGHT_FEED_LIMIT = 200;
const HOME_CATEGORY_PREVIEW_LIMIT = 4;
const PLAYER_SIGNUP_HREF = "/CreateAccount";

const FightCategoryIcon = ({ type }) => {
  const key = String(type || "").toLowerCase();

  if (key.includes("pro") || key.includes("wrestling")) {
    return (
      <svg
        className="fmm-fight-category-svg"
        viewBox="0 0 64 64"
        role="img"
        aria-hidden="true"
      >
        <path d="M18 10c3.8-2.4 8.2-3.6 14-3.6S42.2 7.6 46 10c5 3.1 7.5 8.8 7.5 17 0 15.5-8.9 28.1-21.5 30.6C19.4 55.1 10.5 42.5 10.5 27c0-8.2 2.5-13.9 7.5-17Z" />
        <path d="M19.3 17.2c2.9 3.9 7.1 6.2 12.7 6.2s9.8-2.3 12.7-6.2" />
        <path d="M20.3 30.4c2.9-3.6 8.4-4 11.7-.6-3.4 3.8-8.7 4-11.7.6Z" />
        <path d="M43.7 30.4c-2.9-3.6-8.4-4-11.7-.6 3.4 3.8 8.7 4 11.7.6Z" />
        <path d="M25.1 45.3c4.2 3.1 9.6 3.1 13.8 0" />
        <path d="M14.2 22.8c5.4.6 10 2.5 13.9 5.6" />
        <path d="M49.8 22.8c-5.4.6-10 2.5-13.9 5.6" />
      </svg>
    );
  }

  if (key.includes("kick")) {
    return (
      <svg
        className="fmm-fight-category-svg"
        viewBox="0 0 64 64"
        role="img"
        aria-hidden="true"
      >
        <path d="M18.5 9.5c5.7 2.6 9.9 6.7 12.4 12.2l5.8 12.6c1.1 2.5 3.3 4.2 6 4.7l6.7 1.1c4.7.8 7.5 3.4 8.1 7.8.3 2.4-.7 4.7-2.9 6.7-2 1.8-4.6 2.7-7.8 2.7H32.6c-3.4 0-6.2-2.1-7.4-5.3l-3.7-10.5c-1.5-4.4-4.5-7.9-8.7-10.5L7.2 27.7 12 17l6.5-7.5Z" />
        <path d="M19.5 10.7 12.1 27" />
        <path d="M27.4 44.2h28.4" />
        <path d="M40.7 39.2c-2 2.6-3.1 5.5-3.3 8.6" />
        <path d="M49 40.5c-1.1 2.2-1.6 4.8-1.5 7.6" />
      </svg>
    );
  }

  if (key.includes("bare")) {
    return (
      <svg
        className="fmm-fight-category-svg"
        viewBox="0 0 64 64"
        role="img"
        aria-hidden="true"
      >
        <path d="M16.5 27.2v-7.1c0-3.2 2.4-5.8 5.5-5.8 1.7 0 3.2.8 4.2 2.1.9-2.1 2.9-3.5 5.3-3.5 2.5 0 4.6 1.5 5.5 3.7 1-1.4 2.6-2.3 4.5-2.3 3.1 0 5.5 2.6 5.5 5.8v11.5h1.2c4.2 0 7.3 3.4 7.3 7.7v2.5c0 8.1-6.2 14.3-14.3 14.3H27.6c-8 0-14.5-6.5-14.5-14.5v-7.2c0-3.2 1.2-5.6 3.4-7.2Z" />
        <path d="M26.2 18.6v12" />
        <path d="M37 18.1v12.5" />
        <path d="M16.5 27.2c2.7-.2 5.3.6 7.7 2.4" />
        <path d="M25.8 42.1c4.4 2.2 9.1 2.2 14.2 0" />
      </svg>
    );
  }

  if (key.includes("mma")) {
    return (
      <svg
        className="fmm-fight-category-svg"
        viewBox="0 0 64 64"
        role="img"
        aria-hidden="true"
      >
        <path d="M16.3 29.5v-8.6c0-3.5 2.6-6.2 6-6.2 1.8 0 3.4.8 4.5 2.1 1-2.3 3.2-3.9 5.9-3.9s4.9 1.7 5.9 4.1c1.1-1.4 2.8-2.3 4.8-2.3 3.4 0 6 2.7 6 6.2v15.7c3.5.8 5.8 3.9 5.8 7.8 0 7.1-5.6 12.7-12.7 12.7H28.6c-8.6 0-15.6-7-15.6-15.6v-4.9c0-3 1.2-5.5 3.3-7.1Z" />
        <path d="M26.8 18.9v17.5" />
        <path d="M38.6 19.1v17.1" />
        <path d="M18.1 30.2c4.6.5 8.1 2.5 10.6 6" />
        <path d="M26.5 45.3h20.1" />
        <path d="M22.8 10.1 19 5.5" />
        <path d="M41.2 10.1 45 5.5" />
      </svg>
    );
  }

  return (
    <svg
      className="fmm-fight-category-svg"
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
    >
      <path d="M15.7 23.3c0-8.1 6-14.3 14.2-14.3h6.3c7.2 0 12.9 5.6 12.9 12.9v7.7c4.2 1.3 7.2 5.1 7.2 9.9 0 6.1-4.8 10.9-10.9 10.9h-6.7c-3.2 3.6-7.8 5.7-13.1 5.7-9.9 0-17.8-7.8-17.8-17.5 0-5.9 2.9-11.4 7.9-14.8Z" />
      <path d="M15.9 23.5c5.5-.1 10 1.8 13.4 5.8" />
      <path d="M29.7 9.1v16.1" />
      <path d="M39.5 10.8v16.8" />
      <path d="M40.1 34.4h15.4" />
      <path d="M18.8 43.3c4.8 2.6 9.7 2.6 14.8 0" />
    </svg>
  );
};

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
  if (options.allowFallback === false) return "";

  return MOBILE_FALLBACK_FIGHT_IMAGES[
    (index + (isA ? 0 : 1)) % MOBILE_FALLBACK_FIGHT_IMAGES.length
  ];
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
  if (match.__isPreview) {
    const sportKey = getFightSportKey(match);
    return sportKey === "pro-wrestling"
      ? "/pro-wrestling"
      : `/upcomingfights?status=all&category=${encodeURIComponent(sportKey || "all")}`;
  }
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
          <strong>
            {monthLong} {date.getFullYear()}
          </strong>
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
  const amount = Number(
    match?.pot || match?.currentPot || match?.prizePool || 0,
  );
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
  const rounds = Number(
    match?.maxRounds || match?.rounds || match?.scheduledRounds || 0,
  );
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
  prizePool: match.prizePool || match.currentPot || match.pot || 0,
  promotionBackground: pickHomeValue(
    match.bannerImage,
    match.promotionBackground,
    HOME_WRESTLING_IMAGE,
  ),
  fightPosterImage: pickHomeValue(
    match.bannerImage,
    match.fightPosterImage,
    HOME_WRESTLING_IMAGE,
  ),
  eventLabel: pickHomeValue(
    match.promotionName,
    match.eventName,
    "Pro Wrestling",
  ),
});

const getLeaderboardName = (player) =>
  player?.firstName ||
  player?.username ||
  player?.name ||
  player?.email?.split?.("@")?.[0] ||
  "Player";

const MOBILE_FALLBACK_MATCHUPS = {
  boxing: [
    ["Boxing Showdown", "Chris Eubank Jr", "Conor Benn", 25000, 1245],
    ["Title Eliminator", "Anthony Yarde", "David Benavidez", 10000, 598],
    ["Prize Fight", "Zaveer Davis", "Jadden Addison", 5000, 321],
  ],
  mma: [
    ["MMA Main Card", "Conor McGregor", "Max Holloway", 25000, 1245],
    ["Cage Clash", "Usman", "Diaz", 10000, 598],
    ["Fight Night", "Volkanovski", "Topuria", 5000, 321],
  ],
  bareknuckle: [
    ["BKFC Main Event", "Luis Palomino", "Mike Perry", 18000, 842],
    ["Bare-knuckle Clash", "Eddie Alvarez", "Chad Mendes", 9000, 411],
    ["Knuckle Night", "Austin Trout", "Lorenzo Hunt", 5000, 284],
  ],
  kickboxing: [
    ["Kickboxing Grand Prix", "Rico Verhoeven", "Tariq Osaro", 16000, 766],
    ["Glory Clash", "Alex Pereira", "Artem Vakhitov", 8000, 388],
    ["Stand-up War", "Superbon", "Marat Grigorian", 5000, 245],
  ],
  "pro-wrestling": [
    ["Pro Wrestling Main Event", "Raven Steele", "Titan Knox", 20000, 1108],
    ["Wrestling Spotlight", "Ace Ryder", "Maverick Cross", 12000, 574],
    ["Power Move Contest", "Nova Storm", "Blaze Hunter", 7500, 333],
  ],
};

const getMobileFallbackFight = (sportKey = "mma", index = 0) => {
  const label = MOBILE_FALLBACK_SPORT_LABELS[sportKey] || "Combat";
  const matchups =
    MOBILE_FALLBACK_MATCHUPS[sportKey] || MOBILE_FALLBACK_MATCHUPS.mma;
  const [eventLabel, matchFighterA, matchFighterB, pot, players] =
    matchups[index % matchups.length];
  const matchDate = ["2099-07-11", "2099-07-15", "2099-07-16"][index % 3];
  const matchTime = ["20:00", "21:00", "22:00"][index % 3];

  return {
    _id: `mobile-${sportKey}-preview-${index}`,
    __isPreview: true,
    __source: sportKey === "pro-wrestling" ? "pro-wrestling" : undefined,
    eventLabel,
    matchName: `${matchFighterA} vs ${matchFighterB}`,
    matchFighterA,
    matchFighterB,
    fighterAImage:
      MOBILE_FALLBACK_FIGHT_IMAGES[index % MOBILE_FALLBACK_FIGHT_IMAGES.length],
    fighterBImage:
      MOBILE_FALLBACK_FIGHT_IMAGES[
        (index + 1) % MOBILE_FALLBACK_FIGHT_IMAGES.length
      ],
    matchCategory: label,
    matchCategoryTwo: label,
    matchStatus: "Open",
    matchDate,
    matchTime,
    pot,
    currentPot: pot,
    entryFee: [10, 5, 5][index % 3],
    userPredictions: Array.from({ length: players }),
  };
};

const getMobileEventLabel = (match = {}) => {
  const eventPattern =
    /\b(?:UFC|BKFC|PFL|BELLATOR|GLORY|ONE|WWE|AEW|NXT)\s*\d+\b/i;
  const eventNameMatch = String(
    match?.eventName || match?.matchName || "",
  ).match(eventPattern)?.[0];
  const rawLabel = pickHomeValue(
    match?.eventCode,
    match?.eventLabel,
    match?.promotionEventCode,
    eventNameMatch,
    match?.leagueName,
    match?.promotionName,
    match?.organization,
    getFightSportLabel(match),
  );

  return rawLabel
    ? rawLabel.toUpperCase()
    : getFightSportLabel(match).toUpperCase();
};

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
    weekday: date
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase(),
  };
};

const getMobileCountdownDisplay = (match, now) => {
  const parts = getCountdownParts(match, now);
  if (!parts) return [];

  const [days, hours, minutes, seconds] = parts;
  if (Number(days.value) > 0) return [days, hours, minutes];
  return [hours, minutes, seconds];
};

const getMobileDisplayFights = (fights = [], sportKey = "mma", limit = 3) => {
  const visible = Array.isArray(fights)
    ? fights.filter(Boolean).slice(0, limit)
    : [];

  if (visible.length >= limit) return visible;

  const fallbackFights = Array.from(
    { length: limit - visible.length },
    (_, index) => getMobileFallbackFight(sportKey, visible.length + index),
  );

  return [...visible, ...fallbackFights];
};

const getMobileEntryFee = (match = {}) => {
  const amount = Number(match?.entryFee || match?.fee || match?.cost || 0);
  return amount > 0 ? `$${amount.toLocaleString()}` : "$5";
};

const getHomeSportViewAllHref = (sportKey) =>
  sportKey === "pro-wrestling"
    ? "/pro-wrestling"
    : `/upcomingfights?status=all&category=${encodeURIComponent(sportKey || "all")}`;

const useHorizontalDragScroll = () => {
  const railRef = useRef(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
  });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    const endDrag = (event) => {
      const state = dragRef.current;
      if (!state.active) return;

      state.active = false;
      rail.classList.remove("is-dragging");

      if (state.pointerId !== null && rail.releasePointerCapture) {
        try {
          rail.releasePointerCapture(state.pointerId);
        } catch {
          // Pointer capture may already be released by the browser.
        }
      }

      state.pointerId = null;
      if (event?.type !== "click") {
        window.setTimeout(() => {
          dragRef.current.moved = false;
        }, 0);
      }
    };

    const handlePointerDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      dragRef.current = {
        active: true,
        moved: false,
        pointerId: event.pointerId,
        startX: event.clientX,
        scrollLeft: rail.scrollLeft,
      };
      rail.classList.add("is-dragging");

      if (rail.setPointerCapture) {
        try {
          rail.setPointerCapture(event.pointerId);
        } catch {
          // Some mobile browsers can deny pointer capture for native scrolling.
        }
      }
    };

    const handlePointerMove = (event) => {
      const state = dragRef.current;
      if (!state.active) return;

      const deltaX = event.clientX - state.startX;
      if (Math.abs(deltaX) > 5) {
        state.moved = true;
        rail.scrollLeft = state.scrollLeft - deltaX;
        event.preventDefault();
      }
    };

    const handleClickCapture = (event) => {
      if (!dragRef.current.moved) return;

      event.preventDefault();
      event.stopPropagation();
      endDrag(event);
    };

    rail.addEventListener("pointerdown", handlePointerDown);
    rail.addEventListener("pointermove", handlePointerMove);
    rail.addEventListener("pointerup", endDrag);
    rail.addEventListener("pointercancel", endDrag);
    rail.addEventListener("pointerleave", endDrag);
    rail.addEventListener("click", handleClickCapture, true);

    return () => {
      rail.removeEventListener("pointerdown", handlePointerDown);
      rail.removeEventListener("pointermove", handlePointerMove);
      rail.removeEventListener("pointerup", endDrag);
      rail.removeEventListener("pointercancel", endDrag);
      rail.removeEventListener("pointerleave", endDrag);
      rail.removeEventListener("click", handleClickCapture, true);
    };
  }, []);

  return railRef;
};

const getSafeMetricNumber = (...values) => {
  for (const value of values) {
    const normalized =
      typeof value === "string" ? value.replaceAll(",", "").trim() : value;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return 0;
};

const formatMobileMetric = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value);

const MobilePhoneHome = ({
  currentUser,
  leaderboardRows = [],
  activeFightSport,
  setActiveFightSport,
  setSelectedFeaturedFight,
  heroSlides = [],
  homeFightSections,
  matchError,
  matchStatus,
  now,
}) => {
  const [isHeroMenuOpen, setIsHeroMenuOpen] = useState(false);

  const staticSportCards = useMemo(
    () => [
      {
        key: "boxing",
        label: "Boxing",
        shortLabel: "Boxing",
        image: "/images/mobile-home/client-v7/category-boxing-art.jpg",
      },
      {
        key: "mma",
        label: "UFC / MMA",
        shortLabel: "MMA",
        image: "/images/mobile-home/client-v7/category-mma-art.jpg",
      },
      {
        key: "bareknuckle",
        label: "Bare Knuckle",
        shortLabel: "Bare",
        image: "/images/mobile-home/client-v7/category-bare-knuckle-art.jpg",
      },
      {
        key: "kickboxing",
        label: "Kickboxing",
        shortLabel: "Kick",
        image: "/images/mobile-home/client-v7/category-kickboxing-art.jpg",
      },
      {
        key: "pro-wrestling",
        label: "Pro Wrestling",
        shortLabel: "Wrestling",
        image: "/images/mobile-home/client-v7/category-pro-wrestling-art.jpg",
      },
    ],
    [],
  );

  const mobileSections = useMemo(
    () =>
      staticSportCards.map((card) => {
        const existing = homeFightSections.find(
          (section) => section.key === card.key,
        );

        return {
          ...card,
          count: existing?.fights?.length || 0,
          fights: existing?.fights || [],
        };
      }),
    [homeFightSections, staticSportCards],
  );

  const activeSection =
    mobileSections.find((section) => section.key === activeFightSport) ||
    mobileSections[0];

  const selectedFights = getMobileDisplayFights(
    activeSection?.fights,
    activeSection?.key,
    8,
  );
  const actualFeaturedFight = selectedFights[0] || null;
  const featuredFight =
    actualFeaturedFight ||
    getMobileFallbackFight(activeSection?.key || "boxing", 0);
  const remainingFights = selectedFights.slice(1, 6);
  const hasOpenFeaturedFight = Boolean(actualFeaturedFight);

  const uniqueAllFights = useMemo(() => {
    const seen = new Set();
    return mobileSections.flatMap((section) => section.fights || []).filter((fight) => {
      const key = getFightId(fight) || getFightTitle(fight);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [mobileSections]);

  const featuredPosterFights = useMemo(
    () =>
      (Array.isArray(heroSlides) ? heroSlides : [])
        .filter((fight) => Boolean(getHomeFightPosterImage(fight)))
        .slice(0, 8),
    [heroSlides],
  );

  const isLoggedIn = Boolean(
    currentUser?._id || currentUser?.email || currentUser?.username,
  );
  const profileHref = isLoggedIn ? "/profile" : PLAYER_SIGNUP_HREF;
  const primaryCtaHref = isLoggedIn
    ? hasOpenFeaturedFight
      ? getFightDetailHref(actualFeaturedFight)
      : "/upcomingfights"
    : PLAYER_SIGNUP_HREF;

  const tokenBalance = getSafeMetricNumber(
    currentUser?.tokens,
    currentUser?.walletTokens,
    currentUser?.wallet?.balance,
  );
  const playerLevel = Math.max(
    1,
    getSafeMetricNumber(
      currentUser?.fightIqLevel,
      currentUser?.level,
      currentUser?.rankLevel,
      1,
    ),
  );
  const xpValue = Math.max(
    0,
    getSafeMetricNumber(currentUser?.xp, currentUser?.totalXp),
  );
  const xpTarget = Math.max(1000, Math.ceil(Math.max(xpValue, 1) / 1000) * 1000);
  const xpPercent = Math.min(100, Math.round((xpValue / xpTarget) * 100));

  const parseMetricValue = (...values) => {
    for (const value of values) {
      if (value === null || value === undefined || value === "") continue;
      const normalized =
        typeof value === "string"
          ? value.replace(/[^0-9.-]+/g, "")
          : value;
      const parsed = Number(normalized);
      if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
    }
    return 0;
  };

  const fightPrizeNumber = (fight = {}) =>
    parseMetricValue(
      fight?.pot,
      fight?.prizePool,
      fight?.prize,
      fight?.winningAmount,
      fight?.cashPrize,
    );

  const fightPlayerNumber = (fight = {}) =>
    parseMetricValue(
      fight?.playerCount,
      fight?.players,
      Array.isArray(fight?.userPredictions) ? fight.userPredictions.length : 0,
    );

  const totalPlayers = uniqueAllFights.reduce(
    (sum, fight) => sum + fightPlayerNumber(fight),
    0,
  );
  const totalPrize = uniqueAllFights.reduce(
    (sum, fight) => sum + fightPrizeNumber(fight),
    0,
  );
  const openMatchesCount = uniqueAllFights.length;

  const formatCompact = (value, prefix = "") => {
    const safeValue = Number(value) || 0;
    if (safeValue >= 1000000)
      return `${prefix}${(safeValue / 1000000).toFixed(safeValue >= 10000000 ? 0 : 1)}M+`;
    if (safeValue >= 1000)
      return `${prefix}${(safeValue / 1000).toFixed(safeValue >= 10000 ? 0 : 1)}K+`;
    return `${prefix}${safeValue.toLocaleString()}`;
  };

  const fighterA = getHomeFighterName(featuredFight, "A");
  const fighterB = getHomeFighterName(featuredFight, "B");

  const predictionSummary = useMemo(() => {
    const predictions = Array.isArray(featuredFight?.userPredictions)
      ? featuredFight.userPredictions
      : [];
    const fighterAId = String(
      featuredFight?.fighterAId?._id || featuredFight?.fighterAId || featuredFight?.fighterA?._id || "",
    ).toLowerCase();
    const fighterBId = String(
      featuredFight?.fighterBId?._id || featuredFight?.fighterBId || featuredFight?.fighterB?._id || "",
    ).toLowerCase();
    const fighterAName = String(fighterA || "").toLowerCase();
    const fighterBName = String(fighterB || "").toLowerCase();

    const winnerCounts = { A: 0, B: 0 };
    const methodCounts = { "KO / TKO": 0, Submission: 0, Decision: 0 };
    const roundCounts = [0, 0, 0, 0, 0];

    const resolveSide = (value) => {
      const normalized = String(value?._id || value?.id || value?.name || value || "")
        .trim()
        .toLowerCase();
      if (!normalized) return "";
      if (["a", "1", "fightera", "fighter a", "corner a", "red"].includes(normalized)) return "A";
      if (["b", "2", "fighterb", "fighter b", "corner b", "blue"].includes(normalized)) return "B";
      if (fighterAId && normalized === fighterAId) return "A";
      if (fighterBId && normalized === fighterBId) return "B";
      if (fighterAName && normalized.includes(fighterAName)) return "A";
      if (fighterBName && normalized.includes(fighterBName)) return "B";
      return "";
    };

    predictions.forEach((prediction) => {
      const roundRows = Array.isArray(prediction?.predictions)
        ? prediction.predictions
        : Array.isArray(prediction?.rounds)
          ? prediction.rounds
          : [];
      const directWinner = [
        prediction?.predictedWinner,
        prediction?.winner,
        prediction?.winnerSide,
        prediction?.selectedWinner,
        prediction?.predictionWinner,
        prediction?.fighterId,
      ].map(resolveSide).find(Boolean);

      let side = directWinner || "";
      if (!side && roundRows.length) {
        const aScore = roundRows.reduce(
          (sum, row) => sum + getSafeMetricNumber(row?.rwPrediction1, row?.winnerPrediction1),
          0,
        );
        const bScore = roundRows.reduce(
          (sum, row) => sum + getSafeMetricNumber(row?.rwPrediction2, row?.winnerPrediction2),
          0,
        );
        if (aScore > bScore) side = "A";
        if (bScore > aScore) side = "B";
      }
      if (side) winnerCounts[side] += 1;

      const flatEntries = [prediction, ...roundRows];
      const serializedKeys = flatEntries
        .flatMap((entry) =>
          Object.entries(entry || {})
            .filter(([, value]) => Number(value) > 0 || typeof value === "string")
            .map(([key, value]) => `${key}:${value}`.toLowerCase()),
        )
        .join(" ");
      if (/submission|\bsub\b/.test(serializedKeys)) methodCounts.Submission += 1;
      else if (/knockout|\bko\b|tko/.test(serializedKeys)) methodCounts["KO / TKO"] += 1;
      else methodCounts.Decision += 1;

      const directRound = getSafeMetricNumber(
        prediction?.predictedRound,
        prediction?.finishRound,
        prediction?.round,
      );
      let pickedRound = directRound;
      if (!pickedRound && roundRows.length) {
        const finishIndex = roundRows.findIndex((row) =>
          Object.entries(row || {}).some(
            ([key, value]) => /ko|submission|finish/i.test(key) && Number(value) > 0,
          ),
        );
        if (finishIndex >= 0) pickedRound = finishIndex + 1;
      }
      if (pickedRound >= 1 && pickedRound <= 5) roundCounts[pickedRound - 1] += 1;
    });

    const total = predictions.length;
    const percent = (count) => (total > 0 ? Math.round((count / total) * 100) : 0);
    return {
      total,
      winnerA: percent(winnerCounts.A),
      winnerB: percent(winnerCounts.B),
      methods: Object.entries(methodCounts).map(([label, count]) => ({
        label,
        value: percent(count),
      })),
      rounds: roundCounts.map((count, index) => ({
        label: index + 1,
        value: percent(count),
      })),
    };
  }, [featuredFight, fighterA, fighterB]);

  const liveLeaderboard = useMemo(
    () =>
      (Array.isArray(leaderboardRows) ? leaderboardRows : [])
        .slice(0, 3)
        .map((player, index) => ({
          rank: index + 1,
          name: player?.name || getLeaderboardName(player),
          points: getSafeMetricNumber(player?.points, player?.totalPoints),
        })),
    [leaderboardRows],
  );

  const heroMenuLinks = [
    { href: "/", label: "Home", icon: FaHome },
    { href: "/upcomingfights", label: "Open Events", icon: FaTrophy },
    { href: "/leaderboard", label: "Leaderboard", icon: FaCrown },
    { href: "/fights-rewards", label: "Rewards & Tokens", icon: FaGift },
    { href: "/blogs", label: "Blogs", icon: FaNewspaper },
    { href: "/apparel", label: "Apparel", icon: FaTshirt },
    { href: "/affiliate-create-account", label: "Affiliates", icon: FaHandshake },
  ];

  const roadmapLinks = [
    {
      href: "/upcomingfights",
      label: "Open Events",
      detail: `${openMatchesCount} fights available`,
      icon: FaFire,
      tone: "is-red",
    },
    {
      href: "/apparel",
      label: "Apparel",
      detail: "Official fight gear",
      icon: FaTshirt,
      tone: "is-gold",
    },
    {
      href: "/blogs",
      label: "Blogs",
      detail: "Fight news & analysis",
      icon: FaNewspaper,
      tone: "is-blue",
    },
    {
      href: "/affiliate-create-account",
      label: "Affiliates",
      detail: "Promote open matches",
      icon: FaHandshake,
      tone: "is-purple",
    },
  ];

  const selectSport = (sportKey) => {
    setActiveFightSport(sportKey);
  };

  return (
    <div className="fmm-static-client-home fmm-roadmap-home" aria-label="Fantasy MMAdness mobile homepage">
      <section className="fmm-static-hero fmm-roadmap-hero" aria-label="Fantasy MMAdness hero banner">
        <div className="fmm-static-hero-controls" aria-label="Homepage controls">
          <button
            type="button"
            className="fmm-static-hero-menu-button"
            aria-label={isHeroMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isHeroMenuOpen}
            aria-controls="fmm-static-hero-menu"
            onClick={() => setIsHeroMenuOpen((current) => !current)}
          >
            <span className="fmm-static-control-hit-label">Menu</span>
          </button>

          <Link
            href={profileHref}
            className="fmm-static-hero-user-button"
            aria-label={isLoggedIn ? "Open your profile" : "Create your Fantasy MMAdness account"}
          >
            <span className="fmm-static-control-hit-label">
              {isLoggedIn ? "Profile" : "Create account"}
            </span>
          </Link>
        </div>

        <Link
          href="/fights-rewards"
          className="fmm-roadmap-live-wallet"
          aria-label={`Fight wallet: ${tokenBalance.toLocaleString()} tokens`}
        >
          <span>FM</span>
          <strong>{tokenBalance.toLocaleString()}</strong>
          <b><FaPlus aria-hidden="true" /></b>
        </Link>

        {isHeroMenuOpen && (
          <>
            <button
              type="button"
              className="fmm-static-hero-menu-backdrop"
              aria-label="Close navigation menu"
              onClick={() => setIsHeroMenuOpen(false)}
            />
            <aside id="fmm-static-hero-menu" className="fmm-static-hero-menu-panel" aria-label="Mobile navigation">
              <div className="fmm-static-hero-menu-head">
                <strong>Fantasy MMAdness</strong>
                <button type="button" onClick={() => setIsHeroMenuOpen(false)} aria-label="Close navigation menu">
                  <FaTimes aria-hidden="true" />
                </button>
              </div>
              <nav>
                {heroMenuLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setIsHeroMenuOpen(false)}>
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                      <FaChevronRight aria-hidden="true" />
                    </Link>
                  );
                })}
              </nav>
              <Link
                href={PLAYER_SIGNUP_HREF}
                className="fmm-static-hero-menu-signup"
                onClick={() => setIsHeroMenuOpen(false)}
              >
                Create Account <FaArrowRight aria-hidden="true" />
              </Link>
            </aside>
          </>
        )}

        <Image
          src="/images/mobile-home/client-v7/hero-static-live.jpg"
          alt="Fantasy MMAdness combat prediction game"
          width={1024}
          height={563}
          sizes="100vw"
          priority
        />
        <Link
          href={primaryCtaHref}
          className="fmm-static-hero-cta-hitarea"
          aria-label={isLoggedIn ? "Play now" : "Join free"}
        />
      </section>

      <section className="fmm-static-image-section fmm-roadmap-benefits" aria-label="Platform benefits">
        <Image
          src="/images/mobile-home/client-v4/feature-strip-static.jpg"
          alt="Predict every fight, earn points, climb leaderboards, and win real prizes"
          width={956}
          height={90}
          sizes="100vw"
        />
        <div className="fmm-roadmap-benefit-links" aria-label="Benefit shortcuts">
          <Link href="/upcomingfights" aria-label="Predict every fight" />
          <Link href="/fights-rewards" aria-label="Earn game points" />
          <Link href="/leaderboard" aria-label="Climb leaderboards" />
          <Link href="/fights-rewards" aria-label="Win real prizes" />
        </div>
      </section>

      <section className="fmm-roadmap-journey" aria-label="Your journey and Fight IQ">
        <Link href={profileHref} className="fmm-roadmap-journey-track">
          <div className="fmm-roadmap-journey-head">
            <span>Your Journey</span>
            <strong>Level {playerLevel}</strong>
          </div>
          <div className="fmm-roadmap-ranks" aria-hidden="true">
            {["Rookie", "Prospect", "Contender", "Champion", "Legend"].map((rank, index) => {
              const activeIndex = Math.min(4, Math.floor((playerLevel - 1) / 4));
              return (
                <span className={index <= activeIndex ? "is-active" : ""} key={rank}>
                  <b>{index + 1}</b>
                  <small>{rank}</small>
                </span>
              );
            })}
          </div>
        </Link>
        <Link href="/fights-rewards" className="fmm-roadmap-iq-card">
          <FaCrown aria-hidden="true" />
          <div>
            <span>Fight IQ</span>
            <strong>{playerLevel}</strong>
            <small>{xpValue.toLocaleString()} / {xpTarget.toLocaleString()} XP</small>
          </div>
          <i><b style={{ width: `${xpPercent}%` }} /></i>
        </Link>
      </section>

      <section className="fmm-static-categories fmm-roadmap-categories" aria-labelledby="fmm-static-categories-title">
        <div className="fmm-static-categories-heading">
          <span id="fmm-static-categories-title" className="fmm-roadmap-heading-text">Pick Your Sport</span>
          <Link href="/upcomingfights?status=all">View All <FaArrowRight aria-hidden="true" /></Link>
        </div>

        <div className="fmm-roadmap-category-grid">
          {mobileSections.map((section) => (
            <button
              type="button"
              key={section.key}
              className={`fmm-roadmap-category-card is-${section.key} ${
                activeSection?.key === section.key ? "is-active" : ""
              }`}
              onClick={() => selectSport(section.key)}
              aria-label={`Show ${section.label} fights`}
              aria-pressed={activeSection?.key === section.key}
            >
              <span className="fmm-roadmap-category-art">
                <Image
                  src={section.image}
                  alt=""
                  width={198}
                  height={137}
                  sizes="20vw"
                />
              </span>
              <strong>{section.shortLabel}</strong>
              <small>{section.count}</small>
              <span>Play</span>
            </button>
          ))}
        </div>
      </section>

      <section className="fmm-roadmap-featured" aria-labelledby="fmm-roadmap-featured-title">
        <div className="fmm-static-section-heading">
          <h2 id="fmm-roadmap-featured-title">Featured Fights</h2>
          <Link href="/upcomingfights">All Posters <FaArrowRight aria-hidden="true" /></Link>
        </div>
        {featuredPosterFights.length ? (
          <div className="fmm-roadmap-poster-rail">
            {featuredPosterFights.map((fight, index) => (
              <button
                type="button"
                className="fmm-roadmap-poster-card"
                key={getFightId(fight) || `featured-poster-${index}`}
                onClick={() => setSelectedFeaturedFight?.(fight)}
                aria-label={`Open ${getFightTitle(fight)}`}
              >
                <FightImage
                  src={getHomeFightPosterImage(fight)}
                  alt={`${getFightTitle(fight)} fight poster`}
                  width={420}
                  height={560}
                  sizes="(max-width: 767px) 36vw, 180px"
                />
                <span>{getLockLabel(fight, now)}</span>
              </button>
            ))}
          </div>
        ) : (
          <Link href="/upcomingfights" className="fmm-roadmap-empty-posters">
            Upcoming fight posters are loading <FaArrowRight aria-hidden="true" />
          </Link>
        )}
      </section>

      <section
        id="mobile-selected-fights"
        className="fmm-static-fights-section fmm-roadmap-fights"
        aria-labelledby="fmm-static-fights-title"
      >
        <div className="fmm-static-section-heading">
          <h2 id="fmm-static-fights-title">{activeSection?.label} Fights</h2>
          <Link href={getHomeSportViewAllHref(activeSection?.key)}>
            View All <FaArrowRight aria-hidden="true" />
          </Link>
        </div>

        {matchStatus === "loading" && (
          <div className="fmm-static-fights-state">Refreshing live fights…</div>
        )}
        {matchStatus === "failed" && matchError && (
          <div className="fmm-static-fights-state is-error">{matchError}</div>
        )}

        <div className="fmm-static-live-layout">
          <button
            type="button"
            className={`fmm-static-live-fight ${getCategoryClass(featuredFight)}`}
            onClick={() => {
              if (hasOpenFeaturedFight) setSelectedFeaturedFight?.(actualFeaturedFight);
            }}
            disabled={!hasOpenFeaturedFight}
          >
            <div className="fmm-static-live-title">
              <strong>Live Fight</strong>
              <span><i /> {hasOpenFeaturedFight ? fightPlayerNumber(actualFeaturedFight) : 0} players</span>
            </div>
            <div className="fmm-static-live-faceoff">
              <div className="fmm-static-live-fighter is-left">
                <FightImage
                  src={getHomeFighterImage(featuredFight, "A", 0)}
                  alt={fighterA}
                  width={280}
                  height={360}
                  sizes="(max-width: 767px) 30vw, 160px"
                />
              </div>
              <div className="fmm-static-live-copy">
                <span>{hasOpenFeaturedFight ? getMobileEventLabel(actualFeaturedFight) : activeSection?.label}</span>
                <h3>
                  {hasOpenFeaturedFight ? fighterA : "No Open"}
                  <em>{hasOpenFeaturedFight ? "VS" : "Fights"}</em>
                  {hasOpenFeaturedFight ? fighterB : "Right Now"}
                </h3>
                <p>{hasOpenFeaturedFight ? getLockLabel(actualFeaturedFight, now) : "Check upcoming events"}</p>
              </div>
              <div className="fmm-static-live-fighter is-right">
                <FightImage
                  src={getHomeFighterImage(featuredFight, "B", 1)}
                  alt={fighterB}
                  width={280}
                  height={360}
                  sizes="(max-width: 767px) 30vw, 160px"
                />
              </div>
            </div>
          </button>

          <article className="fmm-static-community-card fmm-roadmap-community-card">
            <div className="fmm-static-community-head">
              <h3>Community Predictions</h3>
              <span>{predictionSummary.total} picks</span>
            </div>
            <div className="fmm-static-community-grid">
              <div className="fmm-static-community-winner">
                <span>Winner</span>
                <strong>{fighterA}</strong>
                <b>{predictionSummary.winnerA}%</b>
                <small>{fighterB} {predictionSummary.winnerB}%</small>
              </div>
              <div className="fmm-static-community-method">
                <span>Method</span>
                {predictionSummary.methods.map((row, index) => (
                  <div key={row.label}>
                    <label>{row.label}</label>
                    <i className={index === 0 ? "is-red" : index === 1 ? "is-blue" : "is-purple"}>
                      <b style={{ width: `${row.value}%` }} />
                    </i>
                    <strong>{row.value}%</strong>
                  </div>
                ))}
              </div>
              <div className="fmm-static-community-rounds">
                <span>Round</span>
                {predictionSummary.rounds.map((row) => (
                  <div key={`round-${row.label}`}>
                    <label>{row.label}</label>
                    <i><b style={{ width: `${row.value}%` }} /></i>
                    <strong>{row.value}%</strong>
                  </div>
                ))}
              </div>
            </div>
            {!predictionSummary.total && (
              <Link href={hasOpenFeaturedFight ? getFightDetailHref(actualFeaturedFight) : "/upcomingfights"} className="fmm-roadmap-first-pick">
                Be the first to predict <FaArrowRight aria-hidden="true" />
              </Link>
            )}
          </article>
        </div>

        <div className="fmm-static-fight-rail">
          {remainingFights.map((fight, index) => (
            <button
              type="button"
              key={getFightId(fight) || `mobile-selected-fight-${index}`}
              className={`fmm-static-fight-card ${getCategoryClass(fight)}`}
              onClick={() => setSelectedFeaturedFight?.(fight)}
            >
              <div className="fmm-static-fight-card-top">
                <span>{getMobileEventLabel(fight)}</span>
                <small>{getLockLabel(fight, now)}</small>
              </div>
              <div className="fmm-static-fight-card-faceoff">
                <FightImage
                  src={getHomeFighterImage(fight, "A", index)}
                  alt={getHomeFighterName(fight, "A")}
                  width={220}
                  height={280}
                  sizes="(max-width: 767px) 26vw, 120px"
                />
                <b>VS</b>
                <FightImage
                  src={getHomeFighterImage(fight, "B", index + 1)}
                  alt={getHomeFighterName(fight, "B")}
                  width={220}
                  height={280}
                  sizes="(max-width: 767px) 26vw, 120px"
                />
              </div>
              <h3>{getHomeFighterName(fight, "A")} <em>vs</em> {getHomeFighterName(fight, "B")}</h3>
              <div className="fmm-static-fight-card-footer">
                <strong>{getPrizePool(fight)}</strong>
                <span>{fightPlayerNumber(fight)} players</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="fmm-roadmap-live-dashboard" aria-label="Live game information">
        <Link href="/leaderboard" className="fmm-roadmap-leaderboard-card">
          <div className="fmm-roadmap-leaderboard-head">
            <span><FaCrown aria-hidden="true" /> Live Leaderboard</span>
            <strong><FaDollarSign aria-hidden="true" /> {formatCompact(totalPrize)}</strong>
          </div>
          {liveLeaderboard.length ? (
            <ol>
              {liveLeaderboard.map((player) => (
                <li key={`${player.rank}-${player.name}`}>
                  <b>{player.rank}</b>
                  <span>{player.name}</span>
                  <strong>{player.points.toLocaleString()} pts</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p>Leaderboard updates as players score.</p>
          )}
        </Link>

        <div className="fmm-roadmap-realtime-metrics">
          <Link href="/upcomingfights">
            <FaFire aria-hidden="true" />
            <span><strong>{openMatchesCount}</strong><small>Open Fights</small></span>
          </Link>
          <Link href="/leaderboard">
            <FaUsers aria-hidden="true" />
            <span><strong>{formatCompact(totalPlayers)}</strong><small>Players</small></span>
          </Link>
          <Link href="/fights-rewards">
            <FaTrophy aria-hidden="true" />
            <span><strong>{formatCompact(totalPrize, "$ ")}</strong><small>Prize Pools</small></span>
          </Link>
        </div>
      </section>

      <section className="fmm-roadmap-destinations" aria-labelledby="fmm-roadmap-destinations-title">
        <div className="fmm-static-section-heading">
          <h2 id="fmm-roadmap-destinations-title">Explore MMAdness</h2>
          <small>Live {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "now"}</small>
        </div>
        <div className="fmm-roadmap-destination-grid">
          {roadmapLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} className={item.tone} key={item.href}>
                <Icon aria-hidden="true" />
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                <FaChevronRight aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <Link href="/affiliate-create-account" className="fmm-roadmap-affiliate-bubble">
        <span className="fmm-roadmap-affiliate-pulse" aria-hidden="true" />
        <FaHandshake aria-hidden="true" />
        <div>
          <strong>{openMatchesCount} open matches</strong>
          <small>Promote a fight as an affiliate</small>
        </div>
        <FaArrowRight aria-hidden="true" />
      </Link>

      <nav className="fmm-static-bottom-nav fmm-roadmap-bottom-nav" aria-label="Mobile homepage navigation">
        <Link href="/" className="is-active" aria-label="Home">
          <FaHome aria-hidden="true" />
          <span>Home</span>
        </Link>
        <Link href="/upcomingfights" aria-label="Contests">
          <FaTrophy aria-hidden="true" />
          <span>Contests</span>
        </Link>
        <Link href="/affiliate-create-account" aria-label="Affiliates">
          <FaHandshake aria-hidden="true" />
          <span>Affiliate</span>
        </Link>
        <Link href={primaryCtaHref} className="is-primary" aria-label="Make predictions">
          <span className="fmm-static-bottom-nav-orb">
            <FaBullseye aria-hidden="true" />
          </span>
          <span>Predict</span>
        </Link>
        <Link href={isLoggedIn ? "/YourFights" : "/login"} aria-label="My picks">
          <FaCheck aria-hidden="true" />
          <span>My Picks</span>
        </Link>
        <Link href="/leaderboard" aria-label="Leaderboard">
          <FaCrown aria-hidden="true" />
          <span>Leaders</span>
        </Link>
        <Link href={profileHref} aria-label="Profile">
          <FaUserAlt aria-hidden="true" />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
};



const HomeAnother = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user || state.user);
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
  const [selectedFeaturedFight, setSelectedFeaturedFight] = useState(null);
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
    let hasLoadedOnce = false;

    const loadHomepageFights = async () => {
      if (!hasLoadedOnce) setMatchStatus("loading");
      setMatchError(null);

      try {
        const [summaryResult, predictionResult, promotedResult] =
          await Promise.allSettled([
            fetchPublicHomeSummary({
              fightLimit: HOME_FIGHT_FEED_LIMIT,
              leaderboardLimit: 5,
            }),
            fetchPublicPredictionFights({ limit: HOME_FIGHT_FEED_LIMIT }),
            fetchPromotedHomeFights({ limit: 45 }),
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
        hasLoadedOnce = true;
      } catch (error) {
        if (!active) return;
        if (!hasLoadedOnce) {
          setHomepageMatches([]);
          setPromotedHeroFights([]);
          setMatchStatus("failed");
        } else {
          setMatchStatus("succeeded");
        }
        setMatchError(error.message || "Unable to refresh fights");
      }
    };

    loadHomepageFights();
    const refreshTimer = window.setInterval(loadHomepageFights, 60000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const loadWrestling = () => {
      wrestlingRequest(
        "/api/wrestling/matches?limit=8&status=OPEN,LIVE,SCORING",
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
    };
    const initialTimer = window.setTimeout(loadWrestling, 1800);
    const refreshTimer = window.setInterval(loadWrestling, 60000);

    return () => {
      active = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
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
  const featuredPosterFightPool = useMemo(() => {
    const promoted = promotedHeroFights.map(hydrateHomeFightVisuals);
    const posterBackups = homepageFightPool.filter((fight) =>
      Boolean(getHomeFightPosterImage(fight)),
    );

    return orderFightsForDisplay(
      dedupeHomepageFights([...promoted, ...posterBackups]).filter((fight) =>
        Boolean(getHomeFightPosterImage(fight)),
      ),
    ).slice(0, 45);
  }, [homepageFightPool, promotedHeroFights]);

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
          count: fights.length || tab.fallbackCount || 0,
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

  const primaryFight = featuredPosterFightPool[0] || null;
  const heroSlides = featuredPosterFightPool;
  const activeHeroFight = heroSlides.length
    ? heroSlides[activeHeroIndex % heroSlides.length]
    : primaryFight;
  const activeHeroPoster = getHomeFightPosterImage(activeHeroFight);
  const activeHeroSlideIndex = heroSlides.length
    ? activeHeroIndex % heroSlides.length
    : 0;
  const activeHeroPosition = heroSlides.length ? activeHeroSlideIndex + 1 : 0;
  const featuredThumbSlides = heroSlides.slice(0, 45);
  const selectedFeaturedPoster = getHomeFightPosterImage(selectedFeaturedFight);
  const mobileGreetingName = useMemo(
    () =>
      pickHomeValue(
        currentUser?.firstName,
        currentUser?.username,
        currentUser?.name,
        currentUser?.email?.split?.("@")[0],
        "Fighter",
      ),
    [
      currentUser?.email,
      currentUser?.firstName,
      currentUser?.name,
      currentUser?.username,
    ],
  );

  useEffect(() => {
    setActiveHeroIndex(0);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (!selectedFeaturedFight || typeof window === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedFeaturedFight(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedFeaturedFight]);

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

        <div className="fmm-contest-fighters fmm-upcoming-fighter-stage">
          <figure className="is-red-corner">
            <FightImage
              src={getHomeFighterImage(match, "A", index)}
              alt={getHomeFighterName(match, "A")}
              width={184}
              height={184}
              sizes="(max-width: 760px) 42vw, 92px"
            />
            <figcaption>{getHomeFighterName(match, "A")}</figcaption>
          </figure>
          <span className="fmm-card-vs-pill">VS</span>
          <figure className="is-blue-corner">
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
          greetingName={mobileGreetingName}
          currentUser={currentUser}
          leaderboardRows={liveLeaderboardRows}
          activeFightSport={activeFightSport}
          setActiveFightSport={setActiveFightSport}
          activeHeroFight={activeHeroFight}
          activeHeroIndex={activeHeroIndex}
          setActiveHeroIndex={setActiveHeroIndex}
          setSelectedFeaturedFight={setSelectedFeaturedFight}
          heroSlides={heroSlides}
          homeFightSections={homeFightSections}
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
                  <FaBolt aria-hidden="true" /> Win money fight card
                </div>
                <h1>
                  Pick. Play.
                  <span>
                    <em>Win Big.</em>
                  </span>
                </h1>
                <p className="fmm-hero-subtitle">
                  Step into a premium fight-night arena. Join free, pick winners
                  across Boxing, MMA, Bare-knuckle and Kickboxing, then climb
                  cash-prize leaderboards before the card locks.
                </p>

                <div className="fmm-hero-actions">
                  <Link
                    href={PLAYER_SIGNUP_HREF}
                    className="theme-btn theme-btn-primary"
                  >
                    Sign Up Free <FaArrowRight aria-hidden="true" />
                  </Link>
                  <Link
                    href={
                      activeHeroFight
                        ? getFightDetailHref(activeHeroFight)
                        : "/upcomingfights"
                    }
                    className="theme-btn theme-btn-secondary"
                  >
                    Enter To Win <FaPlay aria-hidden="true" />
                  </Link>
                  <Link
                    href="/mock-game"
                    className="theme-btn theme-btn-secondary fmm-mock-game-link"
                  >
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
                    <span>Fight categories</span>
                  </div>
                </div>

                {activeHeroFight && (
                  <div className="fmm-tonight-callout">
                    <span>Win Big Featured Entry</span>
                    <strong>
                      {activeHeroFight.matchName ||
                        getFightTitle(activeHeroFight)}
                    </strong>
                    <Link href={getFightDetailHref(activeHeroFight)}>
                      Enter this fight <FaArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                )}

                <div className="fmm-proof-strip">
                  <div>
                    <FaGift aria-hidden="true" />
                    <strong>Cash Prizes</strong>
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
                {activeHeroFight ? (
                  <aside
                    key={getFightId(activeHeroFight) || activeHeroIndex}
                    className={`fmm-hero-event-card fmm-promoted-slide-card fmm-featured-fight-banner fmm-featured-poster-carousel ${activeHeroPoster ? "has-fight-poster" : ""}`}
                  >
                    <div className="fmm-featured-carousel-head">
                      <span>
                        <FaDollarSign aria-hidden="true" /> Featured fight
                        posters
                      </span>
                      <strong>
                        {activeHeroPosition} / {heroSlides.length}
                      </strong>
                    </div>

                    {heroSlides.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="fmm-featured-arrow is-left"
                          aria-label="Previous featured fight poster"
                          onClick={() =>
                            setActiveHeroIndex(
                              (current) =>
                                (current - 1 + heroSlides.length) %
                                heroSlides.length,
                            )
                          }
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="fmm-featured-arrow is-right"
                          aria-label="Next featured fight poster"
                          onClick={() =>
                            setActiveHeroIndex(
                              (current) => (current + 1) % heroSlides.length,
                            )
                          }
                        >
                          ›
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="fmm-featured-poster-shell"
                      onClick={() => setSelectedFeaturedFight(activeHeroFight)}
                      aria-label={`Open premium details for ${getFightTitle(activeHeroFight)}`}
                    >
                      <span className="fmm-featured-poster-frame">
                        <FightImage
                          src={activeHeroPoster}
                          alt={`${getFightTitle(activeHeroFight)} featured fight poster`}
                          width={1080}
                          height={1440}
                          priority
                          sizes="(max-width: 1180px) 90vw, 46vw"
                        />
                      </span>
                    </button>

                    <div className="fmm-featured-carousel-foot">
                      <span>Click the poster for full fight details</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFeaturedFight(activeHeroFight)
                        }
                      >
                        Open details <FaArrowRight aria-hidden="true" />
                      </button>
                    </div>

                    {featuredThumbSlides.length > 1 && (
                      <div
                        className="fmm-featured-poster-thumbs"
                        aria-label="Featured fight poster thumbnails"
                      >
                        {featuredThumbSlides.map((fight, index) => (
                          <button
                            key={getFightId(fight) || `featured-thumb-${index}`}
                            type="button"
                            className={
                              index === activeHeroSlideIndex ? "is-active" : ""
                            }
                            onClick={() => setActiveHeroIndex(index)}
                            aria-label={`Show featured poster ${index + 1}`}
                          >
                            <FightImage
                              src={getHomeFightPosterImage(fight)}
                              alt=""
                              width={96}
                              height={128}
                              sizes="64px"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </aside>
                ) : (
                  <aside
                    className="fmm-hero-event-card fmm-promoted-slide-card fmm-featured-fight-banner fmm-featured-poster-carousel fmm-hero-loading-card"
                    role="status"
                    aria-live="polite"
                  >
                    <div
                      className="fmm-premium-loader-orbit"
                      aria-hidden="true"
                    >
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="fmm-premium-loader-copy">
                      <span>Syncing live cards</span>
                      <strong>
                        Building the featured fight poster rail...
                      </strong>
                      <p>
                        Pulling up to 45 promoted posters for the homepage
                        banner.
                      </p>
                    </div>
                    <div className="fmm-premium-loader-bars" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  </aside>
                )}
              </div>
            </div>
          </section>

          {selectedFeaturedFight && (
            <div
              className="fmm-featured-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedFeaturedFight(null);
                }
              }}
            >
              <section
                className="fmm-featured-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="featured-fight-modal-title"
              >
                <button
                  type="button"
                  className="fmm-featured-modal-close"
                  aria-label="Close featured fight details"
                  onClick={() => setSelectedFeaturedFight(null)}
                >
                  ×
                </button>

                <div
                  className="fmm-featured-modal-poster"
                  aria-hidden={!selectedFeaturedPoster}
                >
                  {selectedFeaturedPoster ? (
                    <FightImage
                      src={selectedFeaturedPoster}
                      alt={`${getFightTitle(selectedFeaturedFight)} fight poster`}
                      width={900}
                      height={1200}
                      sizes="(max-width: 760px) 86vw, 36vw"
                    />
                  ) : (
                    <FightImage
                      src={getHomeFighterImage(selectedFeaturedFight, "A", 0)}
                      alt={getHomeFighterName(selectedFeaturedFight, "A")}
                      width={900}
                      height={1200}
                      sizes="(max-width: 760px) 86vw, 36vw"
                    />
                  )}
                </div>

                <div className="fmm-featured-modal-copy">
                  <span className="fmm-featured-modal-kicker">
                    <FaDollarSign aria-hidden="true" /> Win money featured fight
                  </span>
                  <h2 id="featured-fight-modal-title">
                    {selectedFeaturedFight.matchName ||
                      getFightTitle(selectedFeaturedFight)}
                  </h2>
                  <p>
                    {getHomeFighterName(selectedFeaturedFight, "A")} vs{" "}
                    {getHomeFighterName(selectedFeaturedFight, "B")}
                  </p>

                  <div className="fmm-featured-modal-meta">
                    <span>
                      <FaCalendarAlt aria-hidden="true" />{" "}
                      {formatDateTime(selectedFeaturedFight)}
                    </span>
                    <span>
                      <FaBullseye aria-hidden="true" />{" "}
                      {getFightSportLabel(selectedFeaturedFight)}
                    </span>
                    <span>
                      <FaUsers aria-hidden="true" />{" "}
                      {getPlayerCount(selectedFeaturedFight).toLocaleString()}{" "}
                      players
                    </span>
                    <span>
                      <FaCoins aria-hidden="true" />{" "}
                      {getPotTokenLabel(selectedFeaturedFight)}
                    </span>
                    <span>
                      <FaTrophy aria-hidden="true" />{" "}
                      {getPrizePool(selectedFeaturedFight)}
                    </span>
                    <span>
                      <FaShieldAlt aria-hidden="true" />{" "}
                      {selectedFeaturedFight.matchStatus ||
                        selectedFeaturedFight.matchShadowOpenStatus ||
                        "Open"}
                    </span>
                  </div>

                  <div className="fmm-featured-modal-actions">
                    <Link
                      href={PLAYER_SIGNUP_HREF}
                      className="theme-btn theme-btn-primary"
                      onClick={() => setSelectedFeaturedFight(null)}
                    >
                      Enter To Win <FaArrowRight aria-hidden="true" />
                    </Link>
                    <Link
                      href={getFightDetailHref(selectedFeaturedFight)}
                      className="theme-btn theme-btn-secondary"
                      onClick={() => setSelectedFeaturedFight(null)}
                    >
                      View Full Fight <FaPlay aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          )}

          <main className="theme-container fmm-home-main">
            <section
              className="fmm-active-section"
              aria-labelledby="active-contests-title"
            >
              <div className="fmm-section-title-row">
                <div>
                  <span className="fmm-section-kicker">
                    <FaFire aria-hidden="true" /> Browse fight categories
                  </span>
                  <h2 id="active-contests-title">Browse Fight Categories</h2>
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
                    className={`fmm-home-fight-tab-card is-${section.key} ${
                      activeFightSport === section.key ? "is-active" : ""
                    }`}
                    onClick={(event) => handleHomeSportJump(section.key, event)}
                  >
                    <span className="fmm-home-tab-art" aria-hidden="true">
                      <Image
                        src={section.image}
                        alt=""
                        width={120}
                        height={88}
                        sizes="120px"
                      />
                    </span>
                    <span className="fmm-home-tab-copy">
                      <span>{section.label}</span>
                      <small>{section.count.toLocaleString()} fights</small>
                    </span>
                    <strong>{section.count.toLocaleString()}</strong>
                  </button>
                ))}
              </div>

              <div className="fmm-home-category-stack">
                {matchStatus === "loading" && (
                  <div className="fmm-empty-card">
                    Loading active contests...
                  </div>
                )}
                {matchStatus === "failed" && (
                  <div className="fmm-empty-card">
                    Unable to load fights: {matchError}
                  </div>
                )}

                {matchStatus !== "loading" &&
                  matchStatus !== "failed" &&
                  homeFightSections.map((section) => {
                    const isExpanded = Boolean(
                      expandedHomeSports?.[section.key],
                    );
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
                  Pro Wrestling remains inside the premium category tabs and
                  appears in its own fight section below.
                </span>
                <div>
                  <Link
                    href="/pro-wrestling"
                    className="theme-btn theme-btn-primary"
                  >
                    Explore pro wrestling <FaArrowRight />
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
                        className={
                          label === "Perfect Fight" ? "is-perfect" : ""
                        }
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
                    <strong>
                      {Number(player.points || 0).toLocaleString()}
                    </strong>
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
        {selectedFeaturedFight && (
          <div
            className="fmm-featured-modal-backdrop fmm-mobile-featured-modal-portal"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedFeaturedFight(null);
              }
            }}
          >
            <section
              className="fmm-featured-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-featured-fight-modal-title"
            >
              <button
                type="button"
                className="fmm-featured-modal-close"
                aria-label="Close featured fight details"
                onClick={() => setSelectedFeaturedFight(null)}
              >
                ×
              </button>

              <div
                className="fmm-featured-modal-poster"
                aria-hidden={!selectedFeaturedPoster}
              >
                {selectedFeaturedPoster ? (
                  <FightImage
                    src={selectedFeaturedPoster}
                    alt={`${getFightTitle(selectedFeaturedFight)} fight poster`}
                    width={900}
                    height={1200}
                    sizes="(max-width: 760px) 86vw, 36vw"
                  />
                ) : (
                  <FightImage
                    src={getHomeFighterImage(selectedFeaturedFight, "A", 0)}
                    alt={getHomeFighterName(selectedFeaturedFight, "A")}
                    width={900}
                    height={1200}
                    sizes="(max-width: 760px) 86vw, 36vw"
                  />
                )}
              </div>

              <div className="fmm-featured-modal-copy">
                <span className="fmm-featured-modal-kicker">
                  <FaDollarSign aria-hidden="true" /> Win money featured fight
                </span>
                <h2 id="mobile-featured-fight-modal-title">
                  {selectedFeaturedFight.matchName ||
                    getFightTitle(selectedFeaturedFight)}
                </h2>
                <p>
                  {getHomeFighterName(selectedFeaturedFight, "A")} vs{" "}
                  {getHomeFighterName(selectedFeaturedFight, "B")}
                </p>

                <div className="fmm-featured-modal-meta">
                  <span>
                    <FaCalendarAlt aria-hidden="true" />{" "}
                    {formatDateTime(selectedFeaturedFight)}
                  </span>
                  <span>
                    <FaBullseye aria-hidden="true" />{" "}
                    {getFightSportLabel(selectedFeaturedFight)}
                  </span>
                  <span>
                    <FaUsers aria-hidden="true" />{" "}
                    {getPlayerCount(selectedFeaturedFight).toLocaleString()}{" "}
                    players
                  </span>
                  <span>
                    <FaCoins aria-hidden="true" />{" "}
                    {getPotTokenLabel(selectedFeaturedFight)}
                  </span>
                  <span>
                    <FaTrophy aria-hidden="true" />{" "}
                    {getPrizePool(selectedFeaturedFight)}
                  </span>
                  <span>
                    <FaShieldAlt aria-hidden="true" />{" "}
                    {selectedFeaturedFight.matchStatus ||
                      selectedFeaturedFight.matchShadowOpenStatus ||
                      "Open"}
                  </span>
                </div>

                <div className="fmm-featured-modal-actions">
                  <Link
                    href={PLAYER_SIGNUP_HREF}
                    className="theme-btn theme-btn-primary"
                    onClick={() => setSelectedFeaturedFight(null)}
                  >
                    Enter To Win <FaArrowRight aria-hidden="true" />
                  </Link>
                  <Link
                    href={getFightDetailHref(selectedFeaturedFight)}
                    className="theme-btn theme-btn-secondary"
                    onClick={() => setSelectedFeaturedFight(null)}
                  >
                    View Full Fight <FaPlay aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
};

export default HomeAnother;
