// Joins src/ into the single-file app: index.html
//   node tools/build.js          build index.html (about a second)
// Exits with an error, and leaves the old index.html untouched, if an inline script has a syntax error.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const read = (f) => fs.readFileSync(path.join(src, f), 'utf8');

function build() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  let site = '', fbc = null, teamId = 'main';
  try { const c = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'config.json'), 'utf8')); site = c.siteUrl || ''; fbc = c.firebase || null; teamId = c.teamId || 'main'; } catch (e) {}
  if (site && !site.endsWith('/')) site += '/';
  let notes = '';
  try { notes = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'notes.json'), 'utf8')).notes || ''; } catch (e) {}
  let hist = [];
  try { hist = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'changelog.json'), 'utf8')); } catch (e) {}
  const ver = 'var APP_HISTORY=' + JSON.stringify(hist) + ';var APP_NOTES=' + JSON.stringify(notes) + ';var APP_VERSION=' + JSON.stringify(pkg.version) + ',UPDATE_URL=' + JSON.stringify(site) + ',FIREBASE_CONFIG=' + JSON.stringify(fbc) + ',TEAM_ID=' + JSON.stringify(teamId) + ';';
  const vlad = ver + 'var VLAD_IMG="data:image/png;base64,' + fs.readFileSync(path.join(src, 'vlad.png')).toString('base64') + '";';
  const parts = { STYLE: read('style.css'), CLOUD: read('cloud.js'), CORE: read('core.js'), APP: read('app.js'), VLAD: vlad };
  let out = read('index.template.html');
  for (const k of Object.keys(parts)) {
    if (!out.includes('{{' + k + '}}')) throw new Error('placeholder {{' + k + '}} missing in index.template.html');
    out = out.replace('{{' + k + '}}', () => parts[k]);
  }
  const left = out.match(/\{\{[A-Z]+\}\}/);
  if (left) throw new Error('unreplaced placeholder ' + left[0]);

  // syntax check of every inline script before writing anything
  const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m, n = 0;
  while ((m = re.exec(out))) {
    n++;
    try { new Function(m[1]); } catch (e) { throw new Error('syntax error in inline script #' + n + ': ' + e.message); }
  }

  const target = path.join(root, 'index.html');
  const tmp = target + '.tmp';
  fs.writeFileSync(tmp, out);
  fs.renameSync(tmp, target);
  return { bytes: Buffer.byteLength(out), scripts: n };
}

if (require.main === module) {
  try {
    const r = build();
    console.log('built index.html (' + Math.round(r.bytes / 1024) + ' KB, ' + r.scripts + ' scripts checked)');
  } catch (e) {
    console.error('BUILD FAILED: ' + e.message);
    process.exit(1);
  }
}
module.exports = build;
