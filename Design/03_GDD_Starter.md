# Cat Ninja 3 — Game Design Document (Starter)

## 1. Overview

### 1.1 Title
Cat Ninja 3

### 1.2 Genre
Single-player 2D precision action platformer

### 1.3 Platform
Desktop web browser

### 1.4 Target Deployment
Vercel

### 1.5 High Concept
Cat Ninja 3 is a browser-based HD-2D pixel-art precision action platformer starring a mostly realistic house cat in ninja gear. The player traverses exaggerated domestic and urban-commercial spaces using heavy movement, mouse-aimed shuriken, a precise claw strike, dash collision combat, frenzy mode, and a time-charged hairball super.

---

## 2. Vision

### 2.1 Player Fantasy
Be a stylish, deadly, house-cat action hero.

### 2.2 Design Pillars
1. Precision with weight
2. House-cat action fantasy
3. Stylish absurdity
4. Fast arcade recovery

### 2.3 Tone
- Playful retro parody
- Cool arcade action
- Absurd urban-comedy
- Readable and satisfying

### 2.4 Differentiators
- House-cat perspective in familiar human spaces
- Mouse-aimed shuriken in a 2D platformer
- Heavy movement rather than floaty mascot movement
- Comedic enemy premise with real action-game structure

---

## 3. Core Gameplay Loop
1. Enter environment
2. Traverse obstacles and vertical routes
3. Fight enemies
4. Manage health, ammo, and powerups
5. Reach checkpoint
6. Continue through level
7. Defeat boss
8. Clear level

---

## 4. Player Character

### 4.1 Identity
A mostly realistic house cat in ninja gear.

### 4.2 Visual Direction
- Feline silhouette
- Minimal anthropomorphic distortion
- Expressive but grounded
- Athletic and poised

### 4.3 Movement Kit
- Run
- Jump
- Double jump
- Wall jump
- Dash

### 4.4 Combat Kit
- Claw strike
- Shuriken
- Slow-mo aim
- Dash collision damage
- Frenzy mode
- Hairball super

### 4.5 Resources
- Health
- Lives
- Shuriken ammo
- Frenzy charge
- Hairball super meter

---

## 5. Controls

### 5.1 Current Recommended Layout
- A / D = move
- W = interact / up
- S = crouch / drop
- Space = jump
- Shift = dash
- Left click = shuriken
- Right click = slow-mo aim
- J = claws
- Q = hairball super
- E or R = frenzy activation
- Esc = pause

### 5.2 Notes
Control mapping can be revised after prototype feel testing.

---

## 6. Movement Systems

### 6.1 Movement Feel Target
Movement should feel heavy, committed, physical, and responsive.

### 6.2 Run
Describe speed, acceleration, and deceleration targets here.

### 6.3 Jump
Describe jump arc, gravity, coyote time, and jump buffering here.

### 6.4 Double Jump
Describe conditions, visual feedback, and tuning here.

### 6.5 Wall Jump
Describe wall detection, jump direction, and refresh rules here.

### 6.6 Dash
Describe:
- startup
- travel
- refresh rules
- collision effects
- recovery state

---

## 7. Combat Systems

### 7.1 Claws
- Single precise melee strike
- Short-range punish attack

### 7.2 Shuriken
- Mouse-aimed
- Ammo-limited
- Max carry = 10
- Pickup replenishment only

### 7.3 Slow-motion Aim
- Activated by holding input
- Temporarily slows world
- Supports precision ranged play

### 7.4 Dash Collision Damage
- Any enemy collided with during dash takes damage
- Dash travel is shortened/interrupted on collision

### 7.5 Frenzy Mode
- Manually activated
- Triggered using stored catnip charge
- Increases speed, attack speed, and damage

### 7.6 Hairball Super
- Charges over time
- Full-screen damage
- Extra frontal cone/blast
- Room-clearing knockback joke effect

---

## 8. Survival and Resources

### 8.1 Health
- Health bar model
- Restored by catfood

### 8.2 Lives
- 9 lives per level
- Reset each level

### 8.3 Death
- Short death animation
- Lose one life
- Respawn at latest checkpoint

### 8.4 Shuriken Ammo
- Medium scarcity
- Encourages active use with restraint

### 8.5 Frenzy Charge
Document storage, max charge count, and activation logic here.

### 8.6 Super Meter
Document passive charge timing here.

---

## 9. Pickups and Powerups

### 9.1 Catfood
- Restores health

### 9.2 Shuriken Pickup
- Restores ammo

### 9.3 Catnip
- Grants frenzy charge
- Manual activation later

### 9.4 Future Pickup Expansion
Leave room for future ideas here.

---

## 10. Enemies

### 10.1 Enemy Design Principles
- Readable silhouettes
- Clear telegraphs
- Absurd concept, clean function
- Small number of mechanics per enemy

### 10.2 Granny Melee
Document movement, attack, telegraph, punish window, and tuning here.

### 10.3 Granny Ranged
Document projectile type, telegraph, spacing role, and weaknesses here.

### 10.4 Future Enemies
Reserve space here.

---

## 11. Boss Design

### 11.1 Boss
Laser T-Rex

### 11.2 Tone Framing
Urban-commercial security/mascot threat

### 11.3 Arena
Mall atrium

### 11.4 Boss Function
End-of-level miniboss encounter

### 11.5 Boss Attack List
- Laser sweep
- Stomp / shockwave
- Charge / bite / snap
- Punish window logic

### 11.6 Boss Structure
- One phase
- Boss defeat required to clear level

---

## 12. World and Levels

### 12.1 World Concept
Everyday human spaces transformed into dramatic cat-scale action environments.

### 12.2 Environment Types
- Apartment
- Street
- Mall
- Office
- Rooftop
- Service corridor

### 12.3 Level Design Principles
- Clear traversal readability
- Vertical layering
- Space for ranged and melee play
- Pickup economy integrated into pathing
- Boss arena payoff

### 12.4 Level 1
Mall Mayhem / Atrium Ambush

---

## 13. Progression
For MVP:
- single level
- checkpoint progression
- life reset per level
- no permanent unlock system required

---

## 14. UI / HUD

### HUD Elements
- Health bar
- Lives
- Shuriken ammo
- Frenzy charge
- Super meter

### Menus
- Title
- Pause
- Game Over
- Victory

---

## 15. Audio
Document soundtrack usage, combat SFX, UI sounds, and boss cues here.

---

## 16. Art Direction
Document character style, enemy style, environment style, FX style, and UI style here.

---

## 17. Technical Constraints
Document browser constraints, performance goals, and implementation boundaries here.

---

## 18. MVP Scope
Document final in-scope vs out-of-scope items here.

---

## 19. Post-MVP Expansion
Document future level, enemy, and system ideas here.
