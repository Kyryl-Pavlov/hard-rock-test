import { expect, test } from '@playwright/test';

test('home page shows the app title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
    'Rick & Morty Explorer',
  );
  await expect(page.getByRole('img', { name: 'Rick & Morty' })).toBeVisible();
});

// Needs the API running (npm run docker:up).
test('home page lists characters without the browser calling the API', async ({
  page,
  context,
}) => {
  const apiRequests: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.port === '4000' || url.pathname.endsWith('/graphql')) apiRequests.push(req.url());
  });

  await page.goto('/');

  const cards = page.getByRole('article');
  await expect(cards.first()).toBeVisible();
  await expect(cards.first().getByRole('heading', { level: 2 })).not.toBeEmpty();
  await expect(cards.first().getByRole('img')).toBeVisible();
  expect(apiRequests).toEqual([]);

  const session = (await context.cookies()).find((c) => c.name === 'rme_session');
  expect(session?.httpOnly).toBe(true);
});

// Needs the API running (npm run docker:up).
test('scrolling to the end of the list loads more characters', async ({ page }) => {
  const apiRequests: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.port === '4000' || url.pathname.endsWith('/graphql')) apiRequests.push(req.url());
  });

  await page.goto('/');

  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(20);

  await cards.last().scrollIntoViewIfNeeded();

  await expect.poll(() => cards.count()).toBeGreaterThan(20);
  await expect(page.getByText(/^Showing \d+ of \d+ characters$/)).toBeVisible();
  expect(apiRequests).toEqual([]);
});

// Needs the API running (npm run docker:up).
test('a back-to-top button appears after one screen of scrolling and returns to the top', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('article').first()).toBeVisible();

  const backToTop = page.getByRole('button', { name: 'Back to top' });
  await expect(backToTop).toHaveCount(0);

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
  await expect(backToTop).toBeInViewport();

  await backToTop.click();

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(backToTop).toHaveCount(0);
});

// Needs the API running (npm run docker:up).
test('on big screens a small logo bar stays at the top once the title scrolls away', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.getByRole('article').first()).toBeVisible();

  // The bar is aria-hidden (it repeats the title), so include hidden elements.
  const logos = page.getByRole('img', { name: 'Rick & Morty', includeHidden: true });
  await expect(logos).toHaveCount(1);

  await page.evaluate(() => window.scrollTo(0, 2000));
  await expect(page.getByRole('heading', { level: 1 })).not.toBeInViewport();
  await expect(logos).toHaveCount(2);
  await expect(logos.last()).toBeInViewport();

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(logos).toHaveCount(1);
});

// Needs the API running (npm run docker:up).
test.describe('search and filters', () => {
  test('filtering by status updates the URL and the list', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    const filters = page.getByRole('complementary', { name: 'Filters' });
    await filters.getByText('Dead', { exact: true }).click();

    await expect(page).toHaveURL(/\?status=Dead$/);
    const badges = page.getByRole('article').getByText('Dead', { exact: true });
    await expect(badges.first()).toBeVisible();
    await expect(page.getByRole('article').getByText('Alive', { exact: true })).toHaveCount(0);
  });

  test('searching by name narrows the list and survives a reload', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Search characters by name' }).fill('rick');
    await expect(page).toHaveURL(/\?name=rick$/);

    const names = page.getByRole('article').getByRole('heading', { level: 2 });
    await expect(names.first()).toContainText(/rick/i);
    for (const name of await names.allTextContents()) expect(name).toMatch(/rick/i);

    await page.reload();
    await expect(page.getByRole('searchbox', { name: 'Search characters by name' })).toHaveValue(
      'rick',
    );
    await expect(names.first()).toContainText(/rick/i);
  });

  test('client-side pages come from the Next server, never the API', async ({ page }) => {
    const apiRequests: string[] = [];
    const routeRequests: string[] = [];
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.port === '4000' || url.pathname.endsWith('/graphql')) apiRequests.push(req.url());
      if (url.pathname === '/api/characters') routeRequests.push(req.url());
    });

    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Search characters by name' }).fill('morty');
    await expect(page).toHaveURL(/\?name=morty$/);
    await expect(page.getByRole('article').first()).toContainText(/morty/i);

    expect(routeRequests.length).toBeGreaterThan(0);
    expect(apiRequests).toEqual([]);
  });

  test('on small screens the filters open in a drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.getByRole('complementary', { name: 'Filters' })).toBeHidden();
    await page.getByRole('button', { name: /^Filters/ }).click();

    const drawer = page.getByRole('dialog', { name: 'Filters' });
    await expect(drawer).toBeVisible();
    await drawer.getByText('Alive', { exact: true }).click();
    await expect(page).toHaveURL(/\?status=Alive$/);

    await drawer.getByRole('button', { name: /^Show \d+ characters$/ }).click();
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('button', { name: 'Filters (1)' })).toBeVisible();
  });

  test('on small screens the logo, search and Filters button share one top bar while scrolling', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('article').first()).toBeVisible();

    // The small logos are aria-hidden (they repeat the title), so include hidden elements. The
    // compact logo bar is rendered but display:none here, so it never counts as visible.
    const visibleLogos = page
      .getByRole('img', { name: 'Rick & Morty', includeHidden: true })
      .filter({ visible: true });
    await expect(visibleLogos).toHaveCount(1);

    await page.evaluate(() => window.scrollTo(0, 2000));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);

    const search = page.getByRole('searchbox', { name: 'Search characters by name' });
    await expect(search).toBeInViewport();
    await expect(page.getByRole('button', { name: /^Filters/ })).toBeInViewport();
    // In the top bar itself, not under a separate 56px logo bar.
    expect((await search.boundingBox())?.y).toBeLessThan(56);

    // The title's logo (scrolled away) and the toolbar's.
    await expect(visibleLogos).toHaveCount(2);
    await expect(visibleLogos.last()).toBeInViewport();

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(visibleLogos).toHaveCount(1);
  });

  test('on big screens the search and the filter panel stay on screen while scrolling', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('article').first()).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 2000));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);

    await expect(
      page.getByRole('searchbox', { name: 'Search characters by name' }),
    ).toBeInViewport();
    await expect(page.getByRole('complementary', { name: 'Filters' })).toBeInViewport();
  });

  test('the page behind the open drawer does not scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('article').first()).toBeVisible();

    await page.getByRole('button', { name: /^Filters/ }).click();
    const drawer = page.getByRole('dialog', { name: 'Filters' });
    await expect(drawer).toBeVisible();
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');

    // Wheel over the scrim, to the right of the 320px sheet, and let a couple of frames pass.
    await page.mouse.move(370, 600);
    await page.mouse.wheel(0, 1000);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await drawer.getByRole('button', { name: 'Close filters' }).click();
    await expect(drawer).toBeHidden();
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  });
});
