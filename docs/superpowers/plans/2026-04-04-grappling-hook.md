# Grappling Hook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the slow-motion aim mechanic with a right-click grappling hook that attaches to tiles and enemies, swings the player on a rope via pendulum physics, and locks them to the surface on contact.

**Architecture:** `GrappleHook.ts` is the flying projectile entity. `GrappleSystem.ts` owns all state (IDLE/FLYING/ATTACHED_TILE/ATTACHED_ENEMY), rope physics simulation, and rope rendering. `SlowMoSystem` is deleted. Player gets two new states. UIScene shows a permanent grapple reticle instead of the slow-mo crosshair.

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/game/config/balanceConfig.ts` | Modify | Remove `SLOWMO_TIMESCALE`, add 4 grapple constants |
| `src/game/types/PlayerTypes.ts` | Modify | Add `GRAPPLE_FLYING` and `GRAPPLE_ATTACHED` states |
| `src/game/entities/GrappleHook.ts` | **Create** | Flying hook projectile entity |
| `src/game/systems/GrappleSystem.ts` | **Create** | All grapple logic, rope physics, rope rendering |
| `src/game/systems/SlowMoSystem.ts` | **Delete** | No longer needed |
| `src/game/entities/Player.ts` | Modify | Block input during `GRAPPLE_ATTACHED`; expose `setGrappleAttached()` |
| `src/game/scenes/Level01Scene.ts` | Modify | Swap SlowMo for GrappleSystem, simplify fire check |
| `src/game/scenes/UIScene.ts` | Modify | Remove slow-mo elements, add permanent grapple reticle |

---

## Task 1: Update balanceConfig and PlayerTypes

**Files:**
- Modify: `src/game/config/balanceConfig.ts`
- Modify: `src/game/types/PlayerTypes.ts`

- [ ] **Step 1: Update `balanceConfig.ts`**

Remove `SLOWMO_TIMESCALE: 0.35,` and add the four grapple constants. The file should now read:

```ts
// All tunable gameplay values live here.
// Update this file during playtesting — never hardcode these in entity classes.
export const BALANCE = {
  // --- Player movement ---
  MOVE_SPEED: 320,
  GROUND_ACCEL: 1800,
  GROUND_DECEL: 1600,
  AIR_ACCEL: 900,
  JUMP_VELOCITY: -620,
  GRAVITY: 1400,
  DOUBLE_JUMP_VELOCITY: -480,
  WALL_JUMP_VX: 280,
  WALL_JUMP_VY: -560,
  WALL_SLIDE_GRAVITY: 200,

  // --- Dash ---
  DASH_DISTANCE: 220,
  DASH_SPEED: 900,
  DASH_COOLDOWN: 600,

  // --- Grappling hook ---
  GRAPPLE_RANGE: 600,        // px — max hook travel distance
  GRAPPLE_HOOK_SPEED: 1200,  // px/s — hook projectile speed
  GRAPPLE_PULL_FORCE: 800,   // px/s² — acceleration toward attachment point
  GRAPPLE_DAMAGE: 10,        // damage dealt to enemy on hook contact

  // --- Fairness timings ---
  COYOTE_TIME: 100,
  JUMP_BUFFER_TIME: 100,
  WALL_GRACE_TIME: 80,

  // --- Claw ---
  CLAW_DAMAGE: 25,
  CLAW_ACTIVE_MS: 150,
  CLAW_RECOVERY_MS: 200,
  CLAW_COOLDOWN_MS: 400,
  CLAW_RANGE: 60,

  // --- Shuriken ---
  SHURIKEN_DAMAGE: 15,
  SHURIKEN_SPEED: 800,
  SHURIKEN_GRAVITY: 400,
  SHURIKEN_FIRE_COOLDOWN: 250,
  SHURIKEN_MAX_AMMO: 10,
  SHURIKEN_LIFETIME: 2500,

  // --- Player health / lives ---
  PLAYER_MAX_HEALTH: 100,
  PLAYER_MAX_LIVES: 9,
  PLAYER_INVULN_MS: 1200,
  PLAYER_HURT_DURATION_MS: 350,

  // --- Dummy enemy ---
  DUMMY_HEALTH: 50,
} as const;
```

- [ ] **Step 2: Add grapple states to `PlayerTypes.ts`**

```ts
export enum PlayerState {
  IDLE = 'IDLE',
  RUN = 'RUN',
  JUMP = 'JUMP',
  FALL = 'FALL',
  DOUBLE_JUMP = 'DOUBLE_JUMP',
  WALL_SLIDE = 'WALL_SLIDE',
  WALL_JUMP = 'WALL_JUMP',
  DASH = 'DASH',
  HURT = 'HURT',
  DEAD = 'DEAD',
  GRAPPLE_FLYING   = 'GRAPPLE_FLYING',
  GRAPPLE_ATTACHED = 'GRAPPLE_ATTACHED',
}

