import { RunInputSchema, RunRecordSchema, ENGINE_VERSION, canonicalRunId, type RunInput, type RunRecord, type NarrativeAdapter, type EventTemplate, type EventRecord, type Phase, type GameState, type RandomSource, type Placement } from '../domain';
import { createRandom } from './random';
import { combatRecord } from './combat';
import { chooseCombatMethod, preferUnusedCombatChoices, type CombatChoice } from './combat-selection';
import { initialState, applyEffects, findBindings, clearPhaseMarkers } from './mechanics';
import { computeAwards } from './awards';
import { allied, hostilePairs } from './personality';
import { arenaTemplate, biomeStatus, chooseArenaWarning, environmentWeight, evacuationDeathChance } from './arena';
import { siteRevisit } from './site-memory';
import { requestedTravel } from './travel';
import { expandedTraitWeight } from './trait-expansion';
import { quirkWeight } from './quirks';
import { isSponsorGift, MAX_SPONSOR_GIFTS, sponsorChance } from './sponsors';
export { createRandom } from './random';
export { initialState, applyEffects, findBindings, getNemesis, getAlliances } from './mechanics';
export { computeAwards } from './awards';

export const MAX_GAME_DAYS = 6;
export const MAX_CONFESSIONALS_PER_ROUND = 4;
const CONFESSIONAL_CHANCE = 0.3;
const cooldownKey = (template: EventTemplate) => template.cooldownGroup ?? template.id;

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
  if(lethal) result*=({low:0.55,normal:1,high:2.6}[input.settings.danger])*(1+Math.min(4,phase.day/5));
  if(input.settings.tone!=='mixed' && template.tones.includes(input.settings.tone))result*=1.6;
  if(input.settings.personality!=='off') {
    let boost=0;
    for(const id of Object.values(bindings))for(const trait of input.cast.players.find(p=>p.id===id)!.traits) {
      if((trait==='reckless' && lethal)||(trait==='sneaky' && template.effects.some(e=>e.kind==='transferItem'))||(trait==='loyal' && template.effects.some(e=>e.kind==='relationship'&&e.trust>0))||(trait==='cautious' && template.category==='survival')||(trait==='resourceful'&&template.effects.some(e=>e.kind==='createItem'||e.kind==='acquireItem'))||(trait==='dramatic'&&template.category==='social'))boost+=0.2;
    }
    result*=Math.min(input.settings.personality==='strong'?2.2:1.6,1+boost*(input.settings.personality==='strong'?2:1));
    const strength = input.settings.personality === 'strong' ? 2 : 1;
    const hostile = hostilePairs(template.effects, bindings);
    if (hostile.some(([actor, target]) => input.cast.players.find(p => p.id === actor)?.traits.includes('disloyal') && (allied(state, actor, target) || template.effects.some(e => e.kind === 'relationship' && e.fact === 'betrayal' && bindings[e.to] === actor)))) result *= 1 + strength;
    for (const [actor, target] of hostile) {
      const traits = input.cast.players.find(p => p.id === actor)?.traits ?? [];
      const opinion = state.relationships.find(r => r.from === actor && r.to === target);
      if (traits.includes('grudge') && (opinion?.grudge ?? 0) >= 40) result *= 1 + 0.4 * strength;
      if (traits.includes('love-hate') && opinion) result *= opinion.trust >= 40 ? 0.35 : 1 + 0.4 * strength;
    }
    for (const effect of template.effects) if (effect.kind === 'relationship' && effect.trust > 0 && effect.fact !== 'betrayal') {
      const actor = bindings[effect.to], target = bindings[effect.from];
      const opinion = state.relationships.find(r => r.from === actor && r.to === target);
      if (input.cast.players.find(p => p.id === actor)?.traits.includes('love-hate') && opinion) result *= opinion.trust >= 40 ? 1 + 0.4 * strength : 0.35;
    }
    if (Object.values(bindings).some(id => input.cast.players.find(p => p.id === id)?.traits.includes('weak-constitution')) && template.category === 'hazard') result *= 1 + 0.4 * strength;
    if (phase.kind === 'opening') {
      const traits = input.cast.players.find(p => p.id === Object.values(bindings)[0])!.traits;
      const fleeing = template.effects.some(e => e.kind === 'move' || e.kind === 'moveGroup');
      const boost = input.settings.personality === 'strong' ? 2 : 1.5;
      if ((fleeing && traits.includes('cautious')) || (!fleeing && traits.includes('reckless'))) result *= boost;
    }
  }
  if(template.roles.length>1 || template.category==='conflict') {
    const bell=state.items.some(i=>!i.destroyed && i.ownerId && Object.values(bindings).includes(i.ownerId) && input.content.items.find(d=>d.id===i.definitionId)?.curse==='bell'); if(bell)result*=1.8;
  }
  return result * expandedTraitWeight(template, bindings, input) * quirkWeight(template, bindings, state, input, phase) * environmentWeight(template, bindings, state, phase);
}

