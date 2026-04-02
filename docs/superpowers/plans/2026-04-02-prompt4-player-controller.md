# Prompt 4 — Player Controller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully playable Cat Ninja player controller with run, jump, double jump, wall jump, and dash in a graybox test room using the real sprite sheet.

**Architecture:** Player extends Phaser.Physics.Arcade.Sprite with an explicit PlayerState enum state machine. All tunable values live in balanceConfig. Animations are defined in PreloadScene and played by Player. Level01Scene is rebuilt as a graybox physics room.

**Tech Stack:** Phaser 3, TypeScript, Arcade Physics, Sprites CatNinja.png (1024×1024, 64×64 frames)

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `src/game/types/PlayerTypes.ts` | PlayerState enum + PlayerKeys interface |
| Modify | `src/game/config/balanceConfig.ts` | Populate all movement values |
| Modify | `src/game/scenes/PreloadScene.ts` | Load sprite sheet + define all animations |
| Create | `src/game/entities/Player.ts` | Full player class with state machine |
| Modify | `src/game/scenes/Level01Scene.ts` | Graybox test room + Player instance |

---

### Task 1: PlayerTypes + balanceConfig

**Files:**
- Create: `src/game/types/PlayerTypes.ts`
- Modify: `src/game/config/balanceConfig.ts`

- [ ] **Step 1: Create `src/game/types/PlayerTypes.ts`**

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
}

