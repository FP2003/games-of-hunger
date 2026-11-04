import type { ContentPack, Effect, EventTemplate } from '../domain';
import { weaponLootWeights } from './weapon-catalogue';

/** All arrival/resident pairs share one delivery and one weighted bundle choice. */
export function publicResupplyScenes(items: ContentPack['items']): EventTemplate[] {
  const utility = [
    ['ration', 'flask', 'blanket'], ['rope', 'lantern', 'blanket'],
    ['scrap', 'flask', 'rope'], ['blanket', 'lantern', 'scrap'],
    ['flask', 'ration', 'rope'], ['lantern', 'blanket', 'ration'],
  ];
  const bundles = [
    ...utility.map((contents, index) => ({ id: `utility-${index + 1}`, contents, weight: 90 / utility.length })),
    ...weaponLootWeights(10, 0.2).map(([weapon, weight], index) => ({
      id: `weapon-${weapon}`, contents: [weapon, ...utility[index % utility.length].slice(1)], weight,
    })),
  ];
  const name = (id: string) => {
    const item = items.find(item => item.id === id);
    if (!item) throw new Error(`Unknown public resupply item: ${id}`);
    return item.name;
  };
  return bundles.flatMap(bundle => [false, true].map<EventTemplate>(arriving => {
    const [kept, ...ground] = bundle.contents;
    const keptName = name(kept), groundNames = ground.map(name).join(' and ');
    const approach = arriving ? '{actor.name} follows the delivery beacon back to the Center Podium' : '{actor.name} opens the newly delivered crate at the Center Podium';
    const effects: Effect[] = [
      ...(arriving ? [{ kind: 'move' as const, role: 'actor', biome: 'ruins' as const }] : []),
      { kind: 'createItem', role: 'actor', definitionId: kept },
      { kind: 'setMarker', role: 'actor', marker: 'podium-resupply-collected', value: true },
      ...ground.flatMap<Effect>(definitionId => [
        { kind: 'createItem', role: 'actor', definitionId },
        { kind: 'dropItem', role: 'actor', definitionId },
      ]),
    ];
    return {
      id: `podium-resupply-${bundle.id}${arriving ? '-arrival' : ''}`,
      category: 'survival', phases: ['day'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor' }],
      conditions: [{ kind: 'biome', role: 'actor', biomes: arriving ? ['forest', 'swamp', 'mountains', 'desert', 'tundra'] : ['ruins'] }],
      schedule: { day: 3, group: 'podium-resupply', choice: bundle.id },
      lootSource: 'resupply', weight: bundle.weight, cooldown: 0, effects,
      variants: [
        `A cargo drone lowers a fresh supply crate onto the podium. ${approach} and claims ${keptName}, leaving ${groundNames} on the ground for another tribute.`,
        `The public delivery beacon lights up. ${approach}, takes ${keptName}, and sets out ${groundNames} beside the crate for whoever comes next.`,
        `A new shipment arrives beneath a cargo drone. ${approach} and collects ${keptName}. ${groundNames} remain on the podium ground for another visitor.`,
      ],
    };
  }));
}
