---
title: "jss-devtools 0.6.3: root-only package.json in lint-staged, .gitignore append"
date: 2026-10-14
summary: Fixed the matchBase leak 0.6.2 missed for package.json; init appends node_modules/ to an existing .gitignore that lacks it
---

# jss-devtools 0.6.3: root-only package.json in lint-staged, .gitignore append

## What happened
A real `init` (0.6.2) in a repo with AgentKit skills: committing `.claude/skills/ak-*/package.json` reformatted 6 nested manifests (2-space -> tabs) and `ak audit` reported drift. Separately, `init` in an existing repo whose `.gitignore` held only `local-notes.txt` left `?? node_modules/` after install.

## Change (commits 6781b50, c1d4bcd, tag v0.6.3)
- lint-staged key `package.json` -> `./package.json`. 0.6.2 anchored the root code glob but left this slash-less key, which lint-staged matches by basename in every directory (README "Filtering files"; `lib/matchFiles.js`).
- New `update-file` plan action: rewrites an existing file and reports it under `modified` (real run and `--dry-run`). Used for `.gitignore` when no line is an equivalent of `node_modules` (`/`, `**/` prefix; `/`, `/*`, `/**` suffix; `!` negation counts as present). Bytes kept, missing final newline added in the file's own EOL.

## Verification
- `tests/init-lint-staged-matching.test.ts` runs the generated patterns through lint-staged's Node API in a temp git repo; on the old code it reported `sub/package.json` and both `.claude/.../package.json` as touched.
- New flow/plan tests for `.gitignore` fail on the old code (file untouched, `modified` lacks `.gitignore`).
- E2E with the built CLI: existing repo -> `.gitignore` gains `node_modules/`, `modified: ['.gitignore', 'package.json']`, status free of the dependency dir; committing a 2-space `sub/package.json` left it unchanged.
- Release run 38446720508 green, npm latest 0.6.3.

## Gotcha
`init` still does not report the lockfile created by install (`package-lock.json` etc.), so a caller that stages only `generated` + `modified` leaves it untracked.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
