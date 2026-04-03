// src/game/entities/Checkpoint.ts
import Phaser from 'phaser';

/**
 * Physical checkpoint object. Touch to activate; once active it becomes the
 * player's respawn location. Visual: 16×64 px rectangle, grey → gold on activate.
 */
export class Checkpoint extends Phaser.Physics.Arcade.Image {
  private _activated = false;
  private readonly _respawnY: number;

  /**
   * @param x       World-space centre X
   * @param y       World-space centre Y
   * @param respawnY  Sprite Y to pass to player.respawn() — ground-level spawn Y (790).
   */
  constructor(scene: Phaser.Scene, x: number, y: number, respawnY: number) {
    super(scene, x, y, 'pixel');
    this._respawnY = respawnY;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body

    this.setDisplaySize(16, 64);
    this.setTint(0x555566); // inactive: grey

    // Fit static body to display size
    (this.body as Phaser.Physics.Arcade.StaticBody).setSize(16, 64);
  }

  /** Activate this checkpoint. No-ops if already active. */
  activate(): void {
    if (this._activated) return;
    this._activated = true;
    this.setTint(0xffcc44); // active: gold

    // Play SFX only if the key is loaded (graceful no-op in graybox)
    if (this.scene.cache.audio.has('checkpoint')) {
      this.scene.sound.play('checkpoint', { volume: 0.7 });
    }
  }

  isActivated(): boolean { return this._activated; }
  getRespawnY(): number  { return this._respawnY; }
}
