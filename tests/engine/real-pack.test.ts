import { describe, expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { narrativeAdapter } from '../../src/narrative';
import { applyCompletedRun, deriveLore, selectLoreContext } from '../../src/lore';
import { generateRun, initialState, createRandom, findBindings, applyEffects, computeAwards, getNemesis, getAlliances, eventWeight } from '../../src/engine';
import { canonicalRunId, ENGINE_VERSION, RunRecordSchema, type RunInput, type EventRecord, type RunRecord } from '../../src/domain';

const setup=(size=3,seed='real-pack'):RunInput=>({cast:{version:1,title:'The Test Broadcast',relationships:[],players:Array.from({length:size},(_,i)=>({id:`p${i}`,name:`Player ${i}`,traits:['loyal','sneaky','dramatic'],signatureItem:`Player ${i}'s keepsake`}))},content:structuredClone(defaultContentPack),settings:{seed,danger:'normal',tone:'mixed',personality:'normal',loreCarryover:true},lore:{facts:[]}});

describe('full authored pack integration',()=>{
  it('measures full generation with stored snapshots for 2, 24 and 48 players',()=>{
    const measurements=[];
    for(const size of [2,24,48]){const started=performance.now(),run=generateRun(setup(size,'benchmark'),narrativeAdapter);measurements.push({players:size,milliseconds:Math.round((performance.now()-started)*10)/10,events:run.events.length,bytes:new TextEncoder().encode(JSON.stringify(run)).length});expect(run.events.at(-1)!.state.players.filter(p=>p.alive)).toHaveLength(1);}
    console.info('Generation measurements:',JSON.stringify(measurements));
  });
  it('generates real stories across boundary casts, dangers and seeds',()=>{
    for(const size of [2,3,12,24,48])for(const danger of ['low','normal','high'] as const)for(let seed=0;seed<3;seed++){
      const input=setup(size,`full-pack-${seed}`);input.settings.danger=danger;const run=generateRun(input,narrativeAdapter);
      expect(RunRecordSchema.safeParse(run).success).toBe(true);expect(run.events.at(-1)!.state.players.filter(p=>p.alive).map(p=>p.id)).toEqual([run.winnerId]);expect(run.events.every(e=>e.text.length>0)).toBe(true);
    }
  });
  it('executes theft, nemesis, confrontation, repayment, confessionals, awards and sourced lore',()=>{
    const input=setup();let state=initialState(input);const initial=structuredClone(state);const events:EventRecord[]=[];
    function execute(id:string,anchor:string,target?:string){
      const template=input.content.events.find(e=>e.id===id)!;const sequence=events.length;
      const available=target?[anchor,target]:state.players.filter(p=>p.alive).map(p=>p.id);const bindings=findBindings(template,state,input.cast,input.content,available,anchor,createRandom(`bind-${sequence}`));expect(bindings).not.toBeNull();
      const before=state,result=applyEffects(state,template.effects,bindings!,input.content,createRandom(`effects-${sequence}`),sequence,events);expect(result).not.toBeNull();state=result!.state;
      const phase={kind:template.phases.includes('day')?'day' as const:template.phases[0],index:sequence+1,day:sequence+1};const narrativeInput={template,bindings:bindings!,before,after:state,cast:input.cast,content:input.content,facts:result!.facts,phase,sequence,random:createRandom('wording'),lore:input.lore};
      const event:EventRecord={sequence,id:`event-${sequence}`,templateId:id,phase,bindings:bindings!,biome:state.players.find(p=>p.id===anchor)!.biome,effects:template.effects,facts:result!.facts,text:narrativeAdapter.renderEvent(narrativeInput).text,confessional:narrativeAdapter.selectConfessional({...narrativeInput,usedThisPhase:[],lastUsed:{}}),state:structuredClone(state)};events.push(event);return event;
    }
    const theft=execute('stolen-cache','p0','p1');expect(theft.facts.some(f=>f.type==='theft'&&f.actorId==='p0'&&f.targetId==='p1')).toBe(true);expect(getNemesis(state,'p1')).toBe('p0');expect(theft.confessional).not.toBeNull();
    execute('stolen-confrontation','p1','p0');const repayment=execute('stolen-reclaimed','p1','p0');expect(repayment.facts.some(f=>f.type==='revenge'&&f.actorId==='p1'&&f.sourceEvent===0)).toBe(true);expect(state.players[1].markers['stolen-from']).toBeUndefined();
    execute('final-beacon-1','p1','p0');execute('final-beacon-1','p1','p2');
    const run:RunRecord={id:canonicalRunId(input),engineVersion:ENGINE_VERSION,input,initialState:initial,events,winnerId:'p1',placements:[{playerId:'p1',rank:1,eventSequence:null},{playerId:'p2',rank:2,eventSequence:4},{playerId:'p0',rank:3,eventSequence:3}],awards:computeAwards(events,input),recap:['The theft was answered.']};
    expect(RunRecordSchema.safeParse(run).success).toBe(true);expect(run.awards.find(a=>a.id==='revenge')?.recipientIds).toEqual(['p1']);const lore=deriveLore(run);expect(lore.some(f=>f.type==='revenge'&&f.sourceRunId===run.id&&f.eventSequences.includes(2))).toBe(true);
    const history=applyCompletedRun({version:1,seasons:[]},run,'2026-10-26');const second=setup(3,'second-season');second.lore=selectLoreContext(history,second.cast,second.content);const sequel=generateRun(second,narrativeAdapter);expect(sequel.events.some(e=>e.facts.some(f=>f.type==='lore'&&f.sourceRunId===run.id)&&e.text.includes('Archive:'))).toBe(true);
  });
  it('completes shelter and warning chains and interrupts player chains on elimination',()=>{
    const input=setup();let state=initialState(input);let sequence=0;const history:{sequence:number;facts:EventRecord['facts']}[]=[];
    function step(id:string,anchor:string,target?:string){const template=input.content.events.find(e=>e.id===id)!;const bindings=findBindings(template,state,input.cast,input.content,target?[anchor,target]:state.players.filter(p=>p.alive).map(p=>p.id),anchor,createRandom('chain'));expect(bindings).not.toBeNull();const result=applyEffects(state,template.effects,bindings!,input.content,createRandom('chain'),sequence,history);expect(result).not.toBeNull();state=result!.state;history.push({sequence:sequence++,facts:result!.facts});}
    step('shelter-offer','p0','p1');step('shelter-repaid','p1','p0');step('shelter-pact','p1','p0');expect(getAlliances(state)).toContainEqual(['p0','p1']);
    step('omen-find','p2');step('omen-read','p2');const before=state.players[2].biome;step('omen-detour','p2');expect(state.players[2].markers.omen).toBe(3);expect(state.players[2].biome).not.toBe(before);
    // A new favor can be interrupted: dead participants cannot become active chain targets.
    step('shelter-offer','p0','p1');state=applyEffects(state,[{kind:'eliminate',role:'target'}],{actor:'p1',target:'p0'},input.content,createRandom('interrupt'),sequence,history)!.state;expect(state.players[1].markers['debt-to']).toBeUndefined();const template=input.content.events.find(e=>e.id==='shelter-repaid')!;expect(findBindings(template,state,input.cast,input.content,['p1','p2'],'p1',createRandom('interrupted'))).toBeNull();
  });
  it('bell possession increases actual encounter weighting and destruction removes it',()=>{const input=setup(),before=initialState(input),template=input.content.events.find(e=>e.id==='stolen-cache')!,bindings={actor:'p0',target:'p1'},phase={kind:'day' as const,index:1,day:1};const plain=eventWeight(template,bindings,before,input,phase);const cursed=applyEffects(before,[{kind:'createItem',role:'actor',definitionId:'dinner-bell'}],bindings,input.content,createRandom('bell'))!.state;expect(eventWeight(template,bindings,cursed,input,phase)).toBeCloseTo(plain*1.8);const broken=applyEffects(cursed,[{kind:'destroyItem',role:'actor',definitionId:'dinner-bell'}],bindings,input.content,createRandom('bell'))!.state;expect(eventWeight(template,bindings,broken,input,phase)).toBe(plain);});
});
