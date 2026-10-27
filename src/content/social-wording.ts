import type { EventTemplate } from '../domain';

const wording: Record<string, [string, string]> = {
  'stolen-cache': [
    'A stone tossed down the trail by {actor.name} draws {target.name} from a resting place in {biome}. {actor.name} slips behind the shelter and steals {target.possessive} {item}, but {target.name} returns in time to see the thief running away.',
    '{actor.name} lures {target.name} away from a resting spot in {biome} by throwing a stone along the trail, then sneaks behind the shelter to take {target.possessive} {item}. Returning, {target.name} catches sight of who is escaping with it.',
  ],
  'stolen-confrontation': [
    'On a narrow path in {biome}, {actor.name} stops {target.name} and demands an explanation for the theft. {target.name} refuses to answer and shoulders past; {actor.name} moves aside without agreeing to forget.',
    '{actor.name} confronts {target.name} about the earlier theft, blocking a narrow path in {biome}. Refusing an answer, {target.name} pushes past with a shoulder. {actor.name} yields the path but not the grievance.',
  ],
  'stolen-reclaimed': [
    'Taking {item} from {target.name}, {actor.name} settles the earlier theft by claiming repayment.',
    '{actor.name} claims {item} from {target.name} as repayment for the previous theft, finally answering it.',
  ],
  'shelter-offer': [
    'Fresh tracks toward an exposed resting spot in {biome} catch {actor.name}\'s eye. After warning {target.name}, {actor.name} joins {target.object} in a hollow behind a trail bank and keeps watch while {target.name} rests.',
    '{actor.name} points out fresh tracks approaching where {target.name} is resting beside an exposed path in {biome}. They crawl behind a trail bank into a hollow, leaving {actor.name} watching while {target.name} rests.',
  ],
  'shelter-repaid': [
    'To repay the earlier shelter favor in {biome}, {actor.name} watches from the exposed end of a trail hollow while {target.name} rests behind the bank. Only when both approaches are safe does {actor.name} wake {target.object} to swap places.',
    '{actor.name} returns the shelter favor by guarding both approaches from the open end of a trail hollow in {biome}. {target.name} rests behind the bank until {actor.name} judges it safe to wake {target.object} and exchange places.',
  ],
  'shelter-pact': [
    'After helping each other, {actor.name} and {target.name} agree to a mutual pact.',
    '{actor.name} and {target.name} make their exchange of favors the foundation of a pact with each other.',
  ],
  'omen-find': [
    'Beside the trail, {actor.name} spots three newly made warning scratches.',
    'Three fresh scratches warning of danger catch {actor.name}\'s attention at the trail edge.',
  ],
  'omen-read': [
    'The earlier scratches match a damaged trail marker, giving {actor.name} a direction for the warning.',
    '{actor.name} connects the previous scratches with a damaged trail marker and works out which way the warning points.',
  ],
  'omen-detour': [
    'Guided by the warning now decoded, {actor.name} detours into {biome}.',
    '{actor.name} takes the detour to {biome} indicated by the deciphered warning.',
  ],
  'shared-map': [
    'In the dirt of {biome}, {actor.name} sketches a route for {target.name}, showing an exposed crossing and a sheltered alternative. Once {target.name} has memorized the turns, they erase the map.',
    '{actor.name} marks a way through {biome} in the dirt, pointing out an exposed crossing and a covered route around it to {target.name}. They wipe it away after {target.name} learns the turns.',
  ],
  'mutual-watch': [
    '{actor.name} and {target.name} promise to keep watch on each other\'s behalf.',
    'An agreement between {actor.name} and {target.name} leaves each watching out for the other.',
  ],
  'broken-watch': [
    'Without waking {target.name}, {actor.name} abandons the agreed watch in {biome}. Footsteps wake {target.object} instead. {target.name} hides under the shelter floor until they pass, then finds the lookout deserted.',
    '{target.name} wakes to approaching footsteps in {biome} after {actor.name} walks away from an agreed watch without warning. Hiding beneath the shelter floor until the steps fade, {target.name} emerges to discover the empty lookout.',
  ],
  'gift-supplies': [
    '{actor.name} hands {item} to {target.name}, asking for no promise in return.',
    'Without demanding any promise, {actor.name} gives {target.name} {item}.',
  ],
  'bad-directions': [
    '{actor.name} directs {target.name} toward a supposed supply shelter beyond a trail bend in {biome}. Only an empty concrete footing waits there; returning, {target.name} finds {actor.name} laughing by the signpost.',
    'Following {actor.name}\'s claim of a supply shelter around a bend in {biome}, {target.name} reaches an empty concrete footing. {target.name} doubles back to see {actor.name} laughing beside the signpost.',
  ],
  'quiet-apology': [
    '{target.name} hears {actor.name}\'s apology without giving any assurance of forgiveness.',
    '{actor.name} offers an apology, and {target.name} listens but makes no promise to forgive.',
  ],
  'nemesis-staredown': [
    'Recognizing {target.name} at a trail shelter in {biome}, {actor.name} bars the doorway with a foot. Neither will come closer. A long silence ends with {target.name} backing away and the grudge still unresolved.',
    '{actor.name} sees {target.name} at a shelter on the trail in {biome} and blocks its entrance with a foot. Distrust holds them apart until, after a lengthy silence, {target.name} retreats with nothing settled.',
  ],
  'ration-bargain': [
    'In exchange for a peaceful end to the meeting, {actor.name} hands {item} to {target.name}.',
    '{target.name} receives {item} from {actor.name} as the price of agreeing to part peacefully.',
  ],
  'sneaky-distraction': [
    '{actor.name} invents a rule requiring {target.name} to touch a painted trail marker in {biome} before the next horn. The marker has no such instruction. {target.name} returns to {actor.name}\'s smirk with less trust than before.',
    'A painted marker in {biome} supposedly needs touching before the next horn, according to {actor.name}. {target.name} checks it, finds no instruction, and comes back to find {actor.name} smirking, losing trust over the invented rule.',
  ],
  'loyal-reassurance': [
    '{actor.name} sincerely promises {target.name} support.',
    'With a sincere promise, {actor.name} assures {target.name} of support.',
  ],
  'dramatic-speech': [
    'With only {target.name} listening, {actor.name} gives an unexpectedly persuasive speech.',
    '{actor.name}\'s speech has an audience of just {target.name}, yet proves surprisingly convincing.',
  ],
  'cautious-boundaries': [
    '{actor.name} and {target.name} settle on clearer boundaries and different places to rest.',
    'Separate resting places and firmer boundaries are agreed between {actor.name} and {target.name}.',
  ],
  'reckless-dare': [
    'To avoid an exposed path in {biome}, {actor.name} suggests a cracked drainage pipe. {target.name} tests it with a branch, immediately bringing down part of the roof. They take the longer way, and {target.name} gives up asking {actor.name} for shortcuts.',
    '{actor.name} recommends crawling through a cracked pipe in {biome} instead of taking an exposed path. A branch pushed inside by {target.name} collapses part of its roof. The longer route wins, and {target.name} stops seeking shortcuts from {actor.name}.',
  ],
  'resourceful-repair': [
    'A strap repaired by {actor.name} earns {target.name}\'s goodwill. Small fixes help make allies.',
    '{actor.name} repairs a strap for {target.name}, finding that a little mending can build a useful friendship.',
  ],
  'item-confiscation': [
    'During an argument about camp rules, {actor.name} takes {target.name}\'s {item}.',
    'A dispute over the camp rules ends with {actor.name} taking {item} from {target.name}.',
  ],
  'forest-rescue': [
    'Rotten boards give way as {target.name} steps onto a tree platform. Braced against the trunk, {actor.name} grabs {target.possessive} wrist and holds on until {target.name} climbs back onto solid wood.',
    '{target.name} breaks through a rotten tree platform. {actor.name} braces against its trunk and catches {target.possessive} wrist, helping {target.name} regain solid boards.',
  ],
  'swamp-rescue': [
    'When {target.name} sinks to the waist in swamp mud beside the crossing, {actor.name} lies flat on the boards and offers a long branch. Step by careful step, {target.name} is pulled back to the walkway.',
    '{actor.name} stretches out on the boards as {target.name} sinks waist-deep in mud near the swamp crossing. Extending a long branch, {actor.name} draws {target.object} back to the walkway a careful step at a time.',
  ],
  'mountains-rescue': [
    'As a mountain ledge falls away under {target.name}, {actor.name} jams a branch into a crack to make a handhold, then guides {target.object} over the remaining shelf to firm ground.',
    '{actor.name} wedges a branch into a crack when the mountain ledge beneath {target.name} crumbles. Using it as a handhold, {actor.name} helps {target.object} cross the surviving shelf to safety.',
  ],
  'desert-rescue': [
    'Seeing {target.name} stagger in the desert heat, {actor.name} guides {target.object} into a supply tank\'s shade. They let the dizziness subside before picking a route away from the exposed dunes.',
    '{actor.name} brings a stumbling {target.name} out of the desert heat and into shade beside a supply tank. Once the dizziness passes, they choose a way around the exposed dunes.',
  ],
  'tundra-rescue': [
    'Lake ice breaks under {target.name} near the tundra bank. Lying flat in the snow, {actor.name} slides a fallen branch over the hole so {target.name} can crawl out.',
    '{actor.name} stays flat on the snow after {target.name} falls through lake ice near the tundra bank. A fallen branch pushed across the opening gives {target.name} a way to crawl free.',
  ],
  'ruins-rescue': [
    'When a stair landing collapses under {target.name} at the Center Podium, {actor.name} lays a fallen door across the gap. Holding it steady, {actor.name} helps {target.object} crawl back to the corridor.',
    '{target.name} loses footing as a Center Podium stair landing gives way. {actor.name} bridges the gap with a fallen door and steadies it until {target.name} crawls to the corridor.',
  ],
  'ally-decoy': [
    'Fresh pursuers\' tracks near {target.name}\'s hiding spot in {biome} alert {actor.name}. Loud footsteps down a different path draw the search away, allowing {target.name} to remain hidden.',
    '{actor.name} sees recent tracks from pursuers close to {target.name}\'s hiding place in {biome}. By walking noisily along another path, {actor.name} diverts the search while {target.name} stays concealed.',
  ],
  'ally-abandoned-hatch': [
    'At a supply pit in {biome}, {actor.name} extends a hand to {target.name}, then pulls it back and leaves. {target.name} eventually climbs out on stacked empty crates, remembering the refusal to help.',
    '{actor.name} starts to help {target.name} from a supply pit in {biome}, only to withdraw the offered hand and walk away. Left alone, {target.name} stacks empty crates to escape and remembers who abandoned the rescue.',
  ],
  'ration-snatch-chase': [
    'As {target.name} opens a ration pack in {biome}, {actor.name} grabs {item} and slides down a steep trail bank. Unwilling to chance the blind drop, {target.name} stops above.',
    '{actor.name} snatches {item} when {target.name} opens a ration pack in {biome}, then slides over a steep trail bank. {target.name} stays at the top rather than follow into a blind drop.',
  ],
  'rope-crossing-help': [
    'With {actor.possessive} {item} secured around a trail post in {biome}, {actor.name} holds the line for {target.name} to cross a collapsed drainage ditch. After both reach the far side, {actor.name} coils the rope.',
    '{actor.name} ties {actor.possessive} {item} to a trail post in {biome} and keeps it steady while {target.name} crosses a broken drainage ditch. Both make it across, and {actor.name} gathers the rope back into a coil.',
  ],
  'water-truce': [
    'At a leaking supply tank in {biome}, {actor.name} finds {target.name} crouching to catch water. They alternate catching water in cupped hands and keeping watch, then agree to go their separate ways.',
    '{actor.name} joins {target.name} beside a leaking supply tank in {biome}. Each catches water in cupped hands while the other watches, before they agree to leave along different paths.',
  ],
  'blanket-shared-night': [
    'Beneath a supply shelter in {biome}, {actor.name} comes upon {target.name} shivering. Sharing {actor.possessive} {item}, they sit back to back and watch opposite approaches until dawn.',
    '{actor.name} shares {actor.possessive} {item} with a shivering {target.name} under a supply shelter in {biome}. They stay back to back, each watching an approach through the night.',
  ],
  'mirror-warning': [
    'Movement behind {target.name} on a supply trail in {biome} prompts {actor.name} to flash {actor.possessive} {item} twice. Taking the warning, {target.name} ducks into cover before the distant hunter gets to the trail.',
    '{actor.name} gives two flashes with {actor.possessive} {item} after spotting movement behind {target.name} on a supply trail in {biome}. {target.name} sees the signal and hides before the distant hunter reaches the path.',
  ],
  'love-hate-devotion': [
    'While {target.name} rests in {biome}, {actor.name} insists on standing watch, saying nobody else here merits that much trust.',
    '{actor.name} refuses to give up watch duty as {target.name} rests in {biome}, declaring that no one else in the arena deserves such trust.',
  ],
  'love-hate-rejection': [
    'When {target.name} proposes sharing shelter in {biome}, {actor.name} will not even sit nearby. An exposed lookout seems preferable to another minute together.',
    '{actor.name} rejects {target.name}\'s suggestion of a shared shelter in {biome}, choosing an exposed lookout rather than sit close or spend another minute together.',
  ],
};

export function socialAlternatives(template: EventTemplate): [string, string] | undefined {
  const crossing = template.id.startsWith('crossing-social-');
  if (crossing) return [
    '{actor.name} enters {biome} and encounters {target.name}. They exchange a safe route before leaving on friendly terms.',
    'After crossing into {biome}, {actor.name} meets {target.name}. A safe route is shared, and the meeting ends amicably.',
  ];
  const wound = /^wound-(thigh|shoulder|side)-assistance$/.exec(template.id);
  if (wound) return [
    `{actor.name} finds {target.name} having trouble with the earlier ${wound[1]} wound in {biome}. Watching the surroundings between knots, {actor.name} applies a cloth strip until the bleeding stops. {target.name} accepts the help despite the danger of remaining together.`,
    `In {biome}, {actor.name} helps {target.name} with the earlier ${wound[1]} wound, binding it in cloth and keeping watch between knots until the bleeding stops. Staying together is risky, but {target.name} accepts the assistance.`,
  ];
  return wording[template.id];
}
