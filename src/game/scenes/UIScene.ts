import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';

const HUD_X = 16;
const HUD_Y = 16;
const BAR_W = 160;
const BAR_H = 14;

export class UIScene extends Phaser.Scene {
  // --- Slow-mo overlay ---
  private crosshair!: Phaser.GameObjects.Graphics;
  private desaturateOverlay!: Phaser.GameObjects.Rectangle;
  private slowMoActive = false;
  private crosshairAlpha = 1;

  // --- HUD elements ---
  private healthFill!: Phaser.GameObjects.Rectangle;
  private livesText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create(): void {
    const { width, height } = this.scale;

    // -------------------------------------------------------
    // Health bar
    // -------------------------------------------------------
    const labelStyle = { fontSize: '12px', color: '#aaaacc' };
    this.add.text(HUD_X, HUD_Y, 'HP', labelStyle);

    // Background track
    this.add.rectangle(HUD_X + 24 + BAR_W / 2, HUD_Y + 6, BAR_W, BAR_H, 0x333344)
      .setOrigin(0.5);

    // Fill (anchored left — we scale width to represent current health)
    this.healthFill = this.add.rectangle(HUD_X + 24, HUD_Y + 6, BAR_W, BAR_H, 0x44cc66)
      .setOrigin(0, 0.5);

    // -------------------------------------------------------
    // Lives counter
    // -------------------------------------------------------
    this.livesText = this.add.text(HUD_X, HUD_Y + 24, this.livesLabel(BALANCE.PLAYER_MAX_LIVES), {
      fontSize: '14px',
      color: '#ffcc44',
    });

    // -------------------------------------------------------
    // Ammo counter
    // -------------------------------------------------------
    this.ammoText = this.add.text(HUD_X, HUD_Y + 44, this.ammoLabel(BALANCE.SHURIKEN_MAX_AMMO), {
      fontSize: '14px',
      color: '#88ccff',
    });

    // -------------------------------------------------------
    // Full-screen desaturate overlay — hidden until slow-mo activates
    // -------------------------------------------------------
    this.desaturateOverlay = this.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x1a1a35,
      0.25,
    );
    this.desaturateOverlay.setVisible(false);

    // -------------------------------------------------------
    // Crosshair (redrawn every frame while slow-mo active)
    // -------------------------------------------------------
    this.crosshair = this.add.graphics();
    this.crosshair.setVisible(false);

    // -------------------------------------------------------
    // Event listeners
    // -------------------------------------------------------
    this.game.events.on('slowmo-enter', this.onSlowMoEnter, this);
    this.game.events.on('slowmo-exit',  this.onSlowMoExit,  this);
    this.game.events.on('slowmo-shot',  this.onSlowMoShot,  this);
    this.game.events.on('ammo-changed', this.onAmmoChanged, this);
    this.game.events.on('player-health-changed', this.onHealthChanged, this);
    this.game.events.on('player-lives-changed',  this.onLivesChanged,  this);

    this.events.once('shutdown', () => {
      this.game.events.off('slowmo-enter', this.onSlowMoEnter, this);
      this.game.events.off('slowmo-exit',  this.onSlowMoExit,  this);
      this.game.events.off('slowmo-shot',  this.onSlowMoShot,  this);
      this.game.events.off('ammo-changed', this.onAmmoChanged, this);
      this.game.events.off('player-health-changed', this.onHealthChanged, this);
      this.game.events.off('player-lives-changed',  this.onLivesChanged,  this);
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

  // -------------------------------------------------------
  // HUD event handlers
  // -------------------------------------------------------
  private onHealthChanged(data: { health: number; maxHealth: number }): void {
    const pct = Phaser.Math.Clamp(data.health / data.maxHealth, 0, 1);
    this.healthFill.setDisplaySize(Math.round(BAR_W * pct), BAR_H);

    // Colour shifts: green → yellow → red
    if (pct > 0.5) {
      this.healthFill.setFillStyle(0x44cc66);
    } else if (pct > 0.25) {
      this.healthFill.setFillStyle(0xddcc22);
    } else {
      this.healthFill.setFillStyle(0xcc3333);
    }
  }

  private onLivesChanged(lives: number): void {
    this.livesText.setText(this.livesLabel(lives));
  }

  private onAmmoChanged(ammo: number): void {
    this.ammoText.setText(this.ammoLabel(ammo));
  }

  // -------------------------------------------------------
  // Slow-mo event handlers
  // -------------------------------------------------------
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

  // -------------------------------------------------------
  // Label helpers
  // -------------------------------------------------------
  private livesLabel(lives: number): string {
    return `LIVES  ${lives}`;
  }

  private ammoLabel(ammo: number): string {
    return `AMMO   ${ammo}`;
  }
}
