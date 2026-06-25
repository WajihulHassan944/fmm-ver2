import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaCrown,
  FaSearch,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import {
  WrestlingEmptyState,
  WrestlingHero,
  WrestlingModeNav,
  WrestlingStatusBadge,
} from './WrestlingPrimitives';
import {
  formatTokenAmount,
  formatWrestlingDate,
  getWrestlerImage,
  safeWrestlingArray,
  wrestlingRequest,
} from '@/Utils/proWrestling';

const WrestlingLeaderboardDirectory = () => {
  const [matches, setMatches] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    wrestlingRequest('/api/wrestling/matches?limit=100&status=LIVE,SCORING,FINALIZED')
      .then((payload) => { if (active) setMatches(safeWrestlingArray(payload?.data)); })
      .catch((requestError) => { if (active) setError(requestError.message || 'Wrestling leaderboards could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return matches;
    return matches.filter((match) => [
      match.matchTitle,
      match.eventName,
      match.promotionName,
      match.competitorA?.displayName,
      match.competitorB?.displayName,
    ].filter(Boolean).join(' ').toLowerCase().includes(normalized));
  }, [matches, query]);

  const liveCount = matches.filter((match) => ['LIVE', 'SCORING'].includes(match.status)).length;
  const totalPlayers = matches.reduce((sum, match) => sum + Number(match.participantCount || 0), 0);

  return (
    <>
      <Head><title>Pro Wrestling Leaderboards | Fantasy MMADNESS</title></Head>
      <div className="pw-page pw-leaderboard-directory-page">
        <WrestlingHero
          compact
          eyebrow="Wrestling rankings archive"
          title="Every card."
          accent="Every leaderboard."
          description="Open live standings or finalized results for every Pro Wrestling contest inside Fantasy MMADNESS."
          actions={[
            { href: '/pro-wrestling', label: 'Open contest lobby', icon: FaBolt },
            { href: '/pro-wrestling/history', label: 'My wrestling record', secondary: true, icon: FaChartLine },
          ]}
          stats={[
            { value: liveCount, label: 'Live scoreboards', icon: FaBolt },
            { value: matches.length, label: 'Ranked cards', icon: FaTrophy },
            { value: totalPlayers, label: 'Contest entries', icon: FaUsers },
          ]}
          background="/images/pro-wrestling/leaderboard-celebration.jpg"
        />
        <WrestlingModeNav active="leaderboards" />

        <main className="theme-container pw-main">
          <section className="pw-section">
            <header className="pw-section-heading">
              <div><p>Scoreboard directory</p><h2>Find a wrestling leaderboard</h2><span>Live cards show provisional movement. Finalized cards show official scores and payouts.</span></div>
            </header>
            <label className="pw-search"><FaSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search event, wrestler, or promotion" /><span>{visible.length} cards</span></label>

            {loading ? <div className="pw-loading-grid"><div /><div /><div /></div> : error ? <WrestlingEmptyState title="Leaderboard directory unavailable" description={error} /> : visible.length ? (
              <div className="pw-leaderboard-directory-grid">
                {visible.map((match) => (
                  <article key={match._id}>
                    <div className="pw-leaderboard-directory-art">
                      <img src={getWrestlerImage(match.competitorA, 'A')} alt={match.competitorA?.displayName || 'Wrestler A'} />
                      <span><FaCrown /> VS</span>
                      <img src={getWrestlerImage(match.competitorB, 'B')} alt={match.competitorB?.displayName || 'Wrestler B'} />
                    </div>
                    <div>
                      <WrestlingStatusBadge status={match.status} />
                      <p>{match.eventName} · {formatWrestlingDate(match.matchDate)}</p>
                      <h2>{match.matchTitle}</h2>
                      <dl><span><dt>Players</dt><dd>{match.participantCount || 0}</dd></span><span><dt>Pot</dt><dd>{formatTokenAmount(match.currentPot)}</dd></span></dl>
                      <Link href={`/pro-wrestling/leaderboard/${match._id}`}>{match.status === 'FINALIZED' ? 'View official result' : 'Open live standings'} <FaArrowRight /></Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : <WrestlingEmptyState title="No wrestling leaderboards match this search" description="Leaderboards become available when a contest enters live scoring or is finalized." action={{ href: '/pro-wrestling', label: 'Browse open contests' }} />}
          </section>
        </main>
      </div>
    </>
  );
};

export default WrestlingLeaderboardDirectory;
