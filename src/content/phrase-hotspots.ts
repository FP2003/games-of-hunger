import { weaponContextWording } from './weapon-contexts';

export const phraseHotspotWording: Record<string, readonly string[]> = { ...weaponContextWording };

// The three fatal wound pools used to share almost every setup and ending.
// Each site now has its own nine situations and an explicit lethal consequence.
phraseHotspotWording['wound-thigh-fatal'] = [
  '{actor.name} traps {target.name}\'s leg beneath a low loading rail in {biome} and drives a broken bracket into the thigh. The rail prevents escape while the deep leg wound bleeds fatally.',
  'At a narrow inspection step in {biome}, {actor.name} hooks {target.name}\'s ankle and forces the thigh onto a jagged support. {target.name} cannot pull clear before the bleeding proves fatal.',
  '{actor.name} slides a sharp grille across {target.name}\'s thigh from beneath a platform in {biome}. The severed clothing catches on the frame, leaving {target.name} trapped long enough to die from the leg wound.',
  'Beside a turning gate in {biome}, {actor.name} kicks the lower arm against {target.name}\'s thigh. Its broken edge tears a deep wound, and {target.name} collapses from fatal blood loss before reaching the next post.',
  '{actor.name} drives {target.name} backward over a sorting-bin edge in {biome}, where an exposed fitting pierces the thigh. Attempts to climb free worsen the bleeding until {target.name} dies beside the bin.',
  'A struggle at a low service hatch in {biome} ends when {actor.name} slams its jagged edge across {target.name}\'s thigh. {target.name} crawls beyond the hatch but dies before the leg can be bound.',
  '{actor.name} pulls a loose cable reel toward {target.name} in {biome}, catching a leg between its rim and a sharp footing. The thigh wound keeps bleeding after the reel is pushed aside, killing {target.object}.',
  'At a broken bench in {biome}, {actor.name} forces {target.name}\'s thigh against a splintered metal brace. {target.name} tears free of the brace but cannot stop the fatal bleeding.',
  '{actor.name} yanks a low screen frame across {target.name}\'s legs in {biome}; an exposed bolt opens the thigh deeply. {target.name} falls behind the screen and bleeds to death before standing again.',
];
phraseHotspotWording['wound-shoulder-fatal'] = [
  '{actor.name} pushes {target.name}\'s raised arm into a jagged inspection opening in {biome}, then drives a metal offcut into the exposed shoulder. Pinned against the opening, {target.name} dies from the bleeding shoulder wound.',
  'At a hanging screen in {biome}, {actor.name} pulls its broken support down across {target.name}\'s shoulder. The sharp joint tears deeply enough that {target.name} dies before clearing the fabric.',
  '{actor.name} catches {target.name} reaching over a high sorting tray in {biome} and stabs the shoulder with a broken fitting. The arm cannot hold a dressing in place, and the shoulder injury bleeds fatally.',
  'Beside a signal frame in {biome}, {actor.name} twists {target.name} into a sharp mounting plate that opens the shoulder. {target.name} gets around the frame but dies from the loss of blood.',
  '{actor.name} strikes downward with a pointed rail end as {target.name} climbs a service step in {biome}, piercing the shoulder. {target.name} collapses against the step from fatal bleeding before regaining balance.',
  'A broken hinge protrudes beside a narrow door in {biome}; {actor.name} drives {target.name}\'s shoulder against it during a struggle. The wound proves fatal while {target.name} tries to get the arm free.',
  '{actor.name} jerks a loose overhead bracket down as {target.name} ducks beneath it in {biome}. The metal catches the shoulder, and the resulting blood loss kills {target.object} beneath the frame.',
  'At a dividing rail in {biome}, {actor.name} traps {target.name}\'s forearm and drives a sharp scrap into the shoulder. {target.name} escapes the grip, but the shoulder wound causes a fatal collapse nearby.',
  '{actor.name} shoves {target.name} against a leaning grille in {biome}, forcing the shoulder onto a broken upper corner. {target.name} slides to the ground and dies before the bleeding shoulder can be treated.',
];
phraseHotspotWording['wound-side-fatal'] = [
  '{actor.name} corners {target.name} between a water stand and its railing in {biome}, then stabs the side with a broken strap. With no space to retreat, {target.name} dies from the untreated side wound.',
  'At a narrow cable passage in {biome}, {actor.name} drives {target.name}\'s side onto a jagged casing. {target.name} cannot crawl through the passage before the side injury causes fatal blood loss.',
  '{actor.name} swings a loose inspection grille into {target.name} at waist height in {biome}. Its sharp corner tears the side, and {target.name} dies while trying to brace the wound against the grille.',
  'Beside an empty trough in {biome}, {actor.name} pulls {target.name} sideways onto a pointed support fitting. The deep side wound keeps bleeding until {target.name} dies against the stand.',
  '{actor.name} catches {target.name} squeezing around an equipment frame in {biome} and drives a metal shard into the side. {target.name} reaches the far opening but dies there from the wound.',
  'During a struggle at a low wall in {biome}, {actor.name} forces {target.name}\'s side against an exposed reinforcement end. The torn wound bleeds fatally after {target.name} drops away from the wall.',
  '{actor.name} pulls a hanging panel aside to strike {target.name} in the side with a sharp hinge fragment in {biome}. {target.name} sinks beneath the panel, unable to stop the bleeding before death.',
  'At a sorting chute in {biome}, {actor.name} pushes {target.name} against its broken side flange. The flange opens a deep side wound, killing {target.object} before there is room to get clear.',
  '{actor.name} jams a pointed brace through the gap beside {target.name} at an access gate in {biome}, piercing the side. {target.name} backs away from the gate but bleeds to death along its outer rail.',
];

