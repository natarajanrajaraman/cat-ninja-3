import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { DummyEnemy } from '../entities/DummyEnemy';
import { CombatSystem } from '../systems/CombatSystem';
import { SlowMoSystem } from '../systems/SlowMoSystem';
import { INPUT } from '../config/inputConfig';
import { BALANCE } from '../config/balanceConfig';
import { PlayerState } from '../types/PlayerTypes';
import { Checkpoint } from '../entities/Checkpoint';

export class Level01Scene extends Phaser.Scene {
  private player!: Player;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private combatSystem!: CombatSystem;
  private slowMo!: SlowMoSystem;
  private spawnX = 96;
  private spawnY = 790; // tilemap ground surface = row 24 × 36px = 864; player falls into position on start
  private prevMouseDown = false;
  private lives = BALANCE.PLAYER_MAX_LIVES;
  private deathPending = false;
  private activeCheckpoint: Checkpoint | null = null;
  // @ts-ignore TS6133 — stored to maintain class references across scene restarts
  private checkpoints: Checkpoint[] = [];

  // Floating HUD (world-space, follows player)
  private floatHpBg!: Phaser.GameObjects.Rectangle;
  private floatHpFill!: Phaser.GameObjects.Rectangle;
  private floatAmmoBar!: Phaser.GameObjects.Graphics;
  private static readonly FLOAT_BAR_W = 48;
  private static readonly FLOAT_BAR_H = 5;
  private static readonly FLOAT_Y_OFFSET = 52; // px above player.y (body-bottom is at y+40, top at y-56)

  constructor() {
    super({ key: 'Level01Scene' });
  }

  create(): void {
    // Tilemap — loaded from Tiled JSON export
    const map = this.make.tilemap({ key: 'level01' });
    const tileset = map.addTilesetImage('tilemap_packed', 'tiles');
    const ground = map.createLayer('ground', tileset!)!;
    ground.setScale(2); // 18px tiles → 36px in-game
    ground.setCollisionByExclusion([-1]); // every painted tile is solid

    // Optional decoration layer (non-collidable)
    const deco = map.createLayer('decoration', tileset!);
    if (deco) deco.setScale(2);

    // World + camera bounds from actual map dimensions (scaled)
    const W = map.widthInPixels * 2;
    const H = map.heightInPixels * 2;
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);

    this.cameras.main.setBackgroundColor('#1a1a2e');

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

    // Collide player with tilemap ground layer
    this.physics.add.collider(this.player, ground);

    // Checkpoints — CP1 after dash gap, CP2 after wall-jump shaft
    // Ground surface Y = 836; checkpoint centre Y = 836 - 32 = 804 (64 px tall, bottom on ground)
    const RESPAWN_Y = this.spawnY; // 790 — same ground-level spawn used at level start
    const cp1 = new Checkpoint(this, 1650, 804, RESPAWN_Y, 'CP1');
    const cp2 = new Checkpoint(this, 2130, 804, RESPAWN_Y, 'CP2');
    this.checkpoints = [cp1, cp2];

    [cp1, cp2].forEach(cp => {
      this.physics.add.overlap(
        this.player,
        cp.getRect(), // overlap needs the Rectangle, not the wrapper class
        () => this.onCheckpointOverlap(cp),
      );
    });

    // Spawn dummy enemies — ground surface = row 24 × 36px = 864; update positions after level is laid out
    const TEMP_GROUND_Y = 864;
    this.enemiesGroup = this.physics.add.group();
    this.spawnEnemies(TEMP_GROUND_Y);

    // Wire combat — pass ground layer instead of platforms StaticGroup
    this.combatSystem = new CombatSystem(this, this.player, ground, this.enemiesGroup);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Instant-kill if player falls below world
    this.events.on('update', () => {
      if (this.player.y > H + 100 && !this.player.isInState(PlayerState.DEAD)) {
        this.player.takeDamage(BALANCE.PLAYER_MAX_HEALTH);
      }
    });

    // --- Floating HUD (world-space, above player) ---
    const BW = Level01Scene.FLOAT_BAR_W;
    const BH = Level01Scene.FLOAT_BAR_H;
    this.floatHpBg   = this.add.rectangle(0, 0, BW, BH, 0x111122).setDepth(20);
    this.floatHpFill = this.add.rectangle(0, 0, BW, BH, 0x44cc66).setDepth(21).setOrigin(0, 0.5);
    this.floatAmmoBar = this.add.graphics().setDepth(21);

