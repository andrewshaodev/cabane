# Model lighting

Arrange → Properties → **Lighting** opens the same visual editor for personal
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

Enable lighting, choose Point lights or LED strip, then select a point or endpoint
and click the model to position it. Fit along model spans the longest model axis.
Precise position exposes numeric coordinates using the ordinary length inputs.
A strip chooses two to eight samples automatically from its length; total
brightness is distributed across its samples. Trying another source type retains
the preceding layout until the editor closes. Up to eight points are supported.

The active source is marked Editing, with a matching preview marker and crosshair
cursor. Select it again to finish positioning and return to orbiting.

Choose in preview selects glowing surfaces directly, highlights the surface under
the cursor, and uses a crosshair while choosing. Click again to remove glow;
existing named GLB material selections can also be removed this way. Up to sixteen
surfaces/materials may glow.
Disabling Illuminate surroundings retains surface glow and source settings.
Default color, total brightness and range configure the scene. Connected light
entities supply their actual brightness and color; switches use on/off plus the
configured defaults. Preview brightness simulates state locally, including off at
0%, without operating Home Assistant devices.

## Connections and persistence

Existing primary light slots retain their identity and mappings. Other objects
receive an optional, independent Lighting relationship in Connect. All points,
strip samples and glowing surfaces on one copy follow this single relationship.
The original object's controls and readings remain independent. Duplicating an
item allocates fresh lighting identities. Deletion or disabling lighting removes
only the affected draft mappings; published mappings retain their own snapshot.

Saving records settings, any new relationships and mapping cleanup together in
one undo step. Cancel before saving leaves the workspace untouched. A storage
failure preserves the preceding stored record and retains the in-memory draft
with explicit retry/Undo guidance. Missing GLB assets block saving. Settings and
relationships survive ordinary autosave, Apply, export/import and HA workspace
synchronization through the existing project contract.

Source positions follow each copy's orientation and dimensions. Custom-model
normalization corrections transform the authored sources with the geometry.
Materials are controlled per instance; shared original materials, geometry and
textures are not mutated or disposed by the lighting controller. Built-in model
implementations remain catalog-owned.

Configured custom/overridden models share a budget of 32 physical points on the
active floor, allocated in scene order independently of on/off state. The editor
and project diagnostics expose overflow; selected surface glow remains available.
Original built-in lighting keeps its existing behavior until customized. Off,
unavailable and stale sources retain zero-intensity emitters to avoid rebuilding
shader layouts. Strips approximate line illumination with point sources; they do
not add area-light shadows or bloom.

Implementation: [shared editor](../../apps/web/src/model-lighting/ModelLightingEditor.tsx),
[dialog](../../apps/web/src/model-lighting/ModelLightingDialog.tsx),
[lighting owner](../../packages/engine/src/model-lighting),
[scene illumination](../../packages/engine/src/HomeAssistantSceneLighting.tsx).
