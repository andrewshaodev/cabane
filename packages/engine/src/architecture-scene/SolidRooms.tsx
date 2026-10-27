import { useEffect, useMemo } from "react";
import { ExtrudeGeometry, Shape } from "three";
import { planPointToWorld } from "../geometry";
import { ToonMaterial } from "../rendering";
import type { FloorSpec } from "../types";

/** Fill enclosed structural spaces without making them selectable runtime rooms. */
export function SolidRooms({ floor, color }: { floor: FloorSpec; color: string }) {
  const volumes = useMemo(
    () =>
      [...(floor.solidRooms ?? []), ...floor.rooms.filter((room) => room.isSolid)].map((room) => {
        const shape = new Shape();
        room.polygon.forEach((point, index) => {
          const [x, z] = planPointToWorld(point, floor.coordinates);
          if (index === 0) shape.moveTo(x, -z);
          else shape.lineTo(x, -z);
        });
        shape.closePath();
        return {
          id: room.id,
          geometry: new ExtrudeGeometry(shape, {
            // Keep the cap below the overlapping wall tops to avoid coplanar faces.
            depth: floor.defaultWallHeightMeters - 0.002,
            bevelEnabled: false,
          }),
        };
      }),
    [floor],
  );
  useEffect(() => () => volumes.forEach(({ geometry }) => geometry.dispose()), [volumes]);
  return (
    <group name="solid-spaces">
      {volumes.map(({ id, geometry }) => (
        <mesh
          key={id}
          name={`solid-space-${id}`}
          geometry={geometry}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <ToonMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}
