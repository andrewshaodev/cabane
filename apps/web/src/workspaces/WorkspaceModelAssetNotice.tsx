import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  createModelAssetRepository,
  modelAssetReferences,
  type HomeProjectRecord,
} from "@cabane/engine";

/** Missing local bytes leave the scene visible while offering a complete restore. */
export function WorkspaceModelAssetNotice({
  record,
  id,
}: {
  record: HomeProjectRecord;
  id: string;
}) {
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    setUnavailable(false);
    const refs = modelAssetReferences([record.draft, record.published]);
    if (refs.length)
      void createModelAssetRepository(window.indexedDB)
        .verify(refs)
        .catch(() => {
          if (active) setUnavailable(true);
        });
    return () => {
      active = false;
    };
  }, [record]);
  if (!unavailable) return null;
  return (
    <div className="workspace-connection-error workspace-model-assets-error" role="alert">
      <strong>Some personal models could not load.</strong>
      <span>
        A GLB file is missing, damaged, or unavailable. Restore a complete .cabane backup or load
        the saved home from Home Assistant.
      </span>
      <div>
        <Link to="/workspaces">Workspaces</Link>
        <Link to={`/workspaces/${encodeURIComponent(id)}/home-assistant`}>Home Assistant</Link>
        <button onClick={() => window.location.reload()}>Try again</button>
      </div>
    </div>
  );
}
