import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { create } from "@react-three/test-renderer";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { Box3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { resolveOpeningPositions } = await load("/packages/engine/src/opening-pose.ts");
  const { useDesktopWalkInput } = await load("/packages/engine/src/desktop-walk-input.ts");
  const { WalkCameraController } = await load("/packages/engine/src/WalkCameraController.tsx");
  const { DioramaGround } = await load("/packages/engine/src/architecture-scene/DioramaGround.tsx");
  const { DoubleBed } = await load(
    "/packages/catalog/src/furnishing/presets/bedroom/double-bed.tsx",
  );
  const { RectangularCoffeeTable } = await load(
    "/packages/catalog/src/furnishing/presets/living-room/rectangular-coffee-table.tsx",
  );
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");
  const { WALK_JUMP_APEX, WALK_JUMP_GRAVITY, WALK_JUMP_LAUNCH_SPEED, walkJumpVerticalRange } =
    await load("/packages/engine/src/navigation/walk-jump.ts");
  const { deriveWalkColliders, walkCollidersForVerticalRange } = await load(
    "/packages/engine/src/navigation/walk-colliders.ts",
  );
  const { resolveWalkFall } = await load("/packages/engine/src/navigation/walk-fall.ts");
  const { deriveStairFlight } = await load("/packages/engine/src/stairs/flight-geometry.ts");
  const { makeOutdoorPlatformProject, makeStairProject } = await load(
    "/tests/fixtures/multiple-floors.ts",
  );

  test("jump height clears low furniture and a one-metre balcony without disabling tall walls", () => {
    const range = walkJumpVerticalRange(3.2, WALK_JUMP_APEX);
    const colliders = [
      {
        kind: "box",
        id: "table",
        minX: 0,
        maxX: 1,
        minZ: 0,
        maxZ: 1,
        minY: 3.2,
        maxY: 3.6,
      },
      {
        kind: "segment",
        id: "balcony",
        from: { x: 0, z: 0 },
        to: { x: 1, z: 0 },
        halfThickness: 0.035,
        minY: 3.2,
        maxY: 4.2,
      },
      {
        kind: "segment",
        id: "wall",
        from: { x: 0, z: 1 },
        to: { x: 1, z: 1 },
        halfThickness: 0.08,
      },
    ];
    assert.deepEqual(
      walkCollidersForVerticalRange(colliders, range).map((collider) => collider.id),
      ["wall"],
    );
    assert.deepEqual(
      walkCollidersForVerticalRange(colliders, walkJumpVerticalRange(3.2, 0)).map(
        (collider) => collider.id,
      ),
      ["table", "balcony", "wall"],
    );
    const building = makeOutdoorPlatformProject();
    const balcony = deriveWalkColliders(building.floors[1], new Set(), [], 2.6).find((collider) =>
      collider.id.startsWith("first-balcony:"),
    );
    assert.equal(balcony.minY, 2.6);
    assert.equal(balcony.maxY, 3.6);
  });

  test("bed collision separates the jumpable mattress from the tall headboard", async () => {
    for (const variant of ["default", "cozy-white-blue"]) {
      const renderer = await create(createElement(DoubleBed, { variant }));
      try {
        const colliderNodes = renderer.scene.findAll(
          (node) => node.props.userData?.walkCollider === true,
        );
        const colliders = Object.fromEntries(
          colliderNodes.map((node) => [node.props.name, new Box3().setFromObject(node.instance)]),
        );
        assert.deepEqual(Object.keys(colliders).sort(), [
          "double-bed-headboard-collider",
          "double-bed-low-collider",
        ]);
        assert.ok(
          colliders["double-bed-low-collider"].max.y < 0.9,
          `${variant} low max ${colliders["double-bed-low-collider"].max.y}`,
        );
        assert.ok(colliders["double-bed-headboard-collider"].max.y > 1);
        assert.equal(
          colliderNodes.find((node) => node.props.name === "double-bed-low-collider").props.userData
            .walkSupport,
          true,
        );
        assert.equal(
          colliderNodes.find((node) => node.props.name === "double-bed-headboard-collider").props
            .userData.walkSupport,
          undefined,
        );
      } finally {
        await renderer.unmount();
      }
    }
  });

  test("the coffee table opts its flat top into walk support", async () => {
    const renderer = await create(createElement(RectangularCoffeeTable));
    try {
      const table = renderer.scene.findAll(
        (node) => node.props.name === "rectangular-coffee-table",
      )[0];
      assert.equal(table.props.userData.walkCollider, true);
      assert.equal(table.props.userData.walkSupport, true);
    } finally {
      await renderer.unmount();
    }
  });

  test("an airborne balcony exit keeps its height while falling to rendered ground", () => {
    const building = makeOutdoorPlatformProject();
    const upper = building.floors[1];
    const supported = resolveWalkFall(
      building,
      { floorId: upper.id, elevation: 2.6, x: 5, z: -1 },
      3.1,
      () => true,
    );
    assert.equal(supported.kind, "supported");
    const fall = resolveWalkFall(
      building,
      { floorId: upper.id, elevation: 2.6, x: 8.5, z: -1 },
      3.1,
      () => true,
    );
    assert.equal(fall.kind, "fall");
    assert.equal(fall.point.floorId, building.floors[0].id);
    assert.equal(fall.point.elevation + fall.jumpHeight, 3.1);
    assert.equal(
      resolveWalkFall(
        building,
        { floorId: upper.id, elevation: 2.6, x: 8.5, z: -1 },
        3.1,
        () => false,
      ).kind,
      "blocked",
    );
  });

  test("walk opens detector-bound doors locally, crosses them, and restores their sensor pose", async () => {
    const floor = neutralDemoManifest.floors[0];
    for (const sensorPosition of [0, 1, undefined]) {
      const bindings = {
        "demo-door": { bound: true, bindingKey: "contact", position: sensorPosition },
      };
      const retained = new Map();
      let automatic = new Set();
      const poseRef = { current: { x: 3.5, z: 2.7, yaw: 0, pitch: 0 } };
      const props = {
        floor,
        building: neutralDemoManifest,
        poseRef,
        movementInputRef: { current: { x: 0, y: 1 } },
        lookInputRef: { current: { x: 0, y: 0 } },
        lookDeltaRef: { current: { x: 0, y: 0 } },
        reducedMotion: true,
        boundOpeningIds: new Set(["demo-door"]),
        onOpeningsChange(ids) {
          automatic = ids;
        },
        onRoomChange() {},
      };
      const render = () =>
        createElement(WalkCameraController, {
          ...props,
          openingPositions: resolveOpeningPositions(automatic, bindings, retained),
        });
      const renderer = await create(render());
      try {
        await renderer.advanceFrames(1, 1 / 60);
        assert.ok(automatic.has("demo-door"), "approach opens even a bound closed or unknown door");
        assert.equal(resolveOpeningPositions(automatic, bindings, retained)["demo-door"], 1);
        for (let frame = 0; frame < 40; frame++) {
          await renderer.update(render());
          await renderer.advanceFrames(1, 1 / 60);
        }
        assert.ok(poseRef.current.z > 3.8, "walker crosses the doorway");
        poseRef.current.x = 2;
        poseRef.current.z = 1;
        await renderer.update(render());
        await renderer.advanceFrames(1, 1 / 60);
        assert.equal(automatic.has("demo-door"), false);
        assert.equal(
          resolveOpeningPositions(automatic, bindings, retained)["demo-door"],
          sensorPosition ?? 0,
          "departure restores the sensor pose without retaining the local override",
        );
      } finally {
        await renderer.unmount();
      }
    }
  });

  test("Space is a one-shot request only with active desktop input and cleans up on blur/deactivation", async () => {
    const dom = new JSDOM(
      '<div id="root"></div><input><textarea></textarea><select></select><div contenteditable="true"></div>',
    );
    const saved = Object.fromEntries(
      ["window", "document", "HTMLElement"].map((key) => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key),
      ]),
    );
    for (const key of Object.keys(saved))
      Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
    const root = createRoot(document.getElementById("root"));
    const movement = { current: { x: 0, y: 0 } },
      sprint = { current: false },
      jump = { current: false };
    function Probe({ active }) {
      useDesktopWalkInput(active, movement, sprint, jump);
      return null;
    }
    const key = (type, code = "Space", target = window, repeat = false) => {
      const event = new dom.window.KeyboardEvent(type, {
        code,
        repeat,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(event);
      return event;
    };
    try {
      await act(async () => root.render(createElement(Probe, { active: false })));
      assert.equal(key("keydown").defaultPrevented, false);
      assert.equal(jump.current, false);
      await act(async () => root.render(createElement(Probe, { active: true })));
      for (const target of document.querySelectorAll("input,textarea,select,[contenteditable]")) {
        if (target.hasAttribute("contenteditable"))
          Object.defineProperty(target, "isContentEditable", { value: true });
        assert.equal(key("keydown", "Space", target).defaultPrevented, false);
        assert.equal(jump.current, false);
      }
      assert.equal(key("keydown").defaultPrevented, true);
      assert.equal(jump.current, true);
      jump.current = false;
      key("keydown", "Space", window, true);
      key("keydown");
      assert.equal(jump.current, false);
      key("keyup");
      key("keydown");
      assert.equal(jump.current, true);
      window.dispatchEvent(new dom.window.Event("blur"));
      assert.equal(jump.current, false);
      key("keydown", "Space", window, true);
      assert.equal(jump.current, false);
      key("keyup");
      key("keydown");
      await act(async () => root.render(createElement(Probe, { active: false })));
      assert.equal(jump.current, false);
      assert.equal(key("keydown").defaultPrevented, false);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of Object.entries(saved)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  });

  test("the controller crosses a low rendered obstacle only while jumping", async () => {
    const floor = {
      ...structuredClone(neutralDemoManifest.floors[0]),
      rooms: [],
      walls: [],
      wallJunctions: [],
      openings: [],
      ceilings: [],
      hedges: [],
      pools: [],
      outdoorPlatforms: [],
    };
    const walk = async (jumping) => {
      const poseRef = { current: { x: 0, z: -0.5, yaw: 0, pitch: 0 } };
      const renderer = await create(
        createElement(
          "group",
          null,
          createElement(
            "mesh",
            { position: [0, 0.2, 0], userData: { walkCollider: true } },
            createElement("boxGeometry", { args: [0.5, 0.4, 0.3] }),
          ),
          createElement(WalkCameraController, {
            floor,
            poseRef,
            jumpRequestRef: { current: jumping },
            movementInputRef: { current: { x: 0, y: 1 } },
            sprintInputRef: { current: true },
            lookInputRef: { current: { x: 0, y: 0 } },
            lookDeltaRef: { current: { x: 0, y: 0 } },
            reducedMotion: true,
            openingPositions: {},
            boundOpeningIds: new Set(),
            onOpeningsChange() {},
            onRoomChange() {},
          }),
        ),
      );
      try {
        await renderer.advanceFrames(60, 1 / 60);
        return poseRef.current.z;
      } finally {
        await renderer.unmount();
      }
    };
    assert.ok((await walk(false)) < -0.35);
    assert.ok((await walk(true)) > 0.35);
  });

  test("landing on a walkable furniture top does not eject the player", async () => {
    const floor = {
      ...structuredClone(neutralDemoManifest.floors[0]),
      rooms: [],
      walls: [],
      wallJunctions: [],
      openings: [],
      ceilings: [],
      hedges: [],
      pools: [],
      outdoorPlatforms: [],
    };
    const poseRef = { current: { x: 0, z: -0.65, yaw: 0, pitch: 0 } };
    const movementInputRef = { current: { x: 0, y: 1 } };
    const jumpRequestRef = { current: true };
    const renderer = await create(
      createElement(
        "group",
        null,
        createElement(
          "mesh",
          {
            position: [0, 0.2, 0.45],
            userData: { walkCollider: true, walkSupport: true },
          },
          createElement("boxGeometry", { args: [0.8, 0.4, 1.6] }),
        ),
        createElement(WalkCameraController, {
          floor,
          poseRef,
          jumpRequestRef,
          movementInputRef,
          sprintInputRef: { current: true },
          lookInputRef: { current: { x: 0, y: 0 } },
          lookDeltaRef: { current: { x: 0, y: 0 } },
          reducedMotion: true,
          openingPositions: {},
          boundOpeningIds: new Set(),
          onOpeningsChange() {},
          onRoomChange() {},
        }),
      ),
    );
    try {
      await renderer.advanceFrames(14, 1 / 60);
      movementInputRef.current = { x: 0, y: 0 };
      await renderer.advanceFrames(46, 1 / 60);
      const camera = renderer.scene.findByType("PerspectiveCamera").instance;
      assert.ok(Math.abs(poseRef.current.x) < 0.2, `x ${poseRef.current.x}`);
      assert.ok(poseRef.current.z > -0.2, `z ${poseRef.current.z}`);
      assert.ok(Math.abs(camera.position.y - (0.4 + 1.52)) < 1e-8, `camera y ${camera.position.y}`);
      const landedZ = poseRef.current.z;
      movementInputRef.current = { x: 0, y: 1 };
      await renderer.advanceFrames(6, 1 / 60);
      movementInputRef.current = { x: 0, y: 0 };
      assert.ok(poseRef.current.z > landedZ, `walk z ${poseRef.current.z}`);
      assert.ok(
        Math.abs(camera.position.y - (0.4 + 1.52)) < 1e-8,
        `walk camera y ${camera.position.y}`,
      );
      jumpRequestRef.current = true;
      await renderer.advanceFrames(1, 1 / 60);
      assert.ok(camera.position.y > 0.4 + 1.52, `jump camera y ${camera.position.y}`);
      await renderer.advanceFrames(54, 1 / 60);
      assert.ok(Math.abs(camera.position.y - (0.4 + 1.52)) < 1e-8, `reland y ${camera.position.y}`);
      movementInputRef.current = { x: 1, y: 0 };
      await renderer.advanceFrames(30, 1 / 60);
      assert.ok(poseRef.current.x > 0.6, `step-off x ${poseRef.current.x}`);
      assert.ok(Math.abs(camera.position.y - 1.52) < 1e-8, `floor y ${camera.position.y}`);
    } finally {
      await renderer.unmount();
    }
  });

  test("the controller clears a balcony railing and begins falling to terrain", async () => {
    const building = makeOutdoorPlatformProject();
    const ground = building.floors[0];
    const upper = building.floors[1];
    const poseRef = { current: { x: 7.2, z: -1, yaw: 0, pitch: 0 } };
    const floorChanges = [];
    const renderer = await create(
      createElement(
        "group",
        null,
        createElement(DioramaGround, {
          floor: ground,
          centerX: 5,
          centerZ: 2,
          size: 20,
          color: "#8fa879",
        }),
        createElement(WalkCameraController, {
          floor: upper,
          building,
          elevation: 2.6,
          poseRef,
          jumpRequestRef: { current: true },
          movementInputRef: { current: { x: 1, y: 0 } },
          sprintInputRef: { current: true },
          lookInputRef: { current: { x: 0, y: 0 } },
          lookDeltaRef: { current: { x: 0, y: 0 } },
          reducedMotion: true,
          openingPositions: {},
          boundOpeningIds: new Set(),
          onOpeningsChange() {},
          onFloorChange(id) {
            floorChanges.push(id);
          },
          onRoomChange() {},
        }),
      ),
    );
    try {
      await renderer.advanceFrames(75, 1 / 60);
      assert.ok(poseRef.current.x > 8.25, `x ${poseRef.current.x}`);
      assert.deepEqual(floorChanges, [ground.id]);
      const camera = renderer.scene.findByType("PerspectiveCamera").instance;
      assert.ok(camera.position.y < 2.6 + 1.52, `camera y ${camera.position.y}`);
    } finally {
      await renderer.unmount();
    }
  });

  for (const fps of [30, 60, 120])
    test(`hop lands without queued airborne requests at ${fps} fps`, async () => {
      const building = makeStairProject();
      const jumpRequestRef = { current: true };
      const poseRef = { current: { x: 2, z: 2, yaw: 0, pitch: 0 } };
      const props = {
        floor: building.floors[1],
        building,
        elevation: 2.6,
        poseRef,
        jumpRequestRef,
        movementInputRef: { current: { x: 0, y: 0 } },
        lookInputRef: { current: { x: 0, y: 0 } },
        lookDeltaRef: { current: { x: 0, y: 0 } },
        reducedMotion: true,
        openingPositions: {},
        boundOpeningIds: new Set(),
        onOpeningsChange() {},
        onRoomChange() {},
      };
      const renderer = await create(createElement(WalkCameraController, props));
      try {
        const camera = renderer.scene.findByType("PerspectiveCamera").instance;
        const base = 2.6 + 1.52;
        let peak = 0,
          landedAt = 0;
        for (let i = 0; i < fps; i++) {
          if (i === Math.floor(fps / 4)) jumpRequestRef.current = true;
          await renderer.advanceFrames(1, 1 / fps);
          const height = camera.position.y - base;
          peak = Math.max(peak, height);
          if (i > 0 && height === 0 && !landedAt) landedAt = (i + 1) / fps;
          assert.equal(jumpRequestRef.current, false);
        }
        assert.ok(Math.abs(peak - WALK_JUMP_APEX) < 0.003, `peak ${peak}`);
        assert.ok(
          landedAt >= (2 * WALK_JUMP_LAUNCH_SPEED) / WALK_JUMP_GRAVITY &&
            landedAt <= (2 * WALK_JUMP_LAUNCH_SPEED) / WALK_JUMP_GRAVITY + 1 / fps,
        );
        assert.equal(camera.position.y, base);
        assert.equal(poseRef.current.z, 2);
        // A fresh press after landing works while sprinting.
        jumpRequestRef.current = true;
        props.movementInputRef.current = { x: 0, y: -1 };
        await renderer.update(
          createElement(WalkCameraController, { ...props, sprintInputRef: { current: true } }),
        );
        await renderer.advanceFrames(3, 1 / fps);
        assert.ok(camera.position.y > base);
        assert.ok(poseRef.current.z < 2);
      } finally {
        await renderer.unmount();
      }
    });
  test("jump follows stair elevation and remounting walk mode resets the hop", async () => {
    const building = makeStairProject();
    const flight = deriveStairFlight(building, building.stairs[0]);
    const poseRef = {
      current: { x: flight.startWorld[0], z: flight.startWorld[1] - 0.01, yaw: 0, pitch: 0 },
    };
    const jumpRequestRef = { current: true };
    const props = {
      floor: building.floors[0],
      building,
      elevation: 0,
      poseRef,
      jumpRequestRef,
      movementInputRef: { current: { x: 0, y: 1 } },
      lookInputRef: { current: { x: 0, y: 0 } },
      lookDeltaRef: { current: { x: 0, y: 0 } },
      reducedMotion: true,
      openingPositions: {},
      boundOpeningIds: new Set(),
      onOpeningsChange() {},
      onRoomChange() {},
    };
    let renderer = await create(createElement(WalkCameraController, props));
    try {
      await renderer.advanceFrames(15, 1 / 60);
      const camera = renderer.scene.findByType("PerspectiveCamera").instance;
      const along =
        (poseRef.current.x - flight.startWorld[0]) * flight.forward[0] +
        (poseRef.current.z - flight.startWorld[1]) * flight.forward[1];
      const ground = flight.baseElevationMeters + (flight.riseMeters * along) / flight.runMeters;
      const hop = WALK_JUMP_LAUNCH_SPEED * 0.25 - 0.5 * WALK_JUMP_GRAVITY * 0.25 * 0.25;
      assert.ok(along > 0);
      assert.ok(Math.abs(camera.position.y - (ground + 1.52 + hop)) < 1e-8);
      await renderer.unmount();
      props.poseRef.current = { x: 2, z: 2, yaw: 0, pitch: 0 };
      props.movementInputRef.current = { x: 0, y: 0 };
      renderer = await create(createElement(WalkCameraController, props));
      await renderer.advanceFrames(1, 1 / 60);
      assert.equal(renderer.scene.findByType("PerspectiveCamera").instance.position.y, 1.52);
    } finally {
      await renderer.unmount();
    }
  });
});
