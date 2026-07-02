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
import { getPublicFightDuplicateKey } from "@/Utils/fightExperience";
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

const HOME_FIGHT_FEED_LIMIT = 200;
const HOME_CATEGORY_PREVIEW_LIMIT = 4;

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
    match?.matchCategoryTwo || match?.effectiveCategory || match?.displayCategory || match?.categoryLabel || match?.matchCategory || "",
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

const hasUsableFightImage = (value) =>
  typeof value === "string" && value.trim() && value.trim().toLowerCase() !== "null";

const getHomepageFightQualityScore = (fight = {}) => {
  const sourceScore = String(fight?.matchType || "").toUpperCase() === "LIVE" ? 600 : 0;
  const imageScore = [fight?.fighterAImage, fight?.fighterBImage, fight?.promotionBackground]
    .filter(hasUsableFightImage).length * 80;
  const playerScore = getPlayerCount(fight) * 2;
  return getMatchPriorityScore(fight) + sourceScore + imageScore + playerScore;
};

const dedupeHomepageFights = (matches = []) => {
  const selected = new Map();

  (Array.isArray(matches) ? matches : []).forEach((fight) => {
    if (!fight) return;
    const key = getPublicFightDuplicateKey(fight) || getFightId(fight) || getFightTitle(fight);
    const current = selected.get(key);
    if (!current || getHomepageFightQualityScore(fight) > getHomepageFightQualityScore(current)) {
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
  const rawTime = String(match?.matchTime || "").trim();
  const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})/);

  if (!rawDate || !timeMatch) return null;

  const [, hour, minute] = timeMatch;
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
  const fighterA = match.matchFighterA || "Fighter A";
  const fighterB = match.matchFighterB || "Fighter B";
  return `${fighterA} vs ${fighterB}`;
};

