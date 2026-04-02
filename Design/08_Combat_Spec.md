# Cat Ninja 3 — Combat Specification

## Purpose
This document defines the intended combat behavior for the Cat Ninja 3 MVP. It should be used to guide implementation, balancing, and testing.

---

## 1. Combat Design Goals

### 1.1 Core Goals
- Combat should feel precise, readable, and timing-based.
- The player should use the full kit: movement, dash, claws, shuriken, frenzy, and super.
- Combat should reward positioning and timing more than button mashing.
- Enemies should be funny in concept but clear in function.

### 1.2 Combat Tone
Combat should feel:
- punchy
- fast
- deliberate
- slightly absurd
- arcade-readable

### 1.3 Player Skill Expression
The player should succeed through:
- correct spacing
- aiming accuracy
- punish timing
- dash commitment judgment
- resource use
- survival under pressure

---

## 2. Player Offensive Toolkit

## 2.1 Claw Strike

### Role
Short-range punish attack.

### Identity
- Single precise melee strike
- Not a combo chain
- Used when the player has created a safe opening

### Intended Feel
- quick startup
- crisp contact
- modest recovery
- high clarity

### Recommended MVP Parameters
- startup: short
- active frames/window: brief
- recovery: short but noticeable
- damage: moderate
- range: short
- knockback: light-to-moderate

### Design Notes
- Claws should feel strongest when used after a dodge, jump, or punish window.
- Claws should not outperform shuriken in all situations.
- Claws should not become spammy.

---

## 2.2 Shuriken

### Role
Precision ranged weapon.

### Identity
- Mouse-aimed
- Limited ammo
- Fast and sharp
- Reliable when used well

### Intended Feel
- immediate release
- clean trajectory
- accurate response to cursor angle
- useful against elevated or unsafe targets

### Resource Rules
- maximum carry: 10
- replenishment: pickups only
- scarcity: medium

### Recommended MVP Parameters
- projectile speed: high
- fire delay: short or modest
- damage: light-to-moderate
- knockback: light
- ammo restore per pickup: tuneable, likely 2–5

### Design Notes
- The player should feel encouraged to use shuriken regularly, but still notice ammo pressure.
- Shuriken should solve positioning problems that claws cannot.
- Mouse aim must be validated early in development.

---

## 2.3 Dash Collision Damage

### Role
Risk-reward mobility attack.

### Identity
- traversal tool that can also hurt enemies
- commitment move
- not free invulnerability or free damage

### Rules
- any enemy collided with during dash travel takes damage
- collision shortens or interrupts dash distance
- player experiences recoil, vulnerability, or dash cancellation on collision

### Recommended MVP Behavior
- dash can hit multiple enemies only if travel and collision logic allow it cleanly
- dash damage should be meaningful but not stronger than all other tools
- dash should remain valuable for repositioning even when used defensively

### Design Notes
- Collision readability is critical.
- Dash should feel impactful, not slippery.
- Avoid tuning dash so strong that normal melee and shuriken become secondary.

---

## 2.4 Frenzy Mode

### Role
Temporary burst state under player control.

### Identity
- manually activated power state
- driven by catnip resource
- turns the cat feral, fast, and dangerous

### Activation Model
- catnip pickup grants stored frenzy charge
- frenzy is manually activated later by player input
- frenzy lasts for a short configured duration

### Active Effects
- increased movement speed
- increased attack speed
- increased damage

### Intended Feel
- aggressive
- exciting
- visibly different
- powerful but temporary

### Design Notes
- Frenzy should change how the player approaches an encounter.
- It should be useful, not mandatory.
- It should not remove all gameplay tension.

---

## 2.5 Hairball Super

### Role
Time-charged crowd-control spectacle move.

### Identity
- comedic signature move
- reliable panic/reset button
- highly visible power moment

### Charge Model
- charges automatically over time

### Effect Model
- full-screen damage to enemies
- extra frontal cone/blast in front of player with higher damage
- large knockback / room-clearing joke effect

### Intended Feel
- gross
- funny
- satisfying
- dramatic
- cathartic

### Design Notes
- Charge timing must be slow enough that the move feels special.
- The frontal blast should reward intentional facing/orientation.
- The move should be a spectacle without trivializing the entire level.

---

## 3. Player Defense and Survival

## 3.1 Health
- player uses a health bar
- health is restored by catfood pickups

## 3.2 Lives
- 9 lives per level
- lives reset per level

## 3.3 Death Loop
- short death animation
- lose one life
- respawn at checkpoint
- zero lives = game over / restart flow

### Combat Implication
The player can make mistakes and recover, but repeated sloppy play is punished.

---

## 4. Enemy Combat Design Principles

### 4.1 Readability First
Enemy attacks must be:
- telegraphed
- readable
- consistent
- understandable after one or two encounters

### 4.2 Small Mechanical Footprint
Each enemy should have a small number of clear behaviors.

### 4.3 Funny Concept, Serious Function
Enemies may be absurd in theme, but their gameplay role should remain coherent.

### 4.4 Punish Windows
Every major enemy attack should create a punish opportunity, even if brief.

---

## 5. Granny Enemy Specs

## 5.1 Granny Melee

### Role
Close-range pressure enemy.

### Concept
Ordinary grandmother with absurd combat skill and a dangerous close-range strike.

### Likely Weapon
- handbag
- umbrella
- domestic object

### Behavior Goals
- approaches player
- telegraphs attack
- commits to strike
- becomes punishable after miss or recovery

### Combat Function
Teaches:
- spacing
- dodge timing
- close punish

---

## 5.2 Granny Ranged

### Role
Space-control enemy.

### Concept
Ordinary grandmother who throws a household item as a projectile.

### Likely Projectile
- slipper
- rolling pin
- purse item
- canned goods or other comic object

### Behavior Goals
- establish spacing
- telegraph projectile
- force movement or shuriken response
- encourage mixed combat

### Combat Function
Teaches:
- projectile timing
- ranged pressure management
- using movement and shuriken in combination

---

## 6. Boss Combat Spec — Laser T-Rex

## 6.1 Role
End-of-level one-phase miniboss.

## 6.2 Arena
Mall atrium

## 6.3 Combat Goals
- deliver spectacle
- test movement timing
- test shuriken usefulness
- create clear punish windows
- provide satisfying victory

## 6.4 Candidate Attack Set
- laser sweep
- stomp / shockwave
- bite / snap / charge
- recovery window

## 6.5 Intended Player Responses
- jump laser or reposition
- use vertical movement to survive
- use shuriken during safer windows
- use claws when close punish becomes possible
- use super as a major damage moment

## 6.6 Boss Design Notes
- one phase only for MVP
- boss should be memorable but not overly difficult
- visibility and arena clarity matter more than complexity

---

## 7. Balancing Heuristics

### 7.1 Combat Should Favor Variety
No single tool should solve all encounters.

### 7.2 Ammo Scarcity Should Be Felt, Not Miserable
Shuriken use should matter, but the player should not be constantly starved.

### 7.3 Frenzy Should Be Valuable
Manual frenzy use should feel worth saving for key moments.

### 7.4 Super Should Feel Special
Hairball super should be impactful enough that players look forward to using it.

### 7.5 Dash Should Stay Honest
Dash should remain strong but not abusable.

---

## 8. Open Tuning Questions
- exact claw damage vs shuriken damage
- exact dash damage and recoil behavior
- frenzy duration
- super charge timing
- boss health budget
- ammo pickup restore amount
- enemy health values
- invulnerability window durations

These should be finalized through prototype testing, not design guesswork alone.
