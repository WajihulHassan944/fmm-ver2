const { test, expect } = require('@playwright/test');
const origin = process.env.TEST_DIRECTORY_API_ORIGIN || 'https://directory-api.test';
const users = [
  { _id: 'old-fixture', firstName: 'Earlier', lastName: 'Signup', email: 'earlier@example.invalid', verified: true, createdAt: '2026-10-01T12:00:00Z' },
  { _id: 'new-fixture', firstName: 'Recent', lastName: 'Signup', email: 'recent@example.invalid', verified: false, createdAt: '2026-11-04T12:00:00Z' },
];

async function setup(page, { failOnce = false, expired = false } = {}) {
  const directoryRequests = []; const obsoleteRequests = []; const mutations = [];
  await page.addInitScript(() => localStorage.setItem('adminAuthToken', 'directory-fixture-session'));
  await page.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === origin) {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Authorization, Content-Type' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      // The existing shell records a passive page click; it is stubbed here too.
      if (request.method() !== 'GET' && url.pathname !== '/track-click') mutations.push(url.pathname);
      if (url.pathname === '/users') {
        directoryRequests.push(request.headers());
        const status = expired ? 401 : failOnce && directoryRequests.length === 1 ? 503 : 200;
        return route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(status === 200 ? { users } : { message: 'Fixture directory unavailable' }) });
      }
      return route.fulfill({ headers, contentType: 'application/json', body: JSON.stringify(url.pathname === '/redusers' ? { data: [{ email: 'suspended@example.invalid' }] } : {}) });
    }
    if (url.hostname === 'fantasymmadness-game-server-three.vercel.app') { obsoleteRequests.push(url.pathname); return route.abort(); }
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
  await page.goto('/administration/RegisteredUsers');
  return { directoryRequests, obsoleteRequests, mutations };
}

test('configured directory shows newest signups, pending verification and searchable totals', async ({ page }) => {
  const calls = await setup(page);
  await expect(page.getByRole('status')).toContainText('2 of 2 users');
  const rows = page.locator('tbody tr');
  await expect(rows.first()).toContainText('Recent Signup');
  await expect(rows.first()).toContainText('Pending email verification');
  await expect(rows.first()).toContainText('Joined');
  await expect(rows.nth(1)).toContainText('Earlier Signup');
  await page.getByPlaceholder('Search player, email, or plan').fill('recent@example.invalid');
  await expect(page.getByRole('status')).toContainText('1 of 2 users');
  expect(calls.directoryRequests[0].authorization).toBe('Bearer directory-fixture-session');
  expect(calls.obsoleteRequests).toEqual([]); expect(calls.mutations).toEqual([]);
});

test('failed directory stays unavailable until Refresh users succeeds', async ({ page }) => {
  const calls = await setup(page, { failOnce: true });
  await expect(page.getByText('Unable to load registered players:', { exact: false })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Player directory unavailable');
  await page.getByRole('button', { name: 'Refresh users', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('2 of 2 users');
  expect(calls.directoryRequests.length).toBe(2); expect(calls.mutations).toEqual([]);
});

test('expired administrator session returns to normal administrator login', async ({ page }) => {
  const calls = await setup(page, { expired: true });
  await expect(page).toHaveURL(/\/administration\/login\?reason=session-expired/);
  expect(calls.mutations).toEqual([]);
});

test('linked suspended accounts directory uses the same configured backend', async ({ page }) => {
  const calls = await setup(page);
  await expect(page.getByRole('status')).toContainText('2 of 2 users');
  await page.getByRole('button', { name: 'Suspended accounts', exact: true }).click();
  await expect(page.getByText('suspended@example.invalid')).toBeVisible();
  expect(calls.obsoleteRequests).toEqual([]); expect(calls.mutations).toEqual([]);
});
