// Full release: index.html, PigSpeedCalc.exe, android/ web package and PigSpeedCalc.apk.
//   node tools/release.js            everything
//   node tools/release.js --no-apk   skip the (slow) APK
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const build = require('./build');

const root = path.join(__dirname, '..');
const noApk = process.argv.includes('--no-apk');
const t0 = Date.now();

function run(label, cmd, args) {
  process.stdout.write(label + ' ... ');
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) {
    console.log('FAILED');
    console.error((r.stdout || '') + (r.stderr || ''));
    process.exit(1);
  }
  console.log('ok');
}

try { const b = build(); console.log('index.html ... ok (' + Math.round(b.bytes / 1024) + ' KB)'); }
catch (e) { console.error('BUILD FAILED: ' + e.message); process.exit(1); }

run('PigSpeedCalc.exe', 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
  ['/nologo', '/target:winexe', '/win32icon:launcher\\PigSpeedCalc.ico', '/out:PigSpeedCalc.exe', '/resource:index.html,index.html', 'launcher\\PigSpeedCalc.cs']);
run('android/ web package', process.execPath, ['launcher/make-pwa.js']);
if (!noApk) run('PigSpeedCalc.apk', 'powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'apk\\build-apk.ps1']);

for (const f of ['index.html', 'PigSpeedCalc.exe', 'PigSpeedCalc.apk']) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) console.log('  ' + f.padEnd(18) + String(Math.round(fs.statSync(p).size / 1024)).padStart(6) + ' KB  ' + fs.statSync(p).mtime.toLocaleTimeString());
}
console.log('done in ' + Math.round((Date.now() - t0) / 1000) + ' s');
