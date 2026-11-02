# Decisions

## Menus follow who is looking and when (2026-11-02)
- **Chosen:** role and run state pick the menu, over one data store. Engineer: Plan, Recording, Summary. Project manager: Overview. Admin: Overview, can switch to the engineer view.
- **Rejected:** one set of tabs for everyone (ignores two different jobs); runs sidebar for everyone (engineers on site lose diagram width); tidying the current single screen (planning and tracking stay crowded).

## Manager main view: list with details, late first
- **Chosen:** list beside the existing run screen, opened read-only. Works on a phone and with many runs.
- **Rejected for now:** timeline (more to build, cramped on a phone; good second view later); board by stage (weakest at showing what is late).

## Status rules (`PSC.runStatus`, tests in `tools/overview-test.js`)
- On plan: within 5 min of plan, or ahead. Late: more than 5 min behind. Overdue: still running after the estimate.
- Arrival not confirmed: the app finished the run itself (`finish.auto`); stays in Now for 24 h, then moves to Finished with the label.
- Margin and window are first picks, easy to change.

## Overview is always read-only, also for admins
Opening a run with write access can finish it: when its estimated time has passed, the app marks it done. Leaving the overview therefore never reopens another person's run with write access.

## A run finishes only when someone confirms the arrival (slice 2a)
Past its estimate a real run keeps running and counts as overdue, for the engineer and anyone watching. Confirming takes an editable time, which is saved as actual. Reminder at the estimate, then every 30 min. Playback at other speeds still ends by itself. Publishing reaches online APK and web users at once; an offline APK or the exe keeps its bundled version and can still finish runs itself until updated, so Overview keeps the "Arrival not confirmed" label. A forgotten run stays overdue until its engineer confirms, stops or deletes it.

## Recording mode (slice 2b)
- On for the current user's writable live run at x1, whatever their role: engineers, admins in the engineer view, and signed-out users on their own device. Someone watching a colleague's run stays on the classic read-only screen.
- Overrides Standard, Sheet, Focus and Console during the run. Below 980 px the panel fills the screen and the header moves into the ⋯ menu; from 980 px it takes the left column beside the diagram.
- One tap records the time, 15 s Undo, 1.5 s guard against a double tap. Chosen over a confirmation popup for speed on site; rejected a popup on every tap.
- The button offers the first unrecorded valve beyond the furthest recorded one, even when the estimate says it has passed (`PSC.nextValve`).
- Once overdue the main button is arrival. Arrival uses the dialog rather than the inline form in the sketch, so there is one confirmation path.

## One look (2026-11-02)
- White work surface, thin rules, one blue for action, red for trouble, Light and Control room themes. It is the last layer of `src/style.css`, so it wins over the older rules above it.
- Removed: text style, clock style, Console, Sheet, Focus, the layout picker and the Customize button; old saved choices are ignored. Theme moved into Settings.
- Rejected: keeping the options and restyling each one (too many combinations to keep working).
- Code for Sheet, Focus and Console no longer runs and can be deleted in a clean-up, along with the older CSS it uses.

## Screens rebuilt, one job each (approved by the owner from a clickable test version, 2026-11-02)
- Engineer: Plan (result first, short rows that open), Track (recording mode, or short details, or the summary after arrival), Runs (search, status groups, row actions). Manager and admin: Overview (list and short details, diagram on request) and Team.
- Why: restyling alone was rejected; what the owner liked in the sketches was few things per screen.
- Settings stays a popup behind the gear and News behind the bell. The tour was rewritten and shows once to everyone.

## Slices
Done: manager overview, recording mode, confirmed arrivals, one look, rebuilt screens. Left: Settings as a page, clean-up of old layout code.

## Left out of slice 1 on purpose
- Warning for a valve expected but not recorded: a stuck pig shows On plan until overdue. Top candidate for the next round.
- Project or customer grouping: runs have no such field.
- Fixed plan baseline: editing parameters after launch moves the plan.
- Header stays for now: News, Customize, Settings. Team stays in the account menu.
