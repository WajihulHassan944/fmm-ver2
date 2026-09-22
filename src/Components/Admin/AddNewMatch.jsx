import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FaBolt, FaCalendarAlt, FaCloudUploadAlt, FaPlus, FaSave, FaTrophy, FaUsers } from 'react-icons/fa';
import AdminPredictions from './AdminPredictions';
import CombatFighterSelect from './CombatFighterSelect';
import OptimizedImage from '@/Components/Common/OptimizedImage';
import { getCombatFighterId, getCombatFighterImage, getCombatFighterName, normalizeCombatCategory } from '@/Utils/combatFightersApi';
import { adminHeaders } from '@/Utils/authFetch';

const EMPTY = {
  matchCategory: '',
  matchCategoryTwo: '',
  matchName: '',
  matchFighterA: '',
  matchFighterB: '',
  fighterAId: '',
  fighterBId: '',
  matchDescription: '',
  matchVideoUrl: '',
  fighterAImage: null,
  fighterBImage: null,
  matchDate: '',
  matchTime: '',
  matchTokens: '0',
  matchTokensUsd: '',
  pot: '0',
  potUsd: '',
  matchType: 'LIVE',
  maxRounds: '12',
  notify: true,
  addToShadowTemplates: false,
  promotionBackground: null,
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fantasymmadness-game-server-three.vercel.app';
const FALLBACK_A = '/images/fmm-experience/fighter-action-red.webp';
const FALLBACK_B = '/images/fmm-experience/fighter-action-blue.webp';
const FALLBACK_PROMOTION = '/images/fmm-pages/admin-command-hd.webp';

const normaliseCategory = (value) => {
  if (value === 'kickboxing') return { matchCategory: 'mma', matchCategoryTwo: 'kickboxing' };
  if (value === 'Bare-knuckle') return { matchCategory: 'boxing', matchCategoryTwo: 'Bare-knuckle' };
  return { matchCategory: value, matchCategoryTwo: '' };
};

// Starting round counts only — the field stays editable. Boxing runs twelve;
// MMA, kickboxing and bare knuckle all run five.
const DEFAULT_ROUNDS = { boxing: '12', 'Bare-knuckle': '5', mma: '5', kickboxing: '5' };
const ROUND_PRESETS = ['3', '5', '10', '12'];
const TOKEN_PACK_SIZE = 5000;
const TOKEN_PACK_USD = 3.99;
const TOKEN_USD_RATE = TOKEN_PACK_USD / TOKEN_PACK_SIZE;
const usdToTokens = (dollars) => String(Math.max(0, Math.round((Number(dollars) || 0) / TOKEN_USD_RATE)));
const normalizeFightText = (value) => String(value || '').trim().toLowerCase();

const UniformFighterPreview = ({ src, fallbackSrc, alt }) => {
  const [trimmedSrc, setTrimmedSrc] = useState(src);

  useEffect(() => {
    let active = true;
    setTrimmedSrc(src);
    if (!src || typeof window === 'undefined') return () => { active = false; };

    const image = new window.Image();
    if (/^https?:/i.test(src)) image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let left = canvas.width;
        let right = 0;
        let top = canvas.height;
        let bottom = 0;
        for (let y = 0; y < canvas.height; y += 1) {
          for (let x = 0; x < canvas.width; x += 1) {
            if (pixels[((y * canvas.width + x) * 4) + 3] <= 8) continue;
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
        if (right <= left || bottom <= top) return;
        const padding = Math.max(2, Math.round(Math.max(right - left, bottom - top) * 0.025));
        const cropLeft = Math.max(0, left - padding);
        const cropTop = Math.max(0, top - padding);
        const cropWidth = Math.min(canvas.width - cropLeft, right - left + 1 + (padding * 2));
        const cropHeight = Math.min(canvas.height - cropTop, bottom - top + 1 + (padding * 2));
        const cropped = document.createElement('canvas');
        cropped.width = cropWidth;
        cropped.height = cropHeight;
        cropped.getContext('2d').drawImage(canvas, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        if (active) setTrimmedSrc(cropped.toDataURL('image/png'));
      } catch (_error) {
        // Cross-origin images without canvas access still render normally.
      }
    };
    image.src = src;
    return () => { active = false; };
  }, [src]);

  return (
    <span className="admin-uniform-fighter-preview">
      <OptimizedImage src={trimmedSrc || fallbackSrc} fallbackSrc={fallbackSrc} alt={alt} width={220} height={220} sizes="220px" />
    </span>
  );
};

const DirectFighterEntry = ({ side, name, image, preview, onNameChange, onImageChange }) => (
  <section className="admin-direct-fighter-card" aria-label={`Create Fighter ${side} with a photo`}>
    <div className="admin-direct-fighter-heading">
      <span>New fighter {side}</span>
      <small>Not in the library? Add them here.</small>
    </div>
    <div className="admin-direct-fighter-fields">
      <input type="text" aria-label={`Fighter ${side} name`} placeholder={`Fighter ${side} name`} value={name} onChange={(event) => onNameChange(event.target.value)} />
      <label className={`admin-direct-fighter-upload ${image ? 'has-image' : ''}`}>
        <OptimizedImage src={image ? preview : (side === 'A' ? FALLBACK_A : FALLBACK_B)} fallbackSrc={side === 'A' ? FALLBACK_A : FALLBACK_B} alt={image ? `${name || `Fighter ${side}`} upload preview` : ''} width={54} height={54} sizes="54px" />
        <span>
          <strong><FaCloudUploadAlt /> {image ? 'Change picture' : 'Upload fighter picture'}</strong>
          <small>{image?.name || 'JPG, PNG or WEBP'}</small>
        </span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onImageChange(event.target.files?.[0] || null)} />
      </label>
    </div>
    <small className="admin-direct-fighter-note">The fighter and original picture will be saved to the fighter library when this fight is published.</small>
  </section>
);

const appendLegacyFight = (data, form, { shadow = false } = {}) => {
  data.append('matchCategory', form.matchCategory);
  data.append('matchCategoryTwo', form.matchCategoryTwo);
  data.append('matchName', form.matchName);
  data.append('matchFighterA', form.matchFighterA);
  data.append('matchFighterB', form.matchFighterB);
  data.append('fighterAId', form.fighterAId);
  data.append('fighterBId', form.fighterBId);
  // Direct upload path: no library id yet, but a name + photo is enough —
  // the backend auto-registers this into the fighter library on save.
  if (!form.fighterAId && form.fighterAImage) data.append('fighterAImage', form.fighterAImage);
  if (!form.fighterBId && form.fighterBImage) data.append('fighterBImage', form.fighterBImage);
  data.append('matchDescription', form.matchDescription);
  data.append('matchVideoUrl', form.matchVideoUrl);
  data.append('maxRounds', form.maxRounds);
  data.append('matchType', shadow ? 'SHADOW' : form.matchType);
  data.append('notify', form.notify);
  if (form.promotionBackground) data.append('promotionBackground', form.promotionBackground);

  if (!shadow) {
    const localDateTime = form.matchDate && form.matchTime ? new Date(`${form.matchDate}T${form.matchTime}:00`) : null;
    const matchTimeEST = localDateTime && !Number.isNaN(localDateTime.getTime())
      ? localDateTime.toTimeString().substring(0, 5)
      : form.matchTime;
    const matchDate = form.matchDate ? form.matchDate.split('T')[0] : '';
    data.append('matchDate', matchDate);
    data.append('matchTime', matchTimeEST);
    data.append('matchTokens', form.matchTokens);
    data.append('pot', form.pot);
    data.append('matchTokensUsd', form.matchTokensUsd || '0');
    data.append('potUsd', form.potUsd || '0');
    data.append('fmConversionTokens', String(TOKEN_PACK_SIZE));
    data.append('fmConversionUsd', String(TOKEN_PACK_USD));
    data.append('addToShadow', form.addToShadowTemplates);
  }
};

export default function AddNewMatch() {
  const [form, setForm] = useState(EMPTY);
  const [displayCategory, setDisplayCategory] = useState('');
  const [selectedFighterA, setSelectedFighterA] = useState(null);
  const [selectedFighterB, setSelectedFighterB] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [showShadowPredictionChoice, setShowShadowPredictionChoice] = useState(false);
  const [createdShadowId, setCreatedShadowId] = useState(null);
  const [showAdminPredictions, setShowAdminPredictions] = useState(false);
  const createdNoticeRef = useRef(null);

  useEffect(() => {
    if (!created) return;
    if (typeof window === 'undefined') return;
    window.setTimeout(() => {
      createdNoticeRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, [created]);

  const previews = useMemo(() => ({
    fighterAImage: getCombatFighterImage(selectedFighterA) || (form.fighterAImage ? URL.createObjectURL(form.fighterAImage) : FALLBACK_A),
    fighterBImage: getCombatFighterImage(selectedFighterB) || (form.fighterBImage ? URL.createObjectURL(form.fighterBImage) : FALLBACK_B),
    promotionBackground: form.promotionBackground ? URL.createObjectURL(form.promotionBackground) : FALLBACK_PROMOTION,
  }), [form.promotionBackground, form.fighterAImage, form.fighterBImage, selectedFighterA, selectedFighterB]);

  const change = (event) => {
    const { name, type, checked, value, files } = event.target;
    if (name === 'matchCategory') {
      setDisplayCategory(value);
      setForm((current) => ({
        ...current,
        ...normaliseCategory(value),
        maxRounds: DEFAULT_ROUNDS[value] || current.maxRounds,
      }));
      return;
    }
    const tokenFieldByUsdField = { matchTokensUsd: 'matchTokens', potUsd: 'pot' };
    const tokenField = tokenFieldByUsdField[name];
    if (tokenField) {
      setForm((current) => ({ ...current, [name]: value, [tokenField]: usdToTokens(value) }));
      return;
    }
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] || null : value }));
  };

  const chooseFighter = (side, fighter) => {
    const id = getCombatFighterId(fighter);
    const name = getCombatFighterName(fighter);
    if (side === 'A') {
      setSelectedFighterA(fighter);
      setForm((current) => ({ ...current, fighterAId: id, matchFighterA: name }));
    } else {
      setSelectedFighterB(fighter);
      setForm((current) => ({ ...current, fighterBId: id, matchFighterB: name }));
    }
  };

  const resetAfterCreate = () => {
    setForm(EMPTY);
    setDisplayCategory('');
    setSelectedFighterA(null);
    setSelectedFighterB(null);
  };

  const submitLockRef = useRef(false);
  const publishRequestIdRef = useRef(globalThis.crypto?.randomUUID?.() || `fight-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const submit = async (event) => {
    event.preventDefault();
    // Synchronous lock — blocks a second click that lands before React
    // re-renders the disabled button (the cause of duplicate fight cards).
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setSaving(true);
    setError('');
    setCreated(null);
    setShowShadowPredictionChoice(false);

    try {
      if (!displayCategory) throw new Error('Choose a combat sport for this fight.');
      if (!form.matchName.trim()) throw new Error('Fight/card name is required.');
      const hasFighterA = form.fighterAId || (form.matchFighterA.trim() && form.fighterAImage);
      const hasFighterB = form.fighterBId || (form.matchFighterB.trim() && form.fighterBImage);
      if (!hasFighterA || !hasFighterB) throw new Error('Pick both fighters from the library, or type a name and attach a photo directly for each.');
      if (form.fighterAId && form.fighterBId && form.fighterAId === form.fighterBId) throw new Error('Fighter A and Fighter B must be different fighters.');
      if (form.matchType === 'LIVE' && (!form.matchDate || !form.matchTime)) throw new Error('Date and time are required for a live fight card.');

      const data = new FormData();
      appendLegacyFight(data, form);
      data.append('publishRequestId', publishRequestIdRef.current);
      const endpoint = form.matchType === 'SHADOW' ? `${API_BASE}/addShadow` : `${API_BASE}/addMatch`;
      const response = await fetch(endpoint, { headers: adminHeaders({ 'Idempotency-Key': publishRequestIdRef.current }), method: 'POST', body: data });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to add match.');

      const matchId = payload?.matchId || payload?.data?._id || payload?._id || payload?.match?._id;

      if (form.matchType === 'LIVE' && form.addToShadowTemplates) {
        // Isolated: a drop here must never mislabel the primary create above
        // as failed/lost — the fight already saved by this point.
        try {
          const shadow = new FormData();
          appendLegacyFight(shadow, form, { shadow: true });
          const shadowResponse = await fetch(`${API_BASE}/addShadow`, { headers: adminHeaders(), method: 'POST', body: shadow });
          if (!shadowResponse.ok) console.warn('Failed to add fight to shadow templates.');
        } catch (shadowError) {
          console.warn('Shadow-template sync after create failed (fight itself already saved):', shadowError);
        }
      }

      setCreated({
        id: matchId,
        type: form.matchType,
        name: form.matchName,
        category: displayCategory,
        fighterA: form.matchFighterA,
        fighterB: form.matchFighterB,
      });
      if (form.matchType === 'SHADOW' && matchId) {
        setCreatedShadowId(matchId);
        setShowShadowPredictionChoice(true);
      } else {
        resetAfterCreate();
      }
      publishRequestIdRef.current = globalThis.crypto?.randomUUID?.() || `fight-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    } catch (requestError) {
      // A network drop (no HTTP response reached the browser) can happen
      // AFTER the backend already saved the fight — resubmitting blind is
      // what created duplicates before. Say so explicitly instead of just
      // "failed", so the reflex is to check the registry, not click again.
      const isNetworkDrop = requestError instanceof TypeError;
      if (isNetworkDrop) {
        try {
          const registryResponse = await fetch(`${API_BASE}/api/public/fights?limit=500&includeDrafts=true&_=${Date.now()}`, {
            cache: 'no-store',
            headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
          });
          const registryPayload = await registryResponse.json().catch(() => ({}));
          const registryRows = Array.isArray(registryPayload)
            ? registryPayload
            : registryPayload?.items || registryPayload?.data || registryPayload?.rows || [];
          const savedFight = registryRows.find((fight) => (
            normalizeFightText(fight.matchName || fight.title) === normalizeFightText(form.matchName)
            && normalizeFightText(fight.matchFighterA || fight.fighterA?.name) === normalizeFightText(form.matchFighterA)
            && normalizeFightText(fight.matchFighterB || fight.fighterB?.name) === normalizeFightText(form.matchFighterB)
            && String(fight.matchDate || fight.date || '').slice(0, 10) === String(form.matchDate || '').slice(0, 10)
          ));
          if (savedFight) {
            setCreated({
              id: savedFight._id || savedFight.id,
              type: form.matchType,
              name: form.matchName,
              category: displayCategory,
              fighterA: form.matchFighterA,
              fighterB: form.matchFighterB,
            });
            setError('');
            resetAfterCreate();
            publishRequestIdRef.current = globalThis.crypto?.randomUUID?.() || `fight-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            return;
          }
        } catch (registryCheckError) {
          console.warn('Unable to confirm the published fight after a dropped response:', registryCheckError);
        }
      }
      setError(isNetworkDrop
        ? 'Lost connection while publishing. The fight may have already been created — check Fight registry before publishing again.'
        : (requestError.message || 'Unable to create the fight card.'));
    } finally {
      setSaving(false);
      submitLockRef.current = false;
    }
  };

  if (showAdminPredictions && createdShadowId) {
    return <AdminPredictions matchId={createdShadowId} filter="shadowTemplate" />;
  }

  return (
    <div className="admin-workspace admin-create-fight-page admin-economics-desk admin-operations-v3 admin-operations-v4" data-desk-ui="operations-v4">
      <section className="admin-page-heading admin-operations-hero">
        <div>
          <span>Fight operations · Economics desk 4.0</span>
          <h2>Create match</h2>
          <p>Build live and Shadow fight cards from one clean operations desk. Every number shows its consequence before you publish, and the same record feeds the website and the app.</p>
        </div>
        <div className="admin-heading-actions">
          <Link className="admin-action-secondary" href="/administration/fighters"><FaUsers /> Fighter library</Link>
          <Link className="admin-action-secondary" href="/administration/fights"><FaTrophy /> Fight registry</Link>
          <Link className="admin-action-secondary" href="/administration/ShadowFightsLibrary"><FaBolt /> Shadow library</Link>
        </div>
      </section>

      <section className="admin-desk-status-strip" aria-label="Economics desk status">
        <div><span>Desk</span><strong>Economics</strong></div>
        <div><span>Card type</span><strong>{form.matchType === 'LIVE' ? 'Live production' : 'Shadow template'}</strong></div>
        <div><span>Sport</span><strong>{displayCategory || 'Not selected'}</strong></div>
        <div><span>Rounds</span><strong>{form.maxRounds || 0}</strong></div>
        <div className="is-live"><span>Publishing</span><strong>Protected workflow</strong></div>
      </section>

      <nav className="admin-fight-desk-nav admin-operations-workflow" aria-label="Fight desk workflow">
        <Link href="/administration/AddNewMatch" className="is-active">Economics desk</Link>
        <Link href="/administration/upcomingFights">Scoring desk</Link>
        <Link href="/administration/PreviousMatches">Results</Link>
        <Link href="/administration/full-cards">Promotion</Link>
      </nav>

      {created && (
        <section ref={createdNoticeRef} className="admin-success-panel">
          <div><span>Fight created</span><strong>{created.name}</strong><p>{created.fighterA} vs {created.fighterB} &middot; {created.category?.toUpperCase()}. The fight is available to the appropriate registry and scoring workflow.</p></div>
          <div>
            {created.id && <Link href={`/administration/upcomingFights?matchId=${created.id}`}>Open score centre</Link>}
            <Link href="/administration/fights">View all fights</Link>
          </div>
        </section>
      )}
      {showShadowPredictionChoice && (
        <section className="admin-success-panel admin-shadow-choice-panel">
          <div><span>Shadow prediction setup</span><strong>Add official prediction values now?</strong><p>This is the same follow-up step used by the original shadow fight creation flow.</p></div>
          <div>
            <button type="button" onClick={() => setShowAdminPredictions(true)}>Yes, open predictions</button>
            <button type="button" onClick={() => { setShowShadowPredictionChoice(false); resetAfterCreate(); }}>No, finish later</button>
          </div>
        </section>
      )}
      {error && <div className="admin-inline-notice is-error">{error}</div>}

      <form className="admin-create-fight-layout" onSubmit={submit}>
        <main>
          <section className="admin-form-card admin-desk-section admin-desk-section-identity">
            <header><span>01</span><div><h3>Fight type &amp; identity</h3><p>Choose how this card operates, then name it and assign both corners.</p></div></header>
            <div className="admin-form-grid">
              <div className="admin-fight-type-cards is-wide" role="group" aria-label="Fight type">
                <button type="button" className={form.matchType === 'LIVE' ? 'is-active' : ''} onClick={() => setForm((current) => ({ ...current, matchType: 'LIVE' }))}><strong>Live production fight</strong><span>Carries a schedule, player economy and publishing controls.</span></button>
                <button type="button" className={form.matchType === 'SHADOW' ? 'is-active' : ''} onClick={() => setForm((current) => ({ ...current, matchType: 'SHADOW' }))}><strong>Shadow template</strong><span>Reusable inventory for affiliate-created promotions.</span></button>
              </div>
              <label><span>Combat sport</span><select name="matchCategory" value={displayCategory} onChange={change} required><option value="" disabled>Choose sport&hellip;</option><option value="boxing">Boxing</option><option value="mma">MMA</option><option value="kickboxing">Kickboxing</option><option value="Bare-knuckle">Bare-knuckle</option></select></label>
              <label className="is-wide"><span>Fight/card name</span><input name="matchName" value={form.matchName} onChange={change} placeholder="UFC 310 main event" required /></label>
              <div className="admin-fighter-select-grid is-wide">
                <CombatFighterSelect label="Fighter A" side="A" value={form.fighterAId} category={displayCategory.toLowerCase()} onChange={(fighter) => chooseFighter('A', fighter)} required={!form.fighterAImage} />
                <CombatFighterSelect label="Fighter B" side="B" value={form.fighterBId} category={displayCategory.toLowerCase()} onChange={(fighter) => chooseFighter('B', fighter)} required={!form.fighterBImage} />
              </div>
              <div className="admin-direct-fighter-grid is-wide">
                {!form.fighterAId && (
                  <DirectFighterEntry side="A" name={form.matchFighterA} image={form.fighterAImage} preview={previews.fighterAImage} onNameChange={(value) => setForm((current) => ({ ...current, matchFighterA: value }))} onImageChange={(value) => setForm((current) => ({ ...current, fighterAImage: value }))} />
                )}
                {!form.fighterBId && (
                  <DirectFighterEntry side="B" name={form.matchFighterB} image={form.fighterBImage} preview={previews.fighterBImage} onNameChange={(value) => setForm((current) => ({ ...current, matchFighterB: value }))} onImageChange={(value) => setForm((current) => ({ ...current, fighterBImage: value }))} />
                )}
              </div>
              <label>
                <span>Maximum rounds</span>
                <input type="number" min="1" max="30" name="maxRounds" value={form.maxRounds} onChange={change} />
                <span className="admin-round-presets">
                  {ROUND_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={form.maxRounds === preset ? 'is-active' : ''}
                      onClick={() => setForm((current) => ({ ...current, maxRounds: preset }))}
                    >
                      {preset}
                    </button>
                  ))}
                </span>
              </label>
              <label><span>Video URL</span><input type="url" name="matchVideoUrl" value={form.matchVideoUrl} onChange={change} placeholder="https://…" /></label>
              <label className="is-wide"><span>Description</span><textarea name="matchDescription" value={form.matchDescription} onChange={change} rows="5" placeholder="Give players the context they need before predicting." /></label>
            </div>
          </section>

          {form.matchType === 'LIVE' && (
            <section className="admin-form-card admin-desk-section admin-desk-section-economy">
              <header><span>02</span><div><h3>Schedule and economy</h3><p>Configure lock timing, entry cost and the advertised prize pool. Declare upfront — the pot never grows with entries.</p></div></header>
              <div className="admin-form-grid">
                <label><span>Fight date</span><input type="date" name="matchDate" value={form.matchDate} onChange={change} required /></label>
                <label><span>Fight time (EST)</span><input type="time" name="matchTime" value={form.matchTime} onChange={change} required /></label>
                <label className="admin-money-conversion-field">
                  <span>Player entry fee (USD)</span>
                  <div className="admin-money-input"><b>$</b><input type="number" min="0" step="0.01" name="matchTokensUsd" value={form.matchTokensUsd} onChange={change} placeholder="0.00" /></div>
                  <small><strong>{Number(form.matchTokens || 0).toLocaleString()} FM COINS</strong> charged publicly</small>
                </label>
                <label className="admin-money-conversion-field">
                  <span>Guaranteed prize pool (USD)</span>
                  <div className="admin-money-input"><b>$</b><input type="number" min="0" step="0.01" name="potUsd" value={form.potUsd} onChange={change} placeholder="0.00" /></div>
                  <small><strong>{Number(form.pot || 0).toLocaleString()} FM COINS</strong> shown publicly</small>
                </label>
                <div className="admin-fm-rate-note is-wide"><span>FM COINS conversion</span><strong>$3.99 = 5,000 FM COINS</strong><small>Cash amounts stay in the back office. Players see and spend the converted FM COINS amount.</small></div>
              </div>
            </section>
          )}

          <section className="admin-form-card admin-desk-section admin-desk-section-publishing">
            <header><span>{form.matchType === 'LIVE' ? '03' : '02'}</span><div><h3>Publishing controls</h3><p>Choose who is notified and whether a reusable template is generated.</p></div></header>
            <div className="admin-toggle-grid">
              <label><input type="checkbox" name="notify" checked={form.notify} onChange={change} /><span><strong>Notify members</strong><small>Send the existing platform announcement after publishing.</small></span></label>
              {form.matchType === 'LIVE' && <label><input type="checkbox" name="addToShadowTemplates" checked={form.addToShadowTemplates} onChange={change} /><span><strong>Create shadow copy</strong><small>Make the same card available to affiliate creators.</small></span></label>}
            </div>
          </section>
        </main>

        <aside className="admin-economics-control-rail">
          <div className="admin-control-rail-heading"><span>Live control rail</span><strong>What players will see</strong><small>Updates as this card is configured.</small></div>
          <section className="admin-fight-visual-card" style={{ backgroundImage: `linear-gradient(180deg,rgba(3,8,15,.08),rgba(3,8,15,.95)),url(${previews.promotionBackground})` }}>
            <span>Live preview</span>
            <h3>{form.matchName || 'Untitled fight card'}</h3>
            <div>
              <article><UniformFighterPreview src={previews.fighterAImage} fallbackSrc={FALLBACK_A} alt="Fighter A preview" /><strong>{form.matchFighterA || 'Fighter A'}</strong></article>
              <b>VS</b>
              <article><UniformFighterPreview src={previews.fighterBImage} fallbackSrc={FALLBACK_B} alt="Fighter B preview" /><strong>{form.matchFighterB || 'Fighter B'}</strong></article>
            </div>
            <small><FaCalendarAlt /> {form.matchDate || 'Schedule pending'} · {form.matchTime || 'TBA'} EST</small>
          </section>
          <section className="admin-upload-stack">
            <label><FaCloudUploadAlt /><span><strong>Fight background</strong><small>{form.promotionBackground?.name || 'Select a high-resolution promotion image'}</small></span><input hidden type="file" accept="image/*" name="promotionBackground" onChange={change} /></label>
          </section>
          <div className="admin-inline-notice"><strong>No need to visit the Fighter Library first.</strong> Pick a saved fighter from the Fighter A/B dropdown, or use the "name + photo, no library lookup" fields right below it to upload straight from your computer or phone — either way the fighter is saved to the library automatically when you publish.</div>
          <button className="admin-primary-action admin-create-submit" type="submit" disabled={saving}><FaSave /> {saving ? 'Publishing fight…' : <><FaPlus /> Publish fight card</>}</button>
        </aside>
      </form>
    </div>
  );
}
