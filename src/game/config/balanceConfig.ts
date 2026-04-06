// All tunable gameplay values live here.
// Update this file during playtesting — never hardcode these in entity classes.
export const BALANCE = {
  // --- Player movement ---
  MOVE_SPEED: 320,           // ground run speed px/s
  GROUND_ACCEL: 1800,        // acceleration on ground
  GROUND_DECEL: 1600,        // deceleration on ground (friction)
  AIR_ACCEL: 900,            // horizontal acceleration in air (limited)
  JUMP_VELOCITY: -620,       // initial jump vertical velocity (negative = up)
  GRAVITY: 1400,             // world gravity applied to player body
  DOUBLE_JUMP_VELOCITY: -480, // weaker than base jump
  WALL_JUMP_VX: 280,         // horizontal push away from wall on wall jump
  WALL_JUMP_VY: -560,        // vertical component of wall jump
  WALL_SLIDE_GRAVITY: 200,   // slow gravity while touching wall and falling

  // --- Grappling hook ---
  GRAPPLE_RANGE: 600,         // px — max hook travel distance
  GRAPPLE_HOOK_SPEED: 1200,   // px/s — hook projectile speed
  GRAPPLE_HOOK_GRAVITY: 350,  // px/s² — gravity on flying hook (produces arc)
  GRAPPLE_PULL_FORCE: 800,    // px/s² — acceleration toward attachment point
  GRAPPLE_DAMAGE: 10,         // damage dealt to enemy on hook contact

  // --- Fairness timings ---
  COYOTE_TIME: 100,          // ms: jump valid after walking off ledge
  JUMP_BUFFER_TIME: 100,     // ms: jump input queued before landing
  WALL_GRACE_TIME: 80,       // ms: wall jump valid after leaving wall

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

  // --- Granny Melee ---
  GRANNY_HEALTH: 60,
  GRANNY_PATROL_SPEED: 60,        // px/s passive walk
  GRANNY_ALERT_SPEED: 130,        // px/s chasing
  GRANNY_PATROL_WIDTH: 200,       // px each side from spawn X
  GRANNY_ATTACK_RANGE: 70,        // px — triggers telegraph
  GRANNY_ATTACK_DAMAGE: 20,
  GRANNY_TELEGRAPH_MS: 500,
  GRANNY_SWING_MS: 150,
  GRANNY_RECOVERY_MS: 400,
  GRANNY_HURT_MS: 250,
  GRANNY_BEHIND_MULTIPLIER: 3.0,
  GRANNY_CONE_PASSIVE_ANGLE: 35,  // degrees, half-angle each side
  GRANNY_CONE_PASSIVE_RANGE: 200, // px
  GRANNY_CONE_ALERT_ANGLE: 60,    // degrees, half-angle each side
  GRANNY_CONE_ALERT_RANGE: 350,   // px
  GRANNY_BODY_ALERT_RADIUS: 300,  // px — distance for body-detection alert
  GRANNY_PROPAGATION_RADIUS: 250, // px — distance for alert-spread (no LOS check)

  // --- Player health / lives ---
  PLAYER_MAX_HEALTH: 100,
  PLAYER_MAX_LIVES: 9,
  PLAYER_INVULN_MS: 1200,       // iframes (blinking) after taking damage
  PLAYER_HURT_DURATION_MS: 350, // input locked during hurt stagger

  // --- Dummy enemy ---
  DUMMY_HEALTH: 50,
} as const;
