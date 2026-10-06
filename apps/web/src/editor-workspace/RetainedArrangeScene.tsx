import { useState, type ReactNode } from "react";

/** Keep expensive visual-only meshes across tab changes, without rebuilding them
 * for Construct edits. The next Arrange visit receives the latest draft. */
export function RetainedArrangeScene({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const [retained, setRetained] = useState<ReactNode>(null);
  if (active && retained !== children) setRetained(children);
  return (
    <group name="retained-arrange-scene" visible={active}>
      {active ? children : retained}
    </group>
  );
}
