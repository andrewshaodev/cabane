import assert from "node:assert/strict";
import test from "node:test";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";
import { createBrowserTestSession, getBrowserTestServer } from "./browser-test-environment.mjs";

// Use the production material, with no TV, fading, batching, shadows or contours.
// A fixed wall/light dot product must retain its shade as the view matrix rotates.
const fixture = `<html><body><div id="root" style="width:256px;height:256px"></div>
<script type="module">
import React from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useThree} from '@react-three/fiber';
import {ToonMaterial} from '/@fs/${process.cwd()}/packages/engine/src/rendering.tsx';
function Wall() {
  const state=useThree();
  React.useEffect(()=>{window.wallProbe=state;},[state]);
  return React.createElement('mesh',null,
    React.createElement('planeGeometry',{args:[4,4]}),
    React.createElement(ToonMaterial,{color:'#ffffff'}));
}
createRoot(document.getElementById('root')).render(
  React.createElement(Canvas,{orthographic:true,frameloop:'never',
    camera:{position:[0,0,5],zoom:40,near:.1,far:100}},
    React.createElement('directionalLight',{name:'fixed-sun',position:[5,0,0],intensity:2}),
    React.createElement(Wall)));
</script></body></html>`;

test(
  "toon wall lighting stays stable across orbit angles at every band boundary",
  withBrowserDiagnostics(async () => {
    const { server } = await getBrowserTestServer("app");
    const session = await createBrowserTestSession();
    const page = await session.newPage();
    const html = await server.transformIndexHtml("/__toon-orbit", fixture);
    await page.route("**/__toon-orbit", (route) =>
      route.fulfill({ contentType: "text/html", body: html }),
    );
    await page.goto(server.resolvedUrls.local[0] + "__toon-orbit");
    await page.waitForFunction(() => window.wallProbe);
    const results = await page.evaluate(async (root) => {
      const T = await import(root + "/node_modules/three/build/three.module.js");
      const { gl, scene, camera } = window.wallProbe;
      const sun = scene.getObjectByName("fixed-sun");
      const target = new T.WebGLRenderTarget(64, 64);
      const previous = gl.getRenderTarget();
      const results = [];
      try {
        gl.setRenderTarget(target);
        for (const dot of [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]) {
          sun.position.set(Math.sqrt(1 - dot * dot) * 5, 0, dot * 5);
          const colors = [];
          for (let frame = 0; frame < 61; frame++) {
            const angle = -1.2 + frame * 0.04;
            camera.position.set(Math.sin(angle) * 5, Math.sin(angle * 0.7), Math.cos(angle) * 5);
            camera.lookAt(0, 0, 0);
            camera.updateMatrixWorld();
            gl.render(scene, camera);
            const pixel = new Uint8Array(4);
            gl.readRenderTargetPixels(target, 32, 32, 1, 1, pixel);
            colors.push(pixel[0]);
          }
          results.push({ dot, min: Math.min(...colors), max: Math.max(...colors) });
        }
      } finally {
        gl.setRenderTarget(previous);
        target.dispose();
      }
      return results;
    }, "/@fs" + process.cwd());
    for (const { dot, min, max } of results) {
      assert.ok(min > 0, "the sample must hit the lit wall");
      assert.ok(
        max - min <= 2,
        `fixed light dot ${dot}: camera-only motion changed wall brightness from ${min} to ${max}`,
      );
    }
    const bands = results.filter(({ dot }) => Math.abs(dot) === 0.25 || Math.abs(dot) === 0.75);
    for (let i = 1; i < bands.length; i++)
      assert.ok(bands[i].min - bands[i - 1].max > 10, "retain four distinct cel-shaded bands");
  }),
);
