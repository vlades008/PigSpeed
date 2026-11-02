# Pig Speed Calculator

Planner and tracker for in-line inspection runs (Interscan tools: Geometry EGT, MFL, TFI). One pipeline section per run, from launcher barrel to receiver barrel. UI language: Russian by default (EN switch). Owner: Vlad.

## Source layout (edit `src/`, never `index.html`)
- `src/index.template.html`: page markup. Contains `{{STYLE}}`, `{{CORE}}`, `{{APP}}`, `{{VLAD}}` placeholders.
- `src/style.css`: all CSS.
- `src/cloud.js`: team cloud adapter (Firebase Auth + Firestore, loaded from CDN; `?mock=uid:Name:role` test mode). Config in `tools/config.json` (siteUrl, teamId, firebase). Rules in `firestore.rules`, setup in `FIREBASE.md`, publishing in `PUBLISH.md`.
- `src/core.js`: physics (`PSC.calc`, correlations, time <-> position profile).
- `src/app.js`: UI, diagram drawing, valves, run tracking, menus (one IIFE, ~650 lines).
- `src/vlad.png`: the "Vlad" tool picture (embedded as base64 by the build).
- `index.html`: GENERATED single file, committed so the app opens by double-click. Never edit it by hand; the next build overwrites it.

## Commands (all from this folder)
- `npm run dev`: preview at http://localhost:8790, rebuilds on every save in `src/` and reloads the page. In the app use `preview_start` with name "pigspeed" (`.claude/launch.json`).
- `npm test`: overview status rules (`tools/overview-test.js`).
- `npm run build`: only `index.html` (about a second). Fails without touching `index.html` if an inline script has a syntax error.
- `npm run release`: build + `PigSpeedCalc.exe` + `android/` web package + `PigSpeedCalc.apk` (about 10 s). `npm run release:fast` skips the APK.

## Roles
Role and run state pick the menu (`DECISIONS.md`). Manager and admin start in the read-only Overview (`body.ov`, section "manager overview" in `app.js`); everyone else gets the classic screen, which turns into Recording mode (`body.rec`, section "recording mode" in `app.js`) while their own run is live. A run ends only through the arrival dialog. Test with `?mock=uid:Name:role`. In a hidden preview pane animation frames do not run: replace `requestAnimationFrame` with a timer in the test.

## Other files
- `PigSpeedCalc.exe`: Windows launcher that embeds `index.html` and opens it in an Edge/Chrome app window (`launcher/PigSpeedCalc.cs`, icon `launcher/PigSpeedCalc.ico`, `launcher/make-icon.ps1`).
- `PigSpeedCalc.apk`: Android WebView wrapper (`apk/`), signed with `C:\Users\vlade\AndroidBuild\pigspeed.keystore` (keep it, a new key means uninstalling first). JDK and Android SDK live in `C:\Users\vlade\AndroidBuild`, not in the repo.
- `android/`: generated installable web app (PWA); only `INSTALL-ANDROID.md` is hand-written. `apk/INSTALL-APK.md`: phone install steps.
- `NOTES.md`: formulas, sources, limits.
- `.gitignore` keeps binaries and generated `android/` out of git; `index.before-redesign.html` and `style-previews/` are old local copies, safe to delete.

## Working rules
- Many small edits: apply them together, run `npm run build` once, check in the preview, and run `npm run release` only when the owner asks for a release (or after a batch of changes is finished).
- Small edits to `src/` files with Edit (unique short strings). Big scripted patches: write the Node script with the Write tool (shell heredocs eat backslashes).
- Commit in git after each finished change set so any edit can be compared or undone.
- Pig speed = flow at line conditions / inner area. Physics changes must be checked in Node (see `NOTES.md`) and keep valve times consistent with the pig animation (use `PSC.tAt` / `PSC.xAt` on `r.prof`; never multiply by the position fraction).
- Verify: `npm run build` passes, then the preview. Screenshots only for visual changes. Reports: short bullets, say what was not tested (exe/APK launch, print).

## Gotchas
- Python is not installed; use Node and PowerShell.
- Show the preview pane first, a hidden pane throttles animation.
- `localStorage` keys: `pigSpeedCalc.v2` (state), `.sections.v1`, `.history.v1`, `.run.v1` (a running pig survives reloads).
- The diagram style (Classic / Glass / Blueprint) is a string substitution on the generated SVG (`themed()` in `app.js`), so new fixed colours in `drawDiagram` need an entry in `SW1`/`SW2`.

- Restart `npm run dev` after changing `tools/build.js` (it is loaded once).
- `npm run release -- --bump=minor --notes="..."` also fills `docs/` (GitHub Pages); commit and push to publish.
