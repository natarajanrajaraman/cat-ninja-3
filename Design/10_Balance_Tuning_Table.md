# Cat Ninja 3 — Balance Tuning Table

## Purpose
This file is a starter balancing sheet for the MVP. The first values should be treated as test values, not final values.

## Usage
- Fill in initial implementation values
- Record playtest observations
- Update based on feel and readability
- Keep notes on what changed and why

---

## 1. Player Core Stats

| Parameter | Initial Test Value | Notes | Last Updated |
|---|---:|---|---|
| Max Health | TBD | Health bar total | TBD |
| Starting Lives per Level | 9 | Fixed current design | TBD |
| Move Speed | TBD | Ground movement speed | TBD |
| Ground Acceleration | TBD | Heavier but responsive | TBD |
| Ground Deceleration | TBD | Avoid excessive sliding | TBD |
| Jump Velocity | TBD | Base jump strength | TBD |
| Gravity | TBD | Should feel heavy | TBD |
| Double Jump Velocity | TBD | Slightly weaker than base jump | TBD |
| Wall Jump Horizontal Force | TBD | Must feel reliable | TBD |
| Wall Jump Vertical Force | TBD | Must support intended routes | TBD |
| Dash Speed | TBD | Core burst value | TBD |
| Dash Duration | TBD | Or convert to fixed distance | TBD |
| Dash Cooldown / Refresh Rule | Land / wall refresh | Design intent | TBD |

---

## 2. Player Combat Stats

| Parameter | Initial Test Value | Notes | Last Updated |
|---|---:|---|---|
| Claw Damage | TBD | Precise melee punish value | TBD |
| Claw Startup | TBD | Should feel quick | TBD |
| Claw Active Window | TBD | Brief and clear | TBD |
| Claw Recovery | TBD | Prevent spam | TBD |
| Shuriken Max Ammo | 10 | Locked design choice | TBD |
| Shuriken Damage | TBD | Precision ranged baseline | TBD |
| Shuriken Speed | TBD | Should feel fast and clean | TBD |
| Shuriken Fire Delay | TBD | Tune to avoid spam | TBD |
| Dash Collision Damage | TBD | Must be meaningful but not dominant | TBD |
| Dash Collision Recoil/Vulnerability | TBD | Tuning target | TBD |

---

## 3. Frenzy Mode

| Parameter | Initial Test Value | Notes | Last Updated |
|---|---:|---|---|
| Frenzy Charge Capacity | 1 | Recommended MVP default | TBD |
| Frenzy Duration | TBD | Must feel worth using | TBD |
| Frenzy Move Speed Multiplier | TBD | Keep readable | TBD |
| Frenzy Attack Speed Multiplier | TBD | Noticeable improvement | TBD |
| Frenzy Damage Multiplier | TBD | Strong but not broken | TBD |

---

## 4. Hairball Super

| Parameter | Initial Test Value | Notes | Last Updated |
|---|---:|---|---|
| Super Charge Time | TBD | Time-based fill | TBD |
| Full-Screen Damage | TBD | All enemies baseline damage | TBD |
| Frontal Blast Bonus Damage | TBD | Stronger front cone | TBD |
| Knockback Force | TBD | Should feel dramatic | TBD |
| Super Cooldown After Use | N/A or TBD | Depends on implementation | TBD |

---

## 5. Pickups

| Parameter | Initial Test Value | Notes | Last Updated |
|---|---:|---|---|
| Catfood Heal Amount | TBD | Health restore amount | TBD |
| Shuriken Pickup Restore Amount | TBD | Likely 2–5 test range | TBD |
| Catnip Grant Amount | 1 Frenzy Charge | Current design assumption | TBD |
| Pickup Respawn Behavior | None in level | MVP likely one-use | TBD |

---

## 6. Enemy Stats — Granny Melee

| Parameter | Initial Test Value | Notes | Last Updated |
|---|---:|---|---|
| Health | TBD | Low-to-mid durability | TBD |
| Contact Damage | TBD | If used | TBD |
| Attack Damage | TBD | Main threat value | TBD |
| Attack Startup | TBD | Must telegraph cleanly | TBD |
| Attack Recovery | TBD | Creates punish window | TBD |
| Movement Speed | TBD | Slow approach with threat | TBD |

---

## 7. Enemy Stats — Granny Ranged

| Parameter | Initial Test Value | Notes | Last Updated |
|---|---:|---|---|
| Health | TBD | Similar or slightly lower than melee granny | TBD |
| Projectile Damage | TBD | Threat via spacing | TBD |
| Projectile Speed | TBD | Readable but meaningful | TBD |
| Throw Startup | TBD | Telegraph window | TBD |
| Throw Recovery | TBD | Punish opportunity | TBD |
| Preferred Range | TBD | Helps AI behavior | TBD |

---

## 8. Boss Stats — Laser T-Rex

| Parameter | Initial Test Value | Notes | Last Updated |
|---|---:|---|---|
| Boss Health | TBD | One-phase miniboss target | TBD |
| Laser Damage | TBD | Major attack threat | TBD |
| Stomp/Shockwave Damage | TBD | Jump timing test | TBD |
| Charge/Bite Damage | TBD | Close-range punishable threat | TBD |
| Laser Telegraph Duration | TBD | Must be fair | TBD |
| Recovery Window Duration | TBD | Enables punish play | TBD |

---

## 9. Economy / Encounter Tuning

| Parameter | Initial Test Value | Notes | Last Updated |
|---|---:|---|---|
| Average Ammo Pickups per Level | TBD | Supports “medium” scarcity | TBD |
| Average Catfood Pickups per Level | TBD | Supports learning/recovery | TBD |
| Average Catnip Pickups per Level | TBD | Should feel important, not constant | TBD |
| Checkpoint Count | 1–2 | Current design target | TBD |
| Enemy Density | TBD | Avoid crowd spam | TBD |

---

## 10. Playtest Notes Template

### Playtest Date
TBD

### Build Version
TBD

### Observations
- Movement:
- Jump feel:
- Dash feel:
- Ammo economy:
- Frenzy usefulness:
- Super usefulness:
- Enemy readability:
- Boss fairness:

### Changes to Try Next
- 
- 
- 

---

## 11. Suggested First Measurements to Lock Down
1. run speed
2. gravity
3. jump velocity
4. dash speed/duration
5. claw startup/recovery
6. shuriken speed
7. frenzy duration
8. super charge time
9. granny attack telegraphs
10. boss laser telegraph duration

These should be tuned through repeated short playtests in a graybox environment.
