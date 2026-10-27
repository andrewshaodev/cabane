# Connect LLM agent

Connect LLM agent lets an external agent running on the same computer operate the
currently open Cabane workspace through a small, loopback-only command bridge. It
does not give the agent direct access to IndexedDB, localStorage, React state or
Home Assistant credentials. Cabane's browser runtime remains the owner of those
things.

## Pairing and routing

`npm run agent:bridge` starts one local HTTP process on
`http://127.0.0.1:4317` and prints a process-local pairing code. The Connect LLM
agent entry in a workspace card's three-dot menu opens the selected workspace's
editor with an on-demand pairing dialog. The dialog sends the code, the current
workspace ID and the browser origin. The bridge stores one in-memory session for
that exact workspace.

The bridge allows the local development origin and
`https://smart-cabane.vercel.app` by default. For another Cabane deployment,
start it with a comma-separated `CABANE_AGENT_ORIGINS` value. The CLI includes
the paired session when it queues a request, so a request cannot be submitted to
an unpaired or replaced workspace session.

The CLI therefore never guesses a workspace from a filesystem path or from
browser storage. The open browser tab is the router: it polls the bridge, runs
the command through the existing editor controller, and posts the JSON result
back. Pairing another workspace replaces the previous session. Closing the
connection or leaving the workspace explicitly unpairs the session; changing
editor modes within the same workspace does not. Restarting the bridge makes
the browser show a disconnected state and requires pairing again.

There is no separate Home Assistant bridge. Home Assistant commands use this
same Cabane bridge and the connection already authenticated in Cabane's browser
runtime. The local agent may receive the current compatible entity candidates
from `list_binding_slots`; those IDs are transient command results and are not
written to the repository, generated home source or bridge logs.

## Command boundary

The bridge exposes a small generic registry rather than one bespoke CLI command
per engine feature:

- `get_capabilities`, `inspect_workspace`, `get_draft_diff` and `validate_draft`
  inspect the selected workspace without changing it.
- `select_floor` changes the editor's active floor. `dispatch_construct` accepts
  the whitelisted durable `FloorEditorAction` types, including walls, openings,
  rooms, finishes, pools, hedges, platforms and zones. Selection, camera and
  tool-only actions stay browser-local.
- `floor_operation` adds, renames, resizes or removes floors through the engine's
  existing floor operations.
- `list_catalog` exposes both stable models and project-local `custom:*` models.
  `dispatch_arrange` adds, updates, duplicates or deletes items using the normal
  Arrange editor. Adding an item goes through the existing catalog placement and
  typed device-slot creation path.
- `list_binding_slots` exposes typed slots and, when Cabane is connected to Home
  Assistant, compatible registry candidates. `apply_binding` maps or clears one
  slot. `apply_room_mapping` maps or clears a room's HA area. These commands do
  not show a manual confirmation dialog; the browser still checks the active
  origin, registry presence, disabled/hidden status and slot compatibility.
- `discard_draft` restores the published project and bindings. `publish_draft`
  is the explicit publication command; it saves the current draft, runs the
  normal project and binding validation, and publishes only when no error
  remains. Warnings are acknowledged by the explicit command itself.
- `rename_room`, `undo` and `redo` remain compatibility shortcuts over the same
  controller and history paths.

Mutating commands accept an optional `expectedRevision`. When supplied, a stale
agent request is rejected and the agent must inspect again. The browser also
rejects commands while an edit is unsettled or the workspace is busy, then
flushes accepted draft changes through the existing workspace autosave path.

## CLI usage

The bridge is started from the repository root:

```sh
npm run agent:bridge
```

After pairing the workspace in Cabane, an agent or terminal can send any
documented command through the generic request entry point:

```sh
npm run agent:request -- --method get_capabilities --pretty
npm run agent:request -- --method inspect_workspace --pretty
npm run agent:request -- --method dispatch_arrange \\
  --params '{"action":{"type":"add-item","modelId":"some-model"}}' --pretty
```

The CLI only talks to the loopback bridge. It does not need a workspace URL,
workspace ID, browser-storage access or a second Home Assistant connection.

## Repository ownership

The CLI is a new executable workspace at `apps/agent-cli/`. The browser bridge,
command contract and on-demand pairing dialog are new web-local modules under
`apps/web/src/agent-pilot/`. The existing workspace repository, editor
controller, engine packages and `home/` seed remain in their current paths and
are reused through their public interfaces. No existing code is moved.

The transport is plain HTTP polling so it can be tested without a new runtime
dependency. A future MCP or other agent adapter can call the same command
boundary; it must not bypass the browser-side capability and validation checks.
