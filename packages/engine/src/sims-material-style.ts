import { Color, DataTexture, LinearFilter, RedFormat, type ColorRepresentation } from "three";
import type { ThreeElements } from "@react-three/fiber";

// A continuous diffuse ramp replaces Cabane's four broad toon bands. Flat
// normals make each modeled face legible without adding outline geometry.
export const simsGradient = new DataTexture(
  Uint8Array.from({ length: 256 }, (_, index) => Math.round(20 + (index * 235) / 255)),
  256,
  1,
  RedFormat,
);
simsGradient.minFilter = simsGradient.magFilter = LinearFilter;
simsGradient.generateMipmaps = false;
simsGradient.needsUpdate = true;

/** Render-only palette: preserve neutral surfaces and the identity of live colors. */
export function simsMaterialColor(
  source: NonNullable<ThreeElements["meshToonMaterial"]["color"]>,
): Color {
  const color = Array.isArray(source)
    ? source.length === 3
      ? new Color(...(source as [number, number, number]))
      : new Color(source[0] as ColorRepresentation)
    : new Color(source as ColorRepresentation);
  const hsl = color.getHSL({ h: 0, s: 0, l: 0 });
  if (hsl.s < 0.08) return color;
  // Tighten hues to a deliberate 24-hue palette while retaining luminance.
  return color.setHSL(Math.round(hsl.h * 24) / 24, Math.min(1, hsl.s * 1.65), hsl.l);
}
