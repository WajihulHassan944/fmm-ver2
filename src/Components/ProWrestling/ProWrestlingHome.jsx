import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaCoins,
  FaCrown,
  FaFistRaised,
  FaLock,
  FaShieldAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import {
  WrestlingEmptyState,
  WrestlingHero,
  WrestlingMatchCard,
  WrestlingModeNav,
  WrestlingSectionHeading,
} from './WrestlingPrimitives';
import { WRESTLING_STATS, safeWrestlingArray, wrestlingRequest } from '@/Utils/proWrestling';

const ProWrestlingHome = () => {
  const [matches, setMatches] = useState([]);
  const [wrestlers, setWrestlers] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [matchPayload, wrestlerPayload, configPayload] = await Promise.all([
          wrestlingRequest('/api/wrestling/matches?limit=12&status=OPEN,LOCKED,LIVE,SCORING,FINALIZED'),
          wrestlingRequest('/api/wrestling/wrestlers?limit=6'),
          wrestlingRequest('/api/wrestling/config'),
        ]);
        if (!active) return;
        setMatches(safeWrestlingArray(matchPayload?.data));
        setWrestlers(safeWrestlingArray(wrestlerPayload?.data));
        setConfig(configPayload);
      } catch (requestError) {
        console.error('Unable to load Pro Wrestling game mode:', requestError);
        if (active) setError(requestError.message || 'The Pro Wrestling game mode could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const featured = useMemo(() => matches.find((match) => match.featured) || matches[0], [matches]);
  const openMatches = matches.filter((match) => match.status === 'OPEN');
  const liveMatches = matches.filter((match) => ['LIVE', 'SCORING'].includes(match.status));
  const totalPot = matches.reduce((sum, match) => sum + Number(match.currentPot || 0), 0);

  return (
    <>
      <Head>
        <title>Pro Wrestling Predictions | Fantasy MMADNESS</title>
        <meta name="description" content="Predict every punch, kick, power move, finisher, and winner in Fantasy MMADNESS Pro Wrestling contests." />
      </Head>
      <div className="pw-page pw-home-page">
        <WrestlingHero
          title="Predict the action."
          accent="Win the wrestling pot."
          description="A full-match prediction game built directly into Fantasy MMADNESS. Enter a real contest, forecast both wrestlers' offense, follow live scoring, and climb a dedicated Pro Wrestling leaderboard."
          actions={[
            { href: featured ? `/pro-wrestling/matches/${featured._id}` : '#pw-contests', label: featured ? 'Enter featured contest' : 'Explore contests', icon: FaFistRaised },
            { href: '/pro-wrestling/how-to-play', label: 'View scoring rules', secondary: true, icon: FaShieldAlt },
          ]}
          stats={[
            { value: openMatches.length, label: 'Open contests', icon: FaBolt },
            { value: liveMatches.length, label: 'Live matches', icon: FaChartLine },
            { value: totalPot.toLocaleString(), label: 'Tokens in play', icon: FaCoins },
          ]}
        >
          <div className="pw-featured-poster">
            <div className="pw-featured-poster-label"><FaCrown /> New game mode</div>
            <img src="/images/pro-wrestling/wrestling-match-premium.jpg" alt="Fantasy MMADNESS Pro Wrestling arena" />
            <div><small>Full-match scorecard</small><strong>HP · BP · K · PM · FM</strong><span>Predict both wrestlers plus the official winner.</span></div>
          </div>
        </WrestlingHero>

        <WrestlingModeNav active="contests" />

        <main className="theme-container pw-main" id="pw-contests">
          <section className="pw-game-mode-strip">
            <div><FaFistRaised /><span><small>Game mode</small><strong>Pro Wrestling</strong></span></div>
            <p>Same Fantasy MMADNESS account, wallet, community, and competitive DNA—now with a scoring system designed for wrestling action.</p>
            <Link href="/pro-wrestling/history">My wrestling entries <FaArrowRight /></Link>
          </section>

          <section className="pw-section">
            <WrestlingSectionHeading
              eyebrow="Contest lobby"
              title="Choose the next wrestling card"
              description="Open cards accept entries and predictions until the published lock time. Live and finalized cards remain available for scoring and leaderboard review."
              action={{ href: '/pro-wrestling/how-to-play', label: 'Learn the flow' }}
            />
            {loading ? (
              <div className="pw-loading-grid">{Array.from({ length: 3 }, (_, index) => <div key={index} />)}</div>
            ) : error ? (
              <WrestlingEmptyState title="Wrestling lobby unavailable" description={error} action={{ href: '/upcomingfights', label: 'Browse combat contests' }} />
            ) : matches.length ? (
              <div className="pw-match-grid">{matches.map((match) => <WrestlingMatchCard key={match._id} match={match} />)}</div>
            ) : (
              <WrestlingEmptyState title="No wrestling cards are published yet" description="The administration team can create and publish the first Pro Wrestling contest from the new wrestling command center." />
            )}
          </section>

          <section className="pw-section pw-action-system">
            <WrestlingSectionHeading
              eyebrow="The scorecard"
              title="Five action categories. Two wrestlers. One winner pick."
              description="The system rewards prediction accuracy across the entire match rather than relying only on a winner selection."
            />
            <div className="pw-action-grid">
              {WRESTLING_STATS.map((stat, index) => (
                <article key={stat.key}><span>{String(index + 1).padStart(2, '0')}</span><strong>{stat.short}</strong><h3>{stat.label}</h3><p>{stat.description}</p></article>
              ))}
              <article className="is-winner"><span>06</span><FaTrophy /><h3>Match winner</h3><p>Lock in Wrestler A, Wrestler B, or a draw for the headline bonus.</p></article>
            </div>
          </section>

          <section className="pw-section pw-flow-section">
            <div className="pw-flow-copy">
              <p className="pw-eyebrow"><FaLock /> Contest lifecycle</p>
              <h2>Join. Predict. Lock. Watch. Rank. Win.</h2>
              <p>Every stage is connected to the existing Fantasy MMADNESS user account and fight wallet. Entries are protected by backend lock times and settlement rules.</p>
              <div className="pw-flow-steps">
                {[
                  ['01', 'Join the contest', 'Pay the listed token entry fee from the existing fight wallet.'],
                  ['02', 'Build your scorecard', 'Forecast HP, BP, K, PM, FM, and the winner for both competitors.'],
                  ['03', 'Follow live scoring', 'Watch actual action totals, provisional points, and rank movement.'],
                  ['04', 'Review the result', 'See the official score breakdown, final leaderboard, and payout.'],
                ].map(([number, title, copy]) => <article key={number}><span>{number}</span><div><strong>{title}</strong><p>{copy}</p></div></article>)}
              </div>
            </div>
            <div className="pw-flow-art"><img src="/images/pro-wrestling/prediction-mockup.png" alt="Pro Wrestling prediction interface preview" /><div><FaTrophy /><strong>Accuracy creates the edge.</strong><span>Exact and near-exact predictions earn the strongest category scores.</span></div></div>
          </section>

          <section className="pw-section">
            <WrestlingSectionHeading eyebrow="Wrestler intelligence" title="Study the roster before the bell" description="Profiles expose style, signature moves, finishing moves, records, and historical action totals." action={{ href: '/pro-wrestling/wrestlers', label: 'View all wrestlers' }} />
            {wrestlers.length ? (
              <div className="pw-wrestler-preview-grid">
                {wrestlers.map((wrestler, index) => (
                  <Link href={`/pro-wrestling/wrestlers/${wrestler.slug || wrestler._id}`} key={wrestler._id}>
                    <img src={wrestler.profileImage || `/images/pro-wrestling/wrestler-placeholder-${index % 2 ? 'b' : 'a'}.jpg`} alt={wrestler.displayName} />
                    <span><small>{wrestler.promotion || 'Pro Wrestling'}</small><strong>{wrestler.displayName}</strong><em>{wrestler.wrestlingStyle || 'All-around competitor'}</em></span>
                    <FaArrowRight />
                  </Link>
                ))}
              </div>
            ) : <WrestlingEmptyState title="Roster profiles are coming next" description="Published wrestler profiles will appear here automatically." />}
          </section>

          <section className="pw-final-cta">
            <div><p>Fantasy MMADNESS Pro Wrestling</p><h2>Every move can change the leaderboard.</h2><span>Enter the next card and prove that you can read the full match—not just the finish.</span></div>
            <div><Link href={featured ? `/pro-wrestling/matches/${featured._id}` : '/pro-wrestling'} className="pw-btn pw-btn-primary">Enter the arena <FaArrowRight /></Link><Link href="/pro-wrestling/leaderboard" className="pw-btn pw-btn-secondary">Wrestling leaderboards</Link></div>
          </section>
        </main>
      </div>
    </>
  );
};

export default ProWrestlingHome;
