---
phase: 3
title: "Redaction rules and the doctor content check"
status: done
priority: P1
effort: 1d
dependencies: [2]
---

# Phase 3: Redaction rules and the doctor content check

## Goal

One named rule list finds tokens, home paths and e-mail addresses. The hooks use it to redact
every line they log or inject, and `harness doctor` uses it to report file, line and rule before
the user pushes.

## Context

- `src/modules/harness/services/redaction.service.ts` is 16 lines: four anonymous patterns
  (`sk-`, `AKIA`, `Bearer`, `key=value`) and `redactSecrets`, called from
  `post-tool-use-failure.hook.ts:15` and `health-state.service.ts:135`.
- `secretIssues` walks all of `.harness/` and compares each file before and after redaction, so
  it knows a file matched but not the line or the rule, and it has no rule for a path. It was
  green while 43 tracked files here hold a real absolute home path.
- `logHookError` (`hook-errors.service.ts:44`) writes the raw detail, and `sessionStartHook`
  (`session-start.hook.ts:62`) injects each logged line and every other warning as it is.
- The user decided that `harness doctor` is the only guard: no git hook.
- Measured in this repository: the account names after `/Users/` and `/home/` are one real name
  and the placeholders `<name>`, `me`, `user`, `tester`; the e-mail shaped strings are a package
  author's public address in a report, `user@example.com`, and an SSH remote on github.com.

## Requirements

### The rule list

1. `redaction.service.ts` exports one list of rules, each with a name, a kind (`secret` or
   `private`), a pattern and a replacement.
