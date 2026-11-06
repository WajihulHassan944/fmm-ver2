const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

// Run the actual homepage formatter; no browser, accounts, or network required.
const source = fs.readFileSync(path.join(__dirname, '../src/pages/welcome.js'), 'utf8');
const start = source.indexOf('const pad2 =');
const end = source.indexOf('\n// A promoted fight', start);
assert.ok(start >= 0 && end > start, 'Homepage date formatter must remain testable');
const context = {};
vm.createContext(context);
vm.runInContext(`${source.slice(start, end)}\nthis.formatFightWhen = formatFightWhen;`, context);

test('Unknown fight times show the date and TIME TBA, never invented midnight', () => {
  for (const matchTime of ['', undefined, 'invalid']) {
    const label = context.formatFightWhen({ matchDate: '2026-10-10', matchTime });
    assert.match(label, /Oct 10/);
    assert.match(label, /TIME TBA/);
    assert.doesNotMatch(label, /12:00 AM/);
  }
});

test('TIME TBA flags override stale saved times', () => {
  for (const timeTba of [true, 'true']) {
    assert.match(context.formatFightWhen({ matchDate: '2026-10-10', matchTime: '20:00', timeTba }), /TIME TBA/);
  }
});

test('Confirmed times, actual midnight, and missing-date fallback remain intact', () => {
  assert.match(context.formatFightWhen({ matchDate: '2026-10-10', matchTime: '20:00', timeTba: false }), /8:00 PM/);
  assert.match(context.formatFightWhen({ matchDate: '2026-10-10', matchTime: '00:00', timeTba: false }), /12:00 AM/);
  assert.equal(context.formatFightWhen({}, { fallback: 'Date pending' }), 'Date pending');
});

test('Registry preserves Draft approval state instead of inferring Scheduled from its date', () => {
 const registry = fs.readFileSync(path.join(__dirname, '../src/Components/Admin/AdminFightsWorkspace.jsx'), 'utf8');
 const begin = registry.indexOf('const TERMINAL_FIGHT_STATUSES ='), end = registry.indexOf('// Fight-operations economics',begin), c = {};
 vm.createContext(c);vm.runInContext(registry.slice(begin,end)+';this.status=getRegistryStatus;',c);
 assert.equal(c.status({matchStatus:'Draft',matchType:'LIVE',matchDate:'2099-12-12'}),'Draft');
 assert.equal(c.status({matchStatus:'Draft',sourceType:'shadow',matchDate:'2099-12-12'}),'Template');
 assert.equal(c.status({matchStatus:'Open',matchDate:'2099-12-12'}),'Scheduled');
 assert.equal(c.status({matchStatus:'Finished',matchDate:'2099-12-12'}),'Finished');
});
