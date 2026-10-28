# Model lighting

Arrange → Properties → **Lighting** opens the shared visual editor for personal
GLBs and built-in models. Personal import and Edit model expose the same controls
in their Lighting section. Lighting is independent of a model's device profile:
furniture stays furniture and existing TV, sensor and other controls are retained.

A model has one lighting setup per home. Every placed copy uses that setup, with
its own Home Assistant connection. The dialog names the model, explains the scope,
and shows the number of affected copies on Save. Native settings override only
this home's catalog defaults; Reset to default removes that override. Personal
settings stay in their model definition and travel in model packs. No household
entity IDs enter these declarations.

## Authoring

Add points and LED strips to the same source list. There is no per-model point
limit or per-floor cutoff. Duplicate source makes an offset copy, useful for
repeated shelves. Each strip has its own start, end and sample count. Fit along
model spans the longest model axis without replacing the chosen count. Suggest
sample count estimates a count from its length; moving endpoints preserves it.
Total brightness is shared equally between logical sources, then between the
samples of each strip. Increasing samples smooths coverage without increasing
that strip's total brightness.

The dialog uses the available screen width. The preview supports Arrange-style
pan, orbit and zoom to cursor, plus 3D, Top, Front, Side, Fit and Focus source.
The inspector scrolls independently on desktop and stacks below the preview on
small screens. Night preview and preview brightness simulate illumination
locally, including off at 0%, without operating Home Assistant devices.

Select a source or preview marker, then drag its move gizmo. Strips expose separate
Start and End positions and a Rotate strip gizmo that preserves their midpoint,
length and sample count. Place on model enters surface placement explicitly;
camera drags do not place sources. Pick through glass, enabled initially, skips
transparent and transmitting materials. Turn it off to select the glass itself.
Visible X/Y/Z fields and step buttons support 1 mm, 1 cm and 10 cm movements.
Focus the preview and use arrow keys for X/Z, Page Up/Down for Y, and Shift for
ten times the selected step. Length fields use the ordinary measurement inputs.

Choose in preview selects supported glowing surfaces directly and highlights the
surface under the cursor. Click again to remove glow; existing named GLB material
groups can also be removed this way or in Surface list. Up to sixteen saved
targets, including historical selections, may be retained in total. Preview
variant changes only the displayed model. Targets absent from that variant or
device state remain saved and are reported in Surface list. Show handles hides editor markers and gizmos without
changing saved lighting. Disabling Illuminate surroundings retains surface glow
and source settings. Default color, total brightness and range configure the
scene. Connected light entities supply their actual brightness and color;
switches use on/off plus the configured defaults.

## Connections and persistence

Existing primary light slots retain their identity and mappings. Other objects
receive an optional, independent Lighting relationship in Connect. All points,
strip samples and glowing surfaces on one copy follow this single relationship.
The original object's controls and readings remain independent. Duplication
creates a fresh relationship; removing lighting clears only its draft mapping.
Save, Undo, autosave, publication and HA workspace synchronization retain settings
and stable identities together.

Explicit source lists contain point and strip declarations in normalized support
space. Legacy single-point, multiple-point and single-strip declarations remain
readable without migration. Editing source layouts writes the explicit form.
Normalization, instance resizing and rotation transform every source and strip
endpoint consistently. Older clients reject unsupported fields rather than
stripping them.

## Rendering

Selected surfaces use instance-owned materials; geometry and texture resources
stay shared. Original built-in model glow implementations remain catalog-owned.

### Glow identities and compatibility

New selections use `light.glowTargets`. Native targets are
`native:1:<authored-key>` within the model definition. Meshes opt in through
`userData.modelGlowKey`: one string for a single material, or an array of explicit
material-role keys for a material array. Keys identify logical parts across
variants and device states. They must never be reused for a different part.
Display names, mesh order, transforms and wrapper groups are not identities.
Duplicate keys, geometry without keys, and non-emissive materials are unavailable
for selection, with an explanation in Surface list. Invisible parts retain their
keys but cannot be picked. Outline and `modelGlowIgnore` subtrees are excluded.
The bench, tabletop TV and countertop microwave supply authored keys; other
native geometry opts in as its model author declares stable parts.

The verified GLB loader stamps targets as
`glb:1:<asset-sha256>:<source-node>:<primitive>:<material-slot>`, using loader
associations with immutable source indices. Names and wrapper groups do not
participate. Normalization, copied instances and model-pack transfer retain these
targets. A different asset cannot resolve them.

Historical `emissiveSurfaces` ordinals remain readable and round-trip unchanged,
but are inactive for both native and imported models. The original model revision
and logical part were not saved, so automatic remapping cannot prove the intended
surface. Surface list explains that the selection needs review and allows its
removal and explicit reselection. Legacy `emissiveMaterials` retain their original
exact-name group meaning only inside immutable GLBs, including multiple surfaces
with the same material name. Native named selections and missing or unsupported
GLB groups are inactive and reviewable. No historical reference is silently
converted or assigned to a new part.

`modelLightingSurfaces`, `modelLightingSurfaceAt`, `resolveModelGlowTargets` and
`toggleModelGlowTarget` are the shared engine seam for a model editor. Runtime
materials consume the same resolution and return unresolved targets. Editors
should preserve unresolved declarations until the user removes or replaces them.
Older clients reject the new field through the unsupported-format recovery path;
the matching frontend and HA panel are required. Assets, private bindings and the
HomeProject version do not migrate.

Customized and imported sources use a pool of unshadowed point lights. Only
positive-intensity sources take active slots. The pool grows to the largest
simultaneously active source count seen on the floor, with no 32-light cutoff.
Turning sources off retains zero-intensity slots for reuse, so subsequent toggles
within that capacity do not recompile shaders. More simultaneously active sources
increase GPU work; this is not an unlimited performance guarantee.

Strips approximate line illumination with samples and light both native toon and
imported PBR materials. Surface glow changes appearance and does not illuminate
receivers by itself. True rectangular area emission, area shadows and bloom are
not implemented. Three.js RectAreaLight does not support native toon materials.

Implementation: [shared editor](../../apps/web/src/model-lighting/ModelLightingEditor.tsx),
[dialog](../../apps/web/src/model-lighting/ModelLightingDialog.tsx),
[lighting owner](../../packages/engine/src/model-lighting),
[scene illumination](../../packages/engine/src/HomeAssistantSceneLighting.tsx),
[active light pool](../../packages/engine/src/SceneLightPool.tsx).
