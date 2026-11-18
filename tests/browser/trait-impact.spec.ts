import { expect, test } from '@playwright/test';
import { experimentSchema, newExperiment, TRAIT_STORAGE_KEY, traitReport } from '../../src/analytics/traits';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS } from '../../src/domain';

for (const width of [1280, 390]) test(`trait tiers, category outlines and export at ${width}px`, async ({ page }) => {
  const e = newExperiment('browser-trait-fixture', 2400, ['agile','clumsy','loyal'], DEFAULT_SETTINGS, defaultContentPack);
  e.completed = 2400; e.baselineWins = 100; e.seats[0] = 2400;
  e.rows.agile = { neither: 2100, both: 50, treatmentOnly: 200, baselineOnly: 50 };
  e.rows.clumsy = { neither: 2300, both: 0, treatmentOnly: 0, baselineOnly: 100 };
  e.rows.loyal = { neither: 2300, both: 100, treatmentOnly: 0, baselineOnly: 0 };
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({key, experiment}) => { localStorage.setItem(key, JSON.stringify(experiment)); localStorage.setItem('keep-demo-marker','yes'); }, {key: TRAIT_STORAGE_KEY, experiment: e});
  await page.goto('/'); await page.getByRole('button', { name: 'Demo statistics', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Trait impact', exact: true });
  await expect(panel.getByRole('status')).toContainText('2400 / 2400');
  await expect(panel.locator('.tier-S')).toContainText('Agile');
  await expect(panel.locator('.tier-F')).toContainText('Clumsy');
  await expect(panel.locator('.tier-C')).toContainText('Loyal');
  await expect(panel.locator('.trait-card.positive').first()).toHaveCSS('border-top-color', 'rgb(168, 216, 121)');
  await expect(panel.locator('.trait-card.normal')).toHaveCSS('border-top-color', 'rgb(132, 186, 255)');
  await panel.locator('.trait-card').filter({ hasText: 'Agile' }).locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(panel.getByText('Treatment: 250/2400.', {exact: false})).toBeVisible();
  await panel.getByLabel('Display category').selectOption('normal');
  await expect(panel.locator('.trait-card')).toHaveCount(1);
  await expect(panel.locator('.trait-card')).toContainText('Clumsy');
  const download = page.waitForEvent('download');
  await panel.getByRole('button', { name: 'Export trait JSON' }).click();
  expect((await download).suggestedFilename()).toBe('trait-statistics.json');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await panel.screenshot({ path: `test-results/trait-impact-${width}.png` });
  await panel.getByRole('button', { name: 'Reset trait experiment' }).click();
  await expect(panel.getByRole('status')).toHaveText('No trait experiment yet');
  expect(await page.evaluate(key => localStorage.getItem(key), TRAIT_STORAGE_KEY)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('keep-demo-marker'))).toBe('yes');
});

