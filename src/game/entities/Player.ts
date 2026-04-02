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
}
