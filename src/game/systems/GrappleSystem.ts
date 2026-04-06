// src/game/systems/GrappleSystem.ts
import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GrappleHook } from '../entities/GrappleHook';
import { IDamageable } from '../types/CombatTypes';
import { BALANCE } from '../config/balanceConfig';

type GrappleState = 'IDLE' | 'FLYING' | 'ATTACHED_TILE' | 'ATTACHED_ENEMY';

/**
 * Manages grappling hook: firing, attachment, rope pendulum physics, and chain rendering.
 *
 * Right-click fires the hook. On tile/enemy contact the player swings on the rope
 * and locks to the surface (tile) or breaks on reach (enemy). Jump or right-click to release.
 */
export class GrappleSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly groundLayer: Phaser.Tilemaps.TilemapLayer;
  private readonly enemiesGroup: Phaser.Physics.Arcade.Group;

  private state: GrappleState = 'IDLE';
  private hook: GrappleHook | null = null;
  private ropeGraphics: Phaser.GameObjects.Graphics;

  // Attachment state
  private attachX = 0;
  private attachY = 0;
  private ropeLength = 0;
  private attachedEnemy: (Phaser.GameObjects.GameObject & IDamageable) | null = null;
  private locked = false; // true once player reaches a tile surface
  private isFloorAttachment = false; // floor attachments release on arrival instead of locking

  private prevRightDown = false;

  // Swept tile detection — no Phaser tile collider; we step manually each frame
  private hookPrevX = 0;
  private hookPrevY = 0;

  private enemyOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private readonly spaceKey: Phaser.Input.Keyboard.Key;
  private readonly grappleSounds = ['grapple_launch_1', 'grapple_launch_2'];

  constructor(
    scene: Phaser.Scene,
    player: Player,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    enemiesGroup: Phaser.Physics.Arcade.Group,
  ) {
    this.scene = scene;
    this.player = player;
    this.groundLayer = groundLayer;
    this.enemiesGroup = enemiesGroup;

    this.ropeGraphics = scene.add.graphics().setDepth(15);
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(pointer: Phaser.Input.Pointer): void {
    const rightDown = pointer.rightButtonDown();
    const rightJustPressed = rightDown && !this.prevRightDown;
    this.prevRightDown = rightDown;

    switch (this.state) {
      case 'IDLE':
        if (rightJustPressed) this.fire(pointer.worldX, pointer.worldY);
        break;

      case 'FLYING':
        this.updateFlying();
        if (rightJustPressed) this.release();
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.release();
        break;

      case 'ATTACHED_TILE':
      case 'ATTACHED_ENEMY':
        this.updateAttached();
        if (rightJustPressed) {
          this.release();
          this.fire(pointer.worldX, pointer.worldY);
          return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.release();
        break;
    }

    this.drawChain();
  }

  private fire(worldX: number, worldY: number): void {
    if (worldX === this.player.x && worldY === this.player.y) return;

    this.hook?.destroy();
    this.hook = new GrappleHook(this.scene, this.player.x, this.player.y);
    this.hook.launch(worldX, worldY);
    this.state = 'FLYING';
    this.locked = false;
    this.attachedEnemy = null;
    this.isFloorAttachment = false;

    // Track previous position for swept tile detection
    this.hookPrevX = this.player.x;
    this.hookPrevY = this.player.y;

    // Remove stale overlap from previous shot
    if (this.enemyOverlap) { this.scene.physics.world.removeCollider(this.enemyOverlap); this.enemyOverlap = null; }

    // Enemy overlap only — tile detection is handled manually in updateFlying()
    this.enemyOverlap = this.scene.physics.add.overlap(
      this.hook,
      this.enemiesGroup,
      (_hook, enemyObj) => this.onHitEnemy(enemyObj as Phaser.GameObjects.GameObject & IDamageable),
    );

    // Play launch sound
    const key = this.grappleSounds[Math.floor(Math.random() * this.grappleSounds.length)];
    this.scene.sound.play(key, { volume: 0.6 });
  }

  private onHitTile(): void {
    if (!this.hook || this.state !== 'FLYING') return;
    this.attachX = this.hook.x;
    this.attachY = this.hook.y;
    this.ropeLength = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.attachX, this.attachY,
    );
    // Floor attachment: tile is below player — release on arrival rather than locking
    this.isFloorAttachment = this.attachY > this.player.y + 20;
    this.hook.setActive(false).setVisible(false);
    (this.hook.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.state = 'ATTACHED_TILE';
    this.player.setGrappleAttached(true);
  }

  private onHitEnemy(enemy: Phaser.GameObjects.GameObject & IDamageable): void {
    if (!this.hook || this.state !== 'FLYING') return;
    enemy.takeDamage(BALANCE.GRAPPLE_DAMAGE);
    this.attachedEnemy = enemy;
    const go = enemy as unknown as Phaser.GameObjects.Components.Transform;
    this.attachX = go.x;
    this.attachY = go.y;
    this.ropeLength = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.attachX, this.attachY,
    );
    this.hook.setActive(false).setVisible(false);
    (this.hook.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.state = 'ATTACHED_ENEMY';
    this.player.setGrappleAttached(true);
  }

  private updateFlying(): void {
    if (!this.hook) return;
    if (this.hook.isOutOfRange()) {
      this.release();
      return;
    }

    // Swept tile detection: step along the path from previous to current hook position.
    // This catches tunnelling through tiles that Phaser's discrete collider would miss.
    const curX = this.hook.x;
    const curY = this.hook.y;
    const dx = curX - this.hookPrevX;
    const dy = curY - this.hookPrevY;
    const moveDist = Math.sqrt(dx * dx + dy * dy);
    if (moveDist > 0) {
      const steps = Math.max(1, Math.ceil(moveDist / 8));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const sx = this.hookPrevX + dx * t;
        const sy = this.hookPrevY + dy * t;
        const tile = this.groundLayer.getTileAtWorldXY(sx, sy);
        if (tile && tile.index !== -1) {
          // Snap hook to the sample point just before entering the tile
          const prevT = (i - 1) / steps;
          this.hook.setPosition(
            this.hookPrevX + dx * prevT,
            this.hookPrevY + dy * prevT,
          );
          this.onHitTile();
          return;
        }
      }
    }
    this.hookPrevX = curX;
    this.hookPrevY = curY;

    this.hook.updateAngle(); // rotate to match parabolic velocity
  }

  private updateAttached(): void {
    // Update attachment point for enemy (tracks moving enemy)
    if (this.attachedEnemy) {
      if (!(this.attachedEnemy as unknown as Phaser.GameObjects.GameObject).active) {
        // Enemy was destroyed — release
        this.release();
        return;
      }
      const go = this.attachedEnemy as unknown as Phaser.GameObjects.Components.Transform;
      this.attachX = go.x;
      this.attachY = go.y;
    }

    if (this.locked) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const dx = this.attachX - this.player.x;
    const dy = this.attachY - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // On reach: enemy → break; floor → release (land naturally); ceiling/wall → lock
    if (dist < 8) {
      if (this.state === 'ATTACHED_ENEMY' || this.isFloorAttachment) {
        this.release();
        return;
      }
      this.locked = true;
      body.setVelocity(0, 0);
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;

    // Pendulum constraint: remove outward velocity component when rope is taut
    if (dist >= this.ropeLength) {
      const vDotRope = body.velocity.x * nx + body.velocity.y * ny;
      if (vDotRope < 0) {
        body.setVelocityX(body.velocity.x - nx * vDotRope);
        body.setVelocityY(body.velocity.y - ny * vDotRope);
      }
    }

    // Pull force toward attachment
    const dt = this.scene.game.loop.delta / 1000;
    body.setVelocityX(body.velocity.x + nx * BALANCE.GRAPPLE_PULL_FORCE * dt);
    body.setVelocityY(body.velocity.y + ny * BALANCE.GRAPPLE_PULL_FORCE * dt);
  }

  private release(): void {
    if (this.enemyOverlap) { this.scene.physics.world.removeCollider(this.enemyOverlap); this.enemyOverlap = null; }
    this.player.setGrappleAttached(false);
    this.hook?.destroy();
    this.hook = null;
    this.attachedEnemy = null;
    this.locked = false;
    this.isFloorAttachment = false;
    this.state = 'IDLE';
  }

  /**
   * Render the chain as alternating horizontal/vertical rectangular links along
   * a quadratic bezier curve. Sag (downward bow) is proportional to rope slack.
   */
  private drawChain(): void {
    this.ropeGraphics.clear();
    if (this.state === 'IDLE') return;

    const px = this.player.x;
    const py = this.player.y;
    const endX = this.state === 'FLYING' ? (this.hook?.x ?? px) : this.attachX;
    const endY = this.state === 'FLYING' ? (this.hook?.y ?? py) : this.attachY;

    const dist = Phaser.Math.Distance.Between(px, py, endX, endY);
    if (dist < 4) return;

    // Sag: small during flight, grows as slack increases when attached
    const sagAmount = this.state === 'FLYING'
      ? dist * 0.06
      : Math.max(4, Math.min(70, (this.ropeLength - dist) * 0.5));

    // Quadratic bezier control point (pulls midpoint downward)
    const ctrlX = (px + endX) / 2;
    const ctrlY = (py + endY) / 2 + sagAmount;

    // Sample count drives link density (~1 link per 10px)
    const samples = Math.max(3, Math.floor(dist / 10));

    let linkIndex = 0;
    let prevBx = px;
    let prevBy = py;

    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const mt = 1 - t;
      const bx = mt * mt * px + 2 * mt * t * ctrlX + t * t * endX;
      const by = mt * mt * py + 2 * mt * t * ctrlY + t * t * endY;

      // Thin connector line between sample points
      this.ropeGraphics.lineStyle(1, 0x555566, 0.6);
      this.ropeGraphics.lineBetween(prevBx, prevBy, bx, by);

      // Draw a chain link every other sample
      if (i % 2 === 0) {
        linkIndex++;
        this.ropeGraphics.fillStyle(0x889aa8, 1.0);
        if (linkIndex % 2 === 0) {
          // Horizontal link
          this.ropeGraphics.fillRect(bx - 4, by - 2, 8, 4);
          this.ropeGraphics.lineStyle(1, 0x5a6b77, 0.9);
          this.ropeGraphics.strokeRect(bx - 4, by - 2, 8, 4);
        } else {
          // Vertical link
          this.ropeGraphics.fillRect(bx - 2, by - 4, 4, 8);
          this.ropeGraphics.lineStyle(1, 0x5a6b77, 0.9);
          this.ropeGraphics.strokeRect(bx - 2, by - 4, 4, 8);
        }
      }

      prevBx = bx;
      prevBy = by;
    }
  }

  /** Returns the flying hook's current world position, or null if not in flight. */
  getHookPosition(): { x: number; y: number } | null {
    if (this.state !== 'FLYING' || !this.hook) return null;
    return { x: this.hook.x, y: this.hook.y };
  }

  destroy(): void {
    if (this.state !== 'IDLE') this.release();
    this.ropeGraphics.destroy();
    this.hook?.destroy();
  }
}
