import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { stopMusic, playMusic } from '../../Redux/musicSlice';
import { fetchMatches } from '../../Redux/matchSlice';
import useLeaderboardData from '../../CustomFunctions/useLeaderboardData';
import Link from 'next/link';
import Head from 'next/head';
import {
  FaArrowRight,
  FaBullseye,
  FaCalendarAlt,
  FaClock,
  FaCoins,
  FaCrown,
  FaDollarSign,
  FaGift,
  FaPlay,
  FaShieldAlt,
  FaStar,
  FaTrophy,
  FaUserFriends,
  FaUsers,
} from 'react-icons/fa';

const FALLBACK_FIGHT_IMAGE = '/images/hero-fight.png';

const SCORING_ROWS = [
  ['Correct Winner', '100'],
  ['Correct Method', '75'],
  ['Correct Round', '50'],
  ['Exact Score', '25'],
  ['Perfect Fight', '250'],
];

const STATIC_WINNERS = [
  { name: 'Tasha', contest: 'Won UFC 301 Contest', amount: '$2,500', icon: '🏆' },
  { name: 'Kelly', contest: 'Won Boxing Showdown', amount: '$1,000', icon: '🥈' },
  { name: 'Wajih ul Hassan', contest: 'Won Kickboxing Clash', amount: '$750', icon: '🥉' },
];

const FALLBACK_LEADERBOARD = [
  { name: 'Kelly', points: 2986 },
  { name: 'Tasha', points: 2261 },
  { name: 'Shane O.', points: 1878 },
  { name: 'Wajih ul Hassan', points: 1566 },
  { name: 'TheGhost', points: 1347 },
];

const getOrderedMatches = (matches) => {
  if (!Array.isArray(matches)) return [];
  return [...matches].filter(Boolean).reverse();
};

const pad = (value) => String(value).padStart(2, '0');

