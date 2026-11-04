import type { Condition, ConfessionalTemplate, Effect, EventTemplate, Trait } from '../domain';

function scene(id: string, trait: Trait, variants: string[], effects: Effect[] = [], options: Partial<EventTemplate> = {}): EventTemplate {
  return { id: `trait-${id}`, category: 'survival', phases: ['day', 'night'], tones: ['dramatic', 'absurd', 'mixed'], scope: 'local', roles: [{ id: 'actor', traits: [trait] }], conditions: [], effects, variants, weight: 3.5, cooldown: 4, ...options };
}
const friendly: Condition[] = [
  { kind: 'relationship', from: 'actor', to: 'target', minTrust: 0 },
  { kind: 'relationship', from: 'target', to: 'actor', minTrust: 0 },
];
const assistance: Effect = { kind: 'relationship', from: 'target', to: 'actor', trust: 20, grudge: -5, fact: 'assistance' };

export const expandedTraitScenes: EventTemplate[] = [
  scene('tracker-route', 'tracker', [
    '{actor.name} follows fresh tracks along a service trail into {biome}.',
    'Reading the tracks at a fork, {actor.name} chooses the route into {biome}.',
    '{actor.name} picks out a fresh trail and follows it into {biome}.',
    'A line of footprints leads {actor.name} onward into {biome}.',
    '{actor.name} follows a clear set of tracks across the boundary into {biome}.',
    'Fresh prints give {actor.name} a route into {biome}.',
    '{actor.name} takes the trail with the freshest tracks and reaches {biome}.',
  ], [{ kind: 'move', role: 'actor', biome: 'adjacent', avoidDanger: true }]),
  scene('tracker-loop', 'tracker', [
    '{actor.name} follows overlapping tracks in {biome}, only to return to the same trail marker. The search uses the turn without finding a new route.',
    'Tracks double back through {biome}. {actor.name} spends the available time sorting them out and ends where the search began.',
    '{actor.name} studies a muddled trail in {biome} and follows it around a loop. No useful route emerges before the turn ends.',
    'A promising line of prints in {biome} leads {actor.name} back to a familiar marker. The time spent tracking brings no supplies or departure.',
    '{actor.name} tries to separate old prints from new ones in {biome}. By the time the trail proves circular, the chance to move on has passed.',
    'The tracks {actor.name} follows in {biome} cross and recross the same clearing. The investigation takes the turn and ends at its starting point.',
    '{actor.name} traces footprints around a trail loop in {biome}, discovering too late that they lead nowhere new.',
  ], [], { weight: 0.8 }),
  ...['thigh', 'shoulder', 'side'].map(site => scene(`medic-${site}`, 'medic', [
    `{actor.name} finds {target.name} bleeding from the ${site} in {biome} and applies a firm cloth dressing. The bleeding stops, though the wound still needs rest.`,
    `In {biome}, {actor.name} checks {target.name}'s ${site} wound and secures a cloth dressing over it. The bleeding is brought under control.`,
    `{target.name}'s ${site} wound is still bleeding in {biome}. {actor.name} cleans the edges and holds a dressing in place until the bleeding stops.`,
    `{actor.name} helps {target.name} settle in {biome}, then binds the bleeding ${site} wound with cloth. The dressing stops the bleeding without erasing the injury.`,
    `At a sheltered stop in {biome}, {actor.name} tends {target.name}'s ${site} wound. Steady pressure and a secured dressing stop the bleeding.`,
    `{actor.name} examines the bleeding ${site} wound on {target.name} in {biome}, then binds it firmly. The bleeding stops; recovery will take longer.`,
    `{target.name} accepts help in {biome} while {actor.name} dresses the ${site} wound. Once the bleeding has stopped, they check the bandage before parting.`,
  ], [{ kind: 'removeMarker', role: 'target', marker: `bleeding-${site}` }, assistance], {
    category: 'social', roles: [{ id: 'actor', traits: ['medic'] }, { id: 'target' }],
    conditions: [...friendly, { kind: 'marker', role: 'target', marker: `bleeding-${site}`, exists: true, value: true }], weight: 6,
  })),
  scene('patient-watch', 'patient', [
    '{actor.name} settles out of sight in {biome} and waits for the nearby footsteps to pass before checking the trail.',
    'Rather than rush toward a sound in {biome}, {actor.name} waits behind cover until the path is quiet.',
    '{actor.name} watches a trail junction in {biome} without stepping into the open. The waiting takes the turn but reveals which approach is busy.',
    'In {biome}, {actor.name} lets a distant argument finish before leaving cover. There is no need to become part of it.',
    '{actor.name} remains still beside the trail in {biome}, waiting until movement in the distance has passed.',
    'A pause behind cover in {biome} lets {actor.name} watch the path without joining the commotion.',
    '{actor.name} spends the turn observing the approaches in {biome}, choosing patience over a hurried search.',
  ]),
  scene('patient-ambush', 'patient', [
    '{actor.name} waits beside a heavy service gate in {biome}. As {target.name} passes beneath it, {actor.name} releases the gate from cover. It falls onto {target.name}, causing fatal injuries.',
    'A service gate in {biome} hangs above a narrow passage. {actor.name} waits until {target.name} is directly below, then releases it. The falling gate kills {target.name}.',
    '{target.name} steps through a narrow service opening in {biome}. {actor.name}, waiting beside its release, drops the heavy gate onto {target.object}. The injuries are fatal.',
    'In {biome}, {actor.name} stays concealed at a service gate until {target.name} enters the passage. A pull on the release brings the gate down, killing {target.object}.',
    '{actor.name} watches {target.name} approach a raised service gate in {biome} and waits for the crossing. The released gate falls onto {target.name}, who dies beneath it.',
    'The service passage in {biome} gives {actor.name} one narrow opportunity. When {target.name} walks beneath the raised gate, {actor.name} releases it. The impact is fatal.',
    '{actor.name} waits quietly by a service-gate release in {biome}. {target.name} passes below the heavy frame; {actor.name} drops it and kills {target.object}.',
  ], [{ kind: 'eliminate', role: 'target', credit: 'actor' }], { category: 'conflict', roles: [{ id: 'actor', traits: ['patient'] }, { id: 'target' }], weight: 1.2 }),
  scene('loud-challenge', 'loud', [
    '{actor.name} shouts a challenge down the trail in {biome}. {target.name} hears every word and decides that keeping a distance is the better answer.',
    'A quiet stretch of {biome} ends when {actor.name} calls out to {target.name}. The loud challenge earns an irritated look and a wider berth.',
    '{actor.name} calls {target.name}' + "'s name across {biome}, demanding a reply. {target.name} refuses the argument and keeps out of reach.",
    'In {biome}, {actor.name} turns a meeting with {target.name} into a shouted challenge. {target.name} leaves the conversation with less patience for {actor.object}.',
    '{target.name} spots {actor.name} in {biome} before getting close: the challenge is already echoing down the trail. {target.name} keeps a wary distance.',
    '{actor.name} loudly questions {target.name}\'s nerve in {biome}. {target.name} has no interest in the audience and retreats from the argument.',
    'The trail in {biome} carries {actor.name}\'s shouted challenge straight to {target.name}, who backs out of the conversation with an increasingly hostile opinion.',
  ], [{ kind: 'relationship', from: 'target', to: 'actor', trust: -10, grudge: 10 }], { category: 'social', roles: [{ id: 'actor', traits: ['loud'] }, { id: 'target' }] }),
  scene('clumsy-stumble', 'clumsy', [
    '{actor.name} catches a foot on a trail barrier in {biome} and falls against its jagged panel. The shoulder is cut and bleeding, but {actor.name} gets back up alive.',
    'A stumble beside a barrier in {biome} sends {actor.name} against a sharp panel edge. {actor.name} survives with a bleeding shoulder wound.',
    '{actor.name} trips while stepping past a service barrier in {biome}. A jagged panel cuts the shoulder, leaving a bleeding wound as {actor.name} stands again.',
    'In {biome}, {actor.name} misjudges a step over a low barrier and catches the shoulder on a torn panel. The cut bleeds, but the fall is survivable.',
    '{actor.name} loses footing beside a service barrier in {biome} and lands shoulder-first against a sharp edge. {actor.name} survives, bleeding from the shoulder.',
    'The barrier in {biome} is low enough to cross but awkward enough to trip {actor.name}. A sharp panel leaves the shoulder bleeding; {actor.name} survives the fall.',
    '{actor.name} stumbles over a barrier in {biome}, scraping the shoulder on a jagged panel. Back on the path, {actor.name} is alive with the wound still bleeding.',
  ], [{ kind: 'setMarker', role: 'actor', marker: 'bleeding-shoulder', value: true }], {
    category: 'hazard', conditions: ['thigh', 'shoulder', 'side'].map(site => ({ kind: 'marker', role: 'actor', marker: `bleeding-${site}`, exists: false })), weight: 1.1,
  }),
  scene('clumsy-drop', 'clumsy', [
    '{actor.name} stumbles in {biome}, dropping {item} into a deep drainage gap beyond reach.',
    'A missed step in {biome} sends {item} through a broken grate. {actor.name} cannot reach it from above.',
    '{actor.name} trips in {biome}; {item} slides beneath a collapsed platform, too far inside to retrieve.',
    'In {biome}, {actor.name} loses balance and drops {item} down a steep bank with no safe way down.',
    '{item} slips from {actor.name} in {biome} and lodges beneath a heavy slab that will not budge.',
    '{actor.name} stumbles beside a narrow fissure in {biome}. {item} falls in, beyond an arm’s reach.',
    'A loose foothold in {biome} sends {item} over a retaining wall. {actor.name} finds no safe route to retrieve it.',
  ], [{ kind: 'dropItem', role: 'actor' }], { conditions: [{ kind: 'item', role: 'actor' }] }),
  scene('gullible-shortcut', 'gullible', [
    '{target.name} offers a supposed shortcut through {biome} in exchange for {actor.name}\'s {item}. {actor.name} pays, then finds the route blocked by a fence while {target.name} keeps the item.',
    'In {biome}, {actor.name} hands {item} to {target.name} for directions to a shortcut. The path ends at a solid fence; {target.name} has already left with the payment.',
    '{actor.name} believes {target.name}\'s claim about a quick route in {biome} and pays with {item}. A fence blocks the promised passage, and the item stays with {target.name}.',
    '{target.name} sells {actor.name} false directions in {biome}, taking {item} as payment. {actor.name} reaches a fenced dead end and realizes the deception.',
    'A promise of an easy shortcut in {biome} persuades {actor.name} to give {item} to {target.name}. The route is fenced shut, leaving {actor.name} in the same region without the item.',
    '{actor.name} trades {item} to {target.name} for a route through {biome}. The supposed shortcut ends at a fence; the payment is not returned.',
    '{target.name} claims to know a clear shortcut in {biome}. {actor.name} hands over {item}, only to find a fence across the route while {target.name} walks away with it.',
  ], [{ kind: 'transferItem', from: 'actor', to: 'target', fact: 'transfer' }, { kind: 'relationship', from: 'actor', to: 'target', trust: -25, grudge: 30, fact: 'betrayal' }], {
    category: 'social', roles: [{ id: 'actor', traits: ['gullible'] }, { id: 'target' }], conditions: [{ kind: 'item', role: 'actor' }, { kind: 'relationship', from: 'actor', to: 'target', minTrust: 0 }],
  }),
];

