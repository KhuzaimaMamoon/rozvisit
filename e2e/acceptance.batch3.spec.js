import { expect, test } from '@playwright/test';
import {
  clearDatabase,
  connectDatabase,
  createActiveCare,
  createCaregiver,
  disconnectDatabase,
  password,
} from './helpers/database.js';
import { login } from './helpers/browser.js';

const COLORS = Object.freeze({
  background: 'rgb(248, 250, 249)',
  primary: 'rgb(49, 90, 103)',
  primarySoft: 'rgb(231, 240, 242)',
});

test.beforeAll(connectDatabase);
test.afterAll(disconnectDatabase);
test.beforeEach(clearDatabase);

test('AC-11: privacy policy is reachable from the in-app footer and states the documented privacy topics', async ({
  page,
}) => {
  const caregiver = await createCaregiver();
  await createActiveCare({ caregiver });
  await login(page, {
    destination: /\/care\/today$/,
    email: caregiver.email,
    password,
  });

  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { name: 'Privacy policy' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What we collect' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Consent and access' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Storage and retention' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Deletion requests' })).toBeVisible();
});

test('AC-12: representative client-facing states use the mandatory palette and pair status color with a text label', async ({
  page,
}, testInfo) => {
  const caregiver = await createCaregiver();
  await createActiveCare({ caregiver });
  await login(page, {
    destination: /\/care\/today$/,
    email: caregiver.email,
    password,
  });

  await expect(page.getByText("Today's assigned visits.")).toBeVisible();
  await expect(page.getByText('scheduled', { exact: true })).toBeVisible();
  const colors = await page.evaluate(() => {
    const header = document.querySelector('header');
    const badge = [...document.querySelectorAll('span')].find(
      (element) => element.textContent?.trim() === 'scheduled',
    );
    return {
      badgeBackground: badge ? getComputedStyle(badge).backgroundColor : null,
      badgeText: badge ? getComputedStyle(badge).color : null,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      headerBackground: header ? getComputedStyle(header).backgroundColor : null,
      statusText: badge?.textContent?.trim() ?? null,
    };
  });
  expect(colors.bodyBackground).toBe(COLORS.background);
  expect(colors.headerBackground).toBe('rgb(255, 255, 255)');
  expect(colors.badgeBackground).toBe(COLORS.primarySoft);
  expect(colors.badgeText).toBe(COLORS.primary);
  expect(colors.statusText).toBe('scheduled');
  await page.screenshot({ path: testInfo.outputPath('caregiver-status-palette.png') });

  await page.goto('/privacy');
  const privacyHeaderBackground = await page
    .locator('main > div > header')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(privacyHeaderBackground).toBe(COLORS.primarySoft);
});

test('AC-10: records a throttled-3G Playwright timing signal for the caregiver Today screen', async ({
  browser,
}) => {
  test.slow();
  const caregiver = await createCaregiver();
  await createActiveCare({ caregiver });
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, {
    destination: /\/care\/today$/,
    email: caregiver.email,
    password,
  });
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', {
    downloadThroughput: 50 * 1024,
    latency: 400,
    offline: false,
    uploadThroughput: 50 * 1024,
  });
  const startedAt = performance.now();
  await page.goto('/care/today');
  await expect(page.getByText('Amina Bibi')).toBeVisible();
  const elapsedMs = performance.now() - startedAt;
  test.info().annotations.push({
    description: `${Math.round(elapsedMs)} ms at 400 kbps / 400 ms latency`,
    type: 'throttled-3g-signal',
  });
  expect(elapsedMs).toBeGreaterThan(0);
  await context.close();
});
