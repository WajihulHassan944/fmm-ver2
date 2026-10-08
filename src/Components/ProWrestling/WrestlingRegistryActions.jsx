import React, { useState } from 'react';
import Link from 'next/link';
import styles from './WrestlingRegistryActions.module.css';
import { toast } from 'react-toastify';
import { wrestlingRequest, nextStatusOptions } from '@/Utils/proWrestling';

export default function WrestlingRegistryActions({ match, onUpdated, placementOnly = false, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');
  const [assignments, setAssignments] = useState([]);
  const id = match._id;
  const run = async (path, body, method = 'PATCH') => {
    setBusy(true);
    try {
      const payload = await wrestlingRequest(path, { admin: true, method, body });
      toast.success(payload.message || 'Wrestling contest updated.');
      await onUpdated();
      return payload;
    } catch (error) { toast.error(error.message); return null; }
    finally { setBusy(false); }
  };
  const promote = (slot) => run(`/api/admin/fights/${id}/homepage-promotion`, {
    sourceType: 'PRO_WRESTLING', homepagePromoted: slot > 0, homepageSlot: slot,
    homepagePromotionTitle: match.eventName, homepagePromotionSubtitle: match.matchTitle,
  });
  const place = (surface, field) => run(`/api/admin/fights/${id}/homepage-placement`, {
    sourceType: 'PRO_WRESTLING', surface, selected: !match[field],
  });
  const showInvite = async () => {
    setInvite(true);
    try { const result = await wrestlingRequest(`/api/admin/fights/${id}/scorers`, { admin: true }); setAssignments(result.assignments || []); }
    catch (error) { toast.error(error.message); }
  };
  const send = async (event) => {
    event.preventDefault();
    const result = await run(`/api/admin/fights/${id}/scorers`, { sourceType: 'PRO_WRESTLING', mode: 'link', scorerName: name, scorerEmail: email }, 'POST');
    if (!result) return;
    setLink(result.link || '');
    if (result.emailSent) toast.success('Scoring invitation emailed.');
    else toast.error(result.emailError || 'Email was not sent. Copy the scoring link below.');
    const history = await wrestlingRequest(`/api/admin/fights/${id}/scorers`, { admin: true }).catch(() => null);
    if (history) setAssignments(history.assignments || []);
  };
  if (placementOnly) return <div className={styles.placement}>
      <select aria-label={`Homepage placement for ${match.matchTitle}`} id={`wrestling-slot-${id}`} value={match.homepagePromoted ? match.homepageSlot || 0 : 0} disabled={busy} onChange={(event) => promote(Number(event.target.value))}>
        <option value={0}>Not shown</option>
        {[1,2,3,4,5].map((slot) => <option key={slot} value={slot}>Homepage {slot}</option>)}
      </select>
      <small>{match.homepagePromoted && match.homepageSlot ? `Shown: Homepage ${match.homepageSlot}` : 'Not shown in homepage banner'}</small>
      {(match.publicVisible === false || match.status === 'DRAFT') && <small>Publish the match to make its placement visible to players.</small>}
    </div>;
  return <div className={styles.actions}>
    <div className={styles.primary}><Link href={`/administration/pro-wrestling/${id}`}>Economics</Link><Link href={`/administration/pro-wrestling/${id}/scoring`}>{match.status === 'FINALIZED' ? 'Scores' : 'Score'}</Link></div>
    <details className={styles.more}>
    <summary>More actions</summary>
    <div className={styles.menu}>
      <button type="button" disabled={busy} onClick={() => place('featured-this-week', 'featuredThisWeek')}>{match.featuredThisWeek ? 'Remove from' : 'Show in'} Featured This Week</button>
      <button type="button" disabled={busy} onClick={() => place('featured-fight', 'featuredFight')}>{match.featuredFight ? 'Remove from' : 'Show in'} Featured Fight</button>

      <Link href={`/administration/pro-wrestling/${id}`}>Edit match / economics</Link>
      <Link href={`/administration/pro-wrestling/${id}/scoring`}>Score / results / entries / payouts</Link>
      <Link href={`/administration/growth?fightId=${id}`}>Promote / poster / affiliate outreach</Link>
      {nextStatusOptions(match.status).map((status) => <button key={status} type="button" disabled={busy} onClick={() => run(`/api/admin/wrestling/matches/${id}/status`, { status }, 'PUT')}>{status === 'LOCKED' ? 'Close entries now' : `Set ${status.toLowerCase()}`}</button>)}
      <button type="button" disabled={busy} onClick={showInvite}>Send to employee scorer</button>
      {invite && <section aria-label="Scorer assignment">
        <form onSubmit={send} style={{ display: 'grid', gap: 8 }}>
          <label>Employee name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Employee email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <button type="submit" disabled={busy}>Create link and email scorer</button>
        </form>
        {link && <><label>Scoring link<input readOnly value={link} onFocus={(event) => event.target.select()} /></label><button type="button" onClick={() => navigator.clipboard.writeText(link).then(() => toast.success('Link copied.')).catch(() => toast.error('Select and copy the link.'))}>Copy scoring link</button></>}
        {assignments.map((assignment) => <p key={assignment._id}>{assignment.scorerName || assignment.scorerEmail} {assignment.revokedAt ? '(revoked)' : <button type="button" disabled={busy} onClick={async () => { await run(`/api/admin/scorer-assignments/${assignment._id}`, undefined, 'DELETE'); await showInvite(); }}>Revoke access</button>}</p>)}
      </section>}
      <Link href={`/pro-wrestling/matches/${id}`} target="_blank" rel="noopener noreferrer">View on website</Link>
      {onDelete && match.status === 'DRAFT' && Number(match.participantCount || 0) === 0 && <button type="button" onClick={onDelete}>Delete draft</button>}
      <Link href={`/administration/swarm?tab=jobs&fightId=${id}&scopeLabel=${encodeURIComponent(match.matchTitle)}`}>Swarm jobs</Link>
    </div>
  </details></div>;
}
