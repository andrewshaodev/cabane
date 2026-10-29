# Test-suite simplification, 29 October 2026

## Scope and inventory

Reviewed the risk and assertion boundaries of the 51 surviving test files changed
since 25 October, plus all Chromium cases and source-reading candidates. The
13 newly introduced suites primarily exercise identity preservation, model updates,
lighting, room membership, wall dividers, measurements and camera interaction.
Their meaningful behavioral matrices remain. This audit changes test coverage and
its inventory, not the runner, CI concurrency or application behavior.

The starting checkout was `d9c8f9b`. CI run `40884478937` provides an expanded
inventory of 1,481 cases across 224 files: 15 Chromium cases in 11 files and
1,466 Node/DOM cases. These counts use the runner's import-based browser
classification and include two browser-harness self-tests. Source-text `test()`
counts undercount generated cases and are not used here.

The reliability dependency `925b4be` adds one Node regression case. Against that
verified dependency, the intentional coverage delta is:

| Inventory       | Before | After | Delta |
| --------------- | -----: | ----: | ----: |
| Root test files |    224 |   223 |    −1 |
| Chromium files  |     11 |     9 |    −2 |
| Node/DOM files  |    213 |   214 |    +1 |
| Chromium cases  |     15 |    13 |    −2 |
| Node/DOM cases  |  1,467 | 1,463 |    −4 |
| Total cases     |  1,482 | 1,476 |    −6 |

Six Node cases are deleted and two browser cases become DOM cases. One broad
browser journey becomes a focused browser smoke. No cases are skipped, retried or
hidden. The complete verification report confirms these counts.

## Coverage ledger

| Risk / old coverage                                                                                                            | Decision                                               | Retained checks and intentional loss                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HA setup: demo → personal workspace → Connect → library → address reload (`workspace-ha-storage-ui`)                           | Replace with one `workspace-ha-settings` DOM case.     | Real `HomeAssistantPage`, storage provider and isolated IndexedDB check that the demo offers personal creation without connection/storage controls, while a personal home offers setup. `workspace-ha-sync-ui`, `workspace-repository`, `workspace-onboarding-state`, `workspace-routes` and `workspace-library` retain sync, demo identity, destinations and import-dialog behavior. Drop the multi-page editor/navigation combination and session-address reload assertion; address persistence is convenience state, not data safety. |
| Receiving link: valid URL → reload → invalid URL → recovery dialog (`workspace-open-ui`)                                       | Replace with one `workspace-open-route` DOM case.      | Real `WorkspaceApplication` opens a missing local identity at `/open`, renders sign-in, rejects a malformed link and points recovery at the library import route. `workspace-open-link` checks URL/privacy validation; `workspace-open-content` retains fresh/divergent/wrong-origin/missing remote matrices; library DOM checks retain the import dialog. Drop real-browser reload and the cross-page dialog journey. Native first-launch retains actual IndexedDB reload.                                                              |
| Basement: create two levels, rename, change height, draw, reload, switch viewport, delete, undo and redo (`basement-browser`)  | Replace with one `floor-menu-browser` component smoke. | Actual floor-control CSS, narrow viewport bounds, no horizontal overflow and native Escape/focus. `basement-floors` retains schema/classification, topology, negative elevations, deletion cleanup and undo; `multiple-floor-storage` retains real repository persistence; `panel-dom` retains controls and keyboard behavior. Drop combined editor/drawing/reload/desktop/mobile acceptance. The smoke does not establish whole-editor responsive acceptance.                                                                           |
| Approved editor chrome, furnish catalog composition, selected-wall facts (`home-editor-integration`, three source-regex cases) | Delete.                                                | Actual `HomeEditor` save/recovery/copy-paste/history cases remain. `editor-chrome`, `editor-panels`, `arrange-catalog-ui`, `editor-construction-inspector`, `room-name-control` and `editor-camera` exercise controls, naming, grouping, numeric edits and gestures. Drop component-name/JSX/copy/style assertions, including the stale `label="Room name"` regex that failed CI. No replacement copy snapshots.                                                                                                                         |
| `FloorScene` source mentions `SceneItemRenderer`, array length and `React.memo` (`scene-systems`)                              | Delete.                                                | The adjacent renderer case still checks declarative items exactly once, device interactions, empty/legacy paths and registry isolation. Home preview integration remains. Internal delegation/memoization spelling is no longer a test contract.                                                                                                                                                                                                                                                                                         |
| Copied labels, categories, default dimensions and resize policies for dozens of devices (`catalog-device`)                     | Delete the 334-line snapshot case.                     | Stable ID compatibility list remains. Boundary validation checks all model definitions and malformed metadata. Real geometry/envelope/complexity, placement and editor tests remain. Exact wording and default dimension values are intentionally no longer frozen by a second copy of the catalog.                                                                                                                                                                                                                                      |
| Demo Connect uses particular JSX/components (`demo-connect-route`)                                                             | Delete the source-only suite.                          | Workspace/editor route tests, Connect DOM tests, demo session/provider isolation and mode-navigation callbacks remain. They do not provide an end-to-end demo-to-Connect acceptance journey; regex matches never established that either.                                                                                                                                                                                                                                                                                                |
| Personal textured GLB import and 20-room/100-binding shared-resource scene                                                     | Retain both browser cases unchanged.                   | Picker/decoder/WebGL preview and real rendered shared textures/resources are distinct browser risks. Node GLB validation, history, archive, resource lifetime and storage matrices are not equivalent replacements.                                                                                                                                                                                                                                                                                                                      |
| Backup export/download and file import                                                                                         | Retain browser smoke unchanged.                        | Protects browser file/download wiring and published-versus-draft safety. Schema, integrity, failed-write, migration and restore matrices stay in Node/DOM.                                                                                                                                                                                                                                                                                                                                                                               |
| Native HA first launch and insecure-origin capabilities                                                                        | Retain both browser cases unchanged.                   | Real host integration, actual IndexedDB reload and browser restrictions on HTTP remain alongside the cheaper startup-state matrix.                                                                                                                                                                                                                                                                                                                                                                                                       |
| Toon orbit, dense light pool, both laser motion modes and portal pointer lock                                                  | Retain unchanged.                                      | Shader compilation, actual WebGL rendering and native input are browser risks. The shader paths differ under reduced motion. Browser diagnostics self-tests also remain.                                                                                                                                                                                                                                                                                                                                                                 |

