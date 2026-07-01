import { swarmRequest } from './swarmApi';

export const fightDataQualityApi = {
  scoringConfig: () => swarmRequest('/api/admin/fights/scoring-config'),
  duplicateFights: (query = {}) => swarmRequest('/api/admin/fights/data-quality/duplicates', { query }),
  deleteDuplicateFights: (ids = [], dryRun = true) => swarmRequest('/api/admin/fights/data-quality/duplicates/delete', {
    method: 'POST',
    body: { ids, dryRun },
  }),
  imageHealth: (query = {}) => swarmRequest('/api/admin/fights/data-quality/image-health', { query }),
  combatFighters: (query = {}) => swarmRequest('/api/admin/combat-fighters', { query }),
  createCombatFighter: (body = {}) => swarmRequest('/api/admin/combat-fighters', { method: 'POST', body }),
  updateCombatFighter: (id, body = {}) => swarmRequest(`/api/admin/combat-fighters/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  suggestCombatFighters: (body = {}) => swarmRequest('/api/admin/combat-fighters/suggest-from-matches', { method: 'POST', body }),
  linkFightFighters: (matchId, body = {}) => swarmRequest(`/api/admin/fights/${encodeURIComponent(matchId)}/link-fighters`, { method: 'POST', body }),
};

export const normalizeFighterName = (value = '') => String(value || '').trim().replace(/\s+/g, ' ');

export const getFightGroupTitle = (group = {}) => {
  const sample = Array.isArray(group.matches) ? group.matches[0] : null;
  const fighters = sample?.fighters || [sample?.matchFighterA, sample?.matchFighterB];
  if (Array.isArray(fighters) && fighters.filter(Boolean).length >= 2) return `${fighters[0]} vs ${fighters[1]}`;
  return group.key || 'Duplicate fight group';
};

export const getImageStatusClass = (status = '') => {
  const normalized = String(status || '').toLowerCase();
  if (['ok', 'valid', 'reachable'].includes(normalized)) return 'is-success';
  if (['broken', 'missing', 'invalid'].includes(normalized)) return 'is-danger';
  return 'is-warning';
};
