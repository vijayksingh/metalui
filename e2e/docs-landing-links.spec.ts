import { expect, test } from '@playwright/test';

// The front door says where the package lives: a second key beside the way in opens the npm page, and the
// GitHub mark carries the repository's star count, read live from GitHub and written out for screen readers.
test('the front door links to npm and shows the GitHub star count', async ({ page }) => {
  await page.route('https://api.github.com/repos/vijayksingh/metalui', (route) =>
    route.fulfill({ json: { stargazers_count: 1234 }, headers: { 'access-control-allow-origin': '*' } }));
  await page.goto('/');
  await page.waitForSelector('.landing');

  const npm = page.getByRole('link', { name: 'View on npm' });
  await expect(npm).toBeVisible();
  await expect(npm).toHaveAttribute('href', 'https://www.npmjs.com/package/@unlocalhosted/metalui');
  await expect(npm).toHaveAttribute('target', '_blank');

  const github = page.getByRole('link', { name: 'MetalUI on GitHub, 1,234 stars' });
  await expect(github).toBeVisible();
  await expect(github).toHaveAttribute('href', 'https://github.com/vijayksingh/metalui');
  await expect(github).toContainText('1.2K');

  // The count is kept, so the next visit shows it before GitHub answers.
  await page.unroute('https://api.github.com/repos/vijayksingh/metalui');
  await page.route('https://api.github.com/repos/vijayksingh/metalui', (route) => route.fulfill({ status: 403, json: {} }));
  await page.reload();
  await expect(page.getByRole('link', { name: 'MetalUI on GitHub, 1,234 stars' })).toBeVisible();
});