// Input keys passed from scene into Player constructor.
// Player does not own the keyboard manager — scene does.
export interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
}
```

- [ ] **Step 2: Replace `src/game/config/balanceConfig.ts` with populated values**

```ts
// All tunable gameplay values live here.
// Update this file during playtesting — never hardcode these in entity classes.
export const BALANCE = {
  // --- Player movement ---
  MOVE_SPEED: 320,           // ground run speed px/s
  GROUND_ACCEL: 1800,        // acceleration on ground
  GROUND_DECEL: 1600,        // deceleration on ground (friction)
  AIR_ACCEL: 900,            // horizontal acceleration in air (limited)
  JUMP_VELOCITY: -620,       // initial jump vertical velocity (negative = up)
  GRAVITY: 1400,             // world gravity applied to player body
  DOUBLE_JUMP_VELOCITY: -480, // weaker than base jump
  WALL_JUMP_VX: 280,         // horizontal push away from wall on wall jump
  WALL_JUMP_VY: -560,        // vertical component of wall jump
  WALL_SLIDE_GRAVITY: 200,   // slow gravity while touching wall and falling

  // --- Dash ---
  DASH_DISTANCE: 220,        // fixed pixel travel distance
  DASH_SPEED: 900,           // px/s during dash
  DASH_COOLDOWN: 600,        // ms cooldown after dash ends (resets on land)

  // --- Fairness timings ---
  COYOTE_TIME: 100,          // ms: jump valid after walking off ledge
  JUMP_BUFFER_TIME: 100,     // ms: jump input queued before landing
  WALL_GRACE_TIME: 80,       // ms: wall jump valid after leaving wall
} as const;
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
cd "C:/Users/User/ClaudeProjects/Cat Ninja 2026-03-30" && npx tsc --noEmit
```

Expected: no errors (files may be unused yet — that's fine at this step).

---

### Task 2: PreloadScene — sprite loading + animation definitions

**Files:**
- Modify: `src/game/scenes/PreloadScene.ts`

The sprite sheet is `public/assets/Sprites/Sprites CatNinja.png`, 1024×1024, frames 64×64.
Frame index = row × 16 + column (0-indexed, left-to-right, top-to-bottom).

Key frame ranges:
- Row 0 (idle): frames 0–3
- Row 1 (walk): frames 16–23
- Row 2 (jump): frames 32–39
- Row 3 (spin/double-jump): frames 48–57
- Row 4 (dead): frames 64–72
- Row 7 (flying kick/dash): frames 112–119

- [ ] **Step 1: Replace `src/game/scenes/PreloadScene.ts`**

```ts
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Loading...', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.load.spritesheet('catninja', 'assets/Sprites/Sprites CatNinja.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create(): void {
    this.createAnimations();
    this.scene.start('MenuScene');
  }

  private createAnimations(): void {
    const anims = this.anims;

    // --- Idle: row 0, frames 0–3 ---
    anims.create({
      key: 'idle',
      frames: anims.generateFrameNumbers('catninja', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    // --- Walk: row 1, frames 16–23 ---
    anims.create({
      key: 'walk',
      frames: anims.generateFrameNumbers('catninja', { start: 16, end: 23 }),
      frameRate: 12,
      repeat: -1,
    });

    // --- Jump start (rising): row 2, frames 32–33 ---
    anims.create({
      key: 'jump_start',
      frames: anims.generateFrameNumbers('catninja', { start: 32, end: 33 }),
      frameRate: 12,
      repeat: 0,
    });

    // --- Jump air (loop at apex): row 2, frames 34–35 ---
    anims.create({
      key: 'jump_air',
      frames: anims.generateFrameNumbers('catninja', { start: 34, end: 35 }),
      frameRate: 8,
      repeat: -1,
    });

    // --- Jump fall (descending): row 2, frames 36–39 ---
    anims.create({
      key: 'jump_fall',
      frames: anims.generateFrameNumbers('catninja', { start: 36, end: 39 }),
      frameRate: 10,
      repeat: 0,
    });

    // --- Double jump spin start: row 3, frames 48–50 ---
    anims.create({
      key: 'spin_start',
      frames: anims.generateFrameNumbers('catninja', { start: 48, end: 50 }),
      frameRate: 14,
      repeat: 0,
    });

    // --- Double jump spin air (loop): row 3, frames 51–54 ---
    anims.create({
      key: 'spin_air',
      frames: anims.generateFrameNumbers('catninja', { start: 51, end: 54 }),
      frameRate: 14,
      repeat: -1,
    });

    // --- Dash (flying kick go frames): row 7, frames 117–118 ---
    anims.create({
      key: 'dash',
      frames: anims.generateFrameNumbers('catninja', { start: 117, end: 118 }),
      frameRate: 14,
      repeat: -1,
    });

    // --- Dead: row 4, frames 64–70 ---
    anims.create({
      key: 'dead',
      frames: anims.generateFrameNumbers('catninja', { start: 64, end: 70 }),
      frameRate: 10,
      repeat: 0,
    });
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd "C:/Users/User/ClaudeProjects/Cat Ninja 2026-03-30" && npx tsc --noEmit
```

Expected: no errors.

---

### Task 3: Player.ts — constructor + helpers

**Files:**
- Create: `src/game/entities/Player.ts`

- [ ] **Step 1: Create `src/game/entities/Player.ts` with constructor and helper methods**

```ts
import Phaser from 'phaser';
import { PlayerState, PlayerKeys } from '../types/PlayerTypes';
import { BALANCE } from '../config/balanceConfig';

export class Player extends Phaser.Physics.Arcade.Sprite {
  // --- State ---
  private _state: PlayerState = PlayerState.IDLE;
  private facing: 'left' | 'right' = 'right';

  // --- Ability flags ---
  private canDoubleJump: boolean = false;
  private dashCooldownTimer: number = 0;
  private dashStartX: number = 0;

  // --- Fairness timers (ms, count down to 0) ---
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private wallGraceTimer: number = 0;
  private lastWallDirection: 'left' | 'right' | null = null;

  // --- Input (owned by scene, passed in constructor) ---
  private readonly keys: PlayerKeys;

  constructor(scene: Phaser.Scene, x: number, y: number, keys: PlayerKeys) {
    super(scene, x, y, 'catninja');
    this.keys = keys;

    // Add to scene display list and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(BALANCE.GRAVITY);
    body.setCollideWorldBounds(false);

    // Shrink physics body slightly for better feel (sprite is 64x64)
    body.setSize(28, 48);
    body.setOffset(18, 16);

    this.setOrigin(0.5, 0.5);
    this.play('idle');
  }

  // -------------------------------------------------------
  // Helper: is player standing on ground?
  // -------------------------------------------------------
  isGrounded(): boolean {
    return (this.body as Phaser.Physics.Arcade.Body).blocked.down;
  }

  // -------------------------------------------------------
  // Helper: which wall (if any) is player touching?
  // -------------------------------------------------------
  isTouchingWall(): 'left' | 'right' | null {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.left) return 'left';
    if (body.blocked.right) return 'right';
    return null;
  }

  // -------------------------------------------------------
  // Helper: check if player is in one of the given states
  // -------------------------------------------------------
  isInState(...states: PlayerState[]): boolean {
    return states.includes(this._state);
  }

  // -------------------------------------------------------
  // Helper: centralised state transition
  // -------------------------------------------------------
  private transitionTo(state: PlayerState): void {
    if (this._state === state) return;
    this._state = state;
  }

  // -------------------------------------------------------
  // Helper: was jump just pressed this frame?
  // -------------------------------------------------------
  private jumpJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.jump);
  }

  // -------------------------------------------------------
  // Helper: was dash just pressed this frame?
  // -------------------------------------------------------
  private dashJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.dash);
  }

  // -------------------------------------------------------
  // Main update — called from Level01Scene.update()
  // -------------------------------------------------------
  update(delta: number): void {
    this.updateTimers(delta);

    if (this.isInState(PlayerState.DASH)) {
      this.updateDash();
    } else {
      this.handleJumpInput();
      this.handleDashInput();
      this.handleHorizontalMovement();
      this.updatePhysicsState();
    }

    this.updateFacing();
    this.updateAnimation();
  }

  // Tick down all timers each frame
  private updateTimers(delta: number): void {
    this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    this.wallGraceTimer = Math.max(0, this.wallGraceTimer - delta);
    if (!this.isGrounded()) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - delta);
    }
  }

  // -------------------------------------------------------
  // Placeholder methods — implemented in Tasks 4-7
  // -------------------------------------------------------
  private handleJumpInput(): void { /* Task 4 */ }
  private handleDashInput(): void { /* Task 6 */ }
  private handleHorizontalMovement(): void { /* Task 4 */ }
  private updatePhysicsState(): void { /* Task 5 */ }
  private updateDash(): void { /* Task 6 */ }
  private updateFacing(): void { /* Task 7 */ }
  private updateAnimation(): void { /* Task 7 */ }
}
```

- [ ] **Step 2: Verify build**

```bash
cd "C:/Users/User/ClaudeProjects/Cat Ninja 2026-03-30" && npx tsc --noEmit
```

Expected: no errors. (Placeholder methods are empty — TS is happy because they return void.)

---

### Task 4: Player — horizontal movement + basic jump + coyote + buffer

**Files:**
- Modify: `src/game/entities/Player.ts`

Replace the three placeholder methods: `handleHorizontalMovement`, `handleJumpInput`, and add a real `updatePhysicsState` ground-landing check.

- [ ] **Step 1: Replace `handleHorizontalMovement` placeholder**

Find this line in Player.ts:
```ts
  private handleHorizontalMovement(): void { /* Task 4 */ }
