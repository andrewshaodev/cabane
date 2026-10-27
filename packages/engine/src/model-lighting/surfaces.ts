import { Color, Mesh, type Material, type Object3D, type BufferGeometry } from "three";
import { lightBrightnessRatio, lightColorForSnapshot } from "../home-assistant-controls";
import type { CustomModelLight } from "../imported-models/contracts";
import type { EntityStateSnapshot } from "../types";

type EmissiveMaterial = Material & { emissive: Color; emissiveIntensity: number };
const emissive = (material: Material): material is EmissiveMaterial =>
  "emissive" in material && material.emissive instanceof Color && "emissiveIntensity" in material;
export interface ModelLightingSurfaceOption {
  id: string;
  label: string;
  supported: boolean;
}

/** Mesh order belongs to the immutable model, independent of scene transforms and wrapper groups. */
function visitSurfaces(
  root: Object3D,
  visit: (
    mesh: Mesh,
    material: Material,
    index: number,
    option: ModelLightingSurfaceOption,
  ) => void,
) {
  let ordinal = 0;
  root.traverse((object) => {
    if (!(object instanceof Mesh) || !object.visible || object.userData.sceneOutline) return;
    const mesh = object as Mesh<BufferGeometry, Material | Material[]>;
    const order = ordinal++;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material, index) =>
      visit(mesh, material, index, {
        id: `surface:${order}:${index}`,
        label:
          object.name ||
          material.name ||
          `Surface ${order + 1}${materials.length > 1 ? ` · ${index + 1}` : ""}`,
        supported: emissive(material),
      }),
    );
  });
}
export function modelLightingSurfaces(root: Object3D): ModelLightingSurfaceOption[] {
  const options: ModelLightingSurfaceOption[] = [];
  visitSurfaces(root, (_mesh, _material, _index, option) => options.push(option));
  return options;
}
export function modelLightingSurfaceAt(
  root: Object3D,
  mesh: Object3D,
  materialIndex = 0,
): string | undefined {
  let id: string | undefined;
  visitSurfaces(root, (candidate, _material, index, option) => {
    if (candidate === mesh && index === materialIndex && option.supported) id = option.id;
  });
  return id;
}

/** Own selected materials per copy. Geometry, maps and unselected materials remain shared. */
export function controlModelLightMaterials(
  root: Object3D,
  light: Pick<CustomModelLight, "emissiveMaterials" | "emissiveSurfaces">,
  highlighted?: string,
) {
  const selectedNames = new Set(light.emissiveMaterials ?? []);
  const selectedSurfaces = new Set(light.emissiveSurfaces ?? []);
  const originals = new Map<Mesh, Material | Material[]>();
  const clones = new Map<Material, EmissiveMaterial>();
  const highlightedClones = new Set<EmissiveMaterial>();
  visitSurfaces(root, (mesh, original, index, option) => {
    const highlight = option.id === highlighted;
    if (
      !emissive(original) ||
      (!selectedNames.has(original.name) && !selectedSurfaces.has(option.id) && !highlight)
    )
      return;
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
  });
  let disposed = false;
  return {
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
