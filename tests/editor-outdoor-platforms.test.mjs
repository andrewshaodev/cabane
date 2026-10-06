import assert from 'node:assert/strict';
import test from 'node:test';
import { act,createElement } from 'react';
import { create } from '@react-three/test-renderer';
import { withModules } from './test-server.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
await withModules(async load=>{
  const e=await load('/packages/engine/src/index.ts');
  const {useConstructEditor}=await load('/apps/web/src/editor-preview/construct/useConstructEditor.ts');
  const {PlatformDrawingProperties}=await load('/apps/web/src/editor-preview/construct/PlatformProperties.tsx');
  const floor=e.neutralDemoManifest.floors[0];
  test('Floor platform drawing commits the creation style, selects the platform and retains it through wall edits',async()=>{
    let editor; const renderer=await create(createElement(()=>{editor=useConstructEditor(floor);return null;}));
    try{
      act(()=>editor.setTool('platform'));
      for(const point of [[10,0],[14,0],[14,3],[10,3],[10,0]]) act(()=>editor.poolDrawing.place(point));
      assert.equal(editor.draft.outdoorPlatforms?.length,1);
      assert.equal(editor.selection.kind,'outdoor-platform');
      assert.equal(editor.tool,'select');
      const before=structuredClone(editor.draft.outdoorPlatforms[0]);
      act(()=>editor.dispatch({type:'update-outdoor-platform',id:before.id,changes:{defaultEdge:{kind:'low-wall',heightMeters:.3}}}));
      act(()=>editor.undo()); assert.deepEqual(editor.draft.outdoorPlatforms[0],before);
      act(()=>editor.setTool('wall')); act(()=>editor.beginWall([20,20]));act(()=>editor.addWall([22,20]));
      assert.deepEqual(editor.previewFloor.outdoorPlatforms,[before]);
      act(()=>editor.selectMany([{kind:'outdoor-platform',id:before.id}]));act(()=>editor.deleteSelected());
      assert.equal(editor.draft.outdoorPlatforms.length,0);
      act(()=>editor.undo()); assert.deepEqual(editor.draft.outdoorPlatforms,[before]);
    }finally{await renderer.unmount();}
  });
  test('cancel ends the platform gesture and Floor restores the remembered target',async()=>{
    let editor; const renderer=await create(createElement(()=>{editor=useConstructEditor(floor);return null;}));
    try {
      act(()=>editor.setFloorPaintTarget('outdoor-platform'));
      act(()=>editor.poolDrawing.place([10,0]));
      const panel=PlatformDrawingProperties({editor});
      const cancel=panel.props.children.find(child=>child?.type==='button');
      act(()=>cancel.props.onClick());
      assert.equal(editor.tool,'select');
      assert.equal(editor.poolDrawing.active,false);
      assert.equal(editor.draft.outdoorPlatforms?.length??0,0);
      act(()=>editor.setTool('floor'));
      assert.equal(editor.tool,'platform');
      assert.equal(editor.floorPaintTarget,'outdoor-platform');
      act(()=>editor.poolDrawing.place([10,0]));
      assert.equal(editor.poolDrawing.active,true);
    } finally {await renderer.unmount();}
  });
  test('completed platform then Floor shortcut restores drawing and target changes cancel the prior gesture',async()=>{
    let editor; const renderer=await create(createElement(()=>{editor=useConstructEditor(floor);return null;}));
    try {
      act(()=>editor.setFloorPaintTarget('outdoor-platform'));
      for(const point of [[10,0],[14,0],[14,3],[10,3],[10,0]]) act(()=>editor.poolDrawing.place(point));
      assert.equal(editor.tool,'select');
      act(()=>editor.setTool('floor')); // The F shortcut and toolbar share this entry point.
      assert.equal(editor.tool,'platform');
      act(()=>editor.poolDrawing.place([15,0]));
      act(()=>editor.setFloorPaintTarget('custom-area'));
      assert.equal(editor.tool,'floor');
      assert.equal(editor.floorPaintTarget,'custom-area');
      assert.equal(editor.poolDrawing.active,false);
      act(()=>editor.setTool('select'));act(()=>editor.setTool('floor'));
      assert.equal(editor.floorPaintTarget,'custom-area');
      act(()=>editor.setFloorPaintTarget('room'));
      assert.equal(editor.tool,'floor');assert.equal(editor.floorPaintTarget,'room');
      act(()=>editor.setFloorPaintTarget('outdoor-platform'));
      assert.equal(editor.tool,'platform');assert.equal(editor.floorPaintTarget,'outdoor-platform');
      assert.equal(editor.draft.outdoorPlatforms.length,1);
    } finally {await renderer.unmount();}
  });
});
