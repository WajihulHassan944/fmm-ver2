import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { toast } from 'react-toastify';
import {
  FaEdit,
  FaImage,
  FaSave,
  FaSearch,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';
import {
  WRESTLING_STATS,
  getWrestlerImage,
  safeWrestlingArray,
  wrestlingRequest,
} from '@/Utils/proWrestling';

const EMPTY = {
  displayName: '',
  promotion: '',
  country: '',
  height: '',
  weight: '',
  wrestlingStyle: '',
  signatureMoves: '',
  finishingMoves: '',
  wins: 0,
  losses: 0,
  draws: 0,
  noContests: 0,
  historicalMatches: 0,
  HP: 0,
  BP: 0,
  K: 0,
  PM: 0,
  FM: 0,
  biography: '',
  profileImageUrl: '',
  bannerImageUrl: '',
  active: true,
  featured: false,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  reason: '',
};

const WrestlingAdminRoster = () => {
  const [wrestlers, setWrestlers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState('');
  const [profileFile, setProfileFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const payload = await wrestlingRequest('/api/admin/wrestling/wrestlers?limit=100', { admin: true });
      setWrestlers(safeWrestlingArray(payload?.data || payload));
    } catch (error) {
      toast.error(error.message || 'The wrestling roster could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => {
    setForm(EMPTY);
    setEditingId('');
    setProfileFile(null);
    setBannerFile(null);
  };

  const edit = (item) => {
    const historical = item.historicalStatistics || {};
    setEditingId(item._id);
    setForm({
      displayName: item.displayName || '',
      promotion: item.promotion || '',
      country: item.country || '',
      height: item.height || '',
      weight: item.weight || '',
      wrestlingStyle: item.wrestlingStyle || '',
      signatureMoves: safeWrestlingArray(item.signatureMoves).join(', '),
      finishingMoves: safeWrestlingArray(item.finishingMoves).join(', '),
      wins: item.careerRecord?.wins || 0,
      losses: item.careerRecord?.losses || 0,
      draws: item.careerRecord?.draws || 0,
      noContests: item.careerRecord?.noContests || 0,
      historicalMatches: historical.matches || 0,
      HP: historical.HP || 0,
      BP: historical.BP || 0,
      K: historical.K || 0,
      PM: historical.PM || 0,
      FM: historical.FM || 0,
      biography: item.biography || '',
      profileImageUrl: item.profileImage || '',
      bannerImageUrl: item.bannerImage || '',
      active: item.active !== false,
      featured: Boolean(item.featured),
      seoTitle: item.seo?.title || '',
      seoDescription: item.seo?.description || '',
      seoKeywords: safeWrestlingArray(item.seo?.keywords).join(', '),
      reason: '',
    });
    setProfileFile(null);
    setBannerFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (editingId && !form.reason.trim()) {
      toast.error('Enter an audit reason before updating a wrestler profile.');
      return;
    }
    setSaving(true);
    try {
      const body = new FormData();
      ['displayName', 'promotion', 'country', 'height', 'weight', 'wrestlingStyle', 'biography', 'profileImageUrl', 'bannerImageUrl'].forEach((field) => body.append(field, form[field] || ''));
      body.append('signatureMoves', form.signatureMoves);
      body.append('finishingMoves', form.finishingMoves);
      body.append('careerRecord', JSON.stringify({
        wins: Number(form.wins),
        losses: Number(form.losses),
        draws: Number(form.draws),
        noContests: Number(form.noContests),
      }));
      body.append('historicalStatistics', JSON.stringify({
        matches: Number(form.historicalMatches),
        ...WRESTLING_STATS.reduce((result, stat) => ({ ...result, [stat.key]: Number(form[stat.key]) }), {}),
      }));
      body.append('active', String(form.active));
      body.append('featured', String(form.featured));
      body.append('seo', JSON.stringify({
        title: form.seoTitle,
        description: form.seoDescription,
        keywords: form.seoKeywords.split(',').map((value) => value.trim()).filter(Boolean),
      }));
      if (form.reason) body.append('reason', form.reason.trim());
      if (profileFile) body.append('profileImage', profileFile);
      if (bannerFile) body.append('bannerImage', bannerFile);

      await wrestlingRequest(
        editingId ? `/api/admin/wrestling/wrestlers/${editingId}` : '/api/admin/wrestling/wrestlers',
        { admin: true, method: editingId ? 'PUT' : 'POST', body },
      );
      toast.success(editingId ? 'Wrestler profile updated.' : 'Wrestler profile created.');
      reset();
      await load();
    } catch (error) {
      toast.error(error.message || 'The wrestler profile could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (item) => {
    if (!window.confirm(`Deactivate wrestler profile "${item.displayName}"? Existing contest snapshots remain intact.`)) return;
    try {
      await wrestlingRequest(`/api/admin/wrestling/wrestlers/${item._id}`, { admin: true, method: 'DELETE' });
      toast.success('Wrestler profile deactivated.');
      await load();
    } catch (error) {
      toast.error(error.message || 'The wrestler profile could not be deactivated.');
    }
  };

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return wrestlers;
    return wrestlers.filter((item) => [item.displayName, item.promotion, item.wrestlingStyle, item.country]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalized));
  }, [query, wrestlers]);

  return (
    <>
      <Head><title>Pro Wrestling Roster | FMM Administration</title></Head>
      <div className="pw-admin-page">
        <div className="pw-admin-form-heading">
          <p>Roster management</p>
          <h1>Pro Wrestling wrestlers</h1>
          <span>Create the profiles used by public roster pages, contest cards, player research, and administrator match creation.</span>
        </div>

        <form className="pw-admin-roster-form" onSubmit={submit}>
          <header>
            <div><FaUsers /><span><small>{editingId ? 'Editing roster profile' : 'New roster profile'}</small><h2>{editingId ? form.displayName : 'Add a wrestler'}</h2></span></div>
            {editingId && <button type="button" onClick={reset}>Cancel edit</button>}
          </header>

          <div className="pw-admin-roster-subsection"><p>Identity and wrestling profile</p></div>
          <div className="pw-admin-field-grid">
            <label><span>Display name *</span><input required value={form.displayName} onChange={(event) => update('displayName', event.target.value)} /></label>
            <label><span>Promotion</span><input value={form.promotion} onChange={(event) => update('promotion', event.target.value)} /></label>
            <label><span>Country</span><input value={form.country} onChange={(event) => update('country', event.target.value)} /></label>
            <label><span>Wrestling style</span><input value={form.wrestlingStyle} onChange={(event) => update('wrestlingStyle', event.target.value)} /></label>
            <label><span>Height</span><input value={form.height} onChange={(event) => update('height', event.target.value)} /></label>
            <label><span>Weight</span><input value={form.weight} onChange={(event) => update('weight', event.target.value)} /></label>
            <label className="is-wide"><span>Signature moves (comma separated)</span><input value={form.signatureMoves} onChange={(event) => update('signatureMoves', event.target.value)} /></label>
            <label className="is-wide"><span>Finishing moves (comma separated)</span><input value={form.finishingMoves} onChange={(event) => update('finishingMoves', event.target.value)} /></label>
            <label className="is-wide"><span>Biography</span><textarea rows="4" value={form.biography} onChange={(event) => update('biography', event.target.value)} /></label>
          </div>

          <div className="pw-admin-roster-subsection"><p>Career record and research statistics</p></div>
          <div className="pw-admin-field-grid">
            {['wins', 'losses', 'draws', 'noContests'].map((key) => <label key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><input type="number" min="0" value={form[key]} onChange={(event) => update(key, event.target.value)} /></label>)}
            <label><span>Historical matches sampled</span><input type="number" min="0" value={form.historicalMatches} onChange={(event) => update('historicalMatches', event.target.value)} /></label>
            {WRESTLING_STATS.map((stat) => <label key={stat.key}><span>Historical {stat.label} ({stat.short})</span><input type="number" min="0" value={form[stat.key]} onChange={(event) => update(stat.key, event.target.value)} /></label>)}
          </div>

          <div className="pw-admin-roster-subsection"><p>Media, visibility and search metadata</p></div>
          <div className="pw-admin-field-grid">
            <label className="is-wide"><span>Profile image URL</span><input value={form.profileImageUrl} onChange={(event) => update('profileImageUrl', event.target.value)} /></label>
            <label className="is-wide"><span>Banner image URL</span><input value={form.bannerImageUrl} onChange={(event) => update('bannerImageUrl', event.target.value)} /></label>
            <label className="pw-file-field"><FaImage /><span>Profile image upload</span><input type="file" accept="image/*" onChange={(event) => setProfileFile(event.target.files?.[0] || null)} /><small>{profileFile?.name || 'Optional'}</small></label>
            <label className="pw-file-field"><FaImage /><span>Banner image upload</span><input type="file" accept="image/*" onChange={(event) => setBannerFile(event.target.files?.[0] || null)} /><small>{bannerFile?.name || 'Optional'}</small></label>
            <div className="pw-admin-toggle-grid">
              <label><input type="checkbox" checked={form.active} onChange={(event) => update('active', event.target.checked)} /><span><strong>Active profile</strong><small>Available for new contest creation.</small></span></label>
              <label><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /><span><strong>Featured wrestler</strong><small>Prioritized in public roster discovery.</small></span></label>
            </div>
            <label><span>SEO title</span><input value={form.seoTitle} onChange={(event) => update('seoTitle', event.target.value)} /></label>
            <label className="is-wide"><span>SEO description</span><textarea rows="3" value={form.seoDescription} onChange={(event) => update('seoDescription', event.target.value)} /></label>
            <label className="is-wide"><span>SEO keywords</span><input value={form.seoKeywords} onChange={(event) => update('seoKeywords', event.target.value)} placeholder="wrestler name, promotion, wrestling style" /></label>
            {editingId && <label className="is-wide"><span>Required audit reason *</span><input value={form.reason} onChange={(event) => update('reason', event.target.value)} placeholder="Explain this roster update" /></label>}
          </div>
          <footer><button className="pw-admin-primary" disabled={saving}><FaSave /> {saving ? 'Saving…' : editingId ? 'Update wrestler' : 'Create wrestler'}</button></footer>
        </form>

        <section className="pw-admin-panel">
          <header><div><p>Roster registry</p><h2>Wrestler profiles</h2><span>{wrestlers.length} total profiles</span></div><label className="pw-admin-search-inline"><FaSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roster" /></label></header>
          <div className="pw-admin-table-wrap"><table className="pw-admin-table"><thead><tr><th>Wrestler</th><th>Promotion</th><th>Style</th><th>Record</th><th>Research sample</th><th>Status</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="7">Loading roster…</td></tr> : visible.length ? visible.map((item, index) => <tr key={item._id}><td><div className="pw-admin-player-cell"><img src={item.profileImage || getWrestlerImage(null, index % 2 ? 'B' : 'A')} alt="" /><span><strong>{item.displayName}</strong><small>{item.country || 'Country not set'}</small></span></div></td><td>{item.promotion || '—'}</td><td>{item.wrestlingStyle || '—'}</td><td>{item.careerRecord?.wins || 0}-{item.careerRecord?.losses || 0}-{item.careerRecord?.draws || 0}</td><td>{item.historicalStatistics?.matches || 0} matches</td><td>{item.active ? 'Active' : 'Inactive'}{item.featured ? ' · Featured' : ''}</td><td><div className="pw-admin-row-actions"><button type="button" onClick={() => edit(item)} title="Edit wrestler"><FaEdit /></button><button type="button" onClick={() => deactivate(item)} title="Deactivate wrestler"><FaTrash /></button></div></td></tr>) : <tr><td colSpan="7">No wrestler profiles found.</td></tr>}</tbody></table></div>
        </section>
      </div>
    </>
  );
};

export default WrestlingAdminRoster;
