# Cabane catalog contract

These paths are relative to the Cabane repository root. Inspect the current
exports and types; do not copy historical inventory totals or assume this
reference supersedes a changed repository contract.

## Integration map

| Concern                                   | Current source                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| Public furnishing exports                 | `packages/catalog/src/furnishing/index.ts` → `presets/index.ts` → domain barrels |
| Stable furnishing registry                | `packages/catalog/src/furnishing/registry.tsx`                                   |
| Public device exports and registry        | `packages/catalog/src/device/index.ts`, `registry.ts`                            |
| Scene/model props and editor descriptors  | `packages/engine/src/types.ts`                                                   |
| Owner's effective furnishing registry     | `home/src/project-runtime.ts` merges the stable registry with local models       |
| Arrange entries and room/search filtering | `apps/web/src/editor-preview/furnish/catalog/catalog.ts`                         |
| Arrange preview props                     | `apps/web/src/editor-preview/furnish/catalog/ModelVisual.tsx`                    |
| Add-item identity and default size        | `apps/web/src/editor-preview/furnish/placement/item-creation.ts`                 |
| Geometry and inventory regression tests   | `tests/owner-home-project.test.mjs`                                              |
| User/agent-facing dimensions and usage    | `packages/catalog/README.md`                                                     |

The effective registry already makes newly registered furnishings available in
Arrange. Check that bridge; ordinary additions do not require editing the home
registry or app UI. Public exports also let equip-room compose a model directly
or reference its `modelId` in a declarative furnishing item.

## Dimensions, origin, and shape

- Code uses `[width, height, depth]` in **metres**. Product descriptions often use
  width × depth × height; normalize deliberately.
- For new freestanding furniture, use a floor-contact origin at Y=0, with a
  footprint centered on X/Z and the front facing +Z. Preserve the established
  origin when revising a model. Wall/ceiling models use their actual support
  convention, not an assumed floor origin.
- `defaultSize` is the full solid envelope. A 90 × 200 cm mattress may need a
  100 × 210 cm bed frame; expose and document the latter as placement size while
  retaining the exact mattress dimensions internally. Include all protrusions.
- New furnishing components can accept an optional `size: SceneItemSize`, default
  it to an exported size constant, and scale their root group from that nominal
  size. They must also work with the registry's `SceneModelProps`.
- `RoundedFurniturePanel` and `FourLegOakTable`, under
  `furnishing/presets/construction`, are existing reusable construction examples.
  The panel has actual rounded geometry and a restrained 1.5 mm outline. Avoid
  adding a `radius` prop to a plain box and claiming that it rounds the geometry.
- Freestanding solid furniture uses `userData={{ walkCollider: true }}` on its
  semantic root. Do not apply a whole-group obstacle to a suspended or passable
  object without checking the existing collision semantics.
- Measure rotated child geometry in the complete scene graph. A curved back or
  five-spoke base does not necessarily fill its nominal box. Resolve meaningful
  discrepancies in construction or dimensions; do not pad bounds just to hide
  a misplaced part.
- Floor-contact parts should not gain an outline extending through the floor.
  Use `outlineContact` to declare outward outline contact behavior; `Box3` only
  measures geometry and cannot see outline expansion performed by a shader.

## Cel-shaded modeling and outlines

Build a readable silhouette first, connected structural forms second, and fine
surface detail last. At room scale, proportions and construction should carry
the object's identity without relying on dense decorative linework.

- Keep the engine's public `ToonMaterial` and its shared stepped gradient.
  Shape the light with real softened edges, tapered supports, and continuous
  curves. Use enough subdivisions to maintain the silhouette without spending
  geometry on invisible detail. Do not fake bevels with drawn edges or add
  model-specific lighting/shading pipelines.
- Use thin, subdued outlines that complement the surface color: a darker brown
  for timber, for example, rather than heavy black borders on every material.
  For model shells, start with explicit `thickness={0.0015}` and
  `screenspace={false}`, then adapt to the object's scale and rendering context.
  Keep line weight consistent across related structural parts; outlines should
  clarify form without visually thickening slender supports or closing gaps.
