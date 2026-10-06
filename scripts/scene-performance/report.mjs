import { isDeepStrictEqual } from "node:util";

export const SCENARIOS = ["orbit", "walk", "construct", "arrange"];
export const BUDGETS = { calls: 50, triangles: 150_000 };

export function summarizeMeasurement(measurement) {
  if (!measurement.frames.length) throw new Error("No rendered frames were measured.");
  const summarize = metric => {
    const values = measurement.frames.map(frame => frame[metric]).sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    return { min: values[0], median: values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2,
      max: values.at(-1) };
  };
  const steady = Object.fromEntries(["calls", "triangles", "lines", "points"].map(metric => [metric, summarize(metric)]));
  const peak = Object.fromEntries(Object.keys(BUDGETS).map(metric => [metric,
    Math.max(steady[metric].max, measurement.shadowRefresh[metric])]));
  return { steady, peak, withinBudget: Object.fromEntries(Object.entries(BUDGETS)
    .map(([metric, limit]) => [metric, peak[metric] < limit])) };
}

export function compareReports(report, baseline) {
  if (baseline.schemaVersion !== report.schemaVersion
    || !isDeepStrictEqual(baseline.configuration, report.configuration)) {
    throw new Error("Baseline schema/configuration differs. Use the same viewport, scenarios, samples, and fixed date.");
  }
  return Object.fromEntries(report.scenarios.map(current => {
    const previous = baseline.scenarios.find(candidate => candidate.id === current.id);
    if (!previous) throw new Error(`Baseline is missing scenario ${current.id}.`);
    return [current.id, Object.fromEntries(Object.keys(BUDGETS).map(metric => {
      const before = previous.summary?.peak?.[metric];
      if (!Number.isFinite(before)) throw new Error(`Invalid baseline metric ${current.id}.${metric}.`);
      const after = current.summary.peak[metric];
      return [metric, { before, after, delta: after - before, percent: before === 0 ? null : (after - before) / before * 100 }];
    }))];
  }));
}
