import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { create } from "@react-three/test-renderer";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import { withModules } from "./test-server.mjs";
import { testGlb } from "./fixtures/personal-glb.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// The renderer defaults to CJS Three. Use the engine's ESM constructors.
extend(THREE);

await withModules(async (load) => {
  const api = await load("/packages/engine/src/index.ts");
  const { ModelLightingSurface } = await load(
    "/packages/engine/src/model-lighting/ModelLightingSurface.tsx",
  );
  const { GardenBench } = await load(
    "/packages/catalog/src/furnishing/presets/outdoor/garden-bench.tsx",
  );
  const { TelevisionModel } = await load(
    "/packages/catalog/src/device/presets/media/television.tsx",
  );
  const { MicrowaveModel } = await load(
    "/packages/catalog/src/device/presets/appliances/microwave.tsx",
  );
  const { makeThreeFloorProject } = await load("/tests/fixtures/multiple-floors.ts");
  const light = { position: [0, 0.5, 0], color: "#ff0000", maxIntensity: 2, distance: 5 };
  const state = {
    entityId: "light.synthetic",
    state: "on",
    attributes: {},
    available: true,
    stale: false,
  };
  const selectedMesh = (root, key) =>
    root.getObjectsByProperty("isMesh", true).find((mesh) => mesh.userData.modelGlowKey === key);

  await test("a bench leg keeps its glow identity when the Sage cushion is inserted", async () => {
    const scenes = [];
    try {
      for (const variant of ["default", "sage"])
        scenes.push(await create(React.createElement(GardenBench, { variant })));
      const roots = scenes.map((scene) => scene.scene.children[0].instance);
      const legs = roots.map((root) => selectedMesh(root, "bench.leg.back-left"));
      assert.ok(legs.every(Boolean));
      const id = api.modelLightingSurfaceAt(roots[0], legs[0]);
      assert.equal(id, "native:1:bench.leg.back-left");
      assert.equal(api.modelLightingSurfaceAt(roots[1], legs[1]), id);
      const settings = JSON.parse(JSON.stringify({ ...light, glowTargets: [id] }));
      const cushion = selectedMesh(roots[1], "bench.seat-pad");
      const original = cushion.material;
      const controls = roots.map((root) => api.controlModelLightMaterials(root, settings));
      controls.forEach((control) => control.update(state, light.color));
      assert.ok(legs.every((leg) => leg.material.emissiveIntensity === 1));
      assert.equal(cushion.material, original);
      assert.equal(cushion.material.emissive.getHexString(), "000000");
      controls.forEach((control) => control.dispose());
      const cushionId = api.modelLightingSurfaceAt(roots[1], cushion);
      assert.equal(
        api.resolveModelGlowTargets(api.modelLightingSurfaces(roots[0]), {
          glowTargets: [cushionId],
        }).unresolved.length,
        1,
      );
      assert.equal(
        api.resolveModelGlowTargets(api.modelLightingSurfaces(roots[1]), {
          glowTargets: [cushionId],
        }).unresolved.length,
        0,
      );
    } finally {
      for (const scene of scenes) await scene.unmount();
    }
  });

  await test("physical TV and appliance targets survive on/off geometry and runtime remounts", async () => {
    for (const [Component, key] of [
      [TelevisionModel, "tv.leg.left.foot"],
      [MicrowaveModel, "microwave.window"],
    ]) {
      const settings = { ...light, glowTargets: [`native:1:${key}`] };
      const render = (visualState) =>
        React.createElement(
          ModelLightingSurface,
          { light: settings, state },
          React.createElement(Component, { visualState, reducedMotion: true }),
        );
      const scene = await create(render("connected-inactive"));
      try {
        let originalId;
        for (const visualState of [
          "connected-inactive",
          "connected-active",
          "unavailable",
          "disconnected",
          "connected-inactive",
        ]) {
          await scene.update(render(visualState));
          const root = scene.scene.children[0].instance;
          const mesh = selectedMesh(root, key);
          const id = api.modelLightingSurfaceAt(root, mesh);
          originalId ??= id;
          assert.equal(id, originalId);
          assert.equal(mesh.material.emissive.getHexString(), "ff0000");
          assert.equal(mesh.material.emissiveIntensity, 1);
          assert.deepEqual(
            api.resolveModelGlowTargets(api.modelLightingSurfaces(root), settings).unresolved,
            [],
          );
        }
      } finally {
        await scene.unmount();
      }
    }
  });

  await test("authored keys ignore wrappers, names, invisible and outline/debug geometry; duplicates fail closed", () => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshToonMaterial();
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.modelGlowKey = "panel.face";
    root.add(mesh);
    const id = api.modelLightingSurfaceAt(root, mesh);
    const wrapper = new THREE.Group();
    wrapper.name = "renamed internal wrapper";
    root.add(wrapper);
    wrapper.add(mesh);
    mesh.name = "Different display label";
    material.name = "Different material label";
    for (const data of [{ sceneOutline: true }, { modelGlowIgnore: true }]) {
      const debug = mesh.clone();
      debug.userData = { ...debug.userData, ...data };
      root.add(debug);
    }
    const hidden = new THREE.Mesh(geometry, material);
    hidden.visible = false;
    root.add(hidden);
    assert.equal(api.modelLightingSurfaceAt(root, mesh), id);
    assert.equal(api.modelLightingSurfaces(root).length, 1);
    const duplicate = mesh.clone();
    root.add(duplicate);
    assert.equal(api.modelLightingSurfaceAt(root, mesh), undefined);
    assert.equal(api.modelLightingSurfaces(root).length, 1);
    assert.match(api.modelLightingSurfaces(root)[0].unavailableReason, /more than once/);
    const controller = api.controlModelLightMaterials(root, { glowTargets: [id] }, id);
    assert.equal(mesh.material, material);
    assert.equal(controller.unresolved.length, 1);
    controller.dispose();
    geometry.dispose();
    material.dispose();
  });

  await test("native material slots need authored roles; old ordinals and material names never retarget", () => {
    const geometry = new THREE.BoxGeometry();
    const body = new THREE.MeshToonMaterial();
    const trim = new THREE.MeshToonMaterial();
    body.name = trim.name = "Same display name";
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, [body, trim]);
    root.add(mesh);
    assert.ok(api.modelLightingSurfaces(root).every((option) => !option.supported));
    mesh.userData.modelGlowKey = ["panel.body", "panel.trim"];
    const id = api.modelLightingSurfaceAt(root, mesh, 1);
    mesh.material = [trim, body];
    mesh.userData.modelGlowKey = ["panel.trim", "panel.body"];
    assert.equal(api.modelLightingSurfaceAt(root, mesh, 0), id);
    const old = api.controlModelLightMaterials(root, {
      emissiveSurfaces: ["surface:0:0"],
      emissiveMaterials: [body.name],
    });
    old.update(state, light.color);
    assert.deepEqual(mesh.material, [trim, body]);
    assert.equal(old.unresolved.length, 2);
    old.dispose();
    const current = api.controlModelLightMaterials(root, { glowTargets: [id] }, id);
    current.update(state, light.color);
    assert.equal(mesh.material[1], body);
    assert.notEqual(mesh.material[0], trim);
    assert.equal(mesh.material[0].emissive.getHexString(), "398b66");
    current.dispose();
    geometry.dispose();
    body.dispose();
    trim.dispose();
  });

  await test("GLB identities use immutable asset, source node and primitive indices through normalization and asset round trips", async () => {
    const bytes = testGlb({
      mutate: (json) => {
        json.materials[0].name = "Repeated material";
        json.meshes[0].primitives.push({ ...json.meshes[0].primitives[0] });
        json.nodes.push({ mesh: 0, translation: [2, 0, 0] });
        json.scenes[0].nodes.push(1);
      },
    });
    const preview = await api.openGlbPreview(bytes);
    let restored;
    try {
      const options = api.modelLightingSurfaces(preview.root);
      const ids = options.map((surface) => surface.id).sort();
      assert.equal(ids.length, 4);
      assert.equal(new Set(ids).size, 4);
      assert.ok(options.every((surface) => surface.supported));
      assert.ok(ids.includes(`glb:1:${preview.asset.sha256}:0:0:0`));
      assert.ok(ids.includes(`glb:1:${preview.asset.sha256}:1:1:0`));
      const normalized = api.normalizeGlb(preview.root, "wall", [0.2, 0.7, -0.1], 3);
      const copy = preview.root.clone(true);
      const wrapper = new THREE.Group();
      wrapper.position.set(...normalized.offset);
      wrapper.rotation.set(...normalized.rotation);
      wrapper.scale.setScalar(normalized.scale * 2);
      wrapper.add(copy);
      assert.deepEqual(
        api
          .modelLightingSurfaces(wrapper)
          .map((surface) => surface.id)
          .sort(),
        ids,
      );
      const settings = { ...light, glowTargets: [ids[2]] };
      const control = api.controlModelLightMaterials(wrapper, settings);
      control.update(state, light.color);
      const meshes = copy.getObjectsByProperty("isMesh", true);
      assert.equal(
        meshes.filter(
          (mesh) =>
            mesh.material.emissiveIntensity === 1 &&
            mesh.material !== preview.root.getObjectsByProperty("isMesh", true)[0].material,
        ).length,
        1,
      );
      control.dispose();
      const selected = meshes.find((mesh) => api.modelLightingSurfaceAt(copy, mesh) === ids[2]);
      const original = selected.material;
      const runtime = await create(
        React.createElement(api.ImportedModelSurface, {
          root: copy,
          light: settings,
          state,
        }),
      );
      try {
        assert.notEqual(selected.material, original);
        assert.equal(selected.material.emissive.getHexString(), "ff0000");
        await runtime.update(
          React.createElement(api.ImportedModelSurface, {
            root: copy,
            light: settings,
            state: { ...state, state: "off" },
          }),
        );
        assert.equal(selected.material.emissiveIntensity, 0);
      } finally {
        await runtime.unmount();
      }
      assert.equal(selected.material, original);
      const model = {
        id: "custom:11111111-2222-4333-8444-555555555555",
        name: "Surface fixture",
        placement: "wall",
        profile: "furniture",
        asset: { sha256: preview.asset.sha256, byteLength: bytes.length },
        normalization: normalized,
        complexity: preview.complexity,
        light: settings,
      };
      const parsed = api.parseHomeProjectSchema(
        JSON.parse(JSON.stringify({ ...makeThreeFloorProject(), customModels: [model] })),
      );
      assert.equal(parsed.valid, true, JSON.stringify(parsed.issues));
      assert.deepEqual(parsed.project.customModels[0].light.glowTargets, settings.glowTargets);
      const pack = await api.readCabaneModelPack(
        api.createCabaneModelPack([model], [preview.asset]),
      );
      assert.deepEqual(pack.models[0].light, settings);
      restored = await api.openGlbPreview(pack.assets[0].bytes);
      assert.deepEqual(
        api
          .modelLightingSurfaces(restored.root)
          .map((surface) => surface.id)
          .sort(),
        ids,
      );
      const different = await api.openGlbPreview(testGlb());
      try {
        assert.equal(
          api.resolveModelGlowTargets(api.modelLightingSurfaces(different.root), settings)
            .unresolved.length,
          1,
        );
      } finally {
        different.release();
      }
    } finally {
      restored?.release();
      preview.release();
    }
  });

  await test("GLB legacy material groups keep their exact meaning; historical ordinals remain reviewable and unsupported materials stay explicit", async () => {
    for (const unlit of [false, true]) {
      const preview = await api.openGlbPreview(
        testGlb({
          unlit,
          mutate: (json) => {
            json.materials[0].name = "Diffuser";
            json.nodes.push({ mesh: 0 });
            json.scenes[0].nodes.push(1);
          },
        }),
      );
      try {
        const meshes = preview.root.getObjectsByProperty("isMesh", true);
        const originals = meshes.map((mesh) => mesh.material);
        const control = api.controlModelLightMaterials(preview.root, {
          emissiveMaterials: ["Diffuser"],
          emissiveSurfaces: ["surface:0:0"],
        });
        control.update(state, light.color);
        assert.equal(control.unresolved.length, unlit ? 2 : 1);
        meshes.forEach((mesh, i) =>
          unlit
            ? assert.equal(mesh.material, originals[i])
            : assert.notEqual(mesh.material, originals[i]),
        );
        assert.ok(
          api.modelLightingSurfaces(preview.root).every((surface) => surface.supported === !unlit),
        );
        control.dispose();
      } finally {
        preview.release();
      }
    }
  });

  await test("all three selection fields share the sixteen-target rule and unknown fields stay blocked", () => {
    const project = makeThreeFloorProject();
    const targets = Array.from({ length: 16 }, (_, i) => `native:1:panel.part-${i}`);
    const parse = (settings) =>
      api.parseHomeProjectSchema({ ...project, modelLights: { panel: { ...light, ...settings } } });
    assert.equal(parse({ glowTargets: targets }).valid, true);
    assert.equal(parse({ glowTargets: targets, emissiveSurfaces: ["surface:0:0"] }).valid, false);
    assert.equal(parse({ glowTargets: targets, emissiveMaterials: ["Diffuser"] }).valid, false);
    assert.equal(parse({ glowTargets: [targets[0], targets[0]] }).valid, false);
    for (const id of ["surface:0:0", "native:2:panel.part", "glb:1:invalid:0:0:0", "native:1:"])
      assert.equal(parse({ glowTargets: [id] }).valid, false);
    assert.equal(
      parse({ emissiveSurfaces: ["surface:0:0"], emissiveMaterials: ["Diffuser"] }).valid,
      true,
    );
    assert.ok(
      parse({ futureGlowTargets: [] }).issues.some(
        (issue) => issue.code === "project.unknown-key" && /update/i.test(issue.message),
      ),
    );
    const surfaces = targets.map((id) => ({ id, label: id, supported: true }));
    const full = { ...light, glowTargets: targets.slice(0, 15), emissiveSurfaces: ["surface:0:0"] };
    assert.equal(api.toggleModelGlowTarget(full, surfaces, targets[15]), full);
    assert.equal(api.toggleModelGlowTarget(full, surfaces, targets[0]).glowTargets.length, 14);
  });
});
