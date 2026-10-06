# Procedural Modeling Patterns

Use these patterns to make photo-derived furnishings recognizable while
preserving the product's code-native cel-shaded language.

## Priorities

Model in this order:

1. footprint, overall height, and placement;
2. primary silhouette and large color blocks;
3. landmark features that identify the object;
4. functional features relevant to interaction or device state; and
5. limited secondary detail visible from ordinary room and walk views.

Do not spend complexity on hidden or sub-pixel detail while proportions,
contacts, or room composition remain wrong.

## Primitive vocabulary

Prefer stable public helpers around:

- boxes for cabinets, seating masses, shelves, tables, and appliances;
- cylinders for legs, knobs, speakers, lamps, vessels, and sensors;
- planes or thin boxes for screens, labels, doors, art, and panels;
- extruded simple shapes for recognizable profiles; and
- small custom buffer geometry only when primitives cannot produce the
  important silhouette.

Group related primitives into a semantic component with an intentional local
origin, normally the floor-contact center for freestanding objects or the
mounting-plane center for wall objects.

## Reuse boundary

- Stable catalog: common supported smart-device form with a stable domain and
  dashboard behavior.
- `home/extensions/`: bespoke or household-specific object that is reused,
  visually important, or needs its own device adapter.
- `home/rooms/`: one-off room composition and tiny local details.

Do not duplicate a shared component to make a placement correction. Fix its
props or transform.

## Cel-shaded materials

Use the engine's documented toon material and outline exports. Keep a
restrained base palette with room accents. Favor flat color families and clear
value separation over photoreal surface variation.

Import `ToonMaterial` and `Outlines` from `@cabane/engine`. Never create
a local `DataTexture` or gradient map, use Drei's outline wrapper directly,
add scene lights, or modify renderer/shadow settings in `home/`.

Visible materials must not use realistic standard/physical/Phong/Lambert
surfaces, image textures, environment-mapped realism, or downloaded files. A
small procedurally generated toon gradient owned by the stable engine is the
only permitted texture-like input.

Use outlines selectively to clarify silhouette and interactive parts. Avoid
heavy internal edge noise, doubled outlines at coplanar contacts, and outlines
whose expanded bounds penetrate walls.

## Smart-device state

A device model may expose restrained code-native state cues such as:

- emissive-looking flat color or a small indicator for power/status;
- a simple vane, cover, or switch transform;
- text rendered by the product's built-in UI rather than a texture; and
- a discrete alert accent for a leak, contact, or motion state.

State visuals never alter the physical anchor or obscure an unavailable/error
state in the dashboard. Keep control behavior in stable engine adapters; home
extensions define visuals and typed slots, not exact HA IDs or raw service
logic.

## Photo matching

For each important photo, identify:

- visible walls and likely camera direction;
- object order along those walls;
- floor and wall contact points;
- occlusion relationships;
- repeated objects; and
- one or two dimensions that can anchor relative scale.

Validate from the photo-like angle and from a neutral room-focus view. A model
that works only from the source camera is not complete.
