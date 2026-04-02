import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { DummyEnemy } from '../entities/DummyEnemy';
import { CombatSystem } from '../systems/CombatSystem';
import { SlowMoSystem } from '../systems/SlowMoSystem';
import { INPUT } from '../config/inputConfig';
import { BALANCE } from '../config/balanceConfig';

export class Level01Scene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private combatSystem!: CombatSystem;
  private slowMo!: SlowMoSystem;
  private spawnX = 96;
  private spawnY = 804;
  private prevMouseDown = false;

  constructor() {
    super({ key: 'Level01Scene' });
  }

  create(): void {
    const WORLD_W = 3200;
    const WORLD_H = 900;
    const GROUND_Y = 836; // top of ground surface

    // World + camera bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // Dark background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Build platforms
    this.platforms = this.physics.add.staticGroup();
    this.buildGrayboxRoom(GROUND_Y, WORLD_W);

    // Input
    const keys = this.input.keyboard!.addKeys({
      left: INPUT.MOVE_LEFT,
      right: INPUT.MOVE_RIGHT,
      jump: INPUT.JUMP,
      dash: INPUT.DASH,
      attack: INPUT.CLAW,
    }) as {
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
      jump: Phaser.Input.Keyboard.Key;
      dash: Phaser.Input.Keyboard.Key;
      attack: Phaser.Input.Keyboard.Key;
    };

    // Create player
    this.player = new Player(this, this.spawnX, this.spawnY, keys);

    // Collide player with platforms
    this.physics.add.collider(this.player, this.platforms);

    // Spawn dummy enemies
    this.enemiesGroup = this.physics.add.group();
    this.spawnEnemies(GROUND_Y);

    // Wire combat
    this.combatSystem = new CombatSystem(this, this.player, this.platforms, this.enemiesGroup);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Layout labels
    this.addLabel(200, GROUND_Y - 80, 'START\nrun here');
    this.addLabel(490, GROUND_Y - 80, '← 120px\njump gap');
    this.addLabel(840, GROUND_Y - 80, '← 160px\nrunning jump');
    this.addLabel(1220, GROUND_Y - 80, '← 220px\nDASH ONLY');
    this.addLabel(1760, GROUND_Y - 400, 'WALL\nJUMP\nSHAFT');
    this.addLabel(2500, 700, 'DOUBLE\nJUMP\nPLATFORMS');

    // Respawn if player falls below world
    this.events.on('update', () => {
      if (this.player.y > WORLD_H + 100) {
        this.player.respawn(this.spawnX, this.spawnY);
        this.game.events.emit('ammo-changed', this.player.getAmmo());
      }
    });

    // Launch UIScene overlay
    this.scene.launch('UIScene');

    // Wire slow-mo system
    this.slowMo = new SlowMoSystem(this);
    this.events.once('shutdown', () => {
      this.slowMo.destroy();
      this.scene.stop('UIScene');
    });

    // Level music
    this.sound.play('music_level1', { loop: true, volume: 0.5 });

    // Emit initial ammo to UIScene
    this.game.events.emit('ammo-changed', BALANCE.SHURIKEN_MAX_AMMO);
  }

  private spawnEnemies(groundY: number): void {
    const spawnY = groundY - 32; // center of enemy body (64px tall, bottom on ground)
    const enemies: DummyEnemy[] = [
      new DummyEnemy(this, 300,  spawnY),                  // 1: close range — test claw
      new DummyEnemy(this, 700,  spawnY),                  // 2: after first gap — test shuriken across gap
      new DummyEnemy(this, 1150, spawnY),                  // 3: test claw while running
      new DummyEnemy(this, 1650, groundY - 128 - 32),      // 4: elevated — test shuriken arc aim-up
      new DummyEnemy(this, 2200, spawnY),                  // 5: after wall jump shaft — mid-range shuriken
    ];
    enemies.forEach(e => this.enemiesGroup.add(e));
  }

  private buildGrayboxRoom(groundY: number, worldW: number): void {
    const h = 64;
    const G = groundY + h / 2;

    const add = (cx: number, cy: number, w: number, rh: number, color: number) => {
      const rect = this.add.rectangle(cx, cy, w, rh, color);
      this.physics.add.existing(rect, true);
      this.platforms.add(rect as unknown as Phaser.GameObjects.GameObject);
    };

    add(200, G, 400, h, 0x555566);
    add(680, G, 320, h, 0x555566);
    add(1120, G, 240, h, 0x555566);
    add(1605, G, 290, h, 0x556655);

    const shaftH = groundY - 436;
    add(1855, G, 160, h, 0x555566);
    add(1800, 436 + shaftH / 2, 32, shaftH, 0x775555);
    add(1928, 436 + shaftH / 2, 32, shaftH, 0x775555);

    add(2130, G, 340, h, 0x555566);
    add(2480, groundY - 128, 180, 24, 0x557755);
    add(2700, groundY - 256, 180, 24, 0x557755);
    add(2920, groundY - 384, 180, 24, 0x557755);
    add(3100, G, 400, h, 0x555566);
    add(worldW / 2, -16, worldW, 32, 0x333344);
  }

  private addLabel(x: number, y: number, text: string): void {
    this.add.text(x, y, text, {
      fontSize: '14px',
      color: '#888899',
      align: 'center',
    }).setOrigin(0.5);
  }

  update(_time: number, delta: number): void {
    this.player.update(delta);

    // Left-click fires shuriken
    const pointer = this.input.activePointer;
    const isDown = pointer.leftButtonDown();

    // Fire only on transition from not-pressed to pressed
    // canFire() checked before consumeAmmo() to avoid consuming ammo when locked
    if (isDown && !this.prevMouseDown && this.slowMo.canFire() && this.player.consumeAmmo()) {
      this.combatSystem.fireShuriken(
        this.player.x, this.player.y,
        pointer.worldX, pointer.worldY,
      );
      this.slowMo.onFired();
      this.game.events.emit('slowmo-shot');
      this.game.events.emit('ammo-changed', this.player.getAmmo());
    }

    this.prevMouseDown = isDown;
    this.slowMo.update(pointer);
  }
}
