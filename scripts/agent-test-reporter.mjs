import { dot } from "node:test/reporters";

async function* track(source, summary) {
  for await (const event of source) {
    if (event.type === "test:pass" || event.type === "test:fail") {
      const skipped = Boolean(event.data.skip);
      const todo = Boolean(event.data.todo);
      if (todo) summary.todo += 1;
      else if (skipped) summary.skipped += 1;
      else if (event.type === "test:pass") summary.passed += 1;
      else summary.failed += 1;
      const duration = event.data.details?.duration_ms;
      if (typeof duration === "number") summary.durations.push({
        duration,
        name: event.data.name,
      });
    }
    yield event;
  }
}

export default async function* agentTestReporter(source) {
  const startedAt = performance.now();
  const summary = { passed: 0, failed: 0, skipped: 0, todo: 0, durations: [] };
  yield* dot(track(source, summary));
  const durationSeconds = ((performance.now() - startedAt) / 1_000).toFixed(2);
  const details = [
    `${summary.passed} passed`,
    `${summary.failed} failed`,
    summary.skipped ? `${summary.skipped} skipped` : null,
    summary.todo ? `${summary.todo} todo` : null,
  ].filter(Boolean).join(", ");
  yield `${details} in ${durationSeconds}s\n`;
  if (process.env.TEST_PROFILE === "1") {
    const slowest = summary.durations
      .sort((left, right) => right.duration - left.duration)
      .slice(0, 15);
    yield `Slowest tests:\n${slowest.map(({ duration, name }) =>
      `  ${duration.toFixed(1)}ms  ${name}`
    ).join("\n")}\n`;
  }
}
