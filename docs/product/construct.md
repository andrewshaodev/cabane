# Construct

Construct is an implemented 2D plan editor. Two-finger trackpad scrolling pans
the plan without clicking or changing tools, including during construction.
Pinch (or Ctrl/Command-scroll) zooms around the cursor. Its tool set is Select, Wall, Door,
Window, Passage, Floor, Pool, Hedge, Measure, and Pan. Users can edit wall endpoints and
positions, choose wall finishes and thicknesses, identify rooms, place and resize
openings, and change supported opening models/orientations. The floor inspector
also controls default wall/ceiling settings. Select a door, window, or passage and
open its on-canvas Details action to edit width and height. Passage Details also
controls rectangular/arched shape and arch rise. Valid width and height edits update
the scene immediately. Sizes that do not fit report an error; leaving the field
restores the accepted value. These edits use the ordinary
preview, undo/redo, autosave, and Apply flow.

The “Have a floor plan?” sidebar block is temporarily disabled by
`PLAN_IMPORT_ENABLED` in `EditorWorkspace.tsx`. Its implementation is retained for
reintroduction; the following describes that currently hidden workflow.

Generate from a plan opens copyable instructions for the user's preferred external
AI tool. The instructions include a complete JSON Schema for the single-floor,
unfurnished subset of HomeProject V2, scale calibration, geometry rules, and
assumption reporting. Only the current workspace ID is included; Cabane does not
upload images, call an AI service, or collect an API key. The dialog explains that
the chosen AI provider processes the plan. Users attach the plan in that tool and
save the resulting project JSON.

The adjacent Import JSON action accepts a file or pasted JSON through the same
validated draft-import path as Connect's import. It replaces the entire current
draft, rather than merging a floor; the UI recommends a blank home and explains
the replacement before import. Failed imports retain the existing draft and show
an error the user can send back to their AI tool. Successful imports are undoable
and still require review in Construct/Explore and ordinary Apply. Editor keyboard
shortcuts do not operate behind an open dialog.

The Roof disclosure controls the building-wide gable ridge direction (left–right
or front–back in plan), roof color, and trim color. Gable and slab infill inherit
the adjoining exterior wall finishes; trim color applies only to the thin roof
edge and underside. It uses the normal workspace
history, autosave, export/import, and Apply flow. After Apply, Home's Show roof
action displays the result. Pitch, thickness, and flush overhang are automatic;
per-section controls and roof drawing are not exposed.

Wall drawing snaps to the grid, endpoints, wall segments, and angle references;
Alt bypasses snapping. Alignment guides match unfinished opposite sides, including
rotated rectangles. Editing a corner uses fixed neighboring edges for the same
45°/90° assistance, considering both incident edges without snapping to the moving
geometry. Attaching a segment to another wall retains the assisted angle by
intersecting that direction with the destination wall; when no assisted direction
is reachable, a nearby perpendicular attachment is offered. Endpoint magnets,
finite wall bounds, and Alt bypass still apply. Walls, hedges, pools, and custom
floor outlines share this assistance.
The first click establishes the starting anchor without adding a segment; a drag
past the activation threshold or a subsequent click places the wall. Closing a
loop ends the drawing chain. Topology derives
rooms, interior/exterior wall runs, junctions, footprint regions, and ceilings
from the editable wall graph while retaining room identities where possible.
Incomplete shells and ambiguous room merges produce actionable diagnostics.

Selection includes individual targets and Shift-drag marquee selection. Drag
activation distinguishes a click from an actual move. Opening placement avoids
occupied spans and enforces wall support. Copy/paste duplicates openings within
the current mode. Delete and history shortcuts ignore text inputs and unsettled
gestures. Selected rooms also expose an on-canvas Delete action. Room deletion
removes exclusive boundary spans and their openings, preserves walls shared with
unselected rooms, and splits source walls where only part is removable. Shared
boundaries incidentally touched by a room marquee remain; wall-only deletion
still removes a directly selected wall. A room enclosed entirely by shared walls
explains that its walls must be edited. Removing the final room clears its floor
preview instead of keeping the last closed shape. Deletion is one undoable edit.
Tool shortcuts include V/W/D/N/A/F/P/M; Escape cancels the active drawing
or selection state. Measure displays lengths and supports copying a result.

Floor painting supports a whole room, a custom room zone, and outdoor ground
zones. Repainting a room with existing zones asks whether to keep or replace
those zones. Polygon drawing has local undo/redo and cancel behavior. Pools are
outdoor polygon basins with validation, collision, and rendered cutouts.

