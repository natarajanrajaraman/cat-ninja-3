# Checkpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two physical checkpoint objects to Level01's graybox; touching one sets it as the player's respawn location (health already fully restored by the existing `respawn()` method).

**Architecture:** A `Checkpoint` entity owns its own visual state and respawn Y value. Level01Scene creates two instances, wires individual `physics.add.overlap` calls, tracks `activeCheckpoint`, and uses it in `handlePlayerDeath`. No separate system class needed.

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/game/entities/Checkpoint.ts` | **Create** | Checkpoint entity: visual state, activate/query API |
| `src/game/scenes/Level01Scene.ts` | **Modify** | Spawn checkpoints, wire overlaps, use activeCheckpoint in respawn |

> **Note:** `Player.respawn()` already restores health to `BALANCE.PLAYER_MAX_HEALTH` and emits `player-health-changed`. No `restoreHealth()` method is needed.

---

## Task 1: Create the Checkpoint entity

**Files:**
- Create: `src/game/entities/Checkpoint.ts`

- [ ] **Step 1: Create the file**

```ts
// src/game/entities/Checkpoint.ts
import Phaser from 'phaser';

/**
 * Physical checkpoint object. Touch to activate; once active it becomes the
 * player's respawn location. Visual: 16×64 px rectangle, grey → gold on activate.
 */
export class Checkpoint extends Phaser.Physics.Arcade.Image {
  private _activated = false;
  private readonly _respawnY: number;

  /**
   * @param x      World-space centre X
   * @param y      World-space centre Y (top of the checkpoint column)
   * @param respawnY  Sprite Y to pass to player.respawn() — should be the
   *                  ground-level spawn Y used by the rest of the level (790).
   */
  constructor(scene: Phaser.Scene, x: number, y: number, respawnY: number) {
    super(scene, x, y, 'pixel');
    this._respawnY = respawnY;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body

    this.setDisplaySize(16, 64);
    this.setTint(0x555566); // inactive: grey

    // Fit static body to display size
    (this.body as Phaser.Physics.Arcade.StaticBody).setSize(16, 64);
  }

  /** Activate this checkpoint. No-ops if already active. */
  activate(): void {
    if (this._activated) return;
    this._activated = true;
    this.setTint(0xffcc44); // active: gold

    // Play SFX only if the key is loaded (graceful no-op in graybox)
    if (this.scene.cache.audio.has('checkpoint')) {
      this.scene.sound.play('checkpoint', { volume: 0.7 });
    }
  }

  isActivated(): boolean { return this._activated; }
  getRespawnY(): number  { return this._respawnY; }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build
```
Expected: no TypeScript errors. (The entity isn't used anywhere yet so no runtime test.)

- [ ] **Step 3: Commit**

```bash
git add src/game/entities/Checkpoint.ts
git commit -m "feat: add Checkpoint entity (inactive/active states, respawn Y)"
```

---

## Task 2: Wire checkpoints into Level01Scene

**Files:**
- Modify: `src/game/scenes/Level01Scene.ts`

### Step-by-step changes

- [ ] **Step 1: Add import and new fields**

At the top of `Level01Scene.ts`, add the import after the existing imports:

```ts
import { Checkpoint } from '../entities/Checkpoint';
```

In the class body, after `private deathPending = false;`, add:

```ts
private activeCheckpoint: Checkpoint | null = null;
```

- [ ] **Step 2: Spawn checkpoints and wire overlaps in create()**

In `create()`, after the `this.physics.add.collider(this.player, this.platforms);` line, add:

```ts
// Checkpoints — CP1 after dash gap, CP2 after wall-jump shaft
// Ground surface Y = 836; checkpoint centre Y = 836 - 32 = 804 (64 px tall, bottom on ground)
const RESPAWN_Y = this.spawnY; // 790 — same ground-level spawn used at level start
const cp1 = new Checkpoint(this, 1650, 804, RESPAWN_Y);
const cp2 = new Checkpoint(this, 2130, 804, RESPAWN_Y);

[cp1, cp2].forEach(cp => {
  this.physics.add.overlap(
    this.player,
    cp,
    () => this.onCheckpointOverlap(cp),
  );
});
```

- [ ] **Step 3: Add onCheckpointOverlap and showCheckpointPopup methods**

Add these two private methods anywhere in the class (e.g. after `spawnEnemies`):

```ts
private onCheckpointOverlap(cp: Checkpoint): void {
  if (cp.isActivated()) return;
  cp.activate();
  this.activeCheckpoint = cp;
  this.showCheckpointPopup(cp.x, cp.y);
}

private showCheckpointPopup(x: number, y: number): void {
  const text = this.add.text(x, y - 48, 'CHECKPOINT', {
    fontSize: '16px',
    color: '#ffcc44',
  }).setOrigin(0.5).setDepth(25);

  this.tweens.add({
    targets: text,
    alpha: 0,
    duration: 1500,
    onComplete: () => text.destroy(),
  });
}
```

- [ ] **Step 4: Update handlePlayerDeath to use activeCheckpoint**

In `handlePlayerDeath()`, find this block inside the `delayedCall` callback:

```ts
this.player.respawn(this.spawnX, this.spawnY);
```

Replace it with:

```ts
const rx = this.activeCheckpoint?.x ?? this.spawnX;
const ry = this.activeCheckpoint?.getRespawnY() ?? this.spawnY;
this.player.respawn(rx, ry);
```

(`respawn()` already restores health + ammo — no extra call needed.)

- [ ] **Step 5: Build to confirm no errors**

```bash
npm run build
```
Expected: clean build, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/game/scenes/Level01Scene.ts
git commit -m "feat: wire checkpoints into Level01Scene with popup and respawn"
```

---

## Task 3: Manual playtesting verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```
Open the URL shown in terminal (usually `http://localhost:5173`).

- [ ] **Step 2: Verify checkpoint visuals**

Two grey 16×64 columns should be visible at approximately x=1650 and x=2130 on the main ground. Run to each and confirm they turn gold on contact and show a "CHECKPOINT" text that fades out.

- [ ] **Step 3: Verify respawn at checkpoint**

After activating CP1 (x=1650), let the player die (fall off or take damage). Confirm the player respawns near x=1650, not at the level start (x=96). Confirm health is full after respawn.

- [ ] **Step 4: Verify checkpoint 2 overrides checkpoint 1**

Activate CP1, then walk to CP2. Die. Confirm respawn is at x=2130, not x=1650.

- [ ] **Step 5: Verify start respawn when no checkpoint active**

Reload the page (fresh state). Die before touching any checkpoint. Confirm respawn is at the level start (x=96).

- [ ] **Step 6: Commit if any last-minute tweaks were made**

```bash
git add -p
git commit -m "fix: checkpoint playtesting adjustments"
```
(Skip this step if no further changes were needed.)
