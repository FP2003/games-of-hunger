import { expect, test } from '@playwright/test';

for (const width of [1366, 390, 320]) {
  test(`arena controls stay in view and keep keyboard focus at ${width}px`, async ({ browser, baseURL }, info) => {
    const page = await browser.newPage({ baseURL, viewport: { width, height: 844 }, isMobile: width < 400, hasTouch: width < 400 });
    try {
      await page.goto('/');
      const button = (name: string) => page.getByRole('button', { name, exact: true });
      await button('Use a sample cast').click();
      await button('Game settings').press('Enter');
      await expect(page.getByRole('heading', { name: 'Game settings' })).toBeFocused();
      await button('Start game').press('Enter');
      const next = page.locator('.playback .primary');
      await expect(next).toBeFocused();
      await next.press('Enter');

      await button('Presentation mode').press('Enter');
      await expect(next).toBeFocused();
      const tools = page.getByText('Presentation tools', { exact: true });
      await tools.press('Enter');
      const menu = page.locator('.presentation-tools .cast-tools-menu');
      await expect(menu).toBeVisible();
      const bounds = (await menu.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      await expect(menu.getByRole('button', { name: 'Export full replay' })).toBeVisible();
      await expect(menu.getByRole('button', { name: 'Relationship network' })).toBeVisible();
      await expect(menu.getByRole('button', { name: 'Copy scene as PNG' })).toBeVisible();
      await page.screenshot({ path: info.outputPath('presentation-tools.png') });
      await page.keyboard.press('Escape');
      await expect(tools).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(button('Presentation mode')).toBeFocused();

      for (let step = 0; step < 65 && await next.count(); step++) await next.press('Enter');
      await expect(page.getByRole('heading', { level: 1, name: / wins$/ })).toBeFocused();
    } finally {
      await page.close();
    }
  });
}

test('a full cast can edit relationships and read long names on a 320px touch screen', async ({ browser, baseURL }, info) => {
  const page = await browser.newPage({ baseURL, viewport: { width: 320, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await page.goto('/');
    const names = Array.from({ length: 48 }, (_, i) => `Player${String(i).padStart(2, '0')}-`.padEnd(109, 'X'));
    await page.getByLabel('Names, one per line').fill(names.join('\n'));
    await page.getByRole('button', { name: 'Add to cast' }).click();
    await page.getByRole('button', { name: 'Relationship network', exact: true }).click();

    const chart = page.getByRole('group', { name: 'Relationship chart', includeHidden: true });
    await expect(chart).toBeHidden();
    await page.getByRole('button', { name: 'Show relationship chart' }).click();
    await expect(chart).toBeVisible();
    await page.getByRole('button', { name: 'Hide relationship chart' }).click();

    const search = page.getByRole('searchbox', { name: 'Find players' });
    await search.fill('Player00');
    await page.getByLabel('First player').selectOption({ label: names[0] });
    await search.fill('Player47');
    await page.getByLabel('Second player').selectOption({ label: names[47] });
    const trusted = page.getByRole('button', { name: `${names[0]} toward ${names[47]}: Trusted`, exact: true });
    await trusted.tap();
    await expect(trusted).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: info.outputPath('relationship-picker.png') });

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByRole('button', { name: 'Start game' }).click();
    await page.getByRole('button', { name: 'Start bloodbath' }).click();
    await expect(page.locator('.phase-report .character-name').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    await page.screenshot({ path: info.outputPath('long-name-broadcast.png') });

    await page.getByRole('button', { name: 'Relationship network', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Relationship network' });
    await dialog.getByLabel('First tribute').selectOption({ index: 1 });
    await dialog.getByLabel('Second tribute').selectOption({ index: 1 });
    await expect(dialog.locator('.network-status-readout')).toHaveCount(2);
  } finally {
    await page.close();
  }
});
