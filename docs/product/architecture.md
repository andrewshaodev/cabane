# Architecture and ownership

Cabane is a client-side React/Three.js application in an npm workspace. The web
application owns routing and browser workspace coordination; the engine owns
schemas, validation, scene behavior, persistence, and Home Assistant integration.
The catalog supplies procedural model definitions. The home package supplies the
bundled owner's project and model extensions.

| Package               | Implemented responsibility                                                       |
| --------------------- | -------------------------------------------------------------------------------- |
| `apps/web`            | Workspace library and host, routes, Construct/Arrange/Connect, editor chrome     |
| `packages/engine`     | Public contracts, project lifecycle, geometry, rendering, dashboards, HA runtime |
| `packages/catalog`    | Stable architecture, furnishing, and device registries                           |
| `packages/walk-laser` | Optional, lazy-loaded first-person laser experiment                              |
| `home`                | Portable project data and two code-defined kitchen extensions                    |

Consumers outside the engine use its public exports. Catalog access uses the
`architecture`, `furnishing`, and `device` package subpaths. Stable model IDs take
precedence over owner replacements where registries are composed.

The bundled home is already furnished. Its `layout.json`, `items.json`, and
`project.json` are authoring slices of the same serializable `HomeProject` used by
portable import/export. `home/src/project.ts` assembles and parses them
without a home-specific conversion layer. They initialize the demo workspace
once. New workspaces use an empty project. Browser edits never rewrite the seed;
the demo remains editable and deletable like any home. Only the fitted kitchen
and its cabinet lighting require home-local model implementations.

The workspace host loads one home and keys its runtime/editor subtree by home ID.
Project composition uses installed registries without injecting demo shortcuts
into other homes. Browser edits update a browser workspace. They do not rewrite the checked-in
home package. Generated home changes and product development have different
ownership boundaries; see [generation](generation.md).

Implementation: [web startup](../../apps/web/src/main.tsx),
[project composition](../../apps/web/src/project-runtime.ts),
[owner project](../../home/src/project.ts),
[owner registries](../../home/src/index.ts),
[public engine API](../../packages/engine/src/index.ts),
[import boundary check](../../scripts/verify-import-boundaries.mjs).

[Back to product overview](../../PRODUCT_SPEC.md).

For shortcut work, route editor changes through
`apps/web/src/editor-action-bar/ActionBarEditor.tsx` and the atomic workspace
callback in `editor-workspace/useEditorProjectHistory.ts`. The engine's
`action-bar/` directory owns portable targets, HA action resolution and command
feedback. `runtime-binding-profile.ts` and `home-project/workspace-bindings.ts`
own the private scene/script mapping contract; the dashboard composes resolved
labels and availability into the shared `SceneActionBar`.
Optional walk tools are installed by the web host through `CabaneDashboard.walkTools`.
The engine exposes `WalkToolDefinition`, `WalkToolProps`, and `raycastWalkScene` at
its public root. A definition supplies an ID, label, icon, and scene module; its
injected `activateTarget` accepts a modeled target and returns user-facing success
or unavailable feedback. Runtime entity resolution and authorization remain in
the engine. Tools receive no HA client, credentials, or household entity IDs.

`packages/walk-laser` is an optional experiment, installed only in
`apps/web/src/walk-tools.ts`. Its scene, model, effects, input, and CSS load when
first equipped. Equipping prepares and retains the weapon and shot-effect shader
programs, including the host’s offscreen render variant, before trigger input.
The engine, catalog, and home never import it. Removing that
registration and dependency removes the feature; stored `walk-tool` shortcuts
remain readable and render as unavailable. The generic shortcut schema retains
unknown tool IDs to preserve portable projects between hosts with different tools.

Walk tools also receive `WalkToolNavigation`, a generic injected relocation
interface. `resolveLanding` finds a clear supported floor near a world-space feet
position; `teleport` revalidates that landing and updates the authoritative walker,
camera, selected floor and room, resetting velocity and jump state. The controller's
adapter lives in `walk-tools/useWalkToolNavigation.ts`; support/collision resolution
lives in `navigation/walk-landing.ts`. Its optional terrain-support query reads the
existing ground mesh (including pool/stair cutouts) to admit clear outdoor exits
on the ground storey; ordinary spawn defaults are unchanged. Portal placement, pairing, traversal, input,
and rendering remain private to `walk-laser/src/portals/`. Live destination views
use package-private camera transforms, exit clipping, and bounded scene captures
with the existing renderer and scene supplied by the canvas. No portal rendering
contract or dependency is added to the engine, catalog, or home.

The first gun equip shows a compact introduction styled like the editor tutorial.
It explains device toggling and paired portal shortcuts with mouse or touch controls.
Users dismiss it with Got it (or Enter while the pointer is captured); dismissal
stays in browser-local storage, with a session fallback if storage is unavailable.

Gun targeting supports lights, fans, AC climate modes, televisions/media players,
and sprinkler switches or valves. One unambiguous, available binding is required;
explicit slot targets remain scoped to that slot. Shots switch power on/off or
open/close valves through the existing guarded runtime commands.

## Engine UI styles

`@cabane/engine/styles.css` is the single public stylesheet used by both the web
app and the Home Assistant panel. Its ordered imports load global tokens, base
rules, accessibility and animation defaults from `packages/engine/src/styles/`,
and feature styles beside their owning React components. Keep the entry point's
import order explicit: it preserves the existing cascade across component rules
and layout overrides, independently of React mounting order.

Room controls and device fields own their styles in `home-assistant-dashboard/`;
status badges and overlays live in `room-status/`, scene actions in `action-bar/`,
and mapping controls in `home-assistant-mapping/`. Root-level components retain
adjacent stylesheets, including `camera-viewer.css` and `walk-preferences.css`.
The `dashboard-*-layout.css` and `dashboard-compact-chrome.css` files beside
`CabaneDashboard.tsx` coordinate multiple surfaces at existing breakpoints.
`room-navigation/room-navigation.css` owns the coordinated room-focus frame,
sheet placement and navigation overrides. Read it alongside the room sheet files
when changing room-focus layout. Global reduced-motion overrides remain in
`styles/reduced-motion.css`; feature-specific motion rules stay with their feature.

Stylesheet extraction preserves selectors, declarations, conditions and source
order. Responsive and reduced-motion behavior changes are separate product work.
