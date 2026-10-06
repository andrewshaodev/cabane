# Verification, delivery, and known limits

The root package defines the executable checks. Run `npm run verify:fast` for
Prettier, typed ESLint with React Hooks rules, strict TypeScript, Knip, and
package-boundary/source-policy checks. `npm run verify` also runs all tests,
furnishing-surface checks, and the production build. No hosted CI is configured.

For the smallest sufficient iteration check, run `npm run verify:help`. Its
selection guidance comes from the maintained test inventory, rather than a second
script list in documentation. Focused checks retain the static gate and both Node
and browser coverage. Shared or uncertain impact requires the complete gate;
focused checks never replace `npm run verify` before product delivery. When adding
or renaming tests, maintain `tests/verification-groups.json`: unclassified tests
conservatively trigger the full suite, and stale entries fail visibly.

Node 24.11.1 and npm 11.6.2 are the pinned local baseline. The `engines` and
`devEngines` checks accept Node `>=24.11.1 <25` and npm `>=11.6.2 <12`, so managed
hosts can install security updates within those major versions. Do not enforce an
exact patch version through `devEngines`: Vercel selects the Node major and updates
its minor/patch version independently of the local pins. Install with `npm ci`, then
`npm run browser:install` to install Playwright's matching Chromium build; tests
use modern headless Chromium rather than an independently updated system browser.
Linux environments without browser libraries can use
`npm run browser:install -- --with-deps`. Reinstall the browser after Playwright upgrades.

The application checker uses native TypeScript 7 (`typescript-native` alias).
Typed ESLint uses the TypeScript 6 compiler API, which typescript-eslint currently
supports. Both versions are locked; remove the alias when the lint ecosystem
supports the native compiler API. Strict checks include exact optional properties,
explicit overrides, complete return paths, and switch fallthrough protection.
`noUncheckedIndexedAccess` remains a separate migration; geometry algorithms need
real length invariants, not blanket non-null assertions.

Knip tracks the workspace exports and Vite harness imports as entry points.
Keep those entry points explicit when adding runtime-loaded modules. The engine's
Roboto font dependency is retained because CSS imports are outside this analysis.

The test command runs four cost-balanced shards with shared harness modules and a
compact agent reporter per worker. The launcher keeps four independent worker
processes so Node cannot buffer a later shard's failures behind an earlier shard. `npm test` always includes both Node and Chromium coverage.
`npm run test:unit` runs the Node/DOM tests without Chromium or listening HTTP servers;
`npm run test:browser` runs the browser journeys. Individual files remain available
through `node --no-experimental-global-navigator --test tests/<name>.test.mjs`.
The flag lets older JSDOM fixtures install their own navigator, as the shard
runner does. Set `TEST_PROFILE=1` to report slow tests. Failures are printed as soon
as Node emits completion, including the original test/file, error and a shell-safe
focused rerun command; successful tests remain dots.

Storage, migration, restore, native startup states, and HA settings/sync cases run against the real
repository and React components in Node, with an isolated `fake-indexeddb` factory
per scenario. DOM checks wait for state or transaction completion; sync tests drive
interval callbacks explicitly. Keep Chromium for browser-specific behavior: real
IndexedDB through the application, route/reload persistence, file upload/download,
reference-image interaction, responsive editor controls, and rendered scenes.

Browser tests reuse Vite and Chromium within each shard, with fresh browser contexts
for each test/session and teardown even after failure. Each Vite browser server
owns a temporary dependency cache; it cannot race another shard or the development
server over optimized modules. File watchers are disabled in test servers. New
browser tests should use `tests/browser-test-environment.mjs`; the runner detects
that import (or a direct Playwright import) when selecting `test:browser`.
Wrap browser test callbacks in `withBrowserDiagnostics` from
`tests/browser-test-diagnostics.mjs`. It retains session contexts until the callback
finishes, captures failures before teardown, and always closes contexts. Keep the
original `node:test` registration so failures identify the correct source file.
Failure artifacts are saved under ignored `test-results/browser/<test>-<unique>/`:
per-page screenshots, per-context Playwright traces, and `errors.json` with recent
console warnings/errors and uncaught page errors. The reporter prints the absolute
artifact directory. Successful traces are discarded; failure evidence stays local
until removed. A manually closed page/context cannot be captured afterward. Open a
trace with `npx playwright-core show-trace <path-to-trace.zip>`.

