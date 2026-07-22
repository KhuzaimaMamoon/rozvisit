import { expect, test } from '@playwright/test';
import {
  AuditEvent,
  CaregiverProfile,
  ParentProfile,
  Visit,
  clearDatabase,
  connectDatabase,
  createActiveCare,
  createAdmin,
  createCaregiver,
  createClient,
  disconnectDatabase,
  password,
} from './helpers/database.js';
import { login } from './helpers/browser.js';

test.beforeAll(connectDatabase);
test.afterAll(disconnectDatabase);
test.beforeEach(clearDatabase);

async function recordGate(page, buttonName, path) {
  const response = page.waitForResponse(
    (candidate) => candidate.request().method() === 'PATCH' && candidate.url().includes(path),
  );
  await page.getByRole('button', { name: buttonName }).click();
  const completed = await response;
  expect(completed.ok(), `${completed.status()} ${await completed.text()}`).toBeTruthy();
}

async function completeVisitForFeed(visit) {
  const completedAt = new Date();
  await Visit.updateOne(
    { _id: visit._id },
    {
      $set: {
        checklist: {
          capturedAt: completedAt,
          completedAt,
          concerns: ['appetite', 'medication'],
          medicationTaken: true,
          mood: 4,
          note: null,
        },
        media: [
          {
            capturedAt: completedAt,
            clientMediaId: 'e2e-feed-media-1',
            ref: 'https://res.cloudinary.com/rozvisit-e2e/image/upload/v1/rozvisit/e2e/proof.jpg',
            sourceFlag: 'in_app_camera',
            uploadedAt: completedAt,
          },
        ],
        status: 'completed',
      },
      $push: { statusHistory: { at: completedAt, status: 'completed' } },
    },
  );
}

test('AC-04: a caregiver records a first-visit decline, closing the visit no-fault and pausing the parent', async ({
  page,
}) => {
  const caregiver = await createCaregiver();
  const { parent, visit } = await createActiveCare({ caregiver, consentState: 'pending' });

  await login(page, {
    destination: /\/care\/today$/,
    email: caregiver.email,
    password,
  });
  await page.goto(`/care/visits/${visit._id}`);
  await expect(page.getByText('First visit consent')).toBeVisible();
  await page.getByRole('button', { name: 'Record decline' }).click();
  await page.waitForURL(/\/care\/today$/);

  await expect.poll(async () => (await Visit.findById(visit._id)).status).toBe('parent_declined');
  await expect.poll(async () => (await ParentProfile.findById(parent._id)).status).toBe('paused');
  const declined = await Visit.findById(visit._id);
  expect(declined.statusHistory.at(-1).reason).toBe('consent_declined');
});

test('AC-07: the client receives checklist/photo proof through a minted feed link, while a non-owner is denied', async ({
  browser,
}) => {
  const caregiver = await createCaregiver();
  const { client, parent, visit } = await createActiveCare({ caregiver });
  await completeVisitForFeed(visit);

  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  await login(ownerPage, { destination: /\/app\/feed$/, email: client.email, password });
  await ownerPage.goto(`/app/parents/${parent._id}/feed`);
  await expect(ownerPage.getByText('Ate less than usual')).toBeVisible();
  await expect(ownerPage.getByText('Medication question')).toBeVisible();
  const proofImage = ownerPage.getByAltText('Visit proof captured in RozVisit');
  await expect(proofImage).toBeVisible();
  const proofSource = await proofImage.getAttribute('src');
  expect(proofSource).not.toContain('/image/upload/');
  expect(new URL(proofSource).searchParams.get('signature')).toBeTruthy();

  const otherClient = await createClient({
    email: 'other-client@e2e.test',
    name: 'Other Client',
  });
  const nonOwnerContext = await browser.newContext();
  const nonOwnerPage = await nonOwnerContext.newPage();
  await login(nonOwnerPage, {
    destination: /\/app\/feed$/,
    email: otherClient.email,
    password,
  });
  const deniedResponse = nonOwnerPage.waitForResponse(
    (candidate) =>
      candidate.request().method() === 'GET' && candidate.url().includes('/api/v1/feed?'),
  );
  await nonOwnerPage.goto(`/app/parents/${parent._id}/feed`);
  expect((await deniedResponse).status()).toBe(403);
  await expect(nonOwnerPage.getByAltText('Visit proof captured in RozVisit')).toHaveCount(0);
  await ownerContext.close();
  await nonOwnerContext.close();
});

