import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { INPUT } from '../config/inputConfig';

export class Level01Scene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private spawnX = 96;
  private spawnY = 804;

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

    // Input — scene owns the keyboard, passes refs to player
    const keys = this.input.keyboard!.addKeys({
      left: INPUT.MOVE_LEFT,
      right: INPUT.MOVE_RIGHT,
      jump: INPUT.JUMP,
      dash: INPUT.DASH,
    }) as {
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
      jump: Phaser.Input.Keyboard.Key;
      dash: Phaser.Input.Keyboard.Key;
    };

    // Create player
    this.player = new Player(this, this.spawnX, this.spawnY, keys);

    // Collide player with platforms
    this.physics.add.collider(this.player, this.platforms);

    // Camera follow with light lerp
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Labels to explain the layout
    this.addLabel(200, GROUND_Y - 80, 'START\nrun here');
    this.addLabel(490, GROUND_Y - 80, '← 120px\njump gap');
    this.addLabel(840, GROUND_Y - 80, '← 160px\nrunning jump');
    this.addLabel(1220, GROUND_Y - 80, '← 220px\nDASH ONLY');
    this.addLabel(1760, GROUND_Y - 400, 'WALL\nJUMP\nSHAFT');
    this.addLabel(2500, 700, 'DOUBLE\nJUMP\nPLATFORMS');

    // Respawn if player falls below world
    this.events.on('update', () => {
      if (this.player.y > WORLD_H + 100) {
        this.player.setPosition(this.spawnX, this.spawnY);
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });
  }

  private buildGrayboxRoom(groundY: number, worldW: number): void {
    const h = 64; // ground height
    const G = groundY + h / 2; // center Y of ground-level platforms

    // Helper: add a colored static rectangle with physics
    const add = (cx: number, cy: number, w: number, rh: number, color: number) => {
      const rect = this.add.rectangle(cx, cy, w, rh, color);
      this.physics.add.existing(rect, true);
      this.platforms.add(rect as unknown as Phaser.GameObjects.GameObject);
    };

    // --- Ground segments (with gaps) ---
    // Segment 1: Start area (0–400)
    add(200, G, 400, h, 0x555566);
    // Gap 1: 400–520 (120px) — basic jump

    // Segment 2: 520–840
    add(680, G, 320, h, 0x555566);
    // Gap 2: 840–1000 (160px) — running jump

    // Segment 3: 1000–1240
    add(1120, G, 240, h, 0x555566);
    // Gap 3: 1240–1460 (220px = DASH_DISTANCE) — dash only!

    // Segment 4: 1460–1750
    add(1605, G, 290, h, 0x556655);

    // --- Wall jump shaft: x=1800–1960 ---
    // Floor inside shaft
    add(1855, G, 160, h, 0x555566);
    // Left wall (x=1800, w=32, from y=500 to groundY)
    const shaftH = groundY - 436;
    add(1800, 436 + shaftH / 2, 32, shaftH, 0x775555);
    // Right wall (x=1928, w=32)
    add(1928, 436 + shaftH / 2, 32, shaftH, 0x775555);

    // Segment 5: 1960–2300 (after shaft)
    add(2130, G, 340, h, 0x555566);

    // --- Elevated double-jump platforms ---
    add(2480, groundY - 128, 180, 24, 0x557755);  // 128px up
    add(2700, groundY - 256, 180, 24, 0x557755);  // 256px up
    add(2920, groundY - 384, 180, 24, 0x557755);  // 384px up

    // Segment 6: End area (3000–3200)
    add(3100, G, 400, h, 0x555566);

    // Ceiling to prevent going out of top
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
  }
}
