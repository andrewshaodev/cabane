# Architectural finishes

This reference documents code-level floor finishes and wall color overrides.
These fields are useful when authoring a home in `home/`; ordinary visual
editing belongs in Cabane's Construct mode.

## Floor finishes

Set `floorFinish` to a custom solid color or one of eight fixed presets. If it
is omitted, Cabane uses its neutral solid fallback. `floorColor` is not a
supported alias; strict project parsing rejects it. `accent` remains the room's
independent UI color.

```json
{
  "id": "bedroom",
  "name": "Bedroom",
  "polygon": [
    [0.2, 0.2],
    [3.8, 0.2],
    [3.8, 2.8],
    [0.2, 2.8]
  ],
  "accent": "#c9a477",
  "floorFinish": { "kind": "preset", "preset": "light-oak" },
  "floorZones": [
    {
      "id": "bedroom-rug-zone",
      "polygon": [
        [0.8, 0.7],
        [2.4, 0.7],
        [2.4, 1.9],
        [0.8, 1.9]
      ],
      "finish": { "kind": "solid", "color": "#b58a62" }
    }
  ],
  "dashboardSlots": [],
  "devices": []
}
```

The preset IDs are `light-oak`, `light-oak-horizontal`, `oak-herringbone`,
`travertine`, `terracotta-tile`, `terrazzo`, `dark-walnut`, `limestone`, and
`encaustic-tile`. Their scale, direction, colors, grout, and detail are fixed.

Each zone must stay inside its owning room. Zones render in array order, so a
later zone covers an earlier overlap; deleting it reveals the earlier finish.
Only `packages/engine/src/floor-finishes` may generate the shared in-memory
pattern textures. Home and catalog code may select a preset but cannot define
textures or material parameters.

## Wall faces

Set `exteriorColor` for a direction-independent facade finish. Cabane applies
it only where the wall borders the outside footprint, so it remains correct if
the wall endpoints are reversed.

```json
{
  "id": "garden-wall",
  "from": [0, 0],
  "to": [4, 0],
  "classification": "exterior",
  "thicknessMeters": 0.2,
  "exteriorColor": "#b86f58"
}
```

Set `faceColors.left` or `faceColors.right` to color either directed face of a
wall independently. A directed face color is the more specific override when
both fields target the same exterior face.

```json
{
  "id": "bedroom-divider",
  "from": [2, 0],
  "to": [2, 3],
  "classification": "interior",
  "thicknessMeters": 0.12,
  "faceColors": {
    "left": "#d8d0e2",
    "right": "#cadccb"
  }
}
```

Left and right are defined while looking from `from` toward `to`. Omitted
values retain the default interior/exterior wall palette.

Wall finishes support solid toon colors only. File-based textures, image
textures, runtime material parameters, and physically based materials are
outside the generated-home visual contract.
