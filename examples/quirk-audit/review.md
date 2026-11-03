# Paired quirk audit

Engine 1.16.0; content 1.23.0. 30 matched seeds per danger/personality profile, eight players per game, 540 games total. Each quirk cast has one player per new trait; assignments rotate across seeds. Neutral casts retain the same identities and seed.

Movement, theft and meals below are total recorded facts, shown as neutral / quirks. These small-cast observations test reachability and reveal balance trends; they do not prove equal survival chances or describe larger casts.

| Danger / personality | Games | Moves | Thefts | Meals | Quirk scenes |
| --- | --- | --- | --- | --- | --- |
| low / off | 60 | 596 / 596 | 14 / 14 | 29 / 29 | 0 |
| low / normal | 60 | 627 / 644 | 22 / 27 | 30 / 32 | 43 |
| low / strong | 60 | 627 / 633 | 22 / 19 | 30 / 43 | 42 |
| normal / off | 60 | 424 / 424 | 7 / 7 | 21 / 21 | 0 |
| normal / normal | 60 | 418 / 460 | 9 / 14 | 23 / 29 | 30 |
| normal / strong | 60 | 418 / 458 | 9 / 11 | 23 / 28 | 34 |
| high / off | 60 | 238 / 238 | 3 / 3 | 14 / 14 | 0 |
| high / normal | 60 | 241 / 242 | 2 / 6 | 7 / 9 | 13 |
| high / strong | 60 | 241 / 237 | 2 / 4 | 7 / 11 | 9 |

Violations: 0. Checks cover one assignment per player per round, no new curse facts, and exact neutral/quirk event equivalence with Personality Off. Every run passes the engine replay validator.

## Observed quirk scenes

- quirk-afraid-dark-company: 1
- quirk-afraid-dark-wait: 23
- quirk-compulsive-eater-delay: 3
- quirk-compulsive-eater-night: 1
- quirk-curious-cut: 11
- quirk-curious-empty: 33
- quirk-curious-find: 21
- quirk-early-riser-cache: 7
- quirk-early-riser-route: 24
- quirk-forest-wise-cache: 1
- quirk-forest-wise-route: 1
- quirk-kleptomaniac-pocket: 7
- quirk-kleptomaniac-spare: 1
- quirk-night-owl-cover: 17
- quirk-night-owl-route: 14
- quirk-on-guard-escape: 2
- quirk-on-guard-supplies: 4

## Story review samples

### quirk-afraid-dark-company

Player 3 is reluctant to face the dark trail in The Center Podium alone. Player 7 agrees to share the turn at the shelter.

Facts: survival.

### quirk-afraid-dark-wait

Player 5 waits beside a shelter in The Forest, unwilling to take the unlit trail alone tonight.

Facts: survival.

### quirk-compulsive-eater-delay

At a junction in The Center Podium, Player 2 puts the route decision aside and eats an entire carried ration pack.

Facts: consume.

### quirk-compulsive-eater-night

Player 3 plans a short food break in The Center Podium after dark. Finishing the entire ration pack takes the assignment.

Facts: consume.

### quirk-curious-cut

Player 8 lifts a loose cache panel in The Swamp without checking its hinge. The jagged edge cuts the shoulder, leaving a survivable bleeding wound.

Facts: chain (bleeding-shoulder).

### quirk-curious-empty

A strange box in The Desert keeps Player 4 busy for the whole turn. There is nothing inside to take.

Facts: survival.

### quirk-curious-find

Rather than leave a strange cache alone in The Desert, Player 4 opens it and takes the sealed food inside.

Facts: acquire.

### quirk-early-riser-cache

Player 1 uses the daylight in The Center Podium to check a roadside supply box and finds sealed rations.

Facts: acquire.

### quirk-early-riser-route

Player 7 studies the trail markers before setting off into The Forest.

Facts: move.

### quirk-forest-wise-cache

Player 2 reads the forest trail marks and searches beneath a supply board. A ration pack is still there.

Facts: acquire.

### quirk-forest-wise-route

Player 8 leaves the forest by a service trail and enters The Swamp.

Facts: move.

### quirk-kleptomaniac-pocket

The meeting in The Forest turns sour when Player 1 takes the emergency blanket and Player 6 realizes what happened.

Facts: theft, nemesis.

### quirk-kleptomaniac-spare

