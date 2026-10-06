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
and Restore from HA work with sync disabled. Sync is enabled per workspace only
after an explicit first upload; local IndexedDB saves remain immediate and
offline edits remain local until HA reconnects. Remote version checks stop
concurrent browsers from silently overwriting each other. All signed-in HA
users share the instance's Cabane library. Browser deletion leaves the HA copy;
remote deletion is a separate confirmed action. Installation and the integration source are maintained in
[the dedicated repository](https://github.com/cabane-app/cabane-home-assistant).
Storage controls live on the workspace-specific Home Assistant page. The library
shows saved/sync indicators on ordinary workspace cards; remote import is available
through Import → From Home Assistant. There is no separate HA library section.
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
or selecting a slot exposes actions to add a built-in action, room, or modeled device;
filled slots can also be replaced, moved, or removed. A searchable grid fills the canvas
for each choice. Room icons use the mapped Home Assistant photo when available, then
initials; device icons use cached procedural previews. These edits use the same history and autosave as other
draft changes. Missing room or device targets are shown in the panel and block Apply
until repaired. The published Home bar changes only after Apply. Portable exports,
imports, and workspace duplication preserve the ordered per-home configuration;
private HA entity IDs are never part of an action-bar target.
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
