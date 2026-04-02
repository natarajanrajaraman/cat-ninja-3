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
