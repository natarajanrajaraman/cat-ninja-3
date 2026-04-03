# Tilemap Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Level01's graybox colored rectangles with a Phaser `StaticTilemapLayer` driven by a Tiled-exported JSON map, so both visuals and physics come from the tile data.

**Architecture:** `tilemap_packed.png` is loaded as an 18×18 spritesheet; a Tiled JSON map drives tile placement; the `StaticTilemapLayer` is scaled 2× in Phaser (36px per tile). `buildGrayboxRoom()` and the `platforms` StaticGroup are removed entirely. CombatSystem receives the layer directly.

**Tech Stack:** Phaser 3 Tilemaps, Tiled editor (mapeditor.org), TypeScript

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/game/systems/CombatSystem.ts` | Modify | `platformsGroup` param type → `ArcadeColliderType` |
| `src/game/scenes/PreloadScene.ts` | Modify | Add tilemap JSON + spritesheet load calls |
| `src/game/scenes/Level01Scene.ts` | Modify | Remove graybox; add tilemap setup; update colliders |
| `public/assets/tiles/level01.json` | Create (user, in Tiled) | Tiled map export — 90×26 tiles, `ground` layer |

---

## Task 1: Update CombatSystem parameter type

**Files:**
- Modify: `src/game/systems/CombatSystem.ts:14`

- [ ] **Step 1: Change the parameter type**

In `CombatSystem.ts`, line 14, change:
```ts
platformsGroup: Phaser.Physics.Arcade.StaticGroup,
```
to:
```ts
platformsGroup: Phaser.Types.Physics.Arcade.ArcadeColliderType,
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: clean build, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/systems/CombatSystem.ts
git commit -m "fix: widen CombatSystem platformsGroup type to ArcadeColliderType"
```

---

## Task 2: Load tilemap assets in PreloadScene

**Files:**
- Modify: `src/game/scenes/PreloadScene.ts`

- [ ] **Step 1: Add two load calls to `preload()`**

In `PreloadScene.ts`, inside `preload()`, after the existing `this.load.image('shuriken', ...)` line, add:

```ts
// Tilemap — Tiled JSON export
this.load.tilemapTiledJSON('level01', 'assets/tiles/level01.json');

