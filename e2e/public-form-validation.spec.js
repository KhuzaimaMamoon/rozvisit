import { expect, test } from '@playwright/test';
import {
  clearDatabase,
  connectDatabase,
  createClient,
  disconnectDatabase,
  password,
} from './helpers/database.js';
import { login } from './helpers/browser.js';

test.beforeAll(connectDatabase);
test.afterAll(disconnectDatabase);
test.beforeEach(clearDatabase);

for (const { initialField, path, submit } of [
  { initialField: 'Full name', path: '/register', submit: 'Create account' },
  { initialField: 'Full name', path: '/apply', submit: 'Submit application' },
]) {
  test(`${path} waits for submission before showing validation and stays within the viewport`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByLabel(initialField).fill('A');
    await page.waitForTimeout(100);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy();

    await page.getByRole('button', { name: submit }).click();

    await expect(page.getByRole('alert')).toContainText('Please fix:');
    await expect(page.getByLabel('Email')).toBeFocused();
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  });
}

test('parent profile stays quiet while initially filling and reveals errors only after Save', async ({
  page,
}) => {
  const client = await createClient();
  await login(page, { destination: /\/app\/feed$/, email: client.email, password });
  await page.goto('/app/parents/new');

  await page.locator('#parent-name').fill('Amina Bibi');
  await page.waitForTimeout(100);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Save parent details' }).click();

  await expect(page.getByRole('alert')).toContainText('Please fix: Age');
  await expect(page.getByLabel('Age')).toBeFocused();
  await expect(page.getByLabel('Age')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#parent-age-error')).toContainText(
    'Age must be a whole number between 40 and 120.',
  );
});
