import React, { useEffect, useState } from 'react';
import { adminHeaders } from '@/Utils/authFetch';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';

// Growth Command Center — fight campaign drafts (Phase 1).
// Drafts only: nothing on this panel posts, emails or messages anyone.

const API = PUBLIC_API_BASE_URL + '/api/admin/fan-acquisition/fight-campaigns';
const STATE_LABELS = {
  draft: 'Draft — ready for your checks',
  needs_review: 'Needs review — see the problems listed',
  approved: 'Approved draft — NOT posted or sent',
  queued: 'Queued', published: 'Published', failed: 'Failed',
};
const STATE_COLORS = { draft: '#2f6fb3', needs_review: '#a86a12', approved: '#186b42', queued: '#555', published: '#555', failed: '#9f3030' };
// How each platform frames the image, so the owner can judge the fit.
const FRAMES = {
  instagram: { ratio: '4 / 5', fit: 'cover', note: 'Instagram feed shows a 4:5 crop' },
  facebook: { ratio: 'auto', fit: 'contain', note: 'Facebook shows the full poster' },
  x: { ratio: '16 / 9', fit: 'cover', note: 'X timeline shows a 16:9 crop' },
  affiliate_email: { ratio: 'auto', fit: 'contain', note: 'Email attaches the full poster' },
};
const box = { padding: 16, border: '1px solid #394152', borderRadius: 12, background: '#111725', marginBottom: 16 };
const btn = (bg) => ({ padding: '9px 14px', background: bg, color: '#fff', border: 0, borderRadius: 7, cursor: 'pointer', fontWeight: 700 });

async function call(path, options = {}) {
  const response = await fetch(API + path, { cache: 'no-store', ...options, headers: { ...adminHeaders(), ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) throw Error('Your admin session has expired. Sign in again.');
  if (!response.ok) {
    const error = Error(body.message || 'Request failed (HTTP ' + response.status + ')');
    error.problems = body.problems || [];
    throw error;
  }
  return body;
}

// Personal QR posters are served only to signed-in admins, so load them with
// the admin token instead of a plain <img src>.
function PosterImage({ url, frame }) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let revoke = '';
    setFailed(false);
    if (!url) { setSrc(''); return undefined; }
    if (/^https:\/\//.test(url)) { setSrc(url); return undefined; }
    fetch(PUBLIC_API_BASE_URL + url, { headers: adminHeaders() })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => { revoke = URL.createObjectURL(blob); setSrc(revoke); })
      .catch(() => setFailed(true));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [url]);
  if (!url) return <div style={{ padding: 24, border: '1px dashed #a86a12', borderRadius: 8, color: '#ffd59a' }}>No approved poster</div>;
  if (failed) return <div style={{ padding: 24, border: '1px dashed #9f3030', borderRadius: 8, color: '#ffb7b7' }}>Poster could not be loaded</div>;
  return (
    <div>
      <div style={{ aspectRatio: frame.ratio, maxHeight: 380, overflow: 'hidden', borderRadius: 8, background: '#000' }}>
        {src && <img src={src} alt="Approved fight poster preview" style={{ width: '100%', height: frame.ratio === 'auto' ? 'auto' : '100%', objectFit: frame.fit, display: 'block' }} />}
      </div>
      <small style={{ color: '#aebbd0' }}>{frame.note}</small>
    </div>
  );
}

