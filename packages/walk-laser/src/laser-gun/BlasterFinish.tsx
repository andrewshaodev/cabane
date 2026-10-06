import { ToonMaterial } from "@cabane/engine";

/** A single coating palette for the blaster's procedural parts. */
export function BlasterFinish({ kind }: { kind: "armor" | "chassis" | "trim" | "grip" | "energy" | "hot" | "recess" | "glint" }) {
  const color = { armor: "#fff0d5", chassis: "#44384d", trim: "#efa632", grip: "#514052", energy: "#51e8f3", hot: "#f26a35", recess: "#231c2b", glint: "#f2ffff" }[kind];
  const glowing = kind === "energy" || kind === "hot" || kind === "glint";
  return <ToonMaterial color={color} emissive={glowing ? color : "#000000"}
    emissiveIntensity={glowing ? .65 : 0} toneMapped={!glowing} />;
}
