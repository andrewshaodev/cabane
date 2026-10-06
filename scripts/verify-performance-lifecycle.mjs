import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
const output = process.env.BENCH_OUTPUT ?? "/tmp/cabane-perf-lifecycle";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: false });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  await context.addInitScript(() => {
    window.roots = new Set();
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject: () => 1,
      onCommitFiberRoot: (_, r) => window.roots.add(r),
      onCommitFiberUnmount() {},
    };
  });
  const page = await context.newPage(),
    errors = [],
    samples = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.BENCH_ORIGIN ?? "http://127.0.0.1:4199");
  await page.getByRole("button", { name: /Explore the demo/ }).click();
  await page.waitForTimeout(2500);
  for (let cycle = 0; cycle < 3; cycle++) {
    await page.getByRole("button", { name: "Walk mode", exact: true }).click();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "First floor", exact: true }).click();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Ground floor", exact: true }).click();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Exit walk mode", exact: true }).click();
    await page.waitForTimeout(1200);
    samples.push(
      await page.evaluate(() => {
        let store;
        const visit = (f) => {
          if (!f) return;
          if (f.stateNode?.object?.__r3f?.root) store = f.stateNode.object.__r3f.root;
          visit(f.child);
          visit(f.sibling);
        };
        window.roots.forEach((r) => visit(r.current));
        const s = store.getState();
        return { ...s.gl.info.memory, programs: s.gl.info.programs.length };
      }),
    );
  }
  console.log("Resource cycles:", JSON.stringify(samples));
  await writeFile(`${output}/resources.json`, JSON.stringify(samples));
  await page.keyboard.press("c");
  await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
  for (const mode of ["Arrange", "Connect", "Construct"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${output}/${mode}.png` });
  }
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Explore draft"]') ||
      document.body.innerText.includes("Allow pointer lock"),
  );
  const pointerLockLimited =
    (await page
      .getByText("Allow pointer lock in your browser to explore this home.", { exact: true })
      .count()) > 0;
  if (!pointerLockLimited) await page.getByRole("button", { name: /Back to editor/ }).click();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Walk mode", exact: true }).waitFor();
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/results.json`,
    JSON.stringify(
      {
        samples,
        errors,
        pointerLockLimited,
        ui: ["walk/floor cycles", "Construct", "Arrange", "Connect", "Home return"],
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ samples, errors }));
} finally {
  await browser.close();
}