- Outline major forms selectively. Leave small repeated surface details such as
  weave, grain strokes, fluting, stems, and foliage without individual mesh
  outlines. Let restrained color differences and geometry describe them. Do not ring every
  strand, rib, or decorative part with an outline; keep detail subordinate to
  the silhouette and avoid dark seams at touching construction members.
- Make material detail directional and sparse: grain follows the timber,
  weaving follows its construction, and ribs follow the surface. Use a small
  family of related tones so detail reads as one material at a distance.
- Preserve continuous curves and intentional joins rather than assembling a
  visibly segmented approximation. Batch repeated same-material geometry where
  appropriate. Merging geometry is not a
  boolean union and does not by itself remove intersections or outline seams.
- Respect the active rendering path. Public `Outlines` suppresses model shells
  under the engine's `SceneContourContext`, where scene depth contours provide
  the visible lines. Keep using the public wrapper; do not bypass it with Drei
  outlines, duplicate edge passes, or change global contour settings to style
  one preset. Check current `rendering.tsx` and `SceneOutlines.tsx` before
  interpreting thickness/screen-space units: the settings above
  are not proof of a physical 1.5 mm expansion in every rendering path.

During the normal code review, check outline color, explicit thickness, which
parts receive outlines, and whether fine detail remains quiet. Numeric bounds
checks cannot certify the rendered line weight. When visual review is requested,
check readability at room distance and inspect contours, joins, and fine detail
close up in the intended rendering context. Look for heavy borders, dark contact
seams, lost gaps, and noisy repeated details. This guidance does not introduce a
mandatory browser or visual approval gate.

## Registry entries

Each furnishing entry needs:

- a unique stable kebab-case ID and its component;
- an English label, category, and valid `defaultRoomType`;
- `defaultSize`, complete `bounds.min/max`, and a resize policy;
- allowed placements and `outlineContact`; and
- credible complexity limits for solid visible meshes and triangles, excluding
  the engine's outline render pass.

Use `defineFurnishingModel` and retain the registry's existing null-prototype
construction. In this catalog, each `bounds.max - bounds.min` axis agrees with
`defaultSize`, and rendered extents are checked within 1 mm.

Choose resize policy from the object, not convenience: `fixed` for an exact
product/standard-size preset, `uniform` for proportional scaling, `planar` for
width/depth adjustment with fixed height, or `axes` for explicitly supported
independent dimensions. Ensure the geometry honors that choice. A room type is
its default browsing category, not a placement restriction.

Complexity limits may be rounded modestly above measured counts, but do not
conceal accidental geometry density with inflated budgets. Reduce bevel or
curve subdivisions before adding ornamental detail invisible at room scale.
The numeric helper measures solid toon meshes; it does not certify visual
quality or performance at the representative whole-home scale.

## Only when building a smart-device preset

Follow an existing device in the same family and the current
`DeviceModelDefinition`/`HomeDeviceModelProps` contract. Its props differ from
furnishing `SceneModelProps`; do not blindly reuse a furnishing adapter.

- Register supported domains/classes, interaction behavior, preferred placement, physical
  bounds, default size, resizing, and complexity. Preserve disconnected and
  unavailable rendering. `preferredPlacement` chooses the initial support;
  instances can use any placement kind and snap to walls by default.
  `mountKind` is only a legacy rendering hint.
- Check the engine's stable device ID list/type and the device registry exports;
  a genuinely new stable device ID must be represented consistently there.
- Add typed runtime behavior only for capabilities requested and already
  supported by the engine. Do not infer a new integration from a product photo.
  If it needs a new runtime capability, surface that scope before implementing it.
- Never access Home Assistant, embed household IDs, or call device services to
  author a preset. Registry capabilities are reusable; household slots belong
  to placement/runtime setup.
- Use `tests/catalog-device.test.mjs` and relevant Arrange tests. The bundled
  `inspect-furnishings.mjs` helper handles furnishing definitions only.
