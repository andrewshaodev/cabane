import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { create } from "@react-three/test-renderer";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const { OrbitCamera } = await load("/packages/engine/src/OrbitCamera.tsx");
  const { PreviewCamera } = await load("/apps/web/src/editor-preview/PreviewCamera.tsx");
  const { deriveFloorTopology } = await load("/packages/engine/src/index.ts");
  const walls = [
    { id: "north", from: [0, 0], to: [4, 0] },
    { id: "east", from: [4, 0], to: [4, 3] },
    { id: "south", from: [4, 3], to: [0, 3] },
    { id: "west", from: [0, 3], to: [0, 0] },
  ];
  const derive = (walls) =>
    deriveFloorTopology({ floorId: "floor", floorName: "Floor", walls, openings: [], rooms: [] })
      .floor;
  const floor = derive(walls);
  const extendedFloor = derive([
    ...walls,
    { id: "extension-north", from: [4, 0], to: [10, 0] },
    { id: "extension-east", from: [10, 0], to: [10, 3] },
    { id: "extension-south", from: [10, 3], to: [4, 3] },
  ]);
  const controlsFor = (renderer) =>
    renderer.scene.find(
      (node) => node.instance?.target && node.instance?.object?.isOrthographicCamera,
    ).instance;
  const pose = (controls) => ({
    position: controls.object.position.toArray(),
    quaternion: controls.object.quaternion.toArray(),
    target: controls.target.toArray(),
    zoom: controls.object.zoom,
  });
  const options = {
    width: 1000,
    height: 800,
    beforeReturn(canvas) {
      canvas.ownerDocument = { addEventListener() {}, removeEventListener() {} };
    },
  };
  const cameraProps = (overrides = {}) => ({
    view: "top",
    resetKey: 0,
    floor,
    controlsEnabled: true,
    focusPoint: null,
    onTargetChange() {},
    savedCamera: { current: null },
    ...overrides,
  });

  const createWheelCamera = async (element) => {
    const listeners = new Map();
    const renderer = await create(element, {
      ...options,
      beforeReturn(canvas) {
        options.beforeReturn(canvas);
        canvas.clientWidth = 1000;
        canvas.clientHeight = 800;
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 800 });
        canvas.addEventListener = (type, listener, options) => {
          if (!listeners.has(type)) listeners.set(type, new Set());
          listeners.get(type).add({ listener, capture: options?.capture === true });
        };
        canvas.removeEventListener = (type, listener) => {
          for (const entry of listeners.get(type) ?? [])
            if (entry.listener === listener) listeners.get(type).delete(entry);
        };
      },
    });
    await renderer.advanceFrames(1, 1 / 60);
    const wheel = async (deltaY, overrides = {}) => {
      await act(async () => {
        let stopped = false;
        const ordered = [...(listeners.get("wheel") ?? [])].sort(
          (a, b) => Number(b.capture) - Number(a.capture),
        );
        for (const { listener } of ordered) {
          if (stopped) break;
          listener({
            deltaY,
            deltaX: 0,
            deltaMode: 0,
            clientX: 500,
            clientY: 400,
            preventDefault() {},
            stopImmediatePropagation() {
              stopped = true;
            },
            ...overrides,
          });
        }
      });
    };
    return { renderer, wheel, listeners, controls: controlsFor(renderer) };
  };

  for (const [name, element] of [
    ["orbit", createElement(OrbitCamera, { floor, resetKey: 0 })],
    ["editor 3D", createElement(PreviewCamera, cameraProps({ view: "3d" }))],
  ]) {
    test(`${name} wheel zoom responds immediately and follows scroll distance, not event count`, async () => {
      const { renderer, controls, wheel } = await createWheelCamera(element);
      try {
        const initial = controls.object.zoom;
        await wheel(100);
        const coarse = controls.object.zoom;
        assert.ok(coarse < initial * 0.9, "a mouse step must produce a useful immediate response");
        await wheel(-100);
        assert.ok(Math.abs(controls.object.zoom - initial) < 1e-8, "opposite scroll reverses zoom");
        for (let index = 0; index < 10; index++) await wheel(10);
        assert.ok(
          Math.abs(controls.object.zoom - coarse) < 1e-8,
          "equal distances yield equal zoom",
        );
        await renderer.advanceFrames(10, 1 / 60);
        assert.ok(
          Math.abs(controls.object.zoom - coarse) < 1e-8,
          "wheel zoom must not have a damping tail",
        );
        await wheel(0, { deltaX: 20 });
        assert.ok(Math.abs(controls.object.zoom - coarse) < 1e-8, "horizontal input does not zoom");
        await wheel(-10, { ctrlKey: true });
        assert.ok(controls.object.zoom > coarse * 1.09, "trackpad pinch retains its sensitivity");
      } finally {
        await renderer.unmount();
      }
    });

    test(`${name} wheel zoom preserves its cursor anchor, normalizes units and respects limits`, async () => {
      const { renderer, controls, wheel, listeners } = await createWheelCamera(element);
      try {
        const camera = controls.object;
        camera.updateMatrixWorld();
        const anchor = controls.target.clone().set(0.5, 0.2, 0.5);
        const projected = anchor.clone().project(camera);
        const targetHeight = controls.target.y;
        const cursor = { clientX: (projected.x + 1) * 500, clientY: (1 - projected.y) * 400 };
        await wheel(-30, cursor);
        await renderer.advanceFrames(1, 1 / 60);
        camera.updateMatrixWorld();
        const after = anchor.clone().project(camera);
        assert.ok(Math.hypot(after.x - projected.x, after.y - projected.y) < 1e-8);
        assert.ok(
          Math.abs(controls.target.y - targetHeight) < 1e-8,
          "orbit pivot stays on its plane",
        );
        const initial = camera.zoom;
        await wheel(1, { deltaMode: 1 });
        const line = camera.zoom;
        await wheel(-16);
        assert.ok(Math.abs(camera.zoom - initial) < 1e-8);
        await wheel(16);
        assert.ok(Math.abs(camera.zoom - line) < 1e-8, "one line equals 16 pixels");
        await wheel(1, { deltaMode: 2 });
        const page = camera.zoom;
        await wheel(-800);
        assert.ok(Math.abs(camera.zoom - line) < 1e-8, "one page uses viewport height");
        assert.ok(page < line);
        await wheel(-10000);
        assert.equal(camera.zoom, controls.maxZoom);
        const atLimit = pose(controls);
        await wheel(-10, cursor);
        assert.deepEqual(pose(controls), atLimit, "clamping must not move the cursor anchor");
        await wheel(10000);
        assert.equal(camera.zoom, controls.minZoom);
        controls.enabled = false;
        await wheel(-100);
        assert.equal(camera.zoom, controls.minZoom, "disabled controls ignore wheel input");
        controls.enabled = true;
        controls.enableZoom = false;
        await wheel(-100);
        assert.equal(camera.zoom, controls.minZoom, "disabled zoom ignores wheel input");
      } finally {
        await renderer.unmount();
      }
      assert.equal(listeners.get("wheel").size, 0, "unmount removes wheel listeners");
    });
  }

  test("construction wheel pans without clicking even when pointer controls are disabled, and pinch zooms", async () => {
    const listeners = new Map();
    const props = cameraProps({ planWheelNavigation: true, controlsEnabled: false });
    const renderer = await create(createElement(PreviewCamera, props), {
      ...options,
      beforeReturn(canvas) {
        options.beforeReturn(canvas);
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 800 });
        const add = canvas.addEventListener.bind(canvas);
        const remove = canvas.removeEventListener.bind(canvas);
        canvas.addEventListener = (type, listener, options) => {
          if (type === "wheel" && options?.capture) listeners.set(type, listener);
          add(type, listener, options);
        };
        canvas.removeEventListener = (type, listener, options) => {
          if (listeners.get(type) === listener) listeners.delete(type);
          remove(type, listener, options);
        };
      },
    });
    try {
      const controls = controlsFor(renderer);
      controls.object.lookAt(controls.target);
      const before = pose(controls);
      let prevented = 0;
      const wheel = (overrides = {}) =>
        listeners.get("wheel")({
          deltaX: 80,
          deltaY: 40,
          deltaMode: 0,
          clientX: 500,
          clientY: 400,
          preventDefault() {
            prevented++;
          },
          stopImmediatePropagation() {},
          ...overrides,
        });
      await act(async () => wheel());
      assert.equal(controls.object.zoom, before.zoom);
      assert.ok(Math.abs(controls.target.x - before.target[0] - 80 / before.zoom) < 1e-8);
      assert.ok(controls.target.z > before.target[2]);
      assert.deepEqual(props.savedCamera.current.target, controls.target.toArray());
      const panned = pose(controls);
      await act(async () => wheel({ ctrlKey: true, deltaY: -10 }));
      assert.ok(controls.object.zoom > before.zoom);
      assert.deepEqual(controls.target.toArray(), panned.target, "center pinch preserves target");
      assert.equal(prevented, 2);
      const planWheel = listeners.get("wheel");
      await renderer.update(createElement(PreviewCamera, { ...props, planWheelNavigation: false }));
      assert.notEqual(
        listeners.get("wheel"),
        planWheel,
        "leaving Construct removes the plan override",
      );
    } finally {
      await renderer.unmount();
    }
  });

  test("orbit touch rotation and pan survive a parent render during the gesture", async () => {
    const elementListeners = new Map();
    const documentListeners = new Map();
    const target = (listeners) => ({
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(listener);
      },
      removeEventListener(type, listener) {
        listeners.get(type)?.delete(listener);
      },
    });
    const dispatch = (listeners, type, pointerId, x, y) => {
      const event = {
        pointerId,
        pointerType: "touch",
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        preventDefault() {},
        timeStamp: 1000,
      };
      for (const listener of listeners.get(type) ?? []) listener(event);
    };
    const props = { floor, resetKey: 0 };
    const renderer = await create(createElement(OrbitCamera, props), {
      ...options,
      beforeReturn(canvas) {
        Object.assign(canvas, target(elementListeners));
        canvas.ownerDocument = target(documentListeners);
        canvas.clientWidth = 1000;
        canvas.clientHeight = 800;
        canvas.setPointerCapture = () => {};
        canvas.releasePointerCapture = () => {};
        canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 800 });
      },
    });
    try {
      const controls = controlsFor(renderer);
      controls.enableDamping = false;
      await act(async () => {
        dispatch(elementListeners, "pointerdown", 1, 400, 400);
        dispatch(elementListeners, "pointerdown", 2, 600, 400);
        dispatch(documentListeners, "pointermove", 1, 430, 400);
      });
      const before = controls.getAzimuthalAngle();
      await renderer.update(createElement(OrbitCamera, { ...props }));
      await act(async () => {
        dispatch(documentListeners, "pointermove", 1, 480, 400);
        dispatch(documentListeners, "pointermove", 2, 680, 400);
      });
      assert.notEqual(
        controls.getAzimuthalAngle(),
        before,
        "two-finger rotation must continue after a parent render",
      );
      await act(async () => {
        dispatch(documentListeners, "pointerup", 1, 480, 400);
        dispatch(documentListeners, "pointerup", 2, 680, 400);
      });
      const beforePan = controls.target.toArray();
      await act(async () => dispatch(elementListeners, "pointerdown", 3, 400, 400));
      await renderer.update(createElement(OrbitCamera, { ...props }));
      await act(async () => dispatch(documentListeners, "pointermove", 3, 500, 430));
      assert.notDeepEqual(
        controls.target.toArray(),
        beforePan,
        "one-finger pan must still work after the rotation ends",
      );
      await act(async () => dispatch(documentListeners, "pointerup", 3, 500, 430));
    } finally {
      await renderer.unmount();
    }
  });

  test("orbit camera preserves the live pose when roof visibility or active floors change", async () => {
    const upper = { ...extendedFloor, id: "upper" };
    const props = { floor, buildingFloors: [floor], resetKey: 0 };
    const renderer = await create(createElement(OrbitCamera, props), options);
    try {
      const controls = controlsFor(renderer);
      controls.object.position.x += 3;
      controls.target.x += 3;
      controls.object.zoom = 75;
      controls.object.updateProjectionMatrix();
      controls.update();
      const before = pose(controls);
      for (const change of [
        { showRoof: true, buildingFloors: [floor, upper] },
        { floor: upper, elevation: 3, buildingFloors: [floor, upper] },
        { showRoof: false },
      ]) {
        await renderer.update(createElement(OrbitCamera, { ...props, ...change }));
        assert.equal(controlsFor(renderer), controls);
        assert.deepEqual(pose(controls), before);
      }
      await renderer.update(createElement(OrbitCamera, { ...props, resetKey: 1 }));
      assert.notEqual(controlsFor(renderer), controls, "explicit reset still reframes");
    } finally {
      await renderer.unmount();
    }
  });

  for (const view of ["top", "3d"]) {
    test(`${view} camera preserves pan and zoom when a wall closes a new room and on undo/redo`, async () => {
      assert.equal(floor.rooms.length, 1);
      assert.equal(extendedFloor.rooms.length, 2);
      assert.notDeepEqual(floor.footprint, extendedFloor.footprint);
      const props = cameraProps({ view });
      const renderer = await create(createElement(PreviewCamera, props), options);
      try {
        const controls = controlsFor(renderer);
        controls.object.position.x += 1.5;
        controls.object.position.z -= 2;
        controls.target.x += 1.5;
        controls.target.z -= 2;
        controls.object.zoom = 75;
        controls.object.updateProjectionMatrix();
        controls.update();
        const before = pose(controls);
        for (const nextFloor of [
          floor,
          extendedFloor,
          { ...extendedFloor, id: "upper" },
          floor,
          extendedFloor,
        ]) {
          await renderer.update(
            createElement(PreviewCamera, { ...props, floor: nextFloor, controlsEnabled: false }),
          );
          await renderer.update(
            createElement(PreviewCamera, { ...props, floor: nextFloor, controlsEnabled: true }),
          );
          assert.equal(controlsFor(renderer), controls, "editing must not remount controls");
          assert.deepEqual(pose(controls), before, "topology edits must not refit the camera");
        }
      } finally {
        await renderer.unmount();
      }
    });
  }

  test("viewport resizing preserves camera pose and zoom while updating the frustum", async () => {
    let state;
    const props = cameraProps();
    const renderer = await create(createElement(PreviewCamera, props), {
      ...options,
      onCreated(value) {
        state = value;
      },
    });
    try {
      const controls = controlsFor(renderer);
      controls.object.zoom = 65;
      controls.object.position.x += 2;
      controls.target.x += 2;
      controls.update();
      const before = pose(controls);
      await act(async () => state.setSize(600, 400));
      assert.deepEqual(pose(controls), before);
      assert.equal(controls.object.right - controls.object.left, 600);
      assert.equal(controls.object.top - controls.object.bottom, 400);
    } finally {
      await renderer.unmount();
    }
  });

  test("a compact Properties drawer centers the visible scene without changing the camera pose", async () => {
    const props = cameraProps();
    const renderer = await create(createElement(PreviewCamera, props), {
      ...options,
      beforeReturn(canvas) {
        options.beforeReturn(canvas);
        canvas.ownerDocument.defaultView = { matchMedia: () => ({ matches: true }) };
      },
    });
    try {
      const controls = controlsFor(renderer);
      controls.object.zoom = 65;
      controls.object.position.x += 2;
      controls.target.x += 2;
      controls.update();
      const before = pose(controls);
      await renderer.update(createElement(PreviewCamera, { ...props, rightPanelOpen: true }));
      assert.deepEqual(pose(controls), before);
      assert.equal(controls.object.view.enabled, true);
      assert.equal(controls.object.view.offsetX, 160);
      controls.object.updateMatrixWorld(true);
      assert.ok(Math.abs(controls.target.clone().project(controls.object).x + 0.32) < 0.0001);
      await renderer.update(createElement(PreviewCamera, props));
      assert.deepEqual(pose(controls), before);
      assert.equal(controls.object.view.enabled, false);
    } finally {
      await renderer.unmount();
    }
  });

  test("pool edits preserve the camera until overview is explicitly reset to include the rim", async () => {
    const props = cameraProps();
    const renderer = await create(createElement(PreviewCamera, props), options);
    const withPool = {
      ...floor,
      pools: [
        {
          id: "pool",
          polygon: [
            [15, 0],
            [19, 0],
            [19, 3],
            [15, 3],
          ],
        },
      ],
    };
    try {
      const initial = pose(controlsFor(renderer));
      await renderer.update(createElement(PreviewCamera, { ...props, floor: withPool }));
      assert.deepEqual(pose(controlsFor(renderer)), initial);
      await renderer.update(
        createElement(PreviewCamera, { ...props, floor: withPool, resetKey: 1 }),
      );
      const reset = pose(controlsFor(renderer));
      assert.deepEqual(reset.target, [9.625, 0.2, 1.5]);
      assert.ok(reset.zoom < initial.zoom);
    } finally {
      await renderer.unmount();
    }
  });

  test("edit renders do not detach active camera pointer listeners", async () => {
    const removed = [];
    const props = cameraProps();
    const renderer = await create(createElement(PreviewCamera, props), {
      ...options,
      beforeReturn(canvas) {
        canvas.ownerDocument = {
          addEventListener() {},
          removeEventListener(type) {
            removed.push(type);
          },
        };
      },
    });
    try {
      removed.length = 0;
      await renderer.update(
        createElement(PreviewCamera, { ...props, floor: extendedFloor, controlsEnabled: false }),
      );
      await renderer.update(
        createElement(PreviewCamera, { ...props, floor: extendedFloor, controlsEnabled: true }),
      );
      assert.deepEqual(
        removed,
        [],
        "disposing controls during a gesture loses its pointer-up cleanup",
      );
    } finally {
      await renderer.unmount();
    }
  });

  test("explicit focus and view changes still frame the latest floor", async () => {
    const props = cameraProps();
    const renderer = await create(createElement(PreviewCamera, props), options);
    try {
      const initialControls = controlsFor(renderer);
      await renderer.update(
        createElement(PreviewCamera, {
          ...props,
          floor: extendedFloor,
          resetKey: 1,
          focusPoint: [8, 2],
        }),
      );
      const focused = controlsFor(renderer);
      assert.notEqual(focused, initialControls);
      assert.deepEqual(focused.target.toArray(), [8, 0.2, 2]);
      assert.equal(focused.object.zoom, (1000 / (10 * 1.48)) * 2.25);
      const focusedPose = pose(focused);
      await renderer.update(
        createElement(PreviewCamera, { ...props, floor, resetKey: 1, focusPoint: [8, 2] }),
      );
      assert.deepEqual(pose(focused), focusedPose, "edits after focusing must not reframe either");
      await renderer.update(
        createElement(PreviewCamera, { ...props, floor: extendedFloor, view: "3d", resetKey: 1 }),
      );
      const overview = controlsFor(renderer);
      assert.notEqual(overview, focused);
      assert.deepEqual(overview.target.toArray(), [5, 0.2, 1.5]);
      assert.equal(overview.object.zoom, 1000 / (10 * 1.48));
      assert.equal(overview.enableRotate, true);
    } finally {
      await renderer.unmount();
    }
  });

  test("saved camera restoration survives edits but does not override an explicit focus", async () => {
    const saved = { view: "top", position: [3, 18, 2.001], target: [3, 0.2, 2], zoom: 82 };
    const props = cameraProps({ savedCamera: { current: saved } });
    const renderer = await create(createElement(PreviewCamera, props), options);
    try {
      const controls = controlsFor(renderer);
      assert.equal(controls.object.zoom, saved.zoom);
      assert.deepEqual(controls.target.toArray(), saved.target);
      const before = pose(controls);
      await renderer.update(createElement(PreviewCamera, { ...props, floor: extendedFloor }));
      assert.deepEqual(pose(controls), before);
      await renderer.update(
        createElement(PreviewCamera, {
          ...props,
          floor: extendedFloor,
          resetKey: 1,
          focusPoint: [8, 2],
        }),
      );
      assert.deepEqual(controlsFor(renderer).target.toArray(), [8, 0.2, 2]);
      assert.notEqual(controlsFor(renderer).object.zoom, saved.zoom);
    } finally {
      await renderer.unmount();
    }
  });
});
