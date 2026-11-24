import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link, { useAffiliateCommandAccount, affiliateCommandRead } from '@/Components/Affiliates/AffiliateCommandContext';
import { FaArrowRight, FaBolt, FaCheckCircle, FaClock, FaExclamationTriangle, FaHistory, FaTimesCircle, FaUsers } from 'react-icons/fa';
import { FMCoin as FaCoins } from '@/Components/Common/FMCoin';
import AffiliateExperienceNav from './AffiliateExperienceNav';
import { affiliateHeaders } from '@/Utils/authFetch';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';

const API_BASE = PUBLIC_API_BASE_URL;

const coins = (value) => Number(value || 0).toLocaleString();

const PAYOUT_ICON = {
  paid: FaCheckCircle,
  pending: FaClock,
  rejected: FaTimesCircle,
};

const AffiliateMoney = () => {
  const { ownerAccount } = useAffiliateCommandAccount();
  const [data, setData] = useState(null);
  const [referrals, setReferrals] = useState(null);
  const [referralError, setReferralError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [notice, setNotice] = useState('');
  const [amount, setAmount] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const moneyRequest = affiliateCommandRead('/api/affiliates/me/money', ownerAccount);
      const response = await fetch(`${API_BASE}${moneyRequest.path}`, { headers: moneyRequest.headers });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Could not load your earnings.');
      setData(payload);
      try {
        const referralRequest = affiliateCommandRead('/api/affiliates/me/fight-referrals', ownerAccount);
        const referralResponse = await fetch(`${API_BASE}${referralRequest.path}`, { headers: referralRequest.headers });
        const referralPayload = await referralResponse.json().catch(() => ({}));
        if (!referralResponse.ok) throw new Error(referralPayload.message || 'Referral counts are unavailable.');
        setReferrals(referralPayload); setReferralError('');
      } catch (referralFailure) { setReferrals(null); setReferralError(referralFailure.message); }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [ownerAccount]);

  useEffect(() => { load(); }, [load]);

  const summary = data?.summary || {};
  const balance = data?.summary?.balance ?? ownerAccount?.tokens;
  const earnings = data?.earnings || [];
  const stakes = data?.stakes || [];
  const payouts = data?.payouts || [];

  // The backend debits a payout as soon as it is requested and permits only one
  // pending request. Do not subtract the pending amount twice or offer a second
  // request that the server will correctly reject.
  const requestable = Number(summary.pendingPayouts || 0) > 0
    ? 0
    : Math.max(0, Number(summary.balance || 0));

  const requestPayout = async (event) => {
    event.preventDefault();
    if (ownerAccount) return;
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
          <h1>Earnings &amp; payouts</h1>
          <p className="affiliate-money-lede">Track campaign earnings, manage your payment method, and review payouts.</p>
        </div>
      </section>

      <main className="xp-page-main">
        <div className="theme-container">
          {error && (
            <div className="affiliate-money-notice is-error" role="status">
              <div><FaExclamationTriangle aria-hidden="true" /> <span>{error}</span></div>
              <button className="theme-btn theme-btn-secondary" type="button" disabled={loading} onClick={load}>Try again</button>
            </div>
          )}

          <section className="affiliate-money-summary">
            <article className="is-primary">
              <span>Balance</span>
              <strong>{balance == null ? '—' : coins(balance)}{balance != null && <em>FM COINS</em>}</strong>
              <small>{data ? `${coins(summary.pendingPayouts)} FM COINS pending` : 'Pending payouts unavailable'}</small>
            </article>
            <article>
              <span>Lifetime earned</span>
              <strong>{data ? coins(summary.lifetimeEarned) : '—'}{data && <em>FM COINS</em>}</strong>
              <small>{data ? `Across ${summary.fightsSettled || 0} settled fights` : 'Settlement totals unavailable'}</small>
            </article>
            <article>
              <span>Paid out</span>
              <strong>{data ? coins(summary.paidOut) : '—'}{data && <em>FM COINS</em>}</strong>
              <small>{data ? `${payouts.filter((p) => p.status === 'paid').length} completed payouts` : 'Payout totals unavailable'}</small>
            </article>
            <article>
              <span>Your split</span>
              <strong>{data ? `${summary.splitPct || 50}%` : '—'}</strong>
              <small>Share of eligible owner-fight referral proceeds.</small>
            </article>
          </section>

          <section className="xp-page-section affiliate-money-payout" aria-labelledby="affiliate-payout-title">
            <div>
              <h2 id="affiliate-payout-title">Request a payout</h2>
              <p>
                {ownerAccount
                  ? 'The affiliate can request a payout from their own account.'
                  : 'Choose an amount and make sure your payment method is up to date.'}
              </p>
              <Link href="/AffiliateAccountSettings" className="theme-btn theme-btn-secondary">
                {ownerAccount ? 'View payment settings' : 'Manage payment settings'}
              </Link>
            </div>
            {ownerAccount ? (
              <div className="affiliate-money-payout-state"><strong>Owner view</strong><span>Payout requests are read-only here.</span></div>
            ) : (
              <form onSubmit={requestPayout}>
                <label htmlFor="affiliate-payout-amount">Payout amount <small>FM COINS</small></label>
                <input
                  id="affiliate-payout-amount"
                  type="number"
                  min="1"
                  max={requestable || 1}
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  disabled={loading || !data || requestable <= 0 || requesting}
                />
                <p className="affiliate-money-inline-note">
                  {loading ? 'Checking available balance…'
                    : !data ? 'Payout availability could not be verified.'
                    : requestable > 0 ? `${coins(requestable)} FM COINS available. Requests are deducted from your balance.`
                    : summary.pendingPayouts > 0 ? 'A payout request is already pending.'
                    : 'No balance is available to request.'}
                </p>
                <button type="submit" className="theme-btn theme-btn-primary" disabled={loading || !data || requestable <= 0 || requesting}>
                  {requesting ? 'Requesting…' : 'Request payout'} <FaArrowRight aria-hidden="true" />
                </button>
                {notice && <p className="affiliate-money-inline-note" role="status">{notice}</p>}
              </form>
            )}
          </section>

          <section className="xp-page-section">
            <p className="xp-eyebrow">Owner fight referrals</p>
            <h2>Fight referrals</h2>
            {!loading && !referrals && !referralError && <p>{data ? 'No referrals recorded yet.' : 'Referral activity is unavailable.'}</p>}
            {referralError && <p role="alert">{referralError}</p>}
            {referrals && <><p>{coins(referrals.signups)} signups · {coins(referrals.verifiedSignups)} verified · {coins(referrals.participatingPlayers)} participating players · {coins(referrals.paidEntries)} paid entries</p>
              <p><strong>{coins(referrals.earnedCoins)} FM COINS credited</strong> from settled owner fights. Open-fight amounts below are estimates; voided or refunded entries earn nothing.</p>
              {(referrals.fights || []).map((fight) => <p key={fight.fightId}><strong>{fight.label}</strong> · {coins(fight.paidEntries)} paid entries · {fight.settled ? `${coins(fight.earnedCoins)} FM COINS credited` : fight.voided ? 'Voided — no commission' : `${coins(fight.estimatedCoins)} FM COINS estimated if settled`}</p>)}</>}
          </section>

          <section className="xp-page-section">
            <h2>Earnings by fight</h2>
            <p className="affiliate-money-section-note">
              Amounts are shown in FM COINS after the fight settles.
            </p>

            {loading ? (
              <div className="xp-loading-grid"><div className="xp-loading-card" /><div className="xp-loading-card" /></div>
            ) : earnings.length ? (
              <div className="affiliate-money-table-wrap">
                <table className="affiliate-money-table">
                  <thead>
                    <tr>
                      <th>Fight</th>
                      <th>Source</th>
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
                        <td>{row.source || 'Promoted card'}</td>
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
                <strong>{data ? 'No settled fights yet' : 'Earnings details unavailable'}</strong>
                {data && <span>Settled campaign earnings will appear here.</span>}
                <Link href="/AffiliateDashboard#available-fights" className="theme-btn theme-btn-secondary">Browse upcoming fights</Link>
              </div>
            )}

            {biggestNight && (
              <p className="affiliate-money-highlight">
                <FaBolt /> Best night so far: <strong>{biggestNight.fightLabel}</strong> — {coins(biggestNight.total)} from {coins(biggestNight.entrants)} entrants.
              </p>
            )}
          </section>

          <section className="xp-page-section">
            <h2>Existing prize stakes</h2>
            <p className="affiliate-money-section-note">
              Track entries and prize funding for campaigns with an existing stake.
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
                <strong>{data ? 'No existing prize stakes' : 'Prize stake history unavailable'}</strong>
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
                <strong>{data ? 'No payouts requested yet' : 'Payout history unavailable'}</strong>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AffiliateMoney;
