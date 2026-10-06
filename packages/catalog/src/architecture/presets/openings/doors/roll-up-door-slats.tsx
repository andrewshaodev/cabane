import { ToonMaterial } from "@cabane/engine";
export function RollUpDoorSlats({ width, clearHeight, travel, finish, side }: {
  width: number; clearHeight: number; travel: number; finish: "wood" | "white"; side: number;
}) {
  const count = Math.max(1, Math.ceil(clearHeight / .16));
  const pitch = clearHeight / count;
  const handleY = .85 + travel;
  return <group name="roll-up-door-slats">
    {Array.from({ length: count }, (_, index) => {
      const bottom = index * pitch + travel;
      const height = Math.min(pitch, clearHeight - bottom);
      if (height <= .000001) return null;
      return <mesh key={index} position={[0, bottom + height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, .045]} />
        <ToonMaterial color={finish === "wood" ? (index % 2 ? "#ba9365" : "#ad8559") : (index % 2 ? "#e8e6df" : "#dddcd6")} />
      </mesh>;
    })}
    {handleY + .025 < clearHeight && <mesh name="roll-up-door-handle" position={[0, handleY, side * .03]} castShadow>
      <boxGeometry args={[Math.min(.32, width / 2), .04, .015]} /><ToonMaterial color="#646b68" />
    </mesh>}
  </group>;
}
