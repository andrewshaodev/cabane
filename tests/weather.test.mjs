import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { normalizeWeather, resolveWeatherSource, weatherChoices } = await load(
    "/packages/engine/src/weather/weather-state.ts",
  );
  const { deriveWeatherAppearance, weatherSolarLighting } = await load(
    "/packages/engine/src/weather/weather-appearance.ts",
  );
  const { deriveSolarLighting, resolveSolarLighting } = await load(
    "/packages/engine/src/lighting.ts",
  );
  const { createWeatherShelter } = await load("/packages/engine/src/weather/weather-shelter.ts");
  const { updateWorkspaceWeatherSource } = await load(
    "/apps/web/src/workspaces/workspace-weather-source.ts",
  );
  const {
    createSeedProjectRecord,
    composeHomeManifest,
    validateRuntimeBindingProfile,
    exportRuntimeBindingProfile,
    reconcileWorkspaceBindings,
    serializeHomeProject,
    parseHomeProjectRecord,
  } = await load("/packages/engine/src/index.ts");
  const { ownerHomeProject, homeExtensions } = await load("/tests/fixtures/bundled-home.ts");
  const { stableDeviceRegistry } = await load("/packages/catalog/src/device/index.ts");
  const { stableFurnishingRegistry } = await load("/packages/catalog/src/furnishing/index.ts");
  const runtime = (states = {}) => ({
    status: "connected",
    entityRegistry: [],
    entityStates: states,
  });
  const entity = (state = "rainy", extra = {}) => ({
    state,
    available: true,
    stale: false,
    attributes: {},
    ...extra,
  });
  test("automatic selection counts unavailable sources and never replaces an explicit selection", () => {
    assert.equal(resolveWeatherSource(runtime()).snapshot, null);
    assert.equal(
      resolveWeatherSource(runtime({ "weather.home": entity() })).snapshot.condition,
      "rainy",
    );
    const two = runtime({
      "weather.home": entity(),
      "weather.away": entity("unavailable", { available: false }),
    });
    assert.equal(resolveWeatherSource(two).selected, null);
    assert.match(resolveWeatherSource(two).status, /Choose/);
    assert.equal(resolveWeatherSource(two, "weather.away").snapshot, null);
    assert.equal(resolveWeatherSource(two, "weather.missing").selected, "weather.missing");
    assert.equal(resolveWeatherSource(two, "off").snapshot, null);
    assert.equal(
      resolveWeatherSource({ ...two, status: "disconnected" }, "weather.home").snapshot,
      null,
    );
    assert.equal(
      resolveWeatherSource(runtime({ "weather.home": entity("snowy", { stale: true }) })).snapshot,
      null,
    );
    const disabled = {
      ...two,
      entityRegistry: [{ entity_id: "weather.away", disabled_by: "user" }],
    };
    assert.equal(resolveWeatherSource(disabled).selected, "weather.home");
  });
  test("conditions and optional units normalize without inventing readings", () => {
    for (const [condition] of weatherChoices)
      assert.equal(normalizeWeather(condition).condition, condition);
    assert.equal(normalizeWeather("sunny").condition, "clear");
    assert.equal(normalizeWeather("clear-night").condition, "clear");
    assert.equal(normalizeWeather("exceptional"), null);
    assert.equal(normalizeWeather("alien"), null);
    assert.deepEqual(
      normalizeWeather("rainy", { wind_speed: NaN, cloud_coverage: 101, visibility: -1 }),
      { condition: "rainy" },
    );
    const result = normalizeWeather("rainy", {
      wind_speed: 36,
      wind_speed_unit: "km/h",
      wind_bearing: "NE",
      visibility: 1,
      visibility_unit: "mi",
      cloud_coverage: 65,
    });
    assert.equal(result.windSpeed, 10);
    assert.equal(result.windBearing, 45);
    assert.equal(result.visibility, 1609.344);
    assert.equal(result.cloudCoverage, 0.65);
    assert.ok(deriveWeatherAppearance({ condition: "windy", windBearing: 0 }, 90).windX < 0);
  });
  test("weather attenuates light without changing solar time or direction", () => {
    for (const mode of ["day", "night"]) {
      const sun = deriveSolarLighting(undefined, mode, 32);
      for (const [condition] of weatherChoices) {
        const lit = weatherSolarLighting(sun, deriveWeatherAppearance({ condition }));
        assert.deepEqual(lit.sunPosition, sun.sunPosition);
        assert.equal(lit.daylight, sun.daylight);
        assert.ok(lit.sunIntensity <= sun.sunIntensity);
        assert.ok(lit.hemisphereIntensity >= sun.hemisphereIntensity * 0.94);
      }
    }
    assert.equal(resolveSolarLighting("night", undefined, new Date()).night, true);
  });
  test("weather source round-trips privately and preserves independent draft changes", () => {
    const original = createSeedProjectRecord(ownerHomeProject);
    original.draft.home.name = "Unpublished edit";
    const updated = updateWorkspaceWeatherSource(
      original,
      "https://fixture-ha.test/path",
      "weather.home",
    );
    assert.equal(updated.published.home.name, ownerHomeProject.home.name);
    assert.equal(updated.draft.home.name, "Unpublished edit");
    assert.deepEqual(original.bindings, {});
    const state = updated.bindings["https://fixture-ha.test"];
    assert.equal(state.draft.weatherSource, "weather.home");
    assert.equal(state.published.weatherSource, "weather.home");
    const manifest = composeHomeManifest(ownerHomeProject, homeExtensions);
    assert.equal(
      validateRuntimeBindingProfile(
        JSON.parse(exportRuntimeBindingProfile(state.published)),
        manifest,
      ).profile.weatherSource,
      "weather.home",
    );
    assert.equal(
      reconcileWorkspaceBindings(updated.bindings, manifest)["https://fixture-ha.test"].draft
        .weatherSource,
      "weather.home",
    );
    assert.equal(
      validateRuntimeBindingProfile({ ...state.published, weatherSource: "light.home" }, manifest)
        .valid,
      false,
    );
    const registries = {
      furnishingModels: { ...stableFurnishingRegistry, ...homeExtensions.furnishingModels },
      deviceModels: { ...stableDeviceRegistry, ...homeExtensions.deviceModels },
    };
    const parsed = parseHomeProjectRecord(JSON.stringify(updated), registries);
    assert.equal(parsed.valid, true);
    assert.equal(
      parsed.record.bindings["https://fixture-ha.test"].published.weatherSource,
      "weather.home",
    );
    assert.doesNotMatch(serializeHomeProject(updated.published), /weather\.home/);
  });
  test("shelter follows roof heights and preserves an exposed courtyard regardless of visibility", () => {
    const base = structuredClone(ownerHomeProject.floors[0]);
    const room = base.rooms[0];
    const floor = {
      ...base,
      coordinates: { ...base.coordinates, origin: [0, 0], metersPerPlanUnit: 1 },
      footprint: [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
      rooms: [
        {
          ...room,
          id: "west",
          polygon: [
            [0, 0],
            [3, 0],
            [3, 10],
            [0, 10],
          ],
        },
        {
          ...room,
          id: "east",
          polygon: [
            [7, 0],
            [10, 0],
            [10, 10],
            [7, 10],
          ],
        },
      ],
      walls: [],
      ceilings: undefined,
      outdoorPlatforms: [],
    };
    const shelter = createWeatherShelter([floor]);
    try {
      assert.ok(shelter.heightAt(1, 5) >= floor.defaultCeilingHeightMeters);
      assert.equal(shelter.heightAt(5, 5), -0.06);
      assert.equal(shelter.heightAt(15, 5), -0.06);
      assert.ok(shelter.texture.image.data.every(Number.isFinite));
    } finally {
      shelter.texture.dispose();
    }
  });
});
