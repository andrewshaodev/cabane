import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const furnishing = await load("/packages/catalog/src/furnishing/index.ts");
  const device = await load("/packages/catalog/src/device/index.ts");
  const engine = await load("/packages/engine/src/index.ts");
  const fixtures = await load("/tests/fixtures/agent-home.tsx");
  test("tapered wall shade stays within its envelope and has an open top", async () => {
    const definition = furnishing.stableFurnishingRegistry["white-tapered-wall-sconce"];
    const renderer = await create(createElement(definition.component));
    renderer.scene.instance.updateMatrixWorld(true);
    const box = new Box3().setFromObject(renderer.scene.instance);
    box
      .getSize(new Vector3())
      .toArray()
      .forEach((v, i) => assert.ok(Math.abs(v - definition.defaultSize[i]) < 0.001));
    const hits = new Raycaster(new Vector3(0, 0.4, 0), new Vector3(0, -1, 0)).intersectObject(
      renderer.scene.instance,
      true,
    );
    assert.ok(hits.length > 0);
    assert.ok(
      hits.every((hit) => hit.point.y < 0.17),
      "top must remain genuinely open",
    );
    await renderer.unmount();
  });
  test("Astro Parallel has a curved ceramic front and real upward/downward openings", async () => {
    const definition = furnishing.stableFurnishingRegistry["astro-parallel-wall-light"];
    const renderer = await create(createElement(definition.component));
    renderer.scene.instance.updateMatrixWorld(true);
    for (const [y, direction] of [
      [0.3, -1],
      [-0.2, 1],
    ])
      assert.equal(
        new Raycaster(new Vector3(0, y, 0.06), new Vector3(0, direction, 0)).intersectObject(
          renderer.scene.instance,
          true,
        ).length,
        0,
      );
    const front = new Raycaster(new Vector3(0, 0.065, 0.3), new Vector3(0, 0, -1)).intersectObject(
      renderer.scene.instance,
      true,
    );
    assert.ok(Math.abs(front[0].point.z - 0.11) < 1e-6);
    const end = new Raycaster(new Vector3(0.15, 0.065, 0.3), new Vector3(0, 0, -1)).intersectObject(
      renderer.scene.instance,
      true,
    );
    assert.ok(end[0].point.z < front[0].point.z - 0.05, "front curves back toward the ends");
    await renderer.unmount();
  });
  test("six lamp spokes meet the hub and globe interiors", async () => {
    const renderer = await create(
      createElement(furnishing.stableFurnishingRegistry["six-globe-ceiling-lamp"].component),
    );
    renderer.scene.instance.updateMatrixWorld(true);
    const arms = renderer.scene.findAllByProps({ name: "ceiling-lamp-arm" });
    const globes = renderer.scene.findAllByProps({ name: "ceiling-lamp-globe" });
    assert.equal(arms.length, 6);
    assert.equal(globes.length, 6);
    for (const arm of arms) {
      const half = arm.instance.geometry.parameters.height / 2;
      const ends = [new Vector3(0, -half, 0), new Vector3(0, half, 0)].map((v) =>
        arm.instance.localToWorld(v),
      );
      assert.ok(ends.some((v) => v.distanceTo(new Vector3(0, 0.18, 0)) < 1e-6));
      assert.ok(
        ends.some((v) =>
          globes.some((g) => v.distanceTo(g.instance.getWorldPosition(new Vector3())) < 0.1),
        ),
      );
    }
    await renderer.unmount();
  });
  test("concealed LED diffuser follows on/off and brightness without emitting on connection loss", async () => {
    const definition = device.stableDeviceRegistry["under-cabinet-led-strip"];
    assert.deepEqual(definition.supportedDomains, ["light"]);
    assert.ok(definition.sceneLight.maxIntensity > 0);
    for (const [visualState, state, expected] of [
      [
        "connected-active",
        { state: "on", available: true, attributes: { brightness: 128 } },
        (0.6 * 128) / 255,
      ],
      ["connected-inactive", { state: "off", available: true, attributes: { brightness: 255 } }, 0],
      ["disconnected", undefined, 0],
      ["unavailable", { state: "on", available: false, attributes: { brightness: 255 } }, 0],
    ]) {
      const renderer = await create(
        createElement(definition.component, {
          visualState,
          state,
          reducedMotion: true,
          walkMode: false,
          onInteract() {},
        }),
      );
      const diffuser = renderer.scene.findByProps({ name: "led-strip-diffuser" }).instance;
      assert.ok(Math.abs(diffuser.material.emissiveIntensity - expected) < 1e-10);
      const box = new Box3().setFromObject(renderer.scene.instance);
      box
        .getSize(new Vector3())
        .toArray()
        .forEach((v, i) => assert.ok(Math.abs(v - definition.defaultSize[i]) < 0.001));
      assert.ok(Math.abs(box.max.y - 0.015) < 1e-6, "channel mounts by its top");
      await renderer.unmount();
    }
  });
  test("engine physical LED source switches off and dims with the resolved light binding", async () => {
    const source = fixtures.equippedFixtureManifest;
    const floors = source.floors.map((floor, index) =>
      index
        ? floor
        : {
            ...floor,
            rooms: floor.rooms.map((room) => ({
              ...room,
              devices: room.devices.map((item) =>
                item.model === "floor-lamp" ? { ...item, model: "under-cabinet-led-strip" } : item,
              ),
            })),
          },
    );
    const manifest = { ...source, floors };
    for (const [state, expected] of [
      ["on", (3 * 128) / 255],
      ["off", 0],
      ["unavailable", 0],
    ]) {
      const runtime = {
        ...fixtures.connectedCatalogRuntime,
        entityStates: {
          ...fixtures.connectedCatalogRuntime.entityStates,
          "light.fixture_floor_lamp": {
            ...fixtures.connectedCatalogRuntime.entityStates["light.fixture_floor_lamp"],
            state,
            available: state !== "unavailable",
            attributes: { brightness: 128 },
          },
        },
      };
      const resolvedBindings = engine.resolveHomeAssistantBindings(
        manifest,
        fixtures.equippedFixtureProfile,
        runtime,
        device.stableDeviceRegistry,
      );
      const renderer = await create(
        createElement(engine.HomeAssistantSceneLighting, {
          floor: floors[0],
          resolvedBindings,
          deviceModels: device.stableDeviceRegistry,
          extensionDeviceModels: {},
          sceneItems: [],
        }),
      );
      const lights = renderer.scene.findAllByProps({ name: "ha-device-light-fixture-floor-lamp" });
      // main retains off emitters to keep the shader layout stable.
      assert.equal(lights.length, 1);
      assert.ok(Math.abs(lights[0].instance.intensity - expected) < 1e-10);
      await renderer.unmount();
    }
  });
  test("compact media television keeps wall contact and bounds in every connection state", async () => {
    const definition = device.stableDeviceRegistry["compact-wall-television"];
    assert.deepEqual(definition.supportedDomains, ["media_player"]);
    for (const visualState of [
      "connected-active",
      "connected-inactive",
      "disconnected",
      "unavailable",
    ]) {
      const renderer = await create(
        createElement(definition.component, {
          visualState,
          reducedMotion: true,
          walkMode: false,
          onInteract() {},
        }),
      );
      const box = new Box3().setFromObject(renderer.scene.instance);
      box
        .getSize(new Vector3())
        .toArray()
        .forEach((v, i) => assert.ok(Math.abs(v - definition.defaultSize[i]) < 0.001));
      assert.ok(Math.abs(box.min.z) < 0.001);
      assert.ok(Math.abs(box.min.y) < 0.001);
      await renderer.unmount();
    }
  });
});
