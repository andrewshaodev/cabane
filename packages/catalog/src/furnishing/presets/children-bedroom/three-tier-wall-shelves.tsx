import { Outlines, ToonMaterial } from "@cabane/engine";
import { ShelfPlush } from "./shelf-plush";

export function ThreeTierWallShelves() {
  return (
    <group name="etageres-murales-bedroom-three-photo">
      {[0, .36, .72].map((y, index) => (
        <group key={y} position={[0, y, index * .15]}>
          <mesh castShadow>
            <boxGeometry args={[.3, .045, .58]} />
            <ToonMaterial color="#b97e4c" />
            <Outlines color="#654327" thickness={.005} screenspace={false} />
          </mesh>
          <mesh position={[.125, .028, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[.012, .54, 4, 8]} />
            <ToonMaterial color="#d6a16f" />
          </mesh>
          {[-.13, .13].slice(0, index === 2 ? 2 : 1).map((z, toyIndex) => (
            <ShelfPlush
              key={z}
              position={[.08, .045, z]}
              color={[
                ["#d79d9c", "#efe1d2"],
                ["#e3c0b2", "#b98c78"],
                ["#9eafa2", "#d6a06c"],
              ][index][toyIndex]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
