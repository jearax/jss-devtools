# Review: harness phase 7, round 1

Reviewed: the working tree on `3e9450b` and your done report. The checks reuse the existing
services (config, memory, index drift, redaction, staging, manifest, learned skills), and
`missingHookEntries` shares `hookSettingEntries` with the install. Accepted: the dropped `today`
parameter, skipping the stale warning without `curator.staleDays`, the committed-then-edited
AgentKit test, the secret path wording.

1. **Frontmatter parsing is copied three times.** `FRONTMATTER`, `frontmatterOf` and
   `DECISION_FILE` exist in `decisions.service.ts`, `health-state.service.ts` and (the first two)
   `health-skills.service.ts`. Keep one copy: export the frontmatter reader and the decision file
   list from one service (a small `frontmatter.service.ts`, or `decisions.service.ts` with
   `decisionFileIds`), and use it in all three. A rule is written once.

2. **Remove `/tmp/jss-run.mjs`,** the spawn wrapper you left outside the repository.

Rerun the full gate and append a "Round 1 fixes" section with real output to your done report.
Do not commit, do not push. Comments: default zero.
