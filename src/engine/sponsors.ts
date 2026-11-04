import type { EventTemplate } from '../domain';

export const MAX_SPONSOR_GIFTS = 2;
const districtChances = [0.025, 0.0225, 0.02, 0.0175, 0.015, 0.0125, 0.01, 0.009, 0.008, 0.007, 0.006, 0.005];

/** Chance per ordinary day/night assignment; custom or absent teams use 1.5%. */
export function sponsorChance(team?: string): number {
  const district = /^district\s+(\d+)$/i.exec(team?.trim() ?? '');
  return (district && districtChances[Number(district[1]) - 1]) || 0.015;
}

export function isSponsorGift(template: Pick<EventTemplate, 'id'>): boolean {
  return template.id.startsWith('sponsor-gift-');
}
