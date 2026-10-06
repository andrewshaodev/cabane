# Verification, delivery, and known limits

The root package defines the executable checks. Run `npm run verify` for strict
TypeScript checking, Node tests, package-boundary and source-policy checks,
production build, and bundle-size reporting. `verify:bundle` currently reports
bytes relative to a historical baseline; it does **not** enforce a size budget.

The test command runs four shards with shared harness modules and a compact agent
reporter. Individual tests remain available through the Node test runner.

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
an isolated Chrome session. JSON reports include steady samples, a forced shadow
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
Chrome (`CHROME_PATH` can override the executable). It exercises the real
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
- Multi-floor navigation, hosted workspace synchronization, and a shared account
  backend are not implemented.
- Browser-local authoring does not update Git or synchronize other browsers.

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
