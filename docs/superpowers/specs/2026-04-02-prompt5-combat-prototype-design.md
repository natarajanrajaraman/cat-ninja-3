# Prompt 5 — Combat Prototype Design

**Date:** 2026-04-02
**Scope:** First combat prototype — claw strike, shuriken, dummy enemy, floating HP bars, ammo UI, Level 1 music. No frenzy, checkpoints, lives, or boss.

---

## Approach

CombatSystem class (not a Phaser scene) owned by Level01Scene. Player and enemies expose clean interfaces (`IDamageable`). CombatSystem wires all overlaps. Inter-scene communication (ammo display) uses the global Phaser game event bus (`this.game.events`).

---

## Files

| Action | File | Purpose |
|---|---|---|
| Create | `src/game/types/CombatTypes.ts` | `IDamageable` interface |
| Create | `src/game/systems/CombatSystem.ts` | Overlap setup, shuriken pool, damage routing |
| Create | `src/game/entities/Shuriken.ts` | Projectile sprite with arc physics and random launch sound |
| Create | `src/game/entities/DummyEnemy.ts` | Static placeholder enemy with health and flash-on-hit |
| Create | `src/game/objects/HealthBar.ts` | Reusable floating HP bar — attaches to any entity, used by DummyEnemy now and Player in Prompt 7 |
| Modify | `src/game/entities/Player.ts` | Attack overlay (timer-based), claw hitbox, ammo, random claw sound |
| Modify | `src/game/scenes/PreloadScene.ts` | Load shuriken sheet, all SFX, music; define shuriken spin animation |
| Modify | `src/game/scenes/Level01Scene.ts` | Create CombatSystem, spawn enemies, handle left-click fire, start music |
| Modify | `src/game/scenes/UIScene.ts` | Ammo counter listening to game event bus |
| Modify | `src/game/config/balanceConfig.ts` | Add all combat tuning values |

---

## CombatTypes.ts

```ts
export interface IDamageable {
  takeDamage(amount: number): void;
}
```

---

## balanceConfig additions

```ts
// --- Claw ---
CLAW_DAMAGE: 25,
CLAW_ACTIVE_MS: 150,       // how long hitbox is live
CLAW_RECOVERY_MS: 200,     // locked-out after active window
CLAW_COOLDOWN_MS: 400,     // full cooldown from press to next press
CLAW_RANGE: 60,            // hitbox width in front of player

// --- Shuriken ---
SHURIKEN_DAMAGE: 15,
SHURIKEN_SPEED: 800,       // px/s initial velocity
SHURIKEN_GRAVITY: 400,     // lighter than player gravity for parabolic arc
SHURIKEN_FIRE_COOLDOWN: 250, // ms between shots
SHURIKEN_MAX_AMMO: 10,
SHURIKEN_LIFETIME: 2500,   // ms before auto-destroy if no hit

// --- Dummy enemy ---
DUMMY_HEALTH: 50,
```

---

## CombatSystem

Plain TypeScript class. Constructed in `Level01Scene.create()`.

```
constructor(scene, player, platformsGroup)
```

Responsibilities:
- Owns `shurikenGroup: Phaser.Physics.Arcade.Group`
- Receives `enemiesGroup: Phaser.Physics.Arcade.Group` (passed in)
- Sets up three overlap/collider registrations:
  1. `player.clawHitbox` vs `enemiesGroup` → `enemy.takeDamage(CLAW_DAMAGE)`
  2. `shurikenGroup` vs `enemiesGroup` → `enemy.takeDamage(SHURIKEN_DAMAGE)` + `shuriken.destroy()`
  3. `shurikenGroup` vs `platformsGroup` → `shuriken.destroy()`
- `fireShuriken(fromX, fromY, worldX, worldY): void` — creates a Shuriken, sets velocity toward target, adds to group

---

## Player changes

### Attack overlay (not a state machine state)

New fields:
```ts
private attackTimer: number = 0;       // counts down from active+recovery to 0
private clawCooldownTimer: number = 0;
public clawHitbox: Phaser.Physics.Arcade.Image; // created in constructor, always present
```

`clawHitbox` is created in the Player constructor as an invisible image added to the scene with `physics.add.existing`. Body size = `(CLAW_RANGE, 36)`. It is **disabled by default** (`body.enable = false`). Each frame it is repositioned to sit directly in front of the player.

