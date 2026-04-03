---
title: Tilemap Rendering — Design Spec
date: 2026-04-03
status: approved
---

# Tilemap Rendering

## Overview

Replace Level01's graybox platform rectangles with a Phaser `StaticTilemapLayer` driven by a Tiled-exported JSON map. Visuals and physics both come from the tilemap. Everything else (Player, enemies, CombatSystem, checkpoints, HUD) is unchanged.

---

## Assets

| File | Role |
|---|---|
| `public/assets/tiles/kenney_pixel-platformer-industrial-expansion/Tilemap/tilemap_packed.png` | Tileset image — 288×126px, 18×18px tiles, 16 cols × 7 rows, no spacing |
| `public/assets/tiles/level01.json` | Tiled map export (user-created) |

**Tileset:** Kenney Pixel Platformer Industrial Expansion, CC0.

---

## Tiled Map Setup (user creates this)

- **Map type:** Orthogonal
- **Tile size:** 18×18 px
- **Map size:** 90 tiles wide × 26 tiles tall
- **Tileset:** add `tilemap_packed.png`, tile size 18×18, no spacing, no margin
- **Layers:**
  - `ground` — Tile Layer. Paint all solid/collidable tiles here (platforms, walls, floor). Phaser derives physics collision from this layer.
  - `decoration` — Tile Layer (optional). Non-collidable background detail (pipes, warning signs, etc.).
- **Export:** File → Export As → JSON format → `public/assets/tiles/level01.json`
  - "Embed tilesets" must be **off** so Phaser can resolve the tileset path independently.

The tileset name inside the exported JSON must be `tilemap_packed` — this is the key Phaser uses to look it up. In Tiled, name the tileset `tilemap_packed` before exporting.

---

## In-Game Scale

The tilemap layer is scaled **2×** in Phaser, making each 18×18 tile render as **36×36 px** in-game. At this scale a 90×26 tile map covers approximately **3240×936 px** — the world and camera bounds are set to the scaled map dimensions dynamically at runtime.

The player (128×128 visual) spans roughly 3–4 tiles wide and 4 tiles tall at this scale, which gives comfortable platform proportions.

---

## Code Changes

### PreloadScene — add two load calls

```ts
this.load.tilemapTiledJSON('level01', 'assets/tiles/level01.json');
this.load.spritesheet('tiles',
  'assets/tiles/kenney_pixel-platformer-industrial-expansion/Tilemap/tilemap_packed.png',
  { frameWidth: 18, frameHeight: 18 },
);
```

### Level01Scene

**Remove:**
- `private platforms: Phaser.Physics.Arcade.StaticGroup` field
- `buildGrayboxRoom()` method and its call in `create()`
- `this.physics.add.collider(this.player, this.platforms)` line
- `addLabel()` calls and `private addLabel()` method (graybox orientation markers, no longer needed)
- Hardcoded `WORLD_W`, `WORLD_H`, `GROUND_Y` constants in `create()` — replaced by map dimensions

**Add in `create()` (replaces `buildGrayboxRoom` call):**

```ts
const map = this.make.tilemap({ key: 'level01' });
const tileset = map.addTilesetImage('tilemap_packed', 'tiles');
const ground = map.createLayer('ground', tileset!)!;
ground.setScale(2);
ground.setCollisionByExclusion([-1]); // every painted tile is solid

// Optional decoration layer
const deco = map.createLayer('decoration', tileset!);
if (deco) deco.setScale(2);

// World + camera bounds from actual map dimensions
const W = map.widthInPixels * 2;
const H = map.heightInPixels * 2;
this.physics.world.setBounds(0, 0, W, H);
this.cameras.main.setBounds(0, 0, W, H);
```

**Replace player–platform collider:**
```ts
// was: this.physics.add.collider(this.player, this.platforms);
this.physics.add.collider(this.player, ground);
```

**Pass `ground` layer to CombatSystem:**
```ts
this.combatSystem = new CombatSystem(this, this.player, ground, this.enemiesGroup);
```

**`spawnX` / `spawnY`:** Keep at 96 / 790 as defaults; adjust after laying out the Tiled map to match the actual ground surface in the new level.

**`spawnEnemies(groundY)`:** `GROUND_Y` currently lives inside `buildGrayboxRoom()` and is passed to `spawnEnemies`. When `buildGrayboxRoom` is removed, replace the call with a temporary constant: `const TEMP_GROUND_Y = 836; this.spawnEnemies(TEMP_GROUND_Y);`. Adjust after the level is laid out in Tiled.

**Checkpoint positions:** Keep existing hardcoded x=1650, x=2130 values as a starting point; adjust after the level is laid out.

### CombatSystem — type signature only

Change constructor parameter type from:
```ts
platformsGroup: Phaser.Physics.Arcade.StaticGroup
```
to:
```ts
platformsGroup: Phaser.Types.Physics.Arcade.ArcadeColliderType
```

No logic changes. This accepts both `StaticGroup` (old) and `StaticTilemapLayer` (new).

---

## Out of Scope

- Object layers for enemy/pickup/checkpoint placement (future — Prompt 16)
- Background layer / sky (future — art pass)
- Multiple levels or level-switching
- Animated tiles
