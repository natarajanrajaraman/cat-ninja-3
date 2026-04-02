import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 40, 'VICTORY!', {
        fontSize: '48px',
        color: '#44ff88',
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