Player 4 has possessions of their own in The Mountains, but takes the water flask from Player 2 anyway. The theft is noticed.

Facts: theft, nemesis.

### quirk-night-owl-cover

Player 4 spends the night assignment concealed beside a shelter in The Tundra.

Facts: survival.

### quirk-night-owl-route

Moving between covered stretches, Player 4 crosses into The Center Podium.

Facts: move.

### quirk-on-guard-escape

Watching the nearest contestants, Player 1 ducks the opening fight and reaches The Forest.

Facts: move.

### quirk-on-guard-supplies

Player 1 waits for the crowd to turn toward the weapon rack, then takes rations from the central food box.

Facts: acquire.

## Authored variants for review

### quirk-early-riser-cache

1. {actor.name} uses the daylight in {biome} to check a roadside supply box and finds sealed rations.
2. With enough light to see the latch in {biome}, {actor.name} opens a supply box and takes a ration pack.
3. {actor.name} searches beneath a supply sign in {biome} during the day and retrieves sealed rations.
4. Daylight reveals a food box beside the path in {biome}. {actor.name} checks inside and pockets the rations.
5. {actor.name} spends the daylight search in {biome} checking delivery lockers. One still holds a ration pack.
6. A careful daytime search of the supply stop in {biome} gives {actor.name} sealed rations.
7. {actor.name} checks the sunlit side of a supply shelter in {biome} and finds a food parcel tucked behind its sign.

### quirk-early-riser-route

1. {actor.name} checks the route in daylight and sets out for {biome}.
2. Using the daylight to choose an exit, {actor.name} reaches {biome}.
3. {actor.name} studies the trail markers before setting off into {biome}.
4. After checking the path in daylight, {actor.name} crosses into {biome}.
5. {actor.name} packs up during the day and takes a clear route into {biome}.
6. The daylight gives {actor.name} time to check an exit into {biome}.
7. {actor.name} follows a route checked in daylight and arrives in {biome}.

### quirk-night-owl-cover

1. {actor.name} settles into cover in {biome}, letting distant footsteps pass through the night.
2. In the darkness of {biome}, {actor.name} waits behind a supply shelter rather than crossing the open trail.
3. {actor.name} uses a shadowed recess in {biome} to keep out of sight for the turn.
4. A dark corner of {biome} gives {actor.name} a place to watch the path without stepping onto it.
5. {actor.name} stays still beneath an overhang in {biome} until the night grows quiet again.
6. Rather than show a silhouette on the path in {biome}, {actor.name} waits behind its low barrier.
7. {actor.name} spends the night assignment concealed beside a shelter in {biome}.

### quirk-night-owl-route

1. {actor.name} checks the trail by night and slips into {biome}.
2. Keeping to the quiet path, {actor.name} reaches {biome} after dark.
3. {actor.name} takes a sheltered night route into {biome}.
4. After listening at the junction, {actor.name} moves into {biome}.
5. {actor.name} follows the quieter trail through the night into {biome}.
6. Moving between covered stretches, {actor.name} crosses into {biome}.
7. {actor.name} leaves by a quiet exit and arrives in {biome} at night.

### quirk-on-guard-escape

1. {actor.name} spots a raised weapon and takes an opening exit into {biome}.
2. Watching the nearest contestants, {actor.name} ducks the opening fight and reaches {biome}.
3. {actor.name} notices someone charging the supply rack and breaks away into {biome}.
4. A glance behind saves {actor.name} from joining the opening brawl. The exit leads into {biome}.
5. {actor.name} sees the central crowd closing in and takes a clear route into {biome}.
6. Keeping an eye on the weapon rack, {actor.name} leaves the bloodbath for {biome}.
7. {actor.name} catches the movement of an approaching rival and escapes into {biome}.

### quirk-on-guard-supplies

1. {actor.name} checks both approaches to a central food box before taking a sealed ration pack.
2. With one eye on the opening fight, {actor.name} reaches into a supply box and secures sealed rations.
3. {actor.name} waits for the crowd to turn toward the weapon rack, then takes rations from the central food box.
4. Keeping the supply crate between the crowd and the path, {actor.name} retrieves a ration pack.
5. {actor.name} watches the nearest contestants while lifting sealed rations from a central crate.
6. A guarded approach to the central supplies gives {actor.name} a ration pack without joining the fight.
7. {actor.name} checks the space behind the central food rack and claims a pack of sealed rations.

