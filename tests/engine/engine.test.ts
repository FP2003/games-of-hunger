import { describe, expect, it } from 'vitest';
import { generateRun, applyEffects, createRandom, findBindings, initialState, getNemesis, getAlliances, computeAwards } from '../../src/engine';
import { fixtureInput, fixturePack, exampleCast } from '../fixtures';
import { ContentPackSchema, RunRecordSchema, type NarrativeAdapter, type RunInput, type GameState, type EventTemplate, type EventRecord, type ContentPack } from '../../src/domain';

const narrative: NarrativeAdapter = {
  renderEvent(input) { const text=input.random.pick(input.template.variants); return { text:text.replace(/\{([^{}.]+)\.name\}/g,(_,role:string)=>input.cast.players.find(p=>p.id===input.bindings[role])!.name).replace(/\{biome\}/g,input.after.players.find(p=>p.id===Object.values(input.bindings)[0])!.biome) }; },
  selectConfessional() { return null; },
};
const arenaPack=ContentPackSchema.parse({...fixturePack,events:[{...fixturePack.events[0],id:'race',phases:['day','night','finale']}]});
function input(size=4,seed='engine-test'): RunInput {return {...structuredClone(fixtureInput),content:structuredClone(arenaPack),settings:{...fixtureInput.settings,seed},cast:{version:1,title:'Test cast',relationships:[],players:Array.from({length:size},(_,i)=>({id:`p${i}`,name:`Player ${i}`,traits:[]}))}};}
function assertInvariants(run:ReturnType<typeof generateRun>) {
  expect(RunRecordSchema.safeParse(run).success).toBe(true);let before=run.initialState;const assignments=new Map<number,Set<string>>();
  for(const event of run.events) {
    const assigned=assignments.get(event.phase.index)??new Set<string>();
    for(const id of Object.values(event.bindings)) {expect(before.players.find(p=>p.id===id)?.alive).toBe(true);expect(assigned.has(id)).toBe(false);assigned.add(id);}
    assignments.set(event.phase.index,assigned);
    expect(new Set(event.state.items.map(i=>i.id)).size).toBe(event.state.items.length);
    for(const item of event.state.items) if(item.ownerId)expect(event.state.players.find(p=>p.id===item.ownerId)?.alive).toBe(true);
    for(const player of before.players.filter(p=>!p.alive))expect(event.state.players.find(p=>p.id===player.id)?.alive).toBe(false);
    expect(event.state.players.filter(p=>p.alive).length).toBeGreaterThan(0);before=event.state;
  }
  expect(before.players.filter(p=>p.alive).map(p=>p.id)).toEqual([run.winnerId]);expect(run.placements).toHaveLength(run.input.cast.players.length);
}

describe('deterministic complete simulation',()=>{
  it('produces a complete two-player and larger repeatable run',()=>{for(const size of [2,12]){const setup=input(size);expect(generateRun(setup,narrative)).toEqual(generateRun(setup,narrative));assertInvariants(generateRun(setup,narrative));}});
  it('sweeps cast boundaries and every danger with invariant checks',()=>{for(const size of [2,3,12,24,48])for(const danger of ['low','normal','high'] as const)for(let seed=0;seed<4;seed++){const setup=input(size,`sweep-${seed}`);setup.settings.danger=danger;assertInvariants(generateRun(setup,narrative));}});
  it('terminates under empty ordinary eligibility and impossible content',()=>{const setup=input(12);setup.content={...fixturePack,events:[{...fixturePack.events[0],phases:['opening'],conditions:[{kind:'survivors',min:48}]}]};const run=generateRun(setup,narrative);assertInvariants(run);expect(run.events.some(e=>e.templateId==='fallback:boundary')).toBe(true);expect(Math.max(...run.events.filter(e=>e.phase.kind!=='finale').map(e=>e.phase.index))).toBe(60);});
  it('keeps mechanical outcomes unchanged when wording variants change',()=>{const a=input(12),b=structuredClone(a);b.content.events[0].variants.push('A completely different description: {actor.name} wins this encounter; {target.name} leaves.');const left=generateRun(a,narrative),right=generateRun(b,narrative);const mechanics=(run:typeof left)=>run.events.map(({text,confessional,...e})=>e);expect(mechanics(left)).toEqual(mechanics(right));expect(left.winnerId).toBe(right.winnerId);});
  it('normalizes disabled lore, resets inventory and survival between seasons',()=>{const setup=input(3);setup.settings.loreCarryover=false;setup.lore={facts:[{id:'old-win',type:'win',sourceRunId:'old',playerIds:['p0'],eventSequences:[0],detail:'Previous winner'}]};const run=generateRun(setup,narrative);expect(run.input.lore.facts).toEqual([]);expect(run.initialState.players.every(p=>p.alive&&p.biome==='ruins')).toBe(true);expect(run.events.flatMap(e=>e.facts).some(f=>f.type==='lore')).toBe(false);});
  it('omits lore hooks with absent identities or unavailable item definitions',()=>{const setup=input(3);setup.lore={facts:[{id:'absent',type:'betrayal',sourceRunId:'old',playerIds:['p0','absent'],eventSequences:[0],detail:'Old betrayal'},{id:'removed-item',type:'curse',sourceRunId:'old',playerIds:['p1'],eventSequences:[0],itemDefinitionId:'removed',detail:'An unavailable curse'}]};expect(generateRun(setup,narrative).events.flatMap(e=>e.facts).some(f=>f.type==='lore')).toBe(false);});
});

