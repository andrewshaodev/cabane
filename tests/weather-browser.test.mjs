import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";
import { measureScene } from "../scripts/scene-performance/browser-probe.mjs";
import { waitForSceneCamera } from "../scripts/browser-scene-settle.mjs";

test(
  "Weather tray previews six curated choices through normal UI, preserves solar mode and resets on reload",
  { timeout: 240000 },
  withBrowserDiagnostics(async () => {
    const { server } = await getBrowserTestServer();
    const session = await createBrowserTestSession();
    try {
      const page = await session.newPage({
        viewport: { width: 1280, height: 900 },
        ...(process.env.CABANE_WEATHER_MEASURE === "1"
          ? {
              recordVideo: {
                dir: "test-results/weather/video",
                size: { width: 1280, height: 900 },
              },
            }
          : {}),
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        // The fixture server disables HMR; Vite's CSS client can still report
        // its unavailable socket. Capture rendering errors, not that transport.
        if (message.type() === "error" && /THREE|WebGL|shader/i.test(message.text()))
          errors.push(message.text());
      });
      await page.route("**/tests/agent-harness.html?*", async (route) =>
        route.fulfill({
          contentType: "text/html",
          body: await readFile("tests/agent-harness.html", "utf8"),
        }),
      );
      await page.clock.setFixedTime(new Date("2026-09-23T12:00:00.000Z"));
      const fiberResponse = page.waitForResponse((response) =>
        response.url().includes("/@react-three_fiber.js"),
      );
      await page.goto(
        `${server.resolvedUrls.local[0]}tests/agent-harness.html?stage=scale&scenario=connected`,
      );
      await page.getByRole("button", { name: "Weather", exact: true }).waitFor();
      const moduleUrl = (await fiberResponse).url();
      await waitForSceneCamera(page, "OrthographicCamera", moduleUrl);
      const choose = async (name) => {
        await page.getByRole("button", { name: "Weather", exact: true }).click();
        await page.getByRole("button", { name, exact: true }).click();
      };
      const snapshot = () =>
        page.evaluate(() => {
          const state = [...window.sceneCameraProbe.roots.values()]
            .map((root) => root.store.getState())
            .find((state) => state.internal.active);
          const weather = state.scene.getObjectByName("weather-atmosphere");
          let sun;
          state.scene.traverse((object) => {
            if (object.isDirectionalLight) sun = object;
          });
          const effects = {};
          weather.traverse((object) => {
            if (object.isMesh)
              effects[object.name] = {
                visible: object.visible,
                instances: object.instanceMatrix
                  ? [...object.matrixWorld.elements, ...object.instanceMatrix.array.slice(0, 16)]
                  : null,
                amount: object.material.uniforms?.amount?.value,
                time:
                  object.material.uniforms?.time?.value ??
                  state.gl.properties.get(object.material).currentProgram?.getUniforms().map
                    .weatherTime?.cache[0],
              };
          });
          return {
            effects,
            sun: sun.position.toArray(),
            frame: state.gl.info.render.frame,
            loop: state.frameloop,
          };
        });
      await page.getByRole("button", { name: "Weather", exact: true }).press("ArrowUp");
      assert.deepEqual(
        await page
          .locator(".weather-menu button")
          .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label"))),
        ["Live", "Sunny", "Cloudy", "Rain", "Thunderstorm", "Snowy"],
      );
      assert.equal(await page.locator(".weather-menu img").count(), 6);
      assert.equal(
        await page.getByRole("button", { name: "Live", exact: true }).isDisabled(),
        true,
      );
      await page.getByRole("button", { name: "Sunny", exact: true }).press("End");
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
        "Snowy",
      );
      await page.getByRole("button", { name: "Snowy", exact: true }).press("Escape");
      const before = await snapshot();
      await mkdir("test-results/weather", { recursive: true });
      for (const [label, effect] of [
        ["Cloudy", "clouds"],
        ["Rain", "rain"],
        ["Thunderstorm", "rain"],
        ["Snowy", "snow"],
      ]) {
        await choose(label);
        await page.waitForFunction((name) => {
          const state = [...window.sceneCameraProbe.roots.values()]
            .map((root) => root.store.getState())
            .find((state) => state.internal.active);
          return state.scene.getObjectByName(`weather-${name}`)?.visible;
        }, effect);
        assert.ok((await snapshot()).sun.every((v, i) => Math.abs(v - before.sun[i]) < 0.00001));
        {
          const start = (await snapshot()).effects[`weather-${effect}`];
          await page.waitForFunction(
            ({ effect, start }) => {
              const state = [...window.sceneCameraProbe.roots.values()]
                .map((root) => root.store.getState())
                .find((state) => state.internal.active);
              const mesh = state.scene.getObjectByName(`weather-${effect}`);
              if (effect === "clouds")
                return (
                  mesh?.instanceMatrix &&
                  [...mesh.matrixWorld.elements, ...mesh.instanceMatrix.array.slice(0, 16)].some(
                    (value, index) => value !== start.instances[index],
                  )
                );
              return mesh?.material.uniforms.time.value > start.time + 0.1;
            },
            { effect, start },
            { timeout: 20000 },
          );
        }
        if (process.env.CABANE_WEATHER_MEASURE === "1") await page.waitForTimeout(4000);
        await page.screenshot({
          path: `test-results/weather/${label.toLowerCase().replaceAll(" ", "-")}.png`,
        });
      }
      await choose("Sunny");
      await page.waitForFunction(
        () => {
          const state = [...window.sceneCameraProbe.roots.values()]
            .map((root) => root.store.getState())
            .find((state) => state.internal.active);
          const weather = state.scene.getObjectByName("weather-atmosphere");
          return weather.children.every((object) => !object.visible);
        },
        null,
        { timeout: 15000 },
      );
      // Effects disappear before the remaining lighting/wind blend settles.
      await page.waitForFunction(
        () => {
          const probe = window.sceneCameraProbe;
          const state = [...probe.roots.values()]
            .map((root) => root.store.getState())
            .find((state) => state.internal.active);
          const frame = state.gl.info.render.frame;
          if (probe.idleFrame !== frame) {
            probe.idleFrame = frame;
            probe.idleSince = performance.now();
          }
          return performance.now() - probe.idleSince > 400;
        },
        null,
        { timeout: 15000, polling: 100 },
      );
      if (process.env.CABANE_WEATHER_MEASURE === "1") {
        const measure = () =>
          page.evaluate(measureScene, { selector: "canvas", moduleUrl, motion: true, samples: 80 });
        const clear = await measure();
        await choose("Thunderstorm");
        await page.waitForTimeout(6000);
        const storm = await measure();
        await writeFile(
          "test-results/weather/performance.json",
          JSON.stringify({ clear, storm }, null, 2),
        );
      }
      await choose("Snowy");
      await page.reload();
      await page.getByRole("button", { name: "Weather", exact: true }).click();
      assert.equal(
        await page
          .locator(".weather-menu button")
          .filter({ hasText: "Sunny" })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.getByRole("button", { name: "Weather", exact: true }).press("Escape");
      assert.equal(
        await page
          .getByRole("button", { name: "Weather", exact: true })
          .getAttribute("aria-expanded"),
        "false",
      );
      assert.deepEqual(errors, []);
    } finally {
      await session.close();
    }
  }),
);
