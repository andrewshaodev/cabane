import { Outlines, ToonMaterial } from "@cabane/engine";
import { RoundedBedroomFurnitureBlock } from "./rounded-bedroom-furniture-block";

function ShelfBear() {
  return (
    <group position={[-0.1, 0.84, 0]}>
      <mesh position={[0, 0.055, 0]} scale={[0.08, 0.09, 0.065]} castShadow>
        <sphereGeometry args={[1, 16, 10]} />
        <ToonMaterial color="#c88e78" />
        <Outlines color="#6f5147" thickness={0.003} screenspace={false} />
      </mesh>
      <mesh position={[0, 0.16, 0]} scale={[0.065, 0.06, 0.055]} castShadow>
        <sphereGeometry args={[1, 16, 10]} />
        <ToonMaterial color="#d19a83" />
      </mesh>
      {[-0.045, 0.045].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]}>
          <sphereGeometry args={[0.025, 10, 8]} />
          <ToonMaterial color="#b77868" />
        </mesh>
      ))}
    </group>
  );
}

function ToyTrain() {
  return (
    <group position={[0.02, 0.5, 0]}>
      <mesh position={[0, 0.055, 0]} castShadow>
        <boxGeometry args={[0.25, 0.1, 0.12, 2, 1, 1]} />
        <ToonMaterial color="#8eafa0" />
        <Outlines color="#536c63" thickness={0.003} screenspace={false} />
      </mesh>
      <mesh position={[-0.055, 0.13, 0]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.1]} />
        <ToonMaterial color="#d3aa6d" />
      </mesh>
      {[-0.075, 0.075].map((x) => (
        <mesh key={x} position={[x, 0.015, -0.067]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.018, 12]} />
          <ToonMaterial color="#665244" />
        </mesh>
      ))}
    </group>
  );
}

function StackingToy() {
  return (
    <group position={[-0.02, 0.17, 0]}>
      {[0.055, 0.045, 0.035].map((radius, index) => (
        <mesh key={radius} position={[0, index * 0.045, 0]} castShadow>
          <torusGeometry args={[radius, 0.018, 7, 18]} />
          <ToonMaterial color={["#d49590", "#ddb873", "#90aa9d"][index]} />
        </mesh>
      ))}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.01, 0.014, 0.18, 8]} />
        <ToonMaterial color="#9b6f48" />
      </mesh>
    </group>
  );
}

export function ChildrenBedroomNarrowToyShelf() {
  return (
    <group name="etagere-jouets-etroite-photo" userData={{ walkCollider: true }}>
      <RoundedBedroomFurnitureBlock
        size={[0.43, 0.94, 0.025]}
        position={[0, 0.51, 0.132]}
        color="#e6e0d6"
        radius={0.012}
        outlineColor="#73736d"
        outlineThickness={0.004}
      />
      {[-0.23, 0.23].map((x) => (
        <RoundedBedroomFurnitureBlock
          key={x}
          size={[0.045, 1.02, 0.28]}
          position={[x, 0.51, 0]}
          color="#f0ece4"
          radius={0.015}
          outlineColor="#73736d"
        />
      ))}
      {[0.025, 0.34, 0.67, 1.0].map((y) => (
        <RoundedBedroomFurnitureBlock
          key={y}
          size={[0.415, 0.05, 0.28]}
          position={[0, y, 0]}
          color="#f3efe7"
          radius={0.015}
          outlineColor="#73736d"
        />
      ))}
      <StackingToy />
      <ToyTrain />
      <ShelfBear />
    </group>
  );
}
