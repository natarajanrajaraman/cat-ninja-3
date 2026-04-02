import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Boot is a one-frame scene — sets up any global settings then moves on
    this.cameras.main.setBackgroundColor('#000000');
    this.scene.start('PreloadScene');
  }
}
