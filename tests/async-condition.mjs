import { setTimeout } from "node:timers/promises";

// Playwright 1.62's waitForFunction treats a Promise as a truthy result before
// it resolves. Poll asynchronous storage reads here, awaiting every observation.
export async function waitForAsyncCondition(
  predicate,
  { timeout = 10_000, interval = 25, message = "Async condition did not settle" } = {},
) {
  const deadline = performance.now() + timeout;
  do {
    const value = await predicate();
    if (value) return value;
    const remaining = deadline - performance.now();
    if (remaining <= 0) break;
    await setTimeout(Math.min(interval, remaining));
  } while (performance.now() < deadline);
  throw new Error(message);
}