test('AC-08: a missed visit is shown honestly to the client with its recorded reason and make-up plan', async ({
  page,
}) => {
  const { client, parent, visit } = await createActiveCare();
  const missedAt = new Date();
  await Visit.updateOne(
    { _id: visit._id },
    {
      $set: { makeUpPlan: 'Rescheduled for tomorrow at the same time.', status: 'missed' },
      $push: {
        statusHistory: {
          at: missedAt,
          reason: 'Caregiver could not reach the area due to weather.',
          status: 'missed',
        },
      },
    },
  );

  await login(page, { destination: /\/app\/feed$/, email: client.email, password });
  await page.goto(`/app/parents/${parent._id}/feed`);
  await expect(page.getByText('missed', { exact: true })).toBeVisible();
  await expect(page.getByText('Caregiver could not reach the area due to weather.')).toBeVisible();
  await expect(page.getByText('Rescheduled for tomorrow at the same time.')).toBeVisible();
});

test('AC-09: every admin mutation performed by the scenario writes an attributable audit event', async ({
  page,
}) => {
  const admin = await createAdmin();
  const applicant = await createCaregiver({ email: 'audit-applicant@e2e.test', status: 'applied' });
  const application = await CaregiverProfile.findOne({ userId: applicant._id });
  const { visit } = await createActiveCare();

  await login(page, { destination: /\/admin$/, email: admin.email, password });
  await page.goto(`/admin/applications/${application._id}`);
  await page.getByLabel('CNIC document reference').fill('e2e/audit/cnic');
  await page.getByLabel('CNIC is genuine and matches the applicant').check();
  await recordGate(page, 'Record CNIC check', '/cnic-gate');
  await page.getByLabel('Interview passed').check();
  await recordGate(page, 'Record interview', '/interview-gate');
  await page.getByLabel('Reference outcome').selectOption('positive');
  await recordGate(page, 'Record reference', '/reference-gate');
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('Application decision recorded.')).toBeVisible();

  await page.goto(`/admin/visits/${visit._id}`);
  await page.getByLabel('Reason').fill('Road closure prevented the visit.');
  await page.getByLabel('Make-up plan (optional)').fill('Operations will contact the family.');
  await page.getByRole('button', { name: 'Mark missed' }).click();
  await expect(page.getByText('Visit marked missed. The family has been notified.')).toBeVisible();

  const actions = [
    'caregiver.cnic_gate_recorded',
    'caregiver.interview_gate_recorded',
    'caregiver.reference_gate_recorded',
    'caregiver.approve',
    'visit.marked_missed',
  ];
  await expect
    .poll(async () => AuditEvent.countDocuments({ action: { $in: actions }, actorId: admin._id }))
    .toBe(actions.length);
  const audits = await AuditEvent.find({ action: { $in: actions }, actorId: admin._id });
  expect(audits).toHaveLength(actions.length);
  expect(audits.every((event) => event.at instanceof Date && event.at.getTime() > 0)).toBeTruthy();
});

test('AC-02: scheduling more than the active plan allowance is refused in the browser with the plan limit', async ({
  page,
}) => {
  const { client, parent, visit } = await createActiveCare();
  await Visit.deleteOne({ _id: visit._id });
  await login(page, { destination: /\/app\/feed$/, email: client.email, password });
  await page.goto(`/app/parents/${parent._id}/schedule`);
  await expect(page.getByText('Standard includes 3 visits each week.')).toBeVisible();
  await page.getByRole('button', { name: /Add weekly slot/ }).click();
  await page.getByRole('button', { name: /Add weekly slot/ }).click();
  await page.getByRole('button', { name: /Add weekly slot/ }).click();
  await expect(
    page.getByText('Your plan includes 3 visits per week. Upgrade to add more.'),
  ).toBeVisible();
});