2. Secret rules: the four existing patterns, named; GitHub tokens (`ghp_`, `gho_`, `ghu_`, `ghs_`,
   `ghr_`, `github_pat_`); Slack tokens (`xoxb-`, `xoxa-`, `xoxp-`, `xoxr-`, `xoxs-`, `xapp-`);
   GitLab (`glpat-`); npm (`npm_`); Stripe (`sk_live_`, `rk_live_`); Google API keys (`AIza`);
   AWS temporary keys (`ASIA`, joining the `AKIA` rule); JSON Web Tokens; a PEM private-key
   header; credentials inside a URL (`scheme`://`user`:`password`@`host`).
3. Private rules: an absolute home path (`/Users/<name>/`, `/home/<name>/`, `C:\Users\<name>\`)
   and an e-mail address.
4. Exemptions, each one exported constant, widened only from real reports:
   - account names that are placeholders or generic: `<name>`, `name`, `user`, `username`, `you`,
     `me`, `tester`, `node`, `runner`, `ubuntu`, `Shared`;
   - e-mail addresses at `example.com`, `example.org`, `example.net` and `example.test`;
   - the SSH remotes of three public forges: `git@github.com`, `git@gitlab.com`,
     `git@bitbucket.org`;
   - a name whose last label is an image extension, such as `logo@2x.png`.
5. One function redacts a line: a secret becomes `[redacted]`, a home path keeps its tail behind
   `~/`, an e-mail address becomes `[redacted]`. One function finds matches and returns rule,
   kind and line number for each. It skips exempt matches and lines that carry the marker
   `harness-doctor: allow`, and it returns how many lines the marker skipped.
6. The patterns carry the `g` flag at module level, so the finder uses `matchAll` and never
   `.test()` or `.exec()` on them: those keep `lastIndex` between calls and miss matches.
7. No pattern nests quantifiers. A 200 kB line of one repeated character finishes inside the
   test timeout.

### Redaction where lines are written or injected

8. `logHookError` redacts the detail before it writes.
9. `sessionStartHook` redacts every warning line before it joins `additionalContext`. This covers
   lines an older hook already logged, config problems, memory-limit messages and index drift.
   The memory text and the decision titles are the knowledge itself and are not rewritten.
10. `post-tool-use-failure.hook.ts` moves to the new function.

### The content check

11. A new `health-content.service.ts` replaces `secretIssues`. Candidates: every regular file
    under `.harness/` except `bin/`, `core/`, `state/` and `update/`; `CLAUDE.md`; every file of
    a learned skill folder. A file with a NUL byte in its first 8 kB, or larger than 2 MiB, is
    skipped; a skipped large file is one warning.
12. The published set is what git would publish: `git ls-files --cached --others
    --exclude-standard -z -- .harness CLAUDE.md .claude/skills`, through a new function in
    `src/core/adapters/git.adapter.ts`. When git fails, every candidate counts as published.
13. A secret match is an error in any candidate, label `Secrets`. A private match is an error
    only in a published file, label `Private content`; in an ignored file it is not reported.
14. One issue per file: `<path>:<line> <rule>` for the first five matches, then `and N more`.
    Next step: `Replace the value, or end the line with harness-doctor: allow`.
15. The summary gains a `Content check` row, status `ok`:
    `<n> files checked, <m> lines allowed by marker`.
16. `DOCTOR_CHECKS` names the content check instead of "secrets in .harness/".
17. `harness-review` (`harness-skills.template.ts`) gains one step before its report: if
    `jss-devtools` is installed, run `jss-devtools harness doctor` and fix what the content check
    reports, as `harness-onboard` and `harness-curate` already do.

## Files

- Create: `src/modules/harness/services/health-content.service.ts`,
  `tests/harness-redaction.test.ts`.
- Modify: `src/modules/harness/services/redaction.service.ts`, `health-state.service.ts`
  (`secretIssues` leaves), `hook-errors.service.ts`,
  `src/modules/harness/hooks/session-start.hook.ts`, `post-tool-use-failure.hook.ts`,
  `src/core/adapters/git.adapter.ts`, `src/commands/harness/services/doctor.service.ts`,
  `src/commands/harness/harness.command.ts`,
  `src/modules/harness/templates/harness-skills.template.ts`.
- Tests: `tests/harness-doctor.test.ts`, `tests/harness-hooks.test.ts`, and the snapshot of
  `tests/harness-install-plan.service.test.ts` (the skill text changes).

## Tasks

- [ ] The rule list, the exemptions, the two functions, and `tests/harness-redaction.test.ts`:
      for every rule one matching sample and one exempt or placeholder sample; the finder called
      twice on the same text returns the same result; the marker; the 200 kB line.
- [ ] Build every token sample at run time (`'sk_' + 'live_' + 'x'.repeat(24)`), so neither
      GitHub push protection nor a scanner flags the test file.
- [ ] Redaction in `logHookError`, in the SessionStart warnings and in the failure hook, with a
      hook test: an error line holding a token and a home path reaches neither the log nor the
      context.
- [ ] The git adapter function and `health-content.service.ts`; wire it into `collectHealth`.
- [ ] Doctor tests: a home path in a tracked plan is an error with file, line and rule; the same
      file gitignored is silent; a token in an ignored file is an error; the marker; a binary
      file is skipped; outside a git repository every candidate is checked.
- [ ] The summary row, the help text and the `harness-review` step.

## Verification

- `pnpm lint && pnpm typecheck && pnpm test`.
- Run the built CLI's `harness doctor` in this repository before phase 6 cleans it: it exits 1
  and names 41 files under `.harness/plans/`, two decisions and one file for the e-mail rule
  (counted at `3d8db75`; later commits can change it). Record the count of files per rule
  in the phase report; phase 6 brings it to zero. The SSH remote on github.com and the
  placeholders must not be among them.

## Risk and rollback

- A false positive teaches the user to ignore the check. The exemptions and the marker are the
  answer; widen the exemption lists from real reports only.
- A private name with no shape (a repository, a customer, a host in prose) is not caught. The
  documentation says so.
- The marker can also hide a real token on its line. The summary row counts marked lines, and the
  marker is visible in the diff.
- `CLAUDE.md` outside the harness block is the user's own text; a contact address there needs
  the marker.
- Rollback is reverting the phase commit.
