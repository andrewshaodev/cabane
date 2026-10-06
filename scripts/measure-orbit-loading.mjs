import assert from "node:assert/strict";
import { chromium } from "playwright-core";

// Use a production preview. Each sample has empty browser storage and HTTP cache.
// Measure the end of the first populated WebGL frame, not a loading label.
const origin = process.argv[2] ?? "http://127.0.0.1:4174";
const fromLibrary = process.argv.includes("--library");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const result = (window.orbitLoading = { frames: [], draws: 0, contextMs: null });
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (...args) {
        const context = getContext.apply(this, args);
        if (args[0] === "webgl2" && context && result.contextMs === null)
          result.contextMs = performance.now();
        return context;
      };
      for (const name of [
        "drawArrays",
        "drawElements",
        "drawArraysInstanced",
        "drawElementsInstanced",
      ]) {
        const original = WebGL2RenderingContext.prototype[name];
        WebGL2RenderingContext.prototype[name] = function (...args) {
          result.draws++;
          return original.apply(this, args);
        };
      }
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = (callback) =>
        raf.call(window, (time) => {
          const before = result.draws;
          callback(time);
          if (result.draws > before)
            result.frames.push({ endMs: performance.now(), draws: result.draws - before });
        });
    });
    await page.goto(fromLibrary ? `${origin}/workspaces` : origin, {
      waitUntil: "domcontentloaded",
    });
    if (fromLibrary) {
      const open = page.getByRole("button", { name: "Open Demo home", exact: true });
      await open.waitFor();
      await open.evaluate((button) =>
        button.addEventListener(
          "click",
          () => {
            window.orbitLoading.startMs = performance.now();
          },
          { capture: true, once: true },
        ),
      );
      await open.click();
    }
    await page
      .locator(".room-status-overlay")
      .first()
      .waitFor({ state: "attached", timeout: 60000 });
    await page.waitForFunction(() => window.orbitLoading.frames.some((frame) => frame.draws > 100));
    const result = await page.evaluate(() => {
      const { frames: rawFrames, contextMs, startMs = 0 } = window.orbitLoading;
      const frames = rawFrames.map((frame) => ({ ...frame, endMs: frame.endMs - startMs }));
      const fullDraws = Math.max(...frames.map((frame) => frame.draws));
      return {
        contextMs: contextMs - startMs,
        firstSceneFrame: frames.find((frame) => frame.draws === fullDraws),
        initialFrames: frames.slice(0, 3),
      };
    });
    assert.deepEqual(errors, []);
    samples.push(result);
    await context.close();
  }
  const median = samples.map((sample) => sample.firstSceneFrame.endMs).sort((a, b) => a - b)[2];
  console.log(
    JSON.stringify(
      {
        browser: browser.version(),
        origin,
        fromLibrary,
        viewport: "1440x960",
        medianMs: median,
        samples,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
