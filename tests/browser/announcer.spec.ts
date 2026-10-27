import { test, expect } from '@playwright/test';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';
import { phaseEndCursor, phaseReport } from '../../src/ui/playback';

const run = generateRun({
  cast: { version: 1, title: 'The Evening Programme', relationships: [], players: Array.from({ length: 48 }, (_, i) => ({ id: `p${i}`, name: `Guest ${i}`, traits: [] })) },
  settings: { ...DEFAULT_SETTINGS, seed: 'arena-63' }, content: defaultContentPack, lore: { facts: [] },
}, narrativeAdapter);
const warningIndex = run.events.findIndex(e => e.effects.some(f => f.kind === 'biomeStatus' && f.status.endsWith('warning')));

for (const width of [1280, 390]) test(`announcer warnings are readable, saved and spoiler-safe at ${width}px`, async ({ page }) => {
  expect(warningIndex).toBeGreaterThan(0);
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await expect(page.getByLabel('Season title', { exact: true })).toBeVisible();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'announcer.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ kind: 'run', schemaVersion: 1, run, cursor: warningIndex })) });
  await expect(page.locator('.arena-announcement')).toHaveCount(0);
  await page.locator('.playback button.primary').click();
  const cursor = phaseEndCursor(run, warningIndex);
  const announcements = phaseReport(run, cursor).events.filter(e => !Object.keys(e.bindings).length);
  await expect(page.locator('.arena-announcement')).toHaveCount(announcements.length);
  await expect(page.locator('.announcement-tag').first()).toHaveText('Arena broadcast');
  await expect(page.locator('.arena-announcement .event-portraits')).toHaveCount(0);
  await expect(page.locator('.arena-announcement blockquote')).toHaveCount(0);
  await expect(page.locator('.arena-announcement .phase-event-body>p')).toHaveText(announcements.map(e => e.text));
  const upcoming = run.events.slice(cursor).find(e => e.effects.some(f => f.kind === 'biomeStatus'));
  if (upcoming) await expect(page.locator('.phase-report')).not.toContainText(upcoming.text);
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', String(cursor));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.locator('.arena-announcement').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath(`announcer-${width}.png`), fullPage: true });
  await expect(page.locator('footer')).toContainText(`Progress saved · ${cursor} events revealed`);
  await page.reload();
  await page.getByRole('button', { name: 'Resume game' }).click();
  await expect(page.locator('.arena-announcement .phase-event-body>p')).toHaveText(announcements.map(e => e.text));
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', String(cursor));
});
