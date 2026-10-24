# Casa Solstice

A standalone Mediterranean showcase, authored directly as HomeProject V2 JSON.
It does not replace the bundled demo or another workspace.

## Importable design

`furnished.project.json` is the single portable seed, including both floors,
architecture, furnishings and device slots, without HA identifiers or mappings.

Import the furnished project from **Workspaces → Import workspace → From file**,
then review and Save. The project uses only registered public catalog models.
It needs no custom GLB assets or home-local React extensions.

The villa has two 18 × 14 m levels, four bedrooms, two bathrooms, a dressing room,
a studio, laundry/pantry, garage/workshop, kitchen/dining room, lounge and circulation.
A 1.25 m wide straight stair rises 3.2 m over a 4.8 m run. South-facing glass
sliders open onto travertine terraces, a pergola and a 9 × 4.5 m pool. An upper
balcony connects the south bedrooms and gallery. The garden includes mature
olive trees, shrubs, perimeter mixed hedges, a fire-pit seating area, swing,
vegetable bed, outdoor dining, barbecue and four loungers.

Bedrooms use wall-aligned beds and round jute rugs. All six picture frames use
wall-relative placement with 2 mm clearance and stay clear of openings. The
frames mix the four French coastal/village illustrations only.
The pool terrace includes a woven-rug lounge with matching seating and plants.

There are 239 scene items: 59 modeled devices and 180 furnishings/decorations.
The 59 devices declare 61 entity slots; the motorized garage opening adds one
cover slot. All 62 slots have mappings in the separate private local-HA backup.
The car exposes battery, estimated range and charging power as simulated sensors.
Its telemetry is illustrative, not a real vehicle integration.

## Synthetic HA fixture

`dev/home-assistant/showcase/solstice/` is a local-only fixture for the pinned HA 2026.10 test image.
It reuses HA's official demo implementations for lights, media players, cameras
and locks, and adds deterministic sensor/appliance entities. It never connects
to physical hardware. Its `devices.json` inventories 52 extra light/sensor/
switch entities, with five registered media/camera/lock entities created by their
platform modules. Ambient temperature sensors prevent appliance temperatures
from being mistaken for room temperatures.

From the repository root, with the existing local test container running:

```sh
node dev/home-assistant/showcase/install.mjs
```

The installer checks the named container's loopback-only port binding, copies
this fixture into its persistent config volume, adds `solstice:` to its existing
mounted test YAML if needed, checks HA configuration, and restarts that same
container. It preserves the account, volume and workspaces. It does not rebuild
or replace the native Cabane panel. This fixture uses legacy platform setup;
review compatibility before upgrading beyond the pinned HA image.

The optional private `test-results/showcase/runtime-plan.json` supplies mappings
from discovered entity IDs to generated rooms, preferred ambient sensors, and
vacuum cleaning segments. Without that private file the fixture creates its
synthetic entities but does not assign areas. Exact registry IDs and mappings
are deliberately excluded from Git. The setup exports a restricted discovery
report in `/config/solstice-discovery.json`; it excludes camera/media tokens.

## Verification

```sh
node dev/home-assistant/showcase/validate.mjs home/showcase/furnished.project.json
```

The furnished project passed the public project validator, including its floors,
without errors or warnings. The final private record passed `parseHomeProjectRecord`,
and all 62 mappings passed `validateRuntimeBindingProfile` with the observed HA
registry, area and state data. Absolute indoor item footprints were checked
against their owning room polygons; a shower placement and bedside-lamp contact
heights were corrected before the final Save.

Native-panel checks covered both floors, daytime/nighttime rendering, a walk-mode
view facing the stair, vehicle telemetry, light toggling, garage-door operation, television playback,
ceiling-fan control and targeted room cleaning. The tested controls reflected
the requested HA state changes.
The final published design and all 62 mappings were read back from the HA saved
workspace, including the last placement corrections. `My home` was preserved.

The browser automation could enter Walk but could not obtain pointer lock, so
interactive stair ascent and exhaustive collision traversal remain manual checks.
Camera IDs/state are validated; demo camera media availability is not proof of a
real camera stream. Not every service of every device was exercised. No product
code, public deployment or real household HA was changed.

Local evidence and the private synced backup are under ignored
`test-results/showcase/`. They are not part of this portable design.

## Cozy furnishing revision

The portable furnished project now includes a poolside teak lounge with two
chairs, a jute rug, coffee table, candles and leafy planters. Bedrooms have
layered bedding, botanical pictures and round jute rugs; the junior bedroom
uses a rose single bed. The upper gallery has a 1.3 × 11 m Sage woven runner,
clear of the staircase. Architecture, device slots and private mappings are
preserved. The unfurnished layout checkpoint is unchanged.
