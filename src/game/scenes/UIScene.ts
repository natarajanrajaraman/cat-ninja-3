import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';

export class UIScene extends Phaser.Scene {
  // --- Lives (screen-fixed) ---
  private livesText!: Phaser.GameObjects.Text;
  private posText!: Phaser.GameObjects.Text;

  // --- Grapple reticle (always visible) ---
  private reticle!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create(): void {
    const { width } = this.scale;

    // Lives counter — top-left
    this.livesText = this.add.text(16, 16, this.livesLabel(BALANCE.PLAYER_MAX_LIVES), {
      fontSize: '14px',
      color: '#ffcc44',
    });

    // Player position — top-right (playtest helper)
    this.posText = this.add.text(width - 16, 16, 'x: 0  y: 0', {
      fontSize: '12px',
      color: '#aabbcc',
    }).setOrigin(1, 0);

    // Grapple reticle graphics object (drawn every frame in update)
    this.reticle = this.add.graphics();

    // Event listeners
    this.game.events.on('player-lives-changed', this.onLivesChanged, this);

    this.events.once('shutdown', () => {
      this.game.events.off('player-lives-changed', this.onLivesChanged, this);
    });
  }

  update(): void {
    // Player position readout
    const pos = this.game.registry.get('playerPos') as { x: number; y: number } | undefined;
    if (pos) this.posText.setText(`x: ${pos.x}  y: ${pos.y}`);

    // Grapple reticle — always drawn at pointer position
    const pointer = this.input.activePointer;
    const cam = this.scene.get('Level01Scene').cameras.main;
    const px = pointer.x;
    const py = pointer.y;

    this.reticle.clear();
    this.reticle.lineStyle(1, 0x88aaff, 0.9);
    // Crosshair at cursor
    this.reticle.strokeCircle(px, py, 6);
    this.reticle.lineBetween(px - 10, py, px + 10, py);
    this.reticle.lineBetween(px, py - 10, px, py + 10);

    // Range circle around player (world → screen)
    if (pos && cam) {
      const screenX = (pos.x - cam.scrollX) * cam.zoom;
      const screenY = (pos.y - cam.scrollY) * cam.zoom;
      const screenRange = BALANCE.GRAPPLE_RANGE * cam.zoom;
      this.reticle.lineStyle(1, 0x88aaff, 0.15);
      this.reticle.strokeCircle(screenX, screenY, screenRange);
    }
  }

  private onLivesChanged(lives: number): void {
    this.livesText.setText(this.livesLabel(lives));
  }

  private livesLabel(lives: number): string {
    return `LIVES  ${lives}`;
  }
}
