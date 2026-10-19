# Coding standards

Read during code review, rendering or model authoring, and when designing or splitting model modules. The
[engineering map](docs/engineering-map.md) routes to authoritative product
contracts. Check those contracts for cross-file behavior and compatibility.

## Model cohesion

Give each procedural model family and model-specific part a focused module named
for its responsibility. Group related files in domain directories with a local
barrel exposing supported entry points. Separate unrelated door, window,
furniture, and device families. Extract reused behavior under the concrete
responsibility it owns; a catch-all module hides that ownership.

## Responsibility and size

ESLint enforces source-size ceilings. When a module exceeds its ceiling, extract
cohesive behavior behind a small interface rather than fragmenting code merely
to satisfy the count. Lower or remove existing exceptions when refactoring;
raising a ceiling is not a fix.

## Rendering and asset ownership

Use the engine's `ToonMaterial` for native procedural geometry, including catalog
and home-local models. Reuse the shared gradient, fading, and outline behavior.
Scene lighting belongs to the engine; models declare emitter metadata for the
engine to render. Procedural floor textures, including `CanvasTexture` creation,
belong in the engine's floor-finish modules.

Follow the [visual-asset contract](docs/product/geometry-and-rendering.md#visual-assets)
for hosted and bundled assets and engine atmosphere. Loaded models may preserve
their original materials. Personal GLBs go through the validated import owner
described in [personal models](docs/product/personal-models.md).

Review actual resource loading, credential handling, and failure behavior.
Navigation links and example URLs need no per-URL allowlist. Review these ownership
conventions in context rather than enforcing global URL or material-name bans.

## Contract review

Check ownership, interfaces, geometry/collision agreement, saved-project
compatibility, and verification coverage across the diff. The engineering-map
checker validates paths and exports, not the accuracy of its prose. Update the
routing and authoritative contract together when their responsibilities change.
Automated lint, type, boundary, and behavior checks complement this review.