Home-specific commands include `home:validate-floor`, `home:verify`, and layout,
room, and scale fixture verification. Fixtures exercise a representative target
of about 20 rooms and 100 bindings. There are rendering, geometry, editor,
persistence/conflict, mapping, command, camera, and dashboard tests. A passing
fixture is evidence for that scenario, not proof of household runtime acceptance.

Normal UI evidence capture is available for architecture, furnished rooms, walk
mode, and fixtures. Manual visual review remains distinct from type checking and
unit tests. Responsive controls, reduced-motion handling, and automated DOM/scene
checks exist; final cross-browser and comprehensive accessibility acceptance are
not established by their presence alone.

`npm run measure:scene` measures main-canvas draw calls and submitted triangles
for the bundled home's default Orbit, Walk, Construct, and 3D Arrange views in
an isolated Chromium session. JSON reports include steady samples, a forced shadow
refresh, and optional baseline comparisons. The opt-in `--check` gate requires
each measured peak to stay below 50 calls and 100,000 triangles; it is separate
from `verify`. These viewpoint-specific counts do not establish an FPS target or
a whole-building worst case. See the [README measurement instructions](../../README.md#measure-scene-rendering-performance).

`npm run dev` starts Vite on loopback port 4173. Production builds produce
`apps/web/dist`. The repository includes a Vercel configuration with SPA rewrites.
There is no checked-in Dockerfile or Compose stack. A build or hosting
configuration does not prove a deployed service, secured private access, or a
working network route from every client to HA.

The native panel has a separate build: `npm run build:panel` produces
`apps/web/dist-panel/cabane-panel.js`, scoped CSS, local assets, license notices,
and `manifest.json` with the source commit and SHA-256 file inventory. Release
builds require a clean committed tree. `CABANE_PANEL_ALLOW_DIRTY=1` permits local
development builds and marks the manifest as development-only.

After building, `node scripts/verify-panel.mjs` serves the production artifact
under a nested local asset path and opens a synthetic Home Assistant host in
Chromium (`CHROME_PATH` can override the executable). It exercises the real
workspace/editor UI, host-session selection, HA import/storage, reconnect and
detach behavior, and local asset loading while retaining the host URL. Unit and
browser regressions additionally cover origin mismatch, demo isolation, stale
connection work, token-storage traps, and standalone migration compatibility.
These fixtures use fake HA data and do not establish live household acceptance
or deploy the artifact to Home Assistant.

Uncompleted acceptance/deployment concerns remain explicit:

- Household binding completeness and real-device/camera acceptance require an
  owner's authenticated runtime review.
- Private deployment/network hardening and container delivery are not completed
  product features.
- Cabane-hosted workspace synchronization and a shared account
  backend are not implemented.
- Browser-local authoring does not update Git. Optional HA synchronization can
  transfer saved workspaces and personal assets between authenticated clients.

Implementation: [commands](../../package.json),
[test harness](../../tests/test-server.mjs),
[home verifier](../../scripts/verify-home.mjs),
[source policy](../../scripts/verify-source-policy.mjs),
[bundle report](../../scripts/verify-bundle-budget.mjs),
[hosting configuration](../../vercel.json).

[Back to product overview](../../PRODUCT_SPEC.md).

`node scripts/verify-multiple-floor-ui.mjs` checks upper-floor paint persistence
and visible patterns, Explore with mandatory pointer lock, keyboard movement, mouse
look, and return to Construct using an isolated synthetic building.

`node scripts/verify-ha-shortcuts.mjs` exercises the normal Shortcuts editor and
Home action bar against a synthetic runtime: scene/script mapping, unavailable
choices, history, Save, pending and failed commands, disconnection, mobile
overflow, and IndexedDB reload. It makes no household service calls. Screenshots
are written to `/tmp/cabane-ha-shortcuts` by default (`CABANE_SHORTCUT_EVIDENCE`
overrides the destination).

Personal GLB coverage uses `tests/personal-models.test.mjs`,
`tests/personal-models-browser.test.mjs`, and `tests/ha-model-assets.test.mjs`.
The normal Arrange UI checks the public skill link and copyable install command,
imports solid/PBR/textured files and actual Blender/Three.js skill example fixtures,
and tests supports, history, Save/Reset, and complete archives. Installation and
generation are verified independently in the public skill repository. Storage
fixtures exercise missing/corrupt files, transaction failures, deduplication,
interruptions, origin/session isolation, old integrations, and two-client revision
conflicts. Companion integration tests cover authenticated blocks, integrity,
reference checks, and delayed cleanup. These checks use synthetic data and do not
contact household devices. Cabane and the integration must be delivered together;
publishing and deployment remain separate actions.
