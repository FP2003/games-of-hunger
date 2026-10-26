import { test, expect, type Locator } from '@playwright/test';
import { exampleCast } from '../fixtures';

async function expectReadableNetwork(chart: Locator, minimumFont = 11) {
  const viewport = await chart.locator('.network-viewport').boundingBox();
  const nodes = await chart.locator('.network-node').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    const cx = (box.left + box.right) / 2, cy = (box.top + box.bottom) / 2;
    const w = (element as HTMLElement).offsetWidth / 2, h = (element as HTMLElement).offsetHeight / 2;
    const corners = [[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => ({ x: cx + matrix.a * x + matrix.c * y, y: cy + matrix.b * x + matrix.d * y }));
    return { name: element.textContent, x: box.x, y: box.y, right: box.right, bottom: box.bottom,
      corners,
      font: Number.parseFloat(getComputedStyle(element.querySelector('.network-node-name')!).fontSize) };
  }));
  for (const [index, node] of nodes.entries()) {
    expect(node.font, `${node.name} stays readable`).toBeGreaterThanOrEqual(minimumFont);
    expect(node.x).toBeGreaterThanOrEqual(viewport!.x - 0.5);
    expect(node.y).toBeGreaterThanOrEqual(viewport!.y - 0.5);
    expect(node.right).toBeLessThanOrEqual(viewport!.x + viewport!.width + 0.5);
    expect(node.bottom).toBeLessThanOrEqual(viewport!.y + viewport!.height + 0.5);
    for (const other of nodes.slice(index + 1)) {
      const axes = [node.corners, other.corners].flatMap(corners => corners.map((point, i) => ({ x: -(corners[(i + 1) % 4].y - point.y), y: corners[(i + 1) % 4].x - point.x })));
      const overlaps = axes.every(axis => {
        const length = Math.hypot(axis.x, axis.y);
        const project = (point: { x: number; y: number }) => (point.x * axis.x + point.y * axis.y) / length;
        const a = node.corners.map(project), b = other.corners.map(project);
        return Math.min(Math.max(...a), Math.max(...b)) - Math.max(Math.min(...a), Math.min(...b)) > 0.5;
      });
      expect(overlaps, `${node.name} and ${other.name} do not overlap`).toBe(false);
    }
  }
}

async function expectCircularNetwork(chart: Locator, count: number) {
  const geometry = await chart.locator('.network-canvas').evaluate(canvas => {
    const box = canvas.getBoundingClientRect();
    return [...canvas.querySelectorAll('.network-node:not(.central)')].map(node => {
      const point = node.getBoundingClientRect();
      const x = (point.left + point.right) / 2 - box.left - box.width / 2;
      const y = (point.top + point.bottom) / 2 - box.top - box.height / 2;
      return { radius: Math.hypot(x, y), angle: (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2) };
    });
  });
  expect(geometry).toHaveLength(count);
  const sorted = geometry.sort((a, b) => a.angle - b.angle);
  for (let i = 0; i < count; i++) {
    expect(sorted[i].radius).toBeCloseTo(sorted[0].radius, 1);
    const gap = (sorted[(i + 1) % count].angle - sorted[i].angle + Math.PI * 2) % (Math.PI * 2);
    expect(gap).toBeCloseTo(Math.PI * 2 / count, 3);
  }
}

