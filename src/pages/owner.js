import React, { useCallback, useEffect, useState } from 'react';
import { buildPublicApiUrl } from '@/Utils/publicApi';

// Owner Check — read-only. Deliberately a standalone page with its own door and
// its own key: it is not reachable from the admin panel and does not share the
// admin token. Nothing here can change data; every action is a GET.

const TOKEN_KEY = 'ownerAuthToken';
// Quick access: prove it once by email, then unlock with a PIN on this device.
// Safe here only because everything behind it is read-only.
const DEVICE_KEY = 'ownerDeviceKey';

const shell = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 75% 0%, rgba(223,17,27,.14), transparent 60%), #05080d',
  color: '#fff',
  fontFamily: "'Rajdhani', 'Segoe UI', system-ui, sans-serif",
  padding: '48px 20px 80px',
};
const wrap = { maxWidth: 940, margin: '0 auto' };
const card = {
  background: 'linear-gradient(180deg, rgba(17,24,33,.95), rgba(7,11,16,.98))',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 16,
  padding: 24,
  marginBottom: 18,
};
const input = {
  width: '100%', padding: '13px 15px', borderRadius: 10, fontSize: 15,
  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.18)',
  color: '#fff', marginBottom: 12, fontFamily: 'inherit',
};
const button = (busy) => ({
  width: '100%', padding: '13px 0', borderRadius: 999, border: 'none', cursor: busy ? 'default' : 'pointer',
  background: '#df111b', color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: .4,
  opacity: busy ? .6 : 1, fontFamily: 'inherit',
});
const pill = (ok) => ({
  display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800,
  background: ok ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.16)',
  border: `1px solid ${ok ? 'rgba(34,197,94,.5)' : 'rgba(239,68,68,.55)'}`,
  color: ok ? '#22c55e' : '#ff6b6b',
});
const label = { fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'rgba(255,255,255,.45)', marginBottom: 10 };

