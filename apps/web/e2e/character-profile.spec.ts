import { expect, test, type Page } from '@playwright/test';

// Records requests the browser sends straight to the API or to the GraphQL upstream.
function watchApiRequests(page: Page): string[] {
  const apiRequests: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.port === '4000' || url.pathname.endsWith('/graphql')) apiRequests.push(req.url());
  });
  return apiRequests;
}

// Needs the API running (npm run docker:up).
test('a card opens the full profile, and the breadcrumb returns to the filtered list', async ({
  page,
}) => {
  const apiRequests = watchApiRequests(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?status=Dead');

  const card = page.getByRole('article').first();
  const name = (await card.getByRole('heading', { level: 2 }).textContent())?.trim() ?? '';
  expect(name).not.toBe('');

  await card.getByRole('link', { name }).click();

  await expect(page).toHaveURL(/\/characters\/\d+$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
  await expect(page).toHaveTitle(`${name} · Rick & Morty Explorer`);
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumb.getByText(name)).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('region', { name: 'Registry' })).toContainText('Dead');
  await expect(
    page.getByRole('region', { name: 'Episodes' }).getByRole('listitem').first(),
  ).toBeVisible();

  await breadcrumb.getByRole('link', { name: 'Characters' }).click();

  await expect(page).toHaveURL(/\/\?status=Dead$/);
  await expect(page.getByRole('article').first().getByRole('heading', { level: 2 })).toHaveText(
    name,
  );
  expect(apiRequests).toEqual([]);
});

// Needs the API running (npm run docker:up).
test('a direct visit server-renders the profile', async ({ page }) => {
  await page.goto('/characters/1');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rick Sanchez');
  await expect(page.getByRole('region', { name: 'Registry' })).toContainText('Earth (C-137)');
  await expect(page.getByRole('region', { name: 'Episodes' })).toContainText('Pilot');

  // Nothing to go back to, so the breadcrumb is a plain link to the list.
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('article').first()).toBeVisible();
});

// Needs the API running (npm run docker:up).
test('the profile has a small logo header that links home', async ({ page }) => {
  await page.goto('/characters/1');

  const home = page.getByRole('banner').getByRole('link', { name: 'Rick & Morty Explorer home' });
  await expect(home).toBeVisible();

  await home.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('article').first()).toBeVisible();
});

// Needs the API running (npm run docker:up).
test('hovering a card prefetches its profile through the Next server', async ({ page }) => {
  const apiRequests = watchApiRequests(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const card = page.getByRole('article').first();
  await expect(card).toBeVisible();
  const prefetch = page.waitForResponse((res) => /\/api\/characters\/\d+$/.test(res.url()));
  await card.hover();

  const res = await prefetch;
  expect(res.status()).toBe(200);
  expect(res.headers()['cache-control']).toBe('private, max-age=300');
  expect(apiRequests).toEqual([]);
});

test.describe('unknown characters', () => {
  for (const id of ['999999', 'abc']) {
    test(`/characters/${id} shows the not-found page`, async ({ page }) => {
      await page.goto(`/characters/${id}`);

      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Character not found');
      await expect(page.getByRole('link', { name: 'Browse characters' })).toHaveAttribute(
        'href',
        '/',
      );
    });
  }
});
