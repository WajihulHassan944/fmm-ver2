import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
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
  formatWrestlingElapsed,
  getWrestlingTimeRangeLabel,
  formatWrestlingDate,
  getPlayerToken,
  getWrestlerImage,
  winnerLabel,
  wrestlingRequest,
} from '@/Utils/proWrestling';

const WrestlingLivePage = () => {
  const router = useRouter();
  const { matchId } = router.query;
  const user = useSelector((state) => state.user);
  const isAuthenticated = useSelector((state) => Boolean(state.auth?.isAuthenticated));
  const [live, setLive] = useState(null);
  const [myEntry, setMyEntry] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardMeta, setLeaderboardMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async (silent = false) => {
    if (!matchId) return;
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const hasPlayerToken = Boolean(getPlayerToken());
      const [livePayload, leaderboardPayload, entryPayload] = await Promise.all([
        wrestlingRequest(`/api/wrestling/matches/${matchId}/live`, { auth: hasPlayerToken }),
        wrestlingRequest(`/api/wrestling/matches/${matchId}/leaderboard?limit=25`),
        hasPlayerToken
          ? wrestlingRequest(`/api/wrestling/matches/${matchId}/my-entry`, { auth: true }).catch(() => null)
          : Promise.resolve(null),
      ]);
      setLive(livePayload);
      setLeaderboard(Array.isArray(leaderboardPayload?.data) ? leaderboardPayload.data : []);
      setLeaderboardMeta({
        standingsLabel: leaderboardPayload?.standingsLabel,
        liveClock: leaderboardPayload?.liveClock,
        activeMatchTimeRange: leaderboardPayload?.activeMatchTimeRange,
      });
      setMyEntry(entryPayload);
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
    const timer = window.setInterval(() => load(true), 5000);
    return () => window.clearInterval(timer);
  }, [matchId, router.isReady]);

  if (loading) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaBolt /><h1>Connecting to live wrestling scoring…</h1></div></div>;
  if (!live?.match) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaClock /><h1>Live scoring is not open</h1><p>{error}</p><Link href={`/pro-wrestling/matches/${matchId}`} className="pw-btn pw-btn-secondary">Contest overview <FaArrowRight /></Link></div></div>;

  const match = live.match;
  const hasPlayerSession = isAuthenticated || Boolean(getPlayerToken());
  const userId = String(user?._id || '');
  const userDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.playerName || '';
  const displayPlayerName = (row) => (userId && String(row?.playerId || '') === userId && userDisplayName ? userDisplayName : row?.playerName || 'Player');
  const leaderboardPosition = userId ? leaderboard.find((row) => String(row?.playerId || '') === userId) : null;
  const entryPrediction = myEntry?.prediction || null;
  const personalPosition = live.myPosition || leaderboardPosition || (entryPrediction?.score !== undefined ? entryPrediction : null);
  const topThree = leaderboard.slice(0, 3);
  const liveClock = leaderboardMeta?.liveClock || live?.liveClock || match?.liveClock || {};
  const activeRange = leaderboardMeta?.activeMatchTimeRange || liveClock?.activeRange || null;
  const activeRangeLabel = activeRange?.label || getWrestlingTimeRangeLabel(activeRange?.key || activeRange);
  const standingsLabel = leaderboardMeta?.standingsLabel || live?.standingsLabel || liveClock?.standingsLabel || 'LIVE / PROVISIONAL STANDINGS';
  const elapsedLabel = liveClock?.elapsedLabel || formatWrestlingElapsed(liveClock?.elapsedSeconds || 0);

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

          <section className="pw-live-timer-strip" aria-label="Live match timer and provisional scoring range">
            <div><FaClock /><span><small>Current match time</small><strong>{elapsedLabel}</strong></span></div>
            <div><FaBolt /><span><small>Active range</small><strong>{activeRangeLabel || 'Waiting for start'}</strong></span></div>
            <div><FaChartLine /><span><small>Leaderboard mode</small><strong>{standingsLabel}</strong></span></div>
          </section>

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
              {personalPosition ? (
                <><div><span><small>Current rank</small><strong>#{personalPosition.rank || '—'}</strong></span><span><small>Current score</small><strong>{Number(personalPosition.score || 0).toLocaleString()}</strong></span><span><small>Time-range points</small><strong>{Number(personalPosition.provisionalTimeRangePoints || 0) > 0 ? `+${Number(personalPosition.provisionalTimeRangePoints).toLocaleString()}` : '0'}</strong></span><span><small>Rank movement</small><strong>{personalPosition.previousRank && personalPosition.rank ? `${personalPosition.previousRank - personalPosition.rank > 0 ? '+' : ''}${personalPosition.previousRank - personalPosition.rank}` : '—'}</strong></span></div><p>{standingsLabel}. Time-range points can move while the live clock crosses into a new bracket.</p></>
              ) : <div className="pw-live-no-entry"><FaMedal /><h3>{hasPlayerSession ? 'Your score is waiting for calculation.' : 'No personal score is available.'}</h3><p>{hasPlayerSession ? (myEntry?.prediction ? 'Your submitted prediction is attached to this contest. The score appears after official statistics are recalculated.' : myEntry?.entry ? 'Your contest entry is confirmed, but this account has no submitted prediction for this card.' : 'This signed-in account does not have an entry in this contest.') : 'Sign in and submit a prediction before lock time to appear here.'}</p></div>}
            </article>

            <article className="pw-live-podium-card">
              <p className="pw-eyebrow"><FaTrophy /> Live podium</p>
              <div>{topThree.length ? topThree.map((row, index) => <span key={row.playerId}><em>#{row.rank || index + 1}</em>{row.profileUrl ? <img src={row.profileUrl} alt="" /> : <i>{displayPlayerName(row).charAt(0) || 'P'}</i>}<strong>{displayPlayerName(row)}</strong><small>{Number(row.score || 0).toLocaleString()} pts</small></span>) : <p>Rankings appear when official action totals are submitted.</p>}</div>
            </article>
          </section>

          <section className="pw-live-table-panel">
            <header><div><p>{standingsLabel}</p><h2>Live wrestling leaderboard</h2><span>Current range: {activeRangeLabel || 'Waiting for start'} · {elapsedLabel}</span></div><Link href={`/pro-wrestling/leaderboard/${match._id}`}>Open full leaderboard <FaArrowRight /></Link></header>
            <div className="pw-table-scroll"><table><thead><tr><th>Rank</th><th>Player</th><th>Movement</th><th>Exact picks</th><th>Time range</th><th>Score</th></tr></thead><tbody>{leaderboard.length ? leaderboard.map((row) => <tr key={row.playerId}><td><strong>#{row.rank}</strong></td><td><div className="pw-player-cell">{row.profileUrl ? <img src={row.profileUrl} alt="" /> : <span>{displayPlayerName(row).charAt(0) || 'P'}</span>}<b>{displayPlayerName(row)}</b></div></td><td className={row.rankMovement > 0 ? 'is-up' : row.rankMovement < 0 ? 'is-down' : ''}>{row.rankMovement ? `${row.rankMovement > 0 ? '▲' : '▼'} ${Math.abs(row.rankMovement)}` : '—'}</td><td>{row.exactPredictionCount || 0}</td><td>{Number(row.provisionalTimeRangePoints || 0) > 0 ? `+${Number(row.provisionalTimeRangePoints).toLocaleString()}` : '—'}</td><td>{Number(row.score || 0).toLocaleString()}</td></tr>) : <tr><td colSpan="6">No provisional scores have been calculated yet.</td></tr>}</tbody></table></div>
          </section>
        </main>
      </div>
    </>
  );
};

export default WrestlingLivePage;
