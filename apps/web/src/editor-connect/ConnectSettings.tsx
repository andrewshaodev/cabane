import { useId, type ReactNode } from "react";
import { EditorIcon, type EditorIconName } from "../editor-chrome/EditorIcon";
import { WorkspaceHaStorageInConnect } from "../workspaces/WorkspaceHaStorage";

export function ConnectSettingAction({ icon, children, onClick, disabled, danger }: {
  icon: EditorIconName; children: ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return <button type="button" className={`connect-setting-action${danger ? " is-danger" : ""}`} disabled={disabled} onClick={onClick}>
    <EditorIcon name={icon} /><span>{children}</span><EditorIcon name="chevron" />
  </button>;
}

export function ConnectImportAction({ children, disabled, onImport }: {
  children: ReactNode; disabled: boolean; onImport: (file: File) => void;
}) {
  const id = useId();
  return <label className="connect-setting-action connect-file-action" htmlFor={id}>
    <EditorIcon name="import" /><span>{children}</span><EditorIcon name="chevron" />
    <input id={id} type="file" accept="application/json,.json" disabled={disabled} onChange={(event) => {
      const file = event.target.files?.[0]; event.target.value = "";
      if (file) onImport(file);
    }} />
  </label>;
}

export function ConnectSettings({ origin, disconnected, busy, backup, onBack, onChangeAddress, onReconnect, onDisconnect,
  onBackupView, onImportProfile, onExportProfile, onExportBackup, onImportBackup, onExportProject, onDiscard }: {
  origin: string | null; disconnected: boolean; busy: boolean; backup: boolean;
  onBack: () => void; onChangeAddress: () => void; onReconnect: () => void; onDisconnect: () => void;
  onBackupView: () => void; onImportProfile: (file: File) => void; onExportProfile: () => void;
  onExportBackup: () => void; onImportBackup: (file: File) => void; onExportProject: () => void; onDiscard: () => void;
}) {
  return <section className="connect-settings-panel">
    <button type="button" className="connect-back" onClick={onBack}><EditorIcon name="back" />{backup ? "Connection settings" : "Back to connections"}</button>
    <header className="connect-inspector__heading"><h3>{backup ? "Backup & restore" : "Connection settings"}</h3></header>
    {backup ? <>
      <ConnectSettingAction icon="export" disabled={busy} onClick={onExportBackup}>Export private workspace backup<small>Draft, applied home, and connections</small></ConnectSettingAction>
      <ConnectImportAction disabled={busy} onImport={onImportBackup}>Import backup into this draft<small>Review the imported draft before Save</small></ConnectImportAction>
      <ConnectSettingAction icon="export" disabled={busy} onClick={onExportProject}>Export portable home project<small>Home geometry without Home Assistant IDs</small></ConnectSettingAction>
      <p className="connect-note">Private backups include Home Assistant IDs, never credentials.</p>
      <ConnectSettingAction icon="undo" danger disabled={busy} onClick={onDiscard}>Discard draft changes<small>Restore the applied home and connections</small></ConnectSettingAction>
    </> : <>
      <div className="connect-origin"><EditorIcon name="connect" /><div><strong>Home Assistant</strong><span>{origin ?? "No address configured"}</span></div><i className={disconnected ? "" : "is-connected"} /></div>
      <ConnectSettingAction icon="settings" disabled={busy} onClick={onChangeAddress}>Change address</ConnectSettingAction>
      <ConnectSettingAction icon="connect" disabled={busy || !origin} onClick={disconnected ? onReconnect : onDisconnect}>{disconnected ? "Reconnect" : "Disconnect"}</ConnectSettingAction>
      <WorkspaceHaStorageInConnect />
      <h3>Connection profile</h3>
      <ConnectImportAction disabled={busy || !origin} onImport={onImportProfile}>Import connections</ConnectImportAction>
      <ConnectSettingAction icon="export" disabled={busy || !origin} onClick={onExportProfile}>Export connections<small>Applied connections only</small></ConnectSettingAction>
      <h3>Project files</h3>
      <ConnectSettingAction icon="export" onClick={onBackupView}>Backup & restore</ConnectSettingAction>
      <p className="connect-note">Connection profiles include Home Assistant IDs. Credentials are never exported.</p>
    </>}
  </section>;
}
