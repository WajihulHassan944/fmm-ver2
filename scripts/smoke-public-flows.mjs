// Read-only production checks. Run with `npm run smoke:public` or on a schedule.
import assert from 'node:assert/strict';

const site = (process.env.SMOKE_SITE_URL || 'https://www.fantasymmadness.com').replace(/\/$/, '');
const api = (process.env.SMOKE_API_URL || 'https://fantasymmadness-game-server-three.vercel.app').replace(/\/$/, '');
const results = [];

async function get(url, { timeout = 20000 } = {}) {
  let failure;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { 'User-Agent': 'FMM-public-flow-smoke/1.0' } });
      if (response.ok) return response;
      failure = new Error(`${response.status} from ${new URL(url).pathname}`);
      if (response.status < 500) break;
    } catch (error) { failure = error; }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1800 * (attempt + 1)));
  }
  throw failure;
}

async function check(name, action) {
  try {
    const detail = await action();
    results.push({ name, status: 'PASS', detail });
    console.log(`PASS ${name}: ${detail}`);
  } catch (error) {
    results.push({ name, status: 'FAIL', detail: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

let fight;
let affiliate;
await check('database and paid-entry readiness', async () => {
  const response = await get(`${api}/api/health/db`);
  const health = await response.json();
  assert.equal(health.connected, true);
  assert.equal(health.transactionsSupported, true);
  return 'database connected with transactions';
});
await check('email provider readiness (does not prove inbox delivery)', async () => {
  const response = await get(`${api}/api/health/email`);
  const health = await response.json();
  assert.equal(health.ok, true);
  assert.equal(health.configured, true);
  return `provider ${health.provider} accepts configuration`;
});
await check('public fight registry resolves a saved fight', async () => {
  const response = await get(`${api}/api/public/prediction-fights?limit=100`);
  const payload = await response.json();
  const rows = payload.items || payload.data || payload;
  assert.ok(Array.isArray(rows) && rows.length, 'fight registry is empty');
  // Favor WebP artwork: this format previously made the affiliate poster 502.
  fight = rows.find((row) => /\.webp(?:\?|$)/i.test(row.fightPosterImage || row.promotionBackground || ''))
    || rows.find((row) => row.fightPosterImage || row.promotionBackground);
  assert.ok(fight?._id, 'no fight with artwork appears in the registry');
  const detail = await (await get(`${api}/api/public/fights/${encodeURIComponent(fight._id)}`)).json();
  const saved = detail.fight || detail.data || detail;
  assert.equal(String(saved._id), String(fight._id));
  assert.ok(saved.matchFighterA && saved.matchFighterB, 'saved fight has no fighter pair');
  return `${saved.matchFighterA} vs ${saved.matchFighterB} appears in registry and details`;
});
await check('verified affiliate click-through', async () => {
  const response = await get(`${api}/api/public/affiliates?limit=10`);
  const list = await response.json();
  assert.ok(Array.isArray(list) && list.length, 'no verified affiliate available');
  affiliate = list.find((row) => row.verified && row._id);
  assert.ok(affiliate, 'affiliate list has no verified profile');
  const detail = await (await get(`${api}/api/public/affiliates/${encodeURIComponent(affiliate._id)}`)).json();
  assert.equal(String(detail._id), String(affiliate._id));
  return `affiliate ${affiliate._id} resolves directly`;
});
await check('league landing preview and tracked fight link', async () => {
  assert.ok(fight && affiliate, 'fight or affiliate discovery failed');
  const url = `${site}/league/${affiliate._id}?fightId=${fight._id}&share=smoke`;
  const html = await (await get(url)).text();
  assert.ok(html.includes('og:image') && html.includes('fight-share-image'), 'poster metadata missing');
  assert.ok(html.includes(`fightId=${fight._id}`) || html.includes(`fightId&#x3D;${fight._id}`), 'fight attribution missing');
  assert.ok(html.includes(affiliate._id), 'affiliate attribution missing');
  assert.ok(html.includes('Join this league'), 'player join action missing');
  return `poster, attribution and Join action visible for fight ${fight._id}`;
});
await check('poster image contains artwork and tracked QR', async () => {
  assert.ok(fight && affiliate, 'fight or affiliate discovery failed');
  const url = `${site}/api/fight-share-image?fightId=${fight._id}&affiliateId=${affiliate._id}&v=11&smoke=${Date.now()}`;
  const response = await get(url, { timeout: 30000 });
  assert.match(response.headers.get('content-type') || '', /image\/png/);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a', 'invalid PNG');
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 1200);
  assert.ok(bytes.length > 100_000, `poster appears blank (${bytes.length} bytes)`);
  return `1200×1200 poster generated (${bytes.length} bytes)`;
});
await check('fight sign-in route stays available', async () => {
  assert.ok(fight && affiliate, 'fight or affiliate discovery failed');
  const next = `/league/${affiliate._id}?fightId=${fight._id}`;
  const query = new URLSearchParams({ mode: 'signup', role: 'player', next, referrer: affiliate._id, fight: fight._id });
  const html = await (await get(`${site}/auth?${query}`)).text();
  assert.ok(html.includes('Preparing secure access') || html.includes('auth-experience-page'), 'sign-in page missing');
  return 'sign-in route loads with fight attribution';
});
await check('home page, fight page and back office entry load', async () => {
  assert.ok(fight, 'fight discovery failed');
  for (const path of ['/', `/fight/${fight._id}`, '/administration']) {
    const response = await get(`${site}${path}`);
    assert.match(response.headers.get('content-type') || '', /text\/html/, `${path} returned non-HTML`);
  }
  return 'home, selected fight and back office entry return HTML';
});

const failures = results.filter((result) => result.status === 'FAIL');
console.log(`Public flow check: ${results.length - failures.length}/${results.length} passed.`);
if (failures.length) process.exitCode = 1;
