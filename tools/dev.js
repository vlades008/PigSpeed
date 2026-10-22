// Live preview: builds on every change in src/ and reloads the open page.
//   node tools/dev.js        http://localhost:8790  (PORT=... to change)
const http = require('http');
const fs = require('fs');
const path = require('path');
const build = require('./build');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const port = +process.env.PORT || 8790;
const types = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const clients = new Set();
let lastError = '';

const client = `<script>(function(){var banner;function show(t){if(!banner){banner=document.createElement('div');banner.style.cssText='position:fixed;left:0;right:0;top:0;z-index:99999;background:#c62828;color:#fff;padding:8px 14px;font:13px monospace';document.body.appendChild(banner)}banner.textContent=t||'';banner.style.display=t?'block':'none'}
var es=new EventSource('/__reload');es.onmessage=function(e){if(e.data==='reload')location.reload();else show(e.data.replace(/^error: /,'BUILD FAILED: '))};})();</script>`;

function rebuild() {
  try {
    const r = build();
    lastError = '';
    console.log(new Date().toLocaleTimeString() + '  built (' + Math.round(r.bytes / 1024) + ' KB)');
    clients.forEach((res) => res.write('data: reload\n\n'));
  } catch (e) {
    lastError = e.message;
    console.error(new Date().toLocaleTimeString() + '  BUILD FAILED: ' + e.message);
    clients.forEach((res) => res.write('data: error: ' + e.message.replace(/\n/g, ' ') + '\n\n'));
  }
}

let timer = null;
fs.watch(src, { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 150); });
rebuild();

http.createServer((q, s) => {
  let f = decodeURIComponent(q.url.split('?')[0]);
  if (f === '/__reload') {
    s.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
    s.write(lastError ? 'data: error: ' + lastError + '\n\n' : ': ok\n\n');
    clients.add(s);
    q.on('close', () => clients.delete(s));
    return;
  }
  if (f === '/') f = '/index.html';
  const p = path.join(root, f);
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.statusCode = 404; return s.end('not found'); }
  s.setHeader('content-type', types[path.extname(p)] || 'application/octet-stream');
  s.setHeader('cache-control', 'no-store');
  let body = fs.readFileSync(p);
  if (f === '/index.html') body = Buffer.from(body.toString('utf8').replace('</body>', () => client + '</body>'));
  s.end(body);
}).listen(port, () => console.log('preview: http://localhost:' + port + '  (watching src/)'));
