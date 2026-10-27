import { test, expect, type Page, type Download } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { exampleCast, fixtureRun } from '../fixtures';
import season2Cast from '../../src/content/casts/season2.json' with { type: 'json' };
import { canonicalRunId } from '../../src/domain';

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
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', '0');
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

for (const width of [1280, 390]) test(`completed seasons hide the resume banner and can be deleted at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await open(page); await upload(page, exampleCast);
  await upload(page, { kind: 'run', schemaVersion: 1, run: fixtureRun, cursor: fixtureRun.events.length });
  await expect(page.locator('.results')).toBeVisible();
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await expect(page.locator('.season-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await expect(page.locator('.resume')).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue(exampleCast.title);
  await expect(page.locator('.resume')).toHaveCount(0);
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  const remove = page.getByRole('button', { name: `Delete season ${fixtureRun.input.cast.title}`, exact: true });
  await remove.click();
  await expect(page.getByText('Delete this season and its replay? This cannot be undone.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Cancel deletion of season ${fixtureRun.input.cast.title}`, exact: true }).click();
  await expect(page.locator('.season-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Revisit season', exact: false }).click();
  await expect(page.locator('.results')).toBeVisible();
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await remove.click();
  await page.getByRole('button', { name: `Confirm deletion of season ${fixtureRun.input.cast.title}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No completed seasons' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'The arena', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue(exampleCast.title);
  await expect(page.locator('.resume')).toHaveCount(0);
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await expect(page.locator('.season-card')).toHaveCount(0);
});

test('archive deletion preserves another unfinished game and can retry a storage failure', async ({ page }) => {
  await open(page);
  await upload(page, { kind: 'run', schemaVersion: 1, run: fixtureRun, cursor: fixtureRun.events.length });
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await expect(page.locator('.season-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  const second = structuredClone(fixtureRun);
  second.input.cast.title = 'Unfinished game to keep'; second.input.settings.seed = 'keep-after-archive-deletion'; second.id = canonicalRunId(second.input);
  await upload(page, { kind: 'run', schemaVersion: 1, run: second, cursor: 0 });
  await expect(page.locator('footer')).toContainText('Progress saved · 0 events revealed');
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await page.getByRole('button', { name: `Delete season ${fixtureRun.input.cast.title}`, exact: true }).click();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.delete;
    IDBObjectStore.prototype.delete = function(key: IDBValidKey | IDBKeyRange) {
      if (this.name === 'runs') { IDBObjectStore.prototype.delete = original; throw new DOMException('Simulated deletion failure', 'UnknownError'); }
      return original.call(this, key);
    };
  });
  const confirm = page.getByRole('button', { name: `Confirm deletion of season ${fixtureRun.input.cast.title}`, exact: true });
  await confirm.click();
  await expect(page.getByRole('alert')).toContainText('Could not delete this season');
  await expect(page.locator('.season-card')).toHaveCount(1);
  await confirm.click();
  await expect(page.getByRole('heading', { name: 'No completed seasons' })).toBeVisible();
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await expect(page.locator('.resume')).toContainText('Unfinished game to keep');
  await page.reload();
  await expect(page.locator('.resume')).toContainText('Unfinished game to keep');
  await page.getByRole('button', { name: 'Resume game', exact: false }).click();
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', '0');
});

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`cast chooser and player form work together at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await open(page);
    await expect(page.getByRole('button', { name: 'Load Season 2 cast' })).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('cast-empty.png'), fullPage: true });
    if (viewport.width === 1280) await page.screenshot({ path: test.info().outputPath('cast-controls.png'), clip: { x: 44, y: 470, width: 1192, height: 550 } });
    await page.getByText('Cast tools', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Free unused portrait space', exact: true })).toBeVisible();
    const tools = await page.locator('.cast-tools-menu').boundingBox();
    expect(tools!.x).toBeGreaterThanOrEqual(0);
    expect(tools!.x + tools!.width).toBeLessThanOrEqual(viewport.width);
    await page.getByText('Cast tools', { exact: true }).click();
    await page.getByLabel('Names, one per line', { exact: true }).fill('Rowan\nCleo');
    await page.getByRole('button', { name: 'Add to cast', exact: true }).click();
    await expect(page.locator('.cast-card')).toHaveCount(2);
    await expect(page.getByLabel('Names, one per line', { exact: true })).toHaveValue('');
    await page.getByRole('button', { name: 'Add a single character', exact: true }).click();
    await expect(page.locator('.cast-card')).toHaveCount(3);
    await page.getByLabel('Names, one per line', { exact: true }).fill('Pending name');
    await page.getByLabel('Saved casts', { exact: true }).selectOption('preset:season2');
    await expect(page.locator('.cast-card')).toHaveCount(24);
    await expect(page.getByLabel('Season title', { exact: true })).toHaveValue(season2Cast.title);
    await expect(page.getByLabel('Names, one per line', { exact: true })).toHaveValue('');
    expect((await castExport(page)).cast).toEqual(season2Cast);
    await page.getByRole('button', { name: 'Save cast', exact: true }).click();
    await expect(page.getByLabel('Saved casts', { exact: true })).toHaveValue(/.+/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath('cast-populated.png'), fullPage: true });
  });

  test(`dragging swaps slots within and between districts and saves assignments at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await open(page);
    const players = [...season2Cast.players];
    [players[3], players[4]] = [players[4], players[3]];
    await upload(page, { ...season2Cast, players });
    const district2 = page.getByRole('region', { name: 'District 2', exact: true });
    const district3 = page.getByRole('region', { name: 'District 3', exact: true });
    const card = (name: string) => page.locator('.cast-card').filter({ has: page.getByText(name, { exact: true }) });
    const grip = (name: string) => card(name).locator('.cast-drag-handle');
    await grip('Gulliver').dragTo(card('Akesel'));
    await expect(district2.locator('.cast-person strong')).toHaveText(['Joshi', 'Gulliver']);
    await expect(district3.locator('.cast-person strong')).toHaveText(['Akesel', 'Jokin']);
    await expect(district2.locator('.entry-number')).toHaveText(['03', '04']);
    await expect(district3.locator('.entry-number')).toHaveText(['05', '06']);
    await grip('Gulliver').dragTo(card('Akesel'));
    await expect(district2.locator('.cast-person strong')).toHaveText(['Joshi', 'Akesel']);
    await expect(district3.locator('.cast-person strong')).toHaveText(['Gulliver', 'Jokin']);
    await grip('Akesel').dragTo(card('Gulliver'));
    await expect(district2.locator('.cast-person strong')).toHaveText(['Joshi', 'Gulliver']);
    await expect(district3.locator('.cast-person strong')).toHaveText(['Akesel', 'Jokin']);
    await grip('Akesel').dragTo(card('Jokin'));
    await expect(district3.locator('.cast-person strong')).toHaveText(['Jokin', 'Akesel']);
    await expect(page.getByRole('button', { name: /^Move .+ (up|down)$/ })).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
    await page.reload();
    await expect(district2.locator('.cast-person strong')).toHaveText(['Joshi', 'Gulliver']);
    await expect(district3.locator('.cast-person strong')).toHaveText(['Jokin', 'Akesel']);
    const exported = await castExport(page);
    expect(exported.cast.players.find((player: { name: string }) => player.name === 'Gulliver').team).toBe('District 2');
    expect(exported.cast.players.find((player: { name: string }) => player.name === 'Akesel').team).toBe('District 3');
  });

  test(`character modal preserves the cast layout and supports keyboard editing at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await open(page);
    await page.getByLabel('Saved casts', { exact: true }).selectOption('preset:season2');
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

test('keyboard and click selection swap distant slots and Escape cancels', async ({ page }) => {
  await open(page);
  await page.getByLabel('Saved casts', { exact: true }).selectOption('preset:season2');
  const gulliver = page.getByRole('button', { name: 'Move Gulliver, slot 5', exact: true });
  await gulliver.focus();
  await page.keyboard.press('Space');
  await expect(gulliver).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Move Akesel, slot 4', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(gulliver).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('region', { name: 'District 3', exact: true }).locator('.cast-person strong')).toHaveText(['Gulliver', 'Jokin']);
  await gulliver.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('End');
  await expect(page.getByRole('button', { name: 'Move Hiro, slot 24', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('region', { name: 'District 12', exact: true }).locator('.cast-person strong')).toHaveText(['Fauna', 'Gulliver']);
  await expect(page.getByRole('region', { name: 'District 3', exact: true }).locator('.cast-person strong')).toHaveText(['Hiro', 'Jokin']);
  await expect(page.getByRole('button', { name: 'Move Gulliver, slot 24', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Move Gulliver, slot 24', exact: true }).click();
  await page.getByRole('button', { name: 'Swap Gulliver with Hiro, slot 5', exact: true }).click();
  await expect(page.getByRole('region', { name: 'District 3', exact: true }).locator('.cast-person strong')).toHaveText(['Gulliver', 'Jokin']);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('dragging scrolls the cast and cancelling or dropping outside leaves players unchanged', async ({ page }) => {
  await open(page);
  await page.getByLabel('Saved casts', { exact: true }).selectOption('preset:season2');
  const grip = page.getByRole('button', { name: 'Move Marcos, slot 1', exact: true });
  await grip.scrollIntoViewIfNeeded();
  const bounds = (await grip.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 10, bounds.y + bounds.height / 2, { steps: 3 });
  await expect(page.locator('.cast-drag-preview')).toBeVisible();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(bounds.x + bounds.width / 2, page.viewportSize()!.height - 5, { steps: 5 });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 100);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.locator('.cast-drag-preview')).toHaveCount(0);
  await grip.scrollIntoViewIfNeeded();
  await grip.hover();
  await page.mouse.down();
  await page.mouse.move(4, 400, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator('.cast-drag-preview')).toHaveCount(0);
  await expect(page.locator('.drop-target')).toHaveCount(0);
  expect((await castExport(page)).cast.players).toEqual(season2Cast.players);
  await page.getByRole('button', { name: 'Edit Marcos, cast entry 1', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('touch dragging swaps players across districts without opening the editor', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4179');
    await page.getByLabel('Saved casts', { exact: true }).selectOption('preset:season2');
    await page.getByRole('region', { name: 'District 1', exact: true }).scrollIntoViewIfNeeded();
    const source = (await page.getByRole('button', { name: 'Move Marcos, slot 1', exact: true }).boundingBox())!;
    const target = (await page.getByRole('region', { name: 'District 2', exact: true }).locator('.cast-card').last().boundingBox())!;
    const session = await context.newCDPSession(page);
    const from = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
    const to = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + (to.x - from.x) * step / 8, y: from.y + (to.y - from.y) * step / 8 }] });
    }
    await expect(page.locator('.cast-card.drop-target')).toContainText('Akesel');
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.getByRole('region', { name: 'District 1', exact: true }).locator('.cast-person strong')).toHaveText(['Akesel', 'Chaos']);
    await expect(page.getByRole('region', { name: 'District 2', exact: true }).locator('.cast-person strong')).toHaveText(['Joshi', 'Marcos']);
    await expect(page.getByRole('button', { name: 'Move Marcos, slot 4', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Edit Marcos, cast entry 4', exact: true }).tap();
    await expect(page.getByRole('dialog')).toBeVisible();
  } finally { await context.close(); }
});

test('grouped cards number players in display order even when the saved cast interleaves districts', async ({ page }) => {
  await open(page);
  const players = [...season2Cast.players];
  [players[3], players[4]] = [players[4], players[3]];
  await upload(page, { ...season2Cast, players });
  await expect(page.locator('.cast-card .entry-number')).toHaveText(players.map((_, index) => String(index + 1).padStart(2, '0')));
  const akesel = page.locator('.cast-card').filter({ has: page.getByText('Akesel', { exact: true }) });
  const gulliver = page.locator('.cast-card').filter({ has: page.getByText('Gulliver', { exact: true }) });
  await expect(akesel.locator('.entry-number')).toHaveText('04');
  await expect(gulliver.locator('.entry-number')).toHaveText('05');
  await expect(page.locator('.cast-card').getByText('No traits selected', { exact: true })).toHaveCount(0);
  await expect(akesel.locator('.cast-person-details small')).toHaveCount(0);
  await akesel.getByRole('button', { name: 'Edit Akesel, cast entry 4', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Name', { exact: true })).toHaveValue('Akesel');
  await page.getByLabel('Sneaky', { exact: true }).check();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(akesel.locator('.cast-person-details small')).toHaveText('Sneaky');
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.reload();
  await expect(akesel.locator('.entry-number')).toHaveText('04');
  await expect(gulliver.locator('.entry-number')).toHaveText('05');
  await expect(akesel.locator('.cast-person-details small')).toHaveText('Sneaky');
});

test('reload restores incomplete draft fields, customization, relationships, pasted names and settings', async ({ page }) => {
  await open(page); await upload(page, exampleCast);
  await page.getByRole('button', { name: 'Game settings' }).click();
  await page.getByLabel('Game seed', { exact: true }).fill('');
  await page.getByLabel('Danger', { exact: true }).selectOption('high');
  await page.getByRole('button', { name: 'Back to cast' }).click();
  await page.getByRole('button', { name: 'Edit Alex, cast entry 1', exact: true }).click();
  await page.getByLabel('Sneaky', { exact: true }).check();
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
  await expect(page.getByLabel('Sneaky', { exact: true })).toBeChecked();
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
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(3);
  await page.getByLabel('Season title', { exact: true }).fill('Camp B');
  await page.getByRole('button', { name: 'Save as new cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(4);
  await page.getByLabel('Season title', { exact: true }).fill('Camp B revised');
  await page.getByRole('button', { name: 'Save cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true })).toContainText('Camp B revised');
  await page.getByLabel('Saved casts', { exact: true }).selectOption({ label: 'Camp A · 2 players' });
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue('Camp A');
  expect((await castExport(page)).cast.players).toEqual(exampleCast.players);
  await page.screenshot({ path: test.info().outputPath('workspace-desktop.png'), fullPage: true });
  await page.getByText('Cast tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Delete saved cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(3);
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
  await page.locator('.playback button.primary').click();
  const firstPosition = await page.locator('.broadcast').getAttribute('data-revealed') as string;
  await expect(page.locator('footer')).toContainText(`Progress saved · ${parseInt(firstPosition)} events revealed`);
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await page.getByLabel('Season title', { exact: true }).fill('Second broadcast');
  await page.getByRole('button', { name: 'Game settings' }).click();
  await page.getByLabel('Game seed', { exact: true }).fill('second-browser-seed');
  await page.getByRole('button', { name: 'Start game' }).click();
  await page.locator('.playback button.primary').click();
  await page.locator('.playback button.primary').click();
  const secondPosition = await page.locator('.broadcast').getAttribute('data-revealed') as string;
  await expect(page.locator('footer')).toContainText(`Progress saved · ${parseInt(secondPosition)} events revealed`);
  await page.reload();
  const list = page.getByRole('region', { name: 'Unfinished games', exact: true });
  await expect(list.getByRole('button', { name: /^Resume / })).toHaveCount(2);
  await list.getByRole('button', { name: 'Resume First broadcast' }).click();
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', firstPosition);
  await expect(page.locator('.results')).toHaveCount(0);
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue('Second broadcast');
  await list.getByRole('button', { name: 'Resume Second broadcast' }).click();
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', secondPosition);
});

for (const width of [1280, 390]) test(`unfinished games can be cancelled or deleted without returning after reload at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 930 });
  await open(page);
  await page.getByLabel('Season title', { exact: true }).fill('Keep my draft');
  const first = structuredClone(fixtureRun); first.input.cast.title = 'First deletion test'; first.id = canonicalRunId(first.input);
  const second = structuredClone(first); second.input.cast.title = 'Second deletion test'; second.input.settings.seed = 'second-deletion'; second.id = canonicalRunId(second.input);
  for (const run of [first, second]) {
    await upload(page, { kind: 'run', schemaVersion: 1, run, cursor: 0 });
    await expect(page.locator('footer')).toContainText('Progress saved · 0 events revealed');
    await page.getByRole('button', { name: 'The cast', exact: true }).click();
  }
  const list = page.getByRole('region', { name: 'Unfinished games', exact: true });
  await list.getByRole('button', { name: 'Delete First deletion test', exact: true }).click();
  await expect(list.getByText('Delete this saved game? This cannot be undone.')).toBeVisible();
  await list.getByRole('button', { name: 'Cancel deletion of First deletion test', exact: true }).click();
  await expect(list.getByRole('button', { name: 'Resume First deletion test ↗', exact: true })).toBeVisible();
  await list.getByRole('button', { name: 'Delete First deletion test', exact: true }).click();
  await page.screenshot({ path: test.info().outputPath(`delete-confirmation-${width}.png`), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await list.getByRole('button', { name: 'Confirm deletion of First deletion test', exact: true }).click();
  await expect(list.getByText('First deletion test', { exact: true })).toHaveCount(0);
  await expect(page.locator('.resume')).toContainText('Second deletion test');
  await page.reload();
  await expect(list.getByRole('button', { name: /^Resume / })).toHaveCount(1);
  await expect(list.getByText('First deletion test', { exact: true })).toHaveCount(0);
  await list.getByRole('button', { name: 'Resume Second deletion test ↗', exact: true }).click();
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', '0');
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await list.getByRole('button', { name: 'Delete Second deletion test', exact: true }).click();
  await list.getByRole('button', { name: 'Confirm deletion of Second deletion test', exact: true }).click();
  await expect(list).toHaveCount(0);
  await expect(page.locator('.resume')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'The arena', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue('Keep my draft');
  await page.reload();
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue('Keep my draft');
  await expect(list).toHaveCount(0);
  await expect(page.locator('.resume')).toHaveCount(0);
  await startSample(page, 'After deletion', 'after-deletion');
  await expect(page.locator('footer')).toContainText('Progress saved · 0 events revealed');
});

test('autoplay pauses on Escape and navigation, phase reveals finish the actual game', async ({ page }) => {
  await open(page); await startSample(page);
  await page.clock.install();
  await page.getByLabel('Autoplay pace', { exact: true }).selectOption('1000');
  await page.getByRole('button', { name: 'Autoplay' }).click();
  await page.clock.fastForward(1100);
  await expect(page.locator('.phase-heading h1')).toHaveText('Bloodbath');
  const firstPosition = await page.locator('.broadcast').getAttribute('data-revealed') as string;
  expect(parseInt(firstPosition)).toBeGreaterThan(1);
  await page.keyboard.press('Escape');
  await page.clock.fastForward(10_000);
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', firstPosition);
  await page.getByRole('button', { name: 'Presentation mode' }).click();
  await expect(page.locator('.app')).toHaveClass(/presentation/);
  await page.keyboard.press('Escape'); await expect(page.locator('.app')).not.toHaveClass(/presentation/);
  await page.getByRole('button', { name: 'Autoplay' }).click();
  await page.getByRole('button', { name: 'The cast', exact: true }).click();
  await page.clock.fastForward(10_000);
  await page.getByRole('button', { name: 'The arena', exact: true }).click();
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', firstPosition);
  await expect(page.getByRole('button', { name: 'Autoplay' })).toHaveAttribute('aria-pressed', 'false');
  let phases = 0;
  while (await page.locator('.playback button.primary').isVisible()) {
    await page.locator('.playback button.primary').click();
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
  await page.locator('.playback button.primary').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.phase-report')).toBeVisible();
  await page.getByRole('button', { name: 'Continue to Fallen tributes' }).click();
  await expect(page.getByRole('region', { name: 'Fallen tributes', exact: true })).toBeVisible();
  await expect(page.locator('.phase-report')).toHaveCount(0);
  await page.getByRole('button', { name: 'View results' }).click();
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
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', '0');
});

test('a corrupt playback does not prevent healthy cast and archive recovery', async ({ page }) => {
  await open(page); await upload(page, exampleCast);
  await page.getByRole('button', { name: 'Save cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(3);
  await upload(page, { kind: 'run', schemaVersion: 1, run: fixtureRun, cursor: 1 });
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await expect(page.locator('.season-card')).toHaveCount(1);
  await writeMeta(page, 'playback', { runId: fixtureRun.id, cursor: -1, revision: 1, updatedAt: new Date().toISOString() });
  await page.reload(); await expect(page.getByRole('alert')).toContainText('Could not load saved progress');
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue(exampleCast.title);
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(3);
  await page.getByRole('button', { name: 'Season archive', exact: false }).click();
  await expect(page.locator('.season-card')).toHaveCount(1);
});

test('a conflict from another tab can load saved progress and continue safely', async ({ page, context }) => {
  await open(page); await startSample(page);
  const other = await context.newPage(); await open(other);
  await other.getByRole('button', { name: 'Resume game' }).click();
  await page.locator('.playback button.primary').click();
  const firstPosition = await page.locator('.broadcast').getAttribute('data-revealed') as string;
  await expect(page.locator('footer')).toContainText(`Progress saved · ${parseInt(firstPosition)} events revealed`);
  await other.locator('.playback button.primary').click();
  await expect(other.getByRole('alert')).toContainText('Another page changed this saved game');
  await other.getByRole('button', { name: 'Load saved progress', exact: true }).click();
  await expect(other.locator('.broadcast')).toHaveAttribute('data-revealed', firstPosition);
  await expect(other.getByRole('alert')).toHaveCount(0);
  await other.locator('.playback button.primary').click();
  const secondPosition = await other.locator('.broadcast').getAttribute('data-revealed') as string;
  expect(parseInt(secondPosition)).toBeGreaterThan(parseInt(firstPosition));
  await expect(other.locator('footer')).toContainText(`Progress saved · ${parseInt(secondPosition)} events revealed`);
});

test('an unreadable draft is preserved while healthy named casts remain usable', async ({ page }) => {
  await open(page); await upload(page, exampleCast);
  await page.getByRole('button', { name: 'Save cast', exact: true }).click();
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(3);
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
  await page.getByText('Cast tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Free unused portrait space', exact: true }).click();
  await expect(page.locator('footer')).toContainText('1 unused portrait removed');
  expect((await castExport(page)).cast.players[0].portrait).toBe('/assets/fern.svg');
});

test('the file picker accepts a valid replay larger than 30 MB', async ({ page }) => {
  await open(page);
  const run = structuredClone(fixtureRun); run.recap = ['x'.repeat(30_000_001)];
  await upload(page, { kind: 'run', schemaVersion: 1, run, cursor: 0 });
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', '0');
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
  await expect(page.getByLabel('Saved casts', { exact: true }).locator('option')).toHaveCount(3);
  await page.getByRole('button', { name: 'New cast', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Use a sample cast' })).toBeVisible();
  await page.getByLabel('Saved casts', { exact: true }).selectOption({ label: `${exampleCast.title} · 2 players` });
  await expect(page.getByLabel('Season title', { exact: true })).toHaveValue(exampleCast.title);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('workspace-mobile.png'), fullPage: true });
});