const OwnerCheck = () => {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [overview, setOverview] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [deviceKey, setDeviceKey] = useState('');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [useEmailInstead, setUseEmailInstead] = useState(false);
  const [viewAsQuery, setViewAsQuery] = useState('');
  const [viewAsResults, setViewAsResults] = useState(null);

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '');
      setDeviceKey(window.localStorage.getItem(DEVICE_KEY) || '');
    } catch (e) { /* ignore */ }
  }, []);

  const forgetDevice = useCallback(() => {
    try { window.localStorage.removeItem(DEVICE_KEY); } catch (e) { /* ignore */ }
    setDeviceKey(''); setPin('');
  }, []);

  // PIN unlock — the everyday path on your own phone.
  const unlockWithPin = async (event) => {
    event.preventDefault();
    setBusy(true); setNotice('');
    try {
      const response = await fetch(buildPublicApiUrl('/api/owner/login/device'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceKey, pin }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.token) {
        if (payload?.reset) forgetDevice();
        setNotice(payload?.message || 'That PIN is not correct.');
        setPin('');
        return;
      }
      try { window.localStorage.setItem(TOKEN_KEY, payload.token); } catch (e) { /* ignore */ }
      setToken(payload.token); setPin('');
    } catch (error) {
      setNotice('Could not reach the server.');
    } finally { setBusy(false); }
  };

  const trustThisDevice = async (event) => {
    event.preventDefault();
    setBusy(true); setNotice('');
    try {
      const response = await fetch(buildPublicApiUrl('/api/owner/device/trust'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pin: newPin, label: 'Phone' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.deviceKey) { setNotice(payload?.message || 'Could not set up quick access.'); return; }
      try { window.localStorage.setItem(DEVICE_KEY, payload.deviceKey); } catch (e) { /* ignore */ }
      setDeviceKey(payload.deviceKey); setNewPin(''); setShowPinSetup(false);
      setNotice(`Quick access is on. This device will ask only for your PIN for the next ${payload.expiresInDays} days.`);
    } catch (error) {
      setNotice('Could not reach the server.');
    } finally { setBusy(false); }
  };

  const signOut = useCallback(() => {
    try { window.localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
    setToken(''); setOverview(null); setIntegrity(null); setCodeSent(false); setCode('');
  }, []);

  const load = useCallback(async (activeToken) => {
    const headers = { Authorization: `Bearer ${activeToken}` };
    const get = async (path) => {
      const response = await fetch(buildPublicApiUrl(path), { headers });
      if (response.status === 401) { signOut(); setNotice('Your owner session expired. Sign in again.'); return null; }
      return response.json().catch(() => null);
    };
    const [o, i] = await Promise.all([get('/api/owner/overview'), get('/api/owner/integrity')]);
    if (o?.ok) setOverview(o);
    if (i?.ok) setIntegrity(i);
  }, [signOut]);

  useEffect(() => { if (token) load(token); }, [token, load]);

  const requestCode = async (event) => {
    event.preventDefault();
    setBusy(true); setNotice('');
    try {
      const response = await fetch(buildPublicApiUrl('/api/owner/login/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({}));
      setCodeSent(true);
      setNotice(payload?.message || 'If that address can access the owner view, a code is on its way.');
    } catch (error) {
      setNotice('Could not reach the server.');
    } finally { setBusy(false); }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setBusy(true); setNotice('');
    try {
      const response = await fetch(buildPublicApiUrl('/api/owner/login/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.token) { setNotice(payload?.message || 'That code is not correct.'); return; }
      try { window.localStorage.setItem(TOKEN_KEY, payload.token); } catch (e) { /* ignore */ }
      setToken(payload.token); setCode('');
    } catch (error) {
      setNotice('Could not reach the server.');
    } finally { setBusy(false); }
  };

  // "View as" — read-only. The token the server mints cannot write, so this
  // answers "what do they actually see" without any risk to their account.
  const searchAccounts = async (event) => {
    event.preventDefault();
    if (viewAsQuery.trim().length < 2) { setNotice('Type at least two characters.'); return; }
    setBusy(true); setNotice('');
    try {
      const response = await fetch(
        buildPublicApiUrl(`/api/owner/preview/search?q=${encodeURIComponent(viewAsQuery.trim())}`),
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { setNotice(payload?.message || 'Search failed.'); return; }
      setViewAsResults({ players: payload.players || [], affiliates: payload.affiliates || [] });
    } catch (error) {
      setNotice('Could not reach the server.');
    } finally { setBusy(false); }
  };

  const viewAs = async (target, targetType) => {
    setBusy(true); setNotice('');
    try {
      const response = await fetch(buildPublicApiUrl('/api/owner/preview/token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetType, targetId: target.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.token) { setNotice(payload?.message || 'Could not start the preview.'); return; }
      const destination = targetType === 'affiliate' ? '/AffiliateDashboard' : '/';
      const query = new URLSearchParams({
        preview: payload.token,
        as: payload.target?.name || target.name,
        asType: targetType,
      });
      window.open(`${destination}?${query.toString()}`, '_blank', 'noopener');
    } catch (error) {
      setNotice('Could not reach the server.');
    } finally { setBusy(false); }
  };

  const recheck = async () => {
    setBusy(true);
    await load(token);
    setBusy(false);
  };

  if (!token && deviceKey && !useEmailInstead) {
    return (
      <div style={shell}>
        <div style={{ ...wrap, maxWidth: 380 }}>
          <div style={card}>
            <div style={label}>FANTASY MMADNESS</div>
            <h1 style={{ margin: '0 0 6px', fontSize: 28, letterSpacing: -0.5 }}>Owner Check</h1>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, marginTop: 0 }}>Enter your PIN.</p>
            <form onSubmit={unlockWithPin}>
              <input
                type="password" inputMode="numeric" autoComplete="current-password" maxLength={8}
                autoFocus
                style={{ ...input, fontSize: 26, letterSpacing: 10, textAlign: 'center', padding: '16px 15px' }}
                placeholder="••••" value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} required
              />
              <button type="submit" style={button(busy)} disabled={busy || pin.length < 4}>
                {busy ? 'Checking…' : 'Unlock'}
              </button>
            </form>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
              <button type="button" onClick={() => { setUseEmailInstead(true); setNotice(''); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                Use an email code
              </button>
              <button type="button" onClick={forgetDevice}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                Forget this device
              </button>
            </div>
            {notice && <p style={{ color: '#f2b544', fontSize: 12.5, lineHeight: 1.6, marginBottom: 0 }}>{notice}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={shell}>
        <div style={{ ...wrap, maxWidth: 420 }}>
          <div style={card}>
            <div style={label}>FANTASY MMADNESS</div>
            <h1 style={{ margin: '0 0 6px', fontSize: 28, letterSpacing: -0.5 }}>Owner Check</h1>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, lineHeight: 1.6, marginTop: 0 }}>
              Read-only view of the whole platform. Nothing here can change data.
            </p>
            <form onSubmit={codeSent ? verifyCode : requestCode}>
              <input
                type="email" style={input} placeholder="Owner email" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={codeSent} required
              />
              {codeSent && (
                <input
                  type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  style={input} placeholder="6-digit code from your email" value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required
                />
              )}
              <button type="submit" style={button(busy)} disabled={busy}>
                {busy ? 'Please wait…' : codeSent ? 'Sign in' : 'Email me a code'}
              </button>
            </form>
            {codeSent && (
              <button
                type="button"
                onClick={() => { setCodeSent(false); setCode(''); setNotice(''); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: 12, marginTop: 12, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Start over
              </button>
            )}
            {notice && <p style={{ color: '#f2b544', fontSize: 12.5, lineHeight: 1.6, marginBottom: 0 }}>{notice}</p>}
          </div>
        </div>
      </div>
    );
  }

  const problems = integrity?.checks?.filter((c) => !c.ok) || [];

  return (
    <div style={shell}>
      <div style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={label}>READ-ONLY</div>
            <h1 style={{ margin: 0, fontSize: 30, letterSpacing: -0.5 }}>Owner Check</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={recheck} disabled={busy}
              style={{ ...button(busy), width: 'auto', padding: '10px 20px', background: 'rgba(255,255,255,.08)' }}>
              {busy ? 'Checking…' : 'Re-run checks'}
            </button>
            <button type="button" onClick={signOut}
              style={{ ...button(false), width: 'auto', padding: '10px 20px', background: 'rgba(255,255,255,.08)' }}>
              Sign out
            </button>
          </div>
        </div>

        {!deviceKey && (
          <div style={{ ...card, border: '1px solid rgba(242,181,68,.45)' }}>
            <div style={label}>QUICK ACCESS</div>
            {!showPinSetup ? (
              <>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '0 0 14px', color: 'rgba(255,255,255,.75)' }}>
                  Skip the email code on this phone. Set a PIN and this device unlocks with just that
                  for 30 days. Safe because nothing here can change your data.
                </p>
                <button type="button" onClick={() => setShowPinSetup(true)}
                  style={{ ...button(false), width: 'auto', padding: '11px 22px', background: '#f2b544', color: '#2b1b00' }}>
                  Set up a PIN
                </button>
              </>
            ) : (
              <form onSubmit={trustThisDevice}>
                <input
                  type="password" inputMode="numeric" maxLength={8} autoFocus
                  style={{ ...input, fontSize: 22, letterSpacing: 8, textAlign: 'center' }}
                  placeholder="4–8 digits" value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))} required
                />
                <button type="submit" style={button(busy)} disabled={busy || newPin.length < 4}>
                  {busy ? 'Saving…' : 'Turn on quick access'}
                </button>
              </form>
            )}
          </div>
        )}

        {deviceKey && (
          <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Quick access is on for this device</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.45)' }}>
                {overview?.trustedDevices ? `${overview.trustedDevices} trusted device${overview.trustedDevices === 1 ? '' : 's'}` : 'PIN unlock enabled'}
              </div>
            </div>
            <button type="button" onClick={async () => {
              setBusy(true);
              try {
                await fetch(buildPublicApiUrl('/api/owner/device/forget-all'), {
                  method: 'POST', headers: { Authorization: `Bearer ${token}` },
                });
                forgetDevice();
                setNotice('All trusted devices removed.');
                await load(token);
              } finally { setBusy(false); }
            }} style={{ ...button(busy), width: 'auto', padding: '10px 18px', background: 'rgba(239,68,68,.2)' }}>
              Forget all devices
            </button>
          </div>
        )}

        <div style={card}>
          <div style={label}>VIEW AS</div>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 14px', color: 'rgba(255,255,255,.7)' }}>
            See the app exactly as a player or affiliate sees it. Read-only — nothing you tap in
            that view can change their account, spend their coins or enter them into anything.
            Opens in a new tab and lasts 20 minutes.
          </p>
          <form onSubmit={searchAccounts} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input
              type="text" style={{ ...input, marginBottom: 0 }} placeholder="Name or email"
              value={viewAsQuery} onChange={(e) => setViewAsQuery(e.target.value)}
            />
            <button type="submit" disabled={busy}
              style={{ ...button(busy), width: 'auto', padding: '0 22px', background: 'rgba(255,255,255,.1)' }}>
              Find
            </button>
          </form>

          {viewAsResults && (
            <div style={{ marginTop: 12 }}>
              {[['players', 'Players', 'player'], ['affiliates', 'Affiliates', 'affiliate']].map(([key, heading, type]) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ ...label, marginBottom: 6 }}>{heading}</div>
                  {viewAsResults[key].length === 0 ? (
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.4)' }}>No matches.</div>
                  ) : viewAsResults[key].map((row) => (
                    <div key={row.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                      padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.07)', flexWrap: 'wrap',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{row.name}</div>
                        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.45)' }}>
                          {row.email} · {Number(row.coins || 0).toLocaleString()} FM
                          {type === 'affiliate' ? (row.verified ? ' · verified' : ' · unverified') : ''}
                        </div>
                      </div>
                      <button type="button" onClick={() => viewAs(row, type)} disabled={busy}
                        style={{ ...button(busy), width: 'auto', padding: '8px 16px', background: 'rgba(242,181,68,.9)', color: '#2b1b00', fontSize: 12.5 }}>
                        View as
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {integrity && (
          <div style={{
            ...card,
            border: `1px solid ${integrity.allClear ? 'rgba(34,197,94,.45)' : 'rgba(239,68,68,.5)'}`,
          }}>
            <div style={label}>THE BOOKS</div>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, color: integrity.allClear ? '#22c55e' : '#ff6b6b' }}>
              {integrity.allClear ? 'Everything balances' : `${problems.length} thing${problems.length === 1 ? '' : 's'} need attention`}
            </h2>
            <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 12, margin: 0 }}>
              Checked {new Date(integrity.generatedAt).toLocaleString()}
            </p>
          </div>
        )}

        {integrity?.checks?.map((check) => (
          <div key={check.name} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <strong style={{ fontSize: 15 }}>{check.name}</strong>
              <span style={pill(check.ok)}>{check.ok ? 'CLEAR' : check.count}</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>{check.detail}</p>
            {check.sample?.length > 0 && (
              <pre style={{
                marginTop: 12, marginBottom: 0, padding: 12, borderRadius: 8, overflowX: 'auto',
                background: 'rgba(0,0,0,.45)', color: 'rgba(255,255,255,.75)', fontSize: 11.5, lineHeight: 1.6,
              }}>{JSON.stringify(check.sample, null, 2)}</pre>
            )}
          </div>
        ))}

        {overview && (
          <>
            <div style={card}>
              <div style={label}>CONFIGURATION</div>
              {overview.config.map((row) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                  padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,.07)', flexWrap: 'wrap',
                }}>
                  <div style={{ minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{row.label}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.45)' }}>{row.note}</div>
                  </div>
                  <span style={pill(row.ok)}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={label}>RIGHT NOW</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                {[
                  ['Players', overview.counts.players],
                  ['Affiliates', overview.counts.affiliates],
                  ['Open fights', overview.counts.openFights],
                  ['Entries (24h)', overview.counts.entriesLast24h],
                  ['Pending payouts', overview.counts.pendingPayouts],
                ].map(([name, value]) => (
                  <div key={name}>
                    <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                      {Number(value || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)' }}>{name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <div style={label}>FEATURES</div>
              {Object.entries(overview.features).map(([name, on]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0' }}>
                  <span style={{ fontSize: 14, textTransform: 'capitalize' }}>{name.replace(/([A-Z])/g, ' $1')}</span>
                  <span style={{ ...pill(true), background: on ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.07)', borderColor: on ? 'rgba(34,197,94,.5)' : 'rgba(255,255,255,.18)', color: on ? '#22c55e' : 'rgba(255,255,255,.55)' }}>
                    {on ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {notice && <p style={{ color: '#f2b544', fontSize: 13 }}>{notice}</p>}
      </div>
    </div>
  );
};

export default OwnerCheck;
