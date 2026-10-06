import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Connection } from "home-assistant-js-websocket";

/** The host owns authentication, reconnection, and the connection's lifetime. */
export interface HomeAssistantHostSession {
  connection: Connection;
  origin: string;
}
const HostSessionContext = createContext<HomeAssistantHostSession | null>(null);
export function HomeAssistantHostSessionProvider({
  session,
  children,
}: {
  session: HomeAssistantHostSession | null;
  children: ReactNode;
}) {
  const connection = session?.connection;
  const origin = session?.origin;
  const value = useMemo(
    () => (connection && origin ? { connection, origin } : null),
    [connection, origin],
  );
  return <HostSessionContext.Provider value={value}>{children}</HostSessionContext.Provider>;
}
export const useHomeAssistantHostSession = () => useContext(HostSessionContext);
