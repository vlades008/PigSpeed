// Test builds of the current code with sample data, safe to run beside the real apps.
//   node tools/test-build.js        test-build/index.html, PigSpeedCalc-TEST.exe, PigSpeedCalc-TEST.apk
//   node tools/test-build.js --html only the page
// They use the mock cloud, never Firebase, and keep their own data: the exe has its own folder and browser
// profile, the APK its own package name, so it installs beside "Pig Speed" and uninstalls on its own.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const build = require('./build');

const root = path.join(__dirname, '..');
const out = path.join(root, 'test-build');
const work = path.join(out, 'work');

function swap(text, a, b, what) {
  if (text.split(a).length !== 2) throw new Error('test build: ' + what + ' not found exactly once');
  return text.replace(a, () => b);
}
function run(label, cmd, args, cwd) {
  process.stdout.write(label + ' ... ');
  const r = spawnSync(cmd, args, { cwd: cwd || root, encoding: 'utf8' });
  if (r.status !== 0) { console.log('FAILED'); console.error((r.stdout || '') + (r.stderr || '')); process.exit(1); }
  console.log('ok');
}

// Runs in the page after the app has started: a strip to switch roles, and sample runs on the first start.
const DEMO = `<script>(function(){
  var SPEC='psc.demo.spec',SEEDED='psc.demo.seeded',ROLES={manager:'pm:Project Manager:manager',engineer:'eng:Engineer A:engineer'};
  var H=3.6e6,M=6e4;
  function role(){try{return (localStorage.getItem(SPEC)||ROLES.manager).split(':')[2]}catch(e){return 'manager'}}
  function account(r){var p=ROLES[r].split(':');return {uid:p[0],name:p[1],email:p[0]+'@mock.test',role:p[2]}}
  function useRun(r,runs){
    var a=runs.filter(function(x){return x.id==='a12'})[0],s=JSON.parse(localStorage.getItem('pigSpeedCalc.v2')||'{}');
    Object.keys(a.params).forEach(function(k){s[k]=a.params[k]});
    localStorage.setItem('pigSpeedCalc.v2',JSON.stringify(s));localStorage.setItem('pigSpeedCalc.cur.v1','a12');
    localStorage.setItem(SPEC,ROLES[r]);localStorage.setItem('pigSpeedCalc.acct.v1',JSON.stringify(account(r)));
    localStorage.removeItem('pigSpeedCalc.run.v1');
  }
  function seed(){
    var saved=JSON.parse(localStorage.getItem('pigSpeedCalc.runs.v1')||'[]').filter(function(r){return r.params})[0],h=window.__dg&&window.__dg.hours;
    if(!saved||!h)return;
    var now=Date.now(),T=h*H;
    function mk(id,name,who,x){
      var p=JSON.parse(JSON.stringify(saved.params));p.name=name;p.valves=['6','18','30'];p.vt=[1,1,1];p.vnames=['KP-1','KP-2','KP-3'];
      var uid=who==='Engineer A'?'eng':who.toLowerCase().replace(/ /g,'');
      return Object.assign({id:id,name:name,st:'planned',params:p,created:now-9*H,updated:now-H,team:true,owner:{uid:uid,name:who}},x);
    }
    function live(late,elapsed,obs){return {st:'running',launch:now-elapsed,hours:h,pb:1,dur:T+late,obs:obs||{}}}
    function done(ago,actual,auto){return {st:'done',launch:now-ago-actual,hours:h,pb:1,dur:actual,obs:{},finish:{at:now-ago,planned:T,actual:actual,auto:auto}}}
    var rows=[
      mk('a12','A-12','Engineer A',live(0,T*.3,{0:now-T*.3+T*6/42})),
      mk('g6','G-6','Engineer D',live(0,T+14*M)),
      mk('f1','F-1','Engineer E',done(2*H,T,true)),
      mk('d4','D-4','Engineer B',live(22*M,T*.5,{0:now-T*.5+(T+22*M)*6/42})),
      mk('e2','E-2','Engineer C',live(-3*M,T*.1)),
      mk('b3','B-3','Engineer A',{}),
      mk('c7','C-7','Engineer B',done(23*H,T+22*M,false))
    ];
    var store={runs:{},members:{}};rows.forEach(function(r){var c=JSON.parse(JSON.stringify(r));delete c.team;store.runs[r.id]=c});
    localStorage.setItem('psc.mock.v1',JSON.stringify(store));
    localStorage.setItem('pigSpeedCalc.runs.v1',JSON.stringify(rows));
    useRun(role(),rows);
    localStorage.setItem(SEEDED,'1');location.reload();
  }
  function strip(){
    var ru=/ru/i.test(document.documentElement.lang),r=role(),b=document.createElement('div');
    var who=ru?(r==='manager'?'руководитель проекта':'инженер'):(r==='manager'?'project manager':'engineer'),other=r==='manager'?'engineer':'manager';
    b.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:6px 12px;background:#17304f;color:#fff;font:13px/1.3 system-ui,sans-serif';
    b.innerHTML='<span style="flex:1 1 150px"><b>TEST</b> '+(ru?'с примерами, вид: ':'with sample data, viewing as ')+who+'</span>';
    function btn(t,fn){var x=document.createElement('button');x.type='button';x.textContent=t;x.style.cssText='min-height:40px;padding:0 12px;border:1px solid #8cbcff;border-radius:8px;background:transparent;color:#fff;font:inherit;cursor:pointer';x.onclick=fn;b.appendChild(x)}
    btn(ru?(other==='engineer'?'Вид инженера':'Вид руководителя'):(other==='engineer'?'Engineer view':'Manager view'),function(){useRun(other,JSON.parse(localStorage.getItem('pigSpeedCalc.runs.v1')));location.reload()});
    btn(ru?'Сбросить примеры':'Reset samples',function(){var l=/ru/i.test(document.documentElement.lang);localStorage.clear();localStorage.setItem('pigSpeedCalc.v2',JSON.stringify({lang:l?'ru':'en'}));location.reload()});
    document.body.insertBefore(b,document.body.firstChild);
  }
  try{if(!localStorage.getItem(SEEDED))seed();strip()}catch(e){console.error(e)}
})();</script>`;

