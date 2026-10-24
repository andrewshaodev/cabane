import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { SRGBColorSpace, TextureLoader, type Texture } from "three";
import { ToonMaterial } from "@cabane/engine";

/** A contained print: owns its texture and leaves the cream mount visible on load failure. */
export function FramedArtImage({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const { invalidate } = useThree();
  const [loaded, setLoaded] = useState<{ src: string; texture: Texture } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let owned: Texture | undefined;
    const loader = new TextureLoader();
    loader.setCrossOrigin("anonymous");
    try {
      loader.load(
        src,
        (texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }
          owned = texture;
          texture.colorSpace = SRGBColorSpace;
          texture.anisotropy = 4;
          setLoaded({ src, texture });
          invalidate();
        },
        undefined,
        () => {
          // An unavailable print must never suspend or crash the surrounding home.
          if (!cancelled) {
            setLoaded(null);
            invalidate();
          }
        },
      );
    } catch {
      // Image APIs may be absent in a non-browser renderer; keep the empty mount.
    }
    return () => {
      cancelled = true;
      owned?.dispose();
    };
  }, [src, invalidate]);
  const texture = loaded?.src === src ? loaded.texture : null;
  if (!texture) return null;
  const image = texture.image as { width: number; height: number };
  const ratio = image.width / image.height;
  const printWidth = Math.min(width, height * ratio);
  const printHeight = printWidth / ratio;
  return (
    <mesh name="framed-art-image">
      <planeGeometry args={[printWidth, printHeight]} />
      <ToonMaterial map={texture} color="white" />
    </mesh>
  );
}
