import React, { useCallback, useEffect, useState } from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { adminHeaders, adminJsonHeaders } from '@/Utils/authFetch';
import { FMCoinAmount } from '@/Components/Common/FMCoin';

// Player Recovery: players who could not verify their email while the link was broken.
// Reading this page never changes a player account. Sending requires typing the
// confirmation phrase; the FM COINS bonus is a preview only.
const API = `${PUBLIC_API_BASE_URL}/api/admin/player-recovery`;

const get = async (path, base = API) => {
  const response = await fetch(`${base}${path}`, { headers: adminHeaders(), cache: 'no-store' });
  if (response.status === 401 || response.status === 403) throw new Error('Your administrator session has expired. Please sign in again.');
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'This information could not be loaded.');
  return body;
};

const box = { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: 16, margin: '0 0 16px' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 };
const Stat = ({ label, value, note }) => (
  <div style={{ ...box, margin: 0 }}>
    <small style={{ display: 'block', opacity: 0.75, fontWeight: 700 }}>{label}</small>
    <strong style={{ display: 'block', fontSize: 26, marginTop: 4 }}>{value === null || value === undefined ? '—' : Number(value).toLocaleString()}</strong>
    {note ? <small style={{ opacity: 0.7 }}>{note}</small> : null}
  </div>
);

