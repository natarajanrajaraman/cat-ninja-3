import Phaser from 'phaser';

export class Level01Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level01Scene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2, 'Level 01 — Mall Mayhem\n(Graybox placeholder)', {
        fontSize: '28px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 80, 'Press G for Game Over  |  V for Victory', {
        fontSize: '18px',
        color: '#888888',
      })
      .setOrigin(0.5);

    this.input.keyboard!.on('keydown-G', () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene');
    });

    this.input.keyboard!.on('keydown-V', () => {
      this.scene.stop('UIScene');
      this.scene.start('VictoryScene');
    });
  }
}