Diagnostics are contextual to the current tool and can focus the offending
object in the scene. Apply uses the full issue set, including project,
topology, dependent placement, and walk-navigation errors, regardless of which
issues are currently displayed. Explore opens an eye-level draft preview with
non-operative HA controls. Editor changes remain browser-local until exported;
Apply changes the browser's Home view.

Hedge (H) draws connected segments with the shared drag and snapping controller.
Choose Clipped box, Rounded, Bushy, Tall mixed hedge (oleander and evergreen
laurel), or Ivy-covered wall from a thumbnail grid using Arrange’s shared preview
renderer and cache. New styles use suitable default dimensions; restyling an
existing hedge retains its height and width. Both dimensions remain editable. Select a
hedge to move it or drag either endpoint; deletion, undo/redo, project export,
and Apply preserve hedges. Procedural toon hedges participate in walk collision.

Wall, hedge, pool, and custom floor outlines share segment drawing gestures, snapping,
angle references, and edge measurements. Pool and floor outline editing shares
a dedicated drag controller and outline measurement presentation.

Implementation: [construction controller](../../apps/web/src/editor-preview/construct/useConstructEditor.ts),
[pointer interaction](../../apps/web/src/editor-preview/construct/ConstructionEditLayer.tsx),
[inspector](../../apps/web/src/editor-preview/construct/ConstructionInspector.tsx),
[topology](../../packages/engine/src/home-editor/construct/topology.ts),
[floor drawing](../../apps/web/src/editor-preview/construct/useFloorZoneDrawing.ts),
[contextual validation](../../apps/web/src/editor-preview/construct/contextual-validation.ts).

[Back to product overview](../../PRODUCT_SPEC.md).

The shared floor picker supports Construct, Arrange, Connect, Walk, and Orbit.
Construct and 2D Arrange show the selected floor. Construct can show a faint guide
from below. 3D Arrange and Orbit show floors through the selected level; Orbit
also offers Show roof for an exterior view of the complete building. Connect retains bindings for every floor.

Construct supports adding above, renaming, changing floor height, and removing
only the top floor with confirmation and undo. Ground cannot be removed.
Reordering, duplication, and basements remain excluded.

A compact row above the Construct sidebar introduction keeps the current floor
visible independently of the active tool. Its styled menu lists floors from top to
bottom, marks the current floor, and ends with “Add floor above”, which creates and selects an empty top
floor. The adjacent Floor settings icon opens the existing name and floor-height
dialog. The row shares navigation, edit locks, and undo history with the retained
corner floor picker; adding or switching does not copy rooms or furnishings.
The menu supports arrow keys, Home/End, Escape, and outside-click dismissal.
Settings use labeled editor fields and neutral Cancel / primary Save actions.
Settings also expose Delete floor, which opens the existing removal confirmation
and remains undoable. The action is disabled with an explanation for the ground
floor and any floor with another floor above it.

Separator walls may end freely, inside or outside a room, without a closure error or blocking Apply. A floor still needs at least one closed room; individual walls do not. Separator walls retain their geometry, openings, and collision behavior across save and reload.


Straight stairs share Construct’s initial-click anchor, drag threshold, and subsequent-click
segment completion with walls and hedges. Drawing and endpoint editing use grid,
wall, angle, and alignment snapping from both connected floors; Alt bypasses snapping.
Completion selects the staircase. On either connected floor, drag its body to move,
either endpoint to change length/direction, or either side handle to resize width
symmetrically. Measurements update throughout the gesture. Escape and interrupted
gestures cancel; each completed gesture is one undoable edit.

Stairs also support L-shaped and spiral connections between adjacent floors. Choose
Straight, L-shaped, or Spiral before drawing or in the selected stair's properties.
Changing shape retains its ID, connected floors, and lower entrance position.
Existing stairs without an explicit shape remain straight.

L-shaped stairs use two perpendicular flights and a square level landing. Click the
bottom, landing center, and upper endpoint; the final point chooses the left/right
turn. Width, lower and upper flight lengths, and turn are editable. Endpoint,
landing, and width handles adjust the shape; dragging the body moves it.

Spiral stairs use a center point and an outer-edge point for placement. Diameter,
rotation, clockwise/counterclockwise direction, and total turn (greater than zero,
at most 360 degrees) are editable. Diameter handles resize around the fixed center;
the orientation handle rotates the entrance. A fixed 0.1 m radius central support
sets the inner edge of the usable width. New spirals default to 2 m diameter and a
360-degree clockwise turn. New L-shaped stairs default to 1 m width, equal flight
runs of 0.75 times the floor height, and a right turn.

