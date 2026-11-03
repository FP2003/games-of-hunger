import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { stapleSupplies } from '../../src/content/supply-use';
import { DEFAULT_SETTINGS, RunRecordSchema, type RunInput } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';

it('uses carried supplies in ordinary seeded games without repeatedly creating stocked staples', () => {
  let acquired = 0, consumed = 0, blanketUses = 0;
  // A broader fixed sample covers blanket use after the default curse pools retire.
  for (const seed of ['supplies-one', 'supplies-two', 'supplies-three', 'supplies-four', 'supplies-five', 'supplies-six', 'supplies-seven', 'supplies-eight']) {
    const input: RunInput = {
      cast: { version: 1, title: 'Supply balance', players: Array.from({ length: 16 }, (_, index) => ({ id: `p${index}`, name: `Player ${index}`, traits: [] })), relationships: [] },
      settings: { ...DEFAULT_SETTINGS, seed }, content: defaultContentPack, lore: { facts: [] },
    };
    const run = generateRun(input, narrativeAdapter);
    expect(RunRecordSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
    const consumedEvent = run.events.find(event => event.facts.some(fact => fact.type === 'consume'));
    if (consumedEvent) {
      const corrupted = structuredClone(run);
      corrupted.events[consumedEvent.sequence].facts = corrupted.events[consumedEvent.sequence].facts.filter(fact => fact.type !== 'consume');
      const parsed = RunRecordSchema.safeParse(corrupted);
      expect(parsed.success).toBe(false);
      if (!parsed.success) expect(parsed.error.issues.some(issue => issue.message.includes('consume effect'))).toBe(true);
    }
    let before = run.initialState;
    for (const event of run.events) {
      const template = run.input.content.events.find(scene => scene.id === event.templateId);
      if (!template?.schedule) for (const effect of event.effects) if (effect.kind === 'createItem' && stapleSupplies.has(effect.definitionId)) {
        expect(before.items.some(item => item.ownerId === event.bindings[effect.role] && !item.destroyed && item.definitionId === effect.definitionId), event.templateId).toBe(false);
      }
      acquired += event.facts.filter(fact => fact.type === 'acquire' && stapleSupplies.has(fact.itemDefinitionId ?? '')).length;
      consumed += event.facts.filter(fact => fact.type === 'consume' && ['ration', 'flask'].includes(fact.itemDefinitionId ?? '')).length;
      if (event.templateId.startsWith('supplies-blanket')) blanketUses++;
      before = event.state;
    }
  }
  expect(consumed + blanketUses, JSON.stringify({ acquired, consumed, blanketUses })).toBeGreaterThanOrEqual(acquired / 3);
  expect(consumed).toBeGreaterThan(0);
  expect(blanketUses).toBeGreaterThan(0);
});
