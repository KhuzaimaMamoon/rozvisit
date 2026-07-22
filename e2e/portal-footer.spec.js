import { expect, test } from '@playwright/test';
import {
  CaregiverProfile,
  clearDatabase,
  connectDatabase,
  createActiveCare,
  createAdmin,
  createCaregiver,
  createClient,
  disconnectDatabase,
  password,
  seedPlans,
} from './helpers/database.js';
import { login } from './helpers/browser.js';

test.beforeAll(connectDatabase);
test.afterAll(disconnectDatabase);
test.beforeEach(clearDatabase);

async function expectCorrectFooterFlow(page, path) {
  await page.goto(path);
  const footer = page.locator('footer');
  await expect(footer).toBeAttached();

  const layout = await page.evaluate(() => {
    const footerElement = document.querySelector('footer');
    const main = document.querySelector('main');
    const footerRect = footerElement.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const documentHeight = document.documentElement.scrollHeight;
    return {
      documentHeight,
      footerBottomInDocument: footerRect.bottom + window.scrollY,
      footerBottomInViewport: footerRect.bottom,
      footerTopInDocument: footerRect.top + window.scrollY,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      mainBottomInDocument: mainRect.bottom + window.scrollY,
      viewportHeight: window.innerHeight,
    };
  });

  expect(layout.hasHorizontalOverflow, `${path} has horizontal overflow`).toBeFalsy();
  expect(
    Math.abs(layout.footerBottomInDocument - layout.documentHeight),
    `${path} has blank space after its footer`,
  ).toBeLessThanOrEqual(1);
  expect(
    layout.footerTopInDocument,
    `${path} footer overlaps or separates from page content`,
  ).toBeGreaterThanOrEqual(layout.mainBottomInDocument - 1);

  if (layout.documentHeight <= layout.viewportHeight + 1) {
    expect(
      Math.abs(layout.footerBottomInViewport - layout.viewportHeight),
      `${path} short-page footer is not at the viewport bottom`,
    ).toBeLessThanOrEqual(1);
  }
}

test('client routes share correct short and long footer behavior', async ({ page }) => {
  await seedPlans();
  const client = await createClient();
  const { parent } = await createActiveCare({ client });
  await login(page, { destination: /\/app\/feed$/, email: client.email, password });

  for (const path of [
    '/app/feed',
    '/app/parents',
    '/app/parents/new',
    `/app/parents/${parent._id}`,
    `/app/parents/${parent._id}/edit`,
    `/app/parents/${parent._id}/plan`,
    `/app/parents/${parent._id}/schedule`,
    `/app/parents/${parent._id}/feed`,
    '/app/notifications',
    '/app/account',
  ]) {
    await expectCorrectFooterFlow(page, path);
  }
});

test('caregiver routes share correct short and long footer behavior', async ({ page }) => {
  const caregiver = await createCaregiver();
  const { visit } = await createActiveCare({ caregiver });
  await login(page, {
    destination: /\/care\/today$/,
    email: caregiver.email,
    password,
  });

  for (const path of [
    '/care/today',
    '/care/visits',
    `/care/visits/${visit._id}`,
    '/care/earnings',
    '/care/notifications',
    '/care/account',
  ]) {
    await expectCorrectFooterFlow(page, path);
  }
});

test('admin routes share correct short and long footer behavior', async ({ page }) => {
  const admin = await createAdmin();
  const applicant = await createCaregiver({ status: 'applied' });
  const application = await CaregiverProfile.findOne({ userId: applicant._id });
  const verifiedCaregiver = await createCaregiver();
  const { visit } = await createActiveCare({ caregiver: verifiedCaregiver });
  await login(page, { destination: /\/admin$/, email: admin.email, password });

  for (const path of [
    '/admin',
    '/admin/applications',
    `/admin/applications/${application._id}`,
    '/admin/caregivers',
    '/admin/clients',
    '/admin/visits',
    `/admin/visits/${visit._id}`,
    '/admin/subscriptions',
    '/admin/notifications',
    '/admin/account',
  ]) {
    await expectCorrectFooterFlow(page, path);
  }
});

test('public routes share correct short and long footer behavior', async ({ page }) => {
  for (const path of [
    '/login',
    '/register',
    '/apply',
    '/verify-email',
    '/verify?token=invalid-test-token',
    '/forgot',
    '/reset?token=invalid-test-token',
    '/privacy',
    '/terms',
    '/not-a-real-route',
  ]) {
    await expectCorrectFooterFlow(page, path);
  }
});
