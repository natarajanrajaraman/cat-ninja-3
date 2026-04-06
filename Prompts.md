PROMPT 1

Read the Design folder first, especially:
- Design/00_Project_Overview.md
- Design/01_Concept_Sheet.md
- Design/06_Technical_Implementation_Plan.md
- Design/09_Player_Controller_Spec.md

Then create a Phaser 3 + Vite + TypeScript project structure for Cat Ninja 3.

Requirements:
- Create scenes: BootScene, PreloadScene, MenuScene, Level01Scene, UIScene, GameOverScene, VictoryScene
- Use a modular folder structure with config, scenes, entities, systems, objects, data, types, and utils
- Keep the code simple, maintainable, and easy to extend
- Add comments only where they help explain structure or tuning points
- Do not implement full gameplay yet
- After implementation, summarize what was created and what the next best step is

PROMPT 2
Read the Design folder first, especially:
- Design/06_Technical_Implementation_Plan.md

Now wire up the scene flow for Cat Ninja 3.

Requirements:
- BootScene should lead into PreloadScene
- PreloadScene should load placeholder assets if needed and then lead into MenuScene
- MenuScene should allow starting Level01Scene
- UIScene should be structured so it can later overlay gameplay
- Add GameOverScene and VictoryScene as placeholders
- Keep everything compiling cleanly
- Do not add gameplay systems yet
- After implementation, explain the scene flow and list any files added or changed

PROMPT 3
Read the Design folder first, especially:
- Design/06_Technical_Implementation_Plan.md

Now wire up the scene flow for Cat Ninja 3.

Requirements:
- BootScene should lead into PreloadScene
- PreloadScene should load placeholder assets if needed and then lead into MenuScene
- MenuScene should allow starting Level01Scene
- UIScene should be structured so it can later overlay gameplay
- Add GameOverScene and VictoryScene as placeholders
- Keep everything compiling cleanly
- Do not add gameplay systems yet
- After implementation, explain the scene flow and list any files added or changed

PROMPT 4
Review the current Cat Ninja 3 player controller implementation against the design intent in:
- Design/09_Player_Controller_Spec.md
- Design/10_Balance_Tuning_Table.md

Then improve the controller for feel.

Requirements:
- Focus on responsiveness while preserving a heavy, committed feel
- Tune acceleration, deceleration, gravity, jump arc, double jump feel, wall jump reliability, and dash feel
- Clean up any brittle logic or unclear state handling
- Keep values centralized and easy to tune
- Do not add combat or enemy logic yet
- After implementation, summarize the highest-impact tuning decisions and any remaining weaknesses

PROMPT 5
Read the Design folder first, especially:
- Design/08_Combat_Spec.md
- Design/09_Player_Controller_Spec.md
- Design/10_Balance_Tuning_Table.md

Now add the first combat prototype to the existing Cat Ninja 3 graybox build.

Requirements:
- Add a single precise melee claw strike on J
- Add mouse-aimed shuriken on left-click
- Add max shuriken ammo of 10
- Add an ammo counter in UIScene
- Add a simple dummy enemy that can take damage
- Keep all combat values configurable
- Structure the combat code so it can later support granny enemies and the T-Rex boss
- Do not implement frenzy, checkpoints, pickups, or boss logic yet
- After implementation, explain the combat architecture and identify the next best prompt

PROMPT 6
Read the Design folder first, especially:
- Design/08_Combat_Spec.md

Now implement slow-motion aim for Cat Ninja 3.

Requirements:
- Holding right-click should slow time and support precise mouse-aimed shuriken use
- The effect should feel responsive, not awkward
- The logic should be modular and easy to tune
- Update any relevant UI or reticle behavior if needed
- Keep the current graybox prototype stable
- After implementation, explain how slow-mo is handled technically and what should be tested next

PROMPT 7
Read the Design folder first, especially:
- Design/04_SRS_Starter.md
- Design/08_Combat_Spec.md

Now implement the survival loop for Cat Ninja 3.

Requirements:
- Add a player health bar
- Add 9 lives per level
- Add short death animation handling
- Add checkpoint-based respawn
- Add Game Over flow when lives reach zero
- Update UIScene to show health and lives
- Keep the implementation modular and easy to debug
- Do not implement pickups or frenzy yet
- After implementation, explain the death/respawn flow and any edge cases to test

PROMPT 8
Read the Design folder first, especially:
- Design/08_Combat_Spec.md
- Design/10_Balance_Tuning_Table.md

Now implement pickups and frenzy mode for Cat Ninja 3.

Requirements:
- Add catfood pickup to restore health
- Add shuriken pickup to restore ammo
- Add catnip pickup that grants a stored frenzy charge
- Frenzy must be manually activated later by player input
- While frenzy is active, movement speed, attack speed, and damage should increase
- Add clear UI/state signaling for frenzy availability and activation
- Keep all values configurable
- Do not implement the hairball super yet
- After implementation, explain the pickup/resource architecture and what to balance first

Read the Design folder first, especially:
- Design/08_Combat_Spec.md
- Design/10_Balance_Tuning_Table.md

Now implement the hairball super for Cat Ninja 3.

Requirements:
- The super should charge automatically over time
- Add a visible super meter in UIScene
- When activated, it should deal full-screen damage to enemies
- It should also create a stronger frontal cone/blast in front of the player
- It should apply dramatic knockback
- Keep the implementation performant and configurable
- After implementation, explain the super architecture and any likely balancing risks

PROMPT 10
Read the Design folder first, especially:
- Design/05_Level_01_Mall_Mayhem.md
- Design/08_Combat_Spec.md

Now implement the first real enemy prototypes for Cat Ninja 3.

Requirements:
- Add GrannyMelee with a readable close-range attack and punish window
- Add GrannyRanged with a readable telegraphed projectile attack
- Use simple, maintainable AI state machines
- Ensure both enemies interact correctly with claws, shuriken, dash collision, frenzy, and hairball super
- Keep tuning values centralized
- After implementation, explain the enemy architecture and what should be tested before building the full level

