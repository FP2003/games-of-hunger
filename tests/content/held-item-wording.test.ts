import { expect, it } from 'vitest';
import { defaultContentPack } from '../../src/content';
import { DEFAULT_SETTINGS, type RunInput, type EventNarrativeInput } from '../../src/domain';
import { applyEffects, createRandom, initialState } from '../../src/engine';
import { renderTemplate } from '../../src/narrative';

it.each([
  ['rope-crossing-help','rope','rescue rope'],
  ['blanket-shared-night','blanket','emergency blanket'],
  ['mirror-warning','scrap','signal mirror'],
])('names the held tool in every %s variant without consuming it',(id,definitionId,label)=>{
  const input: RunInput={cast:{version:1,title:'Helpful tools',players:[{id:'a',name:'Alex',traits:[]},{id:'b',name:'Blair',traits:[]}],relationships:[]},settings:{...DEFAULT_SETTINGS,seed:'held-tools'},content:defaultContentPack,lore:{facts:[]}};
  const template=input.content.events.find(t=>t.id===id)!;
  let before=initialState(input);
  before=applyEffects(before,[{kind:'createItem',role:'actor',definitionId:'ration'},{kind:'createItem',role:'actor',definitionId}],{actor:'a'},input.content,createRandom('held'))!.state;
  const result=applyEffects(before,template.effects,{actor:'a',target:'b'},input.content,createRandom('help'))!;
  expect(result.facts.every(f=>!f.itemId&&!f.itemDefinitionId)).toBe(true);
  expect(result.state.items).toEqual(before.items);
  const ctx: EventNarrativeInput={...input,template,bindings:{actor:'a',target:'b'},before,after:result.state,facts:result.facts,phase:{kind:'night',index:2,day:1},sequence:0,random:createRandom('words')};
  for(const text of template.variants){expect(renderTemplate(text,ctx)).toContain(label);expect(renderTemplate(text,ctx)).not.toMatch(/the item|sealed rations/);}
  // Preserve the actual instance label rather than substituting a definition
  // name or the unrelated rations appearing first in the inventory.
  ctx.after.items.find(item=>item.definitionId===definitionId)!.name='custom-labelled tool';
  expect(renderTemplate(template.variants[0],ctx)).toContain('custom-labelled tool');
});
