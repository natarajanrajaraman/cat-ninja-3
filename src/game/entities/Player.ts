import Phaser from 'phaser';
import { PlayerState, PlayerKeys } from '../types/PlayerTypes';
import { BALANCE } from '../config/balanceConfig';

export class Player extends Phaser.Physics.Arcade.Sprite {
  // --- State ---
  private _state: PlayerState = PlayerState.IDLE;
  private facing: 'left' | 'right' = 'right';

  // --- Ability flags ---
  private canDoubleJump: boolean = false;

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

  // --- Health / hurt ---
  private health: number = 0; // initialized to PLAYER_MAX_HEALTH in constructor
  private invulnTimer: number = 0;  // iframes countdown (ms)
  private hurtTimer: number = 0;    // input-locked stagger countdown (ms)

  constructor(scene: Phaser.Scene, x: number, y: number, keys: PlayerKeys) {
    super(scene, x, y, 'catninja');
    this.keys = keys;

    // Add to scene display list and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(BALANCE.GRAVITY);
    body.setCollideWorldBounds(false);

    // Body sized to cover torso+legs; offset.y=4 aligns body-bottom with visual feet
    body.setSize(28, 48);
    body.setOffset(18, 4);

    this.setOrigin(0.5, 0.5);
    this.setScale(2);
    this.play('idle');

    // Claw hitbox — invisible, disabled until attack fires
    this.clawHitbox = scene.physics.add.image(x, y, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    this.clawHitbox.setVisible(false);
    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).setSize(BALANCE.CLAW_RANGE, 36);
    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).enable = false;

