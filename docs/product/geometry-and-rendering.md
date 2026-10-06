# Geometry, rendering, and navigation

Runtime `HomeManifest` carries ordered floors. The building shares one origin and
meters-per-plan-unit scale; positive floor-to-floor heights determine elevations.
Floors marked `belowGround: true` form a bottom-to-top prefix before ground.
Ground remains at zero; basement elevations accumulate downward. Changing a
basement height moves that floor and deeper floors without moving ground.
Basements are hidden in the whole-building view and visible when selected in
cutaway or entered in Walk. Basement cutaways hide terrain and floors above.
Ground terrain stays at ground level, with stair apertures through every layer.
Footprint/room polygons, straight walls, explicit wall junctions, and wall-owned
openings define architecture. Junction/opening clearance uses the finite spans of
adjoining walls: a shallow-angle continuation extending away from an opening
does not obstruct it. Actual intersecting wall spans remain protected, with a
2 cm finish tolerance. Junction clearance only reserves spans where the adjoining
wall rises above the opening sill; windows above low partitions remain valid.
Openings inherit wall thickness, orientation, fade,
and cutout behavior. Door/window orientation is relative to wall direction.
Doors support hinged/sliding variants, windows fixed/casement variants, and
passages rectangular/arched variants.
Paired hinged and sliding door leaves meet at the center in the same depth plane when closed.

The engine constructs continuous walls and junction assemblies with interior and
exterior material groups. Wall face finishes retain each wall’s boundaries,
including continuous bands above doors and windows and each side of a corner.
Polygon clipping and numerical normalization prevent
near-coincident seams from destabilizing geometry. Opening cuts extend 1 mm
past both wall faces so diagonal walls cannot leave opaque slivers across the aperture. Wall bases extend to outdoor
terrain, 5 cm below the indoor floor datum, without shifting openings or wall tops. Floor-level exterior doors and passages
have solid thresholds bridging that terrain-to-floor difference. Ceilings support flat and
sloped runtime surfaces. Project authoring has the narrower flat-ceiling schema.
The exterior roof is separate procedural geometry, visible in Home's roof view.
Connected ceiling areas merge at equal height, with higher floor coverage removed
from lower sections. Concave outlines, detached sections, and courtyard holes are
retained. Enclosed construction seams narrower than wall thickness plus 1 cm are
bridged. Each exposed flat section gets one gable using the shared ridge axis,
or a level roof with no gable rise when Flat is selected;
authored sloped ceiling planes retain their slope. Roof faces split at the ridge
before triangulation. The default pitch is 25 degrees, limited to a 2 m rise and
lowered where needed below taller neighboring ceiling tiers. Edges are flush with
the derived coverage, with an 8 cm roof skin. Infill below the roof continues
the supporting exterior wall finish, including per-wall and face-color overrides,
down across the slab depth. Corner infill uses the supporting wall’s junction
geometry rather than a fixed endpoint-distance cutoff. Batched walls, standalone
walls, and roof infill share face-override/exterior-override/palette precedence. Only the thin roof edge and underside use the trim
color. Interior ceiling slabs are hidden in exterior roof view and remain in
Walk and the existing cutaway views. This simple
model clips a gable to irregular outlines; it does not solve intersecting roof
valleys or expose pitch/overhang controls. Optional `home.roof` settings preserve
old projects through defaults.
Pools cut ground surfaces and contribute collision. Their translucent toon water
uses meter-scaled analytic ripples and a grazing-angle sheen, with no textures,
additional geometry, or reflection render targets. Ripple time advances only on
existing scene frames and pauses for reduced motion; idle demand rendering stays
idle. Water retains scene lighting and received shadows.
Floor finishes support solid
colors and the preset IDs exported by `FLOOR_PATTERN_PRESET_IDS`, including wood,
stone/tile, dirt, bark, and outdoor stone treatments. Ordered room/ground zones
compose finishes; implementation belongs to the engine finish modules.

