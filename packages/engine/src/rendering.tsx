import { omitUndefinedProperties } from "./defined-properties";
import type { OutlinesProps as DreiOutlinesProps } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Color,
  type ColorRepresentation,
  DataTexture,
  NearestFilter,
  RedFormat,
  type Group,
  type Mesh,
} from "three";
import { createContext, useContext, useEffect, useRef, type ComponentProps } from "react";
import { cameraFacingWallOpacityForNormals } from "./wall-fade";
import { SceneContourContext } from "./StylizedScene";
import { SceneOutlines } from "./SceneOutlines";

export const TOON_GRADIENT_DATA = [55, 115, 185, 255] as const;
const toonGradient = new DataTexture(
  new Uint8Array(TOON_GRADIENT_DATA),
  TOON_GRADIENT_DATA.length,
  1,
  RedFormat,
);
toonGradient.minFilter = NearestFilter;
toonGradient.magFilter = NearestFilter;
toonGradient.generateMipmaps = false;
toonGradient.needsUpdate = true;

export type ToonMaterialProps = Omit<ComponentProps<"meshToonMaterial">, "gradientMap">;

/** Local colour lift for interactive device models, preserving their live state. */
export const DeviceHoverContext = createContext(false);

export function ToonMaterial(props: ToonMaterialProps) {
  const hovered = useContext(DeviceHoverContext);
  let color = props.color;
  if (hovered) {
    const source = props.color ?? "white";
    const tint = Array.isArray(source)
      ? source.length === 3
        ? new Color(...(source as [number, number, number]))
        : new Color(source[0] as ColorRepresentation)
      : new Color(source as ColorRepresentation);
    color = tint.lerp(new Color("white"), 0.08);
  }
  return (
    <meshToonMaterial
      {...props}
      {...omitUndefinedProperties({ color: color })}
      gradientMap={toonGradient}
    />
  );
}

export type OutlinesProps = DreiOutlinesProps;

export function Outlines({
  color = "#4d5c57",
  thickness = 0.012,
  screenspace = false,
  ...props
}: OutlinesProps) {
  const sceneContours = useContext(SceneContourContext);
  if (sceneContours) return null;
  return <SceneOutlines color={color} thickness={thickness} screenspace={screenspace} {...props} />;
}

export const applyCameraFadeToMesh = (mesh: Mesh, opacity: number) => {
  if (mesh.userData.cameraFadeBaseCastShadow === undefined) {
    mesh.userData.cameraFadeBaseCastShadow = mesh.castShadow;
  }
  mesh.castShadow = Boolean(mesh.userData.cameraFadeBaseCastShadow) && opacity >= 0.995;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) {
    if (material.userData.cameraFadeBaseOpacity === undefined) {
      material.userData.cameraFadeBaseOpacity = material.opacity;
      material.userData.cameraFadeBaseTransparent = material.transparent;
      material.userData.cameraFadeBaseDepthWrite = material.depthWrite;
    }
    const baseOpacity = Number(material.userData.cameraFadeBaseOpacity);
    const baseTransparent = Boolean(material.userData.cameraFadeBaseTransparent);
    const baseDepthWrite = Boolean(material.userData.cameraFadeBaseDepthWrite);
    const transparent = baseTransparent || opacity < 0.999;
    if (material.transparent !== transparent) {
      material.transparent = transparent;
      material.needsUpdate = true;
    }
    material.opacity = baseOpacity * opacity;
    material.depthWrite = baseDepthWrite && opacity >= 0.995;
  }
};

export function CameraFacingFade({
  enabled,
  normal,
  normals,
  reducedMotion = false,
  children,
}: {
  enabled: boolean;
  normal?: readonly [number, number];
  normals?: readonly (readonly [number, number])[];
  center?: readonly [number, number];
  reducedMotion?: boolean;
  children: React.ReactNode;
}) {
  const groupRef = useRef<Group>(null);
  const opacityRef = useRef(1);
  const { invalidate } = useThree();
  const fadeNormals = normals ?? (normal ? [normal] : []);
  const applyOpacity = (opacity: number) => {
    groupRef.current?.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      applyCameraFadeToMesh(mesh, opacity);
    });
  };
  useEffect(() => {
    if (!enabled) {
      opacityRef.current = 1;
      applyOpacity(1);
    }
    invalidate();
  }, [enabled, invalidate, normal, normals, reducedMotion]);
  useFrame(({ camera }, delta) => {
    const target = cameraFacingWallOpacityForNormals(
      enabled,
      [camera.position.x, camera.position.z],
      fadeNormals,
    );
    const next = reducedMotion
      ? target
      : opacityRef.current + (target - opacityRef.current) * (1 - Math.exp(-12 * delta));
    const resolved = Math.abs(next - target) < 0.002 ? target : next;
    if (Math.abs(resolved - opacityRef.current) > 0.0005) {
      opacityRef.current = resolved;
      applyOpacity(resolved);
    }
    if (Math.abs(resolved - target) >= 0.002) invalidate();
  });
  return <group ref={groupRef}>{children}</group>;
}
