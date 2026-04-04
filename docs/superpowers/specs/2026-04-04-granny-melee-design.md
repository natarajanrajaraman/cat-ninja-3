# GrannyMelee Enemy — Design Spec

**Goal:** Implement the first real enemy: a close-range melee grandmother with a stealth detection system, patrol behaviour, and punishable attack pattern.

**Architecture:** GrannyMelee owns the state machine and physics. ConeOfVision is a helper class that handles detection geometry, wall-occlusion raycasting, and cone rendering. CombatSystem handles hit detection and applies the behind-attack multiplier. Alert triggers are wired in Level01Scene to keep GrannyMelee decoupled from scene bookkeeping.

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript, existing tilemap raycasting pattern (getTileAtWorldXY), Phaser Graphics for cone rendering.

---

## Files

| File | Change |
|---|---|
| `src/game/entities/enemies/GrannyMelee.ts` | Create — enemy entity with state machine |
| `src/game/entities/enemies/ConeOfVision.ts` | Create — detection geometry, raycast, visual |
| `src/game/config/balanceConfig.ts` | Modify — add `GRANNY_*` constants |
| `src/game/scenes/PreloadScene.ts` | Modify — load `evilgranny` spritesheet, register animations |
| `src/game/scenes/Level01Scene.ts` | Modify — spawn GrannyMelee, wire events, tile collider |
| `src/game/systems/CombatSystem.ts` | Modify — behind-attack multiplier via instanceof check |

---

## State Machine

```
PATROL ──(cone detects player/projectile)──► ALERT
PATROL ──(body nearby or ally alerted)─────► ALERT
ALERT  ──(player within attack range)──────► TELEGRAPH
TELEGRAPH ──(GRANNY_TELEGRAPH_MS elapsed)──► SWING
SWING  ──(GRANNY_SWING_MS elapsed)─────────► RECOVERY
RECOVERY ──(GRANNY_RECOVERY_MS elapsed)────► ALERT
Any except DEAD ──(takes damage)───────────► HURT
HURT ──(GRANNY_HURT_MS elapsed)────────────► ALERT (or PATROL if never alerted)
Any ──(health ≤ 0)──────────────────────────► DEAD
```

### State Descriptions

**PATROL** — Granny walks back and forth over `GRANNY_PATROL_WIDTH` px each side of her spawn X. She pauses at each endpoint for a random 0.8–2.0s before turning. Occasionally pauses mid-patrol (random chance per movement cycle, random 0.5–1.5s). Uses passive cone (narrow, short).

**ALERT** — Granny faces and walks toward the player at `GRANNY_ALERT_SPEED`. Cone widens and extends. If player moves out of a generous re-check radius for more than 3s, Granny returns to PATROL (optional — can be tuned out if sticky aggro feels better).

**TELEGRAPH** — Granny stops, plays wind-up animation for `GRANNY_TELEGRAPH_MS`. Cone still active. This is the visual warning the player has to react to.

**SWING** — Hitbox enabled for `GRANNY_SWING_MS`. Player takes `GRANNY_ATTACK_DAMAGE` on contact.

**RECOVERY** — Hitbox off. Granny is locked in recovery animation for `GRANNY_RECOVERY_MS`. This is the punish window.

**HURT** — Brief stagger for `GRANNY_HURT_MS`. Flashes white. No movement or attack.

**DEAD** — Death animation plays once, then sprite is destroyed. Emits `'enemy-died'` event with world position.

---

## Cone of Vision

### Geometry

| Mode | Half-angle | Max distance |
|---|---|---|
| Passive | 35° | 200px |
| Alert | 60° | 350px |

The cone always points in Granny's current facing direction. On direction change the cone flips immediately.

