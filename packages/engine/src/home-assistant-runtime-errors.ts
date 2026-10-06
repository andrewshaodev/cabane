import {
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  ERR_INVALID_AUTH_CALLBACK,
  ERR_INVALID_HTTPS_TO_HTTP,
} from "home-assistant-js-websocket";

export const isAuthenticationError = (error: unknown) =>
  error === ERR_INVALID_AUTH || error === ERR_INVALID_AUTH_CALLBACK;

export const homeAssistantErrorMessage = (error: unknown) => {
  if (isAuthenticationError(error)) {
    return "Your Home Assistant authorization expired. Connect again to continue.";
  }
  if (error === ERR_INVALID_HTTPS_TO_HTTP) {
    return "A secure dashboard cannot connect to an insecure Home Assistant URL.";
  }
  if (error === ERR_CANNOT_CONNECT) {
    return "Home Assistant could not be reached. Check the configured URL and network.";
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Home Assistant returned an unexpected connection error.";
};
