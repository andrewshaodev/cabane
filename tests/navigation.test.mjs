import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const navigation = await load("/packages/engine/src/navigation.ts");
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");
  const floor = neutralDemoManifest.floors[0];

  test("normalizes touch sticks with a dead zone and hard radius", () => {
    assert.deepEqual(navigation.normalizeStickInput(2, 2, 40), { x: 0, y: 0 });
    const outside = navigation.normalizeStickInput(90, 0, 40);
    assert.equal(outside.x, 1);
    assert.equal(outside.y, 0);
  });

  test("limits diagonal velocity and clamps look pitch", () => {
    const velocity = navigation.integrateWalkVelocity({ x: 0, y: 0 }, { x: 1, y: 1 }, 1);
    assert.ok(Math.hypot(velocity.x, velocity.y) <= navigation.WALK_MAX_SPEED + 1e-6);
    assert.equal(navigation.clampPitch(Math.PI), navigation.WALK_PITCH_LIMIT);
  });

  test("slides a circle along arbitrary segment walls without tunneling", () => {
    const collider = {
      kind: "segment",
      id: "angled",
      from: { x: 0, z: 0 },
      to: { x: 3, z: 3 },
      halfThickness: 0.1,
    };
    const result = navigation.resolveCircleMovement(
      { x: 0.2, z: 1.2 },
      { x: 1.6, z: -0.7 },
      [collider],
      0.22,
    );
    const distance = Math.abs(result.z - result.x) / Math.sqrt(2);
    assert.ok(distance >= 0.319);
  });

  test("derives closed and open door collision from the door kind", () => {
    const kindOnlyFloor = structuredClone(floor);
    delete kindOnlyFloor.openings[0].walkThrough;
    const closed = navigation.deriveWalkColliders(kindOnlyFloor, new Set());
    const open = navigation.deriveWalkColliders(kindOnlyFloor, new Set(["demo-door"]));
    assert.equal(closed.length, open.length + 1);
    assert.ok(closed.some((collider) => collider.id === "north-west-junction-north-wall-walk-arm"));
    assert.ok(closed.some((collider) => collider.id === "north-west-junction-west-wall-walk-arm"));
  });

  test("keeps an architectural passage open without runtime state", () => {
    const passageFloor = structuredClone(floor);
    passageFloor.openings.push({
      id: "demo-passage",
      wallId: "east-wall",
      kind: "passage",
      offsetFromWallStartPlanUnits: 1.2,
      widthPlanUnits: 1,
      openingHeightMeters: 2.18,
      sillHeightMeters: 0,
      variant: "arched",
      archRiseMeters: 0.12,
    });

    const colliders = navigation.deriveWalkColliders(passageFloor, new Set());
    const eastWallColliders = colliders.filter((collider) =>
      collider.id.startsWith("east-wall-walk-"),
    );
    assert.equal(eastWallColliders.length, 2);
    assert.equal(
      eastWallColliders.some(
        (collider) =>
          Math.min(collider.from.z, collider.to.z) < 1.7 &&
          Math.max(collider.from.z, collider.to.z) > 1.7,
      ),
      false,
    );
  });

  test("uses hysteresis for unbound automatic doors", () => {
    assert.equal(navigation.shouldAutoOpenDoor(1.1, false), true);
    assert.equal(navigation.shouldAutoOpenDoor(1.3, false), false);
    assert.equal(navigation.shouldAutoOpenDoor(1.3, true), true);
    assert.equal(navigation.shouldAutoOpenDoor(1.6, true), false);
  });

  test("opens a wide sliding door when walking near either end", () => {
    const wideFloor = structuredClone(floor);
    const door = wideFloor.openings[0];
    door.offsetFromWallStartPlanUnits = 0.3;
    door.widthPlanUnits = 4.2;
    door.operation = "sliding";
    const nearEnd = { x: 4.35, z: 2.6 };
    const distance = navigation.distanceToOpening(nearEnd, door, wideFloor);
    assert.ok(distance < 1.15);
    assert.equal(navigation.shouldAutoOpenDoor(distance, false), true);
  });

  test("finds the current room through the floor transform", () => {
    assert.equal(navigation.roomAtWorldPoint({ x: 2.4, z: 1.8 }, floor)?.id, "demo-room");
    assert.equal(navigation.roomAtWorldPoint({ x: 9, z: 9 }, floor), null);
  });

  test("derives deterministic room connections and collision-free spawns", () => {
    const connectedFloor = {
      id: "connected-floor",
      name: "Connected floor",
      coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
      defaultWallHeightMeters: 2.5,
      defaultCeilingHeightMeters: 2.5,
      footprint: [
        [0, 0],
        [6, 0],
        [6, 3],
        [0, 3],
      ],
      rooms: [
        {
          id: "left-room",
          name: "Left room",
          polygon: [
            [0.1, 0.1],
            [2.9, 0.1],
            [2.9, 2.9],
            [0.1, 2.9],
          ],
          accent: "#aaa",
          dashboardSlots: [],
          devices: [],
        },
        {
          id: "right-room",
          name: "Right room",
          polygon: [
            [3.1, 0.1],
            [5.9, 0.1],
            [5.9, 2.9],
            [3.1, 2.9],
          ],
          accent: "#bbb",
          dashboardSlots: [],
          devices: [],
        },
      ],
      walls: [
        { id: "north", from: [0, 0], to: [6, 0], classification: "exterior", thicknessMeters: 0.2 },
        { id: "east", from: [6, 0], to: [6, 3], classification: "exterior", thicknessMeters: 0.2 },
        { id: "south", from: [6, 3], to: [0, 3], classification: "exterior", thicknessMeters: 0.2 },
        { id: "west", from: [0, 3], to: [0, 0], classification: "exterior", thicknessMeters: 0.2 },
        {
          id: "divider",
          from: [3, 0],
          to: [3, 3],
          classification: "interior",
          thicknessMeters: 0.2,
        },
      ],
      wallJunctions: [],
      openings: [
        {
          id: "room-door",
          wallId: "divider",
          kind: "door",
          offsetFromWallStartPlanUnits: 1,
          widthPlanUnits: 1,
          openingHeightMeters: 2.1,
          sillHeightMeters: 0,
          operation: "hinged",
          variant: "panel",
          finish: "wood",
          leafCount: 1,
        },
      ],
      ceilings: [],
    };

    const first = navigation.evaluateDerivedWalkNavigation(connectedFloor);
    const second = navigation.evaluateDerivedWalkNavigation(connectedFloor);
    assert.deepEqual(first.rooms, second.rooms);
    assert.deepEqual(first.connections, [
      {
        kind: "opening",
        id: "room-door",
        openingId: "room-door",
        roomIds: ["left-room", "right-room"],
      },
    ]);
    assert.deepEqual(
      first.rooms.map((room) => room.connectedRoomIds),
      [["right-room"], ["left-room"]],
    );
    assert.equal(first.diagnostics.length, 0);
    for (const room of first.rooms) {
      assert.ok(room.spawnPose);
      assert.equal(
        navigation.isWalkPointClear(room.spawnPose, first.colliders, navigation.WALK_PLAYER_RADIUS),
        true,
      );
    }
  });

  test("derives navigation across a shared room boundary with no wall", () => {
    const openPlanFloor = structuredClone(floor);
    openPlanFloor.rooms = [
      {
        ...openPlanFloor.rooms[0],
        id: "living",
        name: "Living",
        polygon: [
          [0, 0],
          [2, 0],
          [2, 3.6],
          [0, 3.6],
        ],
      },
      {
        ...openPlanFloor.rooms[0],
        id: "dining",
        name: "Dining",
        polygon: [
          [2, 0],
          [4.8, 0],
          [4.8, 3.6],
          [2, 3.6],
        ],
      },
    ];
    openPlanFloor.walls = [];
    openPlanFloor.wallJunctions = [];
    openPlanFloor.openings = [];

    const result = navigation.evaluateDerivedWalkNavigation(openPlanFloor);
    assert.deepEqual(result.connections, [
      {
        kind: "open-boundary",
        id: "open-boundary:living:dining",
        roomIds: ["living", "dining"],
      },
    ]);
    assert.deepEqual(
      result.rooms.map((room) => room.connectedRoomIds),
      [["dining"], ["living"]],
    );
    assert.equal(result.diagnostics.length, 0);
  });

  test("finds a safe spawn when a concave room centroid is outside", () => {
    const concaveFloor = structuredClone(floor);
    concaveFloor.rooms = [
      {
        ...concaveFloor.rooms[0],
        id: "concave-room",
        polygon: [
          [0, 0],
          [4, 0],
          [4, 1],
          [1, 1],
          [1, 3],
          [4, 3],
          [4, 4],
          [0, 4],
        ],
      },
    ];
    concaveFloor.walls = [];
    concaveFloor.wallJunctions = [];
    concaveFloor.openings = [];
    const spawn = navigation.safeSpawnPoseForRoom(concaveFloor.rooms[0], concaveFloor, []);
    assert.ok(spawn);
    assert.equal(navigation.roomAtWorldPoint(spawn, concaveFloor)?.id, "concave-room");
  });

  test("allows rooms without safe spawns and warns about disconnected room groups", () => {
    const singleRoom = navigation.evaluateDerivedWalkNavigation(floor);
    assert.equal(singleRoom.valid, true);
    assert.equal(singleRoom.diagnostics.length, 0);

    const isolatedFloor = structuredClone(floor);
    isolatedFloor.footprint = [
      [0, 0],
      [10, 0],
      [10, 4],
      [0, 4],
    ];
    isolatedFloor.rooms.push({
      ...isolatedFloor.rooms[0],
      id: "detached-room",
      name: "Detached room",
      polygon: [
        [6, 0],
        [10, 0],
        [10, 4],
        [6, 4],
      ],
    });
    const isolated = navigation.evaluateDerivedWalkNavigation(isolatedFloor);
    assert.equal(isolated.valid, true);
    assert.deepEqual(
      isolated.diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        severity: diagnostic.severity,
        roomId: diagnostic.roomId,
        suggestion: diagnostic.suggestion,
      })),
      [
        {
          code: "navigation.room-no-walkable-connection",
          severity: "warning",
          roomId: "detached-room",
          suggestion:
            "Add a door or passage if this room group should connect to the rest of the floor.",
        },
      ],
    );

    const blocked = navigation.evaluateDerivedWalkNavigation(floor, {
      furniture: [
        {
          kind: "box",
          id: "room-filling-obstacle",
          minX: 0,
          maxX: 4.8,
          minZ: 0,
          maxZ: 3.6,
        },
      ],
    });
    assert.equal(blocked.valid, true);
    assert.equal(blocked.rooms[0].spawnPose, null);
    assert.deepEqual(blocked.diagnostics, []);
  });

  test("accepts a cupboard too narrow for a walk spawn", () => {
    const cupboardFloor = structuredClone(floor);
    cupboardFloor.rooms = [
      {
        ...floor.rooms[0],
        name: "Cupboard",
        polygon: [
          [0, 0],
          [0.15, 0],
          [0.15, 1],
          [0, 1],
        ],
      },
    ];
    const result = navigation.evaluateDerivedWalkNavigation(cupboardFloor);
    assert.equal(result.rooms[0].spawnPose, null);
    assert.equal(result.valid, true);
    assert.deepEqual(result.diagnostics, []);
  });

  test("restores valid scene state and ignores broken storage", () => {
    const storage = {
      getItem: () =>
        JSON.stringify({ mode: "room", selectedRoomId: "demo-room", wallFadeEnabled: false }),
    };
    assert.deepEqual(navigation.readSceneSession(storage), {
      mode: "room",
      selectedRoomId: "demo-room",
      wallFadeEnabled: false,
    });
    assert.equal(navigation.readSceneSession({ getItem: () => "{" }).mode, "overview");
  });

  test("migrates a validated legacy scene session without deleting it", () => {
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };
    const state = { mode: "room", selectedRoomId: "demo-room", wallFadeEnabled: false };
    values.set("smart-home-3d-scene-session", JSON.stringify(state));
    assert.deepEqual(navigation.readSceneSession(storage), state);
    assert.equal(values.get(navigation.SCENE_SESSION_STORAGE_KEY), JSON.stringify(state));
    assert.equal(values.has("smart-home-3d-scene-session"), true);
  });
});
