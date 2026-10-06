/** One press, one shot; suppress repeats while a control is pending. */
export function createShotGate(cooldownMs = 300) {
  let pending = false;
  let nextShotAt = 0;
  return async (now: number, shoot: () => Promise<void>) => {
    if (pending || now < nextShotAt) return false;
    pending = true;
    nextShotAt = now + cooldownMs;
    try { await shoot(); } finally { pending = false; }
    return true;
  };
}
