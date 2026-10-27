import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const width of [1280, 390]) test(`personality choices persist without contradictory loyalty at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await page.getByLabel('Names, one per line', { exact: true }).fill('Rowan\nCleo');
  await page.getByRole('button', { name: 'Add to cast', exact: true }).click();
  await page.locator('.cast-person').first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('checkbox', { name: 'Loyal', exact: true }).check();
  await dialog.getByRole('checkbox', { name: 'Disloyal', exact: true }).check();
  await expect(dialog.getByRole('checkbox', { name: 'Loyal', exact: true })).not.toBeChecked();
  for (const name of ['Love and Hate', 'Grudge', 'Agile', 'Weak Constitution', 'Perceptive']) await dialog.getByRole('checkbox', { name, exact: true }).check();
  await expect(dialog.getByRole('status', { name: 'Positive trait count' })).toHaveText('2 / 2');
  for (const name of ['Loyal', 'Sneaky', 'Cautious', 'Resourceful']) await expect(dialog.getByRole('checkbox', { name, exact: true })).toBeDisabled();
  await dialog.getByRole('checkbox', { name: 'Perceptive', exact: true }).uncheck();
  await expect(dialog.getByRole('checkbox', { name: 'Sneaky', exact: true })).toBeEnabled();
  await dialog.getByRole('checkbox', { name: 'Perceptive', exact: true }).check();
  await expect(dialog.locator('.trait-descriptions')).toContainText('decided by the game seed');
  await expect(dialog.locator('.trait-descriptions')).toContainText('mutual ally');
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await dialog.locator('fieldset').screenshot({ path: test.info().outputPath(`traits-${width}.png`) });
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('.cast-card').first()).toContainText('Weak Constitution');
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.reload();
  await page.locator('.cast-person').first().click();
  for (const name of ['Disloyal', 'Love and Hate', 'Grudge', 'Agile', 'Weak Constitution', 'Perceptive']) await expect(page.getByRole('dialog').getByRole('checkbox', { name, exact: true })).toBeChecked();
  await page.getByRole('dialog').getByRole('checkbox', { name: 'Agile', exact: true }).uncheck();
  await page.getByRole('dialog').getByRole('checkbox', { name: 'Loyal', exact: true }).check();
  await expect(page.getByRole('dialog').getByRole('checkbox', { name: 'Disloyal', exact: true })).not.toBeChecked();
  await page.getByRole('dialog').getByRole('button', { name: 'Done', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cast', exact: true }).click();
  const path = await (await downloaded).path();
  const exported = JSON.parse(await readFile(path!, 'utf8'));
  expect(exported.cast.players[0].traits).toEqual(expect.arrayContaining(['loyal', 'love-hate', 'grudge', 'weak-constitution', 'perceptive']));
  expect(exported.cast.players[0].traits).not.toContain('disloyal');
  expect(exported.cast.players[0].traits).not.toContain('agile');
});

test('an older saved cast with three positive traits stays editable and must be repaired before a new game', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Use a sample cast' })).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('games-of-hunger-v1', 1); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      const tx = db.transaction('casts', 'readwrite');
      tx.objectStore('casts').put({ version: 1, title: 'Older positive traits', players: [{ id: 'a', name: 'Rowan', traits: ['agile', 'perceptive', 'resourceful'] }, { id: 'b', name: 'Cleo', traits: [] }], relationships: [] }, 'older-positive');
      await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    } finally { db.close(); }
  });
  await page.reload();
  await page.getByLabel('Saved casts', { exact: true }).selectOption('older-positive');
  await expect(page.getByRole('button', { name: 'Game settings' })).toBeDisabled();
  await page.locator('.cast-person').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('status', { name: 'Positive trait count' })).toHaveText('3 / 2');
  await expect(dialog.getByRole('alert')).toContainText('Remove 1 before starting a new game');
  for (const name of ['Agile', 'Perceptive', 'Resourceful']) await expect(dialog.getByRole('checkbox', { name, exact: true })).toBeChecked();
  await dialog.getByRole('checkbox', { name: 'Resourceful', exact: true }).uncheck();
  await expect(dialog.getByRole('status', { name: 'Positive trait count' })).toHaveText('2 / 2');
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Game settings' })).toBeEnabled();
  await page.getByRole('button', { name: 'Save cast', exact: true }).click();
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Game settings' })).toBeEnabled();
  await page.locator('.cast-person').first().click();
  await expect(page.getByRole('dialog').getByRole('status', { name: 'Positive trait count' })).toHaveText('2 / 2');
});
