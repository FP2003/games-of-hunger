import type { CastDefinition, ContentPack, GameState, RunInput, Relationship, Effect, EventFact, RandomSource, EventTemplate, Phase, Condition } from '../domain';

const clone = <T>(v: T): T => structuredClone(v);
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export function getNemesis(state: GameState, playerId: string): string | null {
  if (!state.players.find(p => p.id === playerId)?.alive) return null;
  return state.relationships.filter(r => r.from === playerId && r.grudge >= 40 && state.players.find(p => p.id === r.to)?.alive)
    .sort((a, b) => b.grudge - a.grudge || compare(a.to, b.to))[0]?.to ?? null;
}
export function getAlliances(state: GameState): [string, string][] {
  return state.relationships.filter(r => r.trust >= 40 && compare(r.from, r.to) < 0 && state.players.find(p => p.id === r.from)?.alive && state.players.find(p => p.id === r.to)?.alive && state.relationships.some(s => s.from === r.to && s.to === r.from && s.trust >= 40)).map(r => [r.from, r.to]);
}
export function initialState(input: RunInput): GameState {
  return {
    players: input.cast.players.map(p => ({ id: p.id, alive: true, biome: 'ruins', markers: {} })),
    relationships: clone(input.cast.relationships),
    items: input.cast.players.flatMap((p, index) => p.signatureItem ? [{ id: `signature-${index}`, definitionId: `signature:${index}`, name: p.signatureItem, ownerId: p.id, biome: 'ruins' as const, destroyed: false }] : []),
  };
}
function edge(state: GameState, from: string, to: string): Relationship {
  let rel = state.relationships.find(r => r.from === from && r.to === to);
  if (!rel) { rel = { from, to, trust: 0, grudge: 0 }; state.relationships.push(rel); }
  return rel;
}
function adjust(state: GameState, from: string, to: string, trust: number, grudge: number) {
  const rel = edge(state, from, to); rel.trust = Math.max(-100, Math.min(100, rel.trust + trust)); rel.grudge = Math.max(0, Math.min(100, rel.grudge + grudge));
}
export interface EffectResult { state: GameState; facts: EventFact[] }
/** Failed transactions return null and leave the caller's state untouched. */
export function applyEffects(before: GameState, effects: readonly Effect[], bindings: Record<string, string>, content: ContentPack, random: RandomSource, sequence = 0, history: { sequence: number; facts: EventFact[] }[] = []): EffectResult | null {
  const state = clone(before); const facts: EventFact[] = [];
  const player = (role: string) => { const p = state.players.find(p => p.id === bindings[role]); if (!p?.alive) throw new Error('Participant is unavailable.'); return p; };
  const item = (role: string, definitionId?: string) => { const p = player(role); const result = state.items.filter(i => i.ownerId === p.id && !i.destroyed && (!definitionId || i.definitionId === definitionId)).sort((a,b) => compare(a.id,b.id))[0]; if (!result) throw new Error('Item is unavailable.'); return result; };
  const record = (fact: EventFact) => facts.push(fact);
  const move = (role: string, destination: 'adjacent' | GameState['players'][number]['biome']) => {
    const p = player(role); const adjacent = content.biomes.find(b => b.id === p.biome)?.adjacent ?? [];
    const next = destination === 'adjacent' ? random.pick([...adjacent].sort(compare)) : destination;
    if (!adjacent.includes(next)) throw new Error('Movement must follow an adjacent route.');
    p.biome = next; state.items.filter(i => i.ownerId === p.id).forEach(i => { i.biome = next; }); record({ type: 'move', actorId: p.id, biome: next });
  };
  try {
    for (const effect of effects) {
      switch (effect.kind) {
        case 'move': move(effect.role, effect.biome); break;
        case 'createItem': {
          const p = player(effect.role); const def = content.items.find(i => i.id === effect.definitionId); if (!def) throw new Error('Unknown item.');
          const instance = { id: `item-${sequence}-${state.items.length}`, definitionId: def.id, name: def.name, ownerId: p.id, biome: p.biome, destroyed: false };
          state.items.push(instance); record({ type: 'acquire', actorId: p.id, itemId: instance.id, itemDefinitionId: def.id }); break;
        }
        case 'acquireItem': {
          const p = player(effect.role); const ground = state.items.filter(i => !i.ownerId && !i.destroyed && i.biome === p.biome && (!effect.definitionId || i.definitionId === effect.definitionId)).sort((a,b) => compare(a.id,b.id))[0];
          if (!ground) throw new Error('No ground item.'); ground.ownerId = p.id; record({ type: 'acquire', actorId: p.id, itemId: ground.id, itemDefinitionId: ground.definitionId }); break;
        }
        case 'transferItem': {
          const held = item(effect.from, effect.definitionId), from = player(effect.from), to = player(effect.to); if (from.id === to.id) throw new Error('Transfer requires distinct players.');
          held.ownerId = to.id; held.biome = to.biome; record({ type: effect.fact, actorId: effect.fact === 'theft' ? to.id : from.id, targetId: effect.fact === 'theft' ? from.id : to.id, itemId: held.id, itemDefinitionId: held.definitionId });
          if (effect.fact === 'theft') adjust(state, from.id, to.id, -35, 45);
          if (content.items.find(d => d.id === held.definitionId)?.curse === 'tin') { adjust(state, from.id, to.id, -25, 25); record({ type: 'curse', actorId: to.id, targetId: from.id, itemId: held.id, itemDefinitionId: held.definitionId }); }
          break;
        }
        case 'dropItem': case 'destroyItem': {
          const p = player(effect.role), held = item(effect.role, effect.definitionId); held.ownerId = null; held.biome = p.biome; held.destroyed = effect.kind === 'destroyItem';
          record({ type: effect.kind === 'destroyItem' ? 'destroy' : 'drop', actorId: p.id, itemId: held.id, itemDefinitionId: held.definitionId }); break;
        }
        case 'relationship': {
          const from = player(effect.from), to = player(effect.to); if (from.id === to.id) throw new Error('Invalid relationship.');
          adjust(state, from.id, to.id, effect.trust, effect.grudge);
          if (effect.fact) {
            if (effect.fact === 'revenge') {
              const prior = [...history].reverse().find(e => e.facts.some(f => ['theft','betrayal','elimination'].includes(f.type) && f.actorId === to.id && f.targetId === from.id));
              if (!prior) throw new Error('Revenge needs a previous hostile action.'); record({ type: 'revenge', actorId: from.id, targetId: to.id, sourceEvent: prior.sequence });
            } else {
              // Assistance/betrayal updates the affected person's opinion of
              // the helper/betrayer. Credit the actual action, not its observer.
              const reactive = effect.fact === 'assistance' || effect.fact === 'betrayal';
              record({ type: effect.fact, actorId: reactive ? to.id : from.id, targetId: reactive ? from.id : to.id });
            }
          }
          break;
        }
        case 'setMarker': {
          const p = player(effect.role), def = content.markers.find(m => m.id === effect.marker); if (!def) throw new Error('Unknown marker.');
          let value = effect.value;
          if (def.type === 'player') { value = bindings[String(value)] ?? value; if (!state.players.find(p => p.id === value)?.alive) throw new Error('Marker target is unavailable.'); }
          if (typeof value !== (def.type === 'player' ? 'string' : def.type)) throw new Error('Invalid marker value.');
          p.markers[effect.marker] = value; record({ type: 'chain', actorId: p.id, ...(def.type === 'player' ? { targetId: String(value) } : {}), marker: def.id }); break;
        }
        case 'removeMarker': { const p = player(effect.role); if (!content.markers.some(m => m.id === effect.marker)) throw new Error('Unknown marker.'); delete p.markers[effect.marker]; break; }
        case 'eliminate': {
          const p = player(effect.role); const credit = effect.credit ? player(effect.credit).id : undefined; if (credit === p.id) throw new Error('Invalid elimination credit.');
          p.alive = false; p.markers = {}; record({ type: 'elimination', targetId: p.id, ...(credit ? { actorId: credit } : {}), biome: p.biome });
          for (const held of state.items.filter(i => i.ownerId === p.id)) { held.ownerId = null; held.biome = p.biome; record({ type: 'drop', actorId: p.id, itemId: held.id, itemDefinitionId: held.definitionId }); }
          for (const other of state.players) for (const marker of content.markers.filter(m => m.type === 'player')) if (other.markers[marker.id] === p.id) delete other.markers[marker.id];
          if (credit) { const prior = [...history].reverse().find(e => e.facts.some(f => ['theft','betrayal'].includes(f.type) && f.actorId === p.id && f.targetId === credit)); if (prior) record({ type: 'revenge', actorId: credit, targetId: p.id, sourceEvent: prior.sequence }); }
          break;
        }
        case 'curse': {
          const p = player(effect.role), held = item(effect.role, effect.definitionId), def = content.items.find(d => d.id === held.definitionId); if (!def?.curse) throw new Error('Not a registered curse.');
          record({ type: 'curse', actorId: p.id, itemId: held.id, itemDefinitionId: def.id });
          if (def.curse === 'compass') move(effect.role, 'adjacent');
          if (def.curse === 'tin') { const target = Object.values(bindings).filter(id => id !== p.id).sort(compare)[0]; if (!target || !state.players.find(p => p.id === target)?.alive) throw new Error('Tin curse requires another living participant.'); adjust(state, p.id, target, -30, 30); facts[facts.length - 1].targetId = target; }
          break;
        }
        default: throw new Error('Unsupported effect.');
      }
    }
    if (!state.players.some(p => p.alive)) return null;
    for (const p of state.players.filter(p => p.alive)) { const nemesis = getNemesis(state, p.id); if (nemesis && nemesis !== getNemesis(before, p.id)) record({ type: 'nemesis', actorId: p.id, targetId: nemesis }); }
    state.relationships.sort((a,b) => compare(a.from,b.from) || compare(a.to,b.to));
    return { state, facts };
  } catch { return null; }
}

