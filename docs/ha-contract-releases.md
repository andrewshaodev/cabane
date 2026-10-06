# Home Assistant contract releases

When a schema, serialized type, migration, binding format, archive format or
catalog dependency changes, run `npm run verify:ha-contract`. Its source list
starts at the parsers and catalogs and follows local TypeScript imports and
exports. This intentionally includes some rendering dependencies: catalog
changes can require a matching panel even when the JSON shape stays the same.
Whitespace and comments are ignored; edits to validation or defaults are not.

For a changed fingerprint, record the change before completing the task:

```sh
npm run contract:record -- --summary "Describe the contract change" --breaking-change "Explain which older clients need an update and why"
```

Review `docs/ha-contract.json`, including the cumulative compatibility notes.
Run the affected checks and the full product verification gate. Commit the
manifest with the implementation. A PR validates the fingerprint and notes;
publication only runs after a push to `main` or a manual workflow dispatch.
Keep incompatible imports blocked. Never strip unknown data to make them load.

The `Home Assistant contract release` workflow builds and tests the clean native
panel, adds the contract revision to its artifact metadata, and checks out the
integration with a repository-scoped SSH deploy key. It advances the integration
patch version, vendors the complete bundle, runs integration and browser import
checks, commits upgrade notes under `docs/releases/`, and pushes the commit and
tag atomically. The integration's release workflow publishes releases carrying
these reviewed notes; ordinary manual tags retain their draft-release flow.
The producer then checks the public ZIP contains the expected contract.

The workflow serializes releases. A matching contract skips another bump. A
newer integration contract blocks a downgrade. A rejected concurrent push fails
without changing remote refs; rerun the producer workflow from a fresh checkout.
If a tag was pushed but publication failed, rerun the integration's failed
`Package release` workflow first, then rerun the producer workflow. The build is
not considered delivered while the public release is missing.

The private producer repository needs `CABANE_INTEGRATION_DEPLOY_KEY`. Its public
key belongs to the integration repository's write-enabled deploy keys; the
private key belongs only to that Actions secret. This grants Git access to the
integration alone and does not copy a maintainer's personal GitHub token.

For a local preparation with the existing authenticated checkout:

```sh
npm run build:panel
npm run release:ha-contract -- /path/to/clean/cabane-home-assistant
```

This prepares and tests the integration diff without committing or pushing it.
After the required producer checks, `--push` also commits and pushes the main
update/tag, which starts the integration release workflow.

`.codex/hooks.json` adds a Stop hook that continues the agent once when the
contract manifest is stale. Codex requires the user to review and trust the hook
definition in its hooks UI before it runs. This is a local reminder; GitHub
Actions and `verify:fast` enforce the same check independently. The hook does not
launch a separate chat, publish on a file save, or bypass a user pause/cancel.

Unknown project fields and newer schema versions remain errors. Their messages
explain that the copy may come from a newer Cabane, give HACS update/restart/reload
steps, and retain the precise unsupported field in the diagnostic. File imports,
HA imports, sync and local record recovery share these parser messages.
