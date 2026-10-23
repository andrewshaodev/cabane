import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ToonMaterial } from "@cabane/engine";
import { Object3D, type Group, type InstancedMesh } from "three";

export function VacuumTractorBeam({ reducedMotion }: { reducedMotion: boolean }) {
  const earth = useRef<InstancedMesh>(null);
  const sparks = useRef<InstancedMesh>(null);
  const particle = useMemo(() => new Object3D(), []);
  const updateDust = (elapsed: number, still: boolean) => {
    let earthIndex = 0;
    let sparkIndex = 0;
    for (let index = 0; index < 24; index++) {
      const progress = (elapsed * 0.32 + index / 24) % 1;
      const angle = index * 2.4 + progress * 5;
      const radius = 0.62 * (1 - progress) + 0.04;
      if (still) {
        particle.position.set(Math.sin(index) * 0.4, index / 17, Math.cos(index) * 0.4);
        particle.rotation.set(0, 0, 0);
        particle.scale.setScalar(1);
      } else {
        particle.position.set(Math.cos(angle) * radius, progress * 1.46, Math.sin(angle) * radius);
        particle.rotation.set(progress * 8, angle, 0);
        particle.scale.setScalar(Math.sin(progress * Math.PI));
      }
      particle.updateMatrix();
      if (index % 3 === 0) earth.current?.setMatrixAt(earthIndex++, particle.matrix);
      else sparks.current?.setMatrixAt(sparkIndex++, particle.matrix);
    }
    if (earth.current) earth.current.instanceMatrix.needsUpdate = true;
    if (sparks.current) sparks.current.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(() => {
    updateDust(0, true);
  });
  const time = useRef(0);
  const waves = useRef<Group>(null);
  useFrame(({ invalidate }, delta) => {
    if (reducedMotion || !earth.current) return;
    time.current += Math.min(delta, 0.05);
    updateDust(time.current, false);
    waves.current?.children.forEach((wave, index) => {
      const progress = (time.current * 0.24 + index / 5) % 1;
      wave.position.y = 0.04 + progress * 1.41;
      wave.scale.setScalar(1 - progress * 0.82);
    });
    invalidate();
  });
  return (
    <group name="vacuum-tractor-beam">
      <mesh position={[0, 0.75, 0]} raycast={() => undefined}>
        <cylinderGeometry args={[0.12, 0.7, 1.45, 48, 1, true]} />
        <ToonMaterial
          color="#69f5d4"
          emissive="#49dacb"
          emissiveIntensity={0.8}
          transparent
          opacity={0.09}
          depthWrite={false}
          side={2}
        />
      </mesh>
      <group ref={waves}>
        {[0.04, 0.38, 0.75, 1.12, 1.45].map((height) => (
          <mesh
            key={height}
            position={[0, height, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            raycast={() => undefined}
          >
            <torusGeometry args={[0.68, 0.008, 6, 48]} />
            <ToonMaterial
              color="#9affdf"
              emissive="#67e8cf"
              emissiveIntensity={0.8}
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
      <instancedMesh
        ref={earth}
        args={[undefined, undefined, 8]}
        frustumCulled={false}
        raycast={() => undefined}
      >
        <octahedronGeometry args={[0.025]} />
        <ToonMaterial color="#c8a278" emissive="#78c9b1" emissiveIntensity={0.35} />
      </instancedMesh>
      <instancedMesh
        ref={sparks}
        args={[undefined, undefined, 16]}
        frustumCulled={false}
        raycast={() => undefined}
      >
        <octahedronGeometry args={[0.013]} />
        <ToonMaterial color="#b1ffee" emissive="#78c9b1" emissiveIntensity={0.35} />
      </instancedMesh>
    </group>
  );
}
