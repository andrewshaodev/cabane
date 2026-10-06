import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";
import { measureScene } from "../scripts/scene-performance/browser-probe.mjs";
import { waitForSceneCamera } from "../scripts/browser-scene-settle.mjs";

test(
  "Weather tray previews all conditions through normal UI, preserves solar mode and resets on reload",
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
      await page.goto(
        `${server.resolvedUrls.local[0]}tests/agent-harness.html?stage=scale&scenario=connected`,
      );
      await page.getByRole("button", { name: "Weather", exact: true }).waitFor();
      await waitForSceneCamera(page, "OrthographicCamera");
      const choose = async (name) => {
        await page.getByRole("button", { name: "Weather", exact: true }).click();
        await page
          .locator(".weather-menu button")
          .filter({ hasText: new RegExp(`^${name}(Selected)?$`) })
          .click();
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
      const before = await snapshot();
      await mkdir("test-results/weather", { recursive: true });
      for (const [label, effect] of [
        ["Cloudy", "clouds"],
        ["Rain", "rain"],
        ["Heavy rain", "rain"],
        ["Snow", "snow"],
        ["Sleet", "snow"],
        ["Hail", "hail"],
        ["Fog", "mist"],
        ["Windy", "wind"],
        ["Windy and cloudy", "wind"],
        ["Thunderstorm", "clouds"],
        ["Thunderstorm with rain", "rain"],
        ["Partly cloudy", "clouds"],
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
          const start = (await snapshot()).effects[`weather-${effect}`].time;
          await page.waitForTimeout(500);
          const end = (await snapshot()).effects[`weather-${effect}`].time;
          assert.ok(end > start + 0.1, `${label} shader clock must advance: ${start} → ${end}`);
        }
        if (process.env.CABANE_WEATHER_MEASURE === "1") await page.waitForTimeout(4000);
        await page.screenshot({
          path: `test-results/weather/${label.toLowerCase().replaceAll(" ", "-")}.png`,
        });
      }
      await choose("Clear");
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
        const moduleUrl = await page.evaluate(() =>
          performance
            .getEntriesByType("resource")
            .map((entry) => entry.name)
            .find((name) => name.includes("/@react-three_fiber.js")),
        );
        const measure = () =>
          page.evaluate(measureScene, { selector: "canvas", moduleUrl, motion: true, samples: 80 });
        const clear = await measure();
        await choose("Thunderstorm with rain");
        await page.waitForTimeout(6000);
        const storm = await measure();
        await writeFile(
          "test-results/weather/performance.json",
          JSON.stringify({ clear, storm }, null, 2),
        );
      }
      await choose("Snow");
      await page.reload();
      await page.getByRole("button", { name: "Weather", exact: true }).click();
      assert.equal(
        await page
          .locator(".weather-menu button")
          .filter({ hasText: "Live weather" })
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
