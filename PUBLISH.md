# Publishing and updates

The app is published as a static site from the `docs/` folder (GitHub Pages). Everyone with the app sees a banner
"New version X, notes / Update" (browser or phone install) or "Download" (exe, APK) when you publish a new version.

## One-time setup
1. Create an empty public repository on github.com, for example `pig-speed-calc`.
2. In this folder:
   ```
   git remote add origin https://github.com/<you>/pig-speed-calc.git
   git branch -M main
   git push -u origin main
   ```
3. GitHub: Settings > Pages > Source "Deploy from a branch", branch `main`, folder `/docs`. The site address appears there,
   usually `https://<you>.github.io/pig-speed-calc/`.
4. Put that address in `tools/config.json` (`"siteUrl"`), then publish once (below). Builds made before this step do not check for updates.
5. Send people the site address. Phones: open it, "Install app". Windows and Android: the exe and APK are at
   `<site>/downloads/PigSpeedCalc.exe` and `.apk`.

## Every update
```
npm run release -- --bump --notes="what is new in a few words"
git add -A
git commit -m "Release"
git push
```
`--bump` raises the patch number (`--bump=minor` or `--bump=major` for bigger steps). The release writes `docs/` (web app,
`version.json`, exe and APK downloads). A minute after the push the site is live and every installed copy shows the banner
within an hour, or when the app is opened again.

## Notes
- Installed copies compare their own version with `<site>/version.json`; "Later" hides that version on that device.
- Run data is stored per device. Syncing a run between an engineer and a project manager needs a cloud database (planned).
