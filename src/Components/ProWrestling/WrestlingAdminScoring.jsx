import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaBell,
  FaBolt,
  FaCalculator,
  FaCheck,
  FaCoins,
  FaEdit,
  FaExclamationTriangle,
  FaFlagCheckered,
  FaListAlt,
  FaLock,
  FaSave,
  FaTimes,
  FaTimesCircle,
  FaTrophy,
  FaUser,
  FaUsers,
} from 'react-icons/fa';
import { WrestlingStatusBadge } from './WrestlingPrimitives';
import {
  EMPTY_WRESTLING_STATS,
  WRESTLING_STATS,
  formatTokenAmount,
  formatWrestlingDate,
  getWrestlerImage,
  normalizeWrestlingStats,
  safeWrestlingArray,
  wrestlingRequest,
} from '@/Utils/proWrestling';

const getPlayerName = (record) => (
  record?.user?.playerName
  || [record?.user?.firstName, record?.user?.lastName].filter(Boolean).join(' ')
  || record?.userSnapshot?.displayName
  || 'Fantasy player'
);

const WrestlingAdminScoring = ({ matchId }) => {
  const [match, setMatch] = useState(null);
  const [statsA, setStatsA] = useState({ ...EMPTY_WRESTLING_STATS });
  const [statsB, setStatsB] = useState({ ...EMPTY_WRESTLING_STATS });
  const [winner, setWinner] = useState('');
  const [finishType, setFinishType] = useState('OTHER');
  const [entries, setEntries] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [reason, setReason] = useState('');
  const [activeTable, setActiveTable] = useState('leaderboard');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [correction, setCorrection] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [matchPayload, entryPayload, predictionPayload, boardPayload] = await Promise.all([
        wrestlingRequest(`/api/admin/wrestling/matches/${matchId}`, { admin: true }),
        wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/entries?limit=200`, { admin: true }),
        wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/predictions?limit=200`, { admin: true }),
        wrestlingRequest(`/api/wrestling/matches/${matchId}/leaderboard?limit=100`),
      ]);
      const matchRecord = matchPayload?.match || matchPayload;
      setMatch(matchRecord);
      setStatsA(normalizeWrestlingStats(matchRecord?.officialStats?.competitorA));
      setStatsB(normalizeWrestlingStats(matchRecord?.officialStats?.competitorB));
      setWinner(matchRecord?.officialWinner && matchRecord.officialWinner !== 'NO_CONTEST' ? matchRecord.officialWinner : '');
      setFinishType(matchRecord?.finishType || 'OTHER');
      setEntries(safeWrestlingArray(entryPayload?.data));
      setPredictions(safeWrestlingArray(predictionPayload?.data));
      setLeaderboard(safeWrestlingArray(boardPayload?.data));
      setNotificationTitle((current) => current || `${matchRecord?.matchTitle || 'Pro Wrestling contest'} update`);
      setNotificationMessage((current) => current || `${matchRecord?.matchTitle || 'The wrestling contest'} has a new fight-night update.`);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'The wrestling score center could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (matchId) load();
  }, [matchId]);

  const updateStat = (side, key, value) => {
    const parsed = Math.max(0, Math.round(Number(value) || 0));
    if (side === 'A') setStatsA((current) => ({ ...current, [key]: parsed }));
    else setStatsB((current) => ({ ...current, [key]: parsed }));
  };

  const run = async (key, request, success) => {
    setWorking(key);
    try {
      await request();
      toast.success(success);
      await load();
    } catch (requestError) {
      toast.error(requestError.message || 'The wrestling operation failed.');
    } finally {
      setWorking('');
    }
  };

  const saveLiveStats = () => run(
    'stats',
    () => wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/live-stats`, {
      admin: true,
      method: 'PUT',
      body: { competitorA: statsA, competitorB: statsB, officialWinner: winner || undefined, finishType, reason },
    }),
    'Live wrestling totals saved and provisional rankings recalculated.',
  );

  const setOfficialResult = () => {
    if (!winner) {
      toast.error('Select the official winner or draw.');
      return;
    }
    run(
      'result',
      () => wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/result`, {
        admin: true,
        method: 'PUT',
        body: { competitorA: statsA, competitorB: statsB, officialWinner: winner, finishType, reason },
      }),
      'Official wrestling result saved.',
    );
  };

  const transition = (status) => run(
    `status-${status}`,
    () => wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/status`, { admin: true, method: 'PUT', body: { status, reason } }),
    `Contest moved to ${status}.`,
  );

  const recalculate = () => run(
    'recalculate',
    () => wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/recalculate`, { admin: true, method: 'POST', body: { reason } }),
    'Wrestling scores recalculated.',
  );

  const finalize = () => {
    if (!window.confirm('Finalize this contest and credit all configured payouts? This settlement is terminal.')) return;
    run(
      'finalize',
      () => wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/finalize`, { admin: true, method: 'POST', body: { reason } }),
      'Wrestling contest finalized and payouts processed.',
    );
  };

  const cancel = (status) => {
    if (!window.confirm(`Close this contest as ${status.replace('_', ' ')} and refund eligible entries?`)) return;
    run(
      `cancel-${status}`,
      () => wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/cancel`, { admin: true, method: 'POST', body: { status, reason } }),
      'Contest closed and eligible entries refunded.',
    );
  };

  const sendNotification = () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error('Enter both a notification title and message.');
      return;
    }
    run(
      'notify',
      () => wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/notify`, {
        admin: true,
        method: 'POST',
        body: { title: notificationTitle.trim(), message: notificationMessage.trim() },
      }),
      'Wrestling notification sent to eligible players.',
    );
  };

  const openCorrection = (prediction) => {
    setCorrection({
      ...prediction,
      competitorA: normalizeWrestlingStats(prediction.competitorA),
      competitorB: normalizeWrestlingStats(prediction.competitorB),
      winnerPrediction: prediction.winnerPrediction || '',
    });
    setCorrectionReason('Administrator correction from wrestling score center.');
  };

  const updateCorrection = (side, key, value) => {
    const parsed = Math.max(0, Math.round(Number(value) || 0));
    setCorrection((current) => ({
      ...current,
      [side]: { ...current[side], [key]: parsed },
    }));
  };

  const saveCorrection = async () => {
    if (!correction?.userId) return;
    if (!correction.winnerPrediction) {
      toast.error('Select a winner prediction before saving the correction.');
      return;
    }
    if (!correctionReason.trim()) {
      toast.error('An audit reason is required.');
      return;
    }
    setWorking('correction');
    try {
      await wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/predictions/${correction.userId}`, {
        admin: true,
        method: 'PUT',
        body: {
          competitorA: correction.competitorA,
          competitorB: correction.competitorB,
          winnerPrediction: correction.winnerPrediction,
          reason: correctionReason.trim(),
        },
      });
      toast.success('Player wrestling prediction corrected and audited.');
      setCorrection(null);
      setCorrectionReason('');
      await load();
    } catch (requestError) {
      toast.error(requestError.message || 'The prediction correction could not be saved.');
    } finally {
      setWorking('');
    }
  };

  const submittedCount = useMemo(
    () => predictions.filter((item) => ['SUBMITTED', 'LOCKED', 'SCORED', 'SETTLED'].includes(item.predictionStatus)).length,
    [predictions],
  );

  if (loading) return <div className="pw-admin-page"><div className="pw-admin-loading">Loading wrestling score center…</div></div>;
  if (!match) return <div className="pw-admin-page"><div className="pw-admin-error">{error || 'Wrestling match not found.'}</div></div>;

  const terminal = ['FINALIZED', 'CANCELLED', 'NO_CONTEST'].includes(match.status);

  return (
    <>
      <Head><title>Wrestling Score Center | {match.matchTitle}</title></Head>
      <div className="pw-admin-page pw-admin-scoring-page">
        <div className="pw-admin-form-heading">
          <Link href="/administration/pro-wrestling"><FaArrowLeft /> Wrestling registry</Link>
          <p>Live action and settlement</p>
          <h1>Submit fight scores</h1>
          <span>{match.matchTitle} · {match.eventName} · {formatWrestlingDate(match.matchDate)}</span>
        </div>
        {error && <div className="pw-admin-error">{error}</div>}

        <section className="pw-admin-score-summary">
          <div className="pw-admin-score-fighters">
            <article><img src={getWrestlerImage(match.competitorA, 'A')} alt="" /><span><small>Competitor A</small><strong>{match.competitorA.displayName}</strong></span></article>
            <b>VS</b>
            <article><img src={getWrestlerImage(match.competitorB, 'B')} alt="" /><span><small>Competitor B</small><strong>{match.competitorB.displayName}</strong></span></article>
          </div>
          <div>
            <WrestlingStatusBadge status={match.status} />
            <span><FaUsers /><strong>{entries.length}</strong><small>Entries</small></span>
            <span><FaCheck /><strong>{submittedCount}</strong><small>Predictions</small></span>
            <span><FaCoins /><strong>{formatTokenAmount(match.currentPot)}</strong><small>Token pot</small></span>
          </div>
        </section>

        <section className="pw-admin-score-workspace">
          <div className="pw-admin-score-entry-panel">
            <header><div><p>Official action totals</p><h2>Every scoring field remains visible.</h2><span>Enter exact full-match totals for both wrestlers. Saving live totals updates provisional rankings.</span></div><FaBolt /></header>
            <div className="pw-admin-score-table-head"><span>{match.competitorA.displayName}</span><strong>Action category</strong><span>{match.competitorB.displayName}</span></div>
            {WRESTLING_STATS.map((stat) => (
              <div className="pw-admin-score-row" key={stat.key}>
                <label><button type="button" disabled={terminal} onClick={() => updateStat('A', stat.key, Math.max(0, statsA[stat.key] - 1))}>−</button><input type="number" min="0" value={statsA[stat.key]} disabled={terminal} onChange={(event) => updateStat('A', stat.key, event.target.value)} /><button type="button" disabled={terminal} onClick={() => updateStat('A', stat.key, statsA[stat.key] + 1)}>+</button></label>
                <div><strong>{stat.label}</strong><span>{stat.short}</span><small>{stat.description}</small></div>
                <label><button type="button" disabled={terminal} onClick={() => updateStat('B', stat.key, Math.max(0, statsB[stat.key] - 1))}>−</button><input type="number" min="0" value={statsB[stat.key]} disabled={terminal} onChange={(event) => updateStat('B', stat.key, event.target.value)} /><button type="button" disabled={terminal} onClick={() => updateStat('B', stat.key, statsB[stat.key] + 1)}>+</button></label>
              </div>
            ))}
            <div className="pw-admin-result-fields">
              <label><span>Official winner</span><select value={winner} disabled={terminal} onChange={(event) => setWinner(event.target.value)}><option value="">Winner not set</option><option value="A">{match.competitorA.displayName}</option><option value="B">{match.competitorB.displayName}</option><option value="DRAW">Draw</option></select></label>
              <label><span>Finish type</span><select value={finishType} disabled={terminal} onChange={(event) => setFinishType(event.target.value)}>{['PINFALL', 'SUBMISSION', 'DQ', 'COUNT_OUT', 'DRAW', 'OTHER'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="is-wide"><span>Admin reason / audit note</span><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Optional reason recorded in the audit trail" /></label>
            </div>
            <div className="pw-admin-score-primary-actions">
              <button type="button" disabled={terminal || Boolean(working)} onClick={saveLiveStats}><FaSave /> {working === 'stats' ? 'Saving…' : 'Save live totals'}</button>
              <button type="button" disabled={terminal || Boolean(working)} onClick={setOfficialResult}><FaFlagCheckered /> {working === 'result' ? 'Saving…' : 'Set official result'}</button>
              <button type="button" disabled={terminal || Boolean(working)} onClick={recalculate}><FaCalculator /> {working === 'recalculate' ? 'Calculating…' : 'Recalculate rankings'}</button>
            </div>
          </div>

          <aside className="pw-admin-control-rail">
            <section><p>Match lifecycle</p><h3>Operational controls</h3><button type="button" disabled={match.status !== 'DRAFT' || Boolean(working)} onClick={() => transition('OPEN')}><FaBolt /> Publish and open</button><button type="button" disabled={match.status !== 'OPEN' || Boolean(working)} onClick={() => transition('LOCKED')}><FaLock /> Lock predictions</button><button type="button" disabled={!['LOCKED', 'OPEN'].includes(match.status) || Boolean(working)} onClick={() => transition('LIVE')}><FaBolt /> Mark match live</button><button type="button" disabled={!['LIVE', 'LOCKED'].includes(match.status) || Boolean(working)} onClick={() => transition('SCORING')}><FaCalculator /> Move to scoring</button></section>
            <section className="is-settlement"><p>Settlement</p><h3>Finalize the pot</h3><span>Requires an official result and submitted predictions.</span><button type="button" disabled={terminal || Boolean(working)} onClick={finalize}><FaTrophy /> {working === 'finalize' ? 'Finalizing…' : 'Finalize and pay'}</button></section>
            <section className="pw-admin-notify-card"><p>Player communication</p><h3>Send contest update</h3><input value={notificationTitle} onChange={(event) => setNotificationTitle(event.target.value)} placeholder="Notification title" /><textarea rows="3" value={notificationMessage} onChange={(event) => setNotificationMessage(event.target.value)} placeholder="Notification message" /><button type="button" disabled={Boolean(working)} onClick={sendNotification}><FaBell /> {working === 'notify' ? 'Sending…' : 'Notify eligible players'}</button></section>
            <section className="is-danger"><p>Exception workflow</p><h3>Cancel or no contest</h3><button type="button" disabled={terminal || Boolean(working)} onClick={() => cancel('CANCELLED')}><FaTimesCircle /> Cancel and refund</button><button type="button" disabled={terminal || Boolean(working)} onClick={() => cancel('NO_CONTEST')}><FaExclamationTriangle /> No contest and refund</button></section>
          </aside>
        </section>

        <section className="pw-admin-panel pw-admin-submission-registry">
          <header>
            <div><p>Contest participation</p><h2>Entries, submitted scorecards, and standings</h2><span>Review every player record and correct a scorecard through the audited backend endpoint.</span></div>
            <Link href={`/pro-wrestling/leaderboard/${match._id}`} target="_blank" className="pw-admin-secondary">Public leaderboard</Link>
          </header>
          <nav className="pw-admin-data-tabs">
            <button type="button" className={activeTable === 'leaderboard' ? 'is-active' : ''} onClick={() => setActiveTable('leaderboard')}><FaTrophy /> Standings <span>{leaderboard.length}</span></button>
            <button type="button" className={activeTable === 'entries' ? 'is-active' : ''} onClick={() => setActiveTable('entries')}><FaUsers /> Entries <span>{entries.length}</span></button>
            <button type="button" className={activeTable === 'predictions' ? 'is-active' : ''} onClick={() => setActiveTable('predictions')}><FaListAlt /> Predictions <span>{predictions.length}</span></button>
          </nav>

          {activeTable === 'leaderboard' && (
            <div className="pw-admin-table-wrap"><table className="pw-admin-table"><thead><tr><th>Rank</th><th>Player</th><th>Status</th><th>Exact picks</th><th>Score</th><th>Payout</th></tr></thead><tbody>{leaderboard.length ? leaderboard.map((row) => <tr key={row.playerId}><td><strong>#{row.rank}</strong></td><td>{row.playerName}</td><td>{match.status}</td><td>{row.exactPredictionCount || 0}</td><td>{Number(row.score || 0).toLocaleString()}</td><td>{row.payoutAmount !== undefined ? `${formatTokenAmount(row.payoutAmount)} tokens` : 'Pending'}</td></tr>) : <tr><td colSpan="6">No ranked predictions are available yet.</td></tr>}</tbody></table></div>
          )}

          {activeTable === 'entries' && (
            <div className="pw-admin-table-wrap"><table className="pw-admin-table"><thead><tr><th>Player</th><th>Email</th><th>Entry status</th><th>Fee</th><th>Affiliate</th><th>Joined</th></tr></thead><tbody>{entries.length ? entries.map((entry) => <tr key={entry._id}><td><div className="pw-admin-player-cell">{entry.user?.profileUrl ? <img src={entry.user.profileUrl} alt="" /> : <i><FaUser /></i>}<span><strong>{getPlayerName(entry)}</strong><small>{entry.userId}</small></span></div></td><td>{entry.user?.email || '—'}</td><td>{entry.status}</td><td>{formatTokenAmount(entry.entryFeeTokens)} tokens</td><td>{entry.affiliateId || 'Direct'}</td><td>{formatWrestlingDate(entry.joinedAt || entry.createdAt)}</td></tr>) : <tr><td colSpan="6">No users have entered this contest.</td></tr>}</tbody></table></div>
          )}

          {activeTable === 'predictions' && (
            <div className="pw-admin-table-wrap pw-admin-predictions-table-wrap"><table className="pw-admin-table pw-admin-predictions-table"><thead><tr><th>Player</th><th>Status</th><th>Winner</th>{WRESTLING_STATS.map((stat) => <th key={`a-${stat.key}`}>A {stat.short}</th>)}{WRESTLING_STATS.map((stat) => <th key={`b-${stat.key}`}>B {stat.short}</th>)}<th>Score</th><th>Action</th></tr></thead><tbody>{predictions.length ? predictions.map((prediction) => <tr key={prediction._id}><td><div className="pw-admin-player-cell">{prediction.user?.profileUrl ? <img src={prediction.user.profileUrl} alt="" /> : <i><FaUser /></i>}<span><strong>{getPlayerName(prediction)}</strong><small>{prediction.user?.email || prediction.userId}</small></span></div></td><td>{prediction.predictionStatus}</td><td>{prediction.winnerPrediction || '—'}</td>{WRESTLING_STATS.map((stat) => <td key={`a-${stat.key}`}>{prediction.competitorA?.[stat.key] ?? 0}</td>)}{WRESTLING_STATS.map((stat) => <td key={`b-${stat.key}`}>{prediction.competitorB?.[stat.key] ?? 0}</td>)}<td>{Number(prediction.score || 0).toLocaleString()}</td><td><button type="button" className="pw-admin-table-edit" disabled={terminal} onClick={() => openCorrection(prediction)}><FaEdit /> Correct</button></td></tr>) : <tr><td colSpan="15">No wrestling predictions have been submitted.</td></tr>}</tbody></table></div>
          )}
        </section>
      </div>

      {correction && (
        <div className="pw-admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCorrection(null); }}>
          <section className="pw-admin-correction-modal" role="dialog" aria-modal="true" aria-label="Correct player wrestling prediction">
            <header><div><p>Audited administrator correction</p><h2>{getPlayerName(correction)}</h2><span>Every changed value is submitted to the existing correction endpoint and recorded in the audit log.</span></div><button type="button" onClick={() => setCorrection(null)}><FaTimes /></button></header>
            <div className="pw-admin-correction-head"><span>{match.competitorA.displayName}</span><strong>Category</strong><span>{match.competitorB.displayName}</span></div>
            {WRESTLING_STATS.map((stat) => <div className="pw-admin-correction-row" key={stat.key}><input type="number" min="0" value={correction.competitorA[stat.key]} onChange={(event) => updateCorrection('competitorA', stat.key, event.target.value)} /><span><b>{stat.short}</b><small>{stat.label}</small></span><input type="number" min="0" value={correction.competitorB[stat.key]} onChange={(event) => updateCorrection('competitorB', stat.key, event.target.value)} /></div>)}
            <label><span>Winner prediction</span><select value={correction.winnerPrediction} onChange={(event) => setCorrection((current) => ({ ...current, winnerPrediction: event.target.value }))}><option value="">Select predicted winner</option><option value="A">{match.competitorA.displayName}</option><option value="B">{match.competitorB.displayName}</option><option value="DRAW">Draw</option></select></label>
            <label><span>Required audit reason</span><textarea rows="3" value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} /></label>
            <footer><button type="button" className="pw-admin-secondary" onClick={() => setCorrection(null)}>Cancel</button><button type="button" className="pw-admin-primary" disabled={working === 'correction'} onClick={saveCorrection}><FaSave /> {working === 'correction' ? 'Saving correction…' : 'Save audited correction'}</button></footer>
          </section>
        </div>
      )}
    </>
  );
};

export default WrestlingAdminScoring;
