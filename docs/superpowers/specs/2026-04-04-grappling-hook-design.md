---
title: Grappling Hook — Design Spec
date: 2026-04-04
status: approved
---

# Grappling Hook

## Overview

Replace the slow-motion aim mechanic with a right-click grappling hook. The player fires a hook toward the mouse cursor; it attaches to any tile surface or enemy. The player then swings on the rope (pendulum physics) and locks to the surface on contact. Jump or right-click again to release. Enables stealth traversal — grapple around platforms, get behind enemies, deliver claw attacks.

---

## What Is Removed

| Item | Location |
|---|---|
| `SlowMoSystem.ts` | `src/game/systems/` — deleted |
| `slowMo` field + all `slowMo.*` calls | `Level01Scene.ts` |
| `slowmo-enter/exit/shot` events + handlers | `Level01Scene.ts`, `UIScene.ts` |
| Desaturate overlay + slow-mo crosshair | `UIScene.ts` |
| `SLOWMO_TIMESCALE` | `balanceConfig.ts` |
| `slowMo.canFire()` guard on left-click | `Level01Scene.ts` — left-click fires freely again |

---

## New Files

| File | Responsibility |
|---|---|
| `src/game/systems/GrappleSystem.ts` | All grapple state, rope physics, rope rendering |
| `src/game/entities/GrappleHook.ts` | Flying hook projectile entity |

---

## Balance Config Additions (`balanceConfig.ts`)

```ts
GRAPPLE_RANGE: 600,        // px — max hook travel distance
GRAPPLE_HOOK_SPEED: 1200,  // px/s — hook projectile speed
GRAPPLE_PULL_FORCE: 800,   // px/s² — acceleration toward attachment point
GRAPPLE_DAMAGE: 10,        // damage dealt to enemy on hook contact
```

---

## Player States (`PlayerTypes.ts`)

Add to the `PlayerState` enum:
```ts
GRAPPLE_FLYING   = 'GRAPPLE_FLYING',    // hook in flight
GRAPPLE_ATTACHED = 'GRAPPLE_ATTACHED',  // locked to surface, swinging/locked
```

**`Player.update()` behaviour:**
- `GRAPPLE_FLYING`: normal movement allowed (player can still run/jump while hook travels)
- `GRAPPLE_ATTACHED`: all input blocked except jump. Jump is detected and consumed by `GrappleSystem`, not `Player`. Gravity disabled via `body.setAllowGravity(false)`.
- On release from `GRAPPLE_ATTACHED`: restore gravity, transition to `JUMP` state with current velocity.

---

## GrappleHook Entity (`src/game/entities/GrappleHook.ts`)

- Extends `Phaser.Physics.Arcade.Image`
- Uses `'pixel'` texture (same as `Checkpoint`, `DummyEnemy`), `setDisplaySize(16, 16)`, tint `0x888888`
- No gravity (`body.setAllowGravity(false)`)
- Fired from player position, velocity set toward capped target point at `GRAPPLE_HOOK_SPEED`
- Tracks `spawnX/Y` to enforce range limit
- Destroyed when: hits tile, hits enemy, or exceeds `GRAPPLE_RANGE` from spawn
- Public `getSpawnPos()` returns `{ x, y }` for range check in GrappleSystem

---

## GrappleSystem (`src/game/systems/GrappleSystem.ts`)

### Internal States

```ts
type GrappleState = 'IDLE' | 'FLYING' | 'ATTACHED_TILE' | 'ATTACHED_ENEMY';
```

### Transitions

| From | To | Trigger |
|---|---|---|
| `IDLE` | `FLYING` | Right-click pressed |
| `FLYING` | `ATTACHED_TILE` | Hook collides with tile layer |
| `FLYING` | `ATTACHED_ENEMY` | Hook overlaps enemy group |
| `FLYING` | `IDLE` | Hook exceeds `GRAPPLE_RANGE` (miss) |
| `ATTACHED_*` | `IDLE` | Jump pressed OR right-click pressed |
| `ATTACHED_*` → `FLYING` | Right-click fires new hook (releases current, fires fresh) |

### Constructor

```ts
constructor(
  scene: Phaser.Scene,
  player: Player,
  groundLayer: Phaser.Tilemaps.TilemapLayer,
  enemiesGroup: Phaser.Physics.Arcade.Group,
)
```

Registers:
- `physics.add.collider(hook, groundLayer, onHitTile)` — wired when hook is fired
- `physics.add.overlap(hook, enemiesGroup, onHitEnemy)` — wired when hook is fired

### Firing

- Target point = `pointer.worldX/Y`, clamped so distance from player ≤ `GRAPPLE_RANGE`
- Hook entity created, velocity set toward clamped target
- Previous hook destroyed if one exists
- Player transitions to `GRAPPLE_FLYING`

