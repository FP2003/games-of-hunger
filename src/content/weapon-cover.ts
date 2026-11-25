import type { BiomeId } from '../domain';

export const weaponCoverWording = {
  forest: [
    'Thick brush crowds the trail.',
    'The path bends around a fallen tree.',
    'Low branches hide the trail ahead.',
    'Ferns cover the slope beside the path.',
    'The trees close in on both sides.',
  ],
  swamp: [
    'The boardwalk disappears into tall reeds.',
    'A muddy path winds between the channels.',
    'The planks creak where the boardwalk bends.',
    'Reeds crowd the bank beside the crossing.',
    'A fallen trunk lies across the mud.',
  ],
  mountains: [
    'The trail curves around a boulder.',
    'A rock ledge hides the bend ahead.',
    'Loose stones shift on the switchback.',
    'The path narrows between two slabs of rock.',
    'The trail drops into a rocky gully.',
  ],
  desert: [
    'The path dips into a dry wash.',
    'A sandstone outcrop hides the bend.',
    'Wind drags sand across the trail.',
    'A low dune cuts off the view ahead.',
    'The path runs along a crumbling bank.',
  ],
  tundra: [
    'A snowdrift rises beside the path.',
    'The trail bends around a ridge of ice.',
    'Blowing snow hides the ground ahead.',
    'A low bank breaks the wind.',
    'An icy hollow cuts across the route.',
  ],
  ruins: [
    'A stack of crates blocks the view past the supply rack.',
    'The path turns at the corner of a service shed.',
    'A concrete divider cuts across the supply yard.',
    'The route narrows beside the Podium steps.',
    'The path runs between rows of empty supply racks.',
  ],
} satisfies Record<BiomeId, readonly [string, string, string, string, string]>;
