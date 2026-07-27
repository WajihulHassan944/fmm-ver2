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
  FaNewspaper,
  FaTshirt,
  FaFistRaised,
  FaGift,
  FaHome,
  FaPlus,
  FaPlay,
  FaShieldAlt,
  FaSignal,
  FaStar,
  FaTimes,
  FaTrophy,
  FaUserAlt,
  FaVolumeMute,
  FaVolumeUp,
  FaUsers,
} from "react-icons/fa";

const FALLBACK_FIGHT_IMAGE = "/images/hero-fight.webp";
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

const getMobileEventLabel = (fight = {}) => {
  const sportKey = getFightSportKey(fight);

  return pickHomeValue(
    fight?.eventLabel,
    fight?.promotionName,
    fight?.eventName,
    fight?.eventTitle,
    fight?.organizationName,
    fight?.organization,
    fight?.leagueName,
    fight?.league,
    fight?.matchCategoryTwo,
    fight?.matchCategory,
    MOBILE_FALLBACK_SPORT_LABELS[sportKey],
    getFightSportLabel(fight),
    "Featured Fight",
  );
};

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
  homepageStats = {},
  setActiveFightSport = () => {},
  setSelectedFeaturedFight = () => {},
  heroSlides = [],
  homeFightSections = [],
  matchStatus = "idle",
  matchError,
  now,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeSport, setActiveSport] = useState("all");
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [communityIndex, setCommunityIndex] = useState(0);
  const [sportPhotoIndex, setSportPhotoIndex] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [streakSeconds, setStreakSeconds] = useState(6 * 60 * 60);
  const audioContextRef = useRef(null);
  const eventCardRefs = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("fmm-mobile-app-sound");
    if (stored !== null) setSoundEnabled(stored === "true");
  }, []);

  useEffect(() => {
    const communityTimer = window.setInterval(
      () => setCommunityIndex((current) => current + 1),
      4500,
    );
    const photoTimer = window.setInterval(
      () => setSportPhotoIndex((current) => current + 1),
      7000,
    );
    const eventTimer = window.setInterval(
      () => setActiveEventIndex((current) => current + 1),
      6500,
    );
    const streakTimer = window.setInterval(
      () => setStreakSeconds((current) => Math.max(0, current - 1)),
      1000,
    );

    return () => {
      window.clearInterval(communityTimer);
      window.clearInterval(photoTimer);
      window.clearInterval(eventTimer);
      window.clearInterval(streakTimer);
    };
  }, []);

  const isLoggedIn = Boolean(
    currentUser?._id || currentUser?.email || currentUser?.username,
  );
  const profileHref = isLoggedIn ? "/profile" : PLAYER_SIGNUP_HREF;
  const picksHref = isLoggedIn ? "/YourFights" : "/login";
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
  const playerXp = Math.max(
    0,
    getSafeMetricNumber(currentUser?.xp, currentUser?.totalXp, 0),
  );
  const nextLevelXp = Math.max(1000, Math.ceil((playerXp + 1) / 1000) * 1000);
  const xpPercent = Math.min(100, Math.round((playerXp / nextLevelXp) * 100));

  const allFights = useMemo(() => {
    const candidates = [
      ...(Array.isArray(heroSlides) ? heroSlides : []),
      ...homeFightSections.flatMap((section) => section?.fights || []),
    ];
    const seen = new Set();
    return orderFightsForDisplay(
      candidates.filter((fight) => {
        if (!fight) return false;
        const key = getFightId(fight) || getFightTitle(fight);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    );
  }, [heroSlides, homeFightSections]);

  const sportSections = useMemo(
    () =>
      HOME_FIGHT_SPORT_TABS.map((tab) => {
        const existing = homeFightSections.find((section) => section.key === tab.key);
        const fights = Array.isArray(existing?.fights) ? existing.fights : [];
        return { ...tab, count: fights.length, fights };
      }),
    [homeFightSections],
  );

  const selectedFights = useMemo(() => {
    if (activeSport === "all") return allFights;
    return sportSections.find((section) => section.key === activeSport)?.fights || [];
  }, [activeSport, allFights, sportSections]);

  const displayFights = selectedFights.length ? selectedFights : allFights;
  const featuredFight = displayFights[0] || null;
  const upcomingFights = displayFights.slice(0, 8);
  const activeUpcomingFight = upcomingFights.length
    ? upcomingFights[activeEventIndex % upcomingFights.length]
    : null;
  const communityFight = displayFights.length
    ? displayFights[communityIndex % displayFights.length]
    : featuredFight;

  useEffect(() => {
    setActiveEventIndex(0);
    setCommunityIndex(0);
  }, [activeSport]);

  useEffect(() => {
    if (!upcomingFights.length) return;
    const activeIndex = activeEventIndex % upcomingFights.length;
    eventCardRefs.current[activeIndex]?.scrollIntoView?.({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeEventIndex, upcomingFights.length]);

  const parsePrizeAmount = (fight) => {
    const parsed = Number(String(getPrizePool(fight) || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const calculatedPrizePool = allFights.reduce(
    (total, fight) => total + parsePrizeAmount(fight),
    0,
  );
  const totalPredictions = allFights.reduce(
    (total, fight) => total + getPlayerCount(fight),
    0,
  );
  const predictorCount = getSafeMetricNumber(
    homepageStats?.predictors,
    homepageStats?.totalPredictors,
    homepageStats?.totalPlayers,
    homepageStats?.registeredUsers,
    totalPredictions,
  );
  const totalPrizePool = getSafeMetricNumber(
    homepageStats?.totalPrizePool,
    homepageStats?.prizePool,
    homepageStats?.totalPrizes,
    calculatedPrizePool,
  );
  const liveEventCount = getSafeMetricNumber(
    homepageStats?.liveEvents,
    homepageStats?.activeFights,
    homepageStats?.openFights,
    allFights.length,
  );
  const liveLeaderboardCount = getSafeMetricNumber(
    homepageStats?.liveLeaderboards,
    homepageStats?.leaderboards,
    leaderboardRows.length,
  );
  const realFightCount = getSafeMetricNumber(
    homepageStats?.realFights,
    homepageStats?.totalFights,
    allFights.length,
  );

  const formatCompact = (value) =>
    new Intl.NumberFormat("en-GB", {
      notation: value >= 1000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(Math.max(0, Number(value) || 0));
  const formatMoney = (value) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "USD",
      notation: value >= 100000 ? "compact" : "standard",
      maximumFractionDigits: 0,
    }).format(Math.max(0, Number(value) || 0));

  const getPredictionMetrics = (fight) => {
    const predictions = Array.isArray(fight?.userPredictions)
      ? fight.userPredictions
      : [];
    const fighterA = getHomeFighterName(fight, "A");
    const fighterB = getHomeFighterName(fight, "B");
    const fighterAKey = fighterA.toLowerCase();
    const fighterBKey = fighterB.toLowerCase();
    let fighterAPicks = 0;
    let fighterBPicks = 0;
    const methods = { ko: 0, submission: 0, decision: 0 };

    predictions.forEach((prediction) => {
      const winner = String(
        prediction?.winnerPrediction ||
          prediction?.predictedWinner ||
          prediction?.selectedWinner ||
          prediction?.winner ||
          "",
      )
        .trim()
        .toLowerCase();
      if (winner === "a" || winner === "fightera" || winner === fighterAKey) {
        fighterAPicks += 1;
      }
      if (winner === "b" || winner === "fighterb" || winner === fighterBKey) {
        fighterBPicks += 1;
      }

      const method = String(
        prediction?.methodPrediction ||
          prediction?.predictedMethod ||
          prediction?.finishTypePrediction ||
          prediction?.method ||
          "",
      ).toLowerCase();
      if (method.includes("sub")) methods.submission += 1;
      else if (method.includes("decision")) methods.decision += 1;
      else if (method) methods.ko += 1;
    });

    const winnerTotal = fighterAPicks + fighterBPicks;
    const methodTotal = methods.ko + methods.submission + methods.decision;
    return {
      fighterA,
      fighterB,
      predictions,
      fighterAPercentage: winnerTotal
        ? Math.round((fighterAPicks / winnerTotal) * 100)
        : 0,
      fighterBPercentage: winnerTotal
        ? 100 - Math.round((fighterAPicks / winnerTotal) * 100)
        : 0,
      methods: {
        ko: methodTotal ? Math.round((methods.ko / methodTotal) * 100) : 0,
        submission: methodTotal
          ? Math.round((methods.submission / methodTotal) * 100)
          : 0,
        decision: methodTotal
          ? Math.round((methods.decision / methodTotal) * 100)
          : 0,
      },
    };
  };

  const featuredMetrics = getPredictionMetrics(featuredFight);
  const communityMetrics = getPredictionMetrics(communityFight);
  const featuredHref = featuredFight
    ? getFightDetailHref(featuredFight)
    : "/upcomingfights";
  const joinHref = isLoggedIn ? featuredHref : PLAYER_SIGNUP_HREF;
  const featuredEntryFee = featuredFight
    ? getSafeMetricNumber(
        featuredFight?.entryFee,
        featuredFight?.tokenEntry,
        featuredFight?.tokenCost,
        featuredFight?.buyIn,
      )
    : 0;
  const featuredEntries = featuredFight ? getPlayerCount(featuredFight) : 0;
  const topLeaderboardRows = (Array.isArray(leaderboardRows) ? leaderboardRows : [])
    .slice(0, 5)
    .map((player, index) => ({
      rank: index + 1,
      name: player?.name || getLeaderboardName(player),
      points: getSafeMetricNumber(player?.points, player?.totalPoints),
    }));

  const categoryArtwork = {
    boxing: "/images/mobile-home/client-v7/category-boxing-art.jpg",
    mma: "/images/mobile-home/client-v7/category-mma-art.jpg",
    bareknuckle: "/images/mobile-home/client-v7/category-bare-knuckle-art.jpg",
    kickboxing: "/images/mobile-home/client-v7/category-kickboxing-art.jpg",
    "pro-wrestling": "/images/mobile-home/client-v7/category-pro-wrestling-art.jpg",
  };
  const sportColours = {
    all: "#f2b544",
    boxing: "#ef4444",
    mma: "#4d8dff",
    bareknuckle: "#f2b544",
    kickboxing: "#22c55e",
    "pro-wrestling": "#a855f7",
  };
  const getSportArtwork = (section) => {
    const dynamicImages = (section?.fights || [])
      .flatMap((fight, fightIndex) => [
        getHomeFighterImage(fight, "A", fightIndex, { allowFallback: false }),
        getHomeFighterImage(fight, "B", fightIndex + 1, { allowFallback: false }),
      ])
      .filter(Boolean);
    if (dynamicImages.length) {
      return dynamicImages[sportPhotoIndex % dynamicImages.length];
    }
    return categoryArtwork[section?.key] || HOME_FIGHT_ART_IMAGE;
  };

  const playFx = (type = "click") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = audioContextRef.current || new AudioContextClass();
      audioContextRef.current = context;
      if (context.state === "suspended") context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startedAt = context.currentTime;
      const presets = {
        click: [480, 620, 0.07, 0.04],
        whoosh: [180, 980, 0.22, 0.08],
        boom: [120, 58, 0.24, 0.1],
        tick: [760, 900, 0.055, 0.035],
        coin: [720, 1380, 0.18, 0.08],
        reward: [420, 1540, 0.28, 0.11],
      };
      const [from, to, duration, volume] = presets[type] || presets.click;
      oscillator.type = type === "boom" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(from, startedAt);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(30, to),
        startedAt + duration,
      );
      gain.gain.setValueAtTime(0.0001, startedAt);
      gain.gain.exponentialRampToValueAtTime(volume, startedAt + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startedAt);
      oscillator.stop(startedAt + duration + 0.02);
    } catch {
      // Audio feedback is optional and must never block navigation.
    }
  };

  const activate = (type = "click", vibration = 0) => {
    playFx(type);
    if (vibration && typeof navigator !== "undefined") {
      navigator.vibrate?.(vibration);
    }
  };
  const toggleSound = () => {
    setSoundEnabled((current) => {
      const next = !current;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("fmm-mobile-app-sound", String(next));
      }
      return next;
    });
  };
  const selectSport = (sportKey) => {
    activate("boom", 10);
    setActiveSport(sportKey);
    if (sportKey !== "all") setActiveFightSport(sportKey);
  };
  const claimReward = () => {
    if (rewardClaimed) return;
    activate("reward", 18);
    setRewardClaimed(true);
    setStreakSeconds(24 * 60 * 60);
  };

  const drawerLinks = [
    ["/", "Home", FaHome],
    ["/upcomingfights", "Open Contests", FaFire],
    ["/mock-game", "Free Demo", FaPlay],
    ["/FantasyLeagues", "Leagues", FaTrophy],
    ["/fantasy-chatroom", "Watch Party", FaUsers],
    ["/leaderboard", "Leaderboard", FaCrown],
    ["/blogs", "Blogs & Fight News", FaNewspaper],
    ["/apparel", "Apparel", FaTshirt],
    ["/affiliate-create-account", "Affiliates", FaHandshake],
    ["/fights-rewards", "Rewards & Coins", FaGift],
    [profileHref, isLoggedIn ? "Profile" : "Create Account", FaUserAlt],
  ];

  const tickerItems = [
    `${formatCompact(predictorCount)} predictors active`,
    `${formatMoney(totalPrizePool)} in prize pools`,
    `${formatCompact(liveEventCount)} open fights`,
    topLeaderboardRows[0]
      ? `${topLeaderboardRows[0].name} leads with ${formatCompact(topLeaderboardRows[0].points)} pts`
      : "Live leaderboard updating",
    featuredFight
      ? `${featuredMetrics.fighterA} vs ${featuredMetrics.fighterB} is open`
      : "New contests arriving soon",
  ];

  const stats = [
    [FaUsers, formatCompact(predictorCount), "Predictors", "/leaderboard", "#a855f7"],
    [FaTrophy, formatMoney(totalPrizePool), "Prize Pools", "/fights-rewards", "#f2b544"],
    [FaSignal, formatCompact(liveEventCount), "Live Events", "/upcomingfights", "#4d8dff"],
    [FaChartLine, formatCompact(liveLeaderboardCount), "Leaderboards", "/leaderboard", "#22c55e"],
    [FaShieldAlt, formatCompact(realFightCount), "Real Fights", "/upcomingfights", "#f2b544"],
  ];

  const blogs = [
    ["UFC fight preview", "What matters before the card locks", "/images/home-premium/arena-faceoff.webp"],
    ["Five keys to better predictions", "Build a smarter fight-night process", "/images/home-premium/fight-action-clash.webp"],
    ["Fight IQ strategy", "Think like a fighter, score like a champion", "/images/pro-wrestling/wrestling-live-premium.webp"],
  ];
  const apparel = [
    ["Fight Tee", "$29.99", "is-tee"],
    ["MMAdness Hoodie", "$49.99", "is-hoodie"],
    ["Snapback", "$24.99", "is-cap"],
  ];

  return (
    <section className="fmm-app-home-v14" aria-label="Fantasy MMAdness mobile app homepage">
      <header className="fmm-app-topbar">
        <button
          type="button"
          className="fmm-app-menu-button"
          aria-label="Open mobile menu"
          aria-expanded={isMenuOpen}
          onClick={() => {
            activate("click", 8);
            setIsMenuOpen(true);
          }}
        >
          <i />
          <i />
          <i />
        </button>

        <div className="fmm-app-topbar-actions">
          <Link href="/checkout" className="fmm-app-wallet" onClick={() => activate("coin") }>
            <span>FM</span>
            <strong>{tokenBalance.toLocaleString("en-GB")}</strong>
            <i><FaPlus aria-hidden="true" /></i>
          </Link>
          <Link href={profileHref} className="fmm-app-profile-button" onClick={() => activate("click") }>
            <FaUserAlt aria-hidden="true" />
            <small>Lv. {playerLevel}</small>
          </Link>
        </div>
      </header>

      <main className="fmm-app-scroll">
        <section className="fmm-app-hero">
          <div className="fmm-app-hero-arena" aria-hidden="true" />
          {featuredFight && (
            <>
              <div className="fmm-app-hero-fighter is-red" aria-hidden="true">
                <FightImage
                  src={getHomeFighterImage(featuredFight, "A", 0)}
                  alt=""
                  width={360}
                  height={520}
                  priority
                  sizes="36vw"
                />
              </div>
              <div className="fmm-app-hero-fighter is-blue" aria-hidden="true">
                <FightImage
                  src={getHomeFighterImage(featuredFight, "B", 1)}
                  alt=""
                  width={360}
                  height={520}
                  priority
                  sizes="36vw"
                />
              </div>
            </>
          )}
          <div className="fmm-app-hero-lights" aria-hidden="true">
            <i className="is-red" />
            <i className="is-blue" />
          </div>
          <div className="fmm-app-hero-content">
            <Image
              src="/images/mobile-home/premium-v9/fantasy-mmadness-clean-logo.png"
              alt="Fantasy MMAdness"
              width={700}
              height={340}
              priority
              sizes="64vw"
            />
            <p>
              Predict every fight.<br />
              Prove your <em>Fight IQ</em>.<br />
              Climb the leaderboard.
            </p>
            <Link
              href={joinHref}
              className="fmm-app-join-button"
              onClick={() => activate("whoosh", 18)}
            >
              Join Free <FaArrowRight aria-hidden="true" />
            </Link>
          </div>
          <span className="fmm-app-camera-flash" aria-hidden="true" />
        </section>

        <section className="fmm-app-ticker" aria-label="Live platform activity">
          <div>
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span key={`${item}-${index}`}><FaBolt aria-hidden="true" /> {item}</span>
            ))}
          </div>
        </section>

        <section className="fmm-app-stats" aria-label="Fantasy MMAdness live statistics">
          {stats.map(([Icon, value, label, href, colour]) => (
            <Link
              href={href}
              key={label}
              style={{ "--stat-colour": colour }}
              onClick={() => activate("tick")}
            >
              <Icon aria-hidden="true" />
              <strong>{value}</strong>
              <span>{label}</span>
            </Link>
          ))}
        </section>

        <section className="fmm-app-section fmm-app-sports">
          <div className="fmm-app-section-heading">
            <div><small>Combat Sports</small><h2>Pick Your Arena</h2></div>
            <Link href="/upcomingfights">View All <FaChevronRight aria-hidden="true" /></Link>
          </div>
          <div className="fmm-app-sports-rail">
            <button
              type="button"
              className={`fmm-app-sport-card is-all ${activeSport === "all" ? "is-active" : ""}`}
              style={{ "--sport-colour": sportColours.all }}
              onClick={() => selectSport("all")}
            >
              <span className="fmm-app-all-sports-icon"><FaFistRaised aria-hidden="true" /></span>
              <strong>All Sports</strong>
              <small>{allFights.length} fights</small>
            </button>
            {sportSections.map((section) => (
              <button
                type="button"
                key={section.key}
                className={`fmm-app-sport-card ${activeSport === section.key ? "is-active" : ""}`}
                style={{ "--sport-colour": sportColours[section.key] }}
                onClick={() => selectSport(section.key)}
              >
                <span className="fmm-app-sport-image">
                  <FightImage
                    src={getSportArtwork(section)}
                    alt=""
                    width={180}
                    height={220}
                    sizes="84px"
                  />
                </span>
                <strong>{section.label}</strong>
                <small><i /> {section.count} live</small>
              </button>
            ))}
          </div>
        </section>

        <section className="fmm-app-featured-card">
          <header>
            <span><FaStar aria-hidden="true" /> Featured This Week</span>
            <small>{featuredFight ? getLockLabel(featuredFight, now) : "Coming Soon"}</small>
          </header>
          {featuredFight ? (
            <Link
              href={featuredHref}
              className="fmm-app-featured-body"
              onClick={() => {
                activate("boom", 14);
                setSelectedFeaturedFight(featuredFight);
              }}
            >
              <div className="fmm-app-featured-fighter is-left">
                <FightImage
                  src={getHomeFighterImage(featuredFight, "A", 0)}
                  alt={featuredMetrics.fighterA}
                  width={260}
                  height={330}
                  sizes="27vw"
                />
              </div>
              <div className="fmm-app-featured-copy">
                <small>{getMobileEventLabel(featuredFight)}</small>
                <h2>{featuredMetrics.fighterA}<em>VS</em>{featuredMetrics.fighterB}</h2>
                <strong>{getPrizePool(featuredFight)} <span>Prize Pool</span></strong>
                <p>{getLockLabel(featuredFight, now)}</p>
                <b>Make Predictions <FaArrowRight aria-hidden="true" /></b>
              </div>
              <div className="fmm-app-featured-fighter is-right">
                <FightImage
                  src={getHomeFighterImage(featuredFight, "B", 1)}
                  alt={featuredMetrics.fighterB}
                  width={260}
                  height={330}
                  sizes="27vw"
                />
              </div>
            </Link>
          ) : (
            <div className="fmm-app-empty-card">Upcoming featured fight will appear here.</div>
          )}
        </section>

        <section className="fmm-app-section fmm-app-upcoming-section">
          <div className="fmm-app-section-heading">
            <div><small>Fight Calendar</small><h2>Upcoming Events</h2></div>
            <Link href={activeSport === "all" ? "/upcomingfights" : getHomeSportViewAllHref(activeSport)}>
              View All <FaChevronRight aria-hidden="true" />
            </Link>
          </div>
          {matchStatus === "loading" && <div className="fmm-app-loading">Loading live fights…</div>}
          {matchStatus === "failed" && <div className="fmm-app-loading is-error">{matchError || "Unable to load fights"}</div>}
          <div className="fmm-app-events-rail">
            {upcomingFights.length ? upcomingFights.map((fight, index) => {
              const poster = getHomeFightPosterImage(fight);
              const active = activeUpcomingFight && getFightId(activeUpcomingFight) === getFightId(fight);
              return (
                <Link
                  href={getFightDetailHref(fight)}
                  key={getFightId(fight) || `app-event-${index}`}
                  ref={(node) => {
                    eventCardRefs.current[index] = node;
                  }}
                  className={`fmm-app-event-card ${active ? "is-active" : ""}`}
                  onClick={() => {
                    activate("tick");
                    setActiveEventIndex(index);
                    setSelectedFeaturedFight(fight);
                  }}
                >
                  <span className="fmm-app-event-poster">
                    {poster ? (
                      <FightImage src={poster} alt={`${getFightTitle(fight)} poster`} width={260} height={360} sizes="128px" />
                    ) : (
                      <span className="fmm-app-event-faceoff">
                        <FightImage src={getHomeFighterImage(fight, "A", index)} alt="" width={120} height={170} sizes="60px" />
                        <b>VS</b>
                        <FightImage src={getHomeFighterImage(fight, "B", index + 1)} alt="" width={120} height={170} sizes="60px" />
                      </span>
                    )}
                  </span>
                  <small>{getMobileEventLabel(fight)}</small>
                  <h3>{getHomeFighterName(fight, "A")}<em>VS</em>{getHomeFighterName(fight, "B")}</h3>
                  <p>{getLockLabel(fight, now)}</p>
                  <strong>{getPrizePool(fight)}</strong>
                  <b>Enter Now</b>
                </Link>
              );
            }) : <div className="fmm-app-empty-card">No open events in this sport yet.</div>}
          </div>
          {upcomingFights.length > 1 && (
            <div className="fmm-app-event-dots" aria-hidden="true">
              {upcomingFights.map((fight, index) => (
                <span key={getFightId(fight) || `event-dot-${index}`} className={index === activeEventIndex % upcomingFights.length ? "is-active" : ""} />
              ))}
            </div>
          )}
        </section>

        <section className="fmm-app-command-grid">
          <article className="fmm-app-fight-command">
            <header><span>Featured Fight</span><small>{featuredFight ? getMobileEventLabel(featuredFight) : "Open Event"}</small></header>
            {featuredFight ? (
              <>
                <div className="fmm-app-command-faceoff">
                  <FightImage src={getHomeFighterImage(featuredFight, "A", 0)} alt={featuredMetrics.fighterA} width={180} height={230} sizes="25vw" />
                  <h3>{featuredMetrics.fighterA}<em>VS</em>{featuredMetrics.fighterB}</h3>
                  <FightImage src={getHomeFighterImage(featuredFight, "B", 1)} alt={featuredMetrics.fighterB} width={180} height={230} sizes="25vw" />
                </div>
                <div className="fmm-app-command-metrics">
                  <span><small>Prize Pool</small><strong>{getPrizePool(featuredFight)}</strong></span>
                  <span><small>Entry Fee</small><strong>{featuredEntryFee ? `${featuredEntryFee} FM` : "Free"}</strong></span>
                  <span><small>Entries</small><strong>{featuredEntries.toLocaleString("en-GB")}</strong></span>
                </div>
                <Link href={featuredHref} onClick={() => activate("whoosh", 14)}>Make Predictions</Link>
              </>
            ) : <div className="fmm-app-empty-card">No featured fight available.</div>}
          </article>

          <article className="fmm-app-community-card">
            <header><span>Community Predictions</span><small>{communityMetrics.predictions.length} Picks</small></header>
            {communityFight ? (
              <>
                <div className="fmm-app-community-main">
                  <div className="fmm-app-vote-donut" style={{ "--vote-a": `${communityMetrics.fighterAPercentage}%` }}>
                    <span>{communityMetrics.fighterAPercentage}%</span>
                  </div>
                  <div className="fmm-app-community-names">
                    <strong>{communityMetrics.fighterA}</strong>
                    <small>{communityMetrics.fighterAPercentage}%</small>
                    <strong>{communityMetrics.fighterB}</strong>
                    <small>{communityMetrics.fighterBPercentage}%</small>
                  </div>
                </div>
                <div className="fmm-app-method-bars">
                  {[
                    ["KO / TKO", communityMetrics.methods.ko, "#ef4444"],
                    ["Submission", communityMetrics.methods.submission, "#4d8dff"],
                    ["Decision", communityMetrics.methods.decision, "#a855f7"],
                  ].map(([label, value, colour]) => (
                    <div key={label}><label>{label}</label><i><b style={{ width: `${value}%`, background: colour }} /></i><span>{value}%</span></div>
                  ))}
                </div>
              </>
            ) : <div className="fmm-app-empty-card">Community picks will appear here.</div>}
          </article>
        </section>

        <section className="fmm-app-promo-row">
          <Link href="/fantasy-chatroom" className="fmm-app-promo-card is-watch" onClick={() => activate("boom") }>
            <Image src="/images/mobile-app-v14/arena-stadium.png" alt="Live combat arena" width={768} height={512} sizes="44vw" />
            <span><small><i /> Live Now</small><strong>Watch Party</strong><em>Live scores and crowd reactions</em></span>
          </Link>
          <Link href="/FantasyLeagues" className="fmm-app-promo-card is-leagues" onClick={() => activate("click") }>
            <Image src="/images/mobile-app-v14/watch-party.png" alt="Friends competing in a fantasy league" width={1000} height={568} sizes="44vw" />
            <span><small>Leagues</small><strong>Challenge Friends</strong><em>Build a league and climb together</em></span>
          </Link>
        </section>

        <Link href="/mock-game" className="fmm-app-demo-banner" onClick={() => activate("whoosh", 12)}>
          <span>New Here?</span>
          <strong>Try a Free Demo Fight</strong>
          <small>No coins needed <FaArrowRight aria-hidden="true" /></small>
        </Link>

        <section className="fmm-app-progress-card">
          <div className="fmm-app-progress-badge">{playerLevel}</div>
          <div className="fmm-app-progress-copy">
            <small>Your Progression</small>
            <strong>Fight IQ {playerXp.toLocaleString("en-GB")} XP</strong>
            <i><b style={{ width: `${xpPercent}%` }} /></i>
            <span>Next level: {nextLevelXp.toLocaleString("en-GB")} XP</span>
          </div>
          <FaCrown aria-hidden="true" />
        </section>

        <section className="fmm-app-rewards-grid">
          <button type="button" className={`fmm-app-reward-card is-daily ${rewardClaimed ? "is-claimed" : ""}`} onClick={claimReward}>
            <Image src="/images/mobile-app-v14/reward-chest.png" alt="Daily reward chest" width={600} height={600} sizes="42vw" />
            <span><small>Daily Reward</small><strong>{rewardClaimed ? "Claimed" : "Claim +250 FM"}</strong></span>
          </button>
          <Link href="/checkout" className="fmm-app-reward-card is-wallet" onClick={() => activate("coin", 10)}>
            <FaCoins aria-hidden="true" />
            <span><small>Coins Wallet</small><strong>{tokenBalance.toLocaleString("en-GB")}</strong><em>Add Coins</em></span>
          </Link>
          <Link href="/leaderboard" className="fmm-app-reward-card is-board" onClick={() => activate("tick") }>
            <Image src="/images/mobile-app-v14/ring-corner.png" alt="Fight leaderboard" width={768} height={512} sizes="42vw" />
            <span><small>Leaderboard</small><strong>{topLeaderboardRows[0]?.name || "Live Rankings"}</strong><em>{topLeaderboardRows[0] ? `${topLeaderboardRows[0].points.toLocaleString("en-GB")} pts` : "View standings"}</em></span>
          </Link>
          <Link href="/fights-rewards" className="fmm-app-reward-card is-streak" onClick={() => activate("reward") }>
            <FaFire aria-hidden="true" />
            <span><small>Streak Bonus</small><strong>7 Day Streak</strong><em>{Math.floor(streakSeconds / 3600)}h {Math.floor((streakSeconds % 3600) / 60)}m left</em></span>
          </Link>
        </section>

        <section className="fmm-app-section fmm-app-apparel-section">
          <div className="fmm-app-section-heading">
            <div><small>Official Shop</small><h2>Apparel</h2></div>
            <Link href="/apparel">View All <FaChevronRight aria-hidden="true" /></Link>
          </div>
          <div className="fmm-app-apparel-rail">
            {apparel.map(([name, price, className]) => (
              <Link href="/apparel" key={name} className={`fmm-app-product-card ${className}`} onClick={() => activate("click") }>
                <span />
                <strong>{name}</strong>
                <small>{price}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="fmm-app-section fmm-app-blogs-section">
          <div className="fmm-app-section-heading">
            <div><small>Fight Intelligence</small><h2>Blogs & Fight News</h2></div>
            <Link href="/blogs">View All <FaChevronRight aria-hidden="true" /></Link>
          </div>
          <div className="fmm-app-blog-list">
            {blogs.map(([title, subtitle, image]) => (
              <Link href="/blogs" key={title} onClick={() => activate("click") }>
                <Image src={image} alt="" width={180} height={130} sizes="90px" />
                <span><strong>{title}</strong><small>{subtitle}</small></span>
                <FaChevronRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className="fmm-app-affiliate-card">
          <Image src="/images/mobile-app-v14/affiliate-handshake.png" alt="Fantasy MMAdness affiliate partnership" width={800} height={500} sizes="62vw" />
          <div>
            <small>Affiliates & Creators</small>
            <h2>You&apos;re the Promoter Now</h2>
            <p>Promote fights, build a league, and earn rewards.</p>
            <Link href="/affiliate-create-account" onClick={() => activate("whoosh")}>Become a Partner <FaArrowRight aria-hidden="true" /></Link>
          </div>
        </section>

        <button type="button" className="fmm-app-chest-cta" onClick={() => { activate("coin", 18); window.location.href = "/checkout"; }}>
          <Image src="/images/mobile-app-v14/reward-chest.png" alt="Add Fantasy MMAdness coins" width={600} height={600} sizes="140px" />
          <span>Add Fight Coins</span>
        </button>
      </main>

      <nav className="fmm-app-bottom-nav" aria-label="Mobile app navigation">
        <Link href="/" className="is-active" onClick={() => activate("click") }><FaHome aria-hidden="true" /><span>Home</span></Link>
        <Link href="/upcomingfights" onClick={() => activate("click") }><FaTrophy aria-hidden="true" /><span>Contests</span></Link>
        <Link href={featuredHref} onClick={() => activate("whoosh", 10)}><FaBullseye aria-hidden="true" /><span>Predict</span></Link>
        <Link href="/leaderboard" onClick={() => activate("click") }><FaCrown aria-hidden="true" /><span>Leaderboard</span></Link>
        <Link href={profileHref} onClick={() => activate("click") }><FaUserAlt aria-hidden="true" /><span>Profile</span></Link>
      </nav>

      <button
        type="button"
        className={`fmm-app-sound-toggle ${soundEnabled ? "is-on" : "is-off"}`}
        aria-label={`Turn sound ${soundEnabled ? "off" : "on"}`}
        aria-pressed={soundEnabled}
        onClick={() => {
          if (!soundEnabled) {
            setSoundEnabled(true);
            if (typeof window !== "undefined") {
              window.localStorage.setItem("fmm-mobile-app-sound", "true");
            }
            window.setTimeout(() => playFx("click"), 0);
            return;
          }
          playFx("click");
          toggleSound();
        }}
      >
        {soundEnabled ? <FaVolumeUp aria-hidden="true" /> : <FaVolumeMute aria-hidden="true" />}
        <span>Sound</span>
      </button>

      {isMenuOpen && (
        <div className="fmm-app-drawer-layer" role="dialog" aria-modal="true" aria-label="Fantasy MMAdness menu">
          <button type="button" className="fmm-app-drawer-backdrop" aria-label="Close menu" onClick={() => setIsMenuOpen(false)} />
          <aside className="fmm-app-drawer">
            <header>
              <Image src="/images/mobile-home/premium-v9/fantasy-mmadness-clean-logo.png" alt="Fantasy MMAdness" width={300} height={145} sizes="180px" />
              <button type="button" aria-label="Close menu" onClick={() => setIsMenuOpen(false)}><FaTimes aria-hidden="true" /></button>
            </header>
            <nav>
              {drawerLinks.map(([href, label, Icon]) => (
                <Link key={`${href}-${label}`} href={href} onClick={() => { activate("click"); setIsMenuOpen(false); }}>
                  <Icon aria-hidden="true" /><span>{label}</span><FaChevronRight aria-hidden="true" />
                </Link>
              ))}
            </nav>
            <button type="button" className="fmm-app-drawer-sound" onClick={toggleSound}>
              {soundEnabled ? <FaVolumeUp aria-hidden="true" /> : <FaVolumeMute aria-hidden="true" />}
              Sound {soundEnabled ? "On" : "Off"}
            </button>
          </aside>
        </div>
      )}
    </section>
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
  const [homepageStats, setHomepageStats] = useState({});
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
    let firstLoad = true;

    const loadHomepageFights = async () => {
      if (firstLoad) setMatchStatus("loading");
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
        setHomepageStats(summary?.stats && typeof summary.stats === "object" ? summary.stats : {});
        setMatchStatus("succeeded");
        firstLoad = false;
      } catch (error) {
        if (!active) return;
        setHomepageMatches([]);
        setPromotedHeroFights([]);
        setHomepageStats({});
        if (firstLoad) setMatchStatus("failed");
        setMatchError(error.message || "Unable to load fights");
        firstLoad = false;
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
    const timer = window.setTimeout(() => {
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
          currentUser={currentUser}
          leaderboardRows={liveLeaderboardRows}
          homepageStats={homepageStats}
          activeFightSport={activeFightSport}
          setActiveFightSport={setActiveFightSport}
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
