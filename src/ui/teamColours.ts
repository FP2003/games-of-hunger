import type { CSSProperties } from 'react';

// District identities stay consistent across casts, reordering and saved games.
const districtColours = [
  '#efbd62', '#ee8e88', '#78c9eb', '#68d6c0',
  '#c4b0f0', '#ed9bc3', '#a4ce73', '#8faff0',
  '#ded477', '#e8a277', '#72c18c', '#b6becb',
];

export function teamStyle(team?: string): CSSProperties {
  const label = team?.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!label) return {};
  const district = /^district (\d+)$/.exec(label);
  const number = district ? Number(district[1]) : 0;
  let colour = districtColours[number - 1];
  if (!colour) {
    // Custom teams also have a stable identity without depending on cast order.
    let hash = 0;
    for (const character of label) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
    colour = `hsl(${hash % 360} 60% 72%)`;
  }
  return { '--team-colour': colour } as CSSProperties;
}
