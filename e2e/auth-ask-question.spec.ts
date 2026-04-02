import { expect, test } from '@playwright/test';

test.describe('E2E: auth and ask question flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://example.test/v1/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/account') && route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ $id: 'acc-1', name: 'Test User', email: 'qa@example.com' }),
        });
      }

      if (url.includes('/sessions')) {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ $id: 'session-1' }),
        });
      }

      if (url.includes('/jwt')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ jwt: 'jwt-token' }),
        });
      }

      if (url.includes('/storage/buckets') && route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ $id: 'file-1' }),
        });
      }

      if (url.includes('/account') && route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            $id: 'user-1',
            name: 'Test User',
            email: 'qa@example.com',
            prefs: { reputation: 0 },
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.route('**/api/question', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ $id: 'q-1' }),
      });
    });
  });

  test('user can register, login, and submit ask question form', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('First name').fill('Test');
    await page.getByLabel('Last name').fill('User');
    await page.getByLabel('Email Address').fill('qa@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign up/i }).click();

    await page.goto('/questions/ask');

    await page.getByLabel(/Title Address/i).fill('How to write e2e tests in Next.js?');
    await page.getByRole('textbox', { name: 'tag' }).fill('testing');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.setInputFiles('input[name="image"]', {
      name: 'screenshot.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71]),
    });

    await page.getByRole('button', { name: /Publish/i }).click();

    await expect(page).toHaveURL(/\/questions\/q-1\//);
  });
});
