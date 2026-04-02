import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Assets will be loaded here in later prompts.
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Loading...', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