// Input keys passed from scene into Player constructor.
export interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
}
```

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/game/config/balanceConfig.ts src/game/types/PlayerTypes.ts
git commit -m "feat: add grapple balance constants and player states"
```

---

## Task 2: Create GrappleHook entity

**Files:**
- Create: `src/game/entities/GrappleHook.ts`

- [ ] **Step 1: Create the file**

```ts
// src/game/entities/GrappleHook.ts
import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';

/**
 * Flying grapple hook projectile.
 * Fired from player position toward a target point (capped at GRAPPLE_RANGE).
 * Destroyed on tile hit, enemy hit, or range exceeded.
 */
export class GrappleHook extends Phaser.Physics.Arcade.Image {
  private readonly spawnX: number;
  private readonly spawnY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'pixel');
    this.spawnX = x;
    this.spawnY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(12, 12);
    this.setTint(0x888888);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(12, 12);
  }

  /** Aim and launch toward worldX/Y, clamped to GRAPPLE_RANGE. */
  launch(toX: number, toY: number): void {
    const dx = toX - this.spawnX;
    const dy = toY - this.spawnY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp target to range
    const scale = dist > BALANCE.GRAPPLE_RANGE ? BALANCE.GRAPPLE_RANGE / dist : 1;
    const vx = (dx / dist) * BALANCE.GRAPPLE_HOOK_SPEED;
    const vy = (dy / dist) * BALANCE.GRAPPLE_HOOK_SPEED;

    (this.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

    // Store clamped target for range check (max travel = GRAPPLE_RANGE)
    void scale; // scale available if needed for future use
  }

  /** Returns true if hook has exceeded GRAPPLE_RANGE from spawn. */
  isOutOfRange(): boolean {
    const dx = this.x - this.spawnX;
    const dy = this.y - this.spawnY;
    return (dx * dx + dy * dy) > BALANCE.GRAPPLE_RANGE * BALANCE.GRAPPLE_RANGE;
  }

  getSpawnPos(): { x: number; y: number } {
    return { x: this.spawnX, y: this.spawnY };
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/game/entities/GrappleHook.ts
git commit -m "feat: add GrappleHook projectile entity"
```

---

## Task 3: Create GrappleSystem

**Files:**
- Create: `src/game/systems/GrappleSystem.ts`

- [ ] **Step 1: Create the file**

