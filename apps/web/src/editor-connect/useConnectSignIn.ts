import { useEffect, useRef, useState } from "react";
import type { HomeAssistantRuntimeValue } from "@cabane/engine";

/** Wait for the new origin's runtime before consuming an explicit sign-in intent. */
export function useConnectSignIn(runtime: HomeAssistantRuntimeValue, prepare: (origin: string) => Promise<void>) {
  const [requestedOrigin, setRequestedOrigin] = useState<string | null>(null);
  const preparing = useRef(false);
  useEffect(() => {
    if (!requestedOrigin || runtime.origin !== requestedOrigin || runtime.status === "unconfigured") return;
    if (["authenticating", "connecting", "reconnecting"].includes(runtime.status)) return;
    setRequestedOrigin(null);
    // retry() only resumes stored auth; a fresh or expired login needs connect().
    if (runtime.status !== "connected") runtime.connect();
  }, [requestedOrigin, runtime]);
  return async (origin: string) => {
    if (preparing.current || requestedOrigin) return;
    preparing.current = true;
    try { await prepare(origin); setRequestedOrigin(origin); }
    finally { preparing.current = false; }
  };
}
