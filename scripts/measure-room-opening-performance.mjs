import assert from "node:assert/strict";
import { chromium } from "playwright-core";

// Run against a Vite development server: React's development profiling data is
// needed to include the deferred R3F commit, not just the earlier DOM panel paint.
const origin = process.argv[2] ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    let nextId = 0;
    const renderers = new Map();
    window.roomCommits = [];
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      renderers,
      inject(renderer) {
        const id = ++nextId;
        renderers.set(id, renderer);
        return id;
      },
      onCommitFiberRoot(id, root) {
        window.roomCommits.push({
          renderer: renderers.get(id).rendererPackageName,
          time: performance.now(),
          duration: root.current.actualDuration,
        });
      },
      onCommitFiberUnmount() {},
    };
  });
  const samples = [];
  for (let index = 0; index < 6; index += 1) {
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.locator(".room-status-overlay").first().waitFor({ state: "attached" });
    await page.waitForTimeout(2000);
    // Read the existing R3F store; do not add measurement hooks to product code.
    await page.evaluate(async () => {
      const resource = performance
        .getEntriesByType("resource")
        .find((entry) => entry.name.includes("/@react-three_fiber.js"));
      if (!resource) throw new Error("Use the Vite development server for this benchmark.");
      const { _roots } = await import(resource.name);
      window.roomSceneStore = [..._roots.values()][0].store;
    });
    const sample = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const store = window.roomSceneStore;
          const camera = store.getState().camera;
          const pose = (camera) => [
            ...camera.position.toArray(),
            ...camera.quaternion.toArray(),
            camera.zoom,
          ];
          const before = pose(camera);
          window.roomCommits = [];
          const start = performance.now();
          const observer = new MutationObserver(() => {
            if (!document.querySelector(".room-control-sheet")) return;
            const panelMs = performance.now() - start;
            observer.disconnect();
            // The DOM panel commits ahead of the concurrent Canvas update. Collect
            // the whole transition, including camera-triggered follow-up commits.
            setTimeout(() => {
              const commits = window.roomCommits.filter(
                (commit) => commit.renderer === "@react-three/fiber",
              );
              resolve({
                panelMs,
                sceneReactMs: commits.reduce((sum, commit) => sum + commit.duration, 0),
                sceneCommitMs: Math.max(...commits.map((commit) => commit.time - start)),
                sceneCommits: commits.length,
                cameraRetained: camera === store.getState().camera,
                poseRetained:
                  JSON.stringify(before) === JSON.stringify(pose(store.getState().camera)),
              });
            }, 700);
          });
          observer.observe(document.body, { childList: true, subtree: true });
          document.querySelector(".room-status-overlay").click();
        }),
    );
    samples.push(sample);
    await page.evaluate(() => sessionStorage.clear());
  }
  assert.deepEqual(errors, []);
  assert.ok(
    samples.every((sample) => sample.sceneCommits > 0),
    "must observe the scene, not just the panel",
  );
  const median = (key) => {
    const values = samples
      .slice(1)
      .map((sample) => sample[key])
      .sort((a, b) => a - b);
    return Number(values[Math.floor(values.length / 2)].toFixed(2));
  };
  console.log(
    JSON.stringify(
      {
        browser: browser.version(),
        viewport: "1440x960",
        samples,
        warmMedian: {
          panelMs: median("panelMs"),
          sceneReactMs: median("sceneReactMs"),
          sceneCommitMs: median("sceneCommitMs"),
        },
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
