import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
const output = process.env.BENCH_OUTPUT ?? "/tmp/cabane-perf-comparison";
const seconds = Number(process.env.BENCH_SECONDS ?? 5);
const repeats = Number(process.env.BENCH_REPEATS ?? 3);
const builds = [
  { name: "baseline", url: process.env.BENCH_BASELINE ?? "http://127.0.0.1:4198" },
  { name: "candidate", url: process.env.BENCH_CANDIDATE ?? "http://127.0.0.1:4199" },
];
const scenarios = (
  process.env.BENCH_SCENARIOS ?? "orbit-ground,orbit-upper,walk-ground,walk-upper,walk-upper-moving"
).split(",");
const cadences = (process.env.BENCH_CADENCES ?? "native,60").split(",");
await mkdir(output, { recursive: true });
const report = {
  started: new Date().toISOString(),
  viewport: [1440, 900],
  dpr: 2,
  seconds,
  repeats,
  samples: [],
  errors: [],
};
const save = () => writeFile(`${output}/comparison.json`, JSON.stringify(report, null, 2));
const stats = (values) => {
  const v = [...values].sort((a, b) => a - b);
  return {
    mean: v.reduce((a, b) => a + b, 0) / v.length,
    p50: v[Math.floor(v.length * 0.5)],
    p95: v[Math.min(v.length - 1, Math.floor(v.length * 0.95))],
  };
};
for (let repeat = 0; repeat < repeats; repeat++) {
  // Alternate AB / BA. One visible scene at a time, fresh demo storage each run.
  for (const build of repeat % 2 ? [...builds].reverse() : builds) {
    const browser = await chromium.launch({ channel: "chromium", headless: false });
    try {
      report.browser = browser.version();
      const system = await browser.newBrowserCDPSession();
      report.gpu ??= (await system.send("SystemInfo.getInfo")).gpu;
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      });
      await context.addInitScript(() => {
        window.benchRoots = new Set();
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
          supportsFiber: true,
          inject: () => 1,
          onCommitFiberRoot: (_, r) => window.benchRoots.add(r),
          onCommitFiberUnmount() {},
        };
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => report.errors.push({ build: build.name, error: e.message }));
      await page.goto(build.url);
      if (process.env.BENCH_FIXTURE !== "1")
        await page.getByRole("button", { name: /Explore the demo/ }).click();
      await page.waitForTimeout(4500);
      await page.evaluate(() => {
        const visit = (f) => {
          if (!f) return;
          if (f.stateNode?.object?.__r3f?.root) {
            window.benchStore = f.stateNode.object.__r3f.root;
          }
          visit(f.child);
          visit(f.sibling);
        };
        window.benchRoots.forEach((r) => {
          visit(r.current);
          if (window.benchStore) window.benchRoot = r;
        });
        const store = window.benchStore,
          s = store.getState();
        window.bench = { frames: [], active: false, cadence: "native", tick: 0 };
        const b = window.bench;
        const render = s.gl.render;
        s.gl.render = function (scene, camera) {
          const start = performance.now();
          const result = render.call(this, scene, camera);
          if (b.frame) {
            b.frame.calls += this.info.render.calls;
            b.frame.triangles += this.info.render.triangles;
            b.frame.renderMs += performance.now() - start;
          }
          return result;
        };
        const shadowRender = s.gl.shadowMap.render;
        s.gl.shadowMap.render = function (...args) {
          const calls = s.gl.info.render.calls;
          const result = shadowRender.apply(this, args);
          if (b.frame) b.frame.shadowCalls += s.gl.info.render.calls - calls;
          return result;
        };
        s.internal.subscribe(
          {
            current: () => {
              b.frame = b.active
                ? { t: performance.now(), calls: 0, triangles: 0, renderMs: 0, shadowCalls: 0 }
                : null;
            },
          },
          -1000,
          store,
        );
        s.internal.subscribe(
          {
            current: () => {
              if (b.frame) {
                b.frame.callbackMs = performance.now() - b.frame.t;
                b.frames.push(b.frame);
                b.frame = null;
              }
            },
          },
          1000,
          store,
        );
        // Test-only camera/input replay. Normal product callbacks still process fades,
        // collision, velocity, doors, animation and rendering.
        s.internal.subscribe(
          {
            current: (state) => {
              if (!b.motion) return;
              const t = (performance.now() - b.motion.start) / 1000;
              if (b.motion.kind === "orbit") {
                state.invalidate();
                const p = b.motion.position,
                  angle = Math.sin(t * 0.7) * 0.45;
                state.camera.position.set(
                  p[0] * Math.cos(angle) + p[2] * Math.sin(angle),
                  p[1],
                  p[2] * Math.cos(angle) - p[0] * Math.sin(angle),
                );
                state.camera.lookAt(...b.motion.target);
                state.camera.updateMatrixWorld();
              } else {
                b.motion.props.movementInputRef.current = {
                  x: Math.sin(t * 0.9) * 0.5,
                  y: Math.cos(t * 0.7) * 0.8,
                };
                b.motion.props.lookInputRef.current = { x: 0.35, y: 0 };
                const p = state.camera.position;
                b.motion.distance += Math.hypot(
                  p.x - b.motion.previous[0],
                  p.z - b.motion.previous[1],
                );
                b.motion.previous = [p.x, p.z];
              }
            },
          },
          -0.75,
          store,
        );
        window.benchSnapshot = () => {
          const s = store.getState();
          let meshes = 0,
            instances = 0;
          const geometries = new Set(),
            materials = new Set();
          s.scene.traverse((o) => {
            if (o.isMesh) meshes++;
            if (o.isInstancedMesh) instances += o.count;
            if (o.geometry) geometries.add(o.geometry);
            if (o.material)
              (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
                materials.add(m),
              );
          });
          return {
            meshes,
            instances,
            geometries: geometries.size,
            materials: materials.size,
            memory: { ...s.gl.info.memory },
            programs: s.gl.info.programs.length,
            dpr: s.gl.getPixelRatio(),
            canvas: [s.gl.domElement.width, s.gl.domElement.height],
            camera: s.camera.position.toArray(),
            rotation: s.camera.rotation.toArray(),
            visibility: document.visibilityState,
          };
        };
      });
      let walk = false,
        floor = "ground",
        night = false,
        roof = false;
      for (const scenario of scenarios) {
        const nextWalk = scenario.startsWith("walk"),
          nextFloor = scenario.includes("upper") ? "upper" : "ground",
          nextNight = scenario.includes("night"),
          nextRoof = scenario.includes("roof");
        if (roof !== nextRoof) {
          await page.keyboard.press("r");
          roof = nextRoof;
        }
        // Floor selection during a live walk can race its authoritative physical
        // walker. Enter each floor through the normal orbit -> walk UI instead.
        if (walk && floor !== nextFloor) {
          await page.getByRole("button", { name: "Exit walk mode", exact: true }).click();
          walk = false;
        }
        if (floor !== nextFloor) {
          await page
            .getByRole("button", {
              name: nextFloor === "upper" ? "First floor" : "Ground floor",
              exact: true,
            })
            .click();
          floor = nextFloor;
          await page.waitForTimeout(500);
        }
        if (walk !== nextWalk) {
          await page
            .getByRole("button", { name: nextWalk ? "Walk mode" : "Exit walk mode", exact: true })
            .click();
          walk = nextWalk;
        }
        if (nextWalk && nextFloor === "upper")
          await page.getByRole("button", { name: "First floor", exact: true }).click();
        if (night !== nextNight) {
          await page
            .getByRole("button", {
              name: nextNight ? "Use night lighting" : "Use daylight",
              exact: true,
            })
            .click();
          night = nextNight;
        }
        await page.mouse.move(10, 450);
        await page.waitForTimeout(2500);
        const pose = await page.evaluate(() => window.benchSnapshot());
        for (const cadence of cadences) {
          await page.evaluate(
            ({ cadence, pose, scenario }) => {
              const s = window.benchStore.getState(),
                b = window.bench;
              s.camera.position.fromArray(pose.camera);
              s.camera.rotation.fromArray(pose.rotation);
              s.camera.updateMatrixWorld();
              if (s.controls) s.controls.enabled = false;
              b.cadence = cadence;
              b.originalFrameloop = s.frameloop;
              if (cadence !== "native") {
                s.setFrameloop("never");
                s.internal.frames = 0;
                s.clock.elapsedTime = 100;
                b.tick = 0;
                // Keep existing animation time advancing at its original seconds scale.
                const rate = Number(cadence),
                  start = performance.now();
                const tick = () => {
                  s.advance(100 + ++b.tick / rate);
                  b.timer = setTimeout(
                    tick,
                    Math.max(0, start + ((b.tick + 1) * 1000) / rate - performance.now()),
                  );
                };
                b.timer = setTimeout(tick, 1000 / rate);
              }
              if (scenario.includes("moving")) {
                b.motion = {
                  kind: scenario.startsWith("walk") ? "walk" : "orbit",
                  start: performance.now(),
                  position: pose.camera,
                  target: s.controls?.target.toArray() ?? [0, 0, 0],
                  distance: 0,
                  previous: [pose.camera[0], pose.camera[2]],
                };
                if (b.motion.kind === "walk") {
                  const visit = (f) => {
                    if (!f) return;
                    if (f.memoizedProps?.movementInputRef && f.memoizedProps?.poseRef)
                      b.motion.props = f.memoizedProps;
                    visit(f.child);
                    visit(f.sibling);
                  };
                  window.benchRoots.forEach((r) => visit(r.current));
                  if (!b.motion.props) throw Error("Missing walk controller");
                  Object.assign(b.motion.props.poseRef.current, {
                    x: pose.camera[0],
                    z: pose.camera[2],
                    yaw: pose.rotation[1],
                    pitch: pose.rotation[0],
                  });
                }
              }
            },
            { cadence, pose, scenario },
          );
          await page.waitForTimeout(1200);
          const procStart = performance.now(),
            before = (await system.send("SystemInfo.getProcessInfo")).processInfo;
          const cpuStart = (procStart + performance.now()) / 2;
          await page.evaluate(() => {
            const b = window.bench;
            b.frames = [];
            b.active = true;
            b.start = performance.now();
          });
          await page.waitForTimeout(seconds * 1000);
          const data = await page.evaluate(() => {
            const b = window.bench;
            b.active = false;
            return {
              frames: b.frames,
              elapsed: (performance.now() - b.start) / 1000,
              scene: window.benchSnapshot(),
              distance: b.motion?.distance,
            };
          });
          const procEnd = performance.now(),
            after = (await system.send("SystemInfo.getProcessInfo")).processInfo;
          const cpuElapsed = ((procEnd + performance.now()) / 2 - cpuStart) / 1000;
          const cpu =
            (after.reduce(
              (sum, p) =>
                sum + p.cpuTime - (before.find((q) => q.id === p.id)?.cpuTime ?? p.cpuTime),
              0,
            ) /
              cpuElapsed) *
            100;
          const gaps = data.frames.slice(1).map((f, i) => f.t - data.frames[i].t);
          const result = {
            build: build.name,
            repeat: repeat + 1,
            scenario,
            cadence,
            elapsed: data.elapsed,
            cpuElapsed,
            browserCpuPercent: cpu,
            fps: data.frames.length / data.elapsed,
            frames: data.frames.length,
            startPose: pose,
            intervalMs: stats(gaps),
            callbackMs: stats(data.frames.map((f) => f.callbackMs)),
            calls: stats(data.frames.map((f) => f.calls)),
            shadowCalls: stats(data.frames.map((f) => f.shadowCalls)),
            triangles: stats(data.frames.map((f) => f.triangles)),
            scene: data.scene,
            distance: data.distance,
          };
          if (![...data.scene.camera, ...data.scene.rotation.slice(0, 3)].every(Number.isFinite))
            throw Error("Invalid camera: reject sample");
          if (scenario.startsWith("walk") && scenario.includes("moving") && !(data.distance > 0.1))
            throw Error("Movement failed");
          report.samples.push(result);
          await save();
          console.log(JSON.stringify(result));
          await page.evaluate(() => {
            const b = window.bench,
              s = window.benchStore.getState();
            clearTimeout(b.timer);
            if (b.motion?.props) {
              b.motion.props.movementInputRef.current = { x: 0, y: 0 };
              b.motion.props.lookInputRef.current = { x: 0, y: 0 };
            }
            b.motion = null;
            if (b.cadence !== "native") s.setFrameloop(b.originalFrameloop);
            if (s.controls) s.controls.enabled = true;
            s.invalidate();
          });
          if (repeat === 0 && cadence === cadences.at(-1))
            await page.screenshot({ path: `${output}/${build.name}-${scenario}.png` });
        }
      }
    } finally {
      await browser.close();
      await save();
    }
    // Browser is closed: no scene/GPU work during cooldown.
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }
}
report.finished = new Date().toISOString();
await save();
