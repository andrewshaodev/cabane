import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { connectedLightBulbFinish } from "./connected-light-finish";

/** Compact single-head path lantern; ground contact is Y=0. */
export function GardenLanternGeometry({
  state,
  visualState,
  height,
}: HomeDeviceModelProps & { height: number }) {
  const finish = connectedLightBulbFinish(visualState, state);
  return (
    <group name={`device-state-${visualState}`} userData={{ walkCollider: true }}>
      <mesh position={[0, 0.035, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.065, 0.07, 12]} />
        <ToonMaterial color="#252e30" />
      </mesh>
      {height > 0.35 && (
        <mesh position={[0, (height - 0.35) / 2 + 0.065, 0]} castShadow>
          <cylinderGeometry args={[0.023, 0.03, height - 0.35, 12]} />
          <ToonMaterial color="#30383a" />
        </mesh>
      )}
      <group position={[0, height - 0.9, 0]}>
        <mesh position={[0, 0.615, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.035, 0.04, 4]} />
          <ToonMaterial color="#252e30" />
        </mesh>
        <group rotation={[0, Math.PI / 4, 0]}>
          <mesh position={[0, 0.64, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.02, 4]} />
            <ToonMaterial color="#252e30" />
          </mesh>
          <mesh position={[0, 0.735, 0]}>
            <cylinderGeometry args={[0.142, 0.095, 0.17, 4, 1, true]} />
            <ToonMaterial color="#d8e6df" transparent opacity={0.2} depthWrite={false} side={2} />
          </mesh>
          {[0, 1, 2, 3].map((index) => (
            <group key={index} rotation={[0, (index * Math.PI) / 2, 0]}>
              <mesh position={[0, 0.735, 0.121]} rotation={[-0.255, 0, 0]} castShadow>
                <boxGeometry args={[0.012, 0.179, 0.012]} />
                <ToonMaterial color="#252e30" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.8275, 0]} castShadow>
            <cylinderGeometry args={[0.1697056275, 0.1697056275, 0.015, 4]} />
            <ToonMaterial color="#252e30" />
          </mesh>
          <mesh position={[0, 0.86, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.1697056275, 0.05, 4]} />
            <ToonMaterial color="#364044" />
          </mesh>
        </group>
        <mesh position={[0, 0.8925, 0]} castShadow>
          <coneGeometry args={[0.013, 0.015, 8]} />
          <ToonMaterial color="#252e30" />
        </mesh>
        <mesh position={[0, 0.669, 0]}>
          <cylinderGeometry args={[0.019, 0.023, 0.04, 12]} />
          <ToonMaterial color="#515654" />
        </mesh>
        <mesh name="garden-lantern-bulb" position={[0, 0.724, 0]}>
          <sphereGeometry args={[0.027, 12, 8]} />
          <ToonMaterial
            color={finish.color}
            emissive="#ffd28c"
            emissiveIntensity={finish.emissiveIntensity}
          />
        </mesh>
      </group>
    </group>
  );
}
