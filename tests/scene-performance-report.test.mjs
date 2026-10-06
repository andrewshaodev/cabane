import assert from "node:assert/strict";
import { test } from "node:test";
import { compareReports, summarizeMeasurement } from "../scripts/scene-performance/report.mjs";

const frame = (calls, triangles) => ({ calls, triangles, lines: 0, points: 0 });
test("budget uses all-pass peak including shadow refresh and strict thresholds", () => {
  const summary = summarizeMeasurement({ frames: [frame(20, 10_000), frame(30, 20_000), frame(25, 15_000)],
    shadowRefresh: frame(50, 150_000) });
  assert.deepEqual(summary.steady.calls, { min: 20, median: 25, max: 30 });
  assert.deepEqual(summary.peak, { calls: 50, triangles: 150_000 });
  assert.deepEqual(summary.withinBudget, { calls: false, triangles: false });
  const passing = summarizeMeasurement({ frames: [frame(49, 99_999)], shadowRefresh: frame(1, 1) });
  assert.deepEqual(passing.withinBudget, { calls: true, triangles: true });
  assert.throws(() => summarizeMeasurement({ frames: [], shadowRefresh: frame(0, 0) }), /No rendered frames/);
});

test("comparisons report signed deltas and reject incompatible or incomplete baselines", () => {
  const report = peak => ({ schemaVersion: 1, configuration: { samples: 3 }, scenarios: [{ id: "orbit", summary: { peak } }] });
  const current = report({ calls: 40, triangles: 90_000 });
  const baseline = report({ calls: 100, triangles: 120_000 });
  assert.deepEqual(compareReports(current, baseline).orbit, {
    calls: { before: 100, after: 40, delta: -60, percent: -60 },
    triangles: { before: 120_000, after: 90_000, delta: -30_000, percent: -25 },
  });
  assert.throws(() => compareReports(current, { ...baseline, configuration: { samples: 10 } }), /configuration differs/);
  assert.throws(() => compareReports(current, { ...baseline, scenarios: [] }), /missing scenario/);
  assert.throws(() => compareReports(current, report({ calls: null, triangles: 1 })), /Invalid baseline metric/);
  assert.equal(compareReports(current, report({ calls: 0, triangles: 0 })).orbit.calls.percent, null);
});
