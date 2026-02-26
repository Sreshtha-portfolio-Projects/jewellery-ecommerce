/**
 * Smoke tests – map to tests/smoke-tests.md (Test IDs SMOKE-001 … SMOKE-015).
 * Run: cd e2e && npx playwright test smoke.spec.js
 *
 * Set BASE_URL (default http://localhost:5173). For login tests set:
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD
 * (e.g. in .env or export in shell). See e2e/.env.example.
 */

const { test, expect } = require('@playwright/test');

test.describe('Smoke – Frontend & App Load', () => {
  // SMOKE-001: Frontend Application Loads Successfully
  test('SMOKE-001 – Frontend application loads successfully', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && !text.includes('favicon')) errors.push(text);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\//);
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  // SMOKE-002: Admin Panel Loads Successfully
  test('SMOKE-002 – Admin panel loads successfully', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});

test.describe('Smoke – Authentication', () => {
  // SMOKE-003: Customer Login Works (requires TEST_USER_EMAIL, TEST_USER_PASSWORD)
  test('SMOKE-003 – Customer login works', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run');
      return;
    }

    await page.goto('/login');
    await page.getByRole('textbox', { name: /email/i }).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByText('Aldorado Jewells').first()).toBeVisible({ timeout: 10000 });
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  // SMOKE-004: Admin Login Works (requires ADMIN_EMAIL, ADMIN_PASSWORD)
  test('SMOKE-004 – Admin login works', async ({ page }) => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD to run');
      return;
    }

    await page.goto('/admin/login');
    await page.getByRole('textbox', { name: /email/i }).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
    const token = await page.evaluate(() => localStorage.getItem('adminToken'));
    expect(token).toBeTruthy();
  });
});

test.describe('Smoke – Product Listing', () => {
  // SMOKE-007: Product Listing Page Displays Products
  test('SMOKE-007 – Product listing page displays products', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const productLink = page.locator('a[href*="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15000 });
  });

  // SMOKE-008: Product Detail Page Loads
  test('SMOKE-008 – Product detail page loads', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const firstProduct = page.locator('a[href*="/product/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 10000 });
    await firstProduct.click();

    await expect(page).toHaveURL(/\/product\//);
    await expect(
      page.getByRole('button', { name: /add to cart/i }).or(page.getByText(/add to cart/i))
    ).toBeVisible({ timeout: 10000 });
  });
});
