import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 60, 'CAT NINJA 3', {
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, 'Press SPACE to start', {
        fontSize: '24px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('Level01Scene');
      this.scene.launch('UIScene');
    });
  }
}
