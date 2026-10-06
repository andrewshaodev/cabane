import { EditorIcon } from "../editor-chrome/EditorIcon";
import { HA_INTEGRATION_GUIDE, HA_INTEGRATION_REPOSITORY } from "./ha-integration-links";

export function WorkspaceHaInstall({ origin, checking, panelError, onCheck }: {
  origin: string; checking: boolean; panelError: boolean; onCheck: () => void;
}) {
  return <div className="ha-setup-surface">
    <h3>{panelError ? "Could not check the Cabane sidebar" : "Install Cabane"}</h3>
    {panelError ? <p>Try again when Home Assistant is available.</p> : <>
      <p>Add Cabane to your Home Assistant sidebar.</p>
      <ol className="ha-install-steps">
        <li>In HACS, add <a href={HA_INTEGRATION_REPOSITORY} target="_blank" rel="noreferrer">cabane-app/cabane-home-assistant</a> as a custom repository of type <strong>Integration</strong>.</li>
        <li>Download or update Cabane, then restart Home Assistant.</li>
        <li>In <strong>Settings → Devices &amp; services</strong>, choose <strong>Add integration → Cabane</strong>.</li>
      </ol>
      <div className="ha-actions"><a className="ha-primary ha-link-button" href={`${origin}/hacs`} target="_blank" rel="noreferrer">Install with HACS<EditorIcon name="external" /></a>
        <a href={`${origin}/config/integrations/dashboard`} target="_blank" rel="noreferrer">Open integrations<EditorIcon name="external" /></a></div>
    </>}
    <button className="ha-check-install" disabled={checking} onClick={onCheck}>{checking ? "Checking…" : "Check again"}</button>
    {!panelError && <details className="ha-setup-disclosure"><summary>Install manually or get help</summary>
      <p>Use the full cabane.zip release, including its frontend. Restart Home Assistant, then add the Cabane integration.</p>
      <a href={HA_INTEGRATION_GUIDE} target="_blank" rel="noreferrer">Setup guide<EditorIcon name="external" /></a>
    </details>}
  </div>;
}
