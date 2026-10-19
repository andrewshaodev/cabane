import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const catalog = await load("/packages/catalog/src/device/index.ts");
  const engine = await load("/packages/engine/src/index.ts");
  const fixtures = await load("/tests/fixtures/agent-home.tsx");
  const { homeManifest } = await load("/tests/fixtures/bundled-home.ts");

  const validate = (manifest) =>
    engine.validateHomeManifest(manifest, {
      deviceModels: catalog.stableDeviceRegistry,
    });
  const copyManifest = (manifest) => ({
    ...manifest,
    floors: structuredClone(manifest.floors),
    extensions: manifest.extensions,
  });

  test("keeps the complete layout fixture unfurnished and equips one room only after the pause", () => {
    const layout = validate(fixtures.layoutFixtureManifest);
    const room = validate(fixtures.equippedFixtureManifest);
    assert.deepEqual(layout.issues, []);
    assert.deepEqual(room.issues, []);
    assert.equal(fixtures.layoutFixtureManifest.floors[0].rooms.length, 2);
    assert.ok(
      fixtures.layoutFixtureManifest.floors[0].rooms.every(
        (candidate) => !candidate.furnishings && candidate.devices.length === 0,
      ),
    );
    const equipped = fixtures.equippedFixtureManifest.floors[0].rooms.filter(
      (candidate) => candidate.furnishings || candidate.devices.length > 0,
    );
    assert.deepEqual(
      equipped.map((candidate) => candidate.id),
      ["fixture-studio"],
    );
    const fixtureModels = equipped[0].devices.map((device) => device.model);
    assert.ok(fixtureModels.every((model) => catalog.STABLE_DEVICE_MODEL_IDS.includes(model)));
    assert.equal(new Set(fixtureModels).size, fixtureModels.length);
  });

  test("exposes editor entry points and scene actions in their visual order", () => {
    assert.deepEqual(
      homeManifest.shortcuts.map((shortcut) => shortcut.action),
      [
        "construct-mode",
        "arrange-mode",
        "connect-mode",
        "walk-mode",
        "lighting-mode",
        "wall-fade",
        "all-lights",
      ],
    );
  });

  test("validates wall-mounted and horizontal support contacts numerically", () => {
    const floor = fixtures.equippedFixtureManifest.floors[0];
    const room = floor.rooms[0];
    for (const [index, binding] of room.devices.entries()) {
      const issues = engine.validateDevicePlacementContact({
        binding,
        definition: catalog.stableDeviceRegistry[binding.model],
        floor,
        room,
        path: `floors[0].rooms[0].devices[${index}]`,
      });
      assert.deepEqual(
        issues,
        [],
        `${binding.id}: ${issues.map((item) => item.message).join("; ")}`,
      );
      assert.deepEqual(
        engine.validateDevicePlacementContact({
          binding,
          definition: {
            ...catalog.stableDeviceRegistry[binding.model],
            preferredPlacement: binding.placement.support.kind === "wall" ? "absolute" : "wall",
          },
          floor,
          room,
          path: `floors[0].rooms[0].devices[${index}]`,
        }),
        [],
        `${binding.id}: preferred support must not restrict contact validation`,
      );
    }
    assert.ok(room.devices.some((binding) => binding.placement.support.kind === "wall"));
    assert.ok(room.devices.some((binding) => binding.placement.support.kind === "surface"));
  });

  test("rejects unknown models and malformed placement data at exact paths", () => {
    const invalid = copyManifest(fixtures.equippedFixtureManifest);
    const first = invalid.floors[0].rooms[0].devices[0];
    first.model = "unknown-fixture-model";
    first.placement.scale = 0;
    first.placement.elevationMeters = -1;
    first.placement.at = [Number.NaN, 0];
    const result = validate(invalid);
    assert.ok(
      result.issues.some(
        (item) => item.code === "device.model-extension" && item.path.endsWith("devices[0].model"),
      ),
    );
    assert.ok(
      result.issues.some(
        (item) => item.code === "device.placement" && item.path.endsWith("devices[0].placement.at"),
      ),
    );
    assert.ok(
      result.issues.some(
        (item) => item.code === "device.scale" && item.path.endsWith("devices[0].placement.scale"),
      ),
    );
  });

  test("accepts a documented home-local model definition without stable-package internals", () => {
    const manifest = copyManifest(fixtures.layoutFixtureManifest);
    const CustomModel = () => null;
    manifest.extensions = engine.defineHomeExtensionRegistry({
      furnishingModels: {},
      roomFurnishings: {},
      openingModels: {},
      deviceModels: {
        "fixture-local-device": engine.defineDeviceModel({
          component: CustomModel,
          label: "Fixture local device",
          category: "Fixture",
          defaultRoomType: "living-room",
          defaultSize: [0.1, 0.1, 0.1],
          resizePolicy: { kind: "fixed" },
          preferredPlacement: "absolute",
          supportedDomains: ["switch"],
          mountKind: "surface",
          bounds: { min: [-0.05, 0, -0.05], max: [0.05, 0.1, 0.05] },
          outlineContact: false,
          interaction: { tapTolerancePixels: 10 },
          complexity: { visibleMeshes: 1, triangles: 12 },
        }),
      },
    });
    const target = manifest.floors[0].rooms[0];
    target.devices = [
      {
        id: "fixture-local-binding",
        model: "fixture-local-device",
        entitySlots: [
          {
            id: "fixture-local-slot",
            compatibleDomains: ["switch"],
            required: true,
            autoMap: "unique-compatible",
            deviceRole: "primary",
            presentation: { label: "Fixture local", dashboardRole: "secondary" },
          },
        ],
        placement: { at: [2, 2], elevationMeters: 0, support: { kind: "surface" } },
      },
    ];
    assert.deepEqual(validate(manifest).issues, []);
  });

  test("derives connected, unavailable, and disconnected visual variants from normalized snapshots", () => {
    const connected = fixtures.fixtureCatalogStates["switch.fixture_switch"];
    assert.equal(engine.deviceVisualStateForSnapshot(connected), "connected-active");
    assert.equal(
      engine.deviceVisualStateForSnapshot({ ...connected, state: "off" }),
      "connected-inactive",
    );
    assert.equal(
      engine.deviceVisualStateForSnapshot({ ...connected, state: "unavailable", available: false }),
      "unavailable",
    );
    assert.equal(
      engine.deviceVisualStateForSnapshot({ ...connected, stale: true }),
      "disconnected",
    );
    assert.equal(engine.deviceVisualStateForSnapshot(undefined), "disconnected");
  });

  test("resolves exact connected catalog devices and reports incompatible device classes", () => {
    const resolved = engine.resolveHomeAssistantBindings(
      fixtures.equippedFixtureManifest,
      fixtures.equippedFixtureProfile,
      fixtures.connectedCatalogRuntime,
      catalog.stableDeviceRegistry,
    );
    assert.deepEqual(resolved.issues, []);
    const incompatibleRuntime = {
      ...fixtures.connectedCatalogRuntime,
      entityStates: {
        ...fixtures.connectedCatalogRuntime.entityStates,
        "binary_sensor.fixture_motion": {
          ...fixtures.connectedCatalogRuntime.entityStates["binary_sensor.fixture_motion"],
          attributes: { device_class: "moisture" },
        },
      },
    };
    const incompatible = engine.resolveHomeAssistantBindings(
      fixtures.equippedFixtureManifest,
      fixtures.equippedFixtureProfile,
      incompatibleRuntime,
      catalog.stableDeviceRegistry,
    );
    assert.ok(
      incompatible.issues.some(
        (item) =>
          item.code === "binding.device-class-incompatible" &&
          item.entityId === "binary_sensor.fixture_motion",
      ),
    );
  });

  test("holds the 20-room/100-binding fixture inside deterministic catalog budgets", () => {
    const result = validate(fixtures.scaleFixtureManifest);
    assert.deepEqual(result.issues, []);
    const rooms = fixtures.scaleFixtureManifest.floors[0].rooms;
    const devices = rooms.flatMap((room) => room.devices);
    assert.equal(rooms.length, 20);
    assert.equal(devices.length, 100);
    assert.equal(Object.keys(fixtures.scaleFixtureProfile.entityIdsBySlotId).length, 100);
    const complexity = devices.reduce(
      (total, binding) => {
        const model = catalog.stableDeviceRegistry[binding.model];
        return {
          visibleMeshes: total.visibleMeshes + model.complexity.visibleMeshes,
          triangles: total.triangles + model.complexity.triangles,
        };
      },
      { visibleMeshes: 0, triangles: 0 },
    );
    assert.ok(complexity.visibleMeshes <= 1_600);
    assert.ok(complexity.triangles <= 500_000);
  });
});

test("import-boundary command rejects generated-home deep imports", async () => {
  const root = await mkdtemp(join(tmpdir(), "cabane-boundaries-"));
  try {
    for (const directory of ["apps", "packages", "home/src"]) {
      await mkdir(join(root, directory), { recursive: true });
    }
    await writeFile(
      join(root, "home/src/bad-import.ts"),
      'import "@cabane/engine/src/geometry";\n',
    );
    const boundary = spawnSync(
      process.execPath,
      [resolve("scripts/verify-import-boundaries.mjs")],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(boundary.status, 1);
    assert.match(boundary.stderr, /deep stable-package import/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
