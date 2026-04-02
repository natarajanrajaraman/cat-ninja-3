# Cat Ninja 3 — Player Controller Specification

## Purpose
This document defines the intended feel, rules, and implementation targets for the player controller in Cat Ninja 3.

---

## 1. Controller Vision

The player controller is the foundation of the game. It must feel:
- heavy
- responsive
- athletic
- readable
- deliberate

The cat should feel like a real house cat elevated into action-hero performance, not like a floaty mascot or an overly humanoid action figure.

### Primary Feel Goals
- strong landing weight
- committed jumps
- sharp directional responsiveness on the ground
- controlled but limited air correction
- satisfying dash burst
- tight integration with combat

---

## 2. Core Movement Abilities

## 2.1 Run

### Goal
Allow confident, readable ground movement with noticeable weight.

### Feel Notes
- acceleration should be fast enough to feel responsive
- deceleration should preserve a bit of momentum
- ground movement should feel more stable than air movement

### Tuning Concerns
- too slow = sluggish
- too fast = hard to read in combat
- too slidey = imprecise
- too stiff = lifeless

---

## 2.2 Jump

### Goal
Create a committed jump arc that still feels fair and controllable.

### Desired Feel
- initial launch should feel spring-loaded
- gravity should give a strong sense of weight
- jumps should not feel balloon-like
- peak hang time should be limited

### Recommended Support Features
- coyote time
- jump buffering

These are strongly recommended even for a “heavy” controller because they improve fairness without making the cat feel floaty.

---

## 2.3 Double Jump

### Goal
Provide mid-air correction and action-platformer expression.

### Design Role
- traversal extension
- recovery tool
- combat repositioning

### Rules
- available once after leaving ground
- resets on landing
- should have distinct feedback so it feels different from the base jump

### Feel Notes
- should not feel as powerful as the ground jump
- should still have enough force to be useful
- should visually and audibly signal clearly

---

## 2.4 Wall Jump

### Goal
Support vertical traversal and emergency recovery.

### Design Role
- creates expressive movement routes
- increases skill ceiling
- supports level identity and boss evasion

### Rules
- available when touching or validly attached to wall
- should push player away from wall with readable direction
- should refresh jump state as designed

### Feel Notes
- wall jump should not feel sticky or awkward
- wall detection should be forgiving enough to support intended routes
- repeated wall interaction should not break clarity

---

## 2.5 Dash

### Goal
Provide a high-commitment burst movement tool with offensive collision value.

### Design Role
- evasive repositioning
- aggressive entry tool
- situational damage source

### Rules
- player dashes rapidly in intended direction
- dash refreshes on landing or valid refresh condition
- any enemy collided with during dash takes damage
- dash travel is shortened or interrupted by enemy collision
- dash must not be infinitely chainable without rules

### Feel Notes
- dash should be crisp and satisfying
- dash should not feel slippery
- dash should be powerful but risky
- dash recovery should be tunable

### Open Implementation Questions
- brief invulnerability or none?
- fixed dash distance or time-based dash?
- direct recoil vs simple cancel on enemy impact?

---

## 3. Movement State Model

Suggested states:
- idle
- run
- jump
- fall
- double jump
- wall contact
- wall jump
- dash
- attack
- hurt
- death
- frenzy overlay state

### Notes
Frenzy is probably best treated as a modifier overlay rather than a completely separate movement state.

---

## 4. Ground vs Air Control

### Ground Control
Should be:
- more accurate
- more responsive
- more stable for combat positioning

### Air Control
Should be:
- present but limited
- enough to avoid frustration
- not so strong that jumps lose commitment

### Goal
The player should feel in control without erasing movement consequences.

---

## 5. Suggested Fairness Features

These are highly recommended even if hidden from the player:

### Coyote Time
Allows jump input shortly after leaving a platform.

### Jump Buffer
Allows a jump input slightly before landing to still trigger.

### Wall Grace Window
Allows wall jump if wall contact was extremely recent.

### Dash Input Buffer
Optional; useful if dash timing needs smoothing.

These systems improve fairness without obviously changing the heavy-feel identity.

---

## 6. Combat Integration Requirements

The controller must work cleanly with:
- mouse aim
- melee attack timing
- dash collision
- frenzy speed modifications
- knockback/hurt responses
- death/respawn logic

### Special Concern
Mouse aiming must not make the controller feel clumsy. The player should be able to move, reposition, and shoot without the game becoming awkward.

---

## 7. Frenzy Mode Controller Effects

When frenzy is active:
- run speed increases
- possibly acceleration increases
- attack speed increases
- damage increases

### Controller Note
Movement should feel more aggressive, but still controllable. Frenzy should not make the controller unreadably fast.

---

## 8. Recommended Tuning Workflow

Tune in this order:
1. run
2. jump
3. double jump
4. wall jump
5. dash
6. air control
7. attack movement lock interactions
8. frenzy variation

### Important Rule
Do not attempt to tune movement only from reading values. Tune by feel in a graybox room with repeated short playtests.

---

## 9. Graybox Test Room Requirements

The first controller test room should include:
- flat ground for run feel
- short jump gaps
- taller double-jump gaps
- wall-jump shaft
- dash lane
- elevated ledges
- a small combat dummy zone

This room should exist before serious content production.

---

## 10. Failure Modes to Avoid

### Too Floaty
The cat feels balloon-like or mascot-like.

### Too Sluggish
The cat feels delayed and unresponsive.

### Too Slidey
Stopping and turning feel mushy.

### Too Air-Controllable
Jump commitment disappears.

### Too Harsh
The player feels punished by input precision rather than challenged by game design.

### Dash Dominance
Dash becomes the answer to every encounter.

---

## 11. Implementation Notes for Code Structure

Recommended separation:
- input reading
- movement physics
- state transitions
- combat actions
- external modifiers like frenzy
- animation state resolution

### Benefit
This makes the controller easier to tune and debug.

---

## 12. MVP Success Criteria

The controller is successful when:
- moving around is enjoyable even without enemies
- jumps feel intentional and fair
- wall jump and double jump are reliable
- dash feels impactful
- combat inputs combine smoothly with movement
- the player immediately understands the cat as agile but heavy
