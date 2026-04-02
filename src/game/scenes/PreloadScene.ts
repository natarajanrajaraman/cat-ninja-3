import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Loading...', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.load.spritesheet('catninja', 'assets/Sprites/Sprites CatNinja.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create(): void {
    this.createAnimations();
    this.scene.start('MenuScene');
  }

  private createAnimations(): void {
    const anims = this.anims;

    // --- Idle: row 0, frames 0–3 ---
    anims.create({
      key: 'idle',
      frames: anims.generateFrameNumbers('catninja', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    // --- Walk: row 1, frames 16–23 ---
    anims.create({
      key: 'walk',
      frames: anims.generateFrameNumbers('catninja', { start: 16, end: 23 }),
      frameRate: 12,
      repeat: -1,
    });

    // --- Jump start (rising): row 2, frames 32–33 ---
    anims.create({
      key: 'jump_start',
      frames: anims.generateFrameNumbers('catninja', { start: 32, end: 33 }),
      frameRate: 12,
      repeat: 0,
    });

    // --- Jump air (loop at apex): row 2, frames 34–35 ---
    anims.create({
      key: 'jump_air',
      frames: anims.generateFrameNumbers('catninja', { start: 34, end: 35 }),
      frameRate: 8,
      repeat: -1,
    });

    // --- Jump fall (descending): row 2, frames 36–39 ---
    anims.create({
      key: 'jump_fall',
      frames: anims.generateFrameNumbers('catninja', { start: 36, end: 39 }),
      frameRate: 10,
      repeat: 0,
    });

    // --- Double jump spin start: row 3, frames 48–50 ---
    anims.create({
      key: 'spin_start',
      frames: anims.generateFrameNumbers('catninja', { start: 48, end: 50 }),
      frameRate: 14,
      repeat: 0,
    });

    // --- Double jump spin air (loop): row 3, frames 51–54 ---
    anims.create({
      key: 'spin_air',
      frames: anims.generateFrameNumbers('catninja', { start: 51, end: 54 }),
      frameRate: 14,
      repeat: -1,
    });

    // --- Dash (flying kick go frames): row 7, frames 117–118 ---
    anims.create({
      key: 'dash',
      frames: anims.generateFrameNumbers('catninja', { start: 117, end: 118 }),
      frameRate: 14,
      repeat: -1,
    });

    // --- Dead: row 4, frames 64–70 ---
    anims.create({
      key: 'dead',
      frames: anims.generateFrameNumbers('catninja', { start: 64, end: 70 }),
      frameRate: 10,
      repeat: 0,
    });
  }
}