const cursedPack:ContentPack=ContentPackSchema.parse({...fixturePack,items:[
  {id:'compass',name:'Crooked compass',description:'Moves its owner.',tags:['cursed'],curse:'compass'},
  {id:'bell',name:'Dinner bell',description:'Attracts encounters.',tags:['cursed'],curse:'bell'},
  {id:'tin',name:'Whispering tin',description:'Poisons trust.',tags:['cursed'],curse:'tin'},
],markers:[{id:'stolen-from',type:'player',lifetime:'season',description:'Tracks the thief.'}]});
function state():GameState{return {players:[{id:'a',alive:true,biome:'forest',markers:{}},{id:'b',alive:true,biome:'forest',markers:{}},{id:'c',alive:true,biome:'forest',markers:{}}],items:[],relationships:[]};}
const bindings={actor:'a',target:'b',witness:'c'};
describe('atomic rules, biomes, items and relationships',()=>{
  it('rejects a failed transaction without partial creation or movement',()=>{const before=state(),saved=structuredClone(before);expect(applyEffects(before,[{kind:'createItem',role:'actor',definitionId:'bell'},{kind:'transferItem',from:'target',to:'actor',definitionId:'bell',fact:'theft'}],bindings,cursedPack,createRandom('atomic'))).toBeNull();expect(before).toEqual(saved);});
  it('enforces adjacency, co-location, living roles and ground ownership',()=>{const before=state();expect(applyEffects(before,[{kind:'move',role:'actor',biome:'desert'}],bindings,cursedPack,createRandom('route'))).toBeNull();const moved=applyEffects(before,[{kind:'move',role:'actor',biome:'adjacent'}],bindings,cursedPack,createRandom('route'))!;expect(cursedPack.biomes.find(b=>b.id==='forest')!.adjacent).toContain(moved.state.players[0].biome);const template={...fixturePack.events[0],scope:'local'} as EventTemplate;expect(findBindings(template,moved.state,{...exampleCast,players:[...['a','b','c'].map(id=>({id,name:id,traits:[]}))]},cursedPack,['a','b','c'],'a',createRandom('bind'))).toBeNull();expect(applyEffects(before,[{kind:'acquireItem',role:'actor'}],bindings,cursedPack,createRandom('ground'))).toBeNull();});
  it('moves compass owners, records bell activations and applies tin relationships',()=>{
    let current=state();for(const definitionId of ['compass','bell','tin'])current=applyEffects(current,[{kind:'createItem',role:'actor',definitionId}],bindings,cursedPack,createRandom('create'))!.state;
    const compass=applyEffects(current,[{kind:'curse',role:'actor',definitionId:'compass'}],bindings,cursedPack,createRandom('curse'))!;expect(compass.state.players[0].biome).not.toBe('forest');expect(compass.facts.map(f=>f.type)).toEqual(['curse','move']);
    const bell=applyEffects(current,[{kind:'curse',role:'actor',definitionId:'bell'}],bindings,cursedPack,createRandom('curse'))!;expect(bell.facts.some(f=>f.type==='curse'&&f.itemDefinitionId==='bell')).toBe(true);
    const tin=applyEffects(current,[{kind:'curse',role:'actor',definitionId:'tin'}],bindings,cursedPack,createRandom('curse'))!;expect(tin.state.relationships.find(r=>r.from==='a'&&r.to==='b')).toMatchObject({trust:-30,grudge:30});
    const destroyed=applyEffects(current,[{kind:'destroyItem',role:'actor',definitionId:'compass'}],bindings,cursedPack,createRandom('destroy'))!;expect(applyEffects(destroyed.state,[{kind:'curse',role:'actor',definitionId:'compass'}],bindings,cursedPack,createRandom('curse'))).toBeNull();
  });
  it('theft yields a directed living nemesis, unique item owner and valid revenge',()=>{
    const created=applyEffects(state(),[{kind:'createItem',role:'target',definitionId:'tin'}],bindings,cursedPack,createRandom('item'))!;
    const stolen=applyEffects(created.state,[{kind:'transferItem',from:'target',to:'actor',definitionId:'tin',fact:'theft'},{kind:'setMarker',role:'target',marker:'stolen-from',value:'actor'}],bindings,cursedPack,createRandom('steal'),1)!;
    expect(stolen.state.items[0].ownerId).toBe('a');expect(stolen.state.players[1].markers['stolen-from']).toBe('a');expect(getNemesis(stolen.state,'b')).toBe('a');expect(getNemesis(stolen.state,'a')).toBeNull();
    expect(applyEffects(stolen.state,[{kind:'relationship',from:'target',to:'actor',trust:-20,grudge:0,fact:'revenge'}],bindings,cursedPack,createRandom('revenge'),2)).toBeNull();
    const response=applyEffects(stolen.state,[{kind:'eliminate',role:'actor',credit:'target'}],bindings,cursedPack,createRandom('revenge'),2,[{sequence:1,facts:stolen.facts}])!;
    expect(response.facts).toContainEqual({type:'revenge',actorId:'b',targetId:'a',sourceEvent:1});expect(getNemesis(response.state,'b')).toBeNull();expect(response.state.items[0].ownerId).toBeNull();expect(response.state.players[1].markers).toEqual({});
  });
  it('uses stable nemesis ties, clamps edges and only reciprocal alliances',()=>{let s=state();s.relationships=[{from:'a',to:'c',trust:45,grudge:50},{from:'a',to:'b',trust:45,grudge:50}];expect(getNemesis(s,'a')).toBe('b');expect(getAlliances(s)).toEqual([]);s=applyEffects(s,[{kind:'relationship',from:'target',to:'actor',trust:200,grudge:100},{kind:'relationship',from:'actor',to:'target',trust:200,grudge:100}],bindings,cursedPack,createRandom('edge'))!.state;expect(getAlliances(s)).toContainEqual(['a','b']);expect(s.relationships.find(r=>r.from==='a'&&r.to==='b')).toMatchObject({trust:100,grudge:100});});
  it('retains one survivor and allows clear simultaneous tied placements',()=>{const setup=input(4);setup.content.events=[{...arenaPack.events[0],roles:[{id:'actor'},{id:'target'},{id:'other'}],effects:[{kind:'eliminate',role:'target',credit:'actor'},{kind:'eliminate',role:'other',credit:'actor'}]}];const run=generateRun(setup,narrative);expect(run.placements.filter(p=>p.rank===3)).toHaveLength(2);assertInvariants(run);expect(applyEffects(state(),[{kind:'eliminate',role:'actor'},{kind:'eliminate',role:'target'},{kind:'eliminate',role:'witness'}],bindings,cursedPack,createRandom('all'))).toBeNull();});
  it('matches player-valued chain markers to the bound target only',()=>{const s=state();s.players[0].markers['stolen-from']='c';const template:EventTemplate={...fixturePack.events[0],conditions:[{kind:'marker',role:'actor',marker:'stolen-from',exists:true,value:'target'}]};const cast={...exampleCast,players:['a','b','c'].map(id=>({id,name:id,traits:[]}))};expect(findBindings(template,s,cast,cursedPack,['a','b','c'],'a',createRandom('chain'))).toEqual({actor:'a',target:'c'});});
  it('credits helper and betrayer rather than the affected observer; omits unsupported awards',()=>{const s=state();const betrayal=applyEffects(s,[{kind:'relationship',from:'target',to:'actor',trust:-80,grudge:60,fact:'betrayal'}],bindings,cursedPack,createRandom('credit'))!;expect(betrayal.facts).toContainEqual({type:'betrayal',actorId:'a',targetId:'b'});const assistance=applyEffects(s,[{kind:'relationship',from:'target',to:'actor',trust:25,grudge:0,fact:'assistance'}],bindings,cursedPack,createRandom('credit'))!;expect(assistance.facts).toContainEqual({type:'assistance',actorId:'a',targetId:'b'});expect(computeAwards([],input())).toEqual([]);});
});
