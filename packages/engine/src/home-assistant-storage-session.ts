import type { Connection } from "home-assistant-js-websocket";

/** Every block remains bound to the initiating authenticated HA origin/session. */
export function createSessionStorageSender(
  origin: string | null,
  current: () => {
    origin: string | null;
    connection: Connection | null;
    status: string;
    lifecycle: number;
  },
) {
  return async <T>(message: { type: string; [key: string]: unknown }): Promise<T> => {
    const session = current();
    if (!session.connection || session.status !== "connected" || session.origin !== origin)
      throw new Error("Home Assistant is not connected to this storage session.");
    const result = await session.connection.sendMessagePromise<T>(message);
    const next = current();
    if (
      session.lifecycle !== next.lifecycle ||
      session.connection !== next.connection ||
      next.origin !== origin ||
      next.status !== "connected"
    )
      throw new Error("This Home Assistant session is no longer active.");
    return result;
  };
}
