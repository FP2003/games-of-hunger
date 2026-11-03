import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import cast from '../../src/content/casts/season2.json';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, type EventTemplate, type RunInput, type Trait } from '../../src/domain';
import { applyEffects, createRandom, findBindings, generateRun, initialState } from '../../src/engine';
import { narrativeAdapter } from '../../src/narrative';

// Count authored assistance/alliance events, not every social scene or every
// wording variant. A betrayal and a theft are social, but are not cooperation.
const cooperative = (template: EventTemplate) => template.effects.some(e => e.kind === 'relationship' && (e.fact === 'assistance' || e.fact === 'alliance'));
const name = (id: string) => cast.players.find(p => p.id === id)!.name;
const setup = (seed: string, mixed = false): RunInput => {
  const traits: Trait[][] = [['loyal','grudge'],['disloyal','sneaky'],['agile','reckless'],['perceptive','resourceful'],['weak-constitution','cautious'],['love-hate','dramatic']];
  return { cast: { ...cast, version: 1, players: cast.players.map((p,i) => ({ ...p, traits: mixed ? traits[i%traits.length] : [] })) }, content: defaultContentPack, settings: { ...DEFAULT_SETTINGS, seed }, lore: { facts: [] } };
};

describe('cooperative scenes and natural game frequency', () => {
  it('lets 2, 3 and 4 distinct living local tributes share watch, with real relationship effects', () => {
    for (const count of [2,3,4]) {
      const input = setup('controlled-watch');
      input.cast.players = input.cast.players.slice(0,count);
      const state = initialState(input);
      const template = input.content.events.find(t => t.id === `night-watch-${count}`)!;
      const available = state.players.map(p => p.id), anchor = available[0];
      const bindings = findBindings(template, state, input.cast, input.content, available, anchor, createRandom('watch'))!;
      expect(bindings).not.toBeNull();
      expect(new Set(Object.values(bindings)).size).toBe(count);
      const result = applyEffects(state, template.effects, bindings, input.content, createRandom('watch'))!;
      expect(result).not.toBeNull();
      expect(result.state.players.every(p=>p.alive)).toBe(true);
      expect(result.facts.filter(f=>f.type==='assistance')).toHaveLength(count-1);
      expect(result.state.relationships.filter(r=>r.trust===15)).toHaveLength(2*(count-1));
      expect(findBindings(template,state,input.cast,input.content,available.slice(0,-1),anchor,createRandom('watch'))).toBeNull();
      state.players[count-1].alive=false;
      expect(findBindings(template,state,input.cast,input.content,available,anchor,createRandom('watch'))).toBeNull();
    }
  });

  it('measures cooperation without forcing event choices in 24 complete games', () => {
    const templates = defaultContentPack.events.filter(cooperative);
    const templateById = new Map(defaultContentPack.events.map(t=>[t.id,t]));
    const frequency: Record<string, { events: number; games: number }> = {};
    const summaries = [], samples = [];
    for (let i=1; i<=24; i++) {
      const input = setup(`cooperation-audit-${i}`,i>16);
      const run = generateRun(input,narrativeAdapter);
      const seen = new Set<string>(), usedByPhase = new Map<number,Set<string>>();
      let before = run.initialState;
      const cooperativeEvents = run.events.filter(e=>{ const t=templateById.get(e.templateId); return t && cooperative(t); });
      for (const event of run.events) {
        const used = usedByPhase.get(event.phase.index) ?? new Set<string>();
        for (const id of Object.values(event.bindings)) {
          expect(used.has(id), `${input.settings.seed}: double assignment ${id}`).toBe(false);
          used.add(id);
        }
        usedByPhase.set(event.phase.index,used);
        const template = templateById.get(event.templateId);
        if (template && cooperative(template)) {
          const participants = Object.values(event.bindings);
          expect(new Set(participants).size).toBe(participants.length);
          expect(participants.every(id=>before.players.find(p=>p.id===id)?.alive)).toBe(true);
          expect(participants.every(id=>event.state.players.find(p=>p.id===id)?.alive)).toBe(true);
          if (template.scope==='local') expect(new Set(participants.map(id=>before.players.find(p=>p.id===id)!.biome)).size).toBe(1);
          expect(event.facts.some(f=>f.type==='assistance'||f.type==='alliance')).toBe(true);
          expect(event.text).not.toMatch(/\bthe item\b|\{(?:actor|target|third|fourth|pursuer)\./);
          if ('pursuer' in event.bindings && event.confessional) expect(event.confessional.speakerId).not.toBe(event.bindings.pursuer);
          if (event.templateId.startsWith('night-watch-')) expect(event.phase.kind).toBe('night');
          frequency[event.templateId] ??= {events:0,games:0};
          frequency[event.templateId].events++;
          seen.add(event.templateId);
          samples.push({seed:input.settings.seed,day:event.phase.day,phase:event.phase.kind,templateId:event.templateId,participants:participants.map(name),text:event.text,confessional:event.confessional?{speaker:name(event.confessional.speakerId),text:event.confessional.text}:null});
        }
        before=event.state;
      }
      for(const id of seen) frequency[id].games++;
      const newGroups=cooperativeEvents.filter(e=>e.templateId.startsWith('group-'));
      summaries.push({seed:input.settings.seed,cast:i>16?'mixed traits':'shipped cast, no traits',events:run.events.length,day:run.events.at(-1)!.phase.day,cooperativeEvents:cooperativeEvents.length,uniqueCooperativeTemplates:seen.size,newGroupEvents:newGroups.length,uniqueNewGroups:new Set(newGroups.map(e=>e.templateId)).size,namedRescues:newGroups.filter(e=>'pursuer' in e.bindings).length,watches2:cooperativeEvents.filter(e=>e.templateId==='night-watch-2').length,watches3:cooperativeEvents.filter(e=>e.templateId==='night-watch-3').length,watches4:cooperativeEvents.filter(e=>e.templateId==='night-watch-4').length,helpAgainstUnnamedThreat:cooperativeEvents.filter(e=>['ally-decoy','mirror-warning','opening-pull-to-cover','shelter-offer'].includes(e.templateId)).length});
      expect(run.events.at(-1)!.state.players.filter(p=>p.alive)).toHaveLength(1);
    }
    expect(Object.values(frequency).reduce((total,f)=>total+f.events,0)).toBeGreaterThan(0);
    for (const id of ['night-watch-2','night-watch-3','night-watch-4']) expect(frequency[id]?.events,id).toBeGreaterThan(0);
    expect(Object.keys(frequency).filter(id=>id.startsWith('group-')).length).toBeGreaterThanOrEqual(5);
    expect(summaries.reduce((total,s)=>total+s.namedRescues,0)).toBeGreaterThan(0);
    const output=process.env.COOPERATION_REPORT_DIR;
    if (output) {
      mkdirSync(output,{recursive:true});
      const inventory=templates.map(t=>({id:t.id,roles:t.roles.map(r=>r.id),phases:t.phases,text:t.variants[0]}));
      const multiRole=defaultContentPack.events.filter(t=>t.roles.length>=3).map(t=>({id:t.id,roles:t.roles.map(r=>r.id),cooperative:cooperative(t),text:t.variants[0]}));
      writeFileSync(`${output}/summary.json`,JSON.stringify({definition:'Templates with structured assistance or alliance effects; variants count once.',inventory,multiRole,frequency,summaries,samples},null,2));
      writeFileSync(`${output}/examples.md`,samples.map(e=>`**${e.seed} — ${e.phase} ${e.day} — ${e.templateId}**\n\n${e.text}${e.confessional?`\n\n> ${e.confessional.speaker}: ${e.confessional.text}`:''}`).join('\n\n'));
    }
  },60000);
});
