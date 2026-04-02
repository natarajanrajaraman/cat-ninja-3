# Cat Ninja 3 — Software Requirements Specification (Starter)

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for the Cat Ninja 3 MVP.

### 1.2 Scope
The MVP is a browser-based single-player 2D precision action platformer with one playable level, one miniboss, player combat systems, pickups, checkpoint respawn, and core UI/audio support.

### 1.3 Intended Audience
- Developer
- Design collaborators
- AI coding assistants used in implementation
- Future technical contributors

### 1.4 Definitions
- **MVP**: minimum viable product / vertical slice
- **Frenzy mode**: manual temporary buff state granted by catnip
- **Hairball super**: time-charged special attack
- **Checkpoint**: respawn anchor within a level

---

## 2. Product Overview

### 2.1 Product Summary
Cat Ninja 3 is a desktop web action platformer built for browser deployment.

### 2.2 Technical Assumptions
- Phaser 3
- Vite
- TypeScript
- Static deployment to Vercel

### 2.3 Core Input Assumptions
- Keyboard + mouse required
- No controller support required for MVP

---

## 3. Functional Requirements

## 3.1 Boot and Startup
- The game shall preload required assets before gameplay.
- The game shall present a title/menu scene after boot.
- The game shall allow starting the level from the menu.

## 3.2 Player Movement
- The player shall move left and right via keyboard input.
- The player shall jump.
- The player shall perform a double jump.
- The player shall perform a wall jump when valid wall conditions are met.
- The player shall dash.
- The player movement model shall support a heavy/committed feel.

## 3.3 Player Combat
- The player shall perform a single precise claw strike.
- The player shall throw shuriken toward the mouse aim direction.
- The player shall hold a maximum of 10 shuriken.
- Shuriken throws shall reduce the current ammo count.
- The player shall enter slow-motion aiming mode while the assigned input is held.
- The player dash shall damage any enemy collided with during dash travel.
- Enemy collision during dash shall shorten or interrupt dash travel.

## 3.4 Health, Lives, and Death
- The player shall have a health bar.
- The player shall lose health when damaged.
- The player shall die when health reaches zero.
- A short death animation shall play on death.
- The player shall lose one life on death.
- The player shall begin each level with 9 lives.
- Lives shall reset per level.
- The player shall respawn at the latest checkpoint if lives remain.
- The game shall enter a game-over flow when lives reach zero.

## 3.5 Pickups and Resource Systems
- Catfood pickups shall restore player health.
- Shuriken pickups shall restore shuriken ammo.
- Catnip pickups shall grant a stored frenzy activation resource.
- Frenzy mode shall not auto-trigger on pickup.
- The player shall manually activate frenzy mode when a valid charge is available.
- Hairball super shall charge over time.
- The player shall activate hairball super when the super meter is full.

## 3.6 Frenzy Mode
- Frenzy mode shall temporarily increase player movement speed.
- Frenzy mode shall temporarily increase attack speed.
- Frenzy mode shall temporarily increase damage output.
- Frenzy mode shall end automatically after its configured duration.
- Frenzy mode shall provide visible state feedback.

## 3.7 Hairball Super
- Hairball super shall damage all enemies on screen or in the encounter scope.
- Hairball super shall apply an additional stronger frontal blast effect.
- Hairball super shall apply dramatic knockback.
- Hairball super shall consume the current super charge on use.

## 3.8 Enemies
- The game shall support a melee grandmother enemy.
- The game shall support a ranged grandmother enemy.
- Enemies shall take damage from player attacks.
- Enemies shall defeat/expire when health reaches zero.
- Enemies shall support basic telegraphs and combat timing windows.

## 3.9 Boss
- The level shall end with a laser T-Rex boss encounter.
- The boss shall operate in one phase.
- The boss shall support multiple attack patterns.
- The boss shall have a defeat state.
- Defeating the boss shall trigger the victory flow.

## 3.10 Level and Checkpoints
- The MVP shall include one playable level.
- The level shall include platforming, enemies, pickups, and checkpoints.
- The level shall include a boss arena in a mall atrium setting.
- Checkpoints shall update the player respawn location.

## 3.11 UI
- The HUD shall display health.
- The HUD shall display lives.
- The HUD shall display shuriken ammo.
- The HUD shall display frenzy availability.
- The HUD shall display hairball super charge.
- The game shall include pause, game over, and victory screens.

## 3.12 Audio
- The game shall support background music playback.
- The game shall support core sound effects for movement, attacks, hits, pickups, and super activation.

---

## 4. Non-Functional Requirements

### 4.1 Performance
- The game should run smoothly in a modern desktop browser.
- Core gameplay input should feel responsive and low-latency.
- Effects should be implemented with browser performance in mind.

### 4.2 Maintainability
- Code should be modular and organized by scene, entity, and system.
- Tunable values should be externalized where reasonable.
- Major gameplay systems should be isolated enough for iterative tuning.

### 4.3 Usability
- The HUD should be readable at normal desktop play size.
- Core gameplay states should be visually understandable.
- Input mappings should be easy to learn.

### 4.4 Reliability
- Respawn logic should be consistent.
- Ammo, health, and lives should update reliably.
- Collision behavior should be predictable and testable.

---

## 5. Technical Architecture

### 5.1 Scene Structure
- BootScene
- PreloadScene
- MenuScene
- Level01Scene
- UIScene
- GameOverScene
- VictoryScene

### 5.2 Core Entity Types
- Player
- GrannyMelee
- GrannyRanged
- TRexBoss
- Projectile
- Pickup
- Checkpoint
- Hazard

### 5.3 Core Systems
- Input system
- Combat/damage system
- Pickup/resource system
- Checkpoint/lives system
- Audio system
- Camera/UI system

### 5.4 Data Configuration
- Player config
- Enemy config
- Pickup config
- Level config
- Balance config

---

## 6. Testing Requirements

### 6.1 Movement Tests
- Run responsiveness
- Jump reliability
- Double jump validity
- Wall jump conditions
- Dash refresh rules

### 6.2 Combat Tests
- Claw hit detection
- Shuriken aim direction
- Ammo decrement
- Slow-mo timing
- Dash collision damage

### 6.3 Survival Tests
- Health reduction
- Death trigger
- Life decrement
- Respawn correctness
- Game over correctness

### 6.4 Pickup Tests
- Catfood health restore
- Ammo restore
- Catnip grant and manual use
- Super charge progression over time

### 6.5 Enemy/Boss Tests
- Granny AI loops
- Boss attack triggers
- Boss damage intake
- Boss defeat flow

### 6.6 Browser Smoke Tests
- Startup
- Menu to level flow
- Basic playthrough
- Pause/resume
- Victory/game over transitions

---

## 7. Deployment Requirements
- The project shall build as a web application.
- Static assets shall load correctly in deployment.
- The build output shall be compatible with Vercel hosting.

---

## 8. Out of Scope for MVP
- Multiple levels
- Save progression across sessions
- Controller support
- Advanced cutscenes
- Full settings menu
- Complex enemy roster
- Unlock trees
- Narrative campaign systems
