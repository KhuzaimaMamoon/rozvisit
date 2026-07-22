import { expect, test } from '@playwright/test';

for (const { firstField, path, submit } of [
  { firstField: 'Full name', path: '/register', submit: 'Create account' },
  { firstField: 'Full name', path: '/apply', submit: 'Submit application' },
]) {
  test(`${path} waits for submission before showing validation and stays within the viewport`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy();

    await page.getByRole('button', { name: submit }).click();

    await expect(page.getByRole('alert')).toContainText('Please fix:');
    await expect(page.getByLabel(firstField)).toBeFocused();
    await expect(page.getByLabel(firstField)).toHaveAttribute('aria-invalid', 'true');
  });
}
