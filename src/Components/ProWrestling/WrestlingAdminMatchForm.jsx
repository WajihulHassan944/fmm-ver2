import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DirectFighterEntry from '@/Components/Admin/DirectFighterEntry';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaImage, FaSave, FaShieldAlt, FaTrophy, FaUsers } from 'react-icons/fa';
import { FMCoin as FaCoins } from '@/Components/Common/FMCoin';
import {
  getWrestlerImage,
  nextStatusOptions,
  safeWrestlingArray,
  wrestlingRequest,
  WRESTLING_TIME_RANGES,
} from '@/Utils/proWrestling';

const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const FM_COINS_PER_PACK = 5000;
const USD_PER_PACK = 3.99;
const usdToCoins = (value) => Math.max(0, Math.round((Number(value) || 0) * FM_COINS_PER_PACK / USD_PER_PACK));
const coinsToUsd = (value) => ((Number(value) || 0) * USD_PER_PACK / FM_COINS_PER_PACK).toFixed(2);

const INITIAL = {
  eventName: '',
  matchTitle: '',
  matchFormat: 'SINGLES',
  competitorAId: '',
  competitorBId: '',
  matchDate: '',
  lockAt: '',
  startTime: '',
  timeTba: false,
  earlyCutoff: false,
  entryFeeTokens: 0,
  basePot: 0,
  minimumParticipants: 0,
  maximumParticipants: 0,
  status: 'OPEN',
  description: '',
  bannerImageUrl: '',
  scoringRuleVersion: '',
  payoutRuleVersion: '',
  notify: false,
  featured: false,
  publicVisible: true,
  autoCancelIfMinimumNotMet: true,
};

