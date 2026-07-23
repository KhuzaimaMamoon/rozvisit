import { expect, test } from '@playwright/test';
import {
  clearDatabase,
  connectDatabase,
  createAdmin,
  disconnectDatabase,
  password,
} from './helpers/database.js';

test.beforeAll(connectDatabase);
test.afterAll(disconnectDatabase);
test.beforeEach(clearDatabase);

test('access stays memory-only, protected calls use Bearer, and refresh restores a reload', async ({
  page,
}) => {
  const admin = await createAdmin();
  await page.goto('/login');
  await page.getByLabel('Email').fill(admin.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);

  const firstProtectedRequest = page.waitForRequest((request) =>
    request.url().includes('/api/v1/admin/applications?status=applied'),
  );
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL(/\/admin$/);
  expect((await firstProtectedRequest).headers().authorization).toMatch(/^Bearer /);

  const refreshCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'refreshToken_admin',
  );
  expect(refreshCookie).toMatchObject({ httpOnly: true, path: '/api/v1/auth', sameSite: 'Lax' });

  const refreshResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/api/v1/auth/refresh'),
  );
  const restoredProtectedRequest = page.waitForRequest((request) =>
    request.url().includes('/api/v1/admin/applications?status=applied'),
  );
  await page.reload();

  expect((await refreshResponse).ok()).toBeTruthy();
  expect((await restoredProtectedRequest).headers().authorization).toMatch(/^Bearer /);
  await expect(page).toHaveURL(/\/admin$/);
});

test('mobile-safe login does not race a speculative public-page refresh', async ({ page }) => {
  const admin = await createAdmin();
  let refreshRequests = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/v1/auth/refresh')) {
      refreshRequests += 1;
    }
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill(admin.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: "Today's overview" })).toBeVisible();
  expect(refreshRequests).toBe(0);
});
