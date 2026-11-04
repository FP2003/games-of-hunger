import { describe, expect, it } from 'vitest';
import { combatRecord } from '../../src/engine/combat';
import { addDemoRun, demoCast, demoSettings, demoReport, emptyDemoStats } from '../../src/analytics/demo';
import { defaultContentPack } from '../../src/content';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';
import { ContentPackSchema, RunRecordSchema } from '../../src/domain';
import { fixtureRun } from '../fixtures';

describe('structured combat and balance', () => {
  it('counts the attacker inventory, never an armed victim or weapon wording', () => {
    const run = structuredClone(fixtureRun), before = structuredClone(run.initialState);
    const knife = { id: 'knife-1', definitionId: 'knife', name: 'knife', ownerId: 'riley', biome: 'forest' as const, destroyed: false };
    before.items.push(knife);
    const template = defaultContentPack.events.find(t => t.id === 'weapon-knife-fatal')!;
    const generic = { ...template, combat: undefined, conditions: [] };
    const bindings = { actor: 'alex', target: 'riley' };
    expect(combatRecord(generic, bindings, before, run.events[0].state, defaultContentPack)).toMatchObject({ armed: false, attackerId: 'alex', outcome: 'death', method: 'unknown' });
    knife.ownerId = 'alex';
    const c = combatRecord(template, bindings, before, run.events[0].state, defaultContentPack)!;
    expect(c).toMatchObject({ armed: true, weaponItemId: 'knife-1', weaponDefinitionId: 'knife', method: 'held-weapon' });
    expect(combatRecord({ ...template, variants: ['No weapon keywords here.'] }, bindings, before, run.events[0].state, defaultContentPack)).toEqual(c);
    const hazard = { ...generic, category: 'finale' as const, effects: [{ kind: 'eliminate' as const, role: 'actor' }] };
    expect(combatRecord(hazard, bindings, before, before, defaultContentPack)).toBeUndefined();
    const pursuit = { ...generic, effects: [], combat: { attacker: 'target', method: 'unknown' as const } };
    expect(combatRecord(pursuit, bindings, before, before, defaultContentPack)).toMatchObject({ attackerId: 'riley', targetIds: ['alex'], armed: false });
    const theft = { ...generic, id: 'custom-theft', effects: [{ kind: 'transferItem' as const, from: 'target', to: 'actor', fact: 'theft' as const }] };
    expect(combatRecord(theft, bindings, before, before, defaultContentPack)).toBeUndefined();
  });

  it('classifies every shipped combat variant, including trait-gated scenes', () => {
    const before = structuredClone(fixtureRun.initialState);
    for (const template of defaultContentPack.events) {
      const bindings = Object.fromEntries(template.roles.map((r, i) => [r.id, `player-${i}`]));
      for (let i = 0; i < template.variants.length; i++) {
        const c = combatRecord(template, bindings, before, before, defaultContentPack, i);
        if (c) expect(c.method, `${template.id} variant ${i}`).not.toBe('unknown');
      }
    }
  });

  it('uses the selected authored variant and validates replay indices', () => {
    const template = defaultContentPack.events.find(t => t.id === 'final-beacon-1')!;
    const before = fixtureRun.initialState, after = fixtureRun.events[0].state, bindings = { actor: 'alex', target: 'riley' };
    expect(combatRecord(template, bindings, before, after, defaultContentPack, 0)?.method).toBe('environment');
    expect(combatRecord(template, bindings, before, after, defaultContentPack, 1)?.method).toBe('unarmed');
    expect(combatRecord(template, bindings, before, after, defaultContentPack, 4)?.method).toBe('improvised');
    expect(combatRecord(template, bindings, before, after, defaultContentPack)?.method).toBe('unknown');
    const pack = structuredClone(defaultContentPack);
    pack.events.find(t => t.id === template.id)!.combat!.variantMethods!.pop();
    expect(ContentPackSchema.safeParse(pack).success).toBe(false);
    const cast = { ...demoCast, players: demoCast.players.slice(0, 12) };
    const run = generateRun({ cast, settings: { ...demoSettings, seed: 'variant-replay' }, content: defaultContentPack, lore: { facts: [] } }, narrativeAdapter);
    const event = run.events.find(e => e.combat?.variantIndex !== undefined)!;
    expect(event).toBeDefined(); event.combat!.variantIndex = 9999;
    expect(RunRecordSchema.safeParse(run).success).toBe(false);
  });

  it('records seized weapons without counting them as prior-owned use, and counts deployed charges', () => {
    const before = structuredClone(fixtureRun.initialState), after = structuredClone(fixtureRun.events[0].state);
    before.items.push({ id: 'knife-1', definitionId: 'knife', name: 'knife', ownerId: 'riley', biome: 'forest', destroyed: false });
    after.items.push({ ...before.items.at(-1)!, ownerId: 'alex' });
    const bindings = { actor: 'alex', target: 'riley' };
    const seized = defaultContentPack.events.find(t => t.id === 'weapon-knife-kill-and-loot')!;
    expect(combatRecord(seized, bindings, before, after, defaultContentPack)).toMatchObject({ method: 'seized-weapon', armed: false, weaponItemId: 'knife-1' });
    before.items.push({ id: 'charge-1', definitionId: 'explosive', name: 'charge', ownerId: 'alex', biome: 'forest', destroyed: false });
    const explosive = defaultContentPack.events.find(t => t.id === 'explosive-fatal')!;
    expect(combatRecord(explosive, bindings, before, after, defaultContentPack)).toMatchObject({ method: 'explosive', armed: true, weaponItemId: 'charge-1' });
    const run = structuredClone(fixtureRun), stats = emptyDemoStats();
    run.events[0].combat = combatRecord(seized, bindings, before, after, defaultContentPack);
    addDemoRun(stats, run);
    expect(stats.totals.armedAttacks).toBe(1); expect(stats.totals.heldWeaponAttacks).toBe(0);
    run.events[0].combat = combatRecord(explosive, bindings, before, after, defaultContentPack);
    addDemoRun(stats, run);
    expect(stats.totals.heldWeaponAttacks).toBe(1);
  });

  it('rejects combat metadata that names an invalid role or unheld weapon', () => {
    const pack = structuredClone(defaultContentPack);
    const weapon = pack.events.find(t => t.id === 'weapon-knife-fatal')!;
    weapon.combat!.attacker = 'missing';
    expect(ContentPackSchema.safeParse(pack).success).toBe(false);
    weapon.combat!.attacker = 'actor'; weapon.conditions = [];
    expect(ContentPackSchema.safeParse(pack).success).toBe(false);
  });

  it('meets 24-player balance targets across 100 fixed seeds and reconciles all metrics', () => {
    const stats = emptyDemoStats();
    let sampleRun: ReturnType<typeof generateRun> | undefined;
    for (let i = 0; i < 100; i++) {
      const run = generateRun({ cast: demoCast, settings: { ...demoSettings, seed: `combat-metrics-${i}` }, content: defaultContentPack, lore: { facts: [] } }, narrativeAdapter);
      addDemoRun(stats, run); sampleRun ??= run;
    }
    const report = demoReport(stats, defaultContentPack), t = stats.totals;
    expect(report.bloodbathDistribution.min).toBeGreaterThanOrEqual(3);
    expect(report.bloodbathDistribution.max).toBeLessThanOrEqual(9);
    expect(report.bloodbathDistribution.standardDeviation).toBeGreaterThan(0.8);
    expect(t.bloodbathDeaths / stats.games).toBeGreaterThanOrEqual(5);
    expect(t.bloodbathDeaths / stats.games).toBeLessThanOrEqual(6);
    expect(t.armedAttacks).toBeGreaterThan(100);
    expect(t.heldWeaponAttacks / t.armedAttacks).toBeGreaterThanOrEqual(0.7);
    expect(t.ordinaryFights / t.voluntaryPassages).toBeGreaterThan(3);
    expect(t.combatDeaths + t.combatInjuries + t.combatUnharmed).toBe(t.combatFights);
    expect(t.openingMoves + t.forcedMoves + t.voluntaryMoves + t.encounterMoves).toBe(t.moves);
    expect(Object.values(stats.combatMethods).reduce((a,b) => a+b,0)).toBe(t.combatFights);
    expect(stats.gameSamples).toHaveLength(100);
    expect(t.deaths).toBe(2300);
    expect(t.unknownMethods).toBe(0);
    const original = sampleRun!, changed = structuredClone(original);
    changed.events.forEach(e => { e.text = 'A passage without combat keywords.'; });
    const reclassified = emptyDemoStats(); addDemoRun(reclassified, changed);
    const unchanged = emptyDemoStats(); addDemoRun(unchanged, original);
    expect(reclassified.totals.combatFights).toBe(unchanged.totals.combatFights);
    expect(reclassified.totals.heldWeaponAttacks).toBe(unchanged.totals.heldWeaponAttacks);
    const attack = changed.events.find(e => e.combat?.weaponItemId)!;
    attack.combat!.weaponItemId = 'invented-weapon';
    expect(RunRecordSchema.safeParse(changed).success).toBe(false);
  }, 60_000);

  it.each([2, 3, 12, 48])('scales opening pressure and preserves replay validation for %i contestants', size => {
    const cast = { ...demoCast, players: Array.from({ length: size }, (_, i) => ({ id: `p${i}`, name: `Player ${i}`, traits: [] })) };
    const run = generateRun({ cast, settings: { ...demoSettings, seed: `opening-size-${size}` }, content: defaultContentPack, lore: { facts: [] } }, narrativeAdapter);
    expect(RunRecordSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
    const openingDeaths = run.events.filter(e => e.phase.kind === 'opening').flatMap(e => e.facts.filter(f => f.type === 'elimination')).length;
    expect(openingDeaths).toBeLessThanOrEqual(Math.floor(size / 2));
    expect(openingDeaths).toBeGreaterThan(0);
  });
});
