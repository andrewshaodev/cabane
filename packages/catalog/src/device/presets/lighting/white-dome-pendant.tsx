import { Vector2 } from "three";
import { ToonMaterial, lightBrightnessRatio, type HomeDeviceModelProps } from "@cabane/engine";
import { connectedLightFinish } from "./connected-light-finish";
const outer = [
  [0.25, 0],
  [0.25, 0.05],
  [0.24, 0.1],
  [0.2, 0.165],
  [0.12, 0.2],
  [0.06, 0.215],
  [0.04, 0.22],
].map(([r, y]) => new Vector2(r, y));
const inner = [
  [0.04, 0.214],
  [0.06, 0.209],
  [0.118, 0.194],
  [0.196, 0.159],
  [0.235, 0.097],
  [0.244, 0.05],
  [0.244, 0.003],
].map(([r, y]) => new Vector2(r, y));
/** Lower shade rim is Y=0; ceiling canopy reaches Y=1. */
export function WhiteDomePendantModel({ state, visualState }: HomeDeviceModelProps) {
  const finish = connectedLightFinish(visualState);
  return (
    <group name="catalog-white-dome-pendant">
      <mesh name="white-dome-outer-shade" castShadow receiveShadow>
        <latheGeometry args={[outer, 32]} />
        <ToonMaterial color="#eeede7" side={2} />
      </mesh>
      <mesh name="brass-dome-inner-shade" castShadow receiveShadow>
        <latheGeometry args={[inner, 32]} />
        <ToonMaterial color="#c3a260" side={2} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.247, 0.003, 6, 32]} />
        <ToonMaterial color="#c3a260" />
      </mesh>
      <mesh name="oak-pendant-crown" position={[0, 0.245, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.05, 24]} />
        <ToonMaterial color="#c7a67b" />
      </mesh>
      <mesh name="pendant-cord" position={[0, 0.6225, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.705, 8]} />
        <ToonMaterial color="#dedbd2" />
      </mesh>
      <mesh name="ceiling-canopy" position={[0, 0.9875, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.025, 16]} />
        <ToonMaterial color="#eeede7" />
      </mesh>
      <mesh name="white-dome-pendant-emitter" position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.035, 16, 12]} />
        <ToonMaterial
          color={finish.color}
          emissive="#f2c66d"
          emissiveIntensity={finish.emissiveIntensity * lightBrightnessRatio(state)}
        />
      </mesh>
    </group>
  );
}
