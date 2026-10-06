import type { HomeManifest } from "../../types";

/** Demo controls own the visual state of simulated light fixtures. */
export function demoLightVisualManifest(manifest: HomeManifest): HomeManifest {
  return {
    ...manifest,
    sceneItems: manifest.sceneItems.map((item) =>
      item.kind === "device" &&
      item.entitySlots.some(
        (slot) => slot.deviceRole === "primary" && slot.compatibleDomains.includes("light"),
      )
        ? { ...item, lightState: "connected" as const }
        : item,
    ),
  };
}
