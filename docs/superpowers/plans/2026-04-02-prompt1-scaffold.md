# Prompt 1 — Project Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap a Phaser 3 + Vite + TypeScript project with all scene stubs, config files, and folder structure so `npm run dev` launches and shows a working scene flow in the browser.

**Architecture:** Vite vanilla-ts base with Phaser added manually. `src/main.ts` creates the Phaser Game instance and registers all scenes. Each scene is a stub class that renders its own name and transitions to the next scene.

**Tech Stack:** Phaser 3, Vite, TypeScript

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `package.json` | deps, scripts |
| Create | `tsconfig.json` | TS compiler config |
| Create | `vite.config.ts` | Vite build config |
| Create | `index.html` | HTML shell |
| Create | `src/main.ts` | Phaser Game instance + scene registry |
| Create | `src/game/config/gameConfig.ts` | Phaser GameConfig export |
| Create | `src/game/config/inputConfig.ts` | Key binding constants stub |
| Create | `src/game/config/balanceConfig.ts` | Tunable values stub |
| Create | `src/game/scenes/BootScene.ts` | Auto-advances to PreloadScene |
| Create | `src/game/scenes/PreloadScene.ts` | Loads placeholders, advances to MenuScene |
| Create | `src/game/scenes/MenuScene.ts` | SPACE starts Level01Scene + UIScene |
| Create | `src/game/scenes/Level01Scene.ts` | Placeholder gameplay scene |
| Create | `src/game/scenes/UIScene.ts` | HUD overlay (launched by Level01Scene) |
| Create | `src/game/scenes/GameOverScene.ts` | Placeholder, R to restart |
| Create | `src/game/scenes/VictoryScene.ts` | Placeholder |
| Create | `.gitkeep` x8 | entities, systems, objects, data, types, utils, public/assets/* |

---

### Task 1: Package setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "cat-ninja-3",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "phaser": "^3.88.2"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "vite": "^5.2.11"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
```

- [ ] **Step 4: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cat Ninja 3</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
    </style>
  </head>
  <body>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

---

### Task 2: Phaser game config

**Files:**
- Create: `src/game/config/gameConfig.ts`
- Create: `src/game/config/inputConfig.ts`
- Create: `src/game/config/balanceConfig.ts`

- [ ] **Step 1: Create `src/game/config/gameConfig.ts`**

```ts
import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MenuScene } from '../scenes/MenuScene';
import { Level01Scene } from '../scenes/Level01Scene';
import { UIScene } from '../scenes/UIScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { VictoryScene } from '../scenes/VictoryScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  antialias: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    Level01Scene,
    UIScene,
    GameOverScene,
    VictoryScene,
  ],
};
```

- [ ] **Step 2: Create `src/game/config/inputConfig.ts`**

```ts
// Key bindings — update these to retarget controls without touching scene code
export const INPUT = {
  MOVE_LEFT: Phaser.Input.Keyboard.KeyCodes.A,
  MOVE_RIGHT: Phaser.Input.Keyboard.KeyCodes.D,
  JUMP: Phaser.Input.Keyboard.KeyCodes.SPACE,
  DASH: Phaser.Input.Keyboard.KeyCodes.SHIFT,
  CLAW: Phaser.Input.Keyboard.KeyCodes.J,
  SUPER: Phaser.Input.Keyboard.KeyCodes.Q,
  FRENZY: Phaser.Input.Keyboard.KeyCodes.E,
  PAUSE: Phaser.Input.Keyboard.KeyCodes.ESC,
} as const;
```

Note: `Phaser` is a global type here — if TS complains, add `import Phaser from 'phaser';` at the top.

- [ ] **Step 3: Create `src/game/config/balanceConfig.ts`**

```ts
// All tunable gameplay values live here.
// Update this file during playtesting — never hardcode these in entity classes.
export const BALANCE = {
  // --- Player movement ---
  // MOVE_SPEED: 300,
  // JUMP_VELOCITY: -600,
  // GRAVITY: 800,

  // --- Combat ---
  // SHURIKEN_MAX_AMMO: 10,
  // SHURIKEN_SPEED: 900,

  // --- Survival ---
  // PLAYER_MAX_HEALTH: 100,
  // PLAYER_START_LIVES: 9,
} as const;
```

---

### Task 3: Scene stubs

**Files:**
- Create: `src/game/scenes/BootScene.ts`
- Create: `src/game/scenes/PreloadScene.ts`
- Create: `src/game/scenes/MenuScene.ts`
- Create: `src/game/scenes/Level01Scene.ts`
- Create: `src/game/scenes/UIScene.ts`
- Create: `src/game/scenes/GameOverScene.ts`
- Create: `src/game/scenes/VictoryScene.ts`

- [ ] **Step 1: Create `src/game/scenes/BootScene.ts`**

```ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Boot is a one-frame scene — sets up any global settings then moves on
    this.cameras.main.setBackgroundColor('#000000');
    this.scene.start('PreloadScene');
  }
}
```

- [ ] **Step 2: Create `src/game/scenes/PreloadScene.ts`**

```ts
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Assets will be loaded here in later prompts.
    // For now, show a loading label.
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Loading...', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
```

- [ ] **Step 3: Create `src/game/scenes/MenuScene.ts`**

```ts
import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 60, 'CAT NINJA 3', {
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, 'Press SPACE to start', {
        fontSize: '24px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('Level01Scene');
      this.scene.launch('UIScene');
    });
  }
}
```

- [ ] **Step 4: Create `src/game/scenes/Level01Scene.ts`**

```ts
import Phaser from 'phaser';

export class Level01Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level01Scene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2, 'Level 01 — Mall Mayhem\n(Graybox placeholder)', {
        fontSize: '28px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 80, 'Press G for Game Over  |  V for Victory', {
        fontSize: '18px',
        color: '#888888',
      })
      .setOrigin(0.5);

    this.input.keyboard!.on('keydown-G', () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene');
    });

    this.input.keyboard!.on('keydown-V', () => {
      this.scene.stop('UIScene');
      this.scene.start('VictoryScene');
    });
  }
}
```

- [ ] **Step 5: Create `src/game/scenes/UIScene.ts`**

```ts
import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create(): void {
    // HUD elements will be added here in later prompts.
    this.add
      .text(16, 16, 'HUD — UIScene overlay', {
        fontSize: '14px',
        color: '#ffff00',
      });
  }
}
```

- [ ] **Step 6: Create `src/game/scenes/GameOverScene.ts`**

```ts
import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 40, 'GAME OVER', {
        fontSize: '48px',
        color: '#ff4444',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 30, 'Press R to return to menu', {
        fontSize: '22px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.input.keyboard!.once('keydown-R', () => {
      this.scene.start('MenuScene');
    });
  }
}
```

- [ ] **Step 7: Create `src/game/scenes/VictoryScene.ts`**

```ts
import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 40, 'VICTORY!', {
        fontSize: '48px',
        color: '#44ff88',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 30, 'Press R to return to menu', {
        fontSize: '22px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.input.keyboard!.once('keydown-R', () => {
      this.scene.start('MenuScene');
    });
  }
}
```

---

### Task 4: Entry point

**Files:**
- Create: `src/main.ts`

- [ ] **Step 1: Create `src/main.ts`**

```ts
import Phaser from 'phaser';
import { gameConfig } from './game/config/gameConfig';

new Phaser.Game(gameConfig);
```

---

### Task 5: Folder placeholders

**Files:**
- Create: `.gitkeep` in each empty folder

- [ ] **Step 1: Create placeholder files**

Create an empty `.gitkeep` in each of these paths:

```
src/game/entities/.gitkeep
src/game/systems/.gitkeep
src/game/objects/.gitkeep
src/game/data/.gitkeep
src/game/types/.gitkeep
src/game/utils/.gitkeep
public/assets/sprites/.gitkeep
public/assets/audio/.gitkeep
public/assets/backgrounds/.gitkeep
public/assets/ui/.gitkeep
public/assets/tiles/.gitkeep
```

---

### Task 6: Smoke test and commit

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: Vite prints a local URL (e.g. `http://localhost:5173`). No TypeScript or Vite errors.

- [ ] **Step 2: Verify scene flow in browser**

Open the URL. Verify:
1. Black screen flashes (BootScene) → "Loading..." appears briefly (PreloadScene) → MenuScene shows title and SPACE prompt
2. Press SPACE → Level01Scene shows, yellow "HUD — UIScene overlay" text visible in top-left corner
3. Press G → GameOver screen appears with red "GAME OVER" text
4. Press R → returns to MenuScene
5. Start again → press V → Victory screen appears

- [ ] **Step 3: Verify TypeScript build**

```bash
npm run build
```

Expected: `dist/` folder created, no TS errors, no Vite errors.

- [ ] **Step 4: Write CHANGELOG entry**

Create `CHANGELOG.md` in the repo root:

```md
# Changelog

## Prompt 1 — Project Scaffold
- Initialized Phaser 3 + Vite + TypeScript project
- Created 7 scene stubs: Boot, Preload, Menu, Level01, UI, GameOver, Victory
- Scene flow: Boot → Preload → Menu → Level01 (+UIScene overlay) → GameOver/Victory
- Added config stubs: gameConfig, inputConfig, balanceConfig
- Created folder structure: entities, systems, objects, data, types, utils, public/assets/*
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Prompt 1 — Phaser 3 + Vite + TS scaffold with scene stubs"
git push
```

---

## Self-Review

**Spec coverage:**
- ✅ All 7 scenes created with correct keys
- ✅ UIScene launched as overlay by Level01Scene
- ✅ Three config files (gameConfig, inputConfig, balanceConfig)
- ✅ All 11 empty folders with .gitkeep
- ✅ package.json with correct deps and scripts
- ✅ tsconfig.json strict mode, ESNext
- ✅ vite.config.ts with `base: './'` for Vercel compatibility
- ✅ CHANGELOG created

**Placeholder scan:** No TBDs — all code is complete and runnable.

**Type consistency:** `gameConfig` imported in `main.ts` matches export name in `gameConfig.ts`. Scene keys used in `this.scene.start()` match constructor `super({ key: '...' })` strings throughout.
