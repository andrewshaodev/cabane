import { summarizeTestRuns, compareTestProfiles } from "./test-profile-report.mjs";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { tmpdir } from "node:os";

const args = process.argv.slice(2);
const options = { runs: "3", output: "test-results/test-profile.json" };
for (let index = 0; index < args.length; index += 2) {
  const key = args[index].slice(2);
  if (
    !args[index].startsWith("--") ||
    !["runs", "output", "baseline"].includes(key) ||
    !args[index + 1]
  )
    throw new Error("Usage: npm run test:profile -- [--runs 3] [--output path] [--baseline path]");
  options[key] = args[index + 1];
}
const count = Number(options.runs);
if (!Number.isInteger(count) || count < 1 || count > 20)
  throw new Error("--runs must be an integer from 1 to 20");
const directory = await mkdtemp(join(tmpdir(), "cabane-profile-"));
const runs = [];
try {
  for (let index = 0; index < count; index++) {
    console.log(`Profile run ${index + 1}/${count}`);
    const path = join(directory, `${index}.json`);
    const environment = { ...process.env, CABANE_TEST_REPORT: path };
    delete environment.NODE_TEST_CONTEXT;
    const child = spawn(process.execPath, ["scripts/run-tests.mjs"], {
      env: environment,
      stdio: "inherit",
    });
    const interrupt = () => child.kill("SIGINT");
    const terminate = () => child.kill("SIGTERM");
    process.on("SIGINT", interrupt);
    process.on("SIGTERM", terminate);
    const code = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", terminate);
    const run = JSON.parse(await readFile(path, "utf8"));
    runs.push(run);
    if (code !== 0 || !run.passed) {
      process.exitCode = 1;
      break;
    }
  }
  const report = summarizeTestRuns(runs);
  await mkdir(dirname(resolve(options.output)), { recursive: true });
  await writeFile(options.output, JSON.stringify(report, null, 2) + "\n");
  console.log(
    `Median: ${(report.medianMs / 1000).toFixed(2)}s; report: ${resolve(options.output)}`,
  );
  console.log(
    report.files
      .slice(0, 20)
      .map((file) => `${(file.durationMs / 1000).toFixed(2)}s  ${file.file}`)
      .join("\n"),
  );
  if (options.baseline) {
    const baseline = JSON.parse(await readFile(options.baseline, "utf8"));
    console.log(`Reduction: ${compareTestProfiles(baseline, report).toFixed(1)}%`);
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
