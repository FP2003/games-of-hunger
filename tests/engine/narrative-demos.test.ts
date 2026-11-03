import { mkdirSync, writeFileSync } from 'node:fs';
import { afterAll, expect, it } from 'vitest';
import cast from '../../src/content/casts/season2.json';
import { defaultContentPack } from '../../src/content';
import { actionWording } from '../../src/content/action-wording';
import { DEFAULT_SETTINGS, ENGINE_VERSION, type RunInput, type Trait, type NarrativeAdapter } from '../../src/domain';
import { generateRun } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';

function runDemo(number: number) {
  const traits: Trait[][] = [['loyal','grudge'],['disloyal','sneaky'],['agile','reckless'],['perceptive','resourceful'],['weak-constitution','cautious'],['love-hate','dramatic']];
    const mixed = number>=13;
    const input: RunInput = { cast: { ...cast, version: 1, players: cast.players.map((p,i) => ({ ...p, traits: mixed ? traits[i%traits.length] : [] })) }, content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed: `demo-audit-${number}` }, lore: { facts: [] } };
    let rewrittenActions = 0;
    const narrator: NarrativeAdapter = { ...narrativeAdapter, renderEvent(ctx) { const result = narrativeAdapter.renderEvent(ctx); if (actionWording[ctx.template.id]?.includes(result.wording!)) rewrittenActions++; return result; } };
    const run = generateRun(input, narrator);
    const interviews = run.events.flatMap(e => e.confessional ? [e.confessional.text] : []);
    expect(new Set(interviews).size, input.settings.seed).toBe(interviews.length);
    expect(run.events.at(-1)!.state.players.filter(p=>p.alive).map(p=>p.id)).toEqual([run.winnerId]);
    expect(run.events.every(e => !/\{(?:actor|target|speaker)\./.test(e.text))).toBe(true);
    for (const event of run.events.filter(e => e.confessional && e.facts.some(f => f.type === 'elimination'))) {
      expect(defaultContentPack.confessionals.find(t => t.id === event.confessional!.templateId)!.triggers).toContain('elimination');
    }
    const name = (id: string) => input.cast.players.find(p => p.id===id)!.name;
    const delivery = run.events.find(e => e.templateId.startsWith('podium-resupply'));
    const summary = { seed: input.settings.seed, cast: mixed ? 'mixed traits' : 'shipped cast, no traits', winner: name(run.winnerId), day: run.events.at(-1)!.phase.day, events: run.events.length, uniqueTemplates: new Set(run.events.map(e=>e.templateId)).size, exactEventRepeats: run.events.length-new Set(run.events.map(e=>e.text)).size, interviews: interviews.length, exactInterviewRepeats: interviews.length-new Set(interviews).size, rewrittenActions, resupplyRecipient: delivery ? name(delivery.bindings.actor) : null, finalInterview: run.events.at(-1)!.confessional?.text ?? null };
    const transcript = `# ${summary.seed}\n\n${summary.cast}; winner: ${summary.winner}; Day ${summary.day}; resupply: ${summary.resupplyRecipient}.\n\n` + run.events.map(e => `**${e.sequence+1}. ${e.phase.kind} ${e.phase.day} — ${e.templateId}**\n\n${e.text}${e.confessional ? `\n\n> ${name(e.confessional.speakerId)}${e.confessional.exit ? ' (exit)' : ''}: ${e.confessional.text}` : ''}`).join('\n\n');
    if (number===1) {
      const repeat = generateRun(input, narrativeAdapter);
      expect(repeat.events.map(e => [e.templateId,e.bindings,e.text,e.confessional])).toEqual(run.events.map(e => [e.templateId,e.bindings,e.text,e.confessional]));
    }
    return { summary, transcript };
}

const exported: ReturnType<typeof runDemo>[] = [];
it.each([1,2,3,4,5,6,7,8,13,14,15,16])('keeps interviews unique through complete demo game %i', number => {
  exported.push(runDemo(number));
});

afterAll(() => {
  // Optional, reusable transcript export; ordinary test runs do not write files.
  const output = process.env.NARRATIVE_DEMO_DIR;
  if (output) {
    mkdirSync(output, { recursive: true });
    writeFileSync(`${output}/demos.md`, exported.map(demo => demo.transcript).join('\n\n---\n\n'));
    writeFileSync(`${output}/summary.json`, JSON.stringify({ engineVersion: ENGINE_VERSION, standaloneActionScenarios: Object.keys(actionWording).length, standaloneActionVariants: Object.values(actionWording).flat().length, summaries: exported.map(demo => demo.summary) }, null, 2));
  }
});
