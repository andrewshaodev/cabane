# Home dashboard, controls, and cameras

Home presents an orbital overview, room details, and walk mode. Opening or closing room
details (including Escape and Back) preserves the current camera position, angle, and zoom.
Clicking a room floor or an inward-facing wall surface opens that room in orbit mode;
dragging to orbit does not select a room. Shared walls select the room on the clicked side. Room floors, interior wall faces,
and status overlays share a pointer cursor, floor highlight, and overlay hover effect. Room selection,
status overlays, device interaction targets, and application-owned controls
connect the scene to room/device control sheets. Scene session preferences retain
mode, selected room, and wall fading. The per-home action bar starts with Build, Walk, Night, and View,
in that order. Owners can remove, reorder, or replace every item and add direct links to current rooms
and modeled devices that have a room sheet, or the All lights off action. Room and device
icons share the built-in slot dimensions; rooms use Home Assistant photos or initials, and
devices use cached procedural model previews. Build groups Construct, Arrange, and Connect; View
groups wall fading and roof visibility. Room and device links select the correct floor and open the
room view or device sheet, including when leaving Walk. The bar shows the items that fit at usable
size and puts the rest under More actions. An intentionally empty layout hides the bar; Customize
action bar remains in Home's More options menu.
Desktop hover opens trays above the dock; touch toggles them with a tap. Keyboard
users can open Build with B and View with V, use Arrow Up to enter a tray, and
dismiss with Escape. R toggles the roof; C, A, Shift+C, W, N, S, and L retain
the direct editor, walk, lighting, walls, and all-lights actions.
Saved legacy shortcut arrays are retained for file compatibility but never configure
the bar. An absent action-bar configuration gets the four starting items without a
storage reset; an explicit empty list stays empty. The existing direct keyboard
shortcuts remain available after an item is removed from the bar. Keyboard shortcuts also work in room view; walking keeps
its movement keys. Draft walkthroughs retain their dedicated exit controls and use the same dashboard
and walking controller as Home. Explore starts with the editor’s selected floor
(or the configured walk starting point) in an isolated floor-navigation scope;
crossing floors does not switch the hidden editor’s floor or rebuild its draft.

The floor picker uses directly selectable diamond layers at the bottom right in
Orbit, Construct, and Arrange. Hover or keyboard focus spreads the stack upward
and fades in floor names; the bottom layer stays anchored. On touch, the first
tap expands the stack and the next selects a floor. Expanded labels are also
click targets. Escape and outside taps dismiss the stack. Existing floor shortcuts
and unavailable walking-entry guards still apply. Show roof / Hide roof is available
in the action bar’s View group (R), and is disabled while walking. Roof view shows all floors, keeps walls solid,
hides room status overlays, and preserves the current camera position, angle, target, and zoom.
Changing floors also preserves the camera in Orbit, Construct, and Arrange. Selecting a floor restores the
cutaway; entering Walk exits roof view, while retaining roofs and ceilings in the walking scene. Stair traversal preserves the physical camera
elevation while the active floor selection updates, including frames before that update commits. Construct exposes its existing floor actions
through Manage floors. Mobile placement clears the editor inspector, and reduced
motion disables the expansion and fade transitions.

In Home overview and room focus, a compact cream toolbar beside the floor picker
provides zoom out, zoom in, and a 90° camera turn around the current orbit target.
Zoom respects the existing camera limits. Buttons have 44px touch targets and
keyboard labels; walk mode keeps its existing movement controls.

Room and device sheet module titles use the bound Home Assistant device’s custom
name, then its default name, then the primary entity’s name when available.
The modeled label remains the fallback when HA names are unavailable.
Room names use the mapped HA area name, falling back to the local modeled name when
the area is unmapped or unavailable. Those rooms show a broken-chain Connect icon
in overview labels and the room/walk heading, and a “Not connected” status pill
alongside temperature and humidity in room heroes.
Room controls derive from resolved typed slots. Implemented domains include
lights, switches/input booleans, climate (including Versatile Thermostat
presentation), covers, fans, media players, humidifiers, water heaters, vacuums,
locks, alarms, valves, sirens, selects, numbers, buttons, cameras, and sensors.
Domain controls inspect supported features and state attributes; not every HA
entity supports every possible action. Sensor-only content is read-only.
Optimistic commands reconcile with confirmed state and expose pending/error
feedback. Invalid or stale bindings limit mutation.
Versatile Thermostat modules place a circular power button between the temperature
step controls when the entity supports the off HVAC mode. It toggles off/on;
turning on selects cool above the target temperature and heat otherwise, falling
back to a supported active mode. It shares optimistic state, command guards, and
feedback with the mode picker.

