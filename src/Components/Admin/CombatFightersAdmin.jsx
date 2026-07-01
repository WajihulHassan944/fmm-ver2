import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { toast } from 'react-toastify';
import {
  FaEdit,
  FaFistRaised,
  FaImage,
  FaMagic,
  FaPlus,
  FaRedo,
  FaSave,
  FaSearch,
  FaSyncAlt,
  FaTrashAlt,
  FaUndo,
} from 'react-icons/fa';
import OptimizedImage from '@/Components/Common/OptimizedImage';
import { combatFightersApi, getCombatFighterId, getCombatFighterImage, getCombatFighterName } from '@/Utils/combatFightersApi';

const EMPTY_FORM = {
  displayName: '',
  category: 'boxing',
  aliases: '',
  primaryImage: '',
  status: 'active',
};

const FALLBACK_IMAGE = '/images/fmm-experience/fighter-action-red.webp';

const getRows = (payload) => Array.isArray(payload?.items) ? payload.items : [];
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const toForm = (fighter) => ({
  displayName: fighter?.displayName || '',
  category: fighter?.category || 'boxing',
  aliases: Array.isArray(fighter?.aliases) ? fighter.aliases.join(', ') : '',
  primaryImage: fighter?.primaryImage || '',
  status: fighter?.status || 'active',
});

const fromForm = (form) => ({
  displayName: form.displayName.trim(),
  category: form.category,
  aliases: form.aliases.split(',').map((item) => item.trim()).filter(Boolean),
  primaryImage: form.primaryImage.trim(),
  status: form.status,
  source: 'admin-fighter-library',
});

const getCount = (payload, key) => Number(payload?.[key] || 0);

const mergeImportPayload = (current, payload) => ({
  ...(payload || {}),
  dryRun: false,
  createdCount: getCount(current, 'createdCount') + getCount(payload, 'createdCount'),
  updatedCount: getCount(current, 'updatedCount') + getCount(payload, 'updatedCount'),
  importedCount: getCount(current, 'importedCount') + getCount(payload, 'importedCount'),
  linkedMatchCount: getCount(current, 'linkedMatchCount') + getCount(payload, 'linkedMatchCount'),
  linkedShadowCount: getCount(current, 'linkedShadowCount') + getCount(payload, 'linkedShadowCount'),
  inspectedMatches: Math.max(getCount(current, 'inspectedMatches'), getCount(payload, 'inspectedMatches')),
  inspectedShadows: Math.max(getCount(current, 'inspectedShadows'), getCount(payload, 'inspectedShadows')),
  batchHistory: [...(current?.batchHistory || []), payload?.batch].filter(Boolean),
});

const buildImportBody = ({ dryRun, offset = 0 }) => ({
  dryRun,
  offset,
  batchSize: dryRun ? 100 : 8,
  checkImages: !dryRun,
  includeShadows: true,
  linkMatches: true,
  overwriteImages: false,
  syncMatchImages: false,
  maxCandidateChecksPerFighter: dryRun ? 1 : 2,
  imageTimeoutMs: 1200,
  remoteConcurrency: 3,
});

