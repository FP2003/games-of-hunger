import { expect, test } from '@playwright/test';
import { fixtureRun } from '../fixtures';
import { canonicalRunId } from '../../src/domain';

for (const width of [1280, 390]) test(`archive cast records persist, filter and follow deletions at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Season archive' }).click();
  await expect(page.getByText('No cast records available.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  const second = structuredClone(fixtureRun);
  second.input.cast.title = 'Return of the cast';
  second.input.settings.seed = 'stats-second-season';
  second.input.cast.players[0].name = 'Returning Alex';
  second.id = canonicalRunId(second.input);
  for (const run of [fixtureRun, second]) {
    await page.locator('input[type=file]').first().setInputFiles({ name: 'season.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ kind: 'run', schemaVersion: 1, run, cursor: run.events.length })) });
    await expect(page.locator('.results')).toBeVisible();
    await page.getByRole('button', { name: 'Season archive' }).click();
    await expect(page.locator('.season-card')).toHaveCount(run === fixtureRun ? 1 : 2);
    if (run === fixtureRun) await page.getByRole('button', { name: 'The cast', exact: true }).click();
  }
  const table = page.getByRole('table');
  await expect(table.getByRole('rowheader', { name: 'Returning Alex', exact: true })).toBeVisible();
  await expect(table.getByRole('row').filter({ hasText: 'Returning Alex' }).getByRole('cell').nth(2)).toHaveText('2');
  await page.getByLabel('Stats scope', { exact: true }).selectOption(fixtureRun.id);
  await expect(table.getByRole('rowheader', { name: 'Alex', exact: true })).toBeVisible();
  await expect(table.getByRole('row').filter({ hasText: 'Alex' }).getByRole('cell').nth(2)).toHaveText('1');
  await page.getByLabel('Stats scope', { exact: true }).selectOption('all');
  await page.getByLabel('Find a character', { exact: true }).fill('Riley');
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Find a character', { exact: true }).fill('');
  await page.getByLabel('Rank by', { exact: true }).selectOption('bestFinish');
  await expect(table.locator('thead th[aria-sort=ascending]')).toHaveText('Best finish ↑');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath(`stats-${width}.png`), fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: 'Season archive' }).click();
  await expect(table.getByRole('rowheader', { name: 'Returning Alex', exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Delete season ${second.input.cast.title}`, exact: true }).click();
  await page.getByRole('button', { name: `Confirm deletion of season ${second.input.cast.title}`, exact: true }).click();
  await expect(table.getByRole('rowheader', { name: 'Alex', exact: true })).toBeVisible();
  await expect(table.getByRole('row').filter({ hasText: 'Alex' }).getByRole('cell').nth(2)).toHaveText('1');
});
