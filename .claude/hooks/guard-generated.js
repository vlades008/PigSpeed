// PreToolUse (Edit|Write): block hand edits to generated files; they are overwritten by the next build.
const fs = require('fs');
let d = {};
try { d = JSON.parse(fs.readFileSync(0, 'utf8')); } catch (e) { process.exit(0); }
const p = ((d.tool_input && d.tool_input.file_path) || '').replace(/\\/g, '/');
const generated = /\/(index\.html|android\/(?!INSTALL-ANDROID\.md)[^/]+.*|docs\/(?!.*\.md$).+)$/;
if (generated.test(p) && !/\/src\//.test(p)) {
  console.error('Blocked: ' + p + ' is generated. Edit src/ and run `npm run build` (see CLAUDE.md).');
  process.exit(2);
}
