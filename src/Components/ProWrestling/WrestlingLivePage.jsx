import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaClock,
  FaFire,
  FaMedal,
  FaSyncAlt,
  FaTrophy,
} from 'react-icons/fa';
import { WrestlingModeNav, WrestlingStatusBadge } from './WrestlingPrimitives';
import {
  WRESTLING_STATS,
  formatWrestlingDate,
  getPlayerToken,
  getWrestlerImage,
  winnerLabel,
  wrestlingRequest,
} from '@/Utils/proWrestling';

const WrestlingLivePage = () => {
  const router = useRouter();
  const { matchId } = router.query;
  const [live, setLive] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async (silent = false) => {
    if (!matchId) return;
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const [livePayload, leaderboardPayload] = await Promise.all([
        wrestlingRequest(`/api/wrestling/matches/${matchId}/live`, { auth: Boolean(getPlayerToken()) }),
        wrestlingRequest(`/api/wrestling/matches/${matchId}/leaderboard?limit=25`),
      ]);
      setLive(livePayload);
      setLeaderboard(Array.isArray(leaderboardPayload?.data) ? leaderboardPayload.data : []);
      setError('');
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.message || 'Live wrestling scoring is not available yet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!router.isReady || !matchId) return undefined;
    load();
    const timer = window.setInterval(() => load(true), 15000);
    return () => window.clearInterval(timer);
  }, [matchId, router.isReady]);

  if (loading) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaBolt /><h1>Connecting to live wrestling scoring…</h1></div></div>;
  if (!live?.match) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaClock /><h1>Live scoring is not open</h1><p>{error}</p><Link href={`/pro-wrestling/matches/${matchId}`} className="pw-btn pw-btn-secondary">Contest overview <FaArrowRight /></Link></div></div>;

  const match = live.match;
  const topThree = leaderboard.slice(0, 3);

  return (
    <>
      <Head><title>Live Wrestling Scoring | {match.matchTitle}</title></Head>
      <div className="pw-page pw-live-page">
        <section className="pw-live-hero">
          <div className="theme-container pw-live-hero-inner">
            <Link href={`/pro-wrestling/matches/${match._id}`} className="pw-inline-back"><FaArrowLeft /> Contest overview</Link>
            <div className="pw-live-headline"><div><p><FaFire /> Live Pro Wrestling score room</p><h1>{match.matchTitle}</h1><span>{match.eventName} · {formatWrestlingDate(match.matchDate)}</span></div><div><WrestlingStatusBadge status={match.status} /><button type="button" onClick={() => load(true)} disabled={refreshing}><FaSyncAlt className={refreshing ? 'is-spinning' : ''} /> Refresh</button></div></div>
            <div className="pw-live-fight-stage">
              <article><img src={getWrestlerImage(match.competitorA, 'A')} alt={match.competitorA.displayName} /><span><small>Competitor A</small><strong>{match.competitorA.displayName}</strong><em>{winnerLabel(match.officialWinner, match) === match.competitorA.displayName ? 'Official winner' : 'Live action'}</em></span></article>
              <div><small>Stats version {live.statsVersion || 0}</small><b>LIVE</b><span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting…'}</span></div>
              <article><img src={getWrestlerImage(match.competitorB, 'B')} alt={match.competitorB.displayName} /><span><small>Competitor B</small><strong>{match.competitorB.displayName}</strong><em>{winnerLabel(match.officialWinner, match) === match.competitorB.displayName ? 'Official winner' : 'Live action'}</em></span></article>
            </div>
          </div>
        </section>
        <WrestlingModeNav active="contests" />

        <main className="theme-container pw-main pw-live-main">
          {error && <div className="pw-live-warning"><FaClock /> {error}</div>}

          <section className="pw-live-scoreboard">
            <header><div><p className="pw-eyebrow"><FaChartLine /> Official action feed</p><h2>Every move changes the table.</h2></div>{match.officialWinner && <span><FaTrophy /> Official result: {winnerLabel(match.officialWinner, match)}</span>}</header>
            <div className="pw-live-stat-head"><span>{match.competitorA.displayName}</span><strong>Official totals</strong><span>{match.competitorB.displayName}</span></div>
            {WRESTLING_STATS.map((stat) => (
              <div className="pw-live-stat-row" key={stat.key}><strong>{match.officialStats?.competitorA?.[stat.key] ?? 0}</strong><span><b>{stat.short}</b><small>{stat.label}</small></span><strong>{match.officialStats?.competitorB?.[stat.key] ?? 0}</strong></div>
            ))}
          </section>

          <section className="pw-live-grid">
            <article className="pw-my-live-position">
              <p className="pw-eyebrow"><FaBolt /> Your provisional result</p>
              {live.myPosition ? (
                <><div><span><small>Current rank</small><strong>#{live.myPosition.rank || '—'}</strong></span><span><small>Current score</small><strong>{Number(live.myPosition.score || 0).toLocaleString()}</strong></span><span><small>Rank movement</small><strong>{live.myPosition.previousRank && live.myPosition.rank ? `${live.myPosition.previousRank - live.myPosition.rank > 0 ? '+' : ''}${live.myPosition.previousRank - live.myPosition.rank}` : '—'}</strong></span></div><p>Scores are provisional until the official result is finalized.</p></>
              ) : <div className="pw-live-no-entry"><FaMedal /><h3>No personal score is available.</h3><p>Sign in and submit a prediction before lock time to appear here.</p></div>}
            </article>

            <article className="pw-live-podium-card">
              <p className="pw-eyebrow"><FaTrophy /> Live podium</p>
              <div>{topThree.length ? topThree.map((row, index) => <span key={row.playerId}><em>#{row.rank || index + 1}</em>{row.profileUrl ? <img src={row.profileUrl} alt="" /> : <i>{row.playerName?.charAt(0) || 'P'}</i>}<strong>{row.playerName}</strong><small>{Number(row.score || 0).toLocaleString()} pts</small></span>) : <p>Rankings appear when official action totals are submitted.</p>}</div>
            </article>
          </section>

          <section className="pw-live-table-panel">
            <header><div><p>Provisional standings</p><h2>Live wrestling leaderboard</h2></div><Link href={`/pro-wrestling/leaderboard/${match._id}`}>Open full leaderboard <FaArrowRight /></Link></header>
            <div className="pw-table-scroll"><table><thead><tr><th>Rank</th><th>Player</th><th>Movement</th><th>Exact picks</th><th>Score</th></tr></thead><tbody>{leaderboard.length ? leaderboard.map((row) => <tr key={row.playerId}><td><strong>#{row.rank}</strong></td><td><div className="pw-player-cell">{row.profileUrl ? <img src={row.profileUrl} alt="" /> : <span>{row.playerName?.charAt(0) || 'P'}</span>}<b>{row.playerName}</b></div></td><td className={row.rankMovement > 0 ? 'is-up' : row.rankMovement < 0 ? 'is-down' : ''}>{row.rankMovement ? `${row.rankMovement > 0 ? '▲' : '▼'} ${Math.abs(row.rankMovement)}` : '—'}</td><td>{row.exactPredictionCount || 0}</td><td>{Number(row.score || 0).toLocaleString()}</td></tr>) : <tr><td colSpan="5">No provisional scores have been calculated yet.</td></tr>}</tbody></table></div>
          </section>
        </main>
      </div>
    </>
  );
};

export default WrestlingLivePage;