test('six players form a hexagon and matching incoming arrows share a trunk', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Use a sample cast' })).toBeVisible();
  const players = ['Hiro', 'Cleo', 'Jules', 'Sage', 'Kit', 'Marlow'].map((name, i) => ({ id: `p${i}`, name, traits: [] }));
  await page.locator('input[type=file]').first().setInputFiles({ name: 'cast.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({
    version: 1, title: 'Hexagon', players,
    relationships: players.slice(1).map(player => ({ from: player.id, to: 'p0', trust: 60, grudge: 0 })),
  })) });
  await page.getByRole('button', { name: 'Relationship network', exact: true }).click();
  const chart = page.getByRole('region', { name: 'Cast relationship network', exact: true });
  await expectCircularNetwork(chart, 6);
  await expectReadableNetwork(chart, 13);
  await chart.getByRole('button', { name: 'Select Hiro, cast entry 1', exact: true }).click();
  const incoming = chart.locator('.network-bundle[data-status="trusted"][data-direction="incoming"]');
  await expect(incoming).toHaveAttribute('data-count', '5');
  await expect(incoming.locator('.network-bundle-branch')).toHaveCount(5);
  await expect(incoming.locator('.network-bundle-trunk[marker-start]')).toHaveCount(1);
  await expect(incoming.locator('.network-bundle-branch[marker-end]')).toHaveCount(0);
  await expect(chart.locator('.network-bundle[data-status="neutral"][data-direction="outgoing"]')).toHaveAttribute('data-count', '5');
  await chart.getByRole('button', { name: 'Select Cleo, cast entry 2', exact: true }).click();
  await chart.getByRole('button', { name: 'Cleo toward Hiro: Rival', exact: true }).click();
  await chart.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await chart.getByRole('button', { name: 'Select Hiro, cast entry 1', exact: true }).click();
  await expect(incoming).toHaveAttribute('data-count', '4');
  await expect(chart.locator('.network-bundle[data-status="rival"][data-direction="incoming"]')).toHaveAttribute('data-count', '1');
  await chart.screenshot({ path: test.info().outputPath('hexagon-bundles.png') });
});