    // Launch UIScene overlay
    this.scene.launch('UIScene');

    // Wire slow-mo system
    this.slowMo = new SlowMoSystem(this);

    // Listen for player death
    this.game.events.on('player-died', this.handlePlayerDeath, this);

    this.events.once('shutdown', () => {
      this.slowMo.destroy();
      this.scene.stop('UIScene');
      this.game.events.off('player-died', this.handlePlayerDeath, this);
    });

    // Level music
    this.sound.play('music_level1', { loop: true, volume: 0.5 });

    // Emit initial HUD state — deferred one tick so UIScene.create() has run first
    this.time.delayedCall(0, () => {
      this.game.events.emit('ammo-changed', BALANCE.SHURIKEN_MAX_AMMO);
      this.game.events.emit('player-health-changed', {
        health: BALANCE.PLAYER_MAX_HEALTH,
        maxHealth: BALANCE.PLAYER_MAX_HEALTH,
      });
      this.game.events.emit('player-lives-changed', this.lives);
    });
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

  private onCheckpointOverlap(cp: Checkpoint): void {
    if (cp.isActivated()) return;
    cp.activate();
    this.activeCheckpoint = cp;
    this.showCheckpointPopup(cp.x, cp.y);
  }

  private showCheckpointPopup(x: number, y: number): void {
    const text = this.add.text(x, y - 48, 'CHECKPOINT', {
      fontSize: '16px',
      color: '#ffcc44',
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: text,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy(),
    });
  }

  private handlePlayerDeath(): void {
    if (this.deathPending) return;
    this.deathPending = true;

    this.lives -= 1;

    if (this.lives <= 0) {
      // No lives left — go to game over after the death animation plays
      this.time.delayedCall(1200, () => {
        this.scene.start('GameOverScene');
      });
      return;
    }

    this.game.events.emit('player-lives-changed', this.lives);

    // Wait for death animation, then respawn
    this.time.delayedCall(900, () => {
      const rx = this.activeCheckpoint?.x ?? this.spawnX;
      const ry = this.activeCheckpoint?.getRespawnY() ?? this.spawnY;
      this.player.respawn(rx, ry);
      // respawn() already emits player-health-changed internally; ammo-changed is not emitted
      // there, so we emit it here to keep the HUD in sync.
      this.game.events.emit('ammo-changed', this.player.getAmmo());
      this.deathPending = false;
    });
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
    this.game.registry.set('playerPos', { x: Math.round(this.player.x), y: Math.round(this.player.y) });
    this.slowMo.update(pointer);

    this.updateFloatingHUD();
  }

  private updateFloatingHUD(): void {
    const BW  = Level01Scene.FLOAT_BAR_W;
    const BH  = Level01Scene.FLOAT_BAR_H;
    const OFF = Level01Scene.FLOAT_Y_OFFSET;
    const px  = this.player.x;
    const hpY = this.player.y - OFF;       // HP bar centre
    const amY = this.player.y - OFF - 8;   // ammo bar, 8px above HP bar

    // HP bar background
    this.floatHpBg.setPosition(px, hpY);

    // HP bar fill (left-anchored origin)
    const pct = Phaser.Math.Clamp(this.player.getHealth() / BALANCE.PLAYER_MAX_HEALTH, 0, 1);
    this.floatHpFill.setPosition(px - BW / 2, hpY);
    this.floatHpFill.setDisplaySize(BW * pct, BH);
    if (pct > 0.5)       this.floatHpFill.setFillStyle(0x44cc66);
    else if (pct > 0.25) this.floatHpFill.setFillStyle(0xddcc22);
    else                 this.floatHpFill.setFillStyle(0xcc3333);

    // Ammo segmented bar — 10 cells, each 4×4 px with 1px gap
    const SEG_W = 4;
    const SEG_H = 4;
    const GAP   = 1;
    const MAX   = BALANCE.SHURIKEN_MAX_AMMO;
    const totalW = MAX * SEG_W + (MAX - 1) * GAP;
    const startX = px - totalW / 2;
    const ammo   = this.player.getAmmo();
    this.floatAmmoBar.clear();
    for (let i = 0; i < MAX; i++) {
      const filled = i < ammo;
      this.floatAmmoBar.fillStyle(filled ? 0x88ccff : 0x222233, filled ? 1 : 0.7);
      this.floatAmmoBar.fillRect(startX + i * (SEG_W + GAP), amY - SEG_H / 2, SEG_W, SEG_H);
    }
  }
}
