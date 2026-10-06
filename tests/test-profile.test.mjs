import assert from "node:assert/strict";
import test from "node:test";
import { summarizeTestRuns, compareTestProfiles } from "../scripts/test-profile-report.mjs";

const run = (
  elapsedMs,
  tests = [{ file: "tests/a.test.mjs", name: "first", status: "passed", duration: 10 }],
) => ({
  elapsedMs,
  passed: true,
  workers: [{ durations: tests }],
});
test("test profiles use medians and aggregate every worker by original file", () => {
  const runs = [run(100), run(300), run(200)];
  runs[0].workers.push({
    durations: [{ file: "tests/a.test.mjs", name: "second", status: "passed", duration: 30 }],
  });
  const summary = summarizeTestRuns(runs);
  assert.equal(summary.medianMs, 200);
  assert.equal(summary.files[0].durationMs, 20);
  assert.equal(summarizeTestRuns([run(100), run(200)]).medianMs, 150);
  assert.throws(() => summarizeTestRuns([]), /No test runs/);
  assert.throws(() => summarizeTestRuns([run(NaN)]), /Invalid/);
});
test("profile comparisons reject failed, skipped, renamed or missing coverage", () => {
  const baseline = summarizeTestRuns([run(200)]);
  assert.equal(compareTestProfiles(baseline, summarizeTestRuns([run(100)])), 50);
  for (const candidate of [
    { ...run(100), passed: false },
    run(100, []),
    run(100, [{ file: "tests/a.test.mjs", name: "first", status: "skipped", duration: 1 }]),
    run(100, [{ file: "tests/a.test.mjs", name: "renamed", status: "passed", duration: 1 }]),
  ])
    assert.throws(
      () => compareTestProfiles(baseline, summarizeTestRuns([candidate])),
      /Cannot compare/,
    );
});