function ChannelPreview({ campaign, name, channel, checks, checkLabels, busy, onCheck }) {
  const frame = FRAMES[name] || FRAMES.facebook;
  const editable = ['draft', 'needs_review'].includes(campaign.state);
  if (!channel.enabled) {
    return <div style={{ padding: 12, border: '1px solid #2a3344', borderRadius: 8, color: '#aebbd0' }}><strong>{channel.label}</strong> — {channel.blocking?.[0] || 'Not used for this campaign.'}</div>;
  }
  return (
    <article style={{ padding: 14, border: '1px solid #40516a', borderRadius: 10, background: '#0d1320' }}>
      <h4 style={{ margin: '0 0 10px' }}>{channel.label} <small style={{ color: '#aebbd0', fontWeight: 400 }}>· {channel.characterCount} characters{name === 'x' ? ' of 280' : ''}</small></h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,260px) 1fr', gap: 14 }}>
        <PosterImage url={channel.image?.url} frame={frame} />
        <div>
          {channel.subject && <p style={{ margin: '0 0 8px' }}><strong>Subject:</strong> {channel.subject}</p>}
          <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.55, padding: 12, background: '#101827', borderRadius: 8 }}>{channel.text}</div>
          <p style={{ margin: '10px 0 4px' }}><strong>Link in this post:</strong> <a href={channel.link} target="_blank" rel="noopener noreferrer" style={{ color: '#9bd2ff', overflowWrap: 'anywhere' }}>{channel.link}</a></p>
          {channel.image?.hasQr && <p style={{ margin: '4px 0', color: '#aebbd0' }}>The poster’s QR code must open this same link. Scan it with your phone to confirm.</p>}
          <button type="button" onClick={() => navigator.clipboard?.writeText(channel.subject ? channel.subject + '\n\n' + channel.text : channel.text)} style={{ ...btn('#36455d'), marginTop: 6 }}>Copy text</button>
        </div>
      </div>
      {channel.blocking?.length > 0 && <ul style={{ color: '#ffb7b7' }}>{channel.blocking.map((x) => <li key={x}>Blocked: {x}</li>)}</ul>}
      {channel.warnings?.length > 0 && <ul style={{ color: '#ffd59a' }}>{channel.warnings.map((x) => <li key={x}>Check: {x}</li>)}</ul>}
      <div style={{ marginTop: 10, padding: 10, border: '1px solid #2a3344', borderRadius: 8 }}>
        <strong>Your checks for {channel.label}</strong>
        {checks.map((check) => {
          const status = channel.checks?.[check]?.status || 'pending';
          return (
            <div key={check} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              <span style={{ minWidth: 22 }}>{status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⬜'}</span>
              <span style={{ flex: '1 1 260px' }}>{checkLabels[check] || check}</span>
              <button type="button" disabled={!editable || busy} onClick={() => onCheck(name, check, 'pass')} style={btn('#186b42')}>Confirmed</button>
              <button type="button" disabled={!editable || busy} onClick={() => { const note = window.prompt('What is wrong? (saved with the campaign)') || ''; onCheck(name, check, 'fail', note); }} style={btn('#9f3030')}>Problem</button>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function FightCampaignReview() {
  const [campaigns, setCampaigns] = useState([]);
  const [meta, setMeta] = useState({ checks: [], checkLabels: {} });
  const [affiliateId, setAffiliateId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [problems, setProblems] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [open, setOpen] = useState('');

  const refresh = async () => {
    try {
      const body = await call('');
      setCampaigns(body.campaigns || []);
      setMeta({ checks: body.checks || [], checkLabels: body.checkLabels || {} });
      setError('');
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { refresh(); }, []);

  const run = async (action, success) => {
    setBusy(true); setError(''); setNotice(''); setProblems([]);
    try { const body = await action(); setNotice(typeof success === 'function' ? success(body) : success); await refresh(); }
    catch (e) { setError(e.message); setProblems(e.problems || []); }
    finally { setBusy(false); }
  };
  const generate = () => run(async () => {
    const body = await call('/generate', { method: 'POST', body: JSON.stringify(affiliateId.trim() ? { affiliateId: affiliateId.trim() } : {}) });
    setSkipped(body.skipped || []);
    return body;
  }, (b) => `Prepared ${b.created.length} new draft(s). ${b.duplicates.length} already existed. ${b.skipped.length} fight(s) could not be promoted (reasons below). Nothing was posted or sent.`);
  const check = (campaign, channel, name, result, note = '') => run(() => call('/' + campaign._id + '/checks', { method: 'POST', body: JSON.stringify({ channel, check: name, result, note }) }), 'Check saved.');
  const setStatus = (campaign, status) => {
    if (status === 'approved' && !window.confirm('Approve this campaign as a DRAFT?\n\nNothing will be posted, emailed or sent. Publishing is not switched on.')) return;
    run(() => call('/' + campaign._id + '/status', { method: 'POST', body: JSON.stringify({ status }) }), status === 'approved' ? 'Approved as a draft. Nothing was posted or sent.' : 'Status updated.');
  };

  return (
    <section style={{ ...box, padding: 20, marginTop: 20 }}>
      <h2 style={{ marginTop: 0 }}>FIGHT CAMPAIGNS — DRAFT REVIEW</h2>
      <p style={{ color: '#d4d9e3' }}>Fight-specific posts for Instagram, Facebook and X, plus affiliate outreach emails, built only from upcoming fights in the Fight Registry. <strong>Nothing here is posted, emailed or sent.</strong> Publishing is switched off.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" disabled={busy} onClick={generate} style={btn('#cb1028')}>{busy ? 'Working…' : 'PREPARE DRAFTS FOR UPCOMING FIGHTS'}</button>
        <label style={{ color: '#d4d9e3' }}>For one affiliate (optional): <input value={affiliateId} onChange={(e) => setAffiliateId(e.target.value)} placeholder="Affiliate ID" style={{ padding: 8, borderRadius: 6, border: '1px solid #566078', background: '#0b101a', color: '#fff', width: 230 }} /></label>
        <button type="button" disabled={busy} onClick={refresh} style={btn('#283447')}>Refresh</button>
      </div>
      <p style={{ color: '#aebbd0', fontSize: 13 }}>Leave the affiliate box empty for your own FANTASY MMADNESS posts. Enter an affiliate ID to prepare that affiliate’s posts and outreach email with their personal link and approved QR poster.</p>
      {notice && <p role="status" style={{ color: '#9fe3bd' }}>{notice}</p>}
      {error && <div role="alert" style={{ color: '#ffb7b7' }}><p style={{ margin: 0 }}>{error}</p>{problems.length > 0 && <ul>{problems.map((p) => <li key={p}>{p}</li>)}</ul>}</div>}
      {skipped.length > 0 && (
        <details style={{ ...box, marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{skipped.length} fight(s) not promoted — why</summary>
          <ul>{skipped.map((s) => <li key={s.fightId}><strong>{s.matchup || s.fightId}</strong>: {s.reasons.join(' ')}</li>)}</ul>
        </details>
      )}
      {!campaigns.length && !error && <p>No fight campaign drafts yet. Press the red button to prepare them.</p>}
      {campaigns.map((c) => {
        const expanded = open === c._id;
        return (
          <div key={c._id} style={{ ...box, borderColor: STATE_COLORS[c.state] || '#394152' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: '0 0 4px' }}>{c.matchup}{c.eventName ? ' · ' + c.eventName : ''}</h3>
                <p style={{ margin: 0, color: '#d4d9e3' }}>{c.schedule?.dateText} · {c.schedule?.timeText}{c.venue ? ' · ' + c.venue : ''} · {c.sportName}</p>
                <p style={{ margin: '4px 0 0', color: '#aebbd0' }}>{c.affiliateId ? 'Affiliate campaign: ' + (c.affiliateName || c.affiliateId) : 'Owner campaign (FANTASY MMADNESS accounts)'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: STATE_COLORS[c.state] || '#555', fontWeight: 700 }}>{STATE_LABELS[c.state] || c.state}</span>
              </div>
            </div>
            {c.liveCheck && !c.liveCheck.ok && <p style={{ color: '#ffb7b7' }}>Live Fight Registry check: {c.liveCheck.reasons.join(' ')}</p>}
            {c.validation?.blocking?.length > 0 && <p style={{ color: '#ffb7b7' }}>Blocked: {c.validation.blocking.join(' ')}</p>}
            {c.validation?.warnings?.length > 0 && <p style={{ color: '#ffd59a' }}>Needs attention: {c.validation.warnings.join(' ')}</p>}
            {c.validation?.reviewFailures?.length > 0 && <p style={{ color: '#ffb7b7' }}>Problems you marked: {c.validation.reviewFailures.join(' · ')}</p>}
            {c.research?.matchingNews?.length > 0 && <p style={{ color: '#aebbd0', fontSize: 13 }}>Research: {c.research.matchingNews.length} news lead(s) mention these fighters · {c.research.suggestedAudiences?.length || 0} saved {c.sportName} audiences (not contacted)</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <button type="button" onClick={() => setOpen(expanded ? '' : c._id)} style={btn('#36455d')}>{expanded ? 'Hide previews' : 'Preview and check each channel'}</button>
              {['draft', 'needs_review'].includes(c.state) && <button type="button" disabled={busy} onClick={() => setStatus(c, 'approved')} style={btn('#186b42')}>Approve draft (does not post)</button>}
              {c.state === 'approved' && <button type="button" disabled={busy} onClick={() => setStatus(c, 'needs_review')} style={btn('#a86a12')}>Move back to review</button>}
              {c.state === 'draft' && <button type="button" disabled={busy} onClick={() => setStatus(c, 'needs_review')} style={btn('#a86a12')}>Flag for review</button>}
            </div>
            {expanded && (
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {Object.entries(c.channels || {}).map(([name, channel]) => (
                  <ChannelPreview key={name} campaign={c} name={name} channel={channel} checks={meta.checks} checkLabels={meta.checkLabels} busy={busy} onCheck={(ch, chk, result, note) => check(c, ch, chk, result, note)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