const WrestlingAdminMatchForm = ({ matchId }) => {
  const router = useRouter();
  const isEdit = Boolean(matchId);
  const [form, setForm] = useState(INITIAL);
  const [cornerUploads, setCornerUploads] = useState({ A: { name: '', file: null }, B: { name: '', file: null } });
  const [cornerPreviews, setCornerPreviews] = useState({ A: '', B: '' });
  useEffect(() => {
    const previews = Object.fromEntries(['A', 'B'].map((side) => [side, cornerUploads[side].file ? URL.createObjectURL(cornerUploads[side].file) : '']));
    setCornerPreviews(previews);
    return () => Object.values(previews).forEach((url) => { if (url) URL.revokeObjectURL(url); });
  }, [cornerUploads]);
  const [cashAmounts, setCashAmounts] = useState({ entry: '', pot: '' });
  const [wrestlers, setWrestlers] = useState([]);
  const [scoringRules, setScoringRules] = useState([]);
  const [payoutRules, setPayoutRules] = useState([]);
  const [matchCounts, setMatchCounts] = useState({ entries: 0, predictions: 0 });
  const [originalStatus, setOriginalStatus] = useState('DRAFT');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  useEffect(() => {
    const url = bannerFile ? URL.createObjectURL(bannerFile) : '';
    setBannerPreview(url);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [bannerFile]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const submitLock = useRef(false);
  const [error, setError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const baseRequests = await Promise.all([
          wrestlingRequest('/api/admin/wrestling/wrestlers?limit=100&active=true', { admin: true }),
          wrestlingRequest('/api/admin/wrestling/scoring-rules', { admin: true }),
          wrestlingRequest('/api/admin/wrestling/payout-rules', { admin: true }),
        ]);
        const [wrestlerPayload, scoringPayload, payoutPayload] = baseRequests;
        const matchPayload = isEdit
          ? await wrestlingRequest(`/api/admin/wrestling/matches/${matchId}`, { admin: true })
          : null;

        if (!active) return;
        const roster = safeWrestlingArray(wrestlerPayload?.data);
        const scoring = safeWrestlingArray(scoringPayload);
        const payouts = safeWrestlingArray(payoutPayload);
        const match = matchPayload?.match || null;

        setWrestlers(roster);
        setScoringRules(scoring);
        setPayoutRules(payouts);
        setMatchCounts(matchPayload?.counts || { entries: 0, predictions: 0 });

        if (match) {
          setCashAmounts({ entry: coinsToUsd(match.entryFeeTokens), pot: coinsToUsd(match.basePot) });
          setOriginalStatus(match.status || 'DRAFT');
          setForm({
            eventName: match.eventName || '',
            matchTitle: match.matchTitle || '',
            matchFormat: match.matchFormat || 'SINGLES',
            competitorAId: String(match.competitorA?.wrestlerId || ''),
            competitorBId: String(match.competitorB?.wrestlerId || ''),
            matchDate: match.eventDate || toLocalInput(match.matchDate).slice(0, 10),
            lockAt: toLocalInput(match.lockAt),
            startTime: toLocalInput(match.matchDate).slice(11, 16),
            timeTba: Boolean(match.timeTba),
            earlyCutoff: Boolean(match.lockAt && match.matchDate && new Date(match.lockAt) < new Date(match.matchDate)),
            entryFeeTokens: match.entryFeeTokens ?? 0,
            basePot: match.basePot ?? 0,
            minimumParticipants: match.minimumParticipants ?? 0,
            maximumParticipants: match.maximumParticipants ?? 0,
            status: match.status || 'DRAFT',
            description: match.description || '',
            bannerImageUrl: match.bannerImage || '',
            scoringRuleVersion: match.scoringRuleVersion || '',
            payoutRuleVersion: match.payoutRuleVersion || '',
            notify: Boolean(match.notify),
            featured: Boolean(match.featured),
            publicVisible: match.publicVisible !== false,
            autoCancelIfMinimumNotMet: match.autoCancelIfMinimumNotMet !== false,
          });
        } else {
          setOriginalStatus('DRAFT');
          setForm((current) => ({
            ...current,
            scoringRuleVersion: scoring[0]?.ruleId || '',
            payoutRuleVersion: payouts[0]?.ruleId || '',
          }));
        }
      } catch (requestError) {
        if (active) setError(requestError.message || 'The wrestling contest form could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [isEdit, matchId, loadAttempt]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateCash = (key, value) => {
    setCashAmounts((current) => ({ ...current, [key]: value }));
    update(key === 'entry' ? 'entryFeeTokens' : 'basePot', usdToCoins(value));
  };
  const selectedA = useMemo(() => wrestlers.find((item) => String(item._id) === String(form.competitorAId)), [form.competitorAId, wrestlers]);
  const selectedB = useMemo(() => wrestlers.find((item) => String(item._id) === String(form.competitorBId)), [form.competitorBId, wrestlers]);
  const identityLocked = isEdit && (originalStatus !== 'DRAFT' || Number(matchCounts.entries || 0) > 0);
  const statusOptions = useMemo(() => {
    if (!isEdit) return ['DRAFT', 'OPEN'];
    return Array.from(new Set([originalStatus, ...nextStatusOptions(originalStatus)]));
  }, [isEdit, originalStatus]);

  const submit = async (event) => {
    event.preventDefault();
    if (submitLock.current) return;
    if (!form.competitorAId || !form.competitorBId || (form.competitorAId !== '__upload__' && form.competitorAId === form.competitorBId)) {
      toast.error('Select two different wrestlers.');
      return;
    }

    for (const side of ['A', 'B']) {
      if (form[`competitor${side}Id`] === '__upload__' && (!cornerUploads[side].name.trim() || !cornerUploads[side].file)) {
        toast.error(`Enter a name and upload a photo for Wrestler ${side}.`);
        return;
      }
    }
    if (form.competitorAId === '__upload__' && form.competitorBId === '__upload__' && cornerUploads.A.name.trim().toLowerCase() === cornerUploads.B.name.trim().toLowerCase()) {
      toast.error('Select two different wrestlers.');
      return;
    }
    const matchDate = form.timeTba ? null : new Date(`${form.matchDate}T${form.startTime}`);
    const lockAt = form.timeTba ? null : form.earlyCutoff ? new Date(form.lockAt) : matchDate;
    if (!form.timeTba && (Number.isNaN(matchDate.getTime()) || Number.isNaN(lockAt.getTime()) || lockAt > matchDate)) {
      toast.error('Enter the start date and time. An earlier cutoff must be at or before the start.');
      return;
    }
    if (Number(form.maximumParticipants) > 0 && Number(form.minimumParticipants) > Number(form.maximumParticipants)) {
      toast.error('Minimum participants cannot exceed maximum participants.');
      return;
    }

    submitLock.current = true;
    setSaving(true);
    try {
      const resolvedCorners = {};
      for (const side of ['A', 'B']) {
        const key = `competitor${side}Id`;
        resolvedCorners[key] = form[key];
        if (form[key] !== '__upload__') continue;
        const uploadBody = new FormData();
        uploadBody.append('displayName', cornerUploads[side].name.trim());
        uploadBody.append('profileImage', cornerUploads[side].file);
        uploadBody.append('promotion', form.eventName);
        const wrestler = await wrestlingRequest('/api/admin/wrestling/wrestlers', { admin: true, method: 'POST', body: uploadBody });
        if (!wrestler?._id) throw new Error(`Wrestler ${side} upload did not return a saved profile.`);
        resolvedCorners[key] = String(wrestler._id);
        setWrestlers((current) => [...current, wrestler]);
        update(key, String(wrestler._id));
      }
      const body = new FormData();
      Object.entries({ ...form, ...resolvedCorners }).forEach(([key, value]) => {
        body.append(key, typeof value === 'boolean' ? String(value) : value ?? '');
      });
      body.delete('startTime');
      body.delete('earlyCutoff');
      body.set('eventDate', form.matchDate);
      body.set('matchDate', matchDate ? matchDate.toISOString() : '');
      body.set('lockAt', lockAt ? lockAt.toISOString() : '');
      body.set('matchTime', form.timeTba ? 'TIME TBA' : matchDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }));
      if (bannerFile) body.append('bannerImage', bannerFile);

      let result = await wrestlingRequest(
        isEdit ? `/api/admin/wrestling/matches/${matchId}` : '/api/admin/wrestling/matches',
        { admin: true, method: isEdit ? 'PUT' : 'POST', body },
      );

      if (isEdit && form.status !== originalStatus) {
        result = await wrestlingRequest(`/api/admin/wrestling/matches/${matchId}/status`, {
          admin: true,
          method: 'PUT',
          body: {
            status: form.status,
            reason: `Status changed from ${originalStatus} to ${form.status} in the wrestling contest editor.`,
          },
        });
        setOriginalStatus(form.status);
      }

      toast.success(isEdit ? 'Wrestling contest updated.' : 'Wrestling contest created.');
      if (result?.memberNotification?.state === 'queued') toast.info('Member emails queued. Delivery status will appear in the registry.');
      if (result?.memberNotification?.state === 'failed') toast.error('Contest saved, but member email delivery failed.');
      router.push(`/administration/pro-wrestling/${result?._id || matchId}`);
    } catch (requestError) {
      toast.error(requestError.message || 'The wrestling contest could not be saved.');
    } finally {
      submitLock.current = false;
      setSaving(false);
    }
  };

  if (loading) return <div className="pw-admin-page"><div className="pw-admin-loading">Loading wrestling contest form…</div></div>;

  return (
    <>
      <Head><title>{isEdit ? 'Edit' : 'Create'} Pro Wrestling Contest | FMM Administration</title></Head>
      <div className="admin-workspace admin-create-fight-page admin-economics-desk admin-operations-v3 admin-operations-v4" data-desk-ui="operations-v4">
        <section className="admin-page-heading admin-operations-hero">
          <div><span>Fight operations · Economics desk 4.0</span><h2>{isEdit ? 'Edit match' : 'Create match'}</h2><p>Build your Pro Wrestling card, set entry and pot, and configure match-time predictions in the same operations desk.</p></div>
          <div className="admin-heading-actions">
            <Link className="admin-action-secondary" href="/administration/pro-wrestling/wrestlers"><FaUsers /> Wrestler library</Link>
            <Link className="admin-action-secondary" href="/administration/pro-wrestling"><FaTrophy /> Wrestling registry</Link>
          </div>
        </section>
        <section className="admin-desk-status-strip" aria-label="Economics desk status">
          <div><span>Desk</span><strong>Economics</strong></div>
          <div><span>Card type</span><strong>Live production</strong></div>
          <div><span>Sport</span><strong>Pro Wrestling</strong></div>
          <div><span>Match timing</span><strong>6 time ranges</strong></div>
          <div className="is-live"><span>Publishing</span><strong>Protected workflow</strong></div>
        </section>
        <nav className="admin-fight-desk-nav admin-operations-workflow" aria-label="Fight desk workflow">
          <Link href="/administration/pro-wrestling/new" className="is-active">Economics desk</Link>
          <Link href={isEdit ? `/administration/pro-wrestling/${matchId}/scoring` : '/administration/pro-wrestling'}>Scoring desk</Link>
          <Link href="/administration/pro-wrestling">Results</Link>
          <Link href="/administration/full-cards">Promotion</Link>
        </nav>
        {error && <div className="admin-inline-notice is-error" role="alert"><span>{error}</span><button type="button" className="admin-action-secondary" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry loading</button></div>}
        <form className="admin-create-fight-layout" onSubmit={submit}>
          <main>
          <section className="admin-form-card admin-desk-section">
            <header><span>01</span><div><h3>Event identity</h3><p>Use the event name for the promotion, then name the match and choose its format.</p></div></header>
            <div className="admin-form-grid">
              <label><span>Event name *</span><input required value={form.eventName} onChange={(event) => update('eventName', event.target.value)} /></label>
              <label className="is-wide"><span>Match title *</span><input required value={form.matchTitle} onChange={(event) => update('matchTitle', event.target.value)} placeholder="Wrestler A vs Wrestler B" /></label>
              <label><span>Match format</span><select value={form.matchFormat} disabled={identityLocked} onChange={(event) => update('matchFormat', event.target.value)}>{['SINGLES', 'TAG_TEAM', 'TRIPLE_THREAT', 'FATAL_FOUR_WAY'].map((value) => <option key={value}>{value}</option>)}</select></label>
              {isEdit && <label><span>Contest status</span><select value={form.status} onChange={(event) => update('status', event.target.value)}>{statusOptions.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select>{isEdit && form.status !== originalStatus && <small className="pw-admin-status-change-note">Saving will move this contest from {originalStatus} to {form.status} through the protected lifecycle endpoint.</small>}</label>}
              <label className="is-wide"><span>Description</span><textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows="4" /></label>
              {identityLocked && <div className="pw-admin-field-notice is-wide"><FaShieldAlt /><span><strong>Contest identity is protected.</strong><small>Wrestlers, rules, player entry, and prize pool are locked after publication or first entry.</small></span></div>}
            </div>
          </section>

          <section className="admin-form-card admin-desk-section">
            <header><span>02</span><div><h3>Wrestling corners</h3><p>Choose a saved wrestler or add a name and photo directly in each corner.</p></div></header>
            <div className="admin-form-grid">
              {['A', 'B'].map((side) => (
                <div key={side}>
                  <label><span>Wrestler {side} *</span><select required={form[`competitor${side}Id`] !== '__upload__'} value={form[`competitor${side}Id`] === '__upload__' ? '' : form[`competitor${side}Id`]} disabled={identityLocked || saving} onChange={(event) => update(`competitor${side}Id`, event.target.value)}>
                    <option value="">Select wrestler</option>
                    {wrestlers.map((item) => <option key={item._id} value={item._id}>{item.displayName} · {item.promotion || 'Pro Wrestling'}</option>)}
                  </select></label>
                  <DirectFighterEntry side={side} name={cornerUploads[side].name} image={cornerUploads[side].file} preview={cornerPreviews[side]} disabled={identityLocked || saving}
                    onNameChange={(name) => { setCornerUploads((current) => ({ ...current, [side]: { ...current[side], name } })); update(`competitor${side}Id`, '__upload__'); }}
                    onImageChange={(file) => { setCornerUploads((current) => ({ ...current, [side]: { ...current[side], file } })); if (file) update(`competitor${side}Id`, '__upload__'); }} />
                </div>
              ))}
            </div>
          </section>

          <section className="admin-form-card admin-desk-section">
            <header><span>03</span><div><h3>Schedule and player economy</h3><p>Set the entry fee and prize pool in USD. Players see the converted FM COINS amounts.</p></div></header>
            <div className="admin-form-grid">
              <label><span>Event date{form.timeTba ? ' (optional)' : ' *'}</span><input type="date" required={!form.timeTba} value={form.matchDate} onChange={(event) => update('matchDate', event.target.value)} /></label>
              <label><span>Start time{form.timeTba ? ' · TIME TBA' : ' *'}</span><input type="time" required={!form.timeTba} disabled={form.timeTba} value={form.timeTba ? '' : form.startTime} onChange={(event) => update('startTime', event.target.value)} /><small>Times use your device’s time zone.</small></label>
              <div className="admin-toggle-grid is-wide"><label><input type="checkbox" checked={form.timeTba} onChange={(event) => update('timeTba', event.target.checked)} /><span><strong>TIME TBA</strong><small>Use when the start time is unconfirmed. The event date can also be left blank.</small></span></label></div>
              <div className="admin-inline-notice is-wide">{form.timeTba ? 'Predictions stay open until you select Lock predictions or Match Started in the Scoring Desk. Do this before the action begins.' : 'Predictions close automatically at the scheduled start time.'}</div>
              {!form.timeTba && <details className="is-wide" open={form.earlyCutoff || undefined}><summary>Optional earlier prediction cutoff</summary><label><input type="checkbox" checked={form.earlyCutoff} onChange={(event) => update('earlyCutoff', event.target.checked)} /> Close predictions before the scheduled start</label>{form.earlyCutoff && <label><span>Earlier cutoff *</span><input type="datetime-local" required value={form.lockAt} onChange={(event) => update('lockAt', event.target.value)} /></label>}</details>}
              <label className="admin-money-conversion-field"><span>Player entry fee (USD)</span><div className="admin-money-input"><b aria-hidden="true">$</b><input type="number" min="0" step="0.01" disabled={identityLocked} value={cashAmounts.entry} onChange={(event) => updateCash('entry', event.target.value)} placeholder="0.00" /></div><small><strong>{Number(form.entryFeeTokens || 0).toLocaleString()} FM COINS</strong> charged to enter</small></label>
              <label className="admin-money-conversion-field"><span>Prize pool (USD)</span><div className="admin-money-input"><b aria-hidden="true">$</b><input type="number" min="0" step="0.01" disabled={identityLocked} value={cashAmounts.pot} onChange={(event) => updateCash('pot', event.target.value)} placeholder="0.00" /></div><small><strong>{Number(form.basePot || 0).toLocaleString()} FM COINS</strong> starting prize pool</small></label>
              <div className="admin-fm-rate-note is-wide"><span>FM COINS conversion</span><strong>$3.99 = 5,000 FM COINS</strong><small>Cash amounts stay in the back office. Player entry uses FM COINS.</small></div>
              <label><span>Minimum participants</span><input type="number" min="0" value={form.minimumParticipants} onChange={(event) => update('minimumParticipants', event.target.value)} /></label>
              <label><span>Maximum participants</span><input type="number" min="0" value={form.maximumParticipants} onChange={(event) => update('maximumParticipants', event.target.value)} /></label>
            </div>
          </section>

          <section className="admin-form-card admin-desk-section">
            <header><span>Match timing</span><div><h3>Match time ranges instead of rounds</h3><p>Players predict when the match will finish. These six ranges apply to every wrestling contest.</p></div></header>
            <div className="admin-form-grid">{WRESTLING_TIME_RANGES.map((range) => <div className="admin-inline-notice" key={range.value}>{range.label}</div>)}</div>
            <p>Predictions close at the scheduled start, an optional earlier cutoff, or when you start a TIME TBA match. In the Scoring Desk, start the live match timer and enter the official duration as MM:SS before finalizing the scores.</p>
          </section>

          <section className="admin-form-card admin-desk-section">
            <header><span>04</span><div><h3>Rules and publishing</h3><p>Choose versioned rules, visibility, cancellation behavior, and media.</p></div></header>
            <div className="admin-form-grid">
              <label><span>Scoring ruleset</span><select value={form.scoringRuleVersion} disabled={identityLocked} onChange={(event) => update('scoringRuleVersion', event.target.value)}>{scoringRules.map((rule) => <option key={rule.ruleId} value={rule.ruleId}>{rule.name} ({rule.ruleId})</option>)}</select></label>
              <label><span>Payout ruleset</span><select value={form.payoutRuleVersion} disabled={identityLocked} onChange={(event) => update('payoutRuleVersion', event.target.value)}>{payoutRules.map((rule) => <option key={rule.ruleId} value={rule.ruleId}>{rule.name} ({rule.ruleId})</option>)}</select></label>
              <label className="is-wide"><span>Banner image URL</span><input value={form.bannerImageUrl} onChange={(event) => update('bannerImageUrl', event.target.value)} /></label>
              <div className="admin-toggle-grid is-wide">
                <label><input type="checkbox" checked={form.notify} onChange={(event) => update('notify', event.target.checked)} /><span><strong>Notify members</strong><small>Email eligible registered members and show this published contest in the notification bell. Sent once per contest.</small></span></label>
                <label><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /><span><strong>Featured contest</strong><small>Prioritize this card in public discovery.</small></span></label>
                <label><input type="checkbox" checked={form.publicVisible} onChange={(event) => update('publicVisible', event.target.checked)} /><span><strong>Publicly visible</strong><small>Allow public contest discovery.</small></span></label>
                <label><input type="checkbox" checked={form.autoCancelIfMinimumNotMet} onChange={(event) => update('autoCancelIfMinimumNotMet', event.target.checked)} /><span><strong>Auto-cancel below minimum</strong><small>Scheduled maintenance refunds eligible entries.</small></span></label>
              </div>
            </div>
          </section>

          </main>
          <aside className="admin-economics-control-rail">
            <div className="admin-control-rail-heading"><span>Live control rail</span><strong>What players will see</strong><small>Updates as this card is configured.</small></div>
            <section className="admin-fight-visual-card" style={{ backgroundImage: `linear-gradient(180deg,rgba(3,8,15,.08),rgba(3,8,15,.95)),url(${bannerPreview || form.bannerImageUrl || '/images/fmm-pages/admin-command-hd.webp'})` }}>
              <span>Live preview · Pro Wrestling</span><h3>{form.matchTitle || 'Untitled match card'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 28px minmax(0, 1fr)', gap: 8, alignItems: 'center' }}>
                <article style={{ minWidth: 0, width: '100%', display: 'grid', gap: 6, textAlign: 'center' }}><div style={{ width: '100%', height: 220, overflow: 'hidden' }}><img src={(form.competitorAId === '__upload__' ? cornerPreviews.A : selectedA?.profileImage) || getWrestlerImage(null, 'A')} alt="Wrestler A preview" style={{ display: 'block', width: '100%', height: '100%', maxHeight: 'none', objectFit: 'contain', objectPosition: 'center' }} /></div><strong>{(form.competitorAId === '__upload__' ? cornerUploads.A.name : selectedA?.displayName) || 'Wrestler A'}</strong></article>
                <b style={{ textAlign: 'center' }}>VS</b>
                <article style={{ minWidth: 0, width: '100%', display: 'grid', gap: 6, textAlign: 'center' }}><div style={{ width: '100%', height: 220, overflow: 'hidden' }}><img src={(form.competitorBId === '__upload__' ? cornerPreviews.B : selectedB?.profileImage) || getWrestlerImage(null, 'B')} alt="Wrestler B preview" style={{ display: 'block', width: '100%', height: '100%', maxHeight: 'none', objectFit: 'contain', objectPosition: 'center' }} /></div><strong>{(form.competitorBId === '__upload__' ? cornerUploads.B.name : selectedB?.displayName) || 'Wrestler B'}</strong></article>
              </div>
              <small>{form.matchDate || 'DATE TBA'} · {form.timeTba ? 'TIME TBA' : form.startTime || 'Start time pending'}</small>
            </section>
            <section className="admin-upload-stack">
              <label><FaImage /><span><strong>Upload fight poster</strong><small>{bannerFile?.name || 'Select your finished fight poster'}</small></span><input hidden type="file" accept="image/*" onChange={(event) => setBannerFile(event.target.files?.[0] || null)} /></label>
            </section>
            {(bannerPreview || form.bannerImageUrl) && <section className="admin-form-card" aria-label="Fight poster preview"><h3>Fight poster</h3><img src={bannerPreview || form.bannerImageUrl} alt="Uploaded fight poster" style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain' }} /></section>}
            <section className="admin-form-card" aria-label="Player economy preview" aria-live="polite">
              <p><FaCoins /> Player entry</p><h3>{Number(form.entryFeeTokens || 0).toLocaleString()} FM COINS</h3>
              <p><FaTrophy /> Prize pool</p><h3>{Number(form.basePot || 0).toLocaleString()} FM COINS</h3>
              <p><FaUsers /> {Number(form.minimumParticipants) || 0} minimum · {Number(form.maximumParticipants) || 'No'} participant limit</p>
            </section>
            <div className="admin-inline-notice"><strong>Match timing replaces rounds.</strong> Players choose one of the six finish-time ranges. Check your entry, pot, and prediction cutoff before saving.</div>
            <button className="admin-primary-action admin-create-submit" type="submit" disabled={saving}><FaSave /> {saving ? 'Saving…' : isEdit ? 'Save match changes' : 'Create match card'}</button>
            <Link className="admin-action-secondary" href="/administration/pro-wrestling"><FaArrowLeft /> Back to registry</Link>
          </aside>
        </form>
      </div>
    </>
  );
};

export default WrestlingAdminMatchForm;
