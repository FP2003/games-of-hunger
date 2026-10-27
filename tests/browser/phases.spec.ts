import { test, expect } from '@playwright/test';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';
import { phaseEndCursor, phaseReport } from '../../src/ui/playback';
import { phaseLabel } from '../../src/ui/recap';

const run = generateRun({
  cast: { version: 1, title: 'The Regional Games', relationships: [], players: Array.from({ length: 24 }, (_, i) => ({ id: `p${i}`, name: `Tribute ${i}`, traits: [] })) },
  settings: { ...DEFAULT_SETTINGS, seed: 'regional-0' }, content: defaultContentPack, lore: { facts: [] },
}, narrativeAdapter);

test('autoplay gives fallen tributes a separate step before revealing the next day', async ({ page }) => {
  const cursor = run.events.findIndex((e, i) => e.phase.kind === 'night' && run.events[i + 1]?.phase.kind !== 'night') + 1;
  await page.goto('/');
  await expect(page.getByLabel('Season title', { exact: true })).toBeVisible();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'night.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ kind: 'run', schemaVersion: 1, run, cursor })) });
  await expect(page.locator('.phase-heading h1')).toHaveText('Night 1');
  await page.clock.install();
  await page.getByLabel('Autoplay pace', { exact: true }).selectOption('1000');
  await page.getByRole('button', { name: 'Autoplay' }).click();
  await page.clock.fastForward(1100);
  await expect(page.locator('.phase-heading h1')).toHaveText('Fallen tributes');
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', String(cursor));
  await page.keyboard.press('Escape');
  await page.clock.fastForward(10_000);
  await expect(page.locator('.phase-heading h1')).toHaveText('Fallen tributes');
  await page.getByRole('button', { name: 'Autoplay' }).click();
  await page.clock.fastForward(1100);
  await expect(page.locator('.phase-heading h1')).toHaveText('Day 2');
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', String(phaseEndCursor(run, cursor)));
});

for (const width of [1280, 390]) test(`whole phases, regions, gifts and roll calls at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await expect(page.getByLabel('Season title', { exact: true })).toBeVisible();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'regional.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ kind: 'run', schemaVersion: 1, run, cursor: 0 })) });
  await expect(page.locator('.phase-event')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next event' })).toHaveCount(0);
  let cursor = 0;
  let sawNight = false;
  let sawGift = false;
  while (cursor < run.events.length) {
    const next = phaseEndCursor(run, cursor);
    await page.locator('.playback button.primary').click();
    cursor = next;
    const report = phaseReport(run, cursor);
    const phase = report.events[0].phase;
    await expect(page.locator('.phase-heading h1')).toHaveText(phaseLabel(phase));
    if (phase.kind === 'finale') await expect(page.locator('.phase-heading')).toContainText(`Day ${phase.day}`);
    await expect(page.locator('.phase-heading')).toBeInViewport();
    await expect(page.locator('.phase-event')).toHaveCount(report.events.length);
    await expect(page.locator('.phase-event .character-name').first()).toBeVisible();
    await expect(page.locator('.region-roster article')).toHaveCount(run.events[cursor - 1].state.players.filter(p => p.alive).length);
    for (const region of defaultContentPack.biomes) {
      const regionalEvents = report.events.filter(e => e.biome === region.id);
      if (regionalEvents.length) await expect(page.getByRole('region', { name: `${region.name} events`, exact: true }).locator('.phase-event')).toHaveCount(regionalEvents.length);
    }
    await expect(page.getByRole('region', { name: 'Fallen tributes', exact: true })).toHaveCount(0);
    if (phase.kind === 'night') sawNight = true;
    if (report.events.some(e => e.templateId.startsWith('sponsor-'))) {
      sawGift = true;
      await expect(page.locator('.gift-tag').first()).toHaveText('Sponsor gift ↓');
    }
    if (phase.index <= 2) await page.screenshot({ path: test.info().outputPath(`phase-${phase.kind}-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (report.showFallen) {
      await page.getByRole('button', { name: 'Continue to Fallen tributes' }).click();
      await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', String(cursor));
      await expect(page.locator('.phase-report')).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Fallen tributes', exact: true })).toBeVisible();
      await expect(page.locator('.fallen-grid strong')).toHaveText(report.fallenIds.map(id => run.input.cast.players.find(p => p.id === id)!.name));
      if (phase.kind === 'night' && phase.day === 1) {
        await page.screenshot({ path: test.info().outputPath(`fallen-${width}.png`), fullPage: true });
        await page.getByRole('button', { name: 'Back to Night 1', exact: true }).click();
        await expect(page.locator('.phase-heading h1')).toHaveText('Night 1');
        await page.getByRole('button', { name: 'Continue to Fallen tributes' }).click();
        await expect(page.locator('footer')).toContainText(`Progress saved · ${cursor} events revealed`);
        await page.reload();
        await page.getByRole('button', { name: 'Resume game' }).click();
        await expect(page.locator('.phase-heading h1')).toHaveText('Fallen tributes');
        await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', String(cursor));
      }
    }
  }
  expect(sawNight).toBe(true);
  expect(sawGift).toBe(true);
  await page.getByRole('button', { name: 'View results' }).click();
  await expect(page.locator('.results')).toBeVisible();
});