### Rope Physics (per frame, while `ATTACHED_*`)

```
attachPoint = tile contact point OR enemy.x/y (live, for attached enemy)
rope = attachPoint - player.position
dist = rope.length()

if dist > ropeLength:
    // Pendulum constraint: remove velocity component along the rope extension
    ropeDir = rope.normalized()
    vDotRope = velocity.dot(ropeDir)
    if vDotRope < 0:  // only remove if moving away
        velocity -= ropeDir * vDotRope

// Pull force toward attachment point
velocity += ropeDir * GRAPPLE_PULL_FORCE * (delta / 1000)

// Lock to surface when close enough
if dist < 8px:
    velocity = (0, 0)
    player.setPosition(attachPoint - surfaceNormal * playerHalfSize)
    state = LOCKED (sub-state of ATTACHED)
```

`ropeLength` is set once on attach = distance between player and attachment point at moment of contact.

### Release

```
restore body.setAllowGravity(true)
player.body.setVelocity(currentVelocity)  // carry momentum
player.transitionTo(JUMP)
grappleState = IDLE
hook.destroy()
rope graphics cleared
```

### Enemy Attachment

- On `onHitEnemy`: call `enemy.takeDamage(GRAPPLE_DAMAGE)`
- Store enemy reference as attachment target
- Each frame: `attachPoint = { x: enemy.x, y: enemy.y }` (tracks enemy if it moves)
- Future: call `enemy.setAlert()` when implemented

### Rope Rendering

- `GrappleSystem` owns a `Phaser.GameObjects.Graphics` object (depth 15)
- Each frame while `FLYING` or `ATTACHED_*`: `graphics.clear()`, draw line from `player.x/y` to hook position
- Line style: 2px, color `0xaaaaaa`, alpha 0.9
- Cleared on `IDLE`

### `destroy()`

Called on scene shutdown. Destroys hook, clears graphics, restores player gravity/state if mid-grapple.

---

## UIScene Changes

### Removed
- `desaturateOverlay` rectangle
- `crosshair` Graphics object
- `slowMoActive`, `crosshairAlpha` fields
- `onSlowMoEnter`, `onSlowMoExit`, `onSlowMoShot` methods
- `slowmo-enter/exit/shot` event registrations

### Added — Grapple Reticle

Drawn every `update()` frame (always visible):

```ts
// Circle at pointer screen position
reticle.clear();
reticle.lineStyle(1, 0x88aaff, 0.9);
reticle.strokeCircle(pointer.x, pointer.y, 6);
reticle.lineBetween(pointer.x - 10, pointer.y, pointer.x + 10, pointer.y);
reticle.lineBetween(pointer.x, pointer.y - 10, pointer.x, pointer.y + 10);

// Range circle around player (world → screen via camera)
const screenX = (player.x - camera.scrollX) * camera.zoom;
const screenY = (player.y - camera.scrollY) * camera.zoom;
const screenRange = BALANCE.GRAPPLE_RANGE * camera.zoom;
reticle.lineStyle(1, 0x88aaff, 0.15);
reticle.strokeCircle(screenX, screenY, screenRange);
```

UIScene reads player world position from `game.registry.get('playerPos')` (already set each frame by Level01Scene).

---

## Level01Scene Changes

### Remove
- `private slowMo: SlowMoSystem` field
- `this.slowMo = new SlowMoSystem(this)` in `create()`
- `this.slowMo.canFire()` guard in `update()` fire check
- `this.slowMo.onFired()` call
- `this.game.events.emit('slowmo-shot')` call
- `this.slowMo.update(pointer)` in `update()`
- `this.slowMo.destroy()` in shutdown handler
- SlowMoSystem import

### Add
- `private grapple: GrappleSystem` field
- `this.grapple = new GrappleSystem(this, this.player, ground, this.enemiesGroup)` in `create()`
- `this.grapple.update(pointer)` in `update()`
- `this.grapple.destroy()` in shutdown handler
- GrappleSystem import

### Left-click fire check (simplified)

```ts
// was: if (isDown && !this.prevMouseDown && this.slowMo.canFire() && this.player.consumeAmmo())
if (isDown && !this.prevMouseDown && this.player.consumeAmmo()) {
  this.combatSystem.fireShuriken(...);
  this.game.events.emit('ammo-changed', this.player.getAmmo());
}
```

---

## Out of Scope

- Enemy alert mode / cone of vision (future — requires enemy AI)
- Grapple animation on player sprite
- Grapple SFX (placeholder silence acceptable)
- Multiple simultaneous grapple hooks
- Grapple cooldown (may add during playtesting)
