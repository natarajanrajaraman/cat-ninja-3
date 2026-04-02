# Prompt 5 — Combat Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first combat prototype — claw strike (J), mouse-aimed shuriken (left-click), ammo counter in UIScene, DummyEnemy with floating HP bar, Level 1 music.

**Architecture:** CombatSystem (plain TypeScript class, not a Phaser scene) is owned by Level01Scene and wires all overlap detection. Player exposes `clawHitbox` and `consumeAmmo()`. All entities implement `IDamageable`. Inter-scene comms (ammo counter) use the global Phaser game event bus (`this.game.events`).

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript strict mode, Vite (no test runner — validate via `npm run build` + browser playtest).

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `src/game/types/CombatTypes.ts` | `IDamageable` interface |
| Create | `src/game/objects/HealthBar.ts` | Reusable floating HP bar (Graphics-based) |
| Create | `src/game/entities/Shuriken.ts` | Projectile — arc physics, spin anim, random SFX |
| Create | `src/game/entities/DummyEnemy.ts` | Static placeholder enemy with health, flash-on-hit, HealthBar |
| Create | `src/game/systems/CombatSystem.ts` | Overlap setup, shuriken pool, damage routing |
| Modify | `src/game/config/balanceConfig.ts` | Add all combat tuning values |
| Modify | `src/game/entities/Player.ts` | Attack overlay (timer-based), clawHitbox, ammo |
| Modify | `src/game/scenes/PreloadScene.ts` | Load shuriken sheet, all SFX, music; pixel texture; shuriken_spin + claw anims |
| Modify | `src/game/scenes/Level01Scene.ts` | Create CombatSystem, spawn enemies, left-click fire, music |
| Modify | `src/game/scenes/UIScene.ts` | Ammo counter listening on game event bus |

---

### Task 1: balanceConfig additions + CombatTypes.ts

**Files:**
- Modify: `src/game/config/balanceConfig.ts`
- Create: `src/game/types/CombatTypes.ts`

- [ ] **Step 1: Add combat values to balanceConfig.ts**

Open `src/game/config/balanceConfig.ts`. Add the following block inside the `BALANCE` object, after the `WALL_GRACE_TIME` line:

```ts
  // --- Claw ---
  CLAW_DAMAGE: 25,
  CLAW_ACTIVE_MS: 150,       // how long hitbox is live
  CLAW_RECOVERY_MS: 200,     // locked-out after active window
  CLAW_COOLDOWN_MS: 400,     // full cooldown from press to next press
  CLAW_RANGE: 60,            // hitbox width in front of player

  // --- Shuriken ---
  SHURIKEN_DAMAGE: 15,
  SHURIKEN_SPEED: 800,       // px/s initial velocity
  SHURIKEN_GRAVITY: 400,     // lighter than player gravity for parabolic arc
  SHURIKEN_FIRE_COOLDOWN: 250, // ms between shots
  SHURIKEN_MAX_AMMO: 10,
  SHURIKEN_LIFETIME: 2500,   // ms before auto-destroy if no hit

  // --- Dummy enemy ---
  DUMMY_HEALTH: 50,
```

- [ ] **Step 2: Create CombatTypes.ts**

Create `src/game/types/CombatTypes.ts` with:

```ts
export interface IDamageable {
  takeDamage(amount: number): void;
}
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: Build completes with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/game/config/balanceConfig.ts src/game/types/CombatTypes.ts
git commit -m "feat: add combat balance values and IDamageable interface"
```

---

### Task 2: HealthBar

**Files:**
- Create: `src/game/objects/HealthBar.ts`

- [ ] **Step 1: Create HealthBar.ts**

Create `src/game/objects/HealthBar.ts`:

