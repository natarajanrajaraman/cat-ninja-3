import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private crosshair!: Phaser.GameObjects.Graphics;
  private desaturateOverlay!: Phaser.GameObjects.Rectangle;
  private slowMoActive = false;
  private crosshairAlpha = 1;

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create(): void {
    // Placeholder HUD label (will be replaced in a later prompt)
    this.add.text(16, 16, 'HUD — UIScene overlay', {
      fontSize: '14px',
      color: '#ffff00',
    });

    // Full-screen desaturate overlay — hidden until slow-mo activates
    const { width, height } = this.scale;
    this.desaturateOverlay = this.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x1a1a35,
      0.25,
    );
    this.desaturateOverlay.setVisible(false);

    // Crosshair graphics object — redrawn every frame while active
    this.crosshair = this.add.graphics();
    this.crosshair.setVisible(false);

    // Listen for slow-mo state events from Level01Scene/SlowMoSystem
    this.game.events.on('slowmo-enter', this.onSlowMoEnter, this);
    this.game.events.on('slowmo-exit',  this.onSlowMoExit,  this);
    this.game.events.on('slowmo-shot',  this.onSlowMoShot,  this);

    // Clean up listeners when this scene shuts down
    this.events.once('shutdown', () => {
      this.game.events.off('slowmo-enter', this.onSlowMoEnter, this);
      this.game.events.off('slowmo-exit',  this.onSlowMoExit,  this);
      this.game.events.off('slowmo-shot',  this.onSlowMoShot,  this);
    });
  }

  update(): void {
    if (!this.slowMoActive) return;

    const pointer = this.input.activePointer;
    const { x, y } = pointer;

    // Redraw crosshair at current pointer position each frame
    this.crosshair.clear();
    this.crosshair.lineStyle(2, 0xff4444, this.crosshairAlpha);
    this.crosshair.strokeCircle(x, y, 8);
    this.crosshair.lineBetween(x - 12, y, x + 12, y);
    this.crosshair.lineBetween(x, y - 12, x, y + 12);
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
    // Dim crosshair to signal "shot used — release to reset"
    this.crosshairAlpha = 0.4;
  }
}
