import { test, expect } from '@playwright/test';

test('setup previews the seeded routes and playback keeps them after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Names, one per line', { exact: true }).fill('Rowan\nCleo\nAsh\nFern');
  await page.getByRole('button', { name: 'Add to cast', exact: true }).click();
  await page.getByRole('button', { name: 'Game settings' }).click();
  await page.getByText('Advanced settings', { exact: true }).click();
  await page.getByText('Arena routes', { exact: true }).click();

  const seed = page.getByLabel('Game seed', { exact: true });
  const preview = page.locator('.arena-routes [data-region="forest"]');
  await seed.fill('routes-0');
  await expect(preview).toContainText('Connected to The Mountains, The Center Podium');
  await expect(preview).not.toContainText('The Tundra');
  await seed.fill('routes-2');
  await expect(preview).toContainText('Connected to The Center Podium, The Tundra');

  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.locator('footer').getByRole('status')).toContainText('Progress saved');
  const forest = page.locator('.location-row').filter({ hasText: /^The Forest/ });
  const tundra = page.locator('.location-row').filter({ hasText: /^The Tundra/ });
  for (const reload of [false, true]) {
    if (reload) {
      await page.reload();
      await page.getByRole('button', { name: 'Resume game' }).click();
    }
    await page.getByText('Arena routes', { exact: true }).click();
    await expect(forest.locator('small')).toHaveText('↔ The Center Podium, The Tundra');
    await expect(tundra.locator('small')).toContainText('The Forest');
  }
});
