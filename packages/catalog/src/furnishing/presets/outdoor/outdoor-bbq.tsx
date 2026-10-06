import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const OUTDOOR_BBQ_SIZE = [1.2, 1.1, 0.6] as const;
export function OutdoorBbq({ size = OUTDOOR_BBQ_SIZE, variant = "default" }: { size?: SceneItemSize; variant?: string }) {
  return <group name="outdoor-bbq" scale={[size[0] / 1.2, size[1] / 1.1, size[2] / 0.6]} userData={{ walkCollider: true }}>
<RoundedFurniturePanel name="bbq-cart" size={[0.65, 0.08, 0.48]} position={[0, 0.19, 0]} color="#353e3b" radius={.006} />
<RoundedFurniturePanel name="bbq-leg" size={[0.045, 0.68, 0.045]} position={[-0.28, 0.34, -0.22]} color="#414a46" radius={.006} />
<RoundedFurniturePanel name="bbq-leg" size={[0.045, 0.68, 0.045]} position={[-0.28, 0.34, 0.22]} color="#414a46" radius={.006} />
<RoundedFurniturePanel name="bbq-leg" size={[0.045, 0.68, 0.045]} position={[0.28, 0.34, -0.22]} color="#414a46" radius={.006} />
<RoundedFurniturePanel name="bbq-leg" size={[0.045, 0.68, 0.045]} position={[0.28, 0.34, 0.22]} color="#414a46" radius={.006} />
<RoundedFurniturePanel name="bbq-firebox" size={[0.72, 0.25, 0.57]} position={[0, 0.755, -0.015]} color="#343c39" radius={.006} />
<RoundedFurniturePanel name="bbq-lid" size={[0.72, 0.19, 0.56]} position={[0, 0.975, -0.02]} color="#4c5952" radius={.006} />
<RoundedFurniturePanel name="bbq-side-shelf" size={[0.24, 0.035, 0.48]} position={[-0.48, 0.79, 0]} color="#b89564" radius={.006} />
<RoundedFurniturePanel name="bbq-side-shelf" size={[0.24, 0.035, 0.48]} position={[0.48, 0.79, 0]} color="#b89564" radius={.006} />
<RoundedFurniturePanel name="bbq-lid-pull" size={[0.3, 0.03, 0.04]} position={[0, 0.94, 0.28]} color="#aeb7af" radius={.006} />
<RoundedFurniturePanel name="bbq-thermometer" size={[0.07, 0.03, 0.04]} position={[0, 1.085, 0.08]} color="#c4cec5" radius={.006} />
{[-.18,0,.18].map(x => <mesh key={x} name="bbq-control-knob" position={[x,.76,.285]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.025,.025,.03,12]} /><ToonMaterial color="#bdc4b9" /></mesh>)}
  </group>;
}
