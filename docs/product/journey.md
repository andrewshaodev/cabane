# Startup, navigation, and setup

The browser initializes a local workspace library, adopting existing saved home
data once. On a fresh installation the furnished demo is an ordinary workspace.
Deleting it, including deleting the last workspace, does not recreate it.
Loading failures are actionable; corrupt homes offer recovery independently.

Each workspace owns its draft, published home, mappings, and HA connection.
Home renders published data; the editor reads the draft. Routes are:

| Route | Surface |
| --- | --- |
| `/` | Opens the last successfully opened workspace on this browser; falls back to the sole workspace or library |
| `/workspaces` | Library: New, Import, Open, Rename, Duplicate, Export, Delete |
| `/workspaces/:workspaceId` | Published Home; unapplied homes open Construct |
| `/workspaces/:workspaceId/home-assistant` | HA connection, cross-device storage, full workspace backups |
| `/workspaces/:workspaceId/construct` | 2D architecture editing |
| `/workspaces/:workspaceId/arrange` | Furniture and device placement |
| `/workspaces/:workspaceId/mobile-editor?mode=construct` or `?mode=arrange` | Phone editor guidance before Construct or Arrange |
| `/workspaces/:workspaceId/connect` | Resolves the initial mapping view |
| `/workspaces/:workspaceId/connect/rooms` | Room-to-area mapping |
| `/workspaces/:workspaceId/connect/devices` | Device and entity-slot mapping |

Old unscoped editor paths are not aliases. Missing workspace IDs offer a library
link. Refresh retains the workspace URL. Mode changes retain edit history within
a home. Leaving for Home, the library, or another workspace flushes the draft;
a failed save keeps the editor open. Home offers Workspaces in its three-dot
scene menu. In Construct, Arrange, Connect, and Shortcuts, the current workspace name beneath
Cabane links back to the library, using the same guarded save-on-exit flow.
In the library, the whole home card opens its workspace; its three-dot menu keeps
management actions separate. Only draft or recovery states need a status label.

OAuth return state includes the workspace ID, mapping target, selected item, and
Arrange camera. Callback identity is validated before a home's runtime opens.
The library does not mount Home Assistant connections.

A genuinely fresh installation opens the default furnished villa with a compact
welcome and two immediate choices. Explore keeps the simulated demo.
Build creates a blank workspace and opens Construct without authentication.
The scene remains visible; portrait layouts omit previews to keep actions clear.

The demo is identified by installation metadata, not its editable name or a
missing HA connection. Only it receives the isolated memory-only simulation.
Personal homes display real, unconnected or unavailable states; disconnection
never switches them to simulated data. All demo Connect routes create/resume the
Build destination in Construct. Leaving a demo editor for Connect
uses its existing draft flush guard. The demo can still be edited or deleted;
it is never silently reseeded.

The first successful simulated interaction offers a dismissible invitation to
build a personal home. Welcome and nudge dismissal are installation-wide. Existing
and migrated installations remain returning users even without older progress.
The root resumes the last opened workspace; the library remains directly accessible. Manual Getting started remains on
the demo; personal onboarding homes offer Continue setup.

Creation and the per-path destination reference are committed in the same
IndexedDB transaction. Repeated actions, refresh, and concurrent tabs resume the
same home. A deleted destination requires an explicit creation action. The
ordinary library New and Duplicate actions retain their existing semantics.

Connection uses the existing authentication, mappings and Apply. A published
mapped light opens its room with a prompt to try it. Success requires a normal
successful control command and a fresh matching state update, not just mapping
or Apply. The observer adds no commands or subscriptions and cancels on failure,
disconnection or workspace change. Build uses existing intermediate drafts,
validation, autosave, Arrange and Apply; no starter-replacement mechanism remains.

Privacy copy explains browser-local homes, mappings and sign-in material, direct
browser-to-HA communication, private backups and browser-data clearing. Source
and self-hosting navigation stays disabled until its destinations are public.

Implementation: [library host](../../apps/web/src/workspaces/WorkspaceApplication.tsx),
[workspace host](../../apps/web/src/workspaces/WorkspaceHost.tsx),
[routes](../../apps/web/src/editor-routes.ts),
[product host](../../apps/web/src/ConnectedProduct.tsx),
[routed editor](../../apps/web/src/RoutedHomeEditor.tsx),
[setup experience](../../packages/engine/src/onboarding/OnboardingExperience.tsx),
[setup progress](../../packages/engine/src/setup-progress.ts),
[demo session](../../packages/engine/src/DemoHomeAssistantSession.tsx).

[Back to product overview](../../PRODUCT_SPEC.md).

Each newly created blank home, through New workspace or Build, starts a compact
six-step tutorial: close the first room, add a door, add a window, name the room
on the plan, arrange it, and open Connect. Objectives follow the actual draft,
including out-of-order work and undo/redo. Doors and windows must belong to the
target room's boundary. Tool and mode changes are offered as explicit actions;
the tutorial never changes them automatically. Arrange has an “I’m ready” action
without a required furniture/device count. Opening Connect completes the tutorial
and hands off to the existing connection setup, without signing in automatically.

Skip step and Dismiss tutorial remain available, with Restart tutorial in the Construct sidebar’s Build tutorial disclosure. Progress, skipped steps, target room/floor, readiness, and dismissal
are stored in the optional buildTutorial field of the per-home browser setup
record, outside project history and exports. Existing homes, imports, and duplicates
do not automatically enroll. Storage failure retains progress for the session
and shows a nonblocking warning. Deleting the target room adopts another room or
returns guidance to drawing walls. The tutorial scrolls with the properties panel
on phones so the complete catalog and inspector remain accessible.

Every editor mode keeps the workspace sidebar with a consistent mode title and short task description. Contextual headings and form labels sit below that introduction. On narrow screens the sidebar becomes a scrollable bottom panel.

On phone-sized screens, entering Construct or Arrange first opens a full-screen guidance route. It offers the demo, the browser's native share sheet for `cabane.my` (with a copy-link fallback), and a choice to keep editing on mobile. Dismissing the guidance permits editor entry for the current browser session. The guidance route is directly addressable for review.

On desktop, active build tutorial guidance floats at the editor canvas’s top right,
below the toolbar; on compact screens it stays in the properties panel. The
2D/3D and Explore controls sit at the canvas’s bottom left, above the properties
panel on portrait mobile layouts.

Home Assistant settings are linked from each workspace menu, below Edit the home
in the dashboard menu, and from Connection settings in the Connect footer. Leaving
the editor for this page uses the same guarded draft flush as other exits.