```ts
import Phaser from 'phaser';

export class HealthBar {
  private graphics: Phaser.GameObjects.Graphics;
  private width: number;
  private yOffset: number;

  constructor(scene: Phaser.Scene, width: number, yOffset: number) {
    this.width = width;
    this.yOffset = yOffset;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);
  }

  update(x: number, y: number, current: number, max: number): void {
    this.graphics.clear();

    // Hide when full health
    if (current >= max) return;

    const pct = Math.max(0, current / max);
    const barX = x - this.width / 2;
    const barY = y + this.yOffset;

    // Background bar (dark gray)
    this.graphics.fillStyle(0x333333);
    this.graphics.fillRect(barX, barY, this.width, 6);

    // Fill bar — color based on percentage
    const fillColor = pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffff00 : 0xff4444;
    this.graphics.fillStyle(fillColor);
    this.graphics.fillRect(barX, barY, Math.floor(this.width * pct), 6);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/objects/HealthBar.ts
git commit -m "feat: add reusable HealthBar graphics class"
```

---

### Task 3: PreloadScene — sprites, SFX, music, pixel texture, animations

**Files:**
- Modify: `src/game/scenes/PreloadScene.ts`

**Context:** The CatNinja sprite sheet is 64×64 per frame, 16 frames per row. Row 5 = frames 80–95, row 6 = frames 96–111. The shuriken sprite sheet is at `assets/Sprites/Sprites Shuriken.png` — inspect its pixel dimensions to determine frame size. A 64×64 starting assumption is reasonable; adjust if it looks wrong in-browser.

- [ ] **Step 1: Add shuriken sprite load + all audio loads to preload()**

Replace the entire `preload()` method with:

```ts
preload(): void {
  const { width, height } = this.scale;
  this.add
    .text(width / 2, height / 2, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff',
    })
    .setOrigin(0.5);

  // CatNinja (already loaded)
  this.load.spritesheet('catninja', 'assets/Sprites/Sprites CatNinja.png', {
    frameWidth: 64,
    frameHeight: 64,
  });

  // Shuriken sprite sheet — inspect image if anim looks wrong (try 64x64 first)
  this.load.spritesheet('shuriken', 'assets/Sprites/Sprites Shuriken.png', {
    frameWidth: 64,
    frameHeight: 64,
  });

  // Shuriken launch SFX
  this.load.audio('shuriken_1', 'assets/SoundEffects/shuriken launch/sword.1.ogg');
  this.load.audio('shuriken_2', 'assets/SoundEffects/shuriken launch/sword.2.ogg');
  this.load.audio('shuriken_3', 'assets/SoundEffects/shuriken launch/sword.3.ogg');
  this.load.audio('shuriken_4', 'assets/SoundEffects/shuriken launch/sword.4.ogg');
  this.load.audio('shuriken_5', 'assets/SoundEffects/shuriken launch/sword.5.ogg');

  // Claw SFX
  this.load.audio('claw_1', 'assets/SoundEffects/claw launch/Socapex - Monster_Hurt.wav');
  this.load.audio('claw_2', 'assets/SoundEffects/claw launch/Socapex - new_hits_2.wav');
  this.load.audio('claw_3', 'assets/SoundEffects/claw launch/Socapex - new_hits_5.wav');
  this.load.audio('claw_4', 'assets/SoundEffects/claw launch/Socapex - new_hits_7.wav');
  this.load.audio('claw_5', 'assets/SoundEffects/claw launch/Socapex - new_hits_8.wav');

  // Level 1 music
  this.load.audio('music_level1', 'assets/Music/BlackTrendMusic - Sport Games.mp3');
}
```

- [ ] **Step 2: Generate pixel texture in create()**

Replace the `create()` method with:

```ts
create(): void {
  // 1×1 white pixel texture used by DummyEnemy (tinted at runtime)
  const pixelData = this.textures.generate('pixel', {
    data: ['#'],
    pixelWidth: 1,
  });
  void pixelData; // suppress unused-variable warning

  this.createAnimations();
  this.scene.start('MenuScene');
}
```

- [ ] **Step 3: Add shuriken_spin and claw animations to createAnimations()**

At the end of `createAnimations()`, after the `'dead'` animation, add:

