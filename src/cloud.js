/* Team cloud (Firebase: Authentication + Firestore). Loaded lazily from Google's CDN, only when a Firebase config is built in.
   window.Cloud is a thin adapter so the UI never touches Firebase directly:
     Cloud.available()                  config present?
     Cloud.start(cb)                    connect; cb({status,user,role,error}) on every change
       status: 'out' | 'verify' | 'nomember' | 'member' | 'offline'
     Cloud.signIn / signUp / google / signOut / reset / resendVerify / refresh
     Cloud.watchRuns(cb(runs, changes)) -> unsubscribe
     Cloud.saveRun(run) / Cloud.deleteRun(id)
     Cloud.watchMembers(cb) / setRole / removeMember / watchInvites(cb) / addInvite / delInvite */
window.Cloud = (function () {
  var mock = /[?&]mock=([^&]+)/.exec(location.search);
  if (mock) return mockCloud(decodeURIComponent(mock[1]));
  var cfg = window.FIREBASE_CONFIG, team = window.TEAM_ID || 'main';
  var CDN = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var auth = null, db = null, ready = null, cb = function () {}, last = { status: 'out' };

  function script(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { bad(new Error('load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function init() {
    if (ready) return ready;
    ready = script(CDN + 'firebase-app-compat.js')
      .then(function () { return script(CDN + 'firebase-auth-compat.js'); })
      .then(function () { return script(CDN + 'firebase-firestore-compat.js'); })
      .then(function () {
        firebase.initializeApp(cfg); auth = firebase.auth(); db = firebase.firestore();
        try { db.enablePersistence({ synchronizeTabs: true }).catch(function () {}); } catch (e) {}
      });
    return ready;
  }
  function T() { return db.collection('teams').doc(team); }
  function emit(s) { last = s; cb(s); }
  function me(u) { return { uid: u.uid, email: u.email, name: u.displayName || (u.email || '').split('@')[0], verified: !!u.emailVerified }; }

  function resolve(u) {
    if (!u) return emit({ status: 'out' });
    var user = me(u), pwd = u.providerData && u.providerData.length && u.providerData[0].providerId === 'password';
    if (pwd && !u.emailVerified) return emit({ status: 'verify', user: user });
    T().collection('members').doc(u.uid).get().then(function (m) {
      if (m.exists) return emit({ status: 'member', user: user, role: m.data().role });
      var email = (u.email || '').toLowerCase();
      return T().collection('invites').doc(email).get().then(function (inv) {
        if (inv.exists) {
          var role = inv.data().role;
          return T().collection('members').doc(u.uid).set({ role: role, email: email, name: user.name, joined: Date.now() })
            .then(function () { emit({ status: 'member', user: user, role: role }); });
        }
        return T().get().then(function (t) {
          if (t.exists) return emit({ status: 'nomember', user: user });
          var b = db.batch();                                        // first user of an empty team becomes its admin (the rules check the admin email)
          b.set(T(), { owner: u.uid, created: Date.now() });
          b.set(T().collection('members').doc(u.uid), { role: 'admin', email: email, name: user.name, joined: Date.now() });
          return b.commit().then(function () { emit({ status: 'member', user: user, role: 'admin' }); });
        });
      });
    }).catch(function (e) {
      if (last.status === 'member' && last.user && last.user.uid === user.uid) return;
      emit({ status: 'offline', user: user, error: e && e.code });
    });
  }

  return {
    available: function () { return !!(cfg && cfg.apiKey); },
    start: function (fn) {
      cb = fn;
      return init().then(function () { auth.onAuthStateChanged(resolve); }).catch(function () { emit({ status: 'offline' }); });
    },
    state: function () { return last; },
    signIn: function (e, p) { return init().then(function () { return auth.signInWithEmailAndPassword(e, p); }); },
    signUp: function (e, p, name) {
      return init().then(function () { return auth.createUserWithEmailAndPassword(e, p); }).then(function (c) {
        return c.user.updateProfile({ displayName: name || '' }).then(function () { return c.user.sendEmailVerification(); }).then(function () { resolve(auth.currentUser); });
      });
    },
    google: function () { return init().then(function () { return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }); },
    signOut: function () { return auth ? auth.signOut() : Promise.resolve(); },
    reset: function (e) { return init().then(function () { return auth.sendPasswordResetEmail(e); }); },
    resendVerify: function () { return auth.currentUser.sendEmailVerification(); },
    refresh: function () { return auth.currentUser.reload().then(function () { resolve(auth.currentUser); }); },

    watchRuns: function (fn) {
      return T().collection('runs').onSnapshot(function (snap) {
        var list = [], ch = [];
        snap.forEach(function (d) { var r = d.data(); r.id = d.id; r.team = true; list.push(r); });
        snap.docChanges().forEach(function (c) { var r = c.doc.data(); r.id = c.doc.id; r.team = true; ch.push({ type: c.type, run: r, local: c.doc.metadata.hasPendingWrites }); });
        fn(list, ch);
      }, function () {});
    },
    saveRun: function (r) { var o = JSON.parse(JSON.stringify(r)); delete o.team; return T().collection('runs').doc(r.id).set(o); },
    deleteRun: function (id) { return T().collection('runs').doc(id).delete(); },

    watchMembers: function (fn) {
      return T().collection('members').onSnapshot(function (s) { var a = []; s.forEach(function (d) { var m = d.data(); m.uid = d.id; a.push(m); }); fn(a); }, function () {});
    },
    setRole: function (uid, role) { return T().collection('members').doc(uid).update({ role: role }); },
    removeMember: function (uid) { return T().collection('members').doc(uid).delete(); },
    watchInvites: function (fn) {
      return T().collection('invites').onSnapshot(function (s) { var a = []; s.forEach(function (d) { var m = d.data(); m.email = d.id; a.push(m); }); fn(a); }, function () {});
    },
    addInvite: function (email, role) { return T().collection('invites').doc(email.toLowerCase()).set({ role: role, by: auth.currentUser.uid, at: Date.now() }); },
    delInvite: function (email) { return T().collection('invites').doc(email).delete(); }
  };
})();

/* Test double for demos and development: open the page with ?mock=uid:Name:role (roles engineer, manager, admin).
   Several tabs of one browser then behave like several accounts sharing one team (data in localStorage, no network). */
function mockCloud(spec) {
  var p = spec.split(':'), uid = p[0], name = p[1] || uid, role = p[2] || 'engineer', K = 'psc.mock.v1', fns = [];
  var user = { uid: uid, name: name, email: uid + '@mock.test', verified: true };
  function load() { try { return JSON.parse(localStorage.getItem(K)) || { runs: {}, members: {}, invites: {} }; } catch (e) { return { runs: {}, members: {}, invites: {} }; } }
  function put(d) { localStorage.setItem(K, JSON.stringify(d)); fire(); }
  function fire() { fns.slice().forEach(function (f) { f(); }); }
  window.addEventListener('storage', function (e) { if (e.key === K) fire(); });
  function watch(kind, fn) { var f = function () { var d = load()[kind]; fn(Object.keys(d).map(function (k) { var o = JSON.parse(JSON.stringify(d[k])); if (kind === 'runs') o.team = true; if (kind === 'members') o.uid = k; if (kind === 'invites') o.email = k; return o; }), []); }; fns.push(f); setTimeout(f, 0); return function () { fns = fns.filter(function (x) { return x !== f; }); }; }
  var cb = function () {}, st = { status: 'member', user: user, role: role };
  return {
    available: function () { return true; },
    start: function (fn) { cb = fn; setTimeout(function () { var d = load(); d.members[uid] = { role: role, email: user.email, name: name }; localStorage.setItem(K, JSON.stringify(d)); cb(st); }, 30); return Promise.resolve(); },
    state: function () { return st; },
    signIn: function () { return Promise.resolve(); }, signUp: function () { return Promise.resolve(); }, google: function () { return Promise.resolve(); },
    signOut: function () { st = { status: 'out' }; cb(st); return Promise.resolve(); }, reset: function () { return Promise.resolve(); },
    resendVerify: function () { return Promise.resolve(); }, refresh: function () { cb(st); return Promise.resolve(); },
    watchRuns: function (fn) { return watch('runs', fn); },
    saveRun: function (r) { var d = load(), o = JSON.parse(JSON.stringify(r)); delete o.team; d.runs[r.id] = o; put(d); return Promise.resolve(); },
    deleteRun: function (id) { var d = load(); delete d.runs[id]; put(d); return Promise.resolve(); },
    watchMembers: function (fn) { return watch('members', fn); },
    setRole: function (u, r) { var d = load(); if (d.members[u]) d.members[u].role = r; put(d); return Promise.resolve(); },
    removeMember: function (u) { var d = load(); delete d.members[u]; put(d); return Promise.resolve(); },
    watchInvites: function (fn) { return watch('invites', fn); },
    addInvite: function (e, r) { var d = load(); d.invites[e.toLowerCase()] = { role: r }; put(d); return Promise.resolve(); },
    delInvite: function (e) { var d = load(); delete d.invites[e]; put(d); return Promise.resolve(); }
  };
}
