// Guard: keeps retired ("legacy") pages/components from coming back, and keeps
// approved pages from silently disappearing. Runs before every build
// ("prebuild"), so a regression fails the build BEFORE it can be deployed.
//
//  1. No page may import (directly or through other files) anything listed in
//     scripts/legacy-files.json.
//  2. Every page route must be listed in scripts/approved-routes.json, and every
//     approved route must still exist. Adding/removing a page is allowed, but it
//     must be a deliberate edit to that file (so it shows up in review).
//
// Update the approved list with:  node scripts/guard-legacy-pages.mjs --update-routes
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const exts = ['.js', '.jsx'];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : exts.includes(path.extname(e.name)) ? [p] : [];
});
const files = walk(src);
const fileSet = new Set(files);
const rel = (p) => path.relative(root, p).split(path.sep).join('/');

const importRe = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)|(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;
const resolveSpec = (from, spec) => {
  let base;
  if (spec.startsWith('@/')) base = path.join(src, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else return null;
  return [base, ...exts.map((x) => base + x), ...exts.map((x) => path.join(base, 'index' + x))].find((c) => fileSet.has(c)) || null;
};
const graph = new Map(files.map((f) => {
  // Ignore comments so commented-out imports do not count.
  const text = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const deps = new Set();
  for (const m of text.matchAll(importRe)) {
    const r = resolveSpec(f, m[1] || m[2] || m[3] || m[4]);
    if (r) deps.add(r);
  }
  return [f, deps];
}));

const pagesDir = path.join(src, 'pages');
const pages = files.filter((f) => f.startsWith(pagesDir + path.sep));
const routeOf = (f) => {
  let r = rel(f).replace(/^src\/pages/, '').replace(/\.(js|jsx)$/, '').replace(/\/index$/, '');
  return r || '/';
};
const routes = [...new Set(pages.map(routeOf))].sort();

const manifestPath = path.join(root, 'scripts', 'approved-routes.json');
const legacyPath = path.join(root, 'scripts', 'legacy-files.json');

if (process.argv.includes('--update-routes')) {
  fs.writeFileSync(manifestPath, JSON.stringify(routes, null, 2) + '\n');
  console.log(`Wrote ${routes.length} routes to scripts/approved-routes.json`);
  process.exit(0);
}

const problems = [];

// 1. legacy imports
const legacy = new Set(JSON.parse(fs.readFileSync(legacyPath, 'utf8')).map((p) => path.join(root, p)));
for (const page of pages) {
  const seen = new Set([page]);
  const stack = [[page, [rel(page)]]];
  while (stack.length) {
    const [node, trail] = stack.pop();
    for (const dep of graph.get(node) || []) {
      if (legacy.has(dep)) problems.push(`Retired file is in use: ${trail.concat(rel(dep)).join('  ->  ')}`);
      else if (!seen.has(dep)) { seen.add(dep); stack.push([dep, trail.concat(rel(dep))]); }
    }
  }
}

// 2. route manifest
const approved = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const approvedSet = new Set(approved);
routes.filter((r) => !approvedSet.has(r)).forEach((r) => problems.push(`New page route not in the approved list: ${r}  (if intended, run: node scripts/guard-legacy-pages.mjs --update-routes)`));
approved.filter((r) => !routes.includes(r)).forEach((r) => problems.push(`Approved page is missing: ${r}`));

if (problems.length) {
  console.error('\nPAGE GUARD FAILED — this change would bring back an old page or remove an approved one:\n');
  [...new Set(problems)].forEach((p) => console.error('  • ' + p));
  console.error('');
  process.exit(1);
}
console.log(`Page guard OK: ${routes.length} approved routes, ${legacy.size} retired files locked out.`);
