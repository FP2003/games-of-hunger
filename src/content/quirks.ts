import type { Condition, ConfessionalTemplate, Effect, EventTemplate, Trait } from '../domain';

const allTones: EventTemplate['tones'] = ['dramatic', 'absurd', 'mixed'];
const behavior = (kind: NonNullable<EventTemplate['behaviors']>[number]['kind'], role = 'actor') => ({ role, kind });
function scene(id: string, trait: Trait, variants: string[], effects: Effect[], options: Partial<EventTemplate> = {}): EventTemplate {
  return { id: `quirk-${id}`, category: 'survival', phases: ['day', 'night'], tones: allTones, scope: 'local', roles: [{ id: 'actor', traits: [trait] }], conditions: [], weight: 2.5, cooldown: 4, variants, effects, ...options };
}
const route: Effect[] = [{ kind: 'move', role: 'actor', biome: 'adjacent', avoidDanger: true }];
const food: Effect[] = [{ kind: 'createItem', role: 'actor', definitionId: 'ration' }];
const theft: Effect[] = [{ kind: 'transferItem', from: 'target', to: 'actor', fact: 'theft' }];
const eat: Effect[] = [{ kind: 'consumeItem', role: 'actor', definitionId: 'ration' }];
const unlit: Condition[] = [{ kind: 'item', role: 'actor', definitionId: 'lantern', exists: false }];

