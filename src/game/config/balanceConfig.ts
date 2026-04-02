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

  // --- Dash ---
  DASH_DISTANCE: 220,        // fixed pixel travel distance
  DASH_SPEED: 900,           // px/s during dash
  DASH_COOLDOWN: 600,        // ms cooldown after dash ends (resets on land)

  // --- Fairness timings ---
  COYOTE_TIME: 100,          // ms: jump valid after walking off ledge
  JUMP_BUFFER_TIME: 100,     // ms: jump input queued before landing
  WALL_GRACE_TIME: 80,       // ms: wall jump valid after leaving wall
} as const;
