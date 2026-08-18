import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { toast } from 'react-toastify';
import {
  FaCheck,
  FaClone,
  FaCoins,
  FaPlus,
  FaSave,
  FaShieldAlt,
  FaSlidersH,
  FaTrophy,
} from 'react-icons/fa';
import { WRESTLING_STATS, safeWrestlingArray, wrestlingRequest } from '@/Utils/proWrestling';

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeScoringForm = (rule = {}) => {
  const config = rule.config || {};
  const categories = config.categories || {};
  return {
    name: rule.name || config.name || rule.ruleId || '',
    active: rule.active !== false,
    auditReason: '',
    baseCategoryScore: asNumber(config.baseCategoryScore, 100),
    winnerBonus: asNumber(config.winnerBonus, 1000),
    multipliers: {
      exact: asNumber(config.multipliers?.exact, 1),
      within20Percent: asNumber(config.multipliers?.within20Percent, 0.75),
      within50Percent: asNumber(config.multipliers?.within50Percent, 0.4),
      outside50Percent: asNumber(config.multipliers?.outside50Percent, 0.1),
    },
    categories: WRESTLING_STATS.reduce((result, stat) => {
      const category = categories?.[stat.key]
        || safeWrestlingArray(categories).find((item) => item.key === stat.key)
        || {};
      result[stat.key] = {
        label: category.label || stat.label,
        weight: asNumber(category.weight, stat.weight),
      };
      return result;
    }, {}),
  };
};

const normalizePayoutForm = (rule = {}) => {
  const config = rule.config || {};
  return {
    name: rule.name || config.name || rule.ruleId || '',
    active: rule.active !== false,
    auditReason: '',
    topPercentage: asNumber(config.topPercentage, 10),
    minimumWinners: asNumber(config.minimumWinners, 3),
    platformFeePercentage: asNumber(config.platformFeePercentage, 0),
    firstPlacePercentage: asNumber(config.firstPlacePercentage, 40),
    secondPlacePercentage: asNumber(config.secondPlacePercentage, 25),
    thirdPlacePercentage: asNumber(config.thirdPlacePercentage, 15),
    remainingWinnersPercentage: asNumber(config.remainingWinnersPercentage, 20),
  };
};