test('network preserves different feelings in each direction and shares edits with the character chart', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Use a sample cast' })).toBeVisible();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'cast.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({
    ...exampleCast,
    players: [...exampleCast.players, { id: 'sam', name: 'Sam', traits: [] }],
    relationships: [{ from: 'alex', to: 'riley', trust: 60, grudge: 0 }, { from: 'riley', to: 'alex', trust: -50, grudge: 60 }],
  })) });
  await page.getByRole('button', { name: 'Relationship network', exact: true }).click();
  const chart = page.getByRole('region', { name: 'Cast relationship network', exact: true });
  await expect(chart.locator('.network-node')).toHaveCount(3);
  await expect(chart.locator('.network-node.central')).toHaveCount(0);
  await expect(chart.locator('.network-edge[data-from="alex"][data-to="riley"]')).toHaveAttribute('data-status', 'trusted');
  await expect(chart.locator('.network-edge[data-from="riley"][data-to="alex"]')).toHaveAttribute('data-status', 'rival');
  await chart.getByRole('button', { name: 'Select Alex, cast entry 1', exact: true }).click();
  await chart.getByRole('button', { name: 'Select Riley, cast entry 2', exact: true }).click();
  await expect(chart.getByRole('button', { name: 'Alex toward Riley: Trusted', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(chart.getByRole('button', { name: 'Riley toward Alex: Rival', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await chart.getByRole('button', { name: 'Alex toward Riley: Neutral', exact: true }).click();
  await expect(chart.locator('.network-edge[data-from="riley"][data-to="alex"]')).toHaveAttribute('data-status', 'rival');
  await chart.getByRole('button', { name: 'Riley toward Alex: Trusted', exact: true }).click();
  await chart.getByRole('button', { name: 'Edit Alex’s character', exact: false }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.network-node.central')).toContainText('Alex');
  await dialog.getByRole('button', { name: 'Select Riley, cast entry 2', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Alex toward Riley: Neutral', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'Alex toward Riley: Trusted', exact: true }).click();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  // Matching opinions merge into a single line with an arrow at each end.
  const mutual = chart.locator('.network-edge[data-from="alex"][data-to="riley"] .network-edge-line');
  await expect(mutual).toHaveAttribute('marker-start', /trusted/);
  await expect(mutual).toHaveAttribute('marker-end', /trusted/);
  await chart.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await expect(chart.locator('.network-edge.neutral')).toHaveCount(0);
  await chart.getByLabel('Neutral lines', { exact: true }).check();
  await expect(chart.locator('.network-edge.neutral')).toHaveCount(2);
  await page.screenshot({ path: test.info().outputPath('cast-relationships.png'), fullPage: true });
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Relationship network', exact: true }).click();
  await expect(page.locator('.network-edge[data-from="alex"][data-to="riley"]')).toHaveAttribute('data-status', 'trusted');
});

for (const width of [1280, 390]) {
  test(`24-player chart uses the full width with readable names at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Load Season 2 cast', exact: true }).click();
    await page.getByRole('button', { name: 'Relationship network', exact: true }).click();
    const chart = page.getByRole('region', { name: 'Cast relationship network', exact: true });
    await expect(chart.locator('.network-node')).toHaveCount(24);
    const bounds = await chart.boundingBox();
    const addPanel = await page.locator('.add-panel').boundingBox();
    expect(addPanel!.y + addPanel!.height).toBeLessThan(bounds!.y);
    expect(bounds!.width).toBeCloseTo(addPanel!.width, 0);
    await expectReadableNetwork(chart, width > 720 ? 13 : 12);
    await expectCircularNetwork(chart, 24);
    await chart.screenshot({ path: test.info().outputPath(`readable-network-${width}.png`) });
    await chart.locator('button.network-node').first().click();
    await expect(chart.locator('.network-bundle')).toHaveCount(1);
    await expect(chart.locator('.network-bundle[data-direction="mutual"]')).toHaveAttribute('data-count', '23');
    await expect(chart.locator('.network-bundle-trunk[marker-start]')).toHaveCount(1);
    await chart.locator('button.network-node').last().click();
    await expectReadableNetwork(chart, width > 720 ? 13 : 12);
    await chart.getByRole('button', { name: /^Edit .+character$/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('button.network-node').last().click();
    await expectReadableNetwork(dialog.locator('.relationship-network'), width > 720 ? 13 : 12);
    await expectCircularNetwork(dialog.locator('.relationship-network'), 23);
  });

  test(`48-player network is contained and editable with duplicate names at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Use a sample cast' })).toBeVisible();
    await page.getByLabel('Names, one per line', { exact: true }).fill(Array.from({ length: 48 }, (_, i) => i < 2 ? 'Alex' : `Player ${i + 1}`).join('\n'));
    await page.getByRole('button', { name: 'Add to cast', exact: false }).click();
    await page.getByRole('button', { name: 'Relationship network', exact: true }).click();
    const chart = page.getByRole('region', { name: 'Cast relationship network', exact: true });
    await expect(chart.locator('button.network-node')).toHaveCount(48);
    await expect(chart.locator('.network-selection')).toHaveCount(0);
    const initialHeight = (await chart.boundingBox())!.height;
    await expectReadableNetwork(chart);
    await expectCircularNetwork(chart, 48);
    const viewport = await chart.locator('.network-viewport').boundingBox();
    for (const box of await chart.locator('button.network-node').evaluateAll(nodes => nodes.map(node => {
      const bounds = node.getBoundingClientRect();
      return { x: bounds.x, y: bounds.y, right: bounds.right, bottom: bounds.bottom };
    }))) {
      expect(box.x).toBeGreaterThanOrEqual(viewport!.x);
      expect(box.y).toBeGreaterThanOrEqual(viewport!.y);
      expect(box.right).toBeLessThanOrEqual(viewport!.x + viewport!.width);
      expect(box.bottom).toBeLessThanOrEqual(viewport!.y + viewport!.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const source = chart.getByRole('button', { name: 'Select Alex, cast entry 1', exact: true });
    await source.focus();
    await page.keyboard.press('Enter');
    await chart.getByRole('button', { name: 'Select Alex, cast entry 2', exact: true }).click();
    // The two directed controls remain independent even when names are identical.
    await chart.getByRole('button', { name: 'Alex #1 toward Alex #2: Rival', exact: true }).click();
    await expect(chart.getByRole('button', { name: 'Alex #1 toward Alex #2: Rival', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(chart.getByRole('button', { name: 'Alex #2 toward Alex #1: Rival', exact: true })).toHaveAttribute('aria-pressed', 'false');
    expect((await chart.boundingBox())!.height).toBe(initialHeight);
    // Resizing still fits every node within both dimensions without panning.
    await page.setViewportSize({ width, height: 600 });
    await expect.poll(() => chart.locator('.network-viewport').evaluate(element => ({
      horizontal: element.scrollWidth <= element.clientWidth,
      vertical: element.scrollHeight <= element.clientHeight,
    }))).toEqual({ horizontal: true, vertical: true });
    await expectReadableNetwork(chart);
    await expectCircularNetwork(chart, 48);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await chart.screenshot({ path: test.info().outputPath(`large-network-${width}.png`) });
  });
}