```ts
// --- Shuriken spin (all frames, fast loop) ---
// Sheet is 2816×1536 at 64×64 = 44 cols × 24 rows = 1056 frames.
// We use frames 0–15 (first row) for a 16-frame spin; adjust if it looks wrong.
anims.create({
  key: 'shuriken_spin',
  frames: anims.generateFrameNumbers('shuriken', { start: 0, end: 15 }),
  frameRate: 16,
  repeat: -1,
});

// --- Claw attack: CatNinja rows 5–6 ---
// Row 5 = frames 80–95, row 6 = frames 96–111 (64px wide, 16 per row).
// Use first 4 frames of row 5 (80–83) as a minimal claw strike; extend if row has more distinct frames.
anims.create({
  key: 'claw',
  frames: anims.generateFrameNumbers('catninja', { start: 80, end: 83 }),
  frameRate: 16,
  repeat: 0,
});
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: Build completes with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/game/scenes/PreloadScene.ts
git commit -m "feat: load shuriken sprite, SFX, music; add pixel texture and combat animations"
```

---

### Task 4: Shuriken entity

**Files:**
- Create: `src/game/entities/Shuriken.ts`

**Context:** Shuriken is a physics sprite with custom gravity (lighter than player for parabolic arc). Velocity is set by CombatSystem using normalized direction. Random launch SFX from the 5 shuriken keys. Auto-destroys after `SHURIKEN_LIFETIME` ms.

- [ ] **Step 1: Create Shuriken.ts**

Create `src/game/entities/Shuriken.ts`:

```ts
import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';

const LAUNCH_SOUNDS = ['shuriken_1', 'shuriken_2', 'shuriken_3', 'shuriken_4', 'shuriken_5'];

export class Shuriken extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'shuriken');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setGravityY(BALANCE.SHURIKEN_GRAVITY);

    this.play('shuriken_spin');

    // Random launch sound
    const key = LAUNCH_SOUNDS[Math.floor(Math.random() * LAUNCH_SOUNDS.length)];
    scene.sound.play(key, { volume: 0.6 });

    // Auto-destroy after lifetime
    scene.time.delayedCall(BALANCE.SHURIKEN_LIFETIME, () => {
      if (this.active) this.destroy();
    });
  }

  setVelocityToward(fromX: number, fromY: number, toX: number, toY: number): void {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      (dx / len) * BALANCE.SHURIKEN_SPEED,
      (dy / len) * BALANCE.SHURIKEN_SPEED,
    );
  }
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/entities/Shuriken.ts
git commit -m "feat: add Shuriken entity with arc physics and random SFX"
```

---

### Task 5: DummyEnemy

**Files:**
- Create: `src/game/entities/DummyEnemy.ts`

**Context:** DummyEnemy uses the `'pixel'` texture (1×1 white pixel generated in PreloadScene), tinted red, scaled to 48×64. It implements `IDamageable`. It owns a `HealthBar` updated each `preUpdate`. Body is immovable so the physics group doesn't shove it around.

- [ ] **Step 1: Create DummyEnemy.ts**

Create `src/game/entities/DummyEnemy.ts`:

```ts
import Phaser from 'phaser';
import { IDamageable } from '../types/CombatTypes';
import { HealthBar } from '../objects/HealthBar';
import { BALANCE } from '../config/balanceConfig';

export class DummyEnemy extends Phaser.Physics.Arcade.Sprite implements IDamageable {
  private health: number;
  private healthBar: HealthBar;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'pixel');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(48, 64);
    this.setTint(0xff4444);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);

    this.health = BALANCE.DUMMY_HEALTH;
    this.healthBar = new HealthBar(scene, 48, -40);
  }

  takeDamage(amount: number): void {
    if (!this.active) return;
    this.health -= amount;

    // Flash white briefly
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.setTint(0xff4444);
    });

    this.healthBar.update(this.x, this.y, this.health, BALANCE.DUMMY_HEALTH);

    if (this.health <= 0) {
      this.healthBar.destroy();
      this.destroy();
    }
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.active) {
      this.healthBar.update(this.x, this.y, this.health, BALANCE.DUMMY_HEALTH);
    }
  }
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/entities/DummyEnemy.ts
git commit -m "feat: add DummyEnemy with health, flash-on-hit, and floating HealthBar"
```

---

### Task 6: CombatSystem

**Files:**
- Create: `src/game/systems/CombatSystem.ts`

**Context:** CombatSystem is a plain TypeScript class (not a scene or Phaser GameObject). It owns the shuriken group and wires all three overlaps. It is constructed in Level01Scene.create() after the player and enemies exist. `fireShuriken` creates a Shuriken and sets its velocity toward the world-space target pointer position.