```ts
// src/game/systems/GrappleSystem.ts
import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GrappleHook } from '../entities/GrappleHook';
import { IDamageable } from '../types/CombatTypes';
import { BALANCE } from '../config/balanceConfig';
import { PlayerState } from '../types/PlayerTypes';

type GrappleState = 'IDLE' | 'FLYING' | 'ATTACHED_TILE' | 'ATTACHED_ENEMY';

/**
 * Manages grappling hook: firing, attachment, rope pendulum physics, and rope rendering.
 *
 * Right-click fires the hook. On tile/enemy contact the player swings on the rope
 * and locks to the surface. Jump or right-click again to release.
 */
export class GrappleSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly groundLayer: Phaser.Tilemaps.TilemapLayer;
  private readonly enemiesGroup: Phaser.Physics.Arcade.Group;

  private state: GrappleState = 'IDLE';
  private hook: GrappleHook | null = null;
  private ropeGraphics: Phaser.GameObjects.Graphics;

  // Attachment state
  private attachX = 0;
  private attachY = 0;
  private ropeLength = 0;
  private attachedEnemy: (Phaser.GameObjects.GameObject & IDamageable) | null = null;
  private locked = false; // true once player reaches the surface

  private prevRightDown = false;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    enemiesGroup: Phaser.Physics.Arcade.Group,
  ) {
    this.scene = scene;
    this.player = player;
    this.groundLayer = groundLayer;
    this.enemiesGroup = enemiesGroup;

    this.ropeGraphics = scene.add.graphics().setDepth(15);
  }

  update(pointer: Phaser.Input.Pointer): void {
    const rightDown = pointer.rightButtonDown();
    const rightJustPressed = rightDown && !this.prevRightDown;
    this.prevRightDown = rightDown;

    switch (this.state) {
      case 'IDLE':
        if (rightJustPressed) this.fire(pointer.worldX, pointer.worldY);
        break;

      case 'FLYING':
        this.updateFlying();
        if (rightJustPressed) this.release(); // re-fire: release and immediately fire new hook
        // Jump while flying: just release (player falls normally)
        if (Phaser.Input.Keyboard.JustDown(
          this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        )) {
          this.release();
        }
        break;

      case 'ATTACHED_TILE':
      case 'ATTACHED_ENEMY':
        this.updateAttached();
        if (rightJustPressed) {
          this.release();
          this.fire(pointer.worldX, pointer.worldY);
          return;
        }
        // Jump to release
        if (Phaser.Input.Keyboard.JustDown(
          this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        )) {
          this.release();
        }
        break;
    }

    this.drawRope();
  }

  private fire(worldX: number, worldY: number): void {
    this.hook?.destroy();
    this.hook = new GrappleHook(this.scene, this.player.x, this.player.y);
    this.hook.launch(worldX, worldY);
    this.state = 'FLYING';
    this.locked = false;
    this.attachedEnemy = null;

    // Wire collisions for this hook instance
    this.scene.physics.add.collider(
      this.hook,
      this.groundLayer,
      () => this.onHitTile(),
    );
    this.scene.physics.add.overlap(
      this.hook,
      this.enemiesGroup,
      (_hook, enemyObj) => this.onHitEnemy(enemyObj as Phaser.GameObjects.GameObject & IDamageable),
    );
  }

  private onHitTile(): void {
    if (!this.hook || this.state !== 'FLYING') return;
    this.attachX = this.hook.x;
    this.attachY = this.hook.y;
    this.ropeLength = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.attachX, this.attachY,
    );
    this.hook.setActive(false).setVisible(false);
    (this.hook.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.state = 'ATTACHED_TILE';
    this.player.setGrappleAttached(true);
  }

  private onHitEnemy(enemy: Phaser.GameObjects.GameObject & IDamageable): void {
    if (!this.hook || this.state !== 'FLYING') return;
    enemy.takeDamage(BALANCE.GRAPPLE_DAMAGE);
    this.attachedEnemy = enemy;
    const go = enemy as unknown as Phaser.GameObjects.Components.Transform;
    this.attachX = go.x;
    this.attachY = go.y;
    this.ropeLength = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.attachX, this.attachY,
    );
    this.hook.setActive(false).setVisible(false);
    (this.hook.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.state = 'ATTACHED_ENEMY';
    this.player.setGrappleAttached(true);
  }

  private updateFlying(): void {
    if (!this.hook) return;
    if (this.hook.isOutOfRange()) {
      this.release();
    }
  }

  private updateAttached(): void {
    // Update attachment point for enemy (tracks enemy position if it moves)
    if (this.attachedEnemy) {
      const go = this.attachedEnemy as unknown as Phaser.GameObjects.Components.Transform;
      this.attachX = go.x;
      this.attachY = go.y;
    }

    if (this.locked) return; // already locked to surface — wait for jump

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const dx = this.attachX - this.player.x;
    const dy = this.attachY - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Lock to surface when close enough
    if (dist < 8) {
      this.locked = true;
      body.setVelocity(0, 0);
      return;
    }

    // Normalised direction toward attachment
    const nx = dx / dist;
    const ny = dy / dist;

    // Pendulum constraint: if rope is taut, remove outward velocity component
    if (dist >= this.ropeLength) {
      const vDotRope = body.velocity.x * nx + body.velocity.y * ny;
      if (vDotRope < 0) {
        // Moving away — remove that component
        body.setVelocityX(body.velocity.x - nx * vDotRope);
        body.setVelocityY(body.velocity.y - ny * vDotRope);
      }
    }

    // Pull force toward attachment point (creates the swing)
    const dt = this.scene.game.loop.delta / 1000;
    body.setVelocityX(body.velocity.x + nx * BALANCE.GRAPPLE_PULL_FORCE * dt);
    body.setVelocityY(body.velocity.y + ny * BALANCE.GRAPPLE_PULL_FORCE * dt);
  }

  private release(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.player.setGrappleAttached(false);
    this.hook?.destroy();
    this.hook = null;
    this.attachedEnemy = null;
    this.locked = false;
    this.state = 'IDLE';
    // Gravity is restored inside setGrappleAttached(false)
    // Carry current velocity as launch momentum
    void body; // velocity already applied
  }

  private drawRope(): void {
    this.ropeGraphics.clear();
    if (this.state === 'IDLE') return;

    const endX = this.state === 'FLYING' ? (this.hook?.x ?? this.player.x) : this.attachX;
    const endY = this.state === 'FLYING' ? (this.hook?.y ?? this.player.y) : this.attachY;

    this.ropeGraphics.lineStyle(2, 0xaaaaaa, 0.9);
    this.ropeGraphics.lineBetween(this.player.x, this.player.y, endX, endY);
  }

  destroy(): void {
    if (this.state !== 'IDLE') {
      this.release();
    }
    this.ropeGraphics.destroy();
    this.hook?.destroy();
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: may show TypeScript errors if `Player.setGrappleAttached` doesn't exist yet — that's fine, note the error and proceed to Task 4 which adds it.

- [ ] **Step 3: Commit**

```bash
git add src/game/systems/GrappleSystem.ts
git commit -m "feat: add GrappleSystem with rope physics and rope rendering"
```

---

## Task 4: Update Player for grapple states

**Files:**
- Modify: `src/game/entities/Player.ts`

- [ ] **Step 1: Add `setGrappleAttached()` public method**

In `Player.ts`, after the `respawn()` method (around line 99), add:

```ts
/**
 * Called by GrappleSystem to enter/exit grapple-attached state.
 * Disables gravity and input while attached; restores on release.
 */
