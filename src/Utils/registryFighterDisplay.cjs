'use strict';
// Display only: imported records and edit/promotion payloads remain untouched.
function registryEditorialLabel(value, autoDiscovered = false) {
  const text = String(value ?? '').trim();
  return autoDiscovered ? text.replace(/\s+(?:postponed(?:\s+to)?|rescheduled(?:\s+to)?|cancelled|canceled)(?:\s+.*)?$/i, '').trim() : text;
}
function registryFighterDisplay(value, { autoDiscovered = false } = {}) {
  let candidate = value;
  if (typeof candidate === 'string' && /^\s*\{/.test(candidate)) {
    try { const parsed = JSON.parse(candidate); candidate = parsed.displayName || parsed.name || candidate; } catch { /* Preserve unparseable text for review. */ }
  }
  if (candidate && typeof candidate === 'object') candidate = candidate.displayName || candidate.name || '';
  return registryEditorialLabel(candidate, autoDiscovered);
}
module.exports = { registryFighterDisplay, registryEditorialLabel };
