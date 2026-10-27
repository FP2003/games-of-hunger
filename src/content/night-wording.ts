export const nightWording: Record<string, [string, string]> = {
  'night-prepare-forest': [
    'Under a fallen trunk in {biome}, {actor.name} lays dry leaves for bedding and checks both ends for tracks. Branches hide the entrance as {actor.name} settles into the hollow.',
    '{actor.name} checks for tracks at either end of a fallen trunk in {biome}, then beds down on dry leaves inside the hollow, screening the entrance with branches.',
  ],
  'night-prepare-swamp': [
    'On a tested patch of raised ground in {biome}, {actor.name} spreads reeds over the wet soil. Before resting, {actor.name} makes sure the way to the boardwalk remains above water.',
    '{actor.name} checks some raised ground in {biome} and covers the damp earth with reeds, making sure the return route to the boardwalk clears the water before settling down.',
  ],
  'night-prepare-mountains': [
    'Below the exposed ridge in {biome}, {actor.name} finds a shallow recess and arranges loose stones into a low windbreak. A gap remains for a quick escape.',
    '{actor.name} shelters in a small recess beneath the ridge in {biome}, using loose stones to block the wind without closing off a quick way out.',
  ],
  'night-prepare-desert': [
    'Away from the open trail in {biome}, {actor.name} scrapes out a sleeping hollow behind a dune. Before the landmarks vanish into darkness, stones mark the way out.',
    '{actor.name} prepares a hollow for sleep behind a dune off the open trail in {biome}, ringing the exit with stones while the landmarks are still visible.',
  ],
  'night-prepare-tundra': [
    'On the sheltered side of a snowbank in {biome}, {actor.name} digs a shallow sleeping hollow. Packed snow keeps the wind off its edges, while a gap leaves room to crawl out.',
    '{actor.name} hollows out a shallow space behind a snowbank in {biome}, packing the edges against the wind and keeping enough room to crawl free.',
  ],
  'night-prepare-ruins': [
    'Beneath the Center Podium steps, {actor.name} finds a recess hidden from the supply lanes. After checking the closest exit, {actor.name} scatters loose gravel over the approach and prepares to rest.',
    '{actor.name} picks a sleeping recess under the Center Podium steps, where the supply lanes cannot see it. The nearest exit is checked and loose gravel laid across the approach before resting.',
  ],
  'night-shelter-shared': [
    'Hearing {target.name} searching for shelter in {biome}, {actor.name} makes space behind a low bank. Together they hide the entrance and watch opposite approaches until resting seems safe.',
    '{actor.name} hears {target.name} looking for cover in {biome} and offers room behind a low bank. With the entrance concealed together, they face opposite directions until they feel able to rest.',
  ],
  'night-noise-on-watch': [
    'Footsteps near the sleeping hollow in {biome} keep {actor.name} low and watching the approach. Once the sound fades, {actor.name} shifts the bedding farther from the trail.',
    '{actor.name} stays low at the sound of footsteps beside the sleeping hollow in {biome}, watching until they fade before moving the bedding away from the trail.',
  ],
  'night-resupply-preparation': [
    'After checking the sealed rations collected from the Center Podium delivery, {actor.name} picks a sleeping place clear of the supply lanes in {biome}. The food stays close while {actor.name} looks for anyone following the delivery route.',
    '{actor.name} chooses somewhere to sleep away from the supply lanes in {biome} after inspecting the sealed rations from the Center Podium delivery. Keeping the food close, {actor.name} watches the delivery route for followers.',
  ],
  'night-weather-shelter': [
    'As the announced weather arrives in {biome}, {actor.name} leaves an exposed sleeping place and crawls into a sheltered hollow. The entrance stays close in case another move is needed.',
    '{actor.name} abandons an exposed sleeping spot when the weather forecast earlier reaches {biome}. Crawling into a sheltered hollow, {actor.name} waits by the entrance, ready to move again if necessary.',
  ],
  'night-closure-preparation': [
    'The closure warning changes {actor.name}\'s plans to sleep in the threatened region. Before nightfall, {actor.name} follows the marked exit to the Center Podium and looks for shelter clear of the supply lanes.',
    '{actor.name} gives up the threatened region as a sleeping place after hearing the closure warning. Taking the marked exit before nightfall brings {actor.name} to the Center Podium to check for shelter away from the supply lanes.',
  ],
};

for (const count of [2, 3, 4]) {
  const list = ['actor', 'target', 'third', 'fourth'].slice(0, count).map(role => `{${role}.name}`);
  const subjects = count === 2 ? list.join(' and ') : `${list.slice(0, -1).join(', ')}, and ${list.at(-1)}`;
  const rest = count === 2 ? 'the other rests' : 'the others rest';
  nightWording[`night-watch-${count}`] = [
    `In {biome}, ${subjects} arrange to share watch duty. While ${rest}, {actor.name} watches first, then gently wakes {target.name} for the handover.`,
    `${subjects} settle on a watch rotation in {biome}. {actor.name} stays awake for the opening shift while ${rest}, quietly waking {target.name} when it is time to switch.`,
  ];
}
