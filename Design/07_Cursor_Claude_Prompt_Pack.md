# Cat Ninja 3 — Cursor / Claude Code Prompt Pack

## Purpose
This file contains practical prompts for building Cat Ninja 3 incrementally in Cursor with Claude Code.

## Usage Notes
- Use one prompt at a time
- Review and test after each response
- Keep changes modular
- Prefer implementation + explanation + next-step suggestions
- Ask for TypeScript and maintainable code structure

---

## Prompt 1 — Bootstrap project
Create a Phaser 3 + Vite + TypeScript project structure for a browser-based 2D action platformer called Cat Ninja 3. Add scenes for Boot, Preload, Menu, Level01, UI, GameOver, and Victory. Use a clean modular folder structure with entities, systems, data, and config. Keep the codebase easy to extend.

---

## Prompt 2 — Basic player controller
Implement a Player class for a precision-action platformer. The movement should feel heavy and committed rather than floaty. Add run, jump, double jump, wall jump, and dash. Make the movement parameters configurable. Include comments explaining how to tune feel.

---

## Prompt 3 — Graybox level test scene
Create a graybox Level01 scene with simple platforms, walls, and a camera follow setup so the player controller can be tested properly. Add enough geometry to test double jumps, wall jumps, and dash movement.

---

## Prompt 4 — Melee attack
Add a single precise melee claw strike on the J key. The strike should have a short active window and clear attack timing. Structure the code so hitboxes and timing can be tuned easily later.

---

## Prompt 5 — Mouse-aimed shuriken
Add mouse-aimed shuriken throwing on left-click. The player should have a maximum ammo count of 10. Add a visible ammo counter in the UI scene. Keep projectile speed, cooldown, and ammo values configurable.

---

## Prompt 6 — Slow-motion aim
Implement slow-motion aiming while right-click is held. The world should slow down while aiming, but the controls and aiming should remain responsive. Make the effect easy to tune and isolate the logic cleanly.

---

## Prompt 7 — Player health and lives
Implement a health bar and a 9-lives-per-level system. When health reaches zero, play a short death animation, reduce lives by one, and respawn the player at the latest checkpoint if lives remain. If lives reach zero, trigger a game-over flow.

---

## Prompt 8 — Checkpoints
Add checkpoints to the level. The latest activated checkpoint should become the respawn location after death. Structure the logic so checkpoint state is easy to understand and debug.

---

## Prompt 9 — Pickups
Implement three pickups:
1. Catfood restores health
2. Shuriken pickup restores ammo
3. Catnip grants a stored frenzy activation charge

Do not auto-activate frenzy on pickup. Add placeholder visuals and clear comments.

---

## Prompt 10 — Frenzy mode
Implement a manually activated frenzy mode. While active, the player should move faster, attack faster, and deal more damage for a short duration. Add clear visual signaling and keep all values configurable.

---

## Prompt 11 — Hairball super
Implement a time-charged hairball super. It should charge automatically over time. When used, it should deal full-screen damage to enemies, create a stronger frontal cone/blast in front of the player, and apply strong knockback. Add a visible super meter in the UI scene.

---

## Prompt 12 — Dummy enemy
Create a simple dummy enemy that can take damage from claws, shuriken, dash collision, and hairball super. Add basic hit flash or placeholder hit feedback.

---

## Prompt 13 — Dash collision damage
Implement dash collision damage so that any enemy collided with during dash travel takes damage. The collision should shorten or interrupt dash travel and create a recoil or vulnerability response for the player. Keep the behavior easy to tune.

---

## Prompt 14 — Granny melee enemy
Implement a GrannyMelee enemy with a readable close-range attack, a clear telegraph, and a punish window. Use a simple finite state machine or equivalent modular AI structure.

---

## Prompt 15 — Granny ranged enemy
Implement a GrannyRanged enemy that throws a projectile after a readable telegraph. The projectile and timing should be configurable. Keep the enemy behavior simple and maintainable.

---

## Prompt 16 — Level encounter pass
Help design and implement a first graybox pass of Level01, a mall-themed level with traversal, small combat spaces, pickups, and a pre-boss checkpoint. Focus on layout logic, not art polish.

---

## Prompt 17 — Boss arena
Build a graybox boss arena for a mall atrium. It should include enough open space and vertical structure to support laser sweeps, jumping, repositioning, and boss readability.

---

## Prompt 18 — TRex boss
Implement a one-phase TRexBoss for the mall atrium. Include a laser sweep attack, a stomp/shockwave-style attack, a punish window, boss health, and a defeat state that triggers level victory.

---

## Prompt 19 — UI pass
Implement a UI scene showing health bar, lives, shuriken ammo, frenzy availability, and hairball super charge. Keep the styling minimal and readable for now.

---

## Prompt 20 — Audio integration
Help integrate placeholder audio into the game. Add support for background music, jump, attack, damage, pickup, frenzy, boss, and super activation sounds. Keep audio triggering modular.

---

## Prompt 21 — Polish pass
Suggest and implement a lightweight polish pass for Cat Ninja 3, including hit flashes, particles, dash trails, limited screen shake, and basic camera feedback, while keeping browser performance in mind.

---

## Prompt 22 — Refactor and cleanup
Review the current Cat Ninja 3 codebase and refactor for clarity, modularity, and maintainability. Identify duplication, brittle logic, unclear naming, and any systems that should be externalized into config.

---

## Prompt 23 — Bugfix and balancing review
Review the current gameplay implementation for likely issues in controller feel, combat readability, ammo economy, frenzy usefulness, checkpoint reliability, and boss fairness. Suggest concrete improvements and implement the highest-value fixes.

---

## Prompt 24 — Deployment readiness
Prepare the Cat Ninja 3 project for deployment on Vercel. Check build output assumptions, asset path handling, and any configuration needed for static hosting. Explain any required repo or package.json updates.
