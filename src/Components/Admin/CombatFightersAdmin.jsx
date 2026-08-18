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
  FaUpload,
  FaTimes,
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
const FIGHTER_PAGE_SIZE = 25;

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

const buildFighterSavePayload = (form, imageFile) => {
  const aliases = form.aliases.split(',').map((item) => item.trim()).filter(Boolean);

  if (imageFile) {
    const payload = new FormData();
    payload.append('displayName', form.displayName.trim());
    payload.append('category', form.category);
    payload.append('aliases', aliases.join(', '));
    payload.append('status', form.status);
    payload.append('source', 'admin-fighter-library');
    payload.append('image', imageFile);
    return payload;
  }

  return {
    displayName: form.displayName.trim(),
    category: form.category,
    aliases,
    primaryImage: form.primaryImage.trim(),
    status: form.status,
    source: 'admin-fighter-library',
  };
};

const getPagination = (payload) => payload?.pagination || {};
const getTotalPages = (payload) => {
  const pagination = getPagination(payload);
  const total = Number(pagination.total || 0);
  const limit = Number(pagination.limit || FIGHTER_PAGE_SIZE);
  return Number(pagination.pages || pagination.totalPages || (total && limit ? Math.ceil(total / limit) : 1)) || 1;
};

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

const buildCleanupBody = (dryRun = true) => ({
  dryRun,
  batchSize: 50,
  includeMatches: true,
  includeShadows: true,
  resolveMissingRefs: true,
  removeLegacyNames: true,
  removeLegacyImages: true,
  removeLegacyDeleteUrls: true,
});