export default function CombatFightersAdmin() {
  const [fightersPayload, setFightersPayload] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importPreview, setImportPreview] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importing, setImporting] = useState(false);

  const fighters = useMemo(() => getRows(fightersPayload), [fightersPayload]);

  const loadFighters = async () => {
    setLoading(true);
    try {
      const payload = await combatFightersApi.list({
        limit: 100,
        search,
        status: statusFilter,
        category: categoryFilter,
      });
      setFightersPayload(payload);
    } catch (error) {
      toast.error(error.message || 'Could not load fighters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFighters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (fighter) => {
    setEditing(fighter);
    setForm(toForm(fighter));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveFighter = async (event) => {
    event.preventDefault();
    if (!form.displayName.trim()) return toast.warning('Fighter name is required.');
    setSaving(true);
    try {
      if (editing) {
        await combatFightersApi.update(getCombatFighterId(editing), fromForm(form));
        toast.success('Fighter updated.');
      } else {
        await combatFightersApi.create(fromForm(form));
        toast.success('Fighter created.');
      }
      resetForm();
      await loadFighters();
    } catch (error) {
      toast.error(error.message || 'Could not save fighter.');
    } finally {
      setSaving(false);
    }
  };

  const softDeleteFighter = async (fighter) => {
    const name = getCombatFighterName(fighter);
    if (!window.confirm(`Deactivate ${name}? Existing fights will keep their fallback names/images.`)) return;
    try {
      await combatFightersApi.remove(getCombatFighterId(fighter));
      toast.success(`${name} deactivated.`);
      await loadFighters();
    } catch (error) {
      toast.error(error.message || 'Could not deactivate fighter.');
    }
  };

  const restoreFighter = async (fighter) => {
    try {
      await combatFightersApi.restore(getCombatFighterId(fighter));
      toast.success(`${getCombatFighterName(fighter)} restored.`);
      await loadFighters();
    } catch (error) {
      toast.error(error.message || 'Could not restore fighter.');
    }
  };

  const runImport = async (dryRun = true) => {
    if (!dryRun) {
      const confirmed = window.confirm('Import unique fighters from existing fights and link matches to fighter records? This keeps old fight fields as fallback. The import now runs in safe backend batches to avoid serverless timeout.');
      if (!confirmed) return;
    }

    setImporting(true);
    setImportProgress({
      dryRun,
      status: dryRun ? 'Checking fighters...' : 'Starting batched import...',
      processed: 0,
      total: 0,
      currentOffset: 0,
      hasMore: false,
    });

    try {
      if (dryRun) {
        const payload = await combatFightersApi.importFromFights(buildImportBody({ dryRun: true }));
        const batch = payload?.batch || {};
        setImportPreview(payload);
        setImportProgress({
          dryRun: true,
          status: 'Dry-run ready',
          processed: batch.processedFighters || 0,
          total: batch.totalFighters || payload?.fighterCount || 0,
          currentOffset: batch.offset || 0,
          hasMore: Boolean(batch.hasMore),
          nextOffset: batch.nextOffset,
        });
        toast.success(`${payload?.fighterCount || 0} unique fighters detected. Review and run import when ready.`);
        return;
      }

      let offset = 0;
      let aggregate = { dryRun: false, batchHistory: [] };
      let guard = 0;
      const maxBatches = 250;

      while (guard < maxBatches) {
        guard += 1;
        const payload = await combatFightersApi.importFromFights(buildImportBody({ dryRun: false, offset }));
        const batch = payload?.batch || {};

        aggregate = mergeImportPayload(aggregate, payload);
        aggregate.batch = batch;
        aggregate.fighterCount = batch.totalFighters || aggregate.fighterCount || 0;
        aggregate.note = payload?.note;

        setImportPreview(aggregate);
        setImportProgress({
          dryRun: false,
          status: batch.hasMore ? 'Import batch completed. Continuing...' : 'Import completed',
          processed: Math.min(batch.nextOffset || batch.totalFighters || 0, batch.totalFighters || 0),
          total: batch.totalFighters || 0,
          currentOffset: batch.offset || 0,
          nextOffset: batch.nextOffset,
          hasMore: Boolean(batch.hasMore),
          elapsedMs: batch.elapsedMs,
        });

        if (!batch.hasMore || batch.nextOffset === null || batch.nextOffset === undefined) break;
        offset = batch.nextOffset;
      }

      if (guard >= maxBatches) {
        toast.warning('Import paused after the safety batch limit. Run automatic import again to continue if needed.');
      } else {
        toast.success(`${aggregate.createdCount || 0} fighters created, ${aggregate.updatedCount || 0} updated, ${(aggregate.linkedMatchCount || 0) + (aggregate.linkedShadowCount || 0)} fight links updated.`);
      }

      await loadFighters();
    } catch (error) {
      toast.error(error.message || 'Fighter import failed.');
    } finally {
      setImporting(false);
    }
  };


  return (
    <div className="admin-workspace admin-combat-fighters-page">
      <Head><title>Combat Fighter Library | FMM Administration</title></Head>

      <section className="admin-page-heading">
        <div>
          <span>Fight operations</span>
          <h2>Combat fighter library</h2>
          <p>Create, edit, deactivate, restore, and automatically import reusable fighters for normal LIVE/SHADOW fight creation.</p>
        </div>
        <div className="admin-heading-actions">
          <button type="button" className="admin-action-secondary" onClick={() => runImport(true)} disabled={importing}><FaMagic /> Dry-run import</button>
          <button type="button" className="admin-primary-action" onClick={() => runImport(false)} disabled={importing}><FaRedo className={importing ? 'xp-spin' : ''} /> {importing ? 'Importing batches...' : 'Run automatic import'}</button>
          <button type="button" className="admin-action-secondary" onClick={loadFighters}><FaSyncAlt className={loading ? 'xp-spin' : ''} /> Refresh</button>
        </div>
      </section>

      {importPreview && (
        <section className="admin-success-panel admin-fighter-import-panel">
          <div>
            <span>{importPreview.dryRun ? 'Dry-run import ready' : importing ? 'Batched import running' : 'Import completed'}</span>
            <strong>{importPreview.fighterCount || importPreview.batch?.totalFighters || importPreview.importedCount || 0} fighter records processed</strong>
            <p>{importPreview.note || 'Existing fight names/images remain as fallback. Working image candidates are selected only after backend image checks.'}</p>
          </div>
          <div>
            <small>Matches inspected: {importPreview.inspectedMatches || 0}</small>
            <small>Shadows inspected: {importPreview.inspectedShadows || 0}</small>
            {(importPreview.createdCount !== undefined || importPreview.updatedCount !== undefined) && <small>Created/updated: {(importPreview.createdCount || 0)} / {(importPreview.updatedCount || 0)}</small>}
            {(importPreview.linkedMatchCount !== undefined || importPreview.linkedShadowCount !== undefined) && <small>Linked fights: {(importPreview.linkedMatchCount || 0) + (importPreview.linkedShadowCount || 0)}</small>}
            {importProgress && <small>Batch progress: {importProgress.processed || 0} / {importProgress.total || 0}</small>}
          </div>
        </section>
      )}

      <section className="admin-swarm-layout admin-combat-fighter-layout">
        <form className="admin-swarm-panel admin-fighter-editor-panel" onSubmit={saveFighter}>
          <header><div><span>{editing ? 'Edit fighter' : 'Create fighter'}</span><h2>{editing ? getCombatFighterName(editing) : 'New combat fighter'}</h2></div>{editing && <button type="button" className="admin-action-secondary" onClick={resetForm}>Cancel edit</button>}</header>
          <div className="admin-form-grid">
            <label><span>Fighter name</span><input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Gervonta Davis" required /></label>
            <label><span>Category</span><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}><option value="boxing">Boxing</option><option value="mma">MMA</option><option value="kickboxing">Kickboxing</option><option value="bare-knuckle">Bare-knuckle</option><option value="combat">Combat</option></select></label>
            <label><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="active">Active</option><option value="needs_review">Needs review</option><option value="inactive">Inactive</option></select></label>
            <label className="is-wide"><span>Aliases</span><input value={form.aliases} onChange={(event) => setForm((current) => ({ ...current, aliases: event.target.value }))} placeholder="Tank, G Davis" /></label>
            <label className="is-wide"><span>Image URL</span><input type="url" value={form.primaryImage} onChange={(event) => setForm((current) => ({ ...current, primaryImage: event.target.value }))} placeholder="https://res.cloudinary.com/..." /></label>
          </div>
          <div className="admin-fighter-editor-preview">
            <OptimizedImage src={form.primaryImage || FALLBACK_IMAGE} fallbackSrc={FALLBACK_IMAGE} alt={form.displayName || 'Fighter preview'} width={84} height={84} sizes="84px" />
            <div><strong>{form.displayName || 'Fighter preview'}</strong><small>{form.category} · {form.status}</small></div>
          </div>
          <button type="submit" className="admin-primary-action" disabled={saving}><FaSave /> {saving ? 'Saving...' : editing ? 'Save fighter' : 'Create fighter'}</button>
        </form>

        <section className="admin-swarm-panel admin-combat-fighter-table-panel">
          <header><div><span>Reusable fighters</span><h2>{fightersPayload?.pagination?.total || fighters.length} fighters</h2></div></header>
          <div className="admin-table-toolbar admin-fighter-library-toolbar">
            <label className="admin-table-search"><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') loadFighters(); }} placeholder="Search fighter name or alias" /></label>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option><option value="boxing">Boxing</option><option value="mma">MMA</option><option value="kickboxing">Kickboxing</option><option value="bare-knuckle">Bare-knuckle</option><option value="combat">Combat</option></select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="needs_review">Needs review</option><option value="inactive">Inactive</option></select>
            <button type="button" className="admin-action-secondary" onClick={loadFighters}><FaSearch /> Apply</button>
          </div>
          <div className="admin-data-table-scroll">
            <table className="admin-data-table admin-quality-table admin-combat-fighter-table">
              <thead><tr><th>Fighter</th><th>Category</th><th>Image</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
              <tbody>
                {fighters.length ? fighters.map((fighter) => {
                  const inactive = fighter.status === 'inactive';
                  return (
                    <tr key={getCombatFighterId(fighter)} className={inactive ? 'is-muted-row' : ''}>
                      <td><div className="admin-fighter-library-cell"><OptimizedImage src={getCombatFighterImage(fighter) || FALLBACK_IMAGE} fallbackSrc={FALLBACK_IMAGE} alt={getCombatFighterName(fighter)} width={48} height={48} sizes="48px" /><span><strong>{getCombatFighterName(fighter)}</strong><small>{fighter.aliases?.join(', ') || fighter.normalizedName}</small></span></div></td>
                      <td>{fighter.category || 'combat'}</td>
                      <td>{fighter.primaryImage ? <a href={fighter.primaryImage} target="_blank" rel="noreferrer"><FaImage /> Open</a> : 'Needs image'}</td>
                      <td><span className={`admin-status-badge ${inactive ? 'is-danger' : fighter.status === 'needs_review' ? 'is-warning' : 'is-success'}`}>{fighter.status || 'active'}</span></td>
                      <td>{formatDate(fighter.updatedAt)}</td>
                      <td><div className="admin-row-actions"><button type="button" onClick={() => startEdit(fighter)}><FaEdit /> Edit</button>{inactive ? <button type="button" onClick={() => restoreFighter(fighter)}><FaUndo /> Restore</button> : <button type="button" className="is-danger" onClick={() => softDeleteFighter(fighter)}><FaTrashAlt /> Delete</button>}</div></td>
                    </tr>
                  );
                }) : <tr><td colSpan="6"><div className="admin-empty-table"><FaFistRaised /><strong>No fighters found</strong><span>Run automatic import or create a fighter manually.</span></div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  );
}
