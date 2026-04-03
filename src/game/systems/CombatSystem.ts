import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Shuriken } from '../entities/Shuriken';
import { IDamageable } from '../types/CombatTypes';
import { BALANCE } from '../config/balanceConfig';

export class CombatSystem {
  private scene: Phaser.Scene;
  private shurikenGroup: Phaser.Physics.Arcade.Group;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    platformsCollider: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    enemiesGroup: Phaser.Physics.Arcade.Group,
  ) {
    this.scene = scene;

    this.shurikenGroup = scene.physics.add.group({
      classType: Shuriken,
      runChildUpdate: true,
      // gravityY must be set here — createCallbackHandler overwrites any value set in the
      // Shuriken constructor when the object is added to this group.
      gravityY: BALANCE.SHURIKEN_GRAVITY,
    });

    // 1. Claw hits enemies
    scene.physics.add.overlap(
      player.clawHitbox,
      enemiesGroup,
      (_hitbox, enemyObj) => {
        const enemy = enemyObj as unknown as IDamageable;
        enemy.takeDamage(BALANCE.CLAW_DAMAGE);
      },
    );

    // 2. Shurikens hit enemies
    scene.physics.add.overlap(
      this.shurikenGroup,
      enemiesGroup,
      (shurikenObj, enemyObj) => {
        const shuriken = shurikenObj as Shuriken;
        const enemy = enemyObj as unknown as IDamageable;
        if (shuriken.active) {
          enemy.takeDamage(BALANCE.SHURIKEN_DAMAGE);
          shuriken.destroy();
        }
      },
    );

    // 3. Shurikens hit platforms (collider required for TilemapLayer — overlap is unreliable)
    scene.physics.add.collider(
      this.shurikenGroup,
      platformsCollider,
      (shurikenObj) => {
        const shuriken = shurikenObj as Shuriken;
        if (shuriken.active) shuriken.destroy();
      },
    );
  }

  fireShuriken(fromX: number, fromY: number, worldX: number, worldY: number): void {
    const shuriken = new Shuriken(this.scene, fromX, fromY);
    this.shurikenGroup.add(shuriken, true);
    shuriken.setVelocityToward(fromX, fromY, worldX, worldY);
  }
}
