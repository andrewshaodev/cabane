import { Color, Mesh, type Material, type Object3D, type BufferGeometry } from "three";
import { lightBrightnessRatio, lightColorForSnapshot } from "../home-assistant-controls";
import type { EntityStateSnapshot } from "../types";
import {
  isModelGlowTargetId,
  resolveModelGlowTargets,
  type ModelGlowSelections,
  type ModelLightingSurfaceOption,
} from "./surface-targets";
export type { ModelLightingSurfaceOption } from "./surface-targets";

type EmissiveMaterial = Material & { emissive: Color; emissiveIntensity: number };
const emissive = (material: Material): material is EmissiveMaterial =>
  "emissive" in material && material.emissive instanceof Color && "emissiveIntensity" in material;
/** Native keys are authored on meshes, never inferred from names, positions or traversal. */
function collectSurfaces(root: Object3D) {
  const surfaces: {
    mesh: Mesh;
    material: Material;
    index: number;
    visible: boolean;
    option: ModelLightingSurfaceOption;
  }[] = [];
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    let visible = true;
    for (let ancestor: Object3D | null = object; ancestor; ancestor = ancestor.parent) {
      if (ancestor.userData.sceneOutline || ancestor.userData.modelGlowIgnore) return;
      visible &&= ancestor.visible;
      if (ancestor === root) break;
    }
    const mesh = object as Mesh<BufferGeometry, Material | Material[]>;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const keys = mesh.userData.modelGlowKey as unknown;
    const asset = mesh.userData.modelGlowAsset as
      { sha256: string; node: number; primitive: number } | undefined;
    materials.forEach((material, index) => {
      const key: unknown = Array.isArray(keys)
        ? keys[index]
        : materials.length === 1
          ? keys
          : undefined;
      const id = asset
        ? `glb:1:${asset.sha256}:${asset.node}:${asset.primitive}:${index}`
        : typeof key === "string"
          ? `native:1:${key}`
          : "";
      const stable = isModelGlowTargetId(id);
      const supported = stable && emissive(material);
      surfaces.push({
        mesh,
        material,
        index,
        visible,
        option: {
          id: stable ? id : `unavailable:${surfaces.length}`,
          label: object.name || material.name || `Surface ${surfaces.length + 1}`,
          supported,
          ...(!supported
            ? {
                unavailableReason: stable
                  ? "This material does not support glow."
                  : "This model part has no authored glow identity.",
              }
            : {}),
          ...(asset && material.name ? { legacyMaterialName: material.name } : {}),
        },
      });
    });
  });
  const counts = new Map<string, number>();
  for (const { option } of surfaces) counts.set(option.id, (counts.get(option.id) ?? 0) + 1);
  for (const { option } of surfaces)
    if (counts.get(option.id)! > 1) {
      option.supported = false;
      option.unavailableReason = "This model declares the same glow identity more than once.";
    }
  return surfaces.filter((surface) => surface.visible);
}
export function modelLightingSurfaces(root: Object3D): ModelLightingSurfaceOption[] {
  return [...new Map(collectSurfaces(root).map(({ option }) => [option.id, option])).values()];
}
export function modelLightingSurfaceAt(
  root: Object3D,
  mesh: Object3D,
  materialIndex = 0,
): string | undefined {
  return collectSurfaces(root).find(
    (surface) =>
      surface.mesh === mesh && surface.index === materialIndex && surface.option.supported,
  )?.option.id;
}

/** Own selected materials per copy. Geometry, maps and unselected materials remain shared. */
export function controlModelLightMaterials(
  root: Object3D,
  light: ModelGlowSelections,
  highlighted?: string,
) {
  const surfaces = collectSurfaces(root);
  const resolution = resolveModelGlowTargets(modelLightingSurfaces(root), light);
  const selectedSurfaces = new Set(resolution.selected);
  const originals = new Map<Mesh, Material | Material[]>();
  const clones = new Map<Material, EmissiveMaterial>();
  const highlightedClones = new Set<EmissiveMaterial>();
  for (const { mesh, material: original, index, option } of surfaces) {
    const highlight = option.supported && option.id === highlighted;
    if (!emissive(original) || (!selectedSurfaces.has(option.id) && !highlight)) continue;
    if (!originals.has(mesh)) originals.set(mesh, mesh.material);
    let instance = highlight ? undefined : clones.get(original);
    if (!instance) {
      instance = original.clone() as EmissiveMaterial;
      instance.onBeforeCompile = (shader, renderer) => original.onBeforeCompile(shader, renderer);
      instance.customProgramCacheKey = () => original.customProgramCacheKey();
      if (highlight) highlightedClones.add(instance);
      else clones.set(original, instance);
    }
    if (Array.isArray(mesh.material)) {
      mesh.material = [...mesh.material];
      mesh.material[index] = instance;
    } else mesh.material = instance;
  }
  let disposed = false;
  return {
    unresolved: resolution.unresolved,
    update(state: EntityStateSnapshot | undefined, fallback: string) {
      for (const material of clones.values()) {
        material.emissive.set(lightColorForSnapshot(state, fallback));
        material.emissiveIntensity = lightBrightnessRatio(state);
      }
      for (const material of highlightedClones) {
        material.emissive.set("#398b66");
        material.emissiveIntensity = 1.3;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const [mesh, original] of originals) mesh.material = original;
      for (const material of [...clones.values(), ...highlightedClones]) material.dispose();
    },
  };
}
