import { expect, test, type Page } from '@playwright/test';
import axeCore from 'axe-core';

declare const axe: typeof import('axe-core');

async function expectAccessible(page: Page, label: string) {
  await page.addScriptTag({ content: axeCore.source });
  const violations = await page.evaluate(async () => {
    const results = await axe.run({
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
    return results.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map(node => ({ target: node.target, reason: node.failureSummary })),
    }));
  });
  expect(violations, label).toEqual([]);
}

for (const [width, height] of [[1366, 900], [768, 1024], [667, 375], [390, 844], [320, 800]]) {
  test(`cast and arena relationships pass Axe at ${width}px`, async ({ browser, baseURL }) => {
    const touch = width < 900;
    const page = await browser.newPage({ baseURL, viewport: { width, height }, isMobile: touch, hasTouch: touch });
    try {
      await page.goto('/');
      const button = (name: string) => page.getByRole('button', { name, exact: true });
      const names = Array.from({ length: 46 }, (_, i) => `Tribute ${i + 3}`);
      await page.getByLabel('Names, one per line').fill(['Alex', 'Alex', ...names].join('\n'));
      await button('Add to cast').click();
      await expectAccessible(page, 'cast cards with duplicate names');
      if (touch) {
        for (const control of [button('Game settings'), button('Remove Alex').first()]) {
          const bounds = (await control.boundingBox())!;
          expect(Math.min(bounds.width, bounds.height)).toBeGreaterThanOrEqual(44);
        }
      }

      await button('Relationship network').click();
      if (touch) {
        await expect(page.getByLabel('First player')).toBeVisible();
      } else {
        await expect(button('Select Alex #1 (cast entry 1)')).toBeVisible();
        await expect(button('Select Alex #2 (cast entry 2)')).toBeVisible();
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
      if (touch) {
        await dialog.getByRole('button', { name: 'Show relationship chart' }).click();
        const chart = dialog.getByRole('group', { name: 'Relationship chart' });
        await expect(chart).toBeVisible();
        await expect(chart.getByRole('button')).toHaveCount(0);
        await dialog.getByLabel('First tribute').selectOption({ index: 1 });
        await dialog.getByLabel('Second tribute').selectOption({ index: 1 });
        await expect(dialog.locator('.network-status-readout')).toHaveCount(2);
        await expectAccessible(page, 'expanded touch chart with a selected pair');
      }
    } finally {
      await page.close();
    }
  });
}

test('keyboard users can bypass navigation with a visible skip link in forced colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your cast/ })).toBeVisible();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  expect(await skip.evaluate(element => getComputedStyle(element).clipPath)).toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await expect(page.getByRole('button', { name: 'The cast' })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Names, one per line')).toBeFocused();
  await page.getByRole('button', { name: 'Use a sample cast' }).click();
  await expectAccessible(page, 'cast in forced colors');
  await page.getByRole('button', { name: 'Game settings' }).click();
  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  const advance = page.getByRole('button', { name: 'Start bloodbath' });
  await expect(advance).toBeVisible();
  const contrast = await advance.evaluate(node => {
    const style = getComputedStyle(node);
    return { foreground: style.color, background: style.backgroundColor };
  });
  expect(contrast.foreground).not.toBe(contrast.background);
  await expectAccessible(page, 'arena and primary playback control in forced colors');
  await advance.click();
  await page.getByRole('button', { name: 'Presentation mode' }).click();
  await page.getByText('Presentation tools', { exact: true }).click();
  await expectAccessible(page, 'revealed story and presentation tools in forced colors');
});
