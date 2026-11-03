import { test, expect, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';

const run = generateRun({
  cast: { version: 1, title: 'The Legionairre Games', relationships: [], players: ['Joshi', 'Emma', 'Tobi', 'Rowan', 'Cleo', 'Jules', 'Sage', 'Kit'].map((name, i) => ({ id: `p${i}`, name, traits: [], portrait: i === 0 ? '/assets/fern.svg' : undefined })) },
  settings: { ...DEFAULT_SETTINGS, seed: 'png-export' }, content: defaultContentPack, lore: { facts: [] },
}, narrativeAdapter);

async function openScene(page: Page) {
  await page.goto('/');
  await expect(page.getByLabel('Season title', { exact: true })).toBeVisible();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'scene.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ kind: 'run', schemaVersion: 1, run, cursor: 0 })) });
  await expect(page.getByRole('button', { name: 'Copy scene as PNG' })).toHaveCount(0);
  await page.locator('.playback button.primary').click();
  await expect(page.locator('.phase-event').first()).toBeVisible();
}

for (const width of [1280, 390]) test(`copies a complete PNG to the real clipboard at ${width}px`, async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width, height: 900 });
  await openScene(page);
  await page.getByRole('button', { name: 'Copy scene as PNG' }).click();
  await expect(page.getByText('PNG copied! Paste it into Discord or any chat.')).toBeVisible();
  const png = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    const blob = await items[0].getType('image/png');
    const bitmap = await createImageBitmap(blob);
    return { bytes: Array.from(new Uint8Array(await blob.arrayBuffer())), width: bitmap.width, height: bitmap.height };
  });
  const bounds = await page.locator('.phase-report').boundingBox();
  expect(png.width).toBeGreaterThanOrEqual(Math.floor(bounds!.width * 2) - 2);
  expect(png.height).toBeGreaterThanOrEqual(Math.floor(bounds!.height * 2) - 2);
  expect(png.bytes.slice(0, 8)).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  await writeFile(test.info().outputPath(`scene-export-${width}.png`), Buffer.from(png.bytes));
  await page.screenshot({ path: test.info().outputPath(`scene-button-${width}.png`), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

test('offers the same PNG as a download when clipboard access is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, 'write', { value: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) });
  });
  await openScene(page);
  await page.getByRole('button', { name: 'Copy scene as PNG' }).click();
  await expect(page.getByText('Clipboard access is unavailable. Download the PNG to share it.')).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PNG' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('The Legionairre Games - Bloodbath.png');
  expect(await download.failure()).toBeNull();
});