export function generateRun(rawInput: RunInput, narrative: NarrativeAdapter): RunRecord {
  const input=RunInputSchema.parse(rawInput);
  if(!input.settings.loreCarryover)input.lore={facts:[]};
  const id=canonicalRunId(input); const mechanics=createRandom(`${input.settings.seed}:mechanics`), wording=createRandom(`${input.settings.seed}:wording`), confessionals=createRandom(`${input.settings.seed}:confessionals`);
  const arenaRandom=createRandom(`${input.settings.seed}:arena`);
  const lastEventWording: Record<string, string> = {}, lastInterviewWording: Record<string, string> = {};
  const wordingUses: Record<string, number> = Object.create(null);
  const usedInterviewTexts = new Set<string>();
  const scheduledRandom = createRandom(`${input.settings.seed}:scheduled`);
  const sponsorRandom = createRandom(`${input.settings.seed}:sponsors`);
  let sponsorGifts = 0;
  let state=initialState(input);const initial=structuredClone(state);const events:EventRecord[]=[];const placements:Placement[]=[];const lastUsed:Record<string,number>={};const lastConfessional:Record<string,number>={};let loreUsed=false;
  const templates=[...input.content.events].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const cooldownKeys = new Map(templates.map(template => [template.id, cooldownKey(template)]));
  const travelContent = { events: templates.filter(template => template.travel) };
  let finaleDay: number | null = null;
  for(let phaseIndex=0;state.players.filter(p=>p.alive).length>1;phaseIndex++) {
    const day = phaseIndex === 0 ? 0 : Math.ceil(phaseIndex / 2);
    const survivors = state.players.filter(p=>p.alive).length;
    const finalFew = day >= 4 && survivors <= 4 && events.some(event => event.facts.some(fact => fact.type === 'elimination' && fact.actorId));
    if (finaleDay === null && phaseIndex > 0 && (survivors <= 2 || finalFew || day >= MAX_GAME_DAYS)) finaleDay = day;
    const finale = finaleDay !== null;
    // Separate finale bouts retain distinct assignment rounds within the same day.
    const phase:Phase={kind:phaseIndex===0?'opening':finale?'finale':phaseIndex%2?'day':'night',index:phaseIndex,day:finaleDay ?? day};
    state=clearPhaseMarkers(state,input.content);const assigned=new Set<string>();const usedSpeakers:string[]=[];
    type Candidate=CombatChoice & {result:NonNullable<ReturnType<typeof applyEffects>>};
    const record = ({ template, bindings, result, preferredMethod }: Candidate) => {
      if (isSponsorGift(template)) sponsorGifts++;
      const sequence=events.length, anchor=Object.values(bindings)[0], before=state; state=result.state;
      if(!result.facts.length && anchor)result.facts.push({type:'survival',actorId:anchor,biome:state.players.find(p=>p.id===anchor)!.biome});
      if(!loreUsed&&input.settings.loreCarryover && anchor) {
        const lore=input.lore.facts.find(f=>f.playerIds.some(p=>Object.values(bindings).includes(p))&&f.playerIds.every(p=>input.cast.players.some(c=>c.id===p))&&(!f.itemDefinitionId||input.content.items.some(i=>i.id===f.itemDefinitionId)));
        if(lore) {result.facts.push({type:'lore',actorId:lore.playerIds.find(p=>Object.values(bindings).includes(p)),sourceRunId:lore.sourceRunId,...(lore.eventSequences.length?{sourceEvent:lore.eventSequences[0]}:{})});loreUsed=true;}
      }
      const biome=template.arena?.biome ?? state.players.find(p=>p.id===anchor)!.biome;
      const revisit = siteRevisit(template, result.facts, biome, events, input.content);
      if (revisit) result.facts.push(revisit);
      const narrativeInput={template,bindings,cast:input.cast,content:input.content,before,after:state,facts:result.facts,phase,sequence,random:wording,lore:input.lore,previousWording:lastEventWording[template.id],wordingUses:{...wordingUses},history:events,personalityEnabled:input.settings.personality!=='off'};
      // Keep the original template for recorded variant indices and replay checks.
      // Only wording selection is restricted to the chosen authored method.
      const methodVariants = preferredMethod && template.combat?.variantMethods
        ? template.variants.filter((_, index) => template.combat!.variantMethods![index] === preferredMethod) : undefined;
      const rendered=narrative.renderEvent(methodVariants?.length ? { ...narrativeInput, template: { ...template, variants: methodVariants } } : narrativeInput);const selection=anchor && usedSpeakers.length < MAX_CONFESSIONALS_PER_ROUND && confessionals.next() < CONFESSIONAL_CHANCE ? narrative.selectConfessional({...narrativeInput,random:confessionals,usedThisPhase:[...usedSpeakers],lastUsed:{...lastConfessional},lastWording:{...lastInterviewWording},usedTexts:[...usedInterviewTexts]}) : null;
      if (rendered.wording !== undefined) {
        lastEventWording[template.id] = rendered.wording;
        wordingUses[rendered.wording] = (wordingUses[rendered.wording] ?? 0) + 1;
      }
      const confessional = selection ? (({ wording: _wording, ...saved }) => saved)(selection) : null;
      const validConfessional=confessional && !usedSpeakers.includes(confessional.speakerId) && (state.players.find(p=>p.id===confessional.speakerId)?.alive || (confessional.exit && before.players.find(p=>p.id===confessional.speakerId)?.alive && !state.players.find(p=>p.id===confessional.speakerId)?.alive))?confessional:null;
      if(validConfessional){usedSpeakers.push(validConfessional.speakerId);usedInterviewTexts.add(validConfessional.text);lastConfessional[validConfessional.templateId]=sequence;if(selection?.wording !== undefined)lastInterviewWording[validConfessional.templateId]=selection.wording;}
      events.push({combat:combatRecord(template, bindings, before, state, input.content, rendered.wording === undefined ? undefined : template.variants.indexOf(rendered.wording)),sequence,id:`event-${sequence}`,phase:{...phase},templateId:template.id,bindings,biome,effects:structuredClone(template.effects),facts:result.facts,text:rendered.text,confessional:validConfessional,state:structuredClone(state)});
      const eliminated=before.players.filter(p=>p.alive&&!state.players.find(s=>s.id===p.id)!.alive), rank=state.players.filter(p=>p.alive).length+1;
      eliminated.forEach(p=>placements.push({playerId:p.id,rank,eventSequence:sequence}));Object.values(bindings).forEach(p=>assigned.add(p));lastUsed[cooldownKey(template)]=phaseIndex;
    };
    const stage = (template: EventTemplate | undefined, bindings: Record<string,string> = {}) => {
      if (!template || !template.phases.includes(phase.kind)) return false;
      const result=applyEffects(state,template.effects,bindings,input.content,arenaRandom,events.length,events,input);
      if (!result) return false;
      record({template,bindings,result}); return true;
    };
    // Opening casualty pressure is sampled independently from template count.
    // Each contest still consumes distinct living participants' assignments.
    if (phase.kind === 'opening' && input.content.id === 'wild-broadcast') {
      const openingRandom = createRandom(`${input.settings.seed}:opening`);
      const desired = weighted([5,18,30,28,13,5,1].map((weight, i) => ({ value: i + 3, weight })), openingRandom);
      const budget = Math.min(Math.floor(survivors / 2), Math.max(1, Math.round(desired * survivors / 24)));
      const lethal = templates.filter(t => t.phases.includes('opening') && t.effects.some(e => e.kind === 'eliminate' && e.credit));
      for (let death = 0; death < budget && lethal.length; death++) {
        const available = state.players.filter(p => p.alive && !assigned.has(p.id)).map(p => p.id).sort();
        const candidates = lethal.flatMap(template => {
          const bindings = findBindings(template, state, input.cast, input.content, available, openingRandom.pick(available), openingRandom, input.settings.personality !== 'off');
          return bindings ? [{ value: { template, bindings }, weight: eventWeight(template, bindings, state, input, phase) }] : [];
        });
        if (!candidates.length) break;
        const selected = weighted(candidates, openingRandom);
        stage(selected.template, selected.bindings);
      }
      // Modest opening equipment pool: five recipients on average for 24 players.
      // Pickups use real assignments after lethal contests, before remaining exits.
      const weaponRandom = createRandom(`${input.settings.seed}:opening-weapons`);
      const target = Math.round(weighted([{ value: 4, weight: 1 }, { value: 5, weight: 2 }, { value: 6, weight: 1 }], weaponRandom) * survivors / 24);
      const weaponPickups = templates.filter(t => t.phases.includes('opening') && t.roles.length === 1 &&
        t.effects.some(e => e.kind === 'createItem' && input.content.items.some(i => i.id === e.definitionId && i.tags.includes('weapon'))));
      const used = new Set<string>();
      for (let pickup = 0; pickup < target && state.players.filter(p => p.alive).length > 1; pickup++) {
        const available = state.players.filter(p => p.alive && !assigned.has(p.id)).map(p => p.id).sort();
        if (!available.length) break;
        const anchor = weaponRandom.pick(available);
        const candidates = weaponPickups.flatMap(template => {
          const bindings = findBindings(template, state, input.cast, input.content, available, anchor, weaponRandom, input.settings.personality !== 'off');
          return bindings ? [{ value: { template, bindings }, weight: eventWeight(template, bindings, state, input, phase) }] : [];
        });
        if (!candidates.length) break;
        const fresh = candidates.filter(c => !used.has(c.value.template.id));
        const selected = weighted(fresh.length ? fresh : candidates, weaponRandom);
        if (stage(selected.template, selected.bindings)) used.add(selected.template.id);
      }
    }
    if (!finale) {
      for (const region of state.arena ?? []) {
        const changed = [...events].reverse().find(e => e.facts.some(f => f.type === 'arena' && f.biome === region.biome));
        if (!changed || changed.phase.index >= phaseIndex) continue;
        const next = region.status === 'weather-warning' ? 'weather-start' : region.status === 'hazardous' ? 'weather-end' : region.status === 'closure-warning' ? 'closure-start' : undefined;
        if (next) stage(arenaTemplate(input, region.biome, next));
      }
      stage(chooseArenaWarning(input,state,events,phase,arenaRandom));
      // One delivery per group. Resident/arrival versions of a bundle share a
      // choice key, so authoring both routes cannot double that bundle's odds.
      const scheduledGroups = new Map<string, EventTemplate[]>();
      for (const template of templates.filter(t => t.schedule && t.schedule.day <= phase.day && t.phases.includes(phase.kind))) {
        const group = template.schedule!.group;
        if (events.some(e => input.content.events.find(t => t.id === e.templateId)?.schedule?.group === group)) continue;
        const entries = scheduledGroups.get(group) ?? [];
        entries.push(template); scheduledGroups.set(group, entries);
      }
      for (const [group, entries] of scheduledGroups) {
        const available = state.players.filter(p => p.alive && !assigned.has(p.id) && biomeStatus(state, p.biome) !== 'evacuating').map(p => p.id).sort();
        for (let i = available.length - 1; i > 0; i--) {
          const j = scheduledRandom.int(i + 1);
          [available[i], available[j]] = [available[j], available[i]];
        }
        if (!entries.some(template => template.schedule!.choice)) {
          let delivered = false;
          for (const template of entries) {
            for (const anchor of available) {
              const bindings = findBindings(template, state, input.cast, input.content, available, anchor, scheduledRandom, input.settings.personality !== 'off');
              if (bindings && stage(template, bindings)) { delivered = true; break; }
            }
            if (delivered) break;
          }
          continue;
        }
        const choices = new Map<string, EventTemplate[]>();
        for (const template of entries) {
          // Scenes without explicit choices retain their ID-order precedence.
          const key = template.schedule!.choice ?? group;
          const alternatives = choices.get(key) ?? [];
          alternatives.push(template); choices.set(key, alternatives);
        }
        const eligible: { value: CombatChoice; weight: number }[] = [];
        for (const alternatives of choices.values()) {
          let candidate: CombatChoice | undefined;
          for (const template of alternatives) {
            for (const anchor of available) {
              const bindings = findBindings(template, state, input.cast, input.content, available, anchor, scheduledRandom, input.settings.personality !== 'off');
              if (bindings) { candidate = { template, bindings }; break; }
            }
            if (candidate) break;
          }
          if (candidate) eligible.push({ value: candidate, weight: candidate.template.weight });
        }
        while (eligible.length) {
          const selected = weighted(eligible, scheduledRandom);
          if (stage(selected.template, selected.bindings)) break;
          eligible.splice(eligible.findIndex(entry => entry.value === selected), 1);
        }
      }
    }
    while(state.players.filter(p=>p.alive).length>1) {
      const available=state.players.filter(p=>p.alive&&!assigned.has(p.id)).map(p=>p.id).sort();if(!available.length)break;
      // Evacuation takes the resident's ordinary assignment, before encounters
      // can involve them again. Its outcome follows the earlier public warning.
      const evacuating=available.find(id=>biomeStatus(state,state.players.find(p=>p.id===id)!.biome)==='evacuating');
      if (evacuating) {
        const resident=state.players.find(p=>p.id===evacuating)!;
        const dies=state.players.filter(p=>p.alive).length>2 && arenaRandom.next()<evacuationDeathChance(input,state,evacuating);
        if (stage(arenaTemplate(input,resident.biome,dies?'casualty':'escape'),{actor:evacuating})) {
          if (state.players.filter(p=>p.alive).length<=2 && !state.players.some(p=>p.alive&&!assigned.has(p.id)&&biomeStatus(state,p.biome)==='evacuating')) break;
          continue;
        }
      }
      const plans = new Map(available.map(id => [id, requestedTravel(id, state, events, phase, travelContent)]));
      const urgent = available.filter(id => ['warning', 'weather'].includes(plans.get(id) ?? ''));
      const overdue = available.filter(id => plans.get(id) === 'roam');
      const anchor=mechanics.pick(urgent.length ? urgent : overdue.length ? overdue : available);const sequence=events.length;
      const travel = plans.get(anchor) ?? null;
      const allowMultikill=phase.day>=2 && !events.some(e=>e.effects.filter(f=>f.kind==='eliminate').length>1) && arenaRandom.next()<0.06;
      let candidates:{value:Omit<Candidate, 'result'>;weight:number}[]=[];
      const addCandidate = (template: EventTemplate) => {
        // The opening equipment pool already assigned its limited weapon pickups.
        if (phase.kind === 'opening' && input.content.id === 'wild-broadcast' && template.effects.some(e =>
          e.kind === 'createItem' && input.content.items.some(i => i.id === e.definitionId && i.tags.includes('weapon')))) return;
        // Solo departures obey the same residence/weather gate as parties.
        if (template.travel && plans.get(anchor) !== template.travel) return;
        if (input.settings.personality === 'off' && (template.roles.some(r => r.traits?.length) || template.conditions.some(c => c.kind === 'trait'))) return;
        const party = template.travel && template.roles.length > 1;
        if (party && plans.get(anchor) !== template.travel) return;
        const participants = party ? available.filter(id => plans.get(id) === template.travel) : available;
        const bindings=findBindings(template,state,input.cast,input.content,participants,anchor,mechanics,input.settings.personality!=='off');if(!bindings)return;
        candidates.push({value:{template,bindings},weight:eventWeight(template,bindings,state,input,phase)});
      };
      const chooseValid = (): Candidate | null => {
        while (candidates.length) {
          const largest = travel ? Math.max(...candidates.map(candidate => candidate.value.template.roles.length)) : 1;
          const pool = travel ? candidates.filter(candidate => candidate.value.template.roles.length === largest) : candidates;
          let selected = weighted(pool, mechanics);
          if (!travel && input.content.id === 'wild-broadcast' && combatRecord(selected.template, selected.bindings, state, state, input.content)) {
            selected = chooseCombatMethod(pool, events, mechanics, wordingUses) ?? selected;
          }
          if (!travel && !['held-weapon', 'explosive'].includes(selected.template.combat?.method ?? '')) {
            const { template, bindings } = selected;
            const preview = combatRecord(template, bindings, state, state, input.content);
            // Prefer a usable held weapon when an armed tribute actually attacks.
            // Quiet inventory, survival and social assignments keep their normal odds.
            if (preview?.armed && mechanics.next() < 0.95) {
              const weaponAttacks = pool.filter(c => c.value.template.combat && ['held-weapon', 'explosive'].includes(c.value.template.combat.method) &&
                c.value.bindings[c.value.template.combat.attacker] === preview.attackerId);
              if (weaponAttacks.length) selected = weighted(preferUnusedCombatChoices(weaponAttacks, wordingUses), mechanics);
            }
          }
          const { template, bindings } = selected;
          const effectRandom=createRandom(`${input.settings.seed}:effects:${sequence}:${template.id}:${Object.values(bindings).join('|')}`);
          const result=applyEffects(state,template.effects,bindings,input.content,effectRandom,sequence,events,input);
          if (result) return { ...selected, result };
          // Removing an invalid transaction and sampling again retains weighted
          // selection among valid choices, without cloning every possible state.
          candidates = candidates.filter(candidate => candidate.value.template !== selected.template || candidate.value.bindings !== selected.bindings);
        }
        return null;
      };
      // A required departure does not need to stage hundreds of unrelated
      // encounters first. If every legal departure fails, use the usual search.
      if (travel) for (const template of travelContent.events) {
        if (template.travel === travel && template.phases.includes(phase.kind) && (!template.rare || allowMultikill)) addCandidate(template);
      }
      let chosen = chooseValid();
      // Gifts replace an ordinary assignment. A separate roll keeps the odds
      // independent of the number and weights of ordinary content templates.
      // Required departures retain priority, and the chance is never retried
      // when encounter cooldowns relax.
      if (!chosen && !finale && (phase.kind === 'day' || phase.kind === 'night') && sponsorGifts < MAX_SPONSOR_GIFTS) {
        const gifts = templates.filter(t => isSponsorGift(t) && t.phases.includes(phase.kind) &&
          (lastUsed[t.id] === undefined || phaseIndex - lastUsed[t.id] > t.cooldown));
        if (gifts.length && sponsorRandom.next() < sponsorChance(input.cast.players.find(p => p.id === anchor)?.team)) {
          candidates = [];
          gifts.forEach(addCandidate);
          if (candidates.length) {
            const { template, bindings } = weighted(candidates, sponsorRandom);
            const effectRandom = createRandom(`${input.settings.seed}:effects:${sequence}:${template.id}:${Object.values(bindings).join('|')}`);
            const result = applyEffects(state, template.effects, bindings, input.content, effectRandom, sequence, events, input);
            if (result) chosen = { template, bindings, result };
          }
        }
      }
      // Relax recent-template suppression, then cooldown, never hard eligibility.
      for(let relaxation=0;relaxation<3&&!chosen;relaxation++) {
        candidates = [];
        for(const template of templates) {
          if(phase.kind === 'opening' && input.content.id === 'wild-broadcast' && template.effects.some(e => e.kind === 'eliminate')) continue;
          if(isSponsorGift(template) || template.schedule || template.arena || template.category==='announcement' || !template.phases.includes(phase.kind)||(finale&&!template.effects.some(e=>e.kind==='eliminate')))continue;
          if (template.rare && !allowMultikill) continue;
          if (input.settings.personality === 'off' && (template.roles.some(r => r.traits?.length) || template.conditions.some(c => c.kind === 'trait'))) continue;
          if(template.travel !== travel && relaxation<2&&lastUsed[cooldownKey(template)]!==undefined&&phaseIndex-lastUsed[cooldownKey(template)]<=template.cooldown)continue;
          if(template.travel !== travel && relaxation===0&&events.slice(-3).some(e=>(cooldownKeys.get(e.templateId) ?? e.templateId)===cooldownKey(template)))continue;
          addCandidate(template);
        }
        chosen = chooseValid();
      }
      if (!chosen) {const template=fallback(finale);const bindings={actor:anchor};const result=applyEffects(state,template.effects,bindings,input.content,mechanics,sequence,events,input)!;chosen={template,bindings,result};}
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
