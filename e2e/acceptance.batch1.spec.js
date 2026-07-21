import { expect, test } from '@playwright/test';
import {
  Subscription,
  User,
  Visit,
  clearDatabase,
  connectDatabase,
  createActiveCare,
  createAdmin,
  createCaregiver,
  createVerificationToken,
  disconnectDatabase,
  password,
  seedPlans,
} from './helpers/database.js';
import { login, mockCamera, mockCloudinaryUpload } from './helpers/browser.js';

test.beforeAll(connectDatabase);
test.afterAll(disconnectDatabase);
test.beforeEach(clearDatabase);

async function openCaregiverVisit(page, visitId, caregiver) {
  await mockCamera(page);
  await mockCloudinaryUpload(page);
  await login(page, {
    destination: /\/care\/today$/,
    email: caregiver.email,
    password,
  });
  await page.goto(`/care/visits/${visitId}`);
  await expect(page.getByRole('heading', { name: 'Amina Bibi' })).toBeVisible();
}

async function capturePhoto(page) {
  await page.getByRole('button', { name: 'Open camera' }).click();
  await expect(page.getByRole('button', { name: 'Capture photo' })).toBeEnabled();
  await page.getByRole('button', { name: 'Capture photo' }).click();
  await expect(page.getByText('1/5')).toBeVisible();
}

async function recordGate(page, buttonName, path) {
  const response = page.waitForResponse(
    (candidate) => candidate.request().method() === 'PATCH' && candidate.url().includes(path),
  );
  await page.getByRole('button', { name: buttonName }).click();
  const completed = await response;
  expect(completed.ok(), `${completed.status()} ${await completed.text()}`).toBeTruthy();
}

test('AC-01: client registers, verifies, creates a parent, selects a plan, then schedules after activation', async ({
  browser,
}) => {
  await seedPlans();
  const admin = await createAdmin();
  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  const email = 'ac01-client@e2e.test';

  await client.goto('/register');
  await client.getByLabel('Full name').fill('Acceptance Client');
  await client.getByLabel('Email').fill(email);
  await client.getByLabel('Phone').fill('+971501234567');
  await client.getByLabel('Country').fill('AE');
  await client.getByLabel('Password').fill(password);
  await client.getByRole('button', { name: 'Create account' }).click();
  await expect(client.getByText('Check your email to verify your account')).toBeVisible();

  const registered = await User.findOne({ email });
  const token = await createVerificationToken(registered._id);
  await client.goto(`/verify?token=${token}`);
  await client.getByRole('button', { name: 'Verify email' }).click();
  await client.getByRole('button', { name: 'Continue to login' }).click();
  await login(client, { destination: /\/app\/feed$/, email, password });

  await client.goto('/app/parents/new');
  await client.locator('#parent-name').fill('Acceptance Parent');
  await client.getByLabel('Age').fill('68');
  await client.getByLabel('Address').fill('Satellite Town, Rawalpindi');
  await client.getByLabel('Longitude').fill('73.0479');
  await client.getByLabel('Latitude').fill('33.6844');
  await client.locator('#contact-name-0').fill('Ayesha Khan');
  await client.getByLabel('Relationship').fill('Daughter');
  await client.getByLabel('Phone', { exact: true }).fill('+971501234567');
  await client.getByRole('button', { name: 'Save parent details' }).click();
  await client.waitForURL(/\/app\/parents\/[a-f\d]{24}$/);
  const parentId = client.url().split('/').at(-1);

  await client.getByRole('link', { name: 'Choose a plan' }).click();
  await client.getByRole('button', { name: 'Select Standard' }).click();
  await client.waitForURL(`/app/parents/${parentId}`);

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, { destination: /\/admin$/, email: admin.email, password });
  await adminPage.goto('/admin/subscriptions');
  await adminPage.getByRole('button', { name: 'Send link' }).click();
  await adminPage.getByRole('button', { name: 'Activate' }).click();
  await adminPage.getByLabel('Payoneer reference').fill('E2E-PAY-001');
  await adminPage.getByLabel('Agreed price').fill('195');
  await adminPage.getByLabel('Currency').selectOption('AED');
  await adminPage.getByRole('button', { name: 'Activate subscription' }).click();
  await expect(adminPage.getByText('Activation recorded for AED 195.')).toBeVisible();
  await expect.poll(async () => (await Subscription.findOne({ parentId }))?.state).toBe('active');

  const parentResponse = client.waitForResponse(
    (candidate) =>
      candidate.request().method() === 'GET' &&
      candidate.url().includes(`/api/v1/parents/${parentId}`),
  );
  await client.reload();
  const parentPayload = await (await parentResponse).json();
  expect(parentPayload.data.subscriptionSummary.state).toBe('active');
  expect(parentPayload.data.schedulingSummary.scheduleEnabled).toBeTruthy();
  await expect(client.getByRole('link', { name: 'Schedule visits' })).toBeEnabled();
  await client.getByRole('link', { name: 'Schedule visits' }).click();
  await client.getByRole('button', { name: 'Confirm schedule' }).click();
  await client.waitForURL(`/app/parents/${parentId}`);
  await expect(client.getByText('This week is already set.')).toBeVisible();
  await clientContext.close();
  await adminContext.close();
});

