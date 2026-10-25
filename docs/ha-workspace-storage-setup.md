# Set up Home Assistant in Cabane

## Install the integration

Requires Home Assistant 2024.7 or newer, HACS, and HTTPS.

1. In **HACS → ⋮ → Custom repositories**, add `https://github.com/cabane-app/cabane-home-assistant` as an **Integration**.
2. Download **Cabane**, then restart Home Assistant.
3. Open **Settings → Devices & services → Add integration → Cabane** and confirm.
4. Open **Cabane** from the sidebar.

The integration registers the native sidebar panel and provides instance-local
workspace storage. Standalone device connections work without it. See the
[integration guide](https://github.com/cabane-app/cabane-home-assistant#install)
for manual installation and troubleshooting.

## Open your workspace settings

Open **Home Assistant** from either:

- A workspace’s three-dot menu in **Workspaces**.
- The top-right home menu, below **Edit the home**.
- **Connection settings** at the bottom of the **Connect** sidebar.

The page is specific to the workspace named at the top.

## Connect

Enter your Home Assistant HTTPS URL and click **Connect**. Sign in on Home Assistant and return to Cabane.
Use **Change URL** to choose another instance or **Disconnect** to remove this workspace’s configured connection.

Inside the native panel, choose **Use this Home Assistant** to use the existing
host session. The demo remains simulated; create a personal workspace to connect
your devices.

## Save across devices

Cabane checks that the integration is installed before offering storage controls.
If it is missing, follow the installation steps, restart Home Assistant, then click **Check again**.

The **Add Cabane to Home Assistant** flow automatically saves and enables sync for
the selected home once the integration and sidebar panel are ready. If saving
fails or copies conflict, use the displayed manual controls to continue.

You can also click **Enable sync** to save the workspace’s published home, draft, device
mappings and personal models, and synchronize changes while it is open. Offline
changes remain in the browser until it reconnects.

Under **Manage saved copy**:

- **Save a copy now** uploads the current workspace.
- **Load saved copy** replaces this browser’s workspace with the Home Assistant copy. Cabane downloads a backup first.
- **Sync automatically** turns off ongoing synchronization when disabled.
- **Delete saved copy** removes the Home Assistant copy and disables sync. The browser copy remains.

Everyone signed in to the same Home Assistant instance shares its saved workspaces.
If both copies change, Cabane asks which one to keep and downloads the replaced copy first.

## Open a saved home on another device

Open **Workspaces → Import workspace → From Home Assistant**. On the website,
sign in to the same instance; the native panel uses its host session. Choose the
saved home to open it with sync enabled. Saved homes missing from the native
panel’s local library also appear as dotted cards that you can open directly.

The website and native panel have separate browser storage. Save your home to
Home Assistant, then open it from the other client, or transfer a private file
backup.

## Keep a file backup

In **Backups**, choose **Export backup** to download a full private workspace file. It includes mappings but never sign-in credentials.
**Import backup** replaces this workspace’s draft. Open the editor to review and save it before it affects the published home.
To import a backup of a different home, use **Workspaces → Import → From a file**.

Use HTTPS for Cabane and Home Assistant. HTTP development is supported only when both URLs are loopback addresses on the same machine.
