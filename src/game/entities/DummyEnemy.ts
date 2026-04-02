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
