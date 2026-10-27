import { RunInputSchema, RunRecordSchema, ENGINE_VERSION, canonicalRunId, type RunInput, type RunRecord, type NarrativeAdapter, type EventTemplate, type EventRecord, type Phase, type GameState, type RandomSource, type Placement } from '../domain';
import { createRandom } from './random';
import { initialState, applyEffects, findBindings, clearPhaseMarkers } from './mechanics';
import { computeAwards } from './awards';
import { arenaTemplate, biomeStatus, chooseArenaWarning, environmentWeight, evacuationDeathChance } from './arena';
export { createRandom } from './random';
export { initialState, applyEffects, findBindings, getNemesis, getAlliances } from './mechanics';
export { computeAwards } from './awards';

export const MAX_GAME_DAYS = 8;

const fallback = (finale: boolean): EventTemplate => ({
  id: finale ? 'fallback:boundary' : 'fallback:watch',category:finale?'finale':'survival',phases:finale?['finale']:['opening','day','night'],tones:['mixed'],scope:'global',roles:[{id:'actor'}],conditions:[],weight:1,cooldown:0,
  variants:finale?['The outer fence slides inward through {biome}. {actor.name} tries to squeeze past a maintenance post but becomes trapped between two steel panels. The closing fence crushes {actor.object}, causing fatal injuries.']:['{actor.name} crouches beside a trail marker in {biome}, listening for footsteps before choosing which path to take.'],effects:finale?[{kind:'eliminate',role:'actor'}]:[],
});
function weighted<T>(values: {value:T;weight:number}[], random: RandomSource): T {
  const total = values.reduce((sum,v)=>sum+v.weight,0); let pick=random.next()*total;
  for (const v of values) { pick-=v.weight;if(pick<0)return v.value; } return values[values.length-1].value;
}
export function eventWeight(template: EventTemplate, bindings: Record<string,string>, state: GameState, input: RunInput, phase: Phase): number {
  let result=template.weight;
  const lethal=template.effects.some(e=>e.kind==='eliminate');
  if(lethal) result*=({low:0.55,normal:1,high:1.8}[input.settings.danger])*(1+Math.min(4,phase.day/5));
  if(input.settings.tone!=='mixed' && template.tones.includes(input.settings.tone))result*=1.6;
  if(input.settings.personality!=='off') {
    let boost=0;
    for(const id of Object.values(bindings))for(const trait of input.cast.players.find(p=>p.id===id)!.traits) {
      if((trait==='reckless' && lethal)||(trait==='sneaky' && template.effects.some(e=>e.kind==='transferItem'))||(trait==='loyal' && template.effects.some(e=>e.kind==='relationship'&&e.trust>0))||(trait==='cautious' && template.category==='survival')||(trait==='resourceful'&&template.effects.some(e=>e.kind==='createItem'||e.kind==='acquireItem'))||(trait==='dramatic'&&template.category==='social'))boost+=0.2;
    }
    result*=Math.min(input.settings.personality==='strong'?2.2:1.6,1+boost*(input.settings.personality==='strong'?2:1));
    if (phase.kind === 'opening') {
      const traits = input.cast.players.find(p => p.id === Object.values(bindings)[0])!.traits;
      const fleeing = template.effects.some(e => e.kind === 'move');
      const boost = input.settings.personality === 'strong' ? 2 : 1.5;
      if ((fleeing && traits.includes('cautious')) || (!fleeing && traits.includes('reckless'))) result *= boost;
    }
  }
  if(template.roles.length>1 || template.category==='conflict') {
    const bell=state.items.some(i=>!i.destroyed && i.ownerId && Object.values(bindings).includes(i.ownerId) && input.content.items.find(d=>d.id===i.definitionId)?.curse==='bell'); if(bell)result*=1.8;
  }
  return result * environmentWeight(template, bindings, state, phase);
}