## Recent coverage retained

The changed-file inventory was reviewed by responsibility rather than deleting
whole feature suites because they are new:

- Arrange identity/model editing: `arrange-catalog`, `arrange-catalog-ui`,
  `arrange-selection-events`, `edit-custom-model`, `item-entity-attachments`,
  `editor-workspace-history` and `personal-models`. Keep persistent IDs,
  mappings, per-copy transforms, duplicate/edit/undo behavior and asset integrity.
- Lighting/rendering: `home-lighting-state`, `imported-light-sources`,
  `model-lighting`, `model-lighting-ui`, `model-lighting-surfaces`,
  `light-pool-browser`, `scene-toon-batcher`, `catalog-device`,
  `living-room-presets`, `vacuum-flight` and `scene-systems`. Keep source/state
  rules, shared-resource ownership, shader paths, motion and geometry risks.
- Architecture: `editor-construct-preview`, `editor-construct-wall-drawing`,
  `editor-construction-inspector`, `editor-outdoor-platforms`, `floor-operations`,
  `framed-door-clearance`, `multiple-floor-composition`, `multiple-floor-schema`,
  `outdoor-platform-rooms`, `solid-rooms`, `virtual-room-dividers`,
  `stair-advice`, `stair-details` and `measurement-units`. Keep snapping,
  topology, floor isolation, reversibility, collision and saved-data semantics.
- UI/integration: `editor-camera`, `editor-chrome`, `editor-panels`,
  `editor-validation-recovery`, `model-generation-guide`, `orbit-view`,
  `panel-dom`, `workspace-routes` and `home-editor-integration`. Keep interactions,
  focus, locks, accessibility, validation repair and state restoration.
- Data/HA: `ha-model-assets`, `home-assistant-auth`,
  `home-assistant-host-session`, `home-assistant-mapping`,
  `home-project-repository`, `home-project`, `native-first-launch` and
  `native-startup-state`. Keep credentials/origin/session isolation, atomic writes,
  migrations, restore conflicts and real native behavior.

Reading a fixture or executing a public callback script is not itself a source
snapshot. OAuth callback execution, archive fixtures and geometry fixtures remain.

## Validation and measurement

`scene-systems` had one unrelated lifecycle defect exposed by the focused run:
`OpeningThreshold` was loaded inside its test after `withModules` had closed Vite.
Move that load into setup so the existing geometry assertion also works outside
shared shards. No shared-loader behavior changes. Removing the source-only
entry points also exposed two unused navigation re-exports in `ConnectedProduct`;
those aliases are removed while its imports and behavior stay intact.

The final floor-menu smoke completed in 3,153 ms and 2,679 ms in separate cold
focused runs, including setup and teardown. Its timeout is 10,000 ms. The new
scheduling weight is their rounded mean (2,916 ms); removed-file weights are
deleted. The broader full-editor attempt exceeded the budget and was replaced
before accepting this seam. The final four-worker complete run measured the same
smoke at 4,921 ms. Every observed final case is below budget. Existing weights for
untouched suites are not fresh measurements.

Targeted editor, inspector, scene, catalog, settings, sync, receiving-link,
repository-adjacent floor and inventory checks pass. `npm run verify` passes:
1,476 cases, zero failures/skips/todos, static checks, furnishing-surface checks
and production build. Its expanded report confirms the inventory above.
Historical CI costs
(e.g. the old HA journey's 57,991 ms) describe another runtime/machine and are not
used for a like-for-like speedup. Existing retained browser cases over 10 seconds
in CI remain explicit debt for the execution workstream; none were extended here.
