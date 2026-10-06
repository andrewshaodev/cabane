import { useHomeAssistantHostSession } from "@cabane/engine";
import { useEffect, useState } from "react";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { createWorkspaceOpenLink, type WorkspaceDestination } from "./workspace-open-link";

export function WorkspaceDestinations({ id, origin, intent, ready, panelReady }: {
  id: string; origin: string; intent: WorkspaceDestination | null; ready: boolean; panelReady: boolean;
}) {
  const hostSession = useHomeAssistantHostSession();
  const [selected, setSelected] = useState<"dashboard" | "device" | null>(intent === "device" ? intent : null);
  const [notice, setNotice] = useState("");
  useEffect(() => { if (intent === "device") setSelected(intent); }, [intent]);
  const link = hostSession ? "" : createWorkspaceOpenLink(window.location.origin, id, origin, selected === "dashboard");

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setNotice("Link copied."); }
    catch { setNotice("Select the URL above to copy it."); }
  };
  if (hostSession) return <div className="ha-destinations">
    <h3>Open your home on another device</h3>
    <p>Open Cabane in your Home Assistant sidebar on the other device. Choose Workspaces → Import workspace → From Home Assistant to select this home.</p>
    {!ready && <p role="status">Waiting for this home to finish syncing. Your changes are saved in this browser.</p>}
  </div>;
  return <div className="ha-destinations">
    {panelReady && ready && <div className="ha-setup-surface">
      <h3>Your home is ready</h3><p>Find Cabane in your Home Assistant sidebar.</p>
      <div className="ha-sidebar-preview" aria-label="Cabane sidebar entry"><EditorIcon name="roof" />Cabane<EditorIcon name="check" /></div>
      <a className="ha-primary ha-link-button" href={`${origin}/cabane`} target="_blank" rel="noreferrer">Open in Home Assistant<EditorIcon name="external" /></a>
      <details className="ha-setup-disclosure"><summary>Using the mobile app?</summary><p>Open the Home Assistant app, open its sidebar, and choose Cabane. Use the same Home Assistant instance.</p></details>
      <details className="ha-setup-disclosure"><summary>Home not showing up?</summary><p>In Cabane’s sidebar panel, choose Import workspace → From Home Assistant and open this home. Older versions may call this Open from Home Assistant.</p></details>
    </div>}
    <details className="ha-setup-disclosure" open={intent === "device" || undefined}><summary>Other ways to open this home</summary>
    <div className="ha-actions">
      <button aria-pressed={selected === "dashboard"} onClick={() => { setSelected("dashboard"); setNotice(""); }}><EditorIcon name="grid" />Use a Webpage card</button>
      <button aria-pressed={selected === "device"} onClick={() => { setSelected("device"); setNotice(""); }}><EditorIcon name="external" />Open on another device</button>
    </div>
    {selected && <div className="ha-destination-detail">
      <h3>{selected === "dashboard" ? "Add a Webpage card in Home Assistant" : "Open your home on another device"}</h3>
      <p>{selected === "dashboard" ? "Paste this URL into the card. Sign in when it first opens." : "Send this link to your other browser or device, then sign in to HA."}</p>
      {ready ? <><label htmlFor="ha-workspace-link">{selected === "dashboard" ? "Dashboard URL" : "Workspace URL"}</label>
        <input id="ha-workspace-link" readOnly value={link} onFocus={event => event.currentTarget.select()} />
        <button onClick={() => void copy()}><EditorIcon name="duplicate" />{selected === "dashboard" ? "Copy dashboard URL" : "Copy link"}</button>
      </> : <p role="status">Waiting for this home to finish syncing. Your changes are saved in this browser.</p>}
      {notice && <p className="ha-notice" role="status">{notice}</p>}
    </div>}
    </details>
  </div>;
}
