// Status rules of the manager overview. Run: npm test
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8') + ';this.PSC=PSC', ctx);
const PSC = ctx.PSC, MIN = 60000, H = 3600000, NOW = 1e12;

const running = (startedAgo, planH, durMs) => ({ st: 'running', team: true, params: {}, launch: NOW - startedAgo, hours: planH, dur: durMs });
const finished = (ago, auto) => ({ st: 'done', team: true, params: {}, launch: NOW - ago - 3 * H, finish: { at: NOW - ago, planned: 3 * H, actual: 3 * H, auto } });
const st = r => PSC.runStatus(r, NOW);

// planned
assert.deepStrictEqual([st({ st: 'planned', updated: 5 }).group, st({ st: 'planned', updated: 5 }).state], ['planned', 'planned']);
// running without a launch time is not live yet
assert.strictEqual(st({ st: 'running' }).state, 'planned');

// on plan: within the 5 min margin, or ahead
assert.strictEqual(st(running(H, 4, 4 * H)).state, 'onplan');
assert.strictEqual(st(running(H, 4, 4 * H + 5 * MIN)).state, 'onplan');
assert.strictEqual(st(running(H, 4, 3 * H)).state, 'onplan');

// late: more than 5 min behind plan
const late = st(running(H, 4, 4 * H + 22 * MIN));
assert.strictEqual(late.state, 'late');
assert.strictEqual(late.delay, 22 * MIN);
assert.strictEqual(late.arrival, NOW - H + 4 * H + 22 * MIN);

// overdue: still running after the estimate, wins over late
const over = st(running(5 * H, 4, 4 * H + 30 * MIN));
assert.strictEqual(over.state, 'overdue');
assert.strictEqual(over.over, 30 * MIN);
// no recalibration: the plan is the estimate
assert.strictEqual(st({ st: 'running', team: true, launch: NOW - H, hours: 4 }).state, 'onplan');
// exactly at the estimate is not yet overdue
assert.strictEqual(st(running(4 * H, 4, 4 * H)).state, 'onplan');

// finished by the engineer
assert.deepStrictEqual([st(finished(H, false)).group, st(finished(H, false)).state], ['done', 'done']);
assert.deepStrictEqual([st(finished(48 * H, false)).group, st(finished(48 * H, false)).state], ['done', 'done']);
// finished by the app: stays in Now for 24 h, then moves but keeps its label
assert.deepStrictEqual([st(finished(H, true)).group, st(finished(H, true)).state], ['now', 'unconfirmed']);
assert.deepStrictEqual([st(finished(24 * H, true)).group, st(finished(24 * H, true)).state], ['done', 'unconfirmed']);

// order in Now: overdue (longest), unconfirmed (newest), late (biggest), on plan (soonest)
const name = (n, r) => Object.assign(r, { name: n });
const o = PSC.overview([
  name('plan-late', running(H, 8, 8 * H)),
  name('plan-soon', running(H, 2, 2 * H)),
  name('late-small', running(H, 4, 4 * H + 10 * MIN)),
  name('late-big', running(H, 4, 4 * H + 40 * MIN)),
  name('unconf-old', finished(5 * H, true)),
  name('unconf-new', finished(H, true)),
  name('over-small', running(4 * H + 10 * MIN, 4, 4 * H)),
  name('over-big', running(4 * H + 50 * MIN, 4, 4 * H)),
  name('done', finished(H, false)),
  name('done-old', finished(9 * H, false)),
  name('planned', { st: 'planned', team: true, params: {}, updated: 1 }),
  name('local', { st: 'running', params: {}, launch: NOW - H, hours: 1 }),
  name('no-params', { st: 'done', team: true, params: null, finish: { at: NOW } })
], NOW);
assert.deepStrictEqual(Array.from(o.now, x => x.run.name), ['over-big', 'over-small', 'unconf-new', 'unconf-old', 'late-big', 'late-small', 'plan-soon', 'plan-late']);
assert.deepStrictEqual(Array.from(o.done, x => x.run.name), ['done', 'done-old']);
assert.deepStrictEqual(Array.from(o.planned, x => x.run.name), ['planned']);

// an engineer's list also holds own local runs and old history
const mine = PSC.overview([{ st: 'planned', params: {}, updated: 2, name: 'local' }, { st: 'done', hist: true, params: null, finish: { at: NOW - H, planned: H, actual: H }, name: 'old' }, { st: 'done', params: null, name: 'broken' }], NOW, true);
assert.deepStrictEqual(Array.from(mine.planned, x => x.run.name), ['local']);
assert.deepStrictEqual(Array.from(mine.done, x => x.run.name), ['old']);

// next valve to record
const V = [{ i: 0, tf: .2, ok: true }, { i: 1, tf: .5, ok: true }, { i: 2, tf: .8, ok: true }, { i: 3, tf: .9, ok: false }];
const nx = o => { const v = PSC.nextValve(V, o); return v ? v.i : null; };
assert.strictEqual(nx({}), 0);
assert.strictEqual(nx(undefined), 0);
assert.strictEqual(nx({ 0: 1 }), 1);
// recorded out of order: the button moves past the skipped valve
assert.strictEqual(nx({ 1: 1 }), 2);
// all recorded, and a valve outside the line is never offered
assert.strictEqual(nx({ 0: 1, 1: 1, 2: 1 }), null);
// valve order comes from the position, not the index
assert.strictEqual(PSC.nextValve([{ i: 0, tf: .7, ok: true }, { i: 1, tf: .3, ok: true }], {}).i, 1);
assert.strictEqual(PSC.nextValve([], {}), null);

console.log('overview-test: all checks passed');
