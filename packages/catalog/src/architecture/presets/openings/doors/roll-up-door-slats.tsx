import { ToonMaterial } from "@cabane/engine";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import type { Group } from "three";

function applyTravel(group: Group, clearHeight: number, travel: number) {
  const pitch = clearHeight / (group.children.length - 1);
  group.children.forEach((part, index) => {
    if (part.name === "roll-up-door-handle") {
      part.position.y = 0.85 + travel;
      part.visible = part.position.y + 0.025 < clearHeight;
      return;
    }
    const bottom = index * pitch + travel;
    const height = Math.max(0, Math.min(pitch, clearHeight - bottom));
    part.position.y = bottom + height / 2;
    part.scale.y = height / pitch;
    part.visible = height > 0.000001;
  });
}

export function RollUpDoorSlats({
  width,
  clearHeight,
  travel,
  finish,
  color,
  side,
  reducedMotion,
}: {
  width: number;
  clearHeight: number;
  travel: number;
  finish: "wood" | "white";
  color?: string;
  side: number;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const currentTravel = useRef(travel);
  const invalidate = useThree((state) => state.invalidate);
  const count = Math.max(1, Math.ceil(clearHeight / 0.16));
  const pitch = clearHeight / count;

  useLayoutEffect(() => {
    if (reducedMotion) currentTravel.current = travel;
    currentTravel.current = Math.min(clearHeight, currentTravel.current);
    if (group.current) applyTravel(group.current, clearHeight, currentTravel.current);
    invalidate();
  }, [clearHeight, travel, reducedMotion, side, invalidate]);

  useFrame((_, delta) => {
    if (!group.current || currentTravel.current === travel) return;
    const remaining = travel - currentTravel.current;
    currentTravel.current =
      reducedMotion || Math.abs(remaining) < 0.0001
        ? travel
        : currentTravel.current + remaining * (1 - Math.exp(-5 * Math.min(delta, 0.1)));
    applyTravel(group.current, clearHeight, currentTravel.current);
    if (currentTravel.current !== travel) invalidate();
  });

  return (
    <group ref={group} name="roll-up-door-slats">
      {Array.from({ length: count }, (_, index) => {
        return (
          <mesh key={index} castShadow receiveShadow>
            <boxGeometry args={[width, pitch, 0.045]} />
            <ToonMaterial
              color={
                color ??
                (finish === "wood"
                  ? index % 2
                    ? "#ba9365"
                    : "#ad8559"
                  : index % 2
                    ? "#e8e6df"
                    : "#dddcd6")
              }
            />
          </mesh>
        );
      })}
      <mesh name="roll-up-door-handle" position={[0, 0, side * 0.03]} castShadow>
        <boxGeometry args={[Math.min(0.32, width / 2), 0.04, 0.015]} />
        <ToonMaterial color="#646b68" />
      </mesh>
    </group>
  );
}
