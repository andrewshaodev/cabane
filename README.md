# Cabane

Cabane is a 3D home dashboard for Home Assistant. Explore a modeled home, edit
its architecture and furnishings, connect rooms and objects to Home Assistant,
and use supported controls from the scene. The bundled furnished home can also
be explored as a demo without a Home Assistant connection.

## Product

- **Explore:** View the whole home, focus a room, or walk through it in first
  person.
- **Create:** Use Construct for architecture and Arrange for furnishings and
  devices. Homes can also be authored as code with procedural models.
- **Connect:** Map modeled rooms and objects to Home Assistant areas and
  entities in the browser. Credentials and household bindings stay outside the
  checked-in home source.
- **Manage homes:** Create, duplicate, import, export, and switch between
  browser-local workspaces.

Cabane uses code-defined, cel-shaded geometry. The included South Garden Villa
has two furnished floors and serves as the initial demo home.

## Repository

This npm workspace separates the reusable product from the bundled home:

| Path               | Responsibility                                                                       |
| ------------------ | ------------------------------------------------------------------------------------ |
| `apps/web`         | Web application, routes, workspace and editor shell                                  |
| `packages/engine`  | Project contracts, validation, 3D runtime, dashboard, and Home Assistant integration |
| `packages/catalog` | Reusable architecture, furnishing, and device models                                 |
| `home`             | Bundled home data and home-specific procedural extensions                            |

The home project is stored in `home/src/layout.json`, `items.json`, and
`project.json`. Browser edits are stored locally and do not update these files.
Ordinary home customization belongs in `home/`; changes to the other packages
change the Cabane product itself.

## Run locally

Use Node.js **24.11.1** and npm **11.6.2** for the reproducible local baseline, pinned in `.nvmrc`, `.node-version`, and `packageManager`. With nvm, run `nvm install && nvm use` first. The `engines` and `devEngines` compatibility checks also accept newer Node 24 and npm 11 releases because managed hosts such as Vercel update their runtimes within a major version.

```sh
npm ci
npm run dev
```

Open the local URL printed by the development server. For automated checks, install the
Playwright-pinned browser once with `npm run browser:install` (Linux hosts may need
`npm run browser:install -- --with-deps`). Run `npm run verify:fast` for formatting,
typed ESLint, TypeScript, Knip, and repository rules; run `npm run verify` for the
full tests, furnishing checks, and production build. The Verification workflow runs
the same full gate on pull requests and pushes to main, using synthetic local data.

Use `npm run format` to format changes and `npm run lint:fix` for safe lint fixes.
Build the standalone app with `npm run build`.

## Measure scene rendering performance

`npm run measure:scene` records draw calls and submitted triangles for the bundled
home's Orbit, Walk, Construct and Arrange views. Save reports under ignored
`test-results/`; compare runs on the same machine and browser configuration.
The optional `--check` gate requires peaks below 50 calls and 100,000 triangles.
It is separate from `verify`; passing tests do not establish those performance
budgets or real-device frame rates. See the [delivery contract](./docs/product/verification-and-delivery.md)
for coverage and limits.

Cabane also runs as the native `cabane-panel` custom element inside Home
Assistant. It borrows the signed-in host connection; each personal workspace
explicitly selects that instance, and the demo remains simulated. The panel
keeps its navigation and UI inside its own memory router and shadow root.
Standalone browser sign-in remains available in the regular web app.

Build and check the native panel from a clean, committed frontend tree:

```sh
npm run build:panel
node scripts/verify-panel.mjs
```

The artifact in `apps/web/dist-panel` includes local assets, license notices,
and a manifest with the source commit and file hashes. The verifier runs an
isolated local host fixture, without accessing a household HA instance. For
uncommitted development only, use `CABANE_PANEL_ALLOW_DIRTY=1 npm run build:panel`;
its manifest is marked development-only. See the [delivery contract](./docs/product/verification-and-delivery.md)
for the scope of these checks.

For guided setup or home authoring, see the [repository skills](./.agents/skills/)
and [agent rules](./AGENTS.md).

## Documentation

- [Engineering map](./docs/engineering-map.md) — owning modules, supported interfaces,
  invariant review points, and checks by product area.

- [Product specification](./PRODUCT_SPEC.md) — current behavior and links to
  focused product documentation.
- [Architecture](./docs/product/architecture.md) — package responsibilities
  and project ownership.
- [Verification and delivery](./docs/product/verification-and-delivery.md) —
  checks, deployment status, and known limits.
- [Catalog](./packages/catalog/README.md) — available reusable models.
- [Home Assistant workspace storage setup](./docs/ha-workspace-storage-setup.md) — install the optional HA integration and save or restore workspaces.
- [Contributing](./CONTRIBUTING.md) — changes and verification.
- [Security](./SECURITY.md) — private vulnerability reporting and safe reproductions.
- [Publication](./docs/publication.md) — import history and publication prerequisites.

## Related repositories

- [cabane-home-assistant](https://github.com/cabane-app/cabane-home-assistant) — Home Assistant integration, installation instructions, and releases.
- [agent-skills](https://github.com/cabane-app/agent-skills) — public agent skills, including `create-cabane-model` for personal GLB model authoring. Install it with `npx skills add cabane-app/agent-skills --skill create-cabane-model`.

## License

[PolyForm Noncommercial 1.0.0](./LICENSE).
Third-party dependencies and assets retain their own [licences](./THIRD_PARTY_NOTICES.md).
