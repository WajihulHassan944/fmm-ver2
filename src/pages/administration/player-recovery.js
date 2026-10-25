import React, { useCallback, useEffect, useState } from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { adminHeaders, adminJsonHeaders } from '@/Utils/authFetch';

// Player Recovery: players who could not verify their email while the link was broken.
// Reading this page never changes a player account. Sending requires typing the
// confirmation phrase; the FM COINS bonus is a preview only.
const API = `${PUBLIC_API_BASE_URL}/api/admin/player-recovery`;

const get = async (path) => {
  const response = await fetch(`${API}${path}`, { headers: adminHeaders(), cache: 'no-store' });
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

  const load = useCallback(async () => {
    setError('');
    try {
      const [s, c, b, f] = await Promise.all([get('/summary'), get('/campaign'), get('/goodwill-preview?amount=2500'), get('/messages?status=failed')]);
      setSummary(s); setCampaign(c); setBonus(b); setFailures(f.rows || []);
    } catch (loadError) { setError(loadError.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

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