const mergeCleanupPayload = (current, payload) => ({
  ...(payload || {}),
  dryRun: false,
  inspectedMatches: getCount(current, 'inspectedMatches') + getCount(payload, 'inspectedMatches'),
  inspectedShadows: getCount(current, 'inspectedShadows') + getCount(payload, 'inspectedShadows'),
  modifiedMatches: getCount(current, 'modifiedMatches') + getCount(payload, 'modifiedMatches'),
  modifiedShadows: getCount(current, 'modifiedShadows') + getCount(payload, 'modifiedShadows'),
  eligibleUpdates: getCount(current, 'eligibleUpdates') + getCount(payload, 'eligibleUpdates'),
  linkedByNameCount: getCount(current, 'linkedByNameCount') + getCount(payload, 'linkedByNameCount'),
  legacyFieldsUnsetCount: getCount(current, 'legacyFieldsUnsetCount') + getCount(payload, 'legacyFieldsUnsetCount'),
  unresolvedSideCount: getCount(current, 'unresolvedSideCount') + getCount(payload, 'unresolvedSideCount'),
  initialTotalTargets: current?.initialTotalTargets || payload?.totalTargets || 0,
  batchHistory: [...(current?.batchHistory || []), payload?.batch].filter(Boolean),
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageInputKey, setImageInputKey] = useState(0);
  const [page, setPage] = useState(1);
  const [importPreview, setImportPreview] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importing, setImporting] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState(null);
  const [cleanupProgress, setCleanupProgress] = useState(null);
  const [cleaningLegacyFields, setCleaningLegacyFields] = useState(false);

  const fighters = useMemo(() => getRows(fightersPayload), [fightersPayload]);
  const pagination = useMemo(() => getPagination(fightersPayload), [fightersPayload]);
  const totalPages = useMemo(() => getTotalPages(fightersPayload), [fightersPayload]);
  const totalFighters = Number(pagination.total || fighters.length || 0);
  const hasPreviousPage = page > 1;
  const hasNextPage = Boolean(pagination.hasNextPage || page < totalPages);
  const previewImageSrc = imagePreview || form.primaryImage || FALLBACK_IMAGE;

  const loadFighters = async (pageOverride = page) => {
    const nextPage = Math.max(1, Number(pageOverride) || 1);
    setLoading(true);
    try {
      const payload = await combatFightersApi.list({
        page: nextPage,
        limit: FIGHTER_PAGE_SIZE,
        search,
        status: statusFilter,
        category: categoryFilter,
      });
      setPage(nextPage);
      setFightersPayload(payload);
    } catch (error) {
      toast.error(error.message || 'Could not load fighters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFighters(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const clearSelectedImageFile = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
    setImageInputKey((current) => current + 1);
  };

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    clearSelectedImageFile();
  };

  const startEdit = (fighter) => {
    setEditing(fighter);
    setForm(toForm(fighter));
    clearSelectedImageFile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return clearSelectedImageFile();
    if (!file.type?.startsWith('image/')) {
      toast.warning('Please select a valid image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Please upload an image smaller than 5MB.');
      event.target.value = '';
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const saveFighter = async (event) => {
    event.preventDefault();
    if (!form.displayName.trim()) return toast.warning('Fighter name is required.');
    setSaving(true);
    try {
      const payload = buildFighterSavePayload(form, imageFile);
      if (editing) {
        await combatFightersApi.update(getCombatFighterId(editing), payload);
        toast.success('Fighter updated.');
      } else {
        await combatFightersApi.create(payload);
        toast.success('Fighter created.');
      }
      resetForm();
      await loadFighters(editing ? page : 1);
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



  const runCleanup = async (dryRun = true) => {
    if (!dryRun) {
      const confirmed = window.confirm('Normalize existing fights to fighter-library references and remove duplicated fight-side fighter names/images when a valid fighter ref exists? Run dry-run first if you want to preview.');
      if (!confirmed) return;
    }

    setCleaningLegacyFields(true);
    setCleanupProgress({
      dryRun,
      status: dryRun ? 'Checking linked fight records...' : 'Starting cleanup batches...',
      processed: 0,
      total: 0,
      hasMore: false,
    });

    try {
      if (dryRun) {
        const payload = await combatFightersApi.cleanupFightFighterFields(buildCleanupBody(true));
        setCleanupPreview(payload);
        setCleanupProgress({
          dryRun: true,
          status: 'Cleanup dry-run ready',
          processed: payload?.batch?.processedRecords || 0,
          total: payload?.totalTargets || 0,
          hasMore: Boolean(payload?.batch?.hasMore),
        });
        toast.success(`${payload?.eligibleUpdates || 0} fight records can be normalized safely.`);
        return;
      }

      let aggregate = { dryRun: false, batchHistory: [] };
      let guard = 0;
      const maxBatches = 250;

      while (guard < maxBatches) {
        guard += 1;
        const payload = await combatFightersApi.cleanupFightFighterFields(buildCleanupBody(false));
        const batch = payload?.batch || {};
        aggregate = mergeCleanupPayload(aggregate, payload);
        aggregate.batch = batch;
        aggregate.note = payload?.note;
        aggregate.totalTargets = payload?.totalTargets || aggregate.totalTargets || 0;

        const processed = getCount(aggregate, 'modifiedMatches') + getCount(aggregate, 'modifiedShadows');
        const total = aggregate.initialTotalTargets || payload?.totalTargets || processed;
        setCleanupPreview(aggregate);
        setCleanupProgress({
          dryRun: false,
          status: batch.hasMore ? 'Cleanup batch completed. Continuing...' : 'Cleanup completed',
          processed,
          total,
          hasMore: Boolean(batch.hasMore),
          batchNumber: guard,
        });

        if (!batch.hasMore) break;
      }

      if (guard >= maxBatches) {
        toast.warning('Cleanup paused after the safety batch limit. Run cleanup again to continue if anything remains.');
      } else {
        toast.success(`${(aggregate.modifiedMatches || 0) + (aggregate.modifiedShadows || 0)} fight records normalized; ${aggregate.legacyFieldsUnsetCount || 0} duplicated fighter fields removed.`);
      }

      await loadFighters();
    } catch (error) {
      toast.error(error.message || 'Fight fighter-field cleanup failed.');
    } finally {
      setCleaningLegacyFields(false);
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
          <button type="button" className="admin-action-secondary" onClick={() => runImport(true)} disabled={importing || cleaningLegacyFields}><FaMagic /> Dry-run import</button>
          <button type="button" className="admin-primary-action" onClick={() => runImport(false)} disabled={importing || cleaningLegacyFields}><FaRedo className={importing ? 'xp-spin' : ''} /> {importing ? 'Importing batches...' : 'Run automatic import'}</button>
          <button type="button" className="admin-action-secondary" onClick={() => runCleanup(true)} disabled={importing || cleaningLegacyFields}><FaMagic /> Dry-run cleanup</button>
          <button type="button" className="admin-primary-action" onClick={() => runCleanup(false)} disabled={importing || cleaningLegacyFields}><FaRedo className={cleaningLegacyFields ? 'xp-spin' : ''} /> {cleaningLegacyFields ? 'Cleaning batches...' : 'Normalize fight links'}</button>
          <button type="button" className="admin-action-secondary" onClick={() => loadFighters(page)}><FaSyncAlt className={loading ? 'xp-spin' : ''} /> Refresh</button>
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


      {cleanupPreview && (
        <section className="admin-success-panel admin-fighter-import-panel admin-fighter-cleanup-panel">
          <div>
            <span>{cleanupPreview.dryRun ? 'Cleanup dry-run ready' : cleaningLegacyFields ? 'Cleanup running' : 'Cleanup completed'}</span>
            <strong>{cleanupPreview.eligibleUpdates || cleanupPreview.modifiedMatches + cleanupPreview.modifiedShadows || 0} fight records normalized/eligible</strong>
            <p>{cleanupPreview.note || 'Fight records now resolve fighter names and images from the reusable fighter library. Legacy fields are removed only where a valid fighter ref exists.'}</p>
          </div>
          <div>
            <small>Total targets: {cleanupPreview.totalTargets || cleanupPreview.initialTotalTargets || 0}</small>
            <small>Inspected match/shadow: {cleanupPreview.inspectedMatches || 0} / {cleanupPreview.inspectedShadows || 0}</small>
            <small>Modified match/shadow: {cleanupPreview.modifiedMatches || 0} / {cleanupPreview.modifiedShadows || 0}</small>
            <small>Legacy fields removed: {cleanupPreview.legacyFieldsUnsetCount || 0}</small>
            <small>Resolved by name: {cleanupPreview.linkedByNameCount || 0}</small>
            <small>Unresolved sides preserved: {cleanupPreview.unresolvedSideCount || 0}</small>
            {cleanupProgress && <small>Cleanup progress: {cleanupProgress.processed || 0} / {cleanupProgress.total || 0}</small>}
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
            <label className="is-wide admin-fighter-file-field">
              <span>Upload fighter image</span>
              <input key={imageInputKey} type="file" accept="image/*" onChange={handleImageFileChange} />
              <div><FaUpload /><strong>{imageFile ? imageFile.name : 'Choose image from device'}</strong><small>Uploads directly to Cloudinary through backend. Max 5MB.</small></div>
            </label>
            <label className="is-wide admin-fighter-url-field"><span>Image URL fallback</span><input type="url" value={form.primaryImage} onChange={(event) => setForm((current) => ({ ...current, primaryImage: event.target.value }))} placeholder="Optional existing Cloudinary/external URL" disabled={Boolean(imageFile)} /></label>
          </div>
          <div className="admin-fighter-editor-preview">
            <OptimizedImage src={previewImageSrc} fallbackSrc={FALLBACK_IMAGE} alt={form.displayName || 'Fighter preview'} width={84} height={84} sizes="84px" />
            <div><strong>{form.displayName || 'Fighter preview'}</strong><small>{form.category} · {form.status}{imageFile ? ' · new upload selected' : ''}</small>{imageFile && <button type="button" className="admin-fighter-clear-upload" onClick={clearSelectedImageFile}><FaTimes /> Remove selected image</button>}</div>
          </div>
          <button type="submit" className="admin-primary-action" disabled={saving}><FaSave /> {saving ? 'Saving...' : editing ? 'Save fighter' : 'Create fighter'}</button>
        </form>

        <section className="admin-swarm-panel admin-combat-fighter-table-panel">
          <header><div><span>Reusable fighters</span><h2>{totalFighters} fighters</h2><small>Page {page} of {totalPages}</small></div></header>
          <div className="admin-table-toolbar admin-fighter-library-toolbar">
            <label className="admin-table-search"><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') loadFighters(1); }} placeholder="Search fighter name or alias" /></label>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option><option value="boxing">Boxing</option><option value="mma">MMA</option><option value="kickboxing">Kickboxing</option><option value="bare-knuckle">Bare-knuckle</option><option value="combat">Combat</option></select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="needs_review">Needs review</option><option value="inactive">Inactive</option></select>
            <button type="button" className="admin-action-secondary" onClick={() => loadFighters(1)}><FaSearch /> Apply</button>
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
                      <td><div className="admin-row-actions admin-fighter-row-actions"><button type="button" title="Edit fighter" onClick={() => startEdit(fighter)}><FaEdit /><span>Edit</span></button>{inactive ? <button type="button" title="Restore fighter" onClick={() => restoreFighter(fighter)}><FaUndo /><span>Restore</span></button> : <button type="button" title="Deactivate fighter" className="is-danger" onClick={() => softDeleteFighter(fighter)}><FaTrashAlt /><span>Delete</span></button>}</div></td>
                    </tr>
                  );
                }) : <tr><td colSpan="6"><div className="admin-empty-table"><FaFistRaised /><strong>No fighters found</strong><span>Run automatic import or create a fighter manually.</span></div></td></tr>}
              </tbody>
            </table>
          </div>
          <footer className="admin-fighter-pagination">
            <span>Showing {fighters.length} of {totalFighters} fighters</span>
            <div>
              <button type="button" className="admin-action-secondary" onClick={() => loadFighters(page - 1)} disabled={loading || !hasPreviousPage}>Previous</button>
              <strong>{page} / {totalPages}</strong>
              <button type="button" className="admin-action-secondary" onClick={() => loadFighters(page + 1)} disabled={loading || !hasNextPage}>Next</button>
            </div>
          </footer>
        </section>
      </section>
    </div>
  );
}
