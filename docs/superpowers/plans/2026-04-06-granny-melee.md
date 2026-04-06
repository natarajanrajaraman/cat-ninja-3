# GrannyMelee Enemy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the GrannyMelee enemy with a two-state passive/alert system, cone-of-vision detection with wall occlusion, patrol behaviour, punishable melee attack, behind-attack damage bonus, and alert propagation.

**Architecture:** `ConeOfVision` handles all detection geometry, wall-occlusion raycasting, and cone rendering. `GrannyMelee` owns the full state machine and holds a `ConeOfVision` instance. Alert triggers wired in `Level01Scene` call `granny.alert()`. `CombatSystem` applies the 3× behind-attack multiplier via `instanceof GrannyMelee`.

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript. No test runner — verification is `npm run build` then manual playtest at `http://localhost:5173`.

---

## File Map

| File | Action |
|---|---|
| `src/game/entities/enemies/ConeOfVision.ts` | **Create** |
| `src/game/entities/enemies/GrannyMelee.ts` | **Create** |
| `src/game/config/balanceConfig.ts` | Modify — add `GRANNY_*` constants |
| `src/game/systems/GrappleSystem.ts` | Modify — add `getHookPosition()` |
| `src/game/systems/CombatSystem.ts` | Modify — add `getShurikenGroup()`, behind multiplier |
| `src/game/scenes/PreloadScene.ts` | Modify — load `evilgranny` sheet + register animations |
| `src/game/scenes/Level01Scene.ts` | Modify — spawn GrannyMelee, wire overlaps + events |

---

### Task 1: Balance Constants

**Files:**
- Modify: `src/game/config/balanceConfig.ts`

- [ ] **Step 1: Add GRANNY constants after the shuriken section**

Open `src/game/config/balanceConfig.ts`. After the `// --- Shuriken ---` block and before `// --- Player health / lives ---`, add:

```ts
  // --- Granny Melee ---
  GRANNY_HEALTH: 60,
  GRANNY_PATROL_SPEED: 60,        // px/s passive walk
  GRANNY_ALERT_SPEED: 130,        // px/s chasing
  GRANNY_PATROL_WIDTH: 200,       // px each side from spawn X
  GRANNY_ATTACK_RANGE: 70,        // px — triggers telegraph
  GRANNY_ATTACK_DAMAGE: 20,
  GRANNY_TELEGRAPH_MS: 500,
  GRANNY_SWING_MS: 150,
  GRANNY_RECOVERY_MS: 400,
  GRANNY_HURT_MS: 250,
  GRANNY_BEHIND_MULTIPLIER: 3.0,
  GRANNY_CONE_PASSIVE_ANGLE: 35,  // degrees, half-angle each side
  GRANNY_CONE_PASSIVE_RANGE: 200, // px
  GRANNY_CONE_ALERT_ANGLE: 60,    // degrees, half-angle each side
  GRANNY_CONE_ALERT_RANGE: 350,   // px
  GRANNY_BODY_ALERT_RADIUS: 300,  // px — distance for body-detection alert
  GRANNY_PROPAGATION_RADIUS: 250, // px — distance for alert-spread (no LOS check)
```

- [ ] **Step 2: Build to verify no syntax errors**

```bash
npm run build
```
Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add src/game/config/balanceConfig.ts
git commit -m "feat: add GRANNY_* balance constants"
```

---

### Task 2: ConeOfVision Helper

**Files:**
- Create: `src/game/entities/enemies/ConeOfVision.ts`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/game/entities/enemies
```

Create `src/game/entities/enemies/ConeOfVision.ts` with this complete content:

