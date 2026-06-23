import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { FaBolt, FaCalendarAlt, FaCloudUploadAlt, FaPlus, FaSave, FaTrophy } from 'react-icons/fa';
import AdminPredictions from './AdminPredictions';

const EMPTY = {
  matchCategory: 'boxing',
  matchCategoryTwo: '',
  matchName: '',
  matchFighterA: '',
  matchFighterB: '',
  matchDescription: '',
  matchVideoUrl: '',
  matchDate: '',
  matchTime: '',
  matchTokens: '0',
  pot: '0',
  matchType: 'LIVE',
  maxRounds: '12',
  notify: true,
  addToShadowTemplates: false,
  fighterAImage: null,
  fighterBImage: null,
  promotionBackground: null,
};

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';

const normaliseCategory = (value) => {
  if (value === 'kickboxing') return { matchCategory: 'mma', matchCategoryTwo: 'kickboxing' };
  if (value === 'Bare-knuckle') return { matchCategory: 'boxing', matchCategoryTwo: 'Bare-knuckle' };
  return { matchCategory: value, matchCategoryTwo: '' };
};

const appendLegacyFight = (data, form, { shadow = false } = {}) => {
  data.append('matchCategory', form.matchCategory);
  data.append('matchCategoryTwo', form.matchCategoryTwo);
  data.append('matchName', form.matchName);
  data.append('matchFighterA', form.matchFighterA);
  data.append('matchFighterB', form.matchFighterB);
  data.append('matchDescription', form.matchDescription);
  data.append('matchVideoUrl', form.matchVideoUrl);
  if (form.fighterAImage) data.append('fighterAImage', form.fighterAImage);
  if (form.fighterBImage) data.append('fighterBImage', form.fighterBImage);
  data.append('maxRounds', form.maxRounds);
  data.append('matchType', form.matchType);
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
    data.append('addToShadow', form.addToShadowTemplates);
  }
};