```

Replace with:
```ts
  private handleHorizontalMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = this.isGrounded();
    const accel = onGround ? BALANCE.GROUND_ACCEL : BALANCE.AIR_ACCEL;
    const decel = onGround ? BALANCE.GROUND_DECEL : BALANCE.AIR_ACCEL * 0.5;
    const leftDown = this.keys.left.isDown;
    const rightDown = this.keys.right.isDown;

    if (leftDown && !rightDown) {
      body.setAccelerationX(-accel);
    } else if (rightDown && !leftDown) {
      body.setAccelerationX(accel);
    } else {
      body.setAccelerationX(0);
      // Apply manual deceleration toward zero
      if (Math.abs(body.velocity.x) > 0) {
        const dir = body.velocity.x > 0 ? -1 : 1;
        const newVx = body.velocity.x + dir * decel * (1 / 60);
        body.setVelocityX(Math.abs(newVx) < 4 ? 0 : newVx);
      }
    }

    // Clamp to max speed
    body.setVelocityX(
      Phaser.Math.Clamp(body.velocity.x, -BALANCE.MOVE_SPEED, BALANCE.MOVE_SPEED)
    );
  }
```

- [ ] **Step 2: Replace `handleJumpInput` placeholder**

Find:
```ts
  private handleJumpInput(): void { /* Task 4 */ }
