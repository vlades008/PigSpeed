// Builds the installable Android/PWA package in ../android from ../index.html.
// Usage: node launcher/make-pwa.js   (icons come from make-icon.ps1)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'android');
fs.mkdirSync(out, { recursive: true });

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace('</title>',
  '</title>\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="PigSpeed">\n<meta name="apple-mobile-web-app-status-bar-style" content="default">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#17304f">\n<link rel="apple-touch-icon" href="icon-192.png">');
html = html.replace('</body>',
  '<script>if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(function(){});</script>\n</body>');
fs.writeFileSync(path.join(out, 'index.html'), html);

fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'Pig Speed Calculator',
  short_name: 'PigSpeed',
  description: 'Pig speed, trip time and flow for a target speed',
  start_url: './index.html',
  scope: './',
  display: 'standalone',
  orientation: 'any',
  background_color: '#17304f',
  theme_color: '#17304f',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
  ]
}, null, 2));

const stamp = Date.now();
fs.writeFileSync(path.join(out, 'sw.js'),
`const CACHE = 'pigspeed-${stamp}';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request)));
});
`);
console.log('android package written to', out);
