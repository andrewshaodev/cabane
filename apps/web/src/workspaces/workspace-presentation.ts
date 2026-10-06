const LAST_OPENED_KEY = "cabane:last-opened-workspace";
const previewKey = (id: string) => `cabane:workspace-preview:${id}`;

export function lastOpenedWorkspace(): string | null {
  try { return window.localStorage.getItem(LAST_OPENED_KEY); } catch { return null; }
}
export function rememberWorkspace(id: string) {
  try { window.localStorage.setItem(LAST_OPENED_KEY, id); } catch { /* Optional navigation preference. */ }
}
export function readWorkspacePreview(id: string): string | null {
  try { return window.localStorage.getItem(previewKey(id)); } catch { return null; }
}
export function saveWorkspacePreview(id: string, source: HTMLCanvasElement) {
  if (!source.width || !source.height) return;
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(640 / source.width, 480 / source.height, 1);
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    window.localStorage.setItem(previewKey(id), canvas.toDataURL("image/webp", 0.75));
  } catch { /* Previews are disposable; storage limits must never block a home. */ }
}
export function forgetWorkspacePresentation(id: string) {
  try {
    window.localStorage.removeItem(previewKey(id));
    if (lastOpenedWorkspace() === id) window.localStorage.removeItem(LAST_OPENED_KEY);
  } catch { /* Non-authoritative browser cache. */ }
}
