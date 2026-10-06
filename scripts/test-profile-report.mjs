export function summarizeTestRuns(runs) {
  if (!runs.length) throw new Error("No test runs to summarize");
  const durations = runs.map((run) => run.elapsedMs).sort((a, b) => a - b);
  if (durations.some((duration) => !Number.isFinite(duration) || duration < 0))
    throw new Error("Invalid test run duration");
  const middle = Math.floor(durations.length / 2);
  const files = new Map();
  for (const run of runs)
    for (const worker of run.workers)
      for (const test of worker.durations ?? []) {
        if (!test.file) continue;
        const entry = files.get(test.file) ?? { file: test.file, durationMs: 0, tests: 0 };
        entry.durationMs += test.duration / runs.length;
        entry.tests += 1 / runs.length;
        files.set(test.file, entry);
      }
  return {
    version: 1,
    passed: runs.every((run) => run.passed),
    medianMs:
      durations.length % 2 ? durations[middle] : (durations[middle - 1] + durations[middle]) / 2,
    files: [...files.values()].sort((a, b) => b.durationMs - a.durationMs),
    runs,
  };
}

export function compareTestProfiles(baseline, current) {
  const inventory = (run) =>
    run.workers
      .flatMap((worker) =>
        worker.durations.map(({ file, name, status }) => JSON.stringify([file, name, status])),
      )
      .sort();
  const first = JSON.stringify(inventory(baseline.runs[0]));
  if (
    ![...baseline.runs, ...current.runs].every(
      (run) => run.passed && JSON.stringify(inventory(run)) === first,
    )
  )
    throw new Error("Cannot compare failed runs or different test inventories/statuses");
  return (1 - current.medianMs / baseline.medianMs) * 100;
}
