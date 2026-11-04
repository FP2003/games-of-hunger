import type { Relationship } from './schemas';

export const relationshipStatuses = ['devoted', 'trusted', 'friendly', 'neutral', 'wary', 'rival', 'nemesis'] as const;
export type RelationshipStatus = typeof relationshipStatuses[number];
export const relationshipLabels: Record<RelationshipStatus, string> = {
  devoted: 'Devoted', trusted: 'Trusted', friendly: 'Friendly', neutral: 'Neutral', wary: 'Wary', rival: 'Rival', nemesis: 'Nemesis',
};
export const relationshipColours: Record<RelationshipStatus, string> = {
  devoted: '#56c98b', trusted: '#a8db91', friendly: '#70c9bd', neutral: '#82958f', wary: '#e4b867', rival: '#ee978e', nemesis: '#c44558',
};
// Keep crimson strokes dark, with a brighter text colour for small labels.
export const relationshipTextColours: Record<RelationshipStatus, string> = { ...relationshipColours, nemesis: '#ed8796' };
export const relationshipPresets: Record<RelationshipStatus, Pick<Relationship, 'trust' | 'grudge'>> = {
  devoted: { trust: 90, grudge: 0 }, trusted: { trust: 60, grudge: 0 }, friendly: { trust: 25, grudge: 0 },
  neutral: { trust: 0, grudge: 0 }, wary: { trust: -25, grudge: 0 }, rival: { trust: -50, grudge: 60 }, nemesis: { trust: -90, grudge: 90 },
};

/** Grudges take precedence over trust; labels do not change simulation rules. */
export function relationshipStatus(edge?: Pick<Relationship, 'trust' | 'grudge'>): RelationshipStatus {
  if (!edge) return 'neutral';
  if (edge.grudge >= 80) return 'nemesis';
  if (edge.grudge >= 40) return 'rival';
  if (edge.trust >= 80) return 'devoted';
  if (edge.trust >= 40) return 'trusted';
  if (edge.trust >= 20) return 'friendly';
  if (edge.trust <= -20) return 'wary';
  return 'neutral';
}
