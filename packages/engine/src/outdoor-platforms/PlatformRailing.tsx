import { PlatformRailingMember } from "./PlatformRailingMember";

export function PlatformRailing({ length, height, name }: { length: number; height: number; name?: string }) {
  const divisions = Math.ceil(length / .14);
  const topHeight = Math.min(.05, height);
  const lowerHeight = Math.min(.035, height);
  return <>
    <PlatformRailingMember name={`${name}-top`} at={[0, height - topHeight / 2, 0]} size={[length, topHeight, .06]} />
    <PlatformRailingMember name={`${name}-lower`} at={[0, Math.max(lowerHeight / 2, Math.min(.15, height * .2)), 0]} size={[length, lowerHeight, .045]} />
    {Array.from({ length: divisions + 1 }, (_, index) => <PlatformRailingMember key={index}
      name={`${name}-post-${index}`} at={[-length / 2 + length * index / divisions, height / 2, 0]} size={[.025, height, .025]} />)}
  </>;
}
