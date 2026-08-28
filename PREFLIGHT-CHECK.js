// PRE-FLIGHT CHECK — run this before every handoff.
//
// Written after a run of bugs that all shared one shape: a change fixed one thing
// and quietly broke another, and brace-counting never caught it. Each check below
// exists because a specific bug reached the user.
//
//   1  undefined identifiers ........ shipped `useEffect` without importing it
//   2  balance ....................... a bad splice corrupted the CSS block
//   3  dead API calls ................ nine endpoints that did not exist
//   4  props contract ................ playerName never passed, nothing highlighted
//   5  missing images ................ cut-out path guessed, frames rendered empty
//   6  dead + self-referential links . "Apply as an affiliate" linked to its own section
//   7  image shape ................... 99x132 thumbnails stretched into 16:9 cards
//   8  render methods ................ a missing method blanks everything below it
//   9  hooks vs imports .............. build failure, not a runtime warning
//  10  JSX hazards ................... style="" strings break the prerender
//  11  route map ..................... "/" mapped to the app, so the site never showed
//  12  data fallbacks ................ empty API render an empty page
//
// Usage: paste into run_script. Anything marked FAIL blocks the handoff.

const FRONTEND = [
  'fmm-frontend/src/pages/welcome.js',
  'fmm-frontend/src/pages/index.js',
  'fmm-frontend/src/pages/_app.js',
  'fmm-frontend/src/pages/terms.js',
  'fmm-frontend/src/pages/privacy.js',
  'fmm-frontend/src/pages/responsible-play.js',
  'fmm-frontend/src/pages/owner.js',
  'fmm-frontend/src/Components/MobileApp/FantasyMobileExperience.jsx',
  'fmm-frontend/src/Components/MobileApp/FantasyMobileAppCore.jsx',
];

const CSS_FN = new Set(['rgba','rgb','blur','gradient','rotate','minmax','repeat','calc','scale','translate','translateX','translateY','var','url','hsl','hsla','cubic','steps','clamp','brightness','saturate','opacity','drop','inset','linear','radial','conic','matrix','skew','perspective','counter','attr','env','color']);
const GLOBALS = new Set(['window','document','console','Math','JSON','Object','Array','String','Number','Boolean','Date','Promise','Error','Set','Map','RegExp','parseInt','parseFloat','isNaN','encodeURIComponent','decodeURIComponent','setTimeout','clearTimeout','setInterval','clearInterval','fetch','localStorage','sessionStorage','navigator','location','history','URL','URLSearchParams','Intl','process','require','module','exports','React','undefined','crypto','FormData','Blob','Image','requestAnimationFrame','getComputedStyle','structuredClone','globalThis','performance','dispatch']);
const KEYWORDS = /^(if|for|while|switch|catch|return|typeof|await|new|function|super|import|export|do|else|try|delete|void|yield|instanceof|in|of|async|class|const|let|var|this)$/;

const strip = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let FAILURES = 0;
const check = (label, ok, detail) => {
  if (!ok) FAILURES++;
  log((ok ? 'ok    ' : 'FAIL  ') + label.padEnd(46) + (detail || ''));
};

