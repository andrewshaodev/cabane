import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const api = await load("/packages/engine/src/stairs/index.ts");
  const { makeStairProject } = await load("/tests/fixtures/multiple-floors.ts");
  const { stableDeviceRegistry } = await load("/packages/catalog/src/device/registry.ts");
  test("walks continuously up and down a flight, changing floors only at a landing", () => {
    const project = makeStairProject();
    let pose = { x: 4, z: 1.4, floorId: "ground", elevation: 0 };
    for (let i = 0; i < 42; i++) {
      const next = api.moveBuildingWalker(project, pose, { x: 0, z: 0.1 }, new Set());
      assert.ok(Math.abs(next.elevation - pose.elevation) < 0.07);
      pose = next;
    }
    assert.equal(pose.floorId, "first");
    assert.equal(pose.elevation, 2.6);
    for (let i = 0; i < 43; i++)
      pose = api.moveBuildingWalker(project, pose, { x: 0, z: -0.1 }, new Set());
    assert.equal(pose.floorId, "ground");
    assert.equal(pose.elevation, 0);
  });
  test("uses an explicit walk point and rejects unsafe positions", () => {
    const project = makeStairProject();
    const pose = api.safeBuildingSpawn(project, "first", [2, 2]);
    assert.ok(pose);
    assert.equal(pose.x, 2);
    assert.equal(pose.z, 2);
    assert.equal(pose.floorId, "first");
    assert.equal(pose.elevation, 2.6);
    assert.equal(api.safeBuildingSpawn(project, "first", [4, 3]), null);
    assert.equal(api.safeBuildingSpawn(project, "first", [-20, -20]), null);
  });
  test("guards flight sides, upper apertures, and unsupported floor edges", () => {
    const project = makeStairProject();
    const upper = { x: 3.3, z: 3, floorId: "first", elevation: 2.6 };
    assert.deepEqual(api.moveBuildingWalker(project, upper, { x: 0.2, z: 0 }, new Set()), upper);
    const flight = { x: 4.35, z: 3, floorId: "ground", elevation: 0.975, stairId: "ground-stairs" };
    assert.deepEqual(api.moveBuildingWalker(project, flight, { x: 0.1, z: 0 }, new Set()), flight);
    assert.ok(api.safeBuildingSpawn(project, "first"));
    assert.equal(api.safeBuildingSpawn(project, "missing"), null);
  });
  test("open sides let a walker step on and off level with a floor, but railings and mid-flight sides stay closed", () => {
    const sideways = (project, pose, dx, steps) => {
      for (let i = 0; i < steps; i++)
        pose = api.moveBuildingWalker(project, pose, { x: dx, z: 0 }, new Set());
      return pose;
    };
    const open = makeStairProject();
    open.stairs = open.stairs.map((stair) => ({ ...stair, railings: "none" }));
    // Beside the first step (z 1.7 is 0.2 m into the run, below one riser), the open side can be boarded and left.
    const boarded = sideways(open, { x: 3, z: 1.7, floorId: "ground", elevation: 0 }, 0.1, 8);
    assert.equal(boarded.stairId, "ground-stairs");
    assert.ok(boarded.elevation > 0 && boarded.elevation < 0.2);
    const left = sideways(open, boarded, -0.1, 8);
    assert.equal(left.stairId, undefined);
    assert.equal(left.floorId, "ground");
    assert.equal(left.elevation, 0);
    // Higher up the flight the side stays closed even without railings.
    const midway = { x: 4, z: 3, floorId: "ground", elevation: 1.3, stairId: "ground-stairs" };
    assert.equal(sideways(open, midway, -0.1, 8).stairId, "ground-stairs");
    // With railings (the default), the side beside the first step is closed.
    const railed = sideways(
      makeStairProject(),
      { x: 3, z: 1.7, floorId: "ground", elevation: 0 },
      0.1,
      8,
    );
    assert.equal(railed.stairId, undefined);
  });
  test("retains the active stair through overlapping flights in either array order", () => {
    const project = makeStairProject();
    const original = project.stairs[0];
    const duplicate = { ...original, id: "second-stair" };
    const pose = { x: 4, z: 3, floorId: "ground", elevation: 0.975, stairId: duplicate.id };
    for (const stairs of [
      [original, duplicate],
      [duplicate, original],
    ]) {
      const building = { ...project, stairs };
      for (const prepared of [undefined, api.prepareBuildingWalk(building)]) {
        const next = api.moveBuildingWalker(
          building,
          pose,
          { x: 0, z: 0.1 },
          new Set(),
          [],
          prepared,
        );
        assert.equal(next.stairId, duplicate.id);
        assert.ok(Math.abs(next.z - 3.1) < 1e-8);
        assert.ok(next.elevation > pose.elevation);
      }
    }
  });
  test("chooses overlapping eligible entrances independently of stair array order", () => {
    const project = makeStairProject();
    const a = { ...project.stairs[0], id: "a-stair" },
      b = { ...a, id: "b-stair" };
    const pose = { x: 4, z: 1.45, floorId: "ground", elevation: 0 };
    for (const stairs of [
      [b, a],
      [a, b],
    ]) {
      const next = api.moveBuildingWalker(
        { ...project, stairs },
        pose,
        { x: 0, z: 0.1 },
        new Set(),
      );
      assert.equal(next.stairId, a.id);
      assert.ok(next.elevation > 0);
    }
  });
  test("an unrelated overlapping footprint cannot hide an eligible entrance", () => {
    const project = makeStairProject();
    const entry = project.stairs[0],
      crossing = { ...entry, id: "crossing", at: [4, 0.5] };
    const pose = { x: 4, z: 1.45, floorId: "ground", elevation: 0 };
    const next = api.moveBuildingWalker(
      { ...project, stairs: [crossing, entry] },
      pose,
      { x: 0, z: 0.1 },
      new Set(),
    );
    assert.equal(next.stairId, entry.id);
  });
  test("stops at an unsupported exit without changing elevation or floor", () => {
    for (const upper of [true, false]) {
      const project = makeStairProject();
      const floor = project.floors[upper ? 1 : 0];
      floor.footprint = [
        [0, 0],
        [2, 0],
        [2, 8],
        [0, 8],
      ];
      const pose = {
        x: 4,
        z: upper ? 5.45 : 1.55,
        floorId: upper ? "ground" : "first",
        elevation: upper ? 2.5675 : 0.0325,
        stairId: "ground-stairs",
      };
      const next = api.moveBuildingWalker(
        project,
        pose,
        { x: 0, z: upper ? 0.1 : -0.1 },
        new Set(),
      );
      assert.deepEqual(next, pose);
    }
  });
  test("stops before exiting into another stair's upper aperture", () => {
    const project = makeStairProject();
    project.stairs.push({ ...project.stairs[0], id: "overlapping-stair", at: [4, 4] });
    const pose = { x: 4, z: 5.45, floorId: "ground", elevation: 2.5675, stairId: "ground-stairs" };
    for (const prepared of [undefined, api.prepareBuildingWalk(project)]) {
      assert.deepEqual(
        api.moveBuildingWalker(project, pose, { x: 0, z: 0.1 }, new Set(), [], prepared),
        pose,
      );
    }
  });
  test("a rendered spiral bridge supports an exit across overlapping apertures", () => {
    const project = makeStairProject();
    project.stairs.push(
      { ...project.stairs[0], id: "overlapping-stair", at: [4, 4] },
      {
        id: "supporting-bridge",
        shape: "spiral",
        lowerFloorId: "ground",
        upperFloorId: "first",
        at: [3.45, 5.5],
        rotationYRadians: 0,
        diameterMeters: 2,
        totalTurnDegrees: 360,
        direction: "clockwise",
      },
    );
    const pose = { x: 4, z: 5.45, floorId: "ground", elevation: 2.5675, stairId: "ground-stairs" };
    for (const prepared of [undefined, api.prepareBuildingWalk(project)]) {
      const exit = api.moveBuildingWalker(project, pose, { x: 0, z: 0.1 }, new Set(), [], prepared);
      assert.equal(exit.floorId, "first");
      assert.equal(exit.stairId, undefined);
      const next = api.moveBuildingWalker(project, exit, { x: 0, z: 0.1 }, new Set(), [], prepared);
      assert.ok(next.z > exit.z);
      assert.equal(next.stairId, undefined);
    }
  });
  test("destination walls and furniture stop a stair exit without teleporting", () => {
    for (const obstruction of ["wall", "item"]) {
      const project = makeStairProject();
      if (obstruction === "wall") {
        project.floors[1].walls.push({
          ...project.floors[1].walls[0],
          id: "exit-wall",
          from: [3, 5.6],
          to: [5, 5.6],
        });
      } else {
        project.sceneItems = [
          {
            id: "exit-item",
            floorId: "first",
            size: [0.5, 1, 0.5],
            placement: { kind: "absolute", at: [4, 5.7], elevationMeters: 0, rotationYRadians: 0 },
          },
        ];
      }
      const pose = {
        x: 4,
        z: 5.45,
        floorId: "ground",
        elevation: 2.5675,
        stairId: "ground-stairs",
      };
      assert.deepEqual(
        api.moveBuildingWalker(project, pose, { x: 0, z: 0.1 }, new Set()),
        pose,
        obstruction,
      );
    }
  });
  test("registered hanging model bounds block a low exit but allow adequate headroom", () => {
    const project = makeStairProject();
    const pose = { x: 4, z: 5.45, floorId: "ground", elevation: 2.5675, stairId: "ground-stairs" };
    for (const elevationMeters of [2, 2.5]) {
      project.sceneItems = [
        {
          id: "exit-pendant",
          kind: "device",
          modelId: "woven-pendant",
          floorId: "first",
          size: [0.847, 0.58, 0.86],
          entitySlots: [],
          placement: { kind: "absolute", at: [4, 5.7], elevationMeters, rotationYRadians: 0 },
        },
      ];
      for (const prepared of [undefined, api.prepareBuildingWalk(project)]) {
        const next = api.moveBuildingWalker(
          project,
          pose,
          { x: 0, z: 0.1 },
          new Set(),
          [],
          prepared,
          { deviceModels: stableDeviceRegistry },
        );
        if (elevationMeters === 2)
          assert.deepEqual(next, pose, "pendant bottom at 1.42 m blocks the exit");
        else assert.equal(next.floorId, "first", "pendant bottom at 1.92 m clears the exit");
      }
    }
  });
  test("a landing on another footprint region supports exiting and continuing on that floor", () => {
    const project = makeStairProject();
    const upper = project.floors[1];
    upper.footprint = [
      [0, 0],
      [2, 0],
      [2, 8],
      [0, 8],
    ];
    upper.footprintRegions = [
      upper.footprint,
      [
        [3, 0],
        [8, 0],
        [8, 8],
        [3, 8],
      ],
    ];
    const pose = { x: 4, z: 5.45, floorId: "ground", elevation: 2.5675, stairId: "ground-stairs" };
    const exit = api.moveBuildingWalker(project, pose, { x: 0, z: 0.1 }, new Set());
    assert.equal(exit.floorId, "first");
    assert.equal(exit.stairId, undefined);
    const next = api.moveBuildingWalker(project, exit, { x: 0, z: 0.1 }, new Set());
    assert.ok(next.z > exit.z);
  });
  test("passages narrower than the player remain blocked and physical colliders remain active", () => {
    const project = makeStairProject();
    const pose = { x: 4, z: 1.45, floorId: "ground", elevation: 0 };
    for (const stair of [
      { ...project.stairs[0], widthMeters: 0.4 },
      {
        id: "narrow-spiral",
        shape: "spiral",
        lowerFloorId: "ground",
        upperFloorId: "first",
        at: [3.7, 1.5],
        rotationYRadians: 0,
        diameterMeters: 1,
        totalTurnDegrees: 360,
        direction: "clockwise",
      },
    ]) {
      assert.deepEqual(
        api.moveBuildingWalker({ ...project, stairs: [stair] }, pose, { x: 0, z: 0.1 }, new Set()),
        pose,
      );
    }
    const active = { x: 4, z: 3, floorId: "ground", elevation: 0.975, stairId: "ground-stairs" };
    const box = { kind: "box", id: "furniture", minX: 3.5, maxX: 4.5, minZ: 3.25, maxZ: 3.5 };
    const next = api.moveBuildingWalker(project, active, { x: 0, z: 0.1 }, new Set(), [box]);
    assert.ok(next.z <= 3.03 + 1e-8);
    assert.equal(next.stairId, active.stairId);
  });
  test("small spirals traverse 180, 270 and 360 degree turns in both directions", () => {
    for (const direction of ["clockwise", "counterclockwise"]) {
      for (const totalTurnDegrees of [180, 270, 360]) {
        const stair = {
          id: "small-spiral",
          shape: "spiral",
          lowerFloorId: "ground",
          upperFloorId: "first",
          at: [4, 4],
          rotationYRadians: 0,
          diameterMeters: 1.2,
          totalTurnDegrees,
          direction,
        };
        const project = { ...makeStairProject(), stairs: [stair] },
          flight = api.deriveStairFlight(project, stair);
        const first = flight.path[0],
          last = flight.path.at(-1);
        const route = [
          {
            x: first.x - flight.entranceForward[0] * 0.3,
            z: first.z - flight.entranceForward[1] * 0.3,
          },
          ...flight.path,
          { x: last.x + flight.exitForward[0] * 0.3, z: last.z + flight.exitForward[1] * 0.3 },
        ];
        let pose = { ...route[0], floorId: "ground", elevation: 0 };
        for (const [points, expectedFloor] of [
          [route, "first"],
          [route.toReversed(), "ground"],
        ]) {
          for (const target of points.slice(1)) {
            const from = pose,
              steps = Math.ceil(Math.hypot(target.x - from.x, target.z - from.z) / 0.015);
            for (let i = 1; i <= steps; i++) {
              const destination = {
                x: from.x + ((target.x - from.x) * i) / steps,
                z: from.z + ((target.z - from.z) * i) / steps,
              };
              const next = api.moveBuildingWalker(
                project,
                pose,
                { x: destination.x - pose.x, z: destination.z - pose.z },
                new Set(),
              );
              assert.ok(
                Math.abs(next.elevation - pose.elevation) < 0.15,
                `${direction} ${totalTurnDegrees}: elevation jumped`,
              );
              assert.ok(
                Math.hypot(next.x - destination.x, next.z - destination.z) < 0.001,
                `${direction} ${totalTurnDegrees}: route blocked`,
              );
              pose = next;
            }
          }
          assert.equal(pose.floorId, expectedFloor);
          assert.equal(pose.stairId, undefined);
        }
      }
    }
  });
});
