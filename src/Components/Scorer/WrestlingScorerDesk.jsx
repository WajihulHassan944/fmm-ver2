import React, { useEffect, useState } from 'react';
import { WRESTLING_STATS, normalizeWrestlingStats, wrestlingRequest } from '@/Utils/proWrestling';

export default function WrestlingScorerDesk({ fight, token, onSaved }) {
  const [a, setA] = useState({});
  const [b, setB] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setA(normalizeWrestlingStats(fight.officialStats?.competitorA)); setB(normalizeWrestlingStats(fight.officialStats?.competitorB)); }, [fight]);
  const closed = !['OPEN','LOCKED','LIVE','SCORING'].includes(fight.status);
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const payload = await wrestlingRequest('/api/scorer/wrestling/live-stats', { method: 'PUT', token, body: { competitorA: a, competitorB: b } });
      onSaved(payload.fight); setMessage('Live totals saved.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <main className="scorer-shell">
    <h1>{fight.fighterA} vs {fight.fighterB}</h1>
    <p>Pro Wrestling · Full-match totals · {fight.assignment?.scorerName}</p>
    <p>Update live action totals. The administrator confirms the official result and finalizes payouts.</p>
    <form onSubmit={save}>
      <div className="scorer-grid">{[[fight.fighterA,a,setA],[fight.fighterB,b,setB]].map(([name,values,setValues],side) => <section className="scorer-corner" key={side}><h2>{name}</h2>{WRESTLING_STATS.map((stat) => <label key={stat.key} style={{ display: 'block', margin: 12 }}>{stat.label}<input type="number" min="0" step="1" required disabled={closed || busy} value={values[stat.key] ?? 0} onChange={(event) => setValues((current) => ({ ...current, [stat.key]: Math.max(0, Math.round(Number(event.target.value) || 0)) }))} /></label>)}</section>)}</div>
      <button type="submit" className="scorer-submit" disabled={closed || busy}>{busy ? 'Saving…' : closed ? 'Match closed' : 'Save live totals'}</button>
      {message && <p role="status">{message}</p>}
    </form>
  </main>;
}
