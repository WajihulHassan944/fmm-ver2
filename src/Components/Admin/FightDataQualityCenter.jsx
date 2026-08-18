import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FaBolt,
  FaCheck,
  FaDatabase,
  FaEdit,
  FaExclamationTriangle,
  FaFistRaised,
  FaImage,
  FaLink,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTrashAlt,
  FaUserShield,
} from 'react-icons/fa';
import { DEFAULT_COMBAT_SCORING } from '@/Utils/scoringRules';
import { fightDataQualityApi, getFightGroupTitle, getImageStatusClass } from '@/Utils/fightDataQualityApi';

const qualityTabs = [
  { key: 'duplicates', label: 'Duplicate fights', icon: FaDatabase },
  { key: 'images', label: 'Image health', icon: FaImage },
  { key: 'fighters', label: 'Fighter library', icon: FaFistRaised },
  { key: 'scoring', label: 'Scoring config', icon: FaBolt },
];

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const getRows = (payload) => {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.suggestions)) return payload.suggestions;
  if (Array.isArray(payload?.groups)) return payload.groups;
  return [];
};

const FightDataQualityCenter = ({ onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('duplicates');
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState('');
  const [scoringConfig, setScoringConfig] = useState(DEFAULT_COMBAT_SCORING);
  const [duplicatePayload, setDuplicatePayload] = useState(null);
  const [duplicateOptions, setDuplicateOptions] = useState({ limit: 500, includeFinished: true });
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);
  const [imagePayload, setImagePayload] = useState(null);
  const [imageOptions, setImageOptions] = useState({ limit: 100, check: false, onlyBroken: false });
  const [fightersPayload, setFightersPayload] = useState(null);
  const [fighterSearch, setFighterSearch] = useState('');
  const [suggestionsPayload, setSuggestionsPayload] = useState(null);

  const duplicateGroups = useMemo(() => getRows(duplicatePayload), [duplicatePayload]);
  const imageRows = useMemo(() => getRows(imagePayload), [imagePayload]);
  const fighters = useMemo(() => getRows(fightersPayload), [fightersPayload]);
  const fighterSuggestions = useMemo(() => getRows(suggestionsPayload), [suggestionsPayload]);

  const loadScoringConfig = useCallback(async () => {
    try {
      const payload = await fightDataQualityApi.scoringConfig();
      setScoringConfig(payload?.config || DEFAULT_COMBAT_SCORING);
    } catch (error) {
      console.warn('Could not load backend scoring config:', error.message);
      setScoringConfig(DEFAULT_COMBAT_SCORING);
    }
  }, []);

  const loadDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fightDataQualityApi.duplicateFights({
        limit: duplicateOptions.limit,
        includeFinished: duplicateOptions.includeFinished,
      });
      setDuplicatePayload(payload);
      setSelectedDeleteIds([]);
    } catch (error) {
      toast.error(error.message || 'Could not load duplicate fights.');
    } finally {
      setLoading(false);
    }
  }, [duplicateOptions]);

  const loadImageHealth = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fightDataQualityApi.imageHealth({
        limit: imageOptions.limit,
        check: imageOptions.check,
        onlyBroken: imageOptions.onlyBroken,
      });
      setImagePayload(payload);
    } catch (error) {
      toast.error(error.message || 'Could not load image health report.');
    } finally {
      setLoading(false);
    }
  }, [imageOptions]);

  const loadFighters = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fightDataQualityApi.combatFighters({ limit: 50, search: fighterSearch });
      setFightersPayload(payload);
    } catch (error) {
      toast.error(error.message || 'Could not load combat fighters.');
    } finally {
      setLoading(false);
    }
  }, [fighterSearch]);

  const loadSuggestions = async () => {
    setActionId('suggestions');
    try {
      const payload = await fightDataQualityApi.suggestCombatFighters({ limit: 1500 });
      setSuggestionsPayload(payload);
      toast.success(`${payload?.suggestionCount || 0} fighter suggestions prepared. Nothing was created automatically.`);
    } catch (error) {
      toast.error(error.message || 'Could not generate fighter suggestions.');
    } finally {
      setActionId('');
    }
  };

  useEffect(() => {
    loadScoringConfig();
    loadDuplicates();
  }, [loadScoringConfig, loadDuplicates]);

  useEffect(() => {
    if (activeTab === 'images' && !imagePayload) loadImageHealth();
    if (activeTab === 'fighters' && !fightersPayload) loadFighters();
  }, [activeTab, fightersPayload, imagePayload, loadFighters, loadImageHealth]);

  const toggleDeleteId = (id) => {
    setSelectedDeleteIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const selectSuggestedDeletes = (group) => {
    const preserveId = String(group.preserveSuggestion || '');
    const ids = (group.matches || []).map((item) => String(item.id)).filter((id) => id && id !== preserveId);
    setSelectedDeleteIds((current) => Array.from(new Set([...current, ...ids])));
  };

  const runDuplicateDelete = async (dryRun = true) => {
    if (!selectedDeleteIds.length) return toast.warning('Select duplicate fight IDs first.');
    if (!dryRun) {
      const confirmed = window.confirm(`Delete ${selectedDeleteIds.length} selected duplicate fight record(s)? This cannot be undone.`);
      if (!confirmed) return;
    }
    setActionId(dryRun ? 'dry-run-delete' : 'delete');
    try {
      const payload = await fightDataQualityApi.deleteDuplicateFights(selectedDeleteIds, dryRun);
      toast.success(dryRun ? `${payload?.deleteCount || 0} fights would be deleted.` : `${payload?.deletedCount || 0} duplicate fights deleted.`);
      if (!dryRun) {
        setSelectedDeleteIds([]);
        await loadDuplicates();
        onRefresh?.();
      }
    } catch (error) {
      toast.error(error.message || 'Duplicate delete action failed.');
    } finally {
      setActionId('');
    }
  };

  const createFighterFromSuggestion = async (suggestion) => {
    setActionId(`create:${suggestion.normalizedName}`);
    try {
      await fightDataQualityApi.createCombatFighter({
        displayName: suggestion.displayName,
        category: suggestion.category,
        aliases: suggestion.aliases || [],
        primaryImage: suggestion.primaryImageCandidate || '',
        status: suggestion.primaryImageCandidate ? 'active' : 'needs_review',
        source: 'admin-suggestion-review',
        metadata: { matchIds: suggestion.matchIds || [], candidateImages: suggestion.candidateImages || [] },
      });
      toast.success(`${suggestion.displayName} added to combat fighter library.`);
      await loadFighters();
    } catch (error) {
      toast.error(error.message || 'Could not create fighter.');
    } finally {
      setActionId('');
    }
  };

  const tabClass = (key) => `admin-swarm-tab${activeTab === key ? ' is-active' : ''}`;
  const points = scoringConfig?.points || DEFAULT_COMBAT_SCORING.points;

  return (
    <div className="admin-fight-quality-center">
      <section className="admin-swarm-hero admin-fight-quality-hero">
        <div>
          <p className="admin-page-eyebrow"><FaUserShield /> Fight data quality</p>
          <h1>Clean duplicates, broken images, scoring config, and fighter records safely.</h1>
          <p>Everything here is approval-first. Reports do not modify fights unless the admin explicitly deletes selected records or creates fighter library entries.</p>
        </div>
        <div className="admin-heading-actions">
          {onBack && <button type="button" className="admin-action-secondary" onClick={onBack}>Back to fights</button>}
          <button type="button" className="admin-action-secondary" onClick={() => { loadScoringConfig(); loadDuplicates(); loadImageHealth(); loadFighters(); }} disabled={loading}><FaSyncAlt className={loading ? 'xp-spin' : ''} /> Refresh tools</button>
        </div>
      </section>

      <section className="admin-swarm-tabs admin-quality-tabs" aria-label="Fight data quality tools">
        {qualityTabs.map((tab) => {
          const Icon = tab.icon;
          return <button key={tab.key} type="button" className={tabClass(tab.key)} onClick={() => setActiveTab(tab.key)}><Icon /> {tab.label}</button>;
        })}
      </section>

      {activeTab === 'duplicates' && (
        <section className="admin-swarm-panel admin-swarm-list-panel">
          <header>
            <div><span>Duplicate checker</span><h2>Review duplicate fight groups</h2></div>
            <div className="admin-swarm-filters">
              <label><span>Limit</span><input type="number" min="1" max="2000" value={duplicateOptions.limit} onChange={(event) => setDuplicateOptions((current) => ({ ...current, limit: event.target.value }))} /></label>
              <label className="admin-swarm-switch"><input type="checkbox" checked={duplicateOptions.includeFinished} onChange={(event) => setDuplicateOptions((current) => ({ ...current, includeFinished: event.target.checked }))} /><span>Include finished</span></label>
              <button type="button" className="admin-action-secondary" onClick={loadDuplicates} disabled={loading}><FaSearch /> Scan</button>
            </div>
          </header>
          <div className="admin-swarm-mini-grid">
            <article><small>Inspected</small><strong>{duplicatePayload?.inspected ?? '—'}</strong></article>
            <article><small>Duplicate groups</small><strong>{duplicatePayload?.duplicateGroupCount ?? duplicateGroups.length}</strong></article>
            <article><small>Selected to delete</small><strong>{selectedDeleteIds.length}</strong></article>
          </div>
          <div className="admin-bulk-actions">
            <button type="button" className="admin-action-secondary" disabled={!selectedDeleteIds.length || Boolean(actionId)} onClick={() => runDuplicateDelete(true)}><FaCheck /> Dry-run selected</button>
            <button type="button" className="admin-danger-action" disabled={!selectedDeleteIds.length || Boolean(actionId)} onClick={() => runDuplicateDelete(false)}><FaTrashAlt /> Delete selected</button>
            <small>{duplicatePayload?.strategy || 'LIVE and SHADOW records may intentionally coexist, so review before deleting.'}</small>
          </div>
          <div className="admin-quality-group-list">
            {!duplicateGroups.length ? <div className="admin-swarm-empty"><FaDatabase /><strong>No duplicate groups found</strong><span>Run the checker again after importing new fight data.</span></div> : duplicateGroups.map((group) => (
              <article key={group.key} className="admin-quality-group-card">
                <header>
                  <div><strong>{getFightGroupTitle(group)}</strong><small>{group.count} records · preserve suggestion: {group.preserveSuggestion || '—'}</small></div>
                  <button type="button" className="admin-action-secondary" onClick={() => selectSuggestedDeletes(group)}>Select suggested deletes</button>
                </header>
                <div className="admin-data-table-scroll">
                  <table className="admin-data-table admin-quality-table">
                    <thead><tr><th>Select</th><th>Fight</th><th>Type</th><th>Status</th><th>Stats</th><th>Images</th><th>Updated</th></tr></thead>
                    <tbody>{(group.matches || []).map((match) => {
                      const id = String(match.id || '');
                      const preserve = id === String(group.preserveSuggestion || '');
                      return <tr key={id} className={preserve ? 'is-preserve-row' : ''}><td><input type="checkbox" disabled={preserve} checked={selectedDeleteIds.includes(id)} onChange={() => toggleDeleteId(id)} /></td><td><strong>{match.matchName || 'Untitled'}</strong><small>{match.matchFighterA} vs {match.matchFighterB}</small></td><td>{match.matchType || '—'}</td><td><span className="admin-status-badge is-warning">{match.matchStatus || '—'}</span></td><td>{match.hasStats ? 'Yes' : 'No'}</td><td>{match.hasImages ? 'Yes' : 'No'}</td><td>{formatDate(match.updatedAt)}</td></tr>;
                    })}</tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'images' && (
        <section className="admin-swarm-panel admin-swarm-list-panel">
          <header>
            <div><span>Broken image checker</span><h2>Find missing fighter/poster images</h2></div>
            <div className="admin-swarm-filters">
              <label><span>Limit</span><input type="number" min="1" max="500" value={imageOptions.limit} onChange={(event) => setImageOptions((current) => ({ ...current, limit: event.target.value }))} /></label>
              <label className="admin-swarm-switch"><input type="checkbox" checked={imageOptions.check} onChange={(event) => setImageOptions((current) => ({ ...current, check: event.target.checked }))} /><span>Remote HEAD check</span></label>
              <label className="admin-swarm-switch"><input type="checkbox" checked={imageOptions.onlyBroken} onChange={(event) => setImageOptions((current) => ({ ...current, onlyBroken: event.target.checked }))} /><span>Only broken</span></label>
              <button type="button" className="admin-action-secondary" onClick={loadImageHealth} disabled={loading}><FaSearch /> Check images</button>
            </div>
          </header>
          <small className="admin-swarm-note">Remote checks are read-only. They verify 404/missing URLs but never replace images automatically.</small>
          <div className="admin-data-table-scroll">
            <table className="admin-data-table admin-quality-table">
              <thead><tr><th>Fight</th><th>Fighters</th><th>Type</th><th>Status</th><th>Broken fields</th><th>Image statuses</th></tr></thead>
              <tbody>{imageRows.length ? imageRows.map((row) => <tr key={row.matchId}><td><strong>{row.matchName || 'Untitled'}</strong><small>{row.matchId}</small></td><td>{(row.fighters || []).join(' vs ')}</td><td>{row.matchType || '—'}</td><td>{row.matchStatus || '—'}</td><td>{row.brokenFields?.length ? row.brokenFields.join(', ') : 'None'}</td><td><div className="admin-quality-status-list">{Object.entries(row.checks || {}).map(([field, item]) => <span key={field} className={`admin-status-badge ${getImageStatusClass(item.status)}`}>{field}: {item.status}{item.httpStatus ? ` ${item.httpStatus}` : ''}</span>)}</div></td></tr>) : <tr><td colSpan="6"><div className="admin-swarm-empty"><FaImage /><strong>No image rows loaded</strong><span>Run the checker to inspect fighter and promotion images.</span></div></td></tr>}</tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'fighters' && (
        <section className="admin-swarm-layout admin-swarm-layout-wide">
          <section className="admin-swarm-panel">
            <header>
              <div><span>Combat fighter library</span><h2>Reusable fighters for future fights</h2></div>
              <div className="admin-heading-actions"><a className="admin-action-secondary" href="/administration/fighters"><FaEdit /> Manage fighters</a><button type="button" className="admin-action-secondary" onClick={loadFighters} disabled={loading}><FaSyncAlt /> Refresh</button></div>
            </header>
            <label className="admin-swarm-field-full"><span>Search fighters</span><input value={fighterSearch} onChange={(event) => setFighterSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') loadFighters(); }} placeholder="Search name, alias, or category" /></label>
            <div className="admin-data-table-scroll">
              <table className="admin-data-table admin-quality-table">
                <thead><tr><th>Fighter</th><th>Category</th><th>Image</th><th>Status</th><th>Updated</th></tr></thead>
                <tbody>{fighters.length ? fighters.map((fighter) => <tr key={fighter.id}><td><strong>{fighter.displayName}</strong><small>{fighter.aliases?.join(', ') || fighter.normalizedName}</small></td><td>{fighter.category}</td><td>{fighter.primaryImage ? <a href={fighter.primaryImage} target="_blank" rel="noreferrer">Open image</a> : '—'}</td><td><span className={`admin-status-badge ${fighter.status === 'active' ? 'is-success' : 'is-warning'}`}>{fighter.status}</span></td><td>{formatDate(fighter.updatedAt)}</td></tr>) : <tr><td colSpan="5">No fighter library rows found yet.</td></tr>}</tbody>
              </table>
            </div>
          </section>

          <aside className="admin-swarm-panel admin-swarm-health">
            <header>
              <div><span>Safe suggestions</span><h2>Create from matches</h2></div>
              <button type="button" className="admin-action-secondary" onClick={loadSuggestions} disabled={Boolean(actionId)}><FaPlus /> Suggest</button>
            </header>
            <small className="admin-swarm-note">Suggestions are dry-run. Use “Create” only after reviewing the name and image candidate.</small>
            <div className="admin-quality-suggestion-list">
              {fighterSuggestions.slice(0, 12).map((suggestion) => <article key={`${suggestion.category}-${suggestion.normalizedName}`}><strong>{suggestion.displayName}</strong><span>{suggestion.category} · {suggestion.matchCount} matches</span>{suggestion.primaryImageCandidate ? <a href={suggestion.primaryImageCandidate} target="_blank" rel="noreferrer">Preview image</a> : <em>No image candidate</em>}<button type="button" className="admin-topbar-primary" disabled={Boolean(actionId)} onClick={() => createFighterFromSuggestion(suggestion)}><FaPlus /> Create</button></article>)}
              {!fighterSuggestions.length && <p className="admin-swarm-note">No suggestions loaded yet.</p>}
            </div>
          </aside>
        </section>
      )}

      {activeTab === 'scoring' && (
        <section className="admin-swarm-panel">
          <header><div><span>Backend scoring source</span><h2>Round outcome values</h2></div><button type="button" className="admin-action-secondary" onClick={loadScoringConfig}><FaSyncAlt /> Reload</button></header>
          <div className="admin-swarm-mini-grid">
            <article><small>KO</small><strong>{points.KO}</strong><span>{scoringConfig?.labels?.KO}</span></article>
            <article><small>SP</small><strong>{points.SP}</strong><span>{scoringConfig?.labels?.SP}</span></article>
            <article><small>RW</small><strong>{points.RW}</strong><span>{scoringConfig?.labels?.RW}</span></article>
            <article><small>RL</small><strong>{points.RL}</strong><span>{scoringConfig?.labels?.RL}</span></article>
          </div>
          <div className="admin-swarm-section-preview">
            <section><strong>Radio-style admin selection</strong><p>Admin selects the round winner/finish outcome once. Opponent RW/RL and KO/SP values are derived consistently from backend config.</p></section>
            <section><strong>No stat auto-calculation</strong><p>Actual fight stats such as punches, strikes, kicks, knockdowns, and elbows stay manually editable and are not auto-calculated.</p></section>
            <section><strong>Mock/user side alignment</strong><p>User predictions and mock game labels now use the same shared frontend scoring constants and remain compatible with backend values.</p></section>
          </div>
        </section>
      )}
    </div>
  );
};

export default FightDataQualityCenter;
