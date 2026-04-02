# Slow-Motion Aim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add right-click slow-motion aim mode with a crosshair cursor, desaturate overlay, 0.35× time scale, and one-shot-per-entry lock.

**Architecture:** A new `SlowMoSystem` class owns all slow-motion state and time scaling. `UIScene` owns all visuals (crosshair Graphics, desaturate overlay, OS cursor). The two communicate via `game.events` (`slowmo-enter`, `slowmo-exit`, `slowmo-shot`). `Level01Scene` wires everything together and fires the `slowmo-shot` event.

**Tech Stack:** Phaser 3, TypeScript, Vite. No test runner — verification is `npm run build` (TypeScript compile) + manual playtest in browser (`npm run dev`).

---

## File Map

| File | Change |
|---|---|
| `src/game/config/balanceConfig.ts` | Add `SLOWMO_TIMESCALE: 0.35` |
| `src/game/systems/SlowMoSystem.ts` | **Create** — slow-mo state machine and time scaling |
| `src/game/scenes/Level01Scene.ts` | Launch UIScene, wire SlowMoSystem, update fire block |
| `src/game/scenes/UIScene.ts` | Add crosshair Graphics, desaturate overlay, event listeners, `update()` |

---

## Task 1: Add `SLOWMO_TIMESCALE` to `balanceConfig.ts`

**Files:**
- Modify: `src/game/config/balanceConfig.ts`

- [ ] **Step 1: Add the constant**

In `src/game/config/balanceConfig.ts`, add `SLOWMO_TIMESCALE` after the `DASH_COOLDOWN` line:

```ts
  // --- Dash ---
  DASH_DISTANCE: 220,
  DASH_SPEED: 900,
  DASH_COOLDOWN: 600,

  // --- Slow-motion aim ---
  SLOWMO_TIMESCALE: 0.35,   // time scale while right-click held (1.0 = normal)
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/config/balanceConfig.ts
git commit -m "feat: add SLOWMO_TIMESCALE to balanceConfig"
```

---

## Task 2: Create `SlowMoSystem`

**Files:**
- Create: `src/game/systems/SlowMoSystem.ts`

- [ ] **Step 1: Create the file**

Create `src/game/systems/SlowMoSystem.ts` with the full implementation:

```ts
import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';

/**
 * Manages slow-motion aim state and Phaser time scaling.
 * Visuals (crosshair, overlay) are handled by UIScene via game events.
 *
 * Lifecycle per right-click press:
 *   enter → player may fire once → onFired() locks further shots → exit on release
 */
export class SlowMoSystem {
  private readonly scene: Phaser.Scene;
  private active = false;
  private hasShot = false;
  private prevRightDown = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Call every frame from Level01Scene.update(), AFTER the fire check. */
  update(pointer: Phaser.Input.Pointer): void {
    const rightDown = pointer.rightButtonDown();

    if (rightDown && !this.prevRightDown) {
      this.enter();
    } else if (!rightDown && this.prevRightDown) {
      this.exit();
    }

    this.prevRightDown = rightDown;
  }

  /** True while right-click is held. */
  isActive(): boolean {
    return this.active;
  }

  /**
   * True when a shuriken may be fired.
   * Returns true when slow-mo is inactive (normal fire allowed).
   * Returns true when slow-mo is active AND no shot has been fired this entry.
   * Returns false when slow-mo is active AND shot has already been fired.
   */
  canFire(): boolean {
    if (!this.active) return true;
    return !this.hasShot;
  }

  /** Call from Level01Scene immediately after firing a shuriken in slow-mo. */
  onFired(): void {
    if (this.active) {
      this.hasShot = true;
    }
  }

  /** Restore time scales if destroyed while active (e.g., scene shutdown). */
  destroy(): void {
    if (this.active) {
      this.exit();
    }
  }

  private enter(): void {
    this.active = true;
    this.hasShot = false;
    this.scene.physics.world.timeScale = BALANCE.SLOWMO_TIMESCALE;
    this.scene.time.timeScale = BALANCE.SLOWMO_TIMESCALE;
    this.scene.anims.globalTimeScale = BALANCE.SLOWMO_TIMESCALE;
    this.scene.game.events.emit('slowmo-enter');
  }

  private exit(): void {
    this.active = false;
    this.scene.physics.world.timeScale = 1;
    this.scene.time.timeScale = 1;
    this.scene.anims.globalTimeScale = 1;
    this.scene.game.events.emit('slowmo-exit');
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/systems/SlowMoSystem.ts
git commit -m "feat: add SlowMoSystem with time scaling and one-shot lock"
```

---

## Task 3: Wire `SlowMoSystem` into `Level01Scene`

**Files:**
- Modify: `src/game/scenes/Level01Scene.ts`

- [ ] **Step 1: Add import and field**

At the top of `src/game/scenes/Level01Scene.ts`, add the import after the existing imports:

```ts
import { SlowMoSystem } from '../systems/SlowMoSystem';
```

Add the field to the class body alongside the other private fields:

```ts
private slowMo!: SlowMoSystem;
```

- [ ] **Step 2: Launch UIScene and create SlowMoSystem in `create()`**

At the end of `Level01Scene.create()`, before the `this.sound.play(...)` call, add:

```ts
// Launch UIScene overlay
this.scene.launch('UIScene');

// Wire slow-mo system
this.slowMo = new SlowMoSystem(this);
```

- [ ] **Step 3: Update the fire block in `update()`**

Replace the existing fire block in `Level01Scene.update()`:

