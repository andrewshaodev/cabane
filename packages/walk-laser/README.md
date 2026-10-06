# Optional walk laser

Install `laserWalkTool` from `@cabane/walk-laser` in the host's `walkTools` list and
pass the same list to the shortcut editor. Cabane's engine never imports this package.
Remove the entry in `apps/web/src/walk-tools.ts` to disable the experiment.

The public module exports one definition. Its lazy scene owns the toy, HUD, raycast,
input listeners, recoil, beam, and shot gate. `activateTarget` is dependency injection:
the host resolves modeled targets and returns feedback, without exposing HA clients
or entity IDs. The gun uses a small separate scene rendered after Cabane's scene
pass, preserving its own depth and preventing walls from clipping the view model.
All visible geometry is procedural and uses the engine's public toon material.

Add Laser through Customize action bar, Save, then equip in Walk. Click or F fires
with mouse capture; touch uses Fire. The host restricts activation to valid lights.
No state is persisted except the shortcut's tool ID. Unequipping unmounts the scene,
removes input listeners, cancels visual timers, and suppresses late result updates.

G equips or stows Laser while walking when its shortcut is on the bar, including
while the mouse is captured. The key does nothing in a text field or overlay.

The current blaster is split into receiver, barrel, grip, and muzzle-flash models
under `src/laser-gun/`. Ivory armor, graphite/plum recesses, brass trim, and cyan
reactors match the generated action icon in `src/assets/laser-icon.png`. Its exact
built-in image-generation prompt is preserved in `src/assets/laser-icon.prompt.txt`.
The icon is a UI-only bitmap; no texture is used by any scene model.

Shot visuals travel at 180 m/s with an at-most 0.8 m tapered luminous tail. They
never fill the muzzle-to-hit distance. A 45 ms muzzle flash follows the actual
model emitter; the hit creates an expanding, fading 120 ms spark/ring burst.
No impact is drawn for misses. Reduced motion suppresses all firing effects.

The icon is the silhouette reference for the rounded redesign: sculpted, beveled
side profiles replace stacked rectangular panels. A lathed open gold muzzle,
domed reactors, three slanted vents, swept grip, curved guard, and soft ivory
heel preserve its distinctive shapes. These models remain procedural and toon-shaded.

The blaster includes a matching padded glove. Idle breathing and speed-driven walk/sprint sway move the hand and weapon together; reduced motion disables these offsets. A text-free four-tick crosshair becomes cyan corner brackets only over an eligible light, using the same host-owned authorization guards as firing.

Shots now include a 300 ms flickering blue electrical arc with short branches, a slower bright traveling pulse, and a 550 ms blue impact burst. Surface-normal-aligned scorch patches cool from blue fissures to dark char and fade over 3.2 seconds. Up to twelve recent shots can coexist; these cosmetic marks never modify home geometry or device state.
