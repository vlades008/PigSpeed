---
name: verify-physics
description: Check PigSpeed calculation changes (src/core.js) and keep valve times consistent with the pig animation. Use after any change to physics, correlations, the time/position profile, valves or run tracking.
---

# Verify physics changes

1. `node tools/check-physics.js`. It loads `src/core.js` in Node and checks, for gas, oil and oil + gas: result is finite, `prof` is monotonic 0..1, `xAt(tAt(x)) = x`, 50 % slip doubles the time, Z is plausible, outlet pressure changes speed in the right direction, speed = flow / area. Exit code 1 means a check failed.
2. If you changed a correlation, add a hand-calculated reference point to `tools/check-physics.js` (and a line to `NOTES.md` with the source). Do not move the expected value to match the new output without a source.
3. Rules from CLAUDE.md to keep in mind:
   - Pig speed = flow at line conditions / inner area.
   - Valve and passage times come from `PSC.tAt(r.prof, x)` and positions from `PSC.xAt(r.prof, t)`. Never multiply by the position fraction; speed is not uniform when an outlet pressure is set.
4. `npm run build`, then open the preview (`preview_start` "pigspeed") and compare the valve times with the animated pig for a case with outlet pressure. Screenshots only if the picture changed.
5. Report what was checked and what was not (exe/APK, print).