Visible home content uses procedural geometry, toon materials, and restrained
outlines. Engine-owned in-memory floor finish textures remain part of the stable
product. Shared lighting, fading, and outline behavior stay engine-owned.
Physical lights render only on the active floor. Device emitters, including
fallbacks from resolved bindings, are scoped to their owning floor so stair
transitions never recreate another storey’s light at the active floor’s elevation. Indoor sources close to an
opaque wall emit into their room through an unshadowed spotlight; sources at
openings and sources farther from walls retain point lighting. This avoids
lighting through the wall without allocating point-light shadow maps.
Explore and Arrange use four nearest-filtered toon bands, warm key light and
cool sky fill. A single multisampled HDR scene render supplies color and depth
for camera-dependent, approximately one-CSS-pixel occlusion contours. The pass
subtracts the opposite depth slope to suppress lines on continuous slanted
surfaces; it does not detect normal, material or triangle edges. Transparent
surfaces retain their existing depth-write behavior. Decorative mesh shells are
suppressed inside this scene pipeline; interaction highlights stay separate.
Construct remains an unprocessed plan, and standalone model previews keep their
existing mesh outlines. GPU contour regressions run with
`npm run verify:scene-contours` (local Chrome required). The implementation uses
Three.js [depth textures](https://threejs.org/docs/pages/DepthTexture.html) and
[multisampled render targets](https://threejs.org/docs/pages/RenderTarget.html);
MSAA follows the scene quality setting.

Construct batches compatible wall/opening strokes, item footprints, and floor
outlines by drawing style. Stair plan markings use instanced boxes. Invisible
editor picking surfaces keep their meshes and raycasting but disable material
rendering; selected and preview highlights remain visible. This reduces draw
calls without changing the architecture or selection geometry.

Walk adds a procedural clear sky with a soft horizon gradient and restrained sun
disk. It reads the current interpolated solar light direction, color, and sky-fill
intensity, including live data, forced day/night, and daylight fallback. The
direction-only background has no translation parallax, depth writes, shadows, or
interaction targets. It preserves architectural occlusion and the contour pass.
Other camera modes keep their existing solid backgrounds.

Device rendering resolves stable models before compatible local extensions.
Devices without a resolved room binding, including outdoor scene items, remain
visible. Supplied bindings must still match the item identity and model.
Always-on scene items emit light at their actual placement even outside rooms
and without HA bindings; other unbound devices show their disconnected state.
Garden lanterns use a short, warm inverse-square falloff to softly illuminate
nearby ground in night mode.

Walk collision derives from walls, openings, junctions, and pools. Navigation
derives optional clear spawn points and checks room connectivity; rooms without
a safe spawn (such as small cupboards) do not produce a validation diagnostic.
Walk entry still requires a safe spawn and skips rooms without one. Navigation
does not maintain a second hand-authored collision plan. Walk controls support keyboard/mouse and touch
input, pitch limits, collision resolution, and automatic unbound door opening.
Mobile fullscreen/orientation requests are capability-dependent. Reduced-motion
and document-visibility state affect behavior.

Catalog rounded boxes reuse up to 64 recently generated CPU geometry templates.
Each mounted mesh owns independent buffers; eviction and disposal cannot modify
another instance. Bevel subdivisions, UVs, crease normals, materials, shadows,
and contours retain their existing settings. The orbital camera points at its
initial target before the first frame, without resetting subsequent user orbit
when opening room controls.

The normal scene uses demand rendering outside walk mode and suspends rendering
when hidden. Mobile quality can adapt to performance changes; editor scenes use
their own demand-rendered preview settings. These mechanisms do not establish a
universal FPS or browser-compatibility guarantee.

Implementation: [contracts](../../packages/engine/src/types.ts),
[architecture scene](../../packages/engine/src/ArchitectureScene.tsx),
[wall geometry](../../packages/engine/src/architecture-geometry.ts),
[navigation](../../packages/engine/src/navigation.ts),
[floor finishes](../../packages/engine/src/floor-finishes/index.ts),
[quality settings](../../packages/engine/src/performance.ts).

[Back to product overview](../../PRODUCT_SPEC.md).

Straight, L-shaped, and spiral stairs derive treads, landings, guards, floor/ceiling apertures, and walk
ramps from adjacent levels. Walking updates the selected floor at landings.

Only ground-floor walls extend to the terrain datum. Shared-level wall caps are
clipped where the neighboring wall continues, preserving exposed terrace caps.
Exterior finish continues across structural slab depth up to the next level,
while interior ceiling heights and opening dimensions remain authored values.

The shared stylized renderer uses opaque toon batching and cached automatic
meshoptimizer LOD in Orbit, Walk, and Arrange. Static transforms/colors are baked
into persistent batch buffers; camera LOD and fading changes retain those buffers.
Moving/recolored and incompatible meshes retain ordinary draws. Source meshes
remain the picking surface, and existing InstancedMesh objects retain all instances.
LOD simplification runs in a worker; unavailable workers keep full detail.
Shadow invalidation inspects authored geometry before LOD substitution, avoiding
camera-only LOD redraws. Devices without native multi-draw keep ordinary draws.
The reusable performance script includes camera-motion timings and batch-buffer
churn checks. Real-device verification remains necessary for mobile fluidity.

Roll-up doors own ordinary floor-level wall apertures. Their fixed header and
jambs fit inside the opening envelope, and slats retract upward using normalized
opening position. Geometry and Walk share the header, travel, and clear-width
calculation. Walk requires eye height plus a 0.18 m head margin and current jump
elevation; jambs remain collidable. Reported positions apply directly, without
an independent animation timeline. Unbound doors open locally on approach;
bound doors follow reported/retained state, even when closed or unavailable.

L-shaped stair elevation rises along each flight and remains constant across its
square landing; the risers are split proportionally between the two runs. Spiral
stairs use wedge treads around a fixed central support, an outer rail, a circular
aperture, and a guarded upper bridge to the surrounding floor. The shared derived
route drives continuous Walk elevation. Stair advice intersects tread and landing
clearance volumes with physical wall slices and registered, scaled, rotated model
bounds. Walls share their height slices and opening cuts with the renderer; closed
door state does not fill these structural apertures. Bounds retain model-origin
offsets and vertical clearance, including the spiral bridge. Unknown model bounds
are not guessed; missing-model validation remains authoritative. Whole landing
polygons are checked against floor regions. Width and slope are unrestricted. Full-turn
spirals retain the current route elevation at their coincident entrance and exit.
Shaped plan strokes and guard rails are instanced; each model family has its own
renderer. Legacy straight-stair geometry and stored records remain supported.
An active Walk traversal owns its stair ID even through overlapping footprints;
entry ties use stable IDs. Unsupported or obstructed exits stop movement, and stairs
narrower than the walker remain modelable without allowing traversal.

U-shaped stairs use two adjacent parallel flights and a flat 180° landing. They share
the L-shaped stair controls: lower/upper flight lengths, width, and left/right turn.
Place the bottom, lower-flight landing center, then the returning upper endpoint.
The landing depth equals the flight width; curved half-turn stairs remain unsupported.

Optional `FloorSpec.outdoorPlatforms` stores an independent polygon and finish,
a default edge configuration, and an ordered edge record for every polygon edge.
Platform and edge IDs share the architecture identity namespace. Missing platforms
mean none in existing projects; no version migration is needed. Procedural toon
slabs and railing/low-wall barriers render at the floor's existing level. Platform
coverage participates in scene bounds, placement support, stair landing support,
walk spawn and elevated-floor boundary checks; Open removes its barrier while
retaining the elevated-floor support boundary. Barriers share their facade-aware
geometry with walk collision, so existing door apertures remain usable.

Platform footprints clip lower roofs without acquiring their own roofing. Upper coverage also clips the supporting lower wall tops, so a platform drawn to a wall centerline does not leave an exterior gable strip in front of its railing; this extension is restricted to wall solids and preserves exposed room roofs. Slabs
above enclosed rooms retain the authored ceiling underside and replace overlapping
lower ceiling slab coverage; remaining slab regions use 0.16 m thickness. Higher
floors cover their actual indoor and outdoor support footprints. Explicit low
exterior walls retain their height when another floor exists, while full-height
facades continue across the real inter-floor slab.

Stair `railings` optionally selects `both`, `left`, `right`, or `none`, relative to ascent; omission preserves both sides. Spiral stairs retain their central support and apply side selection to the outer rail and exit bridge. Upper-opening guards are clipped to actual floor/platform support outside the opening, including partial and disconnected floor regions; exterior flights never acquire floating opening guards. All stair shapes share this guard geometry.
