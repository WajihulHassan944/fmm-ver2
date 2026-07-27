import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBars,
  FaBell,
  FaBolt,
  FaBullseye,
  FaChartLine,
  FaCheck,
  FaChevronRight,
  FaCoins,
  FaCrown,
  FaFire,
  FaGift,
  FaHandshake,
  FaHome,
  FaMedal,
  FaNewspaper,
  FaPlus,
  FaShoppingBag,
  FaTimes,
  FaTrophy,
  FaUser,
  FaUsers,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";

const SIGN_UP_HREF = "/CreateAccount";
const DEFAULT_FIGHT_IMAGE = "/images/hero-fight.webp";
const CATEGORY_FALLBACKS = {
  boxing: "/images/mobile-home/categories/fmm-category-boxing-reference-v2.png",
  mma: "/images/mobile-home/categories/fmm-category-mma-reference-v2.png",
  bareknuckle:
    "/images/mobile-home/categories/fmm-category-bare-knuckle-reference-v2.png",
  kickboxing:
    "/images/mobile-home/categories/fmm-category-kickboxing-reference-v2.png",
  "pro-wrestling":
    "/images/mobile-home/categories/fmm-category-pro-wrestling-reference-v2.png",
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
  const value = firstNumber(fight?.totalPrizePool, fight?.prizeAmount);
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
  return `${days}D ${String(hours).padStart(2, "0")}H ${String(minutes).padStart(2, "0")}M`;
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

const MobileAppHomeClean = ({
  currentUser,
  leaderboardRows = [],
  homepageStats = {},
  heroSlides = [],
  homeFightSections = [],
  matchStatus = "idle",
  now,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeSport, setActiveSport] = useState("all");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("fmm-mobile-app-sound");
    if (stored !== null) setSoundEnabled(stored === "true");
  }, []);

  const userLoggedIn = Boolean(
    currentUser?._id || currentUser?.email || currentUser?.username,
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

  const sections = useMemo(() => {
    const result = [];
    const known = new Set();
    for (const fallbackKey of Object.keys(SPORT_LABELS)) {
      const existing = homeFightSections.find((section) => section?.key === fallbackKey);
      const fights = Array.isArray(existing?.fights) ? existing.fights : [];
      result.push({
        key: fallbackKey,
        label: SPORT_LABELS[fallbackKey],
        fights,
        count: fights.length,
        image: CATEGORY_FALLBACKS[fallbackKey],
      });
      known.add(fallbackKey);
    }
    return result;
  }, [homeFightSections]);

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

  const filteredFights =
    activeSport === "all"
      ? allFights
      : allFights.filter((fight) => getSportKey(fight) === activeSport);
  const featuredFight = filteredFights[featuredIndex % Math.max(filteredFights.length, 1)] || allFights[0] || null;
  const upcomingFights = filteredFights.filter((fight) => fight !== featuredFight).slice(0, 6);

  useEffect(() => {
    setFeaturedIndex(0);
  }, [activeSport]);

  useEffect(() => {
    if (filteredFights.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % filteredFights.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [filteredFights.length]);

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
      // Sound feedback must never prevent navigation.
    }
  };

  const interact = (kind = "click") => {
    playSound(kind);
    if (typeof navigator !== "undefined") navigator.vibrate?.(8);
  };

  const predictions = Array.isArray(featuredFight?.userPredictions)
    ? featuredFight.userPredictions
    : [];
  const fighterAName = featuredFight ? getFighterName(featuredFight, "A") : "Fighter A";
  const fighterBName = featuredFight ? getFighterName(featuredFight, "B") : "Fighter B";
  const normalizedWinner = (prediction) =>
    firstText(
      prediction?.winnerPrediction,
      prediction?.predictedWinner,
      prediction?.selectedWinner,
      prediction?.winner,
    ).toLowerCase();
  const aWinnerCount = predictions.filter((prediction) => {
    const value = normalizedWinner(prediction);
    return value === "a" || value === "fightera" || value === fighterAName.toLowerCase();
  }).length;
  const bWinnerCount = predictions.filter((prediction) => {
    const value = normalizedWinner(prediction);
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
      href: "/leaderboard",
    },
    {
      icon: FaTrophy,
      value: getPrize(featuredFight || {}),
      label: "Prize Pools",
      href: "/fights-rewards",
    },
    {
      icon: FaBolt,
      value: formatCompact(
        firstNumber(homepageStats?.liveEvents, homepageStats?.activeFights, allFights.length),
      ),
      label: "Live Events",
      href: "/upcomingfights",
    },
    {
      icon: FaChartLine,
      value: "Live",
      label: "Leaderboards",
      href: "/leaderboard",
    },
  ];

  const leaderboard = (Array.isArray(leaderboardRows) ? leaderboardRows : [])
    .slice(0, 4)
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

  const menuItems = [
    ["Home", "/", FaHome],
    ["Contests", "/upcomingfights", FaTrophy],
    ["Make Predictions", featuredFight ? getFightHref(featuredFight) : "/upcomingfights", FaBullseye],
    ["Leaderboard", "/leaderboard", FaCrown],
    ["Fight Coins", "/checkout", FaCoins],
    ["Blogs & News", "/blogs", FaNewspaper],
    ["Apparel", "/apparel", FaShoppingBag],
    ["Affiliates", "/affiliate-create-account", FaHandshake],
  ];

  return (
    <div className="fmm-clean-app-home">
      <section className="fmm-clean-hero">
        <div className="fmm-clean-ambient" aria-hidden="true">
          <i className="is-red" />
          <i className="is-blue" />
          <span className="is-spark-one" />
          <span className="is-spark-two" />
          <span className="is-spark-three" />
        </div>

        <header className="fmm-clean-topbar">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            className="fmm-clean-icon-button"
            onClick={() => {
              interact("click");
              setMenuOpen(true);
            }}
          >
            <FaBars />
          </button>
          <Link href="/checkout" className="fmm-clean-wallet" onClick={() => interact("coin")}>
            <span>FM</span>
            <strong>{Math.floor(tokenBalance).toLocaleString("en-US")}</strong>
            <i><FaPlus /></i>
          </Link>
          <Link href={profileHref} className="fmm-clean-profile" onClick={() => interact("click")}>
            <FaUser />
            <small>Lv. {userLevel}</small>
          </Link>
        </header>

        <div className="fmm-clean-hero-fighters" aria-hidden="true">
          <SafeImage
            src={getFighterImage(featuredFight || {}, "A", 0)}
            alt=""
            className="is-left"
            loading="eager"
          />
          <SafeImage
            src={getFighterImage(featuredFight || {}, "B", 1)}
            alt=""
            className="is-right"
            loading="eager"
          />
        </div>

        <div className="fmm-clean-hero-copy">
          <div className="fmm-clean-logo-wrap">
            <img
              src="/images/mobile-home/game/fantasy-mmadness-updated-logo.png"
              alt="Fantasy MMAdness"
              loading="eager"
            />
          </div>
          <p>Predict every fight. Prove your <em>Fight IQ.</em> Climb the leaderboard.</p>
          <Link
            href={userLoggedIn && featuredFight ? getFightHref(featuredFight) : SIGN_UP_HREF}
            className="fmm-clean-join"
            onClick={() => interact("whoosh")}
          >
            {userLoggedIn ? "Play Now" : "Join Free"}
            <FaChevronRight />
          </Link>
        </div>
      </section>

      <div className="fmm-clean-live-ticker">
        <span><i /> Live Arena</span>
        <div>
          <strong>{featuredFight ? getEventLabel(featuredFight) : "Upcoming Fight"}</strong>
          <em>{featuredFight ? formatCountdown(featuredFight, now) : matchStatus === "loading" ? "Loading…" : "Open Soon"}</em>
        </div>
      </div>

      <section className="fmm-clean-stats">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.label} onClick={() => interact("click")}>
              <Icon />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </section>

      <section className="fmm-clean-section">
        <div className="fmm-clean-section-heading">
          <div><small>Combat Sports</small><h2>Choose Your Fight</h2></div>
          <Link href="/upcomingfights">View All <FaChevronRight /></Link>
        </div>
        <div className="fmm-clean-sports-rail">
          <button
            type="button"
            className={activeSport === "all" ? "is-active is-all" : "is-all"}
            onClick={() => {
              interact("click");
              setActiveSport("all");
            }}
          >
            <span><FaFire /></span><strong>All</strong><small>{allFights.length} fights</small>
          </button>
          {sections.map((section) => (
            <button
              type="button"
              key={section.key}
              className={`is-${section.key} ${activeSport === section.key ? "is-active" : ""}`}
              onClick={() => {
                interact("boom");
                setActiveSport(section.key);
              }}
            >
              <SafeImage
                src={section.image || CATEGORY_FALLBACKS[section.key]}
                alt=""
                className="fmm-clean-sport-image"
              />
              <span className="fmm-clean-live-pill">Live</span>
              <strong>{section.label}</strong>
              <small>{section.count.toLocaleString("en-US")} fights</small>
            </button>
          ))}
        </div>
      </section>

      <section className="fmm-clean-section fmm-clean-featured">
        <div className="fmm-clean-section-heading">
          <div><small>Featured This Week</small><h2>{featuredFight ? getEventLabel(featuredFight) : "Featured Fight"}</h2></div>
          <span className="fmm-clean-status"><i /> Open</span>
        </div>
        {featuredFight ? (
          <Link
            href={getFightHref(featuredFight)}
            className="fmm-clean-featured-card"
            onClick={() => interact("boom")}
          >
            <SafeImage src={getFighterImage(featuredFight, "A", 0)} alt={fighterAName} className="is-a" />
            <div>
              <small>{getEventLabel(featuredFight)}</small>
              <h3>{fighterAName}<em>vs</em>{fighterBName}</h3>
              <strong>{getPrize(featuredFight)}</strong>
              <p>{formatCountdown(featuredFight, now)}</p>
              <span>Make Predictions <FaChevronRight /></span>
            </div>
            <SafeImage src={getFighterImage(featuredFight, "B", 1)} alt={fighterBName} className="is-b" />
          </Link>
        ) : (
          <div className="fmm-clean-empty">{matchStatus === "loading" ? "Loading featured fight…" : "No open featured fight"}</div>
        )}
      </section>

      <section className="fmm-clean-section">
        <div className="fmm-clean-section-heading">
          <div><small>Fight Calendar</small><h2>Upcoming Events</h2></div>
          <Link href="/upcomingfights">View All <FaChevronRight /></Link>
        </div>
        <div className="fmm-clean-events-rail">
          {upcomingFights.length ? upcomingFights.map((fight, index) => (
            <Link
              href={getFightHref(fight)}
              key={getFightId(fight) || `${getFightTitle(fight)}-${index}`}
              onClick={() => interact("click")}
            >
              <div className="fmm-clean-event-art">
                {getPoster(fight) ? (
                  <SafeImage src={getPoster(fight)} alt={getFightTitle(fight)} />
                ) : (
                  <>
                    <SafeImage src={getFighterImage(fight, "A", index)} alt="" />
                    <SafeImage src={getFighterImage(fight, "B", index + 1)} alt="" />
                  </>
                )}
              </div>
              <small>{getEventLabel(fight)}</small>
              <h3>{getFighterName(fight, "A")}<em>vs</em>{getFighterName(fight, "B")}</h3>
              <p>{formatCountdown(fight, now)}</p>
              <strong>{getPrize(fight)}</strong>
              <span>Enter Now</span>
            </Link>
          )) : (
            <div className="fmm-clean-empty">{matchStatus === "loading" ? "Loading upcoming events…" : "New events will appear here"}</div>
          )}
        </div>
      </section>

      <section className="fmm-clean-command-grid">
        <article className="fmm-clean-command-card">
          <div className="fmm-clean-section-heading compact">
            <div><small>Featured Fight</small><h2>Fight Command</h2></div>
          </div>
          {featuredFight && (
            <>
              <div className="fmm-clean-command-faceoff">
                <SafeImage src={getFighterImage(featuredFight, "A", 0)} alt={fighterAName} />
                <h3>{fighterAName}<em>vs</em>{fighterBName}</h3>
                <SafeImage src={getFighterImage(featuredFight, "B", 1)} alt={fighterBName} />
              </div>
              <div className="fmm-clean-command-metrics">
                <span><small>Prize Pool</small><strong>{getPrize(featuredFight)}</strong></span>
                <span><small>Entry Fee</small><strong>{getEntryFee(featuredFight)}</strong></span>
                <span><small>Entries</small><strong>{getPlayers(featuredFight).toLocaleString("en-US")}</strong></span>
              </div>
              <Link href={getFightHref(featuredFight)} onClick={() => interact("whoosh")}>Make Predictions</Link>
            </>
          )}
        </article>

        <article className="fmm-clean-predictions-card">
          <div className="fmm-clean-section-heading compact">
            <div><small>Community</small><h2>Predictions</h2></div>
            <span>{predictions.length} picks</span>
          </div>
          <div className="fmm-clean-prediction-grid">
            <div className="fmm-clean-donut-wrap">
              <div className="fmm-clean-donut" style={{ "--a-percent": `${aPercent}%` }} />
              <strong>{aPercent}%</strong>
              <span>{fighterAName}</span>
              <em>{fighterBName} {bPercent}%</em>
            </div>
            <div className="fmm-clean-methods">
              {[
                ["KO / TKO", methodPercentage(methodCounts.ko)],
                ["Submission", methodPercentage(methodCounts.submission)],
                ["Decision", methodPercentage(methodCounts.decision)],
              ].map(([label, value]) => (
                <div key={label}><label>{label}</label><i><b style={{ width: `${value}%` }} /></i><span>{value}%</span></div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="fmm-clean-player-grid">
        <Link href="/fights-rewards" className="fmm-clean-reward" onClick={() => interact("reward")}>
          <img src="/images/mobile-app-v15/chest-transparent.png" alt="Daily reward chest" />
          <div><small>Daily Reward</small><strong>Claim Reward</strong><span>Build your streak</span></div>
        </Link>
        <Link href="/checkout" className="fmm-clean-coins" onClick={() => interact("coin")}>
          <FaCoins />
          <div><small>Coins Wallet</small><strong>{Math.floor(tokenBalance).toLocaleString("en-US")}</strong><span>Add Coins</span></div>
        </Link>
        <Link href="/leaderboard" className="fmm-clean-leaderboard" onClick={() => interact("click")}>
          <div className="fmm-clean-section-heading compact"><div><small>Live</small><h2>Leaderboard</h2></div><FaChevronRight /></div>
          <ol>
            {leaderboard.length ? leaderboard.map((player) => (
              <li key={`${player.rank}-${player.name}`}><b>{player.rank}</b><span>{player.name}</span><strong>{player.points.toLocaleString("en-US")}</strong></li>
            )) : <li><span>Rankings are loading…</span></li>}
          </ol>
        </Link>
        <Link href="/fights-rewards" className="fmm-clean-streak" onClick={() => interact("reward")}>
          <FaFire /><div><small>Streak Bonus</small><strong>7 Day Streak</strong><span>+250 FM</span></div>
        </Link>
      </section>

      <section className="fmm-clean-info-grid">
        <Link href="/blogs" onClick={() => interact("click")}>
          <FaNewspaper /><div><small>Latest</small><strong>Blogs & Fight News</strong><span>Analysis, previews and strategies</span></div><FaChevronRight />
        </Link>
        <Link href="/apparel" onClick={() => interact("click")}>
          <FaShoppingBag /><div><small>Official</small><strong>Apparel</strong><span>Shirts, hats, hoodies and tanks</span></div><FaChevronRight />
        </Link>
        <Link href="/affiliate-create-account" onClick={() => interact("click")}>
          <img src="/images/mobile-app-v15/handshake-transparent.png" alt="" /><div><small>Promote</small><strong>Affiliates</strong><span>Invite. Earn. Win.</span></div><FaChevronRight />
        </Link>
      </section>

      <nav className="fmm-clean-bottom-nav" aria-label="Mobile app navigation">
        <Link href="/" className="is-active"><FaHome /><span>Home</span></Link>
        <Link href="/upcomingfights"><FaTrophy /><span>Contests</span></Link>
        <Link href={userLoggedIn ? "/YourFights" : "/login"}><FaCheck /><span>My Picks</span></Link>
        <Link href={featuredFight ? getFightHref(featuredFight) : "/upcomingfights"} className="is-predict" onClick={() => interact("whoosh")}><i><FaBullseye /></i><span>Predict</span></Link>
        <Link href="/leaderboard"><FaCrown /><span>Leaders</span></Link>
        <Link href={profileHref}><FaUser /><span>Profile</span></Link>
        <button
          type="button"
          className={soundEnabled ? "is-on" : ""}
          aria-label={`Turn sound ${soundEnabled ? "off" : "on"}`}
          onClick={() => {
            setSoundEnabled((current) => {
              const next = !current;
              if (typeof window !== "undefined") window.localStorage.setItem("fmm-mobile-app-sound", String(next));
              return next;
            });
          }}
        >
          {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
          <span>Sound</span>
        </button>
      </nav>

      <div className={`fmm-clean-menu-backdrop ${menuOpen ? "is-open" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`fmm-clean-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <header><strong>Fantasy MMAdness</strong><button type="button" onClick={() => setMenuOpen(false)}><FaTimes /></button></header>
        <nav>
          {menuItems.map(([label, href, Icon]) => (
            <Link href={href} key={label} onClick={() => setMenuOpen(false)}><Icon /><span>{label}</span><FaChevronRight /></Link>
          ))}
        </nav>
        <Link href={profileHref} className="fmm-clean-menu-account"><FaUser /><span>{userLoggedIn ? "Open Profile" : "Create Free Account"}</span></Link>
      </aside>
    </div>
  );
};

export default MobileAppHomeClean;
