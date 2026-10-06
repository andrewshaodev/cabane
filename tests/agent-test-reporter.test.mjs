import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import reporter from "../scripts/agent-test-reporter.mjs";

const details = (passed, error) => ({ type: "test", passed, duration_ms: 1, error });

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
    const environment = { ...process.env };
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
