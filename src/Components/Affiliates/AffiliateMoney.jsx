import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FaArrowRight, FaBolt, FaCheckCircle, FaClock, FaCoins, FaExclamationTriangle,
  FaHistory, FaTimesCircle, FaUsers,
} from 'react-icons/fa';
import AffiliateExperienceNav from './AffiliateExperienceNav';
import { affiliateHeaders } from '@/Utils/authFetch';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fantasymmadness-game-server-three.vercel.app';

const coins = (value) => Number(value || 0).toLocaleString();

const PAYOUT_ICON = {
  paid: FaCheckCircle,
  pending: FaClock,
  rejected: FaTimesCircle,
};

const AffiliateMoney = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [notice, setNotice] = useState('');
  const [amount, setAmount] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/affiliates/me/money`, { headers: affiliateHeaders() });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Could not load your earnings.');
      setData(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = data?.summary || {};
  const earnings = data?.earnings || [];
  const stakes = data?.stakes || [];
  const payouts = data?.payouts || [];

  // Only the balance that is actually clear can be requested — anything already
  // sitting in a pending request is spoken for.
  const requestable = Math.max(0, Number(summary.balance || 0) - Number(summary.pendingPayouts || 0));

  const requestPayout = async (event) => {
    event.preventDefault();
    const value = Math.floor(Number(amount) || 0);
    if (value <= 0) { setNotice('Enter how much you want paid out.'); return; }
    if (value > requestable) { setNotice(`You can request up to ${coins(requestable)} right now.`); return; }
    setRequesting(true);
    setNotice('');
    try {
      const response = await fetch(`${API_BASE}/affiliate/me/payout`, {
        method: 'POST',
        headers: affiliateHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ amount: value }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Payout request failed.');
      setNotice('Payout requested. You will see it move to paid once it is actioned.');
      setAmount('');
      load();
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setRequesting(false);
    }
  };

  const biggestNight = useMemo(() => {
    if (!earnings.length) return null;
    return earnings.reduce((best, row) => (row.total > (best?.total || 0) ? row : best), null);
  }, [earnings]);

  return (
    <div className="experience-page affiliate-money-page">
      <AffiliateExperienceNav />

      <section className="xp-affiliate-hero affiliate-money-hero">
        <div className="xp-affiliate-hero-grid" aria-hidden="true" />
        <div className="theme-container">
          <p className="xp-eyebrow"><FaCoins /> Promoter earnings</p>
          <h1>What your cards <span>actually paid.</span></h1>
          <p className="affiliate-money-lede">
            Every number here is read back out of the settlement ledger — not recalculated — so it
            matches what was paid to the coin.
          </p>
        </div>
      </section>

      <main className="xp-page-main">
        <div className="theme-container">
          {error && (
            <div className="affiliate-money-notice is-error">
              <FaExclamationTriangle /> {error}
              <button type="button" onClick={load}>Try again</button>
            </div>
          )}

          <section className="affiliate-money-summary">
            <article className="is-primary">
              <span>Balance</span>
              <strong>{loading ? '—' : coins(summary.balance)}</strong>
              <small>{coins(summary.pendingPayouts)} in pending payouts</small>
            </article>
            <article>
              <span>Lifetime earned</span>
              <strong>{loading ? '—' : coins(summary.lifetimeEarned)}</strong>
              <small>Across {summary.fightsSettled || 0} settled cards</small>
            </article>
            <article>
              <span>Paid out</span>
              <strong>{loading ? '—' : coins(summary.paidOut)}</strong>
              <small>{payouts.filter((p) => p.status === 'paid').length} completed payouts</small>
            </article>
            <article>
              <span>Your split</span>
              <strong>{loading ? '—' : `${summary.splitPct || 50}%`}</strong>
              <small>{coins(summary.totalEntrants)} entrants brought in</small>
            </article>
          </section>

          <section className="xp-page-section affiliate-money-payout">
            <div>
              <p className="xp-eyebrow">Cash out</p>
              <h2>Request a payout</h2>
              <p>
                Requests come off your balance immediately so the same coins cannot be requested
                twice. {requestable > 0
                  ? `You have ${coins(requestable)} clear right now.`
                  : 'Nothing is clear to request at the moment.'}
              </p>
            </div>
            <form onSubmit={requestPayout}>
              <label htmlFor="affiliate-payout-amount">Amount</label>
              <input
                id="affiliate-payout-amount"
                type="number"
                min="1"
                max={requestable || 1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder={String(requestable || 0)}
                disabled={requestable <= 0 || requesting}
              />
              <button type="submit" className="theme-btn theme-btn-primary" disabled={requestable <= 0 || requesting}>
                {requesting ? 'Requesting…' : 'Request payout'} <FaArrowRight />
              </button>
              {notice && <p className="affiliate-money-inline-note">{notice}</p>}
            </form>
          </section>

          <section className="xp-page-section">
            <p className="xp-eyebrow">Per fight</p>
            <h2>Earnings breakdown</h2>
            <p className="affiliate-money-section-note">
              Your {summary.splitPct || 50}% splits in two: a fixed cut of the pot you promised, plus
              half of everything the card took above it. The second number is the one that grows
              when you fill the room.
            </p>

            {loading ? (
              <div className="xp-loading-grid"><div className="xp-loading-card" /><div className="xp-loading-card" /></div>
            ) : earnings.length ? (
              <div className="affiliate-money-table-wrap">
                <table className="affiliate-money-table">
                  <thead>
                    <tr>
                      <th>Fight</th>
                      <th>Entrants</th>
                      <th>Card revenue</th>
                      <th>Fixed cut</th>
                      <th>Surplus share</th>
                      <th>You earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((row) => (
                      <tr key={`${row.fightId}-${row.settledAt}`}>
                        <td>
                          <strong>{row.fightLabel || 'Fight'}</strong>
                          <small>{row.settledAt ? new Date(row.settledAt).toLocaleDateString() : ''}</small>
                        </td>
                        <td>{coins(row.entrants)}</td>
                        <td>{coins(row.revenue)}</td>
                        <td>{coins(row.fixedCut)}</td>
                        <td>{coins(row.surplusShare)}</td>
                        <td className="is-total">{coins(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="affiliate-money-empty">
                <FaCoins />
                <strong>No settled cards yet.</strong>
                <span>Earnings land here the moment a card you promoted is settled.</span>
                <Link href="/AffiliateDashboard" className="theme-btn theme-btn-secondary">Promote a fight</Link>
              </div>
            )}

            {biggestNight && (
              <p className="affiliate-money-highlight">
                <FaBolt /> Best night so far: <strong>{biggestNight.fightLabel}</strong> — {coins(biggestNight.total)} from {coins(biggestNight.entrants)} entrants.
              </p>
            )}
          </section>

          <section className="xp-page-section">
            <p className="xp-eyebrow">Money at risk</p>
            <h2>Your stakes and profit zones</h2>
            <p className="affiliate-money-section-note">
              On a staked card you cover the pot up front. Until the gauge fills you are underwater;
              past it, every coin is split with the platform and half is yours.
            </p>

            {loading ? (
              <div className="xp-loading-grid"><div className="xp-loading-card" /></div>
            ) : stakes.length ? (
              <div className="affiliate-stake-grid">
                {stakes.map((stake) => (
                  <article key={stake.fightId} className={stake.inProfitZone ? 'is-profit' : ''}>
                    <header>
                      <strong>{stake.fightLabel || 'Staked card'}</strong>
                      <span>{stake.inProfitZone ? 'In profit' : 'Filling'}</span>
                    </header>
                    <div className="affiliate-stake-gauge" role="img" aria-label={`${stake.fillPct}% of pot filled`}>
                      <i style={{ width: `${Math.min(100, stake.fillPct)}%` }} />
                    </div>
                    <dl>
                      <div><dt>You staked</dt><dd>{coins(stake.staked)}</dd></div>
                      <div><dt>Pot filled</dt><dd>{coins(stake.potFilled)} / {coins(stake.potTarget)}</dd></div>
                      <div><dt>Entrants</dt><dd><FaUsers /> {coins(stake.entrants)}</dd></div>
                      <div><dt>Your share so far</dt><dd className="is-total">{coins(stake.yourProjectedShare)}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <div className="affiliate-money-empty">
                <FaBolt />
                <strong>Nothing staked right now.</strong>
                <span>Stake a shadow card and its fill gauge appears here.</span>
              </div>
            )}
          </section>

          <section className="xp-page-section">
            <p className="xp-eyebrow"><FaHistory /> Record</p>
            <h2>Payout history</h2>
            {loading ? (
              <div className="xp-loading-grid"><div className="xp-loading-card" /></div>
            ) : payouts.length ? (
              <ul className="affiliate-payout-list">
                {payouts.map((payout) => {
                  const Icon = PAYOUT_ICON[payout.status] || FaClock;
                  return (
                    <li key={`${payout.index}-${payout.requestedAt}`} className={`is-${payout.status}`}>
                      <Icon aria-hidden="true" />
                      <div>
                        <strong>{coins(payout.amount)}</strong>
                        <small>
                          Requested {payout.requestedAt ? new Date(payout.requestedAt).toLocaleDateString() : '—'}
                          {payout.resolvedAt ? ` · resolved ${new Date(payout.resolvedAt).toLocaleDateString()}` : ''}
                        </small>
                        {payout.reason && <em>{payout.reason}</em>}
                      </div>
                      <span>{payout.status}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="affiliate-money-empty">
                <FaHistory />
                <strong>No payouts requested yet.</strong>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AffiliateMoney;