```ts
import Phaser from 'phaser';

/**
 * Cone-of-vision helper: angle+distance detection with wall-occlusion raycasting
 * and a filled-triangle visual indicator.
 *
 * Used by GrannyMelee (and reusable by future enemies).
 */
export class ConeOfVision {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly groundLayer: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene, groundLayer: Phaser.Tilemaps.TilemapLayer) {
    this.groundLayer = groundLayer;
    this.graphics = scene.add.graphics().setDepth(5);
  }

  /**
   * Returns true if target (tx, ty) is within the cone AND not occluded by a tile.
   * The cone points in `facing` direction with `halfAngleDeg` spread each side.
   */
  check(
    fromX: number, fromY: number,
    facing: 'left' | 'right',
    halfAngleDeg: number,
    maxRange: number,
    tx: number, ty: number,
  ): boolean {
    const dx = tx - fromX;
    const dy = ty - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRange) return false;

    // Angle from enemy to target
    const targetAngle = Math.atan2(dy, dx); // radians, -π to π
    const faceAngle = facing === 'right' ? 0 : Math.PI;
    let diff = targetAngle - faceAngle;
    // Normalise diff to -π..π
    while (diff > Math.PI)  diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    if (Math.abs(diff) > Phaser.Math.DegToRad(halfAngleDeg)) return false;

    return this.hasLineOfSight(fromX, fromY, tx, ty);
  }

  /**
   * Returns true if no tile obstructs the straight ray from (fromX,fromY) to (toX,toY).
   * Steps every 8px along the ray, stopping just before the target.
   */
  hasLineOfSight(fromX: number, fromY: number, toX: number, toY: number): boolean {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return true;
    const nx = dx / dist;
    const ny = dy / dist;
    const steps = Math.max(1, Math.floor(dist / 8));
    for (let i = 1; i < steps; i++) {
      const sx = fromX + nx * 8 * i;
      const sy = fromY + ny * 8 * i;
      const tile = this.groundLayer.getTileAtWorldXY(sx, sy);
      if (tile && tile.index !== -1) return false;
    }
    return true;
  }

  /**
   * Draw the cone as a filled triangle each frame.
   * Call clear() when the enemy is dead or the cone should not show.
   */
  draw(
    fromX: number, fromY: number,
    facing: 'left' | 'right',
    halfAngleDeg: number,
    maxRange: number,
    isAlert: boolean,
  ): void {
    this.graphics.clear();
    const faceRad = facing === 'right' ? 0 : Math.PI;
    const halfRad = Phaser.Math.DegToRad(halfAngleDeg);
    const lx = fromX + Math.cos(faceRad - halfRad) * maxRange;
    const ly = fromY + Math.sin(faceRad - halfRad) * maxRange;
    const rx = fromX + Math.cos(faceRad + halfRad) * maxRange;
    const ry = fromY + Math.sin(faceRad + halfRad) * maxRange;
    const color = isAlert ? 0xffdd88 : 0xffffaa;
    const alpha = isAlert ? 0.13 : 0.08;
    this.graphics.fillStyle(color, alpha);
    this.graphics.fillTriangle(fromX, fromY, lx, ly, rx, ry);
  }

  clear(): void {
    this.graphics.clear();
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add src/game/entities/enemies/ConeOfVision.ts
git commit -m "feat: add ConeOfVision helper with angle check, wall-occlusion raycast, and visual"
```

---

### Task 3: GrannyMelee Base (PATROL · HURT · DEAD)

**Files:**
- Create: `src/game/entities/enemies/GrannyMelee.ts`

Implements the enemy class with patrol behaviour, damage/hurt reaction, death, and the public `alert()` hook. Uses the `pixel` texture placeholder (sprite added in Task 8).

- [ ] **Step 1: Create `src/game/entities/enemies/GrannyMelee.ts`**

