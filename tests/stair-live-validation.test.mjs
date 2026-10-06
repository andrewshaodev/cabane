import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

await withModules(async load => {
  const { useStairValidation } = await load("/apps/web/src/editor-floors/useStairValidation.ts");
  const { makeStairProject } = await load("/tests/fixtures/multiple-floors.ts");
  test("live validation coalesces movement, trails the latest candidate and flushes the release point", async () => {
    const dom = new JSDOM('<div id="root"></div>');
    const names=["window","document","IS_REACT_ACT_ENVIRONMENT"];
    const previous=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
    for(const name of names) Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==="IS_REACT_ACT_ENVIRONMENT"?true:dom.window[name]});
    const root=createRoot(document.getElementById("root"));
    const building=makeStairProject(), valid=building.stairs[0], invalid={...valid,runMeters:0};
    let result;
    function Harness({stair}) { result=useStairValidation(building,stair); return null; }
    try {
      await act(async()=>root.render(React.createElement(Harness,{stair:valid})));
      assert.deepEqual(result.issues,[]);
      await act(async()=>root.render(React.createElement(Harness,{stair:invalid})));
      assert.deepEqual(result.issues,[],"movement does not synchronously validate");
      await act(async()=>root.render(React.createElement(Harness,{stair:{...valid,shape:"spiral",diameterMeters:1,totalTurnDegrees:361,direction:"clockwise"}})));
      await act(async()=>new Promise(resolve=>setTimeout(resolve,115)));
      assert.ok(result.issues.some(i=>i.code==="stair.turn"),"trailing result uses latest candidate");
      let final;
      await act(async()=>{ final=result.flush(valid); });
      assert.deepEqual(final,[],"release validation uses exact supplied candidate");
      assert.deepEqual(result.issues,[]);
      await act(async()=>{ result.flush(invalid); });
      assert.ok(result.issues.length > 0);
      await act(async()=>root.render(React.createElement(Harness,{stair:invalid})));
      await act(async()=>result.cancel());
      await act(async()=>new Promise(resolve=>setTimeout(resolve,115)));
      assert.deepEqual(result.issues,[],"cancel clears existing and pending validation");
      await act(async()=>{ result.flush(invalid); });
      await act(async()=>root.render(React.createElement(Harness,{stair:null})));
      assert.deepEqual(result.issues,[],"deselection clears existing diagnostics immediately");
      await act(async()=>new Promise(resolve=>setTimeout(resolve,115)));
      assert.deepEqual(result.issues,[],"deselection prevents stale trailing diagnostics");
    } finally {
      await act(async()=>root.unmount()); dom.window.close();
      for(const name of names) { if(previous[name]) Object.defineProperty(globalThis,name,previous[name]); else delete globalThis[name]; }
    }
  });
});
