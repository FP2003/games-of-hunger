import { demoCast } from '../src/analytics/demo';
import { pairedInterval, type PairCounts } from '../src/analytics/traits';
import { defaultContentPack } from '../src/content';
import { DEFAULT_SETTINGS, ENGINE_VERSION, TRAITS, type EventNarrativeInput } from '../src/domain';
import { createOutcomeSimulator, createRandom } from '../src/engine';
import { combatRecord } from '../src/engine/combat';
import { narrativeAdapter } from '../src/narrative';

export const scenarios = ['neutral', 'mixed'] as const;
type Scenario = typeof scenarios[number];
type Observation = { won: boolean; encounters: number; combat: number; rounds: number; exit: string; exitDay: number | null };
export type Pair = { scenario: Scenario; index: number; control: Observation; treatment: Observation };
const opponentTraits = TRAITS.filter(trait => trait !== 'loud');
const settings = { ...DEFAULT_SETTINGS, loreCarryover: false };

export function makeRunner(namespace: string) {
  const focalEliminated = Symbol('focal eliminated');
  let observe: (context: EventNarrativeInput) => void;
  const simulate = createOutcomeSimulator({ cast: demoCast, content: defaultContentPack, settings, lore: { facts: [] } }, {
    renderEvent(context) {
      observe(context);
      return narrativeAdapter.renderEvent(context);
    },
    selectConfessional: () => null,
  });
  const measure = (cast: typeof demoCast, seed: string, focal: string): Observation => {
    const rounds = new Set<number>();
    let encounters = 0, combat = 0, exit = 'winner', exitDay: number | null = null;
    observe = context => {
      const { before, after, template, bindings, phase, content } = context;
      if (!before.players.some(player => player.id === focal && player.alive)) return;
      rounds.add(phase.index);
      const participants = new Set(Object.values(bindings));
      if (participants.has(focal) && participants.size > 1) {
        encounters++;
        if (combatRecord(template, bindings, before, after, content)) combat++;
      }
      if (after.players.some(player => player.id === focal && !player.alive)) {
        exit = phase.kind;
        exitDay = phase.day;
        // Every measurement for a losing focal tribute is now fixed.
        throw focalEliminated;
      }
    };
    let won = false;
    try {
      won = simulate(cast, seed) === focal;
    } catch (error) {
      if (error !== focalEliminated) throw error;
    }
    if (won !== (exit === 'winner')) throw new Error('Winner and elimination observation disagree');
    return { won, encounters, combat, rounds: rounds.size, exit, exitDay };
  };
  return {
    measure,
    pair(scenario: Scenario, index: number): Pair {
      const seed = `${namespace}:${scenario}:game:${index}`;
      const seat = createRandom(`${namespace}:${scenario}:seat:${index}`).int(demoCast.players.length);
      const random = createRandom(`${namespace}:${scenario}:opponents:${index}`);
      const cast = structuredClone(demoCast);
      const focal = cast.players[seat];
      if (scenario === 'mixed') {
        for (const player of cast.players) {
          if (player !== focal) player.traits = [random.pick(opponentTraits)];
        }
      }
      const control = measure(cast, seed, focal.id);
      focal.traits = ['loud'];
      const treatment = measure(cast, seed, focal.id);
      return { scenario, index, control, treatment };
    },
  };
}

export function report(namespace: string, target: number, pairs: Pair[], selectedScenarios: readonly Scenario[] = scenarios) {
  return {
    namespace, target, engineVersion: ENGINE_VERSION, contentVersion: defaultContentPack.version,
    settings, mixedOpponentTraits: opponentTraits,
    scenarios: selectedScenarios.map(scenario => {
      const sample = pairs.filter(row => row.scenario === scenario);
      const counts: PairCounts = { neither: 0, baselineOnly: 0, treatmentOnly: 0, both: 0 };
      for (const { control, treatment } of sample) {
        counts[control.won ? treatment.won ? 'both' : 'baselineOnly' : treatment.won ? 'treatmentOnly' : 'neither']++;
      }
      const summarize = (arm: 'control' | 'treatment') => {
        let wins = 0, encounters = 0, combat = 0, rounds = 0;
        const exitPhase: Record<string, number> = {}, exitDay: Record<string, number> = {};
        for (const pair of sample) {
          const observation = pair[arm];
          wins += Number(observation.won);
          encounters += observation.encounters;
          combat += observation.combat;
          rounds += observation.rounds;
          exitPhase[observation.exit] = (exitPhase[observation.exit] ?? 0) + 1;
          const day = observation.exitDay ?? 'winner';
          exitDay[day] = (exitDay[day] ?? 0) + 1;
        }
        return {
          wins, encounters, combat, rounds, exitPhase, exitDay,
          winRate: sample.length ? 100 * wins / sample.length : null,
          encountersPerGame: sample.length ? encounters / sample.length : null,
          encountersPer100LivingRounds: rounds ? 100 * encounters / rounds : null,
          combatPer100LivingRounds: rounds ? 100 * combat / rounds : null,
        };
      };
      const interval = pairedInterval(counts, selectedScenarios.length);
      const n = sample.length;
      const effect = n ? (counts.treatmentOnly - counts.baselineOnly) / n : 0;
      // Independent seed pairs give differences of -1, 0, or +1.
      const standardError = n > 1 ? Math.sqrt(Math.max(0, (counts.treatmentOnly + counts.baselineOnly) / n - effect ** 2) / (n - 1)) : null;
      const upper = standardError === null ? null : 100 * (effect + 1.6448536269514722 * standardError);
      return {
        scenario, pairs: sample.length, games: 2 * sample.length, counts,
        control: summarize('control'), treatment: summarize('treatment'),
        effectPp: sample.length ? 100 * (counts.treatmentOnly - counts.baselineOnly) / sample.length : null,
        simultaneous95IntervalPp: interval,
        ...(selectedScenarios.length === 1 ? { oneSided95UpperPp: upper } : {}),
        meaningfulPenalty: n === target && (selectedScenarios.length === 1 ? upper !== null && upper < -1 : interval[1] < -1),
      };
    }),
  };
}
