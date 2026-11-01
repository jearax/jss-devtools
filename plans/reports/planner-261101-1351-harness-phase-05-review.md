# Review: harness phase 5, round 1

Reviewed: the working tree on `d366187` and your done report. Accepted: `update.command.ts` in
place of `update.service.ts`, `git merge-file` through the adapter (git is already required),
staging a conflict without asking (it writes nothing live), the preflight and lock order, the
config conflict proposal, and the labelled markers. Fix the findings below, rerun the full gate,
and append a "Round 1 fixes" section with real output to your done report. Do not commit, do not
push. Comments: default zero.

1. **`--continue` writes live files without asking.** The decision is that `update` asks before
   writing and takes `-y`. `--continue` applies the staged plan with no confirmation, no `-y`
   check and no lock, and staging asked nothing either, so a conflicted update reaches the live
   tree without the user ever being asked. Give `--continue` the same rule as a clean update:
   render the staged plan, then ask, unless `-y`; without a terminal and without `-y`, exit 1 with
   the same hint. Run it under `withUpdateLock`. Add tests for: no terminal without `-y` exits 1
   and leaves the staged session and the live tree unchanged; `-y` applies.

2. **Two files over 200 lines.** `src/modules/harness/update-plan.service.ts` (315) and
   `src/commands/harness/update.command.ts` (332). Split each along a real boundary (for example
   per-kind planners apart from the plan assembly; rendering apart from the flow).
