import { test, expect, type Page, type Download } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { exampleCast, fixtureRun } from '../fixtures';

async function open(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /^Your cast \d+ \/ 48$/ })).toBeVisible();
}
async function upload(page: Page, value: unknown) {
  await page.locator('input[type=file]').first().setInputFiles({ name: 'import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
}
async function readExport(download: Download) {
  const path = await download.path();
  if (!path) throw new Error('Download is missing');
  return readFile(path, 'utf8');
}
async function castExport(page: Page) {
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export cast', exact: true }).click();
  return JSON.parse(await readExport(await pending));
}
async function startSample(page: Page, title = 'First broadcast', seed = 'browser-tests') {
  await page.getByRole('button', { name: 'Use a sample cast' }).click();
  await page.getByLabel('Season title', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'Game settings' }).click();
  await page.getByLabel('Game seed', { exact: true }).fill(seed);
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.locator('.event-meta')).toContainText('0 REVEALED');
  await expect(page.locator('footer')).toContainText('Progress saved · 0 events revealed');
}
async function writeMeta(page: Page, key: string, value: unknown) {
  await page.evaluate(async ({ key, value }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('games-of-hunger-v1', 1); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try {
      const tx = db.transaction('meta', 'readwrite'); tx.objectStore('meta').put(value, key);
      await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); });
    } finally { db.close(); }
  }, { key, value });
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`character modal preserves the cast layout and supports keyboard editing at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await open(page);
    await page.getByRole('button', { name: 'Load Season 2 cast', exact: true }).click();
    const edit = page.getByRole('button', { name: /^Edit .+, cast entry 24$/ });
    await edit.scrollIntoViewIfNeeded();
    await edit.focus();
    const before = await page.evaluate(() => ({ scroll: window.scrollY, height: document.documentElement.scrollHeight }));
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(/^Edit /);
    await expect(dialog.getByLabel('Name', { exact: true })).toBeFocused();
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(before.height);
    expect(await page.evaluate(() => window.scrollY)).toBe(before.scroll);
    await page.mouse.move(5, 5);
    await page.mouse.wheel(0, 600);
    expect(await page.evaluate(() => window.scrollY)).toBe(before.scroll);
    await dialog.getByRole('button', { name: 'Done', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Close character editor' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', { name: 'Done', exact: true })).toBeFocused();
    await dialog.getByLabel('Name', { exact: true }).fill('Updated character');
    await dialog.locator('button.network-node').last().click();
    await dialog.getByRole('button', { name: /toward .+: Trusted$/ }).click();
    await expect(dialog.getByRole('button', { name: 'Done', exact: true })).toBeInViewport();
    await page.screenshot({ path: test.info().outputPath(`character-modal-${viewport.width}.png`) });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(edit).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(before.scroll);
    await edit.click();
    await expect(dialog.getByLabel('Name', { exact: true })).toHaveValue('Updated character');
    await dialog.locator('button.network-node').last().click();
    await expect(dialog.getByRole('button', { name: /toward .+: Trusted$/ })).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByRole('button', { name: 'Done', exact: true }).click();
    await edit.click();
    await page.mouse.click(5, 5);
    await expect(dialog).toHaveCount(0);
    await edit.click();
    await dialog.getByRole('button', { name: 'Close character editor' }).click();
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
}

test('reload restores incomplete draft fields, customization, relationships, pasted names and settings', async ({ page }) => {
  await open(page); await upload(page, exampleCast);
  await page.getByRole('button', { name: 'Game settings' }).click();
  await page.getByLabel('Game seed', { exact: true }).fill('');
  await page.getByLabel('Danger', { exact: true }).selectOption('high');
  await page.getByRole('button', { name: 'Back to cast' }).click();
  await page.getByRole('button', { name: 'Edit Alex, cast entry 1', exact: true }).click();
  await page.getByLabel('sneaky', { exact: true }).check();
  await page.getByRole('button', { name: 'Select Riley, cast entry 2', exact: true }).click();
  await page.getByRole('button', { name: 'Alex toward Riley: Trusted', exact: true }).click();
  await page.getByLabel('Portrait', { exact: true }).selectOption('/assets/fern.svg');
  await page.getByLabel('Name', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByLabel('Season title', { exact: true }).fill('');
  await page.getByLabel('Names, one per line', { exact: true }).fill('Still waiting\nAnother name');
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByLabel('Season title', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Names, one per line', { exact: true })).toHaveValue('Still waiting\nAnother name');
  await page.getByRole('button', { name: 'Edit character, cast entry 1', exact: true }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('sneaky', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Portrait', { exact: true })).toHaveValue('/assets/fern.svg');
  await page.getByRole('button', { name: 'Select Riley, cast entry 2', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unnamed player toward Riley: Trusted', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Name', { exact: true }).fill('Alex');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByLabel('Season title', { exact: true }).fill('Restored draft');
  await page.getByRole('button', { name: 'Game settings' }).click();
  await expect(page.getByLabel('Game seed', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Danger', { exact: true })).toHaveValue('high');
});

test('named cast slots can be saved, selected, updated and deleted independently', async ({ page }) => {
  await open(page); await upload(page, exampleCast);
  await page.getByLabel('Season title', { exact: true }).fill('Camp A');
  await page.getByRole('button', { name: 'Save cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(2);
  await page.getByLabel('Season title', { exact: true }).fill('Camp B');
  await page.getByRole('button', { name: 'Save as new cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(3);
  await page.getByLabel('Season title', { exact: true }).fill('Camp B revised');
  await page.getByRole('button', { name: 'Save cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true })).toContainText('Camp B revised');
  await page.getByLabel('Saved casts', { exact: true }).selectOption({ label: 'Camp A · 2 players' });
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue('Camp A');
  expect((await castExport(page)).cast.players).toEqual(exampleCast.players);
  await page.screenshot({ path: test.info().outputPath('workspace-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Delete saved cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(2);
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue('Camp A');
  await page.reload(); await expect(page.getByLabel('Season title', { exact: true })).toHaveValue('Camp A');
});

test('undo survives reload and restores removed relationships without discarding later edits', async ({ page }) => {
  await open(page);
  const cast = { ...exampleCast, players: [...exampleCast.players, { id: 'sam', name: 'Sam', traits: [] }], relationships: [{ from: 'alex', to: 'riley', trust: 60, grudge: 0 }, { from: 'riley', to: 'alex', trust: -50, grudge: 60 }] };
  await upload(page, cast);
  await page.getByRole('button', { name: 'Remove Alex', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Riley, cast entry 1', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Renamed Riley');
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Undo removal (1)', exact: true }).click();
  const restored = (await castExport(page)).cast;
  expect(restored.players[0]).toEqual(exampleCast.players[0]);
  expect(restored.players[1].name).toBe('Renamed Riley');
  expect(restored.relationships).toEqual(cast.relationships);
});

test('multiple unfinished broadcasts retain their own cursors without replacing the editor draft', async ({ page }) => {
  await open(page); await startSample(page);
  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(page.locator('footer')).toContainText('Progress saved · 1 events revealed');
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await page.getByLabel('Season title', { exact: true }).fill('Second broadcast');
  await page.getByRole('button', { name: 'Game settings' }).click();
  await page.getByLabel('Game seed', { exact: true }).fill('second-browser-seed');
  await page.getByRole('button', { name: 'Start game' }).click();
  await page.getByRole('button', { name: 'Next event' }).click();
  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(page.locator('footer')).toContainText('Progress saved · 2 events revealed');
  await page.reload();
  const list = page.getByRole('region', { name: 'Unfinished games', exact: true });
  await expect(list.getByRole('button')).toHaveCount(2);
  await list.getByRole('button', { name: 'Resume First broadcast' }).click();
  await expect(page.locator('.event-meta')).toContainText('1 REVEALED');
  await expect(page.locator('.results')).toHaveCount(0);
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue('Second broadcast');
  await list.getByRole('button', { name: 'Resume Second broadcast' }).click();
  await expect(page.locator('.event-meta')).toContainText('2 REVEALED');
});

test('autoplay pauses on Escape and navigation, phase reveals finish the actual game', async ({ page }) => {
  await open(page); await startSample(page);
  await page.clock.install();
  await page.getByLabel('Autoplay pace', { exact: true }).selectOption('1000');
  await page.getByRole('button', { name: 'Autoplay' }).click();
  await page.clock.fastForward(1100);
  await expect(page.locator('.event-meta')).toContainText('1 REVEALED');
  await page.keyboard.press('Escape');
  await page.clock.fastForward(10_000);
  await expect(page.locator('.event-meta')).toContainText('1 REVEALED');
  await page.getByRole('button', { name: 'Presentation mode' }).click();
  await expect(page.locator('.app')).toHaveClass(/presentation/);
  await page.keyboard.press('Escape'); await expect(page.locator('.app')).not.toHaveClass(/presentation/);
  await page.getByRole('button', { name: 'Autoplay' }).click();
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await page.clock.fastForward(10_000);
  await page.getByRole('button', { name: 'The arena', exact: true }).click();
  await expect(page.locator('.event-meta')).toContainText('1 REVEALED');
  await expect(page.getByRole('button', { name: 'Autoplay' })).toHaveAttribute('aria-pressed', 'false');
  let phases = 0;
  while (await page.getByRole('button', { name: 'Reveal phase', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'Reveal phase', exact: true }).click();
    expect(++phases).toBeLessThan(100);
  }
  await expect(page.locator('.results')).toBeVisible();
  await expect(page.locator('.results .placements li')).toHaveCount(8);
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await expect(page.locator('.season-card')).toHaveCount(1);
});

test('imports validate safely, keyboard reveals unlock confessionals in history and recap exports', async ({ page }) => {
  await open(page); await upload(page, exampleCast);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(page.getByRole('alert')).toContainText('not valid JSON');
  expect((await castExport(page)).cast).toEqual(exampleCast);
  await upload(page, { kind: 'run', schemaVersion: 1, run: fixtureRun, cursor: 0 });
  await expect(page.locator('.results')).toHaveCount(0);
  await expect(page.getByText(fixtureRun.events[0].confessional!.text, { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next event' }).focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.results')).toBeVisible();
  await page.locator('.revealed-log > summary').click();
  await expect(page.locator('.revealed-log')).toContainText('Exit interview / Riley');
  await expect(page.locator('.revealed-log')).toContainText(fixtureRun.events[0].confessional!.text);
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export recap', exact: true }).click();
  expect(await readExport(await pending)).toContain('Exit interview / Riley: Riley insists the beacon was in the wrong place.');
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await page.getByLabel('Season title', { exact: true }).fill('Keep this draft');
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await page.getByRole('button', { name: 'Revisit season' }).click();
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue('Keep this draft');
});

test('a quota failure keeps the replay playable and retry restores progress saving', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(value: unknown, key?: IDBValidKey) {
      if (this.name === 'meta' && key === 'playback') { IDBObjectStore.prototype.put = original; throw new DOMException('Simulated full storage', 'QuotaExceededError'); }
      return original.call(this, value, key);
    };
  });
  await upload(page, { kind: 'run', schemaVersion: 1, run: fixtureRun, cursor: 0 });
  await expect(page.getByRole('alert')).toContainText('Browser storage is full');
  await expect(page.getByRole('button', { name: 'Export full replay' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry saving progress', exact: true }).click();
  await expect(page.locator('footer')).toContainText('Progress saved · 0 events revealed');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.reload(); await page.getByRole('button', { name: 'Resume game' }).click();
  await expect(page.locator('.event-meta')).toContainText('0 REVEALED');
});

test('a corrupt playback does not prevent healthy cast and archive recovery', async ({ page }) => {
  await open(page); await upload(page, exampleCast);
  await page.getByRole('button', { name: 'Save cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(2);
  await upload(page, { kind: 'run', schemaVersion: 1, run: fixtureRun, cursor: 1 });
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await expect(page.locator('.season-card')).toHaveCount(1);
  await writeMeta(page, 'playback', { runId: fixtureRun.id, cursor: -1, revision: 1, updatedAt: new Date().toISOString() });
  await page.reload(); await expect(page.getByRole('alert')).toContainText('Could not load saved progress');
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue(exampleCast.title);
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(2);
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await expect(page.locator('.season-card')).toHaveCount(1);
});

test('a conflict from another tab can load saved progress and continue safely', async ({ page, context }) => {
  await open(page); await startSample(page);
  const other = await context.newPage(); await open(other);
  await other.getByRole('button', { name: 'Resume game' }).click();
  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(page.locator('footer')).toContainText('Progress saved · 1 events revealed');
  await other.getByRole('button', { name: 'Next event' }).click();
  await expect(other.getByRole('alert')).toContainText('Another page changed this saved game');
  await other.getByRole('button', { name: 'Load saved progress', exact: true }).click();
  await expect(other.locator('.event-meta')).toContainText('1 REVEALED');
  await expect(other.getByRole('alert')).toHaveCount(0);
  await other.getByRole('button', { name: 'Next event' }).click();
  await expect(other.locator('footer')).toContainText('Progress saved · 2 events revealed');
});

test('an unreadable draft is preserved while healthy named casts remain usable', async ({ page }) => {
  await open(page); await upload(page, exampleCast);
  await page.getByRole('button', { name: 'Save cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(2);
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await writeMeta(page, 'editor-draft', { version: 9, futureData: 'Preserve this record' });
  await page.reload(); await expect(page.getByRole('alert')).toContainText('Could not load your cast draft');
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue(exampleCast.title);
  await page.getByLabel('Season title', { exact: true }).fill('Healthy cast still editable');
  await expect(page.getByText('Existing draft could not be read. It has been preserved.', { exact: true })).toBeVisible();
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('games-of-hunger-v1', 1); request.onsuccess = () => resolve(request.result); });
    try { return await new Promise(resolve => { const request = db.transaction('meta').objectStore('meta').get('editor-draft'); request.onsuccess = () => resolve(request.result); }); }
    finally { db.close(); }
  });
  expect(stored).toEqual({ version: 9, futureData: 'Preserve this record' });
});

test('portrait cleanup removes replaced uploads through the interface', async ({ page }) => {
  await open(page); await upload(page, exampleCast);
  await page.getByRole('button', { name: 'Edit Alex, cast entry 1', exact: true }).click();
  await page.locator('input[accept="image/png,image/jpeg,image/webp"]').setInputFiles({ name: 'portrait.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6GQAAAAASUVORK5CYII=', 'base64') });
  await expect(page.locator('.editor')).toBeVisible();
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  const portraitId = (await castExport(page)).cast.players[0].portrait.slice(6);
  await page.getByRole('button', { name: 'Edit Alex, cast entry 1', exact: true }).click();
  await page.getByLabel('Portrait', { exact: true }).selectOption('/assets/fern.svg');
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await writeMeta(page, `portrait-created:${portraitId}`, 0);
  await page.getByRole('button', { name: 'Free unused portrait space', exact: true }).click();
  await expect(page.locator('footer')).toContainText('1 unused portrait removed');
  expect((await castExport(page)).cast.players[0].portrait).toBe('/assets/fern.svg');
});

test('the file picker accepts a valid replay larger than 30 MB', async ({ page }) => {
  await open(page);
  const run = structuredClone(fixtureRun); run.recap = ['x'.repeat(30_000_001)];
  await upload(page, { kind: 'run', schemaVersion: 1, run, cursor: 0 });
  await expect(page.locator('.event-meta')).toContainText('0 REVEALED');
  await expect(page.locator('footer')).toContainText('Progress saved · 0 events revealed');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('unused uploaded portraits are also reclaimed automatically after a quiet minute', async ({ page }) => {
  await open(page); await page.clock.install(); await upload(page, exampleCast);
  await page.getByRole('button', { name: 'Edit Alex, cast entry 1', exact: true }).click();
  await page.locator('input[accept="image/png,image/jpeg,image/webp"]').setInputFiles({ name: 'portrait.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6GQAAAAASUVORK5CYII=', 'base64') });
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  expect((await castExport(page)).cast.players[0].portrait).toMatch(/^asset:/);
  await page.getByRole('button', { name: 'Edit Alex, cast entry 1', exact: true }).click();
  await page.getByLabel('Portrait', { exact: true }).selectOption('/assets/fern.svg');
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.clock.fastForward(61_001);
  await expect.poll(async () => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('games-of-hunger-v1', 1); request.onsuccess = () => resolve(request.result); });
    try { return await new Promise<number>(resolve => { const request = db.transaction('portraits').objectStore('portraits').count(); request.onsuccess = () => resolve(request.result); }); }
    finally { db.close(); }
  })).toBe(0);
});

test('new workspace controls fit a mobile viewport and support keyboard selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page); await upload(page, exampleCast);
  await page.getByRole('button', { name: 'Save cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(2);
  await page.getByRole('button', { name: 'New cast', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Use a sample cast' })).toBeVisible();
  await page.getByLabel('Saved casts', { exact: true }).selectOption({ label: `${exampleCast.title} · 2 players` });
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue(exampleCast.title);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('workspace-mobile.png'), fullPage: true });
});