export const quirkScenes: EventTemplate[] = [
  scene('early-riser-cache', 'early-riser', [
    '{actor.name} uses the daylight in {biome} to check a roadside supply box and finds sealed rations.',
    'With enough light to see the latch in {biome}, {actor.name} opens a supply box and takes a ration pack.',
    '{actor.name} searches beneath a supply sign in {biome} during the day and retrieves sealed rations.',
    'Daylight reveals a food box beside the path in {biome}. {actor.name} checks inside and pockets the rations.',
    '{actor.name} spends the daylight search in {biome} checking delivery lockers. One still holds a ration pack.',
    'A careful daytime search of the supply stop in {biome} gives {actor.name} sealed rations.',
    '{actor.name} checks the sunlit side of a supply shelter in {biome} and finds a food parcel tucked behind its sign.',
  ], food, { phases: ['day'], behaviors: [behavior('forage')] }),
  scene('early-riser-route', 'early-riser', [
    '{actor.name} checks the route in daylight and sets out for {biome}.',
    'Using the daylight to choose an exit, {actor.name} reaches {biome}.',
    '{actor.name} studies the trail markers before setting off into {biome}.',
    'After checking the path in daylight, {actor.name} crosses into {biome}.',
    '{actor.name} packs up during the day and takes a clear route into {biome}.',
    'The daylight gives {actor.name} time to check an exit into {biome}.',
    '{actor.name} follows a route checked in daylight and arrives in {biome}.',
  ], route, { phases: ['day'], behaviors: [behavior('safe-travel')] }),
  scene('night-owl-cover', 'night-owl', [
    '{actor.name} settles into cover in {biome}, letting distant footsteps pass through the night.',
    'In the darkness of {biome}, {actor.name} waits behind a supply shelter rather than crossing the open trail.',
    '{actor.name} uses a shadowed recess in {biome} to keep out of sight for the turn.',
    'A dark corner of {biome} gives {actor.name} a place to watch the path without stepping onto it.',
    '{actor.name} stays still beneath an overhang in {biome} until the night grows quiet again.',
    'Rather than show a silhouette on the path in {biome}, {actor.name} waits behind its low barrier.',
    '{actor.name} spends the night assignment concealed beside a shelter in {biome}.',
  ], [], { phases: ['night'], behaviors: [behavior('conceal'), behavior('wait')] }),
  scene('night-owl-route', 'night-owl', [
    '{actor.name} checks the trail by night and slips into {biome}.',
    'Keeping to the quiet path, {actor.name} reaches {biome} after dark.',
    '{actor.name} takes a sheltered night route into {biome}.',
    'After listening at the junction, {actor.name} moves into {biome}.',
    '{actor.name} follows the quieter trail through the night into {biome}.',
    'Moving between covered stretches, {actor.name} crosses into {biome}.',
    '{actor.name} leaves by a quiet exit and arrives in {biome} at night.',
  ], route, { phases: ['night'], behaviors: [behavior('scout'), behavior('safe-travel')] }),
  scene('on-guard-escape', 'on-guard', [
    '{actor.name} spots a raised weapon and takes an opening exit into {biome}.',
    'Watching the nearest contestants, {actor.name} ducks the opening fight and reaches {biome}.',
    '{actor.name} notices someone charging the supply rack and breaks away into {biome}.',
    'A glance behind saves {actor.name} from joining the opening brawl. The exit leads into {biome}.',
    '{actor.name} sees the central crowd closing in and takes a clear route into {biome}.',
    'Keeping an eye on the weapon rack, {actor.name} leaves the bloodbath for {biome}.',
    '{actor.name} catches the movement of an approaching rival and escapes into {biome}.',
  ], route, { category: 'opening', phases: ['opening'], behaviors: [behavior('guarded-opening'), behavior('safe-travel')] }),
  scene('on-guard-supplies', 'on-guard', [
    '{actor.name} checks both approaches to a central food box before taking a sealed ration pack.',
    'With one eye on the opening fight, {actor.name} reaches into a supply box and secures sealed rations.',
    '{actor.name} waits for the crowd to turn toward the weapon rack, then takes rations from the central food box.',
    'Keeping the supply crate between the crowd and the path, {actor.name} retrieves a ration pack.',
    '{actor.name} watches the nearest contestants while lifting sealed rations from a central crate.',
    'A guarded approach to the central supplies gives {actor.name} a ration pack without joining the fight.',
    '{actor.name} checks the space behind the central food rack and claims a pack of sealed rations.',
  ], food, { category: 'opening', phases: ['opening'], behaviors: [behavior('guarded-opening')] }),
  scene('forest-wise-cache', 'forest-wise', [
    '{actor.name} follows old supply blazes through the forest and finds sealed rations in a trail box.',
    'A faded trail symbol in the forest leads {actor.name} to a food cache containing sealed rations.',
    '{actor.name} recognizes a supply mark on a forest post and retrieves a ration pack from the box below it.',
    'Checking where the forest service paths meet, {actor.name} discovers sealed rations in a low locker.',
    '{actor.name} reads the forest trail marks and searches beneath a supply board. A ration pack is still there.',
    'A familiar pattern of blazes draws {actor.name} to a forest cache with sealed food inside.',
    '{actor.name} checks a delivery box at a forest trail junction and takes the rations left inside.',
  ], food, { conditions: [{ kind: 'biome', role: 'actor', biomes: ['forest'] }], behaviors: [behavior('forage')] }),
  scene('forest-wise-route', 'forest-wise', [
    '{actor.name} reads the forest trail marks and follows an exit into {biome}.',
    'An old forest service path takes {actor.name} into {biome}.',
    '{actor.name} chooses a marked forest exit and reaches {biome}.',
    'Following a forest boundary trail, {actor.name} crosses into {biome}.',
    '{actor.name} picks out a maintained forest route leading into {biome}.',
    'The forest junction marks give {actor.name} a route into {biome}.',
    '{actor.name} leaves the forest by a service trail and enters {biome}.',
  ], route, { conditions: [{ kind: 'biome', role: 'actor', biomes: ['forest'] }], behaviors: [behavior('safe-travel')] }),
  scene('kleptomaniac-pocket', 'kleptomaniac', [
    '{actor.name} takes the {item} from {target.name} during a brief stop in {biome}. {target.name} notices the theft.',
    'While {target.name} checks the path in {biome}, {actor.name} pockets the {item}. The missing possession is quickly noticed.',
    '{actor.name} cannot leave {target.name}\'s {item} alone in {biome}. {target.name} catches the last movement of the theft.',
    'At a trail stop in {biome}, {actor.name} quietly takes the {item}. {target.name} sees where the possession has gone.',
    '{target.name} turns back in {biome} to find {actor.name} taking the {item}. The theft ends the friendly pause.',
    '{actor.name} slips the {item} away from {target.name} in {biome}, earning an angry look when the loss is discovered.',
    'The meeting in {biome} turns sour when {actor.name} takes the {item} and {target.name} realizes what happened.',
  ], theft, { category: 'social', roles: [{ id: 'actor', traits: ['kleptomaniac'] }, { id: 'target' }], conditions: [{ kind: 'item', role: 'target' }], behaviors: [behavior('theft')] }),
  scene('kleptomaniac-spare', 'kleptomaniac', [
    'Already carrying equipment in {biome}, {actor.name} still takes {target.name}\'s {item}. {target.name} notices the unnecessary theft.',
    '{actor.name} has possessions of {actor.possessive} own in {biome}, but takes the {item} from {target.name} anyway. The theft is noticed.',
    'Carrying equipment does not stop {actor.name} stealing {target.name}\'s {item} in {biome}. {target.name} sees the loss.',
    '{target.name} notices {actor.name} adding the stolen {item} to an already occupied pack in {biome}.',
    'Despite already being equipped, {actor.name} steals the {item} at the stop in {biome}. {target.name} catches on.',
    '{actor.name} makes room among existing possessions for {target.name}\'s {item} in {biome}. The petty theft is discovered.',
    'In {biome}, {actor.name} reaches past carried equipment to take the {item} from {target.name}, who notices the theft.',
  ], theft, { category: 'social', roles: [{ id: 'actor', traits: ['kleptomaniac'] }, { id: 'target' }], conditions: [{ kind: 'item', role: 'target' }, { kind: 'item', role: 'actor' }], behaviors: [behavior('theft')] }),
  scene('curious-find', 'curious', [
    '{actor.name} opens an unmarked cache in {biome} without checking it first. Inside is a sealed ration pack.',
    'An unfamiliar box in {biome} gets the better of {actor.name}\'s caution. This time it contains sealed rations.',
    '{actor.name} lifts the lid of an unmarked trail box in {biome} and discovers a ration pack.',
    'Rather than leave a strange cache alone in {biome}, {actor.name} opens it and takes the sealed food inside.',
    '{actor.name} investigates a loose panel on a supply box in {biome}. A ration pack lies behind it.',
    'A rattling cache draws {actor.name} off the path in {biome}. Opening it reveals sealed rations.',
    '{actor.name} cannot resist checking a box wedged beneath a sign in {biome}. The search yields a ration pack.',
  ], food, { behaviors: [behavior('risky-inspection')] }),
  scene('curious-empty', 'curious', [
    '{actor.name} spends the turn opening an unfamiliar locker in {biome}. It is empty.',
    'An unmarked panel occupies {actor.name} in {biome} until the turn is gone. Behind it is a blank wall.',
    '{actor.name} investigates a clicking latch in {biome}, only to discover an empty equipment housing.',
    'A strange box in {biome} keeps {actor.name} busy for the whole turn. There is nothing inside to take.',
    '{actor.name} takes apart a jammed cache lid in {biome}. The empty compartment rewards the effort with nothing.',
    'Curiosity sends {actor.name} to inspect an abandoned control box in {biome}. The turn ends without supplies or movement.',
    '{actor.name} checks every compartment of an unfamiliar locker in {biome}, spending the turn on an empty box.',
  ], [], { behaviors: [behavior('risky-inspection')] }),
  scene('curious-cut', 'curious', [
    '{actor.name} lifts a loose cache panel in {biome} without checking its hinge. The jagged edge cuts the shoulder, leaving a survivable bleeding wound.',
    'Investigating a broken locker in {biome}, {actor.name} catches a shoulder on its sharp frame. The cut is bleeding, but {actor.name} survives.',
    '{actor.name} reaches into a damaged cache in {biome}. A loose metal flap scrapes the shoulder deeply enough to bleed; the injury is not fatal.',
    'An unfamiliar hatch in {biome} swings back as {actor.name} opens it. The torn edge cuts the shoulder, leaving {actor.name} alive but bleeding.',
    '{actor.name} squeezes beside an unmarked supply box in {biome} to inspect its latch. A sharp bracket cuts the shoulder; {actor.name} survives with the wound bleeding.',
    'Curiosity draws {actor.name} under a loose panel in {biome}. Its edge catches the shoulder, causing a bleeding cut that {actor.name} survives.',
    '{actor.name} tests a broken cache hinge in {biome}. The slipping lid cuts the shoulder, leaving a bleeding wound without killing {actor.object}.',
  ], [{ kind: 'setMarker', role: 'actor', marker: 'bleeding-shoulder', value: true }], { category: 'hazard', weight: 0.8, conditions: [{ kind: 'marker', role: 'actor', marker: 'bleeding-shoulder', exists: false }], behaviors: [behavior('risky-inspection')] }),
  scene('compulsive-eater-delay', 'compulsive-eater', [
    '{actor.name} stops to eat the carried rations in {biome} instead of checking the next route. The entire pack is gone by the end of the turn.',
    'The ration pack in {actor.name}\'s hands proves more tempting than the trail in {biome}. {actor.name} eats it all and makes no progress this turn.',
    '{actor.name} opens the carried food in {biome} before making a plan. The turn goes on finishing the rations.',
    'At a junction in {biome}, {actor.name} puts the route decision aside and eats an entire carried ration pack.',
    '{actor.name} starts picking at the carried rations in {biome} and keeps eating until none remain. The search waits for another turn.',
    'Rather than investigate the supply stop in {biome}, {actor.name} sits down and finishes the carried food.',
    '{actor.name} spends the assignment in {biome} eating a ration pack that could have been kept for later.',
  ], eat, { conditions: [{ kind: 'item', role: 'actor', definitionId: 'ration' }], behaviors: [behavior('eat')] }),
  scene('compulsive-eater-night', 'compulsive-eater', [
    'Instead of watching the trail in {biome}, {actor.name} opens the carried rations after dark and eats the whole pack.',
    '{actor.name} reaches for a ration pack during the night in {biome}. A few bites turn into the entire meal, using the turn.',
    'Night in {biome} finds {actor.name} occupied with the carried food. The rations are finished before another plan is made.',
    '{actor.name} spends the night assignment in {biome} unwrapping and finishing the rations instead of scouting.',
    'A food wrapper rustles in {biome} as {actor.name} eats the carried ration pack rather than checking the dark trail.',
    '{actor.name} plans a short food break in {biome} after dark. Finishing the entire ration pack takes the assignment.',
    'The night search in {biome} never starts: {actor.name} settles down with the carried rations and eats them all.',
  ], eat, { phases: ['night'], conditions: [{ kind: 'item', role: 'actor', definitionId: 'ration' }], behaviors: [behavior('eat')] }),
  scene('afraid-dark-wait', 'afraid-of-dark', [
    '{actor.name} waits beside a shelter in {biome}, unwilling to take the unlit trail alone tonight.',
    'Without a lantern in {biome}, {actor.name} spends the night assignment at the shelter entrance instead of setting off.',
    '{actor.name} peers down the dark path in {biome} and stays by the trail shelter for the turn.',
    'The darkness beyond a shelter in {biome} keeps {actor.name} from starting a solitary search tonight.',
    '{actor.name} stops where the path vanishes into darkness in {biome}. With no lantern, the turn passes in hesitation.',
    'A night departure in {biome} feels too daunting without light. {actor.name} waits in a sheltered corner.',
    '{actor.name} stays beside a familiar trail marker in {biome}, reluctant to walk into the night alone.',
  ], [], { phases: ['night'], conditions: unlit, behaviors: [behavior('wait')] }),
  scene('afraid-dark-company', 'afraid-of-dark', [
    '{actor.name} asks to wait near {target.name} in {biome}, finding the unlit night easier with company. Both spend the turn at the shelter.',
    'Without a lantern in {biome}, {actor.name} joins {target.name} at a resting place. They stay together for the night assignment.',
    '{actor.name} is reluctant to face the dark trail in {biome} alone. {target.name} agrees to share the turn at the shelter.',
    'In {biome}, {actor.name} asks {target.name} for company rather than taking the night path alone. They wait together.',
    'The unlit night in {biome} draws {actor.name} to {target.name}\'s resting place. Both stay there for the turn.',
    '{actor.name} feels less exposed beside {target.name} in {biome}. With no lantern to take onto the trail, they spend the night assignment together.',
    '{target.name} shares a sheltered stop in {biome} with {actor.name}, who is unwilling to search the dark paths alone. The turn passes in company.',
  ], [], { category: 'social', phases: ['night'], roles: [{ id: 'actor', traits: ['afraid-of-dark'] }, { id: 'target' }], conditions: [...unlit, { kind: 'relationship', from: 'actor', to: 'target', minTrust: 0 }, { kind: 'relationship', from: 'target', to: 'actor', minTrust: 0 }], behaviors: [behavior('company')] }),
];

