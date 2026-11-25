import type { Relationship, RivalryEvidence } from './schemas';

export const CAMPAIGN_SEASONS = 6;
export const campaignGrudgeWeights: Record<RivalryEvidence['kind'], number> = {
  theft: 20, betrayal: 30, grudge: 45, reconciliation: -22,
};

/** Apply after cast presets and personality initialization. Evidence belongs to the replay input. */
export function applyCampaignGrudges(relationships: Relationship[], evidence: readonly RivalryEvidence[]) {
  const scores = new Map<string, { from: string; to: string; score: number }>();
  for (const { from, to, kind, age } of evidence) {
    const key = JSON.stringify([from, to]);
    const pair = scores.get(key) ?? { from, to, score: 0 };
    pair.score += Math.round(campaignGrudgeWeights[kind] * 0.8 ** age);
    scores.set(key, pair);
  }
  for (const { from, to, score } of scores.values()) {
    const grudge = Math.min(55, score);
    if (grudge <= 0) continue;
    const existing = relationships.find(edge => edge.from === from && edge.to === to);
    const trustPenalty = Math.floor(grudge / 2);
    if (existing) {
      existing.grudge = Math.min(100, existing.grudge + grudge);
      existing.trust = Math.max(-100, existing.trust - trustPenalty);
    } else relationships.push({ from, to, trust: -trustPenalty, grudge });
  }
}