test('AC-03: caregiver application cannot be approved before all gates, then reaches Today after approval', async ({
  browser,
}) => {
  await seedPlans();
  const admin = await createAdmin();
  const applicantEmail = 'ac03-caregiver@e2e.test';
  const applicantContext = await browser.newContext();
  const applicantPage = await applicantContext.newPage();

  await applicantPage.goto('/apply');
  await applicantPage.getByLabel('Full name').fill('Acceptance Caregiver');
  await applicantPage.getByLabel('Email').fill(applicantEmail);
  await applicantPage.getByLabel('Phone').fill('+923001234567');
  await applicantPage.getByLabel('CNIC number').fill('3520212345678');
  await applicantPage.getByLabel('Password').fill(password);
  await applicantPage.getByLabel('Service latitude').fill('33.6844');
  await applicantPage.getByLabel('Service longitude').fill('73.0479');
  await applicantPage.getByLabel('Radius (km)').fill('10');
  await applicantPage.getByRole('button', { name: 'Submit application' }).click();
  await expect(applicantPage.getByText('Your application has been received.')).toBeVisible();

  const caregiver = await User.findOne({ email: applicantEmail });
  const { visit } = await createActiveCare({ caregiver });
  const token = await createVerificationToken(caregiver._id);
  await applicantPage.goto(`/verify?token=${token}`);
  await applicantPage.getByRole('button', { name: 'Verify email' }).click();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, { destination: /\/admin$/, email: admin.email, password });
  await adminPage.goto('/admin/applications');
  await adminPage.getByRole('link', { name: 'Open application' }).click();
  await expect(adminPage.getByRole('button', { name: 'Approve' })).toBeDisabled();
  await adminPage.getByLabel('CNIC document reference').fill('e2e/cnic/reference');
  await adminPage.getByLabel('CNIC is genuine and matches the applicant').check();
  await recordGate(adminPage, 'Record CNIC check', '/cnic-gate');
  await adminPage.getByLabel('Interview passed').check();
  await recordGate(adminPage, 'Record interview', '/interview-gate');
  await adminPage.getByLabel('Reference outcome').selectOption('positive');
  await recordGate(adminPage, 'Record reference', '/reference-gate');
  await expect(adminPage.getByRole('button', { name: 'Approve' })).toBeEnabled();
  await adminPage.getByRole('button', { name: 'Approve' }).click();
  await expect(adminPage.getByText('Application decision recorded.')).toBeVisible();

  const caregiverContext = await browser.newContext();
  const caregiverPage = await caregiverContext.newPage();
  await login(caregiverPage, { destination: /\/care\/today$/, email: applicantEmail, password });
  await expect(caregiverPage.getByText('Amina Bibi')).toBeVisible();
  await expect(caregiverPage.getByRole('link', { name: /Amina Bibi/ })).toHaveAttribute(
    'href',
    `/care/visits/${visit._id}`,
  );
  await applicantContext.close();
  await adminContext.close();
  await caregiverContext.close();
});

test('AC-05: completion needs camera proof and the browser renders no gallery picker', async ({
  page,
}) => {
  const caregiver = await createCaregiver();
  const { visit } = await createActiveCare({ caregiver });
  await openCaregiverVisit(page, visit._id, caregiver);

  await page.getByLabel('Mood 4').click();
  await expect(page.getByRole('button', { name: 'Complete visit' })).toBeDisabled();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await capturePhoto(page);
  await page.getByRole('button', { name: 'Complete visit' }).click();
  await page.waitForURL(/\/care\/today$/);
  await expect.poll(async () => (await Visit.findById(visit._id)).status).toBe('completed');
});

test('AC-06: offline completion persists, synchronizes after reconnect, and retains capture/upload times', async ({
  context,
  page,
}) => {
  const caregiver = await createCaregiver();
  const { visit } = await createActiveCare({ caregiver });
  await openCaregiverVisit(page, visit._id, caregiver);
  await page.getByLabel('Mood 4').click();
  await context.setOffline(true);
  await capturePhoto(page);
  await page.getByRole('button', { name: 'Complete visit' }).click();
  await expect(page.getByText('Saved offline, pending upload.')).toBeVisible();
  await expect.poll(async () => (await Visit.findById(visit._id)).status).toBe('scheduled');

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(async () => (await Visit.findById(visit._id)).status).toBe('completed');
  const completed = await Visit.findById(visit._id);
  expect(completed.media).toHaveLength(1);
  expect(completed.media[0].capturedAt.getTime()).toBeLessThanOrEqual(
    completed.media[0].uploadedAt.getTime(),
  );
  await expect(page.getByText('Connection restored. Saved work has synced.')).toBeVisible();
});
