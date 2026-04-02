# Slow-Motion Aim — Design Spec
**Date:** 2026-04-02
**Prompt:** Prompt 6 of `Prompts.md`

---

## Overview

Holding right-click activates slow-motion aim mode. Time slows to 0.35× normal speed, a subtle desaturate effect focuses the player's eye on the crosshair cursor, and a single shuriken can be fired with precision. Releasing right-click exits slow-mo and resets everything. To fire a second shot, the player must release and re-enter slow-mo — creating a deliberate "one careful shot" rhythm.

---

## Behaviour

| Condition | Result |
|---|---|
| Right-click pressed | Slow-mo enters: time scale → 0.35×, desaturate overlay on, crosshair visible, OS cursor hidden |
| Right-click held | Slow-mo active. Left-click fires shuriken (if ammo > 0). Crosshair dims after shot fired. |
| Left-click while active | Fires one shuriken, locks further shots this entry (`hasShot = true`) |
| Right-click released | Slow-mo exits: time scale → 1.0, overlay off, crosshair hidden, OS cursor restored |
| Re-pressing right-click | `hasShot` resets to `false` — player can fire again |
| Normal (no right-click) | Left-click fires shuriken as before — slow-mo system returns `canFire() = true` when inactive |

---

## New File: `src/game/systems/SlowMoSystem.ts`

Owns all slow-mo state. Called each frame by `Level01Scene`.

### Public API

```ts
constructor(scene: Phaser.Scene)
update(pointer: Phaser.Input.Pointer): void  // call each frame
isActive(): boolean
canFire(): boolean   // true when active AND hasShot === false, OR when inactive
onFired(): void      // call after firing; sets hasShot = true
destroy(): void      // removes overlay graphics
```

### Internal State

- `active: boolean` — whether slow-mo is currently on
- `hasShot: boolean` — whether a shot has been fired this slow-mo entry
- `overlay: Phaser.GameObjects.Rectangle` — full-screen semi-transparent rect for desaturate effect

### Time Scaling

On enter:
```ts
scene.physics.world.timeScale = BALANCE.SLOWMO_TIMESCALE;  // 0.35
scene.time.timeScale           = BALANCE.SLOWMO_TIMESCALE;
scene.anims.globalTimeScale    = BALANCE.SLOWMO_TIMESCALE;
```

On exit — reset all three to `1.0`.

### Desaturate Overlay

A full-screen `Phaser.GameObjects.Rectangle` filled `0x1a1a35` at alpha `0.25`, added to the scene at depth above the world but below UI. Toggled visible/invisible on enter/exit. No WebGL shader required for graybox.

### Events Emitted (via `scene.game.events`)

| Event | When |
|---|---|
| `'slowmo-enter'` | On right-click pressed (first frame active) |
| `'slowmo-exit'` | On right-click released |

Firing emits `'slowmo-shot'` from `Level01Scene` (not `SlowMoSystem`) to keep firing logic centralised.

---

## UIScene Changes

### Crosshair

- A `Phaser.GameObjects.Graphics` object drawn at `pointer.x, pointer.y` each `update()`.
- Shape: circle (radius 8px) + two crossing lines (16px each), colour `#ff4444`.
- Visible only when slow-mo is active.
- After `'slowmo-shot'` event: alpha drops to `0.4` (signals "shot used").
- After `'slowmo-exit'` event: hidden, alpha resets to `1.0`, OS cursor restored.

### OS Cursor

- Hidden via `this.input.setDefaultCursor('none')` on `'slowmo-enter'`.
- Restored via `this.input.setDefaultCursor('default')` on `'slowmo-exit'`.

---

## Level01Scene Changes

### `update()` — fire block

```ts
const isDown = pointer.leftButtonDown();

if (isDown && !this.prevMouseDown && this.player.consumeAmmo() && this.slowMo.canFire()) {
  this.combatSystem.fireShuriken(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
  this.slowMo.onFired();
  this.game.events.emit('slowmo-shot');
  this.game.events.emit('ammo-changed', this.player.getAmmo());
}

this.prevMouseDown = isDown;
this.slowMo.update(pointer);
```

`canFire()` returns `true` when slow-mo is inactive, preserving existing normal-fire behaviour.

---

## `balanceConfig.ts` Addition

```ts
SLOWMO_TIMESCALE: 0.35,   // time scale while right-click held
```

---

## Files Changed

| File | Change |
|---|---|
| `src/game/systems/SlowMoSystem.ts` | **New** — all slow-mo state and time scaling |
| `src/game/scenes/UIScene.ts` | Add crosshair Graphics, event listeners |
| `src/game/scenes/Level01Scene.ts` | Wire SlowMoSystem, update fire block |
| `src/game/config/balanceConfig.ts` | Add `SLOWMO_TIMESCALE` |

**No changes to:** `Player.ts`, `CombatSystem.ts`, `Shuriken.ts`, `PreloadScene.ts`.

---

## What to Test

1. Right-click slows time visibly (enemies, shuriken arcs, player animations).
2. Crosshair appears at mouse position; OS cursor is hidden.
3. Screen desaturates subtly; crosshair stays vivid red.
4. Left-click fires one shuriken in slow-mo; crosshair dims.
5. Second left-click in same slow-mo entry does not fire.
6. Releasing right-click restores full speed and cursor.
7. Re-entering slow-mo after releasing resets the shot lock.
8. Normal left-click fire (no right-click) works unchanged.
