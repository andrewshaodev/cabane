# Architecture and ownership

Cabane is a client-side React/Three.js application in an npm workspace. The web
application owns routing and browser workspace coordination; the engine owns
schemas, validation, scene behavior, persistence, and Home Assistant integration.
The catalog supplies procedural model definitions. The home package supplies the
bundled owner's project and model extensions.

| Package | Implemented responsibility |
| --- | --- |
| `apps/web` | Workspace library and host, routes, Construct/Arrange/Connect, editor chrome |
| `packages/engine` | Public contracts, project lifecycle, geometry, rendering, dashboards, HA runtime |
| `packages/catalog` | Stable architecture, furnishing, and device registries |
| `packages/walk-laser` | Optional, lazy-loaded first-person laser experiment |
| `home` | Portable project data and two code-defined kitchen extensions |

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

Optional walk tools are installed by the web host through `CabaneDashboard.walkTools`.
The engine exposes `WalkToolDefinition`, `WalkToolProps`, and `raycastWalkScene` at
its public root. A definition supplies an ID, label, icon, and scene module; its
injected `activateTarget` accepts a modeled target and returns user-facing success
or unavailable feedback. Runtime entity resolution and authorization remain in
the engine. Tools receive no HA client, credentials, or household entity IDs.

`packages/walk-laser` is an optional experiment, installed only in
`apps/web/src/walk-tools.ts`. Its scene, model, effects, input, and CSS load when
first equipped. The engine, catalog, and home never import it. Removing that
registration and dependency removes the feature; stored `walk-tool` shortcuts
remain readable and render as unavailable. The generic shortcut schema retains
unknown tool IDs to preserve portable projects between hosts with different tools.