- [ ] **Step 1: Create CombatSystem.ts**

Create `src/game/systems/CombatSystem.ts`:

```ts
import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Shuriken } from '../entities/Shuriken';
import { IDamageable } from '../types/CombatTypes';
import { BALANCE } from '../config/balanceConfig';

export class CombatSystem {
  private scene: Phaser.Scene;
  private shurikenGroup: Phaser.Physics.Arcade.Group;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    platformsGroup: Phaser.Physics.Arcade.StaticGroup,
    enemiesGroup: Phaser.Physics.Arcade.Group,
  ) {
    this.scene = scene;

    this.shurikenGroup = scene.physics.add.group({
      classType: Shuriken,
      runChildUpdate: true,
    });

    // 1. Claw hits enemies
    scene.physics.add.overlap(
      player.clawHitbox,
      enemiesGroup,
      (_hitbox, enemyObj) => {
        const enemy = enemyObj as unknown as IDamageable;
        enemy.takeDamage(BALANCE.CLAW_DAMAGE);
      },
    );

    // 2. Shurikens hit enemies
    scene.physics.add.overlap(
      this.shurikenGroup,
      enemiesGroup,
      (shurikenObj, enemyObj) => {
        const shuriken = shurikenObj as Shuriken;
        const enemy = enemyObj as unknown as IDamageable;
        if (shuriken.active) {
          enemy.takeDamage(BALANCE.SHURIKEN_DAMAGE);
          shuriken.destroy();
        }
      },
    );

    // 3. Shurikens hit platforms
    scene.physics.add.overlap(
      this.shurikenGroup,
      platformsGroup,
      (shurikenObj) => {
        const shuriken = shurikenObj as Shuriken;
        if (shuriken.active) shuriken.destroy();
      },
    );
  }

  fireShuriken(fromX: number, fromY: number, worldX: number, worldY: number): void {
    const shuriken = new Shuriken(this.scene, fromX, fromY);
    this.shurikenGroup.add(shuriken, true);
    shuriken.setVelocityToward(fromX, fromY, worldX, worldY);
  }
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/systems/CombatSystem.ts
git commit -m "feat: add CombatSystem with shuriken pool and overlap wiring"
```

---

### Task 7: Player — claw attack overlay and ammo

**Files:**
- Modify: `src/game/entities/Player.ts`

**Context:** The claw attack is NOT a new state machine state — it's a timer-based overlay. `attackTimer` and `clawCooldownTimer` tick in `updateTimers`. The `clawHitbox` is a separate `Phaser.Physics.Arcade.Image` created in the constructor, always repositioned in front of the player, disabled by default. The `J` key is added to the `PlayerKeys` interface and passed in from Level01Scene. Ammo fields go alongside the claw fields.

- [ ] **Step 1: Update PlayerKeys in PlayerTypes.ts**

Open `src/game/types/PlayerTypes.ts`. Add `attack` to the `PlayerKeys` interface:

```ts
export interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
}
```

- [ ] **Step 2: Add new fields to Player class**

In `Player.ts`, after the `private readonly keys: PlayerKeys;` line, add:

```ts
  // --- Claw attack overlay ---
  private attackTimer: number = 0;
  private clawCooldownTimer: number = 0;
  public clawHitbox!: Phaser.Physics.Arcade.Image;

  // --- Shuriken ammo ---
  private ammo: number = 0; // initialized to SHURIKEN_MAX_AMMO in constructor
  private shurikenCooldownTimer: number = 0;
```

- [ ] **Step 3: Initialize clawHitbox and ammo in constructor**

In the `constructor`, after `this.play('idle');`, add:

```ts
    // Claw hitbox — invisible, disabled until attack fires
    this.clawHitbox = scene.physics.add.image(x, y, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    this.clawHitbox.setVisible(false);
    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).setSize(
      BALANCE.CLAW_RANGE,
      36,
    );
    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).enable = false;

    this.ammo = BALANCE.SHURIKEN_MAX_AMMO;
```

- [ ] **Step 4: Update updateTimers() to tick new timers**

