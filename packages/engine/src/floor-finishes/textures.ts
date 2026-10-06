import { CanvasTexture, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from "three";
import type { FloorPatternPresetId } from "../types";
import { FLOOR_FINISH_PRESETS, paintFloorPattern, type FloorPatternVariant } from "./presets";

export interface FloorFinishTextureSet {
  get: (id: FloorPatternPresetId, color?: string) => CanvasTexture | null;
  dispose: () => void;
}

const textureSize = (id: FloorPatternPresetId, variant: FloorPatternVariant) =>
  id === "dark-walnut" || id === "light-oak" || id === "light-oak-horizontal"
    ? 512
    : variant === "plan"
      ? 96
      : 128;

type CanvasDocument = Pick<Document, "createElement">;

export const createFloorFinishTextureSet = (
  variant: FloorPatternVariant,
  canvasDocument: CanvasDocument | null = typeof document === "undefined" ? null : document,
): FloorFinishTextureSet => {
  const textures = new Map<string, CanvasTexture>();
  if (canvasDocument) {
    for (const preset of FLOOR_FINISH_PRESETS) {
      try {
        const canvas = canvasDocument.createElement("canvas");
        canvas.width = textureSize(preset.id, variant);
        canvas.height = canvas.width;
        const context = canvas.getContext("2d");
        if (!context) continue;
        paintFloorPattern(context, preset.id, variant);
        const texture = new CanvasTexture(canvas);
        texture.colorSpace = SRGBColorSpace;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.minFilter = LinearMipmapLinearFilter;
        texture.anisotropy = 8;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
        textures.set(preset.id, texture);
      } catch {
        // Non-browser renderers can lack a 2D canvas context. Solid fallback
        // materials keep the scene usable without weakening the manifest.
      }
    }
  }
  return {
    get: (id, color) => {
      if (!color || !canvasDocument) return textures.get(id) ?? null;
      const key = `${id}:${color}`;
      if (!textures.has(key)) {
        try {
          const canvas = canvasDocument.createElement("canvas");
          canvas.width = textureSize(id, variant);
          canvas.height = canvas.width;
          const context = canvas.getContext("2d");
          if (!context) return null;
          paintFloorPattern(context, id, variant, color);
          const texture = new CanvasTexture(canvas);
          texture.colorSpace = SRGBColorSpace;
          texture.wrapS = RepeatWrapping;
          texture.wrapT = RepeatWrapping;
          texture.minFilter = LinearMipmapLinearFilter;
          textures.set(key, texture);
        } catch {
          return null;
        }
      }
      return textures.get(key) ?? null;
    },
    dispose: () => textures.forEach((texture) => texture.dispose()),
  };
};
