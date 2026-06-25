import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { FaArrowLeft, FaArrowRight, FaCoins, FaCrown, FaMedal, FaTrophy } from 'react-icons/fa';
import { WrestlingModeNav, WrestlingStatusBadge } from './WrestlingPrimitives';
import { formatTokenAmount, getWrestlerImage, winnerLabel, wrestlingRequest } from '@/Utils/proWrestling';

const WrestlingLeaderboardPage = () => {
  const router = useRouter();
  const { matchId } = router.query;
  const user = useSelector((state) => state.user);
  const [match, setMatch] = useState(null);
  const [rows, setRows] = useState([]);
  const [myResult, setMyResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady || !matchId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [matchPayload, boardPayload] = await Promise.all([
          wrestlingRequest(`/api/wrestling/matches/${matchId}`),
          wrestlingRequest(`/api/wrestling/matches/${matchId}/leaderboard?limit=100`),
        ]);
        if (!active) return;
        setMatch(matchPayload);
        setRows(Array.isArray(boardPayload?.data) ? boardPayload.data : []);
        if (['SCORING', 'FINALIZED'].includes(matchPayload.status)) {
          try {
            const resultPayload = await wrestlingRequest(`/api/wrestling/matches/${matchId}/results`, { auth: true });
            if (active) setMyResult(resultPayload?.myResult || null);
          } catch (resultError) {
            if (![401, 403].includes(resultError.status)) console.error(resultError);
          }
        }
      } catch (requestError) {
        if (active) setError(requestError.message || 'Leaderboard unavailable.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [matchId, router.isReady]);

  if (loading) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaTrophy /><h1>Loading wrestling leaderboard…</h1></div></div>;
  if (error || !match) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaMedal /><h1>Leaderboard unavailable</h1><p>{error}</p><Link href="/pro-wrestling" className="pw-btn pw-btn-secondary">Wrestling lobby <FaArrowRight /></Link></div></div>;

  const userId = String(user?._id || '');
  const userDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.playerName || '';
  const displayPlayerName = (row) => (userId && String(row?.playerId || '') === userId && userDisplayName ? userDisplayName : row?.playerName || 'Player');
  const podium = rows.slice(0, 3);
  return (
    <>
      <Head><title>Wrestling Leaderboard | {match.matchTitle}</title></Head>
      <div className="pw-page pw-leaderboard-page">
        <section className="pw-leaderboard-hero">
          <div className="theme-container">
            <Link href={`/pro-wrestling/matches/${match._id}`} className="pw-inline-back"><FaArrowLeft /> Contest overview</Link>
            <div className="pw-leaderboard-hero-copy"><p>Fantasy MMADNESS Pro Wrestling</p><h1>The action decides. <span>The leaderboard remembers.</span></h1><div><WrestlingStatusBadge status={match.status} /><span><FaCrown /> Winner: {winnerLabel(match.officialWinner, match)}</span><span><FaCoins /> {formatTokenAmount(match.currentPot)} token pot</span></div></div>
            <div className="pw-leaderboard-fighters"><img src={getWrestlerImage(match.competitorA, 'A')} alt={match.competitorA.displayName} /><strong>{match.competitorA.displayName} <em>VS</em> {match.competitorB.displayName}</strong><img src={getWrestlerImage(match.competitorB, 'B')} alt={match.competitorB.displayName} /></div>
          </div>
        </section>
        <WrestlingModeNav active="contests" />
        <main className="theme-container pw-main pw-leaderboard-main">
          <section className="pw-podium">
            {podium.length ? podium.map((row, index) => <article key={row.playerId} className={`place-${index + 1}`}><span>#{row.rank || index + 1}</span>{row.profileUrl ? <img src={row.profileUrl} alt={displayPlayerName(row)} /> : <i>{displayPlayerName(row).charAt(0) || 'P'}</i>}<FaCrown /><h2>{displayPlayerName(row)}</h2><strong>{Number(row.score || 0).toLocaleString()} pts</strong><small>{row.payoutAmount !== undefined ? `${formatTokenAmount(row.payoutAmount)} tokens won` : `${row.exactPredictionCount || 0} exact categories`}</small></article>) : <div className="pw-empty-podium"><FaTrophy /><h2>Rankings have not been calculated.</h2><p>The leaderboard will populate when the administration team submits official action totals.</p></div>}
          </section>

          {myResult && <section className="pw-my-final-result"><FaMedal /><div><small>Your finalized performance</small><h2>Rank #{myResult.rank || '—'} · {Number(myResult.score || 0).toLocaleString()} points</h2><p>{myResult.exactPredictionCount || 0} exact category predictions · {formatTokenAmount(myResult.payoutAmount)} payout tokens</p></div><Link href="/pro-wrestling/history">Open wrestling history <FaArrowRight /></Link></section>}

          <section className="pw-live-table-panel is-final">
            <header><div><p>{match.status === 'FINALIZED' ? 'Official final standings' : 'Provisional standings'}</p><h2>{match.matchTitle}</h2></div><span>{rows.length} ranked players</span></header>
            <div className="pw-table-scroll"><table><thead><tr><th>Rank</th><th>Player</th><th>Movement</th><th>Exact picks</th><th>Score</th><th>Payout</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.playerId}><td><strong>#{row.rank}</strong></td><td><div className="pw-player-cell">{row.profileUrl ? <img src={row.profileUrl} alt="" /> : <span>{displayPlayerName(row).charAt(0) || 'P'}</span>}<b>{displayPlayerName(row)}</b></div></td><td>{row.rankMovement ? `${row.rankMovement > 0 ? '▲' : '▼'} ${Math.abs(row.rankMovement)}` : '—'}</td><td>{row.exactPredictionCount || 0}</td><td>{Number(row.score || 0).toLocaleString()}</td><td>{row.payoutAmount !== undefined ? `${formatTokenAmount(row.payoutAmount)} tokens` : 'Pending'}</td></tr>) : <tr><td colSpan="6">No ranked predictions are available.</td></tr>}</tbody></table></div>
          </section>
        </main>
      </div>
    </>
  );
};

export default WrestlingLeaderboardPage;
