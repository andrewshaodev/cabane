import { AsyncLocalStorage } from "node:async_hooks";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const currentTest = new AsyncLocalStorage();

// Wrap the callback, not test(), so Node retains the original test file/line.
export function withBrowserDiagnostics(callback) {
  return async (test) => {
    const sessions = [];
    let failure;
    let finishing;
    const finish = () =>
      (finishing ??= (async () => {
        const failed = failure || test.signal.aborted;
        // Capture every session before disposing shared processes.
        for (const session of sessions) {
          if (!failed) continue;
          try {
            await session.capture(test.name, failure ?? new Error("Test aborted"));
          } catch (error) {
            process.stderr.write(`Browser evidence capture failed: ${error.stack ?? error}\n`);
          }
        }
        const cleanup = await Promise.allSettled(sessions.map((session) => session.dispose()));
        const errors = cleanup
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason);
        if (errors.length) {
          const error = new AggregateError(errors, "Browser session cleanup failed");
          if (!failed) throw error;
          process.stderr.write(`${error}: ${errors.map(String).join("; ")}\n`);
        }
      })());
    test.after(finish);
    return currentTest.run(sessions, async () => {
      try {
        return await callback(test);
      } catch (error) {
        failure = error;
        throw error;
      } finally {
        await finish();
      }
    });
  };
}

export function registerBrowserDiagnostics(session) {
  const sessions = currentTest.getStore();
  sessions?.push(session);
  return Boolean(sessions);
}

export async function captureBrowserFailure(name, error, contexts, messages) {
  const root = resolve("test-results/browser");
  await mkdir(root, { recursive: true });
  const slug = name.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80);
  const directory = await mkdtemp(join(root, `${slug}-${process.pid}-`));
  const captureErrors = [];
  let index = 0;
  for (const context of contexts) {
    const contextIndex = ++index;
    let pageIndex = 0;
    for (const page of context.pages()) {
      try {
        await page.screenshot({
          path: join(directory, `context-${contextIndex}-page-${++pageIndex}.png`),
          timeout: 5_000,
        });
      } catch (error) {
        captureErrors.push(`Screenshot: ${error.message}`);
      }
    }
    try {
      await context.tracing.stop({ path: join(directory, `context-${contextIndex}-trace.zip`) });
    } catch (error) {
      captureErrors.push(`Trace: ${error.message}`);
    }
  }
  await writeFile(
    join(directory, "errors.json"),
    JSON.stringify(
      { name, error: String(error?.stack ?? error), messages, captureErrors },
      null,
      2,
    ),
  );
  process.stderr.write(`Browser failure artifacts: ${directory}\n`);
  return directory;
}