During stair drawing, movement, and resizing, a labeled, noninteractive guide shows the
other connected floor’s footprint, walls, openings, and pools. The active floor and saved
Show floor below preference remain unchanged. Diagnostics update during gestures at most
every 100 ms, with immediate validation of the release point. Invalid but nondegenerate
stairs remain editable in the autosaved draft and block Apply. Numeric edits follow the
same policy. The maximum slope is 50 degrees and minimum width is 0.6 metres.

Resizing a wall deletes doors and windows whose full width or height no longer
fits the wall. Undo restores the wall and its removed openings together.

The side panel can set, move, or reset one home-wide walk starting point. Click
inside the active floor to place its Construct-only pointer; Escape cancels. The
point follows workspace history, autosave, export/import, and Apply. Walk entry
uses its floor and position, with the default facing direction. Without a point,
existing automatic spawn behavior remains. A blocked point reports an error
until moved or cleared; deleting its floor resets it.

New blank homes open with Wall selected. Construct displays a noninteractive,
world-aligned grid with 1 m divisions and 0.1 m subdivisions matching snapping;
fine lines fade at lower zoom. The initial blank floor shows drawing guidance
instead of the expected empty-floor/walls-required diagnostics. Only presentation
is deferred: Apply continues to reject an empty layout and retains the complete
validation list.

Room names are editable directly on the plan, including an explicit “Name room”
control for unnamed rooms. Enter or blur commits a nonempty trimmed name; Escape
cancels. Naming uses ordinary undo/redo and autosave and is disabled during active
gestures. Unnamed rooms are valid saved drafts; they still require names to Apply.

The Spawn area disclosure in the Construct sidebar groups the Explore starting-point controls. The sidebar sections appear in this order: Reference plan, Roof, Spawn area, Scale & heights, and Tutorial. Each has an outline icon and a short description visible while collapsed. Scale & heights contains the former Floor settings controls. The Advanced structure-data section is no longer shown.

Door offers six catalog presets: Panel wood, Panel white, French, Full glass,
Sliding wood, and Garage door. Its sidebar follows the Floor palette hierarchy,
with cached procedural 3D thumbnails shared with Arrange and Connect. Presets
set motion, style, finish, applicable leaves, and metre-based dimensions; manual
edits remain available and unmatched configurations read Custom. Only attributes
are saved, never a preset identifier. The session retains the next placement
configuration, and placement returns to Select. Selected-door properties use the
same picker; replacements preserve identity and offset, reject sizes that do not
fit, and commit through ordinary undo/redo. Roll-up doors have an installation
side but no hinge, slide direction, or leaf count.

## Reference plans

Construct offers a persistent Reference plan disclosure below the Edit the plan
introduction or active tool/selection properties and contextual diagnostics.
Its expanded contents include a Show reference plan checkbox and opacity slider. Roof, Spawn area, Scale & heights, and Tutorial remain below those properties. The
active tutorial retains its floating desktop placement. New or restarted
tutorials begin with an optional Add a reference plan step; Skip proceeds to
walls, which remains step 1 of 6. Accepting a reference, or beginning wall
construction, advances this optional introduction. Existing tutorials do not
rewind to it.

One PNG, JPEG, WebP, or SVG reference can be selected or dropped onto each floor.
Files are limited to 20 MB and 32 megapixels. SVGs are decoded as images, with
scripts, external resources, and unsupported embedded content rejected. Importing
an image does not generate architecture or activate the separate AI/JSON import.

The reference starts centered at 80% of the current viewport with 50% opacity.
Adjust offers canvas drag movement, proportional corner resizing, and rotation. Set scale uses two image
points and a known positive distance in metres, holding the first point fixed.
Done locks the reference and restores drawing interaction; Cancel restores the
previous reference. Escape cancels a gesture before exiting adjustment. Switching
floor or editor mode cancels unfinished adjustments. Pan and zoom remain usable.

The browser image sits between a camera-synchronized grid/floor background and
the architecture foreground; it remains readable after rooms close. It never
becomes a home texture or appears in Arrange, Explore, or Home. Visibility and
opacity are independent of the floor-below guide. Reference adjustments use the
same session Undo/Redo timeline as architecture, without changing published home
data. Storage errors appear in the section with Retry.
