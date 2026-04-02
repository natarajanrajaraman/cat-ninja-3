import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';

/**
 * Manages slow-motion aim state and Phaser time scaling.
 * Visuals (crosshair, overlay) are handled by UIScene via game events.
 *
 * Lifecycle per right-click press:
 *   enter → player may fire once → onFired() locks further shots → exit on release
 */
export class SlowMoSystem {
  private readonly scene: Phaser.Scene;
  private active = false;
  private hasShot = false;
  private prevRightDown = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Call every frame from Level01Scene.update(), AFTER the fire check. */
  update(pointer: Phaser.Input.Pointer): void {
    const rightDown = pointer.rightButtonDown();

    if (rightDown && !this.prevRightDown) {
      this.enter();
    } else if (!rightDown && this.prevRightDown) {
      this.exit();
    }

    this.prevRightDown = rightDown;
  }

  /** True while right-click is held. */
  isActive(): boolean {
    return this.active;
  }

  /**
   * True when a shuriken may be fired.
   * Returns true when slow-mo is inactive (normal fire allowed).
   * Returns true when slow-mo is active AND no shot has been fired this entry.
   * Returns false when slow-mo is active AND shot has already been fired.
   */
  canFire(): boolean {
    if (!this.active) return true;
    return !this.hasShot;
  }

  /** Call from Level01Scene immediately after firing a shuriken in slow-mo. */
  onFired(): void {
    if (this.active) {
      this.hasShot = true;
    }
  }

  /** Restore time scales if destroyed while active (e.g., scene shutdown). */
  destroy(): void {
    if (this.active) {
      this.exit();
    }
  }

  private enter(): void {
    this.active = true;
    this.hasShot = false;
    this.scene.physics.world.timeScale = BALANCE.SLOWMO_TIMESCALE;
    this.scene.time.timeScale = BALANCE.SLOWMO_TIMESCALE;
    this.scene.anims.globalTimeScale = BALANCE.SLOWMO_TIMESCALE;
    this.scene.game.events.emit('slowmo-enter');
  }

  private exit(): void {
    this.active = false;
    this.scene.physics.world.timeScale = 1;
    this.scene.time.timeScale = 1;
    this.scene.anims.globalTimeScale = 1;
    this.scene.game.events.emit('slowmo-exit');
  }
}
