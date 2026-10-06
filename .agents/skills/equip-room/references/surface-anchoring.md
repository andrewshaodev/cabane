# Surface Anchoring and Contact

Placement values are derived results. Calculate contacts from source geometry,
the floor transform, and full object bounds before writing coordinates.

## Plan-to-world conversion

Use the floor's single transform:

```text
worldX = (planX - originX) * metersPerPlanUnit
worldZ = (planY - originY) * metersPerPlanUnit
```

Do not add a second origin, create a room-local scale, or copy a plan scale
constant into a furnishings component.

## Floor contact

For world-space floor elevation `floorY`, local object minimum `minY`, object
scale `scaleY`, and desired gap `gap`:

```text
objectY = floorY + gap - minY * scaleY
```

After composing and rotating the full object, verify:

```text
actualGap = transformedWorldMinY - floorY
```

Target `0–0.002 m` (0–2 mm). Include feet, outlines, cushions, cords, and all
children in the transformed bounds.

## Wall contact

Represent the wall mounting plane with a point `P` and a unit normal `N`
pointing into the room. Let the object's transformed support extent along the
normal be `supportExtent`, and let `gap` be the desired clearance:

```text
objectCenter = P + N * (supportExtent + gap)
```

For an axis-aligned approximation with transformed half-extents `hx` and
`hz`:

```text
supportExtent = abs(N.x) * hx + abs(N.z) * hz
```

Use exact transformed bounds or projected vertices for irregular/rotated
objects. Measure against the visible finish plane, not an arbitrary wall
centerline.

Targets:

| Contact                                  |                 Target gap |
| ---------------------------------------- | -------------------------: |
| Wall-backed, no world outline            |                     0–2 mm |
| Wall-backed, outline expands toward wall |                     2–5 mm |
| Visible overlay/panel separation         |                     1–3 mm |
| Hidden seam or rounding compensation     | no more than 1 mm negative |

Never accept visible wall penetration. A negative hidden seam is not a license
to bury handles, screens, frames, or outlines.

## Object-to-object contact

Use full transformed bounds for both objects. Define deliberate adjacency by
the appropriate support faces, then preserve a small visible separation when
two unrelated outlines would z-fight.

Check:

- tabletops against bases and objects placed on top;
- cabinet doors/drawers against cases;
- sofas/chairs against nearby walls without swallowing outlines;
- art, switches, and devices against wall finish layers;
- curtains/blinds against window frames and animation envelopes; and
- appliances against neighboring cabinetry and service clearance.

## Clearance and collision

Contact correctness is not enough. Verify the swept or reserved space for:

- door swings and animated openings;
- walk paths and room entry;
- interactive panels and device click targets;
- chairs or doors represented in an open state; and
- the user's eye-level view in walk mode.

Furnishings do not change wall or opening collision. If the accepted shell
cannot support the requested placement, return to the layout workflow.

## Visual confirmation

Inspect every changed contact from:

1. the main photo-matching or room-focus angle;
2. a grazing angle parallel to the support surface;
3. walk-mode eye level; and
4. wall-fade and day/night states when relevant.

If clipping appears, recalculate the full transformed bound and fix the source
placement. Do not apply a camera-specific nudge.
