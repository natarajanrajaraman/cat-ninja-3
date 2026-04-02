# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Cat Ninja 3 is a browser-based single-player 2D precision action platformer built with Phaser 3 + Vite + TypeScript, deployed as a static site on Vercel.

## Development Commands

```bash
npm run dev        # start local dev server (Vite)
npm run build      # production build
npm run preview    # preview production build locally
```

No test runner is configured yet. Manual playtesting in the browser is the primary validation method.

## Architecture

### Stack
- **Phaser 3** — game engine (scenes, physics, input, audio)
- **Vite** — build tool and dev server
- **TypeScript** — strict typing throughout
- **Vercel** — static hosting target

### Scene Flow
```
BootScene → PreloadScene → MenuScene → Level01Scene (+ UIScene overlay) → VictoryScene / GameOverScene
```
`UIScene` runs in parallel with `Level01Scene` as a separate Phaser scene layered on top — it reads shared game state rather than being embedded in the level scene.

### Source Layout (target structure once scaffolded)
```
src/
  main.ts                  # Phaser game config, scene registry
  game/
    config/                # gameConfig, inputConfig, balanceConfig — all tunable values live here
    scenes/                # one file per scene
    entities/              # Player.ts, enemies/GrannyMelee.ts, GrannyRanged.ts, TRexBoss.ts
    systems/               # CombatSystem, DamageSystem, PickupSystem, ResourceSystem,
                           # CheckpointSystem, AudioSystem, CameraSystem
    objects/               # Projectile, Pickup, Checkpoint, Hazard
    data/                  # playerData, enemyData, pickupData, level01Data
    types/                 # CombatTypes, EntityTypes, SceneTypes
    utils/                 # math, timers, debug helpers
public/assets/             # sprites, audio, backgrounds, ui, tiles
```

### Key Design Decisions
- **All tunable values** (speeds, damage, timings, durations) belong in `config/balanceConfig.ts`, not hardcoded in entity classes. The balance tuning table (`Design/10_Balance_Tuning_Table.md`) tracks current values.
- **Player state machine** manages: idle → run → jump → fall → double jump → wall contact → wall jump → dash → attack → hurt → death. Frenzy is a modifier overlay, not a separate state branch.
- **UIScene is decoupled** from gameplay — it reads from a shared resource/state object, not from Level01Scene directly.
- **Mouse aiming** must be prototyped and validated before any polish work begins. It is the highest-risk mechanic (see `Design/06_Technical_Implementation_Plan.md` Risk 1).

### Systems Overview
- **CombatSystem** — melee hit detection, shuriken hit detection, dash collision damage, knockback
- **DamageSystem** — applies damage to player/enemies, manages invulnerability windows, triggers hurt/death states
- **ResourceSystem** — tracks health, lives, shuriken ammo, frenzy charge, super meter
- **CheckpointSystem** — stores last activated checkpoint, drives respawn flow
- **PickupSystem** — overlap detection and effect dispatch for catfood/shuriken/catnip pickups

## Development Rules

- Build graybox first; do not add art or polish before movement and combat feel is proven.
- Implement one subsystem at a time. Test after each major system.
- Do not add scope (new enemies, levels, mechanics) before the controller and combat feel good.
- Keep prompts small and specific. `Design/07_Cursor_Claude_Prompt_Pack.md` has 24 ordered implementation prompts.
- Update `Design/10_Balance_Tuning_Table.md` when tunable values change.

## Design Documents

All specs are in `Design/`. Read these before implementing any system:

| File | Contents |
|---|---|
| `00_Project_Overview.md` | High concept, MVP scope, design pillars |
| `01_Concept_Sheet.md` | Tone, setting, protagonist, key enemies |
| `02_MVP_Feature_Backlog.md` | P0/P1/P2 feature list and milestones |
| `03_GDD_Starter.md` | Full game design document |
| `04_SRS_Starter.md` | Functional and non-functional requirements |
| `05_Level_01_Mall_Mayhem.md` | Level 1 flow, sections, pickup/enemy placement philosophy |
| `06_Technical_Implementation_Plan.md` | Milestone plan, technical risks, recommended working style |
| `07_Cursor_Claude_Prompt_Pack.md` | 24 ordered prompts for incremental implementation |
| `08_Combat_Spec.md` | Detailed combat behavior for all player attacks and enemies |
| `09_Player_Controller_Spec.md` | Controller feel targets, state model, fairness features |
| `10_Balance_Tuning_Table.md` | Tuning values — update this as values change |

## Controls Reference

| Input | Action |
|---|---|
| A / D | Move left / right |
| Space | Jump |
| Shift | Dash |
| Left click | Throw shuriken |
| Right click (hold) | Slow-motion aim |
| J | Claw strike |
| Q | Hairball super |
| E or R | Activate frenzy |
| Esc | Pause |
