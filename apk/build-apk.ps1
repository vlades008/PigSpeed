# Builds PigSpeedCalc.apk without Gradle. Needs the JDK and Android SDK in C:\Users\vlade\AndroidBuild.
$ErrorActionPreference = 'Stop'
$here  = $PSScriptRoot
$root  = Split-Path $here -Parent
$tools = 'C:\Users\vlade\AndroidBuild'
$jdk   = (Get-ChildItem "$tools\jdk" -Directory | Select-Object -First 1).FullName
$sdk   = "$tools\sdk"
$bt    = (Get-ChildItem "$sdk\build-tools" -Directory | Sort-Object Name | Select-Object -Last 1).FullName
$jar   = (Get-ChildItem "$sdk\platforms" -Directory | Sort-Object Name | Select-Object -Last 1).FullName + '\android.jar'
$env:JAVA_HOME = $jdk
$work  = Join-Path $tools 'work'
Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$work\compiled","$work\classes","$work\assets" | Out-Null
Copy-Item "$root\index.html" "$work\assets\index.html"

& "$bt\aapt2.exe" compile --dir "$here\res" -o "$work\compiled"
$flat = Get-ChildItem "$work\compiled\*.flat" | ForEach-Object { $_.FullName }
& "$bt\aapt2.exe" link -o "$work\base.apk" -I $jar --manifest "$here\AndroidManifest.xml" -A "$work\assets" --min-sdk-version 24 --target-sdk-version 34 $flat

& "$jdk\bin\javac.exe" -source 8 -target 8 -classpath $jar -d "$work\classes" (Get-ChildItem "$here\src" -Recurse -Filter *.java | ForEach-Object { $_.FullName })
$cls = Get-ChildItem "$work\classes" -Recurse -Filter *.class | ForEach-Object { $_.FullName }
& "$bt\d8.bat" --min-api 24 --lib $jar --output $work $cls

Push-Location $work
& "$jdk\bin\jar.exe" uf base.apk classes.dex
Pop-Location

& "$bt\zipalign.exe" -f -p 4 "$work\base.apk" "$work\aligned.apk"
$ks = "$tools\pigspeed.keystore"
if (-not (Test-Path $ks)) {
  & "$jdk\bin\keytool.exe" -genkeypair -keystore $ks -alias pigspeed -storepass pigspeed123 -keypass pigspeed123 -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=PigSpeed"
}
& "$bt\apksigner.bat" sign --ks $ks --ks-key-alias pigspeed --ks-pass pass:pigspeed123 --key-pass pass:pigspeed123 --out "$root\PigSpeedCalc.apk" "$work\aligned.apk"
Get-Item "$root\PigSpeedCalc.apk" | Select-Object Name, Length
