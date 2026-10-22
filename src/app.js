
(function(){
  var $=function(id){return document.getElementById(id)};
  var GAS_U=['Km³/day','Km³/h'];
  var OIL_U=['m³/day','BBL/day','m³/h','BBL/h'];
  var OD_MM={6:168,8:219,10:273,12:325,14:377,16:426,18:457.2,20:530,22:558.8,24:630,26:660.4,28:720,30:762,32:820,34:863.6,36:914.4,38:965.2,40:1020,42:1067,44:1117.6,46:1168.4,48:1220,56:1422.4};
  var OD_LIST=[[4,114],[6,159]].concat(Object.keys(OD_MM).map(function(k){return [+k,OD_MM[k]]}));
  var DEF={fluid:0,name:'Pipeline Name',od:'1020',wt:'12',wtu:0,len:'42',lenu:0,p:'35',pu:3,t:'40',tu:0,gor:'500',
           sg:'0.65',api:'35',flow:'4000',gasu:0,oilu:2,rv:'2',rvu:0,velu:0,pout:'',slip:'100',atm:false,std:0,alert:false,lead:5,dstyle:1,dstyleTouched:false,view:1,pb:1,tscale:(window.innerWidth<520?150:100),valves:[],vnames:[],vt:[],flowTouched:false,vtype:0,tool:1,toolOn:false,lang:'ru',rgasu:0,roilu:0};
  var FD={0:{flow:'4000',gasu:0},1:{flow:'2800',oilu:2},2:{flow:'1200',oilu:2}};
  function flowDefault(f){var d=FD[f];S.flow=d.flow;if(d.gasu!==undefined)S.gasu=d.gasu;if(d.oilu!==undefined)S.oilu=d.oilu}
  var KEY='pigSpeedCalc.v2', S={};
  function fill(sel,arr){sel.innerHTML='';arr.forEach(function(t,i){var o=document.createElement('option');o.value=i;o.textContent=t;sel.appendChild(o)})}
  fill($('gasu'),GAS_U);fill($('oilu'),OIL_U);fill($('rgasu'),GAS_U);fill($('roilu'),OIL_U);
  function odText(mm){var inch=mm/25.4;OD_LIST.forEach(function(e){if(e[1]===mm)inch=e[0]});return +mm.toFixed(1)+' '+tr('mm')+' ('+(+inch.toFixed(2))+'")'}
  function ensureOd(){var sel=$('od'),v=S.od;sel.innerHTML='';var have=false,list=OD_LIST.map(function(e){return e[1]});
    var cur=parseFloat(String(v).replace(',','.'));if(isFinite(cur)&&cur>0&&list.every(function(x){return Math.abs(x-cur)>1e-6})){list.push(cur);list.sort(function(a,b){return a-b})}
    list.forEach(function(mm){var o=document.createElement('option');o.value=String(mm);o.textContent=odText(mm);sel.appendChild(o)});
    sel.value=String(cur)}

  [].forEach.call(document.querySelectorAll('select'),function(s){[].forEach.call(s.options,function(o,i){if(!o.hasAttribute('value'))o.value=i})});
  var IDS=['name','od','wt','wtu','len','lenu','p','pu','pout','slip','std','dstyle','t','tu','sg','api','gor','flow','gasu','oilu','rv','rvu','velu','rgasu','roilu'];
  var NUMERIC={std:1,dstyle:1,wtu:1,lenu:1,pu:1,tu:1,gasu:1,oilu:1,rvu:1,velu:1,rgasu:1,roilu:1};
  function load(){
    S={};for(var k in DEF)S[k]=DEF[k];
    try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)for(var k2 in DEF)if(k2 in s)S[k2]=s[k2]}catch(e){}
    if(+S.lenu>1)S.lenu=0;
    if(+S.gasu>1)S.gasu=(+S.gasu>=3?1:0);if(+S.rgasu>1)S.rgasu=(+S.rgasu>=3?1:0);
    S.valves=Array.isArray(S.valves)?S.valves.slice():[];S.vt=Array.isArray(S.vt)?S.vt.slice():[];while(S.vt.length<S.valves.length)S.vt.push(1);
    S.vnames=Array.isArray(S.vnames)?S.vnames.slice():[];while(S.vnames.length<S.valves.length)S.vnames.push('');
    try{var s0=JSON.parse(localStorage.getItem(KEY)||'null');if(s0&&!('flowTouched' in s0))S.flowTouched=(String(S.flow)!=='250000'&&String(S.flow)!=='4000')}catch(e){}
    if(!S.flowTouched)flowDefault(S.fluid);
    if(!S.dstyleTouched)S.dstyle=1;
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
  var VT=['Ball valve','Gate valve','Check valve'];
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function vName(i){return String(S.vnames[i]||'').trim()||(tr('Valve')+' '+(i+1))}
  function sortValves(){
    var idx=S.valves.map(function(_,i){return i}),val=function(i){var x=parseFloat(String(S.valves[i]).replace(',','.'));return isNaN(x)?1e18:x};
    idx.sort(function(a,b){return val(a)-val(b)||a-b});
    if(idx.every(function(v,k){return v===k}))return;
    S.valves=idx.map(function(i){return S.valves[i]});S.vt=idx.map(function(i){return S.vt[i]});S.vnames=idx.map(function(i){return S.vnames[i]||''});
    if(window.__run)window.__run.obs={};
    save();renderValves();update();
  }
  function renderValves(){
    var box=$('vlist');box.innerHTML='';
    S.valves.forEach(function(p,i){
      var d=document.createElement('tr');
      d.innerHTML='<td class="vbd"><span class="vb"></span></td><td><input class="vname" autocomplete="off"></td><td><input inputmode="decimal" autocomplete="off"><span class="vu"></span></td><td><b class="veta">–</b></td><td class="varr">–</td><td class="vrem">–</td><td><button type="button" class="vlog">✓</button></td><td><button type="button" class="x" aria-label="Remove">×</button></td>';
      d.querySelector('.vb').textContent=i+1;
      var nm=d.querySelector('.vname');nm.value=S.vnames[i]||'';nm.placeholder=tr('Valve')+' '+(i+1);
      nm.addEventListener('input',function(){var v=this.value;keepRun(function(){S.vnames[i]=v;save();update()})});
      var lg=d.querySelector('.vlog');lg.title=tr('Enter the real time the pig passed this valve. The actual speed and all remaining times are recalculated.');
      lg.addEventListener('click',function(){openLog(i)});
      d.querySelector('.vu').textContent=tr(['km','m'][+S.lenu]);
      var inp=d.querySelector('input:not(.vname)');inp.value=p;
      inp.addEventListener('input',function(){var v=this.value;keepRun(function(){S.valves[i]=v;save();update()})});
      inp.addEventListener('change',function(){keepRun(sortValves)});
      d.querySelector('.x').addEventListener('click',function(){keepRun(function(){S.valves.splice(i,1);S.vt.splice(i,1);S.vnames.splice(i,1);if(window.__run)window.__run.obs={};save();renderValves();update()})});
      box.appendChild(d);
    });
    $('vempty').style.display=S.valves.length?'none':'block';
    document.querySelector('.vt').style.display=S.valves.length?'table':'none';
  }
  function toolIdx(){return S.toolOn?+S.tool:1}
  function toUI(){
    ensureOd();
    $('fmode').addEventListener('click',function(e){var bt=e.target.closest('button');if(!bt)return;S.fmode=+bt.dataset.m;save();var fb=$('fmlBody');fb.classList.remove('swap');void fb.offsetWidth;fb.classList.add('swap');update()});
  $('fmlBody').addEventListener('click',function(e){var u=e.target.closest('.nv');if(!u)return;var fe=document.querySelector('.field[data-f="'+u.dataset.nf+'"]');if(!fe)return;fe.scrollIntoView({block:'center',behavior:'smooth'});fe.classList.remove('flash');void fe.offsetWidth;fe.classList.add('flash')});
  IDS.forEach(function(id){if(id!=='od')$(id).value=S[id]});
    setFluid(S.fluid,true);setView(S.view,true);renderValves();$('pbSel').value=S.pb;$('atm').checked=!!S.atm;$('alert').checked=!!S.alert;$('leadSel').value=S.lead;$('tscale').value=S.tscale;$('tscaleV').textContent=S.tscale+'%';$('toolSel').value=S.toolOn?S.tool:-1;
  }
  function setView(v,quiet){S.view=+v;$('viewSw').setAttribute('aria-checked',String(S.view===1));[].forEach.call($('viewSeg').querySelectorAll('.vl'),function(l){l.classList.toggle('on',+l.dataset.v===S.view)});if(!quiet){save();var run=snapRun();update();if(run)resumeAnim(run)}}
  function setFluid(f,quiet){
    S.fluid=f;
    if(!quiet&&!S.flowTouched){flowDefault(f);$('flow').value=S.flow;$('gasu').value=S.gasu;$('oilu').value=S.oilu}
    [].forEach.call($('fluid').children,function(b){b.setAttribute('aria-pressed',String(+b.dataset.v===f))});
    $('poutF').classList.toggle('hide',f===1);
    $('sgF').classList.toggle('hide',f===1);
    $('apiF').classList.toggle('hide',f===0);
    $('gF').classList.toggle('hide',f!==2);
    $('gasu').classList.toggle('hide',f!==0);$('rgasu').classList.toggle('hide',f!==0);
    $('oilu').classList.toggle('hide',f===0);$('roilu').classList.toggle('hide',f===0);
    $('flowL').textContent=tr(f===0?'Gas flow rate':f===1?'Oil flow rate':'Oil flow rate (gas follows from GOR)');
    if(!quiet){save();update()}
  }
  function num(id){var s=String(S[id]).trim().replace(',','.');if(s===''||!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s))return NaN;return parseFloat(s)}
  function setErr(f,m){var el=document.querySelector('[data-f="'+f+'"]');if(!el)return;el.classList.toggle('err',!!m);el.querySelector('.msg').textContent=m||''}
  function wtmm(){var w=num('wt');return +S.wtu?w*25.4:w}
  function fmt(x,n){return isFinite(x)?x.toLocaleString(S.lang==='ru'?'ru-RU':'en-US',{minimumFractionDigits:n,maximumFractionDigits:n}):'–'}

  var dgDim='',anim=null;
  var SW1=[['#8b95a3','#a7b9cf'],['#5d6674','#7088a3'],['stop-color="#000" stop-opacity=".28"','stop-color="#1d3f6b" stop-opacity=".25"'],['stop-color="#fff" stop-opacity=".35"','stop-color="#fff" stop-opacity=".62"'],['stop-color="#000" stop-opacity=".4"','stop-color="#10305a" stop-opacity=".35"'],['fill="#8ec5ff"','fill="#78c0ff"'],['fill="#c98a2b"','fill="#e6a640"']];
  var SW2=[['#8b95a3','#0d3556'],['#5d6674','#3ad6ff'],['#4a5562','#3ad6ff'],['#27303b','#7fe8ff'],['stop-color="#000" stop-opacity=".28"','stop-color="#000" stop-opacity="0"'],['stop-color="#fff" stop-opacity=".35"','stop-color="#fff" stop-opacity="0"'],['stop-color="#000" stop-opacity=".4"','stop-color="#000" stop-opacity="0"'],['fill="#8ec5ff"','fill="#14b3ea" fill-opacity=".5"'],['fill="#c98a2b"','fill="#ff9d2e" fill-opacity=".5"'],['#e3e8ee','#14537c'],['#9aa5b4','#0c3a5a'],['#5f6a79','#072a45'],['#6b7686','#12486b'],['#3a424e','#2a9fcf']];
  function themed(s,ds){(ds===1?SW1:SW2).forEach(function(p){s=s.split(p[0]).join(p[1])});return s}
  function themeBg(ds,DW,DH,pa,pb,cy,HB,gl){
    if(ds===1)return '<defs><linearGradient id="bgG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7fbff"/><stop offset="1" stop-color="#d3e4f5"/></linearGradient></defs><rect x="0" y="0" width="'+DW+'" height="'+DH+'" fill="url(#bgG)"/>'+(gl?'':'<rect x="0" y="'+(cy+HB/2+44)+'" width="'+DW+'" height="9" fill="#b6cbe1"/><ellipse cx="'+(pa+pb)/2+'" cy="'+(cy+HB/2+46)+'" rx="'+((pb-pa)/2)+'" ry="8" fill="#1d3f6b" fill-opacity=".16"/>');
    return '<defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#14405f" stroke-width="1"/></pattern></defs><rect x="0" y="0" width="'+DW+'" height="'+DH+'" fill="#071524"/><rect x="0" y="0" width="'+DW+'" height="'+DH+'" fill="url(#grid)"/>';
  }
  // Interscan catalogue: limits are the same for every tool; barrel diameter C and tool length differ by outer diameter.
  var CAT={lim:{vmin:0.2,vmax:4,hours:72,km:100,tmin:-20,tmax:80,pmin:5,pmax:100,pgas:20,minId:{egt:0.75,mfl:0.85}},
    barrel:{159:219,168:219,219:273,273:325,325:377,426:457.2,530:558.8,609:660.4,720:762,820:862},
    lenEgt:{159:1281,168:1281,219:1077,273:1106,325:1427,426:1535,530:1235,720:1235,820:1235},
    lenMfl:{168:2139,219:2326,273:2042,325:2042,426:2458,530:1232,609:1245,720:1384,820:1384}};
  function catKey(map,od){var best=null,bd=1e9;for(var k in map){var d=Math.abs(+k-od);if(d<bd){bd=d;best=k}}return bd<=Math.max(2,od*0.01)?map[best]:null}
  function toolKind(){var t=toolIdx();return t===0?'egt':'mfl'}
  function toolLenM(od){var m=toolKind()==='egt'?CAT.lenEgt:CAT.lenMfl;var v=catKey(m,od);return v?v/1000:1.5}
  function barrelRatio(od){var c=catKey(CAT.barrel,od);return c&&od>0?Math.max(1.08,Math.min(1.5,c/od)):1.25}
  function setStartLabel(){if($('arrBtn'))$('arrBtn').style.display=anim?'inline-block':'none';$('dg').classList.toggle('run',!!anim);if(!anim&&$('runWarn'))$('runWarn').style.display='none';$('startL').textContent=tr(anim?'Stop':'Start');[].forEach.call($('fluid').children,function(b){b.disabled=!!anim})}
  var RKEY='pigSpeedCalc.run.v1', pendingRun=null, lastClk=0;
  try{pendingRun=JSON.parse(localStorage.getItem(RKEY)||'null')}catch(e){}
  function pad2(n){return (n<10?'0':'')+n}
  function fmtClock(ms){
    var d=new Date(ms),t=pad2(d.getHours())+':'+pad2(d.getMinutes())+':'+pad2(d.getSeconds());
    var a=new Date();a.setHours(0,0,0,0);var b=new Date(ms);b.setHours(0,0,0,0);
    var dd=Math.round((b-a)/864e5);return dd>0?t+' (+'+dd+' '+tr('d')+')':t;
  }
  function fmtRem(ms){return PSC.fmtDur(Math.max(0,ms)/3.6e6)}
  function effMs(g){var run=window.__run;return run&&run.dur?run.dur*(+S.pb||1):g.hours*3.6e6}
  function updateValveClocks(){
    var g=window.__dg,svg=$('dg');if(!g||!g.hours)return;
    var run=window.__run,now=Date.now(),T=effMs(g),base=run?run.launch:now,p=run?(run.done?1:(window.__p||0)):0,obs=(run&&run.obs)||{};
    var rows=$('vlist').children;
    g.valves.forEach(function(v){
      var ok=v.ok,logged=ok&&obs[v.i],arrMs=ok?(logged?obs[v.i]:base+v.tf*T):0,arr=ok?fmtClock(arrMs)+(logged?' ✓':''):'–';
      var rem=ok?v.tf*T-p*T:0,passed=ok&&(logged||p>=v.tf),row=rows[v.i];
      if(row){
        var va=row.querySelector('.varr');va.textContent=arr;va.classList.toggle('real',!!logged);
        if(ok){var vloc=(g.vavg||0)*PSC.vRel(g.prof,v.frac),win=vloc>0?toolLenM(g.od)/vloc:0;
          va.title=win>0?tr('Pig passes the valve between')+' '+fmtClock(arrMs-win*500).split(' ')[0]+' – '+fmtClock(arrMs+win*500).split(' ')[0]+' ('+tr('tool length')+' '+toolLenM(g.od).toFixed(2)+' '+tr('m')+')':''}
        var rc=row.querySelector('.vrem');rc.textContent=ok?(passed?'✓ '+tr('passed'):fmtRem(rem)):'–';rc.classList.toggle('passed',passed);
      }
      var ta=svg.querySelector('.va[data-i="'+v.i+'"]'),tb=svg.querySelector('.vr[data-i="'+v.i+'"]');
      if(ta)ta.textContent=ok?' · '+arr:'';
      if(tb)tb.textContent=ok?(passed?' · ✓':' · '+tr('left')+' '+fmtRem(rem)):'';
    });
    var nextI='end',nextTf=2;                                         // next stop: ring on the line, highlighted row in the list
    g.valves.forEach(function(v){if(v.ok&&!(obs[v.i]||p>=v.tf)&&v.tf<nextTf){nextTf=v.tf;nextI=v.i}});
    g.valves.forEach(function(v){
      var pass=v.ok&&(obs[v.i]||p>=v.tf),isNext=(v.i===nextI),vg=svg.querySelector('.vg[data-v="'+v.i+'"]'),cd=svg.querySelector('.vcd[data-i="'+v.i+'"]'),row=rows[v.i];
      if(vg)vg.classList.toggle('next',isNext);
      if(cd)cd.textContent=(isNext&&!pass)?fmtRem(v.tf*T-p*T):'';
      if(row){row.classList.toggle('passed',!!pass);row.classList.toggle('next',isNext)}
    });
    $('tArrL').textContent=run?tr('Arrival at receiver'):tr('If launched now');
    $('tArr').textContent=fmtClock(base+T);
    $('tRem').textContent=fmtRem(T-p*T);
    $('tEl').textContent=PSC.fmtDur(p*T/3.6e6);
    $('tEl').title=run?tr('Launched')+' '+fmtClock(run.launch):'';
    var live=!!(run&&!run.done&&anim);$('tRem').parentNode.classList.toggle('live',live);
    var pb=$('rprog');pb.style.width=Math.min(100,p*100)+'%';pb.classList.toggle('done',p>=1);
    if(S.alert&&run&&!run.done&&anim){
      var lead=(+S.lead||5)*60000;
      g.valves.forEach(function(v){if(!v.ok||obs[v.i])return;var r2=(v.tf-p)*T;if(r2>0&&r2<=lead&&!alerted['v'+v.i]){alerted['v'+v.i]=1;toast(vName(v.i)+' · '+tr('left')+' '+fmtRem(r2))}});
      var re=(1-p)*T;if(re>0&&re<=lead&&!alerted.end){alerted.end=1;toast(tr('Arrival at receiver')+' · '+tr('left')+' '+fmtRem(re))}
    }
  }
  // alerts: sound and a banner (system notification when allowed), screen kept awake during a run
  var alertCtx=null,alerted={},wake=null,HKEY='pigSpeedCalc.history.v1',HIST=[];
  try{HIST=JSON.parse(localStorage.getItem(HKEY)||'[]')||[]}catch(e){HIST=[]}
  function primeAlerts(){
    try{alertCtx=alertCtx||new (window.AudioContext||window.webkitAudioContext)();if(alertCtx.resume)alertCtx.resume()}catch(e){}
    try{if(window.Notification&&Notification.permission==='default')Notification.requestPermission()}catch(e){}
  }
  function toast(msg){
    var t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show')},9000);
    try{if(alertCtx){var o=alertCtx.createOscillator(),gn=alertCtx.createGain();o.frequency.value=880;gn.gain.value=0.15;o.connect(gn);gn.connect(alertCtx.destination);o.start();o.stop(alertCtx.currentTime+0.3)}}catch(e){}
    try{if(window.Notification&&Notification.permission==='granted')new Notification('Pig Speed',{body:msg})}catch(e){}
  }
  function lockWake(on){
    try{if(on&&navigator.wakeLock){navigator.wakeLock.request('screen').then(function(l){wake=l}).catch(function(){})}
      else if(!on&&wake){wake.release();wake=null}}catch(e){}
  }
  function saveRun(){var run=window.__run,g=window.__dg;if(!run)return;try{localStorage.setItem(RKEY,JSON.stringify({launch:run.launch,hours:g&&g.hours,pb:+S.pb||1,dur:run.dur,obs:run.obs}))}catch(e){}}
  function removeRun(){try{localStorage.removeItem(RKEY)}catch(e){}}
  function snapRun(){return anim&&{t0:anim.t0,dur:anim.dur,obs:(window.__run&&window.__run.obs)||{}}}
  var logIdx=-1;
  function parseClockToday(s){
    var m=/^\s*(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*$/.exec(String(s||''));if(!m)return null;
    var hh=+m[1],mi=+m[2],ss=+(m[3]||0);if(hh>23||mi>59||ss>59)return null;
    var d=new Date();d.setHours(hh,mi,ss,0);var t=d.getTime();
    if(t>Date.now()+60000)t-=864e5;                                   // typed a time from before midnight
    return t;
  }
  function nowClock(){var d=new Date();return pad2(d.getHours())+':'+pad2(d.getMinutes())+':'+pad2(d.getSeconds())}
  function openLog(i){
    var g=window.__dg;if(!g||!g.hours||!g.valves[i]||!g.valves[i].ok)return;
    logIdx=i;$('logTitle').textContent=vName(i)+' — '+tr('passed at');
    $('logLaunchRow').style.display=anim?'none':'flex';
    $('logLaunch').value='';$('logAt').value=nowClock();$('logErr').textContent='';
    $('logPop').classList.add('open');
    (anim?$('logAt'):$('logLaunch')).focus();
  }
  function closeLog(){$('logPop').classList.remove('open');logIdx=-1}
  function confirmLog(){
    var g=window.__dg,i=logIdx,v=g&&g.valves[i];if(!v||!v.ok){closeLog();return}
    var at=parseClockToday($('logAt').value),launch=null,err='';
    if(at===null)err='Enter time as HH:MM:SS';
    if(!err&&!anim){launch=parseClockToday($('logLaunch').value);if(launch===null)err='Enter time as HH:MM:SS';else if(at<=launch+1000)err='Passage is earlier than the launch'}
    if(!err&&anim&&at<=window.__run.launch+1000)err='Passage is earlier than the launch';
    if(!err&&at>Date.now()+5000)err='Passage is in the future';
    if(!err&&anim&&(+S.pb||1)!==1)err='Set playback speed to ×1 to log passages';
    if(err){$('logErr').textContent=tr(err);return}
    if(!anim){                                                      // the run was started elsewhere: start the clock at the typed launch time
      S.pb=1;$('pbSel').value=1;save();
      var dur=g.hours*3.6e6;resumeAnim({t0:performance.now()-(Date.now()-launch),dur:dur,obs:{}});
      $('runWarn').style.display='none';
    }
    applyLog(i,at);closeLog();
  }
  function applyLog(i,at){
    var g=window.__dg,run=window.__run,v=g.valves[i],elapsed=at-run.launch;
    run.obs=run.obs||{};run.obs[i]=at;
    var planned0=g.hours*3.6e6*v.tf;                                // planned time from launch to this valve
    anim.dur=elapsed/v.tf;run.dur=anim.dur;                         // the pig was exactly at this valve at "at": recalibrate the speed
    saveRun();applyProgress(Math.min(1,(performance.now()-anim.t0)/anim.dur));updateValveClocks();
    var distM=v.frac*(+num('len'))*[1000,1][+S.lenu],act=distM/(elapsed/1000),pl=distM/(planned0/1000),dev=Math.round((act/pl-1)*100);
    $('logInfo').textContent=tr('Actual')+': '+vName(i)+' '+fmtClock(at).split(' ')[0]+' · '+tr('average speed')+' '+fmt(act,2)+' '+tr('m/s')+' ('+tr('plan')+' '+fmt(pl,2)+', '+(dev>0?'+':'')+dev+'%)';
  }
  function histAdd(e){HIST.unshift(e);HIST=HIST.slice(0,30);try{localStorage.setItem(HKEY,JSON.stringify(HIST))}catch(x){}renderHist()}
  function renderHist(){
    var box=$('histList');if(!box)return;box.innerHTML='';
    if(!HIST.length){var e=document.createElement('div');e.className='hint';e.textContent=tr('No finished runs yet.');box.appendChild(e);return}
    HIST.forEach(function(it){
      var d=document.createElement('div');d.className='sitem hist';var info=document.createElement('div');info.className='si';
      var n=document.createElement('div');n.className='sn';n.textContent=it.name;
      var s=document.createElement('div');s.className='sd';
      var dv=it.planned>0?Math.round((it.actual/it.planned-1)*100):0;
      s.textContent=new Date(it.at).toLocaleString(S.lang==='ru'?'ru-RU':'en-GB')+' · '+tr('planned')+' '+fmtRem(it.planned)+' · '+tr('actual')+' '+fmtRem(it.actual)+' ('+(dv>0?'+':'')+dv+'%)';
      info.appendChild(n);info.appendChild(s);d.appendChild(info);box.appendChild(d);
    });
  }
  function finishRun(){
    var run=window.__run,g=window.__dg;if(!anim||!run||!g)return;
    var actual=Date.now()-run.launch,planned=g.hours*3.6e6,pb=+S.pb||1;
    cancelAnimationFrame(anim.raf);anim=null;run.done=true;removeRun();lockWake(false);
    applyProgress(1);setStartLabel();updateValveClocks();
    if(pb===1)histAdd({name:(S.name||'').trim()||'—',at:Date.now(),planned:planned,actual:actual});
  }
  function fillPrintHead(){
    var o=[],f=S.fluid,u=function(a,i){return tr(a[i])};
    o.push('<h2>'+esc((S.name||'').trim()||tr('Results'))+'</h2>');
    o.push('<div>'+tr(['Gas','Oil','Oil + gas'][f])+' · Ø '+esc($('od').selectedOptions[0].textContent)+' · '+tr('Length')+' '+esc(S.len)+' '+u(['km','m'],+S.lenu)+' · '+esc(S.flow)+' '+tr((f===0?GAS_U:OIL_U)[f===0?S.gasu:S.oilu])+' · '+esc(S.p)+' '+u(['kPa','MPa','psi','bar'],+S.pu)+' · '+esc(S.t)+' '+(+S.tu?'°R':'°C')+'</div>');
    o.push('<div>'+tr('Pig speed')+': '+esc($('vel').textContent)+' · '+tr('Estimated duration')+': '+esc($('dur').textContent)+' · '+esc($('tArrL').textContent+' '+$('tArr').textContent+' · '+tr('left')+' '+$('tRem').textContent)+'</div>');
    $('phead').innerHTML=o.join('');
  }
  function download(name,text,type){var b=new Blob([text],{type:type||'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
  function downloadCsv(){
    var q=function(s){s=String(s==null?'':s);return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s},R=[];
    R.push([tr('Results'),(S.name||'').trim()]);
    R.push([tr('Length'),S.len+' '+tr(['km','m'][+S.lenu])]);
    R.push([tr('Pig speed'),$('vel').textContent]);
    R.push([tr('Estimated duration'),$('dur').textContent]);
    R.push([tr('Arrival at receiver'),$('tArr').textContent]);
    R.push([]);
    R.push(['#',tr('Valve'),tr('Position')+' ('+tr(['km','m'][+S.lenu])+')',tr('Time to reach'),tr('Arrival'),tr('Remaining')]);
    [].forEach.call($('vlist').children,function(row,i){R.push([i+1,vName(i),S.valves[i],row.querySelector('.veta').textContent,row.querySelector('.varr').textContent,row.querySelector('.vrem').textContent])});
    download('pig-run-'+((S.name||'plan').trim().replace(/[^\w\-а-яА-Я]+/g,'_'))+'.csv','\ufeff'+R.map(function(r){return r.map(q).join(';')}).join('\r\n'),'text/csv;charset=utf-8');
  }
  function exportAll(){download('pig-speed-sections.json',JSON.stringify({sections:SAVED,history:HIST},null,1),'application/json')}
  function importAll(){
    var f=this.files&&this.files[0];if(!f)return;var rd=new FileReader();
    rd.onload=function(){try{var d=JSON.parse(rd.result);
      (d.sections||[]).forEach(function(it){if(!it||!it.name||!it.data)return;var at=-1;SAVED.forEach(function(x,i){if(x.name===it.name)at=i});if(at>=0)SAVED[at]=it;else SAVED.push(it)});
      persistSections();renderSections();
      (d.history||[]).forEach(function(it){if(it&&it.at&&!HIST.some(function(x){return x.at===it.at}))HIST.push(it)});HIST.sort(function(a,b){return b.at-a.at});HIST=HIST.slice(0,30);
      try{localStorage.setItem(HKEY,JSON.stringify(HIST))}catch(e){}renderHist();
    }catch(e){$('secMsg').textContent='×'}};
    rd.readAsText(f);this.value='';
  }
  function animStop(){$('logInfo').textContent='';if(anim){cancelAnimationFrame(anim.raf);anim=null;removeRun();lockWake(false);window.__run=null}setStartLabel()}
  window.drawMinimap=function(){
    var mm=$('mm'),g=window.__dg;if(!mm)return;
    if(!g||!g.local){mm.style.display='none';return}
    mm.style.display='block';
    var k=1000/g.DW,o=[];
    o.push('<rect x="0" y="17" width="1000" height="10" rx="3" fill="#8b95a3" fill-opacity=".45"/>');
    o.push('<rect x="'+g.x0*k+'" y="16" width="'+Math.max(1,(g.x1-g.x0)*k)+'" height="12" fill="#8ec5ff" stroke="#4a5562" stroke-width="1"/>');
    g.valves.forEach(function(v){if(!v.ok)return;var x=(g.x0+v.frac*(g.x1-g.x0))*k;o.push('<path d="M'+x+' 6V38" stroke="#e5484d" stroke-width="2.5"/>')});
    var px=(g.x0+(window.__xf||0)*(g.x1-g.x0))*k;
    o.push('<path d="M'+(px-5)+' 1H'+(px+5)+'L'+px+' 13Z" fill="#e5484d"/>');
    o.push('<rect x="'+(window.__vbx||0)*k+'" y="3" width="'+Math.max(6,(window.__vw||1000)*k)+'" height="38" rx="3" fill="var(--accent)" fill-opacity=".18" stroke="var(--accent)" stroke-width="1.5"/>');
    mm.innerHTML=o.join('');
  };
  function applyProgress(p){
    var g=window.__dg;if(!g)return;
    window.__p=p;var xf=g.prof?PSC.xAt(g.prof,p):p;window.__xf=xf;
    var LL=num('len'),dd=xf*LL,dtxt=fmt(dd,dd<10?2:1)+' '+tr(['km','m'][+S.lenu]);                 // current distance of the pig
    if(LL>0){$('tDist').textContent=fmt(dd,dd<10?2:1)+' / '+fmt(LL,LL<10?2:1)+' '+tr(['km','m'][+S.lenu]);var pd=$('dg').querySelector('.pigd');if(pd)pd.textContent=dtxt}
    var lb=$('dg').querySelector('#lbar'),rb=$('dg').querySelector('#rbar');
    if(lb)lb.classList.add('closed');if(rb)rb.classList.toggle('done',p>=1);
    if(g.local&&!window.__userPan)window.dgFollow(g.x0+xf*(g.x1-g.x0));
    if(window.drawMinimap)window.drawMinimap();
    var tg=$('dg').querySelector('#toolg');if(tg)tg.setAttribute('transform','translate('+(g.x0+xf*(g.x1-g.x0)-g.tw/2)+' 0)');
    var tnow=performance.now();if(tnow-lastClk>250||p>=1){lastClk=tnow;updateValveClocks()}
    g.valves.forEach(function(v){if(!v.ok)return;var el=$('dg').querySelector('.vg[data-v="'+v.i+'"]');if(el)el.classList.toggle('passed',p>=v.tf)});
    if(!g.local){var pr=$('dg').querySelector('#prog');if(pr)pr.setAttribute('x2',g.x0+xf*(g.x1-g.x0))}
  }
  function animStart(){
    var g=window.__dg;if(!g||!(g.hours>0))return;
    if(anim){animStop();update();return}
    var dur=g.hours*3600000/(+S.pb||1),t0=performance.now();
    if(S.alert)primeAlerts();
    applyProgress(0);runLoop(t0,dur);
  }
  function runLoop(t0,dur){
    anim={raf:0,t0:t0,dur:dur};window.__userPan=false;alerted={};
    var carry=window.__runCarry;window.__runCarry=null;
    window.__run={launch:Date.now()-(performance.now()-t0),done:false,dur:dur,obs:(carry&&carry.obs)||{}};
    setStartLabel();saveRun();lockWake(true);
    function frame(now){
      if(!anim)return;
      var p=Math.min(1,(now-anim.t0)/anim.dur);applyProgress(p);
      if(p<1)anim.raf=requestAnimationFrame(frame);else{anim=null;if(window.__run)window.__run.done=true;removeRun();lockWake(false);setStartLabel();updateValveClocks()}
    }
    anim.raf=requestAnimationFrame(frame);
  }
  function restoreRun(){
    var s=pendingRun;pendingRun=null;if(!s)return;
    removeRun();
    var g=window.__dg,pb=+S.pb||1;
    if(!g||!g.hours||!s.hours||Math.abs(g.hours-s.hours)>1e-6*Math.max(1,s.hours)||(+s.pb||1)!==pb)return;
    var dur=s.dur||s.hours*3600000/pb,el=Date.now()-s.launch;
    if(el<0||el>=dur)return;
    resumeAnim({t0:performance.now()-el,dur:dur,obs:s.obs||{}});
  }
  function keepRun(fn){var run=snapRun();fn();if(run){resumeAnim(run);$('runWarn').style.display='block'}}
  function resumeAnim(run){window.__runCarry=run;runLoop(run.t0,run.dur);applyProgress(Math.min(1,(performance.now()-run.t0)/run.dur))}
  var TOOLS=[{k:'egt',n:'Geometry (EGT)'},{k:'mfl',n:'MFL (AMFD)'},{k:'tfi',n:'TFI'},{k:'vlad',n:'Vlad'}];
  // Vector tool, drawn in units of the tool diameter (D=1), axis along x, nose towards +x.
  function buildTool(kind){
    if(kind==='vlad'){var ar=520/142;return {m:'<image href="'+VLAD_IMG+'" x="0" y="-.5" width="'+ar+'" height="1"/>',len:ar}}
    var x=0,m=[],L='stroke="#1b2a44" stroke-width=".01"';
    function link(l){m.push('<rect x="'+x+'" y="-.035" width="'+l+'" height=".07" fill="url(#gMetal)" '+L+'/>');x+=l}
    function cup(){m.push('<path d="M'+x+' -.5Q'+(x+.09)+' -.5 '+(x+.1)+' -.3V.3Q'+(x+.09)+' .5 '+x+' .5Z" fill="url(#gBlue)" stroke="#0d3a8a" stroke-width=".01"/>');x+=.1}
    function mod(l){m.push('<rect x="'+x+'" y="-.25" width="'+l+'" height=".5" rx=".2" fill="url(#gNavy)" '+L+'/><rect x="'+(x+.12)+'" y="-.2" width="'+(l-.24)+'" height=".07" rx=".035" fill="#fff" fill-opacity=".28"/><circle cx="'+(x+l/2)+'" cy=".1" r=".03" fill="#6ee7a8"/>');x+=l}
    function tail(){m.push('<path d="M'+(x+.25)+' -.25H'+(x+.12)+'Q'+x+' -.25 '+x+' 0Q'+x+' .25 '+(x+.12)+' .25H'+(x+.25)+'Z" fill="url(#gNavy)" '+L+'/>');x+=.25}
    function nose(){m.push('<path d="M'+x+' -.25Q'+(x+.4)+' -.25 '+(x+.46)+' 0Q'+(x+.4)+' .25 '+x+' .25Z" fill="url(#gMetal)" '+L+'/><path d="M'+(x+.06)+' -.16Q'+(x+.28)+' -.19 '+(x+.38)+' -.06" stroke="#fff" stroke-opacity=".8" stroke-width=".025" fill="none"/>');x+=.46}
    function ring(l){
      m.push('<rect x="'+x+'" y="-.3" width="'+l+'" height=".6" rx=".08" fill="url(#gMetal)" '+L+'/>');
      var i,n=kind==='egt'?4:kind==='mfl'?3:5;
      for(i=0;i<n;i++){var px=x+.07+i*(l-.14-(kind==='tfi'?.04:.16))/(n-1||1);
        if(kind==='tfi')m.push('<rect x="'+px+'" y="-.34" width=".04" height=".68" rx=".02" fill="#15a58f"/>');
        else[-1,1].forEach(function(s){m.push('<rect x="'+px+'" y="'+(s<0?-.4:.3)+'" width=".16" height=".1" rx=".03" fill="'+(kind==='egt'?'#e5a13a':'#2b323c')+'" stroke="#111" stroke-width=".006"/>')})}
      x+=l}
    tail();cup();
    if(kind==='egt'){mod(.7);cup();link(.1);ring(.55);cup();link(.1);mod(.5)}
    else{mod(.6);cup();link(.1);mod(.6);cup();link(.1);ring(.65);cup();link(.1);mod(.45)}
    cup();nose();
    return {m:m.join(''),len:x};
  }
  var RU={'Pig Speed Calculator':'Калькулятор скорости снаряда','Pig travel speed, trip time and the flow needed for a target speed.':'Скорость снаряда, время прохождения и расход для заданной скорости.',
   'Choose tool (default: MFL)':'Выбрать снаряд (по умолчанию: MFL)','Geometry (EGT)':'Геометрия (EGT)','Fluid':'Среда','Gas':'Газ','Oil':'Нефть','Mix (oil + gas)':'Смесь (нефть + газ)',
   'Pipeline':'Трубопровод','Line name':'Название линии','Outside diameter':'Наружный диаметр','Wall thickness':'Толщина стенки','Line length':'Длина линии','Conditions':'Условия',
   'Pressure':'Давление','Temperature':'Температура','Gas-oil ratio (GOR)':'Газовый фактор (GOR)','Target speed':'Целевая скорость','Target pig speed':'Целевая скорость снаряда',
   'Results':'Результаты','Pig speed':'Скорость снаряда','Estimated duration':'Расчётное время','Flow for target speed':'Расход для целевой скорости','Reset to defaults':'Сбросить',
   'Values are saved in this browser.':'Значения сохраняются в этом браузере.','H:MM:SS':'Ч:ММ:СС','mm':'мм','inch':'дюйм','km':'км','m':'м','kPa':'кПа','MPa':'МПа','bar':'бар',
   'm/s':'м/с','mph':'миль/ч','km/h':'км/ч','°R (Rankine)':'°R (Ранкин)','Km³/day':'тыс. м³/сут','MMSCF/day':'млн фут³/сут','MMSCM/day':'млн м³/сут','Km³/h':'тыс. м³/ч','MMSCF/h':'млн фут³/ч','MMSCM/h':'млн м³/ч',
   'm³/day':'м³/сут','BBL/day':'барр/сут','m³/h':'м³/ч','BBL/h':'барр/ч','SCF/BBL':'фут³/барр','Gas flow rate':'Расход газа','Oil flow rate':'Расход нефти','Oil flow rate (gas follows from GOR)':'Расход нефти (газ — по GOR)',
   'Enter a number':'Введите число','Must be greater than zero':'Должно быть больше нуля','Wrong Outer Diameter or Wall Thickness':'Неверный наружный диаметр или толщина стенки',
   ': the inner diameter must be at least 1 mm.':': внутренний диаметр должен быть не менее 1 мм.','Length':'Длина','Valves':'Задвижки','+ Add valve':'+ Добавить задвижку','Time for the tool to reach each valve, counted from the start of the line.':'Время, за которое снаряд дойдёт до каждой задвижки, от начала линии.','Valve':'Задвижка','Symbols':'Буквы','Live numbers':'Числа','Formulas':'Формулы','Elapsed':'Прошло','Covered':'Пройдено','click to add':'нажмите, чтобы добавить','Covered':'Пройдено','of':'из','Distance':'Расстояние','Launch':'Запуск','Receiver':'Приём','Diagram style':'Стиль схемы','Classic':'Классика','Glass':'Стекло','Blueprint':'Чертёж','Pipe':'Труба','Conditions':'Условия','Flow':'Расход','Auto: MFL (default)':'Авто: MFL (по умолчанию)','Tool':'Снаряд','Launch time':'Время пуска','Passed at':'Прошла в','passed at':'прошла в','Apply':'Применить','Actual':'Факт','average speed':'средняя скорость','plan':'план','Enter time as HH:MM:SS':'Введите время в формате ЧЧ:ММ:СС','Passage is earlier than the launch':'Проход раньше пуска','Passage is in the future':'Время прохода в будущем','Set playback speed to ×1 to log passages':'Для отметки поставьте скорость воспроизведения ×1 (меню-шестерёнка)','Enter the real time the pig passed this valve. The actual speed and all remaining times are recalculated.':'Введите реальное время прохода снаряда через эту задвижку. Фактическая скорость и все оставшиеся времена пересчитаются.','✓ Accepted at receiver':'✓ Принят в приёмнике','Report':'Отчёт','Print / PDF':'Печать / PDF','Download CSV':'Скачать CSV','History of runs':'История прогонов','Export':'Экспорт','Import':'Импорт','No finished runs yet.':'Завершённых прогонов пока нет.','planned':'план','actual':'факт','Mark that the pig really passed this valve now. The remaining times are recalculated from the actual speed (works at playback ×1).':'Отметить, что снаряд только что прошёл эту задвижку. Остальные времена пересчитываются по фактической скорости (при воспроизведении ×1).','Gas density relative to air, usually 0.55–0.75.':'Плотность газа относительно воздуха, обычно 0,55–0,75.','Oil API gravity: about 35 is a medium oil, a higher number is lighter.':'Плотность нефти в градусах API: около 35 — средняя нефть, больше — легче.','Gas produced with each barrel of stock-tank oil (scf/bbl). Used to find the free gas in the pipe.':'Газ на каждый баррель товарной нефти (фут³/барр). Нужен, чтобы найти свободный газ в трубе.','Temperature of the fluid in the pipe.':'Температура среды в трубе.','Flow measured at standard conditions, not at the pressure in the pipe.':'Расход при стандартных условиях, а не при давлении в трубе.','The speed you want the pig to have. The app shows the flow that gives it.':'Скорость, которую вы хотите получить. Приложение покажет расход для неё.','Pressure at the launcher end. Tick the gauge option in the gear menu if your gauge reads above atmosphere.':'Давление на стороне камеры запуска. Если манометр показывает избыточное давление, отметьте это в меню-шестерёнке.','Pressure at the receiver end. Leave empty if the pressure does not change along the line.':'Давление на стороне камеры приёма. Оставьте пустым, если давление по линии не меняется.','Pig speed as a percentage of the flow speed. Use 100 if there is no bypass or slip.':'Скорость снаряда в процентах от скорости потока. Оставьте 100, если нет перепуска и проскальзывания.','Speed below the tool limit':'Скорость ниже предела снаряда','Speed above the tool limit':'Скорость выше предела снаряда','Trip longer than the tool can run':'Время прогона больше ресурса снаряда','Line longer than the tool range':'Линия длиннее дальности снаряда','Pressure outside the tool limits':'Давление вне допустимого диапазона снаряда','Gas pressure below the tool limit':'Давление газа ниже предела снаряда','Temperature outside the tool limits':'Температура вне допустимого диапазона снаряда','Pipe bore too small for the tool':'Внутренний диаметр трубы мал для снаряда','Within equipment limits':'В пределах возможностей оборудования','Allowed flow':'Допустимый расход','Allowed':'Допустимо','Allowed flow for 0.2–4 m/s':'Допустимый расход для 0,2–4 м/с','Pig passes the valve between':'Снаряд проходит задвижку с','tool length':'длина снаряда','h':'ч','m':'м','Run':'Прогон','Calculation':'Расчёт','Display':'Вид схемы','Reminders before valves and arrival':'Напоминания перед задвижками и приёмом','1 min':'1 мин','2 min':'2 мин','5 min':'5 мин','10 min':'10 мин','Pressure is gauge (add atmosphere)':'Давление избыточное (добавить атмосферное)','Pressure (gauge)':'Давление, изб.','Standard conditions':'Стандартные условия','Pig speed / flow speed, %':'Скорость снаряда / скорость потока, %','Outlet pressure':'Давление на выходе','same as inlet':'как на входе','Outlet pressure cannot be higher than inlet pressure.':'Давление на выходе не может быть выше давления на входе.','Speed at inlet / outlet':'Скорость на входе / выходе','Arrival':'Прибытие','Remaining':'Осталось','Launched':'Пуск','Arrival at receiver':'Прибытие в приёмник','If launched now':'Если запустить сейчас','left':'осталось','d':'д','passed':'пройдена','Run already started. The new valve distance is applied to the current run.':'Прогон уже запущен. Новое расстояние задвижки применено к текущему прогону.','View':'Вид','Local':'Локальный','Global':'Глобальный','True scale, diameter : length':'Истинный масштаб, диаметр : длина','Pressure (absolute)':'Давление, абс.','Gas specific gravity (air = 1)':'Отн. плотность газа','Oil gravity':'Плотность нефти','Gas-oil ratio (GOR), per stock-tank bbl':'Газовый фактор (GOR), на баррель товарной нефти','Z factor':'Коэффициент сжимаемости Z','Line volume per standard volume':'Объём в трубе на стандартный объём','Line volume per stock-tank volume':'Объём в трубе на объём товарной нефти','Flow at line conditions':'Расход в рабочих условиях','Z factor correlation used outside its best range, result is approximate.':'Корреляция Z применена вне лучшей области, результат приблизительный.','Standing oil correlation used outside its tested range (API 16.5-63.8, GOR 20-1425 scf/STB), result is approximate.':'Корреляция Стэндинга применена вне проверенного диапазона (API 16,5-63,8, GOR 20-1425 фут³/барр), результат приблизительный.','°API':'°API','Playback speed':'Скорость воспроизведения','Start':'Старт','Stop':'Стоп','×1 (real time)':'×1 (реальное время)','Pipe sections':'Участки','Save current':'Сохранить текущий','Save':'Сохранить','Open':'Открыть','Saved':'Сохранено','No saved sections yet.':'Сохранённых участков пока нет.','valves':'задв.','Section':'Участок','Text size in diagram':'Размер текста на схеме','Fluid':'Среда','Pipe length vs tool':'Длина трубы к снаряду','Position':'Положение','Time to reach':'Время до задвижки','No valves yet. Press "+ Add valve" to add one.':'Задвижек пока нет. Нажмите «+ Добавить задвижку».','Time is counted from the start of the line, at constant speed.':'Время считается от начала линии при постоянной скорости.','Ball valve':'Шаровой кран','Gate valve':'Задвижка','Check valve':'Обратный клапан','Outside the line':'За пределами линии','wall':'стенка','target':'цель','Oil + gas':'Нефть + газ','in':'дюйм'};
  function tr(s){return S.lang==='ru'&&RU[s]||s}
  function applyLang(){
    document.documentElement.lang=S.lang;
    [].forEach.call(document.body.querySelectorAll('*'),function(el){
      if(el.closest('svg')||{title:1,flowL:1,vel:1,dur:1,rflow:1,warn:1,startL:1,tArrL:1,pL:1,fmlBody:1,rlo:1,rrange:1}[el.id])return;
      if(el.childNodes.length!==1||el.firstChild.nodeType!==3)return;
      var en=el.dataset.en||el.textContent.trim();
      if(RU[en]){el.dataset.en=en;el.textContent=S.lang==='ru'?RU[en]:en}
    });
    [].forEach.call(document.querySelectorAll('[data-ti]'),function(el){el.title=tr(el.getAttribute('data-ti'))});
    [].forEach.call($('lang').children,function(b){b.setAttribute('aria-pressed',String(b.dataset.v===S.lang))});
  }
  function drawDiagram(r,vals){
    animStop();
    var ds=+S.dstyle||0;
    var f=S.fluid,svg=$('dg'),nV=(vals.valves||[]).filter(function(v){return v.ok}).length,W=(+S.view===1?Math.max(480,Math.min(880,Math.round((svg.clientWidth||900)*1.05))):880),gl=(+S.view===1),lenMm=(vals.len>0?vals.len*[1,0.001][+S.lenu]*1e6:0),cy=gl?105:150,H=gl?Math.max(1.6,(lenMm>0&&vals.od>0)?W*vals.od/lenMm:1.6):130,tsf=Math.max(1,(+S.tscale||100)/100),ro=nV?(22*nV+10)*tsf:0,od=vals.od,wt=vals.wt,o=[];
    var okG=od>0&&wt>=0&&od-2*wt>=1;
    var wpx=gl?0:(okG?Math.max(3,Math.min(16,wt/od*H)):6), ih=H-2*wpx, top=cy-H/2, bot=cy+H/2;
    var T=TOOLS[toolIdx()], B=gl?{m:'<path d="M-10 -'+(H/2+30)+'L10 -'+(H/2+30)+'L0 -'+(H/2+8)+'Z" fill="#e5484d" stroke="#8c1d22" stroke-width="1.5"/>',len:0}:buildTool(T.k), th=gl?1:Math.min(ih,330/B.len), tw=th*B.len;
    var Tsec=(r&&r.hours>0)?r.hours*3600/(+S.pb||1):0;
    if(!gl)W=Tsec>0?Math.min(2e6,Math.max(1200,Tsec*90)):2000;      // local scale: the pig crosses one screen in about 10 s
    var inset=Math.round(tw/2+(gl?14:40)), px0=gl?70:150, x0=px0+inset, x1=x0+W, px1=x1+inset;
    var LB=gl?0:Math.max(300,Math.round(tw+110)), RD=gl?0:70, HB=Math.round(H*barrelRatio(vals.od)), wb=14, bo=gl?0:44;
    var pa=px0+LB+RD, pb=px1-LB-RD;
    svg.dataset.x0=x0;svg.dataset.x1=x1;
    svg.style.setProperty('--ts',(+S.tscale||100)/100);
    var DW=px1+30,VWd=gl?DW:Math.min(DW,1000),DH=Math.round(gl?(cy+54*tsf+16):(335+ro+(tsf-1)*40));if(dgDim!==DW+'x'+DH+'x'+VWd){dgDim=DW+'x'+DH+'x'+VWd;if(window.dgBase)window.dgBase(DW,DH,VWd)}
    var col=f===0?'#8ec5ff':f===1?'#c98a2b':null;
    if(!gl)o.push('<defs><pattern id="pgrid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#8b95a3" stroke-opacity=".16" stroke-width="1"/></pattern></defs><rect x="0" y="0" width="'+DW+'" height="'+DH+'" fill="url(#pgrid)"/>');
    o.push('<rect x="'+pa+'" y="'+top+'" width="'+(pb-pa)+'" height="'+H+'" fill="#8b95a3"/>');
    if(f===2)o.push('<rect x="'+pa+'" y="'+(top+wpx)+'" width="'+(pb-pa)+'" height="'+ih/2+'" fill="#8ec5ff"/><rect x="'+pa+'" y="'+cy+'" width="'+(pb-pa)+'" height="'+ih/2+'" fill="#c98a2b"/>');
    else o.push('<rect x="'+pa+'" y="'+(top+wpx)+'" width="'+(pb-pa)+'" height="'+ih+'" fill="'+col+'"/>');
    o.push('<defs><linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8cbcff"/><stop offset=".5" stop-color="#2a66d8"/><stop offset="1" stop-color="#0d3a8a"/></linearGradient><linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f8fa"/><stop offset=".45" stop-color="#b4bcc6"/><stop offset="1" stop-color="#6a7480"/></linearGradient><linearGradient id="gNavy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f78b8"/><stop offset=".5" stop-color="#28407a"/><stop offset="1" stop-color="#16223f"/></linearGradient><linearGradient id="gDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6270"/><stop offset="1" stop-color="#1c2128"/></linearGradient></defs>');
    o.push('<defs><linearGradient id="tube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".3" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient></defs>');
    if(!gl)o.push('<rect x="'+pa+'" y="'+top+'" width="'+(pb-pa)+'" height="'+H+'" fill="url(#tube)"/>');
    if(gl)o.push('<rect x="'+pa+'" y="'+top+'" width="'+(pb-pa)+'" height="'+H+'" fill="none" stroke="#27303b" stroke-width="1"/>');
    if(!gl)o.push('<path d="M'+pa+' '+top+'H'+pb+'M'+pa+' '+bot+'H'+pb+'" stroke="#5d6674" stroke-width="2"/>');
    if(!gl){                                                       // pro look: bore shading, wall highlights, weld seams, tool shadow and trail
      o.push('<defs><linearGradient id="bore" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".22" stop-color="#000" stop-opacity=".06"/><stop offset=".7" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>'
        +'<linearGradient id="seam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>'
        +'<linearGradient id="trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></linearGradient>'
        +'<filter id="tsh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".4"/></filter></defs>');
      o.push('<rect x="'+pa+'" y="'+(top+wpx)+'" width="'+(pb-pa)+'" height="'+ih+'" fill="url(#bore)"/>');
      o.push('<path d="M'+pa+' '+(top+1)+'H'+pb+'" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/><path d="M'+pa+' '+(top+wpx)+'H'+pb+'M'+pa+' '+(bot-wpx)+'H'+pb+'" stroke="#000" stroke-opacity=".3" stroke-width="1"/>');
      for(var wx=pa+420;wx<pb-60;wx+=640)o.push('<rect x="'+(wx-5)+'" y="'+(top-1)+'" width="10" height="'+(H+2)+'" fill="url(#seam)"/>');
    }
    if(!gl)[pa,pb].forEach(function(x){o.push('<rect x="'+(x-12)+'" y="'+(top-7)+'" width="24" height="'+(H+14)+'" rx="3" fill="url(#gBarrel)" stroke="#4a5562" stroke-width="1.5"/>'+[0.18,0.82].map(function(q){return '<circle cx="'+x+'" cy="'+(top-7+(H+14)*q)+'" r="2.6" fill="#4a5562"/>'}).join(''))});
    if(false)[px0,px1].forEach(function(x){o.push('<path d="M'+x+' '+(top-4)+'l6 '+(H/4+2)+'l-8 '+(H/4)+'l8 '+(H/4)+'l-6 '+(H/4+2)+'" stroke="var(--ink)" stroke-width="2" fill="none"/>')});
    [x0,x1].forEach(function(x){o.push('<path d="M'+x+' '+(top+wpx-(gl?12:0))+'V'+(bot-wpx+(gl?12:0))+'" stroke="#fff" stroke-opacity=".75" stroke-width="1.5" stroke-dasharray="5 5"/>')});
    if(!gl)for(var ax=pa+60;ax<pb-60;ax+=220){o.push('<path d="M'+ax+' '+(cy+ih/2-7)+'h24m-6 -5l6 5l-6 5" stroke="#fff" stroke-opacity=".8" stroke-width="2" fill="none"/>')}
    if(ds&&!gl){
      o.push('<defs><pattern id="flowp" x="0" y="'+(cy-22)+'" width="90" height="44" patternUnits="userSpaceOnUse"><path d="M10 12l14 10-14 10M50 12l14 10-14 10" fill="none" stroke="'+(ds===2?'#7ff0ff':'#ffffff')+'" stroke-opacity="'+(ds===2?'.5':'.55')+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><animateTransform attributeName="patternTransform" type="translate" from="0 0" to="90 0" dur="2.6s" repeatCount="indefinite"/></pattern></defs>');
      o.push('<rect x="'+pa+'" y="'+(cy-22)+'" width="'+(pb-pa)+'" height="44" fill="url(#flowp)"/>');
      if(ds===1){
        o.push('<rect x="'+pa+'" y="'+(top+wpx+3)+'" width="'+(pb-pa)+'" height="'+Math.max(4,ih*0.1)+'" rx="'+Math.max(2,ih*0.05)+'" fill="#fff" fill-opacity=".4"/>');
        [pa,pb].forEach(function(x){o.push('<rect x="'+(x-7)+'" y="'+(top-9)+'" width="14" height="'+(H+18)+'" rx="5" fill="url(#gMetal)" stroke="#5d6674" stroke-width="1.5"/>')});
      } else {
        o.push('<path d="M'+px0+' '+cy+'H'+px1+'" stroke="#3ad6ff" stroke-opacity=".4" stroke-width="1.5" stroke-dasharray="16 6 3 6" fill="none"/>');
      }
    }
    if(!gl){
      var fl=f===2?'#8ec5ff':col;
      var barrel=function(xo,s,cls,id){
        var xi=xo+s*LB, xl=Math.min(xo,xi), xr=xi+s*RD, hx=xo+(s>0?-7:7), hy=cy-HB/2+8, g='<g class="'+cls+'" id="'+id+'">';
        g+='<path class="bshell" d="M'+xi+' '+(cy-HB/2)+'L'+xr+' '+(cy-H/2)+'V'+(cy+H/2)+'L'+xi+' '+(cy+HB/2)+'Z" fill="url(#gBarrel)" stroke="#4a5562" stroke-width="2"/>';
        g+='<path d="M'+xi+' '+(cy-HB/2+wb)+'L'+xr+' '+(cy-H/2+wpx)+'V'+(cy+H/2-wpx)+'L'+xi+' '+(cy+HB/2-wb)+'Z" fill="'+fl+'"/>';
        g+='<rect class="bshell" x="'+xl+'" y="'+(cy-HB/2)+'" width="'+LB+'" height="'+HB+'" rx="12" fill="url(#gBarrel)" stroke="#4a5562" stroke-width="2"/>';
        g+='<rect x="'+Math.min(xo+s*18,xi)+'" y="'+(cy-HB/2+wb)+'" width="'+(LB-18)+'" height="'+(HB-2*wb)+'" rx="4" fill="'+fl+'"/>';
        if(f===2)g+='<rect x="'+Math.min(xo+s*18,xi)+'" y="'+cy+'" width="'+(LB-18)+'" height="'+(HB/2-wb)+'" rx="4" fill="#c98a2b"/>';
        g+='<rect x="'+xl+'" y="'+(cy-HB/2)+'" width="'+LB+'" height="'+HB+'" rx="12" fill="url(#tube)"/>';
        g+='<rect class="bclos" x="'+(xo+(s>0?4:-14))+'" y="'+(cy-HB/2-7)+'" width="10" height="'+(HB+14)+'" rx="5" fill="#c0392b" stroke="#7a1f16" stroke-width="1.5"/>';
        g+='<g class="dClosed"><rect class="bclos" x="'+(s>0?xo-14:xo)+'" y="'+(cy-HB/2+6)+'" width="14" height="'+(HB-12)+'" rx="6" fill="#d6453d" stroke="#7a1f16" stroke-width="1.5"/><circle cx="'+(xo+(s>0?-7:7))+'" cy="'+cy+'" r="7" fill="#ececec" stroke="#4a5562"/></g>';
        g+='<g class="dOpen"><rect x="'+(s>0?xo:xo-14)+'" y="'+(cy-HB/2+wb)+'" width="14" height="'+(HB-2*wb)+'" fill="#1c2a40" fill-opacity=".55"/><g transform="rotate('+(72*s)+' '+hx+' '+hy+')"><rect class="bclos" x="'+(hx-7)+'" y="'+hy+'" width="14" height="'+(HB-16)+'" rx="6" fill="#d6453d" stroke="#7a1f16" stroke-width="1.5"/><circle cx="'+hx+'" cy="'+(hy+(HB-16)/2)+'" r="6" fill="#ececec" stroke="#4a5562"/></g></g>';
        var nx=xi-s*48;
        g+='<rect x="'+(nx-6)+'" y="'+(cy-HB/2-24)+'" width="12" height="24" fill="url(#gMetal)" stroke="#27303b" stroke-width="1.5"/><rect x="'+(nx-11)+'" y="'+(cy-HB/2-30)+'" width="22" height="7" rx="2" fill="url(#gDark)"/>';
        var gx=xo+s*LB*0.5,gy=cy-HB/2-22;
        g+='<rect x="'+(gx-3)+'" y="'+(gy+8)+'" width="6" height="'+(HB/2-30+14)+'" fill="#6b7686"/><circle cx="'+gx+'" cy="'+gy+'" r="15" fill="#f4f6f8" stroke="#27303b" stroke-width="2"/><path d="M'+(gx-10)+' '+(gy+6)+'A12 12 0 1 1 '+(gx+10)+' '+(gy+6)+'" fill="none" stroke="#9aa5b4" stroke-width="2" stroke-dasharray="1.5 3"/><path d="M'+gx+' '+gy+'L'+(gx+7)+' '+(gy-7)+'" stroke="#c0392b" stroke-width="2" stroke-linecap="round"/><circle cx="'+gx+'" cy="'+gy+'" r="2.2" fill="#27303b"/>';
        [xo+s*70,xi-s*70].forEach(function(sx){g+='<path d="M'+(sx-28)+' '+(cy+HB/2-2)+'H'+(sx+28)+'L'+(sx+38)+' '+(cy+HB/2+36)+'H'+(sx-38)+'Z" fill="#6b7686" stroke="#3a424e" stroke-width="1.5"/><rect x="'+(sx-46)+'" y="'+(cy+HB/2+36)+'" width="92" height="8" rx="2" fill="#3a424e"/>'});
        return g+'</g>';
      };
      o.push('<defs><linearGradient id="gBarrel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e8ee"/><stop offset=".5" stop-color="#9aa5b4"/><stop offset="1" stop-color="#5f6a79"/></linearGradient><linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9be7b5"/><stop offset=".5" stop-color="#3fbf70"/><stop offset="1" stop-color="#1f7a46"/></linearGradient></defs>');
      o.push(barrel(px0,1,'lb','lbar'));
      o.push(barrel(px1,-1,'rb','rbar'));
    }
    if(gl)o.push('<line id="prog" x1="'+x0+'" y1="'+cy+'" x2="'+x0+'" y2="'+cy+'" stroke="#1D9E75" stroke-width="6" stroke-linecap="round"/>');
    o.push('<g id="toolg" transform="translate('+(x0-tw/2)+' 0)">'+(gl?'':'<rect x="'+(-tw*1.7)+'" y="'+(cy-ih/2+2)+'" width="'+(tw*1.7)+'" height="'+(ih-4)+'" fill="url(#trail)"/>')+'<g transform="translate(0 '+cy+') scale('+th+')"'+(gl?'':' filter="url(#tsh)"')+'>'+B.m+'</g><text class="t tl pigd" x="'+(gl?0:tw/2)+'" y="'+(gl?cy-(H/2+40):top-14)+'" text-anchor="middle"></text></g>');
    var rowOf={},asc=(vals.valves||[]).map(function(v,i){return {v:v,i:i}}).filter(function(e){return e.v.ok}).sort(function(p,q){return p.v.frac-q.v.frac});
    asc.forEach(function(e,k){rowOf[e.i]=asc.length-1-k});
    (vals.valves||[]).forEach(function(v,i){
      if(!v.ok)return;var vx=x0+v.frac*(x1-x0), ry=bot+26*tsf+bo+22*tsf*rowOf[i];
      if(gl){
        o.push('<g class="vg'+(window.__vdrag===i?' on':'')+'" data-v="'+i+'"><rect class="vhl" x="'+(vx-22)+'" y="'+(cy-46*tsf)+'" width="44" height="'+(92*tsf)+'" rx="10"/><rect x="'+(vx-22)+'" y="'+(cy-46*tsf)+'" width="44" height="'+(92*tsf)+'" fill="transparent"/>'
          +'<circle class="ring" cx="'+vx+'" cy="'+cy+'" r="19" fill="none" stroke="#378ADD" stroke-width="2" stroke-dasharray="4 3"/>'
          +'<circle class="b" cx="'+vx+'" cy="'+cy+'" r="12"/><text class="bn" x="'+vx+'" y="'+(cy+5)+'" text-anchor="middle">'+(i+1)+'</text>'
          +'<text class="t tl" x="'+vx+'" y="'+(cy+34*tsf)+'" text-anchor="middle">'+(+(v.frac*vals.len).toFixed(2))+' '+tr(['km','m'][+S.lenu])+'</text>'
          +'<text class="t tv vcd" data-i="'+i+'" x="'+vx+'" y="'+(cy-28*tsf)+'" text-anchor="middle"></text></g>');
        return;
      }
      o.push('<g class="vg'+(window.__vdrag===i?' on':'')+'" data-v="'+i+'"><rect class="vhl" x="'+(vx-20)+'" y="'+(top-46)+'" width="40" height="'+(H+50)+'" rx="8"/><rect x="'+(vx-20)+'" y="'+(top-46)+'" width="40" height="'+(H+50)+'" fill="transparent"/>');
      o.push('<path d="M'+vx+' '+bot+'V'+(ry-4)+'h6" stroke="var(--muted)" stroke-width="1" fill="none" stroke-dasharray="2 3"/>');
      o.push('<text class="t tv" x="'+vx+'" y="'+(top-40-(rowOf[i]%2)*18*tsf)+'" text-anchor="middle">'+(+(v.frac*vals.len).toFixed(2))+' '+tr(['km','m'][+S.lenu])+'</text>');
      o.push('<rect x="'+(vx-10)+'" y="'+(top-5)+'" width="20" height="'+(H+10)+'" rx="3" fill="url(#gBarrel)" stroke="#4a5562" stroke-width="1.5"/>');
      o.push('<rect class="vp" x="'+(vx-2.5)+'" y="'+(cy-Math.max(ih,16)/2)+'" width="5" height="'+Math.max(ih,16)+'" fill="#e5484d" stroke="#8c1d22" stroke-width="1"/>');
      var ty=1, ic;
      if(ty===1)ic='<path d="M'+vx+' '+(top-26)+'V'+top+'" stroke="#4a5562" stroke-width="4"/><path d="M'+(vx-14)+' '+(top-33)+'h28" stroke="#c0392b" stroke-width="4" stroke-linecap="round"/><path d="M'+vx+' '+(top-33)+'V'+(top-26)+'" stroke="#4a5562" stroke-width="3"/><path d="M'+(vx-12)+' '+top+'v-6q0 -6 6 -6h12q6 0 6 6v6z" fill="url(#gMetal)" stroke="#27303b" stroke-width="1.5"/><rect x="'+(vx-16)+'" y="'+(top-4)+'" width="32" height="5" rx="2" fill="url(#gDark)"/>';
      else if(ty===0)ic='<path d="M'+vx+' '+(top-18)+'V'+(top-8)+'" stroke="#4a5562" stroke-width="4"/><path d="M'+(vx-4)+' '+(top-22)+'H'+(vx+20)+'" stroke="#c0392b" stroke-width="5" stroke-linecap="round"/><circle cx="'+vx+'" cy="'+(top-9)+'" r="10" fill="url(#gMetal)" stroke="#27303b" stroke-width="1.5"/><rect x="'+(vx-16)+'" y="'+(top-4)+'" width="32" height="5" rx="2" fill="url(#gDark)"/>';
      else ic='<path d="M'+(vx-15)+' '+top+'v-4q0 -10 10 -10h10q10 0 10 10v4z" fill="url(#gMetal)" stroke="#27303b" stroke-width="1.5"/><path d="M'+(vx-6)+' '+(top-10)+'h10l-3 -4m3 4l-3 4" stroke="#c0392b" stroke-width="2" fill="none"/><rect x="'+(vx-17)+'" y="'+(top-4)+'" width="34" height="5" rx="2" fill="url(#gDark)"/>';
      o.push('<g>'+ic+'</g>');
      var late=(vx+9+300*tsf>DW);o.push('<text class="t tl" x="'+(late?vx-9:vx+9)+'" y="'+ry+'"'+(late?' text-anchor="end"':'')+'>'+esc(vName(i))+'<tspan class="va" data-i="'+i+'"></tspan><tspan class="vr" data-i="'+i+'"></tspan></text></g>');
    });
    // length dimension
    var ly=bot+26*tsf+bo+ro, stk=(tsf>=1.4||!gl);
    if(!gl)o.push('<path class="dl" d="M'+x0+' '+ly+'H'+x1+'M'+x0+' '+(ly-6)+'v12M'+x1+' '+(ly-6)+'v12"/>');
    if(!gl)o.push('<text class="t tb" x="'+(x0+360)+'" y="'+(ly-10)+'" text-anchor="middle">'+tr('Length')+' '+(isFinite(vals.len)?+vals.len.toFixed(2):'?')+' '+tr(['km','m'][+S.lenu])+'</text>');
    if(!gl&&vals.len>0){
      var ppu=W/vals.len, st=1, bases=[1,2,5], k=0, minPx=170*tsf;
      while(true){var cand=bases[k%3]*Math.pow(10,Math.floor(k/3)-3);if(cand*ppu>=minPx&&vals.len/cand<=400){st=cand;break}k++;if(k>40)break}
      for(var mv=0;mv<=vals.len+1e-9;mv+=st/5){var mx=x0+mv*ppu;o.push('<path class="dl" d="M'+mx+' '+(ly-3)+'v6"/>')}
      for(var tv=0;tv<=vals.len+1e-9;tv+=st){var tx=x0+tv*ppu;o.push('<path class="dl" d="M'+tx+' '+(ly-6)+'v12"/><text class="t tm" x="'+tx+'" y="'+(ly+22*tsf)+'" text-anchor="middle">'+(+tv.toFixed(6))+'</text>')}
    }
    if(gl){
      var lenTxt=(isFinite(vals.len)?+vals.len.toFixed(2):'?')+' '+tr(['km','m'][+S.lenu]);
      o.push('<g id="ghost" style="display:none;pointer-events:none"><circle r="12" fill="none" stroke="#378ADD" stroke-width="1.5" stroke-dasharray="3 3"/><text y="6" text-anchor="middle" font-size="18" fill="#378ADD">+</text><text class="t tl ghl" y="'+(34*tsf)+'" text-anchor="middle" style="fill:#378ADD"></text></g>');
      o.push('<text class="t tm bt" x="'+x0+'" y="'+(cy-46*tsf)+'">'+tr('Launch')+'</text><text class="t tm bt" x="'+x1+'" y="'+(cy-46*tsf)+'" text-anchor="end">'+tr('Receiver')+'</text>');
      o.push('<text class="t tm bt" x="'+x0+'" y="'+(cy+34*tsf)+'" text-anchor="middle">0</text><text class="t tm bt" x="'+x1+'" y="'+(cy+34*tsf)+'" text-anchor="middle">'+lenTxt+'</text>');
    }
    var outS=o.join('');if(ds){outS=themeBg(ds,DW,DH,pa,pb,cy,HB,gl)+themed(outS,ds)}
    svg.classList.remove('st1','st2');if(ds)svg.classList.add('st'+ds);
    svg.innerHTML=outS;
    window.__p=0;window.__xf=0;window.__dg={cy:cy,DW:DW,local:!gl,x0:x0,x1:x1,tw:tw,hours:(r&&r.hours>0)?r.hours:null,prof:(r&&r.prof)||null,vavg:(r&&r.v>0)?r.v/3.6:0,od:vals.od,valves:(vals.valves||[]).map(function(v,i){return {i:i,frac:v.frac,tf:v.tf,ok:v.ok}})};
    var L0=num('len');$('tDist').textContent='0 / '+(L0>0?fmt(L0,L0<10?2:1):'–')+' '+tr(['km','m'][+S.lenu]);
    $('startBtn').disabled=!window.__dg.hours;
    if(window.drawMinimap)window.drawMinimap();
    updateValveClocks();
  }
  function setValves(vals,r){
    var len=vals.len, rows=$('vlist').children;
    vals.valves=S.valves.map(function(p,i){
      var s=String(p).trim().replace(',','.'),pos=/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)?parseFloat(s):NaN,o={ok:false,eta:null,msg:''};
      if(isNaN(pos))o.msg=tr('Enter a number');
      else if(!(len>0))o.msg='–';
      else if(pos<0||pos>len)o.msg=tr('Outside the line');
      else{o.ok=true;o.frac=pos/len;o.tf=PSC.tAt(r&&r.prof,o.frac);if(r&&r.hours!==null)o.eta=PSC.fmtDur(r.hours*o.tf)}
      var el=rows[i]&&rows[i].querySelector('.veta');
      if(el){el.textContent=o.ok?(o.eta||'–'):o.msg;el.classList.toggle('bad',!o.ok&&o.msg!=='–'&&p!=='')}
      var pin=rows[i]&&rows[i].querySelector('input:not(.vname)');if(pin){var badv=!o.ok&&o.msg!=='–'&&p!=='';pin.classList.toggle('bad',badv);pin.title=badv?o.msg:''}
      return o;
    });
  }
  function renderFormulas(r,vals){
    var b=$('fmlBody');if(!b)return;
    var live=S.fmode!==0,ru=S.lang==='ru';
    [].forEach.call(document.querySelectorAll('#fmode button'),function(x){x.classList.toggle('on',(+x.dataset.m===1)===live)});
    if(!r||!(r.v>0)){b.innerHTML='<p>'+(ru?'Введите данные, чтобы увидеть формулы с вашими числами.':'Enter the inputs to see the formulas with your numbers.')+'</p>';return}
    var f=S.fluid,o=[],hasGas=f===0||(f===2&&vals.gor>0);
    function m(s){return s.replace(/_\(((?:[^()]|\([^()]*\))*)\)/g,'<sub>$1</sub>').replace(/\^\(((?:[^()]|\([^()]*\))*)\)/g,'<sup>$1</sup>').replace(/~([^~]+)~/g,'<i>$1</i>')}
    function fr(n,d){return '<span class="fr"><span>'+n+'</span><span>'+d+'</span></span>'}
    function rt(x){return '<span class="rt">√<span>'+x+'</span></span>'}
    function nv(k,t){return '<u class="nv" data-nf="'+k+'">'+t+'</u>'}
    function sec(t){o.push('<h4>'+t+'</h4>')}
    function ln(sym,num){o.push('<div class="fl">'+m(live&&num!=null?num:sym)+'</div>')}
    function nt(t){o.push('<p>'+t+'</p>')}
    function lg(en,rus){if(!live)o.push('<p class="lg">'+(ru?rus:en)+'</p>')}
    var idm=vals.od-2*vals.wt,A=Math.PI*Math.pow(idm/1000,2)/4,q=r.qline*3600,sl=parseFloat(String(S.slip).replace(',','.'))||100;
    var Pp=Math.abs(num('p')||0)*[0.145038,145.038,1,14.5038][+S.pu]+(S.atm?14.696:0),TF=(+S.tu)?(num('t')||0)-459.67:(num('t')||0)*9/5+32,TRk=TF+459.67,Tsd=[519.67,518.67,527.67][+S.std]||519.67;
    var qs=r.f>0?q/r.f:0,Po=num('pout')>0?Math.abs(num('pout'))*[0.145038,145.038,1,14.5038][+S.pu]+(S.atm?14.696:0):Pp;
    nt(ru?'<b>Почему скорость падает при росте давления?</b> Расход задан при стандартных условиях. Чем выше давление, тем плотнее среда и тем меньший объём в трубе занимает тот же стандартный расход, поэтому поток и шаровой разделитель движутся медленнее. У газа эффект почти обратно пропорционален давлению (1/P), у нефти заметно слабее: жидкость почти не сжимается.'
      :'<b>Why does speed drop when pressure rises?</b> The flow is fixed at standard conditions. At higher pressure the fluid is denser, so the same standard flow takes up less volume in the pipe and the flow, with the pig, moves slower. For gas the effect is almost proportional to 1/P; for oil it is much weaker because liquid barely compresses.');
    sec(ru?'Скорость':'Speed');
    ln('~d~_(in) = ~OD~ − 2·~WT~','~d~_(in) = '+nv('od',fmt(vals.od,1))+' − 2·'+nv('wt',fmt(vals.wt,2))+' = '+fmt(idm,1)+' mm');
    ln('~A~ = '+fr('π·~d~_(in)^(2)','4'),'~A~ = '+fr('π·'+fmt(idm,1)+'^(2)','4')+' = '+fmt(A,4)+' m^(2)');
    ln('~v~ = '+fr('~Q~_(line)','~A~'),'~v~ = '+fr(fmt(q,1)+' m^(3)/h','3600·'+fmt(A,4)+' m^(2)')+' = <b>'+fmt(q/3600/A,3)+' m/s</b>');
    if(sl<100)ln('~v~_(pig) = ~s~·~v~','~v~_(pig) = '+nv('slip',sl+' %')+' · '+fmt(q/3600/A,3)+' = '+fmt(q/3600/A*sl/100,3)+' m/s');
    lg('OD outside diameter, WT wall thickness, d_in inner diameter, A flow area, Q_line flow at line conditions, s slip.','OD — наружный диаметр, WT — стенка, d_in — внутренний диаметр, A — площадь сечения, Q_line — расход при рабочих условиях, s — проскальзывание.');
    sec(ru?'Объём в трубе':'Volume in the line');
    if(f===0){
      ln('~Q~_(line) = ~Q~_(std) · '+fr('~P~_(std)','~P~')+' · '+fr('~T~','~T~_(std)')+' · ~Z~',
        '~Q~_(line) = '+nv('flow',fmt(qs,1))+' · '+fr('14.696',nv('p',fmt(Pp,1)))+' · '+fr(nv('t',fmt(TRk,1)),fmt(Tsd,2))+' · '+r.z.toFixed(3)+' = '+fmt(q,1)+' m^(3)/h');
      ln('~T~_(pc) = 169.2 + 349.5·~g~ − 74.0·~g~^(2)','~T~_(pc) = 169.2 + 349.5·'+nv('sg',fmt(vals.sg,3))+' − 74.0·'+fmt(vals.sg,3)+'^(2) = '+fmt(169.2+349.5*vals.sg-74*vals.sg*vals.sg,1)+' °R');
      ln('~P~_(pc) = 756.8 − 131.0·~g~ − 3.6·~g~^(2)','~P~_(pc) = 756.8 − 131.0·'+fmt(vals.sg,3)+' − 3.6·'+fmt(vals.sg,3)+'^(2) = '+fmt(756.8-131*vals.sg-3.6*vals.sg*vals.sg,1)+' psia');
      ln('~T~_(pr) = '+fr('~T~','~T~_(pc)')+', &nbsp;~P~_(pr) = '+fr('~P~','~P~_(pc)')+', &nbsp;~Z~ = ~Z~_(DAK)(~T~_(pr), ~P~_(pr))',
        '~Z~ = ~Z~_(DAK)(~T~_(pr), ~P~_(pr)) = <b>'+r.z.toFixed(3)+'</b>, &nbsp;'+fr('~Q~_(line)','~Q~_(std)')+' = '+r.f.toPrecision(4));
      lg('Q_std flow at standard conditions, P and T absolute, Z compressibility factor (Dranchuk–Abou-Kassem), g gas specific gravity, pc / pr pseudo-critical / pseudo-reduced (Sutton).','Q_std — расход при стандартных условиях, P и T — абсолютные, Z — коэффициент сжимаемости (Дранчук — Абу-Кассем), g — относительная плотность газа, pc / pr — псевдокритические / приведённые (Саттон).');
    }else if(!hasGas){
      var rho=141.5/(131.5+(vals.api||35))*999.016,al=341.0957/(rho*rho),dT=TF-60,vcf=Math.exp(-al*dT*(1+0.8*al*dT));
      ln('~Q~_(line) = '+fr('~Q~_(std)','VCF')+' · e^(−~c~_(o)(~P~ − ~P~_(std)))','~Q~_(line) = '+fr(nv('flow',fmt(qs,1)),vcf.toFixed(4))+' · e^(−~c~_(o)('+nv('p',fmt(Pp,1))+' − 14.696)) = '+fmt(q,1)+' m^(3)/h');
      ln('VCF = exp[−~α~Δ~T~(1 + 0.8·~α~Δ~T~)], &nbsp;Δ~T~ = ~T~ − 60 °F','VCF = '+vcf.toFixed(4)+', &nbsp;Δ~T~ = '+nv('t',fmt(TF,1))+' − 60 = '+fmt(dT,1)+' °F');
      ln('~α~ = '+fr('341.0957','~ρ~_(60)^(2)')+', &nbsp;4·10^(−6) ≤ ~c~_(o) ≤ 3·10^(−5) psi^(−1)','~α~ = '+fr('341.0957',fmt(rho,1)+'^(2)')+' = '+al.toExponential(3)+', &nbsp;~ρ~_(60) = '+fmt(rho,1)+' kg/m^(3) ('+nv('api',fmt(vals.api,1)+' °API')+')');
      lg('Q_std flow at standard conditions, VCF volume correction factor (API MPMS 11.1), α thermal expansion coefficient, ρ_60 density at 60 °F, c_o oil compressibility (Vazquez–Beggs).','Q_std — расход при стандартных условиях, VCF — поправка на объём (API MPMS 11.1), α — коэффициент теплового расширения, ρ_60 — плотность при 60 °F, c_o — сжимаемость нефти (Васкес — Беггс).');
    }else{
      ln('~Q~_(line) = ~Q~_(std) · [~B~_(o) + (GOR − ~R~_(s)) · '+fr('~B~_(g)','5.6146')+']','~Q~_(line) = '+fmt(qs,1)+' · '+r.f.toPrecision(4)+' = '+fmt(q,1)+' m^(3)/h');
      ln('~R~_(s) = ~g~ · [('+fr('~P~','18.2')+' + 1.4) · 10^(0.0125·API − 0.00091·~T~)]^(1.2048)','~g~ = '+nv('sg',fmt(vals.sg,3))+', API = '+nv('api',fmt(vals.api,1))+', GOR = '+nv('gor',fmt(vals.gor,0))+', ~P~ = '+nv('p',fmt(Pp,1))+' psia, ~T~ = '+nv('t',fmt(TF,1))+' °F');
      ln('~B~_(o) = 0.9759 + 0.00012 · [~R~_(s) · '+rt(fr('~g~','~g~_(o)'))+' + 1.25·~T~]^(1.2)','~Z~ = '+(r.z!=null?r.z.toFixed(3):'–')+', &nbsp;'+fr('~Q~_(line)','~Q~_(std)')+' = '+r.f.toPrecision(4));
      ln('~B~_(g) = '+fr('~P~_(std)','~T~_(std)')+' · '+fr('~Z~·~T~','~P~'),null);
      ln('~P~ ≥ ~P~_(b): &nbsp;~B~_(o) = ~B~_(ob) · e^(~c~_(o)(~P~_(b) − ~P~))',null);
      lg('GOR gas-oil ratio, R_s dissolved gas, B_o oil and B_g gas formation volume factors, P_b bubble-point pressure, g_o oil specific gravity (Standing).','GOR — газовый фактор, R_s — растворённый газ, B_o и B_g — объёмные коэффициенты нефти и газа, P_b — давление насыщения, g_o — относительная плотность нефти (Стэндинг).');
    }
    sec(ru?'Давление по линии и время':'Pressure along the line and time');
    ln(hasGas?'~P~(~x~)^(2) = ~P~_(1)^(2) − (~P~_(1)^(2) − ~P~_(2)^(2))·~x~':'~P~(~x~) = ~P~_(1) − (~P~_(1) − ~P~_(2))·~x~',
       hasGas?'~P~(~x~)^(2) = '+fmt(Pp,1)+'^(2) − ('+fmt(Pp,1)+'^(2) − '+nv('pout',fmt(Po,1))+'^(2))·~x~':'~P~(~x~) = '+fmt(Pp,1)+' − ('+fmt(Pp,1)+' − '+nv('pout',fmt(Po,1))+')·~x~');
    ln('~t~ = <span class="int">∫<sub>0</sub><sup>~L~</sup></span> '+fr('d~x~','~v~(~P~(~x~))'),'~t~ = <span class="int">∫<sub>0</sub><sup>'+nv('len',fmt(vals.len,1))+'</sup></span> '+fr('d~x~','~v~(~P~(~x~))')+' = <b>'+PSC.fmtDur(r.hours)+'</b>');
    ln('~v~_(in) → ~v~_(out)','~v~_(in) → ~v~_(out) = '+fmt(r.vin/3.6,2)+' → '+fmt(r.vout/3.6,2)+' m/s');
    ln('~Q~_(target) = ~Q~_(std) · '+fr('~v~_(target)','~v~'),'~Q~_(target) = '+fmt(qs,1)+' · '+fr(nv('rv',fmt(num('rv')||0,2)),fmt(r.v/3.6,3))+' (m/s)');
    lg('P_1, P_2 inlet / outlet pressure, x fraction of the line length, L length, v_target target speed.','P_1, P_2 — давление на входе / выходе, x — доля длины линии, L — длина, v_target — целевая скорость.');
    b.innerHTML=o.join('');
  }
  function kst(a,b,c){[['vel',a],['dur',b],['rflow',c]].forEach(function(p){var k=$(p[0]).closest('.kpi');k.classList.remove('st-ok','st-warn','st-bad');if(p[1])k.classList.add('st-'+p[1])})}
  var catOpen=false;
  function update(){
    var f=S.fluid, bad=false;
    $('pL').textContent=tr(S.atm?'Pressure (gauge)':'Pressure (absolute)');
    $('poutU').textContent=tr(['kPa','MPa','psi','bar'][+S.pu]);$('pout').placeholder=tr('same as inlet');
    var rules={od:'>0',wt:'>0',len:'>0',flow:'>0',rv:'>0'};
    rules.p='>0';
    rules.t='any';rules.pout='>0';if(f!==1)rules.sg='>0';if(f!==0)rules.api='>0';if(f===2)rules.gor='>0';
    ['od','wt','len','flow','rv','p','pout','t','sg','api','gor'].forEach(function(k){
      var m='';
      if((k==='flow'||k==='rv'||k==='pout')&&String(S[k]).trim()===''){setErr(k,'');return}
      if(rules[k]){var v=num(k);
        if(isNaN(v))m=tr('Enter a number');
        else if(rules[k]==='>0'&&v<=0)m=tr('Must be greater than zero');}
      setErr(k,m);if(m)bad=true;
    });
    $('title').textContent=(S.name||'').trim();
    var w=$('warn');w.style.display='none';
    var out=['vel','dur','rflow'];
    function blank(){out.forEach(function(id){$(id).textContent='–'})}
    var vals={od:num('od'),wt:wtmm(),wtRaw:num('wt'),len:num('len'),p:num('p'),t:num('t'),sg:num('sg'),api:num('api'),gor:num('gor'),flow:num('flow'),rv:num('rv')};
    var noFlow=String(S.flow).trim()==='',noRv=String(S.rv).trim()==='';
    if(bad||noFlow){$('cat').innerHTML='';$('rrange').textContent='';$('rlo').textContent='';$('rz').style.width='0';$('rmk').style.left='-10px';kst('','','');blank();setValves(vals,null);drawDiagram(null,vals);renderFormulas(null,vals);return}
    var r=PSC.calc({fluid:f,od:num('od'),wt:num('wt'),wtu:+S.wtu,len:num('len'),lenu:+S.lenu,flow:num('flow'),
      oilu:+S.oilu,gasu:+S.gasu,p:num('p')||0,pout:num('pout')||0,atm:!!S.atm,std:+S.std,slip:parseFloat(String(S.slip).replace(',','.'))||100,pu:+S.pu,t:num('t')||0,tu:+S.tu,sg:num('sg')||0,api:num('api')||0,gor:num('gor')||0,
      rv:noRv?1:num('rv'),rvu:+S.rvu,rgasu:+S.rgasu,roilu:+S.roilu});
    if(r.error){blank();setValves(vals,null);drawDiagram(null,vals);renderFormulas(null,vals);w.textContent=r.error==='out_gt_in'?tr('Outlet pressure cannot be higher than inlet pressure.'):tr(r.error)+tr(': the inner diameter must be at least 1 mm.');w.style.display='block';return}
    var vu=tr(['m/s','mph','km/h'][S.velu]);
    $('vel').innerHTML=r.v>0?fmt(PSC.velOut(r.v,+S.velu),3)+' <small>'+vu+'</small>':'–';
    $('dur').textContent=r.hours!==null?PSC.fmtDur(r.hours):'–';
    setValves(vals,r);drawDiagram(r,vals);renderFormulas(r,vals);
    var ru=tr((f===0?GAS_U:OIL_U)[f===0?S.rgasu:S.roilu]);
    (function(){
      var L=CAT.lim,W=[],odv=num('od'),vavg=r.v/3.6,vmax=Math.max(r.vin||0,r.vout||0)/3.6,vmin=Math.min(r.vin||1e9,r.vout||1e9)/3.6;
      if(vmin<L.vmin)W.push(tr('Speed below the tool limit')+': '+fmt(vmin,2)+' < '+String(L.vmin).replace('.',S.lang==='ru'?',':'.')+' '+tr('m/s'));
      if(vmax>L.vmax)W.push(tr('Speed above the tool limit')+': '+fmt(vmax,2)+' > '+L.vmax+' '+tr('m/s'));
      if(r.hours>L.hours)W.push(tr('Trip longer than the tool can run')+': '+Math.round(r.hours)+' > '+L.hours+' '+tr('h'));
      var km=num('len')*[1,0.001][+S.lenu];if(km>L.km)W.push(tr('Line longer than the tool range')+': '+fmt(km,1)+' > '+L.km+' '+tr('km'));
      var barG=null;
      var Pbar=function(pv){return (Math.abs(pv)*[0.01,10,0.0689476,1][+S.pu])+(S.atm?1.01325:0)};
      var pin=Pbar(num('p')||0),pout=(num('pout')>0)?Pbar(num('pout')):pin;
      if(Math.max(pin,pout)>L.pmax||Math.min(pin,pout)<L.pmin)W.push(tr('Pressure outside the tool limits')+': '+L.pmin+'-'+L.pmax+' '+tr('bar'));
      if(f!==1&&Math.min(pin,pout)<L.pgas)W.push(tr('Gas pressure below the tool limit')+': < '+L.pgas+' '+tr('bar'));
      var tc=+S.tu?((num('t')-459.67-32)*5/9):num('t');
      if(tc<L.tmin||tc>L.tmax)W.push(tr('Temperature outside the tool limits')+': '+L.tmin+'...'+L.tmax+' °C');
      var odm=odv,idm=odv-2*wtmm();
      if(odm>0&&idm/odm<L.minId[toolKind()])W.push(tr('Pipe bore too small for the tool'));
      r.notes.forEach(function(k){W.push(tr(k==='z_range'?'Z factor correlation used outside its best range, result is approximate.':'Standing oil correlation used outside its tested range (API 16.5-63.8, GOR 20-1425 scf/STB), result is approximate.'))});
      var sc=Math.max(L.vmax*1.5,vmax*1.1,0.01),pc=function(x){return Math.max(0,Math.min(100,x/sc*100))};
      $('rz').style.left=pc(L.vmin)+'%';$('rz').style.width=(pc(L.vmax)-pc(L.vmin))+'%';$('rmk').style.left=pc(vavg)+'%';
      $('rlo').textContent=tr('Allowed')+': '+String(L.vmin).replace('.',S.lang==='ru'?',':'.')+'–'+L.vmax+' '+tr('m/s');
      var spdBad=(vmin<L.vmin||vmax>L.vmax),durBad=(r.hours>L.hours||km>L.km);
      var box=$('cat');box.innerHTML='';
      var one=function(c,t){var d=document.createElement('div');d.className=c;d.textContent=t;box.appendChild(d)};
      if(W.length){
        var cb=document.createElement('button');cb.type='button';cb.className='wn';cb.textContent='⚠ '+W[0]+(W.length>1?'  +'+(W.length-1):'');box.appendChild(cb);
        if(W.length>1){var wl=document.createElement('div');wl.className='wl';wl.style.display=catOpen?'':'none';W.slice(1).forEach(function(t){var d=document.createElement('div');d.textContent='⚠ '+t;wl.appendChild(d)});box.appendChild(wl);cb.onclick=function(){catOpen=!catOpen;wl.style.display=catOpen?'':'none'}}
      }else one('ok','✓ '+tr('Within equipment limits'));
      var hint='',tgtBad=false;
      if(!noRv&&r.rq>0){var rvm=num('rv')*[1,1.609344/3.6,1/3.6][+S.rvu];if(rvm>0){var q0=r.rq*L.vmin/rvm,q1=r.rq*L.vmax/rvm;hint=tr('Allowed flow')+': '+fmt(q0,q0<10?2:0)+' – '+fmt(q1,q1<10?2:0)+' '+ru;tgtBad=(rvm<L.vmin||rvm>L.vmax)}}
      $('rrange').textContent=hint;
      kst(spdBad?'bad':(W.length?'warn':'ok'),durBad?'bad':'ok',tgtBad?'bad':'ok');
    })();
    $('rflow').innerHTML=(r.rq!==null&&!noRv)?fmt(r.rq,3)+' <small>'+ru+'</small>':'–';
  }

  IDS.forEach(function(id){
    $(id).addEventListener(NUMERIC[id]?'change':'input',function(){
      S[id]=NUMERIC[id]?+this.value:this.value;
      if(id==='flow')S.flowTouched=true;
      if(id==='dstyle')S.dstyleTouched=true;
      if(id==='lenu')renderValves();
      save();update();
    });
  });
  $('tscale').addEventListener('input',function(){S.tscale=+this.value;$('tscaleV').textContent=S.tscale+'%';save();update()});
  // saved pipe sections
  var SKEY='pigSpeedCalc.sections.v1',SAVED=[],SNAP=['fluid','name','od','wt','wtu','len','lenu','p','pu','t','tu','sg','api','gor','flow','gasu','oilu','rv','rvu','velu','rgasu','roilu','valves','vnames','vt'];
  try{SAVED=JSON.parse(localStorage.getItem(SKEY)||'[]')||[]}catch(e){SAVED=[]}
  function persistSections(){try{localStorage.setItem(SKEY,JSON.stringify(SAVED))}catch(e){}}
  function renderSections(){
    var box=$('secList');box.innerHTML='';
    if(!SAVED.length){var e=document.createElement('div');e.className='hint';e.textContent=tr('No saved sections yet.');box.appendChild(e);return}
    SAVED.forEach(function(it,i){
      var d=document.createElement('div');d.className='sitem';
      var info=document.createElement('div');info.className='si';
      var n=document.createElement('div');n.className='sn';n.textContent=it.name;
      var s=document.createElement('div');s.className='sd';
      var k=it.data;
      s.textContent=tr(['Gas','Oil','Oil + gas'][k.fluid||0])+' · Ø '+k.od+' '+tr('mm')+' · '+k.len+' '+tr(['km','m'][+k.lenu||0])+(k.valves&&k.valves.length?' · '+k.valves.length+' '+tr('valves'):'');
      info.appendChild(n);info.appendChild(s);
      var o=document.createElement('button');o.type='button';o.textContent=tr('Open');
      o.addEventListener('click',function(){loadSection(it.data);$('secPanel').classList.remove('open');$('secBtn').setAttribute('aria-expanded','false')});
      var x=document.createElement('button');x.type='button';x.className='del';x.textContent='×';x.setAttribute('aria-label','Delete');
      x.addEventListener('click',function(){SAVED.splice(i,1);persistSections();renderSections()});
      d.appendChild(info);d.appendChild(o);d.appendChild(x);box.appendChild(d);
    });
  }
  function loadSection(snap){
    SNAP.forEach(function(k){if(k in snap)S[k]=Array.isArray(snap[k])?snap[k].slice():snap[k]});
    S.vt=Array.isArray(S.vt)?S.vt:[];while(S.vt.length<S.valves.length)S.vt.push(1);
    S.flowTouched=true;toUI();applyLang();save();update();
  }
  $('secSave').addEventListener('click',function(){
    var snap={};SNAP.forEach(function(k){snap[k]=Array.isArray(S[k])?S[k].slice():S[k]});
    var name=(S.name||'').trim()||(tr('Section')+' '+(SAVED.length+1)),at=-1;
    SAVED.forEach(function(it,i){if(it.name===name)at=i});
    var rec={name:name,at:Date.now(),data:snap};
    if(at>=0)SAVED[at]=rec;else SAVED.unshift(rec);
    persistSections();renderSections();
    var m=$('secMsg');m.textContent=tr('Saved')+': '+name;setTimeout(function(){m.textContent=''},2500);
  });
  $('saveBtn').addEventListener('click',function(){var b=this;$('secSave').click();b.classList.add('ok');setTimeout(function(){b.classList.remove('ok')},1500)});
  $('secBtn').addEventListener('click',function(e){e.stopPropagation();var o=$('secPanel').classList.toggle('open');this.setAttribute('aria-expanded',String(o));$('gpanel').classList.remove('open');$('gearBtn').setAttribute('aria-expanded','false')});
  $('gearBtn').addEventListener('click',function(e){e.stopPropagation();var o=$('gpanel').classList.toggle('open');this.setAttribute('aria-expanded',String(o));$('secPanel').classList.remove('open');$('secBtn').setAttribute('aria-expanded','false')});
  document.addEventListener('click',function(e){if(!e.target.closest('.sec')){$('secPanel').classList.remove('open');$('secBtn').setAttribute('aria-expanded','false')}});
  document.addEventListener('click',function(e){if(!e.target.closest('.gear')){$('gpanel').classList.remove('open');$('gearBtn').setAttribute('aria-expanded','false')}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){$('secPanel').classList.remove('open');$('secBtn').setAttribute('aria-expanded','false');$('gpanel').classList.remove('open');$('gearBtn').setAttribute('aria-expanded','false')}});
  $('viewSeg').addEventListener('click',function(e){var l=e.target.closest('.vl');if(l)setView(+l.dataset.v);else if(e.target.closest('#viewSw'))setView(S.view===1?0:1)});
  $('atm').addEventListener('change',function(){S.atm=this.checked;save();update()});
  $('alert').addEventListener('change',function(){S.alert=this.checked;save();if(this.checked)primeAlerts()});
  $('leadSel').addEventListener('change',function(){S.lead=+this.value;save()});
  $('arrBtn').addEventListener('click',finishRun);
  $('logOk').addEventListener('click',confirmLog);
  $('logCancel').addEventListener('click',closeLog);
  ['logAt','logLaunch'].forEach(function(id){$(id).addEventListener('keydown',function(e){if(e.key==='Enter')confirmLog();else if(e.key==='Escape')closeLog()})});
  $('repBtn').addEventListener('click',function(e){e.stopPropagation();$('repPanel').classList.toggle('open');$('secPanel').classList.remove('open');$('gpanel').classList.remove('open')});
  document.addEventListener('click',function(e){if(!e.target.closest('.rep'))$('repPanel').classList.remove('open')});
  $('repPrint').addEventListener('click',function(){fillPrintHead();$('repPanel').classList.remove('open');window.print()});
  $('repCsv').addEventListener('click',function(){$('repPanel').classList.remove('open');downloadCsv()});
  $('secExp').addEventListener('click',exportAll);
  $('secImp').addEventListener('click',function(){$('secFile').click()});
  $('secFile').addEventListener('change',importAll);
  $('startBtn').addEventListener('click',animStart);
  $('pbSel').addEventListener('change',function(){S.pb=+this.value;save();update()});
  $('toolSel').addEventListener('change',function(){var v=+this.value;S.toolOn=v>=0;if(v>=0)S.tool=v;save();update()});
  $('lang').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;S.lang=b.dataset.v;save();ensureOd();$('od').value=S.od;renderValves();applyLang();renderSections();setFluid(S.fluid,true);update()});
  $('fluid').addEventListener('click',function(e){var b=e.target.closest('button');if(b)setFluid(+b.dataset.v)});
  $('vadd').addEventListener('click',function(){keepRun(function(){var L=num('len');S.valves.push(L>0?String(+(L/2).toFixed(3)):'');S.vt.push(1);S.vnames.push('');save();renderValves();update()})});
  $('reset').addEventListener('click',function(){var lg=S.lang;S={};for(var k in DEF)S[k]=DEF[k];S.lang=lg;S.valves=[];S.vt=[];S.vnames=[];S.flowTouched=false;flowDefault(S.fluid);toUI();save();update()});

  // horizontal pan of the long local view, valve dragging (before Start only), overview map
  (function(){
    var svg=$('dg'),BW=900,BH=255,VW=900,VB={x:0},pd=null,vd=null;
    function apply(){
      VB.x=Math.max(0,Math.min(Math.max(0,BW-VW),VB.x));
      svg.setAttribute('viewBox',VB.x.toFixed(1)+' 0 '+VW+' '+BH);
      svg.classList.toggle('pan',BW>VW+1);
      window.__vbx=VB.x;window.__vw=VW;
      if(window.drawMinimap)window.drawMinimap();
    }
    window.dgBase=function(w,hh,vw){BW=w;BH=hh;VW=vw||w;VB={x:0};apply()};
    window.dgPan=function(x){VB.x=x;apply()};
    window.dgFollow=function(px){if(BW<=VW+1)return;if(px>VB.x+VW*0.95||px<VB.x+VW*0.02)window.dgPan(px-VW*0.05)};
    function pt(e){var r=svg.getBoundingClientRect();return {x:VB.x+(e.clientX-r.left)/r.width*VW}}
    function vmove(e){
      var len=num('len');if(!(len>0))return;
      var x0=+svg.dataset.x0,x1=+svg.dataset.x1,fr=Math.max(0,Math.min(1,(pt(e).x-x0)/(x1-x0)));
      S.valves[vd]=String(+(fr*len).toFixed(3));
      var row=$('vlist').children[vd];if(row)row.querySelector('input:not(.vname)').value=S.valves[vd];
      update();
    }
    svg.addEventListener('pointerdown',function(e){
      var g=e.target.closest&&e.target.closest('.vg');
      if(g&&!anim){vd=+g.dataset.v;window.__vdrag=vd;svg.setPointerCapture(e.pointerId);e.preventDefault();return}
      if(!g&&ghostOn){addAt(ghostFrac);ghostOn=false;e.preventDefault();return}
      if(!g&&BW>VW+1){pd={x:e.clientX,vx:VB.x};window.__userPan=true;svg.setPointerCapture(e.pointerId);svg.classList.add('drag')}
    });
    var ghostOn=false,ghostFrac=0;
    function addAt(fr){
      var len=num('len');if(!(len>0))return;
      S.valves.push(String(+(fr*len).toFixed(2)));S.vt.push(1);S.vnames.push('');save();renderValves();update();sortValves();
    }
    function ghostUpdate(e){
      var gh=svg.querySelector('#ghost'),dg=window.__dg;
      if(!gh||!dg||dg.local||anim||vd!==null||pd||(e.target.closest&&e.target.closest('.vg'))){ghostOn=false;if(gh)gh.style.display='none';svg.style.cursor='';return}
      var r=svg.getBoundingClientRect(),x=pt(e).x,y=(e.clientY-r.top)/r.height*BH,len=num('len');
      var near=Math.abs(y-dg.cy)<44&&x>=dg.x0-6&&x<=dg.x1+6&&len>0;
      if(!near){ghostOn=false;gh.style.display='none';svg.style.cursor='';return}
      ghostFrac=Math.max(0,Math.min(1,(x-dg.x0)/(dg.x1-dg.x0)));ghostOn=true;
      gh.setAttribute('transform','translate('+(dg.x0+ghostFrac*(dg.x1-dg.x0))+' '+dg.cy+')');gh.style.display='';
      gh.querySelector('.ghl').textContent=fmt(ghostFrac*len,2)+' '+tr(['km','m'][+S.lenu])+' · '+tr('click to add');svg.style.cursor='copy';
    }
    svg.addEventListener('pointerleave',function(){ghostOn=false;var gh=svg.querySelector('#ghost');if(gh)gh.style.display='none';svg.style.cursor=''});
    svg.addEventListener('pointermove',function(e){
      ghostUpdate(e);
      if(vd!==null){vmove(e);return}
      if(pd){var r=svg.getBoundingClientRect();VB.x=pd.vx-(e.clientX-pd.x)/r.width*VW;apply()}
    });
    function end(){if(vd!==null){vd=null;window.__vdrag=undefined;save();update()}pd=null;svg.classList.remove('drag')}
    svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
    ['dragstart','selectstart'].forEach(function(n){svg.addEventListener(n,function(e){e.preventDefault()});$('mm').addEventListener(n,function(e){e.preventDefault()})});
    svg.addEventListener('mousedown',function(e){e.preventDefault()});$('mm').addEventListener('mousedown',function(e){e.preventDefault()});
    // overview map: click or drag to jump along the line
    var mm=$('mm');
    function mmGo(e){var g=window.__dg;if(!g||!g.local)return;var r=mm.getBoundingClientRect();window.__userPan=true;window.dgPan((e.clientX-r.left)/r.width*g.DW-VW/2)}
    mm.addEventListener('pointerdown',function(e){mm.setPointerCapture(e.pointerId);mmGo(e)});
    mm.addEventListener('pointermove',function(e){if(e.buttons)mmGo(e)});
  })();

  load();toUI();applyLang();update();renderSections();renderHist();restoreRun();setInterval(updateValveClocks,500);
  // the global view is sized to the screen: redraw when the window width changes (a running pig keeps going)
  (function(){var t=null,w=window.innerWidth;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(function(){if(window.innerWidth===w||S.view!==1)return;w=window.innerWidth;var run=snapRun();update();if(run)resumeAnim(run)},250)})})();
})();
