import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Loading...', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // CatNinja (already loaded)
    this.load.spritesheet('catninja', 'assets/Sprites/Sprites CatNinja.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Shuriken — cropped single frame (48×48) from top-right of Sprites Shurikens.png
    this.load.image('shuriken', 'assets/Sprites/Shuriken.png');

    // Evil Granny spritesheet (128×128 frames, 16 per row)
    this.load.spritesheet('evilgranny',
      'assets/Sprites/Sprites EvilGrandma TRex.png',
      { frameWidth: 128, frameHeight: 128 },
    );

    // Tilemap — Tiled JSON export
    this.load.tilemapTiledJSON('level01', 'assets/tiles/level01.json');

    // Kenney Pixel Platformer Industrial Expansion — 18×18 tiles, no spacing
    this.load.spritesheet('tiles',
      'assets/tiles/kenney_pixel-platformer-industrial-expansion/Tilemap/tilemap_packed.png',
      { frameWidth: 18, frameHeight: 18 },
    );

    // Shuriken launch SFX
    this.load.audio('shuriken_1', 'assets/SoundEffects/shuriken launch/sword.1.ogg');
    this.load.audio('shuriken_2', 'assets/SoundEffects/shuriken launch/sword.2.ogg');
    this.load.audio('shuriken_3', 'assets/SoundEffects/shuriken launch/sword.3.ogg');
    this.load.audio('shuriken_4', 'assets/SoundEffects/shuriken launch/sword.4.ogg');
    this.load.audio('shuriken_5', 'assets/SoundEffects/shuriken launch/sword.5.ogg');

    // Grapple launch SFX
    this.load.audio('grapple_launch_1', 'assets/SoundEffects/grappling hook launch/melee sound.wav');
    this.load.audio('grapple_launch_2', 'assets/SoundEffects/grappling hook launch/sword sound.wav');

    // Melee SFX
    this.load.audio('melee_hitnothing_1', 'assets/SoundEffects/melee hitnothing/animal melee sound.wav');
    this.load.audio('melee_hitbehind_1', 'assets/SoundEffects/melee hitbehind/Socapex - new_hits_7.wav');
    this.load.audio('melee_hitbehind_2', 'assets/SoundEffects/melee hitbehind/Socapex - new_hits_8.wav');
    this.load.audio('melee_hitbehind_3', 'assets/SoundEffects/melee hitbehind/Socapex - new_hits_9.wav');
    this.load.audio('melee_hitfront_1', 'assets/SoundEffects/melee hitfront/Socapex - new_hits_5.wav');
    this.load.audio('melee_hitfront_2', 'assets/SoundEffects/melee hitfront/Socapex - new_hits_6.wav');
    this.load.audio('melee_hittile_1', 'assets/SoundEffects/melee hittile/Socapex - small knock.wav');

    // Level 1 music
    this.load.audio('music_level1', 'assets/Music/BlackTrendMusic - Sport Games.mp3');
  }

  create(): void {
    // 1×1 white pixel texture used by DummyEnemy (tinted at runtime)
    const pixelData = this.textures.generate('pixel', {
      data: ['#'],
      pixelWidth: 1,
    });
    void pixelData; // suppress unused-variable warning

    this.createAnimations();
    this.scene.start('MenuScene');
  }

  private createAnimations(): void {
    const anims = this.anims;

    // --- Idle: row 0, frames 0–3 ---
    anims.create({
      key: 'idle',
      frames: anims.generateFrameNumbers('catninja', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    // --- Walk: row 1, frames 16–23 ---
    anims.create({
      key: 'walk',
      frames: anims.generateFrameNumbers('catninja', { start: 16, end: 23 }),
      frameRate: 12,
      repeat: -1,
    });

    // --- Jump start (rising): row 2, frames 32–33 ---
    anims.create({
      key: 'jump_start',
      frames: anims.generateFrameNumbers('catninja', { start: 32, end: 33 }),
      frameRate: 12,
      repeat: 0,
    });

    // --- Jump air (loop at apex): row 2, frames 34–35 ---
    anims.create({
      key: 'jump_air',
      frames: anims.generateFrameNumbers('catninja', { start: 34, end: 35 }),
      frameRate: 8,
      repeat: -1,
    });

    // --- Jump fall (descending): row 2, frames 36–39 ---
    anims.create({
      key: 'jump_fall',
      frames: anims.generateFrameNumbers('catninja', { start: 36, end: 39 }),
      frameRate: 10,
      repeat: 0,
    });

    // --- Double jump spin start: row 3, frames 48–50 ---
    anims.create({
      key: 'spin_start',
      frames: anims.generateFrameNumbers('catninja', { start: 48, end: 50 }),
      frameRate: 14,
      repeat: 0,
    });

    // --- Double jump spin air (loop): row 3, frames 51–54 ---
    anims.create({
      key: 'spin_air',
      frames: anims.generateFrameNumbers('catninja', { start: 51, end: 54 }),
      frameRate: 14,
      repeat: -1,
    });

    // --- Dash (flying kick go frames): row 7, frames 117–118 ---
    anims.create({
      key: 'dash',
      frames: anims.generateFrameNumbers('catninja', { start: 117, end: 118 }),
      frameRate: 14,
      repeat: -1,
    });

    // --- Dead: row 4, frames 64–70 ---
    anims.create({
      key: 'dead',
      frames: anims.generateFrameNumbers('catninja', { start: 64, end: 70 }),
      frameRate: 10,
      repeat: 0,
    });

    // Shuriken is a plain image — rotation is handled in Shuriken.update(), no animation needed.

    // --- Claw attack: CatNinja rows 5–6 ---
    // Row 5 = frames 80–95, row 6 = frames 96–111 (64px wide, 16 per row).
    // Use first 4 frames of row 5 (80–83) as a minimal claw strike; extend if row has more distinct frames.
    anims.create({
      key: 'claw',
      frames: anims.generateFrameNumbers('catninja', { start: 80, end: 83 }),
      frameRate: 16,
      repeat: 0,
    });

    // --- Evil Granny ---
    anims.create({
      key: 'granny_idle',
      frames: anims.generateFrameNumbers('evilgranny', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
    anims.create({
      key: 'granny_walk',
      frames: anims.generateFrameNumbers('evilgranny', { start: 32, end: 39 }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'granny_telegraph',
      frames: anims.generateFrameNumbers('evilgranny', { start: 48, end: 55 }),
      frameRate: 10,
      repeat: 0,
    });
    anims.create({
      key: 'granny_swing',
      frames: anims.generateFrameNumbers('evilgranny', { start: 64, end: 71 }),
      frameRate: 14,
      repeat: 0,
    });
    anims.create({
      key: 'granny_hurt',
      frames: anims.generateFrameNumbers('evilgranny', { start: 80, end: 83 }),
      frameRate: 10,
      repeat: 0,
    });
    anims.create({
      key: 'granny_dead',
      frames: anims.generateFrameNumbers('evilgranny', { start: 96, end: 103 }),
      frameRate: 8,
      repeat: 0,
    });
  }
}
