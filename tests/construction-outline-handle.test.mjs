import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const { ConstructionOutlineHandle } = await load("/apps/web/src/editor-preview/construct/ConstructionOutlineHandle.tsx");
  test("outline hit targets follow position changes before another render frame", async () => {
    const handlers={onPointerDown(){},onPointerMove(){},onPointerUp(){},onPointerCancel(){}};
    const renderer=await create(createElement(ConstructionOutlineHandle,{at:[2,.25,2],name:"handle",handlers}));
    try {
      const target=renderer.scene.findByProps({name:"handle"}).instance;
      await renderer.update(createElement(ConstructionOutlineHandle,{at:[5,.25,4],name:"handle",handlers}));
      const ray=new Raycaster(new Vector3(5,20,4),new Vector3(0,-1,0));
      assert.ok(ray.intersectObject(target).length>0);
      ray.set(new Vector3(2,20,2),new Vector3(0,-1,0));
      assert.equal(ray.intersectObject(target).length,0);
    } finally {await renderer.unmount();}
  });
});
