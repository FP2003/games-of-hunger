/** Keep the standard 24-player opening profile and give duos a full opening beat. */
export function openingCasualtyBudget(entrants: number, sampled: number) {
  if (entrants === 2) return 0;
  const largeCastExtra = Math.max(0, Math.round((entrants - 24) / 8));
  return Math.min(Math.floor(entrants / 2), Math.max(1, Math.round(sampled * entrants / 24) + largeCastExtra));
}

/** Large default games can narrow the field before the Day 6 deadline. */
export function narrowingChance(entrants: number, survivors: number, day: number) {
  if (entrants <= 24 || day < 3 || survivors <= [0, 0, 0, 12, 8, 5][day]) return 0;
  return Math.min(0.55, (entrants - 24) / 45);
}
