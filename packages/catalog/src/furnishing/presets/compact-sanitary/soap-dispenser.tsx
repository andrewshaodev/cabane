import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const SOAP_DISPENSER_SIZE = [0.07, 0.18, 0.07] as const;
export function SoapDispenser({
  size = SOAP_DISPENSER_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const clear = variant === "clear";
  const bluePump = variant === "white-blue";
  return (
    <group name="soap-dispenser" scale={[size[0] / 0.07, size[1] / 0.18, size[2] / 0.07]}>
      <mesh name="soap-bottle" position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.03, 0.035, 0.14, 20]} />
        <ToonMaterial
          color={clear ? "#d4d6ca" : variant === "white" || bluePump ? "#e9e6dc" : "#242a29"}
          transparent={clear}
          opacity={clear ? 0.4 : 1}
          depthWrite={!clear}
        />
      </mesh>
      {clear && (
        <mesh name="soap-liquid" position={[0, 0.043, 0]}>
          <cylinderGeometry args={[0.024, 0.029, 0.07, 20]} />
          <ToonMaterial color="#c9b57a" />
        </mesh>
      )}
      <mesh position={[0, 0.146, 0]}>
        <cylinderGeometry args={[0.017, 0.017, 0.012, 16]} />
        <ToonMaterial color={bluePump ? "#8aa9b8" : clear ? "#aeb3ab" : "#373b38"} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.018, 12]} />
        <ToonMaterial color="#9aa39e" />
      </mesh>
      <RoundedFurniturePanel
        name="soap-pump-head"
        size={[0.05, 0.012, 0.018]}
        position={[0.01, 0.174, 0]}
        color={bluePump ? "#8aa9b8" : clear ? "#bdc4bf" : "#373b38"}
        radius={0.004}
        outline={false}
      />
    </group>
  );
}
