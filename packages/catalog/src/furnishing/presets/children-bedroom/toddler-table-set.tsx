import { Outlines, ToonMaterial } from "@cabane/engine";

const WOOD = "#c8945b";
const WOOD_LIGHT = "#dfb77f";
const WOOD_DARK = "#67482f";

function ToddlerChair({
  position,
  rotationY,
}: {
  readonly position: [number, number, number];
  readonly rotationY: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-0.13, 0.13].flatMap((x) =>
        [-0.11, 0.11].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.17, z]}
            rotation={[z < 0 ? -0.04 : 0.04, 0, x < 0 ? -0.035 : 0.035]}
            castShadow
          >
            <capsuleGeometry args={[0.024, 0.29, 5, 10]} />
            <ToonMaterial color={WOOD} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.2, 0.055, 28]} />
        <ToonMaterial color={WOOD_LIGHT} />
        <Outlines color={WOOD_DARK} thickness={0.005} screenspace={false} />
      </mesh>
      <mesh position={[0, 0.371, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.012, 28]} />
        <ToonMaterial color="#d7b98e" />
      </mesh>
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 0.52, -0.13]} castShadow>
          <capsuleGeometry args={[0.022, 0.25, 5, 10]} />
          <ToonMaterial color={WOOD} />
        </mesh>
      ))}
      <mesh position={[0, 0.665, -0.13]} castShadow>
        <torusGeometry args={[0.145, 0.027, 8, 28, Math.PI]} />
        <ToonMaterial color={WOOD_LIGHT} />
        <Outlines color={WOOD_DARK} thickness={0.004} screenspace={false} />
      </mesh>
      {[-0.09, 0, 0.09].map((x) => (
        <mesh key={x} position={[x, 0.56, -0.13]} castShadow>
          <capsuleGeometry args={[0.012, 0.15, 4, 8]} />
          <ToonMaterial color={WOOD_LIGHT} />
        </mesh>
      ))}
    </group>
  );
}

export function ChildrenBedroomToddlerTableSet() {
  return (
    <group name="table-et-chaises-enfant-photo" userData={{ walkCollider: true }}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.36, 0.065, 32]} />
        <ToonMaterial color={WOOD_LIGHT} />
        <Outlines color={WOOD_DARK} thickness={0.006} screenspace={false} />
      </mesh>
      <mesh position={[0, 0.486, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.012, 32]} />
        <ToonMaterial color="#e6c594" />
      </mesh>
      {[-0.18, 0.18].flatMap((x) =>
        [-0.18, 0.18].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.225, z]}
            rotation={[z < 0 ? -0.035 : 0.035, 0, x < 0 ? -0.035 : 0.035]}
            castShadow
          >
            <capsuleGeometry args={[0.025, 0.39, 5, 10]} />
            <ToonMaterial color={WOOD} />
          </mesh>
        )),
      )}
      <mesh position={[0.05, 0.525, -0.03]} castShadow>
        <cylinderGeometry args={[0.055, 0.045, 0.07, 18]} />
        <ToonMaterial color="#d4938b" />
        <Outlines color="#7e5d58" thickness={0.003} screenspace={false} />
      </mesh>
      <ToddlerChair position={[-0.52, 0, 0.03]} rotationY={Math.PI / 2} />
      <ToddlerChair position={[0.05, 0, 0.56]} rotationY={Math.PI} />
    </group>
  );
}
