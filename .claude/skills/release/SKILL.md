---
name: release
description: Build and publish a PigSpeed release (exe, APK, android web package, docs/ for GitHub Pages). Use only when the owner asks for a release or to publish a new version.
---

# Release

1. `git status`: commit pending work first so the release diff is clean.
2. Pick the command (from this folder):
   - `npm run release:fast`: index.html, exe, `android/` (no APK); for checking.
   - `npm run release`: everything including `PigSpeedCalc.apk` (about 10 s).
   - `npm run release -- --bump --notes="short text"`: also raises the patch version and fills `docs/` (version.json, downloads). Use `--bump=minor` or `--bump=major` for bigger steps. `--notes` is shown in the in-app update banner (Russian is fine).
3. The APK needs the JDK, Android SDK and `pigspeed.keystore` in `C:\Users\vlade\AndroidBuild` (not in the repo). Never create a new key: a different key forces everyone to uninstall first. If these are missing (cloud session, Linux), run `release:fast` and say the APK and exe were not built.
4. `.exe`, `.apk` and `android/*` are git-ignored except `docs/downloads/*`. Commit `docs/`, `package.json`, `apk/AndroidManifest.xml`, `tools/notes.json`, `tools/changelog.json`.
5. Publishing = push to the Pages branch (see PUBLISH.md). Pushing is outward-facing: confirm with the owner first. Live about a minute after the push.
6. Report in short bullets and say what was not tested (exe/APK launch, print, install on a phone).