```ts
// Before
if (isDown && !this.prevMouseDown && this.player.consumeAmmo()) {
  this.combatSystem.fireShuriken(
    this.player.x, this.player.y,
    pointer.worldX, pointer.worldY,
  );
  this.game.events.emit('ammo-changed', this.player.getAmmo());
}

this.prevMouseDown = isDown;
```

With:

```ts
// After — canFire() checked before consumeAmmo() to avoid consuming ammo when locked
if (isDown && !this.prevMouseDown && this.slowMo.canFire() && this.player.consumeAmmo()) {
  this.combatSystem.fireShuriken(
    this.player.x, this.player.y,
    pointer.worldX, pointer.worldY,
  );
  this.slowMo.onFired();
  this.game.events.emit('slowmo-shot');
  this.game.events.emit('ammo-changed', this.player.getAmmo());
}

this.prevMouseDown = isDown;
this.slowMo.update(pointer);
```

- [ ] **Step 4: Clean up SlowMoSystem on scene shutdown**

Add a `shutdown` listener in `Level01Scene.create()`, after `this.slowMo = new SlowMoSystem(this)`:

```ts
this.events.once('shutdown', () => this.slowMo.destroy());
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/game/scenes/Level01Scene.ts
git commit -m "feat: wire SlowMoSystem into Level01Scene"
```

---

## Task 4: Add crosshair and desaturate overlay to `UIScene`

**Files:**
- Modify: `src/game/scenes/UIScene.ts`

- [ ] **Step 1: Replace `UIScene.ts` with the full implementation**

```ts
import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private crosshair!: Phaser.GameObjects.Graphics;
  private desaturateOverlay!: Phaser.GameObjects.Rectangle;
  private slowMoActive = false;
  private crosshairAlpha = 1;

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create(): void {
    // Placeholder HUD label (will be replaced in a later prompt)
    this.add.text(16, 16, 'HUD — UIScene overlay', {
      fontSize: '14px',
      color: '#ffff00',
    });

    // Full-screen desaturate overlay — hidden until slow-mo activates
    const { width, height } = this.scale;
    this.desaturateOverlay = this.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x1a1a35,
      0.25,
    );
    this.desaturateOverlay.setVisible(false);

    // Crosshair graphics object — redrawn every frame while active
    this.crosshair = this.add.graphics();
    this.crosshair.setVisible(false);

    // Listen for slow-mo state events from Level01Scene/SlowMoSystem
    this.game.events.on('slowmo-enter', this.onSlowMoEnter, this);
    this.game.events.on('slowmo-exit',  this.onSlowMoExit,  this);
    this.game.events.on('slowmo-shot',  this.onSlowMoShot,  this);

    // Clean up listeners when this scene shuts down
    this.events.once('shutdown', () => {
      this.game.events.off('slowmo-enter', this.onSlowMoEnter, this);
      this.game.events.off('slowmo-exit',  this.onSlowMoExit,  this);
      this.game.events.off('slowmo-shot',  this.onSlowMoShot,  this);
    });
  }

  update(): void {
    if (!this.slowMoActive) return;

    const pointer = this.input.activePointer;
    const { x, y } = pointer;

    // Redraw crosshair at current pointer position each frame
    this.crosshair.clear();
    this.crosshair.lineStyle(2, 0xff4444, this.crosshairAlpha);
    this.crosshair.strokeCircle(x, y, 8);
    this.crosshair.lineBetween(x - 12, y, x + 12, y);
    this.crosshair.lineBetween(x, y - 12, x, y + 12);
  }

  private onSlowMoEnter(): void {
    this.slowMoActive = true;
    this.crosshairAlpha = 1;
    this.crosshair.setVisible(true);
    this.desaturateOverlay.setVisible(true);
    this.input.setDefaultCursor('none');
  }

  private onSlowMoExit(): void {
    this.slowMoActive = false;
    this.crosshairAlpha = 1;
    this.crosshair.setVisible(false);
    this.crosshair.clear();
    this.desaturateOverlay.setVisible(false);
    this.input.setDefaultCursor('default');
  }

  private onSlowMoShot(): void {
    // Dim crosshair to signal "shot used — release to reset"
    this.crosshairAlpha = 0.4;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/scenes/UIScene.ts
git commit -m "feat: add slow-mo crosshair and desaturate overlay to UIScene"
```

---

## Task 5: Manual playtest and final commit

**Files:** none

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:5173`).

- [ ] **Step 2: Run through the verification checklist**

Work through each item — fix anything that doesn't match before moving on:

1. **Time slows:** Hold right-click. Player, enemies, and shurikens in flight all visibly slow to ~35% speed.
2. **Crosshair appears:** A red circle-with-lines crosshair tracks the mouse pointer exactly. The OS cursor is hidden.
3. **Desaturate effect:** The world looks slightly washed out while right-click is held. The crosshair stays vivid red.
4. **One shot per entry:** Left-click fires one shuriken. Crosshair dims to ~40% alpha. A second left-click while still holding right-click does NOT fire (and does NOT consume ammo).
5. **Exit restores everything:** Releasing right-click snaps time back to normal speed. Crosshair disappears. OS cursor returns. Desaturate overlay is gone.
6. **Re-entry resets lock:** Press right-click again. Crosshair is full alpha again. Left-click fires normally.
7. **Normal fire unchanged:** Without holding right-click, left-click fires a shuriken as before. Ammo decrements. No slow-mo effects appear.
8. **Ammo still gates fire:** With 0 ammo, left-click during slow-mo does not fire.

- [ ] **Step 3: Commit any fixes, then tag the feature complete**

```bash
git add -p   # stage only intentional changes
git commit -m "feat: slow-motion aim complete (Prompt 6)"
```
