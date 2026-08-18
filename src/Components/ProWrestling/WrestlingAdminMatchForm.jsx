import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaCoins,
  FaImage,
  FaSave,
  FaShieldAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import {
  getWrestlerImage,
  nextStatusOptions,
  safeWrestlingArray,
  wrestlingRequest,
} from '@/Utils/proWrestling';

const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const INITIAL = {
  eventName: '',
  promotionName: '',
  matchTitle: '',
  matchFormat: 'SINGLES',
  competitorAId: '',
  competitorBId: '',
  matchDate: '',
  lockAt: '',
  matchTime: '',
  entryFeeTokens: 0,
  basePot: 0,
  minimumParticipants: 0,
  maximumParticipants: 0,
  status: 'DRAFT',
  description: '',
  bannerImageUrl: '',
  scoringRuleVersion: '',
  payoutRuleVersion: '',
  featured: false,
  publicVisible: true,
  autoCancelIfMinimumNotMet: true,
  affiliateId: '',
  affiliateCommissionPercentage: 0,
  referralCode: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
};

const WrestlingAdminMatchForm = ({ matchId }) => {
  const router = useRouter();
  const isEdit = Boolean(matchId);
  const [form, setForm] = useState(INITIAL);
  const [wrestlers, setWrestlers] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [scoringRules, setScoringRules] = useState([]);
  const [payoutRules, setPayoutRules] = useState([]);
  const [matchCounts, setMatchCounts] = useState({ entries: 0, predictions: 0 });
  const [originalStatus, setOriginalStatus] = useState('DRAFT');
  const [bannerFile, setBannerFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
        const affiliateResult = await wrestlingRequest('/affiliates').catch(() => []);
        const matchPayload = isEdit
          ? await wrestlingRequest(`/api/admin/wrestling/matches/${matchId}`, { admin: true })
          : null;

        if (!active) return;
        const roster = safeWrestlingArray(wrestlerPayload?.data);
        const scoring = safeWrestlingArray(scoringPayload);
        const payouts = safeWrestlingArray(payoutPayload);
        const match = matchPayload?.match || null;

        setWrestlers(roster);
        setAffiliates(safeWrestlingArray(affiliateResult?.data || affiliateResult));
        setScoringRules(scoring);
        setPayoutRules(payouts);
        setMatchCounts(matchPayload?.counts || { entries: 0, predictions: 0 });

        if (match) {
          setOriginalStatus(match.status || 'DRAFT');
          setForm({
            eventName: match.eventName || '',
            promotionName: match.promotionName || '',
            matchTitle: match.matchTitle || '',
            matchFormat: match.matchFormat || 'SINGLES',
            competitorAId: String(match.competitorA?.wrestlerId || ''),
            competitorBId: String(match.competitorB?.wrestlerId || ''),
            matchDate: toLocalInput(match.matchDate),
            lockAt: toLocalInput(match.lockAt),
            matchTime: match.matchTime || '',
            entryFeeTokens: match.entryFeeTokens ?? 0,
            basePot: match.basePot ?? 0,
            minimumParticipants: match.minimumParticipants ?? 0,
            maximumParticipants: match.maximumParticipants ?? 0,
            status: match.status || 'DRAFT',
            description: match.description || '',
            bannerImageUrl: match.bannerImage || '',
            scoringRuleVersion: match.scoringRuleVersion || '',
            payoutRuleVersion: match.payoutRuleVersion || '',
            featured: Boolean(match.featured),
            publicVisible: match.publicVisible !== false,
            autoCancelIfMinimumNotMet: match.autoCancelIfMinimumNotMet !== false,
            affiliateId: String(match.affiliateId || ''),
            affiliateCommissionPercentage: match.affiliateCommissionPercentage ?? 0,
            referralCode: match.referralCode || '',
            seoTitle: match.seo?.title || '',
            seoDescription: match.seo?.description || '',
            seoKeywords: safeWrestlingArray(match.seo?.keywords).join(', '),
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
  }, [isEdit, matchId]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const selectedA = useMemo(() => wrestlers.find((item) => String(item._id) === String(form.competitorAId)), [form.competitorAId, wrestlers]);
  const selectedB = useMemo(() => wrestlers.find((item) => String(item._id) === String(form.competitorBId)), [form.competitorBId, wrestlers]);
  const selectedAffiliate = useMemo(() => affiliates.find((item) => String(item._id) === String(form.affiliateId)), [affiliates, form.affiliateId]);
  const identityLocked = isEdit && (originalStatus !== 'DRAFT' || Number(matchCounts.entries || 0) > 0);
  const statusOptions = useMemo(() => {
    if (!isEdit) return ['DRAFT', 'OPEN'];
    return Array.from(new Set([originalStatus, ...nextStatusOptions(originalStatus)]));
  }, [isEdit, originalStatus]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.competitorAId || !form.competitorBId || form.competitorAId === form.competitorBId) {
      toast.error('Select two different wrestlers.');
      return;
    }

    const matchDate = new Date(form.matchDate);
    const lockAt = new Date(form.lockAt);
    if (Number.isNaN(matchDate.getTime()) || Number.isNaN(lockAt.getTime()) || lockAt >= matchDate) {
      toast.error('Prediction lock time must occur before the match date and time.');
      return;
    }
    if (Number(form.maximumParticipants) > 0 && Number(form.minimumParticipants) > Number(form.maximumParticipants)) {
      toast.error('Minimum participants cannot exceed maximum participants.');
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (['seoTitle', 'seoDescription', 'seoKeywords'].includes(key)) return;
        body.append(key, typeof value === 'boolean' ? String(value) : value ?? '');
      });
      body.set('matchDate', matchDate.toISOString());
      body.set('lockAt', lockAt.toISOString());
      body.set('seo', JSON.stringify({
        title: form.seoTitle,
        description: form.seoDescription,
        keywords: form.seoKeywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
      }));
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
      router.push(`/administration/pro-wrestling/${result?._id || matchId}`);
    } catch (requestError) {
      toast.error(requestError.message || 'The wrestling contest could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pw-admin-page"><div className="pw-admin-loading">Loading wrestling contest form…</div></div>;

  return (
    <>
      <Head><title>{isEdit ? 'Edit' : 'Create'} Pro Wrestling Contest | FMM Administration</title></Head>
      <div className="pw-admin-page pw-admin-match-form-page">
        <div className="pw-admin-form-heading">
          <Link href="/administration/pro-wrestling"><FaArrowLeft /> Wrestling registry</Link>
          <p>{isEdit ? 'Contest configuration' : 'New game-mode card'}</p>
          <h1>{isEdit ? 'Edit wrestling contest' : 'Create wrestling contest'}</h1>
          <span>Configure the complete wrestling contest while keeping every existing combat-sports model and route isolated.</span>
        </div>
        {error && <div className="pw-admin-error">{error}</div>}

        <form className="pw-admin-form" onSubmit={submit}>
          <section className="pw-admin-form-section">
            <header><span>01</span><div><h2>Event identity</h2><p>Name the promotion, event, contest, and match format.</p></div></header>
            <div className="pw-admin-field-grid">
              <label><span>Event name *</span><input required value={form.eventName} onChange={(event) => update('eventName', event.target.value)} /></label>
              <label><span>Promotion name</span><input value={form.promotionName} onChange={(event) => update('promotionName', event.target.value)} /></label>
              <label className="is-wide"><span>Match title *</span><input required value={form.matchTitle} onChange={(event) => update('matchTitle', event.target.value)} placeholder="Wrestler A vs Wrestler B" /></label>
              <label><span>Match format</span><select value={form.matchFormat} disabled={identityLocked} onChange={(event) => update('matchFormat', event.target.value)}>{['SINGLES', 'TAG_TEAM', 'TRIPLE_THREAT', 'FATAL_FOUR_WAY'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>{isEdit ? 'Contest status' : 'Initial status'}</span><select value={form.status} onChange={(event) => update('status', event.target.value)}>{statusOptions.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select>{isEdit && form.status !== originalStatus && <small className="pw-admin-status-change-note">Saving will move this contest from {originalStatus} to {form.status} through the protected lifecycle endpoint.</small>}</label>
              <label className="is-wide"><span>Description</span><textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows="4" /></label>
              {identityLocked && <div className="pw-admin-field-notice is-wide"><FaShieldAlt /><span><strong>Contest identity is protected.</strong><small>Competitors, rules, entry fee, and base pot become immutable after publication or first entry.</small></span></div>}
            </div>
          </section>

          <section className="pw-admin-form-section">
            <header><span>02</span><div><h2>Wrestling corners</h2><p>Select the two roster profiles competing in this card.</p></div></header>
            <div className="pw-admin-competitor-picker">
              <label>
                <span>Competitor A *</span>
                <select required value={form.competitorAId} disabled={identityLocked} onChange={(event) => update('competitorAId', event.target.value)}><option value="">Select wrestler</option>{wrestlers.map((item) => <option key={item._id} value={item._id}>{item.displayName} · {item.promotion || 'Pro Wrestling'}</option>)}</select>
                {selectedA && <div><img src={selectedA.profileImage || getWrestlerImage(null, 'A')} alt="" /><strong>{selectedA.displayName}</strong><small>{selectedA.wrestlingStyle || 'Roster competitor'}</small></div>}
              </label>
              <b>VS</b>
              <label>
                <span>Competitor B *</span>
                <select required value={form.competitorBId} disabled={identityLocked} onChange={(event) => update('competitorBId', event.target.value)}><option value="">Select wrestler</option>{wrestlers.map((item) => <option key={item._id} value={item._id}>{item.displayName} · {item.promotion || 'Pro Wrestling'}</option>)}</select>
                {selectedB && <div><img src={selectedB.profileImage || getWrestlerImage(null, 'B')} alt="" /><strong>{selectedB.displayName}</strong><small>{selectedB.wrestlingStyle || 'Roster competitor'}</small></div>}
              </label>
            </div>
          </section>

          <section className="pw-admin-form-section">
            <header><span>03</span><div><h2>Schedule, entry, and pot</h2><p>Configure lock enforcement, wallet cost, and participation thresholds.</p></div></header>
            <div className="pw-admin-field-grid">
              <label><span>Match date/time *</span><input type="datetime-local" required value={form.matchDate} onChange={(event) => update('matchDate', event.target.value)} /></label>
              <label><span>Prediction lock *</span><input type="datetime-local" required value={form.lockAt} onChange={(event) => update('lockAt', event.target.value)} /></label>
              <label><span>Display time</span><input value={form.matchTime} onChange={(event) => update('matchTime', event.target.value)} placeholder="8:00 PM EST" /></label>
              <label><span>Entry fee tokens</span><input type="number" min="0" disabled={identityLocked} value={form.entryFeeTokens} onChange={(event) => update('entryFeeTokens', event.target.value)} /></label>
              <label><span>Base pot</span><input type="number" min="0" disabled={identityLocked} value={form.basePot} onChange={(event) => update('basePot', event.target.value)} /></label>
              <label><span>Minimum participants</span><input type="number" min="0" value={form.minimumParticipants} onChange={(event) => update('minimumParticipants', event.target.value)} /></label>
              <label><span>Maximum participants</span><input type="number" min="0" value={form.maximumParticipants} onChange={(event) => update('maximumParticipants', event.target.value)} /></label>
            </div>
          </section>

          <section className="pw-admin-form-section">
            <header><span>04</span><div><h2>Affiliate attribution</h2><p>Optionally assign a creator campaign and commission.</p></div></header>
            <div className="pw-admin-field-grid">
              <label className="is-wide"><span>Assigned affiliate</span><select value={form.affiliateId} onChange={(event) => update('affiliateId', event.target.value)}><option value="">No affiliate assigned</option>{affiliates.map((affiliate) => <option key={affiliate._id} value={affiliate._id}>{affiliate.playerName || `${affiliate.firstName || ''} ${affiliate.lastName || ''}`.trim() || affiliate.email}</option>)}</select></label>
              <label><span>Affiliate commission %</span><input type="number" min="0" max="100" value={form.affiliateCommissionPercentage} onChange={(event) => update('affiliateCommissionPercentage', event.target.value)} /></label>
              <label><span>Referral code</span><input value={form.referralCode} onChange={(event) => update('referralCode', event.target.value)} /></label>
              {selectedAffiliate && <div className="pw-admin-affiliate-preview is-wide"><FaUsers /><span><small>Assigned creator</small><strong>{selectedAffiliate.playerName || `${selectedAffiliate.firstName || ''} ${selectedAffiliate.lastName || ''}`.trim()}</strong><em>{selectedAffiliate.email || 'Affiliate account'}</em></span></div>}
            </div>
          </section>

          <section className="pw-admin-form-section">
            <header><span>05</span><div><h2>Rules and publishing</h2><p>Choose versioned rules, visibility, cancellation behavior, and media.</p></div></header>
            <div className="pw-admin-field-grid">
              <label><span>Scoring ruleset</span><select value={form.scoringRuleVersion} disabled={identityLocked} onChange={(event) => update('scoringRuleVersion', event.target.value)}>{scoringRules.map((rule) => <option key={rule.ruleId} value={rule.ruleId}>{rule.name} ({rule.ruleId})</option>)}</select></label>
              <label><span>Payout ruleset</span><select value={form.payoutRuleVersion} disabled={identityLocked} onChange={(event) => update('payoutRuleVersion', event.target.value)}>{payoutRules.map((rule) => <option key={rule.ruleId} value={rule.ruleId}>{rule.name} ({rule.ruleId})</option>)}</select></label>
              <label className="is-wide"><span>Banner image URL</span><input value={form.bannerImageUrl} onChange={(event) => update('bannerImageUrl', event.target.value)} /></label>
              <label className="pw-file-field"><FaImage /><span>Upload banner image</span><input type="file" accept="image/*" onChange={(event) => setBannerFile(event.target.files?.[0] || null)} /><small>{bannerFile?.name || 'Optional Cloudinary upload'}</small></label>
              {(bannerFile || form.bannerImageUrl) && <div className="pw-admin-banner-preview"><img src={bannerFile ? URL.createObjectURL(bannerFile) : form.bannerImageUrl} alt="Contest banner preview" /></div>}
              <div className="pw-admin-toggle-grid is-wide">
                <label><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /><span><strong>Featured contest</strong><small>Prioritize this card in public discovery.</small></span></label>
                <label><input type="checkbox" checked={form.publicVisible} onChange={(event) => update('publicVisible', event.target.checked)} /><span><strong>Publicly visible</strong><small>Allow public contest discovery.</small></span></label>
                <label><input type="checkbox" checked={form.autoCancelIfMinimumNotMet} onChange={(event) => update('autoCancelIfMinimumNotMet', event.target.checked)} /><span><strong>Auto-cancel below minimum</strong><small>Scheduled maintenance refunds eligible entries.</small></span></label>
              </div>
              <label><span>SEO title</span><input value={form.seoTitle} onChange={(event) => update('seoTitle', event.target.value)} /></label>
              <label className="is-wide"><span>SEO description</span><textarea value={form.seoDescription} onChange={(event) => update('seoDescription', event.target.value)} rows="3" /></label>
              <label className="is-wide"><span>SEO keywords (comma separated)</span><input value={form.seoKeywords} onChange={(event) => update('seoKeywords', event.target.value)} /></label>
            </div>
          </section>

          <footer className="pw-admin-form-footer">
            <div><FaShieldAlt /><span><strong>Additive game-mode record</strong><small>This form writes only to the Pro Wrestling collections.</small></span></div>
            <div><Link href="/administration/pro-wrestling" className="pw-admin-secondary">Cancel</Link><button type="submit" className="pw-admin-primary" disabled={saving}><FaSave /> {saving ? 'Saving…' : isEdit ? 'Save contest changes' : 'Create wrestling contest'}</button></div>
          </footer>
        </form>
      </div>
    </>
  );
};

export default WrestlingAdminMatchForm;