In the desktop climate card's two-column layout, selector menus expand below
their controls inside the card, keeping all choices reachable in the scrollable
panel. Compact layouts retain their upward-opening menus.

Presence and room-status summaries derive from runtime entities. Device-specific
sheets, room sheets, and camera viewing share the normal dashboard surface.
Visible scene lights respond to compatible light slots. Bound opening states
control their visual state; unbound walkable doors can open automatically near
the player. Missing HA data keeps the architectural scene usable.

Televisions accept either a primary media-player binding for controls or a camera
binding for scene video and the camera viewer. Only camera entity bindings request
streams; existing media-player bindings remain valid. Camera-capable models select
a primary camera slot. Requirements are deduplicated
by entity. The stream coordinator manages sessions, document visibility, posters,
first-frame readiness, failure state, and cleanup. WebRTC is attempted where
supported, with HLS handling in a separate transport implementation. Camera
screens and the dedicated viewer consume the resulting media. Actual playback
depends on the HA camera integration, browser capabilities, and network access;
fixture coverage is not a claim that all household cameras have been accepted.

Implementation: [dashboard](../../packages/engine/src/CabaneDashboard.tsx),
[room controls](../../packages/engine/src/home-assistant-dashboard/RoomModule.tsx),
[control primitives](../../packages/engine/src/home-assistant-dashboard/control-primitives.tsx),
[room status](../../packages/engine/src/room-status/model.ts),
[stream coordinator](../../packages/engine/src/CameraStreamCoordinator.tsx),
[camera viewer](../../packages/engine/src/CameraViewer.tsx).

[Back to product overview](../../PRODUCT_SPEC.md).

Desktop Walk requires pointer lock. Explore requests it directly from the entry
click; if the browser refuses it, the editor shows a permission error. Mouse
motion turns the view and keyboard input moves only while the pointer is locked.
Space triggers a short hop on desktop while pointer lock is active and device
controls are closed. Walking and sprinting continue during a hop; holding Space
or pressing it while airborne does not trigger another hop. The hop follows floor
and stair elevation and preserves existing horizontal obstacle collisions; it does
not enable jumping onto furniture. Mobile controls remain unchanged.
Escape or Back to editor exits the draft walkthrough.

Room selection updates the floor highlight independently of procedural architecture
and furnishing models. Opening or closing room details does not change lighting or
shadows; room and device point lights retain the overview shadow behavior. Scene callbacks, per-floor
manifests, and derived open-opening sets retain identity when their inputs are
unchanged. The development benchmark is
`node scripts/measure-room-opening-performance.mjs http://127.0.0.1:4173`.
It measures both the panel and the deferred React Three Fiber commit using an
isolated Chrome profile. On the bundled home at 1440×960, Chrome 152, five warm
samples reduced median scene React work from 82.3 ms to 8.3 ms and the final scene
commit from 117.7 ms to 38.1 ms. These are local development measurements, not a
universal device or end-to-end 10× speed guarantee.

Closing device controls while walking keeps the current walk camera and pose.
Browser pointer-lock loss or refusal pauses mouse input without changing views;
clicking the scene resumes mouse control. Explicit walk-mode exit remains available.

The More options menu uses aligned action rows for Switch workspace, Send feedback,
and contextual connection actions. Disconnect identifies Home Assistant in secondary
text. Browser-data export remains in Connect. The trigger and actions use pointer
cursors, visible keyboard focus, and 44px minimum action targets.

In the Shortcuts editor, clicking or tapping a shortcut selects it for editing.
The selected shortcut keeps its outlined style and edit controls when the pointer
moves away or over another shortcut; hover and focus alone do not change selection.
Native keyboard activation also selects a shortcut.