const htmlOnly = process.argv.includes('--html');
build();
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = swap(html, 'var mock = /[?&]mock=([^&]+)/.exec(location.search);',
  "var mock = [0, encodeURIComponent((function () { try { return localStorage.getItem('psc.demo.spec'); } catch (e) { return ''; } })() || 'pm:Project Manager:manager')];", 'mock switch');
html = swap(html, '<h1>Pig Speed Calculator</h1>', '<h1>Pig Speed TEST</h1>', 'title');
html = swap(html, '</body>', DEMO + '\n</body>', 'end of page');
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('test-build/index.html ... ok');
if (htmlOnly) process.exit(0);

// Windows: own folder and profile, so the data of the real exe is never touched
fs.copyFileSync(path.join(out, 'index.html'), path.join(work, 'index.html'));
const cs = swap(fs.readFileSync(path.join(root, 'launcher', 'PigSpeedCalc.cs'), 'utf8'), '"PigSpeedCalc");', '"PigSpeedCalcTest");', 'launcher folder');
fs.writeFileSync(path.join(work, 'PigSpeedCalcTest.cs'), cs);
run('PigSpeedCalc-TEST.exe', 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
  ['/nologo', '/target:winexe', '/win32icon:' + path.join(root, 'launcher', 'PigSpeedCalc.ico'), '/out:' + path.join(out, 'PigSpeedCalc-TEST.exe'), '/resource:index.html,index.html', 'PigSpeedCalcTest.cs'], work);

// Android: opens the bundled page instead of the published site, under its own package and name
fs.cpSync(path.join(root, 'apk'), path.join(work, 'apk'), { recursive: true });
const java = path.join(work, 'apk', 'src', 'com', 'pigspeed', 'calc', 'MainActivity.java');
fs.writeFileSync(java, swap(fs.readFileSync(java, 'utf8'), 'else web.loadUrl(SITE);', 'else web.loadUrl("file:///android_asset/index.html");', 'site start'));
const man = path.join(work, 'apk', 'AndroidManifest.xml');
fs.writeFileSync(man, swap(fs.readFileSync(man, 'utf8'), 'android:label="Pig Speed"', 'android:label="Pig Speed TEST"', 'app label'));
const ps = path.join(work, 'apk', 'build-apk.ps1');
fs.writeFileSync(ps, swap(fs.readFileSync(ps, 'utf8'), '--min-sdk-version 24', '--rename-manifest-package com.pigspeed.calc.test --min-sdk-version 24', 'package name'));
run('PigSpeedCalc-TEST.apk', 'powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(work, 'apk', 'build-apk.ps1')]);
fs.renameSync(path.join(work, 'PigSpeedCalc.apk'), path.join(out, 'PigSpeedCalc-TEST.apk'));
fs.rmSync(work, { recursive: true, force: true });
for (const f of ['PigSpeedCalc-TEST.exe', 'PigSpeedCalc-TEST.apk']) console.log('  test-build/' + f + '  ' + Math.round(fs.statSync(path.join(out, f)).size / 1024) + ' KB');
