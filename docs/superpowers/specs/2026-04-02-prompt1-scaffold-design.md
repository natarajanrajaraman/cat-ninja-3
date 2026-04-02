# Prompt 1 — Project Scaffold Design

**Date:** 2026-04-02
**Scope:** Bootstrap Phaser 3 + Vite + TypeScript project. No gameplay — structure only.

---

## Approach

Option A: vanilla-ts Vite template + manual Phaser integration. Chosen because the architecture is already fully specified in the design docs and no template cleanup is needed.

---

## Entry Point

`src/main.ts` creates the Phaser `Game` instance:
- Canvas size: 1280 × 720
- Renderer: Phaser.AUTO (WebGL preferred)
- Physics: Arcade
- PixelArt: true, antialias: false
- Registers all scenes in boot order

---

## Scenes

Each scene is a stub — extends `Phaser.Scene`, renders a text label, and provides a transition trigger (keypress or auto-timer).

| Scene | Key | Transition |
|---|---|---|
| BootScene | `'BootScene'` | Auto-advances to PreloadScene |
| PreloadScene | `'PreloadScene'` | Loads placeholder assets, then MenuScene |
| MenuScene | `'MenuScene'` | SPACE key starts Level01Scene + UIScene |
| Level01Scene | `'Level01Scene'` | Placeholder — renders label only |
| UIScene | `'UIScene'` | Launched as overlay by Level01Scene |
| GameOverScene | `'GameOverScene'` | Placeholder — renders label + restart hint |
| VictoryScene | `'VictoryScene'` | Placeholder — renders label |

UIScene is registered with `active: false`. Level01Scene launches it as a parallel overlay via `this.scene.launch('UIScene')`.

---

## Config Files

- `src/game/config/gameConfig.ts` — exports Phaser `Types.Core.GameConfig`
- `src/game/config/inputConfig.ts` — stub, key binding constants (empty for now)
- `src/game/config/balanceConfig.ts` — stub, all tunable game values (empty for now)

---

## Folder Structure

All folders created. Non-scene folders contain `.gitkeep`:

```
src/game/
  config/         gameConfig.ts, inputConfig.ts, balanceConfig.ts
  scenes/         one file per scene
  entities/       .gitkeep
  systems/        .gitkeep
  objects/        .gitkeep
  data/           .gitkeep
  types/          .gitkeep
  utils/          .gitkeep
public/assets/
  sprites/        .gitkeep
  audio/          .gitkeep
  backgrounds/    .gitkeep
  ui/             .gitkeep
  tiles/          .gitkeep
```

---

## Package Setup

- `phaser` — runtime dependency
- `vite`, `typescript` — dev dependencies
- `@types/node` — for path resolution if needed
- Scripts: `dev`, `build`, `preview`
- `tsconfig.json`: strict mode, ESNext target, module resolution bundler

---

## Success Criteria

- `npm run dev` starts without errors
- Browser shows BootScene → PreloadScene → MenuScene automatically
- SPACE on MenuScene launches Level01Scene with UIScene overlay
- All scene keys render a visible label confirming identity
- No TypeScript errors on build
