// PostToolUse (Edit|Write): after a change under src/ or tools/build.js, rebuild index.html.
// A syntax error in an inline script is reported back (exit 2); build.js leaves index.html untouched in that case.
const fs = require('fs');
const { spawnSync } = require('child_process');
let d = {};
try { d = JSON.parse(fs.readFileSync(0, 'utf8')); } catch (e) { process.exit(0); }
const p = ((d.tool_input && d.tool_input.file_path) || '').replace(/\\/g, '/');
if (!/\/(src\/[^/]+|tools\/build\.js)$/.test(p)) process.exit(0);
const r = spawnSync('npm', ['run', 'build', '--silent'], { cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(), encoding: 'utf8', shell: process.platform === 'win32' });
if (r.status !== 0) {
  console.error('npm run build failed after editing ' + p + ':\n' + (r.stdout || '') + (r.stderr || ''));
  process.exit(2);
}
