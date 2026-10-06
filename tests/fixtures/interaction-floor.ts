import { defineHomeManifest, neutralDemoManifest } from "@cabane/engine";

/** A fixed rectangular plan for pointer tests, independent of the bundled home. */
export const interactionFloor = defineHomeManifest({
  ...neutralDemoManifest,
  floors: [
    {
      ...neutralDemoManifest.floors[0],
      footprint: [
        [0, 0.16],
        [11.3, 0.16],
        [11.3, 7.8],
        [0, 7.8],
      ],
      rooms: [
        {
          id: "interaction-room",
          name: "Interaction room",
          accent: "#c98164",
          polygon: [
            [0.1, 0.26],
            [11.2, 0.26],
            [11.2, 7.7],
            [0.1, 7.7],
          ],
          dashboardSlots: [],
          devices: [],
        },
      ],
      walls: [
        {
          id: "fixture-north",
          from: [0, 0.16],
          to: [11.3, 0.16],
          classification: "exterior",
          thicknessMeters: 0.2,
        },
        {
          id: "fixture-east",
          from: [11.3, 0.16],
          to: [11.3, 7.8],
          classification: "exterior",
          thicknessMeters: 0.2,
        },
        {
          id: "fixture-south",
          from: [11.3, 7.8],
          to: [0, 7.8],
          classification: "exterior",
          thicknessMeters: 0.2,
        },
        {
          id: "fixture-west",
          from: [0, 7.8],
          to: [0, 0.16],
          classification: "exterior",
          thicknessMeters: 0.2,
        },
      ],
      wallJunctions: [
        { id: "fixture-nw", at: [0, 0.16], wallIds: ["fixture-north", "fixture-west"] },
        { id: "fixture-ne", at: [11.3, 0.16], wallIds: ["fixture-north", "fixture-east"] },
        { id: "fixture-se", at: [11.3, 7.8], wallIds: ["fixture-east", "fixture-south"] },
        { id: "fixture-sw", at: [0, 7.8], wallIds: ["fixture-south", "fixture-west"] },
      ],
      openings: [
        {
          ...neutralDemoManifest.floors[0].openings[0],
          id: "fixture-door",
          wallId: "fixture-north",
          offsetFromWallStartPlanUnits: 5.25,
        },
      ],
      ceilings: [
        { id: "fixture-ceiling", kind: "flat", roomIds: ["interaction-room"], heightMeters: 2.55 },
      ],
    },
  ],
}).floors[0];
