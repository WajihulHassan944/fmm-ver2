/* Derived from the client-approved standalone prototype in the design handoff. */
import React from 'react';
import { resolvePublicMediaUrl } from '@/Utils/publicApi';
import { dateOnlyToLocalDate, getDateOnlyKey } from '@/Utils/dateOnly';
import designTokens from './design-tokens.json';

const ASSET_BASE = '/images/mobile-home/final-v35';
const EVENT_POSTER_FILES = [
  'event-poster-1.webp',
  'event-poster-2.webp',
  'event-poster-3.webp',
  'event-poster-5.webp',
  'event-poster-6.webp',
];
const EVENT_POSTER_COUNT = EVENT_POSTER_FILES.length;
// The real accounts. TikTok and Facebook were guessed handles that 404'd —
// the Facebook one is a share link, which is what Facebook issues for a page
// without a vanity URL, so it is used verbatim rather than "tidied".
const SOCIAL_PROFILE_URLS = Object.freeze({
  X: 'https://x.com/FMmadness2024',
  Instagram: 'https://www.instagram.com/fantasymmadness',
  Facebook: 'https://www.facebook.com/share/1DZ9RqkMJd/',
  TikTok: 'https://www.tiktok.com/@fantasy.mmadness',
});
const DESIGN_WIDTH = designTokens.viewport.designWidth;

const directSlotAssets = {
  'bold-hero': 'hero-banner-v2.jpg',
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
    const index = Math.max(0, Number(eventMatch[1]) - 1) % EVENT_POSTER_COUNT;
    return `${ASSET_BASE}/${EVENT_POSTER_FILES[index]}`;
  }

  const sportMatch = String(id).match(/^sport-(boxing|mma|bareknuckle|kickboxing|wrestling)-/);
  if (sportMatch) {
    return `${ASSET_BASE}/sport-${sportMatch[1]}.webp`;
  }

  const shadowMatch = String(id).match(/^shadow-(?:sf)?(\d+)$/);
  if (shadowMatch) {
    const index = Math.max(0, Number(shadowMatch[1]) - 1) % EVENT_POSTER_COUNT;
    return `${ASSET_BASE}/${EVENT_POSTER_FILES[index]}`;
  }

  if (String(id).startsWith('demo-')) return `${ASSET_BASE}/event-poster-1.webp`;
  return '/images/hero-fight.webp';
};