function conditionsPass(conditions: Condition[], bindings: Record<string,string>, state: GameState, cast: CastDefinition, content: ContentPack, partial: boolean): boolean {
  const held = (id: string, def?: string, tag?: string) => state.items.some(i => i.ownerId === id && !i.destroyed && (!def || i.definitionId === def) && (!tag || content.items.find(d => d.id === i.definitionId)?.tags.includes(tag)));
  return conditions.every(c => {
    const refs = 'role' in c ? [c.role] : 'from' in c ? [c.from,c.to] : [];
    if (partial && refs.some(r => !bindings[r])) return true;
    const p = 'role' in c ? state.players.find(p => p.id === bindings[c.role]) : undefined;
    switch (c.kind) {
      case 'biome': return !!p && c.biomes.includes(p.biome);
      case 'trait': return cast.players.find(p => p.id === bindings[c.role])?.traits.includes(c.trait) ?? false;
      case 'item': return held(bindings[c.role],c.definitionId,c.tag);
      case 'relationship': { const r = state.relationships.find(r => r.from === bindings[c.from] && r.to === bindings[c.to]) ?? { trust:0,grudge:0 }; return (c.minTrust === undefined || r.trust >= c.minTrust) && (c.maxTrust === undefined || r.trust <= c.maxTrust) && (c.minGrudge === undefined || r.grudge >= c.minGrudge); }
      case 'marker': { if (!p) return false; const exists = c.marker in p.markers; if (exists !== c.exists) return false; if (c.value === undefined || !exists) return true; const def = content.markers.find(m => m.id === c.marker); if (def?.type === 'player' && typeof c.value === 'string' && !bindings[c.value] && partial) return true; return p.markers[c.marker] === (def?.type === 'player' ? bindings[String(c.value)] ?? c.value : c.value); }
      case 'survivors': { const n = state.players.filter(p => p.alive).length; return n >= c.min && (c.max === undefined || n <= c.max); }
      case 'nemesis': return getNemesis(state, bindings[c.from]) === bindings[c.to];
      case 'groundItem': return !!p && state.items.some(i => !i.destroyed && !i.ownerId && i.biome === p.biome && (!c.definitionId || i.definitionId === c.definitionId));
      default: return false;
    }
  });
}

