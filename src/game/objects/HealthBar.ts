import Phaser from 'phaser';

export class HealthBar {
  private graphics: Phaser.GameObjects.Graphics;
  private width: number;
  private yOffset: number;

  constructor(scene: Phaser.Scene, width: number, yOffset: number) {
    this.width = width;
    this.yOffset = yOffset;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);
  }

  update(x: number, y: number, current: number, max: number): void {
    this.graphics.clear();

    // Hide when full health
    if (current >= max) return;

    const pct = Math.max(0, current / max);
    const barX = x - this.width / 2;
    const barY = y + this.yOffset;

    // Background bar (dark gray)
    this.graphics.fillStyle(0x333333);
    this.graphics.fillRect(barX, barY, this.width, 6);

    // Fill bar — color based on percentage
    const fillColor = pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffff00 : 0xff4444;
    this.graphics.fillStyle(fillColor);
    this.graphics.fillRect(barX, barY, Math.floor(this.width * pct), 6);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
