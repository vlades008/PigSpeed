# Install PigSpeedCalc.apk on Android

File: `PigSpeedCalc.apk` (in the `pig-speed-calc` folder). Android 7.0 or newer.

1. Copy `PigSpeedCalc.apk` to the phone (USB cable, Google Drive, Telegram, e-mail).
2. On the phone open it from Files or Downloads.
3. If Android says it can't install apps from this source, tap Settings and turn on "Allow from this source" for the app you opened the file with (Files, Chrome, Telegram...), then go back and tap Install.
4. If Play Protect warns that the app is unrecognised, tap "More details" then "Install anyway". The app is signed with a private key, not a Google Play key, so this warning is expected.
5. Open "Pig Speed" from the app drawer.

Notes
- It works offline. Saved sections and settings are stored on the phone and are not shared with the PC.
- To update: build a new APK and install it over the old one (same signing key, data is kept). The key is `C:\Users\vlade\AndroidBuild\pigspeed.keystore`: keep a backup, a new key means uninstalling first and losing saved sections.
- Rebuild after editing `index.html`: `powershell -File apk\build-apk.ps1` (JDK and SDK are in `C:\Users\vlade\AndroidBuild`).