Replace `updateTimers()` with:

```ts
  private updateTimers(delta: number): void {
    this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    this.wallGraceTimer = Math.max(0, this.wallGraceTimer - delta);
    this.attackTimer = Math.max(0, this.attackTimer - delta);
    this.clawCooldownTimer = Math.max(0, this.clawCooldownTimer - delta);
    this.shurikenCooldownTimer = Math.max(0, this.shurikenCooldownTimer - delta);
    // dashCooldownTimer does NOT count down in the air — dash refreshes only on landing
  }
```

- [ ] **Step 5: Add handleAttackInput() method**

Add a new private method after `handleDashInput()`:

```ts
  private handleAttackInput(): void {
    if (this.clawCooldownTimer > 0) return;
    if (!Phaser.Input.Keyboard.JustDown(this.keys.attack)) return;

    this.attackTimer = BALANCE.CLAW_ACTIVE_MS + BALANCE.CLAW_RECOVERY_MS;
    this.clawCooldownTimer = BALANCE.CLAW_COOLDOWN_MS;

    // Enable hitbox
    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).enable = true;

    // Play random claw sound
    this.playRandomSound(['claw_1', 'claw_2', 'claw_3', 'claw_4', 'claw_5']);

    // Play claw animation
    this.play('claw', true);
  }
```

- [ ] **Step 6: Add playRandomSound() helper method**

Add after `handleAttackInput()`:

```ts
  private playRandomSound(keys: string[]): void {
    const key = keys[Math.floor(Math.random() * keys.length)];
    this.scene.sound.play(key, { volume: 0.7 });
  }
```

- [ ] **Step 7: Add getAmmo() and consumeAmmo() public methods**

Add after `playRandomSound()`:

```ts
  getAmmo(): number {
    return this.ammo;
  }

  /** Returns false if ammo is 0 or fire cooldown is active. On success, decrements ammo. */
  consumeAmmo(): boolean {
    if (this.ammo <= 0) return false;
    if (this.shurikenCooldownTimer > 0) return false;
    this.ammo -= 1;
    this.shurikenCooldownTimer = BALANCE.SHURIKEN_FIRE_COOLDOWN;
    return true;
  }
```

- [ ] **Step 8: Wire handleAttackInput() and clawHitbox repositioning into update()**

Replace the `update()` method with:

```ts
  update(delta: number): void {
    this.updateTimers(delta);

    if (this.isInState(PlayerState.DASH)) {
      this.updateDash();
    } else {
      this.handleJumpInput();
      this.handleDashInput();
      this.handleAttackInput();
      this.handleHorizontalMovement();
      this.updatePhysicsState();
    }

    this.updateFacing();
    this.updateClawHitbox();
    this.updateAnimation();
  }
```

- [ ] **Step 9: Add updateClawHitbox() method**

Add after `updateDash()`:

```ts
  private updateClawHitbox(): void {
    const body = this.clawHitbox.body as Phaser.Physics.Arcade.Body;

    // Disable hitbox once active window expires
    if (this.attackTimer <= BALANCE.CLAW_RECOVERY_MS) {
      body.enable = false;
    }

    // Reposition hitbox in front of player each frame
    const offsetX = this.facing === 'right'
      ? this.x + BALANCE.CLAW_RANGE / 2
      : this.x - BALANCE.CLAW_RANGE / 2;
    this.clawHitbox.setPosition(offsetX, this.y);
    body.reset(offsetX, this.y);
  }
```

- [ ] **Step 10: Update updateAnimation() to check attackTimer first**

Replace the `updateAnimation()` method with:

