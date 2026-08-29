import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { FaExclamationTriangle, FaLock } from 'react-icons/fa';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fantasymmadness-game-server-three.vercel.app';

// Regular staff sign in here instead of using a one-time link. The account only
// ever sees fights that have been explicitly assigned to it, and each fight
// hands back its own fight-scoped session.
const ScorerLogin = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fights, setFights] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/scorer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Could not sign in.');
      setFights(payload.fights || []);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  };

  const openFight = (fight) => {
    window.sessionStorage.setItem('fmmScorerToken', fight.token);
    router.push(`/score/${fight.assignmentId}`);
  };

  return (
    <div className="scorer-shell scorer-login">
      <p className="scorer-eyebrow"><FaLock /> Staff scoring</p>
      <h1>Sign in to score</h1>

      {fights.length ? (
        <>
          <p className="scorer-sub">Pick the fight you are scoring tonight.</p>
          <ul className="scorer-fight-list">
            {fights.map((fight) => (
              <li key={fight.assignmentId}>
                <button type="button" onClick={() => openFight(fight)}>
                  <strong>{fight.fightLabel || 'Fight'}</strong>
                  <span>Open scorecard</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <form onSubmit={signIn}>
          <label htmlFor="scorer-email">Email</label>
          <input
            id="scorer-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
          <label htmlFor="scorer-password">Password</label>
          <input
            id="scorer-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit" className="scorer-submit" disabled={busy}>
            {busy ? 'Checking…' : 'Sign in'}
          </button>
          {error && <p className="scorer-error"><FaExclamationTriangle /> {error}</p>}
        </form>
      )}
    </div>
  );
};

export default ScorerLogin;
