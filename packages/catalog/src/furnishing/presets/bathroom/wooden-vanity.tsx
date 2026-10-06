import { Outlines, ToonMaterial } from "@cabane/engine";

const doorCenters = [-0.72, -0.24, 0.24, 0.72] as const;
const slatHeights = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6] as const;

export function WoodenVanity() {
  return (
    <group name="wooden-vanity">
      {[-0.78, 0.78].flatMap((z) =>
        [-0.17, 0.17].map((x) => (
          <mesh key={`${x}-${z}`} position={[x, 0.06, z]} castShadow>
            <boxGeometry args={[0.07, 0.12, 0.07]} />
            <ToonMaterial color="#684735" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.68, 2.12]} />
        <ToonMaterial color="#9a6745" />
        <Outlines color="#5f3e2e" thickness={0.006} />
      </mesh>
      <mesh position={[-0.247, 0.43, 0]} castShadow>
        <boxGeometry args={[0.018, 0.58, 2.01]} />
        <ToonMaterial color="#a87550" />
      </mesh>
      {doorCenters.flatMap((z) =>
        slatHeights.map((y) => (
          <mesh key={`${z}-${y}`} position={[-0.26, y, z]} castShadow>
            <boxGeometry args={[0.018, 0.018, 0.38]} />
            <ToonMaterial color={Math.round(y * 100) % 10 === 0 ? "#704a35" : "#7f563d"} />
          </mesh>
        )),
      )}
      {doorCenters.map((z) => (
        <mesh
          key={`handle-${z}`}
          position={[-0.278, 0.44, z + 0.16]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.022, 0.022, 0.035, 10]} />
          <ToonMaterial color="#4b4039" />
        </mesh>
      ))}
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.05, 2.18]} />
        <ToonMaterial color="#a97650" />
        <Outlines color="#5f3e2e" thickness={0.005} />
      </mesh>
    </group>
  );
}
