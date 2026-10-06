# Cabane Agent Instructions

Before locating product code, changing module boundaries, or choosing checks, read
[the engineering map](docs/engineering-map.md). Update its routing data and regenerate
it in the same change when ownership, interfaces, invariants, or checks change.

## Scope and authority

These instructions apply to the entire repository. `PRODUCT_SPEC.md` and its linked files under `docs/product/` form the
authoritative product and architecture contract. Do not silently weaken or
reinterpret it while generating a home.

**Core generation rule:** Configure stable primitives and models first, create
home-local extensions when they do not fit, and modify stable product code only
on an explicit product-development request.

This repository separates upstream product code from one owner's generated
home:

- `apps/web`, `packages/engine`, and `packages/catalog` are stable,
  upstream-owned packages.
- `home/` is the agent-owned package for the owner's manifest, architecture,
  furnishings, typed binding slots, and home-local extensions.

Ordinary floor generation and room equipping edit only `home/`. Change a
stable package only when the user explicitly asks for product development.
Use only documented public exports from `@cabane/engine` and the
`@cabane/catalog/{architecture,furnishing,device}` subpaths; never
import their internal files.

## Current repository baseline

- The bundled home is the accepted two-floor South Garden Villa with eighteen
  furnished interior rooms. `home/src/layout.json`, `items.json`, and `project.json`
  assemble into the same `HomeProject` schema used by workspace import/export.
- Keep architecture in `layout.json`, furniture/device instances in `items.json`,
  and home metadata/profiles/assumptions in `project.json`. Do not recreate the
  retired per-room TypeScript specs, React compositions, or placement factories.
- The fitted kitchen and its cabinet lighting are the two home-local extension
  examples. Reuse catalog presets for all other supported model families. Inspect
  the public registries before creating a new model.
- A valid browser-edited floor may override the bundled floor for one browser
  origin/device. That browser-local record does not update Git or become the
  source of truth for repository generation. Durable architecture changes
  still update the accepted floor in `home/src/layout.json` and pass the layout
  review gate.
- Private deployment hardening and complete owner-runtime acceptance are not
  finished. Do not describe Docker/Compose support, a fully reviewed household
  binding profile, or final cross-browser/accessibility acceptance as complete
  until the corresponding checks exist and pass.

## Model organization

- Follow the single-responsibility principle for procedural 3D models. Give
  each model family and model-specific subcomponent its own small file named
  for the exact responsibility it implements.
- Group related model files in a domain-specific directory and expose its
  supported entry points through a local `index.ts` barrel. Do not combine
  unrelated device, door, window, passage, or furniture model families in one
  renderer file.
- Do not create generic `shared`, `utils`, or `helpers` model modules. When
  multiple models reuse an implementation, extract it into a narrowly named
  component or module that states the concrete responsibility it owns.

## Source size and responsibility

- Production TypeScript files have an ESLint limit of 500 nonblank, noncomment
  lines. Existing oversized files have fixed ceilings in `eslint.config.mjs`;
  lower or remove their ceilings when refactoring them.
- Keep each module focused on one responsibility behind a small interface.
  Extract cohesive behavior rather than splitting code solely to meet the count.
  Fix a size failure by improving the module, not by raising its ceiling.

## Task routing

`$bootstrap-cabane`, `$build-floor-layout`, and `$equip-room` are skills we
provide to project users for building their own homes. Invoke them only when
helping a user set up, build, or equip their home with Cabane. Do not invoke
these skills when developing, debugging, or improving the Cabane product
itself, even when the task involves setup, architecture, furniture, or devices.

For user home-building tasks only:

- For initial setup or starting the app to build a home, use `$bootstrap-cabane`.
- For a floor plan, footprint, room polygon, wall, door, window, ceiling, or
  architectural collision task, use `$build-floor-layout`.
- For room photos, furniture, decor, visible devices, placement, contact slots,
  or dashboard slots, use `$equip-room`.
- If furnishing reveals a structural error, stop equipping and return to
  `$build-floor-layout`. Re-verify and obtain layout approval before resuming.

Within this scope, these skills may be selected from natural language or
invoked explicitly. Do not furnish multiple rooms or continue from layout to
furnishing without a new user instruction.

## Shared generation invariants

- Treat the user's written correction as authoritative when it conflicts with
  an ambiguous plan or photo.
- Inspect all task attachments relevant to the current stage. Plans and photos
  remain task inputs; do not copy them into the repository.
- Record material inferred dimensions, scale, topology, and placements in the
  home manifest assumptions. State them in the handoff as well.
- Preserve stable floor, room, wall, junction, opening, device, and slot IDs across
  corrections. Rename only when the user changes the represented concept.
