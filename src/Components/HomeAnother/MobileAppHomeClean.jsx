import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBars,
  FaBell,
  FaBolt,
  FaBullseye,
  FaChartBar,
  FaChartLine,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaCog,
  FaCoins,
  FaComments,
  FaCrown,
  FaEnvelope,
  FaEye,
  FaFire,
  FaFacebookF,
  FaFistRaised,
  FaGift,
  FaGlobe,
  FaHandshake,
  FaInstagram,
  FaHome,
  FaLock,
  FaMedal,
  FaNewspaper,
  FaPlay,
  FaPlus,
  FaQuestionCircle,
  FaRobot,
  FaShareAlt,
  FaShoppingBag,
  FaTiktok,
  FaTwitter,
  FaStar,
  FaTimes,
  FaTrophy,
  FaUser,
  FaUserFriends,
  FaUsers,
  FaVolumeMute,
  FaVolumeUp,
  FaYoutube,
} from "react-icons/fa";

const SIGN_UP_HREF = "/CreateAccount";
const DEFAULT_FIGHT_IMAGE = "/images/hero-fight.webp";
const APP_ASSET_BASE = "/images/mobile-app-v16";
const HANDOFF_ASSET_BASE = "/images/mobile-app-v17";

const CATEGORY_FALLBACKS = {
  boxing: `${HANDOFF_ASSET_BASE}/sport-boxing.jpg`,
  mma: `${HANDOFF_ASSET_BASE}/sport-mma.jpg`,
  bareknuckle: `${HANDOFF_ASSET_BASE}/sport-bareknuckle.jpg`,
  kickboxing: `${HANDOFF_ASSET_BASE}/sport-kickboxing.jpg`,
  "pro-wrestling": `${HANDOFF_ASSET_BASE}/sport-wrestling.jpg`,
};

const SPORT_LABELS = {
  boxing: "Boxing",
  mma: "UFC / MMA",
  bareknuckle: "Bare Knuckle",
  kickboxing: "Kickboxing",
  "pro-wrestling": "Pro Wrestling",
};

const SPORT_ROUTES = {
  boxing: "/fantasy-boxing",
  mma: "/fantasy-mma",
  bareknuckle: "/fantasy-bare-knuckle",
  kickboxing: "/fantasy-kickboxing",
  "pro-wrestling": "/pro-wrestling",
};

const TIME_RANGES = [
  "Under 5 minutes",
  "5:00–9:59",
  "10:00–14:59",
  "15:00–19:59",
  "20:00–29:59",
  "30 minutes or more",
];

const isText = (value) => typeof value === "string" && value.trim().length > 0;

const firstText = (...values) => {
  for (const value of values) {
    if (isText(value)) return value.trim();
  }
  return "";
};

