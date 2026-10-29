import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import reporter from "../scripts/agent-test-reporter.mjs";

const details = (passed, error) => ({ type: "test", passed, duration_ms: 1, error });

test("worker failures preserve wrapper metadata, a primitive cause, and the last started test", async () => {
  const error = Object.assign(new Error("worker stopped", { cause: "test failed" }), {
    code: "ERR_TEST_FAILURE",
    failureType: "testCodeFailure",
    exitCode: null,
    signal: "SIGKILL",
  });
  async function* events() {
    yield {
      type: "test:dequeue",
      data: {
        name: "floor menu pointer input",
        file: resolve("tests/panel-dom.test.mjs"),
        line: 61,
      },
    };
    const data = {
      name: "shard-3",
      file: resolve("tests/shards/shard-3.test.mjs"),
      details: details(false, error),
    };
    yield { type: "test:complete", data };
    yield { type: "test:fail", data };
  }
  const chunks = [];
  for await (const chunk of reporter(events())) chunks.push(chunk);
  const output = chunks.join("");
  for (const evidence of [
    "worker stopped",
    "test failed",
    "ERR_TEST_FAILURE",
    "testCodeFailure",
    "SIGKILL",
    "exitCode",
    "Last started: floor menu pointer input",
    "tests/panel-dom.test.mjs:61",
  ])
    assert.ok(output.includes(evidence), evidence);
});

