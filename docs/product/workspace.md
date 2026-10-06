# Workspaces, persistence, and Apply

`HomeProject` V2 is pure JSON: schema version, seed revision, home identity and
palette, shared coordinates, ordered floors, straight/L-shaped/spiral stairs, scene items, room/opening profiles, legacy shortcuts, optional action-bar configuration, and
assumptions. Layout rooms carry empty device/dashboard arrays; runtime bindings
are composed from profiles and scene items. The layout project accepts flat
ceilings; the broader runtime manifest also supports sloped ceilings.

Scene items refer to registered models by ID, carry an explicit floor ID and size, an optional `variant` ID, and use
absolute, wall-relative, or ceiling-relative placement. Device items declare
typed entity slots with exactly one primary role. No React components or HA
credentials belong in this serialized project. Runtime manifest composition
resolves registered implementations separately. Omitted variants resolve to the model's
first choice (or `default` for models without explicit choices); unknown variant
IDs produce actionable validation errors.

A stored record contains draft and published projects, timestamps, revision, and
origin-keyed draft/published binding slices with manual-mapping exclusions.
An optional Cabane custom integration can hold a versioned copy of this full
private workspace on the connected Home Assistant instance. Manual Save to HA
and Restore from HA work with sync disabled. Enable sync uploads and enables per-workspace synchronization in one explicit action; local IndexedDB saves remain immediate and
offline edits remain local until HA reconnects. Remote version checks stop
concurrent browsers from silently overwriting each other. All signed-in HA
users share the instance's Cabane library. Browser deletion leaves the HA copy;
remote deletion is a separate confirmed action. Installation and the integration source are maintained in
[the dedicated repository](https://github.com/cabane-app/cabane-home-assistant).
Storage controls live on the workspace-specific Home Assistant page. The library
shows saved/sync indicators on ordinary workspace cards; Open from Home Assistant is a direct library action (the legacy Import → From Home Assistant route remains supported). Opening a saved home restores its exact identity and enables sync, while divergent local copies require explicit review. There is no separate HA library section.
IndexedDB uses the `cabane-projects-v2` database with project records, workspace
metadata, and persistent initialization state. Metadata contains the name, HA
origin, creation time, and applied status. Related writes share a transaction. The
repository handles parsing, migration, revision conflicts, and recovery; the
lifecycle determines what autosave and Apply may publish.

Autosave preserves schema-valid intermediate drafts. Geometry or semantic issues
can remain visible while editing. Workspace history spans construction,
arrangement, and connections; pending gestures are settled before committing.
Shortcuts is an editor tab beside Construct, Arrange, and Connect. It keeps the workspace sidebar with guidance for adding, editing, and applying shortcuts, and displays
the draft action bar with the same slot visuals and overflow as Home. Hovering, focusing,
or selecting a slot exposes actions to add a built-in action, room, modeled device, HA scene, or HA script;
filled slots can also be replaced, moved, or removed. A searchable grid fills the canvas
for each choice. Room icons use the mapped Home Assistant photo when available, then
initials; device icons use cached procedural previews. These edits use the same history and autosave as other
draft changes. Missing room or device targets are shown in the panel and block Apply
until repaired. The published Home bar changes only after Apply. Portable exports,
imports, and workspace duplication preserve the ordered per-home configuration;
private HA entity IDs are never part of an action-bar target. Scene/script targets
contain only their kind; `RuntimeBindingProfile.actionEntityIdsByShortcutId` maps
the stable shortcut ID to an exact entity in each origin's private draft/published
profile. Project edits and mapping edits share one history transaction. Removing
or replacing a shortcut prunes incompatible draft mappings, leaving published
mappings intact until Save. Existing profiles without this optional map remain valid.
Automatic room/device matching preserves these explicitly chosen mappings.
Private backups, duplication and HA workspace sync carry the private map; portable
exports carry unmapped action placeholders which owners can replace in Shortcuts.
Offline or missing action targets remain saved, with unavailable controls rather
than blocking unrelated project publication.
Undo does not rewind already published content. Leaving the editor flushes the draft;
it does not implicitly Apply. Apply validates the project and binding slices,
blocks errors, requires warning confirmation, and writes the new published
project and mappings together. A failed write leaves the previous Home intact.

The library creates blank homes and imports files as new independent identities.
Duplicate copies draft and published data, mappings, and the configured connection;
only home identity changes, retaining room/device IDs. Rename changes both stored
project names without applying draft geometry. Delete requires confirmation and
removes the record and metadata atomically. Revision checks prevent stale tabs
from overwriting changes or recreating a deleted workspace.

Recovery can download rejected raw data, reset to an empty home, or remove items
whose models are unavailable. Recovery compares the exact rejected record.
Portable exports omit private bindings and connection settings. Versioned private
backups include both project slices, mappings, and configured server, never
credentials. Library imports allocate a new home ID; portable imports start
unapplied, while private backups retain their draft/published boundary. Existing
portable and bare private files remain supported transfer formats. Editor imports
explicitly target the current draft and require Apply before affecting Home.

Onboarding records an explicit seeded-demo identity and welcome/nudge dismissal
in the existing workspace-state store. Existing initialized stores without that
state are conservatively treated as returning users. Each of the Connect and
Build paths has a persistent destination ID. Creation and the destination write
share the project/metadata/state transaction; concurrent entries resume one home.
Deleted destinations are not recreated without an explicit user action.

Onboarding Connect creates a clean copy from the demo's published slice. It does
not copy draft edits, bindings or the HA origin. Ordinary Duplicate still copies
those private settings by design. The designated demo cannot be assigned a real
HA origin; connection entry creates/resumes a personal workspace instead.

One-time browser adoption is isolated in `migrate-single-home-storage.ts`.
Current-store initialization is permanent; conversion and retired key readers
are scheduled for removal after the owner confirms their existing data survived
rollout. There is no steady-state dual-write migration contract.

Implementation: [workspace repository](../../packages/engine/src/home-project/workspace-repository.ts),
[initialization](../../apps/web/src/workspaces/initialize-workspaces.ts),
[workspace transfer](../../apps/web/src/workspaces/workspace-transfer.ts),
[project types](../../packages/engine/src/home-project/types.ts),
[schema](../../packages/engine/src/home-project/schema.ts),
[repository](../../packages/engine/src/home-project/repository.ts),
[lifecycle](../../packages/engine/src/home-project/lifecycle.ts),
[workspace hook](../../apps/web/src/editor-preview/useEditorWorkspace.ts),
[transfer](../../apps/web/src/editor-connect/profile-transfer.ts).

[Back to product overview](../../PRODUCT_SPEC.md).

V1 projects and browser records migrate to V2 while retaining IDs and bindings.
Empty upper floors are recoverable drafts and block Apply until valid.

Workspace cards show a browser-local cached 3D overview after the dashboard has
rendered. Previews refresh while viewing the overview, exclude dashboard UI and
camera media, and are optional when storage is unavailable. Deleting a workspace
clears its preview and last-opened preference. These caches are not exported.

An unnamed room is accepted by draft schema parsing and can autosave/reload while
its owner is still constructing the home. Full layout validation requires a
nonempty room name for Apply. This does not change the HomeProject wire format.
The optional per-home build tutorial is browser setup data, excluded from project
exports, workspace duplication, and undo history.

The editor separates Back navigation on the left from Reset and primary Save
actions on the right. Save validates and
atomically publishes the draft, closes the editor, and opens Home. Back returns to
Home and preserves draft edits; it is disabled until the first successful Save.
Reset asks for confirmation, restores the published project and connection
bindings, and clears draft undo history. Before the first Save it restores the
initial unpublished baseline. Reset is disabled when the draft matches that baseline.

Reference plans are browser-only editor assets in the separate
`cabane-reference-plans-v1` IndexedDB database. Image blobs are keyed by home and
asset ID; per-floor records contain placement and image dimensions, with separate
visibility/opacity preferences. Session history retains only metadata and asset
IDs, never blob copies. Reference-only edits do not dirty or autosave the home
project, trigger HA sync, or enter portable exports/private backups.

Removing a floor hides its reference while session undo can restore it. Reset
retains references for surviving floors; clearing history or leaving the editor
cleans unused assets. Deleting a workspace removes its reference records and
blobs. Duplicated and imported homes begin without references. Failed local writes
retain in-memory changes and allow Retry; a rejected image replacement leaves the
previous reference intact.

Availability is independent of device connection. Cards use cached storage state
and label enabled sync without claiming remote freshness. The open workspace
reports verified Synced with HA, Changes pending, Sync interrupted, or Sync needs
attention. Manual save/load and remote deletion remain under Manage saved copy.
Opening remote copies checks both the requested home ID and authenticated HA
origin; corrupt or divergent browser records cannot be silently overwritten.

Stair intersections and unsupported landings are warning-only project diagnostics.
Warnings retain their severity through validation, draft reload, import/export, and
Save review; only errors make a project invalid. Existing stair JSON and IDs are
unchanged, and no data migration is required.

Outdoor platforms and their edge IDs/configurations belong to each floor's project
slice. Schema-shaped intermediate polygon errors can autosave and reload; geometry
validation blocks Save until repaired. Portable exports, imports, project
history, duplication and Apply retain platform finishes and per-edge overrides.

Basement floors persist optional `belowGround: true` in the existing V2 floor records.
They must form a contiguous prefix with at least one non-basement (ground) floor.
Omitted classification preserves existing projects. Import/export, drafts, and
undo/redo retain this flag; derived negative preview elevations are not persisted.

Optional `toolState` is namespaced pure JSON in each home project. Tool packages own
its versioned contents and validation; the engine only exposes the injected
`WalkToolStorage` interface. Live tool changes save to both draft and published
slices through the existing revision-checked repository, preserving unrelated
draft edits. They survive reload, duplication, portable exports and private
backups, and use the same workspace sync path. No separate browser store is used.

Optional `home.northAngleDegrees` is finite and in [0, 360), measured clockwise
from plan up. Omission means zero for existing V1/V2 projects; no migration or
architecture rotation is needed. All floors share it.

Walls may persist an optional `edgeColor` CSS color for caps and opening reveals.
An absent value is Auto; returning to Auto removes the override from exported
JSON. Existing projects need no migration. Draft conversion, topology edits,
undo/redo and import/export preserve explicit overrides.