### quirk-forest-wise-cache

1. {actor.name} follows old supply blazes through the forest and finds sealed rations in a trail box.
2. A faded trail symbol in the forest leads {actor.name} to a food cache containing sealed rations.
3. {actor.name} recognizes a supply mark on a forest post and retrieves a ration pack from the box below it.
4. Checking where the forest service paths meet, {actor.name} discovers sealed rations in a low locker.
5. {actor.name} reads the forest trail marks and searches beneath a supply board. A ration pack is still there.
6. A familiar pattern of blazes draws {actor.name} to a forest cache with sealed food inside.
7. {actor.name} checks a delivery box at a forest trail junction and takes the rations left inside.

### quirk-forest-wise-route

1. {actor.name} reads the forest trail marks and follows an exit into {biome}.
2. An old forest service path takes {actor.name} into {biome}.
3. {actor.name} chooses a marked forest exit and reaches {biome}.
4. Following a forest boundary trail, {actor.name} crosses into {biome}.
5. {actor.name} picks out a maintained forest route leading into {biome}.
6. The forest junction marks give {actor.name} a route into {biome}.
7. {actor.name} leaves the forest by a service trail and enters {biome}.

### quirk-kleptomaniac-pocket

1. {actor.name} takes the {item} from {target.name} during a brief stop in {biome}. {target.name} notices the theft.
2. While {target.name} checks the path in {biome}, {actor.name} pockets the {item}. The missing possession is quickly noticed.
3. {actor.name} cannot leave {target.name}'s {item} alone in {biome}. {target.name} catches the last movement of the theft.
4. At a trail stop in {biome}, {actor.name} quietly takes the {item}. {target.name} sees where the possession has gone.
5. {target.name} turns back in {biome} to find {actor.name} taking the {item}. The theft ends the friendly pause.
6. {actor.name} slips the {item} away from {target.name} in {biome}, earning an angry look when the loss is discovered.
7. The meeting in {biome} turns sour when {actor.name} takes the {item} and {target.name} realizes what happened.

### quirk-kleptomaniac-spare

1. Already carrying equipment in {biome}, {actor.name} still takes {target.name}'s {item}. {target.name} notices the unnecessary theft.
2. {actor.name} has possessions of {actor.possessive} own in {biome}, but takes the {item} from {target.name} anyway. The theft is noticed.
3. Carrying equipment does not stop {actor.name} stealing {target.name}'s {item} in {biome}. {target.name} sees the loss.
4. {target.name} notices {actor.name} adding the stolen {item} to an already occupied pack in {biome}.
5. Despite already being equipped, {actor.name} steals the {item} at the stop in {biome}. {target.name} catches on.
6. {actor.name} makes room among existing possessions for {target.name}'s {item} in {biome}. The petty theft is discovered.
7. In {biome}, {actor.name} reaches past carried equipment to take the {item} from {target.name}, who notices the theft.

### quirk-curious-find

1. {actor.name} opens an unmarked cache in {biome} without checking it first. Inside is a sealed ration pack.
2. An unfamiliar box in {biome} gets the better of {actor.name}'s caution. This time it contains sealed rations.
3. {actor.name} lifts the lid of an unmarked trail box in {biome} and discovers a ration pack.
4. Rather than leave a strange cache alone in {biome}, {actor.name} opens it and takes the sealed food inside.
5. {actor.name} investigates a loose panel on a supply box in {biome}. A ration pack lies behind it.
6. A rattling cache draws {actor.name} off the path in {biome}. Opening it reveals sealed rations.
7. {actor.name} cannot resist checking a box wedged beneath a sign in {biome}. The search yields a ration pack.

### quirk-curious-empty

1. {actor.name} spends the turn opening an unfamiliar locker in {biome}. It is empty.
2. An unmarked panel occupies {actor.name} in {biome} until the turn is gone. Behind it is a blank wall.
3. {actor.name} investigates a clicking latch in {biome}, only to discover an empty equipment housing.
4. A strange box in {biome} keeps {actor.name} busy for the whole turn. There is nothing inside to take.
5. {actor.name} takes apart a jammed cache lid in {biome}. The empty compartment rewards the effort with nothing.
6. Curiosity sends {actor.name} to inspect an abandoned control box in {biome}. The turn ends without supplies or movement.
7. {actor.name} checks every compartment of an unfamiliar locker in {biome}, spending the turn on an empty box.

