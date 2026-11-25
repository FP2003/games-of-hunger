import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, type RunInput } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { applyCompletedRun, selectLoreContext } from '../../src/lore';
import { narrativeAdapter } from '../../src/narrative';

const cast: RunInput['cast'] = { version: 1, title: 'Returning friends', relationships: [], players: Array.from({ length: 12 }, (_, i) => ({ id: `friend-${i}`, name: `Friend ${i}`, traits: i % 3 === 0 ? ['disloyal'] : i % 3 === 1 ? ['grudge'] : ['medic'] })) };
const input: RunInput = { cast, settings: { ...DEFAULT_SETTINGS, seed: 'past-season-normal-0' }, content: defaultContentPack, lore: { facts: [] } };
const first = generateRun(input, narrativeAdapter);
const history = applyCompletedRun({ version: 1, seasons: [] }, first);
const second = generateRun({ ...input, settings: { ...input.settings, seed: 'past-season-normal-1' }, lore: selectLoreContext(history, cast, defaultContentPack) }, narrativeAdapter);
const event = second.events.find(e => e.facts.some(f => f.type === 'lore'))!;

for (const width of [1280, 390]) test(`past-season callbacks remain visible in playback, reload and recap at ${width}px`, async ({ page }) => {
  expect(event).toBeDefined();
  const ref = event.facts.find(f => f.type === 'lore')!;
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await page.locator('input[type=file]').first().setInputFiles({ name: 'returning-season.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ kind: 'run', schemaVersion: 1, run: second, cursor: event.sequence + 1 })) });
  await expect(page.locator('.phase-report')).toContainText(event.text);
  await expect(page.locator('.phase-report')).not.toContainText(ref.sourceRunId!);
  await expect(page.locator('footer').getByRole('status')).toContainText(`Progress saved · ${event.sequence + 1} events revealed`);
  await page.reload();
  await page.getByRole('button', { name: 'Resume game', exact: false }).click();
  await expect(page.locator('.phase-report')).toContainText(event.text);
  let phases = 0;
  while (await page.locator('.playback button.primary').isVisible()) {
    await page.locator('.playback button.primary').click();
    expect(++phases).toBeLessThan(100);
  }
  await expect(page.locator('.results')).toBeVisible();
  await page.locator('.revealed-log > summary').click();
  await expect(page.locator('.revealed-log')).toContainText(event.text);
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export recap', exact: true }).click();
  const recap = await readFile((await (await exported).path())!, 'utf8');
  expect(recap).toContain(event.text);
  expect(recap).not.toContain(ref.sourceRunId!);
});
