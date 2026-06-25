import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { toast } from 'react-toastify';
import {
  FaChartLine,
  FaCheckCircle,
  FaCoins,
  FaDatabase,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaHistory,
  FaPlay,
  FaShieldAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import {
  formatTokenAmount,
  formatWrestlingDate,
  safeWrestlingArray,
  wrestlingRequest,
} from '@/Utils/proWrestling';

const EMPTY_ADJUSTMENT = {
  userId: '',
  matchId: '',
  amount: 1,
  direction: 'CREDIT',
  reason: '',
};

const WrestlingAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [audits, setAudits] = useState([]);
  const [systemCheck, setSystemCheck] = useState(null);
  const [migration, setMigration] = useState(null);
  const [adjustment, setAdjustment] = useState(EMPTY_ADJUSTMENT);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsPayload, ledgerPayload, auditPayload, systemPayload] = await Promise.all([
        wrestlingRequest('/api/admin/wrestling/analytics', { admin: true }),
        wrestlingRequest('/api/admin/wrestling/wallet-ledger?limit=50', { admin: true }),
        wrestlingRequest('/api/admin/wrestling/audit-logs?limit=50', { admin: true }),
        wrestlingRequest('/api/admin/wrestling/system-check', { admin: true }),
      ]);
      setAnalytics(analyticsPayload);
      setLedger(safeWrestlingArray(ledgerPayload?.data));
      setAudits(safeWrestlingArray(auditPayload?.data));
      setSystemCheck(systemPayload);
    } catch (requestError) {
      setError(requestError.message || 'The wrestling analytics workspace could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const previewMigration = async () => {
    setWorking('migration-preview');
    try {
      const payload = await wrestlingRequest('/api/admin/wrestling/migrate-existing-matches', {
        admin: true,
        method: 'POST',
        body: { apply: false },
      });
      setMigration(payload);
      toast.success('Legacy game-mode migration preview generated. No records were changed.');
    } catch (requestError) {
      toast.error(requestError.message || 'The migration preview could not be generated.');
    } finally {
      setWorking('');
    }
  };

  const applyMigration = async () => {
    if (!migration || migration.records <= 0) return;
    const confirmation = window.prompt(`Type APPLY ${migration.records} to add game-mode metadata to the previewed legacy records.`);
    if (confirmation !== `APPLY ${migration.records}`) {
      toast.info('Migration cancelled. No legacy records were changed.');
      return;
    }
    setWorking('migration-apply');
    try {
      const payload = await wrestlingRequest('/api/admin/wrestling/migrate-existing-matches', {
        admin: true,
        method: 'POST',
        body: { apply: true },
      });
      setMigration(payload);
      toast.success(`${payload.modifiedCount || 0} legacy matches updated with game-mode metadata.`);
      await load();
    } catch (requestError) {
      toast.error(requestError.message || 'The legacy migration could not be applied.');
    } finally {
      setWorking('');
    }
  };

  const submitAdjustment = async (event) => {
    event.preventDefault();
    if (!adjustment.userId.trim() || !adjustment.matchId.trim() || !adjustment.reason.trim()) {
      toast.error('User ID, wrestling match ID, and an audit reason are required.');
      return;
    }
    setWorking('wallet-adjustment');
    try {
      await wrestlingRequest('/api/admin/wrestling/wallet-adjustment', {
        admin: true,
        method: 'POST',
        headers: { 'Idempotency-Key': `wrestling-admin-ui:${adjustment.matchId}:${adjustment.userId}:${Date.now()}` },
        body: {
          ...adjustment,
          amount: Math.max(1, Math.round(Number(adjustment.amount) || 1)),
        },
      });
      toast.success('Wrestling wallet adjustment completed and audited.');
      setAdjustment(EMPTY_ADJUSTMENT);
      await load();
    } catch (requestError) {
      toast.error(requestError.message || 'The wallet adjustment could not be completed.');
    } finally {
      setWorking('');
    }
  };

  const platformStatus = useMemo(() => {
    if (!systemCheck) return 'Unknown';
    return systemCheck.enabled && Number(systemCheck.databaseState) === 1 ? 'Operational' : 'Attention required';
  }, [systemCheck]);

  return (
    <>
      <Head><title>Wrestling Analytics | FMM Administration</title></Head>
      <div className="pw-admin-page pw-admin-analytics-page">
        <div className="pw-admin-form-heading">
          <p>Game-mode intelligence</p>
          <h1>Pro Wrestling analytics</h1>
          <span>Monitor contests, entries, scores, wallet movement, backend readiness, migrations, and administrator audit activity.</span>
        </div>
        {error && <div className="pw-admin-error">{error}</div>}

        {loading ? <div className="pw-admin-loading">Loading wrestling analytics…</div> : (
          <>
            <section className="pw-admin-metrics is-analytics">
              <article><FaUsers /><span><small>Total entries</small><strong>{analytics?.totalEntries || 0}</strong></span></article>
              <article><FaUsers /><span><small>Unique players</small><strong>{analytics?.uniquePlayers || 0}</strong></span></article>
              <article><FaCoins /><span><small>Gross pot</small><strong>{formatTokenAmount(analytics?.pots?.grossPot)}</strong></span></article>
              <article><FaTrophy /><span><small>Scored predictions</small><strong>{analytics?.predictions?.scoredPredictions || 0}</strong></span></article>
              <article><FaChartLine /><span><small>Average score</small><strong>{Math.round(analytics?.predictions?.averageScore || 0)}</strong></span></article>
            </section>

            <section className="pw-admin-system-grid">
              <article className={platformStatus === 'Operational' ? 'is-healthy' : 'is-warning'}>
                {platformStatus === 'Operational' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                <span><small>Backend status</small><strong>{platformStatus}</strong><p>Feature flag {systemCheck?.enabled ? 'enabled' : 'disabled'} · MongoDB state {systemCheck?.databaseState ?? '—'}</p></span>
              </article>
              <article><FaTrophy /><span><small>Active scoring rules</small><strong>{systemCheck?.activeScoringRules ?? 0}</strong><p>Versioned configurations available to new cards.</p></span></article>
              <article><FaCoins /><span><small>Active payout rules</small><strong>{systemCheck?.activePayoutRules ?? 0}</strong><p>Settlement configurations available to new cards.</p></span></article>
              <article><FaDatabase /><span><small>Transaction mode</small><strong>{systemCheck?.transactionFallbackEnabled ? 'Fallback allowed' : 'Replica-set required'}</strong><p>Production should use MongoDB transactions.</p></span></article>
            </section>

            <section className="pw-admin-analytics-grid">
              <article className="pw-admin-panel">
                <header><div><p>Contest lifecycle</p><h2>Matches by status</h2></div></header>
                <div className="pw-status-distribution">
                  {Object.entries(analytics?.matchesByStatus || {}).length
                    ? Object.entries(analytics.matchesByStatus).map(([status, count]) => <span key={status}><b>{status.replaceAll('_', ' ')}</b><strong>{count}</strong></span>)
                    : <p>No wrestling matches have been created.</p>}
                </div>
              </article>
              <article className="pw-admin-panel">
                <header><div><p>Wallet movement</p><h2>Transactions by type</h2></div></header>
                <div className="pw-status-distribution">
                  {Object.entries(analytics?.wallet || {}).length
                    ? Object.entries(analytics.wallet).map(([type, data]) => <span key={type}><b>{type.replaceAll('_', ' ')}</b><strong>{data.transactions} · {formatTokenAmount(data.amount)}</strong></span>)
                    : <p>No wrestling wallet transactions have completed.</p>}
                </div>
              </article>
            </section>

            <section className="pw-admin-ops-grid">
              <article className="pw-admin-panel pw-admin-migration-card">
                <header><div><p>Backward compatibility</p><h2>Legacy game-mode migration</h2><span>Preview the additive metadata migration before changing any existing match record.</span></div><FaDatabase /></header>
                <div className="pw-admin-migration-actions">
                  <button type="button" className="pw-admin-secondary" disabled={Boolean(working)} onClick={previewMigration}><FaPlay /> {working === 'migration-preview' ? 'Previewing…' : 'Preview migration'}</button>
                  <button type="button" className="pw-admin-primary" disabled={!migration?.dryRun || !migration?.records || Boolean(working)} onClick={applyMigration}><FaShieldAlt /> {working === 'migration-apply' ? 'Applying…' : 'Apply reviewed migration'}</button>
                </div>
                {migration && <div className="pw-admin-migration-result"><span><small>Dry run</small><strong>{migration.dryRun ? 'Yes' : 'No'}</strong></span><span><small>Records found</small><strong>{migration.records || 0}</strong></span><span><small>Modified</small><strong>{migration.modifiedCount || 0}</strong></span><div>{Object.entries(migration.inferredGameModes || {}).map(([mode, count]) => <em key={mode}>{mode}: {count}</em>)}</div></div>}
              </article>

              <form className="pw-admin-panel pw-admin-wallet-adjustment" onSubmit={submitAdjustment}>
                <header><div><p>Audited exception control</p><h2>Manual wallet adjustment</h2><span>Credit or debit a player only when an operational correction is required.</span></div><FaExchangeAlt /></header>
                <label><span>User ID</span><input value={adjustment.userId} onChange={(event) => setAdjustment((current) => ({ ...current, userId: event.target.value }))} /></label>
                <label><span>Wrestling match ID</span><input value={adjustment.matchId} onChange={(event) => setAdjustment((current) => ({ ...current, matchId: event.target.value }))} /></label>
                <div><label><span>Direction</span><select value={adjustment.direction} onChange={(event) => setAdjustment((current) => ({ ...current, direction: event.target.value }))}><option value="CREDIT">Credit</option><option value="DEBIT">Debit</option></select></label><label><span>Amount</span><input type="number" min="1" value={adjustment.amount} onChange={(event) => setAdjustment((current) => ({ ...current, amount: event.target.value }))} /></label></div>
                <label><span>Required audit reason</span><textarea rows="3" value={adjustment.reason} onChange={(event) => setAdjustment((current) => ({ ...current, reason: event.target.value }))} /></label>
                <button type="submit" className="pw-admin-primary" disabled={working === 'wallet-adjustment'}><FaCoins /> {working === 'wallet-adjustment' ? 'Processing…' : 'Submit wallet adjustment'}</button>
              </form>
            </section>

            <section className="pw-admin-panel">
              <header><div><p>Latest wallet activity</p><h2>Wrestling ledger</h2></div><FaCoins /></header>
              <div className="pw-admin-table-wrap"><table className="pw-admin-table"><thead><tr><th>Type</th><th>Account</th><th>Player / affiliate</th><th>Match</th><th>Amount</th><th>Balance</th><th>Date</th></tr></thead><tbody>{ledger.length ? ledger.map((item) => <tr key={item._id}><td>{item.type?.replaceAll('_', ' ')}</td><td>{item.accountType}</td><td>{item.userId || item.affiliateId || '—'}</td><td>{item.matchId || '—'}</td><td className={Number(item.amount) >= 0 ? 'is-credit' : 'is-debit'}>{Number(item.amount) >= 0 ? '+' : ''}{item.amount}</td><td>{item.balanceAfter ?? '—'}</td><td>{formatWrestlingDate(item.createdAt)}</td></tr>) : <tr><td colSpan="7">No wrestling wallet activity.</td></tr>}</tbody></table></div>
            </section>

            <section className="pw-admin-panel">
              <header><div><p>Administrative trace</p><h2>Audit log</h2></div><FaShieldAlt /></header>
              <div className="pw-admin-table-wrap"><table className="pw-admin-table"><thead><tr><th>Action</th><th>Entity</th><th>Identifier</th><th>Reason</th><th>Date</th></tr></thead><tbody>{audits.length ? audits.map((item) => <tr key={item._id}><td>{item.action?.replaceAll('_', ' ')}</td><td>{item.entityType}</td><td>{item.entityId}</td><td>{item.reason || '—'}</td><td>{formatWrestlingDate(item.createdAt)}</td></tr>) : <tr><td colSpan="5">No wrestling audit activity.</td></tr>}</tbody></table></div>
            </section>
          </>
        )}
      </div>
    </>
  );
};

export default WrestlingAdminAnalytics;