const interviews: { trait: Trait; triggers: ConfessionalTemplate['triggers']; variants: string[] }[] = [
  { trait: 'early-riser', triggers: ['move', 'acquire'], variants: ['I can see what I am doing while the light lasts.', 'Daylight makes a plan easier to follow.', 'I wanted to get something done before dark.', 'A clear view of the path helps.', 'There is enough light to check things properly.', 'I would rather use the daylight than waste it.', 'That was a useful way to spend the day.'] },
  { trait: 'night-owl', triggers: ['move', 'survival'], variants: ['I find it easier to listen at night.', 'The quiet gives me time to think.', 'Darkness is something I can work with.', 'I let my eyes adjust before doing anything.', 'There is no need to rush just because it is dark.', 'I am comfortable keeping quiet after sunset.', 'I can make use of a quiet night.'] },
  { trait: 'on-guard', triggers: ['move', 'acquire'], variants: ['I kept watching the people nearest me.', 'I wanted to see trouble before it reached me.', 'The first thing I checked was the way out.', 'I did not stop watching the crowd.', 'That opening needed more attention than enthusiasm.', 'I kept an eye on the approaches.', 'I tried to leave myself room to react.'] },
  { trait: 'forest-wise', triggers: ['move', 'acquire'], variants: ['The forest marks are useful if you know what to look for.', 'I recognized the trail signs.', 'Those service paths still have a purpose.', 'I checked the marks before choosing.', 'The old trail posts helped me make sense of it.', 'I have a better idea of what to look for among the trees.', 'A forest junction can tell you quite a lot.'] },
  { trait: 'kleptomaniac', triggers: ['theft'], variants: ['I saw it and reached for it.', 'I should have left their things alone.', 'That was not worth the look they gave me.', 'I did not have a good reason to take it.', 'It was within reach. That is a poor excuse.', 'My hands made that decision too quickly.', 'I have made another person angry over a possession.'] },
  { trait: 'curious', triggers: ['acquire', 'survival', 'chain'], variants: ['I wanted to know what was inside.', 'Leaving an unfamiliar box alone is harder than it sounds.', 'I should probably check before touching things.', 'The question got ahead of the sensible part.', 'I saw something unfamiliar and had to look.', 'I opened it before I had really thought it through.', 'I need to learn the difference between interesting and useful.'] },
  { trait: 'compulsive-eater', triggers: ['consume'], variants: ['I meant to leave some for later.', 'The wrapper is empty now.', 'I started eating and did not stop.', 'That food could have waited.', 'I used the whole break on the meal.', 'Carrying it was harder than eating it.', 'I should have made a plan before opening the food.'] },
  { trait: 'afraid-of-dark', triggers: ['survival'], variants: ['I cannot make myself like an unlit path.', 'I would feel better with a lantern.', 'The darkness makes every sound feel closer.', 'I need some light before I feel ready.', 'I am not comfortable out there after dark.', 'I keep looking for the edge of the shadows.', 'I wish I could see farther than the next few steps.'] },
];

