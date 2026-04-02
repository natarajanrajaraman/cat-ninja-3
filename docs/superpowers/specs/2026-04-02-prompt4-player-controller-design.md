# Prompt 4 — Player Controller Design

**Date:** 2026-04-02
**Scope:** Build and tune the Cat Ninja 3 player controller with graybox test room. No combat, health, or frenzy yet.

---

## Approach

Option B: Explicit string-based state machine on the Player class. State stored as a `PlayerState` enum. Transitions are explicit methods. Phaser Arcade physics handles movement. Frenzy is a boolean modifier overlay (not a state) — implemented in a later prompt.

---

## Files

| Action | File | Purpose |
|---|---|---|
| Create | `src/game/entities/Player.ts` | Player class — state machine, physics, all movement |
| Create | `src/game/types/PlayerTypes.ts` | PlayerState enum, PlayerConfig interface |
| Modify | `src/game/config/balanceConfig.ts` | Populate all player movement values |
| Modify | `src/game/scenes/Level01Scene.ts` | Replace placeholder text with graybox room + Player |

---

## PlayerTypes.ts

```ts
export enum PlayerState {
  IDLE = 'IDLE',
  RUN = 'RUN',
  JUMP = 'JUMP',
  FALL = 'FALL',
  DOUBLE_JUMP = 'DOUBLE_JUMP',
  WALL_SLIDE = 'WALL_SLIDE',
  WALL_JUMP = 'WALL_JUMP',
  DASH = 'DASH',
  HURT = 'HURT',
  DEAD = 'DEAD',
}
```

`ATTACK` is added in Prompt 5. `HURT` and `DEAD` are added in Prompt 7. They are defined here so the enum is complete.

---

## Player State Machine

### Transitions

| From | Condition | To |
|---|---|---|
| IDLE / RUN | Move key held | RUN / IDLE |
| IDLE / RUN | Jump pressed (+ coyote window) | JUMP |
| JUMP / FALL / DOUBLE_JUMP | Land on ground | IDLE or RUN |
| JUMP / FALL | Jump pressed, air, double jump available | DOUBLE_JUMP |
| JUMP / FALL / DOUBLE_JUMP | Touch wall while falling | WALL_SLIDE |
| WALL_SLIDE | Jump pressed (+ wall grace window) | WALL_JUMP |
| WALL_JUMP | Peak reached / no wall | FALL |
| Any ground/air state | Dash pressed, cooldown ready | DASH |
| DASH | Distance reached | IDLE / FALL |

### Rules
- Double jump resets on: landing, wall jump
- Dash refreshes on: landing
- Wall slide only triggers when moving INTO the wall and falling (not rising)
- Dash direction: whichever direction the player is facing at the moment of input

---

## Fairness Features

All timing values in balanceConfig:

| Feature | Value | Behaviour |
|---|---|---|
| Coyote time | 100ms | Jump input valid for 100ms after leaving a ledge |
| Jump buffer | 100ms | Jump input queued for 100ms before landing triggers on touchdown |
| Wall grace | 80ms | Wall jump valid for 80ms after leaving wall contact |

---

## Balance Values (balanceConfig.ts)

```ts
// Player movement
MOVE_SPEED: 320,          // ground run speed px/s
GROUND_ACCEL: 1800,       // acceleration on ground
GROUND_DECEL: 1600,       // deceleration on ground
AIR_ACCEL: 900,           // horizontal acceleration in air (limited control)
JUMP_VELOCITY: -620,      // initial jump vertical velocity
GRAVITY: 1400,            // world gravity applied to player body
DOUBLE_JUMP_VELOCITY: -480,  // weaker than base jump
WALL_JUMP_VX: 280,        // horizontal push away from wall
WALL_JUMP_VY: -560,       // vertical component of wall jump
WALL_SLIDE_GRAVITY: 200,  // slow gravity while sliding wall

// Dash
DASH_DISTANCE: 220,       // fixed pixel distance per dash
DASH_SPEED: 900,          // travel speed during dash (px/s)
DASH_COOLDOWN: 600,       // ms before dash is available again (resets on land)

// Fairness timings
COYOTE_TIME: 100,         // ms
JUMP_BUFFER_TIME: 100,    // ms
WALL_GRACE_TIME: 80,      // ms
```

---

## Graybox Test Room (Level01Scene)

Level01Scene is replaced with a Phaser Arcade physics room built from static rectangle bodies. No tilemap yet — pure geometry.

### Required geometry

| Element | Purpose |
|---|---|
| Long flat ground | Run feel, acceleration/deceleration |
| 3 jump gaps (small/medium/large) | Jump arc, coyote time |
| Tall wall-jump shaft (2 walls, ~6 tiles tall) | Wall slide, wall jump |
| Dash lane with a gap only crossable by dash | Dash distance calibration |
| Elevated platforms (2-3 heights) | Double jump, landing feel |
| Camera follow | World larger than screen |

World size: 3200 × 900px. Camera follows player with light lerp.

---

## Player.ts Architecture

```
Player extends Phaser.Physics.Arcade.Sprite

Properties:
  state: PlayerState
  facing: 'left' | 'right'
  canDoubleJump: boolean
  dashDistanceTravelled: number
  dashStartX: number
  dashCooldownTimer: number
  coyoteTimer: number
  jumpBufferTimer: number
  wallGraceTimer: number
  lastWallDirection: 'left' | 'right' | null

Methods:
  update(cursors, keys): void        — called each frame from Level01Scene
  handleGroundMovement(): void
  handleAirMovement(): void
  handleJump(): void
  handleDash(): void
  handleWallSlide(): void
  handleWallJump(): void
  transitionTo(state): void          — centralised state change, logs in debug
  isGrounded(): boolean
  isTouchingWall(): 'left' | 'right' | null
  isInState(...states): boolean
```

Input is passed in from the scene — Player does not own the input manager.

---

## Success Criteria

- Moving around the graybox room feels satisfying before any enemies exist
- All 5 movement abilities work reliably (run, jump, double jump, wall jump, dash)
- Coyote time, jump buffer, and wall grace all function correctly
- Dash travels exactly DASH_DISTANCE pixels regardless of direction
- Camera follows player smoothly across the full room
- No TypeScript errors, build passes
