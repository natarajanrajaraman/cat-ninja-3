import Phaser from 'phaser';

/**
 * Cone-of-vision helper: angle+distance detection with wall-occlusion raycasting
 * and a filled-triangle visual indicator.
 *
 * Used by GrannyMelee (and reusable by future enemies).
 */
export class ConeOfVision {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly groundLayer: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene, groundLayer: Phaser.Tilemaps.TilemapLayer) {
    this.groundLayer = groundLayer;
    this.graphics = scene.add.graphics().setDepth(5);
  }

  /**
   * Returns true if target (tx, ty) is within the cone AND not occluded by a tile.
   * The cone points in `facing` direction with `halfAngleDeg` spread each side.
   */
  check(
    fromX: number, fromY: number,
    facing: 'left' | 'right',
    halfAngleDeg: number,
    maxRange: number,
    tx: number, ty: number,
  ): boolean {
    const dx = tx - fromX;
    const dy = ty - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRange) return false;

    // Angle from enemy to target
    const targetAngle = Math.atan2(dy, dx); // radians, -π to π
    const faceAngle = facing === 'right' ? 0 : Math.PI;
    let diff = targetAngle - faceAngle;
    // Normalise diff to -π..π
    while (diff > Math.PI)  diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    if (Math.abs(diff) > Phaser.Math.DegToRad(halfAngleDeg)) return false;

    return this.hasLineOfSight(fromX, fromY, tx, ty);
  }

  /**
   * Returns true if no tile obstructs the straight ray from (fromX,fromY) to (toX,toY).
   * Steps every 8px along the ray, stopping just before the target.
   */
  hasLineOfSight(fromX: number, fromY: number, toX: number, toY: number): boolean {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return true;
    const nx = dx / dist;
    const ny = dy / dist;
    const steps = Math.max(1, Math.floor(dist / 8));
    for (let i = 1; i < steps; i++) {
      const sx = fromX + nx * 8 * i;
      const sy = fromY + ny * 8 * i;
      const tile = this.groundLayer.getTileAtWorldXY(sx, sy);
      if (tile && tile.index !== -1) return false;
    }
    return true;
  }

  /**
   * Draw the cone as a filled triangle each frame.
   * Call clear() when the enemy is dead or the cone should not show.
   */
  draw(
    fromX: number, fromY: number,
    facing: 'left' | 'right',
    halfAngleDeg: number,
    maxRange: number,
    isAlert: boolean,
  ): void {
    this.graphics.clear();
    const faceRad = facing === 'right' ? 0 : Math.PI;
    const halfRad = Phaser.Math.DegToRad(halfAngleDeg);
    const lx = fromX + Math.cos(faceRad - halfRad) * maxRange;
    const ly = fromY + Math.sin(faceRad - halfRad) * maxRange;
    const rx = fromX + Math.cos(faceRad + halfRad) * maxRange;
    const ry = fromY + Math.sin(faceRad + halfRad) * maxRange;
    const color = isAlert ? 0xffdd88 : 0xffffaa;
    const alpha = isAlert ? 0.13 : 0.08;
    this.graphics.fillStyle(color, alpha);
    this.graphics.fillTriangle(fromX, fromY, lx, ly, rx, ry);
  }

  clear(): void {
    this.graphics.clear();
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
