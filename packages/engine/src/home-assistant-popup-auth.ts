import { createBrowserUuid } from "./browser-uuid";
/** Keep HA's authorization page out of its own dashboard iframe. */
export const requestPopupAuthorizationCode = (
  host: Window,
  hassUrl: string,
  isCurrent: () => boolean,
): Promise<string> => {
  const state = createBrowserUuid(host.crypto);
  const authorize = new URL("/auth/authorize", hassUrl);
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: host.location.origin,
    redirect_uri: new URL("/ha-auth-callback.html", host.location.origin).href,
    state,
  }).toString();
  // Called synchronously from Connect so browsers retain the user activation.
  const popup = host.open(authorize.href, "_blank", "popup,width=480,height=720");
  if (!popup) return Promise.reject(new Error("Allow popups for Cabane, then connect again."));
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      host.removeEventListener("message", receive);
      host.clearInterval(timer);
      popup.close();
    };
    const receive = (event: MessageEvent<unknown>) => {
      if (!event.data || typeof event.data !== "object") return;
      const data = event.data as Record<string, unknown>;
      if (
        event.origin !== host.location.origin ||
        event.source !== popup ||
        data.type !== "cabane:ha-authorization" ||
        data.state !== state
      )
        return;
      if (!isCurrent()) {
        cleanup();
        reject(new Error("Home Assistant sign-in was cancelled."));
        return;
      }
      if (typeof data.code !== "string" || !data.code) return;
      cleanup();
      resolve(data.code);
    };
    host.addEventListener("message", receive);
    const deadline = Date.now() + 5 * 60_000;
    const timer = host.setInterval(() => {
      if (!isCurrent() || popup.closed || Date.now() >= deadline) {
        cleanup();
        reject(new Error("Home Assistant sign-in was closed or expired. Connect again to retry."));
      }
    }, 500);
  });
};