export function generateRun(rawInput: RunInput, narrative: NarrativeAdapter): RunRecord {
  const input=RunInputSchema.parse(rawInput);
  if(!input.settings.loreCarryover)input.lore={facts:[]};
  const id=canonicalRunId(input); const mechanics=createRandom(`${input.settings.seed}:mechanics`), wording=createRandom(`${input.settings.seed}:wording`), confessionals=createRandom(`${input.settings.seed}:confessionals`);
  const arenaRandom=createRandom(`${input.settings.seed}:arena`);
  let state=initialState(input);const initial=structuredClone(state);const events:EventRecord[]=[];const placements:Placement[]=[];const lastUsed:Record<string,number>={};const lastConfessional:Record<string,number>={};let loreUsed=false;
  const templates=[...input.content.events].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  let finaleDay: number | null = null;
  for(let phaseIndex=0;state.players.filter(p=>p.alive).length>1;phaseIndex++) {
    const day = phaseIndex === 0 ? 0 : Math.ceil(phaseIndex / 2);
    if (finaleDay === null && phaseIndex > 0 && (state.players.filter(p=>p.alive).length <= 2 || day >= MAX_GAME_DAYS)) finaleDay = day;
    const finale = finaleDay !== null;
    // Separate finale bouts retain distinct assignment rounds within the same day.
    const phase:Phase={kind:phaseIndex===0?'opening':finale?'finale':phaseIndex%2?'day':'night',index:phaseIndex,day:finaleDay ?? day};
    state=clearPhaseMarkers(state,input.content);const assigned=new Set<string>();const usedSpeakers:string[]=[];
    type Candidate={template:EventTemplate;bindings:Record<string,string>;result:NonNullable<ReturnType<typeof applyEffects>>};
    const record = ({ template, bindings, result }: Candidate) => {
      const sequence=events.length, anchor=Object.values(bindings)[0], before=state; state=result.state;
      if(!result.facts.length && anchor)result.facts.push({type:'survival',actorId:anchor,biome:state.players.find(p=>p.id===anchor)!.biome});
      if(!loreUsed&&input.settings.loreCarryover && anchor) {
        const lore=input.lore.facts.find(f=>f.playerIds.some(p=>Object.values(bindings).includes(p))&&f.playerIds.every(p=>input.cast.players.some(c=>c.id===p))&&(!f.itemDefinitionId||input.content.items.some(i=>i.id===f.itemDefinitionId)));
        if(lore) {result.facts.push({type:'lore',actorId:lore.playerIds.find(p=>Object.values(bindings).includes(p)),sourceRunId:lore.sourceRunId,...(lore.eventSequences.length?{sourceEvent:lore.eventSequences[0]}:{})});loreUsed=true;}
      }
      const narrativeInput={template,bindings,cast:input.cast,content:input.content,before,after:state,facts:result.facts,phase,sequence,random:wording,lore:input.lore};
      const rendered=narrative.renderEvent(narrativeInput);const confessional=anchor ? narrative.selectConfessional({...narrativeInput,random:confessionals,usedThisPhase:[...usedSpeakers],lastUsed:{...lastConfessional}}) : null;
      const validConfessional=confessional && !usedSpeakers.includes(confessional.speakerId) && (state.players.find(p=>p.id===confessional.speakerId)?.alive || (confessional.exit && before.players.find(p=>p.id===confessional.speakerId)?.alive && !state.players.find(p=>p.id===confessional.speakerId)?.alive))?confessional:null;
      if(validConfessional){usedSpeakers.push(validConfessional.speakerId);lastConfessional[validConfessional.templateId]=sequence;}
      const biome=template.arena?.biome ?? state.players.find(p=>p.id===anchor)!.biome;
      events.push({sequence,id:`event-${sequence}`,phase:{...phase},templateId:template.id,bindings,biome,effects:structuredClone(template.effects),facts:result.facts,text:rendered.text,confessional:validConfessional,state:structuredClone(state)});
      const eliminated=before.players.filter(p=>p.alive&&!state.players.find(s=>s.id===p.id)!.alive), rank=state.players.filter(p=>p.alive).length+1;
      eliminated.forEach(p=>placements.push({playerId:p.id,rank,eventSequence:sequence}));Object.values(bindings).forEach(p=>assigned.add(p));lastUsed[template.id]=phaseIndex;
    };
    const stage = (template: EventTemplate | undefined, bindings: Record<string,string> = {}) => {
      if (!template) return false;
      const result=applyEffects(state,template.effects,bindings,input.content,arenaRandom,events.length,events);
      if (!result) return false;
      record({template,bindings,result}); return true;
    };
    if (!finale) {
      for (const region of state.arena ?? []) {
        const changed = [...events].reverse().find(e => e.facts.some(f => f.type === 'arena' && f.biome === region.biome));
        if (!changed || changed.phase.index >= phaseIndex) continue;
        const next = region.status === 'weather-warning' ? 'weather-start' : region.status === 'hazardous' ? 'weather-end' : region.status === 'closure-warning' ? 'closure-start' : undefined;
        if (next) stage(arenaTemplate(input, region.biome, next));
      }
      stage(chooseArenaWarning(input,state,events,phase,arenaRandom));
    }
    while(state.players.filter(p=>p.alive).length>1) {
      const available=state.players.filter(p=>p.alive&&!assigned.has(p.id)).map(p=>p.id).sort();if(!available.length)break;
      // Evacuation takes the resident's ordinary assignment, before encounters
      // can involve them again. Its outcome follows the earlier public warning.
      const evacuating=available.find(id=>biomeStatus(state,state.players.find(p=>p.id===id)!.biome)==='evacuating');
      if (evacuating) {
        const resident=state.players.find(p=>p.id===evacuating)!;
        const dies=state.players.filter(p=>p.alive).length>2 && arenaRandom.next()<evacuationDeathChance(input,state,evacuating);
        if (stage(arenaTemplate(input,resident.biome,dies?'casualty':'escape'),{actor:evacuating})) continue;
      }
      const anchor=mechanics.pick(available);const sequence=events.length;
      const allowMultikill=phase.day>=2 && !events.some(e=>e.effects.filter(f=>f.kind==='eliminate').length>1) && arenaRandom.next()<0.06;
      let candidates:{value:Candidate;weight:number}[]=[];
      // Relax recent-template suppression, then cooldown, never hard eligibility.
      for(let relaxation=0;relaxation<3&&!candidates.length;relaxation++)for(const template of templates) {
        if(template.arena || template.category==='announcement' || !template.phases.includes(phase.kind)||(finale&&!template.effects.some(e=>e.kind==='eliminate')))continue;
        if (template.rare && !allowMultikill) continue;
        if(relaxation<2&&lastUsed[template.id]!==undefined&&phaseIndex-lastUsed[template.id]<=template.cooldown)continue;
        if(relaxation===0&&events.slice(-3).some(e=>e.templateId===template.id))continue;
        const bindings=findBindings(template,state,input.cast,input.content,available,anchor,mechanics);if(!bindings)continue;
        const effectRandom=createRandom(`${input.settings.seed}:effects:${sequence}:${template.id}:${Object.values(bindings).join('|')}`);
        const result=applyEffects(state,template.effects,bindings,input.content,effectRandom,sequence,events);if(!result)continue;
        candidates.push({value:{template,bindings,result},weight:eventWeight(template,bindings,state,input,phase)});
      }
      let chosen:Candidate;
      if(candidates.length)chosen=weighted(candidates,mechanics);
      else {const template=fallback(finale);const bindings={actor:anchor};const result=applyEffects(state,template.effects,bindings,input.content,mechanics,sequence,events)!;chosen={template,bindings,result};}
      record(chosen);
      const pendingEvacuation=state.players.some(p=>p.alive&&!assigned.has(p.id)&&biomeStatus(state,p.biome)==='evacuating');
      if(finale || (state.players.filter(p=>p.alive).length<=2 && !pendingEvacuation))break;
    }
    for (const region of state.arena ?? []) if (region.status==='evacuating' && !state.players.some(p=>p.alive&&p.biome===region.biome)) stage(arenaTemplate(input,region.biome,'close'));
  }
  const winnerId=state.players.find(p=>p.alive)!.id;placements.push({playerId:winnerId,rank:1,eventSequence:null});placements.sort((a,b)=>a.rank-b.rank||(a.playerId<b.playerId?-1:1));
  const name=(playerId:string)=>input.cast.players.find(p=>p.id===playerId)!.name;
  const duration = events.at(-1)!.phase.day;
  const run:RunRecord={id,engineVersion:ENGINE_VERSION,input,initialState:initial,events,winnerId,placements,awards:computeAwards(events,input),recap:[`${name(winnerId)} outlasted ${input.cast.players.length-1} other players.`, duration === 0 ? 'The game was decided during the bloodbath.' : `The game was decided on Day ${duration}.`, `${events.length} events unfolded across ${new Set(events.map(e=>e.biome)).size} biomes.`,...events.filter(e=>e.facts.some(f=>f.type==='betrayal'||f.type==='revenge'||f.type==='curse')).slice(-5).map(e=>e.text)]};
  return RunRecordSchema.parse(run);
}
