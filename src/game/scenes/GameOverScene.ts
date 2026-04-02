import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 40, 'GAME OVER', {
        fontSize: '48px',
        color: '#ff4444',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 30, 'Press R to return to menu', {
        fontSize: '22px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.input.keyboard!.once('keydown-R', () => {
      this.scene.start('MenuScene');
    });
  }
}