```

Replace with:
```ts
  private handleJumpInput(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Queue jump buffer when jump is pressed in air
    if (this.jumpJustPressed()) {
      this.jumpBufferTimer = BALANCE.JUMP_BUFFER_TIME;
    }

    const wantsJump = this.jumpBufferTimer > 0;
    if (!wantsJump) return;

    const onGround = this.isGrounded();
    const hasCoyote = this.coyoteTimer > 0;
    const inAir = this.isInState(
      PlayerState.JUMP,
      PlayerState.FALL,
      PlayerState.DOUBLE_JUMP
    );

    if (onGround || hasCoyote) {
      // Normal ground jump
      body.setVelocityY(BALANCE.JUMP_VELOCITY);
      this.canDoubleJump = true;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.transitionTo(PlayerState.JUMP);
    } else if (inAir && this.canDoubleJump) {
      // Double jump
      body.setVelocityY(BALANCE.DOUBLE_JUMP_VELOCITY);
      this.canDoubleJump = false;
      this.jumpBufferTimer = 0;
      this.play('spin_start', true);
      this.transitionTo(PlayerState.DOUBLE_JUMP);
    }
  }
```

- [ ] **Step 3: Replace `updatePhysicsState` placeholder**

Find:
```ts
  private updatePhysicsState(): void { /* Task 5 */ }
```

Replace with:
```ts
  private updatePhysicsState(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = this.isGrounded();
    const falling = body.velocity.y > 0;

    if (onGround) {
      // Reset air abilities on landing
      this.canDoubleJump = false;
      this.dashCooldownTimer = 0;
      this.coyoteTimer = 0;

      const moving = Math.abs(body.velocity.x) > 10;
      this.transitionTo(moving ? PlayerState.RUN : PlayerState.IDLE);
    } else {
      // Just left the ground — start coyote window
      if (
        this.isInState(PlayerState.IDLE, PlayerState.RUN) &&
        !onGround
      ) {
        this.coyoteTimer = BALANCE.COYOTE_TIME;
      }

      // Switch to FALL when descending (not during jump start or double jump)
      if (
        falling &&
        this.isInState(PlayerState.JUMP, PlayerState.WALL_JUMP)
      ) {
        this.transitionTo(PlayerState.FALL);
      }
    }
  }
```

- [ ] **Step 4: Verify build**

```bash
cd "C:/Users/User/ClaudeProjects/Cat Ninja 2026-03-30" && npx tsc --noEmit
```

Expected: no errors.

---

### Task 5: Player — wall slide, wall jump, wall grace

**Files:**
- Modify: `src/game/entities/Player.ts`

- [ ] **Step 1: Update `updatePhysicsState` to include wall slide logic**

Find the full `updatePhysicsState` method and replace it:

```ts
  private updatePhysicsState(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = this.isGrounded();
    const falling = body.velocity.y > 0;
    const wallContact = this.isTouchingWall();

    if (onGround) {
      // Reset air abilities on landing
      this.canDoubleJump = false;
      this.dashCooldownTimer = 0;
      this.coyoteTimer = 0;
      this.wallGraceTimer = 0;
      this.lastWallDirection = null;

      const moving = Math.abs(body.velocity.x) > 10;
      this.transitionTo(moving ? PlayerState.RUN : PlayerState.IDLE);
      // Restore normal gravity
      body.setGravityY(BALANCE.GRAVITY);
    } else if (
      wallContact !== null &&
      falling &&
      !this.isInState(PlayerState.WALL_SLIDE, PlayerState.WALL_JUMP, PlayerState.DASH)
    ) {
      // Enter wall slide
      this.lastWallDirection = wallContact;
      this.wallGraceTimer = BALANCE.WALL_GRACE_TIME;
      body.setGravityY(BALANCE.WALL_SLIDE_GRAVITY - BALANCE.GRAVITY); // net = WALL_SLIDE_GRAVITY
      this.transitionTo(PlayerState.WALL_SLIDE);
    } else if (
      this.isInState(PlayerState.WALL_SLIDE) &&
      (wallContact === null || onGround)
    ) {
      // Left wall without jumping
      this.wallGraceTimer = BALANCE.WALL_GRACE_TIME;
      body.setGravityY(BALANCE.GRAVITY);
      this.transitionTo(PlayerState.FALL);
    } else {
      // Start coyote window when leaving ground normally
      if (this.isInState(PlayerState.IDLE, PlayerState.RUN)) {
        this.coyoteTimer = BALANCE.COYOTE_TIME;
        this.transitionTo(PlayerState.FALL);
      }

      // Transition JUMP → FALL when descending
      if (falling && this.isInState(PlayerState.JUMP, PlayerState.WALL_JUMP)) {
        this.transitionTo(PlayerState.FALL);
      }
    }
  }
