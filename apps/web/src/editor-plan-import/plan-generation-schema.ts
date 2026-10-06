/** A deliberately restricted HomeProject V2 schema for one unfurnished floor.
 * This is the external AI authoring contract, not a replacement for engine validation.
 */
const text = { type: "string", minLength: 1 };
const positive = { type: "number", exclusiveMinimum: 0 };
const nonnegative = { type: "number", minimum: 0 };
const ref = (name: string) => ({ $ref: `#/$defs/${name}` });
const list = (items: object, minItems = 0) => ({ type: "array", items, minItems });
const object = (properties: Record<string, object>) => ({
  type: "object", additionalProperties: false, required: Object.keys(properties), properties,
});
const emptyList = { type: "array", maxItems: 0 };
const emptyObject = object({});
const choice = (...values: (string | number)[]) => ({ enum: values });
const openingBase = {
  id: text, wallId: text, offsetFromWallStartPlanUnits: nonnegative,
  widthPlanUnits: positive, openingHeightMeters: positive, sillHeightMeters: nonnegative,
};

export function planGenerationSchema(homeId: string) {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Cabane HomeProject V2 — single-floor architectural generation subset",
    description: "Every generated project must match this schema AND the geometric rules in the instructions. Optional product features outside this subset are intentionally excluded.",
    ...object({
      schemaVersion: { const: 2 }, seedRevision: { const: "ai-plan-v1" },
      home: object({
        id: { const: homeId }, name: text, locale: { const: "en" },
        palette: object({ accent: text, secondary: text, exterior: text, interior: text, ground: text }),
      }),
      coordinates: ref("coordinates"),
      floors: { ...list(ref("floor"), 1), maxItems: 1 },
      stairs: emptyList, sceneItems: emptyList, roomProfiles: emptyObject,
      openingProfiles: emptyObject, shortcuts: emptyList,
      assumptions: list(object({
        id: text, subjectId: text, summary: text,
        basis: choice("measured", "plan", "photo", "inferred", "user"),
      })),
    }),
    $defs: {
      point: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
      polygon: list(ref("point"), 3),
      coordinates: object({
        origin: { const: [0, 0] }, metersPerPlanUnit: { const: 1 },
        scaleBasis: choice("measured", "inferred"),
      }),
      floor: object({
        id: text, name: text, floorToFloorHeightMeters: positive,
        coordinates: ref("coordinates"), defaultWallHeightMeters: positive,
        defaultCeilingHeightMeters: positive, footprint: ref("polygon"),
        rooms: list(ref("room"), 1), walls: list(ref("wall"), 3),
        wallJunctions: list(ref("junction")), openings: list(ref("opening")),
        ceilings: list(ref("ceiling"), 1),
      }),
      room: object({
        id: text, name: text, polygon: ref("polygon"), accent: text,
        dashboardSlots: emptyList, devices: emptyList,
      }),
      wall: object({
        id: text, from: ref("point"), to: ref("point"),
        classification: choice("interior", "exterior"),
        thicknessMeters: positive, heightMeters: positive,
      }),
      junction: object({ id: text, at: ref("point"), wallIds: { ...list(text, 2), uniqueItems: true } }),
      opening: { oneOf: [
        ...(["hinged", "sliding"] as const).map((operation) => object({ ...openingBase, kind: { const: "door" }, operation: { const: operation },
          variant: choice("panel", "french", "full-glass", "plank"), finish: choice("wood", "white"), leafCount: choice(1, 2),
          openingSide: choice("left", "right"), ...(operation === "hinged" ? { hingeSide: choice("start", "end") } : { slideDirection: choice("start", "end") }),
        })),
        object({ ...openingBase, kind: { const: "door" }, operation: { const: "roll-up" }, variant: { const: "slatted" }, finish: choice("wood", "white"), openingSide: choice("left", "right") }),
        object({ ...openingBase, kind: { const: "window" }, operation: choice("fixed", "casement"),
          variant: { const: "plain" }, panelCount: choice(1, 2), glazing: choice("clear", "privacy"),
          hingeSide: choice("start", "end"), openingSide: choice("left", "right"),
        }),
        object({ ...openingBase, kind: { const: "passage" }, variant: { const: "rectangular" } }),
      ] },
      ceiling: object({ id: text, kind: { const: "flat" }, roomIds: { ...list(text, 1), uniqueItems: true }, heightMeters: positive }),
    },
  };
}
