import { test, expect } from '@playwright/test';
import { submitGeojsonFile, submitWktFile, submitGeoIds } from './helpers/submit-analysis';
import { login, logout } from './helpers/auth';
import { verifyUserEmail, userExists, deleteUserByEmail, getAnalysisJobStats } from './helpers/db';

const TEST_USER = {
  name: 'E2E',
  lastName: 'TestUser',
  organization: 'Test Org',
  email: 'e2e-playwright@gmail.com',
  password: 'E2eTestPass123!',
};

const tokens: { label: string; token: string }[] = [];

test.describe.serial('Full E2E Flow', () => {

  // ── Phase 1: Unauthenticated submission ──────────────────────────────

  test('1.1 — submit GeoJSON unauthenticated', async ({ page }) => {
    tokens.push({ label: 'GeoJSON (unauth)', token: await submitGeojsonFile(page) });
  });

  test('1.2 — submit WKT unauthenticated', async ({ page }) => {
    tokens.push({ label: 'WKT (unauth)', token: await submitWktFile(page) });
  });

  test('1.3 — submit Geo IDs unauthenticated', async ({ page }) => {
    tokens.push({ label: 'Geo IDs (unauth)', token: await submitGeoIds(page) });
  });

  // ── Phase 2: Registration ────────────────────────────────────────────

  test('2.1 — register a new user', async ({ page }) => {
    await deleteUserByEmail(TEST_USER.email);
    await page.goto('/register');

    await page.locator('#name').fill(TEST_USER.name);
    await page.locator('#lastName').fill(TEST_USER.lastName);
    await page.locator('#organization').fill(TEST_USER.organization);
    await page.locator('#email').fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.locator('#confirmPassword').fill(TEST_USER.password);
    await page.locator('#terms').check();

    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText('Account Created')).toBeVisible({ timeout: 15000 });
  });

  // ── Phase 3: Email verification ──────────────────────────────────────

  test('2.2 — verify email via database', async () => {
    const email = await verifyUserEmail(TEST_USER.email);
    expect(email).toBe(TEST_USER.email);
  });

  // ── Phase 4: Login ───────────────────────────────────────────────────

  test('3.1 — login with verified account', async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  // ── Phase 5: Generate API key ────────────────────────────────────────

  test('3.2 — generate an API key', async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);

    await page.goto('/dashboard');
    await expect(page.getByText('API Key Management')).toBeVisible();

    await page.getByRole('button', { name: 'Create API Key' }).click();
    await expect(page.getByText('New API Key Created')).toBeVisible({ timeout: 10000 });
  });

  // ── Phase 6: Authenticated submission ────────────────────────────────

  test('4.1 — submit GeoJSON authenticated', async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    tokens.push({ label: 'GeoJSON (auth)', token: await submitGeojsonFile(page) });
  });

  test('4.2 — submit WKT authenticated', async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    tokens.push({ label: 'WKT (auth)', token: await submitWktFile(page) });
  });

  test('4.3 — submit Geo IDs authenticated', async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    tokens.push({ label: 'Geo IDs (auth)', token: await submitGeoIds(page) });
  });

  // ── Phase 7: Logout ──────────────────────────────────────────────────

  test('5.1 — logout', async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    await logout(page);
  });

  // ── Phase 8: Cleanup — delete account ────────────────────────────────

  test('6.1 — delete account via UI and verify in DB', async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete Account' }).first().click();

    await expect(page.getByText('Confirm Account Deletion')).toBeVisible();
    await page.getByPlaceholder('Enter your password').fill(TEST_USER.password);
    await page.locator('.fixed.inset-0').getByRole('button', { name: 'Delete Account' }).click();

    await page.waitForURL('/', { timeout: 15000 });

    const exists = await userExists(TEST_USER.email);
    expect(exists).toBe(false);
  });

  test('7.1 — analysis stats summary', async () => {
    const stats = await getAnalysisJobStats(tokens.map(t => t.token));
    const statsByToken = new Map(stats.map(s => [s.id, s]));

    console.log('\n=== Analysis Stats Summary ===');
    for (const { label, token } of tokens) {
      const s = statsByToken.get(token);
      if (s) {
        const user = s.email ?? 'authenticated (user deleted)';
        console.log(`${label}: user=${user}, endpoint=${s.endpoint}, features=${s.feature_count}, queue=${Math.round(s.queue_ms)}ms, processing=${Math.round(s.processing_ms)}ms, total=${Math.round(s.total_ms)}ms [${s.status}]`);
      } else {
        console.log(`${label}: token=${token} — not found`);
      }
    }
    console.log('==============================\n');
  });
});
