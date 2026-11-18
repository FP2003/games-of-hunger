# Dynamic arena routes

## Implementation plan

1. Enable seeded routes in the default content pack. Shuffle the outer regions with a dedicated random stream and connect consecutive regions in both directions. Keep a direct route from every outer region to the Center Podium.
2. Generate the layout before simulation and record it in the run's content snapshot. Use that snapshot for movement, arena events, the canonical run ID, and replay validation. Bump the engine version.
3. Let border encounters qualify through the actual route to their destination. Show the selected seed's layout in setup and the recorded layout in playback, where closures affect current access.
4. Verify that seeds can add and remove a Forest–Tundra route, repeat runs reproduce their maps, and stored or imported replays show the map they were played on.

## Design review

| Failure to rule out | Decision |
| --- | --- |
| Could a random map break evacuation, resupply, or a finale? | Each of those scenes can require a direct trip to the Center Podium. Preserve every podium route. The shuffled outer chain guarantees a connected outer network at the start and keeps the existing number of routes. |
| Could both directions disagree? | Build each route as an undirected pair and check that both ends list one another. |
| Could a border scene still assume the old map? | Determine eligibility from its first movement effect and the run's adjacency. Keep the destination condition for the other tribute. Apply effects through the existing movement checks. |
| Could a displayed map differ from the match? | Setup and generation share the same seed-based layout function. Playback reads the stored adjacency and filters destinations using the visible event's arena status. |
| Could regeneration invalidate old saves or custom maps? | Generation is opt-in per content pack. Existing replays carry the adjacency that was in force when they were recorded and are validated against that snapshot. |
| Could rolling a map consume encounter randomness? | Use a dedicated stream. A repeated seed can yield the same layout by design, and different seeds can occasionally select the same layout. |
