# Cabane storage for Home Assistant

This optional custom integration stores full Cabane workspaces on one Home Assistant instance. Every signed-in Home Assistant user can list, read, replace, and delete the saved workspaces. A workspace includes drafts and household area/entity mappings; it never includes Cabane OAuth tokens.

## Install manually

1. Copy `ha_custom_components/cabane` from this repository into `<Home Assistant config>/custom_components/cabane` on your Home Assistant host.
2. Add `cabane:` as a top-level line in Home Assistant's `configuration.yaml`, then restart Home Assistant. No HACS repository is required.
3. Open a personal Cabane workspace, connect to that Home Assistant instance, then open **Connect → Connection settings → Workspace storage** and choose **Save to HA**. Turn on **Sync automatically** only if wanted.
4. To restore in another browser, open **Workspaces → Restore from Home Assistant**, enter the same HA address, sign in, and choose **Restore**.

If Cabane reports that storage is unavailable, check the Home Assistant log for an integration loading error, confirm the installed files and version, and restart HA. Removing the integration disables remote access but does not remove browser copies. Before removing its data, export a private Cabane backup and keep an HA backup outside the instance.

The integration stores its documents in Home Assistant's persistent `.storage` area. Do not edit those files by hand. HA backups that include the configuration directory can include this data; confirm your installation's backup settings.
