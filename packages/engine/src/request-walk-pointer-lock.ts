/** Call during the entry click so browsers retain transient user activation. */
export function requestWalkPointerLock(target: HTMLElement): Promise<void> {
  const root = target.getRootNode() as Document | ShadowRoot;
  if (root.pointerLockElement === target) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      document.removeEventListener("pointerlockchange", changed);
      document.removeEventListener("pointerlockerror", failed);
    };
    const failed = () => {
      cleanup();
      reject(new Error("Pointer lock was not granted."));
    };
    const changed = () => {
      if (root.pointerLockElement !== target) return;
      cleanup();
      resolve();
    };
    const timeout = setTimeout(failed, 5000);
    document.addEventListener("pointerlockchange", changed);
    document.addEventListener("pointerlockerror", failed);
    try {
      if (!target.requestPointerLock) {
        failed();
        return;
      }
      // Older browsers return void and report completion through events.
      const request = target.requestPointerLock();
      if (request) void request.then(changed, failed);
    } catch {
      failed();
    }
  });
}
