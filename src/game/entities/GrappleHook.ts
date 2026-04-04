import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';

/**
 * Flying grapple hook projectile.
 * Travels in a parabolic arc (gravity applied). Rotates to match velocity direction.
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

    // Elongated orange dart — will be rotated to match velocity direction
    this.setDisplaySize(6, 14);
    this.setTint(0xff8822);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(BALANCE.GRAPPLE_HOOK_GRAVITY); // parabolic arc
    body.setSize(6, 6);                             // small collision box
  }

  /** Aim and launch toward worldX/Y. */
  launch(toX: number, toY: number): void {
    const dx = toX - this.spawnX;
    const dy = toY - this.spawnY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const vx = (dx / dist) * BALANCE.GRAPPLE_HOOK_SPEED;
    const vy = (dy / dist) * BALANCE.GRAPPLE_HOOK_SPEED;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

    // Initial rotation
    this.angle = Phaser.Math.RadToDeg(Math.atan2(vy, vx)) + 90;
  }

  /** Rotate to match current velocity direction. Call each frame while flying. */
  updateAngle(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    if (vx !== 0 || vy !== 0) {
      this.angle = Phaser.Math.RadToDeg(Math.atan2(vy, vx)) + 90;
    }
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
