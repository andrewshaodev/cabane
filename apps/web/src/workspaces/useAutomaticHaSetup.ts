import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { workspaceDestination } from "./workspace-open-link";

/** Consume setup intent before writing so retries and manual sync-off stay explicit. */
export function useAutomaticHaSetup({
  id,
  origin,
  ready,
  enabled,
  busy,
  start,
}: {
  id: string;
  origin: string | null;
  ready: boolean;
  enabled: boolean;
  busy: boolean;
  start: () => Promise<void>;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const attempted = useRef<string | null>(null);
  useEffect(() => {
    if (workspaceDestination(location.search) !== "dashboard") {
      attempted.current = null;
      return;
    }
    if (!origin || !ready || busy) return;
    const key = `${location.key}:${id}:${origin}`;
    if (attempted.current === key) return;
    attempted.current = key;
    const search = new URLSearchParams(location.search);
    search.delete("action");
    void navigate(
      { pathname: location.pathname, search: search.toString(), hash: location.hash },
      { replace: true },
    );
    if (!enabled) void start();
  }, [location, navigate, id, origin, ready, enabled, busy, start]);
}
