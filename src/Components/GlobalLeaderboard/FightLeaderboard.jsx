import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaChartLine,
  FaClock,
  FaCoins,
  FaCrown,
  FaFistRaised,
  FaMedal,
  FaRedoAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import { stopMusic, playMusic } from '../../Redux/musicSlice';
import { fetchMatches } from '../../Redux/matchSlice';
import { getFightCategory, getFighterImage } from '@/Utils/fightExperience';
import { buildPublicApiUrl } from '@/Utils/publicApi';

const DEFAULT_AVATAR = '/images/fmm-experience/avatar-placeholder.svg';

const FightLeaderboard = ({ matchId, matchOverride = null }) => {
  const [scores, setScores] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshed, setRefreshed] = useState(false);
  const user = useSelector((state) => state.user);
  const matches = useSelector((state) => state.matches.data);
  const match = matchOverride || (Array.isArray(matches) ? matches.find((item) => String(item?._id || item?.id || item?.matchId) === String(matchId)) : null);
  const dispatch = useDispatch();

  const fetchLeaderboardData = async () => {
    setRefreshed(true);
    try {
      const [scoresResponse, usersResponse] = await Promise.all([
        fetch(buildPublicApiUrl('/api/scores', { matchId })),
        fetch(buildPublicApiUrl('/users')),
      ]);
      const [scoresPayload, usersPayload] = await Promise.all([scoresResponse.json(), usersResponse.json()]);
      setScores(Array.isArray(scoresPayload) ? scoresPayload.filter((score) => score.matchId === matchId) : []);
      setUsers(Array.isArray(usersPayload) ? usersPayload : []);
      dispatch(fetchMatches());
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      window.setTimeout(() => setRefreshed(false), 800);
    }
  };

  const getRefreshInterval = () => {
    const category = match?.matchCategoryTwo || match?.matchCategory;
    switch (category) {
      case 'boxing':
      case 'kickboxing':
        return 180000;
      case 'mma':
        return 300000;
      case 'bare-knuckle':
        return 120000;
      default:
        return 60000;
    }
  };

  useEffect(() => {
    if (!match) return undefined;
    dispatch(stopMusic());
    fetchLeaderboardData();
    const refreshTimer = window.setInterval(fetchLeaderboardData, getRefreshInterval());
    return () => {
      window.clearInterval(refreshTimer);
      dispatch(playMusic());
    };
    // Existing match-scoped refresh behavior is intentionally retained.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, dispatch, Boolean(match)]);

  const calculatePoints = (userPrediction, fighterOneStats, fighterTwoStats) => {
    let totalScore = 0;

    (Array.isArray(userPrediction) ? userPrediction : []).forEach((roundPrediction, index) => {
      const fighterOneRound = fighterOneStats?.[index];
      const fighterTwoRound = fighterTwoStats?.[index];
      if (!fighterOneRound || !fighterTwoRound || !roundPrediction) return;

      if (match.matchCategory === 'boxing') {
        if (roundPrediction.hpPrediction1 !== null && roundPrediction.hpPrediction1 <= fighterOneRound.HP) totalScore += roundPrediction.hpPrediction1;
        if (roundPrediction.bpPrediction1 !== null && roundPrediction.bpPrediction1 <= fighterOneRound.BP) totalScore += roundPrediction.bpPrediction1;
        if (roundPrediction.tpPrediction1 !== null && roundPrediction.tpPrediction1 <= fighterOneRound.TP) totalScore += roundPrediction.tpPrediction1;
        if (roundPrediction.rwPrediction1 !== null && roundPrediction.rwPrediction1 === fighterOneRound.RW) totalScore += roundPrediction.rwPrediction1;
        if (roundPrediction.koPrediction1 !== null && roundPrediction.koPrediction1 === fighterOneRound.KO) totalScore += fighterOneRound.KO;
        if (roundPrediction.hpPrediction2 !== null && roundPrediction.hpPrediction2 <= fighterTwoRound.HP) totalScore += roundPrediction.hpPrediction2;
        if (roundPrediction.bpPrediction2 !== null && roundPrediction.bpPrediction2 <= fighterTwoRound.BP) totalScore += roundPrediction.bpPrediction2;
        if (roundPrediction.tpPrediction2 !== null && roundPrediction.tpPrediction2 <= fighterTwoRound.TP) totalScore += roundPrediction.tpPrediction2;
        if (roundPrediction.rwPrediction2 !== null && roundPrediction.rwPrediction2 === fighterTwoRound.RW) totalScore += roundPrediction.rwPrediction2;
        if (roundPrediction.koPrediction2 !== null && roundPrediction.koPrediction2 === fighterTwoRound.KO) totalScore += fighterTwoRound.KO;
      } else if (match.matchCategory === 'mma') {
        if (roundPrediction.hpPrediction1 !== null && roundPrediction.hpPrediction1 <= fighterOneRound.ST) totalScore += roundPrediction.hpPrediction1;
        if (roundPrediction.bpPrediction1 !== null && roundPrediction.bpPrediction1 <= fighterOneRound.KI) totalScore += roundPrediction.bpPrediction1;
        if (roundPrediction.tpPrediction1 !== null && roundPrediction.tpPrediction1 <= fighterOneRound.KN) totalScore += roundPrediction.tpPrediction1;
        if (roundPrediction.elPrediction1 !== null && roundPrediction.elPrediction1 <= fighterOneRound.EL) totalScore += roundPrediction.elPrediction1;
        if (roundPrediction.rwPrediction1 !== null && roundPrediction.rwPrediction1 === fighterOneRound.RW) totalScore += roundPrediction.rwPrediction1;
        if (roundPrediction.koPrediction1 !== null && roundPrediction.koPrediction1 === fighterOneRound.KO) totalScore += fighterOneRound.KO;
        if (roundPrediction.hpPrediction2 !== null && roundPrediction.hpPrediction2 <= fighterTwoRound.ST) totalScore += roundPrediction.hpPrediction2;
        if (roundPrediction.bpPrediction2 !== null && roundPrediction.bpPrediction2 <= fighterTwoRound.KI) totalScore += roundPrediction.bpPrediction2;
        if (roundPrediction.tpPrediction2 !== null && roundPrediction.tpPrediction2 <= fighterTwoRound.KN) totalScore += roundPrediction.tpPrediction2;
        if (roundPrediction.elPrediction2 !== null && roundPrediction.elPrediction2 <= fighterTwoRound.EL) totalScore += roundPrediction.elPrediction2;
        if (roundPrediction.rwPrediction2 !== null && roundPrediction.rwPrediction2 === fighterTwoRound.RW) totalScore += roundPrediction.rwPrediction2;
        if (roundPrediction.koPrediction2 !== null && roundPrediction.koPrediction2 === fighterTwoRound.KO) totalScore += fighterTwoRound.KO;
      }
    });

    return totalScore;
  };

  const rankedEntries = useMemo(() => {
    if (!match) return [];
    const fighterOneStats = match.matchCategory === 'boxing'
      ? match.BoxingMatch?.fighterOneStats
      : match.MMAMatch?.fighterOneStats;
    const fighterTwoStats = match.matchCategory === 'boxing'
      ? match.BoxingMatch?.fighterTwoStats
      : match.MMAMatch?.fighterTwoStats;

    return scores
      .map((score) => {
        const scoreUser = users.find((candidate) => candidate._id === score.playerId);
        if (!scoreUser) return null;
        return {
          user: scoreUser,
          totalPoints: calculatePoints(score.predictions, fighterOneStats || [], fighterTwoStats || []),
        };
      })
      .filter(Boolean)
      .sort((left, right) => Number(right.totalPoints || 0) - Number(left.totalPoints || 0));
    // calculatePoints intentionally mirrors the existing scoring logic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, users, match]);

  if (!match) {
    return <div className="player-dynamic-empty"><FaChartLine /><h2>Leaderboard unavailable</h2><p>The selected fight is not available.</p></div>;
  }

  const getYouTubeEmbedUrl = (url = '') => {
    if (url.includes('youtu.be/')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0] || ''}`;
    if (url.includes('watch?v=')) return `https://www.youtube.com/embed/${url.split('watch?v=')[1]?.split('&')[0] || ''}`;
    if (url.includes('/embed/')) return url;
    return '';
  };

  const videoUrl = getYouTubeEmbedUrl(match.matchVideoUrl);
  const fighterAImage = getFighterImage(match, 'A', 0);
  const fighterBImage = getFighterImage(match, 'B', 1);
  const currentRank = rankedEntries.findIndex((entry) => entry.user._id === user?._id);
  const currentEntry = currentRank >= 0 ? rankedEntries[currentRank] : null;
  const podium = [rankedEntries[1], rankedEntries[0], rankedEntries[2]];
  const podiumRanks = [2, 1, 3];

  return (
    <section className="player-live-results fightLeaderboardUpdated">
      <div className="player-live-results-backdrop" aria-hidden="true" />
      <div className="theme-container player-live-results-shell">
        <header className="player-live-results-hero">
          <div>
            <p><FaChartLine /> Live fight results</p>
            <h1>{match.matchFighterA} <span>vs</span> {match.matchFighterB}</h1>
            <div className="player-live-results-meta">
              <span><FaFistRaised /> {getFightCategory(match)}</span>
              <span><FaTrophy /> {match.matchType}</span>
              <span><FaCoins /> Pot {match.pot || 0}</span>
              <span><FaUsers /> {Array.isArray(match.userPredictions) ? match.userPredictions.length : 0} players</span>
            </div>
          </div>
          <button type="button" onClick={fetchLeaderboardData} disabled={refreshed}>
            <FaRedoAlt className={refreshed ? 'is-spinning' : ''} /> {refreshed ? 'Refreshing…' : 'Refresh scores'}
          </button>
        </header>

        <section className="player-live-fight-card">
          <article className="is-blue"><img src={fighterAImage} alt={match.matchFighterA} /><span><small>Blue corner</small><strong>{match.matchFighterA}</strong></span></article>
          <div><b>VS</b><small>{match.maxRounds || '—'} rounds</small></div>
          <article className="is-red"><img src={fighterBImage} alt={match.matchFighterB} /><span><small>Red corner</small><strong>{match.matchFighterB}</strong></span></article>
        </section>

        {videoUrl && (
          <section className="player-live-video-card">
            <div className="player-result-section-heading"><span><FaFistRaised /> Fight feed</span><h2>Watch the posted fight video</h2></div>
            <iframe
              src={videoUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </section>
        )}

        <section className="player-live-leaderboard-card">
          <div className="player-result-section-heading">
            <div><span><FaCrown /> Score center</span><h2>Live leaderboard</h2></div>
            <p><FaClock /> Scores refresh automatically for this fight category.</p>
          </div>

          {rankedEntries.length ? (
            <>
              <div className="player-live-podium">
                {podium.map((entry, index) => entry ? (
                  <article key={entry.user._id} className={podiumRanks[index] === 1 ? 'is-first' : ''}>
                    <i>{podiumRanks[index] === 1 ? <FaCrown /> : <FaMedal />}</i>
                    <em>#{podiumRanks[index]}</em>
                    <img src={entry.user.profileUrl || DEFAULT_AVATAR} alt={entry.user.firstName || 'Player'} />
                    <strong>{entry.user.firstName} {entry.user.lastName}</strong>
                    <span>{entry.totalPoints} pts</span>
                  </article>
                ) : <div key={`empty-${index}`} className="player-live-podium-empty" />)}
              </div>

              <div className="player-live-rank-table-wrap">
                <table className="player-live-rank-table">
                  <thead><tr><th>Rank</th><th>Player</th><th>Points</th><th>Status</th></tr></thead>
                  <tbody>
                    {rankedEntries.map((entry, index) => (
                      <tr key={entry.user._id} className={entry.user._id === user?._id ? 'is-current' : ''}>
                        <td><b>#{index + 1}</b></td>
                        <td><span><img src={entry.user.profileUrl || DEFAULT_AVATAR} alt="" /><strong>{entry.user.firstName} {entry.user.lastName}</strong></span></td>
                        <td>{entry.totalPoints}</td>
                        <td>{entry.user._id === user?._id ? 'Your position' : index < 3 ? 'Podium' : 'Ranked'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="player-live-current-rank">
                <FaTrophy />
                <span><small>Your current position</small><strong>{currentEntry ? `#${currentRank + 1}` : 'Unranked'}</strong></span>
                <span><small>Your points</small><strong>{currentEntry?.totalPoints || 0}</strong></span>
              </div>
            </>
          ) : (
            <div className="player-dynamic-empty is-inline"><FaTrophy /><h3>No scores posted yet</h3><p>The leaderboard will populate as fight scores become available.</p></div>
          )}
        </section>
      </div>
    </section>
  );
};

export default FightLeaderboard;
