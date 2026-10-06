import { Outlines, ToonMaterial, type SceneItemSize } from "@cabane/engine";

export const DARK_OAK_VESSEL_VANITY_SIZE = [0.8, 1.23, 0.52] as const;

export function DarkOakVesselVanity({
  size = DARK_OAK_VESSEL_VANITY_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="dark-oak-vessel-vanity"
      scale={[size[0] / 0.8, size[1] / 1.23, size[2] / 0.52]}
      userData={{ walkCollider: true }}
    >
      {[-0.33, 0.33].flatMap((x) =>
        [-0.21, 0.21].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.05, z]} castShadow>
            <boxGeometry args={[0.055, 0.1, 0.055]} />
            <ToonMaterial color="#32251f" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.46, -0.01]} castShadow receiveShadow>
        <boxGeometry args={[0.76, 0.72, 0.48]} />
        <ToonMaterial color="#3b2922" />
        <Outlines color="#1e1815" thickness={0.005} />
      </mesh>
      {[-0.19, 0.19].map((x) => (
        <mesh key={x} name="dark-oak-vanity-door" position={[x, 0.46, 0.24]} castShadow>
          <boxGeometry args={[0.372, 0.66, 0.02]} />
          <ToonMaterial color={x < 0 ? "#493229" : "#422d25"} />
          <Outlines color="#241b17" thickness={0.003} />
        </mesh>
      ))}
      {[-0.035, 0.035].map((x) => (
        <mesh key={x} position={[x, 0.48, 0.255]} castShadow>
          <boxGeometry args={[0.018, 0.24, 0.01]} />
          <ToonMaterial color="#171a19" />
        </mesh>
      ))}
      <mesh position={[0, 0.84, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.04, 0.52]} />
        <ToonMaterial color="#50372c" />
        <Outlines color="#241b17" thickness={0.004} />
      </mesh>

      <mesh name="vanity-vessel-basin" position={[-0.04, 0.94, 0.015]} castShadow receiveShadow>
        <cylinderGeometry args={[0.23, 0.19, 0.16, 24]} />
        <ToonMaterial color="#eee9dd" />
        <Outlines color="#969186" thickness={0.004} />
      </mesh>
      <mesh position={[-0.04, 1.021, 0.015]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.175, 24]} />
        <ToonMaterial color="#d6d2c9" />
      </mesh>

      <mesh name="vanity-matte-black-faucet" position={[0.25, 1.045, -0.09]} castShadow>
        <cylinderGeometry args={[0.024, 0.027, 0.37, 10]} />
        <ToonMaterial color="#202422" />
        <Outlines color="#101211" thickness={0.0025} />
      </mesh>
      <mesh position={[0.145, 1.195, -0.09]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.017, 0.019, 0.21, 10]} />
        <ToonMaterial color="#202422" />
      </mesh>
      <mesh position={[0.045, 1.175, -0.09]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.05, 10]} />
        <ToonMaterial color="#202422" />
      </mesh>
      <mesh position={[0.29, 1.18, -0.09]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[0.018, 0.09, 0.018]} />
        <ToonMaterial color="#202422" />
      </mesh>
    </group>
  );
}
