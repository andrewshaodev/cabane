import {
  Mesh,
  MeshStandardMaterial,
  type BufferGeometry,
  type Material,
  type Object3D,
} from "three";
import { lightBrightnessRatio, lightColorForSnapshot } from "../home-assistant-controls";
import type { EntityStateSnapshot } from "../types";

export function importedEmissiveMaterialNames(root: Object3D): string[] {
  const names = new Set<string>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material])
      if (
        material instanceof MeshStandardMaterial &&
        material.name.trim() &&
        material.name.length <= 128
      )
        names.add(material.name);
  });
  return [...names].sort();
}

/** Only selected materials are instance-owned; textures and geometry stay on the asset lease. */
export function controlImportedLightMaterials(root: Object3D, names: readonly string[]) {
  const selected = new Set(names);
  const clones = new Map<MeshStandardMaterial, MeshStandardMaterial>();
  const originals = new Map<Mesh, Material | Material[]>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const mesh = object as Mesh<BufferGeometry, Material | Material[]>;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const controlled = materials.map((material: Material) => {
      if (!(material instanceof MeshStandardMaterial) || !selected.has(material.name))
        return material;
      let instance = clones.get(material);
      if (!instance) {
        instance = material.clone();
        clones.set(material, instance);
      }
      return instance;
    });
    if (controlled.some((material, index) => material !== materials[index])) {
      originals.set(mesh, mesh.material);
      mesh.material = Array.isArray(mesh.material) ? controlled : controlled[0];
    }
  });
  let disposed = false;
  return {
    update(state: EntityStateSnapshot | undefined, fallback: string) {
      for (const material of clones.values()) {
        material.emissive.set(lightColorForSnapshot(state, fallback));
        material.emissiveIntensity = lightBrightnessRatio(state);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const [mesh, original] of originals) mesh.material = original;
      for (const material of clones.values()) material.dispose();
    },
  };
}
