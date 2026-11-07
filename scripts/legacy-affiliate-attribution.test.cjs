const test = require('node:test'), assert = require('node:assert/strict');
const { legacyAffiliateSignupDestination } = require('../src/Utils/legacyAffiliateSignup.cjs');
test('legacy recruitment destinations preserve campaign, account, fight and readable attribution', () => {
  const query = { ref: 'a'.repeat(24), referrer: 'b'.repeat(24), affiliateName: 'Fight Club & Team', fight: 'c'.repeat(24), league: 'd'.repeat(24), utm_source: 'fan_acquisition', utm_campaign: 'combat_fans_aff_legacy', utm_content: 'poster_qr' };
  const before = JSON.stringify(query), url = new URL(legacyAffiliateSignupDestination(query), 'https://www.fantasymmadness.com');
  assert.equal(url.pathname, '/auth');
  assert.equal(url.searchParams.get('role'), 'affiliate');
  for (const [key, value] of Object.entries(query)) assert.equal(url.searchParams.get(key), value);
  assert.equal(JSON.stringify(query), before);
});
test('invite format is preserved, duplicate account values are not silently collapsed, and external redirects are excluded', () => {
  const url = new URL(legacyAffiliateSignupDestination({ invite: ' verified-invite ', ref: ['first-id', 'second-id'], mode: 'login', role: 'administrator', next: 'https://external.example', returnTo: '//external.example' }), 'https://www.fantasymmadness.com');
  assert.equal(url.searchParams.get('invite'), 'verified-invite');
  assert.deepEqual(url.searchParams.getAll('ref'), ['first-id', 'second-id']);
  assert.equal(url.searchParams.get('mode'), 'signup'); assert.equal(url.searchParams.get('role'), 'affiliate');
  assert.equal(url.searchParams.has('next'), false); assert.equal(url.searchParams.has('returnTo'), false);
});
