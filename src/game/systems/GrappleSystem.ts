// src/game/systems/GrappleSystem.ts
import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GrappleHook } from '../entities/GrappleHook';
import { IDamageable } from '../types/CombatTypes';
import { BALANCE } from '../config/balanceConfig';
import { PlayerState } from '../types/PlayerTypes';

type GrappleState = 'IDLE' | 'FLYING' | 'ATTACHED_TILE' | 'ATTACHED_ENEMY';

/**
 * Manages grappling hook: firing, attachment, rope pendulum physics, and rope rendering.
 *
 * Right-click fires the hook. On tile/enemy contact the player swings on the rope
 * and locks to the surface. Jump or right-click again to release.
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
  private locked = false; // true once player reaches the surface

  private prevRightDown = false;

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
        if (rightJustPressed) this.release(); // re-fire: release and immediately fire new hook
        // Jump while flying: just release (player falls normally)
        if (Phaser.Input.Keyboard.JustDown(
          this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        )) {
          this.release();
        }
        break;

      case 'ATTACHED_TILE':
      case 'ATTACHED_ENEMY':
        this.updateAttached();
        if (rightJustPressed) {
          this.release();
          this.fire(pointer.worldX, pointer.worldY);
          return;
        }
        // Jump to release
        if (Phaser.Input.Keyboard.JustDown(
          this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        )) {
          this.release();
        }
        break;
    }

    this.drawRope();
  }

  private fire(worldX: number, worldY: number): void {
    this.hook?.destroy();
    this.hook = new GrappleHook(this.scene, this.player.x, this.player.y);
    this.hook.launch(worldX, worldY);
    this.state = 'FLYING';
    this.locked = false;
    this.attachedEnemy = null;

    // Wire collisions for this hook instance
    this.scene.physics.add.collider(
      this.hook,
      this.groundLayer,
      () => this.onHitTile(),
    );
    this.scene.physics.add.overlap(
      this.hook,
      this.enemiesGroup,
      (_hook, enemyObj) => this.onHitEnemy(enemyObj as Phaser.GameObjects.GameObject & IDamageable),
    );
  }

  private onHitTile(): void {
    if (!this.hook || this.state !== 'FLYING') return;
    this.attachX = this.hook.x;
    this.attachY = this.hook.y;
    this.ropeLength = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.attachX, this.attachY,
    );
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
    }
  }

  private updateAttached(): void {
    // Update attachment point for enemy (tracks enemy position if it moves)
    if (this.attachedEnemy) {
      const go = this.attachedEnemy as unknown as Phaser.GameObjects.Components.Transform;
      this.attachX = go.x;
      this.attachY = go.y;
    }

    if (this.locked) return; // already locked to surface — wait for jump

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const dx = this.attachX - this.player.x;
    const dy = this.attachY - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Lock to surface when close enough
    if (dist < 8) {
      this.locked = true;
      body.setVelocity(0, 0);
      return;
    }

    // Normalised direction toward attachment
    const nx = dx / dist;
    const ny = dy / dist;

    // Pendulum constraint: if rope is taut, remove outward velocity component
    if (dist >= this.ropeLength) {
      const vDotRope = body.velocity.x * nx + body.velocity.y * ny;
      if (vDotRope < 0) {
        // Moving away — remove that component
        body.setVelocityX(body.velocity.x - nx * vDotRope);
        body.setVelocityY(body.velocity.y - ny * vDotRope);
      }
    }

    // Pull force toward attachment point (creates the swing)
    const dt = this.scene.game.loop.delta / 1000;
    body.setVelocityX(body.velocity.x + nx * BALANCE.GRAPPLE_PULL_FORCE * dt);
    body.setVelocityY(body.velocity.y + ny * BALANCE.GRAPPLE_PULL_FORCE * dt);
  }

  private release(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.player.setGrappleAttached(false);
    this.hook?.destroy();
    this.hook = null;
    this.attachedEnemy = null;
    this.locked = false;
    this.state = 'IDLE';
    // Gravity is restored inside setGrappleAttached(false)
    // Carry current velocity as launch momentum
    void body; // velocity already applied
  }

  private drawRope(): void {
    this.ropeGraphics.clear();
    if (this.state === 'IDLE') return;

    const endX = this.state === 'FLYING' ? (this.hook?.x ?? this.player.x) : this.attachX;
    const endY = this.state === 'FLYING' ? (this.hook?.y ?? this.player.y) : this.attachY;

    this.ropeGraphics.lineStyle(2, 0xaaaaaa, 0.9);
    this.ropeGraphics.lineBetween(this.player.x, this.player.y, endX, endY);
  }

  destroy(): void {
    if (this.state !== 'IDLE') {
      this.release();
    }
    this.ropeGraphics.destroy();
    this.hook?.destroy();
  }
}
