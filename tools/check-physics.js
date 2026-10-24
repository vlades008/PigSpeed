// Sanity checks for src/core.js (run: node tools/check-physics.js). Exits 1 on failure.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8') + '\nthis.PSC=PSC;', ctx);
const PSC = ctx.PSC;
// unit indexes all 0: mm, km, km/h, ... (see core.js tables); fluid 0 gas, 1 oil, 2 oil + gas
const base = { od: 508, wt: 8, wtu: 0, len: 50, lenu: 0, rv: 10, rvu: 0, p: 7000, pu: 0, pout: 0, t: 20, tu: 0, flow: 1000000, gasu: 0, oilu: 0, rgasu: 0, roilu: 0, fluid: 0, sg: 0.65, api: 35, gor: 0, slip: 100, std: 0, atm: 0 };
let fails = 0;
function check(name, ok, info) { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails++; }
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);

for (const [name, over] of [['gas', {}], ['oil', { fluid: 1, flow: 20000, p: 3000 }], ['oil+gas', { fluid: 2, flow: 20000, p: 3000, gor: 300 }]]) {
  const r = PSC.calc(Object.assign({}, base, over));
  check(name + ': result', !r.error && r.v > 0 && isFinite(r.hours), r.error || 'v=' + (r.v && r.v.toFixed(3)) + ' km/h, t=' + (r.hours && r.hours.toFixed(2)) + ' h');
  if (r.error) continue;
  const mono = r.prof.every((x, k) => k === 0 || x >= r.prof[k - 1]);
  check(name + ': profile 0..1 and monotonic', mono && r.prof[0] === 0 && near(r.prof[r.prof.length - 1], 1, 1e-9));
  const rt = [0.1, 0.5, 0.9].every(x => near(PSC.xAt(r.prof, PSC.tAt(r.prof, x)), x, 1e-6));
  check(name + ': xAt(tAt(x)) = x', rt);
  const half = PSC.calc(Object.assign({}, base, over, { slip: 50 }));
  check(name + ': 50 % slip doubles the time', near(half.hours, r.hours * 2, 1e-9));
}
const g = PSC.calc(base);
check('gas Z in 0.5..1.2', g.z > 0.5 && g.z < 1.2, 'Z=' + g.z);
const drop = PSC.calc(Object.assign({}, base, { pout: 3000 }));
check('outlet pressure raises outlet speed above inlet', drop.vout > drop.vin, drop.vin.toFixed(2) + ' -> ' + drop.vout.toFixed(2) + ' km/h');
check('speed = flow / area (no slip, uniform)', (() => {
  const o = Object.assign({}, base, { fluid: 1, flow: 20000, p: 3000 }), r = PSC.calc(o);
  return r.vin > 0 && near(r.vin, r.qline / (Math.PI * Math.pow((o.od - 2 * o.wt) / 1000, 2) / 4) * 3.6, 1e-9);
})());
process.exit(fails ? 1 : 0);
