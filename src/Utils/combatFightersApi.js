import { swarmRequest } from './swarmApi';

export const combatFightersApi = {
  list: (query = {}) => swarmRequest('/api/admin/combat-fighters', { query }),
  publicList: (query = {}) => swarmRequest('/api/public/combat-fighters', { query }),
  create: (body = {}) => swarmRequest('/api/admin/combat-fighters', { method: 'POST', body }),
  update: (id, body = {}) => swarmRequest(`/api/admin/combat-fighters/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  remove: (id) => swarmRequest(`/api/admin/combat-fighters/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  restore: (id) => swarmRequest(`/api/admin/combat-fighters/${encodeURIComponent(id)}/restore`, { method: 'POST' }),
  suggestFromMatches: (body = {}) => swarmRequest('/api/admin/combat-fighters/suggest-from-matches', { method: 'POST', body }),
  importFromFights: (body = {}) => swarmRequest('/api/admin/combat-fighters/import-from-fights', { method: 'POST', body }),
  cleanupFightFighterFields: (body = {}) => swarmRequest('/api/admin/combat-fighters/cleanup-fight-fighter-fields', { method: 'POST', body }),
};

export const getCombatFighterId = (fighter) => fighter?.id || fighter?._id || '';
export const getCombatFighterImage = (fighter) => fighter?.primaryImage || fighter?.image || fighter?.fighterImage || '';
export const getCombatFighterName = (fighter) => fighter?.displayName || fighter?.name || 'Unnamed fighter';

export const normalizeCombatCategory = (value = 'combat') => {
  const text = String(value || 'combat').trim().toLowerCase();
  if (text === 'bare-knuckle' || text === 'bare_knuckle') return 'boxing';
  if (text === 'kickboxing') return 'mma';
  return text || 'combat';
};
