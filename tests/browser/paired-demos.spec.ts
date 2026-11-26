import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('paired demos checkpoint, resume and export the same seeds for both settings', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  const open = async () => {
    await page.getByRole('button', { name: 'Demo statistics', exact: true }).click();
    await page.getByRole('button', { name: 'Paired demos', exact: true }).click();
  };
  await open();
  await page.getByLabel('Experiment seed', { exact: true }).fill('paired-browser');
  await page.getByLabel('Pairs', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Run paired demos' }).click();
  const status = page.getByRole('status', { name: 'Paired demo status' });
  await expect(status).toHaveText(/[1-7] \/ 8 pairs complete/, { timeout: 30_000 });
  await page.getByRole('button', { name: 'Stop experiment' }).click();
  const stopped = await status.innerText();
  await expect(page.getByRole('button', { name: 'Continue experiment' })).toBeEnabled();
  await page.reload();
  await open();
  await expect(status).toHaveText(stopped);
  await page.getByRole('button', { name: 'Continue experiment' }).click();
  await expect(status).toHaveText('8 / 8 pairs complete', { timeout: 45_000 });
  const exportPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export paired JSON' }).click();
  const report = JSON.parse(await readFile((await (await exportPromise).path())!, 'utf8'));
  expect(report.seeds).toEqual(Array.from({ length: 8 }, (_, i) => `paired-browser-${i}`));
  expect(report.experiment.settings.danger).toBe('normal');
  expect(report.experiment.comparison).toBe('high');
  expect(report.experiment.pairs).toHaveLength(8);
});
