import { test, expect } from '@playwright/test';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';
import { phaseEndCursor } from '../../src/ui/playback';

const run = generateRun({
  cast: { version: 1, title: 'Live relationships', relationships: [], players: Array.from({ length: 24 }, (_, i) => ({ id: `p${i}`, name: `Tribute ${i}`, traits: [] })) },
  content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed: 'podium-preview-2026' }, lore: { facts: [] },
}, narrativeAdapter);
const changed = run.events.findIndex(e => e.state.relationships.some(r => r.trust !== 0 || r.grudge !== 0));
const cursor = phaseEndCursor(run, changed);

for (const width of [1280, 390]) test(`game relationship modal is read-only, revealed-only and accessible at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await expect(page.getByLabel('Season title', { exact: true })).toBeVisible();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'relationships.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ kind: 'run', schemaVersion: 1, run, cursor: 0 })) });
  const trigger = page.getByRole('button', { name: 'Relationship network', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Relationship network', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Before the bloodbath');
  await expect(dialog.locator('.network-node')).toHaveCount(24);
  await expect(dialog.locator('.network-node.eliminated')).toHaveCount(0);
  await dialog.locator('.network-node').nth(0).click();
  await dialog.locator('.network-node').nth(1).click();
  await expect(dialog.locator('.network-status-readout')).toHaveText(['Neutral · Trust 0 · Grudge 0', 'Neutral · Trust 0 · Grudge 0']);
  await expect(dialog.locator('.network-status-options button')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: /Edit character/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', '0');

  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ kind: 'run', schemaVersion: 1, run, cursor })) });
  await trigger.click();
  const state = run.events[cursor - 1].state;
  const edge = state.relationships.find(r => r.trust !== 0 || r.grudge !== 0)!;
  const from = run.input.cast.players.findIndex(p => p.id === edge.from);
  const to = run.input.cast.players.findIndex(p => p.id === edge.to);
  await dialog.locator('.network-node').nth(from).click();
  await dialog.locator('.network-node').nth(to).click();
  const reverse = state.relationships.find(r => r.from === edge.to && r.to === edge.from);
  const label = (r?: typeof edge) => `${r && r.grudge >= 40 ? 'Rival' : r && r.trust >= 40 ? 'Trusted' : 'Neutral'} · Trust ${r?.trust ?? 0} · Grudge ${r?.grudge ?? 0}`;
  await expect(dialog.locator('.network-status-readout')).toHaveText([label(edge), label(reverse)]);
  await expect(dialog.locator('.network-node.eliminated')).toHaveCount(state.players.filter(p => !p.alive).length);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.screenshot({ path: test.info().outputPath(`game-relationships-${width}.png`), fullPage: true });
  await dialog.getByRole('button', { name: 'Close relationship network', exact: true }).click();
  await expect(trigger).toBeFocused();
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', String(cursor));

  await page.getByRole('button', { name: 'Presentation mode', exact: true }).click();
  await page.getByRole('button', { name: '▷ Autoplay' }).click();
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '▷ Autoplay' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Exit presentation', exact: true })).toBeVisible();
});