test(
  "real early process exits retain diagnostics in output and JSON reports",
  { timeout: 10_000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "cabane-reporter-exit-"));
    const fixture = join(directory, "exit.test.mjs");
    const reportPath = join(directory, "report.json");
    const environment = { ...process.env, CABANE_TEST_REPORT: reportPath };
    delete environment.NODE_TEST_CONTEXT;
    delete environment.CABANE_TEST_SHARED_MODULES;
    await writeFile(
      fixture,
      "import test from 'node:test'; test('exits during input', async () => { await new Promise(setImmediate); process.exit(7); });",
    );
    try {
      const child = spawn(process.execPath, ["scripts/run-tests.mjs", fixture], {
        env: environment,
      });
      let output = "";
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
      assert.equal(
        await new Promise((resolve, reject) => {
          child.on("error", reject);
          child.on("close", resolve);
        }),
        1,
      );
      assert.match(output, /exitCode: 7/);
      assert.match(output, /Test worker .* exited: code=1, signal=none/);
      const report = JSON.parse(await readFile(reportPath, "utf8"));
      assert.equal(report.passed, false);
      assert.equal(report.workers[0].code, 1);
      assert.equal(report.workers[0].signal, null);
      assert.match(report.workers[0].failures[0].diagnostic, /exitCode: 7/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);

test("reporter emits a failure before requesting another event and avoids aggregate duplicates", async () => {
  const error = new Error("expected two rooms");
  const data = {
    name: "room's [count]",
    file: resolve("tests/rooms.test.mjs"),
    line: 12,
    column: 3,
    details: details(false, error),
  };
  let advanced = false;
  async function* events() {
    yield { type: "test:complete", data };
    advanced = true;
    yield { type: "test:fail", data };
    yield {
      type: "test:complete",
      data: { ...data, name: "shard", details: details(false, { failureType: "subtestsFailed" }) },
    };
    yield {
      type: "test:fail",
      data: { ...data, details: details(false, { failureType: "subtestsFailed" }) },
    };
    yield { type: "test:pass", data: { name: "ok", details: details(true) } };
  }
  const output = reporter(events());
  const first = (await output.next()).value;
  assert.equal(advanced, false);
  assert.match(first, /FAIL room's \[count\]/);
  assert.match(first, /rooms.test.mjs:12:3/);
  assert.match(first, /expected two rooms/);
  assert.match(first, /--no-experimental-global-navigator/);
  const remainder = [];
  for await (const chunk of output) remainder.push(chunk);
  assert.doesNotMatch(remainder.join(""), /FAIL/);
  assert.match(remainder.join(""), /1 passed, 1 failed/);
});

test(
  "real concurrent failures stream immediately and the printed shell command reruns the failing file",
  { timeout: 15_000 },
  async (t) => {
    const directory = await mkdtemp(join(tmpdir(), "cabane-reporter-"));
    const release = join(directory, "release");
    const slow = join(directory, "a-slow.test.mjs");
    const bad = join(directory, "b-bad.test.mjs");
    // This fixture specifically exercises two concurrent processes, even when
    // the enclosing suite serializes expensive browser workers.
    const environment = {
      ...process.env,
      CABANE_TEST_CONCURRENCY: "2",
      CABANE_TEST_REPORT: join(directory, "report.json"),
    };
    delete environment.NODE_TEST_CONTEXT;
    delete environment.CABANE_TEST_SHARED_MODULES;
    await writeFile(
      slow,
      `import test from 'node:test'; import {access} from 'node:fs/promises'; test('slow', async()=>{while(true){try{await access(${JSON.stringify(release)}); break;}catch{} await new Promise(r=>setTimeout(r,20));}});`,
    );
    await writeFile(
      bad,
      `import test from 'node:test'; test("room's [count]",()=>{throw Error('unique failure')}); test('other',()=>{throw Error('must be filtered')});`,
    );
    const child = spawn(process.execPath, ["scripts/run-tests.mjs", slow, bad], {
      env: environment,
    });
    t.after(() => child.kill());
    let output = "";
    const exit = new Promise((resolve) => child.on("close", resolve));
    try {
      const failure = new Promise((resolve, reject) => {
        child.stdout.on("data", (chunk) => {
          output += chunk;
          if (output.includes("Rerun:")) resolve();
        });
        child.on("error", reject);
        child.on("close", () => reject(new Error("No immediate failure: " + output)));
      });
      await failure;
      assert.doesNotMatch(output, /1 passed/);
      await writeFile(release, "go");
      assert.equal(await exit, 1);
      const report = JSON.parse(await readFile(environment.CABANE_TEST_REPORT, "utf8"));
      assert.equal(report.passed, false);
      assert.equal(report.workers.length, 2);
      assert.deepEqual(
        report.workers.flatMap((worker) => worker.durations.map((entry) => entry.name)).sort(),
        ["other", "room's [count]", "slow"],
      );
      assert.equal(
        report.workers.reduce((total, worker) => total + worker.failed, 0),
        2,
      );
      const command = output
        .split("\n")
        .find((line) => line.startsWith("Rerun:"))
        .slice(7);
      const rerun = spawn(command, { shell: true, env: environment });
      let rerunOutput = "";
      rerun.stdout.on("data", (chunk) => (rerunOutput += chunk));
      assert.equal(await new Promise((resolve) => rerun.on("close", resolve)), 1);
      assert.match(rerunOutput, /unique failure/);
      assert.doesNotMatch(rerunOutput, /must be filtered/);
    } finally {
      child.kill();
      await exit;
      await rm(directory, { recursive: true, force: true });
    }
  },
);

test("successful output stays compact while skip, todo and hook failures remain visible", async () => {
  async function* events() {
    yield { type: "test:stdout", data: { file: "/fixture.mjs", message: "noisy success log" } };
    yield { type: "test:pass", data: { name: "ok", details: details(true) } };
    yield { type: "test:pass", data: { name: "skip", skip: true, details: details(true) } };
    yield {
      type: "test:complete",
      data: { name: "todo", todo: true, details: details(false, Error("expected")) },
    };
    yield { type: "test:fail", data: { name: "todo", todo: true, details: details(false) } };
    const hook = {
      name: "suite setup",
      file: "/fixture.mjs",
      details: { type: "suite", passed: false, error: Error("setup failed") },
    };
    yield { type: "test:complete", data: hook };
    yield { type: "test:fail", data: hook };
  }
  const chunks = [];
  for await (const chunk of reporter(events())) chunks.push(chunk);
  const output = chunks.join("");
  assert.match(output, /^\.-T/);
  assert.match(output, /FAIL suite setup/);
  assert.match(output, /1 passed, 1 failed, 1 skipped, 1 todo/);
  assert.doesNotMatch(output, /FAIL todo/);
});

test("shared rerun preserves earlier files when an isolated rerun passes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cabane-shared-reporter-"));
  const shard = join(directory, "shared's.test.mjs");
  const environment = {
    ...process.env,
    CABANE_TEST_SHARED_MODULES: "1",
    CABANE_TEST_SHARD: shard,
    CABANE_TEST_SUITE: "unit",
    CABANE_VERIFY_GROUP: "workspace",
  };
  delete environment.NODE_TEST_CONTEXT;
  delete environment.CABANE_TEST_REPORT_DIRECTORY;
  const run = (command) =>
    new Promise((resolve, reject) => {
      const child = spawn(command, { shell: true, env: environment });
      let output = "";
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
      child.on("error", reject);
      child.on("close", (code) => resolve({ code, output }));
    });
  try {
    await writeFile(
      join(directory, "first.mjs"),
      "import test from 'node:test'; test('setup', () => { globalThis.leaked = true; });",
    );
    await writeFile(
      join(directory, "second.mjs"),
      "import test from 'node:test'; import assert from 'node:assert/strict'; test('clean state', () => { assert.equal(globalThis.leaked, undefined); });",
    );
    await writeFile(
      shard,
      "import {describe} from 'node:test'; await describe('shared', async () => { await import('./first.mjs'); await import('./second.mjs'); });",
    );
    const result = await run(
      `node --test --test-reporter=./scripts/agent-test-reporter.mjs '${shard.replaceAll("'", "'\"'\"'")}'`,
    );
    assert.equal(result.code, 1);
    const lines = result.output.split("\n");
    const isolated = lines.find((line) => line.startsWith("Rerun:")).slice("Rerun: ".length);
    assert.equal((await run(isolated)).code, 0);
    const shared = lines
      .find((line) => line.startsWith("Shared-shard rerun:"))
      .slice("Shared-shard rerun: ".length);
    assert.match(shared, /CABANE_TEST_SUITE='unit'/);
    assert.match(shared, /CABANE_VERIFY_GROUP='workspace'/);
    assert.doesNotMatch(shared, /test-name-pattern/);
    const rerun = await run(shared);
    assert.equal(rerun.code, 1);
    assert.match(rerun.output, /FAIL clean state/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
