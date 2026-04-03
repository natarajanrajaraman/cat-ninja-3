---
title: Checkpoints — Design Spec
date: 2026-04-03
prompt: Prompt 8
status: approved
---

# Checkpoints

## Overview

Physical checkpoint objects placed in Level01's graybox. The most recently activated checkpoint becomes the player's respawn location. Health restores to full on respawn.

---

## Checkpoint Entity (`src/game/entities/Checkpoint.ts`)

- Extends `Phaser.Physics.Arcade.Image` so it participates in arcade overlap detection.
- Constructor params: `scene`, `x`, `y` (center of object), `respawnY` (ground surface Y at this checkpoint).
- **Visual:** 16×64px colored rectangle rendered via `setDisplaySize` / `setTint`.
- **States:**
  - Inactive: tint `0x555566` (grey)
  - Active: tint `0xffcc44` (gold)
- **`activate()`** — sets tint to gold, marks `_activated = true`, plays SFX if available (`'checkpoint'` key, graceful no-op if not loaded). No-ops if already active.
- **`isActivated()`** — returns `_activated`.
- **`getRespawnY()`** — returns the `respawnY` passed at construction so the player lands on the correct platform surface.

---

## Placement in Level01

Two checkpoints. Start spawn (`x=96`) acts as implicit checkpoint 0 — no object.

| # | x | y (center) | respawnY | Rationale |
|---|---|---|---|---|
| CP1 | 1650 | ground − 32 | ground | After the 220px dash-only gap |
| CP2 | 2130 | ground − 32 | ground | After the wall-jump shaft |

---

## Level01Scene Changes

### New fields
```ts
private checkpointGroup!: Phaser.Physics.Arcade.StaticGroup;
private activeCheckpoint: Checkpoint | null = null;
```

### create()
1. Build `checkpointGroup` as a static group.
2. Instantiate CP1 and CP2, add to group.
3. Wire `physics.overlap(this.player, this.checkpointGroup, this.onCheckpointOverlap, undefined, this)`.

### onCheckpointOverlap()
```ts
private onCheckpointOverlap(_player: unknown, obj: unknown): void {
  const cp = obj as Checkpoint;
  if (cp.isActivated()) return;
  cp.activate();
  this.activeCheckpoint = cp;
  this.showCheckpointPopup(cp.x, cp.y);
}
```

### showCheckpointPopup()
- Adds world-space text `"CHECKPOINT"` at the checkpoint's position, depth 25.
- Tweens alpha from 1 → 0 over 1500ms, then destroys the text object.

### handlePlayerDeath() — respawn position
```ts
const rx = this.activeCheckpoint?.x ?? this.spawnX;
const ry = this.activeCheckpoint?.getRespawnY() ?? this.spawnY;
this.player.respawn(rx, ry);
this.player.restoreHealth();
```

---

## Player.restoreHealth()

New public method on `Player`:
```ts
restoreHealth(): void {
  this.health = BALANCE.PLAYER_MAX_HEALTH;
  this.scene.game.events.emit('player-health-changed', {
    health: this.health,
    maxHealth: BALANCE.PLAYER_MAX_HEALTH,
  });
}
```

---

## Out of Scope

- Checkpoint persistence across scene restarts (not needed for graybox).
- Multiple checkpoints activating simultaneously (overlap fires per-object; `isActivated()` guard prevents double-fire).
- Art assets — graybox color tints only.
- Audio — wired but graceful no-op if `'checkpoint'` SFX not loaded.