const closures = {
  forest: { name: 'forest', hazard: 'controlled burn', route: 'the marked woodland exits', sign: 'the tree-line boundary lamps', onset: 'Fire is spreading beneath the canopy', closed: 'The forest burn has closed every return trail' },
  swamp: { name: 'swamp', hazard: 'permanent flood', route: 'the raised causeway', sign: 'the boardwalk exit markers', onset: 'The sluices are open and the lower boardwalks are flooding', closed: 'Floodwater has closed the swamp boardwalk network' },
  mountains: { name: 'mountains', hazard: 'scheduled rockfall', route: 'the marked descent', sign: 'the lower-pass boundary lamps', onset: 'The rockfall is crossing the mountain approaches', closed: 'Rockfall has sealed the mountain return passes' },
  desert: { name: 'desert', hazard: 'permanent cooling shutdown', route: 'the service-road exit', sign: 'the desert boundary lamps', onset: 'The desert cooling equipment is off and the heat is rising', closed: 'Fatal heat has closed the desert after the cooling shutdown' },
  tundra: { name: 'tundra', hazard: 'fatal temperature drop', route: 'the pole-marked exit', sign: 'the tundra guide lights', onset: 'The tundra temperature drop is under way', closed: 'The fatal cold has closed the tundra return routes' },
};
for (const [region, c] of Object.entries(closures)) {
  const warning = [
    `The ${c.name} closes permanently tonight: ${c.hazard}. Take ${c.route} to the Center Podium.`,
    `Leave the ${c.name} before nightfall. The ${c.hazard} will close it permanently; follow ${c.sign} to the Center Podium.`,
    `Tonight's ${c.hazard} shuts the ${c.name} for good. Exit via ${c.route} to the Center Podium.`,
    `Last evening in the ${c.name}: ${c.hazard} begins tonight. Take ${c.route} to the Center Podium; there is no return.`,
    `Check ${c.sign}: the ${c.name} closes permanently at nightfall because of ${c.hazard}. Head to the Center Podium.`,
    `The ${c.name} will be permanently unsafe tonight. Before the ${c.hazard}, follow ${c.route} to the Center Podium.`,
    `Permanent closure tonight in the ${c.name}. Beat the ${c.hazard} to ${c.route} and reach the Center Podium.`,
    `Tonight brings ${c.hazard} and permanent closure to the ${c.name}. Follow ${c.sign} to the Center Podium.`,
    `Clear the ${c.name} by nightfall via ${c.route} to the Center Podium. The ${c.hazard} closes it permanently.`,
  ];
  const start = [
    `${c.onset}. Leave via ${c.route} to the Center Podium; this closure is permanent.`,
    `The ${c.hazard} has begun in the ${c.name}. Follow ${c.sign} to the Center Podium; no return.`,
    `Evacuate the ${c.name} via ${c.route} to the Center Podium. The ${c.hazard} is active and closure is permanent.`,
    `The ${c.name} is closing for good. Escape the ${c.hazard} via ${c.route} to the Center Podium.`,
    `Get out of the ${c.name}: ${c.hazard} is under way. Follow ${c.sign} to the Center Podium; no return.`,
    `${c.onset}. Take ${c.route} to the Center Podium now. The region will stay closed.`,
    `The ${c.name} evacuation is under way because of ${c.hazard}. Use ${c.route} to the Center Podium; closure is permanent.`,
    `Follow ${c.sign} out of the ${c.name} to the Center Podium. The ${c.hazard} has started; there is no return.`,
    `The ${c.hazard} is active. Clear the ${c.name} via ${c.route} to the Center Podium; the region stays closed.`,
  ];
  const close = [
    `${c.closed}. The ${c.name} stays closed for the rest of the games.`,
    `The ${c.name} is permanently closed after the ${c.hazard}. Choose an open region.`,
    `${c.closed}. No return to the ${c.name}.`,
    `Permanent closure confirmed in the ${c.name} after the ${c.hazard}.`,
    `The ${c.name} is out of play for good because of ${c.hazard}.`,
    `${c.closed}. Do not cross back into the ${c.name}.`,
    `The ${c.hazard} has shut the ${c.name} for the rest of the games.`,
    `${c.closed}. All entrances to the ${c.name} are closed permanently.`,
    `The ${c.name} remains permanently closed following the ${c.hazard}.`,
  ];
  for (const [stage, variants] of [['closure-warning', warning], ['closure-start', start], ['close', close]] as const) {
    phraseHotspotWording[`arena-${region}-${stage}`] = variants.map(text => `Announcer: “${text}”`);
  }
}
