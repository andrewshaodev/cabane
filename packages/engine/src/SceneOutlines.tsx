import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { shaderMaterial, type OutlinesProps } from "@react-three/drei";
import { applyProps, createPortal, extend, useThree } from "@react-three/fiber";
import {
  BackSide,
  type BufferGeometry,
  Color,
  type Group,
  InstancedMesh,
  Mesh,
  SkinnedMesh,
  Vector2,
} from "three";

import { optimizedCreasedNormalGeometry } from "./creased-normal-geometry";
export { optimizedCreasedNormalGeometry } from "./creased-normal-geometry";

const OutlineMaterial = shaderMaterial(
  {
    screenspace: false,
    color: new Color("black"),
    opacity: 1,
    thickness: 0.05,
    size: new Vector2(),
    offset: new Vector2(),
  },
  `#include <common>
   #include <morphtarget_pars_vertex>
   #include <skinning_pars_vertex>
   #include <clipping_planes_pars_vertex>
   uniform float thickness; uniform bool screenspace; uniform vec2 size; uniform vec2 offset;
   void main() {
     #if defined (USE_SKINNING)
       #include <beginnormal_vertex>
       #include <morphnormal_vertex>
       #include <skinbase_vertex>
       #include <skinnormal_vertex>
       #include <defaultnormal_vertex>
     #endif
     #include <begin_vertex>
     #include <morphtarget_vertex>
     #include <skinning_vertex>
     #include <project_vertex>
     #include <clipping_planes_vertex>
     vec4 tNormal = vec4(normal, 0.0); vec4 tPosition = vec4(transformed, 1.0);
     #ifdef USE_INSTANCING
       tNormal = instanceMatrix * tNormal; tPosition = instanceMatrix * tPosition;
     #endif
     if (screenspace) {
       gl_Position = projectionMatrix * modelViewMatrix * vec4(tPosition.xyz + tNormal.xyz * thickness, 1.0);
     } else {
       vec4 clipPosition = projectionMatrix * modelViewMatrix * tPosition;
       vec4 clipNormal = projectionMatrix * modelViewMatrix * tNormal;
       clipPosition.xy += (normalize(clipNormal.xy) * thickness + offset) / size * clipPosition.w * 2.0;
       gl_Position = clipPosition;
     }
   }`,
  `uniform vec3 color; uniform float opacity;
   #include <clipping_planes_pars_fragment>
   void main() {
     #include <clipping_planes_fragment>
     gl_FragColor = vec4(color, opacity);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
   }`,
);

type SceneOutlinesProps = OutlinesProps & {
  offsetPixels?: readonly [x: number, y: number];
};

export function SceneOutlines({
  color = "black",
  opacity = 1,
  transparent = false,
  screenspace = false,
  toneMapped = true,
  polygonOffset = false,
  polygonOffsetFactor = 0,
  renderOrder = 0,
  thickness = 0.05,
  angle = Math.PI,
  clippingPlanes,
  offsetPixels = [0, 0],
  ...props
}: SceneOutlinesProps) {
  const ref = useRef<Group>(null);
  const [material] = useState(() => new OutlineMaterial({ side: BackSide }));
  const { gl } = useThree();
  const contextSize = gl.getDrawingBufferSize(new Vector2());
  useMemo(() => extend({ OutlineMaterial }), []);
  const previous = useRef<{ angle: number; geometry: BufferGeometry | null }>({
    angle: 0,
    geometry: null,
  });

  useLayoutEffect(() => {
    const group = ref.current;
    const parent = group?.parent as Mesh | undefined;
    if (!group || !parent?.geometry) return;
    if (previous.current.angle === angle && previous.current.geometry === parent.geometry) return;
    previous.current = { angle, geometry: parent.geometry };
    const oldMesh = group.children[0] as Mesh | undefined;
    if (oldMesh) {
      if (angle) oldMesh.geometry.dispose();
      group.remove(oldMesh);
    }
    let mesh: Mesh | SkinnedMesh | InstancedMesh;
    if ((parent as SkinnedMesh).isSkinnedMesh) {
      const child = new SkinnedMesh();
      child.bind((parent as SkinnedMesh).skeleton, (parent as SkinnedMesh).bindMatrix);
      mesh = child;
    } else if ((parent as InstancedMesh).isInstancedMesh) {
      const child = new InstancedMesh(parent.geometry, material, (parent as InstancedMesh).count);
      child.instanceMatrix = (parent as InstancedMesh).instanceMatrix;
      mesh = child;
    } else mesh = new Mesh();
    mesh.material = material;
    mesh.geometry = angle
      ? optimizedCreasedNormalGeometry(parent.geometry, angle)
      : parent.geometry;
    mesh.raycast = () => null;
    mesh.userData.sceneOutline = true;
    mesh.morphTargetInfluences = parent.morphTargetInfluences;
    mesh.morphTargetDictionary = parent.morphTargetDictionary;
    group.add(mesh);
  });

  useLayoutEffect(() => {
    const group = ref.current;
    const mesh = group?.children[0] as Mesh | undefined;
    const parent = group?.parent as Mesh | undefined;
    if (!mesh || !parent) return;
    mesh.renderOrder = renderOrder;
    applyProps(mesh, {
      morphTargetInfluences: parent.morphTargetInfluences,
      morphTargetDictionary: parent.morphTargetDictionary,
    });
    applyProps(mesh.material, {
      transparent,
      thickness,
      color,
      opacity,
      size: contextSize,
      screenspace,
      offset: offsetPixels,
      toneMapped,
      polygonOffset,
      polygonOffsetFactor,
      clippingPlanes,
      clipping: Boolean(clippingPlanes?.length),
    });
  });

  useEffect(
    () => () => {
      const group = ref.current;
      if (!group) return;
      const mesh = group.children[0] as Mesh | undefined;
      if (mesh) {
        if (angle) mesh.geometry.dispose();
        group.remove(mesh);
      }
    },
    [],
  );
  return <group ref={ref} {...props} />;
}

export function GroupOutlines({ target, ...props }: SceneOutlinesProps & { target: Group }) {
  const [meshes, setMeshes] = useState<readonly Mesh[]>([]);

  useLayoutEffect(() => {
    const next: Mesh[] = [];
    target.traverse((object) => {
      const mesh = object as Mesh;
      if (mesh.isMesh && !mesh.userData.sceneOutline) next.push(mesh);
    });
    setMeshes((current) =>
      current.length === next.length && current.every((mesh, index) => mesh === next[index])
        ? current
        : next,
    );
  }, [target]);

  return (
    <>
      {meshes.map((mesh) => (
        <Fragment key={mesh.uuid}>{createPortal(<SceneOutlines {...props} />, mesh)}</Fragment>
      ))}
    </>
  );
}
