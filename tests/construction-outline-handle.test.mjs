import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const { ConstructionOutlineHandle } = await load("/apps/web/src/editor-preview/construct/ConstructionOutlineHandle.tsx");
  const { ConstructionOpeningTargets } = await load("/apps/web/src/editor-preview/construct/ConstructionOpeningTargets.tsx");
  const { editorCanvasEvents } = await load("/apps/web/src/editor-workspace/editor-canvas-events.ts");
  test("selected stair handle receives overlapping passage clicks before the passage", async () => {
    const selected=[];
    const noop=()=>{};
    const renderer=await create(createElement("group",null,
      createElement(ConstructionOutlineHandle,{at:[2,.25,0],name:"stair-top",handlers:{onPointerDown(){selected.push("handle")},onPointerMove:noop,onPointerUp:noop,onPointerCancel:noop}}),
      createElement(ConstructionOpeningTargets,{
        draft:{walls:[{id:"wall",from:[0,0],to:[4,0],thicknessMeters:.2}],openings:[{id:"passage",kind:"passage",wallId:"wall",offsetPlanUnits:1,widthPlanUnits:2,openingHeightMeters:2,sillHeightMeters:0}]},
        coordinates:{origin:[0,0],metersPerPlanUnit:1},previewPoint:p=>p,planMode:true,tool:"select",highlightedSelection:null,directlySelected:null,ToonMaterial:props=>createElement("meshBasicMaterial",props),onSelectOpening:()=>selected.push("passage"),
        onMoveOpening:noop,onResizeOpening:noop,
      })
    ));
    try {
      renderer.scene.instance.updateMatrixWorld(true);
      const targets=renderer.scene.findAll(n=>typeof n.props.onPointerDown==='function');
      const manager=editorCanvasEvents({getState:()=>({})});
      const hitsAt=x=>{
        const ray=new Raycaster(new Vector3(x,10,0),new Vector3(0,-1,0));
        const hits=targets.flatMap(n=>ray.intersectObject(n.instance,false)).sort((a,b)=>a.distance-b.distance);
        return manager.filter?manager.filter(hits,{}):hits;
      };
      const hits=hitsAt(2);
      assert.equal(hits[0].object.name,"stair-top");
      const winner=targets.find(n=>n.instance===hits[0].object);
      await renderer.fireEvent(winner,"pointerDown",{stopPropagation(){},nativeEvent:{},target:{setPointerCapture(){}}});
      assert.deepEqual(selected,["handle"]);
      assert.equal(hitsAt(2.8)[0].object.name,"construction-opening-target-passage");
    } finally {await renderer.unmount();}
  });
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
