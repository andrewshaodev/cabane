import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CatmullRomCurve3,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
  type MeshToonMaterial,
} from "three";
import { ToonMaterial } from "@cabane/engine";
import type { ClimateAirflowMode } from "../climate-airflow";

const AIRFLOW_PALETTE: Record<ClimateAirflowMode, { color: string; emissive: string }> = {
  cool: { color: "#58c8ff", emissive: "#147fc4" },
  heat: { color: "#ff6d58", emissive: "#b82f24" },
  dry: { color: "#5ed6c1", emissive: "#208d7c" },
  fan: { color: "#b8e8e5", emissive: "#579b98" },
  auto: { color: "#ba9cff", emissive: "#7250bc" },
};

const AIRFLOW_WAVE_COUNT = 5;

const airflowWaveStateForProgress = (progress: number) => {
  const spread = 0.78 + progress * 0.36;
  const fade = Math.sin(progress * Math.PI);
  return {
    progress,
    position: [0, -0.2 - progress * 0.43, 0.2 + progress * 0.82] as const,
    scale: [spread, 1, 1] as const,
    opacity: 0.14 + fade * 0.76,
  };
};

export const airflowWaveState = (elapsedTime: number, index: number) => {
  const progress = (elapsedTime * 0.42 + index / AIRFLOW_WAVE_COUNT) % 1;
  return airflowWaveStateForProgress(progress);
};

export const createAirflowWaveGeometry = (
  width: number,
  tubularSegments = 48,
  radialSegments = 6,
) => {
  const halfWidth = width * 0.34;
  const points = Array.from({ length: 25 }, (_, index) => {
    const progress = index / 24;
    return new Vector3(
      -halfWidth + progress * halfWidth * 2,
      Math.sin(progress * Math.PI * 4) * 0.035,
      0,
    );
  });

  return new TubeGeometry(
    new CatmullRomCurve3(points),
    tubularSegments,
    0.014,
    radialSegments,
    false,
  );
};

export function AirflowWaves({
  mode,
  width,
  reducedMotion,
  forward = false,
}: {
  mode: ClimateAirflowMode;
  width: number;
  reducedMotion: boolean;
  forward?: boolean;
}) {
  const waves = useRef<Group>(null);
  const airflowPalette = AIRFLOW_PALETTE[mode];
  const geometry = useMemo(
    () => (forward ? createAirflowWaveGeometry(width, 32, 4) : createAirflowWaveGeometry(width)),
    [width, forward],
  );
  const positionFor = (
    state: ReturnType<typeof airflowWaveState>,
  ): readonly [number, number, number] =>
    forward ? [0, 0, 0.16 + state.progress * 0.95] : state.position;
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );

  useFrame(({ clock, invalidate }) => {
    if (!waves.current || reducedMotion) return;

    waves.current.children.forEach((child, index) => {
      const wave = child as Mesh;
      const state = airflowWaveState(clock.elapsedTime, index);

      wave.position.set(...positionFor(state));
      wave.scale.set(...state.scale);
      (wave.material as MeshToonMaterial).opacity = state.opacity;
    });

    invalidate();
  });

  return (
    <group ref={waves} name={forward ? "fan-airflow-waves" : `flux-climatisation-${mode}`}>
      {Array.from({ length: AIRFLOW_WAVE_COUNT }, (_, index) => {
        const staticState = airflowWaveStateForProgress((index + 1) / (AIRFLOW_WAVE_COUNT + 1));
        return (
          <mesh
            key={index}
            geometry={geometry}
            position={reducedMotion || forward ? positionFor(staticState) : undefined}
            scale={reducedMotion || forward ? staticState.scale : undefined}
            renderOrder={2}
          >
            <ToonMaterial
              color={airflowPalette.color}
              emissive={airflowPalette.emissive}
              emissiveIntensity={0.75}
              transparent
              opacity={reducedMotion ? staticState.opacity : 0.8}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
