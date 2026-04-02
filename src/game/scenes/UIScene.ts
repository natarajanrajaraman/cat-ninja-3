import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create(): void {
    // HUD elements will be added here in later prompts.
    this.add
      .text(16, 16, 'HUD — UIScene overlay', {
        fontSize: '14px',
        color: '#ffff00',
      });
  }
}