On J press (if `clawCooldownTimer === 0`):
- `attackTimer = CLAW_ACTIVE_MS + CLAW_RECOVERY_MS`
- `clawCooldownTimer = CLAW_COOLDOWN_MS`
- Enable `clawHitbox.body`
- Play a random claw sound
- Play claw animation

Each frame:
- `attackTimer` ticks down
- When `attackTimer <= CLAW_RECOVERY_MS`: disable `clawHitbox.body`
- When `attackTimer <= 0`: attack done, resume movement animation

`updateAnimation()` checks `attackTimer > 0` **first** and plays the claw animation, overriding movement animations during the strike.

### Ammo

```ts
private ammo: number = BALANCE.SHURIKEN_MAX_AMMO;
private shurikenCooldownTimer: number = 0;

getAmmo(): number
consumeAmmo(): boolean   // returns false if ammo === 0, else decrements and returns true
```

### Random sound helper

```ts
private playRandomSound(keys: string[]): void {
  const key = keys[Math.floor(Math.random() * keys.length)];
  this.scene.sound.play(key);
}
```

Used for both claw and (if we want Player to own claw sound) the claw swing.

---

## Shuriken

`Shuriken extends Phaser.Physics.Arcade.Sprite`

- Texture: `'shuriken'` (sprite sheet loaded in PreloadScene)
- On creation: `body.setAllowGravity(true)`, `body.setGravityY(BALANCE.SHURIKEN_GRAVITY)`
- Velocity set by CombatSystem: `normalize(target - origin) * SHURIKEN_SPEED`
- Plays `'shuriken_spin'` animation (looping, fast)
- Auto-destroys after `SHURIKEN_LIFETIME` ms via `scene.time.delayedCall`
- `destroy()` is safe to call multiple times (check `active` flag first)

---

## DummyEnemy

`DummyEnemy extends Phaser.Physics.Arcade.Image`

- Drawn as a solid colored rectangle (no texture needed — use `setFillStyle` via a `Phaser.GameObjects.Rectangle` with physics, same pattern as graybox platforms, but tracked in the enemies group)
- Use `Phaser.Physics.Arcade.Sprite` with texture key `'pixel'` (a 1×1 white pixel texture created in PreloadScene via `this.textures.generate('pixel', { data: ['#'], pixelWidth: 1 })` or similar), then `setDisplaySize(48, 64)` and `setTint(0xff4444)` for a red rectangle
- `health: number = BALANCE.DUMMY_HEALTH`
- `takeDamage(amount)`: `health -= amount`, flash tint red for 100ms, destroy if `health <= 0`
- Static body (no gravity, no movement)
- 5 enemies placed in Level01Scene: at various heights along the room

---

## Level01Scene changes

### In `create()`:
1. Create `enemiesGroup = this.physics.add.group()` (dynamic group; each DummyEnemy body is set immovable)
2. Spawn 5 `DummyEnemy` instances into `enemiesGroup`
3. Create `combatSystem = new CombatSystem(this, player, this.platforms, enemiesGroup)`
4. Start background music: `this.sound.play('music_level1', { loop: true, volume: 0.5 })`
5. Emit initial ammo: `this.game.events.emit('ammo-changed', BALANCE.SHURIKEN_MAX_AMMO)`

### In `update(delta)`:
```ts
// Left-click fires shuriken — Player tracks both ammo and fire cooldown
const pointer = this.input.activePointer;
if (pointer.leftButtonJustPressed() && this.player.consumeAmmo()) {
  this.combatSystem.fireShuriken(
    this.player.x, this.player.y,
    pointer.worldX, pointer.worldY
  );
  this.game.events.emit('ammo-changed', this.player.getAmmo());
}
// Tick player's shuriken cooldown (so player.consumeAmmo() respects fire rate)
this.player.update(delta); // already called — shurikenCooldownTimer ticks inside updateTimers()
```

`consumeAmmo()` returns `false` if `ammo === 0` OR `shurikenCooldownTimer > 0`. On success it decrements ammo and sets `shurikenCooldownTimer = SHURIKEN_FIRE_COOLDOWN`.

---

## UIScene changes

Replace placeholder text with:
- Ammo counter: `"★ 10"` in top-right corner
- Listens: `this.game.events.on('ammo-changed', (ammo: number) => { this.ammoText.setText('★ ' + ammo); })`
- Clean up listener on scene shutdown: `this.game.events.off('ammo-changed', ...)`

---

## PreloadScene additions

