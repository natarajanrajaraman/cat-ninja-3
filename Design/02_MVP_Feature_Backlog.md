# Cat Ninja 3 — MVP Feature Backlog

## Scope Philosophy
The MVP should prove the core fantasy and feel of the game. It should not attempt full game breadth. Priority is responsiveness, readability, and a coherent vertical slice.

---

## Priority Legend
- **P0** = must have for MVP
- **P1** = should have for MVP if feasible
- **P2** = nice to have / post-MVP candidate

---

## P0 — Core Player Movement
- [ ] Run left/right
- [ ] Jump
- [ ] Double jump
- [ ] Wall jump
- [ ] Dash
- [ ] Heavy-feeling movement tuning
- [ ] Camera follow
- [ ] Basic collision with platforms and walls

## P0 — Core Player Combat
- [ ] Single precise claw strike
- [ ] Mouse-aimed shuriken
- [ ] Shuriken ammo cap of 10
- [ ] Shuriken throw response tuning
- [ ] Slow-motion aim mode
- [ ] Dash collision damage
- [ ] Dash interrupted/shortened by enemy collision

## P0 — Core Player Survival
- [ ] Health bar
- [ ] Damage intake
- [ ] Death handling
- [ ] Short death animation
- [ ] 9 lives per level
- [ ] Checkpoint system
- [ ] Respawn at latest checkpoint
- [ ] Game over when lives reach zero

## P0 — Core Resources and Pickups
- [ ] Catfood pickup restores health
- [ ] Shuriken pickup restores ammo
- [ ] Catnip pickup grants frenzy charge
- [ ] Manual frenzy activation
- [ ] Hairball super meter charges over time
- [ ] Hairball super activation

## P0 — Enemies
- [ ] Granny melee enemy
- [ ] Granny ranged enemy
- [ ] Basic enemy damage / hit reactions
- [ ] Enemy telegraphs
- [ ] Enemy death logic

## P0 — Boss
- [ ] One-phase laser T-Rex miniboss
- [ ] Boss health
- [ ] Boss attack patterns
- [ ] Punish windows
- [ ] Boss defeat state
- [ ] Level clear on boss defeat

## P0 — Level Content
- [ ] One complete level
- [ ] Checkpoints
- [ ] Platforming routes
- [ ] Combat spaces
- [ ] Pickup placement
- [ ] Boss arena in mall atrium

## P0 — UI / HUD
- [ ] Health bar display
- [ ] Lives display
- [ ] Shuriken ammo display
- [ ] Frenzy availability display
- [ ] Hairball super meter display
- [ ] Pause menu
- [ ] Victory screen
- [ ] Game over screen

## P0 — Audio
- [ ] Background music playback
- [ ] Jump sound
- [ ] Attack sounds
- [ ] Damage sounds
- [ ] Pickup sounds
- [ ] Boss/audio cues
- [ ] Super activation sound

---

## P1 — Visual Feedback / Polish
- [ ] Hit flash
- [ ] Screen shake
- [ ] Impact particles
- [ ] Dash trail
- [ ] Frenzy visual overlay
- [ ] Super activation effects
- [ ] Basic parallax backgrounds
- [ ] Mall lighting accents

## P1 — Level Polish
- [ ] Stronger visual theming
- [ ] Optional side path
- [ ] Boss foreshadowing
- [ ] Environmental set dressing
- [ ] Hazard variety

## P1 — Systems Polish
- [ ] Tuning pass on shuriken ammo economy
- [ ] Tuning pass on dash risk/reward
- [ ] Tuning pass on frenzy duration/effect
- [ ] Tuning pass on boss difficulty
- [ ] Basic difficulty smoothing

---

## P2 — Post-MVP Candidates
- [ ] Additional enemy types
- [ ] Additional levels
- [ ] Unlockable abilities
- [ ] Combo scoring
- [ ] Time trial mode
- [ ] Save/load progression
- [ ] More bosses
- [ ] Boss intro cutscene
- [ ] More environmental interactions
- [ ] Additional powerups
- [ ] Difficulty settings
- [ ] Controller support

---

## Milestones

### Milestone 1 — Graybox Movement Prototype
Goal:
- prove player controller feel

Exit criteria:
- moving, jumping, wall jumping, and dashing already feel good in a gray room

### Milestone 2 — Combat Prototype
Goal:
- prove ranged and melee combat feel

Exit criteria:
- claws, shuriken, slow-mo aim, damage, and one dummy enemy all work

### Milestone 3 — Player Loop Prototype
Goal:
- prove survival and resource loop

Exit criteria:
- health, lives, checkpoints, pickups, frenzy, and super all work together

### Milestone 4 — Enemy and Level Prototype
Goal:
- prove playable start-to-finish level structure

Exit criteria:
- two enemy types, one level route, one checkpoint loop

### Milestone 5 — Boss Vertical Slice
Goal:
- prove complete content loop

Exit criteria:
- one full level ending in boss defeat and victory state

### Milestone 6 — Polish and Deploy
Goal:
- produce a demo-quality MVP

Exit criteria:
- UI, audio, effects, tuning, and deployment ready
