import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, type RunInput } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';
import { requestedTravel } from '../../src/engine/travel';

it('keeps fights central and travel occasional across seeded normal seasons', () => {
  let openingDeaths = 0, deaths = 0, credited = 0, assignments = 0, moves = 0, weaponAttacks = 0;
  let ordinaryEvents = 0, soloLoot = 0, interactions = 0, totalDays = 0;
  const samples = 16;
  for (let seed = 0; seed < samples; seed++) {
    const input: RunInput = {
      content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed: `combat-review-${seed}` }, lore: { facts: [] },
      cast: { version: 1, title: 'Combat review', relationships: [], players: Array.from({ length: 24 }, (_, index) => ({ id: `p${index}`, name: `Player ${index}`, traits: [] })) },
    };
    const run = generateRun(input, narrativeAdapter);
    totalDays += run.events.at(-1)!.phase.day;
    expect(run.events.at(-1)!.phase.day).toBeLessThanOrEqual(6);
    expect(run.events.filter(event => event.templateId.startsWith('sponsor-gift-')).length).toBeLessThanOrEqual(2);
    expect(run.events.filter(event => event.templateId.startsWith('podium-resupply')).length).toBeLessThanOrEqual(1);
    const history: typeof run.events = [];
    let before = run.initialState;
    for (const event of run.events) {
      const template = input.content.events.find(scene => scene.id === event.templateId);
      const kills = event.facts.filter(fact => fact.type === 'elimination');
      deaths += kills.length;
      credited += kills.filter(fact => fact.actorId && fact.targetId).length;
      if (event.phase.kind === 'opening') openingDeaths += kills.length;
      if (template?.travel) {
        for (const player of Object.values(event.bindings)) {
          expect(requestedTravel(player, before, history, event.phase, input.content), template.id).toBe(template.travel);
        }
      }
      if (event.phase.kind === 'day' || event.phase.kind === 'night') {
        ordinaryEvents++;
        if (Object.keys(event.bindings).length > 1) interactions++;
        if (Object.keys(event.bindings).length === 1 && event.facts.some(fact => fact.type === 'acquire')) soloLoot++;
        assignments += Object.keys(event.bindings).length;
        moves += event.facts.filter(fact => fact.type === 'move').length;
        if (/^weapon-.*-(fatal|survived|missed)$/.test(event.templateId)) weaponAttacks++;
      }
      history.push(event); before = event.state;
    }
  }
  console.info({ openingDeathsPerGame: openingDeaths / samples, creditedShare: credited / deaths, travelShare: moves / assignments, weaponAttacksPerGame: weaponAttacks / samples, soloLootShare: soloLoot / ordinaryEvents, interactionShare: interactions / ordinaryEvents, averageDays: totalDays / samples });
  expect(openingDeaths / samples).toBeGreaterThanOrEqual(3);
  expect(credited / deaths).toBeGreaterThanOrEqual(0.75);
  expect(moves / assignments).toBeLessThan(0.2);
  expect(weaponAttacks / samples).toBeGreaterThanOrEqual(2);
  expect(soloLoot / ordinaryEvents).toBeLessThan(0.15);
  expect(interactions / ordinaryEvents).toBeGreaterThan(0.25);
});
