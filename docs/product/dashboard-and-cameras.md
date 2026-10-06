# Home dashboard, controls, and cameras

Home presents an orbital overview, room details, and walk mode. In Orbit, selecting
a room smoothly centers its projected floor and wall bounds in the visible space
beside the controls, with fitted zoom and the same three-quarter angle for every
room. A critically damped transition retains velocity when another room is chosen
mid-flight. Dragging, pinching, scrolling or using camera buttons interrupts it;
selecting the same room again refocuses it. Reduced motion applies the destination
immediately. Returning to Overview, including Escape or Back, smoothly restores
the default floor framing at the current viewport size. It never uses an arbitrary
saved zoom; pressing the floor summary also resets a manually moved camera.
The top floor pills explicitly frame the selected floor; the existing diamond
floor picker retains its camera-preserving behavior.

The Orbit header combines the floor summary and room navigation in one top row.
The leading button uses the current floor name, connection indicator, session
information and home-presence summary. It replaces the separate heading and the
Overview label, scrolls in the same row as the rooms, and returns to the
default floor view when clicked. It also toggles a second row of floor pills.
Choosing a floor closes that row, clears the room selection, frames the new floor
and updates the room list. Escape, an outside pointer press or selecting a room
closes the floor choices; Escape restores focus to the floor button. Empty floors
remain navigable. Scroll gutters leave room for pill shadows and focus outlines.

Room pills list only the active floor's rooms with their resolved HA names.
Pills, room surfaces, status labels and room shortcuts share selection behavior.
The selected pill is exposed to assistive technology and stays visible after
selection or resize. The strip is absent in Walk, roof view and device overlays,
which retain their contextual heading. Room details stay on the right on desktop;
narrow portrait layouts use a bottom panel. Compact landscape keeps a side panel.
Dedicated device controls retain their existing modal layout.

Interactive Orbit floors and wall faces use gently subdued base colors. Selecting
a room lifts its finishes and softens the others, without altering device lighting,
rebuilding geometry or adding render passes. Wall faces are associated with rooms
on their visible side, so the two sides of a shared wall can differ. Room changes
reset the panel's scroll position while retaining the panel itself.

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
On mobile, device control sheets fill the viewport in portrait and compact landscape,
including when opened from an action-bar shortcut. Desktop device sheets remain centered.
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
The diamond floor picker preserves the camera in Orbit, Construct, and Arrange. Selecting a floor restores the
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
The demo leaves door contacts and door covers unbound so doors, including the
garage door, open on approach and close on departure in Walk. Other supported
device controls and window contacts retain their simulated bindings. Real HA
opening bindings continue to take precedence over proximity.

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

Room selection updates finish emphasis independently of procedural architecture
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
Walk and draft Explore show Preferences in the top-right More options menu. The
Preferences dialog offers Invert Y axis for mouse and touch look controls; the
choice is saved locally in the browser and applies to both walking contexts.
It also offers Always day, Always night, and Auto lighting. Auto uses the available
sun state or local time. The smart bar lighting action remains available and
updates the same local preference.

The More options menu uses aligned action rows for Switch workspace, Send feedback,
and contextual connection actions. Disconnect identifies Home Assistant in secondary
text. Browser-data export remains in Connect. The trigger and actions use pointer
cursors, visible keyboard focus, and 44px minimum action targets.

In the Shortcuts editor, clicking or tapping a shortcut selects it for editing.
The selected shortcut keeps its outlined style and edit controls when the pointer
moves away or over another shortcut; hover and focus alone do not change selection.
Native keyboard activation also selects a shortcut.

The web host offers an optional **Laser** action in Shortcuts → Add action,
alongside Lights off and View. It is absent from the default bar. Save the shortcut,
enter Walk, and select Laser to equip or unequip a procedural cartoon laser gun.
Leaving Walk unequips it. Desktop pointer lock enables center-screen aim and
left-click or F to fire; touch uses the existing sticks and two right-side icon buttons for zap and portal.
The initiating pointer-lock click does not fire. Overlays, hidden documents, and
paused mouse control disable firing. Stowing the tool restores ordinary device-panel interaction.

Shots raycast at trigger time. The first visible surface blocks the shot, including
walls and furniture; gun/effect geometry does not intercept it. Only a single valid,
available, fresh light binding can toggle, through the normal guarded runtime call
and demo adapter. Unsupported, ambiguous, or unmapped controls do not highlight the crosshair or issue commands; failed calls do not open a device panel or retry. Shots have a 300 ms
cooldown and cannot overlap a pending control. Reduced motion retains the targeting crosshair while removing recoil, the traveling pulse, muzzle flash, and impact burst. The experimental package
owns visuals and firing input; the engine owns generic tool installation and light
activation.

