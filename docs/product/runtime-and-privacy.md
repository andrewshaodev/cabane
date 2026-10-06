# Home Assistant runtime and privacy

The browser connects directly to the owner's normalized HTTPS HA origin (or paired loopback HTTP in development) through
`home-assistant-js-websocket`. OAuth is initiated by a user connection action;
callback handling removes auth parameters from the visible URL. Runtime state
covers unconfigured, disconnected, authenticating, connecting, connected,
reconnecting, expired authorization, and errors. Subscription teardown and stale
state marking keep old data from appearing authoritative after disconnection.

Embedded first-time sign-in opens HA authorization in a popup so HA does not
read the parent dashboard's query parameters. A static callback page returns only
the authorization code to the initiating Cabane frame using an exact target
origin. The frame checks the sender origin, popup identity, random state, and
current session before exchanging the code. Tokens stay in the frame's storage
context. Blocked, closed, cancelled, or timed-out popups allow retry; standalone
sign-in continues to use the existing redirect flow.

Real-device deployments require browser-trusted HTTPS delivery of Cabane and
HTTPS/WSS Home Assistant connectivity. The UI and runtime reject unsupported
transport before sign-in, callback exchange, or stored-token restoration, with
actionable HTTPS guidance. Rejected callback parameters are removed from the URL.

HTTP development remains supported when both endpoints use HTTP loopback origins:
`localhost`, IPv4 `127.0.0.0/8`, or IPv6 `[::1]`, on the browser's machine.
Local demo and construction remain available over HTTP without HA. This exception
is local development, not encryption. Ordinary LAN HTTP, private-tunnel bypasses,
HTTPS-to-HTTP, and loopback-HTTP-to-remote-HTTPS sessions are unsupported.

The client guard cannot protect JavaScript replaced during HTTP delivery.
Production infrastructure must enforce HTTPS. Actual certificate, HTTP redirect
or rejection, and HA HTTPS/WSS behavior on the chosen release target remain a
launch gate; static builds do not complete Docker/LAN deployment acceptance.
See [transport acceptance](../transport-acceptance.md) for the required checks.

Switching homes disposes the prior runtime, clears its visible state, and ignores
stale connection completion. The library mounts no HA provider. Each workspace
stores its own server selection.

The runtime reads area/device/entity registries, subscribes to entity states, and
exposes refresh and connection errors. Supported service calls are scheduled and
guarded by the active connection and binding availability. Real commands belong
to explicit runtime controls. The command scheduler manages pending work; demo
and editor walkthrough contexts prevent real service mutation.

Demo simulation is isolated under `packages/engine/src/onboarding/demo/`, behind
the existing `DemoHomeAssistantSession` entry point and runtime value interface.
It derives synthetic IDs from local slots, handles supported commands only in
memory, including media-player play/pause and volume for the simulated demo
speaker and television, lock/unlock, and alarm home/away/disarm. Classless status
sensors start idle, and outdoor devices receive bindings without an area. It resets when remounted or given a different manifest. It never writes
projects/authentication or opens a network connection. Import checks restrict
access to its internals and its dependencies. Dashboard controls and real HA
networking contain no new simulation logic.

OAuth auth data, including tokens, is persisted in browser localStorage when
available; storage failure can leave it session-only. Tokens are not encrypted
by an application server. The configured origin and client identity are checked
when reusing stored auth. Authentication keys include normalized server origin
and OAuth client identity. Homes using the same server can reuse sign-in. Explicit
sign-out removes that server's authentication; deleting a workspace or changing
its configured server does not revoke other homes' credentials. Existing global
keys are adopted once through the isolated workspace migration.

Project data lives in IndexedDB. Runtime mappings and private backups can contain
household area/entity IDs. Public project data and generated home code use typed
local slots. Backup/export formats deliberately omit OAuth credentials and
callback data; they are not a general browser-storage dump. Private mapping
exports remain private household data even without credentials.

No hosted account backend or cloud workspace synchronization is implemented.
An optional owner-installed HA custom integration provides instance-local
workspace storage. Any authenticated user of that HA instance can read or
change its shared Cabane copies. Those copies can contain private area/entity
IDs and draft layouts but omit OAuth tokens, callback data, preview caches,
camera media, and onboarding state. A browser keeps working when this optional
integration or HA is unavailable. The integration is not a Cabane-hosted
service, and real owner-instance deployment acceptance remains pending.
The public `https://cabane.my` deployment uses Vercel Web Analytics to count
application page views through React Router, including personal-home and editor
routes. Workspace IDs are replaced with `:workspaceId`; query strings and
fragments are stripped. No names, project contents, HA data, or custom events
are sent. OAuth routes and URLs containing authentication parameters are excluded
both before loading analytics and before sending a page view. Automatic SDK route
tracking is disabled; React Router owns page navigation. The site uses a
no-referrer policy to avoid forwarding private URLs.
The actual `/welcome`, `/demo`, and `/build` routes distinguish introduction,
demo exploration, and build entry in these ordinary page views. Counts include
direct visits, revisits, and visitors who explore and then build; they do not
represent mutually exclusive first choices or a sequenced conversion funnel.
Closing Welcome also opens Demo. No synthetic page views are emitted.
Vercel provides aggregate counts using a request-derived visitor hash with a
24-hour lifetime; this measures site usage, not unique active households.
Analytics requires a production build with `VITE_PUBLIC_ANALYTICS_ORIGIN` exactly
matching the HTTPS origin. `vercel.json` sets it to `https://cabane.my`; local
builds, previews, and self-hosted installations are disabled by default.
Network reachability and HA authorization
remain deployment concerns. Source policy distinguishes approved bundled assets
and authenticated camera media from generated procedural home content.

Implementation: [runtime provider](../../packages/engine/src/HomeAssistantRuntime.tsx),
[auth storage](../../packages/engine/src/home-assistant-auth.ts),
[command scheduler](../../packages/engine/src/command-scheduler.ts),
[service descriptions](../../packages/engine/src/home-assistant-controls.ts),
[browser transfer](../../packages/engine/src/browser-data-transfer.ts),
[workspace backup](../../apps/web/src/workspaces/workspace-transfer.ts).

[Back to product overview](../../PRODUCT_SPEC.md).

Onboarding selects simulation only for the explicit installation demo identity.
It never falls back to simulation in personal workspaces. The first-control
observer wraps the existing normal call promise and reads the existing runtime
state; it does not command devices independently or add subscriptions. Both
promise-before-state and state-before-promise orderings are supported. A failed
call, stale reading, changed workspace/origin or disconnection cannot activate
onboarding. Guidance progress contains local room/device/slot references, not
exported household identifiers or histories.

Architectural roll-up doors use the existing guarded cover controls in room
controls. Scene selection opens those controls; local proximity and editor
previews never send services. Valid cover percentage takes precedence, followed
by explicit cover open/closed state and valid contact state. Unknown or stale
state retains the last known pose for that binding during the session, or starts
closed. Changing home, opening, or binding identity discards retained state.
