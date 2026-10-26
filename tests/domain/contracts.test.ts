import { describe, expect, it } from 'vitest';
import { canonicalRunId, canonicalStringify, parseJson, RunRecordSchema, validateCast, validateContentPack, validateRunEnvelope } from '../../src/domain';
import { exampleCast, exampleCastEnvelope, fixtureInput, fixturePack, fixtureRun, invalidCast, invalidCastExpectedPath } from '../fixtures';

describe('shared executable contracts', () => {
  it('accepts direct and enveloped casts, normalizes optional fields, preserves literal names', () => {
    expect(validateCast(exampleCast)).toEqual({ success: true, data: exampleCast });
    expect(validateCast(exampleCastEnvelope)).toEqual({ success: true, data: exampleCast });
    const cast = structuredClone(exampleCast); cast.players[0].name = '<script>literal</script>';
    expect(validateCast(cast).success).toBe(true);
  });
  it('reports duplicate identities and invalid relationships at their fields', () => {
    const result = validateCast(invalidCast);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.some(e => e.path === invalidCastExpectedPath)).toBe(true);
    expect(validateCast({ ...exampleCast, relationships: [{ from: 'alex', to: 'riley', trust: 101, grudge: 0 }] }).success).toBe(false);
    expect(validateCast({ ...exampleCast, relationships: [{ from: 'missing', to: 'riley', trust: 0, grudge: 0 }] }).success).toBe(false);
  });
  it('rejects unsupported versions without silently casting', () => {
    const result = validateCast({ ...exampleCastEnvelope, schemaVersion: 9 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors[0].path).toBe('schemaVersion');
  });
  it('rejects unknown mechanics, bad item/role references, marker types, placeholders and asymmetric graphs', () => {
    for (const effect of [{ kind: 'executeCode', source: 'alert(1)' }, { kind: 'createItem', role: 'actor', definitionId: 'missing' }, { kind: 'eliminate', role: 'missing' }, { kind: 'setMarker', role: 'actor', marker: 'stolen-from', value: true }]) {
      const pack = structuredClone(fixturePack); pack.events[0].effects = [effect as never];
      expect(validateContentPack(pack).success).toBe(false);
    }
    const pack = structuredClone(fixturePack); pack.events[0].variants = ['{unknown.name} escapes.'];
    expect(validateContentPack(pack).success).toBe(false);
    pack.events[0].variants = ['{actor.name} escapes.']; pack.biomes[0].adjacent = ['mountains'];
    expect(validateContentPack(pack).success).toBe(false);
  });
  it('validates a complete recorded replay and cursor boundaries', () => {
    expect(RunRecordSchema.safeParse(fixtureRun).success).toBe(true);
    expect(validateRunEnvelope({ kind: 'run', schemaVersion: 1, run: fixtureRun, cursor: 1 }).success).toBe(true);
    expect(validateRunEnvelope({ kind: 'run', schemaVersion: 1, run: fixtureRun, cursor: 2 }).success).toBe(false);
    const bad = structuredClone(fixtureRun); bad.events[0].state.players[1].alive = true;
    expect(RunRecordSchema.safeParse(bad).success).toBe(false);
  });
  it('canonicalizes key order and uses full inputs for stable identity', () => {
    expect(canonicalStringify({ b: 2, a: 1 })).toBe(canonicalStringify({ a: 1, b: 2 }));
    expect(canonicalRunId(fixtureInput)).toBe(fixtureRun.id);
    expect(canonicalRunId({ ...fixtureInput, settings: { ...fixtureInput.settings, seed: 'different' } })).not.toBe(fixtureRun.id);
  });
  it('returns a friendly JSON parse failure without throwing', () => {
    expect(parseJson('{bad')).toEqual({ success: false, errors: [{ code: 'invalid_json', path: '$', message: 'This file is not valid JSON. Check commas and quotation marks.' }] });
  });
});
