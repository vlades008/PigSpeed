# Pig Speed review — 6 Nov 2026

## Where the app is

**Version 1.26.0** (released 2 Nov 2026). Single-file web app for planning and tracking in-line inspection runs (Interscan geometry / MFL / TFI), in Russian by default with an EN switch. It ships as a web page, a Windows exe and an Android wrapper, and syncs team runs through Firebase.

- `index.html` 539 KB generated from `src/`; `app.js` 2,004 lines, `style.css` 1,286 lines, `core.js` 132 lines.
- 5 screens: Plan, Track, Runs (engineer); Overview, Team (manager/admin). Recording mode overrides Track during a live run.
- 3 roles; the manager/admin overview is read-only by design; a run ends only when the arrival is confirmed.
- Runs survive a reload (`localStorage`); the published APK loads the live site when online and its bundled copy only when offline.
- Checks run: `npm test` — all checks passed. Lighthouse: accessibility 100, best practices 100, SEO 75 (only a missing meta description). No console errors on the tested screens.
- Not tested: exe/APK launch, printing.

**What is genuinely good:** the domain model is right, the one-job-per-screen split is right, the read-only overview and confirmed-arrival rule are thoughtful, the offline/local fallback is right for a field tool, and the app is fast and self-contained. The 1.26 rebuild is a good base — the mock below keeps it.

## Problems seen in the current build

Ordered by what costs the user most on a real run.

| # | Problem | Evidence / effect |
|---|---------|-------------------|
| 1 | **Plan hides the route by default** | The diagram opens in "Локально" and shows 0.0–0.4 km of a 42 km line. The main planning question — where the valves and receiver are — is one tab away. Plan also uses only ~650 px of a 1000 px desktop canvas. |
| 2 | **Speed reads ambiguously** | `1,741 м/с` uses 3 decimals and a comma: in RU it reads like 1741. Use 2 decimals, a space before the unit, and locale-aware grouping (`1,74 м/с`, `4 000 000 м³/сут`). |
| 3 | **The same countdown is repeated** | During a run: `0:51:29` to the next valve, `До приёмника 4:41:12`, `Прибытие 20:55`, plus the same next valve in the diagram footer. Three numbers compete for the same decision. |
| 4 | **Recording mode has a large empty field** | On a 390×844 phone the action sits ~400 px below the last information block. On desktop the action is mid-column with ~300 px of white below. The one-button mode should feel like one button, not a form with a void. |
| 5 | **Mobile chrome can block the run** | The update banner ("Скачать / Что нового") takes about a third of the phone screen and is not suppressed during a run. The sticky "Начать запуск" sits over the parameter rows, and the tab bar covers the last list row. |
| 6 | **Overview rows lose context** | F-1's subtitle truncates to "послед…"; rows have no progress, next valve or freshness. A phone that stopped syncing still looks "По плану". |
| 7 | **Stale `ovnone` can blank Plan** | If the cached role is admin/manager and the live role is engineer (role changed, shared device, second tab), `body.ovnone` remains after `OV.on` turns off; CSS hides `.main`. Reproduced by opening an engineer tab after an admin tab. Fix: remove `ovnone` when overview turns off, or scope the rule to `body.ov.ovnone`. |
| 8 | **Arrival dates are ambiguous** | A 6 h 42 min run launched at 22:54 arrives at 05:36 the next day, but only the time is shown. Add "завтра / +1 день" when the arrival crosses midnight. |
| 9 | **A stuck pig still looks on plan** | `DECISIONS.md` already names this: a valve expected but not recorded shows nothing until the run is overdue. This is the highest-value safety gap. |
| 10 | **Coverage and dead code** | Only the overview status rules are tested (`tools/overview-test.js`); physics has manual Node checks but no fixtures. Old Sheet/Focus/Console code and CSS are explicitly left for cleanup. |

## Ideas, in order

### Quick wins — next release (1.27)

