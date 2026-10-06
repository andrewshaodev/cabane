import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const {
    ownerSceneDeviceItems,
    homeExtensions,
    homeManifest,
    ownerHomeProject,
  } = await load("/tests/fixtures/bundled-home.ts");
  const { stableDeviceRegistry } = await load(
    "/packages/catalog/src/device/index.ts",
  );
  const { stableFurnishingRegistry } = await load(
    "/packages/catalog/src/furnishing/index.ts",
  );
  const {
    composeHomeManifest,
    parseHomeProjectSchema,
    validateHomeProject,
    validateHomeManifest,
  } = await load("/packages/engine/src/index.ts");

  const homeFurnishingItems = ownerHomeProject.sceneItems.filter((item) => item.kind === "furnishing");

  const registries = {
    furnishingModels: Object.assign(
      Object.create(null),
      stableFurnishingRegistry,
      homeExtensions.furnishingModels,
    ),
    deviceModels: Object.assign(
      Object.create(null),
      stableDeviceRegistry,
      homeExtensions.deviceModels,
    ),
  };

  test("calibrates the owner floor without breaking physical device mounting gaps", () => {
    assert.equal(ownerHomeProject.floors[0].coordinates.metersPerPlanUnit, 1);
    assert.equal(ownerHomeProject.floors[0].coordinates.scaleBasis, "inferred");
    const result = validateHomeManifest(homeManifest, { deviceModels: stableDeviceRegistry });
    assert.deepEqual(result.issues, []);
    assert.equal(result.canRender, true);
  });

  test("exports a pure-JSON owner-home project seed", () => {
    assert.equal(ownerHomeProject.seedRevision, "south-garden-villa-wraparound-balcony-v4");
    assert.deepEqual(JSON.parse(JSON.stringify(ownerHomeProject)), ownerHomeProject);
    assert.deepEqual(parseHomeProjectSchema(ownerHomeProject), {
      valid: true,
      project: ownerHomeProject,
    });
  });

  test("separates layout, profiles, and declarative scene items", () => {
    assert.equal(ownerHomeProject.floors[0].rooms.length, 5);
    assert.ok(ownerHomeProject.floors[0].rooms.every((room) =>
      room.dashboardSlots.length === 0 && room.devices.length === 0 &&
      !("furnishings" in room)
    ));
    assert.ok(ownerHomeProject.floors[0].openings.every((opening) =>
      !("contactSlot" in opening) && !("visualModel" in opening)
    ));
    assert.equal(
      ownerHomeProject.sceneItems.length,
      homeFurnishingItems.length + ownerSceneDeviceItems.length,
    );
    assert.equal(
      ownerHomeProject.sceneItems.filter((item) => item.kind === "furnishing").length,
      homeFurnishingItems.length,
    );
    assert.equal(
      ownerHomeProject.sceneItems.filter((item) => item.kind === "device").length,
      ownerSceneDeviceItems.length,
    );
    assert.deepEqual(
      ownerHomeProject.roomProfiles["open-plan-living"].dashboardSlots,
      homeManifest.floors[0].rooms.find((room) => room.id === "open-plan-living").dashboardSlots,
    );

  });

  test("passes full project validation with merged stable and home registries", () => {
    const result = validateHomeProject(ownerHomeProject, registries);
    assert.equal(result.valid, true, JSON.stringify(result.issues, null, 2));
  });

  test("recomposes the owner runtime manifest without losing binding slots", () => {
    const manifest = composeHomeManifest(ownerHomeProject, homeExtensions);
    assert.equal(manifest.floors.length, 2);
    assert.equal(manifest.sceneItems.length, ownerHomeProject.sceneItems.length);
    const roomDeviceIds = manifest.floors.flatMap((floor) => floor.rooms.flatMap((room) => room.devices.map((device) => device.id)));
    assert.equal(new Set(roomDeviceIds).size, roomDeviceIds.length);
    assert.ok(roomDeviceIds.every((id) => ownerSceneDeviceItems.some((item) => item.id === id)));
    assert.ok(roomDeviceIds.length > 0);

  });
});
