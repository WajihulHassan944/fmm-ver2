const STORAGE_KEY = 'fmm-revenue-events-v1';
const SESSION_KEY = 'fmm-revenue-session-v1';

const canUseBrowser = () => typeof window !== 'undefined';

const getSessionId = () => {
  if (!canUseBrowser()) return '';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = window.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

export const trackRevenueEvent = (event, data = {}) => {
  if (!canUseBrowser() || !event) return;
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const row = {
      event,
      at: new Date().toISOString(),
      sessionId: getSessionId(),
      path: window.location.pathname,
      referrer: document.referrer || '',
      ...data,
    };
    const next = [...(Array.isArray(current) ? current : []), row].slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('fmm:revenue-event', { detail: row }));
  } catch (_) { /* Analytics must never block play. */ }
};

export const getLocalRevenueEvents = () => {
  if (!canUseBrowser()) return [];
  try {
    const rows = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(rows) ? rows : [];
  } catch (_) { return []; }
};

export const REVENUE_EVENTS = Object.freeze({
  FIGHT_VIEW: 'fight_view',
  PLAY_CLICK: 'play_click',
  PREDICTION_START: 'prediction_start',
  SIGNUP_GATE: 'signup_gate',
  COIN_CHECKOUT: 'coin_checkout',
  PAID_ENTRY: 'paid_entry',
  FREE_ENTRY: 'free_entry',
  CHALLENGE_SHARE: 'challenge_share',
  PARTNER_LEAD: 'partner_lead',
});
