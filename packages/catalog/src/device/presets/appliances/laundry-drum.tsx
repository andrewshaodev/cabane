import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { ToonMaterial } from "@cabane/engine";
import type { Group } from "three";

export function LaundryDrum({
  reducedMotion,
  position,
  radius,
}: {
  reducedMotion: boolean;
  position: [number, number, number];
  radius: number;
}) {
  const drum = useRef<Group>(null);
  useFrame(({ invalidate }, delta) => {
    if (reducedMotion || !drum.current) return;
    drum.current.rotation.z -= Math.min(delta, 0.05) * 1.5;
    invalidate();
  });
  return (
    <group position={position}>
      <group ref={drum} name="laundry-drum">
        {["#e8c6a5", "#89bbb8"].map((color, i) => (
          <mesh
            key={color}
            position={[
              Math.cos(i * Math.PI) * radius * 0.43,
              Math.sin(i * Math.PI) * radius * 0.43,
              0,
            ]}
            rotation={[0, 0, i * 2]}
            scale={[1, 0.65, 1]}
            raycast={() => undefined}
          >
            <circleGeometry args={[radius * 0.44, 12]} />
            <ToonMaterial color={color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
