import assert from "node:assert/strict";
import test from "node:test";
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { activateWalkTarget, canActivateWalkTarget } = await load(
    "/packages/engine/src/walk-tools/activate-walk-target.ts",
  );
  const { raycastWalkScene } = await load("/packages/engine/src/walk-tools/raycast-walk-scene.ts");
  const { createShotGate } = await load("/packages/walk-laser/src/shot-gate.ts");
  const { parseHomeProjectSchema } = await load("/packages/engine/src/home-project/index.ts");
  const { createEmptyHomeProject } = await load(
    "/packages/engine/src/home-project/empty-project.ts",
  );
  const { resolvePublishedActionBarItems } = await load(
    "/packages/engine/src/action-bar/action-bar-config.ts",
  );
  const { applyDemoServiceCall, createDemoDeviceState } = await load(
    "/packages/engine/src/onboarding/demo/demo-device-state.ts",
  );
  const target = { id: "lamp", label: "Desk lamp" };
  const makeBindings = () => ({
    rooms: {
      room: {
        devices: [
          {
            slot: { id: "lamp", entitySlots: [{ id: "power" }] },
            issues: [],
            entities: [
              {
                domain: "light",
                slotId: "power",
                issues: [],
                state: { entityId: "light.demo", available: true, stale: false, state: "off" },
              },
            ],
          },
        ],
      },
    },
  });

  test("walk tools persist by ID, including unavailable installations", () => {
    const project = createEmptyHomeProject("home", "Home");
    project.actionBar = {
      items: [{ id: "tool", target: { kind: "walk-tool", toolId: "example.tool" } }],
    };
    const result = parseHomeProjectSchema(project);
    assert.equal(result.valid, true, JSON.stringify(result.issues));
    assert.deepEqual(resolvePublishedActionBarItems(project.actionBar), project.actionBar.items);
    project.actionBar.items[0].target.toolId = "";
    assert.equal(parseHomeProjectSchema(project).valid, false);
  });

  test("target activation toggles only the resolved light and reports rejection", async () => {
    const bindings = makeBindings(),
      calls = [];
    const runtime = { canMutate: true, callService: async (call) => calls.push(call) };
    assert.equal(canActivateWalkTarget(target, bindings, true), true);
    assert.equal(canActivateWalkTarget(target, bindings, false), false);
    assert.equal((await activateWalkTarget(target, bindings, runtime)).status, "activated");
    assert.deepEqual(calls[0], {
      domain: "light",
      service: "turn_on",
      data: undefined,
      target: { entity_id: "light.demo" },
    });
    bindings.rooms.room.devices[0].entities[0].state.state = "on";
    await activateWalkTarget(target, bindings, runtime);
    assert.equal(calls[1].service, "turn_off");
    const result = await activateWalkTarget(target, bindings, {
      ...runtime,
      callService: async () => {
        throw Error("offline");
      },
    });
    assert.equal(result.status, "unavailable");
  });

  test("no commands for disconnected, missing, stale, invalid, unknown, ambiguous or unsupported targets", async () => {
    let calls = 0;
    const runtime = { canMutate: true, callService: async () => calls++ };
    const variants = [
      (b) => (b.rooms.room.devices[0].entities[0].state.available = false),
      (b) => (b.rooms.room.devices[0].entities[0].state.stale = true),
      (b) => (b.rooms.room.devices[0].entities[0].state.state = "unknown"),
      (b) => b.rooms.room.devices[0].issues.push({ severity: "error" }),
      (b) => b.rooms.room.devices[0].entities[0].issues.push({ severity: "error" }),
      (b) => (b.rooms.room.devices[0].entities[0].domain = "lock"),
      (b) => b.rooms.room.devices[0].entities.push({ ...b.rooms.room.devices[0].entities[0] }),
      (b) => (b.rooms.room.devices = []),
    ];
    for (const mutate of variants) {
      const bindings = makeBindings();
      mutate(bindings);
      assert.equal(canActivateWalkTarget(target, bindings, true), false);
      assert.equal((await activateWalkTarget(target, bindings, runtime)).status, "unavailable");
    }
    await activateWalkTarget(target, makeBindings(), { ...runtime, canMutate: false });
    assert.equal(calls, 0);
  });

  test("gun toggles fan, AC, sprinkler and TV bindings through their domain commands", async () => {
    for (const [domain, onState, onService, offService] of [
      ["fan", "on", "turn_on", "turn_off"],
      ["climate", "cool", "turn_on", "turn_off"],
      ["switch", "on", "turn_on", "turn_off"],
      ["valve", "open", "open_valve", "close_valve"],
      ["media_player", "playing", "turn_on", "turn_off"],
    ]) {
      const bindings = makeBindings();
      const entity = bindings.rooms.room.devices[0].entities[0];
      entity.domain = domain;
      entity.state = createDemoDeviceState(`${domain}.demo`, domain, {
        presentation: { label: "Device" },
      });
      entity.state.state = domain === "valve" ? "closed" : "off";
      const calls = [];
      const runtime = {
        canMutate: true,
        callService: async (call) => {
          calls.push(call);
          entity.state = applyDemoServiceCall(entity.state, call);
        },
      };
      assert.equal(canActivateWalkTarget(target, bindings, true), true, domain);
      assert.equal((await activateWalkTarget(target, bindings, runtime)).status, "activated");
      assert.equal(calls[0].domain, domain);
      assert.equal(calls[0].service, onService);
      entity.state.state = onState;
      assert.equal((await activateWalkTarget(target, bindings, runtime)).status, "activated");
      assert.equal(calls[1].service, offService);
      assert.equal(entity.state.state, domain === "valve" ? "closed" : "off");
      entity.state.state = "unknown";
      assert.equal(canActivateWalkTarget(target, bindings, true), false);
    }
  });

  test("gun rejects mixed power bindings unless the target names one slot", async () => {
    const bindings = makeBindings();
    bindings.rooms.room.devices[0].entities.push({
      domain: "fan",
      slotId: "fan-power",
      issues: [],
      state: { entityId: "fan.demo", available: true, stale: false, state: "off" },
    });
    const calls = [];
    const runtime = { canMutate: true, callService: async (call) => calls.push(call) };
    assert.equal(canActivateWalkTarget(target, bindings, true), false);
    assert.equal((await activateWalkTarget(target, bindings, runtime)).status, "unavailable");
    const scoped = { ...target, slotId: "fan-power" };
    assert.equal(canActivateWalkTarget(scoped, bindings, true), true);
    await activateWalkTarget(scoped, bindings, runtime);
    assert.deepEqual(
      calls.map((call) => call.target.entity_id),
      ["fan.demo"],
    );
    assert.equal(canActivateWalkTarget({ ...target, slotId: "missing" }, bindings, true), false);
  });

  test("raycast hits the first surface, ignores hidden geometry and the tool, and resolves device parents", () => {
    const scene = new Group();
    const box = (z) => {
      const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
      mesh.position.z = z;
      return mesh;
    };
    const device = new Group();
    device.userData.walkDeviceInteraction = target;
    device.add(box(-5));
    scene.add(device);
    const wall = box(-3);
    scene.add(wall);
    const weapon = box(-1);
    weapon.userData.walkToolVisual = true;
    scene.add(weapon);
    const ray = new Raycaster(new Vector3(), new Vector3(0, 0, -1));
    scene.updateMatrixWorld(true);
    assert.equal(raycastWalkScene(ray, scene).target, null);
    assert.equal(raycastWalkScene(ray, scene).hit.object, wall);
    wall.visible = false;
    assert.deepEqual(raycastWalkScene(ray, scene).target, target);
    device.visible = false;
    assert.equal(raycastWalkScene(ray, scene).hit, null);
    scene.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
  });

  test("shot gate prevents overlapping service calls and rapid repeats, then recovers after errors", async () => {
    const fire = createShotGate();
    let finish,
      shots = 0;
    const pending = fire(0, () => {
      shots++;
      return new Promise((resolve) => (finish = resolve));
    });
    assert.equal(await fire(1000, async () => shots++), false);
    finish();
    await pending;
    assert.equal(await fire(100, async () => shots++), false);
    await assert.rejects(
      fire(1000, async () => {
        throw Error("failure");
      }),
    );
    assert.equal(await fire(1400, async () => shots++), true);
    assert.equal(shots, 2);
  });
});