Any target behind Granny (outside the cone's forward half) is undetectable. This is what makes sneaking from behind viable.

### Wall Occlusion

Detection check for a target at world position (tx, ty):
1. Compute angle from Granny center to target — reject if outside cone half-angle.
2. Compute distance — reject if beyond cone max range.
3. Ray-march from Granny center toward target in 8px steps, calling `groundLayer.getTileAtWorldXY()` at each step.
4. If any tile is returned before reaching the target, vision is blocked — not detected.

Same technique as GrappleSystem's swept tile check; already proven to work with the scaled tilemap layer.

### Visual

ConeOfVision owns a Phaser Graphics object at depth 5 (below player/enemy layer). Drawn each frame:
- Shape: filled triangle from Granny center, fanning to the cone arc at max distance.
- Passive: fill `0xffffaa`, alpha 0.08.
- Alert: fill `0xffdd88`, alpha 0.13.
- Alpha fades linearly from Granny center (full) to the cone tip (zero) using a gradient fill or by layering two triangles.

---

## Alert Triggers

All four triggers are wired in Level01Scene; GrannyMelee exposes an `alert()` method that Level01Scene calls.

**1. Player in cone** — checked every frame inside GrannyMelee.update(). Uses the wall-occluded cone check. Calls `this.alert()` directly.

**2. Projectile in cone** — same per-frame check against:
   - Each active Shuriken in the shurikenGroup passed at construction.
   - The GrappleHook position, obtained via a `getHookPosition(): {x,y} | null` accessor on GrappleSystem, passed at construction.

**3. Nearby enemy body** — Level01Scene listens for `'enemy-died'` (position). For each living GrannyMelee within `GRANNY_BODY_ALERT_RADIUS`, runs the wall-occluded ray to the body position. If unoccluded, calls `granny.alert()`.

**4. Alert propagation** — when GrannyMelee transitions to ALERT it emits `'enemy-alerted'` (position) on the scene event emitter. Level01Scene propagates this to all passive GrannyMelee instances within `GRANNY_PROPAGATION_RADIUS` — no line-of-sight check (audible alarm).

---

## Attack Hitbox

A Phaser.Physics.Arcade.Image, immovable, no gravity, disabled except during SWING state. Positioned `GRANNY_ATTACK_RANGE / 2` px in front of Granny each frame (same pattern as player's claw hitbox). Size: 80×48px. Wired via `scene.physics.add.overlap` in Level01Scene against the player.

---

## Behind-Attack Multiplier

In CombatSystem's claw-enemy overlap callback, after the existing enemy hit logic:

```ts
if (enemyObj instanceof GrannyMelee) {
  const facing = (enemyObj as GrannyMelee).getFacing();
  const fromBehind = (facing === 'right' && player.x < enemyObj.x) ||
                     (facing === 'left'  && player.x > enemyObj.x);
  damage = fromBehind
    ? BALANCE.CLAW_DAMAGE * BALANCE.GRANNY_BEHIND_MULTIPLIER
    : BALANCE.CLAW_DAMAGE;
}
```

GrannyMelee exposes `getFacing(): 'left' | 'right'`.

The multiplier applies regardless of alert state — repositioning behind Granny during her recovery window is a valid advanced technique.

---

## Balance Constants

Add to `balanceConfig.ts`:

```ts
// --- Granny Melee ---
GRANNY_HEALTH: 60,
GRANNY_PATROL_SPEED: 60,          // px/s passive walk
GRANNY_ALERT_SPEED: 130,          // px/s chasing
GRANNY_PATROL_WIDTH: 200,         // px each side from spawn X
GRANNY_ATTACK_RANGE: 70,          // px — triggers telegraph
GRANNY_ATTACK_DAMAGE: 20,
GRANNY_TELEGRAPH_MS: 500,
GRANNY_SWING_MS: 150,
GRANNY_RECOVERY_MS: 400,
GRANNY_HURT_MS: 250,
GRANNY_BEHIND_MULTIPLIER: 3.0,
GRANNY_CONE_PASSIVE_ANGLE: 35,    // degrees, half-angle each side
GRANNY_CONE_PASSIVE_RANGE: 200,   // px
GRANNY_CONE_ALERT_ANGLE: 60,      // degrees, half-angle each side
GRANNY_CONE_ALERT_RANGE: 350,     // px
GRANNY_BODY_ALERT_RADIUS: 300,    // px — body detection range
GRANNY_PROPAGATION_RADIUS: 250,   // px — alert spread range
```

---

## Sprite & Animations

Spritesheet: `assets/Sprites/Sprites EvilGrandma TRex.png`, loaded as `evilgranny` in PreloadScene. Frame dimensions and row assignments to be identified from the sheet during implementation. Required animations: `granny_walk`, `granny_idle`, `granny_telegraph`, `granny_swing`, `granny_hurt`, `granny_dead`.

If animation rows cannot be cleanly identified, fall back to a tinted pixel rectangle (same as DummyEnemy) for the graybox pass and swap sprite once confirmed.

---

## Out of Scope

- Alarm objects (alarm trigger #3 from the behaviour doc) — no alarm entities exist yet
- GrannyRanged — separate spec
- Granny audio (hurt/attack sounds) — added in a later audio pass