setGrappleAttached(attached: boolean): void {
  const body = this.body as Phaser.Physics.Arcade.Body;
  if (attached) {
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    this.transitionTo(PlayerState.GRAPPLE_ATTACHED);
  } else {
    body.setAllowGravity(true);
    body.setGravityY(BALANCE.GRAVITY);
    this.transitionTo(PlayerState.JUMP); // carry momentum into jump arc
  }
}
```

- [ ] **Step 2: Block input during `GRAPPLE_ATTACHED` in `update()`**

In `Player.update()`, after the `HURT` early-return block and before the `DASH` block, add a guard for `GRAPPLE_ATTACHED`:

Find:
```ts
    if (this.isInState(PlayerState.DASH)) {
      this.updateDash();
    } else {
      this.handleJumpInput();
```

Replace with:
```ts
    if (this.isInState(PlayerState.GRAPPLE_ATTACHED)) {
      // GrappleSystem handles all input while attached; just update visuals
      this.updateFacing();
      this.updateAnimation();
      this.updateInvulnFlicker();
      return;
    }

    if (this.isInState(PlayerState.DASH)) {
      this.updateDash();
    } else {
      this.handleJumpInput();
```

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/game/entities/Player.ts
git commit -m "feat: add setGrappleAttached() and block input during grapple states"
```

---

## Task 5: Update Level01Scene — swap SlowMo for GrappleSystem

**Files:**
- Modify: `src/game/scenes/Level01Scene.ts`
- Delete: `src/game/systems/SlowMoSystem.ts`

- [ ] **Step 1: Update imports in `Level01Scene.ts`**

Replace:
```ts
import { SlowMoSystem } from '../systems/SlowMoSystem';
```
With:
```ts
import { GrappleSystem } from '../systems/GrappleSystem';
```

- [ ] **Step 2: Replace `slowMo` field with `grapple`**

Replace:
```ts
  private slowMo!: SlowMoSystem;
```
With:
```ts
  private grapple!: GrappleSystem;
```

- [ ] **Step 3: Replace slow-mo wiring in `create()`**

Find:
```ts
    // Wire slow-mo system
    this.slowMo = new SlowMoSystem(this);
```
Replace with:
```ts
    // Wire grapple system
    this.grapple = new GrappleSystem(this, this.player, ground, this.enemiesGroup);
```

- [ ] **Step 4: Update shutdown handler**

Find:
```ts
    this.events.once('shutdown', () => {
      this.slowMo.destroy();
      this.scene.stop('UIScene');
      this.game.events.off('player-died', this.handlePlayerDeath, this);
    });
```
Replace with:
```ts
    this.events.once('shutdown', () => {
      this.grapple.destroy();
      this.scene.stop('UIScene');
      this.game.events.off('player-died', this.handlePlayerDeath, this);
    });
```

- [ ] **Step 5: Simplify the `update()` fire check and replace `slowMo.update()`**

Find this block:
```ts
    // Fire only on transition from not-pressed to pressed
    // canFire() checked before consumeAmmo() to avoid consuming ammo when locked
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
    this.game.registry.set('playerPos', { x: Math.round(this.player.x), y: Math.round(this.player.y) });
    this.slowMo.update(pointer);
```

Replace with:
```ts
    // Fire only on transition from not-pressed to pressed
    if (isDown && !this.prevMouseDown && this.player.consumeAmmo()) {
      this.combatSystem.fireShuriken(
        this.player.x, this.player.y,
        pointer.worldX, pointer.worldY,
      );
      this.game.events.emit('ammo-changed', this.player.getAmmo());
    }

    this.prevMouseDown = isDown;
    this.game.registry.set('playerPos', { x: Math.round(this.player.x), y: Math.round(this.player.y) });
    this.grapple.update(pointer);
```

- [ ] **Step 6: Delete SlowMoSystem**

```bash
rm src/game/systems/SlowMoSystem.ts
```

- [ ] **Step 7: Build**

```bash
npm run build
```
Expected: clean build. Fix any TypeScript errors — do not change API shape.

- [ ] **Step 8: Commit**

```bash
git add src/game/scenes/Level01Scene.ts
git rm src/game/systems/SlowMoSystem.ts
git commit -m "feat: swap SlowMoSystem for GrappleSystem in Level01Scene"
```

---

## Task 6: Update UIScene — replace slow-mo elements with grapple reticle

**Files:**
- Modify: `src/game/scenes/UIScene.ts`

- [ ] **Step 1: Replace UIScene with the new version**

Replace the entire file content with:

```ts
import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';

export class UIScene extends Phaser.Scene {
  // --- Lives (screen-fixed) ---
  private livesText!: Phaser.GameObjects.Text;
  private posText!: Phaser.GameObjects.Text;

  // --- Grapple reticle (always visible) ---
  private reticle!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create(): void {
    const { width } = this.scale;

    // Lives counter — top-left
    this.livesText = this.add.text(16, 16, this.livesLabel(BALANCE.PLAYER_MAX_LIVES), {
      fontSize: '14px',
      color: '#ffcc44',
    });

    // Player position — top-right (playtest helper)
    this.posText = this.add.text(width - 16, 16, 'x: 0  y: 0', {
      fontSize: '12px',
      color: '#aabbcc',
    }).setOrigin(1, 0);

    // Grapple reticle graphics object (drawn every frame in update)
    this.reticle = this.add.graphics();

    // Event listeners
    this.game.events.on('player-lives-changed', this.onLivesChanged, this);

    this.events.once('shutdown', () => {
      this.game.events.off('player-lives-changed', this.onLivesChanged, this);
    });
  }

  update(): void {
    // Player position readout
    const pos = this.game.registry.get('playerPos') as { x: number; y: number } | undefined;
    if (pos) this.posText.setText(`x: ${pos.x}  y: ${pos.y}`);

    // Grapple reticle — always drawn at pointer position
    const pointer = this.input.activePointer;
    const cam = this.scene.get('Level01Scene').cameras.main;
    const px = pointer.x;
    const py = pointer.y;

    this.reticle.clear();
    this.reticle.lineStyle(1, 0x88aaff, 0.9);
    // Crosshair at cursor
    this.reticle.strokeCircle(px, py, 6);
    this.reticle.lineBetween(px - 10, py, px + 10, py);
    this.reticle.lineBetween(px, py - 10, px, py + 10);

    // Range circle around player (world → screen)
    if (pos && cam) {
      const screenX = (pos.x - cam.scrollX) * cam.zoom;
      const screenY = (pos.y - cam.scrollY) * cam.zoom;
      const screenRange = BALANCE.GRAPPLE_RANGE * cam.zoom;
      this.reticle.lineStyle(1, 0x88aaff, 0.15);
      this.reticle.strokeCircle(screenX, screenY, screenRange);
    }
  }

  private onLivesChanged(lives: number): void {
    this.livesText.setText(this.livesLabel(lives));
  }

  private livesLabel(lives: number): string {
    return `LIVES  ${lives}`;
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/game/scenes/UIScene.ts
git commit -m "feat: replace slow-mo UI with permanent grapple reticle"
```

---

## Task 7: Manual playtesting verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```
Open `http://localhost:5173`.

- [ ] **Step 2: Verify reticle**

A blue-grey crosshair should follow the mouse at all times. A faint circle around the player should show the grapple range.

- [ ] **Step 3: Verify grapple fires**

Right-click toward a wall or ceiling. A grey line (rope) should appear from the player toward the hook position. The hook should travel in the fired direction.

- [ ] **Step 4: Verify attachment to tile**

Right-click at a wall or ceiling. When the hook hits a tile, the player should swing toward it and lock on. The player should be stuck in place.

- [ ] **Step 5: Verify release by jumping**

While attached to a surface, press Space. The player should release and fly off with momentum.

- [ ] **Step 6: Verify re-grapple**

While attached, right-click toward another surface. The player should release from the first point and the hook should fire toward the new target.

- [ ] **Step 7: Verify miss**

Right-click toward empty space. The rope should extend to max range, then disappear (hook destroyed, player free).

- [ ] **Step 8: Verify enemy hit**

Right-click at a DummyEnemy. The hook should hit it, the enemy health bar should decrease by 10 (GRAPPLE_DAMAGE), and the player should swing toward the enemy position.

- [ ] **Step 9: Verify shuriken still works**

Left-click to throw a shuriken. Confirm ammo decreases and the shuriken fires normally (slowmo guard removed).

- [ ] **Step 10: Commit any tuning adjustments**

```bash
git add -p
git commit -m "fix: grapple playtesting tuning"
```
Skip if no changes needed.