const firstNumber = (...values) => {
  for (const value of values) {
    const normalized =
      typeof value === "string" ? value.replaceAll(",", "").trim() : value;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
};

const nested = (source, paths = []) => {
  for (const path of paths) {
    let current = source;
    for (const part of path.split(".")) current = current?.[part];
    if (isText(current)) return current.trim();
  }
  return "";
};

const getFightId = (fight = {}) =>
  firstText(fight?._id, fight?.id, fight?.matchId, fight?.slug);

const getSportKey = (fight = {}) => {
  const value = firstText(
    fight?.sportKey,
    fight?.fightType,
    fight?.category,
    fight?.sport,
    fight?.genre,
    fight?.matchCategory,
  ).toLowerCase();

  if (value.includes("wrest")) return "pro-wrestling";
  if (value.includes("kick")) return "kickboxing";
  if (value.includes("bare") || value.includes("bkfc")) return "bareknuckle";
  if (value.includes("box")) return "boxing";
  return "mma";
};

const getFighterName = (fight = {}, side = "A") => {
  const isA = side === "A";
  const fighter = isA ? fight?.fighterA : fight?.fighterB;
  const fighterRef = isA ? fight?.fighterAId : fight?.fighterBId;
  return firstText(
    nested(fighter, ["displayName", "name", "fighterName", "fullName"]),
    nested(fighterRef, ["displayName", "name", "fighterName", "fullName"]),
    isA ? fight?.fighterAName : fight?.fighterBName,
    isA ? fight?.fighterOneName : fight?.fighterTwoName,
    isA ? fight?.matchFighterA : fight?.matchFighterB,
    isA ? "Fighter A" : "Fighter B",
  );
};

const getFighterImage = (fight = {}, side = "A", fallbackIndex = 0) => {
  const isA = side === "A";
  const fighter = isA ? fight?.fighterA : fight?.fighterB;
  const fighterRef = isA ? fight?.fighterAId : fight?.fighterBId;
  const direct = firstText(
    isA ? fight?.fighterAPrimaryImage : fight?.fighterBPrimaryImage,
    isA ? fight?.resolvedFighterAImage : fight?.resolvedFighterBImage,
    nested(fighter, [
      "primaryImage",
      "resolvedImage",
      "imageHealth.url",
      "imageHealth.secure_url",
      "profileImage",
      "fighterImage",
      "image",
      "avatar",
    ]),
    nested(fighterRef, [
      "primaryImage",
      "resolvedImage",
      "imageHealth.url",
      "imageHealth.secure_url",
      "profileImage",
      "fighterImage",
      "image",
      "avatar",
    ]),
    isA ? fight?.fighterAImage : fight?.fighterBImage,
    isA ? fight?.matchFighterAImage : fight?.matchFighterBImage,
    isA ? fight?.fighterOneImage : fight?.fighterTwoImage,
  );

  if (direct) return direct;
  const fallbacks = [
    "/images/fmm-experience/fighter-action-red.webp",
    "/images/fmm-experience/fighter-action-blue.webp",
    "/images/fmm-experience/fighter-conor-benn.webp",
    "/images/fmm-experience/fighter-anthony-yarde.webp",
  ];
  return fallbacks[(fallbackIndex + (isA ? 0 : 1)) % fallbacks.length];
};

const getPoster = (fight = {}) =>
  firstText(
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

const getFightHref = (fight = {}) => {
  const id = getFightId(fight);
  return id ? `/fight/${encodeURIComponent(id)}` : "/upcomingfights";
};

const getFightTitle = (fight = {}) =>
  `${getFighterName(fight, "A")} vs ${getFighterName(fight, "B")}`;

const getEventLabel = (fight = {}) =>
  firstText(
    fight?.eventName,
    fight?.promotionName,
    fight?.promotion,
    fight?.organization,
    fight?.organisation,
    fight?.league,
    fight?.title,
    SPORT_LABELS[getSportKey(fight)],
  );

const getPlayers = (fight = {}) =>
  Array.isArray(fight?.userPredictions)
    ? fight.userPredictions.length
    : firstNumber(fight?.players, fight?.entries, fight?.entryCount);

const getPrize = (fight = {}) => {
  const raw = firstText(
    fight?.prizePoolDisplay,
    fight?.prizePool,
    fight?.cashPrize,
    fight?.prize,
  );
  if (raw) return raw.startsWith("$") ? raw : `$${raw}`;
  const value = firstNumber(
    fight?.totalPrizePool,
    fight?.prizeAmount,
    fight?.prizePool,
    fight?.cashPrize,
    fight?.prize,
  );
  return value > 0 ? `$${Math.round(value).toLocaleString("en-US")}` : "Prize TBA";
};

const getEntryFee = (fight = {}) => {
  const fee = firstNumber(
    fight?.entryFee,
    fight?.tokenEntry,
    fight?.tokenCost,
    fight?.buyIn,
  );
  return fee > 0 ? `${fee.toLocaleString("en-US")} FM` : "Free";
};

const getLockDate = (fight = {}) => {
  const raw = firstText(
    fight?.lockAt,
    fight?.lockTime,
    fight?.fightDate,
    fight?.eventDate,
    fight?.startDate,
    fight?.date,
    fight?.scheduledAt,
  );
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatCountdown = (fight = {}, now) => {
  const lockDate = getLockDate(fight);
  if (!lockDate || !(now instanceof Date)) return "Open Now";
  const difference = lockDate.getTime() - now.getTime();
  if (difference <= 0) return "Live Now";
  const days = Math.floor(difference / 86400000);
  const hours = Math.floor((difference % 86400000) / 3600000);
  const minutes = Math.floor((difference % 3600000) / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);
  return `${days}D ${String(hours).padStart(2, "0")}H ${String(minutes).padStart(2, "0")}M ${String(seconds).padStart(2, "0")}S`;
};

const formatCompact = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value || 0);

const SafeImage = ({ src, alt = "", className = "", loading = "lazy" }) => {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={!failed && src ? src : DEFAULT_FIGHT_IMAGE}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
};

const Toggle = ({ checked, label, description, onChange }) => (
  <button type="button" className="fmm-v16-toggle-row" onClick={onChange}>
    <span>
      <strong>{label}</strong>
      <small>{description}</small>
    </span>
    <i className={checked ? "is-on" : ""}><b /></i>
  </button>
);

const MobileAppHomeClean = ({
  currentUser,
  leaderboardRows = [],
  homepageStats = {},
  heroSlides = [],
  homeFightSections = [],
  matchStatus = "idle",
  now,
}) => {
  const [activeScreen, setActiveScreen] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeSport, setActiveSport] = useState("all");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selectedFightId, setSelectedFightId] = useState("");
  const [toast, setToast] = useState("");
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [watchMode, setWatchMode] = useState("rounds");
  const [reactions, setReactions] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, name: "KO_Beast", text: "🔥 this is insane" },
    { id: 2, name: "GrappleGuru", text: "Called it. Red corner all day." },
  ]);
  const [scorecard, setScorecard] = useState({
    a: { hp: 20, bp: 15, tp: 40, kicks: 8, knees: 4, elbows: 2, pm: 6, fm: 1 },
    b: { hp: 18, bp: 12, tp: 35, kicks: 10, knees: 3, elbows: 3, pm: 5, fm: 1 },
    winner: "",
    finish: "",
    timeRange: "",
  });
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    textAlerts: false,
    roundByRound: true,
    sound: true,
    leagueVisibility: "invite",
    wagerLimit: 500,
    autoSettle: true,
    autoPayout: true,
    aiAutoScore: true,
  });
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("fmm-mobile-app-sound");
    if (stored !== null) setSoundEnabled(stored === "true");
    const hashScreen = window.location.hash.replace("#app-", "");
    const valid = [
      "home",
      "contests",
      "predict",
      "leaderboard",
      "leagues",
      "watch",
      "profile",
      "settings",
      "demo",
      "blogs",
    ];
    if (valid.includes(hashScreen)) setActiveScreen(hashScreen);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (activeScreen !== "watch") return undefined;
    const timer = window.setInterval(() => setWatchSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [activeScreen]);

  const userLoggedIn = Boolean(
    currentUser?._id || currentUser?.email || currentUser?.username,
  );
  const isAdmin = ["admin", "super_admin", "superadmin"].includes(
    String(currentUser?.role || currentUser?.userType || "").toLowerCase(),
  );
  const profileHref = userLoggedIn ? "/profile" : SIGN_UP_HREF;
  const tokenBalance = firstNumber(
    currentUser?.tokens,
    currentUser?.walletTokens,
    currentUser?.wallet?.balance,
  );
  const userLevel = Math.max(
    1,
    firstNumber(currentUser?.fightIqLevel, currentUser?.level, 1),
  );
  const userXp = firstNumber(currentUser?.xp, currentUser?.totalXp);
  const nextXp = Math.max(1000, Math.ceil((userXp + 1) / 1000) * 1000);
  const xpPercent = Math.min(100, Math.round((userXp / nextXp) * 100));

  const sections = useMemo(
    () =>
      Object.keys(SPORT_LABELS).map((key) => {
        const existing = homeFightSections.find((section) => section?.key === key);
        const fights = Array.isArray(existing?.fights) ? existing.fights : [];
        return {
          key,
          label: SPORT_LABELS[key],
          route: SPORT_ROUTES[key],
          fights,
          count: fights.length,
          image: CATEGORY_FALLBACKS[key],
        };
      }),
    [homeFightSections],
  );

  const allFights = useMemo(() => {
    const source = [
      ...(Array.isArray(heroSlides) ? heroSlides : []),
      ...sections.flatMap((section) => section.fights),
    ];
    const unique = [];
    const seen = new Set();
    source.forEach((fight) => {
      if (!fight) return;
      const key = getFightId(fight) || getFightTitle(fight);
      if (!key || seen.has(key)) return;
      seen.add(key);
      unique.push(fight);
    });
    return unique;
  }, [heroSlides, sections]);

  const filteredFights = useMemo(
    () =>
      activeSport === "all"
        ? allFights
        : allFights.filter((fight) => getSportKey(fight) === activeSport),
    [activeSport, allFights],
  );

  const featuredFight =
    filteredFights[featuredIndex % Math.max(filteredFights.length, 1)] ||
    allFights[0] ||
    null;
  const selectedFight =
    allFights.find((fight) => getFightId(fight) === selectedFightId) ||
    featuredFight;
  const upcomingFights = filteredFights
    .filter((fight) => fight !== featuredFight)
    .slice(0, 8);

  useEffect(() => {
    setFeaturedIndex(0);
  }, [activeSport]);

  useEffect(() => {
    if (activeScreen !== "home" || filteredFights.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % filteredFights.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [activeScreen, filteredFights.length]);

  const predictions = Array.isArray(featuredFight?.userPredictions)
    ? featuredFight.userPredictions
    : [];
  const fighterAName = featuredFight
    ? getFighterName(featuredFight, "A")
    : "Fighter A";
  const fighterBName = featuredFight
    ? getFighterName(featuredFight, "B")
    : "Fighter B";
  const aWinnerCount = predictions.filter((prediction) => {
    const value = firstText(
      prediction?.winnerPrediction,
      prediction?.predictedWinner,
      prediction?.selectedWinner,
      prediction?.winner,
    ).toLowerCase();
    return value === "a" || value === "fightera" || value === fighterAName.toLowerCase();
  }).length;
  const bWinnerCount = predictions.filter((prediction) => {
    const value = firstText(
      prediction?.winnerPrediction,
      prediction?.predictedWinner,
      prediction?.selectedWinner,
      prediction?.winner,
    ).toLowerCase();
    return value === "b" || value === "fighterb" || value === fighterBName.toLowerCase();
  }).length;
  const winnerTotal = aWinnerCount + bWinnerCount;
  const aPercent = winnerTotal ? Math.round((aWinnerCount / winnerTotal) * 100) : 50;
  const bPercent = 100 - aPercent;

  const methodCounts = predictions.reduce(
    (accumulator, prediction) => {
      const method = firstText(
        prediction?.methodPrediction,
        prediction?.predictedMethod,
        prediction?.finishTypePrediction,
        prediction?.method,
      ).toLowerCase();
      if (method.includes("sub")) accumulator.submission += 1;
      else if (method.includes("decision")) accumulator.decision += 1;
      else if (method) accumulator.ko += 1;
      return accumulator;
    },
    { ko: 0, submission: 0, decision: 0 },
  );
  const methodTotal = methodCounts.ko + methodCounts.submission + methodCounts.decision;
  const methodPercentage = (value) =>
    methodTotal ? Math.round((value / methodTotal) * 100) : 0;

  const leaderboard = (Array.isArray(leaderboardRows) ? leaderboardRows : [])
    .slice(0, 20)
    .map((player, index) => ({
      rank: index + 1,
      name: firstText(
        player?.name,
        player?.username,
        player?.firstName,
        player?.displayName,
        `Player ${index + 1}`,
      ),
      points: firstNumber(player?.points, player?.totalPoints, player?.score),
    }));

  const stats = [
    {
      icon: FaUsers,
      value: formatCompact(
        firstNumber(
          homepageStats?.predictors,
          homepageStats?.totalPredictors,
          homepageStats?.totalPlayers,
          homepageStats?.registeredUsers,
          predictions.length,
        ),
      ),
      label: "Predictors",
      screen: "leaderboard",
    },
    {
      icon: FaTrophy,
      value: getPrize(featuredFight || {}),
      label: "Prize Pools",
      screen: "contests",
    },
    {
      icon: FaBolt,
      value: formatCompact(
        firstNumber(homepageStats?.liveEvents, homepageStats?.activeFights, allFights.length),
      ),
      label: "Live Events",
      screen: "contests",
    },
    { icon: FaChartLine, value: "Live", label: "Leaderboards", screen: "leaderboard" },
    { icon: FaMedal, value: formatCompact(allFights.length), label: "Real Fights", screen: "contests" },
  ];

  const playSound = (kind = "click") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = audioContextRef.current || new AudioContextClass();
      audioContextRef.current = context;
      if (context.state === "suspended") context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const presets = {
        click: [480, 720, 0.07],
        whoosh: [180, 950, 0.22],
        coin: [760, 1320, 0.18],
        reward: [420, 1200, 0.26],
        boom: [110, 58, 0.24],
        cheer: [330, 990, 0.38],
      };
      const [from, to, duration] = presets[kind] || presets.click;
      const started = context.currentTime;
      oscillator.type = kind === "boom" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(from, started);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, to), started + duration);
      gain.gain.setValueAtTime(0.0001, started);
      gain.gain.exponentialRampToValueAtTime(0.07, started + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, started + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(started);
      oscillator.stop(started + duration + 0.02);
    } catch {
      // Sound feedback must never interrupt navigation.
    }
  };

  const interact = (kind = "click") => {
    playSound(kind);
    if (typeof navigator !== "undefined") navigator.vibrate?.(8);
  };

  const goToScreen = (screen, options = {}) => {
    interact(options.sound || "click");
    if (options.fight) setSelectedFightId(getFightId(options.fight));
    if (options.sport) setActiveSport(options.sport);
    setActiveScreen(screen);
    setMenuOpen(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#app-${screen}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const showToast = (message, sound = "click") => {
    interact(sound);
    setToast(message);
  };

  const updateScore = (side, key, value) => {
    setScorecard((current) => ({
      ...current,
      [side]: { ...current[side], [key]: Math.max(0, Number(value) || 0) },
    }));
  };

  const submitPrediction = () => {
    if (!scorecard.winner) {
      showToast("Choose a winner before locking the scorecard.");
      return;
    }
    showToast("Prediction locked. Good luck!", "cheer");
  };

  const renderTopbar = () => (
    <header className={`fmm-v16-topbar ${activeScreen === "home" ? "is-home-overlay" : ""}`}>
      <button
        type="button"
        className="fmm-v16-icon-button"
        aria-label="Open app menu"
        onClick={() => {
          interact();
          setMenuOpen(true);
        }}
      >
        <FaBars />
      </button>
      <div className="fmm-v17-topbar-actions">
        <Link href="/checkout" className="fmm-v16-wallet" onClick={() => interact("coin")}>
          <span>FM</span>
          <strong>{Math.floor(tokenBalance).toLocaleString("en-US")}</strong>
          <i><FaPlus /></i>
        </Link>
        <button
          type="button"
          className="fmm-v17-notification-button"
          aria-label="Open notifications"
          onClick={() => showToast("No new fight alerts right now.")}
        >
          <FaBell />
          <b>{firstNumber(currentUser?.unreadNotifications, currentUser?.notificationCount, 3) || 3}</b>
        </button>
      </div>
    </header>
  );

  const renderBottomNav = () => {
    const items = [
      ["home", "Home", FaHome],
      ["contests", "Contests", FaTrophy],
      ["predict", "Make Predictions", FaBullseye],
      ["leaderboard", "Leaderboard", FaCrown],
      ["profile", "Profile", FaUser],
    ];
    return (
      <nav className="fmm-v16-bottom-nav" aria-label="Mobile app navigation">
        {items.map(([id, label, Icon]) => (
          <button
            type="button"
            key={id}
            className={`${activeScreen === id ? "is-active" : ""} ${id === "predict" ? "is-predict" : ""}`}
            onClick={() => goToScreen(id, { sound: id === "predict" ? "whoosh" : "click" })}
          >
            {id === "predict" ? <i><Icon /></i> : <Icon />}
            <span>{label}</span>
          </button>
        ))}
      </nav>
    );
  };

  const renderSectionHeader = (eyebrow, title, action) => (
    <div className="fmm-v16-section-heading">
      <div><small>{eyebrow}</small><h2>{title}</h2></div>
      {action}
    </div>
  );

  const renderFightArt = (fight, index = 0) => {
    const poster = getPoster(fight);
    if (poster) return <SafeImage src={poster} alt={getFightTitle(fight)} />;
    return (
      <div className="fmm-v16-faceoff-art">
        <SafeImage src={getFighterImage(fight, "A", index)} alt="" />
        <b>VS</b>
        <SafeImage src={getFighterImage(fight, "B", index + 1)} alt="" />
      </div>
    );
  };

  const renderHome = () => {
    const visibleUpcoming = (upcomingFights.length
      ? upcomingFights
      : allFights.filter((fight) => fight !== featuredFight))
      .slice(0, 5);
    const homeLeaderboard = leaderboard.length
      ? leaderboard.slice(0, 4)
      : [
          { rank: 1, name: "FightIQ_King", points: 4850 },
          { rank: 2, name: "KO_Beast", points: 4320 },
          { rank: 3, name: "Prediction_Prof", points: 3915 },
          { rank: 4, name: "You", points: userXp },
        ];
    const featuredPrize = getPrize(featuredFight || {});
    const featuredEntry = getEntryFee(featuredFight || {});
    const featuredEntries = getPlayers(featuredFight || {});

    return (
      <div className="fmm-v17-home">
        <section className="fmm-v17-hero" aria-label="Fantasy MMAdness combat prediction game">
          <img
            className="fmm-v17-hero-image"
            src={`${HANDOFF_ASSET_BASE}/hero-banner-crop.png`}
            alt="Fantasy MMAdness combat prediction game"
          />
          <button
            type="button"
            className="fmm-v17-hero-cta-hotspot"
            aria-label={userLoggedIn ? "Make predictions" : "Join free"}
            onClick={() => goToScreen(userLoggedIn ? "predict" : "demo", { sound: "whoosh", fight: featuredFight })}
          />
          <span className="fmm-v17-hero-glow" aria-hidden="true" />
        </section>

        <section className="fmm-v17-stats" aria-label="Live platform statistics">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <button type="button" key={item.label} onClick={() => goToScreen(item.screen)}>
                <Icon />
                <span><strong>{item.value || "0"}</strong><small>{item.label}</small></span>
                {index < 2 && <em>{index === 0 ? "+842 today" : "+$12,450 today"}</em>}
              </button>
            );
          })}
        </section>

        <section className="fmm-v17-sports" aria-labelledby="fmm-v17-sports-title">
          <div className="fmm-v17-section-line">
            <span>››</span><h2 id="fmm-v17-sports-title">Choose Your Combat Sport</h2><span>‹‹</span>
          </div>
          <div className="fmm-v17-sports-grid">
            {sections.map((section) => (
              <button
                type="button"
                key={section.key}
                className={`is-${section.key}`}
                onClick={() => goToScreen("contests", { sport: section.key, sound: "boom" })}
              >
                <SafeImage src={section.image} alt="" />
                <strong>{section.label}</strong>
                <small><FaUsers /> {section.count.toLocaleString("en-US")}</small>
                <i><b /> Live</i>
              </button>
            ))}
          </div>
        </section>

        <section className="fmm-v17-featured-week">
          <button
            type="button"
            className="fmm-v17-featured-week-card"
            onClick={() => goToScreen("predict", { fight: featuredFight, sound: "boom" })}
          >
            <header><span><FaStar /> Featured This Week</span><em><FaClock /> {featuredFight ? formatCountdown(featuredFight, now) : "Open Soon"}</em></header>
            <div className="fmm-v17-featured-week-body">
              <SafeImage
                src={featuredFight ? getFighterImage(featuredFight, "A", 0) : `${HANDOFF_ASSET_BASE}/transparent-featured-left.png`}
                alt={fighterAName}
                className="is-left"
              />
              <div>
                <small>{featuredFight ? getEventLabel(featuredFight) : "Featured Event"}</small>
                <h3>{fighterAName}<b>vs</b>{fighterBName}</h3>
                <strong>{featuredPrize}<span>Prize Pool</span></strong>
                <em>Make Predictions <FaChevronRight /></em>
              </div>
              <SafeImage
                src={featuredFight ? getFighterImage(featuredFight, "B", 1) : `${HANDOFF_ASSET_BASE}/transparent-featured-right.png`}
                alt={fighterBName}
                className="is-right"
              />
            </div>
          </button>
        </section>

        <section className="fmm-v17-upcoming">
          <div className="fmm-v17-mini-heading"><h2>Upcoming Events</h2><button type="button" onClick={() => goToScreen("contests")}>View All <FaChevronRight /></button></div>
          <div className="fmm-v17-upcoming-rail">
            {visibleUpcoming.map((fight, index) => (
              <button
                type="button"
                key={getFightId(fight) || `${getFightTitle(fight)}-${index}`}
                className={`is-${getSportKey(fight)}`}
                onClick={() => goToScreen("predict", { fight, sound: "click" })}
              >
                <div className="fmm-v17-upcoming-art">{renderFightArt(fight, index)}</div>
                <small>{getEventLabel(fight)}</small>
                <h3>{getFighterName(fight, "A")}<b>vs</b>{getFighterName(fight, "B")}</h3>
                <p>{formatCountdown(fight, now)}</p>
                <strong>{getPrize(fight)}</strong>
                <span>Enter Now</span>
              </button>
            ))}
          </div>
        </section>

        <section className="fmm-v17-command-row">
          <article className="fmm-v17-fight-command">
            <header><span>Featured Fight</span><em>{featuredFight ? getEventLabel(featuredFight) : "Open Fight"}</em></header>
            <button type="button" className="fmm-v17-command-faceoff" onClick={() => goToScreen("predict", { fight: featuredFight, sound: "whoosh" })}>
              <SafeImage src={featuredFight ? getFighterImage(featuredFight, "A", 0) : `${HANDOFF_ASSET_BASE}/transparent-fd-jones.png`} alt={fighterAName} />
              <h3>{fighterAName}<b>vs</b>{fighterBName}</h3>
              <SafeImage src={featuredFight ? getFighterImage(featuredFight, "B", 1) : `${HANDOFF_ASSET_BASE}/transparent-fd-aspinall.png`} alt={fighterBName} />
            </button>
            <div className="fmm-v17-command-meta">
              <span><small>Prize Pool</small><strong>{featuredPrize}</strong></span>
              <span><small>Entry Fee</small><strong>{featuredEntry}</strong></span>
              <span><small>Entries</small><strong>{featuredEntries.toLocaleString("en-US")}</strong></span>
            </div>
            <button type="button" className="fmm-v17-command-cta" onClick={() => goToScreen("predict", { fight: featuredFight, sound: "whoosh" })}>Make Predictions</button>
          </article>

          <article className="fmm-v17-community">
            <h2>Community Predictions</h2>
            <div className="fmm-v17-community-body">
              <div className="fmm-v17-community-winner">
                <small>Who will win?</small>
                <strong>{fighterAName}<b>{aPercent}%</b></strong>
                <div className="fmm-v17-community-donut" style={{ "--a-percent": `${aPercent}%` }} />
                <em>{fighterBName}<b>{bPercent}%</b></em>
              </div>
              <div className="fmm-v17-community-methods">
                <small>How will it end?</small>
                {[
                  ["KO / TKO", methodPercentage(methodCounts.ko)],
                  ["Submission", methodPercentage(methodCounts.submission)],
                  ["Decision", methodPercentage(methodCounts.decision)],
                ].map(([label, value]) => (
                  <div key={label}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><em>{value}%</em></div>
                ))}
              </div>
            </div>
          </article>

          <article className="fmm-v17-progression">
            <h2>Your Progression</h2>
            <div><FaCrown /><span><small>Fight IQ</small><strong>{userXp.toLocaleString("en-US")} XP</strong></span></div>
            <i><b style={{ width: `${xpPercent}%` }} /></i>
            <p>Next level: {nextXp.toLocaleString("en-US")} XP</p>
            <strong><FaMedal /> Legend <em>Level {userLevel}</em></strong>
          </article>
        </section>

        <section className="fmm-v17-rewards-row">
          <button
            type="button"
            className={rewardClaimed ? "is-claimed" : ""}
            onClick={() => {
              if (!rewardClaimed) {
                setRewardClaimed(true);
                showToast("Daily reward claimed: +250 FM", "reward");
              }
            }}
          >
            <h3>Daily Reward</h3>
            <img src={`${HANDOFF_ASSET_BASE}/chest-transparent.png`} alt="Daily reward chest" />
            <span>{rewardClaimed ? "Claimed" : "Claim Reward"}</span>
          </button>
          <Link href="/checkout" onClick={() => interact("coin")}>
            <h3>Coins Wallet</h3>
            <FaCoins />
            <strong>{Math.floor(tokenBalance).toLocaleString("en-US")}</strong>
            <span>Add Coins <FaPlus /></span>
          </Link>
          <button type="button" onClick={() => goToScreen("leaderboard")}>
            <div className="fmm-v17-card-heading"><h3>Leaderboard</h3><em>View All <FaChevronRight /></em></div>
            <ol>{homeLeaderboard.map((player) => <li key={`${player.rank}-${player.name}`} className={player.name.toLowerCase().includes("you") ? "is-you" : ""}><b>{player.rank}</b><span>{player.name}</span><strong>{player.points.toLocaleString("en-US")} pts</strong></li>)}</ol>
          </button>
          <Link href="/fights-rewards" className="fmm-v17-streak" onClick={() => interact("reward")}>
            <h3>Streak Bonus</h3><strong><FaFire /> 7 Day Streak</strong><div>{[1,2,3,4,5,6,7].map((day) => <i key={day}><FaCheck /></i>)}</div><span>+250 FM</span>
          </Link>
        </section>

        <section className="fmm-v17-bottom-content-row">
          <Link href="/apparel" className="fmm-v17-apparel-card" onClick={() => interact()}>
            <div className="fmm-v17-card-heading"><h3>Apparel</h3><em>View All <FaChevronRight /></em></div>
            <div><img src={`${HANDOFF_ASSET_BASE}/apparel-shirt.jpg`} alt="Fantasy MMAdness shirt" /><img src={`${HANDOFF_ASSET_BASE}/apparel-hoodie.jpg`} alt="Fantasy MMAdness hoodie" /><img src={`${HANDOFF_ASSET_BASE}/apparel-cap.jpg`} alt="Fantasy MMAdness cap" /></div>
          </Link>
          <button type="button" className="fmm-v17-blogs-card" onClick={() => goToScreen("blogs")}>
            <div className="fmm-v17-card-heading"><h3>Latest Blogs</h3><em>View All <FaChevronRight /></em></div>
            <div><img src={`${HANDOFF_ASSET_BASE}/blog-1.jpg`} alt="" /><span>Featured fight preview</span></div>
            <div><img src={`${HANDOFF_ASSET_BASE}/blog-2.jpg`} alt="" /><span>5 keys to better picks</span></div>
            <div><img src={`${HANDOFF_ASSET_BASE}/blog-3.jpg`} alt="" /><span>Fight IQ strategy</span></div>
          </button>
          <Link href="/affiliate-create-account" className="fmm-v17-affiliate-card" onClick={() => interact()}>
            <div className="fmm-v17-card-heading"><h3>Affiliates</h3><em>View All <FaChevronRight /></em></div>
            <img src={`${HANDOFF_ASSET_BASE}/handshake-transparent.png`} alt="Affiliate partnership" />
            <strong>Earn Rewards</strong><span>Invite. Earn. Win.</span><em>Learn More</em>
          </Link>
        </section>
      </div>
    );
  };

  const renderContests = () => (
    <section className="fmm-v16-screen">
      {renderSectionHeader(
        "Open Fight Cards",
        "Contests",
        <span className="fmm-v16-open-pill"><i /> {filteredFights.length} Open</span>,
      )}
      <div className="fmm-v16-filter-row">
        <button type="button" className={activeSport === "all" ? "is-active" : ""} onClick={() => setActiveSport("all")}>All</button>
        {sections.map((section) => (
          <button type="button" key={section.key} className={activeSport === section.key ? "is-active" : ""} onClick={() => setActiveSport(section.key)}>{section.label}</button>
        ))}
      </div>
      <div className="fmm-v16-contest-list">
        {(filteredFights.length ? filteredFights : allFights).map((fight, index) => (
          <article key={getFightId(fight) || `${getFightTitle(fight)}-${index}`}>
            <div className="fmm-v16-contest-art">{renderFightArt(fight, index)}<span>{getEventLabel(fight)}</span></div>
            <div className="fmm-v16-contest-copy">
              <small>{SPORT_LABELS[getSportKey(fight)]}</small>
              <h3>{getFighterName(fight, "A")}<em>vs</em>{getFighterName(fight, "B")}</h3>
              <p><FaClock /> {formatCountdown(fight, now)}</p>
              <div><span><small>Prize</small><strong>{getPrize(fight)}</strong></span><span><small>Entry</small><strong>{getEntryFee(fight)}</strong></span><span><small>Players</small><strong>{getPlayers(fight)}</strong></span></div>
              <button type="button" onClick={() => goToScreen("predict", { fight, sound: "whoosh" })}>Open Scorecard <FaChevronRight /></button>
            </div>
          </article>
        ))}
      </div>
      {!allFights.length && <div className="fmm-v16-empty">{matchStatus === "loading" ? "Loading open contests…" : "No open fights are available."}</div>}
    </section>
  );

  const scoreCategories = useMemo(() => {
    const sport = getSportKey(selectedFight || {});
    if (sport === "boxing" || sport === "bareknuckle") {
      return [
        ["hp", "Head Punches", "Count every head-punch attempt thrown."],
        ["bp", "Body Punches", "Count every body-punch attempt thrown."],
        ["tp", "Total Punches", "Enter total punch attempts independently; do not auto-sum HP and BP."],
      ];
    }
    if (sport === "pro-wrestling") {
      return [
        ["hp", "Head Punches", "Count all head-punch attempts during the whole match."],
        ["bp", "Body Punches", "Count all body-punch attempts during the whole match."],
        ["kicks", "Kicks", "Count all kick attempts during the whole match."],
        ["pm", "Power Moves", "Count slams, suplexes, powerbombs and similar power moves."],
        ["fm", "Finishers", "Count signature finisher attempts, whether or not they end the match."],
      ];
    }
    return [
      ["hp", "Head Punches", "Count every head-punch attempt thrown."],
      ["bp", "Body Punches", "Count every body-punch attempt thrown."],
      ["kicks", "Kicks", "Count every kick attempt thrown."],
      ["knees", "Knees", "Count every knee-strike attempt thrown."],
      ["elbows", "Elbows", "Count every elbow-strike attempt thrown."],
    ];
  }, [selectedFight]);

  const renderPredict = () => {
    const fight = selectedFight;
    const sport = getSportKey(fight || {});
    const nameA = fight ? getFighterName(fight, "A") : "Red Corner";
    const nameB = fight ? getFighterName(fight, "B") : "Blue Corner";
    return (
      <section className="fmm-v16-screen">
        {renderSectionHeader(
          "Build Your Scorecard",
          "Make Predictions",
          <button type="button" onClick={() => goToScreen("contests")}><FaChevronLeft /> Fights</button>,
        )}
        <div className="fmm-v16-predict-fight-selector">
          {allFights.slice(0, 8).map((item, index) => (
            <button type="button" key={getFightId(item) || index} className={getFightId(item) === getFightId(fight) ? "is-active" : ""} onClick={() => setSelectedFightId(getFightId(item))}>
              <SafeImage src={getPoster(item) || getFighterImage(item, "A", index)} alt="" /><span>{getFighterName(item, "A")} vs {getFighterName(item, "B")}</span>
            </button>
          ))}
        </div>
        {fight ? (
          <>
            <div className="fmm-v16-scorecard-header">
              <div><SafeImage src={getFighterImage(fight, "A", 0)} alt={nameA} /><strong>{nameA}</strong><small>Red Corner</small></div>
              <span><small>{getEventLabel(fight)}</small><b>VS</b><em>{formatCountdown(fight, now)}</em></span>
              <div><SafeImage src={getFighterImage(fight, "B", 1)} alt={nameB} /><strong>{nameB}</strong><small>Blue Corner</small></div>
            </div>
            <div className="fmm-v16-scorecard-note"><FaQuestionCircle /> All categories count attempts thrown, not only landed strikes.</div>
            <div className="fmm-v16-score-grid">
              {scoreCategories.map(([key, label, description]) => (
                <article key={key}>
                  <header><strong>{label}</strong><small>{description}</small></header>
                  <label><span>{nameA}</span><input type="number" min="0" value={scorecard.a[key] ?? 0} onChange={(event) => updateScore("a", key, event.target.value)} /></label>
                  <label><span>{nameB}</span><input type="number" min="0" value={scorecard.b[key] ?? 0} onChange={(event) => updateScore("b", key, event.target.value)} /></label>
                </article>
              ))}
            </div>
            <div className="fmm-v16-pick-panel">
              <h3>Who wins?</h3>
              <div>
                <button type="button" className={scorecard.winner === "a" ? "is-active is-red" : ""} onClick={() => setScorecard((current) => ({ ...current, winner: "a" }))}>{nameA}</button>
                <button type="button" className={scorecard.winner === "b" ? "is-active is-blue" : ""} onClick={() => setScorecard((current) => ({ ...current, winner: "b" }))}>{nameB}</button>
              </div>
              <h3>Finish type</h3>
              <div>
                {(sport === "pro-wrestling" ? ["Pinfall", "Submission", "Disqualification", "Count-out"] : ["KO / TKO", "Submission", "Decision"]).map((option) => (
                  <button type="button" key={option} className={scorecard.finish === option ? "is-active" : ""} onClick={() => setScorecard((current) => ({ ...current, finish: option }))}>{option}</button>
                ))}
              </div>
              {sport === "pro-wrestling" && (
                <>
                  <h3>Match time range</h3>
                  <div className="is-time-ranges">
                    {TIME_RANGES.map((range) => (
                      <button type="button" key={range} className={scorecard.timeRange === range ? "is-active" : ""} onClick={() => setScorecard((current) => ({ ...current, timeRange: range }))}>{range}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="fmm-v16-ai-note"><FaRobot /><span><strong>AI Scouting Notes</strong><small>Review recent pace, finish tendencies and volume before locking your card. AI notes are guidance, not guaranteed outcomes.</small></span></div>
            <button type="button" className="fmm-v16-primary-cta" onClick={submitPrediction}><FaLock /> Lock Prediction</button>
          </>
        ) : <div className="fmm-v16-empty">Choose an open fight to build a scorecard.</div>}
      </section>
    );
  };

  const renderLeaderboard = () => (
    <section className="fmm-v16-screen">
      {renderSectionHeader("Fight IQ Rankings", "Leaderboard", <span className="fmm-v16-open-pill"><i /> Live</span>)}
      <article className="fmm-v16-hall-of-fame">
        <FaCrown />
        <div><small>Hall of Fame</small><h3>Past Champions</h3><p>Season champions earn permanent belt status.</p></div>
        <FaMedal />
      </article>
      <div className="fmm-v16-podium">
        {(leaderboard.length ? leaderboard.slice(0, 3) : [
          { rank: 1, name: "FightIQ_King", points: 4850 },
          { rank: 2, name: "KO_Beast", points: 4320 },
          { rank: 3, name: "Prediction_Prof", points: 3915 },
        ]).map((player, index) => (
          <article key={player.name} className={index === 0 ? "is-first" : ""}><span>{player.rank}</span><FaCrown /><strong>{player.name}</strong><small>{player.points.toLocaleString("en-US")} pts</small></article>
        ))}
      </div>
      <div className="fmm-v16-ranking-list">
        {(leaderboard.length ? leaderboard : [
          { rank: 1, name: "FightIQ_King", points: 4850 },
          { rank: 2, name: "KO_Beast", points: 4320 },
          { rank: 3, name: "Prediction_Prof", points: 3915 },
          { rank: 4, name: "MMA_Professor", points: 3780 },
          { rank: 18, name: "You", points: userXp },
        ]).map((player) => (
          <article key={`${player.rank}-${player.name}`} className={player.name === "You" ? "is-you" : ""}><b>{player.rank}</b><FaUser /><span>{player.name}</span><strong>{player.points.toLocaleString("en-US")} pts</strong>{player.name === "You" && <em>↑</em>}</article>
        ))}
      </div>
      <button type="button" className="fmm-v16-primary-cta" onClick={() => goToScreen("contests")}><FaTrophy /> Enter a Contest</button>
    </section>
  );

  const renderLeagues = () => (
    <section className="fmm-v16-screen">
      {renderSectionHeader("Compete Together", "Leagues", <Link href="/FantasyLeagues">Full Page <FaChevronRight /></Link>)}
      <article className="fmm-v16-league-alert"><FaBell /><span><strong>Affiliate Fight Alert</strong><small>{allFights.length} fights are open for promotion. Fight-week alerts are generated automatically.</small></span><Link href="/affiliate-create-account">Promote</Link></article>
      <div className="fmm-v16-card-title"><FaCrown /> Fantasy Cards</div>
      <div className="fmm-v16-campaigns">
        {[
          ["Summer Combat Season", "JUL 27 – AUG 25", "$8,500", "200 FM"],
          ["Cross-Genre Cup", "AUG 01 – AUG 31", "$3,100", "100 FM"],
        ].map(([name, span, pot, fee]) => (
          <article key={name}><small>Season-long campaign</small><h3>{name}</h3><p>{span}</p><div><span><small>Pot</small><strong>{pot}</strong></span><span><small>Entry</small><strong>{fee}</strong></span></div><button type="button" onClick={() => showToast("Fantasy Card draft opened.")}>Pick 5 Fighters</button></article>
        ))}
      </div>
      <div className="fmm-v16-card-title"><FaGlobe /> Public Leagues</div>
      <div className="fmm-v16-public-leagues">
        {[
          ["KO_Beast Fight Club", 812, 4200],
          ["FightIQ_King Arena", 1240, 6800],
          ["Weekend Warriors", 340, 1500],
        ].map(([name, members, pot]) => (
          <article key={name}><FaUsers /><span><strong>{name}</strong><small>{members.toLocaleString("en-US")} members · {pot.toLocaleString("en-US")} FM pot</small></span><button type="button" onClick={() => showToast(`Join request sent to ${name}.`)}>Join</button></article>
        ))}
      </div>
      <div className="fmm-v16-card-title"><FaFistRaised /> Head-to-Head Challenges</div>
      <div className="fmm-v16-challenges">
        {[["KO_Beast", 500, "Awaiting opponent"], ["Prediction_Prof", 250, "Your response"], ["GrappleGuru", 100, "Accepted"]].map(([opponent, wager, status]) => (
          <article key={opponent}><FaUserFriends /><span><strong>{opponent}</strong><small>{wager} FM · {status}</small></span><button type="button" onClick={() => showToast(`Challenge with ${opponent} opened.`)}>Open</button></article>
        ))}
      </div>
    </section>
  );

  const renderWatch = () => {
    const minutes = Math.floor(watchSeconds / 60);
    const seconds = String(watchSeconds % 60).padStart(2, "0");
    return (
      <section className="fmm-v16-screen fmm-v16-watch-screen">
        <div className="fmm-v16-watch-bg" aria-hidden="true" />
        {renderSectionHeader("Live Arena", "Watch Party", <span className="fmm-v16-live-label"><i /> Live</span>)}
        <div className="fmm-v16-watch-tabs"><button type="button" className={watchMode === "rounds" ? "is-active" : ""} onClick={() => setWatchMode("rounds")}>Rounds</button><button type="button" className={watchMode === "moments" ? "is-active" : ""} onClick={() => setWatchMode("moments")}>Live Moments</button></div>
        <article className="fmm-v16-watch-score">
          <div><SafeImage src={getFighterImage(featuredFight || {}, "A", 0)} alt="" /><strong>{fighterAName}</strong><b>{41 + Math.floor(watchSeconds / 8)}</b><small>{watchMode === "rounds" ? "Strikes Thrown" : "Crowd Heat"}</small></div>
          <span><small>{getEventLabel(featuredFight || {})}</small><strong>{minutes}:{seconds}</strong><em>{watchMode === "rounds" ? "Round 3 of 5" : "Live Match Time"}</em></span>
          <div><SafeImage src={getFighterImage(featuredFight || {}, "B", 1)} alt="" /><strong>{fighterBName}</strong><b>{33 + Math.floor(watchSeconds / 10)}</b><small>{watchMode === "rounds" ? "Strikes Thrown" : "Crowd Heat"}</small></div>
        </article>
        <div className="fmm-v16-round-track">{[1,2,3,4,5].map((round) => <span key={round} className={round < 3 ? "is-done" : round === 3 ? "is-live" : ""}>{round}</span>)}</div>
        <article className="fmm-v16-your-pick"><span>Your Pick: <strong>{fighterAName}</strong></span><b>+{Math.floor(watchSeconds / 3)} Fight IQ pts</b></article>
        <h3 className="fmm-v16-subheading">Crowd Reactions</h3>
        <div className="fmm-v16-reaction-stage">{reactions.map((reaction) => <span key={reaction.id} style={{ left: `${reaction.x}%` }}>{reaction.emoji}</span>)}</div>
        <div className="fmm-v16-reactions">{["🔥","😱","👏","💥","🥊"].map((emoji) => <button type="button" key={emoji} onClick={() => { interact(); setReactions((items) => [...items.slice(-12), { id: Date.now(), emoji, x: 10 + Math.random() * 80 }]); }}>{emoji}</button>)}</div>
        <h3 className="fmm-v16-subheading">Cage Cam · Watching With Your League</h3>
        <div className="fmm-v16-chat-list">{chatMessages.map((message) => <p key={message.id}><strong>{message.name}</strong>{message.text}</p>)}</div>
        <form className="fmm-v16-chat-form" onSubmit={(event) => { event.preventDefault(); if (!chatDraft.trim()) return; setChatMessages((messages) => [...messages, { id: Date.now(), name: "You", text: chatDraft.trim() }]); setChatDraft(""); interact(); }}><input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="React with your league…" /><button type="submit"><FaComments /></button></form>
      </section>
    );
  };

  const renderProfile = () => (
    <section className="fmm-v16-screen">
      {renderSectionHeader("Your Fight Identity", "Profile", <button type="button" onClick={() => goToScreen("settings")}><FaCog /> Settings</button>)}
      <article className="fmm-v16-profile-hero"><div><FaUser /></div><span><small>Fight IQ Level</small><h2>{userLevel}</h2><strong>{firstText(currentUser?.username, currentUser?.firstName, currentUser?.name, "Fantasy Fighter")}</strong></span><FaCrown /></article>
      <div className="fmm-v16-profile-xp"><span><strong>{userXp.toLocaleString("en-US")} XP</strong><small>Next level: {nextXp.toLocaleString("en-US")} XP</small></span><i><b style={{ width: `${xpPercent}%` }} /></i></div>
      <div className="fmm-v16-profile-stats">
        <article><FaBullseye /><strong>{firstNumber(currentUser?.predictionCount, currentUser?.totalPredictions)}</strong><span>Predictions</span></article>
        <article><FaTrophy /><strong>{firstNumber(currentUser?.wins, currentUser?.correctPredictions)}</strong><span>Wins</span></article>
        <article><FaCoins /><strong>{Math.floor(tokenBalance)}</strong><span>FM Coins</span></article>
        <article><FaFire /><strong>7</strong><span>Day Streak</span></article>
      </div>
      <article className="fmm-v16-fight-iq-receipt"><header><FaCrown /><span><small>Fantasy MMAdness</small><strong>Fight IQ Receipt</strong></span></header><div><span><small>Level</small><strong>{userLevel}</strong></span><span><small>XP</small><strong>{userXp.toLocaleString("en-US")}</strong></span><span><small>Rank</small><strong>#{leaderboard.find((player) => player.name === "You")?.rank || "—"}</strong></span></div><button type="button" onClick={() => showToast("Fight IQ receipt is ready to share.")}><FaShareAlt /> Share Receipt</button></article>
      <Link href={profileHref} className="fmm-v16-primary-cta"><FaUser /> Open Full Account</Link>
    </section>
  );

  const renderSettings = () => (
    <section className="fmm-v16-screen">
      {renderSectionHeader("Preferences", "Settings", <button type="button" onClick={() => goToScreen("profile")}><FaChevronLeft /> Profile</button>)}
      <div className="fmm-v16-settings-group"><h3>Alerts & Experience</h3>
        <Toggle checked={settings.notifications} label="Push Notifications" description="Fight alerts, contest drops and prediction locks." onChange={() => setSettings((current) => ({ ...current, notifications: !current.notifications }))} />
        <Toggle checked={settings.emailAlerts} label="Email Alerts" description="New fights and fight-week reminders." onChange={() => setSettings((current) => ({ ...current, emailAlerts: !current.emailAlerts }))} />
        <Toggle checked={settings.textAlerts} label="Text Alerts" description="Last-call alerts before predictions lock." onChange={() => setSettings((current) => ({ ...current, textAlerts: !current.textAlerts }))} />
        <Toggle checked={settings.roundByRound} label="Round-by-Round Scoring" description="Show live points as each round settles." onChange={() => setSettings((current) => ({ ...current, roundByRound: !current.roundByRound }))} />
        <Toggle checked={soundEnabled} label="Sound Effects" description="Short clicks, coin chimes, cheers and confirmations." onChange={() => { const next = !soundEnabled; setSoundEnabled(next); if (typeof window !== "undefined") window.localStorage.setItem("fmm-mobile-app-sound", String(next)); }} />
      </div>
      <div className="fmm-v16-settings-group"><h3>Challenge Limits</h3><p>Maximum head-to-head wager</p><div className="fmm-v16-option-row">{[100,250,500,1000].map((value) => <button type="button" key={value} className={settings.wagerLimit === value ? "is-active" : ""} onClick={() => setSettings((current) => ({ ...current, wagerLimit: value }))}>{value} FM</button>)}</div><p>League visibility</p><div className="fmm-v16-option-row">{[["invite","Invite Only"],["public","Public"]].map(([value,label]) => <button type="button" key={value} className={settings.leagueVisibility === value ? "is-active" : ""} onClick={() => setSettings((current) => ({ ...current, leagueVisibility: value }))}>{label}</button>)}</div></div>
      {isAdmin && <div className="fmm-v16-admin-tools"><h3><FaLock /> Staff-Only Tools</h3><Toggle checked={settings.autoSettle} label="Auto-Settle Challenges" description="Resolve and pay completed challenges automatically." onChange={() => setSettings((current) => ({ ...current, autoSettle: !current.autoSettle }))} /><Toggle checked={settings.autoPayout} label="Auto-Payout Winnings" description="Credit confirmed winnings immediately." onChange={() => setSettings((current) => ({ ...current, autoPayout: !current.autoPayout }))} /><Toggle checked={settings.aiAutoScore} label="AI Auto-Score Completed Fights" description="Assist staff with completed-fight scorecards." onChange={() => setSettings((current) => ({ ...current, aiAutoScore: !current.aiAutoScore }))} /><button type="button" onClick={() => showToast("AI scoring demo started.")}><FaRobot /> AI-Assisted Scorecard Demo</button><button type="button" onClick={() => showToast("Live Scoring Team workspace opened.")}><FaUsers /> Live Scoring Team</button></div>}
    </section>
  );

  const demoSteps = [
    ["Meet the Fighters", "Review both corners, records and fighting styles."],
    ["Fill the Scorecard", "Predict attempts thrown in every scoring category."],
    ["Round-by-Round Reveal", "Compare your forecast with the official live breakdown."],
    ["Leaderboard Movement", "Watch provisional points move your live rank."],
    ["Post-Fight Recap", "Review the official score, comments and your Fight IQ gain."],
  ];

  const renderDemo = () => (
    <section className="fmm-v16-screen">
      {renderSectionHeader("No Coins Needed", "Free Demo Walkthrough", <button type="button" onClick={() => goToScreen("home")}><FaTimes /> Exit</button>)}
      <div className="fmm-v16-demo-progress">{demoSteps.map((_, index) => <span key={index} className={index <= demoStep ? "is-active" : ""}>{index + 1}</span>)}</div>
      <article className="fmm-v16-demo-card">
        <small>Step {demoStep + 1} of {demoSteps.length}</small>
        <h2>{demoSteps[demoStep][0]}</h2>
        <p>{demoSteps[demoStep][1]}</p>
        {demoStep === 0 && featuredFight && <div className="fmm-v16-demo-faceoff"><SafeImage src={getFighterImage(featuredFight, "A", 0)} alt="" /><b>VS</b><SafeImage src={getFighterImage(featuredFight, "B", 1)} alt="" /></div>}
        {demoStep === 1 && <div className="fmm-v16-demo-score"><span>Head Punches <b>24</b></span><span>Body Punches <b>17</b></span><span>Kicks <b>11</b></span><small>Attempts thrown, not only landed strikes.</small></div>}
        {demoStep === 2 && <div className="fmm-v16-demo-rounds">{[1,2,3,4,5].map((round) => <span key={round} className={round <= 3 ? "is-active" : ""}>R{round}</span>)}</div>}
        {demoStep === 3 && <div className="fmm-v16-demo-rank"><FaChartLine /><strong>#18 → #12</strong><span>+680 provisional Fight IQ points</span></div>}
        {demoStep === 4 && <div className="fmm-v16-demo-recap"><FaTrophy /><strong>Prediction Complete</strong><span>Correct winner · Correct method · +820 XP</span></div>}
      </article>
      <div className="fmm-v16-demo-actions"><button type="button" disabled={demoStep === 0} onClick={() => setDemoStep((step) => Math.max(0, step - 1))}><FaChevronLeft /> Back</button>{demoStep < demoSteps.length - 1 ? <button type="button" onClick={() => { interact(); setDemoStep((step) => step + 1); }}>Continue <FaChevronRight /></button> : <button type="button" onClick={() => goToScreen("contests", { sound: "cheer" })}>Enter Real Contests <FaChevronRight /></button>}</div>
    </section>
  );

  const blogCards = [
    ["Breakdown: The Featured Fight", "Who has the edge?", "/images/fmm-pages/editorial-arena-hd.webp"],
    ["5 Keys to Better Predictions", "Build a sharper scorecard.", "/images/home-premium/fight-action-clash.webp"],
    ["Fight IQ Strategy", "Think like a scorer, not a fan.", "/images/fmm-pages/our-fighters-featured-sharp.webp"],
  ];

  const renderBlogs = () => (
    <section className="fmm-v16-screen">
      {renderSectionHeader("News & Strategy", "Blogs & Fight News", <Link href="/blogs">View All <FaChevronRight /></Link>)}
      <div className="fmm-v16-blog-list">{blogCards.map(([title, description, image]) => <Link href="/blogs" key={title}><SafeImage src={image} alt="" /><span><small>Featured Article</small><h3>{title}</h3><p>{description}</p><em>Read Article <FaChevronRight /></em></span></Link>)}</div>
      <Link href="/checkout" className="fmm-v16-treasure-cta" onClick={() => interact("coin")}><img src={`${APP_ASSET_BASE}/chest-transparent.png`} alt="Treasure chest" /><span><small>Need Fight Coins?</small><strong>Open the Wallet</strong><em>Buy coins and enter contests.</em></span><FaChevronRight /></Link>
    </section>
  );

  const renderScreen = () => {
    switch (activeScreen) {
      case "contests": return renderContests();
      case "predict": return renderPredict();
      case "leaderboard": return renderLeaderboard();
      case "leagues": return renderLeagues();
      case "watch": return renderWatch();
      case "profile": return renderProfile();
      case "settings": return renderSettings();
      case "demo": return renderDemo();
      case "blogs": return renderBlogs();
      default: return renderHome();
    }
  };

  const menuItems = [
    ["home", "Home", FaHome],
    ["contests", "Contests", FaTrophy],
    ["predict", "Make Predictions", FaBullseye],
    ["leaderboard", "Leaderboard", FaCrown],
    ["leagues", "Leagues", FaUsers],
    ["watch", "Watch Party", FaEye],
    ["profile", "Profile", FaUser],
    ["settings", "Settings", FaCog],
    ["demo", "Free Demo", FaPlay],
    ["blogs", "Blogs & Fight News", FaNewspaper],
  ];

  return (
    <div className="fmm-app-v16">
      {renderTopbar()}
      <main className={`fmm-v16-main is-${activeScreen}`}>{renderScreen()}</main>
      {renderBottomNav()}

      <div className={`fmm-v16-drawer-backdrop ${menuOpen ? "is-open" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`fmm-v16-drawer ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <header><img src="/images/mobile-home/game/fantasy-mmadness-updated-logo.png" alt="Fantasy MMAdness" /><button type="button" onClick={() => setMenuOpen(false)}><FaTimes /></button></header>
        <nav>{menuItems.map(([screen, label, Icon]) => <button type="button" key={screen} className={activeScreen === screen ? "is-active" : ""} onClick={() => goToScreen(screen)}><Icon /><span>{label}</span><FaChevronRight /></button>)}</nav>
        <div className="fmm-v16-drawer-links"><Link href="/guides"><FaQuestionCircle /> Rules & Guides</Link><Link href="/contact"><FaEnvelope /> Support</Link><Link href="/apparel"><FaShoppingBag /> Apparel</Link><Link href="/affiliate-create-account"><FaHandshake /> Affiliates</Link></div>
        <button type="button" className="fmm-v16-sound-toggle" onClick={() => { const next = !soundEnabled; setSoundEnabled(next); if (typeof window !== "undefined") window.localStorage.setItem("fmm-mobile-app-sound", String(next)); }}>
          {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}<span>Sound {soundEnabled ? "On" : "Off"}</span><i className={soundEnabled ? "is-on" : ""}><b /></i>
        </button>
      </aside>

      {toast && <div className="fmm-v16-toast">{toast}</div>}
    </div>
  );
};

export default MobileAppHomeClean;