// Kenney Pixel Platformer Industrial Expansion — 18×18 tiles, no spacing
this.load.spritesheet('tiles',
  'assets/tiles/kenney_pixel-platformer-industrial-expansion/Tilemap/tilemap_packed.png',
  { frameWidth: 18, frameHeight: 18 },
);
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: clean build. (The game will throw a runtime error until `level01.json` exists — that's expected.)

- [ ] **Step 3: Commit**

```bash
git add src/game/scenes/PreloadScene.ts
git commit -m "feat: load tilemap JSON and tile spritesheet in PreloadScene"
```

---

## Task 3: Replace graybox with tilemap in Level01Scene

**Files:**
- Modify: `src/game/scenes/Level01Scene.ts`

### Step-by-step changes

- [ ] **Step 1: Remove the `platforms` class field**

Find and delete this line from the class body (around line 13):
```ts
private platforms!: Phaser.Physics.Arcade.StaticGroup;
```

- [ ] **Step 2: Replace the graybox setup block in `create()`**

Find and replace this entire block at the start of `create()`:
```ts
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
```

Replace with:
```ts
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
```

- [ ] **Step 3: Replace the player–platform collider**

Find:
```ts
// Collide player with platforms
this.physics.add.collider(this.player, this.platforms);
```

Replace with:
```ts
// Collide player with tilemap ground layer
this.physics.add.collider(this.player, ground);
```

- [ ] **Step 4: Replace the enemy spawn and CombatSystem lines**

Find:
```ts
// Spawn dummy enemies
this.enemiesGroup = this.physics.add.group();
this.spawnEnemies(GROUND_Y);

// Wire combat
this.combatSystem = new CombatSystem(this, this.player, this.platforms, this.enemiesGroup);
```

Replace with:
```ts
// Spawn dummy enemies — TEMP_GROUND_Y matches graybox layout; update after Tiled map is laid out
const TEMP_GROUND_Y = 836;
this.enemiesGroup = this.physics.add.group();
this.spawnEnemies(TEMP_GROUND_Y);

// Wire combat — pass ground layer instead of platforms StaticGroup
this.combatSystem = new CombatSystem(this, this.player, ground, this.enemiesGroup);
```

- [ ] **Step 5: Remove layout labels and update fall-detection**

Remove these six `addLabel` lines entirely:
```ts
// Layout labels
this.addLabel(200, GROUND_Y - 80, 'START\nrun here');
this.addLabel(490, GROUND_Y - 80, '← 120px\njump gap');
this.addLabel(840, GROUND_Y - 80, '← 160px\nrunning jump');
this.addLabel(1220, GROUND_Y - 80, '← 220px\nDASH ONLY');
this.addLabel(1760, GROUND_Y - 400, 'WALL\nJUMP\nSHAFT');
this.addLabel(2500, 700, 'DOUBLE\nJUMP\nPLATFORMS');
```

Then find the fall-detection event listener:
```ts
this.events.on('update', () => {
  if (this.player.y > WORLD_H + 100 && !this.player.isInState(PlayerState.DEAD)) {
    this.player.takeDamage(BALANCE.PLAYER_MAX_HEALTH);
  }
});
```

Replace `WORLD_H` with `H`:
```ts
this.events.on('update', () => {
  if (this.player.y > H + 100 && !this.player.isInState(PlayerState.DEAD)) {
    this.player.takeDamage(BALANCE.PLAYER_MAX_HEALTH);
  }
});
```

- [ ] **Step 6: Delete `buildGrayboxRoom()` and `addLabel()` methods**

Delete the entire `buildGrayboxRoom` method (approximately lines 184–210):
```ts
private buildGrayboxRoom(groundY: number, worldW: number): void {
  ...
}
```

Delete the entire `addLabel` method (approximately lines 240–246):
```ts
private addLabel(x: number, y: number, text: string): void {
  ...
}
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```
Expected: clean build. (Runtime will fail until `level01.json` exists — that's fine.)

- [ ] **Step 8: Commit**

```bash
git add src/game/scenes/Level01Scene.ts
git commit -m "feat: replace graybox with StaticTilemapLayer from Tiled JSON"
```

---

## Task 4: Create the Tiled map (manual — you do this)

This task requires Tiled (free at **mapeditor.org**).

- [ ] **Step 1: Install Tiled** if not already installed. Download from mapeditor.org.

- [ ] **Step 2: Create a new map**

File → New → New Map:
- Orientation: Orthogonal
- Tile layer format: CSV (simpler JSON output)
- Tile render order: Right Down
- Map size: Fixed, **90 tiles wide × 26 tiles tall**
- Tile size: **18 px × 18 px**

- [ ] **Step 3: Add the tileset**

In the Tilesets panel (bottom-right), click the "New Tileset" button:
- Type: Based on Tileset Image
- Name: **`tilemap_packed`** (must be exactly this — Phaser looks it up by this name)
- Source: browse to `public/assets/tiles/kenney_pixel-platformer-industrial-expansion/Tilemap/tilemap_packed.png`
- Tile width: **18**, Tile height: **18**
- Margin: 0, Spacing: 0
- Click OK

- [ ] **Step 4: Add two tile layers**

In the Layers panel:
1. Rename the default layer to **`ground`**
2. Add a second tile layer named **`decoration`** (optional — can skip for now)

- [ ] **Step 5: Paint the level**

Select the `ground` layer. Use the Tile Stamp tool (T) to paint the platforms. Recreate the graybox layout at approximately these tile positions (at 36px/tile scale):

| Section | Approx tile X range | Tile Y (bottom of map = row 25) |
|---|---|---|
| Starting ground | cols 0–11 | rows 23–25 |
| Second platform (after gap) | cols 17–26 | rows 23–25 |
| Third platform | cols 28–34 | rows 23–25 |
| Fourth platform | cols 42–50 | rows 23–25 |
| Wall-jump left wall | col 50 | rows 12–25 |
| Wall-jump right wall | col 54 | rows 12–25 |
| Post-shaft ground | cols 54–62 | rows 23–25 |
| Floating platform 1 | cols 65–69 | rows 19–20 |
| Floating platform 2 | cols 72–76 | rows 16–17 |
| Floating platform 3 | cols 78–82 | rows 13–14 |
| End ground | cols 83–89 | rows 23–25 |
| Ceiling | row 0, all cols | — |

These are approximate — adjust freely in Tiled to get the platforming feel right.

- [ ] **Step 6: Export the map**

File → Export As:
- Format: JSON map files (*.json)
- Save to: `public/assets/tiles/level01.json`
- Click Export

- [ ] **Step 7: Verify the JSON has the right tileset name**

Open `public/assets/tiles/level01.json` in a text editor and confirm the `tilesets` array contains an entry with `"name": "tilemap_packed"`. If it says something else, rename the tileset in Tiled and re-export.

---

## Task 5: Integration verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```
Open `http://localhost:5173`.

- [ ] **Step 2: Confirm tiles render**

The level should show Kenney industrial tiles instead of colored rectangles. The player should land on the ground tiles and collide with platform tiles.

- [ ] **Step 3: Confirm physics works**

Walk off platforms — the player should fall. Jump between platforms. The player should NOT pass through any painted tile.

- [ ] **Step 4: Confirm shurikens hit tiles**

Fire a shuriken into a wall. It should disappear on contact (CombatSystem shuriken-hits-platforms collision).

- [ ] **Step 5: Confirm fall-kill still works**

Walk off the right edge of the level or any gap without a floor. The player should die (fall detection uses `H` from the tilemap height).

- [ ] **Step 6: Adjust spawn/enemy/checkpoint positions as needed**

If enemy or checkpoint positions look wrong relative to the new tile layout:
- Update `TEMP_GROUND_Y` in `Level01Scene.create()` to match the actual ground tile surface Y (= tile row × 36)
- Adjust checkpoint Y values (currently `804`) similarly

- [ ] **Step 7: Commit any position adjustments**

```bash
git add src/game/scenes/Level01Scene.ts public/assets/tiles/level01.json
git commit -m "feat: add Tiled level01 map and tune spawn positions for tilemap layout"
```
