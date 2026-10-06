# Catalog and extension contracts

Stable architecture, furnishing, and device registries expose procedural model
implementations and metadata through public package subpaths. Architecture
models render supported opening families. Furnishing/device definitions declare
sizes, placement support/environment, and render components; devices additionally
declare compatible slot roles and optional live media behavior.

Model families and model-specific parts live in focused domain modules. Catalog
entries are reusable definitions; room composition and scene-item records choose
where instances appear. The owner's project uses catalog presets plus two local definitions: the fitted
kitchen and its cabinet lighting. Runtime registry
composition favors stable implementations for stable IDs.

Extensions are referenced by stable keys and resolved separately from the JSON
project. The engine still supports legacy room furnishings components, but the bundled
home registers none.
Scene-item rendering avoids drawing both declarative items and legacy room
composition for the same declarative project. Missing model definitions surface
validation/recovery issues.

A new native model should use the public engine material/geometry vocabulary, expose
only its supported entry points through a local barrel, and preserve catalog
placement and slot semantics. Do not put household HA IDs into registry entries.
The exact available models and presets are the current registry contents, not a
frozen product-spec enumeration.

Personal GLB definitions are a separate per-project data catalog. They resolve
through the engine import owner and preserve their original materials; they do
not change native registry ownership or home-local procedural generation. See
[personal models](personal-models.md) for import, device, and asset contracts.

Implementation: [catalog guide](../../packages/catalog/README.md),
[architecture registry](../../packages/catalog/src/architecture/registry.ts),
[furnishing registry](../../packages/catalog/src/furnishing/registry.tsx),
[device registry](../../packages/catalog/src/device/registry.ts),
[registry resolution](../../packages/engine/src/devices.ts),
[home extensions](../../home/src/extensions/index.ts).

[Back to product overview](../../PRODUCT_SPEC.md).

Retired furnishing lights remain registered with `legacyOnly` for saved-project
compatibility. Arrange offers their current device replacements for new items.

The deciduous tree uses a layered, irregular procedural crown with a graduated
green palette and curved, tapered wood branches and root flares. Wood and foliage
are merged into two meshes and use the engine toon material. The complete model
is fitted to its existing 2.4 × 4.2 × 2.4 m catalog bounds before item scaling.

The olive tree uses grouped sprays of softly rounded silver-green leaves,
sparse oval fruit, and sculpted toon-shaded wood. Its open foliage uses fewer,
larger leaves with shallow curvature and smooth normals rather than sharp folds,
solid canopy ellipsoids, or dense fine-detail shoots. Its spreading
bough layout, twisted trunk, root flare, and existing catalog bounds are retained.

Furniture and device descriptors share ordered `variants` metadata (`id`, `label`),
with an implicit single `default` choice when omitted. The first choice is the
backward-compatible default. Rendering receives the resolved variant ID; all
variants share the declared envelope, resize policy, and binding capabilities.
A variant may declare `sceneLight: false` to suppress a physical light source.
The pergola device offers String lights and Plain; its former plain furnishing
entry remains read-compatible but is hidden from new-item browsing. The sectional
sofa offers Classic and Cozy, which adds terracotta and beige throw cushions,
with left- and right-chaise variants for each style (as viewed from the front).
The existing `default` and `cozy` IDs retain the left chaise. The `right` and
`cozy-right` variants mirror the entire sofa within the same bounds. Arrange's
Variant selector changes handedness without changing item size or placement.

Reusable models formerly registered by the owner home now live in catalog
presets, including the cabin bed, changing table, cube storage, mirrors, shower
assembly, and living-room models. Geometry already present in the catalog is
registered directly, never copied. Generic duplicate cribs, rugs, wardrobes,
beds, stools, and pendants resolve to existing presets. Obsolete owner-home aliases and room renderers are removed; the bundled item
data references canonical IDs. Imports with removed model IDs use ordinary
missing-model validation and recovery.

Door presets are public architecture catalog configuration records. Hinged,
sliding, and roll-up designs share the wall-owned door family, with motion-specific
fields enforced by the canonical types and schema. The garage door is a roll-up
architectural model, not an Arrange device. Its frame and moving slats are focused
model modules. Opening previews use the same geometry and cached rendering queue
as Arrange. The bundled garage uses an opening and an opening cover profile;
there is no compatibility registration for the retired garage device.

Framed hinged doors fit the jamb aperture and keep sweep clearance. Concealed and flush door variants support an explicit finish plane and optional bounded front overlap. Arched steel-glass door and window variants share procedural glazing.

The `single-window-curtain` furnishing preset covers one window with its own
track and a single gathered panel. Arrange → Living room → Decor offers Gathered
left and Gathered right variants, as viewed from the room. Each instance has
independent width (track length), height (drop), depth, and elevation controls.
Fit to window aligns one window; adding another prefers an unoccupied window.
The inferred default envelope is 120 × 240 × 12 cm; the panel drops 232 cm
below its track. Existing paired and motorized curtains remain unchanged.

Curtain presets (single-window, children's paired, and motorized), the 3-seat
sofa, and the sectional sofa offer a Fabric color picker and Reset color in
Arrange Details. A six-digit hex `color` override is optional item data and
survives undo/redo, duplication, Apply, and project import/export. Omission
preserves each model's original multi-tone palette. Overrides recolor fabric;
tracks, wood, motor housings, and decorative throw cushions retain their finishes.
Only descriptors declaring `defaultColor` offer this control.
