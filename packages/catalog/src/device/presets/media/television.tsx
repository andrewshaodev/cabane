import { LiveCameraSurface, Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";

const CHARCOAL = "#28312f";
const METAL = "#596360";

const screenPalette = (visualState: HomeDeviceModelProps["visualState"]) => {
  switch (visualState) {
    case "connected-active":
      return { screen: "#6f9aa3", reflection: "#a9c1c3" };
    case "connected-inactive":
      return { screen: "#1f2b29", reflection: "#50615d" };
    case "unavailable":
      return { screen: "#806852", reflection: "#b49a7c" };
    case "disconnected":
      return { screen: "#465450", reflection: "#7b8b86" };
  }
};

function RoundedTvShell() {
  return (
    <group name="catalog-television-rounded-shell" position={[0, 0.515, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.456, 0.84, 0.06]} />
        <ToonMaterial color={CHARCOAL} />
      </mesh>
      <mesh position={[0, 0, -0.002]} castShadow receiveShadow>
        <boxGeometry args={[1.54, 0.756, 0.056]} />
        <ToonMaterial color={CHARCOAL} />
      </mesh>
      {[-0.728, 0.728].flatMap((x) =>
        [-0.378, 0.378].map((y) => (
          <mesh
            key={`${x}-${y}`}
            position={[x, y, -0.001]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.042, 0.042, 0.058, 32]} />
            <ToonMaterial color={CHARCOAL} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function TelevisionModel({ visualState, liveMedia }: HomeDeviceModelProps) {
  const palette = screenPalette(visualState);

  return (
    <group name="catalog-television">
      <RoundedTvShell />
      <mesh position={[0, 0.515, 0.036]} receiveShadow>
        <boxGeometry args={[1.405, 0.675, 0.014]} />
        <ToonMaterial color={palette.screen} />
      </mesh>
      {liveMedia ? (
        <group position={[0, 0.515, 0.047]}>
          <LiveCameraSurface media={liveMedia} width={1.405} height={0.675} opacity={1} />
        </group>
      ) : (
        <group>
          <mesh position={[-0.38, 0.69, 0.047]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.42, 0.018, 0.006]} />
            <ToonMaterial color={palette.reflection} transparent opacity={0.34} />
          </mesh>
          <mesh position={[-0.23, 0.62, 0.048]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.21, 0.009, 0.006]} />
            <ToonMaterial color={palette.reflection} transparent opacity={0.22} />
          </mesh>
        </group>
      )}
      {[-0.54, 0.54].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.075, 0]} rotation={[0, 0, x < 0 ? -0.25 : 0.25]} castShadow>
            <capsuleGeometry args={[0.024, 0.1, 5, 12]} />
            <ToonMaterial color={METAL} />
          </mesh>
          <mesh position={[0, 0.014, 0.018]} castShadow>
            <boxGeometry args={[0.25, 0.028, 0.15]} />
            <ToonMaterial color={METAL} />
            <Outlines color="#303937" thickness={0.004} screenspace={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.119, 0.046]}>
        <boxGeometry args={[0.25, 0.025, 0.014]} />
        <ToonMaterial color="#222928" />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.65, 0.122, 0.057]} scale={0.7} />
    </group>
  );
}