export const quirkInterviews: ConfessionalTemplate[] = interviews.map(({ trait, triggers, variants }) => ({
  id: `interview-quirk-${trait}`, traits: [trait], triggers, variants, speaker: 'actor', tones: allTones, cooldown: 8,
  eventIds: quirkScenes.filter(scene => scene.roles[0].traits?.includes(trait)).map(scene => scene.id),
}));

/** Attach semantics from declared effects, never from wording or template names. */
export function withQuirkBehaviors(template: EventTemplate): EventTemplate {
  if (template.behaviors || template.arena || template.schedule || template.category === 'curse' || template.category === 'finale') return template;
  const behaviors: NonNullable<EventTemplate['behaviors']> = [];
  const add = (role: string, kind: NonNullable<EventTemplate['behaviors']>[number]['kind']) => {
    if (!behaviors.some(existing => existing.role === role && existing.kind === kind)) behaviors.push(behavior(kind, role));
  };
  const peaceful = !template.effects.some(effect => effect.kind === 'eliminate');
  for (const effect of template.effects) {
    if (effect.kind === 'transferItem' && effect.fact === 'theft') add(effect.to, 'theft');
    if (effect.kind === 'consumeItem' && effect.definitionId === 'ration') add(effect.role, 'eat');
    if (peaceful && ((effect.kind === 'move' && (effect.avoidDanger || template.category === 'opening')) || effect.kind === 'moveGroup')) {
      for (const role of effect.kind === 'moveGroup' ? effect.roles : [effect.role]) add(role, 'safe-travel');
    }
    if (peaceful && template.category === 'survival' && (effect.kind === 'createItem' || effect.kind === 'acquireItem')) add(effect.role, 'forage');
    if (effect.kind === 'relationship' && effect.trust > 0 && template.category === 'social' && peaceful) { add(effect.from, 'company'); add(effect.to, 'company'); }
  }
  return behaviors.length ? { ...template, behaviors } : template;
}
