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
  FaClock,
  FaCoins,
  FaChevronRight,
  FaCrown,
  FaDollarSign,
  FaFire,
  FaGift,
  FaPlay,
  FaShieldAlt,
  FaStar,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";

const FALLBACK_FIGHT_IMAGE = "/images/hero-fight.webp";
const HOME_HERO_IMAGE = "/images/home-premium/arena-faceoff.webp";
const HOME_FIGHT_ART_IMAGE = "/images/home-premium/fight-action-clash.webp";
const HOME_WRESTLING_IMAGE =
  "/images/pro-wrestling/wrestling-live-premium.webp";
const MOBILE_HOME_WRESTLING_IMAGE = "/images/pro-wrestling/hero.webp";

const HOME_FIGHT_SPORT_TABS = [
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
  {
    key: "pro-wrestling",
    label: "Pro Wrestling",
    image: "/images/pro-wrestling/hero.webp",
  },
];

const MOBILE_HOME_SPORT_TABS = [
  {
    key: "boxing",
    label: "Boxing",
    image: "/images/mobile-home/categories/boxing.png",
    fallbackCount: 128,
  },
  {
    key: "mma",
    label: "MMA",
    image: "/images/mobile-home/categories/mma.png",
    fallbackCount: 214,
  },
  {
    key: "bareknuckle",
    label: "Bare-knuckle",
    image: "/images/mobile-home/categories/bare-knuckle.png",
    fallbackCount: 36,
  },
  {
    key: "kickboxing",
    label: "Kickboxing",
    image: "/images/mobile-home/categories/kickboxing.png",
    fallbackCount: 58,
  },
  {
    key: "pro-wrestling",
    label: "Pro Wrestling",
    image: "/images/pro-wrestling/hero.webp",
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

const HOME_FIGHT_FEED_LIMIT = 200;
const HOME_CATEGORY_PREVIEW_LIMIT = 4;
const PLAYER_SIGNUP_HREF = "/CreateAccount";

const FightCategoryIcon = ({ type }) => {
  const key = String(type || "").toLowerCase();

  if (key.includes("pro") || key.includes("wrestling")) {
    return (
      <svg className="fmm-fight-category-svg" viewBox="0 0 64 64" role="img" aria-hidden="true">
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
      <svg className="fmm-fight-category-svg" viewBox="0 0 64 64" role="img" aria-hidden="true">
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
      <svg className="fmm-fight-category-svg" viewBox="0 0 64 64" role="img" aria-hidden="true">
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
      <svg className="fmm-fight-category-svg" viewBox="0 0 64 64" role="img" aria-hidden="true">
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
    <svg className="fmm-fight-category-svg" viewBox="0 0 64 64" role="img" aria-hidden="true">
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

const MOBILE_FALLBACK_MATCHUPS = [
  {
    eventLabel: "UFC 319",
    matchFighterA: "Conor McGregor",
    matchFighterB: "Max Holloway",
    matchDate: "2099-07-11",
    matchTime: "21:00",
    pot: 25000,
    players: 1245,
  },
  {
    eventLabel: "UFC 319",
    matchFighterA: "Usman",
    matchFighterB: "Diaz",
    matchDate: "2099-07-15",
    matchTime: "22:00",
    pot: 10000,
    players: 598,
  },
  {
    eventLabel: "UFC 319",
    matchFighterA: "Volkanovski",
    matchFighterB: "Topuria",
    matchDate: "2099-07-16",
    matchTime: "20:00",
    pot: 5000,
    players: 321,
  },
];

const getMobileFallbackFight = (sportKey = "mma", index = 0) => {
  const label = MOBILE_FALLBACK_SPORT_LABELS[sportKey] || "Combat";
  const matchup = MOBILE_FALLBACK_MATCHUPS[index % MOBILE_FALLBACK_MATCHUPS.length];
  const pot = matchup.pot;

  return {
    _id: `mobile-${sportKey}-preview-${index}`,
    eventLabel: matchup.eventLabel,
    matchName: `${matchup.matchFighterA} vs ${matchup.matchFighterB}`,
    matchFighterA: matchup.matchFighterA,
    matchFighterB: matchup.matchFighterB,
    fighterAImage: MOBILE_FALLBACK_FIGHT_IMAGES[index % MOBILE_FALLBACK_FIGHT_IMAGES.length],
    fighterBImage: MOBILE_FALLBACK_FIGHT_IMAGES[(index + 1) % MOBILE_FALLBACK_FIGHT_IMAGES.length],
    matchCategory: label,
    matchCategoryTwo: label,
    matchStatus: "Open",
    matchDate: matchup.matchDate,
    matchTime: matchup.matchTime,
    pot,
    currentPot: pot,
    entryFee: [10, 5, 5][index % 3],
    userPredictions: Array.from({ length: matchup.players }),
  };
};



const getMobileEventLabel = (match = {}) => {
  const eventPattern = /\b(?:UFC|BKFC|PFL|BELLATOR|GLORY|ONE|WWE|AEW|NXT)\s*\d+\b/i;
  const eventNameMatch = String(match?.eventName || match?.matchName || "").match(eventPattern)?.[0];
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

  return rawLabel ? rawLabel.toUpperCase() : getFightSportLabel(match).toUpperCase();
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
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
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
  const visible = Array.isArray(fights) ? fights.filter(Boolean).slice(0, limit) : [];
  if (visible.length) return visible;
  return Array.from({ length: limit }, (_, index) =>
    getMobileFallbackFight(sportKey, index),
  );
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

const MobilePhoneHome = ({
  greetingName,
  activeFightSport,
  setActiveFightSport,
  activeHeroFight,
  activeHeroIndex,
  setActiveHeroIndex,
  heroSlides,
  homeFightSections,
  matchError,
  matchStatus,
  now,
  handleSubmit,
  isSubmitting,
  buttonText,
}) => {
  const mobileSections = useMemo(
    () =>
      MOBILE_HOME_SPORT_TABS.map((tab) => {
        const existing = homeFightSections.find((section) => section.key === tab.key);
        return {
          ...tab,
          count: existing?.count || tab.fallbackCount || 0,
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
  const heroSlideCount = mobileHeroSlides.length || 1;
  const safeMobileHeroIndex = activeHeroIndex % heroSlideCount;
  const mobileHeroFight =
    activeHeroFight ||
    mobileHeroSlides[safeMobileHeroIndex] ||
    getMobileFallbackFight(activeSection?.key || "mma", 0);
  const dateChip = getMobileDateChip(mobileHeroFight);
  const mobileOpenContests = selectedUpcomingFights.slice(0, 3);
  const visibleHeroDots = mobileHeroSlides.slice(0, 4);
  const mobileCountdownParts = getMobileCountdownDisplay(
    mobileHeroFight,
    now,
  );
  const mobileFightRailRef = useHorizontalDragScroll();
  const mobileContestRailRef = useHorizontalDragScroll();
  const wrestlingHref = "/pro-wrestling";

  return (
    <div className="fmm-mobile-home" aria-label="Fantasy MMAdness mobile homepage">
      <section className="fmm-mobile-featured-card fmm-mobile-signup-hero" aria-label="Featured fight">
        <div className="fmm-mobile-featured-bg" aria-hidden="true" />

        <div className="fmm-mobile-hero-intro">
          <p className="fmm-mobile-greeting">Good Evening, {greetingName || "Fighter"} 👋</p>
          <h1>
            Sign Up Free.
            <span>
              Pick A Fight. <em>Win.</em>
            </span>
          </h1>
          <p className="fmm-mobile-intro-copy">
            A fight-night fantasy arena built for fast picks. Join free, pick winners across every combat category, and chase live leaderboard prizes before the card locks.
          </p>
          <div className="fmm-mobile-intro-actions">
            <Link href={PLAYER_SIGNUP_HREF} className="fmm-mobile-signup-btn">
              Sign Up Free <FaArrowRight aria-hidden="true" />
            </Link>
            <Link href={getFightDetailHref(mobileHeroFight)} className="fmm-mobile-event-btn">
              Enter Featured Event
            </Link>
          </div>
        </div>

        <article className="fmm-mobile-hero-event-card" aria-label="Featured fight details">
          <div className="fmm-mobile-hero-faceoff" aria-hidden="true">
            <figure className="mobile-fighter-avatar is-left">
              <FightImage
                src={getHomeFighterImage(mobileHeroFight, "A", 0)}
                alt={getHomeFighterName(mobileHeroFight, "A")}
                width={240}
                height={260}
                priority
                sizes="46vw"
              />
            </figure>
            <span>VS</span>
            <figure className="mobile-fighter-avatar is-right">
              <FightImage
                src={getHomeFighterImage(mobileHeroFight, "B", 1)}
                alt={getHomeFighterName(mobileHeroFight, "B")}
                width={240}
                height={260}
                priority
                sizes="46vw"
              />
            </figure>
          </div>

          <span className="fmm-mobile-featured-label">Featured Fight</span>
          <div className="fmm-mobile-date-chip" aria-label="Featured fight date">
            <span>{dateChip.month}</span>
            <strong>{dateChip.day}</strong>
            <small>{dateChip.weekday}</small>
          </div>

          <div className="fmm-mobile-event-copy">
            <h2>
              <span>{getHomeFighterName(mobileHeroFight, "A")}</span>
              <em>vs</em>
              <span>{getHomeFighterName(mobileHeroFight, "B")}</span>
            </h2>
            <p>
              <FaCalendarAlt aria-hidden="true" />
              {formatDateTime(mobileHeroFight)}
            </p>
          </div>

          <div className="fmm-mobile-countdown" aria-label="Featured fight countdown">
            {mobileCountdownParts.length > 0 ? (
              mobileCountdownParts.map((part) => (
                <span key={part.label}>
                  <strong>{part.value}</strong>
                  <small>{part.label}</small>
                </span>
              ))
            ) : (
              <>
                <span>
                  <strong>{getFightSportLabel(mobileHeroFight).slice(0, 3).toUpperCase()}</strong>
                  <small>Sport</small>
                </span>
                <span>
                  <strong>{mobileHeroFight?.matchStatus || "Open"}</strong>
                  <small>Status</small>
                </span>
                <span>
                  <strong>{getPlayerCount(mobileHeroFight).toLocaleString()}</strong>
                  <small>Players</small>
                </span>
              </>
            )}
          </div>
        </article>

        <div className="fmm-mobile-dots" aria-label="Featured fight slides">
          {visibleHeroDots.map((fight, index) => (
            <button
              key={getFightId(fight) || `mobile-dot-${index}`}
              type="button"
              aria-label={`Show fight ${index + 1}`}
              className={index === safeMobileHeroIndex ? "is-active" : ""}
              onClick={() => setActiveHeroIndex(index)}
            />
          ))}
        </div>
      </section>

      {matchStatus === "loading" && (
        <div className="fmm-mobile-loading-line" role="status" aria-live="polite">
          <span />
          Syncing premium fight cards...
        </div>
      )}

      <section className="fmm-mobile-category-row" aria-label="Fight categories">
        {mobileSections.map((section) => (
          <button
            type="button"
            key={section.key}
            className={`fmm-mobile-category-tile is-${section.key} ${
              activeSection?.key === section.key ? "is-active" : ""
            }`}
            onClick={() => setActiveFightSport(section.key)}
          >
            <span className="fmm-mobile-category-icon fmm-mobile-category-image" aria-hidden="true">
              <Image
                src={section.image}
                alt=""
                width={86}
                height={72}
                sizes="72px"
              />
            </span>
            <strong>{section.label}</strong>
            <span>{section.count.toLocaleString()} fights</span>
          </button>
        ))}
      </section>

      <section className="fmm-mobile-section fmm-mobile-upcoming" aria-labelledby="mobile-upcoming-title">
        <div className="fmm-mobile-section-heading">
          <h2 id="mobile-upcoming-title">Upcoming Top Fights</h2>
          <Link href={getHomeSportViewAllHref(activeSection?.key)}>
            View All <FaArrowRight aria-hidden="true" />
          </Link>
        </div>

        {matchStatus === "failed" && (
          <div className="fmm-mobile-inline-alert">{matchError}</div>
        )}

        <div className="fmm-mobile-fight-rail" ref={mobileFightRailRef}>
          {selectedUpcomingFights.map((match, index) => (
            <Link
              href={getFightDetailHref(match)}
              className={`fmm-mobile-upcoming-card ${getCategoryClass(match)}`}
              key={getFightId(match) || `${activeSection?.key}-${index}`}
            >
              <div className="fmm-mobile-upcoming-top">
                <span>{getMobileEventLabel(match)}</span>
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
          <h2 id="mobile-open-contests-title">Featured Contests</h2>
          <Link href={getHomeSportViewAllHref(activeSection?.key)}>
            View All <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="fmm-mobile-contest-list" ref={mobileContestRailRef}>
          {mobileOpenContests.map((match, index) => (
            <article className={`fmm-mobile-contest-row ${getCategoryClass(match)}`} key={getFightId(match) || `mobile-contest-${index}`}>
              <Link href={getFightDetailHref(match)} className="fmm-mobile-contest-visual">
                <span>{["Live", "Featured", "Top Prize"][index % 3]}</span>
                <small className="fmm-mobile-contest-event-label">{getMobileEventLabel(match)}</small>
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
                    <small>Players</small>
                    <strong>{getPlayerCount(match).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
              <Link href={getFightDetailHref(match)} className="fmm-mobile-join">
                Join Now <FaArrowRight aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="fmm-mobile-wrestling-spotlight" aria-label="Pro wrestling spotlight">
        <div className="fmm-mobile-wrestling-copy">
          <h2>Pro Wrestling is now part of Fantasy MMAdness.</h2>
          <p>Predict huge punches, body slams, kicks, power moves and win big!</p>
          <Link href={wrestlingHref}>
            Explore Wrestling <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="fmm-mobile-wrestling-visual" aria-hidden="true">
          <Image
            src={MOBILE_HOME_WRESTLING_IMAGE}
            alt=""
            fill
            sizes="(max-width: 767px) 62vw"
          />
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

      <section className="fmm-mobile-premium-flow" aria-label="How Fantasy MMAdness works">
        <div className="fmm-mobile-section-heading">
          <h2>How To Win</h2>
          <Link href="/guides">Rules <FaArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="fmm-mobile-flow-grid">
          {[
            ["01", "Pick", "Choose the winner, method and round before lock."],
            ["02", "Score", "Earn points as every punch, takedown and finish lands."],
            ["03", "Climb", "Move up the leaderboard and chase premium prizes."],
          ].map(([step, title, copy]) => (
            <article key={title}>
              <span>{step}</span>
              <strong>{title}</strong>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fmm-mobile-fight-art-spotlight" aria-label="Fight night experience">
        <Image
          src={HOME_FIGHT_ART_IMAGE}
          alt="Fantasy MMAdness fight night action"
          fill
          sizes="(max-width: 767px) 100vw"
        />
        <div>
          <span>Live Fight Night</span>
          <h2>Premium cards. Fast picks. Real leaderboard heat.</h2>
          <Link href="/upcomingfights">Explore Fights <FaArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="fmm-mobile-contact-card" aria-labelledby="mobile-contact-title">
        <div className="fmm-mobile-section-heading">
          <h2 id="mobile-contact-title">Contact Us</h2>
        </div>
        <p>Questions about contests, sponsors or fight cards? Send a message and the team will follow up.</p>
        <form onSubmit={handleSubmit}>
          <input type="text" name="fullName" placeholder="Full name" required />
          <input type="email" name="email" placeholder="Email address" required />
          <input type="text" name="subject" placeholder="Subject" required />
          <textarea name="message" placeholder="Message" required />
          <button type="submit" disabled={isSubmitting}>
            {buttonText || "Send Message"}
          </button>
        </form>
      </section>
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
  const mobileGreetingName = useMemo(
    () =>
      pickHomeValue(
        currentUser?.firstName,
        currentUser?.username,
        currentUser?.name,
        currentUser?.email?.split?.("@")[0],
        "Fighter",
      ),
    [currentUser?.email, currentUser?.firstName, currentUser?.name, currentUser?.username],
  );


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
          greetingName={mobileGreetingName}
          activeFightSport={activeFightSport}
          setActiveFightSport={setActiveFightSport}
          activeHeroFight={activeHeroFight}
          activeHeroIndex={activeHeroIndex}
          setActiveHeroIndex={setActiveHeroIndex}
          heroSlides={heroSlides}
          homeFightSections={homeFightSections}
          matchError={matchError}
          matchStatus={matchStatus}
          now={now}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          buttonText={buttonText}
        />
        <div className="fmm-desktop-home-shell">
          <section
            className="fmm-home-hero"
            aria-label="Fantasy combat sports hero"
          >
          <div className="theme-container fmm-hero-grid">
            <div className="fmm-hero-copy">
              <div className="fmm-premium-eyebrow">
                <FaBolt aria-hidden="true" /> Fantasy fight card
              </div>
              <h1>
                Sign Up Free.
                <span>
                  Pick A Fight. <em>Win.</em>
                </span>
              </h1>
              <p className="fmm-hero-subtitle">
                Step into a premium fight-night arena. Join free, pick winners across Boxing, MMA, Bare-knuckle, Kickboxing and Pro Wrestling, then climb live leaderboards before the card locks.
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
                  Enter Featured Event <FaPlay aria-hidden="true" />
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
              {activeHeroFight ? (
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
                        <Link href={PLAYER_SIGNUP_HREF} className="fmm-featured-primary-cta theme-btn theme-btn-primary">
                          Play Now <FaArrowRight aria-hidden="true" />
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
                    <div className="fmm-featured-status-copy">
                      <span>{activeHeroFight.matchStatus || activeHeroFight.matchShadowOpenStatus || "Ongoing"}</span>
                      <strong>{activeHeroFight.matchName || getFightTitle(activeHeroFight)}</strong>
                      <small>Sign up free and jump into today&apos;s featured fight card.</small>
                    </div>
                    <Link href={PLAYER_SIGNUP_HREF} className="fmm-featured-status-cta fmm-featured-panel-cta">
                      Play Now <FaArrowRight aria-hidden="true" />
                    </Link>
                  </div>

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
              ) : (
                <aside className="fmm-hero-event-card fmm-promoted-slide-card fmm-featured-fight-banner fmm-hero-loading-card" role="status" aria-live="polite">
                  <div className="fmm-premium-loader-orbit" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="fmm-premium-loader-copy">
                    <span>Syncing live cards</span>
                    <strong>Building the featured fight stage...</strong>
                    <p>Pulling promoted matchups, fighter images, dates and contest state.</p>
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
                Predict huge moments, body slams, high-flying moves and win big every week.
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