1. **Route first on Plan.** Default to "Маршрут"; keep "Локально" for the close-up. Show the whole line, valves and receiver in one view.
2. **One number format.** `1,74 м/с`, `42,0 км`, `35 бар`, `6 ч 42 мин`; group thousands with narrow spaces; always show the unit. Add "сегодня / завтра" to arrival.
3. **One next event.** A single block: next valve, distance, countdown, ETA. Remove the duplicate countdowns; the diagram footer becomes a caption, not a second summary.
4. **Fix the mobile frame.** Suppress update/announcement bars during a live run; cap them to one line otherwise. Put the primary action in a bottom bar above the tabs, with content padding so nothing hides underneath.
5. **Fix `ovnone` and add a regression test** for the role-switch case.
6. **Overview rows that answer "is this okay?"** Add a progress bar, next valve, and "обновлено N с назад" / "нет связи N мин". Stop truncating the owner/line line.
7. **Feedback on every record.** After the tap: a green strip "КР-1 записана · 15:11:07 · Отменить" (the 15 s undo already exists); keep it visible until the next event.
8. **Sync honesty.** "Сохранено на устройстве" vs "синхронизировано 2 с назад" vs "ждёт сеть" — people need to know whether the office sees the run.

### Next (1.28)

1. **Pending-valve warning.** If a valve's estimated time has passed and it is not recorded, show an amber banner on Track and a warning in Overview ("КР-2 не отмечена 4 мин"). This is the stuck-pig case.
2. **Offline queue.** Queue records and arrival while offline, flush on reconnect, never lose a tap. The local state is already there; make the status visible.
3. **Overview timeline.** Planned vs actual milestones with deltas, plus a freshness column. The read-only detail should make a delay obvious without opening the run.
4. **Plan what-if.** Show the equipment speed band as a gauge, the flow needed for the target speed, and let the engineer compare two scenarios (current vs target) before launch.
5. **One-page PDF report.** Route, valve table, planned vs actual, deviations, signature block — branded and printable from Track and Overview.

### Bigger (1.29+)

1. **Projects / customers / templates.** Runs currently have no project field, so grouping and repeat runs are manual. A template ("same line, same tool") would remove most re-entry.
2. **Team analytics.** On-time %, average deviation, tool utilization, per-line history — useful for the manager, not for the field.
3. **Code health.** Split the 2,000-line `app.js` into modules during the build, delete the retired layout CSS/JS, add physics fixtures (`PSC.calc`) and a Playwright smoke test for the three roles. The single-file output can stay.
4. **Locale completeness.** Finish EN strings and put all number/date/unit formatting through one helper so RU/EN never diverge.

## The updated visual

`mockups/redesign-2026.html` — a self-contained, clickable mock (no external assets). Top bar switches between **План**, **Прогон**, **Обзор**, **Телефон**; `#plan`, `#track`, `#ov`, `#phone` work as direct links. Static renders: `preview-plan.png`, `preview-track.png`, `preview-overview.png`, `preview-phone.png`.

What changed, screen by screen:

- **Plan.** Route is the hero: full 42 km, valves at 6/18/30 km, next valve highlighted, receiver time. Speed gets a range gauge; duration and arrival sit beside it. Parameters are a quiet rail; catalog checks are a separate card; the valve table is no longer the only place to see the plan. Primary action is in the page header, not floating over the list.
- **Track.** The next event is the whole left column: valve, distance, one big countdown, one big record button, two secondary actions, last record and sync state. The right column is situational: route position, four vitals, valve table with planned/actual and a one-line event log. No duplicate countdown block.
- **Overview.** Problem-first list with status color, progress, next valve and ETA; selected run opens a detail with a large "remaining", route, KPI list and a planned-vs-actual timeline. The header says how fresh the data is.
- **Phone.** A real bottom action bar above the tabs; one-line banners; a recording screen with countdown, vitals, a 4-step valve rail and a thumb-sized action — nothing else. The update banner is gone from the run.
- **Type and tokens.** Same blue/white system, but stronger hierarchy: 24 px page title, 38 px figures, 11 px uppercase labels, tabular numerals, 14 px card radius, 1 px rules. The CSS variables map to the last layer of `src/style.css` (`--bg`, `--card`, `--ink`, `--muted`, `--line`, `--accent`, `--soft`).

## Suggested sequence

| Release | Theme | Contents |
|---------|-------|----------|
| 1.27 | Clarity | Number format, route-first Plan, one next event, mobile action bar and banners, `ovnone` fix, freshness and progress in Overview, record feedback + sync status |
| 1.28 | Trust | Pending-valve warning, offline queue and sync states, overview timeline, one-page PDF report |
| 1.29 | Scale | Projects/templates, team analytics, module split, physics and UI tests, dead-code cleanup |

The mock is a design proposal, not implemented code. Nothing in the app was changed; `npm test` is green.
