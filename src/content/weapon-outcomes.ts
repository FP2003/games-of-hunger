type WeaponOutcomes = {
  missed: readonly [string, string, string, string, string];
  fatal: readonly [string, string, string, string, string];
};

// Full versions of each attack, including how the target gets away or dies.
export const expandedWeaponOutcomes: Record<string, WeaponOutcomes> = {
  crossbow: {
    missed: [
      '{actor.name}\'s crossbow bolt hits the post beside {target.name}, who ducks and runs.',
      '{target.name} dives behind a barrier. {actor.name}\'s crossbow bolt sticks in the wood.',
      '{actor.name} fires the crossbow a beat too late. {target.name} is already around the bend.',
      '{actor.name}\'s crossbow bolt skips off a stone as {target.name} rolls out of the way.',
      'A crossbow bolt from {actor.name} flies past {target.name}, who runs for cover.',
    ],
    fatal: [
      '{actor.name} fires the crossbow. The bolt hits {target.name} in the chest and kills {target.object}.',
      '{target.name} makes a break for cover, but {actor.name}\'s crossbow bolt hits {target.object} in the chest. The shot is fatal.',
      '{actor.name} catches {target.name} in the open. A crossbow bolt to the chest kills {target.object}.',
      '{target.name} steps out from behind a barrier. The bolt from {actor.name}\'s crossbow hits {target.object} in the chest, killing {target.object}.',
      'The crossbow snaps in {actor.name}\'s hands. {target.name} takes the bolt in the chest and dies.',
    ],
  },
  machete: {
    missed: [
      '{target.name} ducks and runs as {actor.name}\'s machete bites into a post.',
      '{actor.name} swings a machete. {target.name} steps out of reach and bolts.',
      '{target.name} slips behind a barrier. {actor.name}\'s machete hits the wood.',
      '{actor.name} brings the machete down on empty ground. {target.name} is already running.',
      '{target.name} backs around a corner as {actor.name}\'s machete cuts through empty air.',
    ],
    fatal: [
      '{actor.name} swings the machete as {target.name} turns. The blade strikes {target.object} in the neck, killing {target.object}.',
      '{target.name} tries to back away. {actor.name} catches {target.object} in the neck with a fatal machete slash.',
      '{actor.name} steps into {target.name}\'s path and kills {target.object} with a machete strike to the neck.',
      '{target.name} goes down after {actor.name}\'s machete hits {target.object} in the neck. The wound is fatal.',
      'One swing from {actor.name}\'s machete catches {target.name} in the neck. The cut is fatal.',
    ],
  },
  mace: {
    missed: [
      '{target.name} ducks and bolts. {actor.name}\'s spiked mace hits a post.',
      '{actor.name} swings the spiked mace too wide. {target.name} slips past and runs.',
      '{target.name} darts behind a barrier just before {actor.name}\'s spiked mace hits it.',
      '{actor.name}\'s spiked mace hits the ground as {target.name} jumps back and runs.',
      '{target.name} drops low under {actor.name}\'s spiked mace and slips past.',
    ],
    fatal: [
      '{actor.name} strikes {target.name} in the head with a spiked mace, killing {target.object}.',
      '{target.name} turns to run. {actor.name}\'s spiked mace lands a fatal blow to the head.',
      '{actor.name} steps out from cover and brings the spiked mace down. The blow to the head kills {target.name}.',
      '{target.name} falls after a blow to the head from {actor.name}\'s spiked mace. The blow is fatal.',
      '{target.name} rushes past a barrier, straight into a fatal blow to the head from {actor.name}\'s spiked mace.',
    ],
  },
  'capitol-bow': {
    missed: [
      '{actor.name} fires the silver bow. The arrow sticks in a post as {target.name} runs.',
      '{target.name} drops behind a barrier. An arrow from {actor.name}\'s silver bow sails overhead.',
      '{actor.name}\'s silver bow twangs as {target.name} rounds the bend. The arrow misses.',
      '{target.name} jumps back as an arrow from {actor.name}\'s silver bow hits the dirt.',
      '{actor.name} shoots with the silver bow, but {target.name} ducks the arrow and runs.',
    ],
    fatal: [
      '{actor.name} fires the silver bow. The arrow hits {target.name} in the chest and kills {target.object}.',
      '{target.name} starts across open ground. An arrow from {actor.name}\'s silver bow lands a fatal hit to the chest.',
      '{actor.name} draws the silver bow as {target.name} turns. The shot to the chest is fatal.',
      '{target.name} is almost at cover when {actor.name}\'s silver bow sends an arrow into {target.possessive} chest. The hit is fatal.',
      'One shot from the silver bow. {actor.name} hits {target.name} in the chest and kills {target.object}.',
    ],
  },
  slingshot: {
    missed: [
      '{target.name} ducks and runs as a stone from {actor.name}\'s slingshot hits a post.',
      '{actor.name} fires the slingshot. The stone skips past {target.name}, who runs for cover.',
      '{target.name} drops behind a barrier before {actor.name}\'s slingshot stone hits the wood.',
      '{actor.name}\'s slingshot snaps, but the stone lands well short of {target.name}.',
      '{target.name} steps aside and runs as a stone from {actor.name}\'s slingshot flies past.',
    ],
    fatal: [
      '{actor.name} fires the slingshot. The stone strikes {target.name} in the temple, killing {target.object}.',
      'A stone from {actor.name}\'s slingshot catches {target.name} in the temple. The hit is fatal.',
      '{target.name} looks up as {actor.name} fires the slingshot. The stone hits {target.object} in the temple and kills {target.object}.',
      '{actor.name} takes one shot with the slingshot. The stone lands a fatal hit to {target.name}\'s temple.',
      '{target.name} steps into the open. A stone from {actor.name}\'s slingshot hits {target.object} in the temple. The shot is fatal.',
    ],
  },
  'throwing-knives': {
    missed: [
      '{target.name} ducks. {actor.name}\'s throwing knife sticks in a post.',
      '{actor.name} throws a knife. It skips off the ground as {target.name} runs for cover.',
      '{target.name} slips around a corner just before {actor.name}\'s throwing knife strikes the wall.',
      'A knife flies from {actor.name}\'s hand. {target.name} sidesteps it and runs.',
      '{actor.name} throws a knife too late. It sails past {target.name}, who is already ducking behind cover.',
    ],
    fatal: [
      '{actor.name} throws a knife. It hits {target.name} in the chest and kills {target.object}.',
      '{target.name} steps into the open. {actor.name}\'s throwing knife lands a fatal hit to the chest.',
      '{actor.name}\'s throwing knife catches {target.name} in the chest before {target.subject} can turn away. The hit is fatal.',
      '{target.name} tries to cross the trail. {actor.name} kills {target.object} with a knife thrown into the chest.',
      '{actor.name} lets a throwing knife fly. {target.name} takes it in the chest and dies.',
    ],
  },
  trident: {
    missed: [
      '{target.name} sidesteps the trident and runs before {actor.name} can turn.',
      '{actor.name} thrusts the trident at {target.name}, but the prongs hit a barrier.',
      '{target.name} jumps back as {actor.name}\'s trident sticks in the dirt.',
      '{actor.name} jabs with the trident. {target.name} dodges and runs past.',
      '{target.name} sees the points coming and darts away as {actor.name} misses with the trident.',
    ],
    fatal: [
      '{actor.name} drives the trident into {target.name}\'s chest, killing {target.object}.',
      '{target.name} tries to rush past. {actor.name}\'s trident catches {target.object} in the chest. The wound is fatal.',
      '{actor.name} blocks the path with a trident and kills {target.name} with a thrust to the chest.',
      '{target.name} stumbles after taking {actor.name}\'s trident in the chest and dies on the trail.',
      '{actor.name} steps out with the trident. A thrust to the chest kills {target.name} before {target.subject} can get away.',
    ],
  },
  sword: {
    missed: [
      '{target.name} steps out of reach. {actor.name}\'s short sword cuts through empty air.',
      '{actor.name} swings the short sword too late. {target.name} is already through the gap.',
      '{target.name} ducks a swing from {actor.name}\'s short sword and runs.',
      '{actor.name}\'s short sword scrapes a wall as {target.name} slips around the corner.',
      '{actor.name} lunges with the short sword. {target.name} dodges the point and backs away.',
    ],
    fatal: [
      '{actor.name} stabs {target.name} in the chest with a short sword. The wound is fatal.',
      '{target.name} rushes past a barrier, and {actor.name} drives the short sword into {target.possessive} chest, killing {target.object}.',
      '{actor.name} steps into the path with a short sword. A thrust to the chest kills {target.name}.',
      '{target.name} turns to leave. {actor.name}\'s short sword catches {target.object} in the chest, killing {target.object}.',
      '{actor.name} lunges with the short sword and stabs {target.name} in the chest. {target.name} dies on the path.',
    ],
  },
  broadsword: {
    missed: [
      '{target.name} ducks and runs as {actor.name}\'s broadsword swings overhead.',
      '{actor.name}\'s broadsword hits a post. {target.name} slips around it and runs.',
      '{actor.name} swings the broadsword wide. {target.name} backs out of reach.',
      '{target.name} slips past as {actor.name} brings the broadsword down on empty ground.',
      '{actor.name} raises the broadsword too slowly. {target.name} dodges the swing and bolts.',
    ],
    fatal: [
      '{actor.name} swings the broadsword and hits {target.name} in the neck, killing {target.object}.',
      '{target.name} turns at the sound of footsteps. {actor.name}\'s broadsword strikes {target.object} in the neck. The blow is fatal.',
      '{actor.name} steps from cover. One strike to the neck with the broadsword kills {target.name}.',
      '{target.name} backs away, but {actor.name} lands a fatal blow to the neck with the broadsword.',
      '{actor.name} brings the broadsword around as {target.name} passes. The strike to the neck is fatal.',
    ],
  },
  'combat-axe': {
    missed: [
      '{target.name} ducks and runs. {actor.name}\'s combat axe buries itself in a post.',
      '{actor.name} brings the combat axe down, but {target.name} jumps clear and runs.',
      '{target.name} backs around a barrier. {actor.name}\'s combat axe thuds against the wood.',
      '{actor.name} swings the combat axe wide. {target.name} slips past and bolts.',
      '{target.name} darts away as {actor.name}\'s combat axe chops into the dirt.',
    ],
    fatal: [
      '{actor.name} brings the combat axe down on {target.name}\'s head, killing {target.object}.',
      '{target.name} turns too late. {actor.name}\'s combat axe lands a fatal blow to the head.',
      '{actor.name} steps out with the combat axe. One blow to the head kills {target.name}.',
      '{target.name} darts past the barrier, but {actor.name} catches {target.object} in the head with the combat axe. The blow is fatal.',
      '{actor.name} swings the combat axe as {target.name} backs away. The hit to the head kills {target.object}.',
    ],
  },
  morningstar: {
    missed: [
      '{target.name} ducks and bolts. {actor.name}\'s morningstar crunches into a post.',
      '{actor.name} swings the morningstar too low. {target.name} hops back and runs.',
      '{target.name} slips behind a barrier as {actor.name}\'s morningstar hits the wood.',
      '{actor.name} swings the morningstar wide. {target.name} gets past and runs.',
      '{target.name} stays just out of reach. The morningstar hits the dirt at {actor.name}\'s feet.',
    ],
    fatal: [
      '{actor.name} strikes {target.name} in the head with a morningstar, killing {target.object}.',
      '{target.name} turns to run. {actor.name}\'s morningstar lands a fatal blow to the head.',
      '{actor.name} steps out with the morningstar. A hit to the head kills {target.name}.',
      '{target.name} falls when {actor.name}\'s morningstar hits {target.object} in the head. The blow is fatal.',
      '{actor.name} swings the morningstar as {target.name} comes past. The strike to the head is fatal.',
    ],
  },
  scythe: {
    missed: [
      '{actor.name} sweeps the scythe across the path. {target.name} jumps back and bolts.',
      '{target.name} ducks and runs as {actor.name}\'s scythe sweeps overhead.',
      '{actor.name}\'s scythe scrapes a post as {target.name} slips around it.',
      '{target.name} backs out of reach. {actor.name}\'s scythe cuts nothing but air.',
      '{actor.name} swings the scythe too late. {target.name} is already through the gap.',
    ],
    fatal: [
      '{actor.name} swings the scythe. The blade cuts {target.name} across the neck, killing {target.object}.',
      '{target.name} tries to duck past. {actor.name}\'s scythe catches {target.object} in the neck, leaving a fatal cut.',
      '{actor.name} steps into {target.name}\'s path. A sweep of the scythe cuts {target.possessive} neck and kills {target.object}.',
      '{target.name} turns at the sound of footsteps. {actor.name}\'s scythe lands a fatal slash to the neck.',
      '{actor.name} swings the scythe as {target.name} backs away. The cut to the neck is fatal.',
    ],
  },
  sickle: {
    missed: [
      '{target.name} backs away before {actor.name}\'s sickle comes close.',
      '{actor.name} slashes with the sickle. {target.name} leans back and bolts.',
      '{actor.name}\'s sickle catches a post as {target.name} slips past.',
      '{target.name} pulls back from the sickle and runs before {actor.name} can swing again.',
      '{actor.name} lunges with the sickle, but {target.name} slips to the side and out of reach.',
    ],
    fatal: [
      '{actor.name} slashes {target.name} in the neck with a sickle. The cut is fatal.',
      '{target.name} turns to leave. {actor.name}\'s sickle catches {target.object} in the neck, killing {target.object}.',
      '{actor.name} steps close and kills {target.name} with a sickle slash to the neck.',
      '{target.name} backs away as {actor.name} swings the sickle. The blade cuts {target.object} across the neck. The wound is fatal.',
      '{actor.name} swings the sickle as {target.name} rushes past. The cut to the neck kills {target.object}.',
    ],
  },
  dagger: {
    missed: [
      '{actor.name} lunges with the dagger. {target.name} sidesteps it and runs.',
      '{target.name} backs through a gap before {actor.name}\'s dagger can reach.',
      '{actor.name} jabs with the dagger, but {target.name} dodges the point and bolts.',
      '{target.name} slips behind a barrier. {actor.name}\'s dagger hits wood.',
      '{actor.name} goes for {target.name} with a dagger, but the thrust falls short.',
    ],
    fatal: [
      '{actor.name} stabs {target.name} in the chest with a dagger, killing {target.object}.',
      '{target.name} tries to slip past. {actor.name}\'s dagger catches {target.object} in the chest. The wound is fatal.',
      '{actor.name} steps out with a dagger and kills {target.name} with a stab to the chest.',
      '{target.name} turns as {actor.name} lunges. The dagger hits {target.object} in the chest. The wound is fatal.',
      '{actor.name} lunges with the dagger. {target.name} takes the stab in the chest and dies.',
    ],
  },
  'spiked-knuckles': {
    missed: [
      '{target.name} ducks the punch and runs. {actor.name}\'s spiked brass knuckles miss.',
      '{actor.name} swings with spiked brass knuckles. {target.name} steps back and bolts.',
      '{target.name} slips around a corner before {actor.name} can land a punch with the spiked brass knuckles.',
      '{actor.name} throws a punch with spiked brass knuckles, but {target.name} is already out of reach.',
      '{target.name} sees the spiked brass knuckles and ducks under {actor.name}\'s swing.',
    ],
    fatal: [
      '{actor.name} hits {target.name} in the temple with spiked brass knuckles. The punch is fatal.',
      '{target.name} tries to pass. {actor.name} lands a fatal punch to the temple with spiked brass knuckles.',
      '{actor.name} steps in close and strikes {target.name}\'s temple with spiked brass knuckles, killing {target.object}.',
      '{target.name} turns into a punch from {actor.name}. The spiked brass knuckles strike {target.object} in the temple, killing {target.object}.',
      '{actor.name} throws one punch with spiked brass knuckles. It hits {target.name} in the temple and kills {target.object}.',
    ],
  },
  whip: {
    missed: [
      '{actor.name}\'s whip cracks beside {target.name}, who jumps back and runs.',
      '{target.name} ducks under {actor.name}\'s whip and bolts.',
      '{actor.name} cracks the whip too late. {target.name} is already behind a barrier.',
      '{target.name} hops back as {actor.name}\'s whip snaps across the dirt.',
      '{actor.name} lashes out with a whip. {target.name} steps beyond its reach and runs.',
    ],
    fatal: [
      '{actor.name} cracks the whip. It catches around {target.name}\'s neck and tightens, killing {target.object}.',
      '{target.name} tries to get away, but {actor.name}\'s whip catches {target.object} around the neck. {actor.name} pulls it tight, killing {target.object}.',
      '{actor.name} lashes out with the whip. It coils around {target.name}\'s neck, and the pull is fatal.',
      '{target.name} turns to run. {actor.name} catches {target.object} around the neck with the whip and pulls tight. {target.name} dies.',
      '{actor.name} catches {target.name} around the neck with a whip. The cord tightens, killing {target.object}.',
    ],
  },
};