```ts
  private updateAnimation(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Claw animation overrides all movement animations during the strike window
    if (this.attackTimer > BALANCE.CLAW_RECOVERY_MS) {
      this.play('claw', true);
      return;
    }

    switch (this._state) {
      case PlayerState.IDLE:
        this.play('idle', true);
        break;
      case PlayerState.RUN:
        this.play('walk', true);
        break;
      case PlayerState.JUMP:
        if (body.velocity.y < -200) {
          this.play('jump_start', true);
        } else {
          this.play('jump_air', true);
        }
        break;
      case PlayerState.FALL:
        if (body.velocity.y > 100) {
          this.play('jump_fall', true);
        } else {
          this.play('jump_air', true);
        }
        break;
      case PlayerState.DOUBLE_JUMP:
        if (this.anims.currentAnim?.key === 'spin_start' && this.anims.currentFrame?.isLast) {
          this.play('spin_air', true);
        } else if (this.anims.currentAnim?.key !== 'spin_start') {
          this.play('spin_air', true);
        }
        break;
      case PlayerState.WALL_SLIDE:
        this.play('jump_air', true);
        this.setFlipX(this.lastWallDirection === 'right');
        break;
      case PlayerState.WALL_JUMP:
        this.play('jump_start', true);
        break;
      case PlayerState.DASH:
        this.play('dash', true);
        break;
      case PlayerState.DEAD:
        this.play('dead', true);
        break;
    }
  }
```

- [ ] **Step 11: Also reset attack state in respawn()**

In the `respawn()` method, after `this.lastWallDirection = null;`, add:

```ts
    this.attackTimer = 0;
    this.clawCooldownTimer = 0;
    this.shurikenCooldownTimer = 0;
    this.ammo = BALANCE.SHURIKEN_MAX_AMMO;
    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
```

- [ ] **Step 12: Build check**

Run: `npm run build`
Expected: Build completes with no TypeScript errors.

- [ ] **Step 13: Commit**

```bash
git add src/game/types/PlayerTypes.ts src/game/entities/Player.ts
git commit -m "feat: add claw attack overlay, clawHitbox, ammo system to Player"
```

---

### Task 8: Level01Scene — combat wiring, enemies, music

**Files:**
- Modify: `src/game/scenes/Level01Scene.ts`

**Context:** The `J` key must be added to the `keys` object and passed to Player. `CombatSystem` is constructed after both the player and enemies group exist. Left-click fires shurikens via `pointer.leftButtonJustPressed()`. Music starts once in `create()`. `enemiesGroup` must be a dynamic group with each enemy body set immovable (done inside DummyEnemy already). The `'ammo-changed'` event emitted on the global `this.game.events` bus.

- [ ] **Step 1: Update the full Level01Scene.ts**

Replace the entire content of `src/game/scenes/Level01Scene.ts` with:

```ts
import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { DummyEnemy } from '../entities/DummyEnemy';
import { CombatSystem } from '../systems/CombatSystem';
import { INPUT } from '../config/inputConfig';
import { BALANCE } from '../config/balanceConfig';

export class Level01Scene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private combatSystem!: CombatSystem;
  private spawnX = 96;
  private spawnY = 804;

  constructor() {
    super({ key: 'Level01Scene' });
  }

  create(): void {
    const WORLD_W = 3200;
    const WORLD_H = 900;
    const GROUND_Y = 836; // top of ground surface

    // World + camera bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // Dark background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Build platforms
    this.platforms = this.physics.add.staticGroup();
    this.buildGrayboxRoom(GROUND_Y, WORLD_W);

    // Input
    const keys = this.input.keyboard!.addKeys({
      left: INPUT.MOVE_LEFT,
      right: INPUT.MOVE_RIGHT,
      jump: INPUT.JUMP,
      dash: INPUT.DASH,
      attack: INPUT.ATTACK,
    }) as {
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
      jump: Phaser.Input.Keyboard.Key;
      dash: Phaser.Input.Keyboard.Key;
      attack: Phaser.Input.Keyboard.Key;
    };

    // Create player
    this.player = new Player(this, this.spawnX, this.spawnY, keys);

    // Collide player with platforms
    this.physics.add.collider(this.player, this.platforms);

    // Spawn dummy enemies
    this.enemiesGroup = this.physics.add.group();
    this.spawnEnemies(GROUND_Y);

    // Wire combat
    this.combatSystem = new CombatSystem(this, this.player, this.platforms, this.enemiesGroup);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Layout labels
    this.addLabel(200, GROUND_Y - 80, 'START\nrun here');
    this.addLabel(490, GROUND_Y - 80, '← 120px\njump gap');
    this.addLabel(840, GROUND_Y - 80, '← 160px\nrunning jump');
    this.addLabel(1220, GROUND_Y - 80, '← 220px\nDASH ONLY');
    this.addLabel(1760, GROUND_Y - 400, 'WALL\nJUMP\nSHAFT');
    this.addLabel(2500, 700, 'DOUBLE\nJUMP\nPLATFORMS');

    // Respawn if player falls below world
    this.events.on('update', () => {
      if (this.player.y > WORLD_H + 100) {
        this.player.respawn(this.spawnX, this.spawnY);
        this.game.events.emit('ammo-changed', this.player.getAmmo());
      }
    });

    // Level music
    this.sound.play('music_level1', { loop: true, volume: 0.5 });

    // Emit initial ammo to UIScene
    this.game.events.emit('ammo-changed', BALANCE.SHURIKEN_MAX_AMMO);
  }

  private spawnEnemies(groundY: number): void {
    const spawnY = groundY - 32; // center of enemy body (64px tall, bottom on ground)
    const enemies: DummyEnemy[] = [
      new DummyEnemy(this, 300,  spawnY),         // 1: close range — test claw
      new DummyEnemy(this, 700,  spawnY),         // 2: after first gap — test shuriken across gap
      new DummyEnemy(this, 1150, spawnY),         // 3: test claw while running
      new DummyEnemy(this, 1650, groundY - 128 - 32), // 4: elevated — test shuriken arc aim-up
      new DummyEnemy(this, 2200, spawnY),         // 5: after wall jump shaft — mid-range shuriken
    ];
    enemies.forEach(e => this.enemiesGroup.add(e));
  }

  private buildGrayboxRoom(groundY: number, worldW: number): void {
    const h = 64;
    const G = groundY + h / 2;

    const add = (cx: number, cy: number, w: number, rh: number, color: number) => {
      const rect = this.add.rectangle(cx, cy, w, rh, color);
      this.physics.add.existing(rect, true);
      this.platforms.add(rect as unknown as Phaser.GameObjects.GameObject);
    };

    add(200, G, 400, h, 0x555566);
    add(680, G, 320, h, 0x555566);
    add(1120, G, 240, h, 0x555566);
    add(1605, G, 290, h, 0x556655);

    const shaftH = groundY - 436;
    add(1855, G, 160, h, 0x555566);
    add(1800, 436 + shaftH / 2, 32, shaftH, 0x775555);
    add(1928, 436 + shaftH / 2, 32, shaftH, 0x775555);

    add(2130, G, 340, h, 0x555566);
    add(2480, groundY - 128, 180, 24, 0x557755);
    add(2700, groundY - 256, 180, 24, 0x557755);
    add(2920, groundY - 384, 180, 24, 0x557755);
    add(3100, G, 400, h, 0x555566);
    add(worldW / 2, -16, worldW, 32, 0x333344);
  }

  private addLabel(x: number, y: number, text: string): void {
    this.add.text(x, y, text, {
      fontSize: '14px',
      color: '#888899',
      align: 'center',
    }).setOrigin(0.5);
  }

  update(_time: number, delta: number): void {
    this.player.update(delta);

    // Left-click fires shuriken
    const pointer = this.input.activePointer;
    if (pointer.leftButtonJustPressed() && this.player.consumeAmmo()) {
      this.combatSystem.fireShuriken(
        this.player.x, this.player.y,
        pointer.worldX, pointer.worldY,
      );
      this.game.events.emit('ammo-changed', this.player.getAmmo());
    }
  }
}
```

- [ ] **Step 2: Add ATTACK to inputConfig.ts**

Open `src/game/config/inputConfig.ts`. Add `ATTACK: 'J'` to the `INPUT` object:

```ts
export const INPUT = {
  MOVE_LEFT:  'A',
  MOVE_RIGHT: 'D',
  JUMP:       'SPACE',
  DASH:       'SHIFT',
  ATTACK:     'J',
} as const;
```

