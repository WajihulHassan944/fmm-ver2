const test = require('node:test');
const assert = require('node:assert/strict');
const { registryFighterDisplay, registryEditorialLabel } = require('../src/Utils/registryFighterDisplay.cjs');
test('discovered editorial suffixes do not become fighter names or mutate owner records', () => {
  const record = { matchFighterB: 'Michelle Montague postponed to', matchStatus: 'Draft', autoDiscovered: true };
  const before = JSON.stringify(record);
  assert.equal(registryFighterDisplay(record.matchFighterB, record), 'Michelle Montague');
  assert.equal(registryEditorialLabel('UFC 335: Jacqueline Cavalcanti vs Michelle Montague postponed to', true), 'UFC 335: Jacqueline Cavalcanti vs Michelle Montague');
  assert.equal(JSON.stringify(record), before);
});
test('owner-entered names and JSON-backed display names retain their identity', () => {
  assert.equal(registryFighterDisplay('Michelle Montague postponed to'), 'Michelle Montague postponed to');
  assert.equal(registryFighterDisplay('José Aldo'), 'José Aldo');
  assert.equal(registryFighterDisplay('{"name":"Jon Jones"}'), 'Jon Jones');
  assert.equal(registryFighterDisplay({ displayName: 'Jiri Prochazka' }), 'Jiri Prochazka');
  assert.equal(registryFighterDisplay('{invalid'), '{invalid');
});
