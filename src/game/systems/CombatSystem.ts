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

    // Debounce: prevent the same attack swing from playing a hit sound more than once
    let lastMeleeHitSoundTime = -Infinity;

    // 1. Claw hits enemies — play front/behind hit sound once per swing
    scene.physics.add.overlap(
      player.clawHitbox,
      enemiesGroup,
      (_hitbox, enemyObj) => {
        const enemy = enemyObj as unknown as IDamageable;
        enemy.takeDamage(BALANCE.CLAW_DAMAGE);

        const now = scene.time.now;
        if (now - lastMeleeHitSoundTime > BALANCE.CLAW_COOLDOWN_MS * 0.8) {
          lastMeleeHitSoundTime = now;
          const enemyGO = enemyObj as unknown as { x: number };
          const facing = player.getFacing();
          const inFront = (facing === 'right' && enemyGO.x >= player.x) ||
                          (facing === 'left'  && enemyGO.x <= player.x);
          const keys = inFront
            ? ['melee_hitfront_1', 'melee_hitfront_2']
            : ['melee_hitbehind_1', 'melee_hitbehind_2', 'melee_hitbehind_3'];
          scene.sound.play(keys[Math.floor(Math.random() * keys.length)], { volume: 0.7 });
        }
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

    // 4. Claw hits tiles — play tile-hit sound once per swing
    let lastMeleeTileHitSoundTime = -Infinity;
    scene.physics.add.collider(
      player.clawHitbox,
      platformsCollider,
      () => {
        if (!(player.clawHitbox.body as Phaser.Physics.Arcade.Body).enable) return;
        const now = scene.time.now;
        if (now - lastMeleeTileHitSoundTime > BALANCE.CLAW_COOLDOWN_MS * 0.8) {
          lastMeleeTileHitSoundTime = now;
          scene.sound.play('melee_hittile_1', { volume: 0.7 });
        }
      },
    );
  }

  fireShuriken(fromX: number, fromY: number, worldX: number, worldY: number): void {
    const shuriken = new Shuriken(this.scene, fromX, fromY);
    this.shurikenGroup.add(shuriken, true);
    shuriken.setVelocityToward(fromX, fromY, worldX, worldY);
  }
}