### quirk-curious-cut

1. {actor.name} lifts a loose cache panel in {biome} without checking its hinge. The jagged edge cuts the shoulder, leaving a survivable bleeding wound.
2. Investigating a broken locker in {biome}, {actor.name} catches a shoulder on its sharp frame. The cut is bleeding, but {actor.name} survives.
3. {actor.name} reaches into a damaged cache in {biome}. A loose metal flap scrapes the shoulder deeply enough to bleed; the injury is not fatal.
4. An unfamiliar hatch in {biome} swings back as {actor.name} opens it. The torn edge cuts the shoulder, leaving {actor.name} alive but bleeding.
5. {actor.name} squeezes beside an unmarked supply box in {biome} to inspect its latch. A sharp bracket cuts the shoulder; {actor.name} survives with the wound bleeding.
6. Curiosity draws {actor.name} under a loose panel in {biome}. Its edge catches the shoulder, causing a bleeding cut that {actor.name} survives.
7. {actor.name} tests a broken cache hinge in {biome}. The slipping lid cuts the shoulder, leaving a bleeding wound without killing {actor.object}.

### quirk-compulsive-eater-delay

1. {actor.name} stops to eat the carried rations in {biome} instead of checking the next route. The entire pack is gone by the end of the turn.
2. The ration pack in {actor.name}'s hands proves more tempting than the trail in {biome}. {actor.name} eats it all and makes no progress this turn.
3. {actor.name} opens the carried food in {biome} before making a plan. The turn goes on finishing the rations.
4. At a junction in {biome}, {actor.name} puts the route decision aside and eats an entire carried ration pack.
5. {actor.name} starts picking at the carried rations in {biome} and keeps eating until none remain. The search waits for another turn.
6. Rather than investigate the supply stop in {biome}, {actor.name} sits down and finishes the carried food.
7. {actor.name} spends the assignment in {biome} eating a ration pack that could have been kept for later.

### quirk-compulsive-eater-night

1. Instead of watching the trail in {biome}, {actor.name} opens the carried rations after dark and eats the whole pack.
2. {actor.name} reaches for a ration pack during the night in {biome}. A few bites turn into the entire meal, using the turn.
3. Night in {biome} finds {actor.name} occupied with the carried food. The rations are finished before another plan is made.
4. {actor.name} spends the night assignment in {biome} unwrapping and finishing the rations instead of scouting.
5. A food wrapper rustles in {biome} as {actor.name} eats the carried ration pack rather than checking the dark trail.
6. {actor.name} plans a short food break in {biome} after dark. Finishing the entire ration pack takes the assignment.
7. The night search in {biome} never starts: {actor.name} settles down with the carried rations and eats them all.

### quirk-afraid-dark-wait

1. {actor.name} waits beside a shelter in {biome}, unwilling to take the unlit trail alone tonight.
2. Without a lantern in {biome}, {actor.name} spends the night assignment at the shelter entrance instead of setting off.
3. {actor.name} peers down the dark path in {biome} and stays by the trail shelter for the turn.
4. The darkness beyond a shelter in {biome} keeps {actor.name} from starting a solitary search tonight.
5. {actor.name} stops where the path vanishes into darkness in {biome}. With no lantern, the turn passes in hesitation.
6. A night departure in {biome} feels too daunting without light. {actor.name} waits in a sheltered corner.
7. {actor.name} stays beside a familiar trail marker in {biome}, reluctant to walk into the night alone.

### quirk-afraid-dark-company

1. {actor.name} asks to wait near {target.name} in {biome}, finding the unlit night easier with company. Both spend the turn at the shelter.
2. Without a lantern in {biome}, {actor.name} joins {target.name} at a resting place. They stay together for the night assignment.
3. {actor.name} is reluctant to face the dark trail in {biome} alone. {target.name} agrees to share the turn at the shelter.
4. In {biome}, {actor.name} asks {target.name} for company rather than taking the night path alone. They wait together.
5. The unlit night in {biome} draws {actor.name} to {target.name}'s resting place. Both stay there for the turn.
6. {actor.name} feels less exposed beside {target.name} in {biome}. With no lantern to take onto the trail, they spend the night assignment together.
7. {target.name} shares a sheltered stop in {biome} with {actor.name}, who is unwilling to search the dark paths alone. The turn passes in company.

