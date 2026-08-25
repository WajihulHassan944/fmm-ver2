// Shared auth headers.
//
// A large number of admin and account screens called the API with no
// Authorization header at all, which is why so many back-office routes had to
// stay public to keep working. Those routes are now protected, so every caller
// has to present the token it already has in localStorage.
//
//   adminHeaders()  -> back-office screens (adminAuthToken)
//   userHeaders()   -> player screens (authToken)
//   affiliateHeaders() -> affiliate screens (affiliateAuthToken)
//
// Each helper returns {} when no token is stored, so callers still compile and
// simply receive a 401 they can surface to the user.

const read = (key) => {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(key) || '';
  } catch (_error) {
    return '';
  }
};

const bearer = (token, extra) => (token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra });

export const getAdminToken = () => read('adminAuthToken') || read('adminToken');
export const getUserToken = () => read('authToken');
export const getAffiliateToken = () => read('affiliateAuthToken') || read('authToken');

export const adminHeaders = (extra) => bearer(getAdminToken(), extra);
export const userHeaders = (extra) => bearer(getUserToken(), extra);
export const affiliateHeaders = (extra) => bearer(getAffiliateToken(), extra);

export const adminJsonHeaders = (extra) => adminHeaders({ 'Content-Type': 'application/json', ...extra });
export const userJsonHeaders = (extra) => userHeaders({ 'Content-Type': 'application/json', ...extra });

// True when the screen has no admin session at all — lets a component show
// "admin login required" instead of an empty table.
export const hasAdminSession = () => Boolean(getAdminToken());
export const hasUserSession = () => Boolean(getUserToken());