const WrestlingAdminRules = () => {
  const [scoringRules, setScoringRules] = useState([]);
  const [payoutRules, setPayoutRules] = useState([]);
  const [selectedScoring, setSelectedScoring] = useState('');
  const [selectedPayout, setSelectedPayout] = useState('');
  const [scoringForm, setScoringForm] = useState(normalizeScoringForm());
  const [payoutForm, setPayoutForm] = useState(normalizePayoutForm());
  const [scoringBaseConfig, setScoringBaseConfig] = useState({});
  const [payoutBaseConfig, setPayoutBaseConfig] = useState({});
  const [newRule, setNewRule] = useState({ type: 'scoring', ruleId: '', name: '', active: true });
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);

  const hydrateScoring = (rule) => {
    if (!rule) return;
    setSelectedScoring(rule.ruleId);
    setScoringBaseConfig(rule.config || {});
    setScoringForm(normalizeScoringForm(rule));
  };

  const hydratePayout = (rule) => {
    if (!rule) return;
    setSelectedPayout(rule.ruleId);
    setPayoutBaseConfig(rule.config || {});
    setPayoutForm(normalizePayoutForm(rule));
  };

  const load = async (preferredScoring, preferredPayout) => {
    setLoading(true);
    try {
      const [scoringPayload, payoutPayload] = await Promise.all([
        wrestlingRequest('/api/admin/wrestling/scoring-rules', { admin: true }),
        wrestlingRequest('/api/admin/wrestling/payout-rules', { admin: true }),
      ]);
      const scoring = safeWrestlingArray(scoringPayload);
      const payout = safeWrestlingArray(payoutPayload);
      setScoringRules(scoring);
      setPayoutRules(payout);

      const scoringId = preferredScoring || selectedScoring || scoring[0]?.ruleId;
      const payoutId = preferredPayout || selectedPayout || payout[0]?.ruleId;
      hydrateScoring(scoring.find((rule) => rule.ruleId === scoringId) || scoring[0]);
      hydratePayout(payout.find((rule) => rule.ruleId === payoutId) || payout[0]);
    } catch (error) {
      toast.error(error.message || 'Wrestling rules could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // The initial ruleset fetch must run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectScoring = (ruleId) => hydrateScoring(scoringRules.find((item) => item.ruleId === ruleId));
  const selectPayout = (ruleId) => hydratePayout(payoutRules.find((item) => item.ruleId === ruleId));

  const updateScoring = (key, value) => setScoringForm((current) => ({ ...current, [key]: value }));
  const updateMultiplier = (key, value) => setScoringForm((current) => ({
    ...current,
    multipliers: { ...current.multipliers, [key]: value },
  }));
  const updateCategory = (key, field, value) => setScoringForm((current) => ({
    ...current,
    categories: {
      ...current.categories,
      [key]: { ...current.categories[key], [field]: value },
    },
  }));
  const updatePayout = (key, value) => setPayoutForm((current) => ({ ...current, [key]: value }));

  const buildScoringConfig = (ruleId = selectedScoring, name = scoringForm.name) => ({
    ...scoringBaseConfig,
    ruleId,
    name,
    baseCategoryScore: asNumber(scoringForm.baseCategoryScore, 100),
    winnerBonus: asNumber(scoringForm.winnerBonus, 1000),
    multipliers: {
      ...(scoringBaseConfig.multipliers || {}),
      exact: asNumber(scoringForm.multipliers.exact, 1),
      within20Percent: asNumber(scoringForm.multipliers.within20Percent, 0.75),
      within50Percent: asNumber(scoringForm.multipliers.within50Percent, 0.4),
      outside50Percent: asNumber(scoringForm.multipliers.outside50Percent, 0.1),
    },
    categories: WRESTLING_STATS.reduce((result, stat) => {
      result[stat.key] = {
        ...(scoringBaseConfig.categories?.[stat.key] || {}),
        label: scoringForm.categories[stat.key]?.label || stat.label,
        weight: asNumber(scoringForm.categories[stat.key]?.weight, stat.weight),
      };
      return result;
    }, {}),
  });

  const buildPayoutConfig = (ruleId = selectedPayout, name = payoutForm.name) => ({
    ...payoutBaseConfig,
    ruleId,
    name,
    topPercentage: asNumber(payoutForm.topPercentage, 10),
    minimumWinners: Math.max(1, Math.round(asNumber(payoutForm.minimumWinners, 3))),
    platformFeePercentage: asNumber(payoutForm.platformFeePercentage, 0),
    firstPlacePercentage: asNumber(payoutForm.firstPlacePercentage, 40),
    secondPlacePercentage: asNumber(payoutForm.secondPlacePercentage, 25),
    thirdPlacePercentage: asNumber(payoutForm.thirdPlacePercentage, 15),
    remainingWinnersPercentage: asNumber(payoutForm.remainingWinnersPercentage, 20),
  });

  const saveExisting = async (type) => {
    const isScoring = type === 'scoring';
    const ruleId = isScoring ? selectedScoring : selectedPayout;
    const form = isScoring ? scoringForm : payoutForm;
    if (!ruleId || !form.name.trim()) {
      toast.error('A rule and display name are required.');
      return;
    }

    const payoutTotal = !isScoring
      ? ['firstPlacePercentage', 'secondPlacePercentage', 'thirdPlacePercentage', 'remainingWinnersPercentage']
        .reduce((sum, key) => sum + asNumber(payoutForm[key]), 0)
      : 100;
    if (!isScoring && Math.abs(payoutTotal - 100) > 0.001) {
      toast.error(`Winner payout shares must total 100%. Current total: ${payoutTotal}%.`);
      return;
    }

    setSaving(type);
    try {
      const collection = isScoring ? 'scoring-rules' : 'payout-rules';
      const config = isScoring ? buildScoringConfig() : buildPayoutConfig();
      await wrestlingRequest(`/api/admin/wrestling/${collection}/${ruleId}`, {
        admin: true,
        method: 'PUT',
        body: {
          name: form.name.trim(),
          active: form.active,
          config,
          reason: form.auditReason.trim() || `Updated ${type} configuration from the visual rules editor.`,
        },
      });
      toast.success(`${isScoring ? 'Scoring' : 'Payout'} rules updated.`);
      await load(isScoring ? ruleId : undefined, isScoring ? undefined : ruleId);
    } catch (error) {
      toast.error(error.message || `The ${type} rules could not be saved.`);
    } finally {
      setSaving('');
    }
  };

  const createVersion = async (event) => {
    event.preventDefault();
    const ruleId = newRule.ruleId.trim().toUpperCase();
    const name = newRule.name.trim();
    if (!ruleId || !name) {
      toast.error('A unique rule ID and display name are required.');
      return;
    }
    const isScoring = newRule.type === 'scoring';
    if (!isScoring && Math.abs(payoutShareTotal - 100) > 0.001) {
      toast.error(`Winner payout shares must total 100%. Current total: ${payoutShareTotal}%.`);
      return;
    }
    setSaving('create');
    try {
      const collection = isScoring ? 'scoring-rules' : 'payout-rules';
      const config = isScoring ? buildScoringConfig(ruleId, name) : buildPayoutConfig(ruleId, name);
      await wrestlingRequest(`/api/admin/wrestling/${collection}`, {
        admin: true,
        method: 'POST',
        body: { ruleId, name, active: newRule.active, config },
      });
      toast.success(`New ${isScoring ? 'scoring' : 'payout'} rule version created.`);
      setNewRule({ type: newRule.type, ruleId: '', name: '', active: true });
      await load(isScoring ? ruleId : undefined, isScoring ? undefined : ruleId);
    } catch (error) {
      toast.error(error.message || 'The new ruleset version could not be created.');
    } finally {
      setSaving('');
    }
  };

  const payoutShareTotal = useMemo(() => (
    ['firstPlacePercentage', 'secondPlacePercentage', 'thirdPlacePercentage', 'remainingWinnersPercentage']
      .reduce((sum, key) => sum + asNumber(payoutForm[key]), 0)
  ), [payoutForm]);
  const scoringPreview = useMemo(() => WRESTLING_STATS.map((stat) => ({
    ...stat,
    label: scoringForm.categories[stat.key]?.label || stat.label,
    weight: asNumber(scoringForm.categories[stat.key]?.weight, stat.weight),
  })), [scoringForm.categories]);

  return (
    <>
      <Head><title>Wrestling Rules | FMM Administration</title></Head>
      <div className="pw-admin-page pw-admin-rules-page">
        <div className="pw-admin-form-heading">
          <p>Versioned game logic</p>
          <h1>Scoring and payout rules</h1>
          <span>Edit every operational value through labeled fields. Each contest still receives an immutable ruleset snapshot.</span>
        </div>

        <section className="pw-admin-rule-overview">
          <article><FaTrophy /><span><small>Scoring engine</small><strong>Accuracy bands + category weights</strong><p>HP, BP, K, PM, FM, winner bonus, and deterministic tie-breakers.</p></span></article>
          <article><FaCoins /><span><small>Settlement engine</small><strong>Top-percentage payout</strong><p>Winner count, podium shares, platform fee, and remaining-winner allocation.</p></span></article>
          <article><FaShieldAlt /><span><small>Historical integrity</small><strong>Ruleset snapshot</strong><p>Published contests keep the exact version assigned at creation.</p></span></article>
        </section>

        {loading ? <div className="pw-admin-loading">Loading versioned wrestling rules…</div> : (
          <>
            <section className="pw-admin-scoring-preview">
              <header><div><p>Readable scoring preview</p><h2>Current category weights</h2></div><FaTrophy /></header>
              <div>{scoringPreview.map((stat) => <span key={stat.key}><b>{stat.short}</b><strong>{stat.weight}×</strong><small>{stat.label}</small></span>)}</div>
            </section>

            <section className="pw-admin-visual-rule-grid">
              <article className="pw-admin-visual-rule-card">
                <header>
                  <div><FaSlidersH /><span><small>Scoring configuration</small><h2>{selectedScoring || 'No rule selected'}</h2></span></div>
                  <select value={selectedScoring} onChange={(event) => selectScoring(event.target.value)}>{scoringRules.map((rule) => <option key={rule.ruleId} value={rule.ruleId}>{rule.name} ({rule.ruleId}){rule.active === false ? ' · inactive' : ''}</option>)}</select>
                </header>

                <div className="pw-admin-rule-field-grid">
                  <label className="is-wide"><span>Display name</span><input value={scoringForm.name} onChange={(event) => updateScoring('name', event.target.value)} /></label>
                  <label><span>Base category score</span><input type="number" min="0" step="1" value={scoringForm.baseCategoryScore} onChange={(event) => updateScoring('baseCategoryScore', event.target.value)} /></label>
                  <label><span>Correct winner bonus</span><input type="number" min="0" step="1" value={scoringForm.winnerBonus} onChange={(event) => updateScoring('winnerBonus', event.target.value)} /></label>
                  <label className="is-check"><input type="checkbox" checked={scoringForm.active} onChange={(event) => updateScoring('active', event.target.checked)} /><span>Active for new contests</span></label>
                </div>

                <section className="pw-admin-rule-subpanel">
                  <header><div><small>Accuracy bands</small><strong>Prediction multiplier</strong></div><span>1.00 = 100% of category points</span></header>
                  <div className="pw-admin-rule-field-grid is-four">
                    <label><span>Exact prediction</span><input type="number" min="0" step="0.01" value={scoringForm.multipliers.exact} onChange={(event) => updateMultiplier('exact', event.target.value)} /></label>
                    <label><span>Within 20%</span><input type="number" min="0" step="0.01" value={scoringForm.multipliers.within20Percent} onChange={(event) => updateMultiplier('within20Percent', event.target.value)} /></label>
                    <label><span>Within 50%</span><input type="number" min="0" step="0.01" value={scoringForm.multipliers.within50Percent} onChange={(event) => updateMultiplier('within50Percent', event.target.value)} /></label>
                    <label><span>Outside 50%</span><input type="number" min="0" step="0.01" value={scoringForm.multipliers.outside50Percent} onChange={(event) => updateMultiplier('outside50Percent', event.target.value)} /></label>
                  </div>
                </section>

                <section className="pw-admin-rule-subpanel">
                  <header><div><small>Action categories</small><strong>Labels and weights</strong></div><span>Higher weight means a larger score contribution.</span></header>
                  <div className="pw-admin-category-editor">
                    {WRESTLING_STATS.map((stat) => <article key={stat.key}><b>{stat.short}</b><label><span>Public label</span><input value={scoringForm.categories[stat.key]?.label || ''} onChange={(event) => updateCategory(stat.key, 'label', event.target.value)} /></label><label><span>Weight</span><input type="number" min="0" step="0.1" value={scoringForm.categories[stat.key]?.weight ?? stat.weight} onChange={(event) => updateCategory(stat.key, 'weight', event.target.value)} /></label></article>)}
                  </div>
                </section>

                <label className="pw-admin-rule-reason"><span>Audit reason</span><input value={scoringForm.auditReason} onChange={(event) => updateScoring('auditReason', event.target.value)} placeholder="Explain why the scoring configuration is changing" /></label>
                <details className="pw-admin-rule-json-preview"><summary>Advanced JSON preview</summary><pre>{JSON.stringify(buildScoringConfig(), null, 2)}</pre></details>
                <button type="button" onClick={() => saveExisting('scoring')} disabled={!selectedScoring || Boolean(saving)}><FaSave /> {saving === 'scoring' ? 'Saving…' : 'Save scoring rules'}</button>
              </article>

              <article className="pw-admin-visual-rule-card">
                <header>
                  <div><FaCoins /><span><small>Payout configuration</small><h2>{selectedPayout || 'No rule selected'}</h2></span></div>
                  <select value={selectedPayout} onChange={(event) => selectPayout(event.target.value)}>{payoutRules.map((rule) => <option key={rule.ruleId} value={rule.ruleId}>{rule.name} ({rule.ruleId}){rule.active === false ? ' · inactive' : ''}</option>)}</select>
                </header>

                <div className="pw-admin-rule-field-grid">
                  <label className="is-wide"><span>Display name</span><input value={payoutForm.name} onChange={(event) => updatePayout('name', event.target.value)} /></label>
                  <label><span>Top percentage paid</span><input type="number" min="0" max="100" step="0.1" value={payoutForm.topPercentage} onChange={(event) => updatePayout('topPercentage', event.target.value)} /></label>
                  <label><span>Minimum winners</span><input type="number" min="1" step="1" value={payoutForm.minimumWinners} onChange={(event) => updatePayout('minimumWinners', event.target.value)} /></label>
                  <label><span>Platform fee %</span><input type="number" min="0" max="100" step="0.1" value={payoutForm.platformFeePercentage} onChange={(event) => updatePayout('platformFeePercentage', event.target.value)} /></label>
                  <label className="is-check"><input type="checkbox" checked={payoutForm.active} onChange={(event) => updatePayout('active', event.target.checked)} /><span>Active for new contests</span></label>
                </div>

                <section className="pw-admin-rule-subpanel">
                  <header><div><small>Winner pool allocation</small><strong>Podium and remaining winners</strong></div><span className={Math.abs(payoutShareTotal - 100) < 0.001 ? 'is-valid' : 'is-invalid'}>{payoutShareTotal}% allocated</span></header>
                  <div className="pw-admin-payout-editor">
                    <label><FaTrophy /><span><small>First place</small><input type="number" min="0" max="100" step="0.1" value={payoutForm.firstPlacePercentage} onChange={(event) => updatePayout('firstPlacePercentage', event.target.value)} /></span><b>%</b></label>
                    <label><FaTrophy /><span><small>Second place</small><input type="number" min="0" max="100" step="0.1" value={payoutForm.secondPlacePercentage} onChange={(event) => updatePayout('secondPlacePercentage', event.target.value)} /></span><b>%</b></label>
                    <label><FaTrophy /><span><small>Third place</small><input type="number" min="0" max="100" step="0.1" value={payoutForm.thirdPlacePercentage} onChange={(event) => updatePayout('thirdPlacePercentage', event.target.value)} /></span><b>%</b></label>
                    <label><FaCoins /><span><small>Remaining winners</small><input type="number" min="0" max="100" step="0.1" value={payoutForm.remainingWinnersPercentage} onChange={(event) => updatePayout('remainingWinnersPercentage', event.target.value)} /></span><b>%</b></label>
                  </div>
                </section>

                <label className="pw-admin-rule-reason"><span>Audit reason</span><input value={payoutForm.auditReason} onChange={(event) => updatePayout('auditReason', event.target.value)} placeholder="Explain why the payout configuration is changing" /></label>
                <details className="pw-admin-rule-json-preview"><summary>Advanced JSON preview</summary><pre>{JSON.stringify(buildPayoutConfig(), null, 2)}</pre></details>
                <button type="button" onClick={() => saveExisting('payout')} disabled={!selectedPayout || Boolean(saving)}><FaSave /> {saving === 'payout' ? 'Saving…' : 'Save payout rules'}</button>
              </article>
            </section>

            <form className="pw-admin-rule-clone" onSubmit={createVersion}>
              <header><FaClone /><div><p>Safe rules evolution</p><h2>Create a new version from the selected configuration</h2><span>The values currently visible in the scoring or payout editor become the starting point for the new immutable rule ID.</span></div></header>
              <div>
                <label><span>Rule type</span><select value={newRule.type} onChange={(event) => setNewRule((current) => ({ ...current, type: event.target.value }))}><option value="scoring">Scoring</option><option value="payout">Payout</option></select></label>
                <label><span>New rule ID</span><input value={newRule.ruleId} onChange={(event) => setNewRule((current) => ({ ...current, ruleId: event.target.value.toUpperCase() }))} placeholder="WRESTLING_V2" /></label>
                <label><span>Display name</span><input value={newRule.name} onChange={(event) => setNewRule((current) => ({ ...current, name: event.target.value }))} placeholder="Wrestling scoring V2" /></label>
                <label className="pw-admin-inline-check"><input type="checkbox" checked={newRule.active} onChange={(event) => setNewRule((current) => ({ ...current, active: event.target.checked }))} /><span>Active for new contests</span></label>
              </div>
              <button type="submit" className="pw-admin-primary" disabled={Boolean(saving)}><FaPlus /> {saving === 'create' ? 'Creating version…' : 'Create new rule version'}</button>
            </form>
          </>
        )}

        <div className="pw-admin-rule-warning"><FaCheck /><span><strong>Operational recommendation</strong><small>Create a new rule version for material scoring or payout changes instead of modifying a ruleset already assigned to published contests.</small></span></div>
      </div>
    </>
  );
};

export default WrestlingAdminRules;
