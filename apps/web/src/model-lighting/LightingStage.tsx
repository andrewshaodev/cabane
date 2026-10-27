import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Group } from "three";
import {
  controlModelLightMaterials,
  ModelLightingStateContext,
  importedLightSources,
  modelLightingSurfaceAt,
  modelLightingSurfaces,
  type CustomModelLight,
  type DeviceModelBounds,
  type EntityStateSnapshot,
  type ModelLightingSurfaceOption,
  type ModelVector,
} from "@cabane/engine";

function StageContent({
  children,
  bounds,
  light,
  state,
  selected,
  picking,
  highlighted,
  onPosition,
  onSurface,
  onSurfaces,
  onSelect,
}: {
  children: ReactNode;
  bounds: DeviceModelBounds;
  light: CustomModelLight | null;
  state: EntityStateSnapshot;
  selected: number;
  picking: "position" | "surface" | null;
  highlighted: string | undefined;
  onPosition: (position: ModelVector) => void;
  onSurface: (id: string) => void;
  onSurfaces: (surfaces: ModelLightingSurfaceOption[]) => void;
  onSelect: (index: number) => void;
}) {
  const geometry = useRef<Group>(null);
  const origin = useRef<Group>(null);
  const invalidate = useThree((scene) => scene.invalidate);
  const span = Math.max(...bounds.max.map((n, i) => n - bounds.min[i]));
  useLayoutEffect(() => {
    if (!geometry.current) return;
    onSurfaces(modelLightingSurfaces(geometry.current));
    const materials = controlModelLightMaterials(geometry.current, light ?? {}, highlighted);
    materials.update(state, light?.color ?? "#ffe3b4");
    invalidate();
    return () => materials.dispose();
  }, [children, light, state, highlighted, invalidate, onSurfaces]);
  const pick = (event: ThreeEvent<MouseEvent>) => {
    if (!picking || !geometry.current || !origin.current) return;
    event.stopPropagation();
    if (picking === "surface") {
      const id = modelLightingSurfaceAt(
        geometry.current,
        event.object,
        event.face?.materialIndex ?? 0,
      );
      if (id) onSurface(id);
    } else {
      const position = origin.current
        .worldToLocal(event.point.clone())
        .toArray()
        .map((n) => Number(n.toFixed(5))) as [number, number, number];
      onPosition(position);
    }
  };
  const center = bounds.min.map((n, i) => -(n + bounds.max[i]) / 2) as [number, number, number];
  const sources = light ? importedLightSources(light) : [];
  return (
    <>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#f4f5ff", "#7a7166", 1.3]} />
      <directionalLight position={[4, 6, 5]} intensity={2} />
      <Bounds fit clip margin={1.45}>
        <group position={center} ref={origin}>
          <group ref={geometry} onClick={pick}>
            <ModelLightingStateContext.Provider value={{ state }}>
              {children}
            </ModelLightingStateContext.Provider>
          </group>
          {sources.map((source, index) => (
            <group key={index} position={source.position}>
              <mesh
                renderOrder={10000}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(light?.strip ? (index === sources.length - 1 ? 1 : 0) : index);
                }}
              >
                <sphereGeometry args={[Math.max(0.012, span * 0.022), 12, 8]} />
                <meshBasicMaterial
                  color={selected === index ? "#2a7351" : "#a9653f"}
                  depthTest={false}
                  depthWrite={false}
                />
              </mesh>
              <pointLight
                color={source.color}
                intensity={
                  state.state === "on"
                    ? (source.maxIntensity * Number(state.attributes.brightness ?? 255)) / 255
                    : 0
                }
                distance={source.distance}
              />
            </group>
          ))}
        </group>
      </Bounds>
      <OrbitControls makeDefault enablePan={false} />
    </>
  );
}
export function LightingStage(props: Parameters<typeof StageContent>[0]) {
  const span = Math.max(...props.bounds.max.map((n, i) => n - props.bounds.min[i]));
  return (
    <div className="lighting-stage" aria-label="Interactive lighting preview">
      <Canvas
        frameloop="demand"
        camera={{
          fov: 40,
          position: [span * 1.8, span * 1.4, span * 2],
          near: Math.max(0.001, span / 1000),
          far: Math.max(100, span * 20),
        }}
      >
        <StageContent {...props} />
      </Canvas>
      <p className="lighting-stage__hint" role="status">
        {props.picking === "surface"
          ? "Click a surface to make it glow."
          : props.picking === "position"
            ? `Click the model to place ${props.light?.strip ? (props.selected === 0 ? "the strip start" : "the strip end") : `point ${props.selected + 1}`}.`
            : "Drag to orbit · Scroll to zoom"}
      </p>
    </div>
  );
}
