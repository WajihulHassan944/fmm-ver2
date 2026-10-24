// Remembers which affiliate brought a visitor here, so the referral survives
// browsing (Explore all fights, Join free, other fight pages) and signup.
//
// Precedence everywhere: an affiliate id in the current URL wins, then the
// remembered one. The server still applies all existing credit rules
// (verified affiliate, paid entry, no self-referral, promoted fights).

const KEY = 'fmm_affiliate_ref';
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const isId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

export function rememberAffiliateRef(id) {
  if (!isId(id) || typeof window === 'undefined') return;
  try { window.localStorage.setItem(KEY, JSON.stringify({ id: String(id), at: Date.now() })); } catch { /* storage unavailable */ }
}

export function getRememberedAffiliateRef() {
  if (typeof window === 'undefined') return '';
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || 'null');
    if (saved && isId(saved.id) && Date.now() - Number(saved.at || 0) < WINDOW_MS) return saved.id;
  } catch { /* storage unavailable */ }
  return '';
}

/** The affiliate id from the URL if valid, otherwise the remembered one. */
export function currentAffiliateRef(...candidates) {
  const fromUrl = candidates.map((value) => (Array.isArray(value) ? value[0] : value)).find(isId);
  return fromUrl ? String(fromUrl) : getRememberedAffiliateRef();
}