/** Bounded DFS with early condition pruning; first role is the phase's chosen unassigned anchor. */
export function findBindings(template: EventTemplate, state: GameState, cast: CastDefinition, content: ContentPack, available: string[], anchor: string, random: RandomSource): Record<string,string> | null {
  const ids = [...available].sort(compare); const offset = ids.length ? random.int(ids.length) : 0; const ordered = [...ids.slice(offset),...ids.slice(0,offset)]; let visits = 0;
  const visit = (index: number, bindings: Record<string,string>): Record<string,string> | null => {
    if (++visits > 3000) return null;
    if (index === template.roles.length) return conditionsPass(template.conditions,bindings,state,cast,content,false) ? bindings : null;
    const role = template.roles[index];
    for (const id of index === 0 ? [anchor] : ordered) {
      const p = state.players.find(p => p.id === id), definition = cast.players.find(p => p.id === id);
      if (!p?.alive || Object.values(bindings).includes(id) || role.traits?.some(t => !definition?.traits.includes(t)) || (role.itemDefinitionId && !state.items.some(i => i.ownerId === id && !i.destroyed && i.definitionId === role.itemDefinitionId))) continue;
      if (template.scope === 'local' && index && p.biome !== state.players.find(p => p.id === anchor)?.biome) continue;
      const next = { ...bindings,[role.id]:id }; if (!conditionsPass(template.conditions,next,state,cast,content,true)) continue;
      const found = visit(index+1,next); if (found) return found;
    }
    return null;
  };
  return visit(0,{});
}

export function clearPhaseMarkers(state: GameState, content: ContentPack): GameState {
  const next = clone(state); for (const p of next.players) for (const m of content.markers) if (m.lifetime === 'phase') delete p.markers[m.id]; return next;
}
