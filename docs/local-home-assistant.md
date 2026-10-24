# Local Home Assistant test server

Run a real Home Assistant with synthetic entities alongside Cabane. Docker with
Compose is required (Docker Desktop or Colima on macOS). No household HA instance
or credentials are needed.

```sh
npm run ha:up
npm run dev
```

The first run downloads the pinned HA image and Cabane integration source, then
builds the native panel from this checkout. It can take several minutes. Git,
Node and installed npm dependencies are required in addition to Docker.
`ha:up` waits for the HTTP server to become healthy. Open
<http://127.0.0.1:8123> and complete HA onboarding with a **local test account**.
Skip optional integration discovery. Keep that password in your password manager.
The checked-in configuration uses synthetic coordinates.

Open Cabane at <http://127.0.0.1:4173>, create a personal workspace with **Build**,
then open its **Home Assistant** settings. Enter `http://127.0.0.1:8123`, click
**Connect**, and sign in with the test account. Use **Connect** mode to map the
demo entities to your home. The built-in **Explore the demo** workspace stays
simulated and does not connect to this server.

Both URLs must use loopback HTTP on the same machine. If Vite selects a different
port, free port 4173 and restart it, or add that exact origin to
`dev/home-assistant/configuration.yaml` and restart HA.

## What is available

The [official HA Demo integration](https://www.home-assistant.io/integrations/demo/)
loads fake lights, switches, covers, climate, sensors, fans, locks, media players,
cameras, vacuums, weather, and other platforms. Controls use HA's real service and
WebSocket APIs; simulated behavior varies by platform. These entities do not
establish real hardware or camera-stream compatibility. Some demo assets may
require internet access.

## Native panel and local development

Cabane is installed automatically from the commit pinned in `scripts/ha-dev.mjs`.
The YAML configuration imports its integration entry on startup. After HA
onboarding, open **Cabane** in the sidebar or <http://127.0.0.1:8123/cabane>.
It uses your HA session; no second login or token is needed.

```sh
npm run ha:refresh
```

This rebuilds the panel from the current checkout, including uncommitted edits,
stops the test HA, replaces its integration and frontend, and starts it again.
Reload the browser afterward. This is a build/restart workflow, not Vite HMR.
`ha:up` reuses the installed build; use `ha:refresh` after changing frontend code
or switching checkouts. A failed build leaves the running installation alone.

Generated integration files live under ignored `test-results/ha-dev/`. Only this
local copy receives a small adapter allowing development-marked bundles when
`CABANE_LOCAL_DEVELOPMENT=1` is set in the test container. Asset checksums and
inventory validation still apply. Upstream integration and release gates remain
unchanged. Never distribute this local installation as a release.

## Try workspace synchronization

1. In the native panel, create a personal workspace with **Build**.
2. Open its **Home Assistant** settings and choose **Use this Home Assistant**.
3. Click **Enable sync**, then publish a small home with **Save**.
4. Open standalone Cabane at <http://127.0.0.1:4173> in another browser or profile.
   Choose **Workspaces → Import workspace → From Home Assistant**, sign in to
   `http://127.0.0.1:8123`, and select the saved home.
5. Edit and save in one client; verify the change arrives in the other with
   automatic sync enabled. Keep only one client editing at a time unless testing
   conflict handling.

HA stores workspaces and personal models in the persistent Docker volume. Both
clients must select this same HA instance; browser storage is separate. The
built-in Cabane demo intentionally cannot be synchronized. Fake devices are
already supplied by `demo:` in the HA YAML; no additional developer-mode toggle
is necessary.

## Lifecycle and data

```sh
npm run ha:logs   # Follow server logs (Ctrl-C only stops following)
npm run ha:check  # Validate HA configuration in the running container
npm run ha:down   # Stop the server; retain the test account and HA state
npm run ha:up     # Start it again
npm run ha:refresh # Rebuild local Cabane and restart HA
```

After editing the YAML, run `ha:check`, then `ha:down` and `ha:up`.
HA state, authentication and history live in the Docker volume
`cabane-ha-dev_config`, outside Git. The configuration file is mounted read-only.
The fixed Compose project name intentionally shares one test instance across
checkouts; stop it before switching to another checkout's configuration.
The server binds only to `127.0.0.1:8123`, with no host networking, privileged
mode, hardware mounts or automatic LAN discovery. It does not restart on boot.

To **erase only this test server's account and state**, run:

```sh
docker compose -f dev/home-assistant/compose.yaml down --volumes
```

This does not erase Cabane's browser workspaces. If port 8123 is occupied, stop
the conflicting local service or change the host port in Compose and use that
port in Cabane. Update the pinned image in `compose.yaml` deliberately and repeat
the connection/control smoke test when upgrading HA.
