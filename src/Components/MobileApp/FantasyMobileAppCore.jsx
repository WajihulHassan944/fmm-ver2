/* Derived from the client-approved standalone prototype in the design handoff. */
import React from 'react';
import { resolvePublicMediaUrl } from '@/Utils/publicApi';
import { dateOnlyToLocalDate, getDateOnlyKey } from '@/Utils/dateOnly';

const ASSET_BASE = '/images/mobile-home/final-v35';
const EVENT_POSTER_COUNT = 6;

const directSlotAssets = {
  'bold-hero': 'hero-banner-crop.png',
  'hero-left': 'hero-left.webp',
  'hero-right': 'hero-right.webp',
  'story-boxing': 'sport-boxing.webp',
  'story-mma': 'sport-mma.webp',
  'story-bareknuckle': 'sport-bareknuckle.webp',
  'story-kickboxing': 'sport-kickboxing.webp',
  'story-wrestling': 'sport-wrestling.webp',
  'fighter-affiliate-photo': 'transparent-fd-aspinall.png',
  avatar: 'fd-jones.webp',
  'hof-1': 'fd-jones.webp',
  'hof-2': 'fd-aspinall.webp',
  'hof-3': 'sport-boxing-2.webp',
  ap1: 'ap1.webp',
  ap2: 'ap2.webp',
  ap3: 'ap3.webp',
  ap4: 'ap1-2.webp',
  ap5: 'ap2-2.webp',
};

const explicitAsset = (src = '') => {
  if (!src) return '';
  const value = String(src).trim();
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  const clean = decodeURIComponent(value).split('/').pop();
  return clean ? `${ASSET_BASE}/${clean}` : '';
};

const resolveSlotAsset = (id = '', src = '') => {
  const explicit = explicitAsset(src);
  if (explicit) return explicit;
  if (directSlotAssets[id]) return `${ASSET_BASE}/${directSlotAssets[id]}`;

  const eventMatch = String(id).match(/^event-poster-(\d+)$/);
  if (eventMatch) {
    const requested = ((Number(eventMatch[1]) - 1) % EVENT_POSTER_COUNT) + 1;
    return `${ASSET_BASE}/event-poster-${requested}.webp`;
  }

  const sportMatch = String(id).match(/^sport-(boxing|mma|bareknuckle|kickboxing|wrestling)-/);
  if (sportMatch) {
    return `${ASSET_BASE}/sport-${sportMatch[1]}.webp`;
  }

  const shadowMatch = String(id).match(/^shadow-(?:sf)?(\d+)$/);
  if (shadowMatch) {
    const number = ((Number(shadowMatch[1]) - 1) % EVENT_POSTER_COUNT) + 1;
    return `${ASSET_BASE}/event-poster-${number}.webp`;
  }

  if (String(id).startsWith('demo-')) return `${ASSET_BASE}/event-poster-1.webp`;
  return '/images/hero-fight.webp';
};

const MobileImageSlot = ({ id, src, fallbackSrc, fit = 'cover', shape, radius, placeholder }) => {
  const borderRadius = shape === 'circle' ? '50%' : radius ? Number(radius) : 0;
  const resolvedFallback = explicitAsset(fallbackSrc) || resolveSlotAsset(id);
  return React.createElement('img', {
    id,
    src: resolveSlotAsset(id, src || fallbackSrc),
    alt: placeholder || '',
    'data-filled': 'true',
    draggable: false,
    loading: 'lazy',
    decoding: 'async',
    onError: (event) => {
      const image = event.currentTarget;
      if (!image || image.dataset.fallbackApplied === 'true') return;
      image.dataset.fallbackApplied = 'true';
      image.src = resolvedFallback;
    },
    style: {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: fit,
      borderRadius,
    },
  });
};

const cleanText = (...values) => {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text && !['null', 'undefined', 'n/a'].includes(text.toLowerCase())) return text;
  }
  return '';
};

const getEventFallbackImage = (sport = 'mma') => {
  const supported = ['boxing', 'mma', 'bareknuckle', 'kickboxing', 'wrestling'];
  const key = supported.includes(sport) ? sport : 'mma';
  return `${ASSET_BASE}/sport-${key}.webp`;
};

const getMediaCandidate = (value) => {
  if (typeof value === 'string' || typeof value === 'number') return cleanText(value);
  if (!value || typeof value !== 'object') return '';
  return cleanText(
    value.url_fullxfull,
    value.url_570xN,
    value.url_170x135,
    value.secure_url,
    value.imageUrl,
    value.url,
    value.src,
    value.path,
  );
};

const resolveLiveMedia = (...values) => {
  for (const value of values) {
    const candidate = getMediaCandidate(value);
    if (candidate) return resolvePublicMediaUrl(candidate);
  }
  return '';
};

const unwrapMaybeMarkdownUrl = (value = '') => {
  const text = String(value || '').trim();
  const markdownMatch = text.match(/\((https?:\/\/[^)]+)\)/i);
  if (markdownMatch?.[1]) return markdownMatch[1];
  const bracketMatch = text.match(/^\[(https?:\/\/[^\]]+)\]$/i);
  if (bracketMatch?.[1]) return bracketMatch[1];
  return text;
};

const getApparelImages = (item = {}) => {
  const rawImages = Array.isArray(item.images) ? item.images : [];
  const candidates = [
    ...rawImages,
    item.image,
    item.imageUrl,
    item.thumbnail,
    item.thumbnailUrl,
  ];

  return [...new Set(candidates
    .map(getMediaCandidate)
    .map(unwrapMaybeMarkdownUrl)
    .filter(Boolean)
    .map(resolvePublicMediaUrl)
    .filter(Boolean))].slice(0, 3);
};

const resolveSport = (fight = {}) => {
  const value = cleanText(
    fight.effectiveCategorySlug,
    fight.categorySlug,
    fight.matchCategoryTwo,
    fight.matchCategory,
    fight.sport,
  ).toLowerCase();
  if (value.includes('bare') || value.includes('bkfc')) return 'bareknuckle';
  if (value.includes('kick')) return 'kickboxing';
  if (value.includes('wrest')) return 'wrestling';
  if (value.includes('box')) return 'boxing';
  return 'mma';
};

const sportColor = {
  mma: '#ef4444',
  boxing: '#4d8dff',
  bareknuckle: '#f2b544',
  kickboxing: '#22c55e',
  wrestling: '#a855f7',
};

const sportLabel = {
  mma: 'UFC / MMA',
  boxing: 'BOXING',
  bareknuckle: 'BARE KNUCKLE',
  kickboxing: 'KICKBOXING',
  wrestling: 'PRO WRESTLING',
};

const sumLiveStrikes = (rows = [], sport = 'mma') => (Array.isArray(rows) ? rows : []).reduce((total, row) => {
  if (sport === 'boxing' || sport === 'bareknuckle') {
    return total + toSafeNumber(row?.TP, toSafeNumber(row?.HP) + toSafeNumber(row?.BP));
  }
  return total + toSafeNumber(row?.ST, toSafeNumber(row?.HP) + toSafeNumber(row?.BP));
}, 0);

const normalizeLiveEvent = (fight = {}, index = 0) => {
  const sport = resolveSport(fight);
  const rawDate = cleanText(fight.matchDateKey, fight.eventDateKey, fight.matchDate, fight.eventDate, fight.date, fight.lockAt);
  const iso = getDateOnlyKey(rawDate);
  const rawPrize = cleanText(fight.prize, fight.prizePool, fight.winningAmount, fight.currentPot, fight.pot);
  const numericPrize = Number(String(rawPrize).replace(/[^0-9.]/g, ''));
  const prize = rawPrize
    ? rawPrize.startsWith('$') || /FM/i.test(rawPrize)
      ? rawPrize
      : Number.isFinite(numericPrize)
        ? `$${numericPrize.toLocaleString()}`
        : rawPrize
    : '';
  const entryFee = toSafeNumber(
    fight.entryFee,
    fight.entryFeeTokens,
    fight.matchTokens,
    fight.tokensRequired,
    fight.entryCost,
  );
  const entries = toSafeNumber(
    fight.entryCount,
    fight.entries,
    fight.playerCount,
    fight.participantCount,
    Array.isArray(fight.userPredictions) ? fight.userPredictions.length : null,
  );
  const liveStats = sport === 'boxing' || sport === 'bareknuckle' ? fight.BoxingMatch : fight.MMAMatch;
  const fighterOneStats = Array.isArray(liveStats?.fighterOneStats) ? liveStats.fighterOneStats : [];
  const fighterTwoStats = Array.isArray(liveStats?.fighterTwoStats) ? liveStats.fighterTwoStats : [];
  const userEntry = fight.userEntry && typeof fight.userEntry === 'object' ? fight.userEntry : null;

  return {
    id: cleanText(fight._id, fight.id, fight.matchId, `live-${index}`),
    backendId: cleanText(fight._id, fight.id, fight.matchId),
    playable: fight.__playable !== false && !fight.predictionSubmitted && !fight.userPredictionSubmitted,
    homepagePromoted: fight.__homepagePromoted === true,
    featuredThisWeek: Boolean(fight.featuredThisWeek),
    featuredFight: Boolean(fight.featuredFight),
    featuredThisWeekImage: resolveLiveMedia(fight.featuredThisWeekImage),
    featuredFightBackgroundImage: resolveLiveMedia(fight.featuredFightBackgroundImage),
    featuredFightFighterAImage: resolveLiveMedia(fight.featuredFightFighterAImage),
    featuredFightFighterBImage: resolveLiveMedia(fight.featuredFightFighterBImage),
    division: cleanText(fight.division, fight.weightClass),
    sport,
    tag: cleanText(fight.eventName, fight.matchName, fight.promotion, sportLabel[sport]),
    tagColor: sportColor[sport],
    f1: cleanText(fight.matchFighterA, fight.fighterAName, fight.fighterA?.displayName, 'FIGHTER A').toUpperCase(),
    f2: cleanText(fight.matchFighterB, fight.fighterBName, fight.fighterB?.displayName, 'FIGHTER B').toUpperCase(),
    iso,
    prize,
    entryFee,
    entries,
    matchTime: cleanText(fight.matchTime, fight.time),
    venue: cleanText(fight.venue, fight.location),
    maxRounds: toSafeNumber(fight.maxRounds, fight.rounds, fight.numberOfRounds),
    currentRound: toSafeNumber(fight.currentRound, fight.liveRound, Math.max(fighterOneStats.length, fighterTwoStats.length)),
    liveStrikesA: sumLiveStrikes(fighterOneStats, sport),
    liveStrikesB: sumLiveStrikes(fighterTwoStats, sport),
    userEntry,
    aiScoutingReport: fight.aiScoutingReport && typeof fight.aiScoutingReport === 'object' ? fight.aiScoutingReport : null,
    serverEntered: Boolean(userEntry || fight.predictionSubmitted || fight.userPredictionSubmitted),
    fallbackImage: getEventFallbackImage(sport),
    fighterAImage: resolveLiveMedia(fight.resolvedFighterAImage, fight.fighterAPrimaryImage, fight.fighterAImage, fight.fighterA?.primaryImage, fight.fighterA?.image),
    fighterBImage: resolveLiveMedia(fight.resolvedFighterBImage, fight.fighterBPrimaryImage, fight.fighterBImage, fight.fighterB?.primaryImage, fight.fighterB?.image),
    image: resolveLiveMedia(
      fight.homepagePromotion?.mobilePosterImage,
      fight.homepagePromotion?.posterImage,
      fight.homepagePromotion?.image,
      fight.fightPosterMobileImage,
      fight.fightPosterImage,
      fight.posterImage,
      fight.matchPosterImage,
      fight.bannerImage,
      fight.promotionBackground,
      fight.resolvedFighterAImage,
      fight.fighterAPrimaryImage,
      fight.fighterAImage,
      fight.resolvedFighterBImage,
      fight.fighterBPrimaryImage,
      fight.fighterBImage,
    ),
  };
};

const toSafeNumber = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
};

const emptyWrestlingDraft = () => ({
  a: { hp: 0, bp: 0, k: 0, pm: 0, fm: 0 },
  b: { hp: 0, bp: 0, k: 0, pm: 0, fm: 0 },
  winner: null,
  finishTypePrediction: null,
});

const emptyBoxingDraft = () => ({
  a: { hp: 0, bp: 0, tp: 0, rw: 0, rl: 0 },
  b: { hp: 0, bp: 0, tp: 0, rw: 0, rl: 0 },
  winner: null,
  outcome: null,
});

const emptyMmaDraft = () => ({
  a: { hp: 0, bp: 0, kicks: 0, knees: 0, elbows: 0 },
  b: { hp: 0, bp: 0, kicks: 0, knees: 0, elbows: 0 },
  winner: null,
  outcome: null,
});

