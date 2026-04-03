import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';

export class UIScene extends Phaser.Scene {
  // --- Slow-mo overlay ---
  private crosshair!: Phaser.GameObjects.Graphics;
  private desaturateOverlay!: Phaser.GameObjects.Rectangle;
  private slowMoActive = false;
  private crosshairAlpha = 1;

  // --- Lives (screen-fixed) ---
  private livesText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create(): void {
    const { width, height } = this.scale;

    // Lives counter — top-left
    this.livesText = this.add.text(16, 16, this.livesLabel(BALANCE.PLAYER_MAX_LIVES), {
      fontSize: '14px',
      color: '#ffcc44',
    });

    // Full-screen desaturate overlay — hidden until slow-mo activates
    this.desaturateOverlay = this.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x1a1a35,
      0.25,
    );
    this.desaturateOverlay.setVisible(false);

    // Crosshair (redrawn every frame while slow-mo active)
    this.crosshair = this.add.graphics();
    this.crosshair.setVisible(false);

    // Event listeners
    this.game.events.on('slowmo-enter',         this.onSlowMoEnter,  this);
    this.game.events.on('slowmo-exit',           this.onSlowMoExit,   this);
    this.game.events.on('slowmo-shot',           this.onSlowMoShot,   this);
    this.game.events.on('player-lives-changed',  this.onLivesChanged, this);

    this.events.once('shutdown', () => {
      this.game.events.off('slowmo-enter',        this.onSlowMoEnter,  this);
      this.game.events.off('slowmo-exit',         this.onSlowMoExit,   this);
      this.game.events.off('slowmo-shot',         this.onSlowMoShot,   this);
      this.game.events.off('player-lives-changed',this.onLivesChanged, this);
    });
  }

  update(): void {
    if (!this.slowMoActive) return;

    const pointer = this.input.activePointer;
    const { x, y } = pointer;

    this.crosshair.clear();
    this.crosshair.lineStyle(2, 0xff4444, this.crosshairAlpha);
    this.crosshair.strokeCircle(x, y, 8);
    this.crosshair.lineBetween(x - 12, y, x + 12, y);
    this.crosshair.lineBetween(x, y - 12, x, y + 12);
  }

  private onLivesChanged(lives: number): void {
    this.livesText.setText(this.livesLabel(lives));
  }

  private onSlowMoEnter(): void {
    this.slowMoActive = true;
    this.crosshairAlpha = 1;
    this.crosshair.setVisible(true);
    this.desaturateOverlay.setVisible(true);
    this.input.setDefaultCursor('none');
  }

  private onSlowMoExit(): void {
    this.slowMoActive = false;
    this.crosshairAlpha = 1;
    this.crosshair.setVisible(false);
    this.crosshair.clear();
    this.desaturateOverlay.setVisible(false);
    this.input.setDefaultCursor('default');
  }

  private onSlowMoShot(): void {
    this.crosshairAlpha = 0.4;
  }

  private livesLabel(lives: number): string {
    return `LIVES  ${lives}`;
  }
}
