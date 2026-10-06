# Review standards

Read during code review and when designing or splitting model modules. The
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

## Contract review

Check ownership, interfaces, geometry/collision agreement, saved-project
compatibility, and verification coverage across the diff. The engineering-map
checker validates paths and exports, not the accuracy of its prose. Update the
routing and authoritative contract together when their responsibilities change.
Automated lint, type, boundary, and policy checks remain the mechanical gate.