*(Read the file first to see its exact current content, then add only the ATTACK line.)*

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: Build completes with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/game/scenes/Level01Scene.ts src/game/config/inputConfig.ts
git commit -m "feat: wire CombatSystem, enemies, music, and mouse-fire in Level01Scene"
```

---

### Task 9: UIScene — ammo counter

**Files:**
- Modify: `src/game/scenes/UIScene.ts`

**Context:** UIScene must listen on the global `this.game.events` bus (not `this.events`) for `'ammo-changed'`. Clean up the listener on scene shutdown to prevent leaks if the scene is ever restarted. The ammo text shows a star icon followed by the count, positioned top-right.

- [ ] **Step 1: Replace UIScene.ts**

Replace the entire content of `src/game/scenes/UIScene.ts` with:

```ts
import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';

export class UIScene extends Phaser.Scene {
  private ammoText!: Phaser.GameObjects.Text;
  private onAmmoChanged!: (ammo: number) => void;

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create(): void {
    const { width } = this.scale;

    this.ammoText = this.add.text(width - 16, 16, `★ ${BALANCE.SHURIKEN_MAX_AMMO}`, {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(1, 0);

    // Listen on the global game event bus
    this.onAmmoChanged = (ammo: number) => {
      this.ammoText.setText(`★ ${ammo}`);
    };
    this.game.events.on('ammo-changed', this.onAmmoChanged);

    // Clean up on shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('ammo-changed', this.onAmmoChanged);
    });
  }
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/scenes/UIScene.ts
git commit -m "feat: add ammo counter to UIScene via game event bus"
```

---

### Task 10: UIScene startup + CHANGELOG + final build

**Files:**
- Modify: `src/game/scenes/MenuScene.ts` (verify UIScene is started alongside Level01Scene)
- Modify: `CHANGELOG.md`

**Context:** UIScene must be launched when Level01Scene starts. Check how the scene transition from MenuScene to Level01Scene works — if it uses `this.scene.start('Level01Scene')`, it needs to also launch UIScene in parallel. Then update the changelog.

- [ ] **Step 1: Verify UIScene launches alongside Level01Scene**

Read `src/game/scenes/MenuScene.ts`. Find where it starts Level01Scene. If it uses:
```ts
this.scene.start('Level01Scene');
```
Replace with:
```ts
this.scene.start('Level01Scene');
this.scene.launch('UIScene');
```

If `this.scene.launch('UIScene')` is already present, no change needed.

- [ ] **Step 2: Update CHANGELOG.md**

Add a new entry at the top of `CHANGELOG.md`:

```markdown
## Prompt 5 — Combat Prototype
- Created CombatTypes.ts: IDamageable interface
- Created HealthBar.ts: reusable floating HP bar (Graphics-based, color-coded by percentage)
- Created Shuriken.ts: physics projectile with parabolic arc (SHURIKEN_GRAVITY=400), spin animation, random launch SFX
- Created DummyEnemy.ts: static enemy with health, flash-on-hit, HealthBar; implements IDamageable
- Created CombatSystem.ts: owns shuriken group, wires clawHitbox/shuriken/platform overlaps
- Modified Player.ts: claw attack overlay (timer-based, not a state), clawHitbox (disabled by default), ammo + fire cooldown
- Modified PreloadScene.ts: load shuriken sheet, 5 shuriken SFX, 5 claw SFX, music_level1; generate pixel texture; add shuriken_spin + claw animations
- Modified Level01Scene.ts: spawn 5 DummyEnemies, create CombatSystem, left-click shuriken fire, Level 1 music, ammo-changed events
- Modified UIScene.ts: ammo counter (★ N) in top-right, listens on game event bus
- All combat values tunable via balanceConfig
```

- [ ] **Step 3: Final build check**

Run: `npm run build`
Expected: Clean build, zero TypeScript errors.

- [ ] **Step 4: Final commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for Prompt 5 combat prototype"
```

---

## Success Criteria

- J key triggers claw strike: hitbox active for 150ms, claw animation plays, random claw SFX
- Left-click fires shuriken that arcs downward under gravity and hits enemies
- Ammo decrements 10→0 in UIScene `★ N` display; firing at 0 does nothing
- DummyEnemies flash white on hit, show floating HP bar that shrinks as damage is taken, disappear at 0 HP
- Level 1 music plays on loop from scene start
- All values tunable via balanceConfig
- `npm run build` passes with zero TypeScript errors