```ts
import Phaser from 'phaser';
import { IDamageable } from '../../types/CombatTypes';
import { BALANCE } from '../../config/balanceConfig';
import { HealthBar } from '../../objects/HealthBar';
import { ConeOfVision } from './ConeOfVision';
import { Player } from '../Player';
import { GrappleSystem } from '../../systems/GrappleSystem';

type GrannyState = 'PATROL' | 'ALERT' | 'TELEGRAPH' | 'SWING' | 'RECOVERY' | 'HURT' | 'DEAD';

export class GrannyMelee extends Phaser.Physics.Arcade.Sprite implements IDamageable {
  private _state: GrannyState = 'PATROL';
  private health: number;
  private _facing: 'left' | 'right' = 'right';
  private everAlerted = false;

  // Patrol
  private readonly spawnX: number;
  private patrolDir: 1 | -1 = 1;
  private patrolPauseTimer = 0;   // ms remaining in current pause
  private patrolStepTimer = 2000; // ms until next random-pause roll

  // General state countdown timer
  private stateTimer = 0;

  // Detection
  private readonly cone: ConeOfVision;
  private readonly player: Player;
  private readonly groundLayer: Phaser.Tilemaps.TilemapLayer;
  private readonly shurikenGroup: Phaser.Physics.Arcade.Group;
  private readonly grappleSystem: GrappleSystem;

  // Visuals
  private readonly healthBar: HealthBar;

  // Attack hitbox — public so Level01Scene can wire it to the player overlap
  public readonly attackHitbox: Phaser.Physics.Arcade.Image;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: Player,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    shurikenGroup: Phaser.Physics.Arcade.Group,
    grappleSystem: GrappleSystem,
  ) {
    super(scene, x, y, 'pixel');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.spawnX    = x;
    this.player    = player;
    this.groundLayer = groundLayer;
    this.shurikenGroup = shurikenGroup;
    this.grappleSystem = grappleSystem;

    // Placeholder tinted rectangle (swapped to sprite in Task 8)
    this.setDisplaySize(48, 64);
    this.setTint(0xaa44ff);
    this.setDepth(10);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(BALANCE.GRAVITY);
    body.setSize(36, 60);
    body.setOffset(6, 2);

    this.health = BALANCE.GRANNY_HEALTH;
    this.healthBar = new HealthBar(scene, 48, -72);

    // Attack hitbox — disabled until SWING state
    this.attackHitbox = scene.physics.add.image(x, y, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    this.attackHitbox.setVisible(false);
    const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
    hb.setSize(80, 48);
    hb.enable = false;
    hb.setImmovable(true);
    hb.setAllowGravity(false);

    this.cone = new ConeOfVision(scene, groundLayer);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  getFacing(): 'left' | 'right' { return this._facing; }
  isAlerted(): boolean { return this.everAlerted; }

  /** Called by Level01Scene for external alert triggers (body detection, propagation). */
  alert(): void {
    if (this._state === 'DEAD') return;
    this.everAlerted = true;
    this.transitionTo('ALERT');
  }

  /** Returns true if a direct ray from this enemy to (x,y) is unoccluded. */
  hasLineOfSightTo(x: number, y: number): boolean {
    return this.cone.hasLineOfSight(this.x, this.y, x, y);
  }

  takeDamage(amount: number): void {
    if (!this.active) return;
    if (this._state === 'DEAD') return;

    this.health = Math.max(0, this.health - amount);
    this.healthBar.update(this.x, this.y, this.health, BALANCE.GRANNY_HEALTH);

    if (this.health <= 0) {
      this.transitionTo('DEAD');
      return;
    }

    this.transitionTo('HURT');
  }

  // ── Phaser update loop ───────────────────────────────────────────────────────

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active) return;

    switch (this._state) {
      case 'PATROL':   this.updatePatrol(delta);   break;
      case 'ALERT':    this.updateAlert();          break;
      case 'TELEGRAPH': this.updateTelegraph(delta); break;
      case 'SWING':    this.updateSwing(delta);     break;
      case 'RECOVERY': this.updateRecovery(delta);  break;
      case 'HURT':     this.updateHurt(delta);      break;
      case 'DEAD':     this.updateDead();           break;
    }

    this.updateAttackHitbox();
    this.healthBar.update(this.x, this.y, this.health, BALANCE.GRANNY_HEALTH);

    // Cone visual
    if (this._state !== 'DEAD') {
      const isAlert = this._state !== 'PATROL';
      const angle   = isAlert ? BALANCE.GRANNY_CONE_ALERT_ANGLE : BALANCE.GRANNY_CONE_PASSIVE_ANGLE;
      const range   = isAlert ? BALANCE.GRANNY_CONE_ALERT_RANGE : BALANCE.GRANNY_CONE_PASSIVE_RANGE;
      this.cone.draw(this.x, this.y, this._facing, angle, range, isAlert);
    } else {
      this.cone.clear();
    }
  }

  // ── State handlers ───────────────────────────────────────────────────────────

  private updatePatrol(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.patrolPauseTimer > 0) {
      this.patrolPauseTimer -= delta;
      body.setVelocityX(0);
      return;
    }

    // Endpoints
    const leftBound  = this.spawnX - BALANCE.GRANNY_PATROL_WIDTH;
    const rightBound = this.spawnX + BALANCE.GRANNY_PATROL_WIDTH;
    const atRight = this.patrolDir === 1  && this.x >= rightBound;
    const atLeft  = this.patrolDir === -1 && this.x <= leftBound;

    if (atRight || atLeft) {
      this.patrolDir = (this.patrolDir === 1 ? -1 : 1) as 1 | -1;
      this.setFacing(this.patrolDir === 1 ? 'right' : 'left');
      this.patrolPauseTimer = Phaser.Math.Between(800, 2000);
      body.setVelocityX(0);
      return;
    }

    // Walk
    body.setVelocityX(BALANCE.GRANNY_PATROL_SPEED * this.patrolDir);
    this.setFacing(this.patrolDir === 1 ? 'right' : 'left');

    // Random mid-patrol pause
    this.patrolStepTimer -= delta;
    if (this.patrolStepTimer <= 0) {
      this.patrolStepTimer = Phaser.Math.Between(1500, 3000);
      if (Math.random() < 0.25) {
        this.patrolPauseTimer = Phaser.Math.Between(500, 1500);
      }
    }
  }

  private updateAlert(): void {
    // Implemented in Task 4
  }

  private updateTelegraph(delta: number): void {
    // Implemented in Task 4
    this.stateTimer -= delta;
    if (this.stateTimer <= 0) this.transitionTo('SWING');
  }

  private updateSwing(delta: number): void {
    // Implemented in Task 4
    this.stateTimer -= delta;
    if (this.stateTimer <= 0) this.transitionTo('RECOVERY');
  }

  private updateRecovery(delta: number): void {
    // Implemented in Task 4
    this.stateTimer -= delta;
    if (this.stateTimer <= 0) this.transitionTo('ALERT');
  }

  private updateHurt(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.stateTimer -= delta;

    // Flash white
    const flash = Math.floor(this.stateTimer / 60) % 2 === 0;
    this.setTint(flash ? 0xffffff : 0xaa44ff);

    if (this.stateTimer <= 0) {
      this.setTint(0xaa44ff);
      this.transitionTo(this.everAlerted ? 'ALERT' : 'PATROL');
    }
  }

  private updateDead(): void {
    // Handled in transitionTo('DEAD') — nothing ongoing
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private updateAttackHitbox(): void {
    const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
    const offsetX = this._facing === 'right'
      ? this.x + BALANCE.GRANNY_ATTACK_RANGE / 2
      : this.x - BALANCE.GRANNY_ATTACK_RANGE / 2;
    this.attackHitbox.setPosition(offsetX, this.y);
    hb.reset(offsetX, this.y);
  }

  private setFacing(dir: 'left' | 'right'): void {
    this._facing = dir;
    this.setFlipX(dir === 'left');
  }

  private transitionTo(state: GrannyState): void {
    if (this._state === state) return;
    this._state = state;

    const body = this.body as Phaser.Physics.Arcade.Body;

    switch (state) {
      case 'HURT':
        this.stateTimer = BALANCE.GRANNY_HURT_MS;
        body.setVelocityX(0);
        break;

      case 'DEAD': {
        body.setVelocityX(0);
        body.setAllowGravity(false);
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
        this.cone.destroy();
        this.healthBar.destroy();
        // Emit for Level01Scene body-detection + propagation wiring
        this.scene.events.emit('enemy-died', { x: this.x, y: this.y });
        this.scene.time.delayedCall(600, () => {
          this.attackHitbox.destroy();
          this.destroy();
        });
        break;
      }

      case 'ALERT':
        this.everAlerted = true;
        this.scene.events.emit('enemy-alerted', { x: this.x, y: this.y });
        break;

      case 'TELEGRAPH':
        this.stateTimer = BALANCE.GRANNY_TELEGRAPH_MS;
        body.setVelocityX(0);
        break;

      case 'SWING':
        this.stateTimer = BALANCE.GRANNY_SWING_MS;
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = true;
        break;

      case 'RECOVERY':
        this.stateTimer = BALANCE.GRANNY_RECOVERY_MS;
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
        break;
    }
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add src/game/entities/enemies/GrannyMelee.ts
git commit -m "feat: GrannyMelee base — PATROL/HURT/DEAD states, health, attack hitbox placeholder"
```

