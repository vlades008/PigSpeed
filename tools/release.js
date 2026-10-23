// Full release: index.html, PigSpeedCalc.exe, android/ web package and PigSpeedCalc.apk.
//   node tools/release.js            everything
//   node tools/release.js --no-apk   skip the (slow) APK
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const build = require('./build');

const root = path.join(__dirname, '..');
const noApk = process.argv.includes('--no-apk');
if (process.argv.some(x => x.startsWith('--notes='))) { const nn = process.argv.find(x => x.startsWith('--notes=')).slice(8); fs.writeFileSync(path.join(__dirname, 'notes.json'), JSON.stringify({ notes: nn }, null, 2) + '\n'); }
const arg = (n) => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : null; };
const bump = process.argv.includes('--bump') ? 'patch' : arg('bump');
const notes = arg('notes') || '';
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (bump) {
  const v = pkg.version.split('.').map(Number);
  if (bump === 'major') { v[0]++; v[1] = 0; v[2] = 0; } else if (bump === 'minor') { v[1]++; v[2] = 0; } else v[2]++;
  pkg.version = v.join('.');
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  const mp = path.join(root, 'apk', 'AndroidManifest.xml');
  fs.writeFileSync(mp, fs.readFileSync(mp, 'utf8').replace(/android:versionCode="\d+"/, 'android:versionCode="' + (v[0] * 10000 + v[1] * 100 + v[2]) + '"').replace(/android:versionName="[^"]*"/, 'android:versionName="' + pkg.version + '"'));
  console.log('version ' + pkg.version);
}
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

// publish folder for GitHub Pages (Settings > Pages > main / docs)
const docs = path.join(root, 'docs');
fs.mkdirSync(path.join(docs, 'downloads'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'android'))) if (!f.endsWith('.md')) fs.copyFileSync(path.join(root, 'android', f), path.join(docs, f));
fs.writeFileSync(path.join(docs, '.nojekyll'), '');
fs.copyFileSync(path.join(__dirname, 'get.html'), path.join(docs, 'get.html'));
for (const f of ['PigSpeedCalc.exe', 'PigSpeedCalc.apk']) if (fs.existsSync(path.join(root, f))) fs.copyFileSync(path.join(root, f), path.join(docs, 'downloads', f));
const prev = (() => { try { return JSON.parse(fs.readFileSync(path.join(docs, 'version.json'), 'utf8')); } catch (e) { return {}; } })();
const clPath = path.join(__dirname, 'changelog.json');
const cl = (() => { try { return JSON.parse(fs.readFileSync(clPath, 'utf8')); } catch (e) { return []; } })();
const curNotes = notes || (prev.version === pkg.version ? prev.notes : '') || '';
const ex = cl.find(e => e.version === pkg.version), today = new Date().toISOString().slice(0, 10);
if (ex) { if (curNotes) ex.notes = curNotes; } else cl.unshift({ version: pkg.version, date: today, notes: curNotes });
fs.writeFileSync(clPath, JSON.stringify(cl, null, 1) + '\n');
fs.writeFileSync(path.join(docs, 'version.json'), JSON.stringify({ version: pkg.version, notes: curNotes, history: cl, date: today, apk: 'downloads/PigSpeedCalc.apk', exe: 'downloads/PigSpeedCalc.exe' }, null, 2) + '\n');
console.log('docs/ ... ok (v' + pkg.version + ')');

for (const f of ['index.html', 'PigSpeedCalc.exe', 'PigSpeedCalc.apk']) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) console.log('  ' + f.padEnd(18) + String(Math.round(fs.statSync(p).size / 1024)).padStart(6) + ' KB  ' + fs.statSync(p).mtime.toLocaleTimeString());
}
console.log('done in ' + Math.round((Date.now() - t0) / 1000) + ' s');
