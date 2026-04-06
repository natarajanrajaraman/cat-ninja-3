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
  private readonly _player: Player;
  private readonly _groundLayer: Phaser.Tilemaps.TilemapLayer;
  private readonly _shurikenGroup: Phaser.Physics.Arcade.Group;
  private readonly _grappleSystem: GrappleSystem;

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
    super(scene, x, y, 'evilgranny');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.spawnX        = x;
    this._player       = player;
    this._groundLayer  = groundLayer;
    this._shurikenGroup = shurikenGroup;
    this._grappleSystem = grappleSystem;

    this.setTexture('evilgranny');
    this.setScale(2);
    this.setDepth(10);
    this.play('granny_idle');

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(BALANCE.GRAVITY);
    body.setSize(36, 60);
    body.setOffset(14, 4);

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
    // _groundLayer is used only in the constructor for ConeOfVision
    void this._groundLayer;

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Cone detection — player
    if (this.cone.check(
      this.x, this.y,
      this._facing,
      BALANCE.GRANNY_CONE_PASSIVE_ANGLE,
      BALANCE.GRANNY_CONE_PASSIVE_RANGE,
      this._player.x, this._player.y,
    )) {
      this.alert();
      return;
    }

    // Cone detection — shurikens
    const shurikens = this._shurikenGroup.getChildren() as Array<Phaser.Physics.Arcade.Sprite & { active: boolean }>;
    for (const s of shurikens) {
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
    const hookPos = this._grappleSystem.getHookPosition();
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

    if (this.patrolPauseTimer > 0) {
      this.patrolPauseTimer -= delta;
      body.setVelocityX(0);
      this.play('granny_idle', true);
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
    this.play('granny_walk', true);

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
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Face the player
    const dir = this._player.x >= this.x ? 'right' : 'left';
    this.setFacing(dir);

    // Check attack range
    const distToPlayer = Math.abs(this._player.x - this.x);
    if (distToPlayer <= BALANCE.GRANNY_ATTACK_RANGE) {
      this.transitionTo('TELEGRAPH');
      return;
    }

    // Chase
    const vx = BALANCE.GRANNY_ALERT_SPEED * (this._player.x >= this.x ? 1 : -1);
    body.setVelocityX(vx);
    this.play('granny_walk', true);
  }

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

  private updateHurt(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.stateTimer -= delta;
    const flash = Math.floor(this.stateTimer / 60) % 2 === 0;
    this.setTint(flash ? 0xffffff : 0xdddddd);
    if (this.stateTimer <= 0) {
      this.clearTint();
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
        this.play('granny_hurt', true);
        break;

      case 'DEAD': {
        body.setVelocityX(0);
        body.setAllowGravity(false);
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
        this.cone.destroy();
        this.healthBar.destroy();
        this.play('granny_dead', true);
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
    }
  }
}