---

### Task 4: GrannyMelee Attack States (ALERT · TELEGRAPH · SWING · RECOVERY)

**Files:**
- Modify: `src/game/entities/enemies/GrannyMelee.ts`

- [ ] **Step 1: Replace the stub `updateAlert()` with full implementation**

Replace this in `GrannyMelee.ts`:

```ts
  private updateAlert(): void {
    // Implemented in Task 4
  }
```

With:

```ts
  private updateAlert(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Face the player
    const dir = this.player.x >= this.x ? 'right' : 'left';
    this.setFacing(dir);

    // Check attack range
    const distToPlayer = Math.abs(this.player.x - this.x);
    if (distToPlayer <= BALANCE.GRANNY_ATTACK_RANGE) {
      this.transitionTo('TELEGRAPH');
      return;
    }

    // Chase
    const vx = BALANCE.GRANNY_ALERT_SPEED * (this.player.x >= this.x ? 1 : -1);
    body.setVelocityX(vx);
  }
```

- [ ] **Step 2: Replace the stubs for TELEGRAPH, SWING, RECOVERY with correct implementations**

Replace:

```ts
  private updateTelegraph(delta: number): void {
    // Implemented in Task 4
    this.stateTimer -= delta;
    if (this.stateTimer <= 0) this.transitionTo('SWING');
  }

  private updateSwing(delta: number): void {
    // Implemented in Task 4
    this.stateTimer -= delta;
    if (this.stateTimer <= 0) this.transitionTo('RECOVERY');
  }

  private updateRecovery(delta: number): void {
    // Implemented in Task 4
    this.stateTimer -= delta;
    if (this.stateTimer <= 0) this.transitionTo('ALERT');
  }
```

With:

```ts
  private updateTelegraph(delta: number): void {
    // Stop and wind up — hitbox still disabled
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    this.stateTimer -= delta;
    if (this.stateTimer <= 0) this.transitionTo('SWING');
  }

  private updateSwing(delta: number): void {
    // Hitbox enabled (set in transitionTo), stay still
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    this.stateTimer -= delta;
    if (this.stateTimer <= 0) this.transitionTo('RECOVERY');
  }

  private updateRecovery(delta: number): void {
    // Hitbox disabled (set in transitionTo), locked — punish window
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    this.stateTimer -= delta;
    if (this.stateTimer <= 0) this.transitionTo('ALERT');
  }
```

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: `✓ built in ...`