test('real trait worker completes, persists and isolates demo batches', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/'); await page.getByRole('button', { name: 'Demo statistics', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Trait impact', exact: true });
  await panel.getByLabel('Pairs per trait').fill('2');
  await panel.getByRole('button', { name: 'Run trait experiment' }).click();
  await expect(page.getByRole('button', { name: 'Run demo batch', exact: true })).toBeDisabled();
  await expect(panel.getByRole('status')).toContainText('2 / 2 complete', { timeout: 90000 });
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), TRAIT_STORAGE_KEY);
  expect(saved.completed).toBe(2); expect(Object.keys(saved.rows)).toHaveLength(26);
  await expect(panel.locator('.tier-Uncertain .trait-card')).toHaveCount(26);
  await page.reload(); await page.getByRole('button', { name: 'Demo statistics', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('2 / 2 complete');
  await page.getByRole('button', { name: 'Reset demo statistics', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('2 / 2 complete');
});

test('stop and continue resumes saved complete blocks with frozen settings', async ({ page }) => {
  await page.route('**/assets/traits.worker-*.js', route => route.fulfill({ contentType: 'text/javascript', body: `self.onmessage=({data:{experiment:e}})=>{const tick=()=>{e.completed++;e.seats[0]++;for(const c of Object.values(e.rows))c.neither++;self.postMessage({experiment:e,done:e.completed===e.target});if(e.completed<e.target)setTimeout(tick,1000)};tick()}` }));
  await page.goto('/'); await page.getByRole('button', { name: 'Demo statistics', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Trait impact', exact: true });
  await panel.getByLabel('Pairs per trait').fill('3');
  await panel.getByRole('button', { name: 'Run trait experiment' }).click();
  await expect(panel.getByRole('status')).toContainText('1 / 3');
  await panel.getByRole('button', { name: 'Stop trait experiment', exact: true }).click();
  await expect(panel.getByLabel('Pairs per trait')).toBeDisabled();
  await page.reload(); await page.getByRole('button', { name: 'Demo statistics', exact: true }).click();
  await panel.getByRole('button', { name: 'Continue trait experiment', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('3 / 3');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).completed, TRAIT_STORAGE_KEY)).toBe(3);
});

test('loads audit counters, recomputes tiers and validates imported checkpoints', async ({ page }) => {
  const e = newExperiment('included-audit-fixture', 3, ['agile'], DEFAULT_SETTINGS, defaultContentPack);
  e.completed = 1; e.seats[0] = 1; e.rows.agile.neither = 1;
  await page.route('**/trait-audit.json', route => route.fulfill({ json: { experiment: e, rows: [{ trait: 'agile', tier: 'S' }] } }));
  await page.goto('/'); await page.getByRole('button', { name: 'Demo statistics', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Trait impact', exact: true });
  await expect(panel.getByLabel('Import trait JSON')).toBeVisible();
  await panel.getByRole('button', { name: 'Load included audit', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('1 / 3');
  await expect(panel.locator('.tier-Uncertain .trait-card')).toHaveCount(1);
  await panel.getByRole('button', { name: 'Reset trait experiment', exact: true }).click();
  await panel.getByLabel('Import trait JSON').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"experiment":{"completed":9}}') });
  await expect(panel.getByRole('alert')).toContainText('Invalid trait experiment JSON');
  await expect(panel.getByRole('status')).toHaveText('No trait experiment yet');
  await panel.getByLabel('Import trait JSON').setInputFiles({ name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ experiment: { ...e, engineVersion: 'old' } })) });
  await expect(panel.getByRole('alert')).toContainText('older engine/content versions');
  await expect(panel.getByRole('button', { name: 'Continue trait experiment', exact: true })).toBeDisabled();
});

test('a storage failure leaves imported results exportable and reports the problem', async ({ page }) => {
  const e = newExperiment('storage-failure', 1, ['agile'], DEFAULT_SETTINGS, defaultContentPack);
  await page.addInitScript(key => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(name,value) { if (name === key) throw new DOMException('Full', 'QuotaExceededError'); return original.call(this,name,value); }; }, TRAIT_STORAGE_KEY);
  await page.route('**/trait-audit.json', route => route.fulfill({ json: { experiment: e } }));
  await page.goto('/'); await page.getByRole('button', { name: 'Demo statistics', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Trait impact', exact: true });
  await panel.getByRole('button', { name: 'Load included audit', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('could not be saved');
  await expect(panel.getByRole('button', { name: 'Export trait JSON', exact: true })).toBeEnabled();
});

test('the shipped main audit is complete, reproducible from counters and available on the demo page', async ({ page }) => {
  const response = await page.request.get('/trait-audit.json');
  expect(response.ok()).toBe(true);
  const report = await response.json();
  const e = experimentSchema.parse(report.experiment);
  expect(e.completed).toBe(2400); expect(e.target).toBe(2400); expect(e.traits).toHaveLength(26);
  expect(traitReport(e).rows).toEqual(report.rows);
  await page.goto('/'); await page.getByRole('button', { name: 'Demo statistics', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Trait impact', exact: true });
  await panel.getByRole('button', { name: 'Load included audit', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('2400 / 2400');
  await expect(panel.locator('.trait-card')).toHaveCount(26);
  await panel.screenshot({ path: 'test-results/trait-impact-real.png' });
});