### Sprites
```ts
this.load.spritesheet('shuriken', 'assets/Sprites/Sprites Shuriken.png', {
  frameWidth: TBD,   // implementer: inspect image dimensions ÷ frame count
  frameHeight: TBD,
});
```
*(Frame dimensions to be determined by inspecting the file during implementation.)*

### Animations
```ts
// Shuriken spin — all frames, fast loop
this.anims.create({
  key: 'shuriken_spin',
  frames: this.anims.generateFrameNumbers('shuriken', { start: 0, end: TBD }),
  frameRate: 16,
  repeat: -1,
});
```

### Claw animation
Inspect `Sprites CatNinja.png` rows 5–6 during implementation to identify claw/attack frames. Add animation key `'claw'`.

### Sound effects
```ts
// Shuriken launch (random selection at fire time)
this.load.audio('shuriken_1', 'assets/SoundEffects/shuriken launch/sword.1.ogg');
this.load.audio('shuriken_2', 'assets/SoundEffects/shuriken launch/sword.2.ogg');
this.load.audio('shuriken_3', 'assets/SoundEffects/shuriken launch/sword.3.ogg');
this.load.audio('shuriken_4', 'assets/SoundEffects/shuriken launch/sword.4.ogg');
this.load.audio('shuriken_5', 'assets/SoundEffects/shuriken launch/sword.5.ogg');

// Claw launch (random selection at strike time)
this.load.audio('claw_1', 'assets/SoundEffects/claw launch/Socapex - Monster_Hurt.wav');
this.load.audio('claw_2', 'assets/SoundEffects/claw launch/Socapex - new_hits_2.wav');
this.load.audio('claw_3', 'assets/SoundEffects/claw launch/Socapex - new_hits_5.wav');
this.load.audio('claw_4', 'assets/SoundEffects/claw launch/Socapex - new_hits_7.wav');
this.load.audio('claw_5', 'assets/SoundEffects/claw launch/Socapex - new_hits_8.wav');

// Level 1 music
this.load.audio('music_level1', 'assets/Music/BlackTrendMusic - Sport Games.mp3');
```

---

## Dummy enemy placement in Level01Scene

5 enemies placed to test both weapons:
1. x=300, groundY (close range — test claw from ground)
2. x=700, groundY (after first gap — test shuriken across gap)
3. x=1150, groundY (test claw while running)
4. x=1650, groundY-128 (elevated — test shuriken arc aim-up)
5. x=2200, groundY (after wall jump shaft — test mid-range shuriken)

---

## HealthBar

`HealthBar` is a plain class (not a Phaser GameObject). It owns a `Phaser.GameObjects.Graphics` object and updates it each frame.

```ts
class HealthBar {
  constructor(scene: Phaser.Scene, width: number, yOffset: number)
  update(x: number, y: number, current: number, max: number): void
  destroy(): void
}
```

### Layout
- Background bar: dark gray, `width × 6px`
- Fill bar: green → yellow → red based on percentage (>50% green, 25–50% yellow, <25% red)
- Positioned `yOffset` pixels above the owner's `y` (e.g. -40 for enemies, -50 for player)
- Centered horizontally on owner's `x`
- Hidden when `current >= max` (full health, no clutter)

### Usage in DummyEnemy
```ts
private healthBar: HealthBar;

constructor(scene, x, y) {
  // ... sprite setup
  this.healthBar = new HealthBar(scene, 48, -40);
}

takeDamage(amount) {
  this.health -= amount;
  this.healthBar.update(this.x, this.y, this.health, BALANCE.DUMMY_HEALTH);
  // flash + destroy logic
}

// Called from Level01Scene.update() or preUpdate override
preUpdate(time, delta) {
  super.preUpdate(time, delta);
  this.healthBar.update(this.x, this.y, this.health, BALANCE.DUMMY_HEALTH);
}
```

### Reuse in Prompt 7 (Player)
Player will call `this.healthBar.update(this.x, this.y, this.health, BALANCE.PLAYER_MAX_HEALTH)` in its `update()` method once the health system is added. No changes to `HealthBar` needed.

---

## Success Criteria

- J key triggers a claw strike with hitbox, sound, and animation
- Left-click fires a shuriken that arcs with gravity and hits enemies
- Shuriken ammo decrements from 10 to 0; firing at 0 does nothing
- Ammo counter in UIScene updates in real time
- DummyEnemies flash red on hit, show a floating HP bar that shrinks as damage is taken, and disappear at 0 HP
- Level 1 music plays on loop
- All values tunable via balanceConfig
- No TypeScript errors, build passes
