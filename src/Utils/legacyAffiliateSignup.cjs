'use strict';
function legacyAffiliateSignupDestination(query = {}) {
  const params = new URLSearchParams({ mode: 'signup', role: 'affiliate' });
  const invite = Array.isArray(query.invite) ? query.invite[0] : query.invite;
  if (typeof invite === 'string' && invite.trim()) params.set('invite', invite.trim());
  for (const key of ['ref', 'referrer', 'affiliate', 'fight', 'league', 'referrerName', 'affiliateName', 'leagueName', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id']) {
    for (const value of Array.isArray(query[key]) ? query[key] : [query[key]]) {
      if (typeof value === 'string' && value) params.append(key, value);
    }
  }
  return `/auth?${params.toString()}`;
}
module.exports = { legacyAffiliateSignupDestination };
