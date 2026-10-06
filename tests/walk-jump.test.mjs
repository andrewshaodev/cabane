import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { create } from "@react-three/test-renderer";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const { useDesktopWalkInput } = await load('/packages/engine/src/desktop-walk-input.ts');
  const { WalkCameraController } = await load('/packages/engine/src/WalkCameraController.tsx');
  const { neutralDemoManifest } = await load('/packages/engine/src/demo.ts');
  const { deriveStairFlight } = await load('/packages/engine/src/stairs/flight-geometry.ts');
  const { makeStairProject } = await load('/tests/fixtures/multiple-floors.ts');

  test('walk opens unbound doors locally and never overrides bound doors', async () => {
    const floor = neutralDemoManifest.floors[0];
    const poseRef = {current:{x:3.5,z:2.7,yaw:0,pitch:0}};
    const changes = [];
    const props = {
      floor, building:neutralDemoManifest, poseRef,
      movementInputRef:{current:{x:0,y:0}}, lookInputRef:{current:{x:0,y:0}}, lookDeltaRef:{current:{x:0,y:0}},
      reducedMotion:true, openingPositions: {}, boundOpeningIds:new Set(),
      onOpeningsChange(ids){changes.push([...ids]);}, onRoomChange(){},
    };
    const renderer = await create(createElement(WalkCameraController, props));
    try {
      await renderer.advanceFrames(1, 1/60);
      assert.ok(changes.some(ids => ids.includes('demo-door')));
      changes.length = 0;
      poseRef.current.x = 2; poseRef.current.z = 1;
      await renderer.update(createElement(WalkCameraController, {...props, openingPositions: {'demo-door': 1}}));
      await renderer.advanceFrames(1, 1/60);
      assert.deepEqual(changes.at(-1), []);
      changes.length = 0;
      await renderer.update(createElement(WalkCameraController, {...props,
        openingPositions: {'demo-door': 1}, boundOpeningIds:new Set(['demo-door'])}));
      await renderer.advanceFrames(1, 1/60);
      assert.deepEqual(changes, []);
      poseRef.current.x = 3.5; poseRef.current.z = 2.7;
      await renderer.update(createElement(WalkCameraController, {...props,
        openingPositions: {'demo-door': 0}, boundOpeningIds:new Set(['demo-door'])}));
      await renderer.advanceFrames(1, 1/60);
      assert.deepEqual(changes, [], 'proximity must not open a bound closed door');
    } finally { await renderer.unmount(); }
  });

  test('Space is a one-shot request only with active desktop input and cleans up on blur/deactivation', async () => {
    const dom = new JSDOM('<div id="root"></div><input><textarea></textarea><select></select><div contenteditable="true"></div>');
    const saved = Object.fromEntries(['window', 'document', 'HTMLElement'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    for (const key of Object.keys(saved)) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
    const root = createRoot(document.getElementById('root'));
    const movement = {current:{x:0,y:0}}, sprint = {current:false}, jump = {current:false};
    function Probe({active}) { useDesktopWalkInput(active, movement, sprint, jump); return null; }
    const key = (type, code = 'Space', target = window, repeat = false) => {
      const event = new dom.window.KeyboardEvent(type, {code, repeat, bubbles:true, cancelable:true});
      target.dispatchEvent(event);
      return event;
    };
    try {
      await act(async () => root.render(createElement(Probe, {active:false})));
      assert.equal(key('keydown').defaultPrevented, false);
      assert.equal(jump.current, false);
      await act(async () => root.render(createElement(Probe, {active:true})));
      for (const target of document.querySelectorAll('input,textarea,select,[contenteditable]')) {
        if (target.hasAttribute('contenteditable')) Object.defineProperty(target, 'isContentEditable', {value:true});
        assert.equal(key('keydown', 'Space', target).defaultPrevented, false);
        assert.equal(jump.current, false);
      }
      assert.equal(key('keydown').defaultPrevented, true);
      assert.equal(jump.current, true);
      jump.current = false;
      key('keydown', 'Space', window, true);
      key('keydown');
      assert.equal(jump.current, false);
      key('keyup'); key('keydown');
      assert.equal(jump.current, true);
      window.dispatchEvent(new dom.window.Event('blur'));
      assert.equal(jump.current, false);
      key('keydown', 'Space', window, true);
      assert.equal(jump.current, false);
      key('keyup'); key('keydown');
      await act(async () => root.render(createElement(Probe, {active:false})));
      assert.equal(jump.current, false);
      assert.equal(key('keydown').defaultPrevented, false);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of Object.entries(saved)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  });

  for (const fps of [30, 60, 120]) test(`hop lands without queued airborne requests at ${fps} fps`, async () => {
    const building = makeStairProject();
    const jumpRequestRef = {current:true};
    const poseRef = {current:{x:2,z:2,yaw:0,pitch:0}};
    const props = {
      floor:building.floors[1], building, elevation:2.6, poseRef, jumpRequestRef,
      movementInputRef:{current:{x:0,y:0}},lookInputRef:{current:{x:0,y:0}},lookDeltaRef:{current:{x:0,y:0}},
      reducedMotion:true,openingPositions: {},boundOpeningIds:new Set(),onOpeningsChange(){},onRoomChange(){}
    };
    const renderer = await create(createElement(WalkCameraController, props));
    try {
      const camera = renderer.scene.findByType('PerspectiveCamera').instance;
      const base = 2.6 + 1.52;
      let peak = 0, landedAt = 0;
      for (let i = 0; i < fps; i++) {
        if (i === Math.floor(fps / 4)) jumpRequestRef.current = true;
        await renderer.advanceFrames(1, 1/fps);
        const height = camera.position.y - base;
        peak = Math.max(peak, height);
        if (i > 0 && height === 0 && !landedAt) landedAt = (i + 1)/fps;
        assert.equal(jumpRequestRef.current, false);
      }
      assert.ok(Math.abs(peak - .4) < .003, `peak ${peak}`);
      assert.ok(landedAt >= 2*2.8/9.8 && landedAt <= 2*2.8/9.8 + 1/fps);
      assert.equal(camera.position.y, base);
      assert.equal(poseRef.current.z, 2);
      // A fresh press after landing works while sprinting.
      jumpRequestRef.current = true;
      props.movementInputRef.current = {x:0,y:-1};
      await renderer.update(createElement(WalkCameraController, {...props, sprintInputRef:{current:true}}));
      await renderer.advanceFrames(3, 1/fps);
      assert.ok(camera.position.y > base);
      assert.ok(poseRef.current.z < 2);
    } finally { await renderer.unmount(); }
  });
  test('jump follows stair elevation and remounting walk mode resets the hop', async () => {
    const building = makeStairProject();
    const flight = deriveStairFlight(building, building.stairs[0]);
    const poseRef = {current:{x:flight.startWorld[0],z:flight.startWorld[1] - .01,yaw:0,pitch:0}};
    const jumpRequestRef = {current:true};
    const props = {
      floor:building.floors[0], building, elevation:0, poseRef, jumpRequestRef,
      movementInputRef:{current:{x:0,y:1}},lookInputRef:{current:{x:0,y:0}},lookDeltaRef:{current:{x:0,y:0}},
      reducedMotion:true,openingPositions: {},boundOpeningIds:new Set(),onOpeningsChange(){},onRoomChange(){}
    };
    let renderer = await create(createElement(WalkCameraController, props));
    try {
      await renderer.advanceFrames(15, 1/60);
      const camera = renderer.scene.findByType('PerspectiveCamera').instance;
      const along = (poseRef.current.x - flight.startWorld[0]) * flight.forward[0] +
        (poseRef.current.z - flight.startWorld[1]) * flight.forward[1];
      const ground = flight.baseElevationMeters + flight.riseMeters * along / flight.runMeters;
      const hop = 2.8 * .25 - .5 * 9.8 * .25 * .25;
      assert.ok(along > 0);
      assert.ok(Math.abs(camera.position.y - (ground + 1.52 + hop)) < 1e-8);
      await renderer.unmount();
      props.poseRef.current = {x:2,z:2,yaw:0,pitch:0};
      props.movementInputRef.current = {x:0,y:0};
      renderer = await create(createElement(WalkCameraController, props));
      await renderer.advanceFrames(1, 1/60);
      assert.equal(renderer.scene.findByType('PerspectiveCamera').instance.position.y, 1.52);
    } finally { await renderer.unmount(); }
  });

});
