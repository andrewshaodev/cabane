import assert from "node:assert/strict";
import { resolve } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright-core";

// Exercise the production sky shader on a real WebGL2 context.
const server = await createServer({
  root: resolve("apps/web"),
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
let browser;
try {
  browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--use-angle=swiftshader"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.route("**/__contour-test", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html><body></body></html>" }),
  );
  await page.goto(`${server.resolvedUrls.local[0]}__contour-test`);
  const results = await page.evaluate(async (root) => {
    const T = await import(`${root}/node_modules/three/build/three.module.js`);
    const { walkSkyVertexShader, walkSkyFragmentShader } = await import(
      `${root}/packages/engine/src/walk-sky-shader.ts`
    );
    const renderer = new T.WebGLRenderer();
    renderer.setSize(128, 128);
    renderer.setClearColor(0x000000, 0);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(70, 1, 0.1, 100);
    const uniforms = {
      sunDirection: { value: new T.Vector3(0, 0.5, -1).normalize() },
      sunColor: { value: new T.Color("#fff0d7") },
      zenithDay: { value: new T.Color("#6296bd") },
      horizonDay: { value: new T.Color("#e1e6d7") },
      zenithNight: { value: new T.Color("#101e36") },
      horizonNight: { value: new T.Color("#35465d") },
      duskColor: { value: new T.Color("#efb082") },
      daylight: { value: 1 },
    };
    const material = new T.ShaderMaterial({
      uniforms,
      vertexShader: walkSkyVertexShader,
      fragmentShader: walkSkyFragmentShader,
      side: T.BackSide,
      depthWrite: false,
      depthTest: false,
    });
    const sky = new T.Mesh(new T.SphereGeometry(1, 24, 12), material);
    sky.frustumCulled = false;
    sky.renderOrder = -1000;
    scene.add(sky);
    const target = new T.WebGLRenderTarget(128, 128);
    const render = () => {
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      const pixels = new Uint8Array(128 * 128 * 4);
      renderer.readRenderTargetPixels(target, 0, 0, 128, 128, pixels);
      return pixels;
    };
    const day = render();
    camera.position.set(100, 50, -20);
    const moved = render();
    const translationInvariant = day.every((value, index) => value === moved[index]);
    camera.position.set(0, 0, 0);
    uniforms.daylight.value = 0;
    uniforms.sunDirection.value.set(0, -1, 0);
    const night = render();
    const nightDarker = night[64 * 128 * 4 + 64 * 4] < day[64 * 128 * 4 + 64 * 4];
    const covered = [];
    for (const aspect of [0.5, 2])
      for (const pitch of [-1.4, 0, 1.4]) {
        camera.aspect = aspect;
        camera.rotation.x = pitch;
        camera.updateProjectionMatrix();
        const pixels = render();
        covered.push(pixels.every((value, index) => index % 4 !== 3 || value === 255));
      }
    camera.aspect = 1;
    camera.rotation.x = 0;
    camera.updateProjectionMatrix();
    const box = new T.Mesh(
      new T.BoxGeometry(1, 1, 1),
      new T.MeshBasicMaterial({ color: "#ff0000" }),
    );
    box.position.z = -3;
    scene.add(box);
    const occluded = render();
    const center = (64 * 128 + 64) * 4;
    const occlusionCorrect = occluded[center] > 200 && occluded[center + 1] === 0;
    box.geometry.dispose();
    box.material.dispose();
    sky.geometry.dispose();
    material.dispose();
    target.dispose();
    renderer.dispose();
    return { translationInvariant, nightDarker, covered, occlusionCorrect };
  }, `/@fs${process.cwd()}`);
  assert.deepEqual(errors, [], "WebGL shader errors");
  assert.equal(results.translationInvariant, true, "Sky must have no translation parallax");
  assert.equal(results.nightDarker, true, "Night sky must be darker");
  assert.ok(
    results.covered.every(Boolean),
    "Sky must cover portrait, landscape, and pitch extremes",
  );
  assert.equal(results.occlusionCorrect, true, "Opaque architecture must occlude sky");
  console.log(
    "GPU sky passed: shader compilation, no parallax, day/night, pitch/aspect coverage, occlusion.",
  );
} finally {
  await browser?.close();
  await server.close();
}