- V2 projects and manifests use ordered `floors[]`, a shared building coordinate
  transform, explicit item `floorId`, and adjacent-floor `stairs[]`. V1 single-floor
  inputs migrate without changing IDs. Generate only the floors requested by the
  user; the bundled owner home has two floors.
- Walls are the architectural source of truth. Openings are owned by a wall
  and inherit its thickness, exterior treatment, fade behavior, and collision
  semantics. Walk collision is derived from architecture, never maintained as
  a second hand-authored plan.
- Declare every real corner, T-junction, and crossing once in
  `FloorSpec.wallJunctions`, with its exact point and complete participating
  wall-ID set. Door and window jambs are openings, not junctions. Junction
  geometry, finish, fade, shadows, and collision remain engine-owned.
- Hosted and bundled textures and 3D models are allowed in product code,
  native catalog models, and generated home extensions. Follow the
  [visual asset contract](docs/product/geometry-and-rendering.md#visual-assets).
  Personal user-uploaded GLBs still use the validated public import APIs owned
  by `packages/engine/src/imported-models/`. Their self-contained validation and
  prohibition on executable user code remain unchanged.
  The standalone `create-cabane-model` skill remains in the public
  [cabane-app/agent-skills](https://github.com/cabane-app/agent-skills) repository.
- Use the engine's public toon materials and restrained outlines for authored
  home geometry. Hosted models may retain their original materials; engine-owned
  atmospheric effects may use suitable particle materials.
- Use stable catalog models when they fit. Put bespoke reusable geometry or
  devices in `home/src/extensions/`; keep room-specific item records in
  `home/src/items.json`.
- Keep the UI English-only and preserve the built-in UI style. Preserve the existing Construct, Arrange, and Connect editor modes. Do not add
  a debug studio, hosted service, telemetry, or an additional V1 mode without
  an explicit product-development request.

## Home Assistant safety and privacy

Generation does not require or access Home Assistant. Do not request MCP or
CLI access, registry exports, credentials, OAuth material, long-lived tokens,
area IDs, or entity IDs. Generated code declares typed local slots only.
Exact household mapping belongs to the authenticated browser runtime after the
owner explicitly completes OAuth.

Even if a Home Assistant tool is available, never call it during generation.
Do not inspect or control devices, call services, change configuration, create
automations, modify exposure, or use runtime service endpoints. Runtime
automatic mapping and rescans are read-only registry operations and must never
call HA services.

Do not commit credentials, tokens, OAuth callback data, browser storage, HA
histories, camera images, source plans, source photos, registry exports, or
household HA IDs. Actual local configuration and browser-local binding
profiles stay outside generated code. Remind the user that attachments may be
processed by their chosen agent provider.

## Working and verification rules

- Use the pinned Node/npm versions and `npm ci`. Install the pinned Chromium with
  `npm run browser:install` before browser verification.
- Run `npm run format` after edits and `npm run verify:fast` before handing off code.
  Run `npm run verify` for shared product changes; use the surface-specific checks
  below as well. Fix failures instead of weakening lint, compiler, or Knip rules.
- Inspect the existing tree and Git status before editing. Preserve unrelated
  user changes and do not overwrite generated home work outside the task.
- Prefer the repository's public types, helpers, fixtures, and verification
  commands over duplicate logic. If an expected implementation or command
  does not exist yet, report that limitation; do not invent a passing check.
- Run verification proportional to the affected surface. After generation,
  use the applicable schema/types, import-boundary, visual-asset/scene-ownership,
  geometry, collision, fixture, responsive UI, production-build, and visual
  checks. Check Compose only after deployment files exist or when the change
  affects them; do not invent a passing deployment check.
- Preserve the product's representative scale target of approximately 20 rooms
  and 100 persisted runtime bindings when a change touches shared validation or
  rendering paths.
- Verify through the normal UI. Layout work needs overview and walk-mode
  evidence. Room work needs overview, room-focus, walk, and grazing-angle
  evidence for changed contacts.
- A visible scene plus actionable validation errors is preferable to a crash
  when HA data is missing or incompatible.
- Handoffs state files changed, verification performed, assumptions, remaining
  uncertainty, and the precise review requested from the user.
- Pause after an unfurnished floor and after each equipped room. Do not move
  to the next stage on the user's behalf. This still applies to revisions of
  the already equipped owner home: change and review one room at a time unless
  the user explicitly requests broader product work.
- For an explicitly requested implementation, agents may create focused commits
  and push them to the current branch or a user-designated target branch after
  applicable verification without asking for separate authorization. Never
  force-push. Do not configure or change a remote, or deploy, unless the user
  explicitly requests it.
