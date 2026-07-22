import { expect } from '@playwright/test';

export async function mockCamera(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => new MediaStream() },
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      configurable: true,
      get: () => 480,
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      configurable: true,
      get: () => 640,
    });
    HTMLMediaElement.prototype.play = async function play() {
      queueMicrotask(() => this.dispatchEvent(new Event('loadeddata')));
    };
    HTMLCanvasElement.prototype.toBlob = function toBlob(callback) {
      callback(new Blob(['e2e-camera-photo'], { type: 'image/jpeg' }));
    };
  });
}

export async function mockCloudinaryUpload(page) {
  const uploads = [];
  await page.route('https://api.cloudinary.com/**', async (route) => {
    uploads.push(route.request().postData() ?? '');
    await route.fulfill({
      contentType: 'application/json',
      status: 200,
      body: JSON.stringify({
        public_id: 'rozvisit/e2e/proof',
        secure_url:
          'https://res.cloudinary.com/rozvisit-e2e/image/authenticated/rozvisit/e2e/proof.jpg',
      }),
    });
  });
  return uploads;
}

export async function login(page, { email, password, destination }) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/api/v1/auth/login'),
  );
  await page.getByRole('button', { name: 'Log in' }).click();
  const response = await loginResponse;
  expect(
    response.ok(),
    `Login returned ${response.status()}: ${await response.text()}`,
  ).toBeTruthy();
  await page.waitForURL(destination);
}