```

- [ ] **Step 2: Update `handleJumpInput` to include wall jump**

Find the full `handleJumpInput` method and replace it:

```ts
  private handleJumpInput(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Queue jump buffer when jump is pressed in air
    if (this.jumpJustPressed()) {
      this.jumpBufferTimer = BALANCE.JUMP_BUFFER_TIME;
    }

    const wantsJump = this.jumpBufferTimer > 0;
    if (!wantsJump) return;

    const onGround = this.isGrounded();
    const hasCoyote = this.coyoteTimer > 0;
    const inAir = this.isInState(
      PlayerState.JUMP,
      PlayerState.FALL,
      PlayerState.DOUBLE_JUMP
    );
    const onWall = this.isInState(PlayerState.WALL_SLIDE) || this.wallGraceTimer > 0;

    if (onWall) {
      // Wall jump — push away from the wall
      const wallDir = this.lastWallDirection;
      const vx = wallDir === 'left'
        ? BALANCE.WALL_JUMP_VX    // push right
        : -BALANCE.WALL_JUMP_VX;  // push left
      body.setVelocityX(vx);
      body.setVelocityY(BALANCE.WALL_JUMP_VY);
      body.setGravityY(BALANCE.GRAVITY);
      this.canDoubleJump = true; // wall jump refreshes double jump
      this.wallGraceTimer = 0;
      this.jumpBufferTimer = 0;
      this.transitionTo(PlayerState.WALL_JUMP);
    } else if (onGround || hasCoyote) {
      // Normal ground jump
      body.setVelocityY(BALANCE.JUMP_VELOCITY);
      this.canDoubleJump = true;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.transitionTo(PlayerState.JUMP);
    } else if (inAir && this.canDoubleJump) {
      // Double jump
      body.setVelocityY(BALANCE.DOUBLE_JUMP_VELOCITY);
      this.canDoubleJump = false;
      this.jumpBufferTimer = 0;
      this.play('spin_start', true);
      this.transitionTo(PlayerState.DOUBLE_JUMP);
    }
  }
```

- [ ] **Step 3: Verify build**

```bash
cd "C:/Users/User/ClaudeProjects/Cat Ninja 2026-03-30" && npx tsc --noEmit
```

Expected: no errors.

---

### Task 6: Player — fixed-distance dash

**Files:**
- Modify: `src/game/entities/Player.ts`

- [ ] **Step 1: Replace `handleDashInput` placeholder**

Find:
```ts
  private handleDashInput(): void { /* Task 6 */ }
```

Replace with:
```ts
  private handleDashInput(): void {
    if (!this.dashJustPressed()) return;
    if (this.dashCooldownTimer > 0) return;
    if (this.isInState(PlayerState.DASH)) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.dashStartX = this.x;
    this.dashCooldownTimer = BALANCE.DASH_COOLDOWN;

    const vx = this.facing === 'right' ? BALANCE.DASH_SPEED : -BALANCE.DASH_SPEED;
    body.setVelocityX(vx);
    body.setVelocityY(0);
    body.setGravityY(-BALANCE.GRAVITY); // neutralise gravity during dash
    body.setAccelerationX(0);
    this.transitionTo(PlayerState.DASH);
  }
```

- [ ] **Step 2: Replace `updateDash` placeholder**

Find:
```ts
  private updateDash(): void { /* Task 6 */ }
```

Replace with:
```ts
  private updateDash(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const travelled = Math.abs(this.x - this.dashStartX);

    if (travelled >= BALANCE.DASH_DISTANCE) {
      // Dash complete — restore gravity and transition
      body.setGravityY(BALANCE.GRAVITY);
      body.setVelocityX(this.facing === 'right' ? BALANCE.MOVE_SPEED * 0.5 : -BALANCE.MOVE_SPEED * 0.5);
      body.setVelocityY(0);
      this.transitionTo(this.isGrounded() ? PlayerState.RUN : PlayerState.FALL);
    }
  }
```

- [ ] **Step 3: Verify build**

```bash
cd "C:/Users/User/ClaudeProjects/Cat Ninja 2026-03-30" && npx tsc --noEmit
```

Expected: no errors.

---

### Task 7: Player — facing direction + animation controller

**Files:**
- Modify: `src/game/entities/Player.ts`

- [ ] **Step 1: Replace `updateFacing` placeholder**

Find:
```ts
  private updateFacing(): void { /* Task 7 */ }