const hasActiveFmPlus = (user = {}) => {
  if (!user?.isSubscribed || String(user?.currentPlan || '').toUpperCase() !== 'FM+') return false;
  if (!user.fmPlusExpiresAt) return true;
  const expiresAt = new Date(user.fmPlusExpiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
};

class FantasyMobileAppCore extends React.Component {
  state = {
    activeTab: this.props.initialTab || 'home',
    activeSport: 'all',
    modal: null,
    modalData: null,
    coins: Number.isFinite(Number(this.props.initialCoins)) ? Number(this.props.initialCoins) : 0,
    rewardClaimed: false,
    hasPurchased: false,
    isSubscribed: hasActiveFmPlus(this.props.currentUser),
    fmPlusMode: 'monthly',
    joinDraft: { name: '', email: '' },
    cart: [],
    streakDay: 5,
    votes: { jones: 76, aspinall: 24 },
    userVote: null,
    toast: null,
    enteredEvents: {},
    watchFightId: null,
    predictions: {},
    notifCount: 3,
    chestBounce: 0,
    xpMounted: false,
    layout: 'classic',
    carouselIndex: 0,
    liveTicks: { jones: 0, aspinall: 0 },
    reactions: [],
    friendFeed: [],
    reactionDraft: '',
    streakExpiresIn: 6 * 3600,
    watchMode: 'rounds',
    matchSeconds: 0,
    triggeredMoments: [],
    adminFeed: [],
    watchPoints: 0,
    leagues: [],
    challenges: [],
    shadowPlays: { sf1: 1284, sf2: 962, sf3: 2140 },
    shadowPicks: {},
    shadowFights: [
      { id: 'sf1', genre: 'mma', tag: 'MMA', f1: 'JONES', f2: 'GANE', winner: 'a', rounds: 5, categories: 'HP · BP · KI · Winner Pick', pot: 3200, buyIn: 25, status: 'live', goLiveIn: 0, lobby: 340 },
      { id: 'sf2', genre: 'boxing', tag: 'BOXING', f1: 'MCGREGOR', f2: 'DIAZ', winner: 'b', rounds: 12, categories: 'HP · BP · TP · RW/RL · Winner Pick', pot: 4600, buyIn: 25, status: 'scheduled', goLiveIn: 35, lobby: 128 },
      { id: 'sf3', genre: 'wrestling', tag: 'PRO WRESTLING', f1: 'ADESANYA', f2: 'PEREIRA', winner: 'b', rounds: null, categories: 'HP · BP · KI · PM · FM', pot: 1800, buyIn: 25, status: 'scheduled', goLiveIn: 90, lobby: 62 },
    ],
    publicLeagues: [],
    joinedLeagueIds: {},
    fantasyCampaigns: [],
    fantasyDraft: { boxing: null, mma: null, bareknuckle: null, kickboxing: null, wrestling: null },
    chestBurst: false,
    demoGenre: null,
    demoCardsDone: { boxing: false, mma: false, wrestling: false },
    demoStep: 0,
    demoCard: null,
    demoRoundsRevealed: 0,
    demoComments: [
      { id: 'dc1', name: 'DemoBot_Ace', text: 'Good luck everyone! 🔥' },
      { id: 'dc2', name: 'DemoBot_Rook', text: 'Let\'s see how this scores out' },
    ],
    demoCommentDraft: '',
    demoLeaderboard: [
      { name: 'You', score: 0 }, { name: 'DemoBot_Ace', score: 0 }, { name: 'DemoBot_Rook', score: 0 },
      { name: 'DemoBot_Nova', score: 0 }, { name: 'DemoBot_Zed', score: 0 },
    ],
    settings: {
      roundByRound: true, wagerLimit: 500, notifications: true, sound: true, leagueVisibility: 'invite',
      autoSettle: true, autoAcceptLeague: true, autoPayout: true, aiAutoScore: true,
      emailAlerts: true, textAlerts: false,
    },
    aiScoring: false,
    aiDemoCard: null,
    aiDemoFlash: null,
    scorerTeam: [
      { id: 'sc1a', name: 'You (Admin)', event: 'UFC 323', corner: 'JONES', side: 'red', status: 'live' },
      { id: 'sc1b', name: 'Unassigned', event: 'UFC 323', corner: 'ASPINALL', side: 'blue', status: 'open' },
      { id: 'sc2a', name: 'Unassigned', event: 'BKFC 71', corner: 'ALVES', side: 'red', status: 'open' },
      { id: 'sc2b', name: 'Unassigned', event: 'BKFC 71', corner: 'WARD', side: 'blue', status: 'open' },
      { id: 'sc3a', name: 'Unassigned', event: 'GLORY 92', corner: 'SUPERLEK', side: 'red', status: 'open' },
      { id: 'sc3b', name: 'Unassigned', event: 'GLORY 92', corner: 'ALLAZOV', side: 'blue', status: 'open' },
    ],
    sportPhotoIndex: 0,
    filledSlots: {},
    scorecardDraft: emptyWrestlingDraft(),
    wrestlingScorecards: {},
    boxingDraft: emptyBoxingDraft(),
    boxingScorecards: {},
    mmaDraft: emptyMmaDraft(),
    mmaScorecards: {},
    eventVotes: {},
    communityIndex: 0,
    flashCard: {},
  };

  componentDidMount() {
    clearInterval(this._communityInterval); clearInterval(this._sportPhotoInterval); clearInterval(this._streakInterval); clearInterval(this._shadowInterval); clearInterval(this._friendInterval); clearInterval(this._watchInterval); clearInterval(this._filledPollInterval);
    setTimeout(() => this.setState({ xpMounted: true }), 200);
    this._communityInterval = setInterval(() => {
      this.setState(s => ({ communityIndex: (s.communityIndex + 1) % 5 }));
    }, 4500);
    this._sportPhotoInterval = setInterval(() => {
      this.setState(s => ({ sportPhotoIndex: (s.sportPhotoIndex + 1) % 5 }));
    }, 7000);
    this._streakInterval = setInterval(() => {
      this.setState(s => s.rewardClaimed ? s : { streakExpiresIn: Math.max(0, s.streakExpiresIn - 1) });
    }, 1000);
    this._shadowInterval = setInterval(() => {
      this.setState(s => ({
        shadowFights: s.shadowFights.map(sf => {
          if (sf.status !== 'scheduled') return sf;
          const next = sf.goLiveIn - 1;
          if (next <= 0) return { ...sf, status: 'live', goLiveIn: 0 };
          return { ...sf, goLiveIn: next };
        })
      }));
    }, 1000);
    this._filledPollInterval = setInterval(() => {
      const updates = {};
      let any = false;
      document.querySelectorAll('.fmm-exact-mobile-portal img[data-filled][id]').forEach(el => {
        const id = el.id, filled = el.hasAttribute('data-filled');
        if (this.state.filledSlots[id] !== filled) { updates[id] = filled; any = true; }
      });
      if (any) this.setState(s => ({ filledSlots: { ...s.filledSlots, ...updates } }));
    }, 2000);
    if ((this.props.initialTab || 'home') === 'watch') this.startWatchTicker();
  }

  componentDidUpdate(previousProps) {
    const updates = {};
    const previousCoins = Number(previousProps.initialCoins);
    const nextCoins = Number(this.props.initialCoins);
    if (Number.isFinite(nextCoins) && nextCoins !== previousCoins && nextCoins !== this.state.coins) {
      updates.coins = nextCoins;
    }
    if (
      previousProps.initialTab !== this.props.initialTab
      && this.props.initialTab
      && this.props.initialTab !== this.state.activeTab
    ) updates.activeTab = this.props.initialTab;
    const previousMembership = hasActiveFmPlus(previousProps.currentUser);
    const nextMembership = hasActiveFmPlus(this.props.currentUser);
    if (previousMembership !== nextMembership && nextMembership !== this.state.isSubscribed) {
      updates.isSubscribed = nextMembership;
    }
    if (Object.keys(updates).length) this.setState(updates);
  }

  getCtx() {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  toggleSetting = (key) => this.setState(s => ({ settings: { ...s.settings, [key]: !s.settings[key] } }));
  aiScoreCats = [['hp', 'Head Punches'], ['bp', 'Body Punches'], ['kicks', 'Kicks'], ['knees', 'Knees'], ['elbows', 'Elbows']];
  startAiDemo = () => {
    const card = { a: { hp: 0, bp: 0, kicks: 0, knees: 0, elbows: 0 }, b: { hp: 0, bp: 0, kicks: 0, knees: 0, elbows: 0 } };
    this.setState({ aiDemoCard: card, aiDemoFlash: null });
    clearInterval(this._aiDemoInterval);
    this._aiDemoInterval = setInterval(() => {
      const side = Math.random() < 0.5 ? 'a' : 'b';
      const [cat] = this.aiScoreCats[Math.floor(Math.random() * this.aiScoreCats.length)];
      this.setState(s => ({
        aiDemoCard: { ...s.aiDemoCard, [side]: { ...s.aiDemoCard[side], [cat]: s.aiDemoCard[side][cat] + 1 } },
        aiDemoFlash: side + '-' + cat,
      }));
      setTimeout(() => this.setState(s => (s.aiDemoFlash === side + '-' + cat ? { aiDemoFlash: null } : null)), 700);
    }, 1400);
  };
  adjustAiCard = (side, cat, delta) => {
    this.setState(s => ({ aiDemoCard: { ...s.aiDemoCard, [side]: { ...s.aiDemoCard[side], [cat]: Math.max(0, s.aiDemoCard[side][cat] + delta) } } }));
  };
  assignScorer = (rowId) => {
    const name = 'ScorerJD' + Math.floor(Math.random() * 90 + 10);
    this.setState(s => ({ scorerTeam: s.scorerTeam.map(r => r.id === rowId ? { ...r, name, status: 'live' } : r) }));
    this.showToast(name + ' assigned — they\'ll only see & score that event');
  };
  runAiScoring = () => {
    if (this.state.aiScoring) return;
    this.setState({ aiScoring: true });
    setTimeout(() => {
      this.setState(s => ({ aiScoring: false, coins: s.coins + 180 }));
      this.playCheer();
      this.showToast('🤖 AI scored 3 completed fights — leaderboards & payouts updated');
    }, 1800);
  };
  setWagerLimit = (v) => this.setState(s => ({ settings: { ...s.settings, wagerLimit: v } }));
  setLeagueVisibility = (v) => this.setState(s => ({ settings: { ...s.settings, leagueVisibility: v } }));

  playBell() {
    if (!this.state.settings.sound) return;
    try {
      const ctx = this.getCtx(); const now = ctx.currentTime;
      [880, 1320, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.16 / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 1.15);
      });
    } catch (e) {}
  }

  playCheer() {
    if (!this.state.settings.sound) return;
    try {
      const ctx = this.getCtx(); const now = ctx.currentTime;
      const dur = 1.4;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      const noise = ctx.createBufferSource(); noise.buffer = buffer;
      const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1400; filter.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      noise.start(now); noise.stop(now + dur);
    } catch (e) {}
  }

  showToast(msg) {
    this.setState({ toast: msg });
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.setState({ toast: null }), 2200);
  }

  openModal = (name, data) => {
    const reset = {};
    if (name === 'wrestlingScorecard') reset.scorecardDraft = emptyWrestlingDraft();
    if (name === 'boxingScorecard') reset.boxingDraft = emptyBoxingDraft();
    if (name === 'mmaScorecard') reset.mmaDraft = emptyMmaDraft();
    this.setState({ modal: name, modalData: data || null, ...reset });
  };
  closeModal = () => this.setState({ modal: null, modalData: null });

  setTab = (tab) => {
    if (tab === 'watch' && this.state.activeTab !== 'watch') this.startWatchTicker();
    if (tab !== 'watch' && this.state.activeTab === 'watch') this.stopWatchTicker();
    this.setState({ activeTab: tab, modal: null });
  };
  startWatchTicker() {
    clearInterval(this._watchInterval);
    this._watchInterval = setInterval(() => {
      this.setState(s => {
        const jGain = 0;
        const aGain = 0;
        return {
          liveTicks: { jones: s.liveTicks.jones + jGain, aspinall: s.liveTicks.aspinall + aGain },
          watchPoints: s.watchPoints + jGain * 10,
        };
      });
      this.tickMatchClock();
    }, 1600);
  }
  stopWatchTicker() { clearInterval(this._watchInterval); clearInterval(this._friendInterval); }
  setReactionDraft = (v) => this.setState({ reactionDraft: v });
  sendReaction = () => {
    const text = this.state.reactionDraft.trim();
    if (!text) return;
    this.setState(s => ({ friendFeed: [...s.friendFeed, { id: Date.now() + Math.random(), name: 'You', text, mine: true }].slice(-8), reactionDraft: '' }));
    this.playBell();
  };
  setWatchMode = (m) => this.setState({ watchMode: m, matchSeconds: 0, triggeredMoments: [] });
  tickMatchClock() {
    if (this.state.watchMode !== 'moments') return;
    this.setState(s => {
      const secs = s.matchSeconds + 4;
      const moments = [
        [12, '🥊 Early exchange — feeling-out process'],
        [28, '🦵 Near-fall! Kickout at 2!'],
        [50, '🏃 Run-in from the back!'],
        [74, '💥 Finisher attempt — countered!'],
        [98, '3️⃣ NEAR FALL — crowd erupts!'],
      ];
      const justHit = moments.find(([at]) => secs >= at && !s.triggeredMoments.includes(at));
      if (justHit) {
        this.playBell();
        this.showToast(justHit[1]);
      }
      return { matchSeconds: secs, triggeredMoments: justHit ? [...s.triggeredMoments, justHit[0]] : s.triggeredMoments };
    });
  }
  componentWillUnmount() { this.stopWatchTicker(); clearInterval(this._communityInterval); clearInterval(this._sportPhotoInterval); clearInterval(this._shadowInterval); clearInterval(this._streakInterval); clearInterval(this._demoInterval); clearInterval(this._filledPollInterval); clearInterval(this._aiDemoInterval); }

  joinShadowLobby = (sf) => {
    this.playBell();
    this.setState(s => ({
      shadowFights: s.shadowFights.map(f => f.id === sf.id ? { ...f, lobby: f.lobby + 1 } : f),
      coins: s.coins - sf.buyIn,
    }));
    this.showToast('Joined the lobby! You\'ll see who you\'re facing when it goes live.');
  };

  pickCycleId(ids, s) {
    const filled = ids.filter(id => s.filledSlots[id]);
    if (filled.length === 0) return ids[0];
    if (filled.length === 1) return filled[0];
    return filled[s.sportPhotoIndex % filled.length];
  }

  quickPick = (ev, side) => {
    this.playBell();
    const cur = this.state.eventVotes[ev.id] || { a: 50, b: 50 };
    const isUnderdog = (side === 'a' ? cur.a : cur.b) < 50;
    this.setState(s => {
      const c = s.eventVotes[ev.id] || { a: 50, b: 50 };
      let a = c.a, b = c.b;
      if (side === 'a') { a = Math.min(95, a + 6); b = 100 - a; } else { b = Math.min(95, b + 6); a = 100 - b; }
      return { eventVotes: { ...s.eventVotes, [ev.id]: { a, b } }, flashCard: { ...s.flashCard, [ev.id]: Date.now() } };
    });
    const name = side === 'a' ? ev.f1 : ev.f2;
    this.showToast(isUnderdog ? '🐺 Underdog pick: ' + name + '! 2X points if you\'re right' : '⚡ Quick pick: ' + name + '!');
  };
  addReaction = (emoji) => {
    const id = Date.now() + Math.random();
    this.setState(s => ({ reactions: [...s.reactions, { id, emoji, x: 8 + Math.random() * 78 }] }));
    setTimeout(() => this.setState(s => ({ reactions: s.reactions.filter(r => r.id !== id) })), 2000);
  };
  updateScorecard = (who, cat, delta) => {
    this.setState(s => ({
      scorecardDraft: { ...s.scorecardDraft, [who]: { ...s.scorecardDraft[who], [cat]: Math.max(0, s.scorecardDraft[who][cat] + delta) } }
    }));
  };
  setScorecardWinner = (w) => this.setState(s => ({ scorecardDraft: { ...s.scorecardDraft, winner: w } }));
  setScorecardFinishType = (finishTypePrediction) => this.setState(s => ({
    scorecardDraft: { ...s.scorecardDraft, finishTypePrediction },
  }));
  getEventEntryFee = (event = {}) => Math.max(0, toSafeNumber(event.entryFee, event.entryFeeTokens, event.matchTokens));
  getEventEntryLabel = (event = {}) => {
    const fee = this.getEventEntryFee(event);
    return fee > 0 ? `${fee.toLocaleString()} FM` : 'FREE';
  };
  getEventActionLabel = (event = {}, includeEntry = false) => {
    if (!event.playable) return 'VIEW FIGHT DETAILS';
    return includeEntry ? `MAKE PREDICTIONS — ${this.getEventEntryLabel(event)}` : 'MAKE PREDICTIONS';
  };
  openAiScout = (event) => this.openModal('aiScout', event);
  openEvent = (event) => {
    if (!event?.playable) {
      this.props.onOpenFight?.({ event });
      return;
    }
    this.enterEvent(event);
  };
  submitScorecard = async (ev) => {
    const { winner } = this.state.scorecardDraft;
    const entryFee = this.getEventEntryFee(ev);
    if (!winner) { this.showToast('Pick a winner first'); return; }
    if (this.state.coins < entryFee) { this.showToast('Not enough FM coins — add more to enter'); this.openModal('addcoins'); return; }
    if (this.props.onSubmitPrediction) {
      const continueLocally = await this.props.onSubmitPrediction({ type: 'wrestling', event: ev, prediction: this.state.scorecardDraft });
      if (continueLocally === false) return;
    }
    this.playBell();
    this.setState(s => {
      const cur = s.eventVotes[ev.id] || { a: 50, b: 50 };
      let a = cur.a, b = cur.b;
      if (winner === 'a') { a = Math.min(95, a + 5); b = 100 - a; } else if (winner === 'b') { b = Math.min(95, b + 5); a = 100 - b; }
      return {
        wrestlingScorecards: { ...s.wrestlingScorecards, [ev.id]: s.scorecardDraft },
        enteredEvents: { ...s.enteredEvents, [ev.id]: true },
        coins: s.coins - entryFee, modal: null,
        eventVotes: { ...s.eventVotes, [ev.id]: { a, b } },
      };
    });
    this.showToast('Scorecard submitted for ' + ev.tag + '!');
  };

  updateBoxingCard = (who, cat, delta) => {
    this.setState(s => {
      const maxRounds = (s.modalData && s.modalData.sport === 'boxing') ? 12 : 5;
      const cap = (cat === 'rw' || cat === 'rl') ? maxRounds : Infinity;
      return { boxingDraft: { ...s.boxingDraft, [who]: { ...s.boxingDraft[who], [cat]: Math.min(cap, Math.max(0, s.boxingDraft[who][cat] + delta)) } } };
    });
  };
  setBoxingWinner = (w) => this.setState(s => ({ boxingDraft: { ...s.boxingDraft, winner: w } }));
  setBoxingOutcome = (o) => this.setState(s => ({ boxingDraft: { ...s.boxingDraft, outcome: o } }));
  submitBoxingScorecard = async (ev) => {
    const { winner, outcome } = this.state.boxingDraft;
    const entryFee = this.getEventEntryFee(ev);
    if (!winner) { this.showToast('Pick a winner first'); return; }
    if (this.state.coins < entryFee) { this.showToast('Not enough FM coins — add more to enter'); this.openModal('addcoins'); return; }
    if (this.props.onSubmitPrediction) {
      const continueLocally = await this.props.onSubmitPrediction({ type: 'boxing', event: ev, prediction: this.state.boxingDraft });
      if (continueLocally === false) return;
    }
    this.playBell();
    this.setState(s => {
      const cur = s.eventVotes[ev.id] || { a: 50, b: 50 };
      let a = cur.a, b = cur.b;
      if (winner === 'a') { a = Math.min(95, a + 5); b = 100 - a; } else { b = Math.min(95, b + 5); a = 100 - b; }
      return {
        boxingScorecards: { ...s.boxingScorecards, [ev.id]: s.boxingDraft },
        enteredEvents: { ...s.enteredEvents, [ev.id]: true },
        coins: s.coins - entryFee, modal: null,
        eventVotes: { ...s.eventVotes, [ev.id]: { a, b } },
      };
    });
    this.showToast('Scorecard submitted for ' + ev.tag + '!');
  };

  updateMmaCard = (who, cat, delta) => {
    this.setState(s => ({
      mmaDraft: { ...s.mmaDraft, [who]: { ...s.mmaDraft[who], [cat]: Math.max(0, s.mmaDraft[who][cat] + delta) } }
    }));
  };
  setMmaWinner = (w) => this.setState(s => ({ mmaDraft: { ...s.mmaDraft, winner: w } }));
  setMmaOutcome = (o) => this.setState(s => ({ mmaDraft: { ...s.mmaDraft, outcome: o } }));
  submitMmaScorecard = async (ev) => {
    const { winner, outcome } = this.state.mmaDraft;
    const entryFee = this.getEventEntryFee(ev);
    if (!winner) { this.showToast('Pick a winner first'); return; }
    if (this.state.coins < entryFee) { this.showToast('Not enough FM coins — add more to enter'); this.openModal('addcoins'); return; }
    if (this.props.onSubmitPrediction) {
      const continueLocally = await this.props.onSubmitPrediction({ type: 'mma', event: ev, prediction: this.state.mmaDraft });
      if (continueLocally === false) return;
    }
    this.playBell();
    this.setState(s => {
      const cur = s.eventVotes[ev.id] || { a: 50, b: 50 };
      let a = cur.a, b = cur.b;
      if (winner === 'a') { a = Math.min(95, a + 5); b = 100 - a; } else { b = Math.min(95, b + 5); a = 100 - b; }
      return {
        mmaScorecards: { ...s.mmaScorecards, [ev.id]: s.mmaDraft },
        enteredEvents: { ...s.enteredEvents, [ev.id]: true },
        coins: s.coins - entryFee, modal: null,
        eventVotes: { ...s.eventVotes, [ev.id]: { a, b } },
      };
    });
    this.showToast('Scorecard submitted for ' + ev.tag + '!');
  };

  playShadowFight = (sf, side) => {
    if (this.state.shadowPicks[sf.id]) return;
    this.playBell();
    this.setState(s => ({
      shadowPicks: { ...s.shadowPicks, [sf.id]: side },
      shadowPlays: { ...s.shadowPlays, [sf.id]: s.shadowPlays[sf.id] + 1 },
      coins: s.coins - 25,
    }));
    const correct = side === sf.winner;
    this.showToast(correct ? '✓ Correct! +50 FM' : 'Not quite — ' + (sf.winner === 'a' ? sf.f1 : sf.f2) + ' won that one');
    if (correct) this.setState(s => ({ coins: s.coins + 50 }));
  };
  promoteLiveEvent = () => {
    this.playCheer();
    this.showToast('📣 Live event link copied — invite your followers to play in your league!');
  };
  promoteShadowFight = (sf) => {
    this.playCheer();
    this.showToast('🕶 "' + sf.f1 + ' vs ' + sf.f2 + '" link copied — share with your followers!');
  };
  setFantasyPick = (genre, fighter) => this.setState(s => ({ fantasyDraft: { ...s.fantasyDraft, [genre]: fighter } }));
  submitFantasyCard = (campaign) => {
    const d = this.state.fantasyDraft;
    if (!d.boxing || !d.mma || !d.bareknuckle || !d.kickboxing || !d.wrestling) { this.showToast('Pick one fighter from every genre first'); return; }
    if (this.state.coins < campaign.entryFee) { this.showToast('Not enough FM coins — add more to draft'); this.openModal('addcoins'); return; }
    this.playBell(); this.playCheer();
    this.setState(s => ({
      fantasyCampaigns: s.fantasyCampaigns.map(c => c.id === campaign.id ? { ...c, joined: true, roster: d } : c),
      coins: s.coins - campaign.entryFee, modal: null,
      fantasyDraft: { boxing: null, mma: null, bareknuckle: null, kickboxing: null, wrestling: null },
    }));
    this.showToast('Fantasy Card locked in for ' + campaign.name + '! Scoring runs the whole season.');
  };
  demoGenres = {
    boxing: {
      title: 'BOXING / BARE KNUCKLE', color: '#f2b544', emoji: '🥊', fa: 'IRON JACKSON', fb: 'SLICK MORALES',
      cats: [['hp', 'Head Punches', 'Any punch thrown at the head — landed or not'], ['bp', 'Body Punches', 'Any punch thrown at the body — landed or not'], ['tp', 'Total Punches', 'All punches thrown, independent of HP+BP']], hasOutcome: true,
      rounds: [
        { note: 'Jackson presses forward behind the jab', a: { hp: 12, bp: 6, tp: 20 }, b: { hp: 9, bp: 5, tp: 16 } },
        { note: 'Morales counters clean off the ropes', a: { hp: 10, bp: 5, tp: 17 }, b: { hp: 13, bp: 7, tp: 22 } },
        { note: 'Jackson closes the round on volume', a: { hp: 14, bp: 8, tp: 24 }, b: { hp: 11, bp: 6, tp: 19 } },
      ],
    },
    mma: {
      title: 'MMA / KICKBOXING', color: '#4d8dff', emoji: '👊', fa: 'HAWK', fb: 'VIPER',
      cats: [['hp', 'Head Punches', 'Any punch thrown at the head'], ['bp', 'Body Punches', 'Any punch thrown at the body'], ['kicks', 'Kicks', 'Any leg, body or head kick thrown'], ['knees', 'Knees', 'Any clinch or flying knee thrown'], ['elbows', 'Elbows', 'Any elbow strike thrown']], hasOutcome: true,
      rounds: [
        { note: 'Feeling-out round, both fighters find their range', a: { hp: 4, bp: 2, kicks: 1, knees: 1, elbows: 0 }, b: { hp: 3, bp: 2, kicks: 2, knees: 0, elbows: 0 } },
        { note: 'VIPER opens up with leg kicks, HAWK keeps pressing forward', a: { hp: 5, bp: 3, kicks: 0, knees: 1, elbows: 0 }, b: { hp: 2, bp: 1, kicks: 5, knees: 1, elbows: 1 } },
        { note: 'HAWK closes the fight strong behind volume', a: { hp: 6, bp: 3, kicks: 1, knees: 0, elbows: 0 }, b: { hp: 4, bp: 2, kicks: 2, knees: 0, elbows: 1 } },
      ],
    },
    wrestling: {
      title: 'PRO WRESTLING', color: '#a855f7', emoji: '🤼', fa: 'THE MAULER', fb: 'SHOWTIME',
      cats: [['hp', 'Head Punches', 'Closed-fist strikes, forearms & open-hand strikes to the head'], ['bp', 'Body Punches', 'Punches & forearm shots to the torso'], ['kicks', 'Kicks', 'Dropkicks, superkicks, roundhouse kicks & other kicking attacks'], ['pm', 'Power Moves', 'Slams, suplexes, powerbombs & other high-impact throws'], ['fm', 'Finishers', 'Signature match-ending sequences — counts as a finisher attempt whether it wins the match or not']], hasOutcome: false, hasWinnerBonus: true,
      rounds: [
        { note: 'Early lock-up, feeling out the pace', a: { hp: 3, bp: 2, kicks: 1, pm: 1, fm: 0 }, b: { hp: 2, bp: 2, kicks: 1, pm: 1, fm: 0 } },
        { note: 'SHOWTIME hits a big power move off the top rope', a: { hp: 3, bp: 2, kicks: 2, pm: 1, fm: 0 }, b: { hp: 4, bp: 3, kicks: 1, pm: 2, fm: 0 } },
        { note: 'THE MAULER lands the finisher for the win', a: { hp: 4, bp: 3, kicks: 2, pm: 2, fm: 1 }, b: { hp: 3, bp: 2, kicks: 1, pm: 1, fm: 0 } },
      ],
    },
  };
  demoRoundTotal(r, side, cats) { return cats.reduce((n, [cat]) => n + r[side][cat], 0); }
  selectDemoGenre = (genre) => {
    this.playBell();
    const g = this.demoGenres[genre];
    const card = { a: {}, b: {}, winner: null, outcome: null };
    g.cats.forEach(([cat]) => { card.a[cat] = 0; card.b[cat] = 0; });
    this.setState({
      demoGenre: genre, demoCard: card, demoStep: 0, demoRoundsRevealed: 0,
      demoComments: [
        { id: 'dc1', name: 'DemoBot_Ace', text: 'Good luck everyone! 🔥' },
        { id: 'dc2', name: 'DemoBot_Rook', text: 'Let\'s see how this scores out' },
      ],
      demoLeaderboard: [
        { name: 'You', score: 0 }, { name: 'DemoBot_Ace', score: 0 }, { name: 'DemoBot_Rook', score: 0 },
        { name: 'DemoBot_Nova', score: 0 }, { name: 'DemoBot_Zed', score: 0 },
      ],
    });
  };
  updateDemoCard = (who, cat, delta) => this.setState(s => ({ demoCard: { ...s.demoCard, [who]: { ...s.demoCard[who], [cat]: Math.max(0, s.demoCard[who][cat] + delta) } } }));
  setDemoWinner = (w) => this.setState({ demoCard: { ...this.state.demoCard, winner: w } });
  setDemoOutcome = (o) => this.setState({ demoCard: { ...this.state.demoCard, outcome: o } });
  demoNext = () => {
    if (this.state.demoStep === 1 && !this.state.demoCard.winner) { this.showToast('Pick a winner to continue'); return; }
    this.playBell();
    this.setState(s => ({ demoStep: s.demoStep + 1 }));
  };
  demoBack = () => this.setState(s => ({ demoStep: Math.max(0, s.demoStep - 1) }));
  revealDemoRound = () => {
    this.playBell();
    this.setState(s => {
      const next = Math.min(3, s.demoRoundsRevealed + 1);
      if (next === 3) {
        const won = this.state.demoCard.winner === 'a';
        return {
          demoRoundsRevealed: next,
          demoLeaderboard: [
            { name: 'You', score: won ? 87 : 42 }, { name: 'DemoBot_Ace', score: 61 }, { name: 'DemoBot_Rook', score: 55 },
            { name: 'DemoBot_Nova', score: 73 }, { name: 'DemoBot_Zed', score: 38 },
          ].sort((x, y) => y.score - x.score)
        };
      }
      return { demoRoundsRevealed: next };
    });
  };
  setDemoCommentDraft = (v) => this.setState({ demoCommentDraft: v });
  addDemoComment = () => {
    const text = this.state.demoCommentDraft.trim();
    if (!text) return;
    this.playBell();
    this.setState(s => ({ demoComments: [...s.demoComments, { id: Date.now(), name: 'You', text, mine: true }], demoCommentDraft: '' }));
  };
  finishDemoCard = () => {
    this.playCheer();
    this.setState(s => ({ demoCardsDone: { ...s.demoCardsDone, [s.demoGenre]: true }, demoGenre: null }));
  };
  chestClick = () => {
    if (this.state.chestBurst) return;
    this.playBell(); this.playCheer();
    this.setState({ chestBurst: Date.now() });
    setTimeout(() => this.setState({ chestBurst: false }), 550);
    setTimeout(() => this.openModal('addcoins'), 500);
  };
  resetDemo = () => {
    this.setState({ demoGenre: null, demoCardsDone: { boxing: false, mma: false, wrestling: false } });
  };
  joinPublicLeague = (pl) => {
    if (pl.joined) return;
    this.playBell();
    this.setState(s => ({
      publicLeagues: s.publicLeagues.map(l => l.id === pl.id ? { ...l, joined: true, members: l.members + 1 } : l)
    }));
    this.showToast('Joined ' + pl.name + '! You\'re in for the ' + pl.pot.toLocaleString() + ' FM pot.');
  };

  joinLiveLeague = async (league) => {
    const id = cleanText(league?._id, league?.id);
    if (!id || this.state.joinedLeagueIds[id]) return;
    if (!this.props.onJoinLeague) {
      this.props.onJoin?.();
      return;
    }
    const joined = await this.props.onJoinLeague({ league });
    if (!joined) return;
    this.setState((state) => ({ joinedLeagueIds: { ...state.joinedLeagueIds, [id]: true } }));
    this.showToast('League joined successfully');
  };

  respondChallenge = (id, accept) => {
    this.setState(s => ({ challenges: s.challenges.map(c => c.id === id ? { ...c, status: accept ? 'accepted' : 'declined' } : c) }));
    this.showToast(accept ? 'Challenge accepted!' : 'Challenge declined');
    if (accept) {
      this.playBell();
      if (this.state.settings.autoSettle) this.autoSettleChallenge(id);
    }
  };

  autoSettleChallenge = (id) => {
    setTimeout(() => {
      const c = this.state.challenges.find(ch => ch.id === id);
      if (!c || c.status !== 'accepted') return;
      const won = Math.random() > 0.5;
      this.setState(s => ({
        challenges: s.challenges.map(ch => ch.id === id ? { ...ch, status: won ? 'settled_won' : 'settled_lost' } : ch),
        coins: won ? s.coins + c.wager : s.coins,
      }));
      this.playCheer(); if (won) this.playBell();
      this.showToast(won ? 'Auto-settled: you won ' + c.wager + ' FM!' : 'Auto-settled: better luck next time');
    }, 4000);
  };
  setLayout = (l) => this.setState({ layout: l });
  setCarousel = (i) => this.setState({ carouselIndex: i });

  setSport = (id) => this.setState({
    activeSport: this.state.activeSport === id ? 'all' : id,
    carouselIndex: 0,
  }, () => {
    if (this.state.activeTab !== 'home') return;
    window.requestAnimationFrame(() => {
      document.querySelector('[data-fmm-section="upcoming-events"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  openFeaturedPick = (event) => {
    if (!event?.playable) {
      this.props.onOpenFight?.({ event });
      return;
    }
    this.openModal('featuredPick', event);
  };

  confirmFeaturedPick = (side) => {
    const event = this.state.modalData;
    if (!event) return;
    this.setState({ modal: null, modalData: null }, () => this.enterEvent(event, { winner: side, source: 'featured-fight' }));
  };

  enterEvent = async (ev, prediction = null) => {
    if (!ev?.playable) {
      this.props.onOpenFight?.({ event: ev });
      return;
    }
    if (this.props.onSubmitPrediction) {
      const continueLocally = await this.props.onSubmitPrediction({ type: ev.sport, event: ev, prediction });
      if (continueLocally === false) return;
    }
    if (this.state.enteredEvents[ev.id]) return;
    const entryFee = this.getEventEntryFee(ev);
    if (this.state.coins < entryFee) {
      this.showToast(`This contest needs ${entryFee.toLocaleString()} FM — add coins to continue`);
      this.openModal('addcoins');
      return;
    }
    if (ev.sport === 'wrestling') { this.openModal('wrestlingScorecard', ev); return; }
    if (ev.sport === 'boxing' || ev.sport === 'bareknuckle') { this.openModal('boxingScorecard', ev); return; }
    if (ev.sport === 'mma' || ev.sport === 'kickboxing') { this.openModal('mmaScorecard', ev); return; }
    this.playBell();
    this.setState(s => ({
      enteredEvents: { ...s.enteredEvents, [ev.id]: true },
      coins: s.coins - entryFee,
    }));
    this.showToast(`Entered ${ev.tag}${entryFee ? `! -${entryFee} FM` : '!'}`);
  };

  saveStreak = () => {
    const cost = this.state.isSubscribed ? 25 : 50;
    if (this.state.coins < cost) { this.showToast('Not enough FM coins to save your streak'); this.openModal('addcoins'); return; }
    this.playBell();
    this.setState(s => ({ coins: s.coins - cost, streakExpiresIn: 24 * 3600 }));
    this.showToast(`🔥 Streak saved for ${cost} FM — timer reset!`);
  };

  unlockNextReward = () => {
    if (this.state.coins < 75) { this.showToast('Not enough FM coins to skip the wait'); this.openModal('addcoins'); return; }
    this.playCheer(); this.playBell();
    this.setState(s => ({
      coins: s.coins - 75 + 250,
      rewardClaimed: false,
      streakDay: Math.min(7, s.streakDay + 1),
      chestBounce: s.chestBounce + 1,
      streakExpiresIn: 24 * 3600,
    }));
    this.showToast('⚡ Skipped the wait — next reward unlocked for 75 FM!');
  };

  subscribeFmPlus = () => {
    if (this.props.onSubscribe) {
      this.props.onSubscribe({ plan: this.state.fmPlusMode });
      return;
    }
    this.playCheer();
    this.setState(s => ({ isSubscribed: true, coins: s.coins + 1000, modal: null }));
    this.showToast('⭐ Welcome to FM+ — 1,000 bonus FM added!');
  };

  claimReward = () => {
    if (this.state.rewardClaimed) return;
    this.playCheer(); this.playBell();
    this.setState(s => ({
      coins: s.coins + 250,
      rewardClaimed: true,
      streakDay: Math.min(7, s.streakDay + 1),
      chestBounce: s.chestBounce + 1,
      streakExpiresIn: 24 * 3600,
    }));
    this.showToast('+250 FM claimed!');
  };

  addCoins = (amount, price) => {
    const numericPrice = Number(String(price || '').replace(/[^0-9.]/g, '')) || 0;
    const sku = `fm-${amount}`;
    this.setState((state) => {
      const existing = state.cart.find((item) => item.sku === sku);
      const cart = existing
        ? state.cart.map((item) => item.sku === sku ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item)
        : [...state.cart, { sku, coins: amount, price: numericPrice, quantity: 1 }];
      return { cart, modal: null, activeTab: 'cart' };
    });
    this.showToast(`${amount.toLocaleString()} FM pack added to cart`);
  };

  changeCartQuantity = (sku, delta) => this.setState((state) => ({
    cart: state.cart
      .map((item) => item.sku === sku
        ? { ...item, quantity: Math.min(10, Math.max(0, item.quantity + delta)) }
        : item)
      .filter((item) => item.quantity > 0),
  }));

  removeCartItem = (sku) => this.setState((state) => ({
    cart: state.cart.filter((item) => item.sku !== sku),
  }));

  continueCartCheckout = () => {
    if (!this.state.cart.length) {
      this.openModal('addcoins');
      return;
    }
    this.props.onPurchaseCoins?.({
      product: 'fm-coins',
      items: this.state.cart.map(({ sku, quantity }) => ({ sku, quantity })),
    });
  };

  vote = (fighter) => {
    if (this.state.userVote) return;
    this.setState(s => {
      const bump = 3;
      let jones = s.votes.jones, aspinall = s.votes.aspinall;
      if (fighter === 'jones') { jones += bump; aspinall -= bump; } else { aspinall += bump; jones -= bump; }
      return { userVote: fighter, votes: { jones, aspinall } };
    });
    this.showToast('Vote locked in!');
  };

  lockPrediction = (eventId, fighter) => {
    this.playBell();
    this.setState(s => ({ predictions: { ...s.predictions, [eventId]: fighter } }));
    this.showToast('Prediction locked: ' + fighter);
  };

  markNotifsRead = () => this.setState({ notifCount: 0 });

  joinNow = () => {
    if (this.props.onJoin) {
      this.props.onJoin(this.state.joinDraft);
      return;
    }
    this.playCheer(); this.playBell(); this.showToast('Welcome to Fantasy MMAdness!'); this.closeModal();
  };

  copyReferral = () => {
    this.props.onShare?.({ platform: 'copy', text: 'Join my Fantasy MMAdness fight card.' });
    this.showToast('Referral link copied!');
  };
  shareToSocial = (platform) => {
    this.playCheer();
    this.props.onShare?.({ platform, text: 'Join my Fantasy MMAdness fight card.' });
    this.showToast('📱 ' + platform + ' post ready — your link + the fight poster are pre-loaded, just tap send!');
  };

  renderVals() {
    const s = this.state;

    const sports = [
      { id: 'boxing', name: 'BOXING', count: '', color: '#ef4444' },
      { id: 'mma', name: 'UFC / MMA', count: '', color: '#4d8dff' },
      { id: 'bareknuckle', name: 'BARE KNUCKLE', count: '', color: '#f2b544' },
      { id: 'kickboxing', name: 'KICKBOXING', count: '', color: '#22c55e' },
      { id: 'wrestling', name: 'PRO WRESTLING', count: '', color: '#a855f7' },
    ].map(sp => ({ ...sp, active: s.activeSport === sp.id }));

    const liveEvents = Array.isArray(this.props.fights)
      ? this.props.fights.map(normalizeLiveEvent).filter(event => event.f1 && event.f2)
      : [];
    const eventsRaw = liveEvents;
    const now = new Date();
    const MS_DAY = 86400000;
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const eventsUpcoming = eventsRaw.filter(ev => !ev.iso || dateOnlyToLocalDate(ev.iso, '23:59') >= now);
    const events = eventsUpcoming.map(ev => {
      const d = dateOnlyToLocalDate(ev.iso, ev.matchTime || '23:59');
      const diffMs = d ? d - now : 0;
      const days = Math.max(0, Math.floor(diffMs / MS_DAY));
      const hours = Math.max(0, Math.floor((diffMs % MS_DAY) / 3600000));
      return {
        ...ev,
        date: d ? monthNames[d.getMonth()] + ' ' + d.getDate() : 'DATE TBA',
        countdown: d ? days + 'D : ' + String(hours).padStart(2, '0') + 'H' : 'OPEN',
        entered: Boolean(ev.serverEntered || s.enteredEvents[ev.id]),
        picked: cleanText(ev.userEntry?.pickName, s.predictions[ev.id]) || null,
      };
    });
    sports.forEach((sport) => {
      sport.count = String(events.filter((event) => event.sport === sport.id).length);
    });
    const filteredEvents = s.activeSport === 'all' ? events : events.filter(e => e.sport === s.activeSport);

    const liveLeaderboard = Array.isArray(this.props.leaderboard)
      ? this.props.leaderboard.map((row, index) => ({
          rank: Number(row.rank || index + 1),
          name: cleanText(row.displayName, row.playerName, row.username, row.name, `Player ${index + 1}`),
          pts: Number(row.totalPoints ?? row.points ?? row.score ?? 0).toLocaleString(),
          medal: index === 0 ? '#f2b544' : index === 1 ? '#c9ccd1' : index === 2 ? '#c9772e' : null,
          you: cleanText(row._id, row.id) && cleanText(row._id, row.id) === cleanText(this.props.currentUser?._id, this.props.currentUser?.id),
        }))
      : [];
    const leaderboardFull = liveLeaderboard;

    const fallbackApparel = [
      { name: 'MMADNESS HOODIE', price: '$49.99', slot: 'ap1' },
      { name: 'FIGHT TEE', price: '$29.99', slot: 'ap2' },
      { name: 'SNAPBACK CAP', price: '$24.99', slot: 'ap3' },
      { name: 'FIGHT SHORTS', price: '$39.99', slot: 'ap4' },
      { name: 'TRAINING GLOVES', price: '$34.99', slot: 'ap5' },
    ].map((item) => ({
      ...item,
      id: item.slot,
      images: [`${ASSET_BASE}/${directSlotAssets[item.slot]}`],
      fallbackImage: `${ASSET_BASE}/${directSlotAssets[item.slot]}`,
    }));
    const liveApparel = Array.isArray(this.props.apparel)
      ? this.props.apparel.map((item, index) => {
          const slot = `ap${(index % 5) + 1}`;
          const fallbackImage = `${ASSET_BASE}/${directSlotAssets[slot]}`;
          const images = getApparelImages(item);
          const rawPrice = item.price?.amount ?? item.price?.value ?? item.price;
          return {
            id: cleanText(item.sku, item.etsyListingId, item._id, item.id, `apparel-${index}`),
            name: cleanText(item.title, item.name, `APPAREL ${index + 1}`).toUpperCase(),
            price: cleanText(item.formattedPrice, item.displayPrice, item.price?.formatted, rawPrice !== undefined && rawPrice !== null && rawPrice !== '' ? `$${rawPrice}` : '', 'VIEW'),
            slot,
            images: images.length ? images : [fallbackImage],
            fallbackImage,
            href: cleanText(item.buyUrl, item.externalUrl, item.url, item.href),
          };
        })
      : [];
    const apparel = liveApparel.length ? liveApparel : fallbackApparel;

    const fallbackBlogs = [
      { id: 'b1', title: 'UFC 323 PREVIEW: JONES VS ASPINALL', body: 'Breaking down the heavyweight title clash — striking gaps, grappling exchanges, and where the smart FM picks lie ahead of fight night.', icon: '🥊', colors: ['#ef4444', '#f2b544'] },
      { id: 'b2', title: '5 KEYS TO MAKING BETTER PICKS', body: 'From reach and cardio metrics to camp form, here are five habits that separate top-of-leaderboard predictors from the rest.', icon: '🎯', colors: ['#a855f7', '#4d8dff'] },
      { id: 'b3', title: 'FIGHT IQ STRATEGY: THINK LIKE A FIGHTER', body: 'Level up your Fight IQ score by studying gameplans the way real corners do — round by round, not just the final decision.', icon: '🧠', colors: ['#22c55e', '#4d8dff'] },
    ];
    const liveBlogs = Array.isArray(this.props.blogs)
      ? this.props.blogs.map((blog, index) => ({
          id: cleanText(blog._id, blog.id, `blog-${index}`),
          title: cleanText(blog.title, blog.header, blog.metaTitle, 'FIGHT INTELLIGENCE').toUpperCase(),
          body: cleanText(blog.description, blog.metaDescription, blog.excerpt, blog.body, 'Open the full story for fight analysis.'),
          icon: ['🥊', '🎯', '🧠'][index % 3],
          colors: [['#ef4444', '#f2b544'], ['#a855f7', '#4d8dff'], ['#22c55e', '#4d8dff']][index % 3],
        }))
      : [];
    const blogs = liveBlogs.length ? liveBlogs : fallbackBlogs;

    const streakDays = [1, 2, 3, 4, 5, 6, 7].map(d => ({ d, done: d <= s.streakDay, current: d === s.streakDay }));

    const votesTotal = s.votes.jones + s.votes.aspinall;
    const jonesPct = Math.round(s.votes.jones);
    const aspinallPct = 100 - jonesPct;
    const dashArray = 251.2;
    const dashOffset = dashArray * (1 - jonesPct / 100);

    const navItems = [
      { id: 'home', label: 'HOME' },
      { id: 'contests', label: 'CONTESTS' },
      { id: 'predict', label: 'MAKE\nPREDICTIONS' },
      { id: 'leaderboard', label: 'LEADERBOARD' },
      { id: 'profile', label: 'PROFILE' },
    ].map(n => ({ ...n, active: s.activeTab === n.id }));

    const coinsFmt = s.coins.toLocaleString();
    const xpPct = s.xpMounted ? 81.6 : 0;

    const activeView = React.createElement('div', {
      className: `fmm-prototype-view fmm-prototype-view--${s.activeTab}`,
    },
      s.activeTab === 'home' && this.renderHome(sports, filteredEvents, events, leaderboardFull, apparel, blogs, streakDays, jonesPct, aspinallPct, dashArray, dashOffset, xpPct, s),
      s.activeTab === 'contests' && this.renderContests(sports, filteredEvents, s),
      s.activeTab === 'leaderboard' && this.renderLeaderboard(leaderboardFull),
      s.activeTab === 'predict' && this.renderPredict(events, s),
      s.activeTab === 'profile' && this.renderProfile(coinsFmt, streakDays, xpPct),
      s.activeTab === 'watch' && this.renderWatchParty(s, jonesPct, aspinallPct, events),
      s.activeTab === 'leagues' && this.renderLeagues(s, events),
      s.activeTab === 'settings' && this.renderSettings(s),
      s.activeTab === 'demo' && this.renderDemo(s),
      s.activeTab === 'blogs' && this.renderBlogsPage(blogs),
      s.activeTab === 'cart' && this.renderCart(s)
    );

    const screen = React.createElement('div', {
      className: 'fmm-prototype-screen',
      style: { position: 'relative', width: '100%', height: '100dvh', maxHeight: '100dvh', minHeight: 620, background: '#05060a', color: '#fff', overflow: 'hidden', fontFamily: "'Rajdhani',sans-serif", display: 'flex', flexDirection: 'column' }
    },
      React.createElement('div', {
        className: 'fmm-prototype-scroll',
        style: { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingTop: 0 }
      },
        this.renderTopBar(coinsFmt, s.notifCount),
        activeView
      ),
      this.renderBottomNav(navItems),
      this.renderModal(s, events, jonesPct, aspinallPct),
      s.toast && React.createElement('div', {
        style: {
          position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#1c1f27,#12141b)', border: '1px solid rgba(242,181,68,.4)',
          color: '#f2b544', padding: '10px 18px', borderRadius: 999, fontSize: 14, fontWeight: 700,
          whiteSpace: 'nowrap', zIndex: 500, animation: 'toastIn .25s ease-out', boxShadow: '0 8px 24px rgba(0,0,0,.5)'
        }
      }, s.toast)
    );

    return { screen };
  }

  ambientParticles = [
    { left: 6, top: 8, size: 3, dur: 9, anim: 'ambientDrift1', color: '#f2b544' }, { left: 88, top: 14, size: 2, dur: 11, anim: 'ambientDrift2', color: '#ef4444' },
    { left: 22, top: 32, size: 2.5, dur: 8, anim: 'ambientDrift3', color: '#4d8dff' }, { left: 70, top: 25, size: 2, dur: 12, anim: 'ambientDrift1', color: '#a855f7' },
    { left: 45, top: 12, size: 3, dur: 10, anim: 'ambientDrift2', color: '#f2b544' }, { left: 12, top: 55, size: 2, dur: 9.5, anim: 'ambientDrift3', color: '#22c55e' },
    { left: 92, top: 48, size: 2.5, dur: 13, anim: 'ambientDrift1', color: '#ef4444' }, { left: 60, top: 62, size: 2, dur: 8.5, anim: 'ambientDrift2', color: '#4d8dff' },
    { left: 30, top: 70, size: 3, dur: 11.5, anim: 'ambientDrift3', color: '#f2b544' }, { left: 80, top: 78, size: 2, dur: 10.5, anim: 'ambientDrift1', color: '#a855f7' },
    { left: 15, top: 88, size: 2.5, dur: 9, anim: 'ambientDrift2', color: '#22c55e' }, { left: 50, top: 92, size: 2, dur: 12.5, anim: 'ambientDrift3', color: '#ef4444' },
    { left: 38, top: 5, size: 3, dur: 10, anim: 'ambientDrift1', color: '#4d8dff' }, { left: 66, top: 40, size: 2.5, dur: 8, anim: 'ambientDrift2', color: '#f2b544' },
    { left: 8, top: 20, size: 2, dur: 11, anim: 'ambientDrift3', color: '#a855f7' }, { left: 95, top: 65, size: 3, dur: 9, anim: 'ambientDrift1', color: '#ef4444' },
    { left: 55, top: 82, size: 2.5, dur: 12, anim: 'ambientDrift2', color: '#22c55e' }, { left: 25, top: 45, size: 2, dur: 10.5, anim: 'ambientDrift3', color: '#f2b544' },
    { left: 72, top: 8, size: 2.5, dur: 9.5, anim: 'ambientDrift1', color: '#a855f7' }, { left: 4, top: 68, size: 3, dur: 11.5, anim: 'ambientDrift2', color: '#4d8dff' },
  ];
  renderAmbientBg() {
    return React.createElement('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 350 } },
      this.ambientParticles.map((p, i) => React.createElement('div', {
        key: i, style: {
          position: 'absolute', left: p.left + '%', top: p.top + '%', width: p.size * 2.2, height: p.size * 2.2, borderRadius: '50%',
          background: p.color, opacity: .85, boxShadow: '0 0 10px ' + p.color + ', 0 0 18px ' + p.color, animation: p.anim + ' ' + p.dur + 's ease-in-out infinite'
        }
      }))
    );
  }

  renderTopBar(coinsFmt, notifCount) {
    return React.createElement('div', { className: 'fmm-prototype-topbar', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px', position: 'relative', zIndex: 5 } },
      React.createElement('div', {
        onClick: () => this.openModal('menu'),
        style: { width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,.08)' }
      },
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
          [0, 1, 2].map(i => React.createElement('div', { key: i, style: { width: 18, height: 2, background: '#fff', borderRadius: 2 } }))
        )
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        React.createElement('div', {
          onClick: () => this.openModal('wallet'),
          style: {
            display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#1c1f27,#0f1116)',
            border: '1px solid rgba(242,181,68,.5)', borderRadius: 999, padding: '6px 10px', cursor: 'pointer'
          }
        },
          React.createElement('div', { style: { width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#ffe08a,#a8720f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#3a2500' } }, 'FM'),
          React.createElement('span', { style: { fontWeight: 700, fontSize: 13, animation: 'moneyPulseGold 1.8s ease-in-out infinite' } }, coinsFmt),
          React.createElement('div', { style: { width: 16, height: 16, borderRadius: '50%', background: '#f2b544', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#3a2500' } }, '+')
        ),
        React.createElement('div', {
          onClick: () => this.setTab('cart'),
          'aria-label': 'Open FM coin cart',
          style: { position: 'relative', width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
        },
          React.createElement('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#f2b544', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            React.createElement('circle', { cx: 9, cy: 21, r: 1 }),
            React.createElement('circle', { cx: 20, cy: 21, r: 1 }),
            React.createElement('path', { d: 'M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6' })
          ),
          this.state.cart.length > 0 && React.createElement('div', { style: { position: 'absolute', top: -4, right: -4, background: '#f2b544', color: '#2b1b00', fontSize: 10, fontWeight: 900, borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, this.state.cart.reduce((total, item) => total + item.quantity, 0))
        ),
        React.createElement('div', {
          onClick: () => this.openModal('notif'),
          style: { position: 'relative', width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
        },
          React.createElement('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 2 },
            React.createElement('path', { d: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9' }),
            React.createElement('path', { d: 'M13.73 21a2 2 0 01-3.46 0' })
          ),
          notifCount > 0 && React.createElement('div', { style: { position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, notifCount)
        )
      )
    );
  }

  renderBottomNav(navItems) {
    const icons = {
      home: (c) => React.createElement('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 2 }, React.createElement('path', { d: 'M3 11l9-8 9 8' }), React.createElement('path', { d: 'M5 10v10h14V10' })),
      contests: (c) => React.createElement('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 2 }, React.createElement('path', { d: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z' }), React.createElement('path', { d: 'M7 6H4v1a4 4 0 003 3.87M17 6h3v1a4 4 0 01-3 3.87' })),
      predict: (c) => React.createElement('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 9 }), React.createElement('circle', { cx: 12, cy: 12, r: 4 }), React.createElement('circle', { cx: 12, cy: 12, r: 0.5, fill: c })),
      leaderboard: (c) => React.createElement('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 2 }, React.createElement('path', { d: 'M4 18l3-9 5 3.5L17 6l3 12z', fill: c, stroke: 'none' }), React.createElement('circle', { cx: 4, cy: 18, r: 1.4, fill: c, stroke: 'none' }), React.createElement('circle', { cx: 12, cy: 12.5, r: 1.4, fill: c, stroke: 'none' }), React.createElement('circle', { cx: 17, cy: 6, r: 1.4, fill: c, stroke: 'none' }), React.createElement('circle', { cx: 20, cy: 18, r: 1.4, fill: c, stroke: 'none' }), React.createElement('rect', { x: 3, y: 19, width: 18, height: 2, rx: 1, fill: c, stroke: 'none' })),
      profile: (c) => React.createElement('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 8, r: 4 }), React.createElement('path', { d: 'M4 21c0-4 4-7 8-7s8 3 8 7' })),
    };
    const tabColors = { home: '#f2b544', predict: '#ef4444', contests: '#4d8dff', leaderboard: '#22c55e', profile: '#a855f7' };
    return React.createElement('div', {
      className: 'fmm-prototype-bottom-nav',
      style: {
        position: 'relative', flex: '0 0 auto', display: 'flex', background: 'rgba(8,9,13,.96)',
        borderTop: '1px solid rgba(255,255,255,.08)', padding: '10px 4px 22px', backdropFilter: 'blur(10px)', zIndex: 400
      }
    },
      navItems.map(n => React.createElement('div', {
        key: n.id, onClick: () => this.setTab(n.id),
        style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', position: 'relative' }
      },
        n.active && React.createElement('div', { style: { position: 'absolute', top: -10, width: 28, height: 3, borderRadius: 2, background: tabColors[n.id], boxShadow: '0 0 8px ' + tabColors[n.id] } }),
        React.createElement('div', { style: { color: n.active ? tabColors[n.id] : tabColors[n.id] + '70', animation: 'navIconPulse 1.6s ease-in-out infinite' } }, icons[n.id](n.active ? tabColors[n.id] : tabColors[n.id] + '70')),
        React.createElement('div', { style: { fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.1, whiteSpace: 'pre-line', color: n.active ? tabColors[n.id] : tabColors[n.id] + '70', letterSpacing: .3 } }, n.label)
      ))
    );
  }

  renderHome(sports, filteredEvents, allEvents, leaderboardFull, apparel, blogs, streakDays, jonesPct, aspinallPct, dashArray, dashOffset, xpPct, s) {
    const bannerEvent = allEvents.find((event) => event.featuredThisWeek) || allEvents[0];
    const detailEvent = allEvents.find((event) => event.featuredFight)
      || allEvents.find((event) => event.id !== bannerEvent?.id)
      || bannerEvent;
    const top = s.layout === 'bold'
      ? React.createElement(React.Fragment, null,
          this.renderBoldHero(),
          this.renderStorySports(sports),
          this.renderBento(jonesPct, aspinallPct, dashOffset, xpPct, s, bannerEvent),
          this.renderEventCarousel(filteredEvents, s)
        )
      : React.createElement(React.Fragment, null,
          this.props.currentUser ? this.renderReturningHero(allEvents, s) : this.renderHero(),
          this.renderTicker(),
          this.renderStatsBar(),
          this.renderSportSelector(sports, s),
          this.renderFeaturedBanner(bannerEvent),
          this.renderUpcomingEvents(filteredEvents, s),
          this.renderFeaturedDetail(s, detailEvent)
        );
    return React.createElement(React.Fragment, null,
      this.renderLayoutSwitch(s),
      top,
      this.renderStartHere(allEvents, s),
      this.renderMyEntries(allEvents, s),
      this.renderWatchLeaguesPromo(),
      React.createElement('div', {
        onClick: () => this.setTab('demo'),
        style: { margin: '0 16px 16px', textAlign: 'center', padding: '16px 0 12px', borderRadius: 10, background: '#16a34a', border: '2px solid #22c55e', color: '#fff', fontWeight: 900, fontSize: 12, cursor: 'pointer', boxShadow: '0 0 22px rgba(34,197,94,.7)', position: 'relative' }
      },
        React.createElement('div', { style: { position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, padding: '3px 10px', borderRadius: 999, animation: 'pulseLive 1s infinite', boxShadow: '0 0 10px rgba(239,68,68,.8)', whiteSpace: 'nowrap' } }, 'NEW HERE?'),
        React.createElement('div', { style: { color: '#eaffef', marginTop: 4 } }, 'TRY A FREE DEMO FIGHT — NO COINS NEEDED')
      ),
      s.layout === 'classic' && allEvents.length > 0 && this.renderCommunityAndProgress(allEvents, xpPct, s),
      this.renderRewardsRow(streakDays, s),
      this.renderApparel(apparel, s),
      this.renderBlogsAndAffiliate(s)
    );
  }

  sportOrder = ['boxing', 'mma', 'bareknuckle', 'kickboxing', 'wrestling'];
  getSportLabel = (id) => ({ boxing: 'BOXING', mma: 'MMA', bareknuckle: 'BARE KNUCKLE', kickboxing: 'KICKBOXING', wrestling: 'PRO WRESTLING' }[id] || 'ANOTHER SPORT');
  getNextSport = (current) => {
    const index = this.sportOrder.indexOf(current);
    return this.sportOrder[(index < 0 ? 0 : index + 1) % this.sportOrder.length];
  };
  myEntries = (events, s = this.state) => (events || []).filter((event) => event.entered || s.enteredEvents[event.id]);
  openWatchFor = (event) => {
    this.setState({ watchFightId: event.id });
    this.setTab('watch');
  };
  watchFight = (s, events = []) => {
    const preferred = (events || []).find((event) => event.id === s.watchFightId);
    return preferred || this.myEntries(events, s)[0] || events[0] || null;
  };

  renderReturningHero(events, s) {
    const mine = this.myEntries(events, s);
    const next = mine[0] || (events || []).find((event) => event.playable) || events?.[0];
    if (!next) return null;
    return React.createElement('section', {
      style: { margin: '0 16px 14px', borderRadius: 16, overflow: 'hidden', position: 'relative', background: 'radial-gradient(circle at 20% -10%,rgba(239,68,68,.35),transparent 55%),radial-gradient(circle at 90% 110%,rgba(77,141,255,.3),transparent 55%),#0b0c12', border: '1px solid rgba(242,181,68,.35)', padding: 16 }
    },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
        React.createElement('div', { style: { fontSize: 10.5, fontWeight: 900, letterSpacing: .8, color: '#f2b544' } }, '🔥 WELCOME BACK'),
        React.createElement('div', { style: { fontSize: 10.5, fontWeight: 900, color: '#f2b544', fontVariantNumeric: 'tabular-nums' } }, `${s.coins.toLocaleString()} FM`)),
      mine.length
        ? React.createElement(React.Fragment, null,
            React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 19, lineHeight: 1.15, marginBottom: 4 } }, `${next.f1} vs ${next.f2}`),
            React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginBottom: 12 } }, `You’re entered · closes in ${next.countdown || 'soon'}`),
            React.createElement('div', { role: 'button', tabIndex: 0, onClick: () => this.openWatchFor(next), style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 900, fontSize: 12.5, cursor: 'pointer' } }, 'WATCH LIVE ›'))
        : React.createElement(React.Fragment, null,
            React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 19, lineHeight: 1.15, marginBottom: 4 } }, 'READY FOR YOUR NEXT PICK?'),
            React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginBottom: 12 } }, `${next.f1} vs ${next.f2}${next.prize ? ` · ${next.prize} pool` : ''}`),
            React.createElement('div', { role: 'button', tabIndex: 0, onClick: () => this.openFeaturedPick(next), style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 900, fontSize: 12.5, cursor: 'pointer' } }, 'MAKE A PICK ›'))
    );
  }

  renderStartHere(events, s) {
    if (this.props.dataLoading || this.myEntries(events, s).length) return null;
    const first = (events || []).find((event) => event.playable);
    if (!first) return null;
    const entryLabel = this.getEventEntryLabel(first);
    return React.createElement('div', { style: { margin: '0 16px 16px', padding: 14, borderRadius: 14, background: 'linear-gradient(160deg,rgba(242,181,68,.16),rgba(255,255,255,.02))', border: '1.5px solid rgba(242,181,68,.5)' } },
      React.createElement('div', { style: { fontSize: 9.5, fontWeight: 900, letterSpacing: 1, color: '#f2b544', marginBottom: 6 } }, 'START HERE · STEP 1 OF 1'),
      React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 19, lineHeight: 1.15, marginBottom: 5 } }, 'PICK A WINNER. THAT’S IT.'),
      React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', lineHeight: 1.55, marginBottom: 11 } },
        `Open ${first.f1} vs ${first.f2} and make your first real fight card. Every field starts at zero until you enter it.`),
      React.createElement('div', {
        onClick: () => this.openEvent(first),
        style: { textAlign: 'center', padding: '14px 10px', borderRadius: 999, background: 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 900, fontSize: 13, letterSpacing: .6, cursor: 'pointer', boxShadow: '0 6px 22px rgba(242,181,68,.35)' },
      }, `MAKE MY FIRST PICK — ${first.f1} VS ${first.f2}`),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 5, marginTop: 9, fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.4)' } },
        React.createElement('span', null, `${entryLabel} entry`), React.createElement('span', null, '·'),
        first.prize && React.createElement('span', null, `${first.prize} pool`), first.prize && React.createElement('span', null, '·'),
        React.createElement('span', null, `closes in ${first.countdown}`)),
    );
  }

  renderMyEntries(events, s) {
    const mine = this.myEntries(events, s);
    if (!mine.length) return null;
    return React.createElement('div', { style: { padding: '0 16px 16px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
        React.createElement('div', { style: { fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(255,255,255,.7)' } }, 'MY ENTRIES'),
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#22c55e' } }, `${mine.length} LIVE`)),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, mine.map((event) => {
        const storedSplit = event.aiScoutingReport?.pickSplit;
        const localVotes = s.eventVotes[event.id] || { a: 50, b: 50 };
        const split = storedSplit ? { a: Number(storedSplit.fighterA), b: Number(storedSplit.fighterB) } : localVotes;
        const pickSide = event.userEntry?.pickSide || (s.boxingScorecards[event.id] || s.mmaScorecards[event.id] || s.wrestlingScorecards[event.id] || {}).winner;
        const withYou = pickSide === 'b' ? split.b : split.a;
        const pickName = event.userEntry?.pickName || (pickSide === 'b' ? event.f2 : pickSide === 'a' ? event.f1 : 'CARD SUBMITTED');
        return React.createElement('div', {
          key: event.id, onClick: () => this.openWatchFor(event),
          style: { padding: 12, borderRadius: 12, background: 'linear-gradient(160deg,rgba(34,197,94,.1),rgba(255,255,255,.02))', border: '1px solid rgba(34,197,94,.35)', cursor: 'pointer' },
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 } },
            React.createElement('div', { style: { fontSize: 9.5, fontWeight: 900, color: event.tagColor, letterSpacing: .5 } }, event.tag),
            React.createElement('div', { style: { fontSize: 9.5, fontWeight: 900, color: '#f2b544', fontVariantNumeric: 'tabular-nums' } }, `⏱ ${event.countdown}`)),
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 15, marginBottom: 5 } }, `${event.f1} vs ${event.f2}`),
          React.createElement('div', { style: { fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,.65)', marginBottom: 7 } }, 'Your pick: ', React.createElement('span', { style: { color: '#22c55e', fontWeight: 900 } }, pickName)),
          React.createElement('div', { style: { height: 4, borderRadius: 999, background: 'rgba(255,255,255,.12)', overflow: 'hidden', marginBottom: 5 } },
            React.createElement('div', { style: { width: `${Math.max(0, Math.min(100, Number(withYou) || 0))}%`, height: '100%', background: 'linear-gradient(90deg,#22c55e,#4ade80)', transition: 'width .6s ease' } })),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 9.5, fontWeight: 800 } },
            React.createElement('span', { style: { color: 'rgba(255,255,255,.5)' } }, `${Number(withYou) || 0}% of players are with you`),
            React.createElement('span', { style: { color: '#4d8dff' } }, 'WATCH LIVE ›')),
        );
      })),
    );
  }

  renderLayoutSwitch(s) {
    return React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: 6, padding: '0 16px 10px' } },
      ['classic', 'bold'].map(l => React.createElement('div', {
        key: l, onClick: () => this.setLayout(l),
        style: {
          padding: '6px 16px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap',
          background: s.layout === l ? 'linear-gradient(90deg,#f2b544,#ef4444)' : 'rgba(255,255,255,.06)',
          color: s.layout === l ? '#1a0e00' : 'rgba(255,255,255,.5)', border: '1px solid ' + (s.layout === l ? 'transparent' : 'rgba(255,255,255,.1)')
        }
      }, l === 'classic' ? 'CLASSIC' : '⚡ BOLD'))
    );
  }

  renderBoldHero() {
    return React.createElement('div', { style: { position: 'relative', margin: '0 16px 14px', borderRadius: 20, overflow: 'hidden', height: 340, border: '1px solid rgba(242,181,68,.3)' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0, display: 'flex' } },
        React.createElement(MobileImageSlot, { id: 'bold-hero', shape: 'rect', placeholder: 'Wide fight action hero photo' , fit: 'contain'})
      ),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,6,10,.25) 0%,rgba(5,6,10,.55) 55%,rgba(5,6,10,.96) 100%)' } }),
      React.createElement('div', { style: { position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' } },
        React.createElement('div', { style: { background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 999, padding: '5px 12px', fontSize: 10, fontWeight: 800, color: '#f2b544', whiteSpace: 'nowrap', flex: '0 0 auto' } }, '🔥 56 LIVE'),
        React.createElement('div', { style: { background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 999, padding: '5px 12px', fontSize: 10, fontWeight: 800, color: '#22c55e', whiteSpace: 'nowrap', flex: '0 0 auto' } }, '$250K+ PRIZES')
      ),
      React.createElement('div', { style: { position: 'absolute', bottom: 16, left: 16, right: 16 } },
        React.createElement('div', {
          style: {
            fontFamily: "'Anton',sans-serif", fontSize: 46, lineHeight: .95, letterSpacing: .5,
            background: 'linear-gradient(90deg,#f2b544,#ef4444,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'wordmarkGlow 2.6s ease-in-out infinite', textShadow: 'none'
          }
        }, 'FANTASY MMAdness'),
        React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.75)', marginTop: 4 } }, 'The prediction game every fight fan is talking about.'),
        React.createElement('div', {
          onClick: () => this.openModal('join'),
          style: {
            marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '13px 28px', borderRadius: 999,
            background: 'linear-gradient(90deg,#ffd873,#f2b544,#ffe9a8,#f2b544,#ffd873)', backgroundSize: '200% 100%',
            animation: 'shimmerBtn 2.5s linear infinite, joinGlow 2s ease-in-out infinite', color: '#2b1b00', fontWeight: 900, fontSize: 14, cursor: 'pointer'
          }
        }, 'JOIN FREE »')
      )
    );
  }

  renderStorySports(sports) {
    return React.createElement('div', { style: { display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px 16px' } },
      sports.map(sp => React.createElement('div', {
        key: sp.id, onClick: () => this.setSport(sp.id),
        style: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }
      },
        React.createElement('div', {
          style: {
            width: 66, height: 66, borderRadius: '50%', padding: 3,
            background: sp.active ? 'linear-gradient(135deg,#f2b544,#ef4444,#a855f7)' : 'linear-gradient(135deg,rgba(255,255,255,.15),rgba(255,255,255,.05))'
          }
        },
          React.createElement('div', { style: { width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid #05060a', background: '#000' } },
            React.createElement(MobileImageSlot, { id: 'story-' + sp.id, shape: 'circle', placeholder: sp.name, fit: 'cover' })
          )
        ),
        React.createElement('div', { style: { fontSize: 8.5, fontWeight: 800, color: sp.active ? '#f2b544' : 'rgba(255,255,255,.6)', textAlign: 'center', width: 66, lineHeight: 1.15 } }, sp.name)
      ))
    );
  }

  renderBento(jonesPct, aspinallPct, dashOffset, xpPct, s, featuredEvent) {
    const glass = { background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, backdropFilter: 'blur(6px)' };
    return React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 16px' } },
      React.createElement('div', {
        onClick: () => featuredEvent ? this.openEvent(featuredEvent) : this.setTab('contests'),
        style: { ...glass, gridColumn: '1 / 3', padding: 14, cursor: 'pointer', position: 'relative', overflow: 'hidden', border: '1px solid rgba(239,68,68,.4)', animation: 'glowPulse 3s ease-in-out infinite' }
      },
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#f2b544' } }, '★ FEATURED · ' + (featuredEvent?.tag || 'NEXT FIGHT CARD')),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, margin: '4px 0' } }, featuredEvent?.f1 || 'FIGHTER A', ' ', React.createElement('span', { style: { color: '#ef4444' } }, 'VS'), ' ', featuredEvent?.f2 || 'FIGHTER B'),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 800, color: '#22c55e' , animation: 'moneyPulse 1.8s ease-in-out infinite' } }, featuredEvent?.prize ? featuredEvent.prize + ' POOL' : 'PRIZE TERMS PENDING'),
          React.createElement('div', { style: { background: '#f2b544', color: '#2b1b00', fontWeight: 900, fontSize: 11, padding: '7px 14px', borderRadius: 8 } }, 'PREDICT')
        )
      ),
      React.createElement('div', { style: { ...glass, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 } },
        React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: '#a855f7' } }, 'COMMUNITY VOTE'),
        React.createElement('svg', { width: 54, height: 54, viewBox: '0 0 90 90' },
          React.createElement('circle', { cx: 45, cy: 45, r: 38, fill: 'none', stroke: '#4d8dff', strokeWidth: 12 }),
          React.createElement('circle', { cx: 45, cy: 45, r: 38, fill: 'none', stroke: '#ef4444', strokeWidth: 12, strokeDasharray: 238.8, strokeDashoffset: 238.8 * (1 - jonesPct / 100), transform: 'rotate(-90 45 45)', style: { transition: 'stroke-dashoffset .6s ease' } })
        ),
        React.createElement('div', { style: { fontSize: 10, fontWeight: 700 } }, React.createElement('span', { style: { color: '#ef4444' } }, jonesPct + '%'), ' / ', React.createElement('span', { style: { color: '#4d8dff' } }, aspinallPct + '%'))
      ),
      React.createElement('div', { style: { ...glass, position: 'relative', overflow: 'hidden', padding: 12, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' } },
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'progression-bg', shape: 'rect', placeholder: 'Boxing gloves photo', fit: 'cover', src: 'uploads/pasted-1785013690779-0.png' })),
        React.createElement('div', { style: { position: 'relative' } },
        React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: '#f2b544' } }, 'FIGHT IQ · LVL 18'),
        React.createElement('div', { style: { fontSize: 16, fontWeight: 800, color: '#c084fc' } }, '2,450 XP'),
        React.createElement('div', { style: { height: 5, background: 'rgba(255,255,255,.1)', borderRadius: 3, overflow: 'hidden' } },
          React.createElement('div', { style: { height: '100%', width: xpPct + '%', background: 'linear-gradient(90deg,#a855f7,#ec4899)', transition: 'width 1s ease' } })
        )
        )
      ),
      React.createElement('div', {
        onClick: () => this.openModal('wallet'),
        style: { ...glass, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }
      },
        React.createElement('div', { style: { fontSize: 22 } }, '🪙'),
        React.createElement('div', { style: { fontSize: 13, fontWeight: 800 } }, s.coins.toLocaleString()),
        React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.5)' } }, 'FM COINS')
      ),
      React.createElement('div', {
        onClick: this.claimReward,
        style: { ...glass, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }
      },
        React.createElement('div', { key: s.chestBounce, style: { fontSize: 22, animation: s.chestBounce ? 'bounceChest .5s ease' : 'none' } }, '🎁'),
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: s.rewardClaimed ? '#22c55e' : '#f2b544' } }, s.rewardClaimed ? 'CLAIMED ✓' : 'CLAIM +250')
      )
    );
  }

  renderEventCarousel(filteredEvents, s) {
    if (!filteredEvents.length) return null;
    const i = Math.min(s.carouselIndex, filteredEvents.length - 1);
    const ev = filteredEvents[i];
    return React.createElement('div', { style: { padding: '0 16px 4px' } },
      React.createElement('div', { style: { fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(255,255,255,.7)', marginBottom: 8 } }, 'UPCOMING EVENTS'),
      React.createElement('div', { style: { background: 'linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02))', border: '1px solid ' + ev.tagColor + '66', borderRadius: 18, padding: 16 } },
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: ev.tagColor, marginBottom: 4 } }, ev.tag),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 24, marginBottom: 6 } }, ev.f1, React.createElement('span', { style: { color: '#ef4444' } }, ' VS '), ev.f2),
        React.createElement('div', { style: { display: 'flex', gap: 14, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginBottom: 10 } },
          React.createElement('span', null, ev.date), React.createElement('span', null, '⏱ ' + ev.countdown), React.createElement('span', { style: { color: '#22c55e', animation: 'moneyPulse 1.8s ease-in-out infinite' } }, ev.prize)
        ),
        React.createElement('div', {
          role: 'button', tabIndex: 0,
          onClick: () => this.openEvent(ev),
          style: { textAlign: 'center', padding: '11px 0', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', background: ev.entered ? 'rgba(34,197,94,.15)' : ev.tagColor, color: ev.entered ? '#22c55e' : '#fff' }
        }, ev.entered ? 'ENTERED ✓' : this.getEventActionLabel(ev, ev.playable))
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 0 16px' } },
        filteredEvents.map((e, idx) => React.createElement('div', {
          key: e.id, onClick: () => this.setCarousel(idx),
          style: { width: idx === i ? 18 : 6, height: 6, borderRadius: 3, background: idx === i ? '#f2b544' : 'rgba(255,255,255,.2)', cursor: 'pointer', transition: 'width .2s' }
        }))
      )
    );
  }

  renderHero() {
    const embers = [10, 30, 55, 70, 90].map((left, i) => React.createElement('div', {
      key: i, style: {
        position: 'absolute', left: left + '%', bottom: 40, width: 4, height: 4, borderRadius: '50%',
        background: i % 2 ? '#f2b544' : '#ff6b3b', animation: 'floatEmber ' + (4 + i) + 's ease-in ' + (i * 0.7) + 's infinite'
      }
    }));
    return React.createElement('div', { style: { position: 'relative', width: '100%', overflow: 'hidden' } },
      React.createElement('img', { src: `${ASSET_BASE}/hero-banner-crop.png`, style: { width: '100%', height: 'auto', display: 'block' } }),
      React.createElement('div', { style: { position: 'absolute', top: '2%', left: '30%', right: '30%', height: '16%', pointerEvents: 'none' } },
        [[8, 20], [88, 10], [50, 5], [30, 55], [70, 50], [15, 75]].map(([left, top], i) => React.createElement('div', {
          key: i, style: {
            position: 'absolute', left: left + '%', top: top + '%', fontSize: 10 + (i % 3) * 3, color: '#fff3c4',
            textShadow: '0 0 6px #fff3c4, 0 0 12px #f2b544', animation: 'crownSparkle ' + (1.2 + i * 0.3) + 's ease-in-out ' + (i * 0.25) + 's infinite'
          }
        }, '✦'))
      ),
      React.createElement('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' } },
        this.ambientParticles.map((p, i) => React.createElement('div', {
          key: i, style: {
            position: 'absolute', left: p.left + '%', top: p.top + '%', width: p.size * 2.2, height: p.size * 2.2, borderRadius: '50%',
            background: p.color, opacity: .85, boxShadow: '0 0 10px ' + p.color + ', 0 0 18px ' + p.color, animation: p.anim + ' ' + p.dur + 's ease-in-out infinite'
          }
        }))
      ),
      React.createElement('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: '18%', pointerEvents: 'none' } },
        [6, 12, 18, 24].map((left, i) => React.createElement('div', {
          key: 'l' + i, style: {
            position: 'absolute', left: left + '%', top: (10 + (i % 2) * 6) + '%', width: 6, height: 6, borderRadius: '50%',
            background: '#ff8a6b', boxShadow: '0 0 10px #ff6b3b, 0 0 18px #ff6b3b',
            animation: 'bulbFlash ' + (0.7 + i * 0.15) + 's ease-in-out ' + (i * 0.12) + 's infinite'
          }
        })),
        [76, 82, 88, 94].map((left, i) => React.createElement('div', {
          key: 'r' + i, style: {
            position: 'absolute', left: left + '%', top: (10 + (i % 2) * 6) + '%', width: 6, height: 6, borderRadius: '50%',
            background: '#8ab4ff', boxShadow: '0 0 10px #4d8dff, 0 0 18px #4d8dff',
            animation: 'bulbFlash ' + (0.7 + i * 0.15) + 's ease-in-out ' + (i * 0.18) + 's infinite'
          }
        }))
      ),
      React.createElement('div', { style: { position: 'absolute', left: 0, bottom: 0, width: '30%', height: '55%', pointerEvents: 'none', transformOrigin: 'bottom center', animation: 'flameFlicker1 1.6s ease-in-out infinite', background: 'radial-gradient(ellipse 70% 100% at 20% 100%, rgba(255,107,59,.55), rgba(242,181,68,.25) 45%, transparent 75%)' } }),
      React.createElement('div', { style: { position: 'absolute', right: 0, bottom: 0, width: '30%', height: '55%', pointerEvents: 'none', transformOrigin: 'bottom center', animation: 'flameFlicker2 1.9s ease-in-out infinite', background: 'radial-gradient(ellipse 70% 100% at 80% 100%, rgba(77,141,255,.5), rgba(168,85,247,.22) 45%, transparent 75%)' } }),
      React.createElement('div', { style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '10%', pointerEvents: 'none' } },
        [4, 14, 24, 34, 62, 72, 82, 92].map((left, i) => React.createElement('div', {
          key: 'b' + i, style: {
            position: 'absolute', left: left + '%', bottom: (2 + (i % 3) * 8) + '%', width: 5, height: 5, borderRadius: '50%',
            background: i % 2 ? '#ffce54' : '#ff6b3b', boxShadow: '0 0 8px currentColor, 0 0 14px ' + (i % 2 ? '#f2b544' : '#ff6b3b'),
            animation: 'bulbFlash ' + (0.6 + (i % 4) * 0.15) + 's ease-in-out ' + (i * 0.1) + 's infinite'
          }
        }))
      ),
      React.createElement('div', {
        onClick: () => this.openModal('join'),
        role: 'button', tabIndex: 0, 'aria-label': 'Join Fantasy MMAdness free',
        style: { position: 'absolute', left: '22%', right: '22%', bottom: '4%', height: '11%', cursor: 'pointer' }
      })
    );
  }

  renderHeroOld() {
    const embers = [10, 30, 55, 70, 90].map((left, i) => React.createElement('div', {
      key: i, style: {
        position: 'absolute', left: left + '%', bottom: 40, width: 4, height: 4, borderRadius: '50%',
        background: i % 2 ? '#f2b544' : '#ff6b3b', animation: 'floatEmber ' + (4 + i) + 's ease-in ' + (i * 0.7) + 's infinite'
      }
    }));
    return React.createElement('div', { style: { position: 'relative', height: 360, overflow: 'hidden' } },
      React.createElement('div', { style: { position: 'absolute', left: 0, top: 0, width: '37%', height: '100%' } },
        React.createElement(MobileImageSlot, { id: 'hero-left', shape: 'rect', placeholder: 'Fighter photo (red corner)', fit: 'cover' })
      ),
      React.createElement('div', { style: { position: 'absolute', right: 0, top: 0, width: '37%', height: '100%' } },
        React.createElement(MobileImageSlot, { id: 'hero-right', shape: 'rect', placeholder: 'Fighter photo (blue corner)', fit: 'cover' })
      ),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(239,68,68,.25), transparent 55%), radial-gradient(circle at 75% 30%, rgba(77,141,255,.25), transparent 55%)', pointerEvents: 'none' } }),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 46% 90% at 50% 45%, rgba(5,6,10,.92) 55%, transparent 80%)', pointerEvents: 'none' } }),
      ...embers,
      React.createElement('div', { style: { position: 'relative', textAlign: 'center', paddingTop: 6, width: '25%', margin: '0 auto', overflow: 'visible' } },
        React.createElement('svg', {
          viewBox: '0 0 100 68', width: 76, height: 51, style: { display: 'block', margin: '0 auto', animation: 'glimmerCrown 2.2s ease-in-out infinite' }
        },
          React.createElement('defs', null,
            React.createElement('linearGradient', { id: 'crownGold', x1: '0', y1: '0', x2: '0', y2: '1' },
              React.createElement('stop', { offset: '0%', stopColor: '#fff3c4' }),
              React.createElement('stop', { offset: '45%', stopColor: '#f2b544' }),
              React.createElement('stop', { offset: '100%', stopColor: '#a8720f' })
            )
          ),
          React.createElement('path', {
            d: 'M6 62 L6 30 L18 44 L26 12 L38 36 L50 8 L62 36 L74 12 L82 44 L94 30 L94 62 Z',
            fill: 'url(#crownGold)', stroke: '#7a4e08', strokeWidth: 1.5, strokeLinejoin: 'round'
          }),
          React.createElement('rect', { x: 8, y: 58, width: 84, height: 7, rx: 2, fill: 'url(#crownGold)', stroke: '#7a4e08', strokeWidth: 1.5 }),
          [6, 26, 50, 74, 94].map((cx, i) => React.createElement('circle', {
            key: i, cx, cy: [30, 12, 8, 12, 30][i], r: 3.5, fill: '#fff3c4', stroke: '#a8720f', strokeWidth: 1
          })),
          React.createElement('circle', { cx: 26, cy: 42, r: 4.5, fill: '#ef4444', stroke: '#7a1a1a', strokeWidth: 1 }),
          React.createElement('circle', { cx: 50, cy: 46, r: 6, fill: '#a855f7', stroke: '#5b1a8a', strokeWidth: 1 }),
          React.createElement('circle', { cx: 74, cy: 42, r: 4.5, fill: '#4d8dff', stroke: '#1a3f8a', strokeWidth: 1 })
        ),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 18, letterSpacing: .5, color: '#f2b544', textShadow: '0 0 10px rgba(242,181,68,.7), 0 1.5px 0 #7a4e08, 1.5px 1.5px 0 #7a4e08', WebkitTextStroke: '0.7px rgba(122,78,8,.6)', marginTop: 2, transform: 'skewX(-2deg)' } }, 'FANTASY'),
        React.createElement('div', {
          style: {
            fontFamily: "'Anton',sans-serif", fontSize: 21, letterSpacing: .3, marginTop: -4, transform: 'skewX(-2deg)',
            background: 'linear-gradient(90deg,#a855f7 0%,#a855f7 35%,#ef4444 65%,#ef4444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            WebkitTextStroke: '1px rgba(0,0,0,.25)', animation: 'wordmarkGlow 2.6s ease-in-out infinite'
          }
        }, 'MMAdness'),
        React.createElement('div', { style: { fontSize: 6.5, letterSpacing: .6, color: 'rgba(255,255,255,.55)', fontWeight: 700, marginTop: 2 } }, 'COMBAT PREDICTION GAME'),
        React.createElement('div', { style: { fontSize: 8.5, fontWeight: 600, marginTop: 7, lineHeight: 1.35 } },
          'PREDICT EVERY FIGHT.', React.createElement('br'),
          'PROVE YOUR ', React.createElement('span', { style: { color: '#a855f7' } }, 'FIGHT IQ'), '.', React.createElement('br'),
          'CLIMB THE LEADERBOARD.'
        ),
        React.createElement('div', {
          style: {
            display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, padding: '5px 10px', borderRadius: 999, maxWidth: '100%',
            background: 'linear-gradient(90deg,#ef4444,#f2b544 55%,#ffd873)', boxShadow: '0 2px 10px rgba(0,0,0,.4)',
            animation: 'ribbonGlow 2.2s ease-in-out infinite', whiteSpace: 'nowrap'
          }
        },
          React.createElement('span', { style: { fontSize: 13, display: 'inline-block', animation: 'chestBounceLoop 1.4s ease-in-out infinite', flex: '0 0 auto', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.5))' } }, '💵'),
          React.createElement('span', { style: { fontSize: 7.5, fontWeight: 900, color: '#1a0e00', letterSpacing: .2, whiteSpace: 'nowrap' } }, 'WIN BIG CASH')
        ),
        React.createElement('div', { style: { position: 'relative', display: 'inline-block', marginTop: 14 } },
          [0, 1, 2, 3, 4].map(i => React.createElement('span', {
            key: i, style: {
              position: 'absolute', left: (10 + i * 20) + '%', bottom: -22, fontSize: 13, pointerEvents: 'none', zIndex: -1,
              animation: 'coinFloat ' + (1.8 + i * 0.3) + 's ease-in-out ' + (i * 0.4) + 's infinite'
            }
          }, '🪙')),
          React.createElement('div', {
            onClick: () => this.openModal('join'),
            style: {
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '9px 14px', borderRadius: 999, whiteSpace: 'nowrap',
              background: 'linear-gradient(90deg,#ffd873 0%,#f2b544 25%,#ffe9a8 50%,#f2b544 75%,#ffd873 100%)',
              backgroundSize: '200% 100%', animation: 'shimmerBtn 2.5s linear infinite, joinGlow 2s ease-in-out infinite',
              color: '#2b1b00', fontWeight: 900, fontSize: 11, letterSpacing: .2, cursor: 'pointer', position: 'relative'
            }
          }, 'JOIN FREE', React.createElement('span', null, '»'))
        )
      )
    );
  }

  renderWatchLeaguesPromo() {
    return React.createElement('div', { style: { display: 'flex', gap: 8, padding: '0 16px 16px' } },
      React.createElement('div', {
        onClick: () => this.setTab('watch'),
        style: { flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid #ef4444', borderRadius: 14, padding: 14, cursor: 'pointer', boxShadow: '0 0 16px rgba(239,68,68,.4)' }
      },
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'promo-watch-bg', shape: 'rect', placeholder: 'Stadium photo', fit: 'cover', src: 'uploads/pasted-1785011607947-0.png' })),
        React.createElement('div', { style: { position: 'relative' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 900, color: '#ff8a8a' } },
            React.createElement('span', { style: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'pulseLive 1.2s infinite' } }), 'LIVE NOW'
          ),
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 15, marginTop: 4, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.6)' } }, '▶ WATCH PARTY'),
          React.createElement('div', { style: { fontSize: 10, color: '#ffe93b', fontWeight: 900, marginTop: 2, textShadow: '0 1px 3px rgba(0,0,0,.9)' } }, 'Live scoring · crowd reactions')
        )
      ),
      React.createElement('div', {
        onClick: () => this.setTab('leagues'),
        style: { flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid #a855f7', borderRadius: 14, padding: 14, cursor: 'pointer', boxShadow: '0 0 16px rgba(168,85,247,.4)' }
      },
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'promo-leagues-bg', shape: 'rect', placeholder: 'Friends watching fight photo', fit: 'cover', src: 'uploads/pasted-1785012202182-0.png' })),
        React.createElement('div', { style: { position: 'relative' } },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#d8a8ff' } }, '⚔ COMPETE'),
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 15, marginTop: 4, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.6)' } }, 'LEAGUES · H2H'),
          React.createElement('div', { style: { fontSize: 10, color: '#ffe93b', fontWeight: 900, marginTop: 2, textShadow: '0 1px 3px rgba(0,0,0,.9)' } }, 'Private leagues & wagers')
        )
      )
    );
  }

  renderYourCard(s, fight) {
    if (!fight) return null;
    const localCard = s.boxingScorecards[fight.id] || s.mmaScorecards[fight.id] || s.wrestlingScorecards[fight.id];
    const pickSide = fight.userEntry?.pickSide || localCard?.winner;
    if (!fight.entered && !localCard) {
      return React.createElement('div', { style: { padding: 12, borderRadius: 12, background: 'rgba(242,181,68,.08)', border: '1px solid rgba(242,181,68,.35)', margin: '10px 0 12px' } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 900, color: '#f2b544', marginBottom: 4 } }, 'YOU HAVE NO CARD IN THIS FIGHT'),
        React.createElement('div', { style: { fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginBottom: 9 } }, 'Watching is better with your own prediction card. Entries stay open until the registered fight locks.'),
        React.createElement('div', { onClick: () => this.openEvent(fight), style: { textAlign: 'center', padding: '10px 0', borderRadius: 999, background: 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 900, fontSize: 11, letterSpacing: .5, cursor: 'pointer' } }, 'ENTER THIS FIGHT ›'));
    }
    const points = Number(fight.userEntry?.livePoints ?? s.watchPoints ?? 0) || 0;
    const pickName = fight.userEntry?.pickName || (pickSide === 'b' ? fight.f2 : pickSide === 'a' ? fight.f1 : 'CARD SUBMITTED');
    return React.createElement('div', { style: { padding: 12, borderRadius: 12, background: 'linear-gradient(160deg,rgba(34,197,94,.12),rgba(255,255,255,.02))', border: '1px solid rgba(34,197,94,.4)', margin: '10px 0 12px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } },
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 9.5, fontWeight: 900, letterSpacing: .8, color: '#22c55e' } }, 'YOUR SCORECARD · LIVE'),
          React.createElement('div', { style: { fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,.6)', marginTop: 3 } }, 'Picked ', React.createElement('span', { style: { color: '#fff', fontWeight: 900 } }, pickName))),
        React.createElement('div', { style: { textAlign: 'right' } },
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, color: '#f2b544', fontVariantNumeric: 'tabular-nums' } }, points.toLocaleString()),
          React.createElement('div', { style: { fontSize: 8.5, fontWeight: 900, color: 'rgba(255,255,255,.45)', letterSpacing: .6 } }, 'LIVE POINTS'))),
      React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginTop: 7 } }, 'Points update only from official fight stats; no simulated scoring is added on this screen.'));
  }

  renderWatchParty(s, jonesPct, aspinallPct, events = []) {
    const liveEvent = this.watchFight(s, events);
    const fighterA = liveEvent?.f1 || 'RED CORNER';
    const fighterB = liveEvent?.f2 || 'BLUE CORNER';
    const rounds = Array.from({ length: Math.max(1, toSafeNumber(liveEvent?.maxRounds) || 5) }, (_, index) => index + 1);
    const current = Math.min(rounds.length, Math.max(1, toSafeNumber(liveEvent?.currentRound) || 1));
    const moments = [
      [12, '🥊', 'Feeling out'], [28, '🦵', 'Near-fall'], [50, '🏃', 'Run-in'], [74, '💥', 'Finisher'], [98, '3️⃣', 'Near-fall'],
    ];
    const mm = Math.floor(s.matchSeconds / 60), ss = String(s.matchSeconds % 60).padStart(2, '0');
    return React.createElement('div', { style: { padding: '8px 16px', position: 'relative', overflow: 'hidden' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 } },
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'watch-stadium-bg', shape: 'rect', placeholder: 'Stadium crowd photo', fit: 'cover', src: 'uploads/pasted-1785011607947-0.png' })),
        React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,6,10,.9),rgba(5,6,10,.98))' } }),
        React.createElement('div', { style: { position: 'absolute', left: 0, top: 0, width: '55%', height: '100%', background: 'radial-gradient(ellipse 80% 60% at 0% 20%, rgba(239,68,68,.35), transparent 65%)', animation: 'stadiumFlickerRed 1.8s ease-in-out infinite' } }),
        React.createElement('div', { style: { position: 'absolute', right: 0, top: 0, width: '55%', height: '100%', background: 'radial-gradient(ellipse 80% 60% at 100% 20%, rgba(77,141,255,.35), transparent 65%)', animation: 'stadiumFlickerBlue 1.8s ease-in-out infinite' } }),
        [8, 22, 5, 30, 15, 92, 78, 95, 70, 85].map((left, i) => React.createElement('div', {
          key: i, style: {
            position: 'absolute', left: left + '%', top: (i % 2 === 0 ? 6 : 14) + '%', width: 5, height: 5, borderRadius: '50%',
            background: left < 50 ? '#ff8a8a' : '#8ab4ff', boxShadow: '0 0 8px ' + (left < 50 ? '#ef4444' : '#4d8dff'),
            animation: 'bulbFlash ' + (1 + (i % 4) * 0.3) + 's ease-in-out ' + (i * 0.15) + 's infinite'
          }
        })),
        [15, 45, 70, 25, 85].map((left, i) => React.createElement('div', {
          key: 'flash' + i, style: {
            position: 'absolute', left: left + '%', top: (10 + (i % 3) * 8) + '%', width: 14, height: 14, borderRadius: '50%',
            background: '#fff', boxShadow: '0 0 20px 6px rgba(255,255,255,.9)',
            animation: 'cameraFlash ' + (4 + i * 1.3) + 's linear ' + (i * 0.8) + 's infinite'
          }
        }))
      ),
      React.createElement('div', { style: { position: 'relative', zIndex: 1 } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } },
        React.createElement('span', { style: { width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulseLive 1.2s infinite' } }),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#ef4444' } }, liveEvent ? 'LIVE · ' + liveEvent.tag : 'WATCH PARTY · WAITING FOR LIVE FIGHT')
      ),
      this.renderYourCard(s, liveEvent),
      React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 10 } },
        ['rounds', 'moments'].map(m => React.createElement('div', {
          key: m, onClick: () => this.setWatchMode(m),
          style: { padding: '5px 12px', borderRadius: 999, fontSize: 9, fontWeight: 800, letterSpacing: .5, cursor: 'pointer', whiteSpace: 'nowrap', background: s.watchMode === m ? '#f2b544' : 'rgba(255,255,255,.06)', color: s.watchMode === m ? '#2b1b00' : 'rgba(255,255,255,.5)' }
        }, m === 'rounds' ? '🥊 ROUNDS (MMA/BOXING)' : '🤼 LIVE MOMENTS (WRESTLING)'))
      ),
      s.watchMode === 'rounds' ? React.createElement(React.Fragment, null,
        React.createElement('div', { style: { fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 14 } }, fighterA + ' VS ' + fighterB + ' · ROUND ' + current + ' OF ' + rounds.length),
        React.createElement('div', { style: { display: 'flex', gap: 5, marginBottom: 16 } },
          rounds.map(r => React.createElement('div', {
            key: r, style: {
              flex: 1, height: 8, borderRadius: 4,
              background: r < current ? '#22c55e' : r === current ? '#ef4444' : 'rgba(255,255,255,.1)',
              animation: r === current ? 'pulseLive 1s infinite' : 'none'
            }
          }))
        )
      ) : React.createElement(React.Fragment, null,
        React.createElement('div', { style: { fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 8 } }, 'NO FIXED ROUNDS — SCORED BY LIVE MOMENTS AS THEY HAPPEN'),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, color: '#f2b544', textAlign: 'center', marginBottom: 10 } }, mm + ':' + ss),
        React.createElement('div', { style: { position: 'relative', height: 4, background: 'rgba(255,255,255,.1)', borderRadius: 2, margin: '0 10px 22px' } },
          React.createElement('div', { style: { position: 'absolute', left: 0, top: 0, height: '100%', width: Math.min(100, s.matchSeconds / 1.2) + '%', background: 'linear-gradient(90deg,#f2b544,#ef4444)', borderRadius: 2, transition: 'width .3s linear' } }),
          moments.map(([at, icon, label]) => React.createElement('div', {
            key: at, style: {
              position: 'absolute', left: (at / 1.2) + '%', top: -10, transform: 'translateX(-50%)', fontSize: 16,
              opacity: s.triggeredMoments.includes(at) ? 1 : 0.3,
              filter: s.triggeredMoments.includes(at) ? 'drop-shadow(0 0 8px #f2b544)' : 'none',
              animation: s.triggeredMoments.includes(at) ? 'bounceChest .5s ease' : 'none'
            }, title: label
          }, icon))
        )
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: 16, marginBottom: 14 } },
        React.createElement('div', { style: { textAlign: 'center' } },
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 15 } }, fighterA),
          React.createElement('div', { style: { fontSize: 26, fontWeight: 900, color: '#ef4444' } }, s.watchMode === 'moments' ? Math.min(99, s.liveTicks.jones) + '%' : (liveEvent?.liveStrikesA || 0)),
          React.createElement('div', { style: { fontSize: 9, color: 'rgba(255,255,255,.5)', fontWeight: 700 } }, s.watchMode === 'moments' ? 'CROWD HEAT' : (liveEvent ? 'OFFICIAL STRIKES' : 'WAITING FOR LIVE DATA'))
        ),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 20, color: 'rgba(255,255,255,.3)', alignSelf: 'center' } }, 'VS'),
        React.createElement('div', { style: { textAlign: 'center' } },
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 15 } }, fighterB),
          React.createElement('div', { style: { fontSize: 26, fontWeight: 900, color: '#4d8dff' } }, s.watchMode === 'moments' ? Math.min(99, s.liveTicks.aspinall) + '%' : (liveEvent?.liveStrikesB || 0)),
          React.createElement('div', { style: { fontSize: 9, color: 'rgba(255,255,255,.5)', fontWeight: 700 } }, s.watchMode === 'moments' ? 'CROWD HEAT' : (liveEvent ? 'OFFICIAL STRIKES' : 'WAITING FOR LIVE DATA'))
        )
      ),
      React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 8 } }, 'CROWD REACTIONS'),
      React.createElement('div', { style: { position: 'relative', height: 90, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' } },
        s.reactions.map(r => React.createElement('span', {
          key: r.id, style: { position: 'absolute', left: r.x + '%', bottom: 4, fontSize: 20, animation: 'coinFloat 2s ease-out forwards' }
        }, r.emoji))
      ),
      React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 20 } },
        ['🔥', '😱', '👏', '💥', '🥊'].map(e => React.createElement('div', {
          key: e, onClick: () => this.addReaction(e),
          style: { flex: 1, textAlign: 'center', fontSize: 20, padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer' }
        }, e))
      ),
      React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 8 } }, '📹 CAGE CAM — WATCHING WITH YOUR LEAGUE'),
      React.createElement('div', { style: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 10, marginBottom: 10, maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 } },
        s.friendFeed.map(f => React.createElement('div', { key: f.id, style: { fontSize: 11, lineHeight: 1.3 } },
          React.createElement('span', { style: { fontWeight: 900, color: f.mine ? '#f2b544' : '#4d8dff' } }, f.name + ': '),
          React.createElement('span', { style: { color: 'rgba(255,255,255,.85)', fontWeight: 600 } }, f.text)
        ))
      ),
      React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 20 } },
        React.createElement('input', {
          value: s.reactionDraft, placeholder: 'Say something to the league...', onChange: (e) => this.setReactionDraft(e.target.value),
          onKeyDown: (e) => { if (e.key === 'Enter') this.sendReaction(); },
          style: { flex: 1, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 12, fontFamily: "'Rajdhani',sans-serif" }
        }),
        React.createElement('div', { onClick: this.sendReaction, style: { padding: '10px 16px', borderRadius: 8, background: '#4d8dff', fontWeight: 900, fontSize: 12, cursor: 'pointer' } }, 'SEND')
      ),
      React.createElement('div', { onClick: () => this.setTab('home'), style: { textAlign: 'center', padding: '11px 0', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', fontWeight: 800, fontSize: 12, cursor: 'pointer' } }, '← BACK TO HOME')
      )
    );
  }

  renderLeaguesLegacy(s, events) {
    const fightWeek = events.filter(ev => {
      const days = parseInt(ev.countdown, 10);
      return days <= 7;
    });
    const statusMeta = {
      pending_them: ['Waiting on them', '#f2b544'], pending_you: ['Awaiting your response', '#ef4444'],
      accepted: ['Active · auto-settling soon', '#22c55e'], declined: ['Declined', 'rgba(255,255,255,.4)'],
      settled_won: ['✓ Auto-settled — you won', '#22c55e'], settled_lost: ['Auto-settled — you lost', 'rgba(255,255,255,.4)']
    };
    return React.createElement('div', { style: { padding: '8px 16px', position: 'relative', overflow: 'hidden' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none' } }, React.createElement(MobileImageSlot, { id: 'leagues-bg', shape: 'rect', placeholder: 'Friends watching fight photo', fit: 'cover', src: 'uploads/pasted-1785012202182-0.png' })),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,6,10,.85),rgba(5,6,10,.98))', pointerEvents: 'none' } }),
      React.createElement('div', { style: { position: 'relative' } },
      React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, marginBottom: 12, color: '#a855f7' } }, 'LEAGUES & HEAD-TO-HEAD'),
      React.createElement('div', { style: { marginBottom: 18 } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)', marginBottom: 6 } }, '🔔 AFFILIATE ALERTS'),
        events.map(ev => React.createElement('div', {
          key: 'new-' + ev.id, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(77,141,255,.08)', border: '1px solid rgba(77,141,255,.3)', borderRadius: 10, padding: '8px 10px', marginBottom: 6 }
        },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 700 } }, '🆕 ' + ev.tag + ' just listed — ' + ev.f1 + ' vs ' + ev.f2),
          React.createElement('div', { onClick: () => this.promoteLiveEvent(), style: { fontSize: 9, fontWeight: 900, color: '#4d8dff', cursor: 'pointer', whiteSpace: 'nowrap' } }, 'PROMOTE')
        )),
        fightWeek.map(ev => React.createElement('div', {
          key: 'fw-' + ev.id, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(242,181,68,.1)', border: '1px solid rgba(242,181,68,.4)', borderRadius: 10, padding: '8px 10px', marginBottom: 6 }
        },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#f2b544' } }, '📅 FIGHT WEEK — ' + ev.tag + ' is ' + ev.countdown.split(':')[0].trim() + ' away, start promoting'),
          React.createElement('div', { onClick: () => this.promoteLiveEvent(), style: { fontSize: 9, fontWeight: 900, color: '#f2b544', cursor: 'pointer', whiteSpace: 'nowrap' } }, 'PROMOTE')
        ))
      ),
      React.createElement('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239,68,68,.1)', border: '1px solid #ef4444', borderRadius: 12, padding: 12, marginBottom: 20, boxShadow: '0 0 16px rgba(239,68,68,.4)' }
      },
        React.createElement('div', null,
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } },
            React.createElement('span', { style: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'pulseLive 1.2s infinite' } }),
            React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#ef4444' } }, 'LIVE NOW — UFC 323')
          ),
          React.createElement('div', { style: { fontSize: 12, fontWeight: 900 } }, 'JONES VS ASPINALL'),
          React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.5)' } }, 'Scoring live on TV right now — bring your league in')
        ),
        React.createElement('div', { onClick: this.promoteLiveEvent, style: { padding: '9px 14px', borderRadius: 8, background: '#ef4444', fontWeight: 900, fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap' } }, '📣 PROMOTE LIVE')
      ),
      React.createElement('div', { style: { marginBottom: 20 } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)', marginBottom: 2 } }, '🎴 FANTASY CARDS — SEASON-LONG ROSTER'),
        React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 10 } }, 'Draft one fighter per genre — your card scores across every event, first fight to last, all season.'),
        s.fantasyCampaigns.map(c => React.createElement('div', {
          key: c.id, style: { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(168,85,247,.4)', borderRadius: 12, padding: 12, marginBottom: 8, boxShadow: '0 0 12px rgba(168,85,247,.25)' }
        },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } },
            React.createElement('div', { style: { fontWeight: 900, fontSize: 13 } }, c.name),
            c.fighterHosted && React.createElement('span', { style: { fontSize: 8.5, fontWeight: 900, color: '#05060a', background: '#f2b544', borderRadius: 999, padding: '2px 7px' } }, '✓ FIGHTER')
          ),
          React.createElement('div', {
            onClick: c.fighterHosted ? () => this.openModal('fighterAffiliate', c) : undefined,
            style: { fontSize: 9, fontWeight: 700, color: c.fighterHosted ? '#f2c869' : 'rgba(255,255,255,.5)', marginBottom: 8, cursor: c.fighterHosted ? 'pointer' : 'default', textDecoration: c.fighterHosted ? 'underline' : 'none' }
          }, 'Hosted by ' + c.host + ' · ' + c.span),
          c.joined ? React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: '#22c55e', marginBottom: 8 } }, '✓ Roster locked: ' + Object.values(c.roster).join(' · ')),
            React.createElement('div', { style: { textAlign: 'center', padding: '8px 0', borderRadius: 8, background: 'rgba(34,197,94,.15)', color: '#22c55e', fontWeight: 900, fontSize: 11 } }, 'CUMULATIVE SCORE: 0 PTS — SEASON UNDERWAY')
          ) : React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { fontSize: 12, fontWeight: 900, color: '#f2b544', animation: 'moneyPulseGold 1.8s ease-in-out infinite' } }, c.pot.toLocaleString() + ' FM POT'),
            React.createElement('div', {
              onClick: () => this.openModal('fantasyDraft', c),
              style: { padding: '9px 16px', borderRadius: 8, background: '#a855f7', fontWeight: 900, fontSize: 11, cursor: 'pointer' }
            }, 'DRAFT — ' + c.entryFee + ' FM')
          )
        ))
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } },
        React.createElement('span', { style: { width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulseLive 1.2s infinite' } }),
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)' } }, 'PUBLIC LEAGUES — ONLINE NOW')
      ),
      React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 10 } }, "Just here from a link? Jump straight into any of these and play for the pot — no invite needed."),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 } },
        s.publicLeagues.map(pl => React.createElement('div', {
          key: pl.id, style: { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(34,197,94,.4)', borderRadius: 12, padding: 12, boxShadow: '0 0 12px rgba(34,197,94,.25)' }
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 } },
            React.createElement('div', null,
              React.createElement('div', { style: { fontWeight: 900, fontSize: 13 } }, pl.name),
              React.createElement('div', { style: { fontSize: 9, color: 'rgba(255,255,255,.5)', fontWeight: 700 } }, 'Hosted by ' + pl.host + ' · ' + pl.members.toLocaleString() + ' members')
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, color: '#22c55e', flex: '0 0 auto' } },
              React.createElement('span', { style: { width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulseLive 1.2s infinite' } }), pl.online + ' online'
            )
          ),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { fontSize: 13, fontWeight: 900, color: '#f2b544', animation: 'moneyPulseGold 1.8s ease-in-out infinite' } }, pl.pot.toLocaleString() + ' FM POT'),
            React.createElement('div', {
              onClick: () => this.joinPublicLeague(pl),
              style: { padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: pl.joined ? 'default' : 'pointer', background: pl.joined ? 'rgba(34,197,94,.15)' : '#22c55e', color: pl.joined ? '#22c55e' : '#06210f' }
            }, pl.joined ? 'JOINED ✓' : 'JOIN & PLAY')
          )
        ))
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)' } }, 'YOUR PRIVATE LEAGUES'),
        React.createElement('div', { onClick: () => this.openModal('newLeague'), style: { fontSize: 11, fontWeight: 800, color: '#a855f7', cursor: 'pointer' } }, '+ CREATE')
      ),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 } },
        s.leagues.map(l => React.createElement('div', {
          key: l.id, onClick: () => this.showToast('Opening ' + l.name + '...'),
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(168,85,247,.4)', borderRadius: 12, padding: 12, cursor: 'pointer', boxShadow: '0 0 12px rgba(168,85,247,.25)' }
        },
          React.createElement('div', null,
            React.createElement('div', { style: { fontWeight: 800, fontSize: 13 } }, l.name),
            React.createElement('div', { style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700 } }, l.members + ' members')
          ),
          React.createElement('div', { style: { fontSize: 12, fontWeight: 900, color: '#f2b544' } }, '#' + l.rank)
        ))
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)' } }, 'HEAD-TO-HEAD CHALLENGES'),
        React.createElement('div', { onClick: () => this.openModal('newChallenge'), style: { fontSize: 11, fontWeight: 800, color: '#a855f7', cursor: 'pointer' } }, '+ CHALLENGE')
      ),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        s.challenges.map(c => React.createElement('div', {
          key: c.id, style: { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 12 }
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } },
            React.createElement('div', { style: { fontWeight: 800, fontSize: 13 } }, 'vs ' + c.opp),
            React.createElement('div', { style: { fontSize: 11, fontWeight: 900, color: '#f2b544', animation: 'moneyPulseGold 1.8s ease-in-out infinite' } }, c.wager + ' FM')
          ),
          React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: statusMeta[c.status][1], marginBottom: c.status === 'pending_you' ? 8 : 0 } }, statusMeta[c.status][0]),
          c.status === 'pending_you' && React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement('div', { onClick: () => this.respondChallenge(c.id, true), style: { flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, background: '#22c55e', color: '#06210f', fontWeight: 900, fontSize: 11, cursor: 'pointer' } }, 'ACCEPT'),
            React.createElement('div', { onClick: () => this.respondChallenge(c.id, false), style: { flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, background: 'rgba(255,255,255,.08)', fontWeight: 900, fontSize: 11, cursor: 'pointer' } }, 'DECLINE')
          )
        ))
      ),
      React.createElement('div', { style: { marginTop: 22 } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)', marginBottom: 2 } }, '🕶 SHADOW FIGHTS'),
        React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 10 } }, 'Archive keeps growing as fights get scored. Join blind on genre + scorecard format — names & video reveal when the affiliate goes live.'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
          s.shadowFights.map(sf => {
            const mm = Math.floor(sf.goLiveIn / 60), ss = String(sf.goLiveIn % 60).padStart(2, '0');
            if (sf.status === 'scheduled') return React.createElement('div', {
              key: sf.id, style: { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(242,181,68,.4)', borderRadius: 12, padding: 14, boxShadow: '0 0 12px rgba(242,181,68,.2)' }
            },
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
                React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#f2b544', letterSpacing: .5 } }, '🔒 ' + sf.tag + ' · IDENTITY HIDDEN'),
                React.createElement('div', { style: { fontSize: 11, fontWeight: 900, color: '#f2b544', animation: 'pulseLive 1s infinite' } }, 'LIVE IN ' + mm + ':' + ss)
              ),
              React.createElement('div', { style: { height: 70, borderRadius: 8, background: 'repeating-linear-gradient(135deg, rgba(255,255,255,.06) 0 10px, rgba(255,255,255,.02) 10px 20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, border: '1px dashed rgba(255,255,255,.2)' } },
                React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.4)', letterSpacing: 1 } }, '?  MYSTERY MATCHUP  ?')
              ),
              React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginBottom: 10, lineHeight: 1.5 } },
                'SCORECARD: ', React.createElement('span', { style: { color: '#fff' } }, sf.categories), React.createElement('br'),
                sf.rounds ? sf.rounds + ' ROUNDS · ' : '', 'POT ', React.createElement('span', { style: { color: '#f2b544' } }, sf.pot.toLocaleString() + ' FM'), ' · BUY-IN ', React.createElement('span', { style: { color: '#f2b544' } }, sf.buyIn + ' FM')
              ),
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.5)' } }, '👥 ' + sf.lobby + ' in lobby'),
                React.createElement('div', {
                  onClick: () => this.joinShadowLobby(sf),
                  style: { padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: '#f2b544', color: '#2b1b00' }
                }, 'JOIN LOBBY')
              )
            );
            return React.createElement('div', {
              key: sf.id, style: { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(34,197,94,.35)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 12px rgba(34,197,94,.2)' }
            },
              React.createElement('div', { style: { height: 90, position: 'relative' } },
                React.createElement(MobileImageSlot, { id: 'shadow-' + sf.id, shape: 'rect', placeholder: sf.f1 + ' vs ' + sf.f2 + ' poster/video', fit: 'cover' }),
                React.createElement('div', { style: { position: 'absolute', top: 6, left: 6, background: '#22c55e', color: '#06210f', fontSize: 8, fontWeight: 900, padding: '3px 7px', borderRadius: 5 } }, '● LIVE NOW'),
                React.createElement('div', { style: { position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.55)', color: '#f2c869', fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: 5 } }, '🔥 ' + s.shadowPlays[sf.id].toLocaleString() + ' plays')
              ),
              React.createElement('div', { style: { padding: 12 } },
                React.createElement('div', { style: { fontSize: 13, fontWeight: 900, marginBottom: 4 } }, sf.f1, React.createElement('span', { style: { color: '#ef4444' } }, ' VS '), sf.f2),
                React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 8 } }, '👥 ' + sf.lobby + ' players joined this session'),
                !s.shadowPicks[sf.id] ? React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 8 } },
                  [['a', sf.f1], ['b', sf.f2]].map(([side, label]) => React.createElement('div', {
                    key: side, onClick: () => this.playShadowFight(sf, side),
                    style: { flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', background: 'rgba(255,255,255,.08)' }
                  }, '▶ ' + label + ' · ' + sf.buyIn + ' FM'))
                ) : React.createElement('div', {
                  style: { textAlign: 'center', padding: '8px 0', borderRadius: 8, fontSize: 10, fontWeight: 900, marginBottom: 8, background: s.shadowPicks[sf.id] === sf.winner ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)', color: s.shadowPicks[sf.id] === sf.winner ? '#22c55e' : '#ef4444' }
                }, s.shadowPicks[sf.id] === sf.winner ? '✓ YOU CALLED IT — +50 FM' : 'RESULT: ' + (sf.winner === 'a' ? sf.f1 : sf.f2) + ' WON'),
                React.createElement('div', {
                  onClick: () => this.promoteShadowFight(sf),
                  style: { textAlign: 'center', padding: '9px 0', borderRadius: 8, background: '#22c55e', color: '#06210f', fontWeight: 900, fontSize: 11, cursor: 'pointer' }
                }, '📣 PROMOTE TO FOLLOWERS')
              )
            );
          })
        )
      )
      )
    );
  }

  renderLeagues(s, events) {
    const leagues = Array.isArray(this.props.leagues) ? this.props.leagues : [];
    const users = Array.isArray(this.props.leagueUsers) ? this.props.leagueUsers : [];
    const userById = new Map(users.map((user) => [String(user?._id || user?.id || ''), user]));
    return React.createElement('div', { style: { padding: '8px 16px 24px', position: 'relative', overflow: 'hidden', minHeight: '100%' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'leagues-live-bg', shape: 'rect', placeholder: 'Fight league arena', fit: 'cover', src: 'uploads/pasted-1785012202182-0.png' })),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,6,10,.84),rgba(5,6,10,.99))' } }),
      React.createElement('div', { style: { position: 'relative' } },
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 24, marginBottom: 4, color: '#a855f7' } }, 'LEAGUES & HEAD-TO-HEAD'),
        React.createElement('p', { style: { margin: '0 0 14px', color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 700 } }, 'Real creator leagues from the Fantasy MMAdness community.'),
        events.length > 0 && React.createElement('div', { style: { marginBottom: 14, padding: 10, borderRadius: 10, background: 'rgba(77,141,255,.1)', border: '1px solid rgba(77,141,255,.35)' } },
          React.createElement('strong', { style: { color: '#4d8dff', fontSize: 10 } }, 'NEW FIGHT ALERT'),
          React.createElement('div', { style: { fontSize: 12, fontWeight: 900, marginTop: 3 } }, events[0].f1 + ' vs ' + events[0].f2),
          React.createElement('small', { style: { color: 'rgba(255,255,255,.55)' } }, events[0].date + ' · ' + events[0].tag)
        ),
        leagues.length === 0
          ? React.createElement('section', { style: { marginTop: 28, padding: 24, borderRadius: 14, border: '1px solid rgba(168,85,247,.4)', background: 'rgba(168,85,247,.08)', textAlign: 'center' } },
              React.createElement('strong', { style: { display: 'block', color: '#d8a8ff', fontSize: 15 } }, 'NO PUBLIC LEAGUES YET'),
              React.createElement('p', { style: { color: 'rgba(255,255,255,.6)', fontSize: 11, lineHeight: 1.5 } }, 'The directory is connected to the live league API. New creator leagues will appear here after they are published.'),
              React.createElement('div', { onClick: () => this.props.onJoin?.(), style: { display: 'inline-block', marginTop: 5, padding: '9px 15px', borderRadius: 8, background: '#a855f7', fontSize: 11, fontWeight: 900, cursor: 'pointer' } }, 'CREATE AN ACCOUNT')
            )
          : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } }, leagues.map((league, index) => {
              const id = cleanText(league?._id, league?.id, `league-${index}`);
              const name = cleanText(league?.playerName, league?.leagueName, league?.name, [league?.firstName, league?.lastName].filter(Boolean).join(' '), `Fight League ${index + 1}`);
              const members = Array.isArray(league?.usersJoined) ? league.usersJoined : [];
              const joined = Boolean(s.joinedLeagueIds[id]);
              const memberNames = members.slice(0, 4).map((entry) => {
                const member = userById.get(String(entry?.userId || entry?._id || ''));
                return cleanText(member?.playerName, member?.username, member?.firstName);
              }).filter(Boolean);
              return React.createElement('article', { key: id, onClick: () => this.openModal('leagueDetail', { ...league, id, name, members: members.length, joined }), style: { padding: 14, borderRadius: 14, border: '1px solid rgba(168,85,247,.45)', background: 'rgba(255,255,255,.055)', boxShadow: '0 0 16px rgba(168,85,247,.2)', cursor: 'pointer' } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                  React.createElement('div', { style: { width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flex: '0 0 48px', background: '#10121a' } }, React.createElement(MobileImageSlot, { id: 'league-' + id, shape: 'circle', placeholder: name, fit: 'cover', src: league?.profileUrl })),
                  React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                    React.createElement('strong', { style: { display: 'block', fontSize: 14 } }, name),
                    React.createElement('span', { style: { color: 'rgba(255,255,255,.55)', fontSize: 9, fontWeight: 700 } }, members.length + ' members' + (memberNames.length ? ' · ' + memberNames.join(', ') : ''))
                  ),
                  React.createElement('span', { style: { color: '#22c55e', fontSize: 9, fontWeight: 900 } }, 'OPEN')
                ),
                league?.rewardTitle && React.createElement('div', { style: { marginTop: 9, padding: 8, borderRadius: 8, color: '#f2b544', background: 'rgba(242,181,68,.1)', fontSize: 10, fontWeight: 800 } }, '🏆 ' + league.rewardTitle),
                React.createElement('div', { onClick: (event) => { event.stopPropagation(); this.joinLiveLeague(league); }, style: { marginTop: 10, textAlign: 'center', padding: '9px 0', borderRadius: 8, background: joined ? 'rgba(34,197,94,.15)' : '#a855f7', color: joined ? '#22c55e' : '#fff', fontWeight: 900, fontSize: 11, cursor: joined ? 'default' : 'pointer' } }, joined ? 'JOINED ✓' : 'JOIN LEAGUE')
              );
            }))
      )
    );
  }

  renderDemo(s) {
    const doneCount = Object.values(s.demoCardsDone).filter(Boolean).length;

    if (!s.demoGenre) {
      return React.createElement('div', { style: { padding: '8px 16px' } },
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 20, color: '#22c55e', marginBottom: 4 } }, '🎓 FREE DEMO WALKTHROUGH'),
        React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 4 } }, 'No coins, no risk — pick a genre and play its real scorecard format start to finish.'),
        React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#f2b544', marginBottom: 16 } }, doneCount + ' OF 3 CARD TYPES TRIED'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 } },
          Object.keys(this.demoGenres).map(key => {
            const g = this.demoGenres[key];
            const done = s.demoCardsDone[key];
            return React.createElement('div', {
              key: key, onClick: () => this.selectDemoGenre(key),
              style: {
                position: 'relative', padding: 16, borderRadius: 14, cursor: 'pointer', overflow: 'hidden',
                background: 'linear-gradient(135deg,' + g.color + '33,rgba(255,255,255,.03))',
                border: '1px solid ' + g.color, boxShadow: '0 0 18px ' + g.color + '55'
              }
            },
              done && React.createElement('div', { style: { position: 'absolute', top: 10, right: 10, background: '#22c55e', color: '#06210f', fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 999 } }, '✓ TRIED'),
              React.createElement('div', { style: { fontSize: 30, marginBottom: 4 } }, g.emoji),
              React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#fff' } }, g.title),
              React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginTop: 2 } }, g.fa + ' vs ' + g.fb + ' · practice this scorecard →')
            );
          })
        ),
        doneCount === 3 && React.createElement('div', { style: { background: 'rgba(242,181,68,.1)', border: '1px solid rgba(242,181,68,.5)', borderRadius: 14, padding: 16, marginBottom: 16, textAlign: 'center' } },
          React.createElement('div', { style: { fontSize: 22, marginBottom: 4 } }, '🏆'),
          React.createElement('div', { style: { fontSize: 13, fontWeight: 900, color: '#f2b544', marginBottom: 10 } }, 'YOU\'VE TRIED EVERY SCORECARD TYPE!'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
            React.createElement('div', { onClick: () => this.setTab('contests'), style: { textAlign: 'center', padding: '13px 0', borderRadius: 10, background: '#ef4444', fontWeight: 900, fontSize: 12, cursor: 'pointer' } }, '🔥 SEE ALL OPEN FIGHTS'),
            React.createElement('div', { onClick: () => this.setTab('leagues'), style: { textAlign: 'center', padding: '13px 0', borderRadius: 10, background: '#a855f7', fontWeight: 900, fontSize: 12, cursor: 'pointer' } }, '🕶 TRY A SHADOW FIGHT')
          )
        )
      );
    }

    const g = this.demoGenres[s.demoGenre];
    const fa = g.fa, fb = g.fb;
    const steps = ['MEET THE FIGHTERS', 'FILL THE SCORECARD', 'ROUND-BY-ROUND', 'LEADERBOARD', 'COMMENTS', 'RECAP'];
    const cumA = g.rounds.slice(0, s.demoRoundsRevealed).reduce((n, r) => n + this.demoRoundTotal(r, 'a', g.cats), 0);
    const cumB = g.rounds.slice(0, s.demoRoundsRevealed).reduce((n, r) => n + this.demoRoundTotal(r, 'b', g.cats), 0);
    const maxBar = 16;

    return React.createElement('div', { style: { padding: '8px 16px' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 } },
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: g.color } }, g.emoji + ' ' + g.title + ' DEMO'),
        React.createElement('div', { onClick: () => this.setState({ demoGenre: null }), style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', cursor: 'pointer' } }, '✕ EXIT')
      ),
      React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 10 } }, 'No coins, no risk — full walkthrough of exactly how this scorecard is scored.'),
      React.createElement('div', { style: { display: 'flex', gap: 4, marginBottom: 16 } },
        steps.map((label, i) => React.createElement('div', { key: i, style: { flex: 1, textAlign: 'center' } },
          React.createElement('div', { style: { height: 4, borderRadius: 2, background: i <= s.demoStep ? g.color : 'rgba(255,255,255,.12)', marginBottom: 3 } }),
          React.createElement('div', { style: { fontSize: 6, fontWeight: 800, color: i === s.demoStep ? g.color : 'rgba(255,255,255,.35)' } }, label)
        ))
      ),

      s.demoStep === 0 && React.createElement('div', null,
        React.createElement('div', { style: { display: 'flex', gap: 10, marginBottom: 12 } },
          [['demo-' + s.demoGenre + '-a', fa, 'Demo fighter — practice profile'], ['demo-' + s.demoGenre + '-b', fb, 'Demo fighter — practice profile']].map(([slot, name, bio]) => React.createElement('div', {
            key: slot, style: { flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, overflow: 'hidden' }
          },
            React.createElement('div', { style: { height: 90 } }, React.createElement(MobileImageSlot, { id: slot, shape: 'rect', placeholder: name + ' (demo)', fit: 'cover' })),
            React.createElement('div', { style: { padding: 8 } },
              React.createElement('div', { style: { fontWeight: 900, fontSize: 12 } }, name),
              React.createElement('div', { style: { fontSize: 8, color: 'rgba(255,255,255,.55)', fontWeight: 700, lineHeight: 1.4, marginTop: 2 } }, bio)
            )
          ))
        ),
        React.createElement('div', { style: { background: 'rgba(77,141,255,.08)', border: '1px solid rgba(77,141,255,.3)', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.75)', lineHeight: 1.6 } },
          '❓ ', React.createElement('b', null, 'How does this work?'), ' You\'ll fill out this genre\'s real scorecard, watch it get scored round by round, see how it moves a leaderboard, then see how people talk about it afterward — same flow as a real, paid contest, just free entry.'
        ),
        React.createElement('div', { onClick: this.demoNext, style: { textAlign: 'center', padding: '13px 0', borderRadius: 10, background: g.color, color: '#06210f', fontWeight: 900, fontSize: 12, cursor: 'pointer' } }, 'START THE SCORECARD →')
      ),

      s.demoStep === 1 && React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 10, lineHeight: 1.5 } },
          '❓ ', React.createElement('b', null, 'What am I predicting?'), ' Your best guess at each fighter\'s FULL-FIGHT totals — every punch/kick/move thrown counts, landed or not. Closer guesses score higher, exact guesses score highest.'
        ),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } },
          React.createElement('div', { style: { fontWeight: 900, fontSize: 12, color: '#ef4444' } }, fa),
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.35)' } }, 'VS'),
          React.createElement('div', { style: { fontWeight: 900, fontSize: 12, color: '#4d8dff' } }, fb)
        ),
        g.cats.map(([cat, label, desc]) => React.createElement('div', { key: cat, style: { marginBottom: 10 } },
          React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: '#f2b544' } }, label.toUpperCase()),
          desc && React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: '#fff', marginTop: 2, marginBottom: 2, lineHeight: 1.4 } }, desc),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 } },
            ['a', 'b'].map(who => React.createElement('div', { key: who, style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,.05)', borderRadius: 8, padding: '6px 0' } },
              React.createElement('div', { onClick: () => this.updateDemoCard(who, cat, -1), style: { width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900 } }, '−'),
              React.createElement('div', { style: { width: 22, textAlign: 'center', fontWeight: 800, fontSize: 13 } }, s.demoCard[who][cat]),
              React.createElement('div', { onClick: () => this.updateDemoCard(who, cat, 1), style: { width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900 } }, '+')
            ))
          )
        )),
        React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 6, marginTop: 4 } }, g.hasWinnerBonus ? 'WHO WINS? (CORRECT PICK +100)' : 'WHO WINS?'),
        React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 14 } },
          [['a', fa], ['b', fb]].map(([w, label]) => React.createElement('div', {
            key: w, onClick: () => this.setDemoWinner(w),
            style: { flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 8, fontWeight: 900, fontSize: 11, cursor: 'pointer', background: s.demoCard.winner === w ? g.color : 'rgba(255,255,255,.06)', color: s.demoCard.winner === w ? '#06210f' : '#fff' }
          }, label))
        ),
        g.hasOutcome && React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'MATCH OUTCOME'),
          React.createElement('div', { style: { fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 6 } }, 'Every fight is scored fully as if it goes the distance — even on a KO. This pick is for bragging rights and doesn\'t change your stat score.'),
          React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 6 } },
            [['a', fa + ' WINS BY KO'], ['b', fb + ' WINS BY KO']].map(([o, label]) => React.createElement('div', {
              key: o, onClick: () => this.setDemoOutcome(o),
              style: { flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 8, fontSize: 9.5, fontWeight: 900, cursor: 'pointer', background: s.demoCard.outcome === o ? '#ef4444' : 'rgba(255,255,255,.06)', color: '#fff' }
            }, label))
          ),
          s.demoCard.outcome && React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: '#22c55e', marginBottom: 14 } }, '✓ Picked ' + (s.demoCard.outcome === 'a' ? fa : fb) + ' by KO'),
          !s.demoCard.outcome && React.createElement('div', { style: { fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 14 } }, 'No pick needed — full-fight scoring applies either way.')
        ),
        !g.hasOutcome && React.createElement('div', { style: { fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 14 } }, 'Wrestling scores on full-match totals + your winner pick — no KO/Survival split.'),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          React.createElement('div', { onClick: this.demoBack, style: { padding: '12px 18px', borderRadius: 10, background: 'rgba(255,255,255,.08)', fontWeight: 800, fontSize: 11, cursor: 'pointer' } }, '← BACK'),
          React.createElement('div', { onClick: this.demoNext, style: { flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 10, background: g.color, color: '#06210f', fontWeight: 900, fontSize: 12, cursor: 'pointer' } }, 'SUBMIT & WATCH IT SCORE →')
        )
      ),

      s.demoStep === 2 && React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 12, lineHeight: 1.5 } },
          '❓ ', React.createElement('b', null, 'How does live scoring work?'), ' Each round is judged on its own, then all rounds add up to your final total.'
        ),
        g.rounds.slice(0, s.demoRoundsRevealed).map((r, idx) => React.createElement('div', { key: idx, style: { marginBottom: 14, animation: 'toastIn .3s ease-out' } },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#f2b544', marginBottom: 4 } }, 'ROUND ' + (idx + 1)),
          React.createElement('div', { style: { fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, r.note),
          [[fa, this.demoRoundTotal(r, 'a', g.cats), '#ef4444'], [fb, this.demoRoundTotal(r, 'b', g.cats), '#4d8dff']].map(([label, val, color]) => React.createElement('div', { key: label, style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } },
            React.createElement('div', { style: { width: 76, fontSize: 9, fontWeight: 800 } }, label),
            React.createElement('div', { style: { flex: 1, height: 10, background: 'rgba(255,255,255,.08)', borderRadius: 5, overflow: 'hidden' } },
              React.createElement('div', { style: { height: '100%', width: (val / maxBar * 100) + '%', background: color, transition: 'width .6s ease' } })
            ),
            React.createElement('div', { style: { width: 20, fontSize: 9, fontWeight: 900, color } }, val)
          )),
          React.createElement('div', { style: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 8, marginTop: 6 } },
            React.createElement('div', { style: { fontSize: 7.5, fontWeight: 900, color: 'rgba(255,255,255,.5)', marginBottom: 4 } }, 'FULL BREAKDOWN — WHAT HAPPENED THIS ROUND'),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,.4)', marginBottom: 2 } },
              React.createElement('div', null, ''), React.createElement('div', { style: { textAlign: 'center', color: '#ef4444' } }, fa), React.createElement('div', { style: { textAlign: 'center', color: '#4d8dff' } }, fb)
            ),
            g.cats.map(([cat, label]) => React.createElement('div', {
              key: cat, style: { display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', fontSize: 9, fontWeight: 700, padding: '2px 0' }
            },
              React.createElement('div', { style: { color: 'rgba(255,255,255,.7)' } }, label),
              React.createElement('div', { style: { textAlign: 'center', fontWeight: 900 } }, r.a[cat]),
              React.createElement('div', { style: { textAlign: 'center', fontWeight: 900 } }, r.b[cat])
            ))
          ),
          React.createElement('div', { style: { background: 'rgba(242,181,68,.08)', border: '1px solid rgba(242,181,68,.3)', borderRadius: 8, padding: 8, marginTop: 6 } },
            React.createElement('div', { style: { fontSize: 7.5, fontWeight: 900, color: '#f2c869', marginBottom: 4 } }, 'YOUR SCORECARD VS REALITY (THROUGH ROUND ' + (idx + 1) + ')'),
            g.cats.map(([cat, label]) => {
              const soFarA = g.rounds.slice(0, idx + 1).reduce((n, rr) => n + rr.a[cat], 0);
              const soFarB = g.rounds.slice(0, idx + 1).reduce((n, rr) => n + rr.b[cat], 0);
              const predA = s.demoCard.a[cat], predB = s.demoCard.b[cat];
              return React.createElement('div', { key: cat, style: { fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.75)', padding: '2px 0' } },
                label + ': ', fa + ' predicted ' + predA + ' · actual so far ' + soFarA, ' — ', fb + ' predicted ' + predB + ' · actual so far ' + soFarB
              );
            })
          )
        )),
        s.demoRoundsRevealed < 3 ? React.createElement('div', { onClick: this.revealDemoRound, style: { textAlign: 'center', padding: '12px 0', borderRadius: 10, background: '#f2b544', color: '#2b1b00', fontWeight: 900, fontSize: 12, cursor: 'pointer', marginBottom: 8, marginTop: 12 } }, 'REVEAL ROUND ' + (s.demoRoundsRevealed + 1) + ' →') :
          React.createElement('div', { style: { background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.4)', borderRadius: 10, padding: 12, marginBottom: 12, marginTop: 12, textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.6)', marginBottom: 2 } }, 'FINAL TOTALS'),
            React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 16 } }, React.createElement('span', { style: { color: '#ef4444' } }, cumA), ' — ', React.createElement('span', { style: { color: '#4d8dff' } }, cumB))
          ),
        s.demoRoundsRevealed === 3 && React.createElement('div', { onClick: this.demoNext, style: { textAlign: 'center', padding: '12px 0', borderRadius: 10, background: '#22c55e', color: '#06210f', fontWeight: 900, fontSize: 12, cursor: 'pointer' } }, 'SEE HOW THE LEADERBOARD MOVED →')
      ),

      s.demoStep === 3 && React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 12, lineHeight: 1.5 } },
          '❓ ', React.createElement('b', null, 'How do I rank?'), ' Your total score is compared against every other player in the contest. ', s.demoCard.winner === 'a' ? 'You correctly picked ' + fa + ' — nice, that\'s reflected below.' : 'You picked ' + fb + ', who didn\'t win here — see how that affects your score below.'
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 } },
          s.demoLeaderboard.map((p, i) => React.createElement('div', {
            key: p.name, style: {
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderRadius: 8, transition: 'all .4s ease',
              background: p.name === 'You' ? 'rgba(242,181,68,.15)' : 'rgba(255,255,255,.04)',
              border: p.name === 'You' ? '1px solid rgba(242,181,68,.4)' : '1px solid rgba(255,255,255,.06)'
            }
          },
            React.createElement('div', { style: { fontSize: 11, fontWeight: 800 } }, (i + 1) + '. ' + p.name),
            React.createElement('div', { style: { fontSize: 11, fontWeight: 900, color: '#f2b544', animation: 'ptsTwinkle 2s ease-in-out infinite' } }, p.score + ' PTS')
          ))
        ),
        React.createElement('div', { onClick: this.demoNext, style: { textAlign: 'center', padding: '12px 0', borderRadius: 10, background: '#22c55e', color: '#06210f', fontWeight: 900, fontSize: 12, cursor: 'pointer' } }, 'SEE POST-FIGHT COMMENTS →')
      ),

      s.demoStep === 4 && React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 10, lineHeight: 1.5 } },
          '❓ ', React.createElement('b', null, 'Can I talk to other players?'), ' Yes — every fight has a comment thread. Try it below.'
        ),
        React.createElement('div', { style: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 10, marginBottom: 10, maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 } },
          s.demoComments.map(c => React.createElement('div', { key: c.id, style: { fontSize: 11, lineHeight: 1.3 } },
            React.createElement('span', { style: { fontWeight: 900, color: c.mine ? '#f2b544' : '#4d8dff' } }, c.name + ': '),
            React.createElement('span', { style: { color: 'rgba(255,255,255,.85)', fontWeight: 600 } }, c.text)
          ))
        ),
        React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 14 } },
          React.createElement('input', {
            value: s.demoCommentDraft, placeholder: 'Type a comment...', onChange: (e) => this.setDemoCommentDraft(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Enter') this.addDemoComment(); },
            style: { flex: 1, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 12, fontFamily: "'Rajdhani',sans-serif" }
          }),
          React.createElement('div', { onClick: this.addDemoComment, style: { padding: '10px 16px', borderRadius: 8, background: '#4d8dff', fontWeight: 900, fontSize: 12, cursor: 'pointer' } }, 'SEND')
        ),
        React.createElement('div', { onClick: this.demoNext, style: { textAlign: 'center', padding: '12px 0', borderRadius: 10, background: '#22c55e', color: '#06210f', fontWeight: 900, fontSize: 12, cursor: 'pointer' } }, 'FINISH THIS CARD →')
      ),

      s.demoStep === 5 && React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 13, fontWeight: 900, color: '#22c55e', textAlign: 'center', marginBottom: 12 } }, '✓ CARD COMPLETE — ' + g.title),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 } },
          [
            ['Scorecards', 'You predict full-fight stat totals per fighter, plus who wins.'],
            ['Round scoring', 'Each round is judged separately, then totals add up.'],
            ['Leaderboard', 'Your total score ranks you against everyone else in the contest.'],
            ['Comments', 'Every fight has a live discussion thread with other players.'],
          ].map(([t, d]) => React.createElement('div', { key: t, style: { display: 'flex', gap: 8, alignItems: 'flex-start' } },
            React.createElement('span', { style: { color: '#22c55e', fontWeight: 900 } }, '✓'),
            React.createElement('div', null,
              React.createElement('span', { style: { fontWeight: 900, fontSize: 11 } }, t + ': '),
              React.createElement('span', { style: { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.7)' } }, d)
            )
          ))
        ),
        React.createElement('div', { style: { background: 'rgba(77,141,255,.08)', border: '1px solid rgba(77,141,255,.3)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.7)', lineHeight: 1.7 } },
          '❓ Do I need real money? No — Play for Free contests exist too.', React.createElement('br'),
          '❓ What if I don\'t know the fighters? Check the scouting report we show before every real pick.', React.createElement('br'),
          '❓ Can I change my pick after submitting? No — picks lock at the published lock time, just like this demo.'
        ),
        React.createElement('div', { onClick: this.finishDemoCard, style: { textAlign: 'center', padding: '13px 0', borderRadius: 10, background: g.color, color: '#06210f', fontWeight: 900, fontSize: 12, cursor: 'pointer', marginBottom: 8 } }, doneCount < 2 ? '→ TRY ANOTHER CARD TYPE' : '→ BACK TO CARD SELECT'),
        React.createElement('div', { onClick: () => this.setTab('contests'), style: { textAlign: 'center', padding: '11px 0', borderRadius: 10, background: 'rgba(239,68,68,.15)', color: '#ef4444', fontWeight: 800, fontSize: 11, cursor: 'pointer' } }, '🔥 or see all open fights now')
      )
    );
  }

  renderSettings(s) {
    const toggle = (label, desc, key) => React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 14, marginBottom: 10 }
    },
      React.createElement('div', null,
        React.createElement('div', { style: { fontWeight: 800, fontSize: 13 } }, label),
        React.createElement('div', { style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginTop: 2 } }, desc)
      ),
      React.createElement('div', {
        onClick: () => this.toggleSetting(key),
        style: { width: 44, height: 24, borderRadius: 999, background: s.settings[key] ? '#22c55e' : 'rgba(255,255,255,.15)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flex: '0 0 auto' }
      },
        React.createElement('div', { style: { position: 'absolute', top: 2, left: s.settings[key] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s' } })
      )
    );
    return React.createElement('div', { style: { padding: '8px 16px' } },
      React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, marginBottom: 4, color: '#f2b544' } }, 'SCORING & SETTINGS'),
      this.props.isStaff && React.createElement(React.Fragment, null,
      React.createElement('div', { style: { fontSize: 8.5, fontWeight: 900, color: '#ef4444', letterSpacing: 1, marginBottom: 4 } }, '🔒 ADMIN / BACK-OFFICE ONLY — NOT VISIBLE TO USERS'),
      React.createElement('div', { style: { fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 16 } }, 'Tune how Fight IQ scoring and challenges work for you'),
      React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#22c55e', letterSpacing: 1, marginBottom: 8 } }, '⚡ AUTOMATION — LESS FOR YOU TO MANAGE'),
      toggle('Auto-Settle Challenges', 'Head-to-head results resolve and pay out automatically — no manual review', 'autoSettle'),
      toggle('Auto-Accept League Requests', 'Public leagues admit new members instantly, no approval queue', 'autoAcceptLeague'),
      toggle('Auto-Payout Winnings', 'Coins credit the instant a fight/challenge settles', 'autoPayout'),
      toggle('AI Auto-Score Completed Fights', 'AI reviews finished fights and finalizes scorecards & leaderboards instantly — no manual grading', 'aiAutoScore'),
      React.createElement('div', { style: { background: 'linear-gradient(135deg,rgba(34,197,94,.12),rgba(77,141,255,.08))', border: '1px solid rgba(34,197,94,.4)', borderRadius: 12, padding: 14, marginBottom: 16, boxShadow: '0 0 16px rgba(34,197,94,.25)' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } },
          React.createElement('span', { style: { fontSize: 16 } }, '🤖'),
          React.createElement('div', { style: { fontWeight: 900, fontSize: 13 } }, 'AI Scoring Assistant')
        ),
        React.createElement('div', { style: { fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 700, marginBottom: 10 } }, 'Runs in the background to grade old/completed fights, catch missed results, and keep every leaderboard current — like having a full ops team.'),
        React.createElement('div', {
          onClick: this.runAiScoring,
          style: { textAlign: 'center', padding: '10px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: s.aiScoring ? 'rgba(34,197,94,.15)' : '#22c55e', color: s.aiScoring ? '#22c55e' : '#06210f', animation: s.aiScoring ? 'pulseLive 1s infinite' : 'none' }
        }, s.aiScoring ? '🤖 SCORING IN PROGRESS…' : 'RUN AI SCORING NOW')
      ),
      React.createElement('div', { style: { background: 'rgba(77,141,255,.08)', border: '1px solid rgba(77,141,255,.4)', borderRadius: 12, padding: 14, marginBottom: 16 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } },
          React.createElement('span', { style: { fontSize: 16 } }, '👥'),
          React.createElement('div', { style: { fontWeight: 900, fontSize: 13 } }, 'Live Scoring Team'),
          React.createElement('div', { style: { fontSize: 7.5, fontWeight: 900, color: '#ef4444', background: 'rgba(239,68,68,.15)', padding: '1px 6px', borderRadius: 999, marginLeft: 4 } }, 'STAFF ONLY')
        ),
        React.createElement('div', { style: { fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 700, marginBottom: 10 } }, 'Assign each hire to one corner — they only see and score that fighter. AI suggests live strike/power-move counts from the feed; the scorer just confirms or adjusts, so you can run multiple simultaneous events without doing it all yourself.'),
        React.createElement('div', {
          onClick: () => { this.openModal('aiScoringDemo'); this.startAiDemo(); },
          style: { textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: '#a855f7', color: '#fff', marginBottom: 10 }
        }, '▶ SEE AI-ASSISTED SCORING IN ACTION'),
        ['UFC 323', 'BKFC 71', 'GLORY 92'].map(ev => React.createElement('div', { key: ev, style: { marginBottom: 10 } },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#f2c869', marginBottom: 4 } }, ev),
          s.scorerTeam.filter(r => r.event === ev).map(row => React.createElement('div', {
            key: row.id, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', marginBottom: 3, borderRadius: 6, background: row.side === 'red' ? 'rgba(239,68,68,.08)' : 'rgba(77,141,255,.08)', borderLeft: '3px solid ' + (row.side === 'red' ? '#ef4444' : '#4d8dff') }
          },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: row.side === 'red' ? '#ef4444' : '#4d8dff' } }, (row.side === 'red' ? 'RED CORNER' : 'BLUE CORNER') + ' · ' + row.corner),
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 } },
                React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: row.status === 'live' ? '#22c55e' : 'rgba(255,255,255,.5)' } }, row.name),
                row.status === 'live' && React.createElement('div', { style: { fontSize: 7.5, fontWeight: 900, color: '#a855f7', background: 'rgba(168,85,247,.15)', padding: '1px 5px', borderRadius: 999 } }, '🤖 AI-ASSISTED')
              )
            ),
            row.status === 'live'
              ? React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 } }, React.createElement('span', { style: { width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulseLive 1.2s infinite' } }), 'SCORING')
              : React.createElement('div', { onClick: () => this.assignScorer(row.id), style: { fontSize: 10, fontWeight: 900, color: '#4d8dff', cursor: 'pointer' } }, 'ASSIGN →')
          ))
        ))
      )),
      React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.5)', letterSpacing: 1, margin: '18px 0 8px' } }, 'SCORING & ALERTS'),
      toggle('Round-by-Round Scoring', 'Score picks live each round during Watch Party, not just the fight winner', 'roundByRound'),
      toggle('Sound Effects', 'Bell rings & crowd cheers on wins, entries and claims', 'sound'),
      toggle('Push Notifications', 'Alerts before picks lock and when challenges are sent', 'notifications'),
      toggle('Email Alerts', 'Get emailed when new fights are added and fight week kicks off', 'emailAlerts'),
      toggle('Text Alerts', 'Get a text before predictions lock on fights you\'ve entered', 'textAlerts'),
      React.createElement('div', { style: { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 14, marginBottom: 10 } },
        React.createElement('div', { style: { fontWeight: 800, fontSize: 13, marginBottom: 2 } }, 'Max Head-to-Head Wager'),
        React.createElement('div', { style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 10 } }, 'Caps how many FM coins you can stake per challenge'),
        React.createElement('div', { style: { display: 'flex', gap: 6 } },
          [100, 250, 500, 1000].map(v => React.createElement('div', {
            key: v, onClick: () => this.setWagerLimit(v),
            style: { flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: s.settings.wagerLimit === v ? '#f2b544' : 'rgba(255,255,255,.06)', color: s.settings.wagerLimit === v ? '#2b1b00' : '#fff' }
          }, v))
        )
      ),
      React.createElement('div', { style: { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 14 } },
        React.createElement('div', { style: { fontWeight: 800, fontSize: 13, marginBottom: 2 } }, 'League Visibility'),
        React.createElement('div', { style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 10 } }, 'Who can find and request to join your leagues'),
        React.createElement('div', { style: { display: 'flex', gap: 6 } },
          [['invite', 'Invite Only'], ['public', 'Public']].map(([v, label]) => React.createElement('div', {
            key: v, onClick: () => this.setLeagueVisibility(v),
            style: { flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: s.settings.leagueVisibility === v ? '#a855f7' : 'rgba(255,255,255,.06)', color: '#fff' }
          }, label))
        )
      )
    );
  }

  renderTicker() {
    const fightCount = Array.isArray(this.props.fights) ? this.props.fights.length : 0;
    const leaderboardCount = Array.isArray(this.props.leaderboard) ? this.props.leaderboard.length : 0;
    const items = [
      ['🔥', fightCount ? `${fightCount} published fight card${fightCount === 1 ? '' : 's'} available` : 'New fight cards publish here automatically', '#ff6b3b'],
      ['🥊', 'Contest dates, fees and pools come directly from the registered fight', '#f2b544'],
      ['🏆', leaderboardCount ? `${leaderboardCount} ranked predictor${leaderboardCount === 1 ? '' : 's'} on the live board` : 'Leaderboard opens after submitted predictions are scored', '#22c55e'],
      ['⚡', 'Live fight status refreshes from the production feed', '#4d8dff'],
    ];
    const loop = [...items, ...items];
    return React.createElement('div', { style: { overflow: 'hidden', position: 'relative', borderTop: '2px solid #f2b544', borderBottom: '2px solid #f2b544', padding: '10px 0', marginBottom: 14, boxShadow: '0 0 20px rgba(242,181,68,.35), inset 0 0 24px rgba(0,0,0,.5)' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'ticker-bg', shape: 'rect', placeholder: 'Arena photo', fit: 'cover', src: 'uploads/pasted-1785015130714-0.png' })),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(26,18,6,.35),rgba(36,21,5,.25),rgba(26,18,6,.35))' } }),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#05060a,transparent 10%,transparent 90%,#05060a)', zIndex: 2, pointerEvents: 'none' } }),
      React.createElement('div', { style: { display: 'flex', gap: 0, whiteSpace: 'nowrap', width: 'max-content', animation: 'marquee 24s linear infinite' } },
        loop.map((t, i) => React.createElement('span', { key: i, style: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 900, color: '#ff2020', padding: '0 18px', borderRight: '1px solid rgba(242,181,68,.3)' } },
          React.createElement('span', {
            style: {
              width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.35), transparent 60%), ' + t[2], boxShadow: '0 0 8px ' + t[2] + '90'
            }
          }, t[0]),
          React.createElement('span', { style: { textShadow: '0 1px 3px rgba(0,0,0,.6)' } }, t[1])
        ))
      )
    );
  }

  renderStatsBar() {
    const publicStats = this.props.stats && typeof this.props.stats === 'object' ? this.props.stats : {};
    const playerCount = toSafeNumber(publicStats.players);
    const activeFights = toSafeNumber(publicStats.activeFights, Array.isArray(this.props.fights) ? this.props.fights.length : 0);
    const rankedPlayers = Array.isArray(this.props.leaderboard) ? this.props.leaderboard.length : 0;
    const stats = [
      { icon: 'users', big: playerCount > 0 ? playerCount.toLocaleString() : '—', small: 'PREDICTORS', sub: null, color: '#a855f7', go: 'leaderboard' },
      { icon: 'trophy', big: rankedPlayers > 0 ? rankedPlayers.toLocaleString() : '—', small: 'RANKED PLAYERS', sub: null, color: '#f2b544', go: 'leaderboard' },
      { icon: 'live', big: activeFights > 0 ? activeFights.toLocaleString() : '—', small: 'LIVE EVENTS', sub: null, color: '#4d8dff', go: 'contests' },
      { icon: 'bars', big: 'LIVE', small: 'LEADERBOARDS', sub: null, color: '#22c55e', go: 'leaderboard' },
      { icon: 'shield', big: 'REAL FIGHTS', small: 'REAL ACTION', sub: null, color: '#f2b544', go: 'leagues' },
    ];
    const iconSvg = {
      users: (c) => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24' },
        React.createElement('circle', { cx: 8, cy: 8, r: 3.2, fill: c }), React.createElement('circle', { cx: 16, cy: 8, r: 3.2, fill: c }),
        React.createElement('path', { d: 'M2 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5', fill: c }), React.createElement('path', { d: 'M10 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5', fill: c, opacity: .7 })),
      trophy: (c) => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M7 4h10v5a5 5 0 01-10 0V4z', fill: c }), React.createElement('path', { d: 'M7 6H4v1a4 4 0 003 3.87M17 6h3v1a4 4 0 01-3 3.87', stroke: c, strokeWidth: 2, fill: 'none' }),
        React.createElement('rect', { x: 10, y: 13, width: 4, height: 4, fill: c }), React.createElement('rect', { x: 7, y: 18, width: 10, height: 2.5, rx: 1, fill: c })),
      live: (c) => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 2 },
        React.createElement('circle', { cx: 12, cy: 12, r: 3, fill: c, stroke: 'none' }), React.createElement('path', { d: 'M7.5 8.5a6.5 6.5 0 000 7M16.5 8.5a6.5 6.5 0 010 7' }), React.createElement('path', { d: 'M4.2 5.5a11 11 0 000 13M19.8 5.5a11 11 0 010 13', opacity: .6 })),
      bars: (c) => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24' },
        React.createElement('rect', { x: 3, y: 14, width: 4, height: 7, rx: 1, fill: c, opacity: .6 }), React.createElement('rect', { x: 10, y: 9, width: 4, height: 12, rx: 1, fill: c, opacity: .8 }), React.createElement('rect', { x: 17, y: 4, width: 4, height: 17, rx: 1, fill: c })),
      shield: (c) => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z', fill: 'none', stroke: c, strokeWidth: 2 }),
        React.createElement('path', { d: 'M12 7l1.7 3.5 3.8.5-2.8 2.7.7 3.8L12 15.6l-3.4 1.9.7-3.8-2.8-2.7 3.8-.5z', fill: c })),
    };
    return React.createElement('div', { style: { display: 'flex', gap: 5, padding: '0 12px 8px' } },
      stats.map((st, i) => React.createElement('div', {
        key: i, onClick: () => this.setTab(st.go), style: {
          flex: '1 1 0', minWidth: 0, background: '#000', border: '1px solid ' + st.color + '80',
          borderRadius: 10, padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer',
          boxShadow: '0 0 12px ' + st.color + '40, inset 0 0 10px ' + st.color + '15'
        }
      },
        iconSvg[st.icon](st.color),
        React.createElement('div', { style: { fontSize: 9.5, fontWeight: 800, color: st.color, lineHeight: 1.1, textAlign: 'center' } }, st.big),
        React.createElement('div', { style: { fontSize: 6, fontWeight: 700, color: 'rgba(255,255,255,.6)', letterSpacing: .2, lineHeight: 1.2, textAlign: 'center' } }, st.small),
        st.sub && React.createElement('div', { style: { fontSize: 6.5, fontWeight: 700, color: '#22c55e', animation: 'moneyPulse 1.8s ease-in-out infinite' } }, st.sub)
      ))
    );
  }

  renderSportSelector(sports, s) {
    return React.createElement('div', { style: { padding: '0 16px 16px', position: 'relative' } },
      React.createElement('div', { style: { display: 'flex', gap: 6, justifyContent: 'space-between' } },
        sports.map(sp => React.createElement('div', {
          key: sp.id, onClick: () => this.setSport(sp.id),
          style: {
            flex: '1 1 0', minWidth: 0, height: 118, borderRadius: 10, position: 'relative', overflow: 'hidden', cursor: 'pointer',
            border: '2px solid ' + sp.color + (sp.active ? '' : 'aa'),
            boxShadow: sp.active ? '0 0 16px ' + sp.color + '99, inset 0 0 12px ' + sp.color + '30' : '0 0 8px ' + sp.color + '55'
          }
        },
          (() => { const ids = [0, 1, 2, 3, 4].map(i => 'sport-' + sp.id + '-' + i); const activeId = this.pickCycleId(ids, s);
            return ids.map((id, i) => React.createElement('div', {
              key: id, style: { position: 'absolute', inset: 0, opacity: id === activeId ? 1 : 0, transition: 'opacity 1s ease', pointerEvents: id === activeId ? 'auto' : 'none' }
            }, React.createElement(MobileImageSlot, { id, shape: 'rect', placeholder: sp.name + ' — fighter ' + (i + 1), fit: 'cover' })));
          })(),
          React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 40%,rgba(0,0,0,.85))', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 5, pointerEvents: 'none' } },
            React.createElement('div', { style: { fontSize: 8.5, fontWeight: 900, letterSpacing: .2, lineHeight: 1.1, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.9)' } }, sp.name),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 3, fontSize: 7, fontWeight: 700, color: sp.color } },
              React.createElement('span', { style: { width: 4, height: 4, borderRadius: '50%', background: sp.color, animation: 'pulseLive 1.4s infinite' } }), 'LIVE'
            )
          )
        ))
      )
    );
  }

  renderFeaturedBannerLegacy() {
    return React.createElement('div', {
      onClick: () => this.setTab('predict'),
      style: {
        margin: '0 16px 16px', position: 'relative', borderRadius: 14, overflow: 'hidden', height: 190,
        border: '1px solid rgba(242,181,68,.4)', animation: 'glowPulse 3s ease-in-out infinite', cursor: 'pointer'
      }
    },
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'featured-arena-bg', shape: 'rect', placeholder: 'Arena crowd photo', fit: 'cover', src: 'uploads/pasted-1785015130714-0.png' })),
      React.createElement('div', { style: { position: 'absolute', left: 0, bottom: 0, width: '20%', height: '55%' } },
        React.createElement('div', { style: { position: 'absolute', inset: '8% 12% 0 12%', background: '#000', clipPath: 'ellipse(55% 100% at 50% 100%)', overflow: 'hidden' } },
          React.createElement(MobileImageSlot, { id: 'featured-left', shape: 'rect', placeholder: 'Jones photo' , fit: 'contain', src: 'uploads/transparent-featured-left.png'})
        )
      ),
      React.createElement('div', { style: { position: 'absolute', right: 0, bottom: 0, width: '20%', height: '55%' } },
        React.createElement('div', { style: { position: 'absolute', inset: '8% 12% 0 12%', background: '#000', clipPath: 'ellipse(55% 100% at 50% 100%)', overflow: 'hidden' } },
          React.createElement(MobileImageSlot, { id: 'featured-right', shape: 'rect', placeholder: 'Aspinall photo' , fit: 'contain', src: 'uploads/transparent-featured-right.png'})
        )
      ),
      React.createElement('div', { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 12, pointerEvents: 'none' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#f2b544', display: 'flex', gap: 4, alignItems: 'center' } }, '★ FEATURED THIS WEEK'),
          React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#ff2020', textShadow: '0 1px 4px rgba(0,0,0,.9)' } }, '⏱ 2 DAYS LEFT')
        ),
        React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22 } }, 'UFC 323'),
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 26, letterSpacing: .5 } },
            'JONES ', React.createElement('span', { style: { color: '#ef4444' } }, 'VS'), ' ASPINALL'
          ),
          React.createElement('div', { style: { display: 'flex', gap: 14, marginTop: 4 } },
            React.createElement('div', { style: { fontSize: 12, fontWeight: 900, color: '#2eff6e', textShadow: '0 1px 4px rgba(0,0,0,.8)', animation: 'moneyPulse 1.8s ease-in-out infinite' } }, '$100,000 POOL'),
            React.createElement('div', { style: { fontSize: 12, fontWeight: 900, color: '#ffce54', textShadow: '0 1px 4px rgba(0,0,0,.8)' } }, '$5 ENTRY'),
            React.createElement('div', { style: { fontSize: 12, fontWeight: 900, color: '#ff2020', textShadow: '0 1px 4px rgba(0,0,0,.8)' } }, '22,450 ENTRIES')
          )
        ),
        React.createElement('div', {
          onClick: (e) => { e.stopPropagation(); this.openModal('predictModal', { id: 1, tag: 'UFC 323', f1: 'JONES', f2: 'ASPINALL', prize: '$100,000' }); },
          style: { pointerEvents: 'auto', alignSelf: 'center', background: '#f2b544', color: '#2b1b00', fontWeight: 900, fontSize: 12, padding: '9px 18px', borderRadius: 8, cursor: 'pointer' }
        }, 'MAKE PREDICTIONS')
      )
    );
  }

  renderFeaturedBanner(event) {
    if (!event) return null;
    const entry = this.getEventEntryLabel(event);
    const entryCount = event.entries > 0 ? `${event.entries.toLocaleString()} ENTRIES` : 'NO ENTRIES YET';
    return React.createElement('div', {
      onClick: () => this.openEvent(event),
      style: { margin: '0 16px 16px', position: 'relative', borderRadius: 14, overflow: 'hidden', minHeight: 190, border: '1px solid ' + event.tagColor, boxShadow: '0 0 18px ' + event.tagColor + '55', cursor: 'pointer', background: '#080a10' }
    },
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'featured-live-' + event.id, shape: 'rect', placeholder: event.f1 + ' vs ' + event.f2, fit: 'cover', src: event.featuredThisWeekImage || event.image, fallbackSrc: event.fallbackImage })),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,6,10,.2),rgba(5,6,10,.96))' } }),
      React.createElement('div', { style: { position: 'relative', minHeight: 190, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center' } },
        React.createElement('span', { style: { color: '#f2b544', fontSize: 9, fontWeight: 900 } }, '★ FEATURED THIS WEEK · ' + event.date),
        React.createElement('h2', { style: { fontFamily: "'Anton',sans-serif", fontSize: 25, margin: '5px 0' } }, event.f1, React.createElement('em', { style: { color: '#ef4444', fontStyle: 'normal' } }, ' VS '), event.f2),
        React.createElement('div', { style: { display: 'flex', gap: 12, fontSize: 10, fontWeight: 900, marginBottom: 9 } },
          React.createElement('span', { style: { color: '#22c55e' } }, event.prize || 'PRIZE TERMS PENDING'),
          React.createElement('span', { style: { color: '#ffce54' } }, entry),
          React.createElement('span', { style: { color: '#ff4d6d' } }, entryCount)
        ),
        React.createElement('div', { style: { display: 'flex', width: '100%', maxWidth: 330, gap: 7, alignItems: 'stretch' } },
          React.createElement('div', {
            role: 'button', tabIndex: 0, 'aria-label': `Open AI scouting report for ${event.f1} versus ${event.f2}`,
            onClick: (clickEvent) => { clickEvent.stopPropagation(); this.openAiScout(event); },
            style: { flex: '0 0 62px', minHeight: 38, display: 'grid', placeItems: 'center', borderRadius: 8, background: 'linear-gradient(135deg,#4d8dff,#a855f7)', color: '#fff', fontSize: 8.5, lineHeight: 1.05, whiteSpace: 'pre-line', fontWeight: 1000, letterSpacing: .4, boxShadow: '0 0 14px rgba(77,141,255,.55)', cursor: 'pointer' }
          }, 'AI\nSCOUT'),
          React.createElement('strong', {
            role: 'button', tabIndex: 0, 'aria-label': `${this.getEventActionLabel(event)} for ${event.f1} versus ${event.f2}`,
            onClick: (clickEvent) => { clickEvent.stopPropagation(); this.openEvent(event); },
            style: { flex: 1, display: 'grid', placeItems: 'center', background: '#f2b544', color: '#2b1b00', borderRadius: 8, padding: '9px 10px', fontSize: 11 }
          }, this.getEventActionLabel(event))
        ),
        React.createElement('span', { style: { marginTop: 5, color: '#9bbcff', fontSize: 8, fontWeight: 900, letterSpacing: .35 } }, 'AI SCOUTING REPORT')
      )
    );
  }

  renderUpcomingEvents(filteredEvents, s) {
    if (this.props.dataLoading && filteredEvents.length === 0) return null;
    return React.createElement('div', { 'data-fmm-section': 'upcoming-events', style: { padding: '0 16px 16px', scrollMarginTop: 8 } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
        React.createElement('div', { style: { fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(255,255,255,.7)' } }, 'UPCOMING EVENTS'),
        React.createElement('div', { onClick: () => this.setTab('contests'), style: { fontSize: 11, fontWeight: 700, color: '#4d8dff', cursor: 'pointer' } }, 'VIEW ALL ›')
      ),
      React.createElement('div', { style: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 } },
        filteredEvents.length === 0 ? React.createElement('div', { style: { fontSize: 12, color: 'rgba(255,255,255,.4)', padding: 10 } }, 'No events for this sport yet.') :
        filteredEvents.map(ev => React.createElement('div', {
          key: ev.id, style: { flex: '0 0 140px', position: 'relative', background: 'rgba(255,255,255,.05)', border: '1px solid ' + ev.tagColor, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 0 14px ' + ev.tagColor + '55, inset 0 0 10px ' + ev.tagColor + '20', animation: s.flashCard[ev.id] ? 'cardPop .35s ease' : 'none' }
        },
          s.flashCard[ev.id] && React.createElement('div', { key: s.flashCard[ev.id], style: { position: 'absolute', inset: 0, background: 'radial-gradient(circle,rgba(242,181,68,.55),transparent 70%)', animation: 'quickFlash .6s ease-out forwards', zIndex: 5, pointerEvents: 'none' } }),
          React.createElement('div', { style: { height: 150, position: 'relative' } },
            React.createElement(MobileImageSlot, { id: 'event-poster-' + ev.id, shape: 'rect', placeholder: ev.f1 + ' vs ' + ev.f2 + ' poster', fit: 'contain', src: ev.image, fallbackSrc: ev.fallbackImage }),
            React.createElement('div', { style: { position: 'absolute', top: 6, left: 6, background: ev.tagColor, color: '#fff', fontSize: 8, fontWeight: 900, padding: '3px 6px', borderRadius: 5 } }, ev.tag)
          ),
          React.createElement('div', { style: { padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 4 } },
            React.createElement('div', { style: { fontSize: 13, fontWeight: 900, lineHeight: 1.2 } }, ev.f1, React.createElement('span', { style: { color: '#ef4444' } }, ' VS '), ev.f2),
            React.createElement('div', { style: { fontSize: 10, color: 'rgba(255,255,255,.55)', fontWeight: 700 } }, ev.date, ' · ', ev.countdown),
            React.createElement('div', { style: { fontSize: 12, fontWeight: 800, color: '#22c55e' , animation: 'moneyPulse 1.8s ease-in-out infinite' } }, ev.prize),
            React.createElement('div', {
              role: 'button', tabIndex: 0, 'aria-label': `Open AI scouting report for ${ev.f1} versus ${ev.f2}`,
              onClick: () => this.openAiScout(ev),
              style: { textAlign: 'center', padding: '6px 0', borderRadius: 7, fontSize: 8.5, fontWeight: 900, background: 'linear-gradient(90deg,rgba(77,141,255,.22),rgba(168,85,247,.22))', border: '1px solid rgba(77,141,255,.45)', color: '#b9cbff', cursor: 'pointer' }
            }, 'AI SCOUTING'),
            React.createElement('div', {
              role: 'button', tabIndex: 0, 'aria-label': `${this.getEventActionLabel(ev)} for ${ev.f1} versus ${ev.f2}`,
              onClick: () => this.openEvent(ev),
              style: { marginTop: 4, textAlign: 'center', padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: ev.entered ? 'default' : 'pointer', background: ev.entered ? 'rgba(34,197,94,.15)' : ev.tagColor, color: ev.entered ? '#22c55e' : '#fff' }
            }, ev.entered ? 'ENTERED ✓' : this.getEventActionLabel(ev))
          )
        ))
      )
    );
  }

  renderFeaturedDetailLegacy(s) {
    return React.createElement('div', { style: { margin: '0 16px 16px', position: 'relative', overflow: 'hidden', border: '1px solid #ef4444', borderRadius: 14, padding: 12, boxShadow: '0 0 18px rgba(239,68,68,.45), inset 0 0 14px rgba(239,68,68,.1)' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'featured-detail-bg', shape: 'rect', placeholder: 'Arena photo', fit: 'cover', src: 'uploads/pasted-1785015130714-0.png' })),
      React.createElement('div', { style: { position: 'relative' } },
      React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#ffce54', textShadow: '0 1px 4px rgba(0,0,0,.8)', marginBottom: 6 } }, 'FEATURED FIGHT · HEAVYWEIGHT BOUT'),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 } },
        React.createElement('div', { style: { width: 100, height: 100, flex: '0 0 auto', background: '#000', borderRadius: '50%' } }, React.createElement(MobileImageSlot, { id: 'fd-jones', shape: 'circle', placeholder: 'Jones', fit: 'cover', src: 'uploads/transparent-fd-jones.png' })),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 20, textAlign: 'center', flex: 1, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.8)' } }, 'JONES ', React.createElement('span', { style: { color: '#ff2020' } }, 'VS'), ' ASPINALL'),
        React.createElement('div', { style: { width: 100, height: 100, flex: '0 0 auto', background: '#000', borderRadius: '50%' } }, React.createElement(MobileImageSlot, { id: 'fd-aspinall', shape: 'circle', placeholder: 'Aspinall', fit: 'cover', src: 'uploads/transparent-fd-aspinall.png' }))
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-around', fontSize: 10, fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,.9)', marginBottom: 8 } },
        React.createElement('div', { style: { color: '#3d9bff' } }, 'JUL 12'), React.createElement('div', { style: { color: '#ffce54' } }, '10:00 PM ET'), React.createElement('div', { style: { color: '#2eff6e' } }, 'T-MOBILE ARENA')
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-around', marginBottom: 10 } },
        [['PRIZE POOL', '$100,000', '#2eff6e'], ['ENTRY FEE', '100 FM', '#ffce54'], ['ENTRIES', '22,450', '#3d9bff']].map(([l, v, c], i) => React.createElement('div', { key: i, style: { textAlign: 'center' } },
          React.createElement('div', { style: { fontSize: l === 'ENTRY FEE' ? 10.5 : 9.5, color: '#ff2020', fontWeight: 900, letterSpacing: .3, textShadow: '0 1px 3px rgba(0,0,0,.9), 0 0 6px rgba(255,32,32,.5)' } }, l),
          React.createElement('div', { style: { fontSize: v === '100 FM' ? 19 : 13, fontWeight: 900, color: c, textShadow: '0 2px 5px rgba(0,0,0,.8), 0 0 12px ' + c + 'cc, 0 0 20px ' + c + '80', animation: (i < 2 ? (i === 0 ? 'moneyPulse' : 'moneyPulseGold') + ' 1.8s ease-in-out infinite' : 'none') } }, v)
        ))
      ),
      React.createElement('div', {
        onClick: (e) => { e.stopPropagation(); this.openModal('aiScout'); },
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, textAlign: 'center', padding: '11px 0', borderRadius: 10, marginBottom: 8, background: 'linear-gradient(90deg,#4d8dff,#a855f7)', border: 'none', fontWeight: 900, fontSize: 12.5, color: '#fff', cursor: 'pointer', boxShadow: '0 0 16px rgba(77,141,255,.6)', animation: 'glowPulse 3s ease-in-out infinite' }
      }, '\ud83e\udd16 AI SCOUTING REPORT \u2014 NEW FOR THIS FIGHT'),
      React.createElement('div', {
        onClick: () => this.openModal('predictModal', { id: 1, tag: 'UFC 323', f1: 'JONES', f2: 'ASPINALL', prize: '$100,000' }),
        style: { textAlign: 'center', padding: '10px 0', borderRadius: 10, background: 'linear-gradient(90deg,#ef4444,#b91c1c)', fontWeight: 900, fontSize: 13, cursor: 'pointer' }
      }, 'MAKE PREDICTIONS')
      )
    );
  }

  renderFeaturedDetail(s, event) {
    if (!event) return null;
    const values = [
      ['PRIZE POOL', event.prize || 'TERMS PENDING', '#2eff6e'],
      ['ENTRY FEE', this.getEventEntryLabel(event), '#ffce54'],
      ['ENTRIES', event.entries > 0 ? event.entries.toLocaleString() : 'NONE YET', '#3d9bff'],
    ];
    return React.createElement('div', { style: { margin: '0 16px 16px', position: 'relative', overflow: 'hidden', border: '1px solid ' + event.tagColor, borderRadius: 14, padding: 12, boxShadow: '0 0 18px ' + event.tagColor + '55' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'featured-detail-live-' + event.id, shape: 'rect', placeholder: event.f1 + ' vs ' + event.f2, fit: 'cover', src: event.featuredFightBackgroundImage || event.image, fallbackSrc: event.fallbackImage })),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'rgba(5,6,10,.9)' } }),
      React.createElement('div', { style: { position: 'relative' } },
        React.createElement('div', { style: { color: '#ffce54', fontSize: 10, fontWeight: 900, marginBottom: 8 } }, 'FEATURED FIGHT · ' + (event.division ? event.division.toUpperCase() : event.tag)),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
          React.createElement('div', { style: { width: 70, height: 70, overflow: 'hidden', borderRadius: '50%', flex: '0 0 70px' } }, React.createElement(MobileImageSlot, { id: 'detail-a-' + event.id, shape: 'circle', placeholder: event.f1, fit: 'cover', src: event.featuredFightFighterAImage || event.fighterAImage, fallbackSrc: event.fallbackImage })),
          React.createElement('div', { style: { flex: 1, fontFamily: "'Anton',sans-serif", fontSize: 18, textAlign: 'center' } }, event.f1, React.createElement('span', { style: { color: '#ef4444' } }, ' VS '), event.f2),
          React.createElement('div', { style: { width: 70, height: 70, overflow: 'hidden', borderRadius: '50%', flex: '0 0 70px' } }, React.createElement(MobileImageSlot, { id: 'detail-b-' + event.id, shape: 'circle', placeholder: event.f2, fit: 'cover', src: event.featuredFightFighterBImage || event.fighterBImage, fallbackSrc: event.fallbackImage }))
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-around', color: 'rgba(255,255,255,.7)', fontSize: 9, fontWeight: 900, marginBottom: 9 } },
          React.createElement('span', null, event.date),
          React.createElement('span', null, event.matchTime || 'TIME TBA'),
          React.createElement('span', null, event.venue || 'VENUE TBA')
        ),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 } }, values.map(([label, value, color]) => React.createElement('div', { key: label, style: { textAlign: 'center', padding: 7, borderRadius: 8, background: 'rgba(255,255,255,.05)' } },
          React.createElement('small', { style: { display: 'block', color: 'rgba(255,255,255,.55)', fontSize: 7, fontWeight: 900 } }, label),
          React.createElement('strong', { style: { display: 'block', color, fontSize: 11, marginTop: 3 } }, value)
        ))),
        React.createElement('div', {
          role: 'button', tabIndex: 0, 'aria-label': `Open AI scouting report for ${event.f1} versus ${event.f2}`,
          onClick: () => this.openAiScout(event),
          style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, textAlign: 'center', padding: '10px 0', borderRadius: 10, marginBottom: 8, background: 'linear-gradient(90deg,#4d8dff,#a855f7)', fontWeight: 900, fontSize: 11.5, color: '#fff', cursor: 'pointer', boxShadow: '0 0 16px rgba(77,141,255,.5)' }
        }, 'AI SCOUTING REPORT'),
        React.createElement('div', {
          role: 'button', tabIndex: 0, 'aria-label': `${this.getEventActionLabel(event)} for ${event.f1} versus ${event.f2}`,
          onClick: () => this.openFeaturedPick(event),
          style: { textAlign: 'center', padding: '10px 0', borderRadius: 10, background: 'linear-gradient(90deg,#ef4444,#b91c1c)', fontWeight: 900, fontSize: 13, cursor: 'pointer' }
        }, this.getEventActionLabel(event, event.playable))
      )
    );
  }

  renderCommunityAndProgress(allEvents, xpPct, s) {
    const ev = allEvents[s.communityIndex % allEvents.length];
    const votes = s.eventVotes[ev.id] || { a: 50, b: 50 };
    const dashOffset = 251.2 * (1 - votes.a / 100);
    return React.createElement('div', { style: { display: 'flex', gap: 8, padding: '0 16px 16px' } },
      React.createElement('div', { style: { flex: 1.1, position: 'relative', overflow: 'hidden', border: '1px solid #ef444490', borderRadius: 12, padding: 10, boxShadow: '0 0 14px #ef444440' } },
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'community-predictions-bg', shape: 'rect', placeholder: 'Boxing match photo', fit: 'cover', src: 'uploads/pasted-1785014371576-0.png' })),
        React.createElement('div', { key: ev.id, style: { position: 'relative', animation: 'toastIn .4s ease-out' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 } },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#ffce54', textShadow: '0 1px 4px rgba(0,0,0,.8)' } }, 'COMMUNITY PREDICTIONS'),
          React.createElement('div', { style: { display: 'flex', gap: 2 } }, allEvents.map((e, i) => React.createElement('span', { key: e.id, style: { width: 4, height: 4, borderRadius: '50%', background: i === s.communityIndex ? '#f2b544' : 'rgba(255,255,255,.2)' } })))
        ),
        React.createElement('div', { style: { fontSize: 11, color: '#ffce54', fontWeight: 900, marginBottom: 6, textShadow: '0 1px 4px rgba(0,0,0,.8)' } }, ev.f1 + ' vs ' + ev.f2),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
          React.createElement('svg', { width: 60, height: 60, viewBox: '0 0 90 90' },
            React.createElement('circle', { cx: 45, cy: 45, r: 40, fill: 'none', stroke: '#3d9bff', strokeWidth: 10 }),
            React.createElement('circle', { cx: 45, cy: 45, r: 40, fill: 'none', stroke: '#ff2020', strokeWidth: 10, strokeDasharray: 251.2, strokeDashoffset: dashOffset, transform: 'rotate(-90 45 45)', style: { transition: 'stroke-dashoffset .6s ease' } })
          ),
          React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 } },
            React.createElement('div', {
              onClick: () => this.quickPick(ev, 'a'),
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 900, color: '#ff2020', cursor: 'pointer', textShadow: '0 1px 4px rgba(0,0,0,.9)' }
            }, React.createElement('span', null, ev.f1, votes.a < 50 && React.createElement('span', { style: { fontSize: 8, fontWeight: 900, color: '#ffce54', marginLeft: 5, animation: 'pulseLive 1.2s infinite' } }, '🐺 2X')), votes.a + '%'),
            React.createElement('div', {
              onClick: () => this.quickPick(ev, 'b'),
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 900, color: '#3d9bff', cursor: 'pointer', textShadow: '0 1px 4px rgba(0,0,0,.9)' }
            }, React.createElement('span', null, ev.f2, votes.b < 50 && React.createElement('span', { style: { fontSize: 8, fontWeight: 900, color: '#ffce54', marginLeft: 5, animation: 'pulseLive 1.2s infinite' } }, '🐺 2X')), votes.b + '%')
          )
        )
        )
      ),
      React.createElement('div', { style: { flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid #a855f790', borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 0 14px #a855f740' } },
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'progression-classic-bg', shape: 'rect', placeholder: 'Boxing gloves photo', fit: 'cover', src: 'uploads/pasted-1785013690779-0.png' })),
        React.createElement('div', { style: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 } },
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#a855f7' } }, 'YOUR PROGRESSION'),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
          React.createElement('div', { style: { width: 26, height: 26, clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)', background: 'linear-gradient(135deg,#c084fc,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 } }, '18'),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 10, color: '#ffce54', fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,.8)' } }, 'FIGHT IQ'),
            React.createElement('div', { style: { fontSize: 12, fontWeight: 800, color: '#c084fc' } }, '2,450 XP')
          )
        ),
        React.createElement('div', { style: { height: 5, background: 'rgba(255,255,255,.1)', borderRadius: 3, overflow: 'hidden' } },
          React.createElement('div', { style: { height: '100%', width: xpPct + '%', background: 'linear-gradient(90deg,#a855f7,#ec4899)', transition: 'width 1s ease' } })
        ),
        React.createElement('div', { style: { fontSize: 9, color: '#ffce54', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,.8)' } }, 'NEXT LEVEL: 3,000 XP'),
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#f2b544' } }, '👑 LEGEND · LEVEL 18')
        )
      )
    );
  }

  renderRewardsRow(streakDays, s) {
    return React.createElement('div', { style: { display: 'flex', gap: 8, padding: '0 16px 16px' } },
      React.createElement('div', { style: { flex: 1, background: 'radial-gradient(circle at 50% -30%, rgba(255,255,255,.18), transparent 55%), radial-gradient(ellipse 80% 60% at 15% 110%, rgba(239,68,68,.22), transparent 60%), radial-gradient(ellipse 80% 60% at 85% 110%, rgba(77,141,255,.22), transparent 60%), rgba(255,255,255,.05)', border: '1px solid #f2b54490', borderRadius: 12, padding: 10, textAlign: 'center', boxShadow: s.rewardClaimed ? '0 0 14px #f2b54440' : '0 0 20px #f2b54480, inset 0 0 16px #f2b54425' } },
        React.createElement('div', { key: s.chestBounce, style: { fontSize: 28, animation: s.chestBounce ? 'bounceChest .5s ease' : (s.rewardClaimed ? 'none' : 'chestBounceLoop 1.8s ease-in-out infinite') } }, '🎁'),
        React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.5)', margin: '4px 0' } }, 'COME BACK EVERY DAY & BUILD YOUR STREAK!'),
        React.createElement('div', {
          onClick: this.claimReward,
          style: { marginTop: 4, padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: s.rewardClaimed ? 'default' : 'pointer', background: s.rewardClaimed ? 'rgba(34,197,94,.15)' : '#f2b544', color: s.rewardClaimed ? '#22c55e' : '#2b1b00', animation: s.rewardClaimed ? 'none' : 'joinGlow 2s ease-in-out infinite' }
        }, s.rewardClaimed ? 'CLAIMED ✓' : 'CLAIM REWARD'),
        s.rewardClaimed && React.createElement('div', {
          onClick: this.unlockNextReward,
          style: { marginTop: 6, textAlign: 'center', padding: '6px 0', borderRadius: 8, fontSize: 9.5, fontWeight: 900, cursor: 'pointer', background: 'rgba(168,85,247,.15)', border: '1px solid rgba(168,85,247,.4)', color: '#c9a3ff' }
        }, '⚡ SKIP WAIT — 75 FM')
      ),
      React.createElement('div', { style: { flex: 1, background: 'radial-gradient(circle at 50% -30%, rgba(255,255,255,.18), transparent 55%), radial-gradient(ellipse 80% 60% at 15% 110%, rgba(239,68,68,.22), transparent 60%), radial-gradient(ellipse 80% 60% at 85% 110%, rgba(77,141,255,.22), transparent 60%), rgba(255,255,255,.05)', border: '1px solid #f2b54490', borderRadius: 12, padding: 10, boxShadow: '0 0 18px #f2b54460, inset 0 0 14px #f2b54420' } },
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#f2b544', marginBottom: 4 } }, 'COINS WALLET'),
        React.createElement('div', { style: { fontSize: 26, textAlign: 'center', display: 'inline-block', width: '100%', animation: 'chestBounceLoop 2.4s ease-in-out infinite', filter: 'drop-shadow(0 0 6px rgba(242,181,68,.8))' } }, '🪙'),
        React.createElement('div', { key: s.coins, style: { fontSize: 13, fontWeight: 800, textAlign: 'center', animation: 'wordmarkGlow 1.2s ease-out' } }, s.coins.toLocaleString() + ' COINS'),
        React.createElement('div', { onClick: () => this.openModal('addcoins'), style: { marginTop: 4, textAlign: 'center', padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, background: '#f2b544', color: '#2b1b00', cursor: 'pointer' } }, 'ADD COINS +')
      )
    ), React.createElement('div', { style: { display: 'flex', gap: 8, padding: '0 16px 16px' } },
      React.createElement('div', { style: { flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid #f2b54490', borderRadius: 12, padding: 10, boxShadow: '0 0 14px #f2b54440' } },
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'home-leaderboard-bg', shape: 'rect', placeholder: 'Ring corner photo', fit: 'cover', src: 'uploads/pasted-1785012542538-0.png' })),
        React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(20,10,0,.55),rgba(20,10,0,.8))' } }),
        React.createElement('div', { style: { position: 'relative' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#f2b544' } }, 'LEADERBOARD'),
          React.createElement('div', { onClick: () => this.setTab('leaderboard'), style: { fontSize: 10, color: '#4d8dff', fontWeight: 700, cursor: 'pointer' } }, 'VIEW ALL ›')
        ),
        [1, 2, 3].map(r => React.createElement('div', { key: r, style: { display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, padding: '2px 0', color: 'rgba(255,255,255,.75)' } },
          React.createElement('span', null, r + '. ' + ['FightIQ_King', 'KO_Beast', 'Prediction_Prof'][r - 1]),
          React.createElement('span', { style: { color: '#f2b544' } }, [4850, 4320, 3915][r - 1])
        )),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, padding: '3px 0', marginTop: 2, borderTop: '1px solid rgba(255,255,255,.1)', color: '#22c55e' } },
          React.createElement('span', null, '18. KellyD (You)'), React.createElement('span', null, '2,450 ↑')
        )
        )
      ),
      React.createElement('div', { style: { flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid #ef444490', borderRadius: 12, padding: 10, boxShadow: '0 0 14px #ef444440' } },
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'streak-bonus-bg', shape: 'rect', placeholder: 'Kickboxing photo', fit: 'cover', src: 'uploads/pasted-1785014166827-0.png' })),
        React.createElement('div', { style: { position: 'relative' } },
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#f2b544', marginBottom: 6 } }, 'STREAK BONUS'),
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, marginBottom: 6 } }, '🔥 7 DAY STREAK'),
        React.createElement('div', { style: { display: 'flex', gap: 3, marginBottom: 6 } },
          streakDays.map(d => React.createElement('div', {
            key: d.d, style: {
              flex: 1, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8,
              background: d.done ? '#22c55e' : 'rgba(255,255,255,.08)', animation: d.current ? 'pulseLive 1.4s infinite' : 'none'
            }
          }, d.done ? '✓' : ''))
        ),
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: '#f2b544', animation: 'moneyPulseGold 1.8s ease-in-out infinite' } }, '+250 FM'),
        !s.rewardClaimed && React.createElement('div', {
          style: { fontSize: 8.5, fontWeight: 900, marginTop: 6, color: s.streakExpiresIn < 3600 ? '#ff2020' : '#ffce54', textShadow: '0 1px 4px rgba(0,0,0,.8)', animation: s.streakExpiresIn < 3600 ? 'pulseLive 1s infinite' : 'none' }
        }, '⏳ Streak expires in ' + Math.floor(s.streakExpiresIn / 3600) + 'h ' + Math.floor((s.streakExpiresIn % 3600) / 60) + 'm'),
        s.streakExpiresIn < 3600 && s.streakExpiresIn > 0 && React.createElement('div', {
          onClick: this.saveStreak,
          style: { marginTop: 6, textAlign: 'center', padding: '6px 0', borderRadius: 8, fontSize: 9.5, fontWeight: 900, cursor: 'pointer', background: '#ef4444', color: '#fff', animation: 'joinGlow 1.4s ease-in-out infinite' }
        }, `💾 SAVE STREAK — ${s.isSubscribed ? 25 : 50} FM`)
        )
      )
    );
  }

  renderApparel(apparel, s) {
    return React.createElement('div', { style: { padding: '0 16px 16px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
        React.createElement('div', { style: { fontSize: 12, fontWeight: 800, letterSpacing: 1, color: 'rgba(255,255,255,.7)' } }, 'APPAREL'),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' } },
          React.createElement('div', { onClick: () => this.props.onOpenApparel?.(), role: 'button', tabIndex: 0, style: { fontSize: 10, color: '#4d8dff', fontWeight: 700, cursor: 'pointer' } }, 'VIEW ALL'),
          React.createElement('a', { href: 'https://www.etsy.com/shop/FANTASYMMADNESS', target: '_blank', rel: 'noopener noreferrer', style: { fontSize: 10, color: '#f2b544', fontWeight: 800, cursor: 'pointer', textDecoration: 'none' } }, 'SHOP ON ETSY ›')
        )
      ),
      React.createElement('div', { style: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 } },
        apparel.map(a => React.createElement('div', {
          key: a.id || a.slot, onClick: () => this.props.onOpenApparel?.(a),
          style: { flex: '0 0 110px', cursor: 'pointer' }
        },
          React.createElement('div', { style: { height: 90, marginBottom: 4, position: 'relative', borderRadius: 10, overflow: 'hidden' } },
            (() => { const sources = Array.isArray(a.images) && a.images.length ? a.images : [a.fallbackImage]; const ids = sources.map((_, i) => a.slot + '-' + i); const activeId = this.pickCycleId(ids, s);
              return ids.map((id, i) => React.createElement('div', {
                key: id, style: { position: 'absolute', inset: 0, opacity: id === activeId ? 1 : 0, transition: 'opacity 1s ease', pointerEvents: id === activeId ? 'auto' : 'none' }
              }, React.createElement(MobileImageSlot, { id, shape: 'rounded', radius: '10', placeholder: a.name + ' #' + (i + 1), fit: 'cover', src: sources[i], fallbackSrc: a.fallbackImage })));
            })()
          ),
          React.createElement('div', { style: { fontSize: 9, fontWeight: 700 } }, a.name),
          React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#f2b544', animation: 'moneyPulseGold 1.8s ease-in-out infinite' } }, a.price)
        ))
      )
    );
  }

  renderCart(s) {
    const subtotal = s.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const baseCoins = s.cart.reduce((total, item) => total + item.coins * item.quantity, 0);
    const firstPurchaseEligible = this.props.currentUser?.hasReceivedFirstPurchaseBonus !== true;
    const bonusCoins = firstPurchaseEligible ? baseCoins : 0;
    const creditedCoins = baseCoins + bonusCoins;
    return React.createElement('div', { style: { padding: '8px 16px 24px' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 } },
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, color: '#f2b544' } }, '🪙 FM COIN CHECKOUT'),
        React.createElement('div', { onClick: () => this.setTab('home'), style: { color: '#4d8dff', fontSize: 10, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' } }, 'CONTINUE SHOPPING')
      ),
      React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.48)', marginBottom: 16 } },
        s.cart.length ? `${creditedCoins.toLocaleString()} FM coins · secure encrypted checkout` : 'No coin packs selected yet'
      ),
      !s.cart.length && React.createElement('section', { style: { padding: '28px 16px', textAlign: 'center', borderRadius: 14, border: '1px dashed rgba(242,181,68,.35)', background: 'rgba(242,181,68,.06)' } },
        React.createElement('div', { style: { fontSize: 34, marginBottom: 8 } }, '🛒'),
        React.createElement('strong', { style: { display: 'block', fontSize: 13, marginBottom: 5 } }, 'YOUR CART IS EMPTY'),
        React.createElement('div', { style: { color: 'rgba(255,255,255,.55)', fontSize: 10, marginBottom: 15 } }, 'Choose a coin pack to top up your fight wallet.'),
        React.createElement('div', { role: 'button', tabIndex: 0, onClick: () => this.openModal('addcoins'), style: { display: 'inline-flex', alignItems: 'center', minHeight: 42, borderRadius: 999, padding: '0 20px', background: 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 900, cursor: 'pointer' } }, 'CHOOSE A COIN PACK')
      ),
      s.cart.map((item) => React.createElement('article', { key: item.sku, style: { display: 'grid', gridTemplateColumns: '52px minmax(0,1fr) auto', gap: 11, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.08)' } },
        React.createElement('div', { style: { width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#ffe08a,#a8720f)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900, color: '#3a2500' } }, 'FM'),
        React.createElement('div', { style: { minWidth: 0 } },
          React.createElement('strong', { style: { display: 'block', fontSize: 12 } }, `${item.coins.toLocaleString()} FM COIN PACK`),
          React.createElement('small', { style: { display: 'block', color: 'rgba(255,255,255,.48)', marginTop: 2 } }, `${(item.coins * item.quantity).toLocaleString()} FM coins`),
          React.createElement('b', { style: { display: 'block', color: '#f2b544', fontSize: 12, marginTop: 2 } }, `$${(item.price * item.quantity).toFixed(2)}`),
          React.createElement('span', { role: 'button', tabIndex: 0, onClick: () => this.removeCartItem(item.sku), style: { display: 'inline-block', marginTop: 4, color: 'rgba(255,255,255,.45)', fontSize: 9, textDecoration: 'underline', cursor: 'pointer' } }, 'Remove')
        ),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 7, border: '1px solid rgba(255,255,255,.18)', borderRadius: 999, padding: '4px 7px' } },
          React.createElement('span', { role: 'button', tabIndex: 0, 'aria-label': `Decrease ${item.coins} FM pack quantity`, onClick: () => this.changeCartQuantity(item.sku, -1), style: { width: 24, height: 24, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, cursor: 'pointer' } }, '−'),
          React.createElement('span', { style: { minWidth: 14, textAlign: 'center', fontSize: 12, fontWeight: 900 } }, item.quantity),
          React.createElement('span', { role: 'button', tabIndex: 0, 'aria-label': `Increase ${item.coins} FM pack quantity`, onClick: () => this.changeCartQuantity(item.sku, 1), style: { width: 24, height: 24, display: 'grid', placeItems: 'center', color: '#f2b544', fontWeight: 900, cursor: 'pointer' } }, '+')
        )
      )),
      s.cart.length > 0 && React.createElement(React.Fragment, null,
        React.createElement('section', { style: { marginTop: 16, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' } },
          React.createElement('strong', { style: { display: 'block', fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,.55)', marginBottom: 8 } }, 'ORDER SUMMARY'),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', color: 'rgba(255,255,255,.72)', fontSize: 12 } }, React.createElement('span', null, 'Subtotal'), React.createElement('b', null, `$${subtotal.toFixed(2)}`)),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', color: 'rgba(255,255,255,.72)', fontSize: 12 } }, React.createElement('span', null, 'Coin pack'), React.createElement('b', null, `${baseCoins.toLocaleString()} FM`)),
          firstPurchaseEligible && React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', color: '#22c55e', fontSize: 12, fontWeight: 900 } }, React.createElement('span', null, '🎁 First-purchase bonus'), React.createElement('b', null, `+${bonusCoins.toLocaleString()} FM`)),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', color: '#fff', fontSize: 12, fontWeight: 900 } }, React.createElement('span', null, 'FM coins credited'), React.createElement('b', null, `${creditedCoins.toLocaleString()} FM`)),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 10, marginTop: 6, borderTop: '1px solid rgba(255,255,255,.14)', color: '#f2b544', fontSize: 16, fontWeight: 900 } }, React.createElement('span', null, 'Total'), React.createElement('b', null, `$${subtotal.toFixed(2)}`)),
          React.createElement('small', { style: { display: 'block', marginTop: 8, color: 'rgba(255,255,255,.46)', lineHeight: 1.45 } }, 'Digital purchase — no shipping required. Final eligibility is confirmed securely before coins are credited.')
        ),
        React.createElement('div', { role: 'button', tabIndex: 0, onClick: this.continueCartCheckout, style: { width: '100%', minHeight: 50, display: 'grid', placeItems: 'center', marginTop: 16, borderRadius: 999, background: 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 1000, fontSize: 13, cursor: 'pointer' } }, `CHECKOUT $${subtotal.toFixed(2)} · GET ${creditedCoins.toLocaleString()} FM`),
        React.createElement('div', { style: { textAlign: 'center', marginTop: 9, color: 'rgba(255,255,255,.45)', fontSize: 9.5 } }, '🔒 Billing and card details continue on the secure payment flow')
      )
    );
  }

  renderBlogsPage(blogs) {
    return React.createElement('div', { style: { padding: '8px 16px' } },
      React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, marginBottom: 4, color: '#4d8dff' } }, '📰 BLOGS & FIGHT NEWS'),
      React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 14 } }, 'All the latest fight breakdowns, matchup previews, and app news'),
      React.createElement('div', null,
        blogs.map(b => React.createElement('div', {
          key: b.id, onClick: () => this.openModal('blog', b),
          style: { padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.08)', cursor: 'pointer' }
        },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 800, lineHeight: 1.3, marginBottom: 4 } }, b.title),
          React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.45)' } }, 'Read more →')
        ))
      ),
      React.createElement('div', {
        onClick: () => this.openModal('addcoins'),
        style: { position: 'relative', width: 110, height: 110, margin: '20px auto 0', cursor: 'pointer' }
      },
        React.createElement('img', { src: `${ASSET_BASE}/chest-transparent.png`, style: { width: '100%', height: '100%', objectFit: 'contain', animation: 'chestBubbleFloat 2.4s ease-in-out infinite', filter: 'drop-shadow(0 0 16px rgba(242,181,68,.7))' } }),
        ['💰', '🪙', '💰'].map((c, i) => React.createElement('div', {
          key: i, style: { position: 'absolute', left: '50%', top: '30%', fontSize: 18, animation: 'coinFly' + (i + 1) + ' 1.6s ease-out ' + (i * 0.35) + 's infinite' }
        }, c))
      )
    );
  }

  renderBlogsAndAffiliate(s) {
    return React.createElement('div', { style: { padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 } },
      React.createElement('div', {
        style: { position: 'relative', height: 130, overflow: 'hidden', background: '#000', border: '2px solid #000', borderRadius: 14, boxShadow: '0 0 22px rgba(77,141,255,.55)', animation: 'ribbonGlow 2.4s ease-in-out infinite' }
      },
        React.createElement('div', { style: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' } },
          React.createElement('div', { style: { width: '58%', height: '85%' } },
            React.createElement(MobileImageSlot, { id: 'affiliate-handshake', shape: 'rect', placeholder: 'Handshake photo — partnership', fit: 'contain', src: 'uploads/handshake-transparent.png' })
          )
        ),
        React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 35%,rgba(5,6,10,.92))', pointerEvents: 'none' } }),
        React.createElement('div', { style: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 } },
          React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: '#ff9d2f', letterSpacing: 1, marginBottom: 2, textShadow: '0 1px 4px rgba(0,0,0,.9)' } }, '🤝 AFFILIATES & CREATORS'),
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#ffe93b', marginBottom: 2, textShadow: '0 0 14px rgba(255,233,59,.8), 0 2px 4px rgba(0,0,0,.9)' } }, "YOU'RE THE PROMOTER NOW"),
          React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#ffe93b', marginBottom: 8, textShadow: '0 1px 4px rgba(0,0,0,.9)' } }, 'Promote fights. Build a league. Get players moving.'),
          React.createElement('div', { onClick: () => this.openModal('affiliate'), style: { display: 'inline-block', padding: '9px 18px', borderRadius: 999, background: 'linear-gradient(90deg,#4d8dff,#a855f7)', fontSize: 11, fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 14px rgba(77,141,255,.7)' } }, 'BECOME A PARTNER →')
        )
      ),
      React.createElement('div', {
        onClick: this.chestClick,
        style: { position: 'relative', width: 130, height: 130, margin: '0 auto', cursor: 'pointer', borderRadius: '50%', background: '#000' }
      },
        React.createElement('div', { style: { position: 'absolute', inset: '10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(242,181,68,.55), transparent 70%)', animation: 'chestGlowBreathe 2.2s ease-in-out infinite', pointerEvents: 'none' } }),
        [0, 1].map(i => React.createElement('div', {
          key: 'ring' + i, style: {
            position: 'absolute', inset: '18%', borderRadius: '50%', border: '2px solid rgba(242,181,68,.6)',
            animation: 'chestRingPulse 2.4s ease-out ' + (i * 1.2) + 's infinite', pointerEvents: 'none'
          }
        })),
        React.createElement('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '50%', pointerEvents: 'none' } },
          React.createElement('div', { style: { position: 'absolute', top: '-30%', left: 0, width: '30%', height: '160%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)', animation: 'chestShine 2.6s ease-in-out infinite' } })
        ),
        React.createElement('img', { src: `${ASSET_BASE}/chest-transparent.png`, style: { width: '100%', height: '100%', objectFit: 'contain', animation: s.chestBurst ? 'chestBurstPop .5s ease-out' : 'chestBubbleFloat 2.4s ease-in-out infinite, chestSparkle 1.8s ease-in-out infinite', filter: 'drop-shadow(0 0 16px rgba(242,181,68,.7))' } }),
        ['💰', '🪙', '💰'].map((c, i) => React.createElement('div', {
          key: i, style: { position: 'absolute', left: '50%', top: '10%', fontSize: 20, animation: 'coinFly' + (i + 1) + ' 1.6s ease-out ' + (i * 0.35) + 's infinite' }
        }, c)),
        s.chestBurst && [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const angle = (i / 8) * Math.PI * 2;
          const dist = 70;
          return React.createElement('div', {
            key: 'burst' + i, style: {
              position: 'absolute', left: '50%', top: '50%', fontSize: 20,
              '--burstEnd': 'translate(' + Math.round(Math.cos(angle) * dist) + 'px,' + Math.round(Math.sin(angle) * dist) + 'px)',
              animation: 'chestBurstCoin .55s ease-out forwards'
            }
          }, i % 2 === 0 ? '🪙' : '💰');
        }),
        [[18, 22], [70, 15], [42, 55], [78, 62], [30, 78], [58, 30]].map(([left, top], i) => React.createElement('div', {
          key: 'sparkle' + i, style: {
            position: 'absolute', left: left + '%', top: top + '%', width: 5, height: 5, borderRadius: '50%',
            background: '#fff8dc', boxShadow: '0 0 6px 2px #ffe9a8, 0 0 10px 3px rgba(242,181,68,.8)',
            animation: 'glisten ' + (1.2 + (i % 3) * 0.4) + 's ease-in-out ' + (i * 0.28) + 's infinite'
          }
        }))
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: 14 } },
        [
          ['X', '#000', 'M18.9 3H22l-7.5 8.6L23 21h-6.9l-5.4-6.4L4.4 21H1.3l8-9.2L1 3h7l4.9 5.8L18.9 3z'],
          ['Instagram', '#dd2a7b', 'M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5.5A4.5 4.5 0 1016.5 12 4.5 4.5 0 0012 7.5zm0 2A2.5 2.5 0 119.5 12 2.5 2.5 0 0112 9.5zM17.75 6a1 1 0 11-1 1 1 1 0 011-1z'],
          ['Facebook', '#1877f2', 'M13 22v-9h3l.5-4H13V6.5c0-1.15.3-1.9 2-1.9h2V1.1C16.6 1 15.4.9 14 .9c-2.9 0-4.9 1.8-4.9 5V9H6v4h3v9h4z'],
          ['TikTok', '#25f4ee', 'M16 2h3.2a5.6 5.6 0 004 3.9v3.3a8.9 8.9 0 01-4-1v6.9a6.9 6.9 0 11-6.9-6.9c.3 0 .6 0 .9.1v3.4a3.5 3.5 0 103.5 3.5V2z'],
        ].map(([name, color, path]) => React.createElement('div', {
          key: name, onClick: () => this.shareToSocial(name), title: 'Follow us on ' + name,
          style: { width: 40, height: 40, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 10px ' + color + '80' }
        }, React.createElement('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: '#fff' }, React.createElement('path', { d: path })))
        )
      )
    );
  }

  renderContests(sports, filteredEvents, s) {
    return React.createElement('div', { style: { padding: '8px 16px' } },
      React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, marginBottom: 12, color: '#f2b544' } }, 'ALL CONTESTS'),
      this.renderSportSelector(sports, s),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 } },
        filteredEvents.length === 0 ? React.createElement('section', { style: { padding: 22, borderRadius: 14, border: '1px solid rgba(77,141,255,.35)', background: 'rgba(77,141,255,.08)', textAlign: 'center', color: 'rgba(255,255,255,.65)', fontSize: 12 } }, 'No published contests match this sport yet.') : filteredEvents.map(ev => React.createElement('div', {
          key: ev.id, style: { background: 'rgba(255,255,255,.05)', border: '1px solid ' + ev.tagColor, borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 16px ' + ev.tagColor + '55, inset 0 0 12px ' + ev.tagColor + '20' }
        },
          React.createElement('div', { style: { height: 170, position: 'relative', background: '#000' } },
            React.createElement(MobileImageSlot, { id: 'event-poster-' + ev.id, shape: 'rect', placeholder: ev.f1 + ' vs ' + ev.f2 + ' poster', fit: 'cover', src: ev.image, fallbackSrc: ev.fallbackImage }),
            React.createElement('div', { style: { position: 'absolute', top: 8, left: 8, background: ev.tagColor, color: '#fff', fontSize: 9, fontWeight: 900, padding: '4px 8px', borderRadius: 6 } }, ev.tag)
          ),
          React.createElement('div', { style: { padding: 12 } },
            React.createElement('div', { style: { fontSize: 16, fontWeight: 900, marginBottom: 4 } }, ev.f1, React.createElement('span', { style: { color: '#ef4444' } }, ' VS '), ev.f2),
            React.createElement('div', { style: { fontSize: 11, color: 'rgba(255,255,255,.55)', fontWeight: 700, marginBottom: 4 } }, ev.date, ' · ', ev.countdown, ev.prize ? React.createElement(React.Fragment, null, ' · ', React.createElement('span', { style: { color: '#22c55e', animation: 'moneyPulse 1.8s ease-in-out infinite' } }, ev.prize)) : null),
            React.createElement('div', { style: { fontSize: 10, fontWeight: 800, marginBottom: 8 } },
              React.createElement('span', { style: { color: '#ffce54', animation: 'ptsTwinkle 1.6s ease-in-out infinite' } }, this.getEventEntryLabel(ev) + ' ENTRY'), ' · ',
              React.createElement('span', { style: { color: '#ff4d6d', animation: 'ptsTwinkle 1.6s ease-in-out infinite' } }, ev.entries > 0 ? ev.entries.toLocaleString() + ' ENTRIES' : 'NO ENTRIES YET')
            ),
            React.createElement('div', {
              role: 'button', tabIndex: 0,
              onClick: () => this.openEvent(ev),
              style: { textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', background: ev.entered ? 'rgba(34,197,94,.15)' : ev.tagColor, color: ev.entered ? '#22c55e' : '#fff' }
            }, ev.entered ? 'ENTERED ✓' : this.getEventActionLabel(ev, ev.playable))
          )
        ))
      )
    );
  }

  renderLeaderboardLegacy(list) {
    const hallOfFame = [
      { name: 'FightIQ_King', title: 'UFC 322 League Champion', earnings: '$4,200', record: '38-9', slot: 'hof-1' },
      { name: 'KO_Beast', title: 'Bare Knuckle Invitational Winner', earnings: '$2,850', record: '29-11', slot: 'hof-2' },
      { name: 'Prediction_Prof', title: 'Season 4 Grand Champion', earnings: '$3,600', record: '41-14', slot: 'hof-3' },
    ];
    return React.createElement('div', { style: { padding: '8px 16px', position: 'relative', overflow: 'hidden' } },
      React.createElement('div', { style: { position: 'relative' } },
      React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, marginBottom: 4, color: '#f2b544' } }, 'LEADERBOARD'),
      React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.55)', letterSpacing: 1, margin: '14px 0 8px' } }, '🏆 HALL OF FAME — PAST CHAMPIONS'),
      React.createElement('div', { style: { display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 18 } },
        hallOfFame.map(champ => React.createElement('div', {
          key: champ.name, onClick: () => this.showToast('Opening ' + champ.name + '\'s profile...'),
          style: { flex: '0 0 150px', background: 'linear-gradient(160deg,rgba(242,181,68,.14),rgba(255,255,255,.03))', border: '1px solid rgba(242,181,68,.5)', borderRadius: 14, padding: 12, cursor: 'pointer', boxShadow: '0 0 18px rgba(242,181,68,.35)', textAlign: 'center' }
        },
          React.createElement('div', { style: { width: 54, height: 54, margin: '0 auto 6px', position: 'relative' } },
            React.createElement(MobileImageSlot, { id: champ.slot, shape: 'circle', placeholder: champ.name, fit: 'cover' }),
            React.createElement('div', { style: { position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 40, height: 14, borderRadius: 4, background: 'linear-gradient(90deg,#a8720f,#f2b544,#ffe9a8,#f2b544,#a8720f)', border: '1px solid #7a4e08', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
              React.createElement('div', { style: { width: 8, height: 8, borderRadius: '50%', background: '#7a4e08' } })
            )
          ),
          React.createElement('div', { style: { fontWeight: 900, fontSize: 12, marginTop: 6 } }, champ.name),
          React.createElement('div', { style: { fontSize: 8.5, fontWeight: 700, color: '#f2c869', marginBottom: 6, lineHeight: 1.3 } }, champ.title),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 800 } },
            React.createElement('span', { style: { color: '#22c55e' } }, champ.earnings),
            React.createElement('span', { style: { color: 'rgba(255,255,255,.5)' } }, champ.record)
          )
        ))
      ),
      React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.55)', letterSpacing: 1, marginBottom: 8 } }, 'CURRENT SEASON'),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
        list.map(u => React.createElement('div', {
          key: u.rank, style: {
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
            background: u.you ? 'rgba(242,181,68,.12)' : 'rgba(255,255,255,.04)',
            border: u.you ? '1px solid rgba(242,181,68,.4)' : '1px solid rgba(255,255,255,.06)'
          }
        },
          React.createElement('div', { style: { width: 26, textAlign: 'center', fontWeight: 900, color: u.medal || (u.you ? '#f2b544' : '#fff') } }, u.rank),
          React.createElement('div', { style: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#333,#111)' } }),
          React.createElement('div', { style: { flex: 1, fontWeight: 700, fontSize: 13 } }, u.name),
          React.createElement('div', { style: { fontWeight: 800, color: '#f2b544', fontSize: 13, animation: 'ptsTwinkle 2s ease-in-out infinite' } }, u.pts, ' PTS')
        ))
      )
      )
    );
  }

  scoutingNote(name) {
    const notes = {
      JONES: 'Elite reach & takedown defense — historically slow starters, dangerous in later rounds.',
      ASPINALL: 'Explosive finisher, but limited championship-rounds experience — durability is the question.',
      'SPENCE JR.': 'Textbook boxing IQ, methodical pressure — rarely finishes early.',
      TSZYU: 'Heavy hands, fades if fight goes past round 8.',
      ALVES: 'Relentless forward pressure, thrives in chaotic exchanges.',
      WARD: 'Sharp counter-striker, wins on output over 5.',
      MJF: 'Master of pacing a match, saves big spots for the finish.',
      'ADAM COLE': 'High-risk aerial game — leaves openings late in longer matches.',
      SUPERLEK: 'Elite clinch/knee game, historically dominant in decisions.',
      TAKERU: 'Fast starter, knockout power in every exchange.',
      ALLAZOV: 'Heavy leg kicks, wears opponents down by round 3.',
      PETROSYAN: 'Technical boxing specialist, elite counter-puncher.',
    };
    return notes[name] || 'Solid all-around record — no major weaknesses on the scouting report.';
  }

  renderLeaderboard(list) {
    const rows = Array.isArray(list) ? list : [];
    const podium = rows.slice(0, 3);
    return React.createElement('div', { style: { padding: '8px 16px 24px', position: 'relative', minHeight: '100%', overflow: 'hidden' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'leaderboard-live-bg', shape: 'rect', placeholder: 'Leaderboard arena', fit: 'cover', src: 'uploads/pasted-1785012542538-0.png' })),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,6,10,.84),rgba(5,6,10,.99))' } }),
      React.createElement('div', { style: { position: 'relative' } },
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 24, marginBottom: 4, color: '#f2b544' } }, 'GLOBAL LEADERBOARD'),
        React.createElement('div', { style: { color: 'rgba(255,255,255,.55)', fontSize: 10, fontWeight: 700, marginBottom: 14 } }, 'Official scores from submitted Fantasy MMAdness fight cards.'),
        rows.length === 0
          ? React.createElement('section', { style: { padding: 26, borderRadius: 14, border: '1px solid rgba(242,181,68,.4)', background: 'rgba(242,181,68,.08)', textAlign: 'center' } },
              React.createElement('strong', { style: { display: 'block', color: '#f2b544', fontSize: 15 } }, 'STANDINGS OPEN AFTER THE FIRST SCORE'),
              React.createElement('p', { style: { color: 'rgba(255,255,255,.6)', fontSize: 11, lineHeight: 1.5 } }, 'No ranked players have an official score yet. Submitted results will publish here automatically.'),
              React.createElement('div', { onClick: () => this.setTab('contests'), style: { display: 'inline-block', marginTop: 5, padding: '9px 15px', borderRadius: 8, background: '#f2b544', color: '#2b1b00', fontSize: 11, fontWeight: 900, cursor: 'pointer' } }, 'OPEN CONTESTS')
            )
          : React.createElement(React.Fragment, null,
              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 14 } }, podium.map((player, index) => React.createElement('div', { key: `${player.rank}-${player.name}`, onClick: () => this.openModal('champProfile', player), style: { textAlign: 'center', padding: '12px 5px', borderRadius: 12, border: '1px solid rgba(242,181,68,.35)', background: 'rgba(242,181,68,.08)', cursor: 'pointer' } },
                React.createElement('div', { style: { color: index === 0 ? '#f2b544' : 'rgba(255,255,255,.65)', fontWeight: 900, fontSize: 10 } }, '#' + player.rank),
                React.createElement('strong', { style: { display: 'block', margin: '5px 0 2px', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' } }, player.name),
                React.createElement('span', { style: { color: '#f2b544', fontSize: 10, fontWeight: 900 } }, player.pts + ' PTS')
              ))),
              React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } }, rows.map((player) => React.createElement('div', { key: `${player.rank}-${player.name}`, onClick: () => this.openModal('champProfile', player), style: { display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, background: player.you ? 'rgba(242,181,68,.14)' : 'rgba(255,255,255,.05)', border: player.you ? '1px solid rgba(242,181,68,.45)' : '1px solid rgba(255,255,255,.08)', cursor: 'pointer' } },
                React.createElement('strong', { style: { width: 28, color: player.medal || '#fff', textAlign: 'center' } }, '#' + player.rank),
                React.createElement('span', { style: { flex: 1, fontSize: 13, fontWeight: 800 } }, player.name),
                React.createElement('b', { style: { color: '#f2b544', fontSize: 12 } }, player.pts + ' PTS')
              )))
            )
      )
    );
  }

  renderPredict(events, s) {
    return React.createElement('div', { style: { padding: '8px 16px' } },
      React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, marginBottom: 4, color: '#f2b544' } }, 'MAKE PREDICTIONS'),
      React.createElement('div', { style: { fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 12 } }, 'Open the registered fight’s real scorecard. Values start at zero until you enter them.'),
      events.length === 0 && React.createElement('div', { style: { padding: 18, textAlign: 'center', borderRadius: 12, border: '1px solid rgba(242,181,68,.3)', color: 'rgba(255,255,255,.6)' } }, 'No published scorecards are open right now.'),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        events.map(ev => React.createElement('div', {
          key: ev.id, style: { background: 'rgba(255,255,255,.05)', border: '1px solid ' + ev.tagColor, borderRadius: 12, padding: 12, boxShadow: '0 0 14px ' + ev.tagColor + '55' }
        },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: ev.tagColor, marginBottom: 6 } }, ev.tag, ' · ', ev.date),
          React.createElement('div', { style: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '6px 8px', marginBottom: 8 } },
            React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#fff', marginBottom: 4 } }, ev.f1, React.createElement('span', { style: { color: '#ef4444' } }, ' VS '), ev.f2),
            React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.7)', lineHeight: 1.5 } }, `${ev.venue || 'Venue TBA'} · ${ev.maxRounds > 0 ? `${ev.maxRounds} rounds` : 'Rounds TBA'} · ${ev.prize || 'Prize terms pending'} · ${this.getEventEntryLabel(ev)}`)
          ),
          React.createElement('div', {
            role: 'button', tabIndex: 0,
            onClick: () => this.openEvent(ev),
            style: { textAlign: 'center', padding: '12px 0', borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer', background: ev.tagColor, color: '#fff' }
          }, this.getEventActionLabel(ev, ev.playable))
        ))
      )
    );
  }

  renderProfile(coinsFmt, streakDays, xpPct) {
    const menu = ['Edit Profile', 'Payment Methods', 'Support', 'Log Out'];
    return React.createElement('div', { style: { padding: '8px 16px' } },
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 16 } },
        React.createElement('div', { style: { width: 72, height: 72, borderRadius: '50%' } }, React.createElement(MobileImageSlot, { id: 'avatar', shape: 'circle', placeholder: 'Photo', fit: 'cover' })),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 20 } }, 'KellyD'),
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: '#f2b544' } }, '👑 LEGEND · LEVEL 18')
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 } },
        [['CONTESTS ENTERED', '47'], ['WIN RATE', '62%'], ['FM COINS', coinsFmt], ['CURRENT STREAK', '5 DAYS']].map(([l, v], i) => React.createElement('div', {
          key: i, style: { background: 'radial-gradient(circle at 50% -30%, rgba(255,255,255,.18), transparent 55%), radial-gradient(ellipse 80% 60% at 15% 110%, rgba(239,68,68,.22), transparent 60%), radial-gradient(ellipse 80% 60% at 85% 110%, rgba(77,141,255,.22), transparent 60%), rgba(255,255,255,.05)', border: '1px solid #f2b54480', borderRadius: 12, padding: 12, textAlign: 'center', boxShadow: '0 0 12px #f2b54435' }
        },
          React.createElement('div', { style: { fontSize: 16, fontWeight: 800, color: '#f2b544', animation: i === 2 ? 'moneyPulseGold 1.8s ease-in-out infinite' : 'none' } }, v),
          React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.5)' } }, l)
        ))
      ),
      React.createElement('div', { style: { marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 4 } }, 'FIGHT IQ · 2,450 / 3,000 XP'),
        React.createElement('div', { style: { height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 3, overflow: 'hidden' } },
          React.createElement('div', { style: { height: '100%', width: xpPct + '%', background: 'linear-gradient(90deg,#a855f7,#ec4899)' } })
        )
      ),
      React.createElement('div', {
        onClick: () => this.openModal('receipt'),
        style: { textAlign: 'center', padding: '12px 0', borderRadius: 10, marginBottom: 16, background: 'linear-gradient(90deg,#a855f7,#ec4899)', fontWeight: 900, fontSize: 12, cursor: 'pointer', boxShadow: '0 0 14px rgba(168,85,247,.5)' }
      }, '📄 SHARE MY FIGHT IQ RECEIPT'),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
        React.createElement('div', {
          key: 'settings', onClick: () => this.setTab('settings'),
          style: { padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(242,181,68,.3)', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#f2b544' }
        }, '⚙ Settings'),
        menu.map(m => React.createElement('div', {
          key: m, onClick: () => this.showToast(m === 'Log Out' ? 'Logged out (demo)' : m + ' — coming soon'),
          style: { padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: m === 'Log Out' ? '#ef4444' : '#fff' }
        }, m))
      )
    );
  }

  renderModal(s, events, jonesPct, aspinallPct) {
    if (!s.modal) return null;
    const overlay = (children, opts) => React.createElement('div', {
      onClick: this.closeModal,
      style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 900, display: 'flex', alignItems: (opts && opts.top) ? 'flex-start' : 'flex-end', justifyContent: 'center' }
    },
      React.createElement('div', {
        onClick: (e) => e.stopPropagation(),
        style: { width: '100%', maxHeight: '80%', overflowY: 'auto', background: '#12141b', borderRadius: (opts && opts.top) ? '0 0 18px 18px' : '18px 18px 0 0', padding: 18, border: '1px solid rgba(255,255,255,.1)' }
      }, children)
    );
    const closeBtn = React.createElement('div', { onClick: this.closeModal, style: { position: 'absolute', top: 10, right: 14, fontSize: 20, color: 'rgba(255,255,255,.5)', cursor: 'pointer' } }, '×');

    if (s.modal === 'menu') return overlay([
      closeBtn,
      React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, marginBottom: 12, color: '#f2b544' } }, 'MENU'),
      ...['home', 'contests', 'predict', 'leaderboard', 'profile', 'watch', 'leagues'].map(id => React.createElement('div', {
        key: id, onClick: () => this.setTab(id),
        style: { padding: '12px 4px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', color: (id === 'watch' || id === 'leagues') ? '#f2b544' : '#fff' }
      }, ({ home: 'Home', contests: 'Contests', predict: 'Make Predictions', leaderboard: 'Leaderboard', profile: 'Profile', watch: '🔴 Live Watch Party', leagues: '⚔ Leagues & Head-to-Head' })[id])),
      React.createElement('div', {
        key: 'blogs-link', onClick: () => this.setTab('blogs'),
        style: { padding: '12px 4px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', color: '#4d8dff' }
      }, '📰 Blogs & Fight News'),
      React.createElement('div', {
        key: 'settings-link', onClick: () => this.setTab('settings'),
        style: { padding: '12px 4px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', color: '#f2b544' }
      }, '⚙ Settings'),
      React.createElement('div', {
        key: 'demo-link', onClick: () => this.setTab('demo'),
        style: { padding: '12px 4px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', color: '#22c55e' }
      }, '🎓 Free Demo Mode'),
      ...['Rules', 'Support'].map(t => React.createElement('div', {
        key: t, onClick: () => this.showToast(t + ' — coming soon'),
        style: { padding: '12px 4px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', color: 'rgba(255,255,255,.7)' }
      }, t))
    ]);

    if (s.modal === 'notif') return overlay([
      closeBtn,
      React.createElement('div', { key: 't', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#f2b544' } }, 'NOTIFICATIONS'),
        React.createElement('div', { onClick: this.markNotifsRead, style: { fontSize: 11, color: '#4d8dff', fontWeight: 700, cursor: 'pointer' } }, 'Mark all read')
      ),
      ...[
        ['🥊', 'UFC 323 predictions lock in 2 days'],
        ['🏆', 'You climbed to rank 18 on the leaderboard'],
        ['🎁', 'Daily reward is ready to claim'],
      ].map(([icon, txt], i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)' } },
        React.createElement('div', { style: { fontSize: 18 } }, icon),
        React.createElement('div', { style: { fontSize: 12, fontWeight: 600 } }, txt)
      ))
    ]);

    if (s.modal === 'subscribe') return overlay([
      closeBtn,
      React.createElement('div', {
        key: 'card', style: {
          borderRadius: 16, padding: 18, marginBottom: 14, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg,#1a0e2e,#05060a 65%)', border: '1px solid rgba(168,85,247,.5)', boxShadow: '0 0 26px rgba(168,85,247,.4)'
        }
      },
        React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 0%, rgba(168,85,247,.25), transparent 55%), radial-gradient(circle at 80% 100%, rgba(77,141,255,.2), transparent 55%)', pointerEvents: 'none' } }),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 22, color: '#fff', marginBottom: 2 } }, '\u2b50 FM+ MEMBERSHIP'),
        React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginBottom: 12 } }, '$4.99 / month \u00b7 cancel anytime'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 } },
          ['1,000 bonus FM coins every month', 'Early access to new Fantasy Cards', 'Exclusive FM+ private leagues', 'No ads across the app', '2X streak-save discount (25 FM instead of 50)'].map((f, i) => React.createElement('div', {
            key: i, style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,.85)' }
          },
            React.createElement('span', { style: { color: '#a855f7', fontWeight: 900 } }, '\u2713'), f
          ))
        )
      ),
      !s.isSubscribed && React.createElement('div', { key: 'plans', style: { display: 'flex', gap: 8, marginBottom: 10 } },
        [['monthly', '$4.99/mo', 'Auto-renews · cancel anytime'], ['pass', '$4.99', '30-day pass · no auto-renew']].map(([mode, price, description]) => React.createElement('div', {
          role: 'button', tabIndex: 0, key: mode, onClick: () => this.setState({ fmPlusMode: mode }),
          style: { flex: 1, minWidth: 0, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: s.fmPlusMode === mode ? 'rgba(168,85,247,.18)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (s.fmPlusMode === mode ? '#a855f7' : 'rgba(255,255,255,.12)'), color: '#fff' }
        },
          React.createElement('strong', { style: { display: 'block', fontSize: 13 } }, price),
          React.createElement('small', { style: { display: 'block', marginTop: 2, fontSize: 8.5, color: 'rgba(255,255,255,.55)', lineHeight: 1.35 } }, description)
        ))
      ),
      React.createElement('div', {
        onClick: this.subscribeFmPlus,
        style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(90deg,#a855f7,#4d8dff)', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 14px rgba(168,85,247,.6)' }
      }, s.isSubscribed ? 'YOU\u2019RE AN FM+ MEMBER \u2713' : (s.fmPlusMode === 'pass' ? 'GET 30-DAY PASS \u2014 $4.99' : 'JOIN FM+ \u2014 $4.99/MO'))
    ]);

    if (s.modal === 'wallet' || s.modal === 'addcoins') return overlay([
      closeBtn,
      React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, marginBottom: 4, color: '#f2b544' } }, 'FM COINS'),
      React.createElement('div', { key: 'b', style: { fontSize: 26, fontWeight: 800, marginBottom: 12, color: '#f2b544', animation: 'moneyPulseGold 1.8s ease-in-out infinite' } }, s.coins.toLocaleString() + ' coins'),
      React.createElement('div', { key: 'l', style: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 8 } }, 'ADD MORE'),
      React.createElement('div', { key: 'p', style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        !s.hasPurchased && React.createElement('div', { key: 'fb', style: { fontSize: 10.5, fontWeight: 900, color: '#22c55e', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.4)', borderRadius: 8, padding: '7px 9px', marginBottom: 2 } }, '🎁 First purchase gets you DOUBLE coins — today only'),
        [[1000, '$0.99', false], [5000, '$3.99', true], [15000, '$9.99', false]].map(([amt, price, popular]) => React.createElement('div', {
          key: amt, onClick: () => this.addCoins(amt, price),
          style: { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: popular ? 'rgba(242,181,68,.1)' : 'rgba(255,255,255,.05)', border: popular ? '1.5px solid #f2b544' : '1px solid rgba(242,181,68,.3)', cursor: 'pointer' }
        },
          popular && React.createElement('div', { style: { position: 'absolute', top: -9, left: 12, fontSize: 8.5, fontWeight: 900, letterSpacing: .4, color: '#2b1b00', background: 'linear-gradient(90deg,#ffd873,#f2b544)', borderRadius: 999, padding: '2px 8px' } }, 'MOST POPULAR'),
          React.createElement('span', { style: { fontWeight: 800 } }, amt.toLocaleString() + ' FM' + (!s.hasPurchased ? ' → ' + (amt * 2).toLocaleString() + ' FM' : '')),
          React.createElement('span', { style: { fontWeight: 800, color: '#f2b544', animation: 'moneyPulseGold 1.8s ease-in-out infinite' } }, price)
        ))
      ),
      React.createElement('div', {
        key: 'fmplus', onClick: () => this.openModal('subscribe'),
        style: { marginTop: 12, textAlign: 'center', padding: '11px 0', borderRadius: 10, background: 'linear-gradient(90deg,#a855f7,#4d8dff)', fontWeight: 900, fontSize: 12, cursor: 'pointer', boxShadow: '0 0 14px rgba(168,85,247,.5)' }
      }, s.isSubscribed ? '✓ FM+ MEMBER — MANAGE' : '⭐ GO FM+ — BONUS COINS EVERY MONTH')
    ]);

    if (s.modal === 'champProfile') {
      const champion = s.modalData || {};
      return overlay([
        closeBtn,
        React.createElement('div', { key: 'icon', style: { textAlign: 'center', fontSize: 34, marginBottom: 4 } }, '🏆'),
        React.createElement('div', { key: 'name', style: { fontFamily: "'Anton',sans-serif", fontSize: 21, textAlign: 'center', color: '#f2b544' } }, champion.name || 'RANKED PLAYER'),
        React.createElement('div', { key: 'sub', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', textAlign: 'center', letterSpacing: .6, marginBottom: 14 } }, `GLOBAL LEADERBOARD · RANK #${champion.rank || '—'}`),
        React.createElement('div', { key: 'stats', style: { display: 'flex', gap: 7, marginBottom: 14 } },
          [['RANK', `#${champion.rank || '—'}`, '#fff'], ['OFFICIAL POINTS', `${champion.pts || 0}`, '#22c55e']].map(([label, value, color]) => React.createElement('div', { key: label, style: { flex: 1, textAlign: 'center', padding: '9px 4px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' } },
            React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 16, color, fontVariantNumeric: 'tabular-nums' } }, value),
            React.createElement('div', { style: { fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,.45)', letterSpacing: .5, marginTop: 2 } }, label)))),
        React.createElement('div', { key: 'copy', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', lineHeight: 1.55, marginBottom: 14, textAlign: 'center' } }, 'This profile reflects the live leaderboard response. No sample earnings or invented win records are shown.'),
        React.createElement('div', { key: 'cta', onClick: () => { this.closeModal(); this.setTab('contests'); }, style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 900, fontSize: 12, letterSpacing: .5, cursor: 'pointer' } }, 'CHASE THIS RANK — ENTER A FIGHT'),
      ]);
    }

    if (s.modal === 'leagueDetail') {
      const league = s.modalData || {};
      return overlay([
        closeBtn,
        React.createElement('div', { key: 'kicker', style: { fontSize: 9.5, fontWeight: 900, letterSpacing: .8, color: '#a855f7', marginBottom: 3 } }, league.joined ? 'YOUR LEAGUE' : 'PUBLIC LEAGUE'),
        React.createElement('div', { key: 'name', style: { fontFamily: "'Anton',sans-serif", fontSize: 20, marginBottom: 10 } }, league.name || league.leagueName || 'LEAGUE'),
        React.createElement('div', { key: 'rows', style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 } },
          [['Members', league.members], ['Reward', league.rewardTitle], ['Status', league.joined ? 'Joined' : 'Open']].filter((row) => row[1] !== undefined && row[1] !== null && row[1] !== '').map(([label, value]) => React.createElement('div', { key: label, style: { display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,.08)' } }, React.createElement('span', null, label), React.createElement('span', { style: { color: '#fff', fontWeight: 900 } }, value)))),
        league.joined
          ? React.createElement('div', { key: 'view', onClick: () => { this.closeModal(); this.setTab('leaderboard'); }, style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: '#a855f7', fontWeight: 900, fontSize: 12.5, cursor: 'pointer' } }, 'VIEW STANDINGS')
          : React.createElement('div', { key: 'join', onClick: () => { this.joinLiveLeague(league); this.closeModal(); }, style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: '#a855f7', fontWeight: 900, fontSize: 12.5, cursor: 'pointer' } }, 'JOIN LEAGUE'),
      ]);
    }

    if (s.modal === 'join') return overlay([
      closeBtn,
      React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 20, color: '#f2b544', marginBottom: 4 } }, 'JOIN FANTASY MMAdness'),
      React.createElement('div', { key: 's', style: { fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 8 } }, 'Free to play. Real prizes.'),
      React.createElement('div', { key: 'bonus', style: { fontSize: 11, fontWeight: 900, color: '#22c55e', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.4)', borderRadius: 8, padding: '8px 10px', marginBottom: 14 } }, '🎁 Sign up now — get 500 FM coins free to make your first picks'),
      React.createElement('input', { key: 'n', value: s.joinDraft.name, onChange: (event) => this.setState((state) => ({ joinDraft: { ...state.joinDraft, name: event.target.value } })), placeholder: 'Player name', style: { boxSizing: 'border-box', width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 13, marginBottom: 10, fontFamily: "'Rajdhani',sans-serif" } }),
      React.createElement('input', { key: 'e', value: s.joinDraft.email, onChange: (event) => this.setState((state) => ({ joinDraft: { ...state.joinDraft, email: event.target.value } })), placeholder: 'Email address', type: 'email', style: { boxSizing: 'border-box', width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 13, marginBottom: 10, fontFamily: "'Rajdhani',sans-serif" } }),
      React.createElement('input', { key: 'p', type: 'password', placeholder: 'Create password', style: { width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 13, marginBottom: 14, fontFamily: "'Rajdhani',sans-serif" } }),
      React.createElement('div', { key: 'b', onClick: this.joinNow, style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 900, fontSize: 14, cursor: 'pointer' } }, 'JOIN NOW »')
    ]);

    if (s.modal === 'predictModal') {
      const d = s.modalData;
      const picked = s.predictions[d.id];
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontSize: 10, fontWeight: 800, color: '#f2b544' } }, d.tag),
        React.createElement('div', { key: 'm', style: { fontFamily: "'Anton',sans-serif", fontSize: 20, margin: '4px 0 4px' } }, d.f1, React.createElement('span', { style: { color: '#ef4444' } }, ' VS '), d.f2),
        React.createElement('div', { key: 'pz', style: { fontSize: 13, fontWeight: 800, color: '#22c55e', marginBottom: 14 } }, d.prize, ' PRIZE POOL'),
        React.createElement('div', { key: 'row', style: { display: 'flex', gap: 8 } },
          [d.f1, d.f2].map(f => React.createElement('div', {
            key: f, onClick: () => this.lockPrediction(d.id, f),
            style: {
              flex: 1, textAlign: 'center', padding: '16px 0', borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: 'pointer',
              background: picked === f ? '#f2b544' : 'rgba(255,255,255,.06)', color: picked === f ? '#2b1b00' : '#fff', border: '1px solid rgba(255,255,255,.15)'
            }
          }, f, picked === f ? ' ✓' : ''))
        )
      ]);
    }

    if (s.modal === 'blog') {
      const b = s.modalData;
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#f2b544', marginBottom: 10 } }, b.title),
        React.createElement('div', { key: 'b', style: { fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,.8)' } }, b.body)
      ]);
    }

    if (s.modal === 'wrestlingScorecard') {
      const ev = s.modalData; const d = s.scorecardDraft;
      const cats = [['hp', 'Head Punches'], ['bp', 'Body Punches'], ['k', 'Kicks'], ['pm', 'Power Moves'], ['fm', 'Finishers']];
      const mini = (who, cat) => React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } },
        React.createElement('div', { onClick: () => this.updateScorecard(who, cat, -1), style: { width: 20, height: 20, borderRadius: 5, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, fontSize: 11 } }, '−'),
        React.createElement('div', { style: { width: 22, textAlign: 'center', fontWeight: 800, fontSize: 13 } }, d[who][cat]),
        React.createElement('div', { onClick: () => this.updateScorecard(who, cat, 1), style: { width: 20, height: 20, borderRadius: 5, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, fontSize: 11 } }, '+')
      );
      const catRow = ([cat, label]) => React.createElement('div', { key: cat, style: { display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.06)' } },
        mini('a', cat),
        React.createElement('div', { style: { textAlign: 'center', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.55)', letterSpacing: .3 } }, label.toUpperCase()),
        mini('b', cat)
      );
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 17, color: '#a855f7' } }, 'PRO WRESTLING SCORECARD'),
        React.createElement('div', { key: 's', style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 12 } }, 'Predict full-match totals — not round by round'),
        React.createElement('div', { key: 'hdr', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } },
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 } },
            React.createElement('div', { style: { width: 30, height: 30 } }, React.createElement(MobileImageSlot, { id: 'event-poster-' + ev.id, shape: 'circle', placeholder: ev.f1, fit: 'cover', src: ev.image, fallbackSrc: ev.fallbackImage })),
            React.createElement('div', { style: { fontWeight: 900, fontSize: 11, color: '#ef4444' } }, ev.f1)
          ),
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 14, color: 'rgba(255,255,255,.35)', padding: '0 8px' } }, 'VS'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 } },
            React.createElement('div', { style: { width: 30, height: 30 } }, React.createElement(MobileImageSlot, { id: 'event-poster-' + ev.id, shape: 'circle', placeholder: ev.f2, fit: 'cover', src: ev.image, fallbackSrc: ev.fallbackImage })),
            React.createElement('div', { style: { fontWeight: 900, fontSize: 11, color: '#4d8dff' } }, ev.f2)
          )
        ),
        React.createElement('div', { key: 'rows', style: { marginBottom: 12 } }, cats.map(catRow)),
        React.createElement('div', { key: 'wl', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'CORRECT WINNER (+100 PTS BONUS)'),
        React.createElement('div', { key: 'wrow', style: { display: 'flex', gap: 6, marginBottom: 14 } },
          [['a', ev.f1], ['b', ev.f2]].map(([w, label]) => React.createElement('div', {
            key: w, onClick: () => this.setScorecardWinner(w),
            style: { flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: d.winner === w ? '#a855f7' : 'rgba(255,255,255,.06)', color: '#fff' }
          }, label))
        ),
        React.createElement('div', { key: 'fl', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'FINISH MARKET (+500 IF CORRECT)'),
        React.createElement('div', { key: 'frow', style: { display: 'flex', gap: 6, marginBottom: 10 } },
          [['PINFALL', 'PINFALL'], ['SUBMISSION', 'SUBMISSION']].map(([value, label]) => React.createElement('div', {
            key: value, onClick: () => this.setScorecardFinishType(d.finishTypePrediction === value ? null : value),
            style: { flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', background: d.finishTypePrediction === value ? '#f2b544' : 'rgba(255,255,255,.06)', color: d.finishTypePrediction === value ? '#2b1b00' : '#fff' }
          }, label))
        ),
        React.createElement('div', { key: 'note', style: { fontSize: 9, color: 'rgba(255,255,255,.4)', fontWeight: 600, marginBottom: 12, lineHeight: 1.4 } }, 'Full 25-minute scoring: each cleared stat floor adds its predicted count. A correct Pinfall/Submission call adds 500 points; a non-finish result adds the 25-point Survival Bonus.'),
        React.createElement('div', { key: 'submit', onClick: () => this.submitScorecard(ev), style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: '#a855f7', fontWeight: 900, fontSize: 13, cursor: 'pointer' } }, 'SUBMIT SCORECARD — ' + this.getEventEntryLabel(ev))
      ]);
    }

    if (s.modal === 'boxingScorecard') {
      const ev = s.modalData; const d = s.boxingDraft;
      const cats = ['hp', 'bp', 'tp', 'rw', 'rl'];
      const catLabel = { hp: 'HEAD PUNCHES', bp: 'BODY PUNCHES', tp: 'TOTAL PUNCHES', rw: 'ROUNDS WON', rl: 'ROUNDS LOST' };
      const mini = (who, cat) => React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } },
        React.createElement('div', { onClick: () => this.updateBoxingCard(who, cat, -1), style: { width: 20, height: 20, borderRadius: 5, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, fontSize: 11 } }, '−'),
        React.createElement('div', { style: { width: 22, textAlign: 'center', fontWeight: 800, fontSize: 13 } }, d[who][cat]),
        React.createElement('div', { onClick: () => this.updateBoxingCard(who, cat, 1), style: { width: 20, height: 20, borderRadius: 5, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, fontSize: 11 } }, '+')
      );
      const catRow = (cat) => React.createElement('div', { key: cat, style: { display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.06)' } },
        mini('a', cat),
        React.createElement('div', { style: { textAlign: 'center', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.55)', letterSpacing: .3 } }, catLabel[cat]),
        mini('b', cat)
      );
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 17, color: '#f2b544' } }, ev.sport === 'bareknuckle' ? 'BARE KNUCKLE SCORECARD' : 'BOXING SCORECARD'),
        React.createElement('div', { key: 's', style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 12 } }, 'HP · BP · TP are independent totals — TP is not HP+BP · We count punches thrown, not just landed · Match is ' + (ev.sport === 'boxing' ? '12' : '5') + ' rounds'),
        React.createElement('div', { key: 'hdr', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } },
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 } },
            React.createElement('div', { style: { width: 30, height: 30 } }, React.createElement(MobileImageSlot, { id: 'event-poster-' + ev.id, shape: 'circle', placeholder: ev.f1, fit: 'cover', src: ev.image, fallbackSrc: ev.fallbackImage })),
            React.createElement('div', { style: { fontWeight: 900, fontSize: 11, color: '#ef4444' } }, ev.f1)
          ),
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 14, color: 'rgba(255,255,255,.35)', padding: '0 8px' } }, 'VS'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 } },
            React.createElement('div', { style: { width: 30, height: 30 } }, React.createElement(MobileImageSlot, { id: 'event-poster-' + ev.id, shape: 'circle', placeholder: ev.f2, fit: 'cover', src: ev.image, fallbackSrc: ev.fallbackImage })),
            React.createElement('div', { style: { fontWeight: 900, fontSize: 11, color: '#4d8dff' } }, ev.f2)
          )
        ),
        React.createElement('div', { key: 'rows', style: { marginBottom: 12 } }, cats.map(catRow)),
        React.createElement('div', { key: 'wl', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'WINNER'),
        React.createElement('div', { key: 'wrow', style: { display: 'flex', gap: 6, marginBottom: 14 } },
          [['a', ev.f1], ['b', ev.f2]].map(([w, label]) => React.createElement('div', {
            key: w, onClick: () => this.setBoxingWinner(w),
            style: { flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: d.winner === w ? '#f2b544' : 'rgba(255,255,255,.06)', color: d.winner === w ? '#2b1b00' : '#fff' }
          }, label))
        ),
        React.createElement('div', { key: 'ol', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 4 } }, 'MATCH OUTCOME'),
        React.createElement('div', { key: 'ol2', style: { fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 6 } }, 'Every fight is scored fully as if it goes the distance — even on a KO. This pick is for bragging rights and doesn\'t change your stat score.'),
        React.createElement('div', { key: 'orow', style: { display: 'flex', gap: 6, marginBottom: 6 } },
          [['a', ev.f1 + ' WINS BY KO'], ['b', ev.f2 + ' WINS BY KO']].map(([o, label]) => React.createElement('div', {
            key: o, onClick: () => this.setBoxingOutcome(o),
            style: { flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', background: d.outcome === o ? '#ef4444' : 'rgba(255,255,255,.06)', color: '#fff' }
          }, label))
        ),
        d.outcome && React.createElement('div', { key: 'auto', style: { fontSize: 9, fontWeight: 800, color: '#22c55e', marginBottom: 14 } }, '✓ Picked ' + (d.outcome === 'a' ? ev.f1 : ev.f2) + ' by KO'),
        !d.outcome && React.createElement('div', { key: 'autospace', style: { fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 14 } }, 'No pick needed — full-fight scoring applies either way.'),
        React.createElement('div', { key: 'submit', onClick: () => this.submitBoxingScorecard(ev), style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: '#f2b544', color: '#2b1b00', fontWeight: 900, fontSize: 13, cursor: 'pointer' } }, 'SUBMIT SCORECARD — ' + this.getEventEntryLabel(ev))
      ]);
    }

    if (s.modal === 'mmaScorecard') {
      const ev = s.modalData; const d = s.mmaDraft;
      const cats = ['hp', 'bp', 'kicks', 'knees', 'elbows'];
      const mini = (who, cat) => React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } },
        React.createElement('div', { onClick: () => this.updateMmaCard(who, cat, -1), style: { width: 20, height: 20, borderRadius: 5, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, fontSize: 11 } }, '−'),
        React.createElement('div', { style: { width: 22, textAlign: 'center', fontWeight: 800, fontSize: 13 } }, d[who][cat]),
        React.createElement('div', { onClick: () => this.updateMmaCard(who, cat, 1), style: { width: 20, height: 20, borderRadius: 5, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, fontSize: 11 } }, '+')
      );
      const catRow = (cat) => React.createElement('div', { key: cat, style: { display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.06)' } },
        mini('a', cat),
        React.createElement('div', { style: { textAlign: 'center', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.55)', letterSpacing: .3 } }, cat.toUpperCase()),
        mini('b', cat)
      );
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 17, color: '#4d8dff' } }, ev.sport === 'kickboxing' ? 'KICKBOXING SCORECARD' : 'MMA SCORECARD'),
        React.createElement('div', { key: 's', style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 12 } }, 'Every punch, kick, knee & elbow thrown counts — landed or not · Scheduled for 5 rounds'),
        React.createElement('div', { key: 'hdr', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } },
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 } },
            React.createElement('div', { style: { width: 30, height: 30 } }, React.createElement(MobileImageSlot, { id: 'event-poster-' + ev.id, shape: 'circle', placeholder: ev.f1, fit: 'cover', src: ev.image, fallbackSrc: ev.fallbackImage })),
            React.createElement('div', { style: { fontWeight: 900, fontSize: 11, color: '#ef4444' } }, ev.f1)
          ),
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 14, color: 'rgba(255,255,255,.35)', padding: '0 8px' } }, 'VS'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 } },
            React.createElement('div', { style: { width: 30, height: 30 } }, React.createElement(MobileImageSlot, { id: 'event-poster-' + ev.id, shape: 'circle', placeholder: ev.f2, fit: 'cover', src: ev.image, fallbackSrc: ev.fallbackImage })),
            React.createElement('div', { style: { fontWeight: 900, fontSize: 11, color: '#4d8dff' } }, ev.f2)
          )
        ),
        React.createElement('div', { key: 'rows', style: { marginBottom: 12 } }, cats.map(catRow)),
        React.createElement('div', { key: 'wl', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'WINNER'),
        React.createElement('div', { key: 'wrow', style: { display: 'flex', gap: 6, marginBottom: 14 } },
          [['a', ev.f1], ['b', ev.f2]].map(([w, label]) => React.createElement('div', {
            key: w, onClick: () => this.setMmaWinner(w),
            style: { flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: d.winner === w ? '#4d8dff' : 'rgba(255,255,255,.06)', color: '#fff' }
          }, label))
        ),
        React.createElement('div', { key: 'ol', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 4 } }, 'MATCH OUTCOME'),
        React.createElement('div', { key: 'ol2', style: { fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 6 } }, 'Every fight is scored fully as if it goes the distance — even on a KO. This pick is for bragging rights and doesn\'t change your stat score.'),
        React.createElement('div', { key: 'orow', style: { display: 'flex', gap: 6, marginBottom: 6 } },
          [['a', ev.f1 + ' WINS BY KO'], ['b', ev.f2 + ' WINS BY KO']].map(([o, label]) => React.createElement('div', {
            key: o, onClick: () => this.setMmaOutcome(o),
            style: { flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', background: d.outcome === o ? '#ef4444' : 'rgba(255,255,255,.06)', color: '#fff' }
          }, label))
        ),
        d.outcome && React.createElement('div', { key: 'auto', style: { fontSize: 9, fontWeight: 800, color: '#22c55e', marginBottom: 14 } }, '✓ Picked ' + (d.outcome === 'a' ? ev.f1 : ev.f2) + ' by KO'),
        !d.outcome && React.createElement('div', { key: 'autospace', style: { fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 14 } }, 'No pick needed — full-fight scoring applies either way.'),
        React.createElement('div', { key: 'submit', onClick: () => this.submitMmaScorecard(ev), style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: '#4d8dff', fontWeight: 900, fontSize: 13, cursor: 'pointer' } }, 'SUBMIT SCORECARD — ' + this.getEventEntryLabel(ev))
      ]);
    }

    if (s.modal === 'aiScoringDemo') return overlay([
      closeBtn,
      React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 17, color: '#a855f7', marginBottom: 4 } }, '🤖 AI-ASSISTED ADMIN SCORECARD'),
      React.createElement('div', { key: 'lock', style: { fontSize: 8.5, fontWeight: 900, color: '#ef4444', marginBottom: 6 } }, '🔒 STAFF-ONLY VIEW — REGULAR USERS NEVER SEE THIS SCREEN'),
      React.createElement('div', { key: 'sub', style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginBottom: 14 } }, 'Demo · UFC 323 — AI auto-fills every strike category live; the assigned scorer nudges +/- to correct anything. Users only ever see the resulting point totals update.'),
      React.createElement('div', { key: 'hdr', style: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 } },
        React.createElement('div', { style: { fontWeight: 900, fontSize: 13, color: '#ef4444' } }, 'JONES · RED'),
        React.createElement('div', { style: { fontWeight: 900, fontSize: 13, color: '#4d8dff' } }, 'ASPINALL · BLUE')
      ),
      s.aiDemoCard && this.aiScoreCats.map(([cat, label]) => React.createElement('div', { key: cat, style: { marginBottom: 10 } },
        React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 4, textAlign: 'center' } }, label),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } },
          ['a', 'b'].map(side => React.createElement('div', {
            key: side, style: {
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, padding: '6px 0',
              background: s.aiDemoFlash === side + '-' + cat ? 'rgba(168,85,247,.3)' : 'rgba(255,255,255,.05)',
              border: '1px solid ' + (side === 'a' ? 'rgba(239,68,68,.3)' : 'rgba(77,141,255,.3)'), transition: 'background .3s'
            }
          },
            React.createElement('div', { onClick: () => this.adjustAiCard(side, cat, -1), style: { width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900 } }, '−'),
            React.createElement('div', { style: { width: 22, textAlign: 'center', fontWeight: 900, fontSize: 14 } }, s.aiDemoCard[side][cat]),
            React.createElement('div', { onClick: () => this.adjustAiCard(side, cat, 1), style: { width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900 } }, '+')
          ))
        )
      )),
      React.createElement('div', { key: 'note', style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.4)', textAlign: 'center', marginTop: 4 } }, '🟣 Purple flash = AI just auto-filled that box — review and correct as needed')
    ]);

    if (s.modal === 'fantasyDraft') {
      const c = s.modalData; const d = s.fantasyDraft;
      const pool = {
        boxing: ['SPENCE JR.', 'TSZYU'], mma: ['JONES', 'ASPINALL', 'SUPERLEK', 'TAKERU'],
        bareknuckle: ['ALVES', 'WARD'], kickboxing: ['ALLAZOV', 'PETROSYAN'], wrestling: ['MJF', 'ADAM COLE'],
      };
      const genreLabel = { boxing: '🥊 BOXING', mma: '👊 MMA', bareknuckle: '✊ BARE KNUCKLE', kickboxing: '🦵 KICKBOXING', wrestling: '🤼 PRO WRESTLING' };
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 17, color: '#a855f7' } }, 'DRAFT YOUR FANTASY CARD'),
        React.createElement('div', { key: 's', style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 12 } }, c.name + ' · ' + c.span + ' · pool is every fighter already on the app this week'),
        Object.keys(pool).map(genre => React.createElement('div', { key: genre, style: { marginBottom: 12 } },
          React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.55)', marginBottom: 5 } }, genreLabel[genre]),
          React.createElement('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
            pool[genre].map(fighter => React.createElement('div', {
              key: fighter, onClick: () => this.setFantasyPick(genre, fighter),
              style: { padding: '8px 12px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', background: d[genre] === fighter ? '#a855f7' : 'rgba(255,255,255,.06)', color: '#fff' }
            }, fighter))
          )
        )),
        React.createElement('div', { key: 'submit', onClick: () => this.submitFantasyCard(c), style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: 'linear-gradient(90deg,#4d8dff,#a855f7)', fontWeight: 900, fontSize: 13, cursor: 'pointer', marginTop: 6 } }, 'LOCK IN CARD — ' + c.entryFee + ' FM')
      ]);
    }

    if (s.modal === 'newLeague') return overlay([
      closeBtn,
      React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#a855f7', marginBottom: 10 } }, 'CREATE A LEAGUE'),
      React.createElement('input', { key: 'n', placeholder: 'League name', style: { width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 13, marginBottom: 14, fontFamily: "'Rajdhani',sans-serif" } }),
      React.createElement('div', {
        key: 'b', onClick: () => { this.playBell(); this.showToast('League created! Invite link copied.'); this.closeModal(); },
        style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: '#a855f7', fontWeight: 900, fontSize: 13, cursor: 'pointer' }
      }, 'CREATE LEAGUE')
    ]);

    if (s.modal === 'newChallenge') return overlay([
      closeBtn,
      React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#a855f7', marginBottom: 10 } }, 'CHALLENGE A FRIEND'),
      React.createElement('input', { key: 'n', placeholder: 'Username', style: { width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 13, marginBottom: 10, fontFamily: "'Rajdhani',sans-serif" } }),
      React.createElement('input', { key: 'w', placeholder: 'Wager (FM coins)', style: { width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 13, marginBottom: 14, fontFamily: "'Rajdhani',sans-serif" } }),
      React.createElement('div', {
        key: 'b', onClick: () => { this.playBell(); this.showToast('Challenge sent!'); this.closeModal(); },
        style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: '#a855f7', fontWeight: 900, fontSize: 13, cursor: 'pointer' }
      }, 'SEND CHALLENGE')
    ]);

    if (s.modal === 'receipt') return overlay([
      closeBtn,
      React.createElement('div', {
        key: 'card', style: {
          borderRadius: 16, padding: 20, marginBottom: 14, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg,#1a0e2e,#05060a 65%)', border: '1px solid rgba(168,85,247,.5)', boxShadow: '0 0 26px rgba(168,85,247,.4)'
        }
      },
        React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 0%, rgba(168,85,247,.25), transparent 55%), radial-gradient(circle at 80% 100%, rgba(239,68,68,.2), transparent 55%)', pointerEvents: 'none' } }),
        React.createElement('div', { style: { fontSize: 9, fontWeight: 900, letterSpacing: 2, color: '#f2c869', marginBottom: 10 } }, 'FANTASY MMAdness · FIGHT IQ RECEIPT'),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } },
          React.createElement('div', { style: { width: 44, height: 44, borderRadius: '50%' } }, React.createElement(MobileImageSlot, { id: 'avatar', shape: 'circle', placeholder: 'Photo', fit: 'cover' })),
          React.createElement('div', null,
            React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 16 } }, 'KellyD'),
            React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: '#f2b544' } }, '👑 LEGEND · LEVEL 18')
          )
        ),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 } },
          [['4-1', 'THIS WEEK'], ['80%', 'ACCURACY'], ['#18', 'GLOBAL RANK']].map(([v, l], i) => React.createElement('div', { key: i, style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#fff' } }, v),
            React.createElement('div', { style: { fontSize: 7.5, fontWeight: 800, color: 'rgba(255,255,255,.5)' } }, l)
          ))
        ),
        React.createElement('div', { style: { background: 'rgba(242,181,68,.12)', border: '1px solid rgba(242,181,68,.4)', borderRadius: 8, padding: 8, fontSize: 10, fontWeight: 800, color: '#f2c869', textAlign: 'center' } }, '🐺 BEST CALL: Underdog Aspinall pick — 2X points'),
        React.createElement('div', { style: { fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.35)', marginTop: 12, textAlign: 'center' } }, 'fantasymmadness.com')
      ),
      React.createElement('div', {
        onClick: () => this.showToast('Receipt saved — ready to share!'),
        style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: 'linear-gradient(90deg,#a855f7,#ec4899)', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 14px rgba(168,85,247,.6)' }
      }, '📤 SAVE & SHARE')
    ]);

    if (s.modal === 'featuredPick') {
      const event = s.modalData;
      if (!event) return null;
      return overlay([
        closeBtn,
        React.createElement('div', { key: 'tag', style: { color: event.tagColor, fontSize: 10, fontWeight: 1000, letterSpacing: .7, marginBottom: 4 } }, `FEATURED FIGHT · ${this.getSportLabel(event.sport)}`),
        React.createElement('div', { key: 'title', style: { fontFamily: "'Anton',sans-serif", fontSize: 23, lineHeight: 1.08, marginBottom: 5 } }, 'PICK A WINNER'),
        React.createElement('div', { key: 'copy', style: { color: 'rgba(255,255,255,.58)', fontSize: 11, fontWeight: 800, lineHeight: 1.45, marginBottom: 14 } }, 'Choose one fighter, then continue into this fight’s sport-specific scorecard.'),
        React.createElement('div', { key: 'choices', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } },
          [['a', event.f1, event.fighterAImage], ['b', event.f2, event.fighterBImage]].map(([side, name, image]) => React.createElement('button', {
            key: side,
            type: 'button',
            onClick: () => this.confirmFeaturedPick(side),
            style: { minWidth: 0, minHeight: 118, padding: 9, borderRadius: 12, border: `1px solid ${side === 'a' ? '#ef4444' : '#4d8dff'}`, background: 'rgba(255,255,255,.055)', color: '#fff', cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontWeight: 1000 }
          },
            React.createElement('span', { style: { display: 'block', width: 58, height: 58, margin: '0 auto 7px', overflow: 'hidden', borderRadius: '50%', background: '#090a0f' } }, React.createElement(MobileImageSlot, { id: `featured-pick-${side}-${event.id}`, shape: 'circle', placeholder: name, fit: 'cover', src: image, fallbackSrc: event.image || event.fallbackImage })),
            React.createElement('span', { style: { display: 'block', fontSize: 12, lineHeight: 1.1, overflowWrap: 'anywhere' } }, name)
          ))),
        React.createElement('div', { key: 'note', style: { marginTop: 10, color: 'rgba(255,255,255,.42)', fontSize: 9.5, fontWeight: 800, textAlign: 'center' } }, `${this.getSportLabel(event.sport)} scorecard · ${this.getEventEntryLabel(event)} entry`)
      ]);
    }

    if (s.modal === 'aiScout') {
      const event = s.modalData || events[0] || null;
      const report = event?.aiScoutingReport || (event ? {
        summary: `${event.f1} faces ${event.f2} in this ${this.getSportLabel(event.sport)} matchup. Use the registered fight card and official updates as the source of truth.`,
        pickSplitNote: '',
        underdogAngle: '',
        source: 'fight-data-fallback',
      } : null);
      if (!report || !event) return null;
      const votes = report.pickSplit
        ? { a: Number(report.pickSplit.fighterA) || 0, b: Number(report.pickSplit.fighterB) || 0 }
        : null;
      const fighterA = event?.f1 || 'RED CORNER';
      const fighterB = event?.f2 || 'BLUE CORNER';
      return overlay([
        closeBtn,
        React.createElement('div', {
          key: 'card', style: {
            borderRadius: 16, padding: 18, marginBottom: 14, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(160deg,#0d1a2e,#05060a 65%)', border: '1px solid rgba(77,141,255,.5)', boxShadow: '0 0 26px rgba(77,141,255,.35)'
          }
        },
          React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 0%, rgba(77,141,255,.25), transparent 55%), radial-gradient(circle at 85% 100%, rgba(242,181,68,.15), transparent 55%)', pointerEvents: 'none' } }),
          React.createElement('div', { style: { position: 'relative' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } },
              React.createElement('div', { style: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#4d8dff,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 1000 } }, 'AI'),
              React.createElement('div', null,
                React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 15, color: '#fff' } }, 'AI SCOUTING ASSISTANT'),
                React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.55)', letterSpacing: .5 } }, `${fighterA} vs ${fighterB}${event?.tag ? ` · ${event.tag}` : ''}`)
              )
            ),
            React.createElement('div', { style: { display: 'grid', gap: 8, marginBottom: 10 } },
              [report.summary, report.pickSplitNote, report.underdogAngle].filter(Boolean).map((note, index) => React.createElement('div', { key: `${index}-${note}`, style: { padding: 10, borderRadius: 9, background: 'rgba(255,255,255,.05)', borderLeft: `3px solid ${['#4d8dff', '#f2b544', '#a855f7'][index]}` } },
                React.createElement('span', { style: { display: 'block', color: 'rgba(255,255,255,.78)', fontSize: 10.5, lineHeight: 1.45 } }, note)
              ))),
            votes && React.createElement('div', { style: { display: 'flex', gap: 8 } },
              [[`${votes.a}%`, `PICKED ${fighterA}`], [`${votes.b}%`, `PICKED ${fighterB}`]].map(([value, label]) => React.createElement('div', { key: label, style: { flex: 1, minWidth: 0, textAlign: 'center', background: 'rgba(255,255,255,.05)', borderRadius: 8, padding: '8px 4px' } },
                React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 15, color: '#f2c869' } }, value),
                React.createElement('div', { style: { fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,.5)', overflowWrap: 'anywhere' } }, label)
              ))
            ),
            React.createElement('div', { style: { marginTop: 9, fontSize: 8, color: 'rgba(255,255,255,.35)', textAlign: 'center' } }, report.generatedAt ? `Generated for this fight · ${new Date(report.generatedAt).toLocaleDateString()}` : 'Generated for this fight')
          )
        ),
        React.createElement('div', {
          role: 'button', tabIndex: 0,
          onClick: () => { this.closeModal(); if (event) this.openEvent(event); },
          style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(90deg,#4d8dff,#a855f7)', fontWeight: 900, fontSize: 13, cursor: event ? 'pointer' : 'default', opacity: event ? 1 : .55, boxShadow: '0 0 14px rgba(77,141,255,.6)' }
        }, event ? `USE THIS INSIGHT · ${this.getEventActionLabel(event)}` : 'NO FIGHT SELECTED')
      ]);
    }

    if (s.modal === 'fighterAffiliate') return overlay([
      closeBtn,
      React.createElement('div', { key: 'hero', style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 } },
        React.createElement('div', { style: { width: 60, height: 60, borderRadius: '50%', flex: '0 0 auto', boxShadow: '0 0 18px rgba(242,181,68,.5)' } }, React.createElement(MobileImageSlot, { id: 'fighter-affiliate-photo', shape: 'circle', placeholder: 'Fighter photo', fit: 'cover' })),
        React.createElement('div', null,
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
            React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#fff' } }, s.modalData ? s.modalData.host : 'Tom Aspinall'),
            React.createElement('span', { style: { fontSize: 8.5, fontWeight: 900, color: '#05060a', background: '#f2b544', borderRadius: 999, padding: '2px 7px' } }, '\u2713 VERIFIED FIGHTER')
          ),
          React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)' } }, 'UFC Heavyweight \u00b7 Fighter Affiliate')
        )
      ),
      React.createElement('div', { key: 'b', style: { fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,.8)', marginBottom: 12 } }, 'This Fantasy Card is hosted directly by the fighter. Fans who follow ' + (s.modalData ? s.modalData.host : 'this fighter') + ' get notified the moment a new card drops \u2014 draft your roster, compete with other fans, and the fighter earns a share of every pot.'),
      React.createElement('div', { key: 'stats', style: { display: 'flex', gap: 8, marginBottom: 12 } },
        [['48.2K', 'FOLLOWERS'], ['12,400', 'FM POT'], ['3', 'CARDS HOSTED']].map(([v, l], i) => React.createElement('div', { key: i, style: { flex: 1, textAlign: 'center', background: 'rgba(242,181,68,.1)', border: '1px solid rgba(242,181,68,.3)', borderRadius: 8, padding: '8px 4px' } },
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 15, color: '#f2c869' } }, v),
          React.createElement('div', { style: { fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,.5)' } }, l)
        ))
      ),
      React.createElement('div', {
        onClick: () => { this.showToast('Following ' + (s.modalData ? s.modalData.host : 'fighter') + ' \u2014 you\u2019ll be first to know about new cards'); },
        style: { textAlign: 'center', padding: '11px 0', borderRadius: 10, marginBottom: 8, background: 'rgba(242,181,68,.12)', border: '1px solid rgba(242,181,68,.5)', color: '#f2c869', fontWeight: 900, fontSize: 12, cursor: 'pointer' }
      }, '+ FOLLOW FIGHTER'),
      React.createElement('div', {
        onClick: () => { this.closeModal(); this.openModal('fantasyDraft', s.modalData); },
        style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(90deg,#f2b544,#f2c869)', color: '#2b1b00', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 14px rgba(242,181,68,.5)' }
      }, 'DRAFT THIS FIGHT CARD \u2014 ' + (s.modalData ? s.modalData.entryFee : 150) + ' FM')
    ]);

    if (s.modal === 'affiliate') return overlay([
      closeBtn,
      React.createElement('div', { key: 'hero', style: { height: 110, borderRadius: 12, overflow: 'hidden', marginBottom: 10, boxShadow: '0 0 18px rgba(77,141,255,.55)' } },
        React.createElement(MobileImageSlot, { id: 'affiliate-modal-handshake', shape: 'rect', placeholder: 'Handshake — partnership', fit: 'cover', src: 'uploads/HANDSHAKE%20PHOTO.jpg' })
      ),
      React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#4d8dff', marginBottom: 4 } }, "YOU'RE THE PROMOTER NOW"),
      React.createElement('div', { key: 'b', style: { fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,.8)', marginBottom: 12 } }, 'Promote fights, build a league, and get players moving. Run it like a creator: set up your profile, launch a promotion, share the link, track activity, and request payout.'),
      React.createElement('div', { key: 'steps', style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 } },
        ['Set up your affiliate profile', 'Create or promote a fight', 'Share the campaign link + QR', 'Track signups & performance', 'Request your payout'].map((step, i) => React.createElement('div', {
          key: i, style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.85)' }
        },
          React.createElement('span', { style: { width: 18, height: 18, borderRadius: '50%', background: '#4d8dff', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' } }, i + 1),
          step
        ))
      ),
      React.createElement('div', { key: 'link', style: { padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,.06)', fontSize: 12, fontWeight: 700, marginBottom: 10 } }, 'fantasymmadness.com/ref/kellyd'),
      React.createElement('div', { key: 'btn', onClick: this.copyReferral, style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: 'linear-gradient(90deg,#4d8dff,#a855f7)', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 14px rgba(77,141,255,.6)', marginBottom: 14 } }, 'COPY REFERRAL LINK'),
      React.createElement('div', { key: 'kitLabel', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 8 } }, 'ONE-TAP SHARE — LINK + FIGHT POSTER PRE-LOADED'),
      React.createElement('div', { key: 'kit', style: { display: 'flex', gap: 8 } },
        [['X', '#000'], ['Instagram', '#dd2a7b'], ['Facebook', '#1877f2'], ['TikTok', '#25f4ee']].map(([name, color]) => React.createElement('div', {
          key: name, onClick: () => this.shareToSocial(name),
          style: { flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: color, fontWeight: 900, fontSize: 10, cursor: 'pointer', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.4)' }
        }, name))
      )
    ]);

    return null;
  }


  render() {
    return this.renderVals().screen;
  }
}

export default FantasyMobileAppCore;
