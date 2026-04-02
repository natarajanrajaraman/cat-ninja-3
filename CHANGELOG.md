# Changelog

## Prompt 4 — Player Controller
- Added PlayerTypes.ts: PlayerState enum, PlayerKeys interface
- Populated balanceConfig.ts with all movement tuning values
- Updated PreloadScene to load Sprites CatNinja.png and define 9 animations
- Created Player.ts with explicit state machine (IDLE/RUN/JUMP/FALL/DOUBLE_JUMP/WALL_SLIDE/WALL_JUMP/DASH/HURT/DEAD)
- Implemented: run with acceleration/deceleration, jump, double jump, wall slide, wall jump, fixed-distance dash
- Fairness features: coyote time (100ms), jump buffer (100ms), wall grace (80ms)
- Rebuilt Level01Scene as graybox physics room (3200×900) with gaps, dash lane, wall jump shaft, elevated platforms
- Camera follows player with lerp

## Prompt 1 — Project Scaffold
- Initialized Phaser 3 + Vite + TypeScript project
- Created 7 scene stubs: Boot, Preload, Menu, Level01, UI, GameOver, Victory
- Scene flow: Boot → Preload → Menu → Level01 (+UIScene overlay) → GameOver/Victory
- Added config stubs: gameConfig, inputConfig, balanceConfig
- Created folder structure: entities, systems, objects, data, types, utils, public/assets/*
