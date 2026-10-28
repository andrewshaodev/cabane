import assert from "node:assert/strict";
import test from "node:test";
import React, { act, useState } from "react";
import { create } from "@react-three/test-renderer";
import { createRoot } from "react-dom/client";
import { Mesh, Texture, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
import { withStorageDom } from "./dom-test-environment.mjs";
import { testGlb } from "./fixtures/personal-glb.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const api = await load("/packages/engine/src/index.ts");
  const { controlImportedLightMaterials } = await load(
    "/packages/engine/src/imported-models/light-materials.ts",
  );
  const { ownerHomeProject } = await load("/tests/fixtures/bundled-home.ts");
  const { personalScaleFixture } = await load("/tests/fixtures/personal-models-scale.ts");
  const { LightingFields } = await load("/apps/web/src/model-lighting/LightingFields.tsx");
  const light = { position: [-2, 0.2, 0], color: "#ffe3b4", maxIntensity: 6, distance: 5 };
  const state = (changes = {}) => ({
    entityId: "light.synthetic",
    state: "on",
    available: true,
    stale: false,
    attributes: { brightness: 128, rgb_color: [0, 0, 255] },
    ...changes,
  });

  test("legacy, multiple-point and strip light settings survive project and model-pack round trips", async () => {
    const preview = await api.openGlbPreview(testGlb());
    try {
      const base = personalScaleFixture().project.customModels[0];
      for (const settings of [
        light,
        {
          ...light,
          points: [
            [0, 0.2, 0],
            [2, 0.2, 0],
          ],
          emissiveMaterials: ["Diffuser"],
        },
        { ...light, strip: { end: [2, 0.2, 0], samples: 8 }, emissiveMaterials: ["Diffuser"] },
      ]) {
        const model = {
          ...base,
          light: settings,
          asset: { sha256: preview.asset.sha256, byteLength: preview.asset.byteLength },
        };
        const project = { ...structuredClone(ownerHomeProject), customModels: [model] };
        const parsed = api.parseHomeProjectSchema(JSON.parse(JSON.stringify(project)));
        assert.equal(parsed.valid, true, JSON.stringify(parsed.issues));
        assert.deepEqual(parsed.project.customModels[0].light, settings);
        const pack = api.createCabaneModelPack([model], [preview.asset]);
        const restored = await api.readCabaneModelPack(pack);
        assert.deepEqual(restored.models[0].light, settings);
      }
      for (const invalid of [
        { points: Array(8).fill([0, 0, 0]) },
        { points: [[0, NaN, 0]] },
        { strip: { end: [2, 0, 0], samples: 9 } },
        { strip: { end: [2, 0, 0], samples: 1.5 } },
        { strip: { end: light.position, samples: 5 } },
        { strip: { end: [2, 0, 0], samples: 5 }, points: [] },
        { emissiveMaterials: ["Diffuser", "Diffuser"] },
        { emissiveMaterials: [""] },
        { emissiveMaterials: Array.from({ length: 17 }, (_, i) => `Material ${i}`) },
        { maxIntensity: -1 },
        { distance: Infinity },
      ]) {
        const parsed = api.parseHomeProjectSchema({
          ...structuredClone(ownerHomeProject),
          customModels: [{ ...base, light: { ...light, ...invalid } }],
        });
        assert.equal(parsed.valid, false, JSON.stringify(invalid));
      }
    } finally {
      preview.release();
    }
  });

  test("strip samples span both endpoints and conserve total intensity", () => {
    for (const samples of [2, 5, 8]) {
      const sources = api.importedLightSources({ ...light, strip: { end: [2, 0.2, 0], samples } });
      assert.equal(sources.length, samples);
      assert.deepEqual(sources[0].position, light.position);
      assert.deepEqual(sources.at(-1).position, [2, 0.2, 0]);
      assert.ok(
        Math.abs(
          sources.reduce((sum, source) => sum + source.maxIntensity, 0) - light.maxIntensity,
        ) < 1e-8,
      );
    }
    assert.deepEqual(api.importedLightSources(light), [light]);
  });

  test("runtime sources follow normalized placement, instance resize, shared HA state and local light modes", async () => {
    const fixture = personalScaleFixture();
    const model = {
      ...fixture.project.customModels[0],
      light: { ...light, strip: { end: [2, 0.2, 0], samples: 5 } },
    };
    const registries = api.resolveProjectModels(
      { customModels: [model] },
      { deviceModels: {}, furnishingModels: {} },
    );
    const original = fixture.project.sceneItems[0];
    const item = {
      ...original,
      size: original.size.map((n) => n * 2),
      placement: {
        kind: "absolute",
        at: [3, 4],
        elevationMeters: 1,
        rotationYRadians: Math.PI / 2,
      },
    };
    const roomId = fixture.manifest.floors[0].rooms[0].id;
    const resolved = {
      slot: { ...original, model: model.id, entitySlots: item.entitySlots },
      entities: [{ domain: "light", slotId: item.entitySlots[0].id, state: state() }],
    };
    const render = (current = item, snapshot = state(), enabled = true, count = 1) =>
      React.createElement(api.HomeAssistantSceneLighting, {
        floor: fixture.manifest.floors[0],
        deviceModels: registries.deviceModels,
        extensionDeviceModels: {},
        enabled,
        sceneItems: Array.from({ length: count }, (_, index) => ({
          ...current,
          id: index ? `extra-${index}` : item.id,
        })),
        resolvedBindings: {
          rooms: {
            [roomId]: {
              devices: [{ ...resolved, entities: [{ ...resolved.entities[0], state: snapshot }] }],
              sections: {},
            },
          },
        },
      });
    const renderer = await create(render());
    try {
      const lights = renderer.scene
        .findAll((node) => node.instance.isPointLight)
        .map((node) => node.instance);
      assert.equal(lights.length, 5);
      const transform = api.resolveItemTransform(item.placement, fixture.manifest.floors[0]);
      const expected = new Vector3(-4, 0.4, 0)
        .applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        .add(new Vector3(...transform.position));
      assert.ok(lights[0].position.distanceTo(expected) < 1e-8);
      assert.equal(lights[0].distance, 10);
      assert.ok(
        Math.abs(lights.reduce((sum, source) => sum + source.intensity, 0) - (6 * 128) / 255) <
          1e-8,
      );
      assert.ok(lights.every((source) => source.color.b > source.color.r && !source.castShadow));
      for (const snapshot of [
        state({ state: "off" }),
        state({ available: false }),
        state({ stale: true }),
        undefined,
      ]) {
        await renderer.update(render(item, snapshot ?? state({ available: false })));
        const current = renderer.scene
          .findAll((node) => node.instance.isPointLight)
          .map((node) => node.instance);
        assert.deepEqual(current, lights);
        assert.ok(current.every((source) => source.intensity === 0));
      }
      await renderer.update(
        render({ ...item, lightState: "always-on" }, state({ available: false })),
      );
      assert.equal(
        lights.reduce((sum, source) => sum + source.intensity, 0),
        6,
      );
      await renderer.update(render({ ...item, lightState: "always-on" }, state(), true, 10));
      assert.equal(renderer.scene.findAll((node) => node.instance.isPointLight).length, 32);
      await renderer.update(render(item, state(), false));
      assert.equal(renderer.scene.findAll((node) => node.instance.isPointLight).length, 0);
    } finally {
      await renderer.unmount();
    }
  });

  test("emissive materials are instance-owned, state-driven and disposed without touching shared maps or geometry", async () => {
    const resource = await api.openGlbPreview(
      testGlb({
        mutate: (json) => {
          json.materials[0].name = "Diffuser";
        },
      }),
    );
    try {
      assert.deepEqual(api.importedEmissiveMaterialNames(resource.root), ["Diffuser"]);
      const first = resource.root.clone(true),
        second = resource.root.clone(true);
      let meshA, meshB;
      first.traverse((object) => {
        if (object instanceof Mesh) meshA = object;
      });
      second.traverse((object) => {
        if (object instanceof Mesh) meshB = object;
      });
      const original = meshA.material,
        geometry = meshA.geometry;
      const map = new Texture();
      original.emissiveMap = map;
      let mapDisposals = 0,
        geometryDisposals = 0,
        originalDisposals = 0,
        cloneDisposals = 0;
      map.addEventListener("dispose", () => mapDisposals++);
      geometry.addEventListener("dispose", () => geometryDisposals++);
      original.addEventListener("dispose", () => originalDisposals++);
      const a = controlImportedLightMaterials(first, ["Diffuser"]),
        b = controlImportedLightMaterials(second, ["Diffuser"]);
      const clone = meshA.material;
      clone.addEventListener("dispose", () => cloneDisposals++);
      assert.notEqual(clone, meshB.material);
      assert.notEqual(clone, original);
      assert.equal(clone.emissiveMap, map);
      assert.equal(meshA.geometry, meshB.geometry);
      a.update(state(), light.color);
      b.update(state({ state: "off" }), light.color);
      assert.equal(clone.emissiveIntensity, 128 / 255);
      assert.equal(meshB.material.emissiveIntensity, 0);
      assert.ok(clone.emissive.b > clone.emissive.r);
      for (const snapshot of [undefined, state({ available: false }), state({ stale: true })]) {
        a.update(snapshot, light.color);
        assert.equal(clone.emissiveIntensity, 0);
      }
      a.dispose();
      a.dispose();
      assert.equal(meshA.material, original);
      assert.equal(cloneDisposals, 1);
      assert.deepEqual([mapDisposals, geometryDisposals, originalDisposals], [0, 0, 0]);
      b.dispose();
      original.emissiveMap = null;
      map.dispose();
      // Non-selected materials remain shared, including the untouched base colour.
      const untouched = controlImportedLightMaterials(first, ["Missing"]);
      assert.equal(meshA.material, original);
      untouched.dispose();
      const surface = await create(
        React.createElement(api.ImportedModelSurface, {
          root: second,
          light: { ...light, emissiveMaterials: ["Diffuser"] },
          state: state(),
        }),
      );
      const mountedMaterial = meshB.material;
      assert.equal(mountedMaterial.emissiveIntensity, 128 / 255);
      await surface.update(
        React.createElement(api.ImportedModelSurface, {
          root: second,
          light: { ...light, emissiveMaterials: ["Diffuser"] },
          state: state({ state: "off" }),
        }),
      );
      assert.equal(meshB.material.emissiveIntensity, 0);
      assert.equal(original.emissiveIntensity, 1);
      await surface.unmount();
      assert.equal(meshB.material, original);
    } finally {
      resource.release();
    }
  });

  test("import controls edit bounded sources, request preview picking and retain selected glow", () =>
    withStorageDom(async (dom) => {
      let current;
      function Harness() {
        const [value, setValue] = useState({ ...light, emissiveSurfaces: ["surface:0:0"] });
        const [picking, setPicking] = useState(null);
        current = value;
        return React.createElement(LightingFields, {
          light: value,
          onChange: setValue,
          bounds: { min: [-2, 0, -0.1], max: [2, 0.4, 0.1] },
          selected: 0,
          onSelect: () => {},
          picking,
          onPicking: setPicking,
          surfaces: [{ id: "surface:0:0", label: "Diffuser", supported: true }],
        });
      }
      await dom.mount(async () => {
        const root = createRoot(dom.document.body);
        root.render(React.createElement(Harness));
        return { unmount: () => root.unmount() };
      });
      for (let i = 0; i < 7; i++) await dom.click("Add light point");
      assert.equal(dom.button("Add light point").disabled, true);
      await act(async () => dom.document.querySelector('[aria-label="Remove point 2"]').click());
      assert.equal(current.points.length, 6);
      await dom.click("Choose in preview");
      assert.equal(dom.button("Choose in preview").getAttribute("aria-pressed"), "true");
      assert.match(dom.document.body.textContent, /Click surfaces to add or remove glow/);
      await dom.click("Choose in preview");
      assert.equal(dom.button("Choose in preview").getAttribute("aria-pressed"), "false");
      assert.deepEqual(current.emissiveSurfaces, ["surface:0:0"]);
      await dom.click("LED strip");
      assert.equal(current.points, undefined);
      assert.equal(current.strip.samples, 7);
      assert.deepEqual(current.emissiveSurfaces, ["surface:0:0"]);
      assert.equal(dom.button("Add light point"), undefined);
      await dom.click("Point lights");
      assert.equal(current.points.length, 6);
    }));
});
