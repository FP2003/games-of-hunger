import { test, expect } from '@playwright/test';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';
import { fixtureInput, fixturePack } from '../fixtures';
import type { EventTemplate, RunRecord } from '../../src/domain';

const betrayal: EventTemplate = {
  id: 'opening-betrayal', category: 'social', phases: ['opening'], tones: ['mixed'], scope: 'global',
  roles: [{ id: 'actor', traits: ['reckless'] }, { id: 'target' }], conditions: [], weight: 1, cooldown: 0,
  variants: ['{actor.name} promises to share the shelter, then strands {target.name} outside.'],
  effects: [{ kind: 'relationship', from: 'target', to: 'actor', trust: -50, grudge: 60, fact: 'betrayal' }],
};

function earlierSeasons() {
  const runs: RunRecord[] = [];
  for (let index = 0; index < 20 && runs.length < 2; index++) {
    const run = generateRun({
      ...fixtureInput, settings: { ...fixtureInput.settings, seed: `opening-betrayal-${index}` },
      content: { ...fixturePack, events: [betrayal, ...fixturePack.events] },
    }, narrativeAdapter);
    if (run.events.some(event => event.facts.some(fact => fact.type === 'betrayal'))) runs.push(run);
  }
  if (runs.length !== 2) throw new Error('Missing two directed betrayal fixtures.');
  return runs;
}

test('a returning saved cast can start with an inherited rival and keep its saved slot', async ({ page }) => {
  await page.goto('/');
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const upload = async (data: unknown) => {
    await page.locator('input[type=file]').first().setInputFiles({ name: 'campaign.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  };
  for (const run of earlierSeasons()) {
    await upload({ kind: 'run', schemaVersion: 1, run, cursor: run.events.length });
    await expect(page.locator('.results')).toBeVisible();
    await button('The cast').click();
  }
  await page.getByRole('button', { name: /^Season archive/ }).click();
  await page.getByRole('button', { name: 'View rivalry timeline' }).first().click();
  const timeline = page.locator('.results .rivalry-timeline');
  await expect(timeline).toHaveAttribute('open', '');
  await expect(timeline).toContainText('Alex now considers Riley their main rival.');
  await timeline.getByRole('link', { name: 'Event 1', exact: true }).click();
  await expect(page.locator('.revealed-log')).toHaveAttribute('open', '');
  await button('The cast').click();
  await upload(fixtureInput.cast);
  const castSlots = page.getByLabel('Saved casts');
  await button('Save cast').click();
  await expect(castSlots).not.toHaveValue('');
  const savedSlot = await castSlots.inputValue();
  await button('Game settings').click();
  await page.getByRole('checkbox', { name: /Carry grudges into this season/ }).check();
  await page.getByRole('checkbox', { name: /Include past season events/ }).uncheck();
  await button('Start game').click();
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', '0');
  await button('Relationship network').click();
  const dialog = page.getByRole('dialog', { name: 'Relationship network' });
  await dialog.getByText(/Rivalry timeline/).click();
  await expect(dialog).toContainText('Alex starts with Riley as their main rival.');
  await expect(dialog).not.toContainText('Riley starts with Alex as their main rival.');
  await expect(dialog.getByRole('link', { name: /^Event / })).toHaveCount(0);
  await page.keyboard.press('Escape');
  const next = page.locator('.playback button.primary');
  while (await next.isVisible()) await next.click();
  await button('Start another season').click();
  await button('Start game').click();
  await expect(page.locator('.broadcast')).toHaveAttribute('data-revealed', '0');
  await button('The cast').click();
  await expect(castSlots).toHaveValue(savedSlot);
  await expect(castSlots.locator('optgroup option')).toHaveCount(1);
});
