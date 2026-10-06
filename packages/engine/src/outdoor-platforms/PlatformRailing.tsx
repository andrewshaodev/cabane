import { PlatformRailingMember } from "./PlatformRailingMember";

export function PlatformRailing({
  length,
  height,
  name,
}: {
  length: number;
  height: number;
  name?: string | undefined;
}) {
  const divisions = Math.ceil(length / 0.14);
  const topHeight = Math.min(0.05, height);
  const lowerHeight = Math.min(0.035, height);
  return (
    <>
      <PlatformRailingMember
        name={`${name}-top`}
        at={[0, height - topHeight / 2, 0]}
        size={[length, topHeight, 0.06]}
      />
      <PlatformRailingMember
        name={`${name}-lower`}
        at={[0, Math.max(lowerHeight / 2, Math.min(0.15, height * 0.2)), 0]}
        size={[length, lowerHeight, 0.045]}
      />
      {Array.from({ length: divisions + 1 }, (_, index) => (
        <PlatformRailingMember
          key={index}
          name={`${name}-post-${index}`}
          at={[-length / 2 + (length * index) / divisions, height / 2, 0]}
          size={[0.025, height, 0.025]}
        />
      ))}
    </>
  );
}
