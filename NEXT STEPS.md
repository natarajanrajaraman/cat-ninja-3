
---

## `NEXT_STEPS.md`

```md id="a5c7ma"
# Cat Ninja 3 — Next Steps

## Immediate Goal
Build the first playable graybox controller prototype.

---

## Step 1 — Project Setup
- [ ] Create project repo
- [ ] Create `Design/`, `public/assets/`, and `src/` folders
- [ ] Copy all design docs into `Design/`
- [ ] Initialize Phaser 3 + Vite + TypeScript project
- [ ] Confirm local dev server runs

### Done when
The project launches successfully and scene structure exists.

---

## Step 2 — Scene Skeleton
- [ ] Create BootScene
- [ ] Create PreloadScene
- [ ] Create MenuScene
- [ ] Create Level01Scene
- [ ] Create UIScene
- [ ] Create GameOverScene
- [ ] Create VictoryScene

### Done when
Menu scene can transition into Level01 scene.

---

## Step 3 — Graybox Movement Room
- [ ] Add placeholder player sprite or block
- [ ] Add ground and platform collision
- [ ] Add run movement
- [ ] Add jump
- [ ] Add double jump
- [ ] Add wall jump
- [ ] Add dash
- [ ] Add camera follow

### Done when
Moving around the test room already feels satisfying.

---

## Step 4 — Movement Tuning Pass
- [ ] Tune acceleration/deceleration
- [ ] Tune gravity
- [ ] Tune jump velocity
- [ ] Tune double jump feel
- [ ] Tune wall jump reliability
- [ ] Tune dash speed and duration
- [ ] Add coyote time if needed
- [ ] Add jump buffering if needed

### Done when
The cat feels heavy, deliberate, and responsive.

---

## Step 5 — Basic Combat Prototype
- [ ] Add claw attack
- [ ] Add mouse-aimed shuriken
- [ ] Add shuriken ammo counter
- [ ] Add slow-motion aim
- [ ] Add one dummy enemy
- [ ] Add basic damage exchange

### Done when
A simple combat loop is playable in graybox.

---

## Step 6 — Survival and Resource Loop
- [ ] Add health bar
- [ ] Add lives system
- [ ] Add short death animation
- [ ] Add checkpoint respawn
- [ ] Add catfood pickup
- [ ] Add shuriken pickup
- [ ] Add catnip pickup
- [ ] Add manual frenzy activation
- [ ] Add hairball super charging over time

### Done when
The full player loop works in prototype form.

---

## Step 7 — Enemy Prototype Pass
- [ ] Add GrannyMelee
- [ ] Add GrannyRanged
- [ ] Tune basic enemy telegraphs
- [ ] Tune punish windows

### Done when
Enemies are readable and fun to fight.

---

## Step 8 — Level 01 Graybox
- [ ] Build mall-themed route
- [ ] Add platforming sections
- [ ] Add pickups
- [ ] Add checkpoints
- [ ] Add early enemy encounters
- [ ] Add pre-boss transition
- [ ] Add mall atrium boss arena

### Done when
The level is playable start to finish in graybox.

---

## Step 9 — Boss Prototype
- [ ] Add one-phase laser T-Rex
- [ ] Add laser sweep
- [ ] Add stomp/shockwave
- [ ] Add punish window
- [ ] Add boss health
- [ ] Add victory state

### Done when
The level can be completed by beating the boss.

---

## Step 10 — Polish and Deploy
- [ ] Add HUD polish
- [ ] Add music and SFX
- [ ] Add particles and hit flashes
- [ ] Add limited screen shake
- [ ] Add simple parallax
- [ ] Test production build
- [ ] Deploy to Vercel

### Done when
The MVP vertical slice is demo-ready.

---

## Ongoing Rules
- [ ] Keep prompts to Claude Code small and specific
- [ ] Test after each major feature
- [ ] Update `10_Balance_Tuning_Table` as values change
- [ ] Avoid adding new scope before the controller and combat feel good
- [ ] Keep code modular and tuneable