const parseMatchDate = (match) => {
  const rawDate = match?.matchDate?.split?.('T')?.[0];
  const rawTime = String(match?.matchTime || '').trim();
  const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})/);

  if (!rawDate || !timeMatch) return null;

  const [, hour, minute] = timeMatch;
  const date = new Date(`${rawDate}T${pad(hour)}:${minute}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (match) => {
  const date = parseMatchDate(match);
  if (!date) return 'Schedule pending';

  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
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
    { label: 'Days', value: pad(days) },
    { label: 'Hrs', value: pad(hours) },
    { label: 'Min', value: pad(minutes) },
    { label: 'Sec', value: pad(seconds) },
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

  const status = String(match?.matchStatus || match?.matchShadowOpenStatus || '').toLowerCase();
  if (status.includes('ongoing') || status.includes('live')) return 'LIVE NOW';
  if (status.includes('finished') || status.includes('closed')) return 'FINISHED';
  return 'OPEN';
};

const getCategory = (match) => {
  const value = match?.matchCategoryTwo || match?.matchCategory || 'MMA';
  return String(value).trim() || 'MMA';
};

const getCategoryClass = (category) => {
  const normalized = String(category).toLowerCase();
  if (normalized.includes('box')) return 'is-boxing';
  if (normalized.includes('kick')) return 'is-kickboxing';
  if (normalized.includes('bare')) return 'is-bare-knuckle';
  return 'is-mma';
};

const getFightTitle = (match) => {
  if (!match) return 'Next Fight Loading';
  const fighterA = match.matchFighterA || 'Fighter A';
  const fighterB = match.matchFighterB || 'Fighter B';
  return `${fighterA} vs ${fighterB}`;
};

const getPrizePool = (match) => {
  const amount = Number(match?.pot || 0);
  if (!amount) return 'Prize TBA';
  return `$${amount.toLocaleString()}`;
};

const getFighterImage = (imageUrl) => imageUrl || FALLBACK_FIGHT_IMAGE;

const getPlayerCount = (match) => {
  if (Array.isArray(match?.userPredictions)) return match.userPredictions.length;
  return 0;
};

const getLeaderboardName = (player) => (
  player?.firstName || player?.username || player?.name || player?.email?.split?.('@')?.[0] || 'Player'
);

const HomeAnother = () => {
  const dispatch = useDispatch();
  const howlerRef = useRef(null);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const matchError = useSelector((state) => state.matches.error);
  const { leaderboard } = useLeaderboardData(matches);
  const [buttonText, setButtonText] = useState('Send Message');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(null);

  useEffect(() => {
    const currentSeek = howlerRef.current?.seek?.() || 0;
    dispatch(stopMusic(currentSeek));
    return () => dispatch(playMusic());
  }, [dispatch]);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [dispatch, matchStatus]);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const orderedMatches = useMemo(() => getOrderedMatches(matches), [matches]);
  const contestMatches = useMemo(() => orderedMatches.slice(0, 4), [orderedMatches]);
  const primaryFight = orderedMatches[0];
  const primaryCountdown = getCountdownParts(primaryFight, now);

  const liveLeaderboardRows = useMemo(() => {
    if (!Array.isArray(leaderboard) || leaderboard.length === 0) return FALLBACK_LEADERBOARD;

    return leaderboard.slice(0, 5).map((player) => ({
      name: getLeaderboardName(player),
      points: Number(player?.totalPoints || 0),
      avatar: player?.profileUrl,
    }));
  }, [leaderboard]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setButtonText('Sending');
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/contact-us-fantasymmadness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setButtonText('Message Sent');
        e.target.reset();
      } else {
        setButtonText('Try Again');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setButtonText('Try Again');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setButtonText('Send Message'), 2500);
    }
  };

  return (
    <>
      <Head>
        <title>Fantasy MMAdness | Fantasy Combat Sports, MMA, Boxing</title>
        <meta name="description" content="Predict MMA, Boxing, Kickboxing, Bare Knuckle, and combat sports contests. Pick winners, score every round, climb leaderboards, and win real fantasy rewards." />
        <meta property="og:title" content="Fantasy MMAdness - Predict Combat Sports" />
        <meta property="og:description" content="Join Fantasy MMAdness and compete in premium combat sports prediction contests." />
        <meta property="og:url" content="https://fantasymmadness.com/" />
        <meta name="keywords" content="Fantasy MMA, Fantasy UFC, Fantasy BKFC, Fantasy Boxing, Fantasy Kickboxing, Fantasy Bare Knuckle, Fantasy Combat, Fantasy Fighting, Fantasy Fighter Rankings" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Fantasy MMAdness',
              url: 'https://www.fantasymmadness.com',
              description: 'Play fantasy MMA, boxing, kickboxing, and combat sports prediction contests.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.fantasymmadness.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </Head>

      <div className="theme-home fmm-home page-shell">
        <section className="fmm-home-hero" aria-label="Fantasy combat sports hero">
          <div className="theme-container fmm-hero-grid">
            <div className="fmm-hero-copy">
              <h1>
                Predict Combat Sports.
                <span>Score <em>Every Round.</em></span>
              </h1>
              <p className="fmm-hero-subtitle">
                Join thousands of fans in MMA, Boxing, Kickboxing and Bare-Knuckle prediction contests. Predict winners, methods, rounds and scores. Climb the leaderboard and win real prizes.
              </p>

              <div className="fmm-hero-actions">
                <Link href="/mock-game" className="theme-btn theme-btn-primary">
                  Try Demo Fight <FaPlay aria-hidden="true" />
                </Link>
                <Link href="/upcomingfights" className="theme-btn theme-btn-secondary">
                  Join Free Contest <FaUserFriends aria-hidden="true" />
                </Link>
              </div>

              <div className="fmm-proof-strip">
                <div><FaGift aria-hidden="true" /><strong>100% Free</strong><span>To play</span></div>
                <div><FaTrophy aria-hidden="true" /><strong>Real Prizes</strong><span>Every week</span></div>
                <div><FaCoins aria-hidden="true" /><strong>Fast &amp; Easy</strong><span>Payouts</span></div>
                <div><FaShieldAlt aria-hidden="true" /><strong>Secure &amp; Fair</strong><span>Platform</span></div>
              </div>
            </div>

            <div className="fmm-hero-fight-area">
              <aside className="fmm-hero-event-card">
                <div className="fmm-hero-event-main">
                  <p>Next Big Fight</p>
                  <h2>
                    <span>{primaryFight?.matchFighterA || 'Upcoming'}</span>
                    <small>vs</small>
                    <span>{primaryFight?.matchFighterB || 'Matchup'}</span>
                  </h2>
                  <div className="fmm-hero-fighters" aria-hidden="true">
                    <img src={getFighterImage(primaryFight?.fighterAImage)} alt="" loading="lazy" />
                    <span>VS</span>
                    <img src={getFighterImage(primaryFight?.fighterBImage)} alt="" loading="lazy" />
                  </div>
                  <div className="fmm-hero-event-meta">
                    <FaClock aria-hidden="true" />
                    <span>{formatDateTime(primaryFight)}</span>
                  </div>
                </div>

                <div className="fmm-countdown-box" aria-label="Fight countdown">
                  {primaryCountdown ? (
                    primaryCountdown.map(({ label, value }) => (
                      <div key={label}>
                        <strong>{value}</strong>
                        <span>{label}</span>
                      </div>
                    ))
                  ) : (
                    <div className="fmm-countdown-state">
                      <strong>{primaryFight?.matchStatus || 'Open'}</strong>
                      <span>{primaryFight?.matchName || 'Contest'}</span>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <main className="theme-container fmm-home-main">
          <section className="fmm-active-section" aria-labelledby="active-contests-title">
            <div className="fmm-section-title-row">
              <h2 id="active-contests-title">Active Contests</h2>
              <Link href="/upcomingfights">View All Contests <FaArrowRight aria-hidden="true" /></Link>
            </div>

            <div className="fmm-contest-grid">
              {matchStatus === 'loading' && <div className="fmm-empty-card">Loading active contests...</div>}
              {matchStatus === 'failed' && <div className="fmm-empty-card">Unable to load fights: {matchError}</div>}
              {matchStatus !== 'loading' && matchStatus !== 'failed' && contestMatches.length === 0 && <div className="fmm-empty-card">No contests are currently available.</div>}

              {contestMatches.map((match, index) => {
                const category = getCategory(match);
                const categoryClass = getCategoryClass(category);
                const isFinished = String(match?.matchStatus || '').toLowerCase().includes('finished');

                return (
                  <article className={`fmm-contest-card ${categoryClass}`} key={match._id || getFightTitle(match)}>
                    <div className="fmm-contest-card-top">
                      <span className="fmm-category-pill">{category}</span>
                      {index === 0 && <span className="fmm-featured-pill"><FaStar aria-hidden="true" /> Featured</span>}
                    </div>

                    <div className="fmm-contest-fighters">
                      <figure>
                        <img src={getFighterImage(match.fighterAImage)} alt={match.matchFighterA || 'Fighter A'} loading="lazy" />
                        <figcaption>{match.matchFighterA || 'Fighter A'}</figcaption>
                      </figure>
                      <span>VS</span>
                      <figure>
                        <img src={getFighterImage(match.fighterBImage)} alt={match.matchFighterB || 'Fighter B'} loading="lazy" />
                        <figcaption>{match.matchFighterB || 'Fighter B'}</figcaption>
                      </figure>
                    </div>

                    <h3>{match.matchName || getFightTitle(match)}</h3>
                    <p className="fmm-contest-matchup">{match.matchFighterA || 'Fighter A'} vs {match.matchFighterB || 'Fighter B'}</p>

                    <div className="fmm-contest-card-meta">
                      <span><FaCalendarAlt aria-hidden="true" /> {formatDateTime(match)}</span>
                      <span><FaUsers aria-hidden="true" /> {getPlayerCount(match).toLocaleString()} Players</span>
                      <span><FaDollarSign aria-hidden="true" /> {getPrizePool(match)} <small>Prize Pool</small></span>
                    </div>

                    <div className="fmm-contest-lock">
                      <span>Locks In</span>
                      <strong>{getLockLabel(match, now)}</strong>
                    </div>

                    <Link href="/upcomingfights" className="fmm-card-action">
                      {isFinished ? 'View Contest' : 'Enter Free'}
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="fmm-dashboard-grid" aria-label="Gameplay summary and leaderboard">
            <div className="fmm-panel fmm-how-score-panel">
              <div className="fmm-how-block">
                <h2>How It Works</h2>
                {[
                  ['Predict', 'Pick the winner, method, round and score for each fight.'],
                  ['Score Points', 'Earn points based on accuracy and depth of your predictions.'],
                  ['Climb & Win', 'Compete on leaderboards and win real prizes.'],
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
                  <div><strong>Prediction</strong><strong>Points</strong></div>
                  {SCORING_ROWS.map(([label, points]) => (
                    <div key={label} className={label === 'Perfect Fight' ? 'is-perfect' : ''}>
                      <span>{label}</span>
                      <strong>{points}</strong>
                    </div>
                  ))}
                </div>
                <Link href="/guides">Full rules &amp; scoring breakdown in How To Play</Link>
              </div>
            </div>

            <div className="fmm-panel fmm-winners-panel">
              <div className="fmm-panel-title-row">
                <h2>Recent Winners</h2>
                <Link href="/global-leaderboard">View All Winners <FaArrowRight aria-hidden="true" /></Link>
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
              <p className="fmm-panel-note"><FaCrown aria-hidden="true" /> Become the next champion.</p>
            </div>

            <div className="fmm-panel fmm-leaderboard-panel">
              <div className="fmm-panel-title-row">
                <h2>Live Leaderboard</h2>
                <Link href="/leaderboard">View Full Leaderboard <FaArrowRight aria-hidden="true" /></Link>
              </div>
              <div className="fmm-leaderboard-head"><span>Rank</span><span>Player</span><span>Points</span></div>
              {liveLeaderboardRows.map((player, index) => (
                <div className={`fmm-leaderboard-row ${index === 3 ? 'is-highlighted' : ''}`} key={`${player.name}-${index}`}>
                  <span>{index + 1}</span>
                  <div>
                    {player.avatar ? <img src={player.avatar} alt={player.name} loading="lazy" /> : <span>{player.name.charAt(0).toUpperCase()}</span>}
                    <strong>{player.name}</strong>
                  </div>
                  <strong>{Number(player.points || 0).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="fmm-metrics-partners" aria-label="Platform metrics and partners">
            <div className="fmm-metrics-grid">
              <div><FaUsers aria-hidden="true" /><strong>128,547+</strong><span>Players</span><p>Worldwide community</p></div>
              <div><FaBullseye aria-hidden="true" /><strong>4.2M+</strong><span>Predictions Submitted</span><p>Across all time</p></div>
              <div><FaTrophy aria-hidden="true" /><strong>$1.7M+</strong><span>Tokens Awarded</span><p>To our champions</p></div>
              <div><FaShieldAlt aria-hidden="true" /><strong>100%</strong><span>Secure &amp; Fair</span><p>Provably fair contests</p></div>
            </div>
            <div className="fmm-partners-card">
              <p>Trusted by fans. Backed by partners.</p>
              <div><span>UFC</span><span>BKFC</span><span>GLORY</span><span>ESPN</span><span>DAZN</span></div>
            </div>
          </section>

          <section className="fmm-fight-art-section" aria-label="Fight night experience">
            <div className="fmm-fight-art-copy">
              <p>Fight Night Experience</p>
              <h2>Built for every punch, round and prediction.</h2>
              <span>Premium fight cards, live leaderboards and clean prediction flows stay focused on the contest, not hidden stat tables.</span>
              <Link href="/upcomingfights" className="fmm-art-link">Explore contests <FaArrowRight aria-hidden="true" /></Link>
            </div>
            <div className="fmm-fight-art-media">
              <img src="/images/hero-fight.png" alt="Combat sports fight night" loading="lazy" />
            </div>
          </section>

          <section className="fmm-contact-panel" aria-labelledby="contact-home-title">
            <div>
              <p>Contact Fantasy MMAdness</p>
              <h2 id="contact-home-title">Questions about leagues, sponsors, or fight cards?</h2>
              <span>Send a message and the team will follow up. The existing production contact endpoint is unchanged.</span>
            </div>
            <form onSubmit={handleSubmit}>
              <input type="text" name="fullName" placeholder="Full name" required />
              <input type="email" name="email" placeholder="Email address" required />
              <input type="text" name="subject" placeholder="Subject" required />
              <textarea name="message" placeholder="Message" required />
              <button type="submit" className="theme-btn theme-btn-primary" disabled={isSubmitting}>
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
