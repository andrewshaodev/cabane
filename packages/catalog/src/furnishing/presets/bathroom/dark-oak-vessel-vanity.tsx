import { Outlines, ToonMaterial, type SceneItemSize } from "@cabane/engine";

export const DARK_OAK_VESSEL_VANITY_SIZE = [.8, 1.23, .52] as const;

export function DarkOakVesselVanity({
  size = DARK_OAK_VESSEL_VANITY_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="dark-oak-vessel-vanity"
      scale={[size[0] / .8, size[1] / 1.23, size[2] / .52]}
      userData={{ walkCollider: true }}
    >
      {[-.33, .33].flatMap((x) => [-.21, .21].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, .05, z]} castShadow>
          <boxGeometry args={[.055, .1, .055]} />
          <ToonMaterial color="#32251f" />
        </mesh>
      )))}
      <mesh position={[0, .46, -.01]} castShadow receiveShadow>
        <boxGeometry args={[.76, .72, .48]} />
        <ToonMaterial color="#3b2922" />
        <Outlines color="#1e1815" thickness={.005} />
      </mesh>
      {[-.19, .19].map((x) => (
        <mesh key={x} name="dark-oak-vanity-door" position={[x, .46, .24]} castShadow>
          <boxGeometry args={[.372, .66, .02]} />
          <ToonMaterial color={x < 0 ? "#493229" : "#422d25"} />
          <Outlines color="#241b17" thickness={.003} />
        </mesh>
      ))}
      {[-.035, .035].map((x) => (
        <mesh key={x} position={[x, .48, .255]} castShadow>
          <boxGeometry args={[.018, .24, .01]} />
          <ToonMaterial color="#171a19" />
        </mesh>
      ))}
      <mesh position={[0, .84, 0]} castShadow receiveShadow>
        <boxGeometry args={[.8, .04, .52]} />
        <ToonMaterial color="#50372c" />
        <Outlines color="#241b17" thickness={.004} />
      </mesh>

      <mesh name="vanity-vessel-basin" position={[-.04, .94, .015]} castShadow receiveShadow>
        <cylinderGeometry args={[.23, .19, .16, 24]} />
        <ToonMaterial color="#eee9dd" />
        <Outlines color="#969186" thickness={.004} />
      </mesh>
      <mesh position={[-.04, 1.021, .015]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[.175, 24]} />
        <ToonMaterial color="#d6d2c9" />
      </mesh>

      <mesh name="vanity-matte-black-faucet" position={[.25, 1.045, -.09]} castShadow>
        <cylinderGeometry args={[.024, .027, .37, 10]} />
        <ToonMaterial color="#202422" />
        <Outlines color="#101211" thickness={.0025} />
      </mesh>
      <mesh position={[.145, 1.195, -.09]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[.017, .019, .21, 10]} />
        <ToonMaterial color="#202422" />
      </mesh>
      <mesh position={[.045, 1.175, -.09]} castShadow>
        <cylinderGeometry args={[.015, .015, .05, 10]} />
        <ToonMaterial color="#202422" />
      </mesh>
      <mesh position={[.29, 1.18, -.09]} rotation={[0, 0, -.35]} castShadow>
        <boxGeometry args={[.018, .09, .018]} />
        <ToonMaterial color="#202422" />
      </mesh>
    </group>
  );
}