export default function AddNewMatch() {
  const [form, setForm] = useState(EMPTY);
  const [displayCategory, setDisplayCategory] = useState('boxing');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [showShadowPredictionChoice, setShowShadowPredictionChoice] = useState(false);
  const [createdShadowId, setCreatedShadowId] = useState(null);
  const [showAdminPredictions, setShowAdminPredictions] = useState(false);

  const previews = useMemo(() => ({
    fighterAImage: form.fighterAImage ? URL.createObjectURL(form.fighterAImage) : '/images/fmm-experience/fighter-action-red.jpg',
    fighterBImage: form.fighterBImage ? URL.createObjectURL(form.fighterBImage) : '/images/fmm-experience/fighter-action-blue.jpg',
    promotionBackground: form.promotionBackground ? URL.createObjectURL(form.promotionBackground) : '/images/fmm-pages/admin-command-hd.webp',
  }), [form.fighterAImage, form.fighterBImage, form.promotionBackground]);

  const change = (event) => {
    const { name, type, checked, value, files } = event.target;
    if (name === 'matchCategory') {
      setDisplayCategory(value);
      setForm((current) => ({ ...current, ...normaliseCategory(value) }));
      return;
    }
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] || null : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setCreated(null);
    setShowShadowPredictionChoice(false);

    try {
      if (!form.matchName.trim() || !form.matchFighterA.trim() || !form.matchFighterB.trim()) {
        throw new Error('Fight name and both fighters are required.');
      }
      if (form.matchType === 'LIVE' && (!form.matchDate || !form.matchTime)) {
        throw new Error('Date and time are required for a live fight card.');
      }

      const data = new FormData();
      appendLegacyFight(data, form);
      const endpoint = form.matchType === 'SHADOW' ? `${API_BASE}/addShadow` : `${API_BASE}/addMatch`;
      const response = await fetch(endpoint, { method: 'POST', body: data });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Failed to add match.');

      const matchId = payload?.matchId || payload?.data?._id || payload?._id || payload?.match?._id;

      if (form.matchType === 'LIVE' && form.addToShadowTemplates) {
        const shadow = new FormData();
        appendLegacyFight(shadow, form, { shadow: true });
        const shadowResponse = await fetch(`${API_BASE}/addShadow`, { method: 'POST', body: shadow });
        if (!shadowResponse.ok) console.warn('Failed to add fight to shadow templates.');
      }

      setCreated({ id: matchId, type: form.matchType, name: form.matchName });
      if (form.matchType === 'SHADOW' && matchId) {
        setCreatedShadowId(matchId);
        setShowShadowPredictionChoice(true);
      } else {
        setForm(EMPTY);
        setDisplayCategory('boxing');
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to create the fight card.');
    } finally {
      setSaving(false);
    }
  };

  if (showAdminPredictions && createdShadowId) {
    return <AdminPredictions matchId={createdShadowId} filter="shadowTemplate" />;
  }

  return (
    <div className="admin-workspace admin-create-fight-page">
      <section className="admin-page-heading">
        <div>
          <span>Fight operations</span>
          <h2>Create a fight card</h2>
          <p>Build a production fight or reusable shadow template in one structured workspace. The existing addMatch/addShadow backend contracts are preserved.</p>
        </div>
        <div className="admin-heading-actions">
          <Link className="admin-action-secondary" href="/administration/fights"><FaTrophy /> Fight registry</Link>
          <Link className="admin-action-secondary" href="/administration/ShadowFightsLibrary"><FaBolt /> Shadow library</Link>
        </div>
      </section>

      {created && (
        <section className="admin-success-panel">
          <div><span>Fight created</span><strong>{created.name}</strong><p>The fight is available to the appropriate registry and scoring workflow.</p></div>
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
            <button type="button" onClick={() => { setShowShadowPredictionChoice(false); setForm(EMPTY); setDisplayCategory('boxing'); }}>No, finish later</button>
          </div>
        </section>
      )}
      {error && <div className="admin-inline-notice is-error">{error}</div>}

      <form className="admin-create-fight-layout" onSubmit={submit}>
        <main>
          <section className="admin-form-card">
            <header><span>01</span><div><h3>Fight identity</h3><p>Name the card, select its discipline and define its operating mode.</p></div></header>
            <div className="admin-form-grid">
              <label><span>Fight type</span><select name="matchType" value={form.matchType} onChange={change}><option value="LIVE">Live production fight</option><option value="SHADOW">Shadow template</option></select></label>
              <label><span>Combat sport</span><select name="matchCategory" value={displayCategory} onChange={change}><option value="boxing">Boxing</option><option value="mma">MMA</option><option value="kickboxing">Kickboxing</option><option value="Bare-knuckle">Bare-knuckle</option></select></label>
              <label className="is-wide"><span>Fight/card name</span><input name="matchName" value={form.matchName} onChange={change} placeholder="UFC 310 main event" required /></label>
              <label><span>Fighter A</span><input name="matchFighterA" value={form.matchFighterA} onChange={change} placeholder="Red corner" required /></label>
              <label><span>Fighter B</span><input name="matchFighterB" value={form.matchFighterB} onChange={change} placeholder="Blue corner" required /></label>
              <label><span>Maximum rounds</span><input type="number" min="1" max="30" name="maxRounds" value={form.maxRounds} onChange={change} /></label>
              <label><span>Video URL</span><input type="url" name="matchVideoUrl" value={form.matchVideoUrl} onChange={change} placeholder="https://…" /></label>
              <label className="is-wide"><span>Description</span><textarea name="matchDescription" value={form.matchDescription} onChange={change} rows="5" placeholder="Give players the context they need before predicting." /></label>
            </div>
          </section>

          {form.matchType === 'LIVE' && (
            <section className="admin-form-card">
              <header><span>02</span><div><h3>Schedule and economy</h3><p>Configure lock timing, entry cost and the advertised prize pool.</p></div></header>
              <div className="admin-form-grid">
                <label><span>Fight date</span><input type="date" name="matchDate" value={form.matchDate} onChange={change} required /></label>
                <label><span>Fight time (EST)</span><input type="time" name="matchTime" value={form.matchTime} onChange={change} required /></label>
                <label><span>Entry tokens</span><input type="number" min="0" name="matchTokens" value={form.matchTokens} onChange={change} /></label>
                <label><span>Prize pool</span><input type="number" min="0" step="0.01" name="pot" value={form.pot} onChange={change} /></label>
              </div>
            </section>
          )}

          <section className="admin-form-card">
            <header><span>{form.matchType === 'LIVE' ? '03' : '02'}</span><div><h3>Publishing controls</h3><p>Choose who is notified and whether a reusable template is generated.</p></div></header>
            <div className="admin-toggle-grid">
              <label><input type="checkbox" name="notify" checked={form.notify} onChange={change} /><span><strong>Notify members</strong><small>Send the existing platform announcement after publishing.</small></span></label>
              {form.matchType === 'LIVE' && <label><input type="checkbox" name="addToShadowTemplates" checked={form.addToShadowTemplates} onChange={change} /><span><strong>Create shadow copy</strong><small>Make the same card available to affiliate creators.</small></span></label>}
            </div>
          </section>
        </main>

        <aside>
          <section className="admin-fight-visual-card" style={{ backgroundImage: `linear-gradient(180deg,rgba(3,8,15,.08),rgba(3,8,15,.95)),url(${previews.promotionBackground})` }}>
            <span>Live preview</span>
            <h3>{form.matchName || 'Untitled fight card'}</h3>
            <div><article><img src={previews.fighterAImage} alt="Fighter A preview" /><strong>{form.matchFighterA || 'Fighter A'}</strong></article><b>VS</b><article><img src={previews.fighterBImage} alt="Fighter B preview" /><strong>{form.matchFighterB || 'Fighter B'}</strong></article></div>
            <small><FaCalendarAlt /> {form.matchDate || 'Schedule pending'} · {form.matchTime || 'TBA'} EST</small>
          </section>
          <section className="admin-upload-stack">
            {[
              ['fighterAImage', 'Fighter A image'],
              ['fighterBImage', 'Fighter B image'],
              ['promotionBackground', 'Fight background'],
            ].map(([name, label]) => (
              <label key={name}><FaCloudUploadAlt /><span><strong>{label}</strong><small>{form[name]?.name || 'Select a high-resolution image'}</small></span><input hidden type="file" accept="image/*" name={name} onChange={change} /></label>
            ))}
          </section>
          <button className="admin-primary-action admin-create-submit" type="submit" disabled={saving}><FaSave /> {saving ? 'Publishing fight…' : <><FaPlus /> Publish fight card</>}</button>
        </aside>
      </form>
    </div>
  );
}
