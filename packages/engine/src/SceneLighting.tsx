import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Vector3, type DirectionalLight, type HemisphereLight } from "three";
import { transitionSolarDirection } from "./solar-direction-transition";
import { WalkSky } from "./WalkSky";
import { deriveSolarLighting, type SolarLightingMode, type SunEntityState } from "./lighting";

const TRANSITION_RATE = 4.5;
const EPSILON = 0.002;
const colorDifference = (left: Color, right: Color) => Math.max(
  Math.abs(left.r - right.r), Math.abs(left.g - right.g), Math.abs(left.b - right.b),
);

export function SolarLighting({ mode, shadowMapSize, sunState, walkMode = false }: {
  mode: SolarLightingMode;
  shadowMapSize: 1024 | 2048;
  sunState?: SunEntityState;
  walkMode?: boolean;
}) {
  const target = useMemo(() => deriveSolarLighting(sunState, mode), [mode, sunState]);
  const initial = useRef(target);
  const sunRef = useRef<DirectionalLight>(null);
  const hemisphereRef = useRef<HemisphereLight>(null);
  const targetPosition = useMemo(() => new Vector3(...target.sunPosition), [target.sunPosition]);
  const targetSun = useMemo(() => new Color(target.sunColor), [target.sunColor]);
  const targetBackground = useMemo(() => new Color(target.backgroundColor), [target.backgroundColor]);
  const targetSky = useMemo(() => new Color(target.hemisphereSkyColor), [target.hemisphereSkyColor]);
  const targetGround = useMemo(() => new Color(target.hemisphereGroundColor), [target.hemisphereGroundColor]);
  const transitioning = useRef(false);
  const { invalidate, scene } = useThree();

  useEffect(() => { transitioning.current = true; invalidate(); }, [invalidate, target]);
  useFrame((_, delta) => {
    const sun = sunRef.current;
    const hemisphere = hemisphereRef.current;
    if (!transitioning.current || !sun || !hemisphere) return;
    const background = scene.background instanceof Color ? scene.background : new Color();
    if (!(scene.background instanceof Color)) scene.background = background;
    const progress = 1 - Math.exp(-TRANSITION_RATE * delta);
    transitionSolarDirection(sun.position, targetPosition, progress);
    sun.color.lerp(targetSun, progress);
    sun.intensity += (target.sunIntensity - sun.intensity) * progress;
    hemisphere.color.lerp(targetSky, progress);
    hemisphere.groundColor.lerp(targetGround, progress);
    hemisphere.intensity += (target.hemisphereIntensity - hemisphere.intensity) * progress;
    background.lerp(targetBackground, progress);
    const remaining = Math.max(
      sun.position.distanceTo(targetPosition) / 18,
      colorDifference(sun.color, targetSun), Math.abs(sun.intensity - target.sunIntensity),
      colorDifference(hemisphere.color, targetSky), colorDifference(hemisphere.groundColor, targetGround),
      Math.abs(hemisphere.intensity - target.hemisphereIntensity), colorDifference(background, targetBackground),
    );
    if (remaining <= EPSILON) {
      sun.position.copy(targetPosition); sun.color.copy(targetSun); sun.intensity = target.sunIntensity;
      hemisphere.color.copy(targetSky); hemisphere.groundColor.copy(targetGround);
      hemisphere.intensity = target.hemisphereIntensity; background.copy(targetBackground);
      transitioning.current = false;
    } else invalidate();
  }, -1);
  return (
    <>
      {walkMode && <WalkSky sunRef={sunRef} hemisphereRef={hemisphereRef} />}
      <color attach="background" args={[initial.current.backgroundColor]} />
      <hemisphereLight ref={hemisphereRef} args={[
        initial.current.hemisphereSkyColor,
        initial.current.hemisphereGroundColor,
        initial.current.hemisphereIntensity,
      ]} />
      <directionalLight
        key={shadowMapSize}
        ref={sunRef}
        castShadow
        position={[...initial.current.sunPosition]}
        color={initial.current.sunColor}
        intensity={initial.current.sunIntensity}
        shadow-intensity={0.62}
        shadow-radius={2}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.00005}
        shadow-normalBias={0.012}
      />
    </>
  );
}