const interviewLines: Record<string, { trait: Trait; triggers: ConfessionalTemplate['triggers']; speaker: ConfessionalTemplate['speaker']; variants: string[] }> = {
  tracker: { trait: 'tracker', triggers: ['move', 'survival'], speaker: 'actor', variants: [
    'The ground usually tells me more than the signs do.', 'Fresh tracks are a plan. Old tracks are an argument with the mud.', 'I check the trail before I trust the direction.',
    'Someone has been through here. Knowing when is the useful part.', 'A clear set of prints beats a confident guess.', 'Following a trail is easy. Choosing the right one takes a moment.', 'I would rather read the ground than rush past it.',
  ] },
  medic: { trait: 'medic', triggers: ['assistance'], speaker: 'actor', variants: [
    'Stopping the bleeding buys time. They still need to take care of that wound.', 'I can help with the injury. I cannot make the rest of this place sensible.', 'A steady hand was more useful than a speech.',
    'They needed the bleeding stopped before anything else.', 'The dressing is doing its job. Recovery is a different problem.', 'That was something I could actually do for someone.', 'Keep it covered, check it again, and do not mistake less blood for being healed.',
  ] },
  patient: { trait: 'patient', triggers: ['survival', 'elimination'], speaker: 'actor', variants: [
    'I can wait for a moment that makes sense.', 'There is usually a reason everyone else is in a hurry. I want to know what it is first.', 'Waiting gave me a clearer look at the situation.',
    'I do not need to be the first person down every path.', 'A little time can change what looks possible.', 'I watched before I made the decision.', 'The arena gives people enough reasons to rush. I do not need another one.',
  ] },
  loud: { trait: 'loud', triggers: ['survival'], speaker: 'actor', variants: [
    'Yes, they can hear me. That was the point.', 'I have never been good at having a quiet opinion.', 'If I have something to say, the trees are going to hear it too.',
    'Apparently my indoor voice is still outdoors.', 'They know where I stand. Probably where I am standing, too.', 'I could whisper. I would need a very good reason.', 'I said what I said. Most of the region heard it.',
  ] },
  clumsy: { trait: 'clumsy', triggers: ['drop', 'chain'], speaker: 'actor', variants: [
    'I saw the ground. I just failed to reach an agreement with it.', 'That step looked easier from the other side.', 'I would appreciate one path without a surprise under my foot.',
    'I need to slow down before the scenery takes another turn at me.', 'My balance has chosen a terrible time to become unreliable.', 'I can explain the stumble. I would rather not demonstrate it again.', 'Next time I am checking where my feet are before the rest of me follows.',
  ] },
  gullible: { trait: 'gullible', triggers: ['betrayal'], speaker: 'target', variants: [
    'The directions sounded convincing. That is not much of a defense now.', 'I thought a deal meant both people had to do their part.', 'I should have checked the route before paying for it.',
    'I keep assuming a confident answer is a useful one.', 'That was an expensive way to learn where the fence is.', 'I wanted to believe there was an easier path.', 'Next time I am asking to see the shortcut before handing anything over.',
  ] },
};

export const expandedTraitInterviews: ConfessionalTemplate[] = Object.entries(interviewLines).map(([id, lines]) => ({
  id: `interview-trait-${id}`, traits: [lines.trait], triggers: lines.triggers, speaker: lines.speaker, variants: lines.variants, tones: ['dramatic', 'absurd', 'mixed'], cooldown: 8,
  eventIds: expandedTraitScenes.filter(scene => scene.roles[0].traits?.includes(lines.trait)).map(scene => scene.id),
}));