const getPrizePool = (match) => {
  const amount = Number(match?.pot || 0);
  if (!amount) return "Prize TBA";
  return `$${amount.toLocaleString()}`;
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
  const [homepageLeaderboard, setHomepageLeaderboard] = useState([]);
  const [matchStatus, setMatchStatus] = useState("loading");
  const [matchError, setMatchError] = useState(null);
  const [buttonText, setButtonText] = useState("Send Message");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(null);
  const [activeFightSport, setActiveFightSport] = useState("boxing");
  const [expandedHomeSports, setExpandedHomeSports] = useState({ boxing: true });
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
        const [summaryResult, predictionResult] = await Promise.allSettled([
          fetchPublicHomeSummary({
            fightLimit: HOME_FIGHT_FEED_LIMIT,
            leaderboardLimit: 5,
          }),
          fetchPublicPredictionFights({ limit: HOME_FIGHT_FEED_LIMIT }),
        ]);
        const summary = summaryResult.status === "fulfilled" ? summaryResult.value || {} : {};
        const summaryFights = Array.isArray(summary.featuredFights)
          ? summary.featuredFights
          : [];
        const predictionFights = predictionResult.status === "fulfilled" && Array.isArray(predictionResult.value)
          ? predictionResult.value
          : [];
        const fights = predictionFights.length >= summaryFights.length ? predictionFights : summaryFights;

        if (!active) return;

        setHomepageMatches(orderFightsForDisplay(fights || []));
        setHomepageLeaderboard(Array.isArray(summary.leaderboard) ? summary.leaderboard : []);
        setMatchStatus("succeeded");
      } catch (error) {
        if (!active) return;
        setHomepageMatches([]);
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
      wrestlingRequest("/api/wrestling/matches?limit=3&status=OPEN,LIVE,SCORING")
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
  const homepageFightPool = useMemo(
    () => diversifyFightsBySport(dedupeHomepageFights(orderedMatches)),
    [orderedMatches],
  );
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
    () => homeFightSections.reduce((total, section) => total + section.count, 0),
    [homeFightSections],
  );

  const contestMatches = useMemo(() => {
    const activeSection = homeFightSections.find(
      (section) => section.key === activeFightSport,
    );
    return activeSection?.fights?.slice(0, HOME_CATEGORY_PREVIEW_LIMIT) || [];
  }, [activeFightSport, homeFightSections]);

  const primaryFight = homepageFightPool[0] || null;
  const primaryCountdown = getCountdownParts(primaryFight, now);

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
    setExpandedHomeSports((current) => ({ ...current, [sportKey]: true }));

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
    const isHorizontalDrag = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 4;

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
              src={match.fighterAImage}
              alt={match.matchFighterA || "Fighter A"}
              width={184}
              height={184}
              sizes="(max-width: 760px) 42vw, 92px"
            />
            <figcaption>{match.matchFighterA || "Fighter A"}</figcaption>
          </figure>
          <span>VS</span>
          <figure>
            <FightImage
              src={match.fighterBImage}
              alt={match.matchFighterB || "Fighter B"}
              width={184}
              height={184}
              sizes="(max-width: 760px) 42vw, 92px"
            />
            <figcaption>{match.matchFighterB || "Fighter B"}</figcaption>
          </figure>
        </div>

        <h3>{match.matchName || getFightTitle(match)}</h3>
        <p className="fmm-contest-matchup">
          {match.matchFighterA || "Fighter A"} vs {match.matchFighterB || "Fighter B"}
        </p>

        <div className="fmm-contest-card-meta">
          <span>
            <FaCalendarAlt aria-hidden="true" /> {formatDateTime(match)}
          </span>
          <span>
            <FaUsers aria-hidden="true" /> {getPlayerCount(match).toLocaleString()} Players
          </span>
          <span>
            <FaDollarSign aria-hidden="true" /> {getPrizePool(match)} <small>Prize Pool</small>
          </span>
        </div>

        <div className="fmm-contest-lock">
          <span>Locks In</span>
          <strong>{getLockLabel(match, now)}</strong>
        </div>

        <Link
          href={getFightDetailHref(match)}
          className="fmm-card-action"
        >
          {match.__source === "pro-wrestling"
            ? "Open Wrestling"
            : isFinished
              ? "View Contest"
              : "Enter Free"}{" "}
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
        <section
          className="fmm-home-hero"
          aria-label="Fantasy combat sports hero"
        >
          <div className="theme-container fmm-hero-grid">
            <div className="fmm-hero-copy">
              <div className="fmm-premium-eyebrow">
                <FaBolt aria-hidden="true" /> Live fight feed refreshed from the
                back office
              </div>
              <h1>
                Step Into The Fight.
                <span>
                  Predict. <em>Win.</em> Repeat.
                </span>
              </h1>
              <p className="fmm-hero-subtitle">
                A premium fantasy fight app for MMA, Boxing, Kickboxing,
                Bare-Knuckle, and Pro Wrestling fans. Fresh fights move forward,
                big moments stay visible, and every contest feels ready to play.
              </p>

              <div className="fmm-hero-actions">
                <Link
                  href={primaryFight ? getFightDetailHref(primaryFight) : "/upcomingfights"}
                  className="theme-btn theme-btn-primary"
                >
                  Start Playing <FaPlay aria-hidden="true" />
                </Link>
                <Link
                  href="/calendar-of-fights"
                  className="theme-btn theme-btn-secondary"
                >
                  Fight Calendar <FaCalendarAlt aria-hidden="true" />
                </Link>
              </div>

              <div
                className="fmm-premium-hero-stats"
                aria-label="Fantasy MMAdness live experience stats"
              >
                <div>
                  <strong>{totalHomeFightCount || contestMatches.length || 0}</strong>
                  <span>Fresh fights</span>
                </div>
                <div>
                  <strong>
                    {primaryFight ? getLockLabel(primaryFight, now) : "OPEN"}
                  </strong>
                  <span>Next lock</span>
                </div>
                <div>
                  <strong>5</strong>
                  <span>Combat modes</span>
                </div>
              </div>

              {primaryFight && (
                <div className="fmm-tonight-callout">
                  <span>Featured now</span>
                  <strong>
                    {primaryFight.matchName || getFightTitle(primaryFight)}
                  </strong>
                  <Link href={getFightDetailHref(primaryFight)}>
                    Play this fight free <FaArrowRight aria-hidden="true" />
                  </Link>
                </div>
              )}

              <div className="fmm-proof-strip">
                <div>
                  <FaGift aria-hidden="true" />
                  <strong>100% Free</strong>
                  <span>To play</span>
                </div>
                <div>
                  <FaTrophy aria-hidden="true" />
                  <strong>Real Prizes</strong>
                  <span>Every week</span>
                </div>
                <div>
                  <FaCoins aria-hidden="true" />
                  <strong>Fast &amp; Easy</strong>
                  <span>Payouts</span>
                </div>
                <div>
                  <FaShieldAlt aria-hidden="true" />
                  <strong>Secure &amp; Fair</strong>
                  <span>Platform</span>
                </div>
              </div>
            </div>

            <div className="fmm-hero-fight-area">
              {primaryFight && (
                <aside className="fmm-hero-event-card">
                  <div className="fmm-hero-event-main">
                    <p>Fresh Featured Fight</p>
                    <h2>
                      <span>{primaryFight.matchFighterA}</span>
                      <small>vs</small>
                      <span>{primaryFight.matchFighterB}</span>
                    </h2>
                    <div className="fmm-hero-fighters" aria-hidden="true">
                      <FightImage
                        src={primaryFight.fighterAImage}
                        alt=""
                        width={64}
                        height={64}
                        priority
                        sizes="46px"
                      />
                      <span>VS</span>
                      <FightImage
                        src={primaryFight.fighterBImage}
                        alt=""
                        width={64}
                        height={64}
                        priority
                        sizes="46px"
                      />
                    </div>
                    <div className="fmm-hero-event-meta">
                      <FaClock aria-hidden="true" />
                      <span>{formatDateTime(primaryFight)}</span>
                    </div>
                  </div>

                  <div
                    className="fmm-countdown-box"
                    aria-label="Fight countdown"
                  >
                    {primaryCountdown ? (
                      primaryCountdown.map(({ label, value }) => (
                        <div key={label}>
                          <strong>{value}</strong>
                          <span>{label}</span>
                        </div>
                      ))
                    ) : (
                      <div className="fmm-countdown-state">
                        <strong>{primaryFight.matchStatus || "Open"}</strong>
                        <span>{primaryFight.matchName || "Contest"}</span>
                      </div>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </div>
        </section>

        <main className="theme-container fmm-home-main">
          <section
            className="fmm-mobile-fight-app"
            aria-label="Mobile fight app preview"
          >
            <div className="fmm-mobile-app-top">
              <div>
                <span>
                  <FaMobileAlt aria-hidden="true" /> App-style fight feed
                </span>
                <h2>Swipe tonight's fight opportunities.</h2>
              </div>
              <Link href="/upcomingfights" aria-label="Open all fights">
                <FaChevronRight aria-hidden="true" />
              </Link>
            </div>
            <div
              className="fmm-mobile-app-chips"
              role="tablist"
              aria-label="Homepage fight sport filters"
            >
              {HOME_FIGHT_SPORT_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  className={activeFightSport === tab.key ? "is-active" : ""}
                  onClick={(event) => handleHomeSportJump(tab.key, event)}
                >
                  {tab.label.replace(" Fights", "")}
                  <small>{sportCounts[tab.key] || 0}</small>
                </button>
              ))}
            </div>
          </section>

          <section
            className="fmm-active-section"
            aria-labelledby="active-contests-title"
          >
            <div className="fmm-section-title-row">
              <div>
                <span className="fmm-section-kicker">
                  <FaFire aria-hidden="true" /> Fresh fight opportunities
                </span>
                <h2 id="active-contests-title">Active Contests</h2>
              </div>
              <div className="fmm-section-actions">
                <span className="fmm-swipe-hint">Tap a section below</span>
                <Link href="/upcomingfights">
                  View fight page <FaArrowRight aria-hidden="true" />
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
                  className={activeFightSport === section.key ? "is-active" : ""}
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
                  const hasMore = section.fights.length > HOME_CATEGORY_PREVIEW_LIMIT;

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
                            <FaBullseye aria-hidden="true" /> {section.count} contest{section.count === 1 ? "" : "s"}
                          </span>
                          <h3>{section.label} section</h3>
                          <p>Newest uploaded fights appear first in this section.</p>
                        </div>
                        <div className="fmm-home-sport-section-actions">
                          {hasMore && (
                            <button
                              type="button"
                              onClick={() => toggleHomeSportSection(section.key)}
                            >
                              {isExpanded ? "Show less" : `Open all ${section.label}`}
                            </button>
                          )}
                          <Link href="/upcomingfights">
                            View page <FaArrowRight aria-hidden="true" />
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
                            No {section.label.toLowerCase()} contests are currently available.
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
    </>
  );
};

export default HomeAnother;