// -- 1, 2, 9, 10: per-file --------------------------------------------------
log('=== FILES ===');
for (const p of FRONTEND) {
  let t;
  try { t = await readFile(p); } catch (e) { check(p.split('/').pop(), false, 'MISSING FILE'); continue; }
  const name = p.split('/').pop();
  const src = strip(t);
  const problems = [];

  // balance
  const o = (t.match(/\{/g) || []).length, c = (t.match(/\}/g) || []).length;
  if (o !== c) problems.push('braces ' + o + '/' + c);

  // JSX hazards
  if ((t.match(/style="/g) || []).length) problems.push('style="" strings');
  if ((t.match(/ class="/g) || []).length) problems.push('raw class=');
  // Void tags: scan forward from the tag name to its real terminator. A naive
  // /<img[^>]*>/ stops at the first ">" — which is normally inside a style object
  // — and reports every multi-line input as unclosed.
  {
    const unclosed = [];
    for (const m of t.matchAll(/<(img|br|source|input|hr)\b/g)) {
      const rest = t.slice(m.index);
      let depth = 0, closedProperly = false;
      for (let i = 0; i < rest.length && i < 2000; i++) {
        const ch = rest[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        else if (ch === '>' && depth === 0) { closedProperly = rest[i - 1] === '/'; break; }
      }
      if (!closedProperly) unclosed.push(t.slice(0, m.index).split('\n').length);
    }
    if (unclosed.length) problems.push(unclosed.length + ' unclosed void tags at lines ' + unclosed.join(','));
  }

  // hooks vs the react import
  const reactImport = (t.match(/^import[^\n]*from ['"]react['"];?/m) || [''])[0];
  ['useState','useEffect','useCallback','useMemo','useRef','useReducer','useContext'].forEach((h) => {
    if (new RegExp('(^|[^.\\w])' + h + '\\s*\\(', 'm').test(t) && !new RegExp('\\b' + h + '\\b').test(reactImport)) {
      problems.push(h + ' not imported');
    }
  });

  // undefined identifiers
  const declared = new Set();
  for (const m of t.matchAll(/import\s+(?:(\w+)\s*,\s*)?\{([^}]*)\}/g)) {
    if (m[1]) declared.add(m[1]);
    m[2].split(',').forEach((x) => declared.add(x.trim().split(/\s+as\s+/).pop().trim()));
  }
  for (const m of t.matchAll(/import\s+(\w+)\s+from/g)) declared.add(m[1]);
  for (const m of src.matchAll(/(?:const|let|var|function|class)\s+(\w+)/g)) declared.add(m[1]);
  for (const m of src.matchAll(/(?:const|let|var)\s*\{([^}]*)\}/g)) m[1].split(',').forEach((x) => declared.add(x.trim().split(':').pop().split('=')[0].trim()));
  for (const m of src.matchAll(/(?:const|let|var)\s*\[([^\]]*)\]/g)) m[1].split(',').forEach((x) => declared.add(x.trim()));
  for (const m of src.matchAll(/\(([^)]*)\)\s*=>/g)) m[1].split(',').forEach((x) => declared.add(x.trim().split(/[:=]/)[0].replace(/[{}[\].…]/g, '').trim()));
  for (const m of src.matchAll(/(\w+)\s*=>/g)) declared.add(m[1]);
  for (const m of src.matchAll(/^\s{2}(\w+)\s*[=(]/gm)) declared.add(m[1]);

  const undef = new Set();
  for (const m of src.matchAll(/(?:^|[^.\w$'"`])([a-z][a-zA-Z0-9_$]{2,})\s*\(/g)) {
    const n = m[1];
    if (!declared.has(n) && !GLOBALS.has(n) && !CSS_FN.has(n) && !KEYWORDS.test(n)) undef.add(n);
  }
  if (undef.size) problems.push('undefined: ' + [...undef].join(', '));

  check(name, problems.length === 0, problems.join(' | '));
}

// -- 3: every API call resolves to a real route -----------------------------
log('\n=== API CONTRACT ===');
const server = await readFile('backend-fix/server.js');
const routeSegs = [...server.matchAll(/app\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g)]
  .map((m) => m[2].replace(/\?.*$/, '').replace(/\/$/, '').split('/'));
const routeMatches = (call) => {
  const c = call.replace(/\?.*$/, '').replace(/\/$/, '').split('/');
  return routeSegs.some((r) => r.length === c.length && r.every((s, i) => s.startsWith(':') || s === c[i]));
};
const dead = new Set();
for (const p of ['fmm-frontend/src/Components/MobileApp/FantasyMobileExperience.jsx', 'fmm-frontend/src/pages/welcome.js', 'fmm-frontend/src/pages/owner.js']) {
  const t = await readFile(p);
  for (const m of t.matchAll(/['"`](\/api\/[a-zA-Z0-9\-_\/]*(?:\$\{[^}]*\})?[a-zA-Z0-9\-_\/]*)['"`]/g)) {
    const call = m[1].replace(/\$\{[^}]*\}/g, 'x');
    if (!routeMatches(call)) dead.add(call);
  }
}
check('every API call has a route', dead.size === 0, [...dead].join(', '));
try { new Function(server); check('server.js parses', true, server.split('\n').length + ' lines'); }
catch (e) { check('server.js parses', false, e.message); }

// -- 4: the app's prop contract ---------------------------------------------
log('\n=== PROPS CONTRACT ===');
const core = await readFile('fmm-frontend/src/Components/MobileApp/FantasyMobileAppCore.jsx');
const shell = await readFile('fmm-frontend/src/Components/MobileApp/FantasyMobileExperience.jsx');
const needs = [...new Set([...core.matchAll(/this\.props\.(\w+)/g)].map((m) => m[1]))];
const missingProps = needs.filter((n) => !new RegExp('(^|[\\s,{])' + n + '([\\s,:}]|$)', 'm').test(shell));
check('all props provided', missingProps.length === 0, needs.length + ' props' + (missingProps.length ? ' — missing: ' + missingProps.join(', ') : ''));

// -- 8: render methods exist -------------------------------------------------
const called = [...new Set([...core.matchAll(/this\.(render[A-Z]\w*)\s*\(/g)].map((m) => m[1]))];
const defined = new Set([...core.matchAll(/^\s{2}(render[A-Z]\w*)\s*(?:\(|=)/gm)].map((m) => m[1]));
const undefRender = called.filter((n) => !defined.has(n));
check('render methods defined', undefRender.length === 0, called.length + ' called' + (undefRender.length ? ' — missing: ' + undefRender.join(', ') : ''));

// -- 5, 7: images exist and fit their container -----------------------------
log('\n=== IMAGES ===');
const site = await ls('fmm-frontend/public/site');
const welcome = await readFile('fmm-frontend/src/pages/welcome.js');
const refs = [...new Set([...welcome.matchAll(/['"](\/site\/[^'"]+)['"]/g)].map((m) => m[1]))];
const missingImg = refs.filter((r) => !site.includes(r.split('/').pop()));
check('all site images present', missingImg.length === 0, refs.length + ' referenced' + (missingImg.length ? ' — missing: ' + missingImg.join(', ') : ''));

// A 16:9 card needs a landscape source, or the picture smears.
const wideSlots = [...welcome.matchAll(/aspectRatio: '16 \/ 9'/g)].length;
if (wideSlots) {
  const previewImgs = [...welcome.matchAll(/featuredThisWeekImage: '(\/site\/[^']+)'/g)].map((m) => m[1]);
  const wrongShape = [];
  for (const r of previewImgs) {
    try {
      const img = await readImage('fmm-frontend/public' + r);
      if (img.width / img.height < 1.4) wrongShape.push(r.split('/').pop() + ' ' + img.width + 'x' + img.height);
    } catch (e) { wrongShape.push(r + ' unreadable'); }
  }
  check('16:9 cards use landscape art', wrongShape.length === 0, wrongShape.join(', '));
}

// -- 6: links resolve, and none point at themselves --------------------------
log('\n=== LINKS ===');
const ids = new Set([...welcome.matchAll(/id="([a-z-]+)"/g)].map((m) => m[1]));
const anchors = [...new Set([...welcome.matchAll(/href="(#[a-z-]+)"/g)].map((m) => m[1]))];
const deadAnchors = anchors.filter((h) => !ids.has(h.slice(1)));
check('anchors resolve', deadAnchors.length === 0, anchors.length + ' anchors' + (deadAnchors.length ? ' — dead: ' + deadAnchors.join(', ') : ''));

// A link inside the section it targets does nothing — this is how the affiliate
// button read as broken.
const wLines = welcome.split('\n');
const selfRef = [];
anchors.forEach((h) => {
  const target = h.slice(1);
  const open = wLines.findIndex((l) => l.includes('id="' + target + '"'));
  if (open < 0) return;
  const indent = (wLines[open].match(/^\s*/) || [''])[0].length;
  let close = wLines.length;
  for (let i = open + 1; i < wLines.length; i++) {
    const ind = (wLines[i].match(/^\s*/) || [''])[0].length;
    if (ind === indent && wLines[i].trim().startsWith('</div>')) { close = i; break; }
  }
  for (let i = open; i < close; i++) if (wLines[i].includes('href="' + h + '"')) selfRef.push(h + ' at :' + (i + 1));
});
check('no self-referential links', selfRef.length === 0, selfRef.join(', '));

const pages = await ls('fmm-frontend/src/pages');
const pageLinks = [...new Set([...welcome.matchAll(/href="(\/[a-z-]+)"/g)].map((m) => m[1]))];
const deadPages = pageLinks.filter((h) => {
  const base = h.slice(1);
  return !pages.some((f) => f === base + '.js' || f === base + '.jsx' || f === base);
});
check('page links exist', deadPages.length === 0, pageLinks.join(' ') + (deadPages.length ? ' — dead: ' + deadPages.join(', ') : ''));

// -- 11: the homepage serves the website, not the app -----------------------
log('\n=== ROUTING ===');
const appjs = await readFile('fmm-frontend/src/pages/_app.js');
const tabTable = (appjs.match(/MOBILE_APP_ROUTE_TABS = \{[\s\S]*?\};/) || [''])[0];
check('"/" is NOT the mobile app', !/"\/": "/.test(tabTable), '"/" serves the website');
check('"/home" IS the mobile app', /"\/home":/.test(tabTable));
check('index re-exports data fn', /getServerSideProps = welcomeServerSideProps/.test(await readFile('fmm-frontend/src/pages/index.js')));
check('signup lands in the app', /router\.push\('\/home'\)/.test(welcome));

// -- 12: nothing renders empty ----------------------------------------------
log('\n=== EMPTY-STATE FALLBACKS ===');
check('website falls back to preview', /usingPreview \? PREVIEW_FIGHTS : fights/.test(welcome));
check('preview uses the shared mapper', /toFightCard\(row, index\)/.test(welcome));
check('app falls back to sample card', /realFights\.length \? realFights : buildSampleFights\(\)/.test(shell));
check('sample fights stay playable', /isSample: true, playable: true/.test(shell));
check('samples blocked from entry', /event && event\.isSample/.test(core));
check('test accounts blocked from live pay', /TEST_ACCOUNT_LIVE_PAYMENT_BLOCKED/.test(server));

log('\n' + (FAILURES === 0 ? 'PASS — safe to hand off' : FAILURES + ' FAILURE(S) — do not hand off'));
