import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { adminHeaders, adminJsonHeaders } from '@/Utils/authFetch';
import { FMCoinAmount } from '@/Components/Common/FMCoin';

// Membership Plan Coin Restoration (owner-approved).
// Each restoration ADDS a confirmed loss to the player's CURRENT balance; it never sets a
// balance. The server refuses to restore the same loss twice, requires a fresh full backup
// download and the typed confirmation shown here.
const API = `${PUBLIC_API_BASE_URL}/api/admin/player-recovery/plan-coin-restorations`;
const box = { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: 16, margin: '0 0 16px' };
const th = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.2)', whiteSpace: 'nowrap' };
const td = { padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', verticalAlign: 'top' };
const Coins = ({ value }) => (value === null || value === undefined ? <span>—</span> : <FMCoinAmount amount={value} size="sm" motion="none" />);

const getJson = async (url) => {
  const response = await fetch(url, { headers: adminHeaders(), cache: 'no-store' });
  if (response.status === 401 || response.status === 403) throw new Error('Your administrator session has expired. Please sign in again.');
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'This information could not be loaded.');
  return body;
};

export default function PlanCoinRestoration({ refreshKey = 0, onRestored }) {
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState(null);
  const [selected, setSelected] = useState(null); // null = server default (all players without warnings)
  const [ack, setAck] = useState([]);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const submitting = useRef(false); // blocks a second click before the screen updates

  const loadPreview = useCallback(async (sel, acknowledged) => {
    setError('');
    try {
      const query = sel === null ? `?ack=${encodeURIComponent(acknowledged.join(','))}` : `?select=${encodeURIComponent(sel.join(','))}&ack=${encodeURIComponent(acknowledged.join(','))}`;
      const data = await getJson(`${API}/preview${query}`);
      setPreview(data);
      if (sel === null) setSelected(data.selection);
    } catch (loadError) { setPreview(null); setError(loadError.message); }
  }, []);
  const loadHistory = useCallback(async () => {
    try { setHistory(await getJson(API)); } catch (loadError) { setError(loadError.message); }
  }, []);

  useEffect(() => { loadPreview(null, []); loadHistory(); setConfirm(''); }, [loadPreview, loadHistory, refreshKey]);

  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next); setConfirm(''); loadPreview(next, ack);
  };
  const toggleAck = (id) => {
    const nextAck = ack.includes(id) ? ack.filter((x) => x !== id) : [...ack, id];
    const nextSel = nextAck.includes(id) ? [...new Set([...(selected || []), id])] : (selected || []).filter((x) => x !== id);
    setAck(nextAck); setSelected(nextSel); setConfirm(''); loadPreview(nextSel, nextAck);
  };

  const restore = async () => {
    if (!preview || busy || submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(''); setResult(null);
    try {
      const response = await fetch(`${API}/apply`, {
        method: 'POST', headers: adminJsonHeaders(),
        body: JSON.stringify({ restorationIds: preview.selection, acknowledged: preview.selectionAck, previewHash: preview.previewHash, confirm }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'The restoration could not be completed.');
      setResult(body);
      setConfirm(''); setAck([]);
      await Promise.all([loadPreview(null, []), loadHistory()]);
      if (onRestored) onRestored();
    } catch (restoreError) { setError(restoreError.message); }
    submitting.current = false;
    setBusy(false);
  };

  const backup = preview?.backup;
  const canRestore = Boolean(preview && preview.selection.length && backup?.ok && confirm.trim() === preview.confirmPhrase && !busy);

  return (
    <>
      <section style={box} id="plan-coin-restoration">
        <h2>FM COINS restoration: confirmed losses</h2>
        <p>Restoring <strong>adds</strong> each player&apos;s confirmed loss to their <strong>current</strong> balance. For example, 300 FM COINS now plus a 480 loss becomes 780. Balances are never reset. The same loss can never be restored twice, even if the button is pressed again or the request is repeated.</p>
        {error ? <p role="alert" style={{ color: '#ff8585', fontWeight: 800 }}>{error}</p> : null}
        {preview ? (
          <>
            <p style={{ fontWeight: 700, color: backup?.ok ? '#6fe39b' : '#ffcf6b' }}>
              {backup?.ok
                ? `Backup ready: all ${backup.parts} backup file${backup.parts === 1 ? '' : 's'} downloaded in the last ${backup.windowHours} hours (latest ${backup.lastDownloadET}).`
                : `Step 1: download a full backup first, in the "Backup copy" section above (still needed: part ${backup?.missingParts.join(', ')}). Restoring stays locked until then.`}
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['Restore', 'Email', 'Loss (plan / date)', 'Original loss', 'Current balance', 'Will add', 'New balance', 'Checks'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {preview.items.length ? preview.items.map((item) => {
                    const isSelected = preview.selection.includes(item.restorationId);
                    return (
                      <tr key={item.restorationId} style={{ opacity: item.blocks.length ? 0.6 : 1 }}>
                        <td style={td}>
                          <input type="checkbox" aria-label={`Restore ${item.email}`} checked={isSelected} disabled={Boolean(item.blocks.length) || (item.needsAcknowledgement && !ack.includes(item.restorationId)) || busy} onChange={() => toggle(item.restorationId)} />
                        </td>
                        <td style={td}>{item.email}{item.testAccount === 'Yes' ? ' (test account)' : ''}<div style={{ opacity: 0.7 }}>{item.name}</div></td>
                        <td style={td}>{item.plan} · {item.lossAtET}</td>
                        <td style={td}><Coins value={item.amount} /></td>
                        <td style={td}><Coins value={item.currentBalance} /></td>
                        <td style={td}>{item.blocks.length ? '—' : <Coins value={item.amount} />}</td>
                        <td style={td}>{item.blocks.length ? '—' : <Coins value={item.newBalance} />}</td>
                        <td style={td}>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {item.blocks.map((line) => <li key={line} style={{ color: '#ffcf6b' }}>Not restorable: {line}</li>)}
                            {item.warnings.map((line) => <li key={line} style={{ color: '#ffcf6b' }}>{line}</li>)}
                            {item.checks.map((line) => <li key={line}>{line}</li>)}
                          </ul>
                          {item.needsAcknowledgement ? (
                            <label style={{ display: 'block', marginTop: 6, fontWeight: 700 }}>
                              <input type="checkbox" checked={ack.includes(item.restorationId)} onChange={() => toggleAck(item.restorationId)} disabled={busy} /> I checked this and it was not a reimbursement
                            </label>
                          ) : null}
                        </td>
                      </tr>
                    );
                  }) : <tr><td colSpan={8} style={{ padding: 8 }}>There are no confirmed losses to restore.</td></tr>}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: 12 }}>
              Selected: <strong>{preview.selection.length}</strong> player{preview.selection.length === 1 ? '' : 's'}, <strong>{Number(preview.selectionCoins).toLocaleString()} FM COINS</strong> in total.
            </p>
            {preview.selection.length ? (
              <>
                <label>To approve, type <code>{preview.confirmPhrase}</code>:{' '}
                  <input value={confirm} onChange={(event) => setConfirm(event.target.value)} style={{ minWidth: 220 }} disabled={busy} />
                </label>{' '}
                <button type="button" onClick={restore} disabled={!canRestore}>{busy ? 'Restoring…' : 'Restore selected players'}</button>
              </>
            ) : null}
            {result ? (
              <div role="status" style={{ marginTop: 12, fontWeight: 700 }}>
                Restored {result.restored} player{result.restored === 1 ? '' : 's'} ({Number(result.coinsRestored).toLocaleString()} FM COINS).
                {result.alreadyRestored ? ` ${result.alreadyRestored} already restored earlier (nothing added again).` : ''}
                {result.failed ? ` ${result.failed} not changed: ${result.results.filter((r) => r.status === 'failed').map((r) => `${r.email} (${r.error})`).join('; ')}` : ''}
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <section style={box} id="plan-coin-restoration-history">
        <h2>FM COINS restoration history</h2>
        {history ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr>{['Email', 'Original loss', 'Amount restored', 'Balance before → after', 'Restored (ET)', 'Reason', 'Status', 'Balance check'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {history.rows.length ? history.rows.map((row) => (
                  <tr key={row.restorationId}>
                    <td style={td}>{row.email}<div style={{ opacity: 0.7 }}>Loss: {row.plan} · {row.lossAtET}</div></td>
                    <td style={td}><Coins value={row.originalLoss} /></td>
                    <td style={td}><Coins value={row.amountRestored} /></td>
                    <td style={td}>{Number(row.balanceBefore).toLocaleString()} → {Number(row.balanceAfter).toLocaleString()}</td>
                    <td style={td}>{row.restoredAtET}<div style={{ opacity: 0.7 }}>by {row.approvedBy}</div></td>
                    <td style={td}>{row.reason}</td>
                    <td style={td}>{row.status}</td>
                    <td style={td}>{row.balanceCheck}</td>
                  </tr>
                )) : <tr><td colSpan={8} style={{ padding: 8 }}>No restorations have been made yet.</td></tr>}
              </tbody>
            </table>
          </div>
        ) : null}
        {history?.rows.length ? <p>Total restored: <strong>{Number(history.totalRestored).toLocaleString()} FM COINS</strong>.</p> : null}
      </section>
    </>
  );
}
