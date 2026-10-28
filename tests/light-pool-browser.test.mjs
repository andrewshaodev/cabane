import assert from "node:assert/strict";
import test from "node:test";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";
import { createBrowserTestSession, getBrowserTestServer } from "./browser-test-environment.mjs";

// Browser-only risk: removing the old cutoff must compile real toon/PBR shaders
// beyond 32 points, including the extra wall-mask uniforms.
const fixture = `<html><body><div id="root" style="width:96px;height:96px"></div>
<script type="module">
import React from "react";
import {createRoot} from "react-dom/client";
import {Canvas,useThree,useFrame} from "@react-three/fiber";
import {ActiveSceneLightPool} from "/@fs/${process.cwd()}/packages/engine/src/SceneLightPool.tsx";
import {SceneLightWallMask} from "/@fs/${process.cwd()}/packages/engine/src/scene-light-wall-mask.ts";
const h=React.createElement;
const floor={rooms:[],walls:[],openings:[],coordinates:{origin:[0,0],metersPerPlanUnit:1}};
const sources=Array.from({length:128},(_,i)=>({
 name:"test-"+i,position:[(i%8-4)*.1,Math.floor(i/8)*.05,1],color:"#ffcc88",intensity:.05,distance:5,
}));
function Scene(){
 const state=useThree();
 const [on,setOn]=React.useState(true);
 const mask=React.useMemo(()=>new SceneLightWallMask(),[]);
 React.useEffect(()=>()=>mask.dispose(),[mask]);
 React.useEffect(()=>{window.lightPool={state,toggle:()=>setOn(value=>!value)}},[state]);
 useFrame(({gl,scene,camera})=>mask.render(gl,scene,camera),1);
 return h(React.Fragment,null,
  h(ActiveSceneLightPool,{floor,sources:on?sources:sources.map(source=>({...source,intensity:0}))}),
  h("mesh",{position:[-.5,0,0]},h("planeGeometry"),h("meshToonMaterial",{color:"#ffffff"})),
  h("mesh",{position:[.5,0,0]},h("planeGeometry"),h("meshStandardMaterial",{color:"#ffffff"})));
}
createRoot(document.getElementById("root")).render(h(Canvas,{frameloop:"demand",dpr:1,
 camera:{position:[0,0,3],fov:40}},h(Scene)));
</script></body></html>`;

test(
  "128 pooled lights compile toon and PBR wall-masked shaders and reuse them when switched off",
  { timeout: 10_000 },
  withBrowserDiagnostics(async () => {
    const { server } = await getBrowserTestServer("app");
    const session = await createBrowserTestSession();
    const page = await session.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      // This isolated test server intentionally has no HMR websocket.
      if (
        message.type() === "error" &&
        !/WebSocket connection|^\[vite\]|^Failed to send error to Vite server/.test(message.text())
      )
        errors.push(message.text());
    });
    try {
      const awaitHtml = await server.transformIndexHtml("/__light-pool", fixture);
      await page.route("**/__light-pool", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: awaitHtml,
        }),
      );
      await page.goto(server.resolvedUrls.local[0] + "__light-pool");
      await page.waitForFunction(() => window.lightPool?.state.gl.info.render.frame > 0);
      const before = await page.evaluate(() => {
        const { gl, scene } = window.lightPool.state;
        const ids = [];
        scene.traverse((object) => {
          if (object.isPointLight) ids.push(object.uuid);
        });
        return {
          ids,
          programs: gl.info.programs.map((program) => program.id),
          runnable: gl.info.programs.every((program) => program.diagnostics?.runnable !== false),
          frame: gl.info.render.frame,
          error: gl.getContext().getError(),
        };
      });
      assert.equal(before.ids.length, 128);
      assert.equal(before.runnable, true);
      assert.equal(before.error, 0);
      await page.evaluate(() => window.lightPool.toggle());
      await page.waitForFunction(
        (frame) => window.lightPool.state.gl.info.render.frame > frame,
        before.frame,
      );
      const after = await page.evaluate(() => {
        const { gl, scene } = window.lightPool.state;
        const lights = [];
        scene.traverse((object) => {
          if (object.isPointLight) lights.push(object);
        });
        return {
          ids: lights.map((light) => light.uuid),
          intensity: lights.reduce((sum, light) => sum + light.intensity, 0),
          programs: gl.info.programs.map((program) => program.id),
        };
      });
      assert.deepEqual(after.ids, before.ids);
      assert.deepEqual(after.programs, before.programs);
      assert.equal(after.intensity, 0);
      assert.deepEqual(errors, []);
    } finally {
      await session.close();
    }
  }),
);
