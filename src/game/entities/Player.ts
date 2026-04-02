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

  // --- Claw attack overlay ---
  private attackTimer: number = 0;
  private clawCooldownTimer: number = 0;
  public clawHitbox!: Phaser.Physics.Arcade.Image;

  // --- Shuriken ammo ---
  private ammo: number = 0; // initialized to SHURIKEN_MAX_AMMO in constructor
  private shurikenCooldownTimer: number = 0;

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

    // Claw hitbox — invisible, disabled until attack fires
    this.clawHitbox = scene.physics.add.image(x, y, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    this.clawHitbox.setVisible(false);
    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).setSize(
      BALANCE.CLAW_RANGE,
      36,
    );
    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).enable = false;

    this.ammo = BALANCE.SHURIKEN_MAX_AMMO;
  }

  // -------------------------------------------------------
  // Respawn — fully reset physics state (call from scene on death/fall)
  // -------------------------------------------------------
  respawn(x: number, y: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y); // resets position, velocity, acceleration
    body.setGravityY(BALANCE.GRAVITY);
    this.canDoubleJump = false;
    this.dashCooldownTimer = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wallGraceTimer = 0;
    this.lastWallDirection = null;
    this.attackTimer = 0;
    this.clawCooldownTimer = 0;
    this.shurikenCooldownTimer = 0;
    this.ammo = BALANCE.SHURIKEN_MAX_AMMO;
    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
    this.transitionTo(PlayerState.IDLE);
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
      this.handleAttackInput();
      this.handleHorizontalMovement();
      this.updatePhysicsState();
    }

    this.updateFacing();
    this.updateClawHitbox();
    this.updateAnimation();
  }

  // Tick down all timers each frame
  private updateTimers(delta: number): void {
    this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    this.wallGraceTimer = Math.max(0, this.wallGraceTimer - delta);
    this.attackTimer = Math.max(0, this.attackTimer - delta);
    this.clawCooldownTimer = Math.max(0, this.clawCooldownTimer - delta);
    this.shurikenCooldownTimer = Math.max(0, this.shurikenCooldownTimer - delta);
    // dashCooldownTimer does NOT count down in the air — dash refreshes only on landing
  }

  // -------------------------------------------------------
  // Placeholder methods — implemented in Tasks 4-7
  // -------------------------------------------------------
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
  private handleDashInput(): void {
    if (!this.dashJustPressed()) return;
    if (this.dashCooldownTimer > 0) return;
    if (this.isInState(PlayerState.DASH)) return;

    // Don't dash into a wall already being touched
    const wallContact = this.isTouchingWall();
    if ((wallContact === 'right' && this.facing === 'right') ||
        (wallContact === 'left' && this.facing === 'left')) return;

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
  private playRandomSound(keys: string[]): void {
    const key = keys[Math.floor(Math.random() * keys.length)];
    this.scene.sound.play(key, { volume: 0.7 });
  }

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
  private handleHorizontalMovement(): void {
    if (this.isInState(PlayerState.WALL_SLIDE)) return; // don't fight the wall while sliding
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = this.isGrounded();
    const accel = onGround ? BALANCE.GROUND_ACCEL : BALANCE.AIR_ACCEL;
    const decel = onGround ? BALANCE.GROUND_DECEL : BALANCE.AIR_ACCEL * 0.5;
    const leftDown = this.keys.left.isDown;
    const rightDown = this.keys.right.isDown;

    // Prevent pushing into a wall already being touched — avoids arcade physics
    // "climbing" artifact where repeated separation nudges create upward drift
    const wallContact = this.isTouchingWall();
    if ((wallContact === 'left' && leftDown && !rightDown) ||
        (wallContact === 'right' && rightDown && !leftDown)) {
      body.setAccelerationX(0);
      body.setVelocityX(0);
      return;
    }

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
  private updatePhysicsState(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = this.isGrounded();
    const falling = body.velocity.y > 0;
    const wallContact = this.isTouchingWall();

    if (onGround && !this.isInState(PlayerState.JUMP, PlayerState.WALL_JUMP)) {
      // Reset air abilities on landing (guard prevents resetting on the same frame as a jump)
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
  private updateDash(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const travelled = Math.abs(this.x - this.dashStartX);
    const hitWall = (this.facing === 'right' && body.blocked.right) ||
                    (this.facing === 'left' && body.blocked.left);

    if (travelled >= BALANCE.DASH_DISTANCE || hitWall) {
      // Dash complete (or wall hit) — restore gravity and transition
      body.setGravityY(BALANCE.GRAVITY);
      body.setVelocityX(0);
      body.setVelocityY(0);
      this.transitionTo(this.isGrounded() ? PlayerState.RUN : PlayerState.FALL);
    }
  }
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
}