const MobileImageSlot = ({ id, src, fallbackSrc, fit = 'cover', shape, radius, placeholder, position }) => {
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
      objectPosition: position || 'center',
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

// Turn a stored Cloudinary URL into a transparent-background version.
// Controlled by env so the transform can be changed, or the whole thing turned
// off, without a deploy.
const CUTOUT_TRANSFORM = String(process.env.NEXT_PUBLIC_CLOUDINARY_CUTOUT_TRANSFORM || 'e_background_removal').trim();
const CUTOUTS_ENABLED = String(process.env.NEXT_PUBLIC_FIGHTER_CUTOUTS || 'true').toLowerCase() !== 'false';

const cloudinaryCutout = (url = '') => {
  const value = String(url || '').trim();
  if (!CUTOUTS_ENABLED || !CUTOUT_TRANSFORM) return '';
  // Only Cloudinary delivery URLs, and never one that already carries the
  // transform (double-applying it wastes a credit and can fail).
  if (!/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(value)) return '';
  if (value.includes(CUTOUT_TRANSFORM)) return value;
  // PNG so the alpha channel survives — a JPEG cutout would come back white.
  return value
    .replace('/image/upload/', `/image/upload/${CUTOUT_TRANSFORM}/f_png,q_auto:best,c_limit,w_900/`)
    .replace(/\.(jpe?g|webp|avif)(\?|$)/i, '.png$2');
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
    // Transparent-background versions, derived from the same Cloudinary URLs.
    // Screens use these as src and the plain ones as fallbackSrc, so a missing
    // transform degrades to the original photo instead of a broken image.
    fighterACutout: cloudinaryCutout(resolveLiveMedia(fight.featuredFightFighterAImage)),
    fighterBCutout: cloudinaryCutout(resolveLiveMedia(fight.featuredFightFighterBImage)),
    division: cleanText(fight.division, fight.weightClass),
    sport,
    tag: cleanText(fight.eventName, fight.matchName, fight.name, fight.promotion, sportLabel[sport]),
    tagColor: sportColor[sport],
    f1: cleanText(fight.matchFighterA, fight.fighterAName, fight.fighterA?.displayName, fight.f1, String(fight.matchName || fight.name || '').split(/\s+vs\.?\s+/i)[0]).toUpperCase(),
    f2: cleanText(fight.matchFighterB, fight.fighterBName, fight.fighterB?.displayName, fight.f2, String(fight.matchName || fight.name || '').split(/\s+vs\.?\s+/i)[1]).toUpperCase(),
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
    viewerCount: toSafeNumber(fight.viewerCount, fight.liveViewerCount, fight.watchPartyViewers),
    isLive: Boolean(fight.isLive || fight.live || String(fight.status || '').toLowerCase() === 'live'),
    matchStatus: cleanText(fight.matchStatus, fight.status),
    settled: Boolean(fight.prizesSettledAt),
    isShadow: Boolean(fight.isShadow || fight.is_shadow || String(fight.fightType || fight.collection || '').toLowerCase().includes('shadow')),
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

const normalizeShadowFight = (fight = {}, index = 0) => {
  const event = normalizeLiveEvent(fight, index);
  return {
    ...event,
    genre: event.sport,
    buyIn: event.entryFee,
    pot: toSafeNumber(fight.pot, fight.prizePool, fight.currentPot),
    lobby: toSafeNumber(fight.lobby, fight.entryCount, fight.entries),
    status: event.isLive ? 'live' : cleanText(fight.status, 'scheduled').toLowerCase(),
    goLiveIn: toSafeNumber(fight.goLiveIn),
    categories: cleanText(fight.categories, fight.scoringCategories),
    rounds: event.maxRounds || null,
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

// Per-round drafts. The scoring engine (calculateClassicPredictionPoints) reduces
// over the predictions array indexed against each round's ACTUAL stats, so a
// whole-fight card would only ever score against round 1. Every round needs its
// own entry. Wrestling is the exception — one continuous match, one card.
const roundsForSport = (sport, maxRounds) => {
  const explicit = Number(maxRounds);
  if (Number.isFinite(explicit) && explicit > 0) return Math.min(15, Math.round(explicit));
  return String(sport || '').toLowerCase() === 'boxing' ? 12 : 5;
};

const emptyWrestlingDraft = () => ({
  a: { hp: 0, bp: 0, k: 0, pm: 0, fm: 0 },
  b: { hp: 0, bp: 0, k: 0, pm: 0, fm: 0 },
  winner: null,
  finishTypePrediction: null,
});

const emptyBoxingDraft = (rounds = 12) => ({
  rounds: Array.from({ length: rounds }, () => ({
    a: { hp: 0, bp: 0, tp: 0 },
    b: { hp: 0, bp: 0, tp: 0 },
    winner: null,
  })),
  activeRound: 0,
  winner: null,
  outcome: null,
});

const emptyMmaDraft = (rounds = 5) => ({
  rounds: Array.from({ length: rounds }, () => ({
    a: { hp: 0, bp: 0, kicks: 0, knees: 0, elbows: 0 },
    b: { hp: 0, bp: 0, kicks: 0, knees: 0, elbows: 0 },
    winner: null,
  })),
  activeRound: 0,
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
    displayCoins: Number.isFinite(Number(this.props.initialCoins)) ? Number(this.props.initialCoins) : 0,
    confetti: null,
    showWelcomePulse: true,
    liveActivity: null,
    watchViewers: toSafeNumber(this.props.livePresence?.viewerCount),
    idleNudgeShown: false,
    bellWiggle: false,
    walletFlash: false,
    newFightId: null,
    showNewTag: false,
    reactBurst: {},
    watchLiveBonus: 0,
    rewardClaimed: Boolean(this.props.currentUser?.dailyRewardClaimed),
    hasPurchased: false,
    isSubscribed: hasActiveFmPlus(this.props.currentUser),
    fmPlusMode: 'pass',
    joinDraft: { name: '', email: '' },
    cart: [],
    streakDay: toSafeNumber(this.props.currentUser?.streakDay, this.props.currentUser?.currentStreak),
    votes: { jones: 76, aspinall: 24 },
    userVote: null,
    toast: null,
    enteredEvents: {},
    watchFightId: null,
    predictions: {},
    notifications: Array.isArray(this.props.notifications) ? this.props.notifications : [],
    notifCount: toSafeNumber(this.props.unreadNotificationCount),
    chestBounce: 0,
    xpMounted: false,
    layout: 'classic',
    carouselIndex: 0,
    leaderboardTier: 'global',
    liveTicks: { jones: 0, aspinall: 0 },
    reactions: [],
    friendFeed: [],
    reactionDraft: '',
    streakExpiresIn: Math.max(0, Math.floor((new Date(this.props.currentUser?.streakExpiresAt || 0).getTime() - Date.now()) / 1000)) || 0,
    watchMode: 'rounds',
    matchSeconds: 0,
    triggeredMoments: [],
    adminFeed: [],
    watchPoints: 0,
    leagues: [],
    // Head-to-Head is not built. These track interest instead of matches.
    h2hWaitlist: { joined: false, total: 0 },
    awards: [],
    awardTitles: [],
    challenges: [],
    challengeBusy: null,
    challengeForm: { fightId: '', opponent: '', stake: '' },
    h2hWaitlistBusy: false,
    h2hWaitlistEmail: '',
    h2hWaitlistBand: '',
    shadowPlays: {},
    shadowPicks: {},
    shadowFights: Array.isArray(this.props.shadowFights) ? this.props.shadowFights.map(normalizeShadowFight) : [],
    affiliateCampaigns: Array.isArray(this.props.affiliateCampaigns) ? this.props.affiliateCampaigns : [],
    publicLeagues: [],
    joinedLeagueIds: {},
    refundFights: [],
    refundPending: null,
    refundBusy: false,
    payoutQueue: [],
    payoutBusy: null,
    adminBusy: false,
    affiliateProfile: null,
    affiliatePromoted: [],
    affiliateBusy: false,
    affiliateError: '',
    authForm: { email: '', password: '', name: '' },
    authMode: 'login',
    authBusy: false,
    authError: '',
    authNotice: '',
    showPassword: false,
    supportForm: { category: 'other', subject: '', message: '', email: '' },
    supportBusy: false,
    supportError: '',
    supportSent: '',
    fantasyCampaigns: [],
    // A pick is { fighterName, calledCategory, calledValue } — the called number
    // is what keeps this the platform's game rather than generic fantasy sports.
    fantasyDraft: {},
    // Advances every 4s; drives the cross-fade in the discipline circles.
    sportCycle: 0,
    notifFeed: [],
    // Promoter distribution panel. Only loaded for a signed-in league account.
    promoterReach: null,
    // Contest standings, loaded per contest when the player opens them.
    standings: null,
    // Feedback sheet. Reachable from every screen, because a bug is reported
    // properly at the moment it happens or not at all.
    feedback: { area: 'other', severity: 'wrong', step: '', expected: '', actual: '' },
    feedbackBusy: false,
    shareKit: null,
    promoterBusy: false,
    // Billing address for the gateway's address-verification check. No card
    // fields here by design — those live on Authorize.net's hosted page, so card
    // numbers never touch our servers.
    billing: { firstName: '', lastName: '', address: '', city: '', state: '', zipCode: '', country: 'US' },
    checkoutBusy: false,
    // Edit-profile draft, seeded from the signed-in player when the sheet opens.
    profileDraft: { playerName: '', firstName: '', lastName: '', phone: '' },
    profileBusy: false,
    seasonMeta: { slots: [], callCategories: {}, callBonusCap: 100, slotMax: 100 },
    mySeasonCards: [],
    seasonBusy: false,
    // Team Cards: five fighters from one event. teamDraft is keyed by fightId so
    // the one-fighter-per-bout rule is structural — a bout cannot hold two picks.
    teamContests: [],
    myTeams: [],
    teamDraft: {},
    teamMeta: { callCategories: {}, callBonusCap: 50 },
    teamBusy: false,
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
      roundByRound: true, notifications: true, sound: true, leagueVisibility: 'invite',
      autoAcceptLeague: true, autoPayout: true, aiAutoScore: true,
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
    // One-shot audio unlock on the first gesture anywhere in the app. Registered
    // as a capture-phase listener so it runs before the button's own handler and
    // that first tap makes a sound too.
    if (typeof window !== 'undefined') {
      this._audioUnlock = () => {
        this.unlockAudio();
        ['touchstart', 'pointerdown', 'click'].forEach((evt) =>
          window.removeEventListener(evt, this._audioUnlock, true));
      };

      // One listener gives every button a press sound, instead of threading
      // playTap() through several hundred call sites. Capture phase so it fires
      // before the button's own handler navigates away.
      this._pressSound = (nativeEvent) => {
        const target = nativeEvent.target;
        if (!target || typeof target.closest !== 'function') return;
        const pressable = target.closest('button,[role="button"],.theme-btn,.btn-grad');
        if (!pressable || pressable.getAttribute('aria-disabled') === 'true' || pressable.disabled) return;
        this.playTap();
      };
      window.addEventListener('pointerdown', this._pressSound, { capture: true, passive: true });
      ['touchstart', 'pointerdown', 'click'].forEach((evt) =>
        window.addEventListener(evt, this._audioUnlock, { capture: true, passive: true }));
    }

    clearInterval(this._communityInterval); clearInterval(this._sportPhotoInterval); clearInterval(this._streakInterval); clearInterval(this._shadowInterval); clearInterval(this._friendInterval); clearInterval(this._watchInterval); clearInterval(this._filledPollInterval); clearInterval(this._coinTween);
    this._xpTimer = setTimeout(() => this.setState({ xpMounted: true }), 200);
    this._welcomeTimer = setTimeout(() => this.setState({ showWelcomePulse: false }), 6000);
    this._idleTimer = setTimeout(() => {
      if (this.state.activeTab === 'home' && !this.state.idleNudgeShown) this.setState({ idleNudgeShown: true });
    }, 30000);
    this._communityInterval = setInterval(() => {
      this.setState(s => ({ communityIndex: (s.communityIndex + 1) % 5 }));
    }, designTokens.carouselTiming.communityPredictionsCycleMs);
    this._sportPhotoInterval = setInterval(() => {
      this.setState(s => ({ sportPhotoIndex: (s.sportPhotoIndex + 1) % 5 }));
    }, designTokens.carouselTiming.photoCycleMs);
    this._streakInterval = setInterval(() => {
      this.setState(s => s.rewardClaimed ? s : { streakExpiresIn: Math.max(0, s.streakExpiresIn - 1) });
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
    if (this.props.features?.headToHead?.enabled) this.loadChallenges();
    else this.loadWaitlistStatus();
    this.loadAwards();
    if (this.props.features?.seasonCards?.enabled) this.loadSeasons();
    if (this.props.features?.teamCards?.enabled) this.loadTeamContests();
    this.startSportCycle();
    this.loadNotificationFeed();
    // 60s: fast enough that a published fight appears while the app is open,
    // slow enough not to be chatty.
    this._notifPoll = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      this.loadNotificationFeed();
    }, 60000);
  }

  componentDidUpdate(previousProps, previousState) {
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
    if (previousProps.notifications !== this.props.notifications) {
      updates.notifications = Array.isArray(this.props.notifications) ? this.props.notifications : [];
      const newest = updates.notifications.find(item => !(item.read || item.isRead));
      const activityText = cleanText(newest?.message, newest?.text, newest?.title);
      if (activityText) {
        updates.liveActivity = activityText;
        clearTimeout(this._activityTimer);
        this._activityTimer = setTimeout(() => this.setState({ liveActivity: null }), 4200);
      }
    }
    const unread = toSafeNumber(this.props.unreadNotificationCount);
    if (unread !== toSafeNumber(previousProps.unreadNotificationCount) && unread !== this.state.notifCount) {
      updates.notifCount = unread;
    }
    if (previousProps.shadowFights !== this.props.shadowFights) {
      updates.shadowFights = Array.isArray(this.props.shadowFights) ? this.props.shadowFights.map(normalizeShadowFight) : [];
    }
    if (previousProps.fights !== this.props.fights && Array.isArray(this.props.fights)) {
      const oldIds = new Set((previousProps.fights || []).map(fight => cleanText(fight._id, fight.id, fight.matchId)).filter(Boolean));
      const added = this.props.fights.find(fight => {
        const id = cleanText(fight._id, fight.id, fight.matchId);
        return id && !oldIds.has(id);
      });
      if (added) {
        updates.newFightId = cleanText(added._id, added.id, added.matchId);
        updates.showNewTag = true;
        clearTimeout(this._newFightTimeout);
        this._newFightTimeout = setTimeout(() => this.setState({ showNewTag: false }), 10000);
      }
    }
    if (previousProps.affiliateCampaigns !== this.props.affiliateCampaigns) {
      updates.affiliateCampaigns = Array.isArray(this.props.affiliateCampaigns) ? this.props.affiliateCampaigns : [];
    }
    const nextViewers = toSafeNumber(this.props.livePresence?.viewerCount);
    if (nextViewers !== toSafeNumber(previousProps.livePresence?.viewerCount) && nextViewers !== this.state.watchViewers) {
      updates.watchViewers = nextViewers;
    }
    if (Object.keys(updates).length) this.setState(updates);

    if (previousState && previousState.notifCount !== this.state.notifCount && this.state.notifCount > previousState.notifCount) {
      this.setState({ bellWiggle: true });
      clearTimeout(this._bellTimeout);
      this._bellTimeout = setTimeout(() => this.setState({ bellWiggle: false }), 600);
    }
    if (previousState && previousState.coins !== this.state.coins) {
      this.setState({ walletFlash: true });
      clearTimeout(this._walletTimeout);
      this._walletTimeout = setTimeout(() => this.setState({ walletFlash: false }), 700);
      clearInterval(this._coinTween);
      const start = this.state.displayCoins;
      const end = this.state.coins;
      const startedAt = Date.now();
      this._coinTween = setInterval(() => {
        const progress = Math.min(1, (Date.now() - startedAt) / 600);
        const value = Math.round(start + (end - start) * (1 - Math.pow(1 - progress, 3)));
        this.setState({ displayCoins: value });
        if (progress >= 1) clearInterval(this._coinTween);
      }, 30);
    }
  }

  fireConfetti = () => {
    const colors = ['#f2b544', '#ef4444', '#a855f7', '#22c55e', '#4d8dff'];
    const pieces = Array.from({ length: 18 }, (_, id) => ({ id, left: Math.random() * 100, color: colors[id % colors.length], delay: Math.random() * 0.3, dur: 0.9 + Math.random() * 0.5 }));
    this.setState({ confetti: pieces });
    clearTimeout(this._confettiTimeout);
    this._confettiTimeout = setTimeout(() => this.setState({ confetti: null }), 1600);
  };

  // iOS starts every AudioContext suspended and only lets a genuine user gesture
  // resume it. Without this the first tap is silent, and on some versions every
  // later tap is too.
  unlockAudio = () => {
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      // A zero-gain blip is what actually flips iOS out of the suspended state.
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.01);
    } catch (e) { /* no audio available */ }
  };

  // Short, dry click for ordinary buttons — playBell is a 1.1s chime and too
  // much for a plain tap.
  playTap() {
    if (!this.state.settings.sound) return;
    try {
      const ctx = this.getCtx(); const now = ctx.currentTime;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.07);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.1);
    } catch (e) {}
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
    if (name === 'boxingScorecard') reset.boxingDraft = emptyBoxingDraft(roundsForSport(data?.sport, data?.maxRounds));
    if (name === 'mmaScorecard') reset.mmaDraft = emptyMmaDraft(roundsForSport(data?.sport, data?.maxRounds));
    this.setState({ modal: name, modalData: data || null, ...reset });
  };
  closeModal = () => this.setState({ modal: null, modalData: null });

  setTab = (tab) => {
    if (tab === 'watch' && this.state.activeTab !== 'watch') this.startWatchTicker();
    if (tab !== 'watch' && this.state.activeTab === 'watch') this.stopWatchTicker();
    // Staff opening Settings pulls the live refund/payout queues.
    // Admin queues moved to the back office, so Settings no longer fetches them.
    // This used to fire an admin request whenever a player opened Settings.
    // Promoter tools need an affiliate session, so they load on demand rather
    // than firing a guaranteed 401 on every app start.
    if (tab === 'leagues' && !this.state.promoterReach) this.loadPromoterReach();
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
  setFeedbackField = (field, value) => this.setState(s => ({ feedback: { ...s.feedback, [field]: value } }));

  submitFeedback = async () => {
    const f = this.state.feedback;
    if (!String(f.actual || '').trim()) { this.showToast('Tell me what happened'); return; }
    this.safeSetState({ feedbackBusy: true });
    const result = await this.props.onSubmitFeedback(f);
    this.safeSetState({ feedbackBusy: false });
    if (!result?.ok) { this.showToast(result?.message || 'Could not send that'); return; }
    this.playTap();
    this.safeSetState({
      modal: null,
      feedback: { area: 'other', severity: 'wrong', step: '', expected: '', actual: '' },
    });
    this.showToast('Sent — ' + (result.reference || 'logged') + '. Thank you.');
  };

  openTeamStandings = async (contest) => {
    this.playTap();
    this.safeSetState({ standings: { loading: true, title: contest.contestName || contest.name || 'Standings' } });
    this.openModal('standings');
    const result = await this.props.onLoadTeamLeaderboard(contest.contestId || contest.id);
    this.safeSetState({
      standings: {
        title: contest.contestName || contest.name || 'Standings',
        subtitle: result.live ? 'Live — updates as each bout is scored' : 'Final',
        rows: result.leaderboard || [],
        unit: 'PTS',
      },
    });
  };

  openSeasonStandings = async (card) => {
    this.playTap();
    this.safeSetState({ standings: { loading: true, title: card.seasonName || 'Season standings' } });
    this.openModal('standings');
    const result = await this.props.onLoadSeasonLeaderboard(card.seasonId);
    this.safeSetState({
      standings: {
        title: card.seasonName || 'Season standings',
        // Mid-season the ranking is on raw output, because the out-of-100
        // conversion is not final until every slot has been scored. Saying so
        // is better than publishing a number that later moves.
        subtitle: result.provisional ? 'Provisional — ranked on raw points until the season settles' : 'Final',
        rows: result.leaderboard || [],
        unit: result.scale === 'normalized' ? '/500' : 'PTS',
      },
    });
  };

  loadPromoterReach = async () => {
    if (typeof this.props.onLoadPromoterReach !== 'function') return;
    const result = await this.props.onLoadPromoterReach();
    if (result?.ok) this.safeSetState({ promoterReach: result });
  };

  announceToLeague = async (fightId) => {
    if (!fightId) { this.showToast('Pick which fight to announce'); return; }
    this.safeSetState({ promoterBusy: true });
    const result = await this.props.onAnnounceFightToLeague({ fightId });
    this.safeSetState({ promoterBusy: false });
    if (!result?.ok) { this.showToast(result?.message || 'Could not send that notice'); return; }
    this.playBell();
    // Say plainly what happened, including when email was held back — a promoter
    // needs to know whether their league was actually emailed.
    this.showToast(result.emailSkippedReason ? result.message + ' ' + result.emailSkippedReason : result.message);
    this.loadPromoterReach();
  };

  openShareKit = async (fightId) => {
    this.playTap();
    const result = await this.props.onLoadShareKit({ fightId });
    if (!result?.ok) { this.showToast(result?.message || 'Could not build a share link'); return; }
    this.safeSetState({ shareKit: result });
    this.openModal('shareKit');
  };

  copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast((label || 'Copied') + ' — paste it anywhere');
    } catch (error) {
      this.showToast('Could not copy — long-press the text to select it');
    }
  };

  loadNotificationFeed = async () => {
    if (typeof this.props.onLoadNotifications !== 'function') return;
    const result = await this.props.onLoadNotifications();
    if (!result) return;
    this.safeSetState({
      notifFeed: result.notifications || [],
      // Server-derived, so the badge survives a reopen instead of resetting.
      notifCount: Number(result.unread) || 0,
    });
  };

  openNotifications = () => {
    this.playTap();
    // Sheet is registered as 'notif' — opening 'notifications' matched no branch,
    // so the bell cleared the badge and showed nothing.
    this.openModal('notif');
    // Clearing on open is the honest moment — they have now seen them.
    if (typeof this.props.onMarkNotificationsRead === 'function') {
      this.props.onMarkNotificationsRead();
      this.safeSetState({ notifCount: 0 });
    }
  };

  startSportCycle() {
    // A single interval for all five circles. 4s is slow enough to read a face
    // and not turn the header into a slideshow.
    if (this._sportCycle) return;
    this._sportCycle = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return; // don't churn in the background
      this.safeSetState((prev) => ({ sportCycle: (prev.sportCycle + 1) % 600 }));
    }, 4000);
  }

  componentWillUnmount() {
    clearInterval(this._sportCycle);
    this._sportCycle = null;
    clearInterval(this._notifPoll);
    this._notifPoll = null;
    if (typeof window !== 'undefined' && this._audioUnlock) {
      ['touchstart', 'pointerdown', 'click'].forEach((evt) =>
        window.removeEventListener(evt, this._audioUnlock, true));
    }
    if (typeof window !== 'undefined' && this._pressSound) {
      window.removeEventListener('pointerdown', this._pressSound, true);
    }

    this._unmounted = true;
    this.stopWatchTicker();
    [this._communityInterval, this._sportPhotoInterval, this._shadowInterval, this._streakInterval, this._demoInterval, this._filledPollInterval, this._aiDemoInterval, this._coinTween].forEach(clearInterval);
    [this._xpTimer, this._welcomeTimer, this._idleTimer, this._confettiTimeout, this._bellTimeout, this._walletTimeout, this._toastTimer, this._activityTimer, this._newFightTimeout].forEach(clearTimeout);
  }

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
    // A preview fight is not a real contest — never let one reach a money path.
    // NB: arrow function, so no `arguments` object — use the parameter.
    if (event && event.isSample) {
      this.showToast('This is a preview fight — publish a real card to play it');
      return;
    }
    if (!event?.playable) {
      // Keep the user inside the app: show the in-app fight detail instead of
      // routing out to the website /fight/<id> page.
      if (event) { this.openModal('aiScout', event); return; }
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
      const idx = s.boxingDraft.activeRound || 0;
      const rounds = s.boxingDraft.rounds.map((r, i) => i !== idx ? r : {
        ...r, [who]: { ...r[who], [cat]: Math.max(0, (r[who][cat] || 0) + delta) },
      });
      return { boxingDraft: { ...s.boxingDraft, rounds } };
    });
  };
  setBoxingRound = (idx) => this.setState(s => ({ boxingDraft: { ...s.boxingDraft, activeRound: idx } }));
  // Sets the winner of the CURRENT round, then auto-advances so a 12-rounder is
  // a run of taps rather than tap-scroll-tap.
  setBoxingWinner = (w) => this.setState(s => {
    const idx = s.boxingDraft.activeRound || 0;
    const rounds = s.boxingDraft.rounds.map((r, i) => i === idx ? { ...r, winner: w } : r);
    const next = idx < rounds.length - 1 ? idx + 1 : idx;
    return { boxingDraft: { ...s.boxingDraft, rounds, activeRound: next, winner: w } };
  });
  setBoxingOutcome = (o) => this.setState(s => ({ boxingDraft: { ...s.boxingDraft, outcome: o } }));
  // A card must be COMPLETE before the fight locks — an unfinished card means
  // missed rounds score nothing and the player misses out on the pot.
  incompleteRounds = (draft) => {
    if (!draft || !Array.isArray(draft.rounds)) return [];
    return draft.rounds
      .map((r, i) => (r.winner ? null : i + 1))
      .filter(Boolean);
  };

  submitBoxingScorecard = async (ev) => {
    const draft = this.state.boxingDraft;
    const missing = this.incompleteRounds(draft);
    if (missing.length) {
      this.setState(s => ({ boxingDraft: { ...s.boxingDraft, activeRound: missing[0] - 1 } }));
      this.showToast(missing.length === 1
        ? 'Round ' + missing[0] + ' still needs a winner'
        : missing.length + ' rounds still need a winner — starting at R' + missing[0]);
      return;
    }
    const { winner, outcome } = draft;
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
    this.setState(s => {
      const idx = s.mmaDraft.activeRound || 0;
      const rounds = s.mmaDraft.rounds.map((r, i) => i !== idx ? r : {
        ...r, [who]: { ...r[who], [cat]: Math.max(0, (r[who][cat] || 0) + delta) },
      });
      return { mmaDraft: { ...s.mmaDraft, rounds } };
    });
  };
  setMmaRound = (idx) => this.setState(s => ({ mmaDraft: { ...s.mmaDraft, activeRound: idx } }));
  setMmaWinner = (w) => this.setState(s => {
    const idx = s.mmaDraft.activeRound || 0;
    const rounds = s.mmaDraft.rounds.map((r, i) => i === idx ? { ...r, winner: w } : r);
    const next = idx < rounds.length - 1 ? idx + 1 : idx;
    return { mmaDraft: { ...s.mmaDraft, rounds, activeRound: next, winner: w } };
  });
  setMmaOutcome = (o) => this.setState(s => ({ mmaDraft: { ...s.mmaDraft, outcome: o } }));
  submitMmaScorecard = async (ev) => {
    const draft = this.state.mmaDraft;
    const missing = this.incompleteRounds(draft);
    if (missing.length) {
      this.setState(s => ({ mmaDraft: { ...s.mmaDraft, activeRound: missing[0] - 1 } }));
      this.showToast(missing.length === 1
        ? 'Round ' + missing[0] + ' still needs a winner'
        : missing.length + ' rounds still need a winner — starting at R' + missing[0]);
      return;
    }
    const { winner, outcome } = draft;
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
  loadTeamContests = async () => {
    if (typeof this.props.onLoadTeamContests !== 'function') return;
    const [meta, mine] = await Promise.all([
      this.props.onLoadTeamContests(),
      typeof this.props.onLoadMyTeams === 'function' ? this.props.onLoadMyTeams() : Promise.resolve([]),
    ]);
    this.safeSetState({
      teamContests: (meta.contests || []).map(contest => ({
        ...contest,
        entered: (mine || []).some(team => String(team.contestId) === String(contest.id)),
      })),
      myTeams: mine || [],
      teamMeta: { callCategories: meta.callCategories || {}, callBonusCap: meta.callBonusCap || 50 },
    });
  };

  // Selecting a fighter replaces whatever was picked in that bout, so backing
  // both sides of a fight is impossible by construction rather than by check.
  setTeamPick = (fightId, fighterName) => this.setState(s => {
    const current = s.teamDraft[fightId];
    const next = { ...s.teamDraft };
    if (current?.fighterName === fighterName) delete next[fightId];
    else next[fightId] = { ...(current || {}), fightId, fighterName };
    return { teamDraft: next };
  });

  setTeamCall = (fightId, field, value) => this.setState(s => (
    s.teamDraft[fightId]
      ? { teamDraft: { ...s.teamDraft, [fightId]: { ...s.teamDraft[fightId], [field]: value } } }
      : null
  ));

  submitTeamEntry = async (contest) => {
    const picks = Object.values(this.state.teamDraft);
    if (picks.length !== contest.picksRequired) {
      this.showToast('Pick exactly ' + contest.picksRequired + ' fighters — one per bout');
      return;
    }
    if (contest.entryFee > 0 && this.state.coins < contest.entryFee) {
      this.showToast('Not enough FM coins for this contest');
      this.openModal('addcoins');
      return;
    }
    this.safeSetState({ teamBusy: true });
    const result = await this.props.onSubmitTeamEntry({
      contestId: contest.id,
      picks: picks.map(pick => ({
        fightId: pick.fightId,
        fighterName: pick.fighterName,
        calledCategory: pick.calledCategory || '',
        calledValue: Math.floor(Number(pick.calledValue) || 0),
      })),
    });
    this.safeSetState({ teamBusy: false });
    if (!result?.ok) { this.showToast(result?.message || 'Could not lock in that team'); return; }
    this.playBell(); this.playCheer();
    this.safeSetState({
      coins: this.state.coins - (result.entryFeePaid || 0),
      modal: null,
      teamDraft: {},
    });
    this.showToast('Team locked in for ' + contest.name);
    this.loadTeamContests();
  };

  loadSeasons = async () => {
    if (typeof this.props.onLoadSeasons !== 'function') return;
    const [meta, cards] = await Promise.all([
      this.props.onLoadSeasons(),
      typeof this.props.onLoadMySeasonCards === 'function' ? this.props.onLoadMySeasonCards() : Promise.resolve([]),
    ]);
    this.safeSetState({
      fantasyCampaigns: (meta.seasons || []).map(season => ({
        id: season.id,
        name: season.name,
        span: this.formatSeasonSpan(season.startsAt, season.endsAt),
        entryFee: season.entryFee,
        prizePool: season.prizePool,
        entrants: season.entrants,
        requiredSlots: season.requiredSlots || [],
        draftOpen: season.draftOpen,
        joined: (cards || []).some(card => String(card.seasonId) === String(season.id)),
      })),
      seasonMeta: {
        slots: meta.slots || [],
        callCategories: meta.callCategories || {},
        callBonusCap: meta.callBonusCap || 100,
        slotMax: meta.slotMax || 100,
      },
      mySeasonCards: cards || [],
    });
  };

  formatSeasonSpan = (from, to) => {
    const fmt = (value) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };
    const a = fmt(from); const b = fmt(to);
    return a && b ? a + ' – ' + b : 'Season';
  };

  // Fighters come from the real fight card rather than a hardcoded list, so a
  // player can only draft someone actually scheduled to compete.
  fighterPoolForSlot = (slotKey) => {
    const family = { boxing: 'boxing', bareknuckle: 'boxing', mma: 'mma', kickboxing: 'mma', wrestling: 'wrestling' }[slotKey] || 'mma';
    const fights = Array.isArray(this.props.fights) ? this.props.fights : [];
    const names = new Set();
    fights.forEach(fight => {
      const category = String(fight.category || fight.matchCategory || '').toLowerCase();
      const fightFamily = category.includes('box') || category.includes('knuckle') ? 'boxing'
        : category.includes('wrestl') ? 'wrestling' : 'mma';
      if (fightFamily !== family) return;
      [fight.f1, fight.f2].forEach(name => { if (name) names.add(String(name)); });
    });
    return [...names].slice(0, 24);
  };

  setFantasyPick = (slot, fighterName) => this.setState(s => ({
    fantasyDraft: {
      ...s.fantasyDraft,
      [slot]: s.fantasyDraft[slot]?.fighterName === fighterName
        ? undefined
        : { ...(s.fantasyDraft[slot] || {}), fighterName },
    },
  }));

  setFantasyCall = (slot, field, value) => this.setState(s => ({
    fantasyDraft: {
      ...s.fantasyDraft,
      [slot]: { ...(s.fantasyDraft[slot] || {}), [field]: value },
    },
  }));
  submitFantasyCard = async (campaign) => {
    const draft = this.state.fantasyDraft;
    const required = campaign.requiredSlots?.length
      ? campaign.requiredSlots
      : ['boxing', 'bareknuckle', 'mma', 'kickboxing', 'wrestling'];

    const missing = required.filter(slot => !draft[slot]?.fighterName);
    if (missing.length) { this.showToast('Pick a fighter for every slot — ' + missing.length + ' still empty'); return; }
    if (campaign.entryFee > 0 && this.state.coins < campaign.entryFee) {
      this.showToast('Not enough FM coins — add more to draft');
      this.openModal('addcoins');
      return;
    }

    // The server charges the entry inside a transaction and is the only place
    // the balance actually moves; the local number is corrected from its reply.
    this.safeSetState({ seasonBusy: true });
    const result = await this.props.onSubmitSeasonDraft({
      seasonId: campaign.id,
      picks: required.map(slot => ({
        slot,
        fighterName: draft[slot].fighterName,
        calledCategory: draft[slot].calledCategory || '',
        calledValue: Math.floor(Number(draft[slot].calledValue) || 0),
      })),
    });
    this.safeSetState({ seasonBusy: false });

    if (!result?.ok) { this.showToast(result?.message || 'Could not lock in that card'); return; }
    this.playBell(); this.playCheer();
    this.safeSetState({
      coins: this.state.coins - (result.entryFeePaid || 0),
      modal: null,
      fantasyDraft: {},
    });
    this.showToast('Card locked in for ' + campaign.name + ' — scoring runs all season');
    this.loadSeasons();
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
    // Unlock on this very gesture. iOS keeps an AudioContext suspended until a
    // real user gesture resumes it, and if the global first-touch listener was
    // missed the context stays silent for the rest of the session — so the
    // chest was tapping with no sound even though the calls were all here.
    this.unlockAudio();
    // Tap first so there is an immediate response, then the reward chime.
    this.playTap(); this.playBell(); this.playCheer();
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

  // In-app authentication. Keeps signup/login inside the app instead of routing
  // out to /auth or /CreateAccount, and preserves what the user was trying to do
  // so they land back on it instead of an empty screen.
  setAuthField = (field, value) => this.setState(s => ({ authForm: { ...s.authForm, [field]: value }, authError: '' }));
  setAuthMode = (mode) => this.setState({ authMode: mode, authError: '', authNotice: '' });
  // No-op after unmount so an in-flight request cannot update a dead component.
  safeSetState = (patch) => { if (!this._unmounted) this.setState(patch); };
  togglePassword = () => this.setState(st => ({ showPassword: !st.showPassword }));

  // Every menu row goes somewhere real — no dead toasts.
  openMenuItem = (label) => {
    const key = String(label || '').toLowerCase();
    if (key === 'log out') { this.props.onLogout?.(); return; }
    if (key === 'edit profile') { this.setTab('settings'); return; }
    if (key === 'payment methods') { this.setState({ modal: 'paymentMethods', modalData: null }); return; }
    if (key === 'rules') { this.setState({ modal: 'rules', modalData: null }); return; }
    if (key === 'support') { this.setState({ modal: 'support', modalData: null, supportSent: '' }); return; }
    this.setTab('settings');
  };
  setSupportField = (field, value) => this.setState(st => ({ supportForm: { ...st.supportForm, [field]: value }, supportError: '' }));
  submitSupport = async () => {
    const f = this.state.supportForm;
    if (!String(f.subject || '').trim() || !String(f.message || '').trim()) {
      this.setState({ supportError: 'Add a subject and tell us what happened.' });
      return;
    }
    this.setState({ supportBusy: true, supportError: '' });
    const result = await this.props.onSubmitSupport?.(f);
    this.safeSetState({ supportBusy: false });
    if (result?.ok) {
      this.setState({ supportSent: result.ticketNumber || 'received', supportForm: { category: 'other', subject: '', message: '', email: f.email } });
    } else {
      this.setState({ supportError: result?.message || 'Could not send that. Try again.' });
    }
  };
  // Password reset stays in-app: we post the email and show the outcome inline
  // rather than sending the user out to a website page mid sign-in.
  startPasswordReset = async () => {
    const email = String(this.state.authForm.email || '').trim();
    if (!email) { this.setState({ authError: 'Enter your email first, then tap this again.' }); return; }
    this.setState({ authBusy: true, authError: '', authNotice: '' });
    try {
      const result = await this.props.onRequestPasswordReset?.({ email });
      this.safeSetState({
        authBusy: false,
        authNotice: result?.ok
          ? 'Check your email for a reset link. It can take a minute to arrive.'
          : '',
        authError: result?.ok ? '' : (result?.message || 'Could not start a reset. Try again.'),
      });
    } catch (error) {
      this.setState({ authBusy: false, authError: 'Could not reach the server.' });
    }
  };
  openAuth = (intent = null) => this.setState({ modal: 'auth', modalData: intent, authError: '', authMode: 'login' });
  submitAuth = async () => {
    const { authForm, authMode, authBusy } = this.state;
    if (authBusy) return;
    const email = String(authForm.email || '').trim();
    const password = String(authForm.password || '');
    if (!email || !password) { this.setState({ authError: 'Email and password are required.' }); return; }
    if (authMode === 'signup' && !String(authForm.name || '').trim()) {
      this.setState({ authError: 'Enter the name other players will see.' });
      return;
    }
    this.setState({ authBusy: true, authError: '' });
    try {
      const handler = authMode === 'signup' ? this.props.onSignup : this.props.onLogin;
      if (!handler) { this.setState({ authBusy: false, authError: 'Sign-in is unavailable right now.' }); return; }
      const result = await handler({ email, password, name: authForm.name });
      if (!result?.ok) {
        this.safeSetState({ authBusy: false, authError: result?.message || 'Could not sign you in.' });
        return;
      }
      const intent = this.state.modalData;
      this.setState({ authBusy: false, modal: null, modalData: null, authForm: { email: '', password: '', name: '' } });
      this.showToast(authMode === 'signup' ? 'Account created — welcome in' : 'Signed in');
      if (intent?.type === 'joinLeague' && intent.league) this.joinLiveLeague(intent.league);
      if (intent?.type === 'enterEvent' && intent.event) this.enterEvent(intent.event);
    } catch (error) {
      this.setState({ authBusy: false, authError: 'Could not sign you in. Check your connection.' });
    }
  };

  // Affiliate dashboard — pulled in-app so promoters run their league without
  // being sent out to /AffiliateDashboard on the website.
  loadAffiliate = async () => {
    if (this.state.affiliateBusy) return;
    this.setState({ affiliateBusy: true, affiliateError: '' });
    try {
      const result = await this.props.onLoadAffiliate?.();
      if (!result?.ok) {
        this.safeSetState({ affiliateBusy: false, affiliateError: result?.message || 'Could not load your affiliate data.' });
        return;
      }
      this.setState({
        affiliateBusy: false,
        affiliateProfile: result.profile || null,
        affiliatePromoted: Array.isArray(result.promoted) ? result.promoted : [],
      });
    } catch (error) {
      this.setState({ affiliateBusy: false, affiliateError: 'Could not reach the server.' });
    }
  };
  requestPayout = async () => {
    const profile = this.state.affiliateProfile;
    const balance = Number(profile?.tokens || 0);
    if (!balance) { this.showToast('No balance to pay out yet'); return; }
    this.setState({ affiliateBusy: true });
    const result = await this.props.onRequestPayout?.({ amount: balance });
    this.safeSetState({ affiliateBusy: false });
    this.showToast(result?.ok ? 'Payout requested — ' + balance.toLocaleString() + ' FM' : (result?.message || 'Payout request failed'));
    if (result?.ok) this.loadAffiliate();
  };

  // ---- Admin money tools (staff only) -------------------------------------
  // Refunds pay each player from the ledger, not the fight's current fee.
  // Payout reject CREDITS BACK, because requesting already debited the wallet.
  loadAdminMoney = async () => {
    if (this.state.adminBusy) return;
    this.setState({ adminBusy: true });
    try {
      const result = await this.props.onLoadAdminMoney?.();
      this.safeSetState({
        adminBusy: false,
        refundFights: Array.isArray(result?.refundable) ? result.refundable : [],
        payoutQueue: Array.isArray(result?.payouts) ? result.payouts : [],
      });
    } catch (error) {
      this.setState({ adminBusy: false });
    }
  };
  confirmRefund = (fight) => this.setState({ refundPending: fight });
  cancelRefund = () => this.setState({ refundPending: null });
  runRefund = async () => {
    const fight = this.state.refundPending;
    if (!fight || this.state.refundBusy) return;
    this.setState({ refundBusy: true });
    try {
      const ok = await this.props.onRefundFight?.({ fightId: fight.id, reason: 'Fight cancelled' });
      if (ok === false) { this.safeSetState({ refundBusy: false }); return; }
      this.setState(s => ({
        refundFights: s.refundFights.map(f => f.id === fight.id ? { ...f, refunded: true, pot: 0 } : f),
        refundPending: null,
        refundBusy: false,
      }));
      this.showToast('Refunded ' + fight.players + ' entries — ' + Number(fight.pot || 0).toLocaleString() + ' FM returned');
    } catch (error) {
      this.setState({ refundBusy: false });
      this.showToast('Refund failed — nothing was charged or returned');
    }
  };
  resolvePayout = async (row, action) => {
    if (this.state.payoutBusy) return;
    this.setState({ payoutBusy: row.id });
    try {
      const ok = await this.props.onResolvePayout?.({ payout: row, action });
      if (ok === false) { this.safeSetState({ payoutBusy: null }); return; }
      this.setState(s => ({
        payoutQueue: s.payoutQueue.map(p => p.id === row.id ? { ...p, status: action === 'approve' ? 'paid' : 'rejected' } : p),
        payoutBusy: null,
      }));
      this.showToast(action === 'approve'
        ? 'Marked paid — ' + Number(row.amount || 0).toLocaleString() + ' FM to ' + row.name
        : 'Rejected — ' + Number(row.amount || 0).toLocaleString() + ' FM returned to ' + row.name);
    } catch (error) {
      this.setState({ payoutBusy: null });
      this.showToast('Could not update that payout');
    }
  };

  // A 12-round card is a lot of tapping. Quick-fill sets every ROUND WINNER to
  // one fighter in a single tap, so a player can enter fast and then adjust the
  // rounds they actually disagree on. Stats are untouched.
  quickFillRounds = (draftKey, side) => {
    this.setState(s => {
      const draft = s[draftKey];
      if (!draft || !Array.isArray(draft.rounds)) return null;
      return { [draftKey]: { ...draft, rounds: draft.rounds.map(r => ({ ...r, winner: side })), winner: side, activeRound: 0 } };
    });
    this.showToast('All rounds set — tap any round to change it');
  };

  joinLiveLeague = async (league) => {
    const id = cleanText(league?._id, league?.id);
    if (!id || this.state.joinedLeagueIds[id]) return;
    // Not signed in? Ask in-app and resume the join afterwards, instead of
    // bouncing to /login and losing which league they picked.
    if (!this.props.currentUser) {
      this.openAuth({ type: 'joinLeague', league });
      return;
    }
    if (!this.props.onJoinLeague) {
      this.props.onJoin?.();
      return;
    }
    const joined = await this.props.onJoinLeague({ league });
    if (!joined) return;
    this.setState((state) => ({ joinedLeagueIds: { ...state.joinedLeagueIds, [id]: true } }));
    this.showToast('League joined successfully');
  };

  loadChallenges = async () => {
    if (typeof this.props.onLoadChallenges !== 'function') return;
    const challenges = await this.props.onLoadChallenges();
    this.safeSetState({ challenges });
  };

  setChallengeField = (field, value) => this.setState(s => ({ challengeForm: { ...s.challengeForm, [field]: value } }));

  submitChallenge = async () => {
    const { fightId, opponent, stake } = this.state.challengeForm;
    const amount = Math.floor(Number(stake) || 0);
    const limits = this.props.features?.headToHead || {};
    if (!fightId) { this.showToast('Pick the fight you are wagering on'); return; }
    if (!opponent.trim()) { this.showToast('Who are you challenging?'); return; }
    if (amount < (limits.minStake || 1) || amount > (limits.maxStake || 5000)) {
      this.showToast(`Stake must be ${limits.minStake || 1}–${limits.maxStake || 5000} FM`);
      return;
    }
    this.safeSetState({ challengeBusy: 'create' });
    const result = await this.props.onCreateChallenge({ fightId, opponent: opponent.trim(), stake: amount });
    this.safeSetState({ challengeBusy: null });
    if (!result?.ok) { this.showToast(result?.message || 'Could not send that challenge'); return; }
    this.playBell();
    this.safeSetState({ modal: null, challengeForm: { fightId: '', opponent: '', stake: '' } });
    this.showToast('Challenge sent — ' + amount + ' FM held until they answer');
    this.loadChallenges();
  };

  answerChallenge = async (id, accept) => {
    this.safeSetState({ challengeBusy: id });
    const result = await this.props.onRespondToChallenge({ id, accept });
    this.safeSetState({ challengeBusy: null });
    if (!result?.ok) { this.showToast(result?.message || 'Could not answer that challenge'); return; }
    if (accept) this.playBell();
    this.showToast(accept ? 'Challenge accepted — good luck' : 'Challenge declined, stake returned');
    this.loadChallenges();
  };

  loadAwards = async () => {
    if (typeof this.props.onLoadAwards !== 'function') return;
    const result = await this.props.onLoadAwards();
    this.safeSetState({ awards: result?.awards || [], awardTitles: result?.titles || [] });
  };

  loadWaitlistStatus = async () => {
    if (typeof this.props.onLoadWaitlistStatus !== 'function') return;
    const status = await this.props.onLoadWaitlistStatus('head-to-head');
    this.safeSetState({ h2hWaitlist: { joined: Boolean(status?.joined), total: Number(status?.total) || 0 } });
  };

  joinH2HWaitlist = async () => {
    if (typeof this.props.onJoinWaitlist !== 'function') {
      this.showToast('Waitlist is unavailable right now');
      return;
    }
    const email = String(this.state.h2hWaitlistEmail || this.props.currentUser?.email || '').trim();
    if (!this.props.currentUser?.email && !email) {
      this.showToast('Add your email so we can tell you when it opens');
      return;
    }
    this.safeSetState({ h2hWaitlistBusy: true });
    const result = await this.props.onJoinWaitlist({
      feature: 'head-to-head',
      email,
      name: this.props.currentUser?.playerName || '',
      wagerBand: this.state.h2hWaitlistBand,
    });
    this.safeSetState({ h2hWaitlistBusy: false });
    if (!result?.ok) {
      this.showToast(result?.message || 'Could not join the waitlist');
      return;
    }
    this.playBell();
    this.safeSetState(s => ({
      h2hWaitlist: { joined: true, total: Number(result.total) || s.h2hWaitlist.total + 1 },
      modal: null,
    }));
    this.showToast(result.message || "You're on the list");
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
      if (event) { this.openModal('aiScout', event); return; }
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
    // Guest with picks in hand: ask in-app and resume this exact entry after,
    // rather than routing out and losing what they built.
    if (!this.props.currentUser) {
      this.openAuth({ type: 'enterEvent', event: ev });
      return;
    }
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

  saveStreak = async () => {
    const cost = this.state.isSubscribed ? 25 : 50;
    if (this.state.coins < cost) { this.showToast('Not enough FM coins to save your streak'); this.openModal('addcoins'); return; }
    if (!this.props.onSaveStreak) { this.showToast('Streak save is waiting for the server action'); return; }
    const result = await this.props.onSaveStreak({ cost });
    if (!result?.ok) { this.showToast(result?.message || 'Streak save could not be completed'); return; }
    this.playBell();
    this.safeSetState(s => ({ coins: Number.isFinite(Number(result.coins)) ? Number(result.coins) : s.coins - cost, streakExpiresIn: toSafeNumber(result.streakExpiresIn, 24 * 3600) }));
    this.showToast(`🔥 Streak saved for ${cost} FM — timer reset!`);
  };

  unlockNextReward = async () => {
    if (this.state.coins < 75) { this.showToast('Not enough FM coins to skip the wait'); this.openModal('addcoins'); return; }
    if (!this.props.onSkipWait) { this.showToast('Skip-the-wait is waiting for the server action'); return; }
    const result = await this.props.onSkipWait({ cost: 75 });
    if (!result?.ok) { this.showToast(result?.message || 'Skip-the-wait could not be completed'); return; }
    this.playCheer(); this.playBell();
    this.safeSetState(s => ({
      coins: Number.isFinite(Number(result.coins)) ? Number(result.coins) : s.coins,
      rewardClaimed: false,
      streakDay: Math.min(7, s.streakDay + 1),
      chestBounce: s.chestBounce + 1,
      streakExpiresIn: 24 * 3600,
    }));
    this.showToast('⚡ Skipped the wait — next reward unlocked for 75 FM!');
  };

  subscribeFmPlus = () => {
    if (this.props.onSubscribe) {
      this.props.onSubscribe({ plan: 'pass' });
      return;
    }
    this.showToast('FM+ checkout is temporarily unavailable');
  };

  claimReward = async () => {
    if (this.state.rewardClaimed) return;
    if (!this.props.onClaimReward) { this.showToast('Daily rewards are waiting for the server action'); return; }
    const result = await this.props.onClaimReward();
    if (!result?.ok) { this.showToast(result?.message || 'Reward could not be claimed'); return; }
    this.playCheer(); this.playBell();
    this.safeSetState(s => ({
      coins: Number.isFinite(Number(result.coins)) ? Number(result.coins) : s.coins,
      rewardClaimed: true,
      streakDay: Math.min(7, s.streakDay + 1),
      chestBounce: s.chestBounce + 1,
      streakExpiresIn: 24 * 3600,
    }));
    this.fireConfetti();
    this.showToast(result.message || 'Reward claimed!');
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

  setBillingField = (field, value) => this.setState((state) => ({
    billing: { ...state.billing, [field]: value },
  }));

  setProfileField = (field, value) => this.setState((state) => ({
    profileDraft: { ...state.profileDraft, [field]: value },
  }));

  // Seed the draft from the live player before showing the sheet, so the fields
  // are pre-filled rather than blank.
  openEditProfile = () => {
    this.playTap();
    const p = this.props.player || {};
    this.safeSetState({
      profileDraft: {
        playerName: p.playerName || this.props.playerName || '',
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        phone: p.phone || '',
      },
    });
    this.openEditProfile();
  };

  saveProfile = async () => {
    const d = this.state.profileDraft;
    if (!String(d.playerName || '').trim()) { this.showToast('Pick a display name'); return; }
    this.safeSetState({ profileBusy: true });
    const result = typeof this.props.onSaveProfile === 'function'
      ? await this.props.onSaveProfile({
        playerName: d.playerName.trim(),
        firstName: String(d.firstName || '').trim(),
        lastName: String(d.lastName || '').trim(),
        phone: String(d.phone || '').trim(),
      })
      : { ok: false, message: 'Profile saving is not available right now.' };
    this.safeSetState({ profileBusy: false });
    if (result?.ok === false) { this.showToast(result.message || 'Could not save your profile'); return; }
    this.closeModal();
    this.showToast('\u2713 Profile updated');
  };

  continueCartCheckout = () => {
    if (!this.state.cart.length) {
      this.openModal('addcoins');
      return;
    }
    // Collect the billing address before handing off to the gateway. Skipping it
    // is how a card gets declined on address verification with no explanation.
    this.playTap();
    this.openModal('billing');
  };

  submitCheckout = async () => {
    const b = this.state.billing;
    const required = [['firstName', 'First name'], ['lastName', 'Last name'],
      ['address', 'Street address'], ['city', 'City'], ['state', 'State'], ['zipCode', 'ZIP code']];
    const missing = required.filter(([key]) => !String(b[key] || '').trim()).map(([, label]) => label);
    if (missing.length) { this.showToast('Still needed: ' + missing.join(', ')); return; }

    this.safeSetState({ checkoutBusy: true });
    const result = await this.props.onPurchaseCoins?.({
      product: 'fm-coins',
      items: this.state.cart.map(({ sku, quantity }) => ({ sku, quantity })),
      billing: {
        firstName: b.firstName.trim(),
        lastName: b.lastName.trim(),
        address: b.address.trim(),
        city: b.city.trim(),
        state: b.state.trim().toUpperCase(),
        zipCode: b.zipCode.trim(),
        country: b.country || 'US',
      },
    });
    this.safeSetState({ checkoutBusy: false });

    // On success the browser is already navigating to the payment page, so there
    // is nothing to show. Only a failure needs a message.
    if (result && result.ok === false) {
      this.showToast(result.message || 'Could not start checkout');
    }
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

  markNotifsRead = async () => {
    const succeeded = this.props.onMarkNotificationsRead ? await this.props.onMarkNotificationsRead() : true;
    if (succeeded !== false) this.setState(s => ({ notifCount: 0, notifications: s.notifications.map(item => ({ ...item, read: true, isRead: true })) }));
  };

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
  openSocialProfile = (platform) => {
    const href = SOCIAL_PROFILE_URLS[platform];
    if (!href || typeof window === 'undefined') return;
    window.open(href, '_blank', 'noopener,noreferrer');
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
    // Was date-only (dropped a fight from the whole home screen — including
    // both featured slots — the instant its scheduled start time passed, even
    // while still marked Ongoing). Only a settled/finished fight is actually done.
    const eventsUpcoming = eventsRaw.filter(ev => !ev.settled && String(ev.matchStatus || '').toLowerCase() !== 'finished');
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
      const inSport = events.filter((event) => event.sport === sport.id);
      sport.count = String(inSport.length);

      // Soonest first, undated last — the next fight in the discipline is the one
      // worth showing, and it changes every time a nearer fight is added.
      const next = [...inSport].sort((a, b) => {
        if (!a.iso) return 1;
        if (!b.iso) return -1;
        return String(a.iso).localeCompare(String(b.iso));
      })[0];

      // Only real uploaded imagery. Anything empty falls through to the static
      // discipline art inside MobileImageSlot, so a fight with no picture never
      // leaves an empty circle.
      // Every fighter picture uploaded to this discipline, soonest fight first.
      // Both corners count, so a card of five bouts offers up to ten faces.
      const gallery = [];
      [...inSport].sort((a, b) => {
        if (!a.iso) return 1;
        if (!b.iso) return -1;
        return String(a.iso).localeCompare(String(b.iso));
      }).forEach((event) => {
        [[event.featuredFightFighterAImage, event.f1],
         [event.featuredFightFighterBImage, event.f2],
         [event.featuredThisWeekImage, event.f1]].forEach(([photo, name]) => {
          if (photo && !gallery.some((entry) => entry.photo === photo)) gallery.push({ photo, name });
        });
      });

      sport.gallery = gallery;
      // The cycle index is one shared counter, so all five circles advance in
      // step and each wraps within its own gallery length.
      const frame = gallery.length ? gallery[s.sportCycle % gallery.length] : null;
      sport.photo = frame ? frame.photo : '';
      sport.nextFighter = frame ? frame.name : (next ? next.f1 : '');
    });
    const filteredEvents = s.activeSport === 'all' ? events : events.filter(e => e.sport === s.activeSport);

    const liveLeaderboard = Array.isArray(this.props.leaderboard)
      ? this.props.leaderboard.map((row, index) => ({
          rank: Number(row.rank || index + 1),
          name: cleanText(row.displayName, row.playerName, row.username, row.name, `Player ${index + 1}`),
          pts: Number(row.totalPoints ?? row.points ?? row.score ?? 0).toLocaleString(),
          medal: index === 0 ? '#f2b544' : index === 1 ? '#c9ccd1' : index === 2 ? '#c9772e' : null,
          you: cleanText(row._id, row.id) && cleanText(row._id, row.id) === cleanText(this.props.currentUser?._id, this.props.currentUser?.id),
          delta: Number(row.rankMovement ?? row.delta ?? row.rankDelta ?? 0) || 0,
          tier: cleanText(row.tier, row.skillTier, row.playerTier).toLowerCase(),
          avatar: resolveLiveMedia(row.avatar, row.profileImage, row.image),
          title: cleanText(row.championTitle, row.title, row.seasonTitle),
          isChampion: Boolean(row.isChampion || row.champion || row.championTitle),
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

    const coinsFmt = s.displayCoins.toLocaleString();
    const fightIqXp = toSafeNumber(this.props.currentUser?.fightIqXp, this.props.currentUser?.xp);
    const fightIqTarget = toSafeNumber(this.props.currentUser?.nextFightIqXp, this.props.currentUser?.nextLevelXp);
    const xpPct = s.xpMounted && fightIqTarget > 0 ? Math.min(100, (fightIqXp / fightIqTarget) * 100) : 0;

    const activeView = React.createElement('div', {
      key: s.activeTab,
      className: `fmm-prototype-view fmm-prototype-view--${s.activeTab}`,
      style: { animation: 'tabFadeIn .22s ease-out both' },
    },
      s.activeTab === 'home' && this.renderHome(sports, filteredEvents, events, leaderboardFull, apparel, blogs, streakDays, jonesPct, aspinallPct, dashArray, dashOffset, xpPct, s),
      s.activeTab === 'contests' && this.renderContests(sports, filteredEvents, s),
      s.activeTab === 'leaderboard' && this.renderLeaderboard(leaderboardFull, s),
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
      'data-design-width': DESIGN_WIDTH,
      style: { position: 'relative', width: '100%', height: '100dvh', maxHeight: '100dvh', minHeight: 620, background: designTokens.color.bg, color: designTokens.color.textPrimary, overflow: 'hidden', fontFamily: designTokens.font.body, display: 'flex', flexDirection: 'column' }
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
      s.refundPending && React.createElement('div', {
        style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 950 }
      },
        React.createElement('div', { style: { width: '100%', background: '#12141c', border: '1px solid rgba(239,68,68,.5)', borderRadius: 14, padding: 18 } },
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 17, color: '#ef4444', marginBottom: 6 } }, 'REFUND THIS FIGHT?'),
          React.createElement('div', { style: { fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,.75)', lineHeight: 1.55, marginBottom: 4 } }, s.refundPending.name),
          React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', lineHeight: 1.6, marginBottom: 14 } },
            (s.refundPending.players || 0) + ' players will each get back exactly what they paid. The pot drops to zero. This cannot be undone from here.'),
          React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement('div', {
              onClick: this.cancelRefund,
              style: { flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 9, fontSize: 11.5, fontWeight: 900, cursor: 'pointer', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)' }
            }, 'KEEP ENTRIES'),
            React.createElement('div', {
              onClick: this.runRefund,
              style: { flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 9, fontSize: 11.5, fontWeight: 900, cursor: 'pointer', background: s.refundBusy ? 'rgba(239,68,68,.35)' : '#ef4444', color: '#fff' }
            }, s.refundBusy ? 'REFUNDING…' : 'YES, REFUND ALL')
          )
        )
      ),
      s.confetti && React.createElement('div', { style: { position: 'absolute', inset: 0, zIndex: 900, overflow: 'hidden', pointerEvents: 'none' } },
        s.confetti.map(piece => React.createElement('div', { key: piece.id, style: { position: 'absolute', left: piece.left + '%', top: -12, width: 7, height: 12, borderRadius: 2, background: piece.color, animation: `confettiFall ${piece.dur}s ease-in ${piece.delay}s both` } }))
      ),
      s.liveActivity && React.createElement('div', { style: { position: 'absolute', left: 16, right: 16, top: 64, zIndex: 480, padding: '9px 12px', borderRadius: 10, background: 'rgba(12,14,20,.95)', border: '1px solid rgba(34,197,94,.35)', boxShadow: '0 10px 26px rgba(0,0,0,.45)', color: '#dfffea', fontSize: 10.5, fontWeight: 800, animation: 'liveToastIn 4.2s ease both' } }, '● ', s.liveActivity),
      s.idleNudgeShown && s.activeTab === 'home' && React.createElement('div', { onClick: () => this.setState({ idleNudgeShown: false }, () => this.setTab('contests')), style: { position: 'absolute', left: 16, right: 16, bottom: 92, zIndex: 470, padding: '12px 14px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(77,141,255,.96),rgba(168,85,247,.96))', boxShadow: '0 12px 28px rgba(77,141,255,.35)', color: '#fff', cursor: 'pointer', animation: 'liveToastIn .3s ease both' } },
        React.createElement('div', { style: { fontSize: 12, fontWeight: 900 } }, 'READY TO MAKE YOUR FIRST PICK?'),
        React.createElement('div', { style: { fontSize: 10, fontWeight: 700, opacity: .8 } }, 'See every published fight card ›')
      ),
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
            border: '1px solid rgba(242,181,68,.5)', borderRadius: 999, padding: '6px 10px', cursor: 'pointer',
            animation: this.state.walletFlash ? 'walletFlash .7s ease' : 'none'
          }
        },
          React.createElement('div', { style: { width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#ffe08a,#a8720f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#3a2500' } }, 'FM'),
          React.createElement('span', { style: { fontWeight: 700, fontSize: 13, animation: 'moneyPulseGold 1.8s ease-in-out infinite' } }, coinsFmt),
          React.createElement('div', { style: { width: 16, height: 16, borderRadius: '50%', background: '#f2b544', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#3a2500' } }, '+')
        ),
        React.createElement('div', {
          onClick: () => this.setTab('cart'),
          'aria-label': 'Open FM coin cart',
          style: { position: 'relative', width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: this.state.bellWiggle ? 'bellWiggle .6s ease' : 'none' }
        },
          React.createElement('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#f2b544', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            React.createElement('circle', { cx: 9, cy: 21, r: 1 }),
            React.createElement('circle', { cx: 20, cy: 21, r: 1 }),
            React.createElement('path', { d: 'M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6' })
          ),
          this.state.cart.length > 0 && React.createElement('div', { style: { position: 'absolute', top: -4, right: -4, background: '#f2b544', color: '#2b1b00', fontSize: 10, fontWeight: 900, borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, this.state.cart.reduce((total, item) => total + item.quantity, 0))
        ),
        React.createElement('div', {
          onClick: this.openNotifications,
          style: { position: 'relative', width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
        },
          React.createElement('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 2 },
            React.createElement('path', { d: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9' }),
            React.createElement('path', { d: 'M13.73 21a2 2 0 01-3.46 0' })
          ),
          notifCount > 0 && React.createElement('div', { style: { position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulseLive 1.2s ease-in-out infinite' } }, notifCount)
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
          this.renderBoldHero(s),
          this.renderStorySports(sports),
          this.renderBento(jonesPct, aspinallPct, dashOffset, xpPct, s, bannerEvent),
          this.renderFeaturedDetail(s, bannerEvent),
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
      this.renderDeadWeekShadowBanner(allEvents, s),
      this.renderStartHere(allEvents, s),
      this.renderMyEntries(allEvents, s),
      this.renderWatchLeaguesPromo(),
      React.createElement('div', {
        style: { margin: '0 16px 12px', textAlign: 'center', padding: '9px 10px 10px', borderRadius: 10, background: '#16a34a', border: '1.5px solid #22c55e', color: '#fff', fontWeight: 900, fontSize: 10, boxShadow: '0 0 14px rgba(34,197,94,.55)', position: 'relative' }
      },
        React.createElement('div', { style: { position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, padding: '3px 10px', borderRadius: 999, animation: 'pulseLive 1s infinite', boxShadow: '0 0 10px rgba(239,68,68,.8)', whiteSpace: 'nowrap' } }, 'NEW HERE?'),
        React.createElement('div', { style: { color: '#eaffef', marginTop: 2, marginBottom: 8, fontSize: 9.5, letterSpacing: .2 } }, 'NO COINS NEEDED — TRY IT OR JOIN FREE'),
        // Two explicit buttons. Both are 46px+ tap targets so neither depends on
        // the panel being tappable, and nothing is discoverable only by guessing.
        React.createElement('div', { style: { display: 'flex', gap: 7 } },
          React.createElement('div', {
            onClick: () => this.setTab('demo'),
            role: 'button', tabIndex: 0,
            'aria-label': 'Try a free demo fight',
            onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') this.setTab('demo'); },
            style: {
              // 44px is the floor for a comfortable tap target — the panel shrinks
              // around the buttons rather than shrinking the buttons themselves.
              flex: 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 10px', borderRadius: 999, cursor: 'pointer',
              background: 'rgba(255,255,255,.16)', border: '1.5px solid rgba(255,255,255,.55)',
              color: '#fff', fontFamily: "'Anton',sans-serif", fontSize: 12, letterSpacing: .3,
              whiteSpace: 'nowrap',
            },
          }, 'TRY DEMO'),
          React.createElement('div', {
            onClick: () => this.openModal('join'),
            role: 'button', tabIndex: 0,
            'aria-label': 'Join Fantasy MMAdness free',
            onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') this.openModal('join'); },
            style: {
              flex: 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 10px', borderRadius: 999, cursor: 'pointer',
              background: 'linear-gradient(90deg,#f2b544,#df111b)', color: '#fff',
              fontFamily: "'Anton',sans-serif", fontSize: 12, letterSpacing: .3,
              boxShadow: '0 4px 14px rgba(223,17,27,.4)', whiteSpace: 'nowrap',
            },
          }, 'PLAY FREE')
        )
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
  countdownColor = (countdown = '') => {
    const days = Number.parseInt(String(countdown), 10);
    if (!Number.isFinite(days)) return 'rgba(255,255,255,.55)';
    if (days <= 1) return '#ef4444';
    if (days <= 3) return '#f2b544';
    return '#22c55e';
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

  renderDeadWeekShadowBanner(events, s) {
    const sevenDaysFromNow = Date.now() + (7 * 86400000);
    const hasNearFight = (events || []).some(event => {
      const date = dateOnlyToLocalDate(event.iso, event.matchTime || '23:59');
      return date && date.getTime() >= Date.now() && date.getTime() <= sevenDaysFromNow;
    });
    if (hasNearFight || !s.shadowFights.length) return null;
    const shadow = normalizeLiveEvent(s.shadowFights[0]);
    if (!shadow.backendId || !shadow.f1 || !shadow.f2) return null;
    return React.createElement('div', { onClick: () => this.openEvent(shadow), style: { margin: '0 16px 16px', borderRadius: 15, overflow: 'hidden', position: 'relative', minHeight: 116, border: '1px solid rgba(168,85,247,.6)', boxShadow: '0 0 24px rgba(168,85,247,.22)', cursor: 'pointer' } },
      React.createElement('img', { src: `${ASSET_BASE}/mma-arena-bg-sm.png`, alt: '', loading: 'lazy', decoding: 'async', style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .42 } }),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(5,6,10,.97),rgba(5,6,10,.66))' } }),
      React.createElement('div', { style: { position: 'relative', padding: 14 } },
        React.createElement('div', { style: { color: '#c084fc', fontSize: 9.5, fontWeight: 900, letterSpacing: .9 } }, 'SHADOW FIGHT · AVAILABLE NOW'),
        React.createElement('div', { style: { fontFamily: designTokens.font.heading, fontSize: 20, margin: '5px 0 3px' } }, shadow.f1, React.createElement('span', { style: { color: '#ef4444' } }, ' VS '), shadow.f2),
        React.createElement('div', { style: { color: 'rgba(255,255,255,.56)', fontSize: 10, fontWeight: 700 } }, 'Keep your Fight IQ moving between live event weeks.'),
        React.createElement('div', { style: { marginTop: 9, color: '#f2b544', fontSize: 10.5, fontWeight: 900 } }, 'OPEN FIGHT CARD ›')
      )
    );
  }

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
    return React.createElement('div', { style: { margin: '0 16px 16px', padding: 14, borderRadius: 14, position: 'relative', overflow: 'hidden', background: `linear-gradient(90deg,#000 35%,rgba(0,0,0,.72) 62%,rgba(0,0,0,.15)),url(${ASSET_BASE}/pick-winner-fighter-sm.png) right center / auto 100% no-repeat,#000`, border: '1.5px solid rgba(242,181,68,.5)' } },
      React.createElement('div', { style: { maxWidth: '68%', fontSize: 9.5, fontWeight: 900, letterSpacing: 1, color: '#f2b544', marginBottom: 6 } }, 'START HERE · STEP 1 OF 1'),
      React.createElement('div', { style: { maxWidth: '68%', fontFamily: "'Anton',sans-serif", fontSize: 19, lineHeight: 1.15, marginBottom: 5 } }, 'PICK A WINNER. THAT’S IT.'),
      React.createElement('div', { style: { maxWidth: '68%', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', lineHeight: 1.55, marginBottom: 11 } }, 'One tap gets you in. Stats and bonus points come later.'),
      React.createElement('div', {
        onClick: () => this.openEvent(first),
        style: { display: 'inline-block', maxWidth: '68%', textAlign: 'center', padding: '8px 16px', borderRadius: 999, background: 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 900, fontSize: 11, letterSpacing: .6, cursor: 'pointer', boxShadow: '0 6px 22px rgba(242,181,68,.35)' },
      }, 'MAKE MY FIRST PICK'),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 5, maxWidth: '72%', marginTop: 9, fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.4)' } },
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
    const totalPrize = toSafeNumber(this.props.stats?.totalPrizePool, this.props.stats?.prizePool);
    return React.createElement('div', { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '0 16px 10px' } },
      ['classic', 'bold'].map(l => React.createElement('div', {
        key: l, onClick: () => this.setLayout(l),
        style: {
          padding: '6px 16px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap',
          background: s.layout === l ? 'linear-gradient(90deg,#f2b544,#ef4444)' : 'rgba(255,255,255,.06)',
          color: s.layout === l ? '#1a0e00' : 'rgba(255,255,255,.5)', border: '1px solid ' + (s.layout === l ? 'transparent' : 'rgba(255,255,255,.1)')
        }
      }, l === 'classic' ? 'CLASSIC' : '⚡ BOLD')),
      s.layout === 'bold' && totalPrize > 0 && React.createElement('div', { style: { background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.4)', borderRadius: 999, padding: '6px 14px', fontSize: 10, fontWeight: 800, color: '#22c55e', whiteSpace: 'nowrap' } }, `$${totalPrize.toLocaleString()} PRIZES`)
    );
  }

  renderBoldHero(s) {
    return React.createElement('div', { style: { position: 'relative', margin: '0 16px 14px', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(242,181,68,.3)', background: '#000' } },
      React.createElement('img', { src: `${ASSET_BASE}/bold-hero-new.jpg`, alt: 'Fantasy MMAdness combat prediction game', width: 1983, height: 793, loading: 'lazy', decoding: 'async', style: { width: '100%', height: 'auto', aspectRatio: '16 / 9', display: 'block', objectFit: 'contain' } }),
      React.createElement('div', { style: { position: 'absolute', top: 0, bottom: 0, width: '35%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent)', animation: 'heroGloss 3.5s ease-in-out infinite', pointerEvents: 'none' } }),
      React.createElement('div', { style: { position: 'absolute', bottom: 16, right: 16 } },
        React.createElement('div', { onClick: () => this.openModal('join'), style: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 999, background: 'linear-gradient(90deg,#ffd873,#f2b544,#ffe9a8,#f2b544,#ffd873)', backgroundSize: '200% 100%', animation: 'shimmerBtn 2.5s linear infinite, joinGlow 2s ease-in-out infinite' + (s.showWelcomePulse ? ', welcomeRing 1.4s ease-out infinite' : ''), color: '#2b1b00', fontWeight: 900, fontSize: 11, cursor: 'pointer' } }, 'JOIN FREE »')
      )
    );
  }

  renderStorySports(sports) {
    return React.createElement('div', { style: { display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px 16px' } },
      sports.map((sp, sportIndex) => React.createElement('div', {
        key: sp.id, onClick: () => this.setSport(sp.id),
        style: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', animation: `iconPopIn .45s ease-out ${sportIndex * .08}s backwards` }
      },
        React.createElement('div', {
          style: {
            width: 84, height: 84, borderRadius: '50%', padding: 2,
            background: sp.active ? 'linear-gradient(135deg,#f2b544,#ef4444,#a855f7)' : 'linear-gradient(135deg,rgba(255,255,255,.15),rgba(255,255,255,.05))',
            animation: sp.active ? 'iconBreathe 2.2s ease-in-out infinite' : 'none'
          }
        },
          React.createElement('div', { style: { width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '1px solid #05060a', background: '#000' } },
            React.createElement('div', {
              // Keying on the photo remounts on every change, which is what
              // makes the fade-in fire. Class carries the animation.
              key: sp.photo || sp.id,
              className: 'fmm-sport-cycle-frame',
              style: { width: '100%', height: '100%' },
            },
              React.createElement(MobileImageSlot, {
                id: 'story-' + sp.id,
                // Cutout first so the fighter reads as a figure, not a
                // photograph in a circle; the original is the fallback if the
                // transform is unavailable.
                src: (sp.photo && cloudinaryCutout(sp.photo)) || sp.photo || undefined,
                fallbackSrc: sp.photo || undefined,
                shape: 'circle',
                placeholder: sp.nextFighter || sp.name,
                fit: 'cover',
              })
            )
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
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'progression-bg', shape: 'rect', placeholder: 'Boxing gloves photo', fit: 'cover', src: 'progression-bg-opt.jpg' })),
        React.createElement('div', { style: { position: 'relative' } },
        React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: '#f2b544' } }, `FIGHT IQ${toSafeNumber(this.props.currentUser?.fightIqLevel, this.props.currentUser?.level) ? ` · LVL ${toSafeNumber(this.props.currentUser?.fightIqLevel, this.props.currentUser?.level)}` : ''}`),
        React.createElement('div', { style: { fontSize: 16, fontWeight: 800, color: '#c084fc' } }, `${toSafeNumber(this.props.currentUser?.fightIqXp, this.props.currentUser?.xp).toLocaleString()} XP`),
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
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: s.rewardClaimed ? '#22c55e' : '#f2b544' } }, s.rewardClaimed ? 'CLAIMED ✓' : 'CLAIM REWARD')
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
        React.createElement('div', { style: { height: 140, position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 10, background: '#000' } },
          React.createElement(MobileImageSlot, { id: 'bold-event-poster-' + ev.id, shape: 'rect', placeholder: ev.f1 + ' vs ' + ev.f2 + ' poster', fit: 'contain', src: ev.image, fallbackSrc: ev.fallbackImage })
        ),
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
    return React.createElement('div', { className: 'fmm-app-hero', style: { position: 'relative', width: '100%', overflow: 'hidden', background: '#000' } },
      React.createElement('picture', null,
        React.createElement('source', { media: '(max-width: 767px)', srcSet: `${ASSET_BASE}/hero-banner-v2-mobile.jpg`, width: 900, height: 507 }),
        React.createElement('img', {
          src: `${ASSET_BASE}/hero-banner-v2.jpg`,
          alt: 'Fantasy MMAdness — boxing, UFC, kickboxing, bare knuckle and pro wrestling prediction game',
          width: 1600,
          height: 900,
          loading: 'eager',
          decoding: 'async',
          fetchPriority: 'high',
          // Shape and cropping live in CSS (.fmm-app-hero img) so phones can use
          // a taller box than desktop. Inline aspect-ratio would override it.
          style: { width: '100%', display: 'block' },
        })
      ),
      React.createElement('div', { style: { position: 'absolute', top: 0, bottom: 0, width: '34%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent)', animation: 'heroGloss 3.8s ease-in-out infinite', pointerEvents: 'none' } }),
      // PLAY FREE used to sit ON the artwork, covering the bottom of the banner.
      // It now lives directly beneath it — same prominence, nothing obscured.
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
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'promo-watch-bg', shape: 'rect', placeholder: 'Stadium photo', fit: 'cover', src: 'watch-party-bg-opt.jpg' })),
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
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'promo-leagues-bg', shape: 'rect', placeholder: 'Friends watching fight photo', fit: 'cover', src: 'leagues-bg-opt.jpg' })),
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
    const viewerCount = toSafeNumber(liveEvent?.viewerCount, s.watchViewers);
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
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'watch-stadium-bg', shape: 'rect', placeholder: 'Stadium crowd photo', fit: 'cover', src: 'watch-party-bg-opt.jpg' })),
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
        React.createElement('div', { style: { flex: 1, fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#ef4444' } }, liveEvent ? 'LIVE · ' + liveEvent.tag : 'WATCH PARTY · WAITING FOR LIVE FIGHT'),
        viewerCount > 0 && React.createElement('div', { style: { padding: '4px 8px', borderRadius: 999, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', color: '#ff9b9b', fontSize: 9, fontWeight: 900, fontVariantNumeric: 'tabular-nums' } }, `● ${viewerCount.toLocaleString()} WATCHING`)
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

  // Head-to-Head is not built. The leagues screen is titled "LEAGUES &
  // HEAD-TO-HEAD", so it has to say something honest about the second half:
  // this records interest instead of offering a challenge flow with no backend.
  renderH2HWaitlistCard(s) {
    // Live when the server says the feature is on; otherwise the waitlist below.
    if (this.props.features?.headToHead?.enabled) return this.renderH2HLive(s);
    return React.createElement('div', {
      key: 'h2h-waitlist',
      style: {
        marginTop: 20,
        background: 'linear-gradient(160deg,rgba(168,85,247,.16),rgba(5,6,10,.5))',
        border: '1px solid rgba(168,85,247,.4)', borderRadius: 14, padding: 16
      }
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)' } }, 'HEAD-TO-HEAD'),
        React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: '#a855f7', border: '1px solid rgba(168,85,247,.5)', borderRadius: 999, padding: '2px 8px', letterSpacing: .5 } }, 'IN DEVELOPMENT')
      ),
      React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 17, lineHeight: 1.15, marginBottom: 6 } }, 'CHALLENGE ONE PLAYER, HEAD TO HEAD'),
      React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', lineHeight: 1.5, marginBottom: 12 } },
        'Pick a friend, pick a fight, stake coins against them alone. We are building it next — tell us you want it and you will be first in when it opens.'
      ),
      s.h2hWaitlist.total > 0 && React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#f2b544', marginBottom: 10 } },
        '\ud83d\udd25 ' + s.h2hWaitlist.total.toLocaleString() + (s.h2hWaitlist.total === 1 ? ' player wants this' : ' players want this')
      ),
      s.h2hWaitlist.joined
        ? React.createElement('div', {
            style: { textAlign: 'center', padding: '11px 0', borderRadius: 999, background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.5)', color: '#22c55e', fontWeight: 900, fontSize: 12 }
          }, "\u2713 YOU'RE ON THE LIST")
        : React.createElement('div', {
            onClick: () => this.openModal('h2hWaitlist'),
            style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: '#a855f7', fontWeight: 900, fontSize: 12.5, cursor: 'pointer', boxShadow: '0 0 14px rgba(168,85,247,.45)' }
          }, 'NOTIFY ME WHEN IT OPENS')
    );
  }

  renderH2HLive(s) {
    const statusCopy = {
      PENDING: ['Waiting on them', '#f2b544'],
      ACCEPTED: ['Live — settles when the fight is scored', '#22c55e'],
      DECLINED: ['Declined · stake returned', 'rgba(255,255,255,.45)'],
      EXPIRED: ['Expired · stake returned', 'rgba(255,255,255,.45)'],
      SETTLED: ['Settled', '#22c55e'],
      VOID: ['Void · stake returned', 'rgba(255,255,255,.45)'],
    };
    const outcomeCopy = { won: ['\u2713 You won', '#22c55e'], lost: ['You lost', 'rgba(255,255,255,.45)'], tie: ['Draw · stake returned', '#f2b544'] };

    return React.createElement('div', {
      key: 'h2h-live',
      style: { marginTop: 20, background: 'linear-gradient(160deg,rgba(168,85,247,.14),rgba(5,6,10,.5))', border: '1px solid rgba(168,85,247,.4)', borderRadius: 14, padding: 16 }
    },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)' } }, 'HEAD-TO-HEAD'),
        React.createElement('div', {
          onClick: () => this.openModal('newChallenge'),
          style: { fontSize: 11, fontWeight: 900, color: '#a855f7', cursor: 'pointer' }
        }, '+ CHALLENGE')
      ),
      s.challenges.length === 0
        ? React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', lineHeight: 1.5 } },
            'No challenges yet. Pick a fight you have already scored, name a player, and stake coins against them one-on-one.'
          )
        : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
            s.challenges.map(c => React.createElement('div', {
              key: c.id, style: { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 12 }
            },
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 } },
                React.createElement('div', { style: { fontWeight: 800, fontSize: 13 } }, (c.direction === 'sent' ? 'vs ' : 'from ') + c.opponentName),
                React.createElement('div', { style: { fontSize: 11, fontWeight: 900, color: '#f2b544' } }, c.stake.toLocaleString() + ' FM')
              ),
              c.fight && React.createElement('div', { style: { fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.45)', marginBottom: 4 } },
                c.fight.fighterA + ' vs ' + c.fight.fighterB
              ),
              React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: (c.outcome ? outcomeCopy[c.outcome] : statusCopy[c.status] || ['', '#fff'])[1] } },
                (c.outcome ? outcomeCopy[c.outcome] : statusCopy[c.status] || ['', ''])[0]
                + (c.status === 'SETTLED' && c.myPoints !== null ? '  \u00b7  ' + c.myPoints + ' vs ' + c.theirPoints + ' pts' : '')
                + (c.outcome === 'won' && c.payout ? '  \u00b7  +' + c.payout.toLocaleString() + ' FM' : '')
              ),
              c.status === 'PENDING' && c.direction === 'received' && React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
                React.createElement('div', {
                  onClick: () => { if (s.challengeBusy !== c.id) this.answerChallenge(c.id, true); },
                  style: { flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, background: '#22c55e', color: '#06210f', fontWeight: 900, fontSize: 11, cursor: 'pointer', opacity: s.challengeBusy === c.id ? .6 : 1 }
                }, 'ACCEPT'),
                React.createElement('div', {
                  onClick: () => { if (s.challengeBusy !== c.id) this.answerChallenge(c.id, false); },
                  style: { flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, background: 'rgba(255,255,255,.08)', fontWeight: 900, fontSize: 11, cursor: 'pointer', opacity: s.challengeBusy === c.id ? .6 : 1 }
                }, 'DECLINE')
              ),
              c.status === 'PENDING' && c.direction === 'sent' && React.createElement('div', {
                onClick: () => { if (s.challengeBusy !== c.id) this.answerChallenge(c.id, false); },
                style: { marginTop: 8, textAlign: 'center', padding: '7px 0', borderRadius: 8, background: 'rgba(255,255,255,.06)', fontWeight: 900, fontSize: 10.5, cursor: 'pointer', color: 'rgba(255,255,255,.7)' }
              }, 'WITHDRAW · STAKE RETURNED')
            ))
          )
    );
  }

  // Promoter tools. A league owner had no way to reach the players they brought
  // in — this is the reach number, the announce button and the share kit in one
  // place. Renders only when the reach endpoint answered, which needs an
  // affiliate session, so players never see it.
  renderPromoterPanel(s, events) {
    const reach = s.promoterReach;
    if (!reach) return null;
    const myFights = (Array.isArray(events) ? events : []).slice(0, 6);

    return React.createElement('div', {
      key: 'promoter',
      style: {
        marginBottom: 14, padding: 13, borderRadius: 13,
        background: 'linear-gradient(160deg,rgba(168,85,247,.14),rgba(5,6,10,.55))',
        border: '1px solid rgba(168,85,247,.45)',
      },
    },
      React.createElement('div', { style: { fontSize: 9.5, fontWeight: 900, color: '#c084fc', letterSpacing: .5, marginBottom: 7 } }, 'YOUR LEAGUE · ' + String(reach.leagueName || '').toUpperCase()),

      // The three numbers that tell a promoter whether their league is alive.
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 11 } },
        [['MEMBERS', reach.members, '#fff'],
         ['PLAYING', reach.activeMembers, '#22c55e'],
         ['NEW · 7D', reach.joinedLast7Days, '#f2b544']].map(([label, value, color]) =>
          React.createElement('div', { key: label, style: { textAlign: 'center', padding: '7px 4px', borderRadius: 9, background: 'rgba(0,0,0,.3)' } },
            React.createElement('div', { style: { fontSize: 15, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' } }, Number(value || 0).toLocaleString()),
            React.createElement('div', { style: { fontSize: 7.5, fontWeight: 800, color: 'rgba(255,255,255,.45)', marginTop: 1 } }, label)
          ))
      ),

      myFights.length === 0
        ? React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 } },
            'Put a card up and you can announce it to your members from here.')
        : React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'TELL YOUR MEMBERS'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 7 } },
              myFights.map((fight) => React.createElement('div', {
                key: fight.id,
                style: { padding: 9, borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.11)' },
              },
                React.createElement('div', { style: { fontSize: 11.5, fontWeight: 800, marginBottom: 6 } }, fight.f1 + ' vs ' + fight.f2),
                React.createElement('div', { style: { display: 'flex', gap: 6 } },
                  React.createElement('div', {
                    onClick: () => { if (!s.promoterBusy) this.announceToLeague(fight.backendId || fight.id); },
                    role: 'button', tabIndex: 0,
                    style: {
                      flex: 1, minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8, background: '#a855f7', color: '#fff', fontWeight: 900, fontSize: 10,
                      cursor: 'pointer', opacity: s.promoterBusy ? .6 : 1, letterSpacing: .3,
                    },
                  }, s.promoterBusy ? 'SENDING…' : 'ANNOUNCE'),
                  React.createElement('div', {
                    onClick: () => this.openShareKit(fight.backendId || fight.id),
                    role: 'button', tabIndex: 0,
                    style: {
                      flex: 1, minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.3)',
                      color: '#fff', fontWeight: 900, fontSize: 10, cursor: 'pointer', letterSpacing: .3,
                    },
                  }, 'SHARE')
                )
              ))
            ),
            // Say plainly whether email is available — a promoter should not have
            // to guess why their last notice did not hit inboxes.
            React.createElement('div', { style: { marginTop: 9, fontSize: 9, fontWeight: 700, color: reach.emailAvailable ? '#22c55e' : '#f2b544', lineHeight: 1.5 } },
              reach.emailAvailable
                ? 'Announce reaches every member\u2019s notifications and their inbox.'
                : 'Email used recently \u2014 the next announce reaches notifications only, then email unlocks again in under ' + (reach.emailCooldownHours || 24) + 'h.'
            )
          )
    );
  }

  renderLeagues(s, events) {
    const leagues = Array.isArray(this.props.leagues) ? this.props.leagues : [];
    const users = Array.isArray(this.props.leagueUsers) ? this.props.leagueUsers : [];
    const userById = new Map(users.map((user) => [String(user?._id || user?.id || ''), user]));
    return React.createElement('div', { style: { padding: '8px 16px 24px', position: 'relative', overflow: 'hidden', minHeight: '100%' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'leagues-live-bg', shape: 'rect', placeholder: 'Fight league arena', fit: 'cover', src: 'leagues-bg-opt.jpg' })),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,6,10,.84),rgba(5,6,10,.99))' } }),
      React.createElement('div', { style: { position: 'relative' } },
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 24, marginBottom: 4, color: '#a855f7' } }, 'LEAGUES & HEAD-TO-HEAD'),
        this.renderPromoterPanel(s, events),
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
            })),
      this.renderH2HWaitlistCard(s)
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
      this.props.isStaff && React.createElement('div', {
        key: 'backoffice-link',
        style: {
          marginBottom: 16, padding: 13, borderRadius: 12,
          background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.4)',
        },
      },
        React.createElement('div', { style: { fontSize: 8.5, fontWeight: 900, color: '#ef4444', letterSpacing: 1, marginBottom: 4 } }, '\ud83d\udd12 STAFF'),
        React.createElement('div', { style: { fontSize: 12.5, fontWeight: 900, marginBottom: 4 } }, 'Back office'),
        React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginBottom: 10 } },
          'Payouts, refunds, fight setup and house settings live in the back office \u2014 not in the player app.'),
        React.createElement('div', {
          onClick: () => { this.playTap(); if (typeof window !== 'undefined') window.open('/administration', '_blank', 'noopener'); },
          role: 'button', tabIndex: 0,
          style: {
            textAlign: 'center', padding: '10px 0', borderRadius: 999,
            background: 'rgba(239,68,68,.85)', color: '#fff', fontWeight: 900,
            fontSize: 11.5, cursor: 'pointer', letterSpacing: .3,
          },
        }, 'OPEN BACK OFFICE \u2197')
      ),
      React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.5)', letterSpacing: 1, margin: '18px 0 8px' } }, 'SCORING & ALERTS'),
      toggle('Round-by-Round Scoring', 'Score picks live each round during Watch Party, not just the fight winner', 'roundByRound'),
      toggle('Sound Effects', 'Bell rings & crowd cheers on wins, entries and claims', 'sound'),
      toggle('Push Notifications', 'Alerts before predictions lock on fights you have entered', 'notifications'),
      toggle('Email Alerts', 'Get emailed when new fights are added and fight week kicks off', 'emailAlerts'),
      toggle('Text Alerts', 'Get a text before predictions lock on fights you\'ve entered', 'textAlerts'),
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
    const fights = Array.isArray(this.props.fights) ? this.props.fights : [];
    const board = Array.isArray(this.props.leaderboard) ? this.props.leaderboard : [];
    const items = [];

    // 1. Who is winning. The single most interesting line on the board.
    board.slice(0, 3).forEach((row, index) => {
      const name = cleanText(row.displayName, row.playerName, row.username, row.name);
      const pts = Number(row.totalPoints ?? row.points ?? row.score ?? 0);
      if (!name) return;
      items.push([
        index === 0 ? '👑' : '🏆',
        index === 0
          ? `${name} leads the board with ${pts.toLocaleString()} pts`
          : `#${index + 1} ${name} — ${pts.toLocaleString()} pts`,
        index === 0 ? '#f2b544' : '#22c55e',
      ]);
    });

    // 2. Results, newest first. "Who won" is what was actually being asked for.
    fights
      .filter((fight) => fight?.winner || fight?.matchWinner || fight?.result)
      .slice(0, 4)
      .forEach((fight) => {
        const winner = cleanText(fight.winner, fight.matchWinner, fight.result);
        const a = cleanText(fight.matchFighterA, fight.fighterAName);
        const b = cleanText(fight.matchFighterB, fight.fighterBName);
        if (!winner) return;
        items.push(['🥊', a && b ? `${winner.toUpperCase()} beat ${(winner.toUpperCase() === a.toUpperCase() ? b : a).toUpperCase()}` : `${winner.toUpperCase()} wins`, '#ff6b3b']);
      });

    // 3. Money on the table right now.
    fights.forEach((fight) => {
      const pot = Number(String(cleanText(fight.prizePool, fight.prize, fight.currentPot, fight.winningAmount) || '').replace(/[^0-9.]/g, ''));
      const a = cleanText(fight.matchFighterA, fight.fighterAName);
      const b = cleanText(fight.matchFighterB, fight.fighterBName);
      if (pot > 0 && a && b) {
        items.push(['💰', `${a.toUpperCase()} vs ${b.toUpperCase()} — ${pot.toLocaleString()} FM pot`, '#22c55e']);
      }
    });

    // 4. Where the action is.
    fights.forEach((fight) => {
      const entries = Number(fight.entryCount ?? fight.entries ?? (Array.isArray(fight.userPredictions) ? fight.userPredictions.length : 0)) || 0;
      const a = cleanText(fight.matchFighterA, fight.fighterAName);
      if (entries > 0 && a) {
        items.push(['⚡', `${entries.toLocaleString()} ${entries === 1 ? 'entry' : 'entries'} in on ${a.toUpperCase()}'s card`, '#4d8dff']);
      }
    });

    // Only if there is genuinely nothing yet — never alongside real news, or it
    // reads as filler next to live results.
    if (items.length === 0) {
      items.push(
        ['🔥', fights.length ? `${fights.length} fight card${fights.length === 1 ? '' : 's'} open for predictions` : 'New fight cards appear here the moment they are published', '#ff6b3b'],
        ['🏆', 'Leaderboard opens as soon as the first predictions are scored', '#22c55e'],
      );
    }

    // Long enough to fill the strip, short enough that a repeat is not obvious.
    const trimmed = items.slice(0, 10);
    const loop = [...trimmed, ...trimmed];
    return React.createElement('div', { className: 'fmm-unified-ticker fmm-news-bar', style: { overflow: 'hidden', position: 'relative', borderTop: '2px solid #f2b544', borderBottom: '2px solid #f2b544', padding: '10px 0', marginBottom: 14, boxShadow: '0 0 20px rgba(242,181,68,.35), inset 0 0 24px rgba(0,0,0,.5)' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'ticker-bg', shape: 'rect', placeholder: 'Arena photo', fit: 'cover', src: 'featured-arena-bg-opt.jpg' })),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(26,18,6,.35),rgba(36,21,5,.25),rgba(26,18,6,.35))' } }),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#05060a,transparent 10%,transparent 90%,#05060a)', zIndex: 2, pointerEvents: 'none' } }),
      React.createElement('div', { style: { display: 'flex', gap: 0, whiteSpace: 'nowrap', width: 'max-content', animation: `marquee ${Math.max(10, Math.min(34, trimmed.length * 3.4))}s linear infinite` } },
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
          (sp.gallery && sp.gallery.length
            ? React.createElement('div', {
                key: sp.photo || sp.id, className: 'fmm-sport-cycle-frame', style: { position: 'absolute', inset: 0 }
              }, React.createElement(MobileImageSlot, { id: 'sport-' + sp.id, src: sp.photo || undefined, fallbackSrc: sp.photo || undefined, shape: 'rect', placeholder: sp.nextFighter || sp.name, fit: 'cover' }))
            : React.createElement(MobileImageSlot, { id: 'sport-' + sp.id + '-0', shape: 'rect', placeholder: sp.name + ' — fighter photo', fit: 'cover' })),
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
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'featured-arena-bg', shape: 'rect', placeholder: 'Arena crowd photo', fit: 'cover', src: 'featured-arena-bg-opt.jpg' })),
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
      className: 'fmm-unified-featured-week',
      'data-fmm-section': 'featured-this-week',
      onClick: () => this.openEvent(event),
      style: { margin: '0 16px 16px', position: 'relative', borderRadius: 14, overflow: 'hidden', minHeight: 246, border: '1px solid ' + event.tagColor, boxShadow: '0 0 18px ' + event.tagColor + '55', cursor: 'pointer', background: '#080a10' }
    },
      React.createElement('div', { className: 'fmm-unified-arena-bg', style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'featured-approved-arena-' + event.id, shape: 'rect', placeholder: 'Fantasy MMAdness arena', fit: 'cover', src: 'arena-approved-v62.webp' })),
      React.createElement('div', { className: 'fmm-unified-featured-fighter fmm-unified-featured-fighter--left', style: { position: 'absolute', left: 0, top: 0, bottom: 74, width: '39%', pointerEvents: 'none' } }, React.createElement(MobileImageSlot, { id: 'featured-week-a-' + event.id, shape: 'rect', placeholder: event.f1, fit: 'contain', src: event.featuredFightFighterAImage || event.fighterAImage, fallbackSrc: event.fallbackImage })),
      React.createElement('div', { className: 'fmm-unified-featured-fighter fmm-unified-featured-fighter--right', style: { position: 'absolute', right: 0, top: 0, bottom: 74, width: '39%', pointerEvents: 'none' } }, React.createElement(MobileImageSlot, { id: 'featured-week-b-' + event.id, shape: 'rect', placeholder: event.f2, fit: 'contain', src: event.featuredFightFighterBImage || event.fighterBImage, fallbackSrc: event.fallbackImage })),
      React.createElement('div', { className: 'fmm-unified-featured-overlay', style: { position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(5,6,10,.14) 0%,rgba(5,6,10,.03) 30%,rgba(5,6,10,.03) 70%,rgba(5,6,10,.16) 100%),linear-gradient(180deg,rgba(5,6,10,.02),rgba(5,6,10,.6))' } }),
      React.createElement('div', { className: 'fmm-unified-featured-content', style: { position: 'relative', minHeight: 246, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(180deg,transparent 34%,rgba(5,6,10,.72) 58%,rgba(5,6,10,.94) 78%)' } },
        React.createElement('span', { style: { color: '#f2b544', fontSize: 9, fontWeight: 900 } }, '★ FEATURED THIS WEEK · ' + event.date),
        React.createElement('h2', { style: { fontFamily: "'Anton',sans-serif", fontSize: 21, lineHeight: 1.08, margin: '4px 0', textShadow: '0 2px 10px rgba(0,0,0,.85)' } }, event.f1, React.createElement('em', { style: { color: '#ef4444', fontStyle: 'normal' } }, ' VS '), event.f2),
        React.createElement('div', { style: { display: 'flex', gap: 12, fontSize: 10, fontWeight: 900, marginBottom: 9 } },
          React.createElement('span', { style: { color: '#22c55e' } }, event.prize || 'PRIZE TERMS PENDING'),
          React.createElement('span', { style: { color: '#ffce54' } }, entry),
          React.createElement('span', { style: { color: '#ff4d6d' } }, entryCount)
        ),
        React.createElement('div', { style: { display: 'flex', width: '100%', maxWidth: 330, gap: 7, alignItems: 'stretch' } },
          React.createElement('div', {
            role: 'button', tabIndex: 0, 'aria-label': `Open AI scouting report for ${event.f1} versus ${event.f2}`,
            onClick: (clickEvent) => { clickEvent.stopPropagation(); this.playTap(); this.openAiScout(event); },
            style: { flex: '0 0 62px', minHeight: 38, display: 'grid', placeItems: 'center', borderRadius: 8, background: 'linear-gradient(135deg,#4d8dff,#a855f7)', color: '#fff', fontSize: 8.5, lineHeight: 1.05, whiteSpace: 'pre-line', fontWeight: 1000, letterSpacing: .4, boxShadow: '0 0 14px rgba(77,141,255,.55)', cursor: 'pointer' }
          }, 'AI\nSCOUT'),
          React.createElement('strong', {
            role: 'button', tabIndex: 0, 'aria-label': `${this.getEventActionLabel(event)} for ${event.f1} versus ${event.f2}`,
            onClick: (clickEvent) => { clickEvent.stopPropagation(); this.playTap(); this.openEvent(event); },
            style: { flex: 1, display: 'grid', placeItems: 'center', background: '#f2b544', color: '#2b1b00', borderRadius: 8, padding: '9px 10px', fontSize: 11 }
          }, this.getEventActionLabel(event))
        ),
        React.createElement('span', { style: { marginTop: 5, color: '#9bbcff', fontSize: 8, fontWeight: 900, letterSpacing: .35 } }, event.aiScoutingReport ? 'AI SCOUTING REPORT' : 'AI SCOUT · REPORT STATUS')
      )
    );
  }

  renderUpcomingEvents(filteredEvents, s) {
    if (this.props.dataLoading && filteredEvents.length === 0) return null;
    return React.createElement('div', { className: 'fmm-unified-upcoming', 'data-fmm-section': 'upcoming-events', style: { padding: '0 16px 16px', scrollMarginTop: 8 } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
        React.createElement('div', { style: { fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(255,255,255,.7)' } }, 'UPCOMING EVENTS'),
        React.createElement('div', { onClick: () => this.setTab('contests'), style: { fontSize: 11, fontWeight: 700, color: '#4d8dff', cursor: 'pointer' } }, 'VIEW ALL ›')
      ),
      React.createElement('div', { className: 'fmm-unified-upcoming-rail', style: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 } },
        filteredEvents.length === 0 ? React.createElement('div', { style: { fontSize: 12, color: 'rgba(255,255,255,.4)', padding: 10 } }, 'No events for this sport yet.') :
        filteredEvents.map(ev => React.createElement('div', {
          className: 'fmm-unified-upcoming-card',
          key: ev.id, style: { flex: '0 0 140px', position: 'relative', background: 'rgba(255,255,255,.05)', border: '1px solid ' + ev.tagColor, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 0 14px ' + ev.tagColor + '55, inset 0 0 10px ' + ev.tagColor + '20', animation: s.flashCard[ev.id] ? 'cardPop .35s ease' : 'none' }
        },
          s.flashCard[ev.id] && React.createElement('div', { key: s.flashCard[ev.id], style: { position: 'absolute', inset: 0, background: 'radial-gradient(circle,rgba(242,181,68,.55),transparent 70%)', animation: 'quickFlash .6s ease-out forwards', zIndex: 5, pointerEvents: 'none' } }),
          React.createElement('div', { style: { height: 150, position: 'relative' } },
            React.createElement(MobileImageSlot, { id: 'event-poster-' + ev.id, shape: 'rect', placeholder: ev.f1 + ' vs ' + ev.f2 + ' poster', fit: 'contain', src: ev.image, fallbackSrc: ev.fallbackImage }),
            React.createElement('div', { style: { position: 'absolute', top: 6, left: 6, background: ev.tagColor, color: '#fff', fontSize: 8, fontWeight: 900, padding: '3px 6px', borderRadius: 5 } }, ev.tag),
            s.showNewTag && s.newFightId === ev.backendId && React.createElement('div', { style: { position: 'absolute', top: 6, right: 6, background: '#22c55e', color: '#05120a', fontSize: 8, fontWeight: 1000, padding: '3px 7px', borderRadius: 999, animation: 'newTagFlash .8s ease-in-out infinite' } }, 'NEW')
          ),
          React.createElement('div', { style: { padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 4 } },
            React.createElement('div', { style: { fontSize: 13, fontWeight: 900, lineHeight: 1.2 } }, ev.f1, React.createElement('span', { style: { color: '#ef4444' } }, ' VS '), ev.f2),
            React.createElement('div', { style: { fontSize: 10, color: this.countdownColor(ev.countdown), fontWeight: 800, transition: 'color .25s ease' } }, ev.date, ' · ', ev.countdown),
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
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'featured-detail-bg', shape: 'rect', placeholder: 'Arena photo', fit: 'cover', src: 'featured-arena-bg-opt.jpg' })),
      React.createElement('div', { style: { position: 'relative' } },
      React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#ffce54', textShadow: '0 1px 4px rgba(0,0,0,.8)', marginBottom: 6 } }, 'FEATURED FIGHT · HEAVYWEIGHT BOUT'),
      React.createElement('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 6 } },
        React.createElement('div', { style: { width: 116, height: 150, flex: '0 0 116px', background: 'transparent', filter: 'brightness(1.28) contrast(1.06) saturate(1.05) drop-shadow(0 6px 10px rgba(0,0,0,.55))' } }, React.createElement(MobileImageSlot, { id: 'fd-jones', shape: 'rect', placeholder: 'Jones', fit: 'contain', position: 'bottom center', src: 'uploads/transparent-fd-jones.png' })),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 20, textAlign: 'center', flex: 1, minWidth: 0, alignSelf: 'center', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.8)' } }, 'JONES ', React.createElement('span', { style: { color: '#ff2020' } }, 'VS'), ' ASPINALL'),
        React.createElement('div', { style: { width: 116, height: 150, flex: '0 0 116px', background: 'transparent', filter: 'brightness(1.28) contrast(1.06) saturate(1.05) drop-shadow(0 6px 10px rgba(0,0,0,.55))' } }, React.createElement(MobileImageSlot, { id: 'fd-aspinall', shape: 'rect', placeholder: 'Aspinall', fit: 'contain', position: 'bottom center', src: 'uploads/transparent-fd-aspinall.png' }))
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
    return React.createElement('div', { className: 'fmm-unified-featured-fight', 'data-fmm-section': 'featured-fight', style: { margin: '0 16px 16px', position: 'relative', overflow: 'hidden', border: '1px solid ' + event.tagColor, borderRadius: 14, padding: 12, boxShadow: '0 0 18px ' + event.tagColor + '55' } },
      React.createElement('div', { className: 'fmm-unified-arena-bg', style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'featured-detail-approved-' + event.id, shape: 'rect', placeholder: 'Fantasy MMAdness arena', fit: 'cover', src: 'arena-approved-v62.webp' })),
      React.createElement('div', { className: 'fmm-unified-featured-fight-overlay', style: { position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(5,6,10,.5),rgba(5,6,10,.15) 48%,rgba(5,6,10,.5)),linear-gradient(180deg,rgba(5,6,10,.04),rgba(5,6,10,.45))' } }),
      React.createElement('div', { className: 'fmm-unified-featured-fight-content', style: { position: 'relative' } },
        React.createElement('div', { style: { color: '#ffce54', fontSize: 10, fontWeight: 900, marginBottom: 8 } }, 'FEATURED FIGHT · ' + (event.division ? event.division.toUpperCase() : event.tag)),
        React.createElement('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 } },
          React.createElement('div', { style: { width: 116, height: 150, flex: '0 0 116px', background: 'transparent', filter: 'brightness(1.22) contrast(1.05) drop-shadow(0 6px 10px rgba(0,0,0,.55))' } }, React.createElement(MobileImageSlot, { id: 'detail-a-' + event.id, shape: 'rect', placeholder: event.f1, fit: 'contain', position: 'bottom center', src: event.fighterACutout || event.featuredFightFighterAImage || event.fighterAImage, fallbackSrc: event.featuredFightFighterAImage || event.fighterAImage || event.fallbackImage })),
          React.createElement('div', { style: { flex: 1, minWidth: 0, fontFamily: "'Anton',sans-serif", textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,.85)' } },
            React.createElement('div', { style: { fontSize: 15, lineHeight: 1.15, wordBreak: 'break-word' } }, event.f1),
            React.createElement('div', { style: { color: '#ef4444', fontSize: 12, margin: '2px 0' } }, 'VS'),
            React.createElement('div', { style: { fontSize: 15, lineHeight: 1.15, wordBreak: 'break-word' } }, event.f2)
          ),
          React.createElement('div', { style: { width: 116, height: 150, flex: '0 0 116px', background: 'transparent', filter: 'brightness(1.22) contrast(1.05) drop-shadow(0 6px 10px rgba(0,0,0,.55))' } }, React.createElement(MobileImageSlot, { id: 'detail-b-' + event.id, shape: 'rect', placeholder: event.f2, fit: 'contain', position: 'bottom center', src: event.fighterBCutout || event.featuredFightFighterBImage || event.fighterBImage, fallbackSrc: event.featuredFightFighterBImage || event.fighterBImage || event.fallbackImage }))
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-around', gap: 6, marginBottom: 9 } },
          [event.date, event.matchTime || 'TIME TBA', event.venue || 'VENUE TBA'].map((text, i) => React.createElement('span', {
            key: i, style: { fontSize: 9.5, fontWeight: 900, color: '#fff', background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 6, padding: '3px 8px', textShadow: '0 1px 3px rgba(0,0,0,.9)' }
          }, text))
        ),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 } }, values.map(([label, value, color]) => React.createElement('div', { key: label, style: { textAlign: 'center', padding: 7, borderRadius: 8, background: 'rgba(0,0,0,.55)', border: '1px solid ' + color + '55', boxShadow: 'inset 0 0 10px ' + color + '22' } },
          React.createElement('small', { style: { display: 'block', color: 'rgba(255,255,255,.75)', fontSize: 7.5, fontWeight: 900, letterSpacing: .4 } }, label),
          React.createElement('strong', { style: { display: 'block', color, fontSize: 13, marginTop: 3, textShadow: '0 0 8px ' + color + '80' } }, value)
        ))),
        React.createElement('div', {
          role: 'button', tabIndex: 0, 'aria-label': `Open AI scouting report for ${event.f1} versus ${event.f2}`,
          onClick: () => this.openAiScout(event),
          style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, textAlign: 'center', padding: '10px 0', borderRadius: 10, marginBottom: 8, background: 'linear-gradient(90deg,#4d8dff,#a855f7)', fontWeight: 900, fontSize: 11.5, color: '#fff', cursor: 'pointer', boxShadow: '0 0 16px rgba(77,141,255,.5)' }
        }, event.aiScoutingReport ? 'AI SCOUTING REPORT' : 'AI SCOUT · CHECK REPORT'),
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
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'community-predictions-bg', shape: 'rect', placeholder: 'Boxing match photo', fit: 'cover', src: 'mma-arena-bg.jpg' })),
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
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'progression-classic-bg', shape: 'rect', placeholder: 'Boxing gloves photo', fit: 'cover', src: 'progression-bg-opt.jpg' })),
        React.createElement('div', { style: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 } },
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#a855f7' } }, 'YOUR PROGRESSION'),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
          React.createElement('div', { style: { width: 26, height: 26, clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)', background: 'linear-gradient(135deg,#c084fc,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 } }, toSafeNumber(this.props.currentUser?.fightIqLevel, this.props.currentUser?.level) || '—'),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 10, color: '#ffce54', fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,.8)' } }, 'FIGHT IQ'),
            React.createElement('div', { style: { fontSize: 12, fontWeight: 800, color: '#c084fc' } }, `${toSafeNumber(this.props.currentUser?.fightIqXp, this.props.currentUser?.xp).toLocaleString()} XP`)
          )
        ),
        React.createElement('div', { style: { height: 5, background: 'rgba(255,255,255,.1)', borderRadius: 3, overflow: 'hidden' } },
          React.createElement('div', { style: { height: '100%', width: xpPct + '%', background: 'linear-gradient(90deg,#a855f7,#ec4899)', transition: 'width 1s ease' } })
        ),
        React.createElement('div', { style: { fontSize: 9, color: '#ffce54', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,.8)' } }, toSafeNumber(this.props.currentUser?.nextFightIqXp, this.props.currentUser?.nextLevelXp) > 0 ? `NEXT LEVEL: ${toSafeNumber(this.props.currentUser?.nextFightIqXp, this.props.currentUser?.nextLevelXp).toLocaleString()} XP` : 'KEEP MAKING ACCURATE PICKS'),
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#f2b544' } }, cleanText(this.props.currentUser?.fightIqTier, this.props.currentUser?.tier, 'FIGHT IQ PLAYER').toUpperCase())
        )
      )
    );
  }

  renderRewardsRow(streakDays, s) {
    const leaderboardPreview = (Array.isArray(this.props.leaderboard) ? this.props.leaderboard : []).slice(0, 3).map((row, index) => ({
      rank: Number(row.rank || index + 1),
      name: cleanText(row.displayName, row.playerName, row.username, row.name, `Player ${index + 1}`),
      points: toSafeNumber(row.totalPoints, row.points, row.score),
    }));
    const currentUserId = cleanText(this.props.currentUser?._id, this.props.currentUser?.id);
    const currentRow = (Array.isArray(this.props.leaderboard) ? this.props.leaderboard : []).find(row => cleanText(row._id, row.id, row.userId) === currentUserId);
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
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'home-leaderboard-bg', shape: 'rect', placeholder: 'Ring corner photo', fit: 'cover', src: 'leaderboard-bg-opt.jpg' })),
        React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(20,10,0,.55),rgba(20,10,0,.8))' } }),
        React.createElement('div', { style: { position: 'relative' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: '#f2b544' } }, 'LEADERBOARD'),
          React.createElement('div', { onClick: () => this.setTab('leaderboard'), style: { fontSize: 10, color: '#4d8dff', fontWeight: 700, cursor: 'pointer' } }, 'VIEW ALL ›')
        ),
        leaderboardPreview.length === 0 && React.createElement('div', { style: { padding: '8px 0', fontSize: 9.5, color: 'rgba(255,255,255,.5)' } }, 'Official standings appear after the first score.'),
        leaderboardPreview.map(row => React.createElement('div', { key: `${row.rank}-${row.name}`, style: { display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, padding: '2px 0', color: 'rgba(255,255,255,.75)' } },
          React.createElement('span', null, `${row.rank}. ${row.name}`),
          React.createElement('span', { style: { color: '#f2b544' } }, row.points.toLocaleString())
        )),
        currentRow && React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, padding: '3px 0', marginTop: 2, borderTop: '1px solid rgba(255,255,255,.1)', color: '#22c55e' } },
          React.createElement('span', null, `${toSafeNumber(currentRow.rank) || '—'}. ${cleanText(currentRow.displayName, currentRow.playerName, currentRow.username, 'You')} (You)`), React.createElement('span', null, toSafeNumber(currentRow.totalPoints, currentRow.points, currentRow.score).toLocaleString())
        )
        )
      ),
      React.createElement('div', { style: { flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid #ef444490', borderRadius: 12, padding: 10, boxShadow: '0 0 14px #ef444440' } },
        React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'streak-bonus-bg', shape: 'rect', placeholder: 'Kickboxing photo', fit: 'cover', src: 'streak-bonus-bg-opt.jpg' })),
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
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: '#f2b544', animation: 'moneyPulseGold 1.8s ease-in-out infinite' } }, toSafeNumber(this.props.currentUser?.nextDailyRewardFm) > 0 ? `+${toSafeNumber(this.props.currentUser.nextDailyRewardFm)} FM` : 'DAILY REWARD'),
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
        React.createElement('img', { src: `${ASSET_BASE}/treasure-chest-sm.png`, alt: 'Fantasy MMAdness treasure chest', style: { width: '113%', height: '113%', objectFit: 'contain', animation: 'chestOpenClose 1.8s ease-in-out infinite', filter: 'drop-shadow(0 0 16px rgba(242,181,68,.7))' } }),
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
            React.createElement(MobileImageSlot, { id: 'affiliate-handshake', shape: 'rect', placeholder: 'Handshake photo — partnership', fit: 'cover', src: 'affiliate-handshake-opt.jpg' })
          )
        ),
        React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 35%,rgba(5,6,10,.92))', pointerEvents: 'none' } }),
        React.createElement('div', { style: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 } },
          React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: '#ff9d2f', letterSpacing: 1, marginBottom: 2, textShadow: '0 1px 4px rgba(0,0,0,.9)' } }, '🤝 AFFILIATES & CREATORS'),
          React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#ffe93b', marginBottom: 2, textShadow: '0 0 14px rgba(255,233,59,.8), 0 2px 4px rgba(0,0,0,.9)' } }, 'RUN YOUR OWN LEAGUE'),
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
        React.createElement('img', { src: `${ASSET_BASE}/treasure-chest-sm.png`, alt: 'Fantasy MMAdness treasure chest', style: { width: '113%', height: '113%', objectFit: 'contain', animation: s.chestBurst ? 'chestBurstPop .5s ease-out' : 'chestOpenClose 1.8s ease-in-out infinite', filter: 'drop-shadow(0 0 16px rgba(242,181,68,.7))' } }),
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
          key: name, onClick: () => this.openSocialProfile(name), title: 'Follow us on ' + name,
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
            React.createElement(MobileImageSlot, { id: 'event-poster-' + ev.id, shape: 'rect', placeholder: ev.f1 + ' vs ' + ev.f2 + ' poster', fit: 'contain', src: ev.image, fallbackSrc: ev.fallbackImage }),
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
              onClick: () => this.openAiScout(ev),
              style: { textAlign: 'center', padding: '8px 0', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', marginBottom: 7, background: 'linear-gradient(90deg,rgba(77,141,255,.22),rgba(168,85,247,.22))', border: '1px solid rgba(77,141,255,.45)', color: '#b9cbff' }
            }, ev.aiScoutingReport ? 'AI SCOUTING REPORT' : 'AI SCOUT · CHECK REPORT'),
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

  renderLeaderboard(list, s = this.state) {
    const allRows = Array.isArray(list) ? list : [];
    const tier = s.leaderboardTier || 'global';
    const hasTierData = allRows.some(row => row.tier);
    const rows = tier === 'rookie' && hasTierData ? allRows.filter(row => row.tier === 'rookie') : allRows;
    const podium = rows.slice(0, 3);
    return React.createElement('div', { style: { padding: '8px 16px 24px', position: 'relative', minHeight: '100%', overflow: 'hidden' } },
      React.createElement('div', { style: { position: 'absolute', inset: 0 } }, React.createElement(MobileImageSlot, { id: 'leaderboard-live-bg', shape: 'rect', placeholder: 'Leaderboard arena', fit: 'cover', src: 'leaderboard-bg-opt.jpg' })),
      React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,6,10,.84),rgba(5,6,10,.99))' } }),
      React.createElement('div', { style: { position: 'relative' } },
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 24, marginBottom: 4, color: '#f2b544' } }, 'LEADERBOARD'),
        React.createElement('div', { style: { color: 'rgba(255,255,255,.55)', fontSize: 10, fontWeight: 700, marginBottom: 14 } }, 'Official scores from submitted Fantasy MMAdness fight cards.'),
        React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 12 } },
          [['rookie', 'ROOKIE'], ['global', 'GLOBAL']].map(([id, label]) => React.createElement('button', { key: id, type: 'button', onClick: () => this.setState({ leaderboardTier: id }), style: { flex: 1, minHeight: 40, border: 0, borderRadius: 999, cursor: 'pointer', fontFamily: designTokens.font.body, fontWeight: 900, fontSize: 11, background: tier === id ? designTokens.gradient.goldButton : 'rgba(255,255,255,.07)', color: tier === id ? '#2b1b00' : 'rgba(255,255,255,.65)' } }, label))
        ),
        tier === 'rookie' && !hasTierData && allRows.length > 0 && React.createElement('div', { style: { marginBottom: 12, padding: 10, borderRadius: 10, background: 'rgba(77,141,255,.09)', border: '1px solid rgba(77,141,255,.26)', color: 'rgba(255,255,255,.65)', fontSize: 10, fontWeight: 700, lineHeight: 1.45 } }, 'Rookie tiers have not been published by the server yet, so the official standings are shown.'),
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
                player.avatar ? React.createElement('img', { src: player.avatar, alt: '', style: { width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' } }) : React.createElement('span', { style: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#333,#111)' } }),
                React.createElement('span', { style: { flex: 1, fontSize: 13, fontWeight: 800 } }, player.name),
                player.delta ? React.createElement('span', { style: { color: player.delta > 0 ? '#22c55e' : '#ef4444', fontSize: 10, fontWeight: 900, animation: 'liveToastIn 3s ease-in-out' } }, player.delta > 0 ? `▲${player.delta}` : `▼${Math.abs(player.delta)}`) : null,
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

  // Team Cards — the flagship. Open contests to enter, and live teams whose score
  // moves as each bout on the card is scored.
  renderTeamCards() {
    if (!this.props.features?.teamCards?.enabled) return null;
    const open = (this.state.teamContests || []).filter(contest => !contest.entered);
    const mine = this.state.myTeams || [];
    if (open.length === 0 && mine.length === 0) return null;

    return React.createElement('div', { key: 'teamcards', style: { marginBottom: 16 } },
      React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)', marginBottom: 8 } }, 'TEAM CARDS'),

      mine.length > 0 && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 9, marginBottom: open.length ? 12 : 0 } },
        mine.map(team => React.createElement('div', {
          key: team.entryId,
          style: {
            padding: 13, borderRadius: 13,
            background: 'linear-gradient(160deg,rgba(242,181,68,.14),rgba(5,6,10,.5))',
            border: '1px solid rgba(242,181,68,.42)',
          },
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 } },
            React.createElement('div', { style: { fontSize: 13.5, fontWeight: 900 } }, team.contestName),
            React.createElement('div', { style: { fontSize: 13, fontWeight: 900, color: '#f2b544', fontVariantNumeric: 'tabular-nums' } },
              team.totalPoints > 0 || team.settled
                ? Number(team.totalPoints || 0).toLocaleString() + ' PTS'
                : 'AWAITING')
          ),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 } },
            React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.42)' } },
              team.settled
                ? 'Final'
                : (team.scoredCount ?? 0) + ' of ' + (team.picks?.length ?? 0) + ' fighters scored'),
            React.createElement('div', {
              onClick: () => this.openTeamStandings(team),
              role: 'button', tabIndex: 0,
              'aria-label': 'See standings for ' + (team.contestName || 'this contest'),
              style: { fontSize: 9.5, fontWeight: 900, color: '#4d8dff', cursor: 'pointer' },
            }, 'STANDINGS \u203a')
          ),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
            (team.picks || []).map((pick, index) => React.createElement('div', {
              key: index,
              style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
            },
              React.createElement('div', { style: { minWidth: 0, flex: 1 } },
                React.createElement('div', {
                  style: {
                    fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis', opacity: pick.scored ? 1 : .5,
                  },
                }, pick.fighterName),
                pick.calledValue > 0 && React.createElement('div', { style: { fontSize: 8.5, fontWeight: 700, color: pick.callHit ? '#22c55e' : 'rgba(255,255,255,.4)' } },
                  'Called ' + pick.calledValue + ' \u00b7 at ' + pick.actual + (pick.callHit ? '  HIT +' + pick.callBonus : '')
                )
              ),
              React.createElement('div', { style: { fontSize: 11.5, fontWeight: 900, color: pick.scored ? '#f2b544' : 'rgba(255,255,255,.28)', fontVariantNumeric: 'tabular-nums' } },
                pick.scored ? Number(pick.points || 0).toLocaleString() : '—')
            ))
          )
        ))
      ),

      open.length > 0 && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        open.map(contest => React.createElement('div', {
          key: contest.id,
          onClick: () => { this.safeSetState({ teamDraft: {} }); this.openModal('teamDraft', contest); },
          style: {
            padding: 12, borderRadius: 12, cursor: 'pointer',
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.13)',
          },
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' } },
            React.createElement('div', { style: { fontSize: 13, fontWeight: 900 } }, contest.name),
            React.createElement('div', { style: { fontSize: 10.5, fontWeight: 900, color: contest.entryFee > 0 ? '#f2b544' : '#22c55e' } },
              contest.entryFee > 0 ? Number(contest.entryFee).toLocaleString() + ' FM' : 'FREE')
          ),
          React.createElement('div', { style: { fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.45)', marginTop: 3 } },
            'Pick ' + (contest.picksRequired ?? 5) + ' fighters \u00b7 ' + (contest.bouts?.length ?? 0) + ' bouts \u00b7 '
            + (contest.entrants ?? 0) + (contest.entrants === 1 ? ' team in' : ' teams in')
            + (contest.promoted ? '  \u00b7  league contest' : '')
          )
        ))
      )
    );
  }

  // My Season Cards. This is the retention surface: five fighters, each with live
  // points, and a called number the player can watch closing in. It is the reason
  // to open the app on a night with no card they care about.
  renderSeasonCards() {
    const cards = Array.isArray(this.state.mySeasonCards) ? this.state.mySeasonCards : [];
    if (!this.props.features?.seasonCards?.enabled) return null;
    if (cards.length === 0) return null;

    return React.createElement('div', { key: 'seasoncards', style: { marginBottom: 16 } },
      React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)', marginBottom: 8 } }, 'MY SEASON CARDS'),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        cards.map(card => React.createElement('div', {
          key: card.rosterId,
          style: {
            padding: 13, borderRadius: 13,
            background: 'linear-gradient(160deg,rgba(77,141,255,.13),rgba(5,6,10,.5))',
            border: '1px solid rgba(77,141,255,.4)',
          },
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 } },
            React.createElement('div', { style: { fontSize: 13.5, fontWeight: 900 } }, card.seasonName),
            React.createElement('div', { style: { fontSize: 12, fontWeight: 900, color: '#4d8dff', fontVariantNumeric: 'tabular-nums' } },
              card.settled ? (card.totalScore ?? 0) + ' / ' + (card.maxPossible ?? 0) : 'IN PLAY')
          ),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 } },
            React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.4)' } },
              card.settled ? 'Final' : 'Scoring live \u00b7 settles when the season ends'),
            React.createElement('div', {
              onClick: () => this.openSeasonStandings(card),
              role: 'button', tabIndex: 0,
              style: { fontSize: 9.5, fontWeight: 900, color: '#4d8dff', cursor: 'pointer' },
            }, 'STANDINGS \u203a')
          ),

          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 7 } },
            (card.picks || []).map(pick => {
              const called = pick.calledValue > 0;
              const pct = called ? Math.min(100, Math.round((pick.actualSoFar / pick.calledValue) * 100)) : 0;
              return React.createElement('div', { key: pick.slot, style: { display: 'flex', alignItems: 'center', gap: 9 } },
                React.createElement('div', { style: { width: 62, flex: '0 0 62px', fontSize: 8.5, fontWeight: 800, color: 'rgba(255,255,255,.45)' } },
                  pick.slotLabel.toUpperCase()),
                React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                  React.createElement('div', { style: { fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
                    pick.fighterName),
                  called && React.createElement('div', { style: { marginTop: 3 } },
                    React.createElement('div', {
                      style: { height: 3, borderRadius: 2, background: 'rgba(255,255,255,.1)', overflow: 'hidden' },
                    },
                      React.createElement('div', { style: { width: pct + '%', height: '100%', background: pick.callHit || pct >= 100 ? '#22c55e' : '#f2b544' } })
                    ),
                    React.createElement('div', { style: { fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginTop: 2 } },
                      'Called ' + pick.calledValue + ' ' + (pick.calledCategoryLabel || '').toLowerCase()
                      + '  \u00b7  at ' + pick.actualSoFar
                      + (pick.callHit ? '  \u00b7  HIT +' + pick.callBonus : '')
                    )
                  )
                ),
                React.createElement('div', { style: { textAlign: 'right', flex: '0 0 auto' } },
                  React.createElement('div', { style: { fontSize: 11, fontWeight: 900, color: '#f2b544', fontVariantNumeric: 'tabular-nums' } },
                    Number(pick.rawPoints || 0).toLocaleString()),
                  React.createElement('div', { style: { fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.35)' } },
                    card.settled ? pick.normalized + '/100' : pick.eventsCounted + (pick.eventsCounted === 1 ? ' fight' : ' fights'))
                )
              );
            })
          )
        ))
      )
    );
  }

  // Trophy case. In free-play states this is the entire reward — no coins with
  // cash value, so badges, titles and sponsor prizes are what a win is worth.
  renderTrophyCase() {
    const s = this.state;
    const awards = Array.isArray(s.awards) ? s.awards : [];
    const icon = { badge: '\ud83c\udfc5', title: '\ud83d\udc51', ppv_code: '\ud83c\udfab', merch: '\ud83d\udc55', sponsor_other: '\ud83c\udf81' };
    const fulfilmentCopy = { pending: ['Being prepared', '#f2b544'], shipped: ['Sent', '#22c55e'], cancelled: ['Cancelled', 'rgba(255,255,255,.4)'] };

    return React.createElement('div', { key: 'trophies', style: { marginBottom: 16 } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.6)' } }, 'TROPHY CASE'),
        awards.length > 0 && React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: '#f2b544' } }, awards.length + (awards.length === 1 ? ' AWARD' : ' AWARDS'))
      ),
      s.awardTitles.length > 0 && React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 } },
        s.awardTitles.slice(0, 4).map((title) => React.createElement('div', {
          key: title,
          style: {
            fontSize: 9.5, fontWeight: 900, letterSpacing: .4, padding: '4px 10px', borderRadius: 999,
            background: 'rgba(242,181,68,.14)', border: '1px solid rgba(242,181,68,.5)', color: '#f2b544',
          },
        }, '\ud83d\udc51 ' + title.toUpperCase()))
      ),
      awards.length === 0
        ? React.createElement('div', {
            style: {
              padding: 14, borderRadius: 12, background: 'rgba(255,255,255,.04)',
              border: '1px dashed rgba(255,255,255,.14)', fontSize: 10.5, fontWeight: 700,
              color: 'rgba(255,255,255,.5)', lineHeight: 1.5,
            },
          }, 'No awards yet. Finish high on a fight card to earn badges, titles and sponsor prizes.')
        : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
            awards.slice(0, 8).map((award) => React.createElement('div', {
              key: award.id,
              style: {
                display: 'flex', alignItems: 'center', gap: 11, padding: 11, borderRadius: 12,
                background: 'rgba(255,255,255,.05)', border: '1px solid rgba(242,181,68,.28)',
              },
            },
              React.createElement('div', {
                style: {
                  width: 40, height: 40, borderRadius: 10, flex: '0 0 40px', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  background: 'rgba(242,181,68,.12)',
                },
              }, award.imageUrl
                ? React.createElement('img', { src: award.imageUrl, alt: award.name, style: { width: '100%', height: '100%', objectFit: 'cover' } })
                : (icon[award.type] || '\ud83c\udfc6')),
              React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                React.createElement('div', { style: { fontSize: 13, fontWeight: 800 } }, award.name),
                React.createElement('div', { style: { fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.45)' } },
                  (award.place > 0 ? '#' + award.place + ' finish' : 'Entrant award')
                  + (award.sponsorName ? '  \u00b7  ' + award.sponsorName : '')
                ),
                award.code && React.createElement('div', {
                  style: {
                    marginTop: 5, fontSize: 11, fontWeight: 900, letterSpacing: 1.5,
                    color: '#22c55e', fontFamily: 'monospace',
                  },
                }, award.code),
                award.fulfilment && award.fulfilment !== 'not_required' && React.createElement('div', {
                  style: { marginTop: 4, fontSize: 9, fontWeight: 800, color: (fulfilmentCopy[award.fulfilment] || ['', '#fff'])[1] },
                }, (fulfilmentCopy[award.fulfilment] || [''])[0])
              )
            ))
          )
    );
  }

  renderProfile(coinsFmt, streakDays, xpPct) {
    const menu = ['Edit Profile', 'Payment Methods', 'Support', 'Log Out'];
    const user = this.props.currentUser || {};
    const displayName = cleanText(user.displayName, user.playerName, user.username, user.name, 'FANTASY PLAYER');
    const level = toSafeNumber(user.fightIqLevel, user.level);
    const contestsEntered = toSafeNumber(user.contestsEntered, user.fightsEntered, this.props.stats?.userContestsEntered);
    const wins = toSafeNumber(user.wins, user.correctPredictions);
    const winRate = contestsEntered > 0 ? Math.round((wins / contestsEntered) * 100) : null;
    return React.createElement('div', { style: { padding: '8px 16px' } },
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 16 } },
        React.createElement('div', { style: { width: 72, height: 72, borderRadius: '50%' } }, React.createElement(MobileImageSlot, { id: 'avatar', shape: 'circle', placeholder: 'Photo', fit: 'cover' })),
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 20 } }, displayName),
        React.createElement('div', { style: { fontSize: 11, fontWeight: 800, color: '#f2b544' } }, level > 0 ? `FIGHT IQ · LEVEL ${level}` : 'FIGHT IQ PLAYER')
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 } },
        [['CONTESTS ENTERED', contestsEntered.toLocaleString()], ['WIN RATE', winRate === null ? '—' : `${winRate}%`], ['FM COINS', coinsFmt], ['CURRENT STREAK', `${toSafeNumber(user.streakDay, this.state.streakDay)} DAYS`]].map(([l, v], i) => React.createElement('div', {
          key: i, style: { background: 'radial-gradient(circle at 50% -30%, rgba(255,255,255,.18), transparent 55%), radial-gradient(ellipse 80% 60% at 15% 110%, rgba(239,68,68,.22), transparent 60%), radial-gradient(ellipse 80% 60% at 85% 110%, rgba(77,141,255,.22), transparent 60%), rgba(255,255,255,.05)', border: '1px solid #f2b54480', borderRadius: 12, padding: 12, textAlign: 'center', boxShadow: '0 0 12px #f2b54435' }
        },
          React.createElement('div', { style: { fontSize: 16, fontWeight: 800, color: '#f2b544', animation: i === 2 ? 'moneyPulseGold 1.8s ease-in-out infinite' : 'none' } }, v),
          React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.5)' } }, l)
        ))
      ),
      React.createElement('div', { style: { marginBottom: 16 } },
        React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 4 } }, cleanText(user.fightIqLabel, user.xpLabel, 'FIGHT IQ PROGRESSION')),
        React.createElement('div', { style: { height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 3, overflow: 'hidden' } },
          React.createElement('div', { style: { height: '100%', width: xpPct + '%', background: 'linear-gradient(90deg,#a855f7,#ec4899)' } })
        )
      ),
      this.renderTeamCards(),
      this.renderSeasonCards(),
      this.renderTrophyCase(),
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
          key: m, onClick: () => this.openMenuItem(m),
          style: { padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: m === 'Log Out' ? '#ef4444' : '#fff' }
        }, m))
      )
    );
  }

  renderModal(s, events, jonesPct, aspinallPct) {
    if (!s.modal) return null;
    const overlay = (children, opts) => React.createElement('div', {
      onClick: this.closeModal,
      style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 900, display: 'flex', alignItems: (opts && opts.top) ? 'flex-start' : 'flex-end', justifyContent: 'center', animation: 'modalBackdropIn .18s ease-out both' }
    },
      React.createElement('div', {
        onClick: (e) => e.stopPropagation(),
        style: { width: '100%', maxHeight: '80%', overflowY: 'auto', background: '#12141b', borderRadius: (opts && opts.top) ? '0 0 18px 18px' : '18px 18px 0 0', padding: 18, border: '1px solid rgba(255,255,255,.1)', animation: 'modalSlideIn .24s ease-out both' }
      }, children)
    );
    const closeBtn = React.createElement('div', { onClick: this.closeModal, style: { position: 'absolute', top: 10, right: 14, fontSize: 20, color: 'rgba(255,255,255,.5)', cursor: 'pointer' } }, '×');

    if (s.modal === 'rules') {
      const rows = [
        ['ROUND WINNER', 'Correct round winner', '+100'],
        ['ROUND LOSER', 'Wrong round winner', '+25'],
        ['KO / FINISH', 'Called the finish correctly', '+500'],
        ['SURVIVAL', 'Called it going the distance', '+25'],
      ];
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 19, color: '#f2b544', marginBottom: 10 } }, 'HOW SCORING WORKS'),
        React.createElement('a', {
          key: 'full-terms', href: '/terms', target: '_blank', rel: 'noopener noreferrer',
          style: { display: 'block', fontSize: 10, fontWeight: 800, color: '#4d8dff', marginBottom: 10, textDecoration: 'none' }
        }, 'Read the full Terms of Use →'),
        React.createElement('div', { key: 'k', style: { fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,.7)', lineHeight: 1.6, marginBottom: 12, padding: '10px 12px', borderRadius: 9, background: 'rgba(242,181,68,.1)', border: '1px solid rgba(242,181,68,.3)' } },
          'You score the number you call \u2014 but only if the fighter hits it or better. Call 30 head punches: he throws 35, you get +30. He throws 20, you get nothing.'),
        React.createElement('div', { key: 'pts', style: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 } },
          rows.map(([label, desc, pts]) => React.createElement('div', {
            key: label, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 11px', borderRadius: 8, background: 'rgba(255,255,255,.04)' }
          },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 11, fontWeight: 900 } }, label),
              React.createElement('div', { style: { fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginTop: 1 } }, desc)
            ),
            React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 16, color: '#22c55e' } }, pts)
          ))
        ),
        React.createElement('div', { key: 'rd', style: { fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.5)', letterSpacing: .5, marginBottom: 6 } }, 'ROUNDS PER SPORT'),
        React.createElement('div', { key: 'rds', style: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', lineHeight: 1.8, marginBottom: 14 } },
          'Boxing 12 \u00b7 MMA 5 \u00b7 Kickboxing 5 \u00b7 Bare Knuckle 5 \u00b7 Pro Wrestling one continuous match'),
        React.createElement('div', { key: 'n', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', lineHeight: 1.65 } },
          'Fill every round before the fight locks. An unfinished card scores nothing for the rounds you left blank. You can edit your picks right up until lock time.')
      ]);
    }

    if (s.modal === 'paymentMethods') {
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 19, color: '#f2b544', marginBottom: 4 } }, 'PAYMENTS & PAYOUTS'),
        React.createElement('div', { key: 's', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginBottom: 14 } }, 'How money moves in and out of your account.'),
        React.createElement('div', { key: 'in', style: { padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', marginBottom: 8 } },
          React.createElement('div', { style: { fontSize: 11, fontWeight: 900, color: '#22c55e', marginBottom: 4 } }, 'BUYING FM COINS'),
          React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', lineHeight: 1.6 } }, 'Card payments are handled on our processor\u2019s secure page \u2014 we never store your card details. Coins land in your wallet the moment payment clears, and you come straight back to where you were.')
        ),
        React.createElement('div', { key: 'apparel', style: { padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', marginBottom: 8 } },
          React.createElement('div', { style: { fontSize: 11, fontWeight: 900, color: '#4d8dff', marginBottom: 4 } }, 'APPAREL'),
          React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', lineHeight: 1.6 } }, 'Merch is sold through our Etsy shop and covered by Etsy\u2019s policies.')
        ),
        React.createElement('div', { key: 'ref', style: { padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', marginBottom: 12 } },
          React.createElement('div', { style: { fontSize: 11, fontWeight: 900, color: '#f2b544', marginBottom: 4 } }, 'REFUNDS'),
          React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', lineHeight: 1.6 } }, 'If a fight is cancelled, every entry fee comes back automatically \u2014 exactly what you paid \u2014 and we email you to confirm.')
        ),
        React.createElement('div', {
          key: 'help', onClick: () => this.setState({ modal: 'support', supportSent: '' }),
          style: { textAlign: 'center', padding: '11px 0', borderRadius: 999, border: '1px solid rgba(242,181,68,.5)', color: '#f2b544', fontWeight: 900, fontSize: 11.5, cursor: 'pointer' }
        }, 'A PAYMENT PROBLEM? CONTACT SUPPORT')
      ]);
    }

    if (s.modal === 'support') {
      const f = s.supportForm;
      const cats = [['payment', 'Payment'], ['scoring', 'Scoring'], ['account', 'Account'], ['other', 'Other']];
      if (s.supportSent) {
        return overlay([
          closeBtn,
          React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 19, color: '#22c55e', marginBottom: 8 } }, 'MESSAGE SENT'),
          React.createElement('div', { key: 'r', style: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.75)', lineHeight: 1.6, marginBottom: 10 } },
            'Your reference is ', React.createElement('strong', { style: { color: '#f2b544' } }, s.supportSent), '. Quote it in any reply.'),
          React.createElement('div', { key: 'n', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', lineHeight: 1.6 } }, 'We\u2019ve emailed you a copy. Payment issues are prioritised.')
        ]);
      }
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 19, color: '#f2b544', marginBottom: 4 } }, 'CONTACT SUPPORT'),
        React.createElement('div', { key: 's', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginBottom: 12 } }, 'Tell us what happened and we\u2019ll come back to you.'),
        React.createElement('div', { key: 'cl', style: { fontSize: 9.5, fontWeight: 900, color: 'rgba(255,255,255,.5)', marginBottom: 5 } }, 'WHAT IS THIS ABOUT?'),
        React.createElement('div', { key: 'cats', style: { display: 'flex', gap: 5, marginBottom: 11 } },
          cats.map(([val, label]) => React.createElement('div', {
            key: val, onClick: () => this.setSupportField('category', val),
            style: { flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 7, fontSize: 9.5, fontWeight: 900, cursor: 'pointer', background: f.category === val ? '#f2b544' : 'rgba(255,255,255,.06)', color: f.category === val ? '#2b1b00' : 'rgba(255,255,255,.6)' }
          }, label))
        ),
        React.createElement('input', {
          key: 'sub', value: f.subject || '', placeholder: 'Subject',
          onChange: (e) => this.setSupportField('subject', e.target.value),
          style: { width: '100%', padding: '11px 12px', borderRadius: 9, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }
        }),
        React.createElement('textarea', {
          key: 'msg', value: f.message || '', placeholder: 'What happened? Include an order number or fight name if it helps.',
          onChange: (e) => this.setSupportField('message', e.target.value),
          style: { width: '100%', minHeight: 92, padding: '11px 12px', borderRadius: 9, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', color: '#fff', fontSize: 12.5, fontWeight: 600, outline: 'none', boxSizing: 'border-box', resize: 'vertical', marginBottom: 8, fontFamily: 'inherit' }
        }),
        !this.props.currentUser ? React.createElement('input', {
          key: 'em', value: f.email || '', placeholder: 'Your email',
          onChange: (e) => this.setSupportField('email', e.target.value),
          style: { width: '100%', padding: '11px 12px', borderRadius: 9, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }
        }) : null,
        s.supportError ? React.createElement('div', { key: 'e', style: { fontSize: 10.5, fontWeight: 800, color: '#ff8b8b', marginBottom: 8 } }, s.supportError) : null,
        React.createElement('div', {
          key: 'go', onClick: this.submitSupport,
          style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: s.supportBusy ? 'rgba(242,181,68,.4)' : 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 900, fontSize: 13, cursor: 'pointer' }
        }, s.supportBusy ? 'SENDING\u2026' : 'SEND MESSAGE')
      ]);
    }

    if (s.modal === 'auth') {
      const f = s.authForm;
      const isSignup = s.authMode === 'signup';
      const field = (label, key, type, placeholder) => React.createElement('div', { key: key, style: { marginBottom: 10 } },
        React.createElement('div', { style: { fontSize: 9.5, fontWeight: 900, color: 'rgba(255,255,255,.5)', letterSpacing: .5, marginBottom: 4 } }, label),
        React.createElement('input', {
          type, value: f[key] || '', placeholder,
          onChange: (e) => this.setAuthField(key, e.target.value),
          style: { width: '100%', padding: '11px 12px', borderRadius: 9, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }
        })
      );
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 19, color: '#f2b544', marginBottom: 2 } }, isSignup ? 'JOIN FANTASY MMAdness' : 'WELCOME BACK'),
        React.createElement('div', { key: 'sub', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginBottom: 14 } },
          s.modalData?.type === 'joinLeague' ? 'Sign in and we\u2019ll drop you straight into that league.'
            : s.modalData?.type === 'enterEvent' ? 'Sign in and your picks go through \u2014 nothing is lost.'
            : isSignup ? 'Free to join. 500 FM to start.' : 'Sign in to keep your picks and coins.'),
        React.createElement('div', { key: 'tabs', style: { display: 'flex', gap: 6, marginBottom: 14 } },
          [['login', 'SIGN IN'], ['signup', 'CREATE ACCOUNT']].map(([mode, label]) => React.createElement('div', {
            key: mode, onClick: () => this.setAuthMode(mode),
            style: { flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, fontSize: 10.5, fontWeight: 900, cursor: 'pointer', background: s.authMode === mode ? '#f2b544' : 'rgba(255,255,255,.06)', color: s.authMode === mode ? '#2b1b00' : 'rgba(255,255,255,.6)' }
          }, label))
        ),
        isSignup ? field('PLAYER NAME', 'name', 'text', 'What other players see') : null,
        field('EMAIL', 'email', 'email', 'you@example.com'),
        React.createElement('div', { key: 'pw', style: { marginBottom: 10 } },
          React.createElement('div', { style: { fontSize: 9.5, fontWeight: 900, color: 'rgba(255,255,255,.5)', letterSpacing: .5, marginBottom: 4 } }, 'PASSWORD'),
          React.createElement('div', { style: { position: 'relative' } },
            React.createElement('input', {
              type: s.showPassword ? 'text' : 'password',
              value: f.password || '',
              placeholder: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
              onChange: (e) => this.setAuthField('password', e.target.value),
              style: { width: '100%', padding: '11px 44px 11px 12px', borderRadius: 9, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }
            }),
            React.createElement('div', {
              role: 'button', tabIndex: 0,
              'aria-label': s.showPassword ? 'Hide password' : 'Show password',
              onClick: this.togglePassword,
              style: { position: 'absolute', right: 4, top: 0, bottom: 0, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: s.showPassword ? '#f2b544' : 'rgba(255,255,255,.45)' }
            },
              React.createElement('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
                s.showPassword
                  ? React.createElement('g', null,
                      React.createElement('path', { d: 'M9.88 9.88a3 3 0 1 0 4.24 4.24' }),
                      React.createElement('path', { d: 'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68' }),
                      React.createElement('path', { d: 'M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61' }),
                      React.createElement('line', { x1: 2, y1: 2, x2: 22, y2: 22 })
                    )
                  : React.createElement('g', null,
                      React.createElement('path', { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' }),
                      React.createElement('circle', { cx: 12, cy: 12, r: 3 })
                    )
              )
            )
          )
        ),
        !isSignup ? React.createElement('div', {
          key: 'forgot', onClick: this.startPasswordReset,
          style: { textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#4d8dff', cursor: 'pointer', marginBottom: 10, marginTop: -2 }
        }, 'Forgot your password?') : null,
        s.authNotice ? React.createElement('div', { key: 'notice', style: { fontSize: 10.5, fontWeight: 800, color: '#a8f0c4', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 8, padding: '9px 10px', marginBottom: 10, lineHeight: 1.5 } }, s.authNotice) : null,
        s.authError ? React.createElement('div', { key: 'err', style: { fontSize: 10.5, fontWeight: 800, color: '#ff8b8b', marginBottom: 10 } }, s.authError) : null,
        React.createElement('div', {
          key: 'go', onClick: this.submitAuth,
          style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: s.authBusy ? 'rgba(242,181,68,.4)' : 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 900, fontSize: 13, cursor: 'pointer', marginTop: 4 }
        }, s.authBusy ? 'ONE MOMENT\u2026' : isSignup ? 'CREATE MY ACCOUNT' : 'SIGN IN'),
        React.createElement('div', { key: 'note', style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: 10 } }, 'Your picks are saved while you sign in.')
      ]);
    }

    if (s.modal === 'affiliateDash') {
      const p = s.affiliateProfile;
      const joined = Array.isArray(p?.usersJoined) ? p.usersJoined : [];
      const payouts = Array.isArray(p?.payouts) ? p.payouts : [];
      const balance = Number(p?.tokens || 0);
      const stat = (label, value, color) => React.createElement('div', {
        key: label, style: { flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }
      },
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: color || '#fff' } }, value),
        React.createElement('div', { style: { fontSize: 8.5, fontWeight: 900, color: 'rgba(255,255,255,.45)', letterSpacing: .5, marginTop: 2 } }, label)
      );
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 19, color: '#4d8dff', marginBottom: 2 } }, 'AFFILIATE DASHBOARD'),
        React.createElement('div', { key: 'sub', style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 14 } }, p ? (p.playerName || [p.firstName, p.lastName].filter(Boolean).join(' ')) : 'Your league at a glance'),
        s.affiliateBusy && !p ? React.createElement('div', { key: 'load', style: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', padding: '18px 0', textAlign: 'center' } }, 'Loading your dashboard\u2026') : null,
        s.affiliateError ? React.createElement('div', { key: 'err', style: { fontSize: 10.5, fontWeight: 800, color: '#ff8b8b', marginBottom: 10 } }, s.affiliateError) : null,
        p ? React.createElement('div', { key: 'stats', style: { display: 'flex', gap: 6, marginBottom: 14 } },
          stat('MEMBERS', joined.length, '#4d8dff'),
          stat('PROMOTED', s.affiliatePromoted.length, '#a855f7'),
          stat('BALANCE', balance.toLocaleString(), '#22c55e')
        ) : null,
        p ? React.createElement('div', { key: 'plabel', style: { fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.5)', letterSpacing: .5, marginBottom: 6 } }, 'FIGHTS YOU\u2019RE PROMOTING') : null,
        p ? React.createElement('div', { key: 'promoted', style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 } },
          s.affiliatePromoted.length
            ? s.affiliatePromoted.slice(0, 6).map((f, i) => React.createElement('div', {
                key: f._id || f.id || i,
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 10px', borderRadius: 8, background: 'rgba(77,141,255,.08)', border: '1px solid rgba(77,141,255,.25)' }
              },
                React.createElement('div', { style: { fontSize: 11, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                  (f.matchFighterA || f.fighterA || 'Fighter A') + ' vs ' + (f.matchFighterB || f.fighterB || 'Fighter B')),
                React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: '#f2b544', flex: '0 0 auto', marginLeft: 8 } },
                  (Array.isArray(f.userPredictions) ? f.userPredictions.length : 0) + ' IN')
              ))
            : React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.45)', padding: '10px 0' } }, 'Nothing promoted yet \u2014 share a fight to get your league moving.')
        ) : null,
        p ? React.createElement('div', { key: 'mlabel', style: { fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.5)', letterSpacing: .5, marginBottom: 6 } }, 'YOUR MEMBERS') : null,
        p ? React.createElement('div', { key: 'members', style: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 } },
          joined.length
            ? joined.slice(0, 8).map((m, i) => React.createElement('div', {
                key: m.userId || i, style: { display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.7)', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,.04)' }
              },
                React.createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, m.email || 'Player'),
                React.createElement('span', { style: { color: 'rgba(255,255,255,.4)', flex: '0 0 auto', marginLeft: 8 } }, m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '')
              ))
            : React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.45)', padding: '10px 0' } }, 'No members yet \u2014 share your link to bring people in.')
        ) : null,
        p ? React.createElement('div', {
          key: 'payout', onClick: this.requestPayout,
          style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: balance > 0 ? 'linear-gradient(90deg,#22c55e,#15803d)' : 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 900, fontSize: 12, cursor: balance > 0 ? 'pointer' : 'default', marginBottom: 8 }
        }, balance > 0 ? 'REQUEST PAYOUT \u2014 ' + balance.toLocaleString() + ' FM' : 'NO BALANCE TO PAY OUT YET') : null,
        p && payouts.length ? React.createElement('div', { key: 'plast', style: { fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.4)', textAlign: 'center' } }, payouts.length + ' payout' + (payouts.length === 1 ? '' : 's') + ' on record') : null,
        React.createElement('div', {
          key: 'share', onClick: this.copyReferral,
          style: { textAlign: 'center', padding: '11px 0', borderRadius: 999, border: '1px solid rgba(77,141,255,.5)', color: '#4d8dff', fontWeight: 900, fontSize: 11.5, cursor: 'pointer', marginTop: 10 }
        }, 'COPY MY REFERRAL LINK')
      ]);
    }

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
        key: t, onClick: () => this.openMenuItem(t),
        style: { padding: '12px 4px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', color: 'rgba(255,255,255,.7)' }
      }, t)),
      // Reachable from anywhere: the Terms say a player agrees by using the app,
      // which only holds if they can actually find them. Also required on the
      // App Store and Play Store listings.
      React.createElement('a', {
        key: 'terms-link', href: '/terms', target: '_blank', rel: 'noopener noreferrer',
        style: { display: 'block', padding: '12px 4px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }
      }, 'Terms of Use')
    ]);

    if (s.modal === 'feedback') {
      const f = s.feedback;
      const input = {
        width: '100%', padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,.06)',
        border: '1px solid rgba(255,255,255,.16)', color: '#fff', fontSize: 12,
        fontFamily: "'Rajdhani',sans-serif", marginBottom: 10, resize: 'vertical',
      };
      const sevs = [
        ['blocker', 'Stuck', '#ef4444'],
        ['wrong', 'Wrong', '#f2b544'],
        ['confusing', 'Confusing', '#4d8dff'],
        ['cosmetic', 'Looks off', '#a855f7'],
        ['praise', 'Liked it', '#22c55e'],
      ];
      const areas = [
        ['signup', 'Sign up'], ['signin', 'Sign in'], ['scorecard', 'Scorecard'],
        ['entry-fee', 'Coins / fee'], ['team-card', 'Team Card'], ['season-card', 'Season Card'],
        ['standings', 'Standings'], ['leagues', 'Leagues'], ['promoter-tools', 'League tools'],
        ['notifications', 'Bell'], ['coins-purchase', 'Buying coins'], ['rewards', 'Chest / wheel'],
        ['looks-wrong', 'Looks wrong'], ['slow', 'Too slow'], ['other', 'Something else'],
      ];
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#f2b544', marginBottom: 3 } }, 'REPORT SOMETHING'),
        React.createElement('div', { key: 'sub', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginBottom: 12 } },
          'Two boxes matter most: what you expected, and what actually happened. That pair is what makes something fixable.'
        ),

        React.createElement('div', { key: 'sl', style: { fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'HOW BAD?'),
        React.createElement('div', { key: 'sev', style: { display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 } },
          sevs.map(([key, label, color]) => React.createElement('div', {
            key,
            onClick: () => this.setFeedbackField('severity', key),
            role: 'button', tabIndex: 0,
            style: {
              padding: '7px 11px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer',
              background: f.severity === key ? color : 'rgba(255,255,255,.06)',
              color: f.severity === key ? '#0b0c10' : 'rgba(255,255,255,.75)',
              border: '1px solid ' + (f.severity === key ? color : 'rgba(255,255,255,.14)'),
            },
          }, label))
        ),

        React.createElement('div', { key: 'al', style: { fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'WHERE?'),
        React.createElement('div', { key: 'area', style: { display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 } },
          areas.map(([key, label]) => React.createElement('div', {
            key,
            onClick: () => this.setFeedbackField('area', key),
            role: 'button', tabIndex: 0,
            style: {
              padding: '6px 10px', borderRadius: 7, fontSize: 9.5, fontWeight: 800, cursor: 'pointer',
              background: f.area === key ? 'rgba(242,181,68,.85)' : 'rgba(255,255,255,.06)',
              color: f.area === key ? '#2b1b00' : 'rgba(255,255,255,.7)',
              border: '1px solid ' + (f.area === key ? '#f2b544' : 'rgba(255,255,255,.12)'),
            },
          }, label))
        ),

        React.createElement('input', {
          key: 'step', type: 'text', placeholder: 'Step number, if you were on the list (optional)',
          value: f.step, onChange: (ev) => this.setFeedbackField('step', ev.target.value.slice(0, 20)),
          style: input,
        }),
        React.createElement('textarea', {
          key: 'exp', rows: 2, placeholder: 'What did you expect to happen?',
          value: f.expected, onChange: (ev) => this.setFeedbackField('expected', ev.target.value),
          style: input,
        }),
        React.createElement('textarea', {
          key: 'act', rows: 3, placeholder: 'What actually happened? (required)',
          value: f.actual, onChange: (ev) => this.setFeedbackField('actual', ev.target.value),
          style: { ...input, border: '1px solid rgba(242,181,68,.45)' },
        }),
        React.createElement('div', { key: 'note', style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 12, lineHeight: 1.5 } },
          'Your phone and which screen you were on are attached automatically. If you have a screenshot, text it over with the reference you get back.'
        ),
        React.createElement('div', {
          key: 'go',
          onClick: () => { if (!s.feedbackBusy) this.submitFeedback(); },
          role: 'button', tabIndex: 0,
          style: {
            textAlign: 'center', padding: '13px 0', borderRadius: 999, background: '#f2b544',
            color: '#2b1b00', fontWeight: 900, fontSize: 13, cursor: 'pointer',
            opacity: s.feedbackBusy ? .6 : 1,
          },
        }, s.feedbackBusy ? 'SENDING…' : 'SEND REPORT')
      ]);
    }

    if (s.modal === 'standings') {
      const st = s.standings || {};
      const rows = Array.isArray(st.rows) ? st.rows : [];
      const medal = ['#f2b544', '#c9ccd1', '#c9772e'];
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#f2b544', marginBottom: 2 } }, 'STANDINGS'),
        React.createElement('div', { key: 'n', style: { fontSize: 12, fontWeight: 800, marginBottom: 2 } }, st.title || ''),
        st.subtitle && React.createElement('div', { key: 'sub', style: { fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.45)', marginBottom: 12 } }, st.subtitle),

        st.loading
          ? React.createElement('div', { key: 'load', style: { padding: '20px 4px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)' } }, 'Loading standings…')
          : rows.length === 0
            ? React.createElement('div', { key: 'empty', style: { padding: '18px 4px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 } },
                'No scores yet. Standings appear once the first fight on this card has been scored.')
            : React.createElement('div', { key: 'rows', style: { display: 'flex', flexDirection: 'column' } },
                rows.map((row) => React.createElement('div', {
                  key: row.place,
                  style: {
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                    borderBottom: '1px solid rgba(255,255,255,.07)',
                  },
                },
                  React.createElement('div', {
                    style: {
                      width: 26, flex: '0 0 26px', textAlign: 'center', fontSize: 12, fontWeight: 900,
                      fontVariantNumeric: 'tabular-nums',
                      color: medal[row.place - 1] || 'rgba(255,255,255,.4)',
                    },
                  }, row.place),
                  React.createElement('div', {
                    style: {
                      width: 30, height: 30, flex: '0 0 30px', borderRadius: '50%', overflow: 'hidden',
                      background: 'rgba(255,255,255,.08)',
                    },
                  }, row.avatar
                    ? React.createElement('img', { src: row.avatar, alt: '', style: { width: '100%', height: '100%', objectFit: 'cover' } })
                    : null),
                  React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                    React.createElement('div', { style: { fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, row.name),
                    // Team Cards report how many of a team's fighters have been
                    // scored, which explains a low score mid-card.
                    Number.isFinite(Number(row.fightsScored)) && React.createElement('div', { style: { fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.38)' } },
                      Number(row.fightsScored) + ' scored')
                  ),
                  React.createElement('div', { style: { fontSize: 12.5, fontWeight: 900, color: '#f2b544', fontVariantNumeric: 'tabular-nums' } },
                    Number(row.score || 0).toLocaleString() + (st.unit === '/500' ? ' /500' : ''))
                ))
              )
      ]);
    }

    // POT STANDINGS — who is winning THIS contest, not the global board. The
    // mockup had sample rows; this reads the real leaderboard the app already
    // holds and marks the signed-in player.
    if (s.modal === 'leagueBoard') {
      const sf = s.modalData || {};
      const rows = (Array.isArray(this.props.leaderboard) ? this.props.leaderboard : []).slice(0, 12);
      const myName = String(this.props.playerName || '').toLowerCase();
      return overlay([
        closeBtn,
        React.createElement('div', { key: 'k', style: { fontSize: 9.5, fontWeight: 900, letterSpacing: .8, color: '#f2b544', marginBottom: 3 } },
          (sf.tag || 'LEAGUE') + ' \u00b7 POT STANDINGS'),
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 19, marginBottom: 4 } }, 'THIS POT\u2019S STANDINGS'),
        React.createElement('div', { key: 's', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginBottom: 14, lineHeight: 1.5 } },
          sf.pot > 0
            ? Number(sf.pot).toLocaleString() + ' FM in the pot \u00b7 only entrants in this contest count'
            : 'Only players in this contest count towards these standings.'),
        rows.length === 0
          ? React.createElement('div', { key: 'empty', style: { padding: 16, borderRadius: 11, background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.15)', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 } },
              'Standings appear once the first scorecards are scored.')
          : React.createElement('div', { key: 'list', style: { display: 'flex', flexDirection: 'column', gap: 6 } },
              rows.map((row, index) => {
                const name = String(row.playerName || row.displayName || row.username || row.name || 'Player');
                const isYou = myName && name.toLowerCase() === myName;
                return React.createElement('div', {
                  key: name + index,
                  style: {
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
                    background: isYou ? 'rgba(242,181,68,.14)' : 'rgba(255,255,255,.04)',
                    border: '1px solid ' + (isYou ? 'rgba(242,181,68,.5)' : 'rgba(255,255,255,.08)'),
                  },
                },
                  React.createElement('div', { style: { width: 20, textAlign: 'center', fontWeight: 900, fontSize: 12, color: index < 3 ? '#f2b544' : 'rgba(255,255,255,.5)' } }, index + 1),
                  React.createElement('div', { style: { flex: 1, fontWeight: 800, fontSize: 11.5, color: isYou ? '#f2b544' : '#fff' } }, isYou ? 'You' : name),
                  React.createElement('div', { style: { fontWeight: 900, fontSize: 11.5, color: 'rgba(255,255,255,.7)', fontVariantNumeric: 'tabular-nums' } },
                    Number(row.totalPoints ?? row.points ?? row.score ?? 0).toLocaleString() + ' pts')
                );
              })
            )
      ]);
    }

    // ENTERED — the confirmation after paying an entry fee. This is where a player
    // sees the money actually left their wallet, so it shows the real balance.
    if (s.modal === 'entered') {
      const d = s.modalData || {};
      const low = s.coins < 100;
      return overlay([
        React.createElement('div', { key: 'i', style: { textAlign: 'center', fontSize: 40, marginBottom: 6 } }, '\ud83e\udd4a'),
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 21, color: '#22c55e', textAlign: 'center', marginBottom: 4 } }, 'YOU\u2019RE IN'),
        React.createElement('div', { key: 's', style: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', textAlign: 'center', marginBottom: 14 } },
          (d.f1 && d.f2 ? d.f1 + ' vs ' + d.f2 : (d.tag || 'Contest'))
          + ' \u00b7 ' + Number(d.fee || 0).toLocaleString() + ' FM entered'),
        React.createElement('div', {
          key: 'bal',
          style: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '11px 13px', borderRadius: 10, background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.12)', marginBottom: 12,
          },
        },
          React.createElement('span', { style: { fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,.55)' } }, 'WALLET BALANCE'),
          React.createElement('span', { style: { fontSize: 13, fontWeight: 900, color: low ? '#ef4444' : '#f2b544' } }, Number(s.coins || 0).toLocaleString() + ' FM')
        ),
        low
          ? React.createElement('div', {
              key: 'top',
              onClick: () => this.openModal('addcoins'),
              role: 'button', tabIndex: 0,
              style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(90deg,#f2b544,#df111b)', color: '#fff', fontFamily: "'Anton',sans-serif", fontSize: 13, cursor: 'pointer', marginBottom: 9 },
            }, 'TOP UP MY WALLET')
          : React.createElement('div', {
              key: 'more',
              onClick: () => { this.closeModal(); this.setTab('contests'); },
              role: 'button', tabIndex: 0,
              style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(90deg,#4d8dff,#a855f7)', color: '#fff', fontFamily: "'Anton',sans-serif", fontSize: 13, cursor: 'pointer', marginBottom: 9 },
            }, 'ENTER ANOTHER CONTEST'),
        React.createElement('div', {
          key: 'lb',
          onClick: () => { this.closeModal(); this.setTab('leaderboard'); },
          role: 'button', tabIndex: 0,
          style: { textAlign: 'center', padding: '11px 0', borderRadius: 999, border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontWeight: 900, fontSize: 11.5, cursor: 'pointer', marginBottom: 10 },
        }, 'SEE WHERE I RANK'),
        React.createElement('div', { key: 'n', style: { fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.4)', textAlign: 'center', lineHeight: 1.5 } },
          'Live scoring starts when the fight does. You can edit your card until then.')
      ]);
    }

    // EDIT PROFILE — saves to the server. The mockup version only showed a toast.
    if (s.modal === 'editProfile') {
      const p = s.profileDraft;
      const row = (key, label, placeholder, extra = {}) => React.createElement('div', { key, style: { marginBottom: 10 } },
        React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 4 } }, label),
        React.createElement('input', {
          value: p[key] || '',
          onChange: (ev) => this.setProfileField(key, ev.target.value),
          placeholder,
          maxLength: extra.maxLength,
          style: {
            width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, padding: '10px 12px',
            color: '#fff', fontSize: 12.5, fontWeight: 700, fontFamily: "'Rajdhani',sans-serif",
          },
        })
      );
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, marginBottom: 12, color: '#f2b544' } }, 'EDIT PROFILE'),
        row('playerName', 'Display name', 'How other players see you', { maxLength: 24 }),
        row('firstName', 'First name', ''),
        row('lastName', 'Last name', ''),
        row('phone', 'Phone', 'Optional'),
        React.createElement('div', { key: 'note', style: { fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.4)', lineHeight: 1.5, marginBottom: 4 } },
          'Your email is used to sign in and cannot be changed here \u2014 contact support if you need it moved.'),
        React.createElement('div', {
          key: 'save',
          onClick: () => { if (!s.profileBusy) this.saveProfile(); },
          role: 'button', tabIndex: 0,
          style: {
            marginTop: 12, textAlign: 'center', padding: '12px 0', borderRadius: 999,
            background: 'linear-gradient(90deg,#4d8dff,#a855f7)', color: '#fff',
            fontWeight: 900, fontSize: 13, cursor: 'pointer', opacity: s.profileBusy ? .6 : 1,
          },
        }, s.profileBusy ? 'SAVING\u2026' : 'SAVE CHANGES')
      ]);
    }

    if (s.modal === 'billing') {
      const b = s.billing;
      const total = (s.cart || []).reduce((sum, item) => sum + (Number(item.priceCents || 0) * Number(item.quantity || 1)), 0);
      const field = (key, label, extra = {}) => React.createElement('div', { key, style: { marginBottom: 9 } },
        React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 4, letterSpacing: .3 } }, label.toUpperCase()),
        React.createElement('input', {
          value: b[key] || '',
          onChange: (ev) => this.setBillingField(key, ev.target.value),
          autoComplete: extra.autoComplete,
          inputMode: extra.inputMode,
          maxLength: extra.maxLength,
          placeholder: extra.placeholder || '',
          style: {
            width: '100%', padding: '11px 12px', borderRadius: 9,
            background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.18)',
            color: '#fff', fontSize: 12.5, fontWeight: 700, fontFamily: "'Rajdhani',sans-serif",
          },
        })
      );

      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#f2b544', marginBottom: 3 } }, 'BILLING DETAILS'),
        React.createElement('div', { key: 'why', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginBottom: 13 } },
          'Your bank checks this address against your card. You enter your card on the next screen — on our payment provider\u2019s secure page, never here.'
        ),
        total > 0 && React.createElement('div', {
          key: 'total',
          style: {
            marginBottom: 13, padding: '9px 11px', borderRadius: 9,
            background: 'rgba(242,181,68,.1)', border: '1px solid rgba(242,181,68,.35)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          },
        },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.6)' } }, 'TOTAL'),
          React.createElement('div', { style: { fontSize: 15, fontWeight: 900, color: '#f2b544' } }, '$' + (total / 100).toFixed(2))
        ),

        React.createElement('div', { key: 'names', style: { display: 'flex', gap: 8 } },
          React.createElement('div', { style: { flex: 1 } }, field('firstName', 'First name', { autoComplete: 'given-name' })),
          React.createElement('div', { style: { flex: 1 } }, field('lastName', 'Last name', { autoComplete: 'family-name' }))
        ),
        field('address', 'Street address', { autoComplete: 'street-address', placeholder: '123 Main St' }),
        React.createElement('div', { key: 'csz', style: { display: 'flex', gap: 8 } },
          React.createElement('div', { style: { flex: 2 } }, field('city', 'City', { autoComplete: 'address-level2' })),
          React.createElement('div', { style: { flex: 1 } }, field('state', 'State', { autoComplete: 'address-level1', maxLength: 2, placeholder: 'GA' })),
          React.createElement('div', { style: { flex: 1 } }, field('zipCode', 'ZIP', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 10 }))
        ),

        React.createElement('div', {
          key: 'go',
          onClick: () => { if (!s.checkoutBusy) this.submitCheckout(); },
          role: 'button', tabIndex: 0,
          style: {
            marginTop: 6, textAlign: 'center', padding: '13px 0', borderRadius: 999,
            background: 'linear-gradient(90deg,#f2b544,#df111b)', color: '#fff',
            fontFamily: "'Anton',sans-serif", fontSize: 13.5, cursor: 'pointer',
            opacity: s.checkoutBusy ? .6 : 1, letterSpacing: .4,
          },
        }, s.checkoutBusy ? 'OPENING SECURE CHECKOUT\u2026' : 'CONTINUE TO PAYMENT'),
        React.createElement('div', { key: 'safe', style: { marginTop: 9, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.4)', textAlign: 'center', lineHeight: 1.5 } },
          '\ud83d\udd12 Card details are handled by our payment provider. We never see or store your card number.'
        )
      ]);
    }

    if (s.modal === 'shareKit') {
      const kit = s.shareKit || {};
      const share = kit.share || {};
      const rows = [
        ['Facebook', share.facebook, '#4d8dff'],
        ['TikTok', share.tiktok, '#a855f7'],
        ['Text message', share.sms, '#22c55e'],
        ['Short version', share.short, '#f2b544'],
      ].filter(([, text]) => text);
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#f2b544', marginBottom: 3 } }, 'SHARE THIS CARD'),
        React.createElement('div', { key: 'sub', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', lineHeight: 1.5, marginBottom: 13 } },
          'Written for you. Tap to copy, then paste into a post — the link credits every signup to your league.'
        ),
        ...rows.map(([label, text, color]) => React.createElement('div', {
          key: label,
          onClick: () => this.copyText(text, label + ' post'),
          style: {
            marginBottom: 9, padding: 11, borderRadius: 11, cursor: 'pointer',
            background: 'rgba(255,255,255,.05)', border: '1px solid ' + color + '55',
          },
        },
          React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color, marginBottom: 4, letterSpacing: .4 } }, label.toUpperCase() + ' · TAP TO COPY'),
          React.createElement('div', { style: { fontSize: 11, fontWeight: 700, lineHeight: 1.45, color: 'rgba(255,255,255,.85)' } }, text)
        )),
        kit.joinLink && React.createElement('div', {
          key: 'link',
          onClick: () => this.copyText(kit.joinLink, 'League invite link'),
          style: {
            marginTop: 4, padding: 11, borderRadius: 11, cursor: 'pointer',
            background: 'rgba(242,181,68,.1)', border: '1px dashed rgba(242,181,68,.5)',
          },
        },
          React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: '#f2b544', marginBottom: 4 } }, 'LEAGUE INVITE LINK · TAP TO COPY'),
          React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.7)', wordBreak: 'break-all' } }, kit.joinLink)
        )
      ]);
    }

    if (s.modal === 'notif') return overlay([
      closeBtn,
      React.createElement('div', { key: 't', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
        React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#f2b544' } }, 'NOTIFICATIONS'),
        React.createElement('div', { onClick: this.markNotifsRead, style: { fontSize: 11, color: '#4d8dff', fontWeight: 700, cursor: 'pointer' } }, 'Mark all read')
      ),
      // Live feed first; s.notifications is the legacy prop list and only used
      // when the endpoint returned nothing.
      (s.notifFeed.length ? s.notifFeed : s.notifications).length === 0 && React.createElement('div', { key: 'empty', style: { padding: '18px 4px', color: 'rgba(255,255,255,.52)', fontSize: 11, fontWeight: 700 } }, 'No notifications yet.'),
      ...(s.notifFeed.length ? s.notifFeed : s.notifications).map((item, index) => React.createElement('div', { key: cleanText(item._id, item.id, index), style: { display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)', opacity: item.read || item.isRead ? .62 : 1 } },
        React.createElement('div', { style: { fontSize: 18 } }, cleanText(item.icon)
          || ({ NEW_FIGHT: '🥊', FIGHT_SETTLED: '🏆', COINS_IN: '💰', COINS_OUT: '🎟' })[item.type]
          || '🔔'),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', { style: { fontSize: 12, fontWeight: item.unread ? 900 : 700, color: item.unread ? '#fff' : 'rgba(255,255,255,.72)' } },
            cleanText(item.message, item.text, item.title, 'Fantasy MMAdness update')),
          cleanText(item.body) && React.createElement('div', { style: { marginTop: 2, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.45)' } }, item.body),
          cleanText(item.createdAt, item.date, item.at) && React.createElement('div', { style: { marginTop: 2, fontSize: 9, color: 'rgba(255,255,255,.35)' } }, new Date(cleanText(item.createdAt, item.date)).toLocaleString())
        )
      )),
      React.createElement('button', { key: 'push', type: 'button', onClick: async () => { const result = await this.props.onEnablePush?.(); this.showToast(result?.message || (result?.ok ? 'Browser alerts enabled' : 'Browser alerts were not enabled')); }, style: { width: '100%', minHeight: 44, marginTop: 14, border: '1px solid rgba(77,141,255,.45)', borderRadius: 999, background: 'linear-gradient(90deg,rgba(77,141,255,.22),rgba(168,85,247,.22))', color: '#fff', fontFamily: designTokens.font.body, fontWeight: 900, cursor: 'pointer' } }, 'ENABLE BROWSER ALERTS')
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
        React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginBottom: 12 } }, '$4.99 \u00b7 30-day pass \u00b7 no auto-renew'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 } },
          ['FM+ access for 30 days', 'Early access to new Fantasy Cards', 'Exclusive FM+ private leagues', 'No ads across the app', 'Streak-save discount: 25 FM instead of 50'].map((f, i) => React.createElement('div', {
            key: i, style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,.85)' }
          },
            React.createElement('span', { style: { color: '#a855f7', fontWeight: 900 } }, '\u2713'), f
          ))
        )
      ),
      !s.isSubscribed && React.createElement('div', { key: 'plans', style: { marginBottom: 10, padding: '11px 10px', borderRadius: 10, textAlign: 'center', background: 'rgba(168,85,247,.18)', border: '1.5px solid #a855f7', color: '#fff' } },
        React.createElement('strong', { style: { display: 'block', fontSize: 13 } }, '$4.99'),
        React.createElement('small', { style: { display: 'block', marginTop: 2, fontSize: 8.5, color: 'rgba(255,255,255,.6)' } }, '30-day pass · no auto-renew')
      ),
      React.createElement('div', {
        onClick: this.subscribeFmPlus,
        style: { textAlign: 'center', padding: '13px 0', borderRadius: 999, background: 'linear-gradient(90deg,#a855f7,#4d8dff)', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 14px rgba(168,85,247,.6)' }
      }, s.isSubscribed ? 'YOU\u2019RE AN FM+ MEMBER \u2713' : 'GET 30-DAY PASS \u2014 $4.99')
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
      const rIdx = d.activeRound || 0;
      const rd = d.rounds[rIdx] || { a: {}, b: {}, winner: null };
      const cats = ['hp', 'bp', 'tp'];
      const catLabel = { hp: 'HEAD PUNCHES', bp: 'BODY PUNCHES', tp: 'TOTAL PUNCHES' };
      const done = d.rounds.filter(r => r.winner).length;
      const mini = (who, cat) => React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } },
        React.createElement('div', { onClick: () => this.updateBoxingCard(who, cat, -1), style: { width: 20, height: 20, borderRadius: 5, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, fontSize: 11 } }, '−'),
        React.createElement('div', { style: { width: 26, textAlign: 'center', fontWeight: 800, fontSize: 13 } }, rd[who][cat] || 0),
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
        React.createElement('div', { key: 's', style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 10 } }, 'You score the number you call — but only if he hits it or better. Call 30 head punches, he throws 35 → +30. He throws 20 → nothing.'),
        React.createElement('div', { key: 'prog', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: done === d.rounds.length ? '#22c55e' : '#f2b544' } }, done + ' / ' + d.rounds.length + ' ROUNDS PICKED'),
          done < d.rounds.length && React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: '#ef4444' } }, 'INCOMPLETE CARD = LOST POT')
        ),
        React.createElement('div', { key: 'quick', style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } },
          React.createElement('div', { style: { fontSize: 8.5, fontWeight: 900, color: 'rgba(255,255,255,.4)', letterSpacing: .4, flex: '0 0 auto' } }, 'QUICK FILL'),
          [['a', ev.f1], ['b', ev.f2]].map(([w, label]) => React.createElement('div', {
            key: w, onClick: () => this.quickFillRounds('boxingDraft', w),
            style: { flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 7, fontSize: 9.5, fontWeight: 900, cursor: 'pointer', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(242,181,68,.35)', color: '#f2b544', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
          }, label + ' ALL'))
        ),
        React.createElement('div', { key: 'tabs', style: { display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 6, marginBottom: 10 } },
          d.rounds.map((r, i) => React.createElement('div', {
            key: i, onClick: () => this.setBoxingRound(i),
            style: {
              flex: '0 0 auto', minWidth: 34, textAlign: 'center', padding: '6px 8px', borderRadius: 7, fontSize: 10, fontWeight: 900, cursor: 'pointer',
              background: i === rIdx ? '#f2b544' : r.winner ? 'rgba(34,197,94,.18)' : 'rgba(255,255,255,.06)',
              color: i === rIdx ? '#2b1b00' : r.winner ? '#22c55e' : 'rgba(255,255,255,.55)',
              border: '1px solid ' + (i === rIdx ? '#f2b544' : r.winner ? 'rgba(34,197,94,.45)' : 'rgba(255,255,255,.1)')
            }
          }, 'R' + (i + 1)))
        ),
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
        React.createElement('div', { key: 'wl', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'WHO WINS ROUND ' + (rIdx + 1) + '?'),
        React.createElement('div', { key: 'wrow', style: { display: 'flex', gap: 6, marginBottom: 14 } },
          [['a', ev.f1], ['b', ev.f2]].map(([w, label]) => React.createElement('div', {
            key: w, onClick: () => this.setBoxingWinner(w),
            style: { flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: rd.winner === w ? '#f2b544' : 'rgba(255,255,255,.06)', color: rd.winner === w ? '#2b1b00' : '#fff' }
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
        React.createElement('div', { key: 'submit', onClick: () => this.submitBoxingScorecard(ev), style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: done === d.rounds.length ? '#f2b544' : 'rgba(242,181,68,.35)', color: '#2b1b00', fontWeight: 900, fontSize: 13, cursor: 'pointer' } }, done === d.rounds.length ? 'SUBMIT SCORECARD — ' + this.getEventEntryLabel(ev) : 'FINISH ALL ' + d.rounds.length + ' ROUNDS TO ENTER')
      ]);
    }

    if (s.modal === 'mmaScorecard') {
      const ev = s.modalData; const d = s.mmaDraft;
      const rIdx = d.activeRound || 0;
      const rd = d.rounds[rIdx] || { a: {}, b: {}, winner: null };
      const done = d.rounds.filter(r => r.winner).length;
      const cats = ['hp', 'bp', 'kicks', 'knees', 'elbows'];
      const mini = (who, cat) => React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } },
        React.createElement('div', { onClick: () => this.updateMmaCard(who, cat, -1), style: { width: 20, height: 20, borderRadius: 5, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, fontSize: 11 } }, '−'),
        React.createElement('div', { style: { width: 26, textAlign: 'center', fontWeight: 800, fontSize: 13 } }, rd[who][cat] || 0),
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
        React.createElement('div', { key: 's', style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 10 } }, 'You score the number you call — but only if he hits it or better. Call 30, he throws 35 → +30. He throws 20 → nothing.'),
        React.createElement('div', { key: 'prog', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } },
          React.createElement('div', { style: { fontSize: 10, fontWeight: 900, color: done === d.rounds.length ? '#22c55e' : '#4d8dff' } }, done + ' / ' + d.rounds.length + ' ROUNDS PICKED'),
          done < d.rounds.length && React.createElement('div', { style: { fontSize: 9, fontWeight: 800, color: '#ef4444' } }, 'INCOMPLETE CARD = LOST POT')
        ),
        React.createElement('div', { key: 'quick', style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } },
          React.createElement('div', { style: { fontSize: 8.5, fontWeight: 900, color: 'rgba(255,255,255,.4)', letterSpacing: .4, flex: '0 0 auto' } }, 'QUICK FILL'),
          [['a', ev.f1], ['b', ev.f2]].map(([w, label]) => React.createElement('div', {
            key: w, onClick: () => this.quickFillRounds('mmaDraft', w),
            style: { flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 7, fontSize: 9.5, fontWeight: 900, cursor: 'pointer', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(77,141,255,.35)', color: '#4d8dff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
          }, label + ' ALL'))
        ),
        React.createElement('div', { key: 'tabs', style: { display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 6, marginBottom: 10 } },
          d.rounds.map((r, i) => React.createElement('div', {
            key: i, onClick: () => this.setMmaRound(i),
            style: {
              flex: '0 0 auto', minWidth: 34, textAlign: 'center', padding: '6px 8px', borderRadius: 7, fontSize: 10, fontWeight: 900, cursor: 'pointer',
              background: i === rIdx ? '#4d8dff' : r.winner ? 'rgba(34,197,94,.18)' : 'rgba(255,255,255,.06)',
              color: i === rIdx ? '#04122b' : r.winner ? '#22c55e' : 'rgba(255,255,255,.55)',
              border: '1px solid ' + (i === rIdx ? '#4d8dff' : r.winner ? 'rgba(34,197,94,.45)' : 'rgba(255,255,255,.1)')
            }
          }, 'R' + (i + 1)))
        ),
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
        React.createElement('div', { key: 'wl', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'WHO WINS ROUND ' + (rIdx + 1) + '?'),
        React.createElement('div', { key: 'wrow', style: { display: 'flex', gap: 6, marginBottom: 14 } },
          [['a', ev.f1], ['b', ev.f2]].map(([w, label]) => React.createElement('div', {
            key: w, onClick: () => this.setMmaWinner(w),
            style: { flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', background: rd.winner === w ? '#4d8dff' : 'rgba(255,255,255,.06)', color: '#fff' }
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
        React.createElement('div', { key: 'submit', onClick: () => this.submitMmaScorecard(ev), style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: done === d.rounds.length ? '#4d8dff' : 'rgba(77,141,255,.35)', fontWeight: 900, fontSize: 13, cursor: 'pointer' } }, done === d.rounds.length ? 'SUBMIT SCORECARD — ' + this.getEventEntryLabel(ev) : 'FINISH ALL ' + d.rounds.length + ' ROUNDS TO ENTER')
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

    if (s.modal === 'teamDraft') {
      const contest = s.modalData;
      const picked = Object.keys(s.teamDraft).length;
      const familyOf = (category) => {
        const c = String(category || '').toLowerCase();
        return c.includes('box') || c.includes('knuckle') ? 'boxing' : c.includes('wrestl') ? 'wrestling' : 'mma';
      };
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#f2b544', marginBottom: 3 } }, 'BUILD YOUR TEAM'),
        React.createElement('div', { key: 'sub', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 4 } },
          contest.name + (contest.eventName ? ' \u00b7 ' + contest.eventName : '')),
        React.createElement('div', { key: 'how', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginBottom: 10 } },
          'Pick ' + contest.picksRequired + ' fighters — one per bout. Your score is everything they do on the night, added together using the same scoring as your scorecards.'
        ),
        React.createElement('div', {
          key: 'count',
          style: { fontSize: 11, fontWeight: 900, marginBottom: 11, color: picked === contest.picksRequired ? '#22c55e' : '#f2b544' },
        }, picked + ' of ' + contest.picksRequired + ' picked'),

        React.createElement('div', { key: 'bouts', style: { display: 'flex', flexDirection: 'column', gap: 10 } },
          contest.bouts.map(bout => {
            const pick = s.teamDraft[bout.fightId];
            const cats = s.teamMeta.callCategories?.[familyOf(bout.category)] || {};
            const atLimit = picked >= contest.picksRequired && !pick;
            return React.createElement('div', {
              key: bout.fightId,
              style: {
                padding: 10, borderRadius: 11,
                background: pick ? 'rgba(242,181,68,.1)' : 'rgba(255,255,255,.04)',
                border: '1px solid ' + (pick ? 'rgba(242,181,68,.45)' : 'rgba(255,255,255,.1)'),
                opacity: bout.open ? 1 : .45,
              },
            },
              React.createElement('div', { style: { fontSize: 8.5, fontWeight: 800, color: 'rgba(255,255,255,.4)', marginBottom: 6 } },
                (bout.category || '').toUpperCase() + (bout.rounds ? ' \u00b7 ' + bout.rounds + ' RDS' : '')
                + (bout.open ? '' : ' \u00b7 LOCKED')),
              React.createElement('div', { style: { display: 'flex', gap: 7 } },
                [bout.fighterA, bout.fighterB].map(name => React.createElement('div', {
                  key: name,
                  onClick: () => { if (bout.open && !atLimit) this.setTeamPick(bout.fightId, name); },
                  style: {
                    flex: 1, padding: '10px 8px', borderRadius: 9, textAlign: 'center',
                    fontSize: 10.5, fontWeight: 900, color: '#fff',
                    cursor: bout.open && !atLimit ? 'pointer' : 'default',
                    background: pick?.fighterName === name ? '#f2b544' : 'rgba(255,255,255,.06)',
                    color: pick?.fighterName === name ? '#2b1b00' : '#fff',
                    border: '1px solid ' + (pick?.fighterName === name ? '#f2b544' : 'rgba(255,255,255,.12)'),
                  },
                }, name))
              ),
              pick && Object.keys(cats).length > 0 && React.createElement('div', { style: { marginTop: 8 } },
                React.createElement('div', { style: { fontSize: 8.5, fontWeight: 900, color: '#f2b544', marginBottom: 5 } }, 'CALL A NUMBER — OPTIONAL BONUS'),
                React.createElement('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 } },
                  Object.entries(cats).map(([code, label]) => React.createElement('div', {
                    key: code,
                    onClick: () => this.setTeamCall(bout.fightId, 'calledCategory', pick.calledCategory === code ? '' : code),
                    style: {
                      padding: '4px 8px', borderRadius: 6, fontSize: 8.5, fontWeight: 800, cursor: 'pointer',
                      background: pick.calledCategory === code ? 'rgba(242,181,68,.85)' : 'rgba(255,255,255,.06)',
                      color: pick.calledCategory === code ? '#2b1b00' : 'rgba(255,255,255,.7)',
                      border: '1px solid ' + (pick.calledCategory === code ? '#f2b544' : 'rgba(255,255,255,.12)'),
                    },
                  }, label))
                ),
                pick.calledCategory && React.createElement('input', {
                  type: 'number', inputMode: 'numeric', placeholder: 'How many on the night?',
                  value: pick.calledValue || '',
                  onChange: (ev) => this.setTeamCall(bout.fightId, 'calledValue', ev.target.value.replace(/\D/g, '')),
                  style: {
                    width: '100%', padding: '8px 10px', borderRadius: 7, background: 'rgba(0,0,0,.25)',
                    border: '1px solid rgba(242,181,68,.4)', color: '#fff', fontSize: 10.5,
                    fontWeight: 800, fontFamily: "'Rajdhani',sans-serif",
                  },
                })
              )
            );
          })
        ),

        React.createElement('div', { key: 'note', style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.4)', margin: '11px 0', lineHeight: 1.5 } },
          'One fighter per bout — you cannot back both sides of the same fight.'
        ),
        React.createElement('div', {
          key: 'go',
          onClick: () => { if (!s.teamBusy) this.submitTeamEntry(contest); },
          style: {
            textAlign: 'center', padding: '13px 0', borderRadius: 999,
            background: picked === contest.picksRequired ? '#f2b544' : 'rgba(255,255,255,.12)',
            color: picked === contest.picksRequired ? '#2b1b00' : 'rgba(255,255,255,.5)',
            fontWeight: 900, fontSize: 13, cursor: 'pointer', opacity: s.teamBusy ? .6 : 1,
          },
        }, s.teamBusy
          ? 'LOCKING IN…'
          : contest.entryFee > 0
            ? 'LOCK IN TEAM — ' + Number(contest.entryFee).toLocaleString() + ' FM'
            : 'LOCK IN TEAM — FREE')
      ]);
    }

    if (s.modal === 'fantasyDraft') {
      const c = s.modalData; const d = s.fantasyDraft;
      const slots = (c.requiredSlots?.length ? c.requiredSlots : ['boxing', 'bareknuckle', 'mma', 'kickboxing', 'wrestling']);
      const genreLabel = { boxing: '🥊 BOXING', mma: '👊 MMA', bareknuckle: '✊ BARE KNUCKLE', kickboxing: '🦵 KICKBOXING', wrestling: '🤼 PRO WRESTLING' };
      const familyOf = { boxing: 'boxing', bareknuckle: 'boxing', mma: 'mma', kickboxing: 'mma', wrestling: 'wrestling' };
      const filled = slots.filter(slot => d[slot]?.fighterName).length;
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 17, color: '#a855f7' } }, 'DRAFT YOUR FANTASY CARD'),
        React.createElement('div', { key: 's', style: { fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 12 } }, c.name + ' · ' + c.span + ' · pool is every fighter already on the app this week'),
        React.createElement('div', { key: 'how', style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', lineHeight: 1.5, marginBottom: 10 } },
          'One fighter per sport. Whatever they do in their own fights is credited to your card all season. Each slot scores out of '
          + (s.seasonMeta.slotMax || 100) + ', measured against the best in that sport — so every pick counts the same.'
        ),
        React.createElement('div', { key: 'prog', style: { fontSize: 10, fontWeight: 900, color: filled === slots.length ? '#22c55e' : '#f2b544', marginBottom: 10 } },
          filled + ' of ' + slots.length + ' slots filled'),

        slots.map(slot => {
          const slotPool = this.fighterPoolForSlot(slot);
          const pick = d[slot] || {};
          const cats = s.seasonMeta.callCategories?.[familyOf[slot]] || {};
          return React.createElement('div', { key: slot, style: { marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,.07)' } },
            React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.55)', marginBottom: 5 } }, genreLabel[slot] || slot.toUpperCase()),
            slotPool.length === 0
              ? React.createElement('div', { style: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)' } }, 'Nobody scheduled in this sport yet.')
              : React.createElement('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                  slotPool.map(fighter => React.createElement('div', {
                    key: fighter, onClick: () => this.setFantasyPick(slot, fighter),
                    style: {
                      padding: '8px 12px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', color: '#fff',
                      background: pick.fighterName === fighter ? '#a855f7' : 'rgba(255,255,255,.06)',
                      border: '1px solid ' + (pick.fighterName === fighter ? '#a855f7' : 'rgba(255,255,255,.12)'),
                    },
                  }, fighter))
                ),

            pick.fighterName && Object.keys(cats).length > 0 && React.createElement('div', {
              style: { marginTop: 9, padding: 10, borderRadius: 9, background: 'rgba(242,181,68,.08)', border: '1px solid rgba(242,181,68,.25)' },
            },
              React.createElement('div', { style: { fontSize: 9, fontWeight: 900, color: '#f2b544', marginBottom: 6 } }, 'CALL A NUMBER — OPTIONAL BONUS'),
              React.createElement('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 7 } },
                Object.entries(cats).map(([code, label]) => React.createElement('div', {
                  key: code,
                  onClick: () => this.setFantasyCall(slot, 'calledCategory', pick.calledCategory === code ? '' : code),
                  style: {
                    padding: '5px 9px', borderRadius: 7, fontSize: 9, fontWeight: 800, cursor: 'pointer',
                    background: pick.calledCategory === code ? 'rgba(242,181,68,.85)' : 'rgba(255,255,255,.06)',
                    color: pick.calledCategory === code ? '#2b1b00' : 'rgba(255,255,255,.7)',
                    border: '1px solid ' + (pick.calledCategory === code ? '#f2b544' : 'rgba(255,255,255,.12)'),
                  },
                }, label))
              ),
              pick.calledCategory && React.createElement('input', {
                type: 'number', inputMode: 'numeric',
                placeholder: 'How many across the whole season?',
                value: pick.calledValue || '',
                onChange: (ev) => this.setFantasyCall(slot, 'calledValue', ev.target.value.replace(/\D/g, '')),
                style: {
                  width: '100%', padding: '9px 11px', borderRadius: 8, background: 'rgba(0,0,0,.25)',
                  border: '1px solid rgba(242,181,68,.4)', color: '#fff', fontSize: 11,
                  fontWeight: 800, fontFamily: "'Rajdhani',sans-serif",
                },
              }),
              pick.calledCategory && React.createElement('div', { style: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.45)', marginTop: 6, lineHeight: 1.5 } },
                'Reach or beat your number and you score it as a bonus, up to '
                + (s.seasonMeta.callBonusCap || 100) + '. Call low and it is safe but small; call high and you risk the bonus.'
              )
            )
          );
        }),
        React.createElement('div', {
          key: 'submit',
          onClick: () => { if (!s.seasonBusy) this.submitFantasyCard(c); },
          style: {
            textAlign: 'center', padding: '12px 0', borderRadius: 999,
            background: 'linear-gradient(90deg,#4d8dff,#a855f7)', fontWeight: 900,
            fontSize: 13, cursor: 'pointer', marginTop: 6, opacity: s.seasonBusy ? .6 : 1,
          },
        }, s.seasonBusy ? 'LOCKING IN…' : c.entryFee > 0 ? 'LOCK IN CARD — ' + c.entryFee + ' FM' : 'LOCK IN CARD — FREE')
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

    if (s.modal === 'newChallenge') {
      const limits = this.props.features?.headToHead || {};
      const stakeAmount = Math.floor(Number(s.challengeForm.stake) || 0);
      const openFights = (Array.isArray(this.props.fights) ? this.props.fights : []).slice(0, 12);
      const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 13, marginBottom: 12, fontFamily: "'Rajdhani',sans-serif" };
      return overlay([
        closeBtn,
        React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 19, color: '#a855f7', marginBottom: 4 } }, 'CHALLENGE A PLAYER'),
        React.createElement('div', { key: 'copy', style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginBottom: 14 } },
          'You both wager on the scorecard you already submitted for the fight. We hold both stakes and pay the higher card'
          + (limits.rakePercent ? ', less a ' + limits.rakePercent + '% platform fee' : '')
          + '. A draw returns both stakes in full.'
        ),
        React.createElement('div', { key: 'fl', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'FIGHT'),
        React.createElement('div', { key: 'fights', style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, maxHeight: 150, overflowY: 'auto' } },
          openFights.length === 0
            ? React.createElement('div', { style: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.45)' } }, 'No open fights right now.')
            : openFights.map(f => {
                const id = String(f.backendId || f.id || '');
                const active = s.challengeForm.fightId === id;
                return React.createElement('div', {
                  key: id, onClick: () => this.setChallengeField('fightId', id),
                  style: {
                    padding: '9px 11px', borderRadius: 9, cursor: 'pointer', fontSize: 11, fontWeight: 800,
                    background: active ? 'rgba(168,85,247,.25)' : 'rgba(255,255,255,.05)',
                    border: '1px solid ' + (active ? '#a855f7' : 'rgba(255,255,255,.1)')
                  }
                }, (f.f1 || 'Fighter A') + ' vs ' + (f.f2 || 'Fighter B'));
              })
        ),
        React.createElement('input', {
          key: 'o', placeholder: 'Their player name or email', value: s.challengeForm.opponent,
          onChange: (e) => this.setChallengeField('opponent', e.target.value), style: inputStyle
        }),
        React.createElement('input', {
          key: 'st', type: 'number', inputMode: 'numeric',
          placeholder: `Stake (${limits.minStake || 1}–${limits.maxStake || 5000} FM)`,
          value: s.challengeForm.stake,
          onChange: (e) => this.setChallengeField('stake', e.target.value), style: inputStyle
        }),
        stakeAmount > 0 && React.createElement('div', {
          key: 'math',
          style: {
            marginBottom: 14, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(242,181,68,.1)', border: '1px solid rgba(242,181,68,.3)',
            fontSize: 10.5, fontWeight: 800, color: '#f2b544', lineHeight: 1.6,
          },
        },
          'Pot ' + (stakeAmount * 2).toLocaleString() + ' FM'
          + (limits.rakePercent ? '  \u00b7  fee ' + Math.floor(stakeAmount * 2 * limits.rakePercent / 100).toLocaleString() + ' FM' : '')
          + '  \u00b7  winner takes ' + Math.floor(stakeAmount * 2 * (100 - (limits.rakePercent || 0)) / 100).toLocaleString() + ' FM'
        ),
        React.createElement('div', { key: 'note', style: { fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 14, lineHeight: 1.5 } },
          'Your stake is held as soon as you send this. It comes back automatically if they decline or never answer before predictions lock.'
        ),
        React.createElement('div', {
          key: 'b', onClick: () => { if (s.challengeBusy !== 'create') this.submitChallenge(); },
          style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: '#a855f7', fontWeight: 900, fontSize: 13, cursor: 'pointer', opacity: s.challengeBusy === 'create' ? .6 : 1 }
        }, s.challengeBusy === 'create' ? 'SENDING…' : 'SEND CHALLENGE')
      ]);
    }

    if (s.modal === 'h2hWaitlist') return overlay([
      closeBtn,
      React.createElement('div', { key: 'tag', style: { fontSize: 9, fontWeight: 900, color: '#a855f7', letterSpacing: 1, marginBottom: 4 } }, 'IN DEVELOPMENT'),
      React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 19, marginBottom: 6 } }, 'HEAD-TO-HEAD WAITLIST'),
      React.createElement('div', { key: 'copy', style: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', lineHeight: 1.5, marginBottom: 14 } },
        'One email when challenges go live. Nothing else, and no charge for joining the list.'
      ),
      !this.props.currentUser?.email && React.createElement('input', {
        key: 'e', type: 'email', placeholder: 'Your email', value: s.h2hWaitlistEmail,
        onChange: (e) => this.setState({ h2hWaitlistEmail: e.target.value }),
        style: { width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 13, marginBottom: 12, fontFamily: "'Rajdhani',sans-serif" }
      }),
      React.createElement('div', { key: 'bl', style: { fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 6 } }, 'What would you stake per challenge? (optional)'),
      React.createElement('div', { key: 'bands', style: { display: 'flex', gap: 6, marginBottom: 16 } },
        ['1-100', '100-500', '500-1k', '1k+'].map(band => React.createElement('div', {
          key: band, onClick: () => this.setState({ h2hWaitlistBand: s.h2hWaitlistBand === band ? '' : band }),
          style: {
            flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 10.5, fontWeight: 900, cursor: 'pointer',
            background: s.h2hWaitlistBand === band ? '#f2b544' : 'rgba(255,255,255,.06)',
            color: s.h2hWaitlistBand === band ? '#2b1b00' : '#fff'
          }
        }, band))
      ),
      React.createElement('div', {
        key: 'b', onClick: () => { if (!s.h2hWaitlistBusy) this.joinH2HWaitlist(); },
        style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: '#a855f7', fontWeight: 900, fontSize: 13, cursor: 'pointer', opacity: s.h2hWaitlistBusy ? .6 : 1 }
      }, s.h2hWaitlistBusy ? 'ADDING YOU…' : 'JOIN THE WAITLIST')
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
      if (!event) return null;
      const report = event?.aiScoutingReport || null;
      const votes = report?.pickSplit
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
            report ? React.createElement('div', { style: { display: 'grid', gap: 8, marginBottom: 10 } },
              [report.summary, report.pickSplitNote, report.underdogAngle].filter(Boolean).map((note, index) => React.createElement('div', { key: `${index}-${note}`, style: { padding: 10, borderRadius: 9, background: 'rgba(255,255,255,.05)', borderLeft: `3px solid ${['#4d8dff', '#f2b544', '#a855f7'][index]}` } },
                React.createElement('span', { style: { display: 'block', color: 'rgba(255,255,255,.78)', fontSize: 10.5, lineHeight: 1.45 } }, note)
              ))) : React.createElement('div', { style: { padding: 12, borderRadius: 10, marginBottom: 10, background: 'rgba(77,141,255,.08)', border: '1px solid rgba(77,141,255,.28)', color: 'rgba(255,255,255,.72)', fontSize: 10.5, lineHeight: 1.5 } },
              'The AI scouting entry point is active, but the back office has not generated a verified scouting report for this fight yet. Predictions remain available without fabricated scouting data.'
            ),
            votes && React.createElement('div', { style: { display: 'flex', gap: 8 } },
              [[`${votes.a}%`, `PICKED ${fighterA}`], [`${votes.b}%`, `PICKED ${fighterB}`]].map(([value, label]) => React.createElement('div', { key: label, style: { flex: 1, minWidth: 0, textAlign: 'center', background: 'rgba(255,255,255,.05)', borderRadius: 8, padding: '8px 4px' } },
                React.createElement('div', { style: { fontFamily: "'Anton',sans-serif", fontSize: 15, color: '#f2c869' } }, value),
                React.createElement('div', { style: { fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,.5)', overflowWrap: 'anywhere' } }, label)
              ))
            ),
            React.createElement('div', { style: { marginTop: 9, fontSize: 8, color: 'rgba(255,255,255,.35)', textAlign: 'center' } }, report ? (report.generatedAt ? `Generated for this fight · ${new Date(report.generatedAt).toLocaleDateString()}` : 'Generated for this fight') : 'Awaiting an approved back-office scouting report')
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
        React.createElement(MobileImageSlot, { id: 'affiliate-modal-handshake', shape: 'rect', placeholder: 'Handshake — partnership', fit: 'cover', src: 'affiliate-handshake-opt.jpg' })
      ),
      React.createElement('div', { key: 't', style: { fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#4d8dff', marginBottom: 4 } }, 'RUN YOUR OWN LEAGUE'),
      React.createElement('div', { key: 'b', style: { fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,.8)', marginBottom: 12 } }, 'Promote fights, build a league, and get players moving. Run it like a creator: set up your profile, launch a promotion, share the link, track activity, and request payout.'),
      React.createElement('div', { key: 'steps', style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 } },
        ['Set up your affiliate profile', 'Create or promote a fight', 'Share the campaign link + QR', 'Track signups & performance', 'Request your payout'].map((step, i) => React.createElement('div', {
          key: i, style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.85)' }
        },
          React.createElement('span', { style: { width: 18, height: 18, borderRadius: '50%', background: '#4d8dff', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' } }, i + 1),
          step
        ))
      ),
      React.createElement('div', { key: 'link', style: { padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,.06)', fontSize: 12, fontWeight: 700, marginBottom: 10, overflowWrap: 'anywhere' } }, cleanText(this.props.currentUser?.affiliateReferralUrl, this.props.currentUser?.referralUrl, this.props.currentUser?.affiliateSlug ? `fantasymmadness.com/affiliate/${this.props.currentUser.affiliateSlug}` : '', 'Your referral link appears after affiliate approval.')),
      React.createElement('div', { key: 'btn', onClick: this.copyReferral, style: { textAlign: 'center', padding: '12px 0', borderRadius: 999, background: 'linear-gradient(90deg,#4d8dff,#a855f7)', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 14px rgba(77,141,255,.6)', marginBottom: 14 } }, 'COPY REFERRAL LINK'),
      React.createElement('div', { key: 'dashboard', onClick: () => { this.setState({ modal: 'affiliateDash' }); this.loadAffiliate(); }, style: { textAlign: 'center', padding: '11px 0', borderRadius: 999, border: '1px solid rgba(242,181,68,.45)', color: '#f2b544', fontWeight: 900, fontSize: 12, cursor: 'pointer', marginBottom: 14 } }, 'VIEW MY DASHBOARD'),
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
