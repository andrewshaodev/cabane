import {
  Box3,
  Mesh,
  SkinnedMesh,
  Texture,
  LoadingManager,
  type Material,
  type BufferGeometry,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { inspectGlb, type GlbDocument } from "./glb-validation";
import {
  CUSTOM_MODEL_LIMITS,
  modelAssetHash,
  type ModelAssetReference,
  type ModelAssetSource,
} from "./contracts";
import { createModelAssetRepository } from "./asset-storage";

export const IMPORTED_MODEL_LAYER = 31;

export function disposeGlbSkeletons(root: Object3D) {
  const skeletons = new Set<import("three").Skeleton>();
  root.traverse((object) => {
    if (object instanceof SkinnedMesh) skeletons.add(object.skeleton);
  });
  for (const skeleton of skeletons) skeleton.dispose();
}

export function disposeGlb(root: Object3D) {
  disposeGlbSkeletons(root);
  const geometries = new Set<import("three").BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const mesh = object as Mesh<BufferGeometry, Material | Material[]>;
    geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof Texture) textures.add(value as Texture);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) {
    texture.dispose();
    const bitmap = texture.source.data as { close?: () => void } | undefined;
    bitmap?.close?.();
  }
}

export async function loadGlb(bytes: Uint8Array) {
  const inspection = inspectGlb(bytes);
  const manager = new LoadingManager();
  let imageError = false;
  manager.onError = () => {
    imageError = true;
  };
  manager.setURLModifier((url) => {
    if (!url.startsWith("blob:")) throw new Error("External GLB references are not allowed.");
    return url;
  });
  const loader = new GLTFLoader(manager);
  loader.register((parser) => ({
    name: "CABANE_static_pose",
    beforeRoot() {
      // Avoid allocating unused scenes, animation targets, cameras and lights.
      const json = parser.json as GlbDocument;
      json.scenes = [json.scenes![json.scene ?? 0]];
      json.scene = 0;
      json.animations = [];
      json.cameras = [];
      for (const node of json.nodes ?? []) {
        delete node.camera;
        if (node.extensions) delete node.extensions.KHR_lights_punctual;
      }
      return null;
    },
  }));
  const gltf = await loader.parseAsync(new Uint8Array(bytes).buffer, "");
  if (imageError) {
    disposeGlb(gltf.scene);
    throw new Error(
      "An embedded GLB image could not be decoded. Export valid PNG, JPEG or WebP images.",
    );
  }
  const discarded: Object3D[] = [];
  let meshes = 0,
    triangles = 0;
  const sha256 = await modelAssetHash(bytes);
  gltf.scene.traverse((object) => {
    // User-supplied extras cannot install collision or interaction metadata.
    object.userData = {};
    if ("isCamera" in object || "isLight" in object) discarded.push(object);
    if (!(object instanceof Mesh)) return;
    object.userData.importedModel = true;
    // Parser associations preserve source indices through loader wrappers and shared meshes.
    const association = gltf.parser.associations.get(object) as { primitives?: number } | undefined;
    const primitive = association?.primitives;
    let node: number | undefined;
    for (let ancestor: Object3D | null = object; ancestor; ancestor = ancestor.parent) {
      node = gltf.parser.associations.get(ancestor)?.nodes;
      if (node !== undefined) break;
    }
    if (node !== undefined && primitive !== undefined)
      object.userData.modelGlowAsset = { sha256, node, primitive };
    object.layers.enable(IMPORTED_MODEL_LAYER);
    object.castShadow = object.receiveShadow = true;
    const mesh = object as Mesh<BufferGeometry, Material | Material[]>;
    meshes++;
    const instances = "count" in object && typeof object.count === "number" ? object.count : 1;
    triangles +=
      ((mesh.geometry.index?.count ?? mesh.geometry.getAttribute("position")?.count ?? 0) / 3) *
      instances;
  });
  for (const object of discarded) object.removeFromParent();
  gltf.scene.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(gltf.scene, true);
  if (
    meshes > CUSTOM_MODEL_LIMITS.meshes ||
    triangles > CUSTOM_MODEL_LIMITS.triangles ||
    bounds.isEmpty() ||
    [...bounds.min.toArray(), ...bounds.max.toArray()].some((n) => !Number.isFinite(n))
  ) {
    disposeGlb(gltf.scene);
    throw new Error("The decoded model is invalid or exceeds 100,000 triangles / 128 meshes.");
  }
  return { root: gltf.scene, bounds, ...inspection };
}

type CacheEntry = { users: number; pending: ReturnType<typeof loadGlb> };
const cache = new Map<string, CacheEntry>();

/** Leases share GPU resources; each instance clones only the object hierarchy. */
export function acquireGlb(asset: ModelAssetReference, source?: ModelAssetSource) {
  let entry = cache.get(asset.sha256);
  if (!entry) {
    const pending = (async () => {
      const bytes = await (source ?? createModelAssetRepository(window.indexedDB)).read(
        asset.sha256,
      );
      if (
        !bytes ||
        bytes.byteLength !== asset.byteLength ||
        (await modelAssetHash(bytes)) !== asset.sha256
      )
        throw new Error("Missing or damaged GLB. Import a complete .cabane backup.");
      return loadGlb(bytes);
    })();
    entry = { users: 0, pending };
    cache.set(asset.sha256, entry);
    const loading = entry;
    void pending.catch(() => {
      // Restoring valid bytes must allow a retry while an older placeholder remains mounted.
      if (cache.get(asset.sha256) === loading) cache.delete(asset.sha256);
    });
  }
  entry.users++;
  const leased = entry;
  let released = false;
  return {
    pending: entry.pending,
    release: () => {
      if (released) return;
      released = true;
      leased.users--;
      // React StrictMode's immediate remount can reuse this pending load.
      queueMicrotask(() => {
        if (leased.users || cache.get(asset.sha256) !== leased) return;
        cache.delete(asset.sha256);
        void leased.pending.then(
          ({ root }) => disposeGlb(root),
          () => undefined,
        );
      });
    },
  };
}

export async function openGlbPreview(bytes: Uint8Array) {
  inspectGlb(bytes);
  const asset = { bytes, byteLength: bytes.byteLength, sha256: await modelAssetHash(bytes) };
  const lease = acquireGlb(asset, { read: async () => bytes });
  try {
    const resource = await lease.pending;
    const root = clone(resource.root);
    let released = false;
    return {
      ...resource,
      root,
      asset,
      release: () => {
        if (released) return;
        released = true;
        disposeGlbSkeletons(root);
        lease.release();
      },
    };
  } catch (error) {
    lease.release();
    throw error;
  }
}
