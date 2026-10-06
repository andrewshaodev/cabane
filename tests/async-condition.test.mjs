import assert from "node:assert/strict";
import test from "node:test";
import { waitForAsyncCondition } from "./async-condition.mjs";

test("async condition polling awaits false observations and returns the settled value", async () => {
  let observations = 0;
  const value = { persisted: true };
  assert.equal(
    await waitForAsyncCondition(
      async () => {
        await Promise.resolve();
        return ++observations === 3 ? value : false;
      },
      { interval: 0 },
    ),
    value,
  );
  assert.equal(observations, 3);
});
test("async condition polling surfaces read failures and bounded timeouts", async () => {
  const failure = new Error("IndexedDB failed");
  await assert.rejects(
    waitForAsyncCondition(async () => {
      throw failure;
    }),
    (error) => error === failure,
  );
  await assert.rejects(
    waitForAsyncCondition(async () => false, { timeout: 0, message: "Draft did not persist" }),
    /Draft did not persist/,
  );
});
