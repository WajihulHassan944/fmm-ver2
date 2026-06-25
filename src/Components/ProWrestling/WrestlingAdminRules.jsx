import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { toast } from 'react-toastify';
import {
  FaCheck,
  FaClone,
  FaCode,
  FaCoins,
  FaPlus,
  FaSave,
  FaShieldAlt,
  FaTrophy,
} from 'react-icons/fa';
import { WRESTLING_STATS, safeWrestlingArray, wrestlingRequest } from '@/Utils/proWrestling';

const WrestlingAdminRules = () => {
  const [scoringRules, setScoringRules] = useState([]);
  const [payoutRules, setPayoutRules] = useState([]);
  const [selectedScoring, setSelectedScoring] = useState('');
  const [selectedPayout, setSelectedPayout] = useState('');
  const [scoringJson, setScoringJson] = useState('');
  const [payoutJson, setPayoutJson] = useState('');
  const [newRule, setNewRule] = useState({ type: 'scoring', ruleId: '', name: '', active: true });
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);

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

      const scoringId = preferredScoring || selectedScoring || scoring[0]?.ruleId || '';
      const payoutId = preferredPayout || selectedPayout || payout[0]?.ruleId || '';
      const scoringRule = scoring.find((rule) => rule.ruleId === scoringId) || scoring[0];
      const payoutRule = payout.find((rule) => rule.ruleId === payoutId) || payout[0];
      if (scoringRule) {
        setSelectedScoring(scoringRule.ruleId);
        setScoringJson(JSON.stringify(scoringRule.config, null, 2));
      }
      if (payoutRule) {
        setSelectedPayout(payoutRule.ruleId);
        setPayoutJson(JSON.stringify(payoutRule.config, null, 2));
      }
    } catch (error) {
      toast.error(error.message || 'Wrestling rules could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectScoring = (ruleId) => {
    const rule = scoringRules.find((item) => item.ruleId === ruleId);
    setSelectedScoring(ruleId);
    setScoringJson(JSON.stringify(rule?.config || {}, null, 2));
  };

  const selectPayout = (ruleId) => {
    const rule = payoutRules.find((item) => item.ruleId === ruleId);
    setSelectedPayout(ruleId);
    setPayoutJson(JSON.stringify(rule?.config || {}, null, 2));
  };

  const saveExisting = async (type) => {
    setSaving(type);
    try {
      const isScoring = type === 'scoring';
      const ruleId = isScoring ? selectedScoring : selectedPayout;
      const rules = isScoring ? scoringRules : payoutRules;
      const selectedRule = rules.find((rule) => rule.ruleId === ruleId);
      const config = JSON.parse(isScoring ? scoringJson : payoutJson);
      const collection = isScoring ? 'scoring-rules' : 'payout-rules';
      await wrestlingRequest(`/api/admin/wrestling/${collection}/${ruleId}`, {
        admin: true,
        method: 'PUT',
        body: {
          name: selectedRule?.name || config.name || ruleId,
          active: selectedRule?.active !== false,
          config,
          reason: 'Updated from Pro Wrestling admin rules workspace.',
        },
      });
      toast.success(`${isScoring ? 'Scoring' : 'Payout'} rules updated.`);
      await load(isScoring ? ruleId : undefined, isScoring ? undefined : ruleId);
    } catch (error) {
      toast.error(error instanceof SyntaxError ? 'The JSON configuration is invalid.' : error.message);
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
    setSaving('create');
    try {
      const isScoring = newRule.type === 'scoring';
      const sourceJson = isScoring ? scoringJson : payoutJson;
      const config = JSON.parse(sourceJson || '{}');
      const collection = isScoring ? 'scoring-rules' : 'payout-rules';
      await wrestlingRequest(`/api/admin/wrestling/${collection}`, {
        admin: true,
        method: 'POST',
        body: { ruleId, name, active: newRule.active, config: { ...config, ruleId, name } },
      });
      toast.success(`New ${isScoring ? 'scoring' : 'payout'} rule version created.`);
      setNewRule({ type: newRule.type, ruleId: '', name: '', active: true });
      await load(isScoring ? ruleId : undefined, isScoring ? undefined : ruleId);
    } catch (error) {
      toast.error(error instanceof SyntaxError ? 'The selected source JSON is invalid.' : error.message);
    } finally {
      setSaving('');
    }
  };

  const scoringPreview = useMemo(() => {
    try {
      const config = JSON.parse(scoringJson || '{}');
      return WRESTLING_STATS.map((stat) => ({
        ...stat,
        weight: config.categories?.[stat.key]?.weight
          ?? config.categories?.find?.((category) => category.key === stat.key)?.weight
          ?? stat.weight,
      }));
    } catch (error) {
      return WRESTLING_STATS;
    }
  }, [scoringJson]);

  return (
    <>
      <Head><title>Wrestling Rules | FMM Administration</title></Head>
      <div className="pw-admin-page pw-admin-rules-page">
        <div className="pw-admin-form-heading">
          <p>Versioned game logic</p>
          <h1>Scoring and payout rules</h1>
          <span>Rules are snapshotted onto each contest. New versions can be created without rewriting completed wrestling cards.</span>
        </div>

        <section className="pw-admin-rule-overview">
          <article><FaTrophy /><span><small>Scoring engine</small><strong>Accuracy bands + category weights</strong><p>HP, BP, K, PM, FM, winner bonus, and deterministic tie-breakers.</p></span></article>
          <article><FaCoins /><span><small>Settlement engine</small><strong>Top-percentage payout</strong><p>Winner count, podium shares, platform fee, and affiliate commission.</p></span></article>
          <article><FaShieldAlt /><span><small>Historical integrity</small><strong>Ruleset snapshot</strong><p>Every contest retains the exact configuration assigned when it was created.</p></span></article>
        </section>

        {loading ? <div className="pw-admin-loading">Loading versioned wrestling rules…</div> : (
          <>
            <section className="pw-admin-scoring-preview">
              <header><div><p>Readable scoring preview</p><h2>Current category weights</h2></div><FaTrophy /></header>
              <div>{scoringPreview.map((stat) => <span key={stat.key}><b>{stat.short}</b><strong>{stat.weight}×</strong><small>{stat.label}</small></span>)}</div>
            </section>

            <section className="pw-admin-rule-grid">
              <article>
                <header><div><FaCode /><span><small>Scoring configuration</small><h2>{selectedScoring || 'No rule selected'}</h2></span></div><select value={selectedScoring} onChange={(event) => selectScoring(event.target.value)}>{scoringRules.map((rule) => <option key={rule.ruleId} value={rule.ruleId}>{rule.name} ({rule.ruleId}){rule.active === false ? ' · inactive' : ''}</option>)}</select></header>
                <textarea value={scoringJson} onChange={(event) => setScoringJson(event.target.value)} spellCheck="false" aria-label="Scoring rules JSON" />
                <button type="button" onClick={() => saveExisting('scoring')} disabled={!selectedScoring || Boolean(saving)}><FaSave /> {saving === 'scoring' ? 'Saving…' : 'Save scoring rules'}</button>
              </article>
              <article>
                <header><div><FaCode /><span><small>Payout configuration</small><h2>{selectedPayout || 'No rule selected'}</h2></span></div><select value={selectedPayout} onChange={(event) => selectPayout(event.target.value)}>{payoutRules.map((rule) => <option key={rule.ruleId} value={rule.ruleId}>{rule.name} ({rule.ruleId}){rule.active === false ? ' · inactive' : ''}</option>)}</select></header>
                <textarea value={payoutJson} onChange={(event) => setPayoutJson(event.target.value)} spellCheck="false" aria-label="Payout rules JSON" />
                <button type="button" onClick={() => saveExisting('payout')} disabled={!selectedPayout || Boolean(saving)}><FaSave /> {saving === 'payout' ? 'Saving…' : 'Save payout rules'}</button>
              </article>
            </section>

            <form className="pw-admin-rule-clone" onSubmit={createVersion}>
              <header><FaClone /><div><p>Safe rules evolution</p><h2>Create a new version from the selected configuration</h2><span>The currently selected scoring or payout JSON becomes the starting point for a new immutable rule ID.</span></div></header>
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
