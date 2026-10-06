# Layout Contract

Use this checklist when creating or correcting an unfurnished floor. The
repository `PRODUCT_SPEC.md` remains authoritative if this reference ever
drifts.

## Coordinate system

Store the source plan in one two-dimensional coordinate space. All floors in a V2 building share
the only transform from plan coordinates to Three.js world coordinates:

```text
worldX = (planX - originX) * metersPerPlanUnit
worldZ = (planY - originY) * metersPerPlanUnit
```

Every footprint point, room point, wall endpoint, opening offset, and
plan-derived placement uses this transform. Do not add a second origin or
embed world-scale constants in room or wall data.

Record material inferred dimensions and topology in
`HomeManifest.assumptions`. Keep assumptions short, testable, and tied to a
specific floor, room, wall, or opening when possible.

## Required relationships

### `HomeManifest`

- Declares metadata, restrained palette, `floors[]`, safe shortcuts, and
  assumptions.
- V2 contains ordered floors, shared `coordinates`, and adjacent-floor `stairs[]`.
  V1 single-floor inputs migrate without changing IDs. Generate only the floors
  requested by the user; review one unfurnished floor before equipping it.
- Uses stable IDs suitable for corrections and upstream merges.
- Selects only documented built-in shortcuts. `all-lights` is the intentional
  exception that discovers every available HA light at runtime; it does not
  justify fuzzy room or device binding.

### `FloorSpec`

- Is authored as deterministic pure JSON under `home/src/floors/` and loaded
  through the engine's public `assertValidLayoutFloorSpec` helper. Follow
  [floor-json-format.md](floor-json-format.md) for the exact current shape.
- Owns the independent plan transform, footprint, rooms, walls, wall junctions, openings, and
  ceilings.
- The footprint is a simple polygon with no self-intersection.
- The floor is complete: include corridors, halls, closets, and circulation
  spaces that are represented as rooms in the plan.

### `RoomSpec`

- Uses a simple polygon inside the floor footprint.
- Uses a stable room ID and restrained accent.
- May declare one optional solid `floorColor`; omission keeps the stable
  neutral floor color, and textures remain unsupported.
- Declares empty `dashboardSlots` and `devices` during layout generation.
- Contains no HA area/entity ID and no runtime binding profile. Exact room-area
  mapping happens after browser OAuth.
- Remains unfurnished in this skill; do not add a furnishings component merely
  because furniture symbols appear on the plan.

### `WallSpec`

- Uses arbitrary straight plan-space endpoints; never assume axis alignment.
- Declares positive height and thickness plus interior/exterior
  classification.
- May declare optional solid `faceColors.left` and `faceColors.right`. Read the
  sides while looking from `from` toward `to`; preserve endpoint direction
  across corrections so the colors do not swap.
- Leaves omitted faces, horizontal caps, opening returns, and non-parallel
  junction surfaces on their stable palette fallbacks.
- Is the single source for wall transform, thickness, exterior treatment,
  camera fade, shadows, and collision semantics.
- Intersections and endpoints must close intentionally. Avoid tiny gaps,
  unexplained overlaps, and decorative patches.

### `WallJunctionSpec`

- Declares every real corner, collinear endpoint join, T-junction, and crossing
  exactly once.
- Uses one stable ID, the exact shared plan point, and the complete set of
  incident wall IDs.
- Does not represent an opening jamb or repeat wall thickness, height,
  finish, fade, shadow, or collision facts derived by the engine.
- Must not overlap an opening's wall-relative span.

### `DoorSpec`, `WindowSpec`, and `PassageSpec`

- Is exactly one of `door`, `window`, or `passage` and is owned by exactly
  one wall.
- Is optional; `openings: []` is valid when the floor has no openings.
- Uses dimensions and a wall-relative offset/transform that keep it within the
  supporting wall span and height.
- Inherits wall thickness and behaviors; do not copy a literal thickness into
  a separate object implementation.
- Separates a door's `operation` from its visual `variant` and `finish`;
  configures window operation, panels, glazing, and optional muntins in
  window-only fields; and uses a passage only when no moving leaf or contact
  exists.
- Defines only supported animation behavior. A door's open state must affect
  its portal collision consistently; a window animation must respect its
  actual form; a passage is always traversable.
- Has no contact mapping during layout generation. A later room-equipping task
  may add an optional typed `contactSlot`; the browser profile owns its exact
  entity mapping.

### `CeilingSpec`

- Defaults to flat.
- Uses flat ceilings in layout JSON. The current public layout-only validator
  rejects sloped ceilings; report that limitation when the source requires one.
- Stays compatible with room bounds, wall tops, and walk head clearance.

## Opening construction rules

Treat a wall plus its opening as one supported architectural assembly:

- every jamb, sill, lintel, and remaining masonry belongs to the wall system;
- all masonry around an opening shares exterior finish where applicable;
- all pieces share camera-facing fade and shadow behavior;
- the engine derives the portal and collision from the opening relationship;
  and
- furnishing components never add or replace masonry around an opening.

An opening that only looks correct from one camera is not correct. Inspect a
normal room view, a grazing view along the wall, and a view that activates
wall fading.

## Geometry validation

Check numerically before visual review:

- finite coordinates and positive dimensions;
- non-self-intersecting footprint and room polygons;
- room polygons contained in the footprint;
- deliberate room adjacency without unexplained slivers;
- wall endpoints, required junction completeness, and junction tolerances;
- openings contained within their owner wall with enough supporting material;
- no duplicate IDs or ambiguous opening ownership;
- ceiling planes covering their intended rooms; and
- walk spawn points and paths clear of closed collision.

Use the repository's exact tolerances when implemented. Do not invent looser
local thresholds just to make invalid geometry pass.

## Visual review

Use the normal UI and verify:

1. full orbit overview at desktop and mobile widths;
2. room focus for each room;
3. walk entry, movement, door passage, and exit;
4. day and night readability;
5. solid and faded views of all exterior masonry, junctions, and openings;
6. opening animation with no detached frame or collision mismatch; and
7. normal plus grazing views of corrected junctions and openings.
8. both sides of every wall with a directed face-color override and every room
   with a floor-color override.

The floor is ready for user review only when the complete unfurnished shell is
coherent, automated checks pass or honest limitations are reported, and every
material inference is disclosed.
