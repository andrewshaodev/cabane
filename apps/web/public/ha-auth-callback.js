// This page never opens a workspace or exchanges/persists credentials.
const params = new URLSearchParams(window.location.search);
window.history.replaceState(null, "", window.location.pathname);
const code = params.get("code");
const state = params.get("state");
if (window.opener && code && state) {
  window.opener.postMessage({ type: "cabane:ha-authorization", code, state }, window.location.origin);
  document.getElementById("status").textContent = "Return to Cabane. You can close this window.";
} else {
  document.getElementById("status").textContent = "Sign-in could not return to Cabane. Close this window and connect again.";
}
