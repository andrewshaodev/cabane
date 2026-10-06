# Cabane Agent Instructions

## Authority and routing

Before locating product code, changing module boundaries, or choosing checks,
read [the engineering map](docs/engineering-map.md), then its matching product
contract. `PRODUCT_SPEC.md` and `docs/product/` are authoritative. Update the
map's routing data and regenerate it when ownership, interfaces, invariants,
or checks change.

- **Home generation:** Read [the generation workflow](docs/agent-home-generation.md)
  before setup, floor planning, or room equipment; it routes to the required
  skills and review gates. Ordinary generation edits only `home/`. Configure
  stable models first, then home-local extensions when necessary. Stable web,
  engine, and catalog changes require an explicit product-development request.
- **Product development:** Use the engineering map, not the home-building skills.
  Preserve the English UI and Construct, Arrange, and Connect modes. Native
  geometry and hosted assets follow the visual-asset contract; personal GLB
  imports use their dedicated validated engine owner.
- **Review or model decomposition:** Read [coding standards](CODING_STANDARDS.md).
- **Tests or verification tooling:** Read [test guidelines](docs/test-guidelines.md).
- **Verification or delivery:** Read [verification and delivery](docs/product/verification-and-delivery.md)
  for commands, prerequisites, execution permissions, and evidence requirements.

## Safety and ownership

Inspect Git status and preserve unrelated changes before editing. Consumers use
only documented public engine and catalog subpaths. Home generation never
accesses Home Assistant or requests household credentials/registries; it declares
typed local slots. Authenticated mapping belongs to the browser runtime, and
automatic mapping/rescans remain read-only.

Keep credentials, tokens, OAuth data, browser storage, HA histories, camera images,
source plans/photos, registry exports, and household HA IDs out of Git. Private
configuration and binding profiles stay outside generated code. Keep verification
screenshots in ignored `screenshots/` or outside the repository; inspect staging
before committing or opening a PR and summarize visual evidence in the PR.

## Execution and handoff

Use the pinned Node/npm baseline and `npm ci`; install the pinned browser before
browser checks. Run `npm run format` after edits. Iterate with focused checks;
finish shared product changes with one `npm run verify` (including `verify:fast`).
Other code changes need `verify:fast` and applicable surface checks. Run checks
sequentially and reuse passing results until relevant inputs change. After a
failure, rerun affected checks and complete skipped stages; report retries.
Fix failures without weakening checks.

In restricted Codex sessions, run browser/full verification and pushes through
approved execution with localhost and browser-process access from the outset.
Use `sandbox_permissions: "require_escalated"` when available; ordinary reads,
edits, and static checks stay sandboxed. The preflight diagnoses missing access;
it cannot grant permissions.

Keep the approximately 20-room/100-binding scale target for shared validation or
rendering changes. Verify visible changes through the normal UI. Report changed
files, checks, assumptions, and remaining uncertainty; do not claim household,
deployment, or cross-browser acceptance without its corresponding evidence.

For explicitly requested implementation, focused commits and pushes to the
current or user-designated branch are authorized after verification. Preserve
remote configuration and history; deployments require an explicit request.
