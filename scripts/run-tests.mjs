import { spawn } from "node:child_process";

// Node buffers cross-file reporter events in file order. Give each existing
// shard its own streaming reporter. Small software-rendering CI runners can
// serialize shards without changing their coverage or browser assertions.
const concurrency = Number(process.env.CABANE_TEST_CONCURRENCY ?? 4);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4)
  throw new Error("CABANE_TEST_CONCURRENCY must be an integer from 1 to 4.");
const files = process.argv.slice(2);
const shards = files.length
  ? files
  : Array.from({ length: 4 }, (_, index) => `tests/shards/shard-${index}.test.mjs`);
const children = new Set();
let interrupted = false;
const stop = (signal) => {
  interrupted = true;
  for (const child of children) {
    try {
      if (process.platform === "win32") child.kill(signal);
      else process.kill(-child.pid, signal);
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
};
const interrupt = () => stop("SIGINT");
const terminate = () => stop("SIGTERM");
process.on("SIGINT", interrupt);
process.on("SIGTERM", terminate);
let failed = false;
try {
  const queue = [...shards];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length && !interrupted) {
        const file = queue.shift();
        const status = await new Promise((resolve) => {
          const environment = {
            ...process.env,
            CABANE_TEST_SHARED_MODULES: files.length ? "0" : "1",
          };
          delete environment.NODE_TEST_CONTEXT;
          const child = spawn(
            process.execPath,
            [
              "--no-experimental-global-navigator",
              "--test",
              "--test-reporter=./scripts/agent-test-reporter.mjs",
              file,
            ],
            { env: environment, stdio: "inherit", detached: process.platform !== "win32" },
          );
          children.add(child);
          child.on("error", (error) => {
            console.error(error);
            resolve(1);
          });
          child.on("close", (code) => {
            children.delete(child);
            resolve(code ?? 1);
          });
        });
        if (status !== 0) failed = true;
      }
    }),
  );
} finally {
  process.removeListener("SIGINT", interrupt);
  process.removeListener("SIGTERM", terminate);
}
process.exitCode = failed || interrupted ? 1 : 0;
