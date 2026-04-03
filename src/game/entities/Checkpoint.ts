// src/game/entities/Checkpoint.ts
import Phaser from 'phaser';

/**
 * Physical checkpoint marker. Walk into it to activate — becomes the player's
 * respawn location. Uses a plain Rectangle + static body so setFillStyle works
 * reliably (setTint on Phaser.Physics.Arcade.Image is unreliable for 1px textures).
 */
export class Checkpoint {
  private _activated = false;
  private readonly _respawnY: number;
  readonly x: number;
  readonly y: number;
  private readonly rect: Phaser.GameObjects.Rectangle;
  private readonly nameLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, respawnY: number, name: string) {
    this.x = x;
    this.y = y;
    this._respawnY = respawnY;

    // Visible column — muted blue-grey when inactive
    this.rect = scene.add.rectangle(x, y, 16, 64, 0x6677aa).setDepth(5);
    scene.physics.add.existing(this.rect, true); // static body

    // Label above the column
    this.nameLabel = scene.add.text(x, y - 40, name, {
      fontSize: '11px',
      color: '#8899bb',
    }).setOrigin(0.5).setDepth(5);
  }

  /** The rectangle game object — pass this to physics.add.overlap(). */
  getRect(): Phaser.GameObjects.Rectangle { return this.rect; }

  /** Activate this checkpoint. No-ops if already active. */
  activate(): void {
    if (this._activated) return;
    this._activated = true;
    this.rect.setFillStyle(0xffcc44);     // gold
    this.nameLabel.setColor('#ffcc44');

    if (this.rect.scene.cache.audio.has('checkpoint')) {
      this.rect.scene.sound.play('checkpoint', { volume: 0.7 });
    }
  }

  isActivated(): boolean { return this._activated; }
  getRespawnY(): number  { return this._respawnY; }
}
