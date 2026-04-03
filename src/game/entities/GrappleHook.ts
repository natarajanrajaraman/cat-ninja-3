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