const PlayerRecovery = () => {
  const [summary, setSummary] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [bonus, setBonus] = useState(null);
  const [failures, setFailures] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sendLog, setSendLog] = useState('');
  const [reportDate, setReportDate] = useState('2026-10-24');
  const [reportTo, setReportTo] = useState('2026-10-24');
  const [reportScope, setReportScope] = useState('day');
  const reportQuery = (scope, from, to) => (scope === 'all-pending' ? 'scope=all-pending' : `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to || from)}`);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState('');
  const todayET = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const [attemptFrom, setAttemptFrom] = useState(todayET());
  const [attemptTo, setAttemptTo] = useState(todayET());
  const [attempts, setAttempts] = useState(null);
  const [attemptError, setAttemptError] = useState('');
  const loadAttempts = useCallback(async (from, to) => {
    setAttemptError('');
    try { setAttempts(await get(`/registration-attempts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, `${PUBLIC_API_BASE_URL}/api/admin`)); }
    catch (attemptLoadError) { setAttempts(null); setAttemptError(attemptLoadError.message); }
  }, []);
  useEffect(() => { const t = todayET(); loadAttempts(t, t); }, [loadAttempts]);
  const downloadAttemptsCsv = async () => {
    setBusy('attempts-csv');
    try {
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/admin/registration-attempts?from=${encodeURIComponent(attemptFrom)}&to=${encodeURIComponent(attemptTo)}&format=csv`, { headers: adminHeaders(), cache: 'no-store' });
      if (!response.ok) throw new Error('The CSV file could not be created.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url; link.download = `fmm-registration-attempts-${attemptFrom}${attemptTo !== attemptFrom ? `_to_${attemptTo}` : ''}-eastern.csv`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (csvError) { setAttemptError(csvError.message); }
    setBusy('');
  };

  const loadReport = useCallback(async (from, to, scope = 'day') => {
    setReportError('');
    setReportScope(scope);
    try { setReport(await get(`/registrations?${reportQuery(scope, from, to)}`)); }
    catch (reportLoadError) { setReport(null); setReportError(reportLoadError.message); }
  }, []);
  useEffect(() => { loadReport('2026-10-24', '2026-10-24'); }, [loadReport]);

  const downloadCsv = async () => {
    setBusy('csv');
    try {
      const response = await fetch(`${API}/registrations?${reportQuery(reportScope, reportDate, reportTo)}&format=csv`, { headers: adminHeaders(), cache: 'no-store' });
      if (!response.ok) throw new Error('The CSV file could not be created.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url; link.download = `fmm-registrations-${report?.date || reportDate}-eastern.csv`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (csvError) { setReportError(csvError.message); }
    setBusy('');
  };

  const load = useCallback(async () => {
    setError('');
    try {
      const [s, c, b, f] = await Promise.all([get('/summary'), get('/campaign'), get('/goodwill-preview?amount=2500'), get('/messages?status=failed')]);
      setSummary(s); setCampaign(c); setBonus(b); setFailures(f.rows || []);
    } catch (loadError) { setError(loadError.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const [coinLoss, setCoinLoss] = useState(null);
  const [coinLossError, setCoinLossError] = useState('');
  const loadCoinLoss = useCallback(async () => {
    setCoinLossError('');
    try { setCoinLoss(await get('/plan-coin-losses')); }
    catch (coinLossLoadError) { setCoinLoss(null); setCoinLossError(coinLossLoadError.message); }
  }, []);
  useEffect(() => { loadCoinLoss(); }, [loadCoinLoss]);
  const downloadCoinLossCsv = async () => {
    setBusy('coinloss-csv');
    try {
      const response = await fetch(`${API}/plan-coin-losses?format=csv`, { headers: adminHeaders(), cache: 'no-store' });
      if (!response.ok) throw new Error('The CSV file could not be created.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url; link.download = `fmm-plan-coin-losses-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (csvError) { setCoinLossError(csvError.message); }
    setBusy('');
  };

  const download = async (part) => {
    setBusy(`backup-${part}`);
    try {
      const response = await fetch(`${API}/backup?part=${part}`, { headers: adminHeaders(), cache: 'no-store' });
      if (!response.ok) throw new Error('The backup file could not be created.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fmm-players-backup-${new Date().toISOString().slice(0, 10)}-part${part}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (downloadError) { setError(downloadError.message); }
    setBusy('');
  };

  const sendBatch = async () => {
    if (!campaign) return;
    setBusy('send'); setError('');
    try {
      const response = await fetch(`${API}/campaign/send`, {
        method: 'POST', headers: adminJsonHeaders(),
        body: JSON.stringify({ confirm, expectedRecipients: campaign.recipients, batchSize: campaign.maxBatch }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'The batch could not be sent.');
      setSendLog(`Batch done: ${body.sent} sent, ${body.failed} failed, ${body.skipped} skipped. ${body.remaining} players still to email.`);
      await load();
    } catch (sendError) { setError(sendError.message); }
    setBusy('');
  };

  const a = summary?.accounts || {};
  const r = summary?.recovery || {};
  const o = summary?.otherRecords || {};
  return (
    <AdminPrivateRoute>
      <main style={{ maxWidth: 980, margin: '32px auto', padding: '0 16px' }}>
        <h1>Player recovery</h1>
        <p>Players who signed up but could not verify their email while the verification link was broken. Opening this page never changes a player account.</p>
        <button type="button" onClick={load} disabled={Boolean(busy)}>Refresh numbers</button>
        {error ? <p role="alert" style={{ color: '#ff8585', fontWeight: 800 }}>{error}</p> : null}

        <section style={box}>
          <h2>Accounts</h2>
          <div style={grid}>
            <Stat label="All accounts" value={a.allAccountsIncludingTest} note="same as the dashboard's Registered users" />
            <Stat label="Real players" value={a.total} note="test accounts not counted" />
            <Stat label="Verified" value={a.verified} />
            <Stat label="Pending verification" value={a.pending} />
            <Stat label="Pending, last 7 days" value={a.pendingLast7Days} />
            <Stat label="Pending, last 30 days" value={a.pendingLast30Days} />
            <Stat label="Pending with an affiliate" value={a.pendingWithAffiliate} />
            <Stat label="FM COINS held by pending players" value={a.pendingCoinBalanceTotal} />
            <Stat label="Pending without a link" value={a.pendingWithoutLink} note="need a new link (not sent automatically)" />
          </div>
          <p style={{ opacity: 0.8 }}>Other records (shown only, never recreated): {o.signupRecordsWithoutAccount ?? '—'} sign-up records with no matching account · {o.emailListSignupsNotAccounts ?? '—'} email-list sign-ups that are not accounts · {a.testAccountsExcluded ?? '—'} test accounts excluded.</p>
        </section>

        <section style={box}>
          <h2>Recovery progress</h2>
          <div style={grid}>
            <Stat label="Affected players tracked" value={r.cohort} />
            <Stat label="Returned (now verified)" value={r.returned} />
            <Stat label="Still pending" value={r.stillPending} />
            <Stat label="Recovery emails sent" value={r.emailsSent} />
            <Stat label="Emails failed" value={r.emailsFailed} />
            <Stat label="Returned after our email" value={r.returnedAfterEmail} />
          </div>
        </section>

        <section style={box}>
          <h2>Backup copy</h2>
          <p>Download a copy of every account (names, emails, sign-up dates, verification status, FM COINS, affiliate). Passwords and secret tokens are left out. Keep this file somewhere safe.</p>
          {Array.from({ length: summary?.backupParts || 1 }, (_, index) => (
            <button key={index} type="button" style={{ marginRight: 8 }} onClick={() => download(index + 1)} disabled={Boolean(busy)}>
              {busy === `backup-${index + 1}` ? 'Preparing…' : `Download backup${(summary?.backupParts || 1) > 1 ? ` part ${index + 1}` : ''}`}
            </button>
          ))}
        </section>

        <section style={box}>
          <h2>Apology and recovery email</h2>
          <p><strong>{campaign ? campaign.recipients.toLocaleString() : '—'}</strong> players would receive this email. Each email carries that player&apos;s own verification link, so no account is changed. {campaign?.skippedNoLink ? `${campaign.skippedNoLink} pending players have no link and are not included.` : ''}</p>
          {campaign?.linkCheck ? (
            <p style={{ padding: 10, borderRadius: 8, background: campaign.linkCheck.linkServerResponding && !campaign.linkCheck.usesOldBrokenServer ? 'rgba(40,180,90,.15)' : 'rgba(225,29,46,.18)' }}>
              {campaign.linkCheck.linkServerResponding && !campaign.linkCheck.usesOldBrokenServer ? '✓ ' : '✗ '}
              Links point to <strong>{campaign.linkCheck.linkBase}</strong> (our live server{campaign.linkCheck.linkServerResponding ? ', responding now' : ' — NOT responding, do not send'}). Each player gets their own existing link; no account is changed.
            </p>
          ) : null}
          {campaign ? (
            <>
              <p><strong>Subject:</strong> {campaign.subject}</p>
              <iframe title="Email preview" srcDoc={campaign.html} style={{ width: '100%', height: 520, border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, background: '#0b0b0f' }} />
            </>
          ) : null}
          <div style={{ marginTop: 14, padding: 12, border: '1px dashed rgba(242,181,68,.6)', borderRadius: 10 }}>
            <p style={{ marginTop: 0 }}><strong>Nothing is sent until you approve here.</strong> Emails go out {campaign?.maxBatch || 25} at a time; each press sends one batch. A player is never emailed twice.</p>
            <label>Type <code>{campaign?.confirmPhrase || 'SEND RECOVERY EMAILS'}</code> to approve:{' '}
              <input value={confirm} onChange={(event) => setConfirm(event.target.value)} style={{ minWidth: 240 }} />
            </label>{' '}
            <button type="button" onClick={sendBatch} disabled={Boolean(busy) || !campaign?.recipients || confirm !== (campaign?.confirmPhrase || 'SEND RECOVERY EMAILS')}>
              {busy === 'send' ? 'Sending…' : 'Send next batch'}
            </button>
            {sendLog ? <p>{sendLog}</p> : null}
          </div>
          {failures.length ? (
            <details style={{ marginTop: 12 }}>
              <summary>{failures.length} emails failed — see why</summary>
              <ul>{failures.map((row) => <li key={row._id}>{row.email}: {row.error || 'unknown error'}</li>)}</ul>
            </details>
          ) : null}
        </section>

        <section style={box} id="registration-attempts">
          <h2>Registration attempts</h2>
          <p>Every sign-up attempt from now on: who tried, when, whether it worked, and why it failed. Passwords and verification codes are never recorded. Records are kept for {attempts?.retentionDays || 180} days, then deleted automatically.{attempts?.trackingStarted ? ` Tracking started ${attempts.trackingStarted}.` : ' Tracking starts with the next sign-up attempt.'}</p>
          <label>From:{' '}<input type="date" value={attemptFrom} onChange={(event) => { setAttemptFrom(event.target.value); if (attemptTo < event.target.value) setAttemptTo(event.target.value); }} /></label>{' '}
          <label>To:{' '}<input type="date" value={attemptTo} min={attemptFrom} onChange={(event) => setAttemptTo(event.target.value)} /></label>{' '}
          <button type="button" onClick={() => loadAttempts(attemptFrom, attemptTo)} disabled={Boolean(busy)}>Show attempts</button>{' '}
          <button type="button" onClick={downloadAttemptsCsv} disabled={Boolean(busy) || !attempts}>{busy === 'attempts-csv' ? 'Preparing…' : 'Download CSV'}</button>
          {attemptError ? <p role="alert" style={{ color: '#ff8585', fontWeight: 800 }}>{attemptError}</p> : null}
          {attempts ? (
            <>
              <p style={{ opacity: 0.85 }}>{attempts.windowET}</p>
              <div style={grid}>
                <Stat label="People who tried" value={attempts.totals.peopleWhoTried} />
                <Stat label="People who succeeded" value={attempts.totals.peopleWhoSucceeded} />
                <Stat label="All attempts" value={attempts.totals.attempts} />
                <Stat label="Failed" value={attempts.totals.failed} />
                <Stat label="Blocked" value={attempts.totals.blocked} />
                <Stat label="Created, pending verification" value={attempts.totals.pendingVerification} />
                <Stat label="Created and verified" value={attempts.totals.verified} />
              </div>
              {attempts.totals.extraAttemptsCountedOnly ? <p style={{ opacity: 0.8 }}>{attempts.totals.extraAttemptsCountedOnly} extra rapid attempts were counted but not stored (abuse protection).</p> : null}
              {attempts.reasons.length ? (
                <>
                  <h3>Reasons</h3>
                  <ul>{attempts.reasons.map((row) => <li key={row.reason}>{row.reason}: <strong>{row.count}</strong></li>)}</ul>
                </>
              ) : <p>No attempts recorded in this period.</p>}
              {attempts.attempts.length ? (
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr>{['Time (ET)', 'Result', 'Reason', 'Email', 'Verification', 'Type', 'Recorded by'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.2)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {attempts.attempts.map((row, index) => (
                        <tr key={`${row.atET}-${index}`}>
                          {[row.atET, row.result, row.reason, row.email, row.verification, row.kind, row.source].map((cell, cellIndex) => <td key={cellIndex} style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', whiteSpace: cellIndex === 0 ? 'nowrap' : 'normal' }}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          ) : null}
        </section>

        <section style={box} id="registration-report">
          <h2>October 24 Registration Report</h2>
          <p>Every account created on the chosen days, in Eastern Time (New York). Reading this list never changes an account.</p>
          <label>From:{' '}
            <input type="date" value={reportDate} onChange={(event) => { setReportDate(event.target.value); if (reportTo < event.target.value) setReportTo(event.target.value); }} />
          </label>{' '}
          <label>To:{' '}
            <input type="date" value={reportTo} min={reportDate} onChange={(event) => setReportTo(event.target.value)} />
          </label>{' '}
          <button type="button" onClick={() => loadReport(reportDate, reportTo)} disabled={Boolean(busy)}>Show these days</button>{' '}
          <button type="button" onClick={() => loadReport(reportDate, reportTo, 'all-pending')} disabled={Boolean(busy)}>All pending players (any date)</button>{' '}
          <button type="button" onClick={downloadCsv} disabled={Boolean(busy) || !report}>{busy === 'csv' ? 'Preparing…' : 'Download CSV'}</button>
          {reportError ? <p role="alert" style={{ color: '#ff8585', fontWeight: 800 }}>{reportError}</p> : null}
          {report ? (
            <>
              <p style={{ opacity: 0.85 }}><strong>{report.scope}</strong> · {report.windowET}</p>
              <div style={grid}>
                <Stat label="Accounts created" value={report.totals.realAccounts} note={report.totals.testAccounts ? `${report.totals.testAccounts} test accounts listed separately` : 'real players'} />
                <Stat label="Verified" value={report.totals.verified} />
                <Stat label="Pending verification" value={report.totals.pending} />
                <Stat label="Through an affiliate" value={report.totals.viaAffiliate} />
                <Stat label="Signed up with Google" value={report.totals.google} />
              </div>
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>{['Email', 'Name', 'Registered (ET)', 'Status', 'Verification email', 'Affiliate', 'Test'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.2)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {report.registrations.length ? report.registrations.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{row.email}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{[row.firstName, row.lastName].filter(Boolean).join(' ')}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', whiteSpace: 'nowrap' }}>{row.registeredAtET}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{row.status}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{row.verificationEmail}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{row.viaAffiliate === 'Yes' ? (row.affiliateName || 'Yes') : 'No'}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{row.testAccount}</td>
                      </tr>
                    )) : <tr><td colSpan={7} style={{ padding: 8 }}>No accounts were created on this day.</td></tr>}
                  </tbody>
                </table>
              </div>
              {report.affiliateSignups?.length ? (
                <>
                  <h3>Creator / affiliate sign-ups in this period ({report.affiliateSignups.length})</h3>
                  <ul>{report.affiliateSignups.map((a) => <li key={`${a.email}-${a.registeredAtET}`}>{a.email} · {a.name} · {a.registeredAtET} · {a.status}</li>)}</ul>
                </>
              ) : null}
              {reportScope === 'all-pending' ? null : <>
              <h3>Sign-up attempts that did not become accounts</h3>
              <p>Attempts that can be identified with an email address: <strong>{report.failedAttempts.identifiableWithEmail}</strong>.{report.failedAttempts.signupPageVisitsFromFights !== null ? ` Visitors sent from a fight to the sign-up page in this period: ${report.failedAttempts.signupPageVisitsFromFights} (anonymous count, no emails; many of them may have signed up or simply left).` : ''}</p>
              {report.failedAttempts.emailListSignupsNotAccounts.length ? (
                <p>Email-list sign-ups in this period (not player accounts): {report.failedAttempts.emailListSignupsNotAccounts.map((e) => e.email).join(', ')}</p>
              ) : null}
              <ul style={{ opacity: 0.85 }}>{report.failedAttempts.unavailable.map((line) => <li key={line}>{line}</li>)}</ul>
              </>}
            </>
          ) : null}
        </section>

        <section style={box} id="plan-coin-losses">
          <h2>FM COINS lost to the membership plan problem</h2>
          <p>Before the fix on {coinLoss ? coinLoss.fixDeployedET : 'October 25, 2026'}, choosing the Free plan set a player&apos;s balance to 20 FM COINS and Standard set it to 100, even when they had more. This report is <strong>read-only</strong>: it never changes a balance, and no coins can be restored from it.</p>
          <button type="button" onClick={loadCoinLoss} disabled={Boolean(busy)}>Refresh</button>{' '}
          <button type="button" onClick={downloadCoinLossCsv} disabled={Boolean(busy) || !coinLoss}>{busy === 'coinloss-csv' ? 'Preparing…' : 'Download CSV'}</button>
          {coinLossError ? <p role="alert" style={{ color: '#ff8585', fontWeight: 800 }}>{coinLossError}</p> : null}
          {coinLoss ? (
            <>
              <div style={{ ...grid, marginTop: 12 }}>
                <Stat label="Players who chose a plan" value={coinLoss.totals.playersWhoChoseAPlan} />
                <Stat label="Confirmed losses" value={coinLoss.totals.confirmedPlayers} note="exact amount on record" />
                <Stat label="FM COINS lost (confirmed)" value={coinLoss.totals.confirmedCoinsLost} />
                <Stat label="Possible losses" value={coinLoss.totals.possiblePlayers} note="need your review" />
                <Stat label="Checked, no loss" value={coinLoss.totals.noLossPlayers} />
              </div>

              <h3>Confirmed losses ({coinLoss.confirmed.length})</h3>
              <p style={{ opacity: 0.85 }}>The amount comes from the coin-history record written at the moment the plan was chosen.</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['Email', 'Name', 'Original balance', 'Amount lost', 'Current balance', 'Plan / when (ET)', 'Evidence'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.2)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {coinLoss.confirmed.length ? coinLoss.confirmed.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}>{row.email}{row.testAccount === 'Yes' ? ' (test account)' : ''}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}>{row.name}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}><FMCoinAmount amount={row.originalBalance} size="sm" motion="none" /></td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}><FMCoinAmount amount={row.amountLost} size="sm" motion="none" /></td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}><FMCoinAmount amount={row.currentBalance} size="sm" motion="none" /></td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}>{row.events.map((e) => <div key={e.recordId}>{e.plan} · {e.atET}</div>)}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}>{row.events.map((e) => <div key={e.recordId}>{e.evidence}</div>)}</td>
                      </tr>
                    )) : <tr><td colSpan={7} style={{ padding: 8 }}>No confirmed losses were found.</td></tr>}
                  </tbody>
                </table>
              </div>

              <h3>Possible losses, needing review ({coinLoss.possible.length})</h3>
              <p style={{ opacity: 0.85 }}>These players chose a plan, but no record of their balance at that moment exists. The amount is not guessed. The records that do exist are shown so you can decide.</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['Email', 'Name', 'Plan chosen', 'When (ET)', 'Current balance', 'What the records show'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.2)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {coinLoss.possible.length ? coinLoss.possible.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}>{row.email}{row.testAccount === 'Yes' ? ' (test account)' : ''}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}>{row.name}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}>{row.plansChosen}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}>{row.planChosenAtET || 'Not recorded'}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}><FMCoinAmount amount={row.currentBalance} size="sm" motion="none" /></td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' }}><strong>{row.indication}</strong><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{row.evidence.map((line) => <li key={line}>{line}</li>)}</ul></td>
                      </tr>
                    )) : <tr><td colSpan={6} style={{ padding: 8 }}>No possible losses were found.</td></tr>}
                  </tbody>
                </table>
              </div>

              {coinLoss.noLoss.length ? (
                <details style={{ marginTop: 12 }}>
                  <summary>Checked, no loss ({coinLoss.noLoss.length})</summary>
                  <ul>{coinLoss.noLoss.map((row) => <li key={row.id}>{row.email}: {row.reason}</li>)}</ul>
                </details>
              ) : null}
              <ul style={{ opacity: 0.85 }}>{coinLoss.notes.map((line) => <li key={line}>{line}</li>)}</ul>
            </>
          ) : null}
        </section>

        <section style={box}>
          <h2>Goodwill FM COINS bonus (preview only)</h2>
          <p>At {bonus ? bonus.amount.toLocaleString() : '2,500'} FM COINS each: {bonus ? bonus.affectedPlayers.toLocaleString() : '—'} affected players → {bonus ? bonus.coinsIfAllAffected.toLocaleString() : '—'} FM COINS if every one returns ({bonus ? bonus.returnedSoFar.toLocaleString() : '—'} have returned so far → {bonus ? bonus.coinsIfReturnedSoFar.toLocaleString() : '—'} FM COINS).</p>
          <p style={{ opacity: 0.8 }}>No coins can be issued from this page. Awarding will be switched on only after you approve the amount and who qualifies, and each player can receive it once.</p>
        </section>
      </main>
    </AdminPrivateRoute>
  );
};

export default PlayerRecovery;
