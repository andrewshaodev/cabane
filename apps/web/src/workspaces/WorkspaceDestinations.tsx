import { useHomeAssistantHostSession } from "@cabane/engine";
import { useEffect, useState } from "react";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { createWorkspaceOpenLink, type WorkspaceDestination } from "./workspace-open-link";

export function WorkspaceDestinations({ id, origin, intent, ready }: {
  id: string; origin: string; intent: WorkspaceDestination | null; ready: boolean;
}) {
  const hostSession = useHomeAssistantHostSession();
  const [selected, setSelected] = useState<"dashboard" | "device" | null>(intent === "dashboard" || intent === "device" ? intent : null);
  const [notice, setNotice] = useState("");
  useEffect(() => { if (intent === "dashboard" || intent === "device") setSelected(intent); }, [intent]);
  const link = hostSession ? "" : createWorkspaceOpenLink(window.location.origin, id, origin, selected === "dashboard");
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setNotice("Link copied."); }
    catch { setNotice("Select the URL above to copy it."); }
  };
  if (hostSession) return <div className="ha-destinations">
    <h3>Open your home on another device</h3>
    <p>Open Cabane in your Home Assistant sidebar on the other device. Choose Workspaces, then Open from Home Assistant to select this home.</p>
    {!ready && <p role="status">Waiting for this home to finish syncing. Your changes are saved in this browser.</p>}
  </div>;
  return <div className="ha-destinations">
    <div className="ha-actions">
      <button aria-pressed={selected === "dashboard"} onClick={() => { setSelected("dashboard"); setNotice(""); }}><EditorIcon name="grid" />Add to HA dashboard</button>
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
  </div>;
}