    this.ammo = BALANCE.SHURIKEN_MAX_AMMO;
    this.health = BALANCE.PLAYER_MAX_HEALTH;
  }

  // -------------------------------------------------------
  // Respawn — fully reset physics state
  // -------------------------------------------------------
  respawn(x: number, y: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
    body.setGravityY(BALANCE.GRAVITY);
    body.setAllowGravity(true);
    this.canDoubleJump = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wallGraceTimer = 0;
    this.lastWallDirection = null;
    this.attackTimer = 0;
    this.clawCooldownTimer = 0;
    this.shurikenCooldownTimer = 0;
    this.ammo = BALANCE.SHURIKEN_MAX_AMMO;
    this.health = BALANCE.PLAYER_MAX_HEALTH;
    this.invulnTimer = BALANCE.PLAYER_INVULN_MS;
    this.hurtTimer = 0;
    this.setAlpha(1);
    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
    this.transitionTo(PlayerState.IDLE);
    this.scene.game.events.emit('player-health-changed', {
      health: this.health,
      maxHealth: BALANCE.PLAYER_MAX_HEALTH,
    });
  }

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
      this.transitionTo(PlayerState.JUMP);
    }
  }

  getHealth(): number { return this.health; }

  takeDamage(amount: number): void {
    if (this.invulnTimer > 0) return;
    if (this.isInState(PlayerState.DEAD)) return;

    this.health = Math.max(0, this.health - amount);
    this.scene.game.events.emit('player-health-changed', {
      health: this.health,
      maxHealth: BALANCE.PLAYER_MAX_HEALTH,
    });

    if (this.health <= 0) {
      this.transitionTo(PlayerState.DEAD);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(0);
      body.setVelocityY(0);
      body.setAccelerationX(0);
      this.setAlpha(1);
      this.scene.game.events.emit('player-died');
    } else {
      this.invulnTimer = BALANCE.PLAYER_INVULN_MS;
      this.hurtTimer = BALANCE.PLAYER_HURT_DURATION_MS;
      this.transitionTo(PlayerState.HURT);
    }
  }

  isGrounded(): boolean {
    return (this.body as Phaser.Physics.Arcade.Body).blocked.down;
  }

  isTouchingWall(): 'left' | 'right' | null {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.left) return 'left';
    if (body.blocked.right) return 'right';
    return null;
  }

  isInState(...states: PlayerState[]): boolean {
    return states.includes(this._state);
  }

  private transitionTo(state: PlayerState): void {
    if (this._state === state) return;
    this._state = state;
  }

  private jumpJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.jump);
  }

  // -------------------------------------------------------
  // Main update — called from Level01Scene.update()
  // -------------------------------------------------------
  update(delta: number): void {
    this.updateTimers(delta);

    if (this.isInState(PlayerState.DEAD)) {
      this.updateAnimation();
      return;
    }

    if (this.isInState(PlayerState.HURT)) {
      this.updatePhysicsState();
      this.updateFacing();
      this.updateClawHitbox();
      this.updateAnimation();
      this.updateInvulnFlicker();
      if (this.hurtTimer <= 0) {
        this.transitionTo(PlayerState.IDLE);
      }
      return;
    }

    if (this.isInState(PlayerState.GRAPPLE_ATTACHED)) {
      // GrappleSystem handles all input while attached; just update visuals
      this.updateFacing();
      this.updateClawHitbox();
      this.updateAnimation();
      this.updateInvulnFlicker();
      return;
    }

    this.handleJumpInput();
    this.handleAttackInput();
    this.handleHorizontalMovement(delta);
    this.updatePhysicsState();

    this.updateFacing();
    this.updateClawHitbox();
    this.updateAnimation();
    this.updateInvulnFlicker();
  }

  private updateInvulnFlicker(): void {
    if (this.invulnTimer > 0) {
      const phase = Math.floor(this.invulnTimer / 100) % 2;
      this.setAlpha(phase === 0 ? 0.25 : 1.0);
    } else {
      this.setAlpha(1.0);
    }
  }

  private updateTimers(delta: number): void {
    this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    this.wallGraceTimer = Math.max(0, this.wallGraceTimer - delta);
    this.attackTimer = Math.max(0, this.attackTimer - delta);
    this.clawCooldownTimer = Math.max(0, this.clawCooldownTimer - delta);
    this.shurikenCooldownTimer = Math.max(0, this.shurikenCooldownTimer - delta);
    this.invulnTimer = Math.max(0, this.invulnTimer - delta);
    this.hurtTimer = Math.max(0, this.hurtTimer - delta);
  }

  private handleJumpInput(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.jumpJustPressed()) {
      this.jumpBufferTimer = BALANCE.JUMP_BUFFER_TIME;
    }

    const wantsJump = this.jumpBufferTimer > 0;
    if (!wantsJump) return;

    const onGround = this.isGrounded();
    const hasCoyote = this.coyoteTimer > 0;
    const inAir = this.isInState(PlayerState.JUMP, PlayerState.FALL, PlayerState.DOUBLE_JUMP);
    const onWall = this.isInState(PlayerState.WALL_SLIDE) || this.wallGraceTimer > 0;

    if (onWall) {
      const wallDir = this.lastWallDirection;
      const vx = wallDir === 'left' ? BALANCE.WALL_JUMP_VX : -BALANCE.WALL_JUMP_VX;
      body.setVelocityX(vx);
      body.setVelocityY(BALANCE.WALL_JUMP_VY);
      body.setGravityY(BALANCE.GRAVITY);
      this.canDoubleJump = true;
      this.wallGraceTimer = 0;
      this.jumpBufferTimer = 0;
      this.transitionTo(PlayerState.WALL_JUMP);
    } else if (onGround || hasCoyote) {
      body.setVelocityY(BALANCE.JUMP_VELOCITY);
      this.canDoubleJump = true;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.transitionTo(PlayerState.JUMP);
    } else if (inAir && this.canDoubleJump) {
      body.setVelocityY(BALANCE.DOUBLE_JUMP_VELOCITY);
      this.canDoubleJump = false;
      this.jumpBufferTimer = 0;
      this.play('spin_start', true);
      this.transitionTo(PlayerState.DOUBLE_JUMP);
    }
  }

  private handleAttackInput(): void {
    if (this.clawCooldownTimer > 0) return;
    // J key or Left Shift both trigger melee
    const pressed = Phaser.Input.Keyboard.JustDown(this.keys.attack) ||
                    Phaser.Input.Keyboard.JustDown(this.keys.shift);
    if (!pressed) return;

    this.attackTimer = BALANCE.CLAW_ACTIVE_MS + BALANCE.CLAW_RECOVERY_MS;
    this.clawCooldownTimer = BALANCE.CLAW_COOLDOWN_MS;

    (this.clawHitbox.body as Phaser.Physics.Arcade.Body).enable = true;
    this.playRandomSound(['claw_1', 'claw_2', 'claw_3', 'claw_4', 'claw_5']);
    this.play('claw', true);
  }

  private playRandomSound(soundKeys: string[]): void {
    const key = soundKeys[Math.floor(Math.random() * soundKeys.length)];
    this.scene.sound.play(key, { volume: 0.7 });
  }

  getAmmo(): number { return this.ammo; }

  consumeAmmo(): boolean {
    if (this.ammo <= 0) return false;
    if (this.shurikenCooldownTimer > 0) return false;
    this.ammo -= 1;
    this.shurikenCooldownTimer = BALANCE.SHURIKEN_FIRE_COOLDOWN;
    return true;
  }

  private handleHorizontalMovement(delta: number): void {
    if (this.isInState(PlayerState.WALL_SLIDE)) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = this.isGrounded();
    const accel = onGround ? BALANCE.GROUND_ACCEL : BALANCE.AIR_ACCEL;
    const decel = onGround ? BALANCE.GROUND_DECEL : BALANCE.AIR_ACCEL * 0.5;
    const leftDown = this.keys.left.isDown;
    const rightDown = this.keys.right.isDown;

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
      if (Math.abs(body.velocity.x) > 0) {
        const reduction = decel * (delta / 1000);
        if (Math.abs(body.velocity.x) <= reduction) {
          body.setVelocityX(0);
        } else {
          body.setVelocityX(body.velocity.x - Math.sign(body.velocity.x) * reduction);
        }
      }
    }

    body.setVelocityX(Phaser.Math.Clamp(body.velocity.x, -BALANCE.MOVE_SPEED, BALANCE.MOVE_SPEED));
  }

  private updatePhysicsState(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = this.isGrounded();
    const falling = body.velocity.y > 0;
    const wallContact = this.isTouchingWall();

    if (onGround && !this.isInState(PlayerState.JUMP, PlayerState.WALL_JUMP)) {
      this.canDoubleJump = false;
      this.coyoteTimer = 0;
      this.wallGraceTimer = 0;
      this.lastWallDirection = null;

      const moving = Math.abs(body.velocity.x) > 10;
      this.transitionTo(moving ? PlayerState.RUN : PlayerState.IDLE);
      body.setGravityY(BALANCE.GRAVITY);
    } else if (
      wallContact !== null &&
      falling &&
      !this.isInState(PlayerState.WALL_SLIDE, PlayerState.WALL_JUMP)
    ) {
      this.lastWallDirection = wallContact;
      this.wallGraceTimer = BALANCE.WALL_GRACE_TIME;
      body.setGravityY(BALANCE.WALL_SLIDE_GRAVITY - BALANCE.GRAVITY);
      this.transitionTo(PlayerState.WALL_SLIDE);
    } else if (this.isInState(PlayerState.WALL_SLIDE) && (wallContact === null || onGround)) {
      this.wallGraceTimer = BALANCE.WALL_GRACE_TIME;
      body.setGravityY(BALANCE.GRAVITY);
      this.transitionTo(PlayerState.FALL);
    } else {
      if (this.isInState(PlayerState.IDLE, PlayerState.RUN)) {
        this.coyoteTimer = BALANCE.COYOTE_TIME;
        this.transitionTo(PlayerState.FALL);
      }
      if (falling && this.isInState(PlayerState.JUMP, PlayerState.WALL_JUMP)) {
        this.transitionTo(PlayerState.FALL);
      }
    }
  }

  private updateClawHitbox(): void {
    const body = this.clawHitbox.body as Phaser.Physics.Arcade.Body;
    if (this.attackTimer <= BALANCE.CLAW_RECOVERY_MS) {
      body.enable = false;
    }
    const offsetX = this.facing === 'right'
      ? this.x + BALANCE.CLAW_RANGE / 2
      : this.x - BALANCE.CLAW_RANGE / 2;
    this.clawHitbox.setPosition(offsetX, this.y);
    body.reset(offsetX, this.y);
  }

  private updateFacing(): void {
    if (this.isInState(PlayerState.WALL_SLIDE)) return;
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
        this.play(body.velocity.y < -200 ? 'jump_start' : 'jump_air', true);
        break;
      case PlayerState.FALL:
        this.play(body.velocity.y > 100 ? 'jump_fall' : 'jump_air', true);
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
      case PlayerState.HURT:
        this.play('jump_fall', true);
        break;
      case PlayerState.DEAD:
        this.play('dead', true);
        break;
      case PlayerState.GRAPPLE_FLYING:
      case PlayerState.GRAPPLE_ATTACHED:
        this.play('jump_air', true);
        break;
    }
  }
}