- [ ] **Step 4: Commit**

```bash
git add src/game/entities/enemies/GrannyMelee.ts
git commit -m "feat: GrannyMelee ALERT/TELEGRAPH/SWING/RECOVERY states"
```

---

### Task 5: Accessors on GrappleSystem and CombatSystem

**Files:**
- Modify: `src/game/systems/GrappleSystem.ts`
- Modify: `src/game/systems/CombatSystem.ts`

- [ ] **Step 1: Add `getHookPosition()` to GrappleSystem**

In `src/game/systems/GrappleSystem.ts`, add this method before `destroy()`:

```ts
  /** Returns the flying hook's current world position, or null if not in flight. */
  getHookPosition(): { x: number; y: number } | null {
    if (this.state !== 'FLYING' || !this.hook) return null;
    return { x: this.hook.x, y: this.hook.y };
  }
```

- [ ] **Step 2: Add `getShurikenGroup()` to CombatSystem**

In `src/game/systems/CombatSystem.ts`, add after the constructor:

```ts
  getShurikenGroup(): Phaser.Physics.Arcade.Group {
    return this.shurikenGroup;
  }
```

- [ ] **Step 3: Add behind-attack multiplier to CombatSystem**

In `src/game/systems/CombatSystem.ts`, add this import at the top (after existing imports):

```ts
import { GrannyMelee } from '../entities/enemies/GrannyMelee';
```

Then replace the claw-enemy overlap callback:

```ts
    // 1. Claw hits enemies — play front/behind hit sound once per swing
    scene.physics.add.overlap(
      player.clawHitbox,
      enemiesGroup,
      (_hitbox, enemyObj) => {
        const enemy = enemyObj as unknown as IDamageable;
        enemy.takeDamage(BALANCE.CLAW_DAMAGE);

        const now = scene.time.now;
        if (now - lastMeleeHitSoundTime > BALANCE.CLAW_COOLDOWN_MS * 0.8) {
          lastMeleeHitSoundTime = now;
          const enemyGO = enemyObj as unknown as { x: number };
          const facing = player.getFacing();
          const inFront = (facing === 'right' && enemyGO.x >= player.x) ||
                          (facing === 'left'  && enemyGO.x <= player.x);
          const keys = inFront
            ? ['melee_hitfront_1', 'melee_hitfront_2']
            : ['melee_hitbehind_1', 'melee_hitbehind_2', 'melee_hitbehind_3'];
          scene.sound.play(keys[Math.floor(Math.random() * keys.length)], { volume: 0.7 });
        }
      },
    );
```

With:

```ts
    // 1. Claw hits enemies — behind-attack multiplier for GrannyMelee; front/behind sound
    scene.physics.add.overlap(
      player.clawHitbox,
      enemiesGroup,
      (_hitbox, enemyObj) => {
        const enemy = enemyObj as unknown as IDamageable;

        // Behind-attack multiplier
        let damage = BALANCE.CLAW_DAMAGE;
        if (enemyObj instanceof GrannyMelee) {
          const grannyFacing = enemyObj.getFacing();
          const fromBehind = (grannyFacing === 'right' && player.x < enemyObj.x) ||
                             (grannyFacing === 'left'  && player.x > enemyObj.x);
          if (fromBehind) damage = BALANCE.CLAW_DAMAGE * BALANCE.GRANNY_BEHIND_MULTIPLIER;
        }
        enemy.takeDamage(damage);

        const now = scene.time.now;
        if (now - lastMeleeHitSoundTime > BALANCE.CLAW_COOLDOWN_MS * 0.8) {
          lastMeleeHitSoundTime = now;
          const enemyGO = enemyObj as unknown as { x: number };
          const facing = player.getFacing();
          const inFront = (facing === 'right' && enemyGO.x >= player.x) ||
                          (facing === 'left'  && enemyGO.x <= player.x);
          const keys = inFront
            ? ['melee_hitfront_1', 'melee_hitfront_2']
            : ['melee_hitbehind_1', 'melee_hitbehind_2', 'melee_hitbehind_3'];
          scene.sound.play(keys[Math.floor(Math.random() * keys.length)], { volume: 0.7 });
        }
      },
    );
```

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: `✓ built in ...`

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/GrappleSystem.ts src/game/systems/CombatSystem.ts
git commit -m "feat: GrappleSystem.getHookPosition(), CombatSystem.getShurikenGroup(), GrannyMelee behind-attack multiplier"
```

---

### Task 6: Alert Detection (Cone, Projectiles, Body, Propagation)

**Files:**
- Modify: `src/game/entities/enemies/GrannyMelee.ts`

- [ ] **Step 1: Add cone detection to `updatePatrol()`**

At the **top** of `updatePatrol()`, before the pause-timer check, add:

```ts
  private updatePatrol(delta: number): void {
    // Cone detection — player
    if (this.cone.check(
      this.x, this.y,
      this._facing,
      BALANCE.GRANNY_CONE_PASSIVE_ANGLE,
      BALANCE.GRANNY_CONE_PASSIVE_RANGE,
      this.player.x, this.player.y,
    )) {
      this.alert();
      return;
    }

    // Cone detection — shurikens
    const shurikens = this.shurikenGroup.getChildren();
    for (const obj of shurikens) {
      const s = obj as Phaser.GameObjects.Components.Transform & { active: boolean };
      if (!s.active) continue;
      if (this.cone.check(
        this.x, this.y,
        this._facing,
        BALANCE.GRANNY_CONE_PASSIVE_ANGLE,
        BALANCE.GRANNY_CONE_PASSIVE_RANGE,
        s.x, s.y,
      )) {
        this.alert();
        return;
      }
    }

    // Cone detection — grapple hook in flight
    const hookPos = this.grappleSystem.getHookPosition();
    if (hookPos && this.cone.check(
      this.x, this.y,
      this._facing,
      BALANCE.GRANNY_CONE_PASSIVE_ANGLE,
      BALANCE.GRANNY_CONE_PASSIVE_RANGE,
      hookPos.x, hookPos.y,
    )) {
      this.alert();
      return;
    }

    // … rest of existing patrol logic follows unchanged …
```

The rest of `updatePatrol()` (pause timer, endpoint check, walk, step timer) remains exactly as written in Task 3.

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add src/game/entities/enemies/GrannyMelee.ts
git commit -m "feat: GrannyMelee cone detection for player, shurikens, grapple hook"
```

---

### Task 7: Level01Scene Wiring

**Files:**
- Modify: `src/game/scenes/Level01Scene.ts`

This task replaces `DummyEnemy` spawn with `GrannyMelee`, re-orders system creation so `combatSystem` and `grappleSystem` exist before spawning enemies, wires the attack hitbox → player overlap, and wires body-detection + alert-propagation events.

- [ ] **Step 1: Update imports at the top of `Level01Scene.ts`**

Replace:
```ts
import { DummyEnemy } from '../entities/DummyEnemy';
```
With:
```ts
import { GrannyMelee } from '../entities/enemies/GrannyMelee';
```

- [ ] **Step 2: Add `grannies` field to the class**

After:
```ts
  private checkpoints: Checkpoint[] = [];
```
Add:
```ts
  private grannies: GrannyMelee[] = [];
```

- [ ] **Step 3: Re-order `create()` so systems exist before `spawnEnemies`**

In `create()`, move these three lines:

```ts
    // Spawn dummy enemies — ground surface = row 24 × 36px = 864; update positions after level is laid out
    const TEMP_GROUND_Y = 864;
    this.enemiesGroup = this.physics.add.group();
    this.spawnEnemies(TEMP_GROUND_Y);

    // Wire combat — pass ground layer instead of platforms StaticGroup
    this.combatSystem = new CombatSystem(this, this.player, ground, this.enemiesGroup);
```

So that `enemiesGroup`, `combatSystem`, and `grappleSystem` are all created **before** `spawnEnemies` is called. The new order in `create()` after the checkpoint block should be:

```ts
    // Enemies group (empty at first)
    this.enemiesGroup = this.physics.add.group();

    // Combat system — must exist before spawning so getShurikenGroup() is available
    this.combatSystem = new CombatSystem(this, this.player, ground, this.enemiesGroup);

    // Grapple system — must exist before spawning so getHookPosition() is available
    this.grapple = new GrappleSystem(this, this.player, ground, this.enemiesGroup);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Spawn enemies — after combat + grapple exist
    const TEMP_GROUND_Y = 864;
    this.spawnEnemies(TEMP_GROUND_Y, ground);
```

Also remove the original `this.grapple = new GrappleSystem(...)` line that appeared later in the old `create()`.

- [ ] **Step 4: Rewrite `spawnEnemies` to use GrannyMelee**

Replace the entire `spawnEnemies` private method:

```ts
  private spawnEnemies(groundY: number, groundLayer: Phaser.Tilemaps.TilemapLayer): void {
    const spawnY = groundY - 32; // centre of body (64px tall, bottom on ground)
    const positions = [
      { x: 400,  y: spawnY },
      { x: 800,  y: spawnY },
      { x: 1300, y: spawnY },
      { x: 1900, y: spawnY },
      { x: 2400, y: spawnY },
    ];

    positions.forEach(({ x, y }) => {
      const granny = new GrannyMelee(
        this,
        x, y,
        this.player,
        groundLayer,
        this.combatSystem.getShurikenGroup(),
        this.grapple,
      );
      this.enemiesGroup.add(granny);
      this.grannies.push(granny);

      // Wire granny attack hitbox → player damage
      this.physics.add.overlap(
        granny.attackHitbox,
        this.player,
        () => {
          if ((granny.attackHitbox.body as Phaser.Physics.Arcade.Body).enable) {
            this.player.takeDamage(BALANCE.GRANNY_ATTACK_DAMAGE);
          }
        },
      );

      // Collide granny with ground so she walks on platforms
      this.physics.add.collider(granny, groundLayer);
    });

    // Body-detection alert: when a granny dies, nearby grannies with LOS become alert
    this.events.on('enemy-died', ({ x, y }: { x: number; y: number }) => {
      this.grannies.forEach(g => {
        if (!g.active || g.isAlerted()) return;
        const dist = Phaser.Math.Distance.Between(g.x, g.y, x, y);
        if (dist <= BALANCE.GRANNY_BODY_ALERT_RADIUS && g.hasLineOfSightTo(x, y)) {
          g.alert();
        }
      });
    });

    // Alert propagation: when any granny becomes alert, nearby passive grannies also alert
    this.events.on('enemy-alerted', ({ x, y }: { x: number; y: number }) => {
      this.grannies.forEach(g => {
        if (!g.active || g.isAlerted()) return;
        const dist = Phaser.Math.Distance.Between(g.x, g.y, x, y);
        if (dist <= BALANCE.GRANNY_PROPAGATION_RADIUS) {
          g.alert();
        }
      });
    });
  }
```

- [ ] **Step 5: Fix the `shutdown` event — `grapple.destroy()` is already called, nothing new needed**

The existing shutdown handler already calls `this.grapple.destroy()`. Because `grapple` is now created earlier in the method, confirm it still exists in the shutdown handler and nothing else needs changing.

- [ ] **Step 6: Build**

```bash
npm run build
```
Expected: `✓ built in ...`

- [ ] **Step 7: Smoke-test in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected:
- Purple rectangles patrol back and forth
- Hitting a granny with J/Shift depletes her health bar; 3rd hit from behind one-shots (60 HP × 3 = 180 damage > 60)
- Granny charges player once alerted, stops to wind up, swings, goes into recovery
- Player takes damage if standing inside the swing hitbox
- Shooting a shuriken past a granny alerts her
- Killing one granny causes nearby passive grannies (within 300px with LOS) to alert
- Alert propagates to grannies within 250px of the newly alerted one

- [ ] **Step 8: Commit**

```bash
git add src/game/scenes/Level01Scene.ts
git commit -m "feat: wire GrannyMelee into Level01Scene — spawn, attack overlap, body detection, alert propagation"
```

---

### Task 8: Sprite and Animations

**Files:**
- Modify: `src/game/scenes/PreloadScene.ts`
- Modify: `src/game/entities/enemies/GrannyMelee.ts`

The spritesheet `Sprites EvilGrandma TRex.png` uses 64×64 px frames, 16 frames per row. Evil Grandma occupies rows 0–6:

| Row | Frame range | Label |
|---|---|---|
| 0 | 0–3 | Idle loop A |
| 1 | 16–19 | Idle loop B |
| 2 | 32–39 | Walk |
| 3 | 48–55 | Nunchuk swing (wind-up) |
| 4 | 64–71 | Nunchuk swing (follow-through) |
| 5 | 80–83 | Damage / hurt |
| 6 | 96–103 | Death |

- [ ] **Step 1: Load `evilgranny` spritesheet in PreloadScene**

In `src/game/scenes/PreloadScene.ts`, in the `preload()` method, after the existing `this.load.spritesheet('catninja', ...)` call add:

```ts
    this.load.spritesheet('evilgranny',
      'assets/Sprites/Sprites EvilGrandma TRex.png',
      { frameWidth: 64, frameHeight: 64 },
    );
```

- [ ] **Step 2: Register Granny animations in `createAnimations()`**

In `src/game/scenes/PreloadScene.ts`, inside `createAnimations()`, after the existing `claw` animation block add:

```ts
    // --- Evil Granny ---
    anims.create({
      key: 'granny_idle',
      frames: anims.generateFrameNumbers('evilgranny', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
    anims.create({
      key: 'granny_walk',
      frames: anims.generateFrameNumbers('evilgranny', { start: 32, end: 39 }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'granny_telegraph',
      frames: anims.generateFrameNumbers('evilgranny', { start: 48, end: 55 }),
      frameRate: 10,
      repeat: 0,
    });
    anims.create({
      key: 'granny_swing',
      frames: anims.generateFrameNumbers('evilgranny', { start: 64, end: 71 }),
      frameRate: 14,
      repeat: 0,
    });
    anims.create({
      key: 'granny_hurt',
      frames: anims.generateFrameNumbers('evilgranny', { start: 80, end: 83 }),
      frameRate: 10,
      repeat: 0,
    });
    anims.create({
      key: 'granny_dead',
      frames: anims.generateFrameNumbers('evilgranny', { start: 96, end: 103 }),
      frameRate: 8,
      repeat: 0,
    });
```

- [ ] **Step 3: Update GrannyMelee constructor to use `evilgranny` texture**

In `src/game/entities/enemies/GrannyMelee.ts`, in the constructor, replace:

```ts
    // Placeholder tinted rectangle (swapped to sprite in Task 8)
    this.setDisplaySize(48, 64);
    this.setTint(0xaa44ff);
    this.setDepth(10);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(BALANCE.GRAVITY);
    body.setSize(36, 60);
    body.setOffset(6, 2);
```

With:

```ts
    this.setTexture('evilgranny');
    this.setScale(2);
    this.setDepth(10);
    this.play('granny_idle');

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(BALANCE.GRAVITY);
    body.setSize(36, 60);
    body.setOffset(14, 4); // centres body on the scaled 128×128 visual
```

Also update the `super()` call in the constructor from `'pixel'` to `'evilgranny'`:

```ts
    super(scene, x, y, 'evilgranny');
```

- [ ] **Step 4: Add animation calls to state handlers**

In `updatePatrol()`, in the pause-timer block change velocity line to also play idle, and in the walk block play walk:

```ts
  private updatePatrol(delta: number): void {
    // … (cone detection at top unchanged) …

    if (this.patrolPauseTimer > 0) {
      this.patrolPauseTimer -= delta;
      body.setVelocityX(0);
      this.play('granny_idle', true);
      return;
    }
    // … endpoint check unchanged …
    // In the walk section, replace the setVelocityX line + add:
    body.setVelocityX(BALANCE.GRANNY_PATROL_SPEED * this.patrolDir);
    this.setFacing(this.patrolDir === 1 ? 'right' : 'left');
    this.play('granny_walk', true);
    // … step timer unchanged …
  }
```

In `updateAlert()`, add walk animation:

```ts
  private updateAlert(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dir = this.player.x >= this.x ? 'right' : 'left';
    this.setFacing(dir);
    const distToPlayer = Math.abs(this.player.x - this.x);
    if (distToPlayer <= BALANCE.GRANNY_ATTACK_RANGE) {
      this.transitionTo('TELEGRAPH');
      return;
    }
    body.setVelocityX(BALANCE.GRANNY_ALERT_SPEED * (this.player.x >= this.x ? 1 : -1));
    this.play('granny_walk', true);
  }
```

In `updateHurt()`, replace the tint colours with proper tint/clearTint and fix the hurt flash — also remove the 0xaa44ff references since Granny now uses a real sprite:

```ts
  private updateHurt(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.play('granny_hurt', true);
    this.stateTimer -= delta;
    const flash = Math.floor(this.stateTimer / 60) % 2 === 0;
    this.setTint(flash ? 0xffffff : 0xdddddd);
    if (this.stateTimer <= 0) {
      this.clearTint();
      this.transitionTo(this.everAlerted ? 'ALERT' : 'PATROL');
    }
  }
```

In `transitionTo()`, add animation calls to TELEGRAPH, SWING, RECOVERY, and DEAD cases:

```ts
      case 'TELEGRAPH':
        this.stateTimer = BALANCE.GRANNY_TELEGRAPH_MS;
        body.setVelocityX(0);
        this.play('granny_telegraph', true);
        break;

      case 'SWING':
        this.stateTimer = BALANCE.GRANNY_SWING_MS;
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = true;
        this.play('granny_swing', true);
        break;

      case 'RECOVERY':
        this.stateTimer = BALANCE.GRANNY_RECOVERY_MS;
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
        break;

      case 'DEAD':
        // … existing code unchanged …
        this.play('granny_dead', true);
        break;
```

- [ ] **Step 5: Build**

```bash
npm run build
```
Expected: `✓ built in ...`

- [ ] **Step 6: Smoke-test in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected:
- Grannies use the evil grandma sprite and play walk/idle/swing/hurt/death animations
- All behaviour from Task 7 still works (patrol, alert, attack, propagation)
- If any animation frame numbers look wrong (e.g. wrong row plays), adjust the `start`/`end` values in `createAnimations()` and rebuild

- [ ] **Step 7: Commit**

```bash
git add src/game/scenes/PreloadScene.ts src/game/entities/enemies/GrannyMelee.ts
git commit -m "feat: GrannyMelee sprite and animations — evilgranny sheet, walk/idle/swing/hurt/dead"
```
