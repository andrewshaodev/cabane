# Set up Home Assistant in Cabane

## Install the integration

The integration repository is currently private. You need GitHub access to view the guide and download it.

Follow the short [installation guide in the integration repository](https://github.com/cabane-app/cabane-home-assistant#installation).
It covers HACS and manual installation, adding `cabane:` to `configuration.yaml`, and restarting Home Assistant.

You only need this integration to store workspaces on Home Assistant. Connecting rooms and devices works without it.

## Open your workspace settings

Open **Home Assistant** from either:

- A workspace’s three-dot menu in **Workspaces**.
- The top-right home menu, below **Edit the home**.
- **Connection settings** at the bottom of the **Connect** sidebar.

The page is specific to the workspace named at the top.

## Connect

Enter your Home Assistant HTTPS URL and click **Connect**. Sign in on Home Assistant and return to Cabane.
Use **Change URL** to choose another instance or **Disconnect** to remove this workspace’s configured connection.

## Save across devices

Click **Enable HA storage**. Cabane checks that the integration is installed before offering storage controls.
If it is missing, follow **Setup guide**, restart Home Assistant, then click **Check again**.

- **Save** uploads this workspace’s published home, draft, and device mappings.
- **Load** replaces this browser’s workspace with the Home Assistant copy. Cabane downloads a backup first.
- **Sync automatically** keeps copies in sync while this workspace is open. Save once before turning it on.
- **Delete saved copy** removes the Home Assistant copy and disables sync. The browser copy remains.

Everyone signed in to the same Home Assistant instance shares its saved workspaces.
If both copies change, Cabane asks which one to keep and downloads the replaced copy first.

## Open a saved home on another device

Open **Workspaces → Import → From Home Assistant**. Enter the same URL, sign in, and choose **Load workspace**.
The home appears in the ordinary workspace grid with a small saved/sync indicator.
Automatic sync is enabled separately in each browser; loading a workspace does not turn it on automatically.

## Keep a file backup

In **Backups**, choose **Export backup** to download a full private workspace file. It includes mappings but never sign-in credentials.
**Import backup** replaces this workspace’s draft. Open the editor to review and save it before it affects the published home.
To import a backup of a different home, use **Workspaces → Import → From a file**.

Use HTTPS for Cabane and Home Assistant. HTTP development is supported only when both URLs are loopback addresses on the same machine.
