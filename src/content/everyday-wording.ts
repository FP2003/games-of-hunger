import type { BiomeId } from '../domain';

// Each pair accompanies the original line at the same regional scene index.
export const everydayWording: Record<BiomeId, [string, string][]> = {
  forest: [
    ['Beneath the canopy, {actor.name} waits for the distant footsteps to die away.', '{actor.name} stays under the canopy until the sound of footsteps in the distance fades.'],
    ['A gap in the trees leads {actor.name} into {biome}.', '{actor.name} passes through a break in the trees and enters {biome}.'],
    ['Inside a hollow trunk, {actor.name} finds {item}.', '{actor.name} searches a hollow trunk and discovers {item} within.'],
    ['Beneath a collapsed bird hide, {actor.name} digs up {item}.', '{actor.name} uncovers {item} under the remains of a fallen bird hide.'],
    ['Between the roots, {actor.name} notices an abandoned {item} and picks it up.', '{actor.name} retrieves an abandoned {item} spotted among the roots.'],
    ['To lighten the load, {actor.name} puts {item} beneath a fern and leaves it there.', '{actor.name} tucks {item} under a fern before continuing with less to carry.'],
  ],
  swamp: [
    ['{actor.name} checks each hummock before trusting the mud with any dignity.', 'Before risking a muddy loss of dignity, {actor.name} tests each hummock.'],
    ['A dry boardwalk gives {actor.name} a way out into {biome}.', '{actor.name} discovers a dry boardwalk and follows it out into {biome}.'],
    ['From a watertight supply drum, {actor.name} pulls {item}.', '{actor.name} reaches into a watertight supply drum and lifts out {item}.'],
    ['An old survey post holds {item}, which {actor.name} finds hanging there.', '{actor.name} discovers {item} suspended from an old survey post.'],
    ['{actor.name} retrieves {item} from the shallow water.', 'From a shallow pool, {actor.name} recovers {item}.'],
    ['{actor.name} leaves {item} on a reed platform before moving on with a lighter load.', 'With {item} set down on a reed platform, {actor.name} continues carrying less.'],
  ],
  mountains: [
    ['Behind a cairn, {actor.name} takes shelter and examines the next ridge.', '{actor.name} studies the ridge ahead from the shelter of a cairn.'],
    ['Following a marked pass downhill, {actor.name} enters {biome}.', '{actor.name} takes the marked descent into {biome}.'],
    ['Inside a climbing cache, {actor.name} finds {item} and takes it.', '{actor.name} retrieves {item} after opening a climbing cache.'],
    ['Tucked inside a ranger shelter, {actor.name} discovers {item}.', '{actor.name} searches a ranger shelter and finds {item} stowed within.'],
    ['On a rock ledge, {actor.name} finds an abandoned {item} and retrieves it.', '{actor.name} collects an abandoned {item} from a ledge in the rock.'],
    ['Rather than carry the extra weight, {actor.name} leaves {item} beside a cairn.', '{actor.name} sets {item} at a cairn, deciding the additional weight is not worth the risk.'],
  ],
  desert: [
    ['In a dune marker\'s narrow shadow, {actor.name} saves energy.', '{actor.name} stays in the slim shade of a dune marker to conserve energy.'],
    ['Service-road stakes guide {actor.name} into {biome}.', '{actor.name} enters {biome} by following the stakes along the service road.'],
    ['A half-buried supply case yields {item} when {actor.name} searches it.', '{actor.name} finds {item} within a supply case partly covered by sand.'],
    ['At a shaded checkpoint, {actor.name} searches and discovers {item}.', '{actor.name} finds {item} while looking through a checkpoint in the shade.'],
    ['Beside an abandoned sunshade, {actor.name} collects {item}.', '{actor.name} retrieves {item} found next to a deserted sunshade.'],
    ['For the next traveler, {actor.name} sets {item} on a trail marker.', '{actor.name} places {item} on a trail marker, leaving it for whoever comes next.'],
  ],
  tundra: [
    ['After building a shallow windbreak, {actor.name} waits for the gusts to pass.', '{actor.name} puts up a low windbreak and shelters there until the gusts ease.'],
    ['Orange trail poles guide {actor.name} into {biome}.', '{actor.name} enters {biome} along the route marked by orange poles.'],
    ['From a snow-covered emergency box, {actor.name} digs out {item}.', '{actor.name} uncovers {item} inside an emergency box buried under snow.'],
    ['At an insulated weather station, {actor.name} retrieves {item}.', '{actor.name} finds and recovers {item} from an insulated weather station.'],
    ['{actor.name} picks an abandoned {item} out of the snow.', 'In the snow, {actor.name} discovers an abandoned {item} and lifts it free.'],
    ['Inside a marked snow shelter, {actor.name} leaves {item}.', '{actor.name} puts {item} down within a snow shelter marked along the route.'],
  ],
  ruins: [
    ['In the old control room, {actor.name} rests beneath the judgmental gaze of dead monitors.', '{actor.name} takes a rest in the old control room, where even the dead monitors seem disapproving.'],
    ['An emergency exit route takes {actor.name} into {biome}.', '{actor.name} enters {biome} by following the emergency exit route.'],
    ['A locker in the station canteen holds {item}, which {actor.name} finds.', '{actor.name} discovers {item} inside the station canteen locker.'],
    ['From an intact equipment drawer, {actor.name} pulls {item}.', '{actor.name} retrieves {item} from an equipment drawer that has survived.'],
    ['On the dusty broadcast floor, {actor.name} finds {item} and picks it up.', '{actor.name} collects {item} from the dust-covered broadcast floor.'],
    ['{actor.name} leaves {item} beside the station map, then continues with less weight.', 'After setting {item} down next to the station map, {actor.name} travels on with a lighter load.'],
  ],
};
