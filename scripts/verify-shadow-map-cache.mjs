import assert from "node:assert/strict";
import { resolve } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright-core";
const server = await createServer({
  root: resolve("apps/web"),
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
let browser;
try {
  browser = await chromium.launch({ channel: "chromium", headless: false });
  const page = await browser.newPage();
  await page.route("**/__shadow-test", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html><body></body></html>" }),
  );
  await page.goto(`${server.resolvedUrls.local[0]}__shadow-test`);
  const result = await page.evaluate(async (root) => {
    const source = await (await fetch(`${root}/packages/engine/src/shadow-map-cache.ts`)).text();
    const threeUrl = source.match(/from ["']([^"']*three[^"']*)["']/)[1];
    const T = await import(threeUrl);
    const { ShadowMapCache } = await import(`${root}/packages/engine/src/shadow-map-cache.ts`);
    const renderer = new T.WebGLRenderer();
    renderer.setSize(256, 256);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    const target = new T.WebGLRenderTarget(256, 256),
      scene = new T.Scene(),
      camera = new T.PerspectiveCamera(50, 1, 0.1, 50);
    scene.background = new T.Color("#c6dae0");
    camera.position.set(5, 5, 6);
    camera.lookAt(0, 0, 0);
    const light = new T.DirectionalLight("white", 3);
    light.position.set(2, 6, 3);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    scene.add(light, new T.HemisphereLight());
    const floor = new T.Mesh(
      new T.BoxGeometry(10, 0.1, 10),
      new T.MeshToonMaterial({ color: "#eef0db" }),
    );
    floor.receiveShadow = true;
    floor.position.y = -0.5;
    scene.add(floor);
    const caster = new T.Mesh(
      new T.BoxGeometry(1, 2, 1),
      new T.MeshToonMaterial({ color: "#739245" }),
    );
    caster.castShadow = true;
    caster.position.y = 0.5;
    scene.add(caster);
    const effect = new T.Mesh(
      new T.SphereGeometry(0.3),
      new T.MeshToonMaterial({ color: "#78b3cf", transparent: true, opacity: 0.5 }),
    );
    effect.position.set(2, 1, 0);
    scene.add(effect);
    const cache = new ShadowMapCache();
    let shadowCalls = 0,
      updates = 0;
    const shadowRender = renderer.shadowMap.render;
    renderer.shadowMap.render = function (...args) {
      if (this.autoUpdate || this.needsUpdate) updates++;
      const before = renderer.info.render.calls;
      const result = shadowRender.apply(this, args);
      shadowCalls += renderer.info.render.calls - before;
      return result;
    };
    const render = () => {
      renderer.setRenderTarget(target);
      cache.render(renderer, scene, camera);
      const pixels = new Uint8Array(256 * 256 * 4);
      renderer.readRenderTargetPixels(target, 0, 0, 256, 256, pixels);
      return pixels;
    };
    for (let i = 0; i < 3; i++) render();
    const results = [];
    for (const [name, change, expectRefresh] of [
      ["visual-only material update", () => (caster.material.needsUpdate = true), false],
      ["airflow only", () => (effect.position.x += 0.2), false],
      ["moving caster", () => (caster.rotation.y += 0.25), true],
      ["wall fade", () => (caster.castShadow = false), true],
      ["restore caster", () => (caster.castShadow = true), true],
      ["sun transition", () => (light.position.x -= 2), true],
      ["light target", () => (light.target.position.z = 1), true],
      ["resize viewport", () => (camera.aspect = 1), false],
      ["context reset", () => cache.reset(), true],
    ]) {
      change();
      shadowCalls = 0;
      updates = 0;
      const reused = render(),
        calls = shadowCalls,
        refreshes = updates;
      renderer.shadowMap.needsUpdate = true;
      const fresh = render();
      let different = 0;
      for (let i = 0; i < reused.length; i++) if (reused[i] !== fresh[i]) different++;
      results.push({ name, expectRefresh, calls, refreshes, different });
    }
    target.dispose();
    renderer.dispose();
    return results;
  }, `/@fs${process.cwd()}`);
  for (const r of result) {
    assert.equal(r.different, 0, `${r.name}: cached image differs from fresh shadows`);
    assert.equal(r.refreshes > 0, r.expectRefresh, `${r.name}: invalidation`);
  }
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
