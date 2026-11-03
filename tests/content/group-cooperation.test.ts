import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { groupCooperation } from '../../src/content/cooperation';
import { DEFAULT_SETTINGS, type EventNarrativeInput, type EventTemplate, type RunInput } from '../../src/domain';
import { applyEffects, createRandom, findBindings, initialState } from '../../src/engine';
import { renderTemplate, selectConfessional } from '../../src/narrative';

function setup(template: EventTemplate) {
  const input: RunInput = { cast: { version: 1, title: 'Group scenarios', players: ['Alex','Blair','Casey','Drew'].map((name,i)=>({id:`p${i}`,name,traits:[]})), relationships: [] }, content: defaultContentPack, settings: {...DEFAULT_SETTINGS,seed:'group-test'}, lore: {facts:[]} };
  let state=initialState(input);
  for (const condition of template.conditions) {
    if (condition.kind==='item' && condition.definitionId) state=applyEffects(state,[{kind:'createItem',role:condition.role,definitionId:condition.definitionId}],{actor:'p0',target:'p1',third:'p2',fourth:'p3',pursuer:'p2'},input.content,createRandom('gear'))!.state;
    if (condition.kind==='marker' && condition.exists) state.players[1].markers[condition.marker]=true;
  }
  const available=input.cast.players.slice(0,template.roles.length).map(p=>p.id);
  return {input,state,available};
}

describe('authored group cooperation',()=>{
  it('commits every new activity and renders distinct complete alternatives naming every participant',()=>{
    for (const template of groupCooperation) {
      const {input,state,available}=setup(template);
      const bindings=findBindings(template,state,input.cast,input.content,available,'p0',createRandom('bind'))!;
      expect(bindings,template.id).not.toBeNull();
      const result=applyEffects(state,template.effects,bindings,input.content,createRandom('effects'),0,[],input)!;
      expect(result,template.id).not.toBeNull();
      expect(result.state.players.every(p=>p.alive)).toBe(true);
      expect(template.variants,template.id).toHaveLength(8);
      expect(new Set(template.variants).size,template.id).toBe(8);
      const ctx: EventNarrativeInput={...input,template,bindings,before:state,after:result.state,facts:result.facts,phase:{kind:template.phases[0],index:1,day:1},sequence:0,random:createRandom('prose')};
      for (const variant of template.variants) {
        const text=renderTemplate(variant,ctx);
        expect(text).not.toMatch(/\{[^}]+\}|their the item|the item\b/);
        for (const id of Object.values(bindings)) expect(text,template.id).toContain(input.cast.players.find(p=>p.id===id)!.name);
      }
      const absent=available.slice(0,-1);
      expect(findBindings(template,state,input.cast,input.content,absent,'p0',createRandom('bind'))).toBeNull();
      const split=structuredClone(state); split.players.find(p=>p.id===available.at(-1))!.biome='forest';
      expect(findBindings(template,split,input.cast,input.content,available,'p0',createRandom('bind'))).toBeNull();
    }
  });

  it('credits the helper and gives the named pursuer the correct hostile relationships without a death',()=>{
    for (const template of groupCooperation.filter(t=>t.roles.some(r=>r.id==='pursuer'))) {
      const {input,state,available}=setup(template);
      const bindings={actor:'p0',target:'p1',pursuer:'p2'};
      const result=applyEffects(state,template.effects,bindings,input.content,createRandom('rescue'),0,[],input)!;
      expect(result.facts).toContainEqual({type:'assistance',actorId:'p0',targetId:'p1'});
      expect(result.facts.some(f=>f.type==='elimination')).toBe(false);
      expect(result.state.relationships).toEqual(expect.arrayContaining([
        {from:'p1',to:'p0',trust:30,grudge:0},
        {from:'p1',to:'p2',trust:-35,grudge:40},
        {from:'p2',to:'p0',trust:-20,grudge:20},
      ]));
      expect(result.state.items).toEqual(state.items);
      const dead=structuredClone(state); dead.players[2].alive=false;
      expect(findBindings(template,dead,input.cast,input.content,available,'p0',createRandom('bind'))).toBeNull();
      // A Loyal pursuer must not be made to attack a mutual ally.
      input.cast.players.forEach(p=>{p.traits=['loyal'];});
      state.relationships=available.flatMap(from=>available.filter(to=>to!==from).map(to=>({from,to,trust:50,grudge:0})));
      expect(findBindings(template,state,input.cast,input.content,available,'p0',createRandom('bind'))).toBeNull();
    }
  });

  it('gives each search participant their own real supply item',()=>{
    for (const id of ['group-food-search','group-water-collection']) {
      const template=groupCooperation.find(t=>t.id===id)!;
      const {input,state}=setup(template);
      const result=applyEffects(state,template.effects,{actor:'p0',target:'p1',third:'p2'},input.content,createRandom('supplies'))!;
      const created=result.facts.filter(f=>f.type==='acquire');
      expect(created).toHaveLength(3);
      expect(new Set(created.map(f=>f.itemId)).size).toBe(3);
      expect(new Set(created.map(f=>f.actorId))).toEqual(new Set(['p0','p1','p2']));
      for (const fact of created) expect(result.state.items.find(item=>item.id===fact.itemId)?.ownerId).toBe(fact.actorId);
    }
  });

  it('does not give the foiled pursuer an interview thanking someone for helping',()=>{
    const template=groupCooperation.find(t=>t.id==='group-door-rescue')!;
    const {input,state}=setup(template),bindings={actor:'p0',target:'p1',pursuer:'p2'};
    const result=applyEffects(state,template.effects,bindings,input.content,createRandom('interview'))!;
    const interview=selectConfessional({...input,template,bindings,before:state,after:result.state,facts:result.facts,phase:{kind:'day',index:1,day:1},sequence:0,usedThisPhase:[],lastUsed:{},random:{next:()=>0.99,int:max=>max-1,pick:values=>values.at(-1)!}});
    expect(interview).not.toBeNull();
    expect(['p0','p1']).toContain(interview!.speakerId);
  });

  it('requires the real earlier thigh wound and credits both helpers for stopping its bleeding',()=>{
    const template=groupCooperation.find(t=>t.id==='group-injured-escort')!;
    const {input,state,available}=setup(template);
    const result=applyEffects(state,template.effects,{actor:'p0',target:'p1',third:'p2'},input.content,createRandom('treatment'))!;
    expect(result.state.players[1].markers['bleeding-thigh']).toBeUndefined();
    expect(result.facts.filter(f=>f.type==='assistance')).toEqual([
      {type:'assistance',actorId:'p0',targetId:'p1'}, {type:'assistance',actorId:'p2',targetId:'p1'},
    ]);
    expect(findBindings(template,result.state,input.cast,input.content,available,'p0',createRandom('bind'))).toBeNull();
  });
});
