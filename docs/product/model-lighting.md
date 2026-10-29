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

Choose in preview selects glowing surfaces directly and highlights the surface
under the cursor. Click again to remove glow; existing named GLB material
selections can also be removed this way or in Surface list. Up to sixteen
surfaces/materials may glow. Show handles hides editor markers and gizmos without
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

Native selections use `surface:key:<key>` in the existing `emissiveSurfaces` list.
A unique mesh name identifies a part; repeated names use an explicit
`userData.modelGlowKey` (`glowKey` on RoundedFurniturePanel). Keep these keys when
changing variants, state geometry or internal wrappers, and never reuse a key for
a different part. Unnamed, duplicate or multi-material native parts cannot be
selected. Absent targets and old native ordinals stay saved but inactive, with
removal/reselection in Surface list. Immutable personal GLBs retain their existing
ordinal and named-material behavior. The sixteen-total rule is unchanged. Older
panels must update before reading keyed native selections.

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
