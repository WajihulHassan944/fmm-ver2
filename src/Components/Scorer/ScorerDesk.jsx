import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCheck, FaExclamationTriangle, FaLock, FaMinus, FaPlus, FaSyncAlt } from 'react-icons/fa';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fantasymmadness-game-server-three.vercel.app';

// Same codes the server writes (normalizeRoundStatsForCategory). KN is KNEES on
// the MMA card — knockdowns that end a fight are the KO market, not a count.
const BOXING_STATS = [
  { code: 'HP', label: 'Head punches' },
  { code: 'BP', label: 'Body punches' },
  { code: 'TP', label: 'Total punches' },
];
const MMA_STATS = [
  { code: 'ST', label: 'Strikes' },
  { code: 'KI', label: 'Kicks' },
  { code: 'KN', label: 'Knees' },
  { code: 'EL', label: 'Elbows' },
];

const SCORER_TOKEN_KEY = 'fmmScorerToken';

const readStat = (rows, round, code) => {
  const row = (rows || []).find((entry) => Number(entry.roundNumber) === Number(round));
  const value = row ? row[code] : null;
  return value === null || value === undefined || value === '' ? '' : String(value);
};

const ScorerDesk = ({ token: initialToken }) => {
  const [token, setToken] = useState(initialToken || '');
  const [fight, setFight] = useState(null);
  const [round, setRound] = useState(1);
  const [draft, setDraft] = useState({ a: {}, b: {} });
  const [winner, setWinner] = useState(null);
  const [finish, setFinish] = useState(false);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Exchange the one-time link for a scoped session, then keep the session so a
  // dropped signal at the arena does not cost the scorer their place.
  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem(SCORER_TOKEN_KEY) : '';
      if (stored) { if (!cancelled) setToken(stored); return; }
      if (!initialToken) { setStatus('error'); setError('No scoring link was provided.'); return; }
      try {
        const response = await fetch(`${API_BASE}/api/scorer/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: initialToken }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.message || 'This scoring link is not valid.');
        if (cancelled) return;
        window.sessionStorage.setItem(SCORER_TOKEN_KEY, payload.token);
        setToken(payload.token);
      } catch (claimError) {
        if (!cancelled) { setStatus('error'); setError(claimError.message); }
      }
    };
    start();
    return () => { cancelled = true; };
  }, [initialToken]);

  const loadFight = useCallback(async (sessionToken) => {
    if (!sessionToken) return;
    try {
      const response = await fetch(`${API_BASE}/api/scorer/fight`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Could not load the fight.');
      setFight(payload.fight);
      setStatus('ready');
    } catch (loadError) {
      setStatus('error');
      setError(loadError.message);
    }
  }, []);

  useEffect(() => { if (token) loadFight(token); }, [token, loadFight]);

  const stats = useMemo(
    () => (fight?.category === 'boxing' ? BOXING_STATS : MMA_STATS),
    [fight?.category],
  );

  // Load whatever is already on the fight for this round, so a scorer picking up
  // mid-card sees the real numbers instead of an empty card.
  useEffect(() => {
    if (!fight) return;
    const next = { a: {}, b: {} };
    stats.forEach(({ code }) => {
      next.a[code] = readStat(fight.fighterOneStats, round, code);
      next.b[code] = readStat(fight.fighterTwoStats, round, code);
    });
    setDraft(next);
    const aWon = readStat(fight.fighterOneStats, round, 'RW');
    const bWon = readStat(fight.fighterTwoStats, round, 'RW');
    setWinner(Number(aWon) > 0 ? 'a' : Number(bWon) > 0 ? 'b' : null);
    setFinish(Number(readStat(fight.fighterOneStats, round, 'KO')) > 0 || Number(readStat(fight.fighterTwoStats, round, 'KO')) > 0);
  }, [fight, round, stats]);

  const bump = (corner, code, delta) => {
    setDraft((current) => {
      const value = Math.max(0, (Number(current[corner][code]) || 0) + delta);
      return { ...current, [corner]: { ...current[corner], [code]: String(value) } };
    });
  };

  const setValue = (corner, code, value) => {
    setDraft((current) => ({ ...current, [corner]: { ...current[corner], [code]: value.replace(/[^0-9]/g, '') } }));
  };

  const submitRound = async () => {
    if (!winner) { setError('Pick who won the round before submitting.'); return; }
    setSaving(true);
    setError('');
    const loser = winner === 'a' ? 'b' : 'a';
    const numeric = (corner) => Object.fromEntries(
      stats.map(({ code }) => [code, Number(draft[corner][code]) || 0]),
    );
    // RW/RL are paired: the winning corner takes the round, the other corner is
    // credited automatically. The finish flag sets KO on the winner and drops
    // the other corner to zero rather than survival.
    const body = {
      fighterOneStats: {
        roundNumber: round,
        ...numeric('a'),
        RW: winner === 'a' ? 1 : 0,
        RL: loser === 'a' ? 1 : 0,
        KO: finish && winner === 'a' ? 1 : 0,
        SP: finish ? 0 : (loser === 'a' ? 1 : 0),
      },
      fighterTwoStats: {
        roundNumber: round,
        ...numeric('b'),
        RW: winner === 'b' ? 1 : 0,
        RL: loser === 'b' ? 1 : 0,
        KO: finish && winner === 'b' ? 1 : 0,
        SP: finish ? 0 : (loser === 'b' ? 1 : 0),
      },
    };
    try {
      const response = await fetch(`${API_BASE}/api/scorer/fight/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Could not save the round.');
      setFight(payload.fight);
      setSavedAt(new Date());
      if (round < (payload.fight?.maxRounds || 1)) setRound(round + 1);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return <div className="scorer-shell scorer-state"><FaSyncAlt className="is-spinning" /> Opening the scorecard…</div>;
  }

  if (status === 'error') {
    return (
      <div className="scorer-shell scorer-state is-error">
        <FaExclamationTriangle />
        <strong>{error}</strong>
        <p>Ask the promoter for a fresh scoring link.</p>
      </div>
    );
  }

  const rounds = Array.from({ length: fight?.maxRounds || 1 }, (_, index) => index + 1);

  return (
    <div className="scorer-shell">
      <header className="scorer-header">
        <div>
          <p className="scorer-eyebrow">Official scorecard</p>
          <h1>{fight.fighterA} <span>vs</span> {fight.fighterB}</h1>
          <p className="scorer-sub">
            {(fight.categoryTwo || fight.category || '').toString().toUpperCase()} · {fight.maxRounds} rounds
            {fight.assignment?.scorerName ? ` · scoring as ${fight.assignment.scorerName}` : ''}
          </p>
        </div>
        <div className="scorer-authority">
          <FaLock aria-hidden="true" />
          <span>Rounds go live as you submit. Only the promoter finalizes and pays out.</span>
        </div>
      </header>

      <nav className="scorer-rounds" aria-label="Rounds">
        {rounds.map((number) => {
          const scored = Number(readStat(fight.fighterOneStats, number, 'RW')) > 0
            || Number(readStat(fight.fighterTwoStats, number, 'RW')) > 0;
          return (
            <button
              key={number}
              type="button"
              className={`${number === round ? 'is-active' : ''} ${scored ? 'is-scored' : ''}`}
              onClick={() => setRound(number)}
            >
              R{number}{scored && <FaCheck aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="scorer-grid">
        {[{ key: 'a', name: fight.fighterA }, { key: 'b', name: fight.fighterB }].map((corner) => (
          <section key={corner.key} className={`scorer-corner is-${corner.key}`}>
            <h2>{corner.name}</h2>
            {stats.map(({ code, label }) => (
              <div key={code} className="scorer-stat">
                <label htmlFor={`${corner.key}-${code}`}>{label} <em>{code}</em></label>
                <div>
                  <button type="button" onClick={() => bump(corner.key, code, -1)} aria-label={`Decrease ${label}`}><FaMinus /></button>
                  <input
                    id={`${corner.key}-${code}`}
                    inputMode="numeric"
                    value={draft[corner.key][code] ?? ''}
                    onChange={(event) => setValue(corner.key, code, event.target.value)}
                    placeholder="0"
                  />
                  <button type="button" onClick={() => bump(corner.key, code, 1)} aria-label={`Increase ${label}`}><FaPlus /></button>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>

      <section className="scorer-outcome">
        <p>Who won round {round}?</p>
        <div className="scorer-winner">
          <button type="button" className={winner === 'a' ? 'is-picked' : ''} onClick={() => setWinner('a')}>{fight.fighterA}</button>
          <button type="button" className={winner === 'b' ? 'is-picked' : ''} onClick={() => setWinner('b')}>{fight.fighterB}</button>
        </div>
        <label className="scorer-finish">
          <input type="checkbox" checked={finish} onChange={(event) => setFinish(event.target.checked)} />
          <span>This round ended the fight (KO, TKO or submission)</span>
        </label>
      </section>

      {error && <p className="scorer-error"><FaExclamationTriangle /> {error}</p>}

      <footer className="scorer-actions">
        <button type="button" className="scorer-submit" onClick={submitRound} disabled={saving}>
          {saving ? 'Sending…' : `Submit round ${round}`}
        </button>
        {savedAt && <span className="scorer-saved"><FaCheck /> Live as of {savedAt.toLocaleTimeString()}</span>}
      </footer>
    </div>
  );
};

export default ScorerDesk;
