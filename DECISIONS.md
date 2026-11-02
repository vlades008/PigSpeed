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

## Slices
1. Manager overview (done). 2. Recording mode, stop false finishes. 3. Plan and Runs tabs, run summary. 4. Settings page, Team tab, fewer looks, new tour.

## Left out of slice 1 on purpose
- Warning for a valve expected but not recorded: a stuck pig shows On plan until overdue. Top candidate for the next round.
- Project or customer grouping: runs have no such field.
- Fixed plan baseline: editing parameters after launch moves the plan.
- Header stays for now: News, Customize, Settings. Team stays in the account menu.
- Overdue run details: the run screen shows the run as arrived, with elapsed capped at the estimate; the list is the correct signal.