```

Replace with:
```ts
  private updateFacing(): void {
    if (this.isInState(PlayerState.DASH, PlayerState.WALL_SLIDE)) return;
    const leftDown = this.keys.left.isDown;
    const rightDown = this.keys.right.isDown;

    if (rightDown && !leftDown) {
      this.facing = 'right';
      this.setFlipX(false);
    } else if (leftDown && !rightDown) {
      this.facing = 'left';
      this.setFlipX(true);
    }
  }
```

- [ ] **Step 2: Replace `updateAnimation` placeholder**

Find:
```ts
  private updateAnimation(): void { /* Task 7 */ }
```

Replace with:
```ts
  private updateAnimation(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

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
        // spin_start → spin_air handled by completion event in handleJumpInput
        // Just ensure spin_air keeps looping while in air
        if (this.anims.currentAnim?.key === 'spin_start' && this.anims.currentFrame?.isLast) {
          this.play('spin_air', true);
        } else if (this.anims.currentAnim?.key !== 'spin_start') {
          this.play('spin_air', true);
        }
        break;
      case PlayerState.WALL_SLIDE:
        this.play('jump_air', true);
        // Flip facing toward the wall
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

- [ ] **Step 3: Verify build**

```bash
cd "C:/Users/User/ClaudeProjects/Cat Ninja 2026-03-30" && npx tsc --noEmit
```

Expected: no errors.

---

### Task 8: Level01Scene — graybox test room

**Files:**
- Modify: `src/game/scenes/Level01Scene.ts`

Replace the text-placeholder scene with a proper physics room.

World size: 3200 × 900. Platform layout covers: run feel → small jump gap → medium jump gap → dash-only gap (220px) → wall jump shaft → elevated platforms for double jump.

- [ ] **Step 1: Replace `src/game/scenes/Level01Scene.ts`**

```ts
import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { INPUT } from '../config/inputConfig';

export class Level01Scene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
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

    // Input — scene owns the keyboard, passes refs to player
    const keys = this.input.keyboard!.addKeys({
      left: INPUT.MOVE_LEFT,
      right: INPUT.MOVE_RIGHT,
      jump: INPUT.JUMP,
      dash: INPUT.DASH,
    }) as {
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
      jump: Phaser.Input.Keyboard.Key;
      dash: Phaser.Input.Keyboard.Key;
    };

    // Create player
    this.player = new Player(this, this.spawnX, this.spawnY, keys);

    // Collide player with platforms
    this.physics.add.collider(this.player, this.platforms);

    // Camera follow with light lerp
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Labels to explain the layout
    this.addLabel(200, GROUND_Y - 80, 'START\nrun here');
    this.addLabel(490, GROUND_Y - 80, '← 120px\njump gap');
    this.addLabel(840, GROUND_Y - 80, '← 160px\nrunning jump');
    this.addLabel(1220, GROUND_Y - 80, '← 220px\nDASH ONLY');
    this.addLabel(1760, GROUND_Y - 400, 'WALL\nJUMP\nSHAFT');
    this.addLabel(2500, 700, 'DOUBLE\nJUMP\nPLATFORMS');

    // Respawn if player falls below world
    this.events.on('update', () => {
      if (this.player.y > WORLD_H + 100) {
        this.player.setPosition(this.spawnX, this.spawnY);
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });
  }

  private buildGrayboxRoom(groundY: number, worldW: number): void {
    const h = 64; // ground height
    const G = groundY + h / 2; // center Y of ground-level platforms

    // Helper: add a colored static rectangle with physics
    const add = (cx: number, cy: number, w: number, rh: number, color: number) => {
      const rect = this.add.rectangle(cx, cy, w, rh, color);
      this.physics.add.existing(rect, true);
      this.platforms.add(rect);
    };

    // --- Ground segments (with gaps) ---
    // Segment 1: Start area (0–400)
    add(200, G, 400, h, 0x555566);
    // Gap 1: 400–520 (120px) — basic jump

    // Segment 2: 520–840
    add(680, G, 320, h, 0x555566);
    // Gap 2: 840–1000 (160px) — running jump

    // Segment 3: 1000–1240
    add(1120, G, 240, h, 0x555566);
    // Gap 3: 1240–1460 (220px = DASH_DISTANCE) — dash only!

    // Segment 4: 1460–1750
    add(1605, G, 290, h, 0x556655);

    // --- Wall jump shaft: x=1800–1960 ---
    // Floor inside shaft
    add(1855, G, 160, h, 0x555566);
    // Left wall (x=1800, w=32, from y=500 to groundY)
    const shaftH = groundY - 436;
    add(1800, 436 + shaftH / 2, 32, shaftH, 0x775555);
    // Right wall (x=1928, w=32)
    add(1928, 436 + shaftH / 2, 32, shaftH, 0x775555);

    // Segment 5: 1960–2300 (after shaft)
    add(2130, G, 340, h, 0x555566);

    // --- Elevated double-jump platforms ---
    add(2480, groundY - 128, 180, 24, 0x557755);  // 128px up
    add(2700, groundY - 256, 180, 24, 0x557755);  // 256px up
    add(2920, groundY - 384, 180, 24, 0x557755);  // 384px up

    // Segment 6: End area (3000–3200)
    add(3100, G, 400, h, 0x555566);

    // Ceiling to prevent going out of top
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
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd "C:/Users/User/ClaudeProjects/Cat Ninja 2026-03-30" && npx tsc --noEmit
```

Expected: no errors.

---

### Task 9: Build check, CHANGELOG, and commit

- [ ] **Step 1: Full production build**

```bash
cd "C:/Users/User/ClaudeProjects/Cat Ninja 2026-03-30" && npm run build
```

Expected: `dist/` created, no TS errors, only the known Phaser bundle size warning.

- [ ] **Step 2: Update CHANGELOG.md**

Append to `CHANGELOG.md`:

```md

## Prompt 4 — Player Controller
- Added PlayerTypes.ts: PlayerState enum, PlayerKeys interface
- Populated balanceConfig.ts with all movement tuning values
- Updated PreloadScene to load Sprites CatNinja.png and define 9 animations
- Created Player.ts with explicit state machine (IDLE/RUN/JUMP/FALL/DOUBLE_JUMP/WALL_SLIDE/WALL_JUMP/DASH/HURT/DEAD)
- Implemented: run with acceleration/deceleration, jump, double jump, wall slide, wall jump, fixed-distance dash
- Fairness features: coyote time (100ms), jump buffer (100ms), wall grace (80ms)
- Rebuilt Level01Scene as graybox physics room (3200×900) with gaps, dash lane, wall jump shaft, elevated platforms
- Camera follows player with lerp
```

- [ ] **Step 3: Commit and push**

```bash
cd "C:/Users/User/ClaudeProjects/Cat Ninja 2026-03-30" && git add -A && git commit -m "$(cat <<'EOF'
feat: Prompt 4 — player controller with state machine and graybox room

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

## Self-Review

**Spec coverage:**
- ✅ PlayerState enum with all 10 states
- ✅ PlayerKeys interface — input owned by scene, passed to player
- ✅ balanceConfig populated with all 16 movement values
- ✅ PreloadScene loads catninja spritesheet + creates 9 named animations
- ✅ Player constructor: body size tuned, gravity set, origin centred
- ✅ Run with acceleration/deceleration + speed clamp
- ✅ Jump from ground with coyote time
- ✅ Jump buffer queues jump before landing
- ✅ Double jump resets on landing and wall jump
- ✅ Wall slide reduces gravity; leaves wall via grace timer
- ✅ Wall jump pushes away from wall, refreshes double jump
- ✅ Dash: fixed distance (DASH_DISTANCE px), cooldown resets on land
- ✅ Facing direction updates + sprite flip
- ✅ Animation per state
- ✅ Graybox room: run area, 3 gaps, dash lane, wall shaft, elevated platforms, camera follow
- ✅ Respawn if fall below world

**Placeholder scan:** No TBDs. Every placeholder method from Task 3 is replaced by Tasks 4–7.

**Type consistency:**
- `PlayerState` used consistently throughout (enum values not strings)
- `PlayerKeys` interface matches `addKeys` call in Level01Scene
- `BALANCE.GRAVITY` and `BALANCE.WALL_SLIDE_GRAVITY` used with correct sign arithmetic in wall slide
- `transitionTo` called with `PlayerState.*` enum values everywhere
- `isInState(...PlayerState[])` signature matches all call sites
