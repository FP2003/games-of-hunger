import { expect, test, type Page } from '@playwright/test';
import { source } from 'axe-core';

async function expectAccessible(page: Page, label: string) {
  await page.evaluate(source);
  const violations = await page.evaluate(async () => {
    const results = await window.axe.run({
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
    return results.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map(node => ({ target: node.target, reason: node.failureSummary })),
    }));
  });
  expect(violations, label).toEqual([]);
}

for (const width of [1366, 390, 320]) {
  test(`cast and arena relationships pass Axe at ${width}px`, async ({ browser, baseURL }) => {
    const touch = width < 400;
    const page = await browser.newPage({ baseURL, viewport: { width, height: 900 }, isMobile: touch, hasTouch: touch });
    try {
      await page.goto('/');
      const button = (name: string) => page.getByRole('button', { name, exact: true });
      const names = Array.from({ length: 46 }, (_, i) => `Tribute ${i + 3}`);
      await page.getByLabel('Names, one per line').fill(['Alex', 'Alex', ...names].join('\n'));
      await button('Add to cast').click();
      await expectAccessible(page, 'cast cards with duplicate names');

      await button('Relationship network').click();
      if (touch) {
        await expect(page.getByLabel('First player')).toBeVisible();
      } else {
        await expect(button('Select Alex #1, cast entry 1')).toBeVisible();
        await expect(button('Select Alex #2, cast entry 2')).toBeVisible();
      }
      await expectAccessible(page, 'cast relationships');

      await button('Game settings').click();
      await button('Start game').click();
      await button('Start bloodbath').click();
      await button('Relationship network').click();
      const dialog = page.getByRole('dialog', { name: 'Relationship network' });
      await expect(dialog).toBeVisible();
      if (touch) {
        await expect(dialog.getByLabel('First tribute').locator('option').filter({ hasText: '(eliminated)' }).first()).toBeAttached();
      } else {
        await expect(dialog.getByRole('button', { name: /\(eliminated\)$/ }).first()).toBeVisible();
      }
      await expectAccessible(page, 'arena relationships with eliminated tributes');
    } finally {
      await page.close();
    }
  });
}