G equips or stows Laser while walking when its shortcut is on the bar, including
while the mouse is captured. The key does nothing in a text field or overlay.

Laser visuals use a layered ivory/brass procedural blaster with cyan energy details.
A short tapered pulse travels to the hit instead of leaving a full-length beam
suspended in the room. Its muzzle flash follows the gun and its impact burst
expands and fades at the collision point. The generated toolbar icon matches
the blaster and the existing sculpted action icons; it is never a scene texture.

Each accepted zap or portal shot also pops a short, ink-outlined **PEW!**, **ZAP!**, or **POW!** above
the moving muzzle. Procedural vector lettering, jagged cel-color bursts, and
outward speed marks vary in color, silhouette, tilt, size, and drift between
shots, with no adjacent palette repeat for primary fire. Portal bursts match the
blue or gold portal being fired. The compact effect is 30% smaller than its initial
size. Feedback replaces the previous pop on
rapid fire and never intercepts input. Reduced motion keeps a stationary,
briefly fading PEW without the pop, drift, or speed marks.

The blaster includes a matching padded glove. Idle breathing and speed-driven walk/sprint sway move the hand and weapon together; reduced motion disables these offsets. A text-free four-tick crosshair becomes cyan corner brackets only over an eligible light, using the same host-owned authorization guards as firing.

Shots now include a 300 ms flickering blue electrical arc with short branches, a slower bright traveling pulse, and a 550 ms blue impact burst. Surface-normal-aligned scorch patches cool from blue fissures to dark char and fade over 3.2 seconds. Up to twelve recent shots can coexist; these cosmetic marks never modify home geometry or device state.

With Laser equipped and mouse capture active on desktop, right-click alternates
between a blue and gold portal. A linked pair transports the walker from either
entrance to the other exit, including between floors when both landings are clear.
Portals fit on broad flat interior/exterior walls, indoor floors, outdoor slabs,
and terrain with supported exits; wall portals align to standing height. Terrain
landings reuse the rendered ground and its cutouts, require support across the
player radius, and retain obstacle checks. Upper-floor exits still require slabs. Invalid or overlapping placements leave the pair and next color unchanged.
Once paired, the oval shows a live perspective view through its partner, clipped
at the exit surface so its supporting wall does not obstruct the view. Unpaired
portals retain the energy membrane. The destination rim/ripple is excluded from
its own capture to avoid overlapping fragments during movement. Views are one
level deep, skip back-facing/off-screen openings, and use targets capped at 1024
pixels per side; reduced motion preserves perspective tracking. Arrival protection avoids
immediate return trips, and controls/overlays pause traversal. Stowing Laser or
leaving Walk hides the pair; equipping restores it from the home, including after reload.
Either fire action aimed at an existing entrance removes it and plays a short inward
collapse. Removal immediately disables travel; nearer geometry occludes the shot.
Reduced motion uses a brief still confirmation. Positions and next color autosave,
and failed writes restore the prior pair with a storage error. This first version is grounded travel: no ceiling
portals, retained launch momentum or flinging. Touch supports both actions and portal travel without pointer lock.
Successful portal placement fires the same electrical zap as primary fire, tinted
blue or gold to match its destination. Each portal blooms from zero with a brief
overshoot, settling rim and dissipating energy ripple; replacement replays it.
Reduced motion shows the completed portal immediately without the zap or bloom.
Travel between portals briefly covers the view in energy before the position change,
then eases open in the exit portal's color, with a small bounded lens effect.
Pausing or stowing cancels pending travel and restores the camera. Reduced motion
keeps only a short gentle tint and skips the lens/ring animation.
The desktop gun crosshair includes text-free primary/secondary fire cues: a left
zap glyph and right portal glyph, with matching highlighted mouse buttons. The
portal cue shows the next blue/gold placement color. In landscape touch Walk,
two right-side icon buttons fire zap and portal on contact. The portal button
shows its next color; the central targeting reticle and movement/look sticks remain.

Laser opts into the default shortcuts through installed-tool metadata. All homes
using the default bar receive it, and Shortcuts → Restore defaults includes it.
Explicitly customized bars remain exactly as saved. The engine does not hardcode
a gun ID or import the optional gun package.
