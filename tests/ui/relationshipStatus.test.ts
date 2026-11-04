import { describe, expect, it } from 'vitest';
import { relationshipStatus, relationshipStatuses, relationshipPresets } from '../../src/domain/relationshipStatus';

describe('relationship status bands', () => {
  it.each([
    [-100, 0, 'wary'], [-20, 0, 'wary'], [-19, 0, 'neutral'], [19, 0, 'neutral'],
    [20, 0, 'friendly'], [39, 0, 'friendly'], [40, 0, 'trusted'], [79, 0, 'trusted'],
    [80, 0, 'devoted'], [100, 39, 'devoted'], [100, 40, 'rival'], [100, 79, 'rival'], [100, 80, 'nemesis'],
  ] as const)('classifies trust %i / grudge %i as %s', (trust, grudge, status) => {
    expect(relationshipStatus({ trust, grudge })).toBe(status);
  });
  it('treats missing opinions as neutral and round trips every starting preset', () => {
    expect(relationshipStatus()).toBe('neutral');
    for (const status of relationshipStatuses) expect(relationshipStatus(relationshipPresets[status])).toBe(status);
  });
});
