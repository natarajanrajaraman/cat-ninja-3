# Cat Ninja 3 — Technical Implementation Plan

## Goal
Provide a practical engineering sequence for building the Cat Ninja 3 MVP using a browser-based TypeScript stack.

## Recommended Stack
- Phaser 3
- Vite
- TypeScript
- Vercel for deployment

## Recommended Code Organization

```text
cat-ninja-3/
  public/
    assets/
      sprites/
      audio/
      backgrounds/
      ui/
      tiles/
  src/
    main.ts
    game/
      config/
        gameConfig.ts
        inputConfig.ts
        balanceConfig.ts
      scenes/
        BootScene.ts
        PreloadScene.ts
        MenuScene.ts
        Level01Scene.ts
        UIScene.ts
        GameOverScene.ts
        VictoryScene.ts
      entities/
        Player.ts
        enemies/
          GrannyMelee.ts
          GrannyRanged.ts
          TRexBoss.ts
      systems/
        CombatSystem.ts
        DamageSystem.ts
        PickupSystem.ts
        ResourceSystem.ts
        CheckpointSystem.ts
        AudioSystem.ts
        CameraSystem.ts
      objects/
        Projectile.ts
        Pickup.ts
        Checkpoint.ts
        Hazard.ts
      data/
        playerData.ts
        enemyData.ts
        pickupData.ts
        level01Data.ts
      types/
        CombatTypes.ts
        EntityTypes.ts
        SceneTypes.ts
      utils/
        math.ts
        timers.ts
        debug.ts
```

---

## Development Principles
1. Tune feel early
2. Keep balance values configurable
3. Build graybox first, polish later
4. Use scene separation to keep UI and gameplay decoupled
5. Avoid overengineering until the movement/combat loop is proven

---

## Milestone Plan

## Milestone 1 — Bootstrap and Project Skeleton
Deliverables:
- Vite + Phaser + TypeScript project initialized
- Scene skeletons created
- Basic asset loading pipeline established
- Placeholder level scene rendering

Success criteria:
- project runs locally
- menu scene can enter level scene
- asset folders and code layout are stable

---

## Milestone 2 — Movement Prototype
Deliverables:
- Player entity
- Run movement
- Jump
- Double jump
- Wall jump
- Dash
- Camera follow
- Graybox room/platforms

Success criteria:
- moving around feels good even without enemies
- dash/air control/jump timing are testable
- heavy-feeling movement target is broadly established

---

## Milestone 3 — Combat Prototype
Deliverables:
- Claw attack
- Mouse-aimed shuriken
- Ammo counter
- Slow-motion aim
- Dummy enemy
- Basic damage and knockback

Success criteria:
- melee and ranged combat both feel responsive
- aiming works smoothly with platforming
- ammo use is visible and correct

---

## Milestone 4 — Survival and Resource Loop
Deliverables:
- Health bar
- Lives system
- Death animation
- Respawn/checkpoint system
- Catfood
- Shuriken pickups
- Catnip pickup
- Manual frenzy mode
- Time-based hairball super

Success criteria:
- full player loop works in a prototype environment
- death/retry flow is fast and understandable
- pickup effects are reliable

---

## Milestone 5 — Enemy Implementation
Deliverables:
- Granny melee enemy
- Granny ranged enemy
- Basic AI states
- Telegraphed attacks
- Enemy death logic
- Early balancing pass

Success criteria:
- enemies are readable and fun to fight
- player has reasons to use movement, melee, ranged, and pickups

---

## Milestone 6 — Level 01 Construction
Deliverables:
- Graybox level route
- Encounter spaces
- Pickup placement
- Checkpoints
- Basic environment art placeholders
- Pre-boss setup

Success criteria:
- start-to-boss flow exists
- the level can be played from beginning to boss arena

---

## Milestone 7 — Boss Implementation
Deliverables:
- TRexBoss entity
- One-phase behavior
- Attack patterns
- Damage model
- Defeat state
- Victory transition

Success criteria:
- boss is playable and beatable
- boss tests core mechanics meaningfully

---

## Milestone 8 — Presentation and Polish
Deliverables:
- UI pass
- Audio integration
- Hit flashes
- Particles
- Screen shake
- Basic parallax
- Basic lighting accents
- Victory/game over presentation

Success criteria:
- slice feels coherent and demo-worthy

---

## Milestone 9 — Deployment
Deliverables:
- production build
- asset path validation
- Vercel configuration
- smoke test on deployed version

Success criteria:
- game is playable via deployed web URL

---

## Core Systems to Keep Modular

### Player State Logic
Should manage:
- idle
- run
- jump
- fall
- wall state
- dash
- attack
- hurt
- death
- frenzy state

### Combat/Damage Logic
Should manage:
- melee hit detection
- shuriken hit detection
- dash collision damage
- enemy/player damage application
- knockback and hurt states

### Resource Logic
Should manage:
- health
- lives
- ammo
- frenzy charge
- super charge

### Checkpoint Logic
Should manage:
- last checkpoint location
- respawn flow
- level reset edge cases

### Boss Logic
Should manage:
- attack scheduling
- vulnerability windows
- hit intake
- death/clear transition

---

## Early Technical Risks

### Risk 1 — Mouse aim in a platformer
Mitigation:
- prototype this early
- keep reticle and projectile response crisp
- do not bury it under polish work before validation

### Risk 2 — Heavy movement feeling sluggish
Mitigation:
- tune acceleration, gravity, jump buffering, and landing feel iteratively
- preserve responsiveness even with committed movement

### Risk 3 — Too many interdependent systems
Mitigation:
- add systems in layers
- keep pickups, frenzy, and super disabled until core controller/combat feel is proven

### Risk 4 — Browser performance under effects
Mitigation:
- keep FX simple at first
- avoid expensive particles/lights until core loop is stable

---

## Recommended Working Style in Cursor
- implement one subsystem at a time
- keep commits small
- test after each major system
- maintain a short `NEXT_STEPS.md` or issue list in the repo
- use Claude Code for bounded tasks, not vague “build the whole game” prompts
