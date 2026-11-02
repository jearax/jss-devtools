---
title: Cooked the scaffold touch-ups
date: 2026-11-02
summary: "Repainted the CLI banner in the design system's moss green, gave the generated .gitignore and .prettierignore the full common Node.js coverage, installed the harness's Markdown already in Prettier's output, and made the CLAUDE.md block carry the AgentKit lines only when .agentkit/config.yaml says AgentKit is in use"
---

# Cooked the scaffold touch-ups

## What happened

The [scaffold touch-ups plan](../261102-1247-scaffold-touchups/plan.md) was cooked, all three
phases. The banner above `--help` and `--version` runs the design system's moss green scale
(`#a8d558` → `#8abd2c` → `#5e8c04`, one green `32` at 16 colours); the `.gitignore` and
`.prettierignore` that `jss-devtools init` writes follow the plan's targets; the Markdown the
harness installs is already in Prettier's output; and the `CLAUDE.md` block carries the AgentKit
lines only when AgentKit is in use, while the folder READMEs carry none. An independent review ran
on the first pass, found a real defect in the detection, and the user and planner decided the
fix. The report is
[cooker-261102-1602](../reports/cooker-261102-1602-scaffold-touchups-done.md).

## Findings

- **The plan's detector was wrong, and the review proved it by reproduction.** It looked for any
  `.claude/skills/ak-*` entry, but `ak init` writes no skill: it points AgentKit at the folders and
  leaves `.agentkit/config.yaml`. So `init --agent-kit` produced a block with the AgentKit lines
  and the next `harness update` took them away, while `.agentkit/config.yaml` still named
  `.harness/docs` and `.harness/plans`. The detector is now `usesAgentKit` on
  `.agentkit/config.yaml`, the one file `ak init` writes and the project commits — AgentKit's
  skills live in the user's global directory and say nothing about this repository.
- **A test that mirrors the code proves nothing.** The first tests wrote a synthetic
  `.claude/skills/ak-demo/SKILL.md`, which is exactly the fixture the wrong detector expects, so
  they passed against the broken behaviour. The new tests use `.agentkit/config.yaml`, and one of
  them drives the real `init` plan (`buildInitPlan` with `agentKit: true`) into `harness update`.
  With the old rule restored, four of them fail.
- **The durable fix for Prettier was to stop fighting it.** The first attempt ignored the
  harness's Markdown in `.prettierignore`; that silenced the doctor but shrank Prettier's reach
  and would have needed re-doing for every file the CLI writes. The user's change of direction —
  "Đổi sang format sẵn" — installs the Markdown already in Prettier's output instead: tables
  aligned, a blank line after every heading, Prettier's list indents. The wording never changed;
  `git diff -w` on the templates shows only formatting.
- **A test that formats the installed file pins the format.** `tests/harness-markdown-format.test.ts`
  formats every Markdown entry `harnessInstallEntries` produces — create and existing mode, with
  and without AgentKit, and with a user's own `CLAUDE.md` in front of the block — and requires the
  result to equal the file. It failed against the old templates, first on
  `.harness/decisions/README.md`. The same test holds the repo's installed Prettier to the
  version the scaffold installs, so the two cannot drift apart unnoticed.
- **The hook bundle was a symptom, not the disease.** The old `.prettierignore` let Prettier
  rewrite the live `.harness/bin/hooks.mjs`, and `harness doctor` then reported an error, "differs
  from the manifest hash". Only the machine-written files stay ignored now: `.harness/bin/` and
  `.harness/core/`.
- **Prettier 3 follows `.gitignore`, so `.prettierignore` only holds what is committed but must
  not be formatted.** The old file repeated `node_modules/`, `dist/`, `coverage/`, `.env*`,
  `.eslintcache` and `*.log` from the `.gitignore`; all of that is gone.
- **The block is Prettier-stable where it matters.** Prettier moves the table and adds a blank
  line after the `<!-- HARNESS:BEGIN -->` comment — both predating this change — and leaves the new
  nested ownership bullets exactly as written.
- **A pty with no size hides the banner.** `isInteractive` needs `process.stdout.columns > 0`, and
  macOS `script` gives a pty of zero columns, so `node dist/cli.mjs --version` printed the version
  alone. Setting the window size with `TIOCSWINSZ` before the exec brought the banner back.
- **The lint glob has to be parsed, not restated.** The test that no `.gitignore` entry names a
  lint-glob source folder reads the glob out of the `package.json` template and expands its braces
  (`lib{,s}`, `__test{s,}__`) itself.
- **"No variant files" was read too widely.** The user confirmed on 2026-11-02 that the remark was
  about the many README variants, not about the `CLAUDE.md` block. The block varies with the
  setting, the READMEs do not, and decision 0034 records it with the quotes.

## Measurements

Gate on Node 24.22.0: lint clean, typecheck clean, `Test Files 27 passed | 1 skipped (28)`,
`Tests 438 passed | 7 skipped (445)`, build 323.35 kB. `pnpm format:check` clean.

Two fresh scaffolds, `init -y` and `init -y --agent-kit`: the tree stays clean after both
`pnpm format` runs, and `harness doctor` prints "Harness is healthy" with no "changed from its
base" line. Both blocks match the phase's target text exactly, both doctor runs exit 0, and none
of the four folder READMEs mentions AgentKit. The review's reproduced case — `init --agent-kit`
followed by `harness update` — now reports "Harness is up to date" and keeps both lines.

## Decisions

- The AgentKit detector is `.agentkit/config.yaml` only: "2 vì khi init với --agent-kit, behaivior
  là ak init. Như vậy dựa vào ak đó, suy ngược lại." (user, 2026-11-02).
- The harness's Markdown is installed in Prettier's output rather than ignored: "Đổi sang format
  sẵn (Recommended)" (user, 2026-11-02).
- The `.gitignore` groups are separated by blank lines only, with no comment headers: `init`
  merges an existing `.gitignore` line by line, so a header would be appended out of place.

## Next steps

- The scaffold installs Prettier with a caret range, so a user on a later Prettier 3.x may see the
  harness's Markdown drift again; pinning it exactly in the scaffold's package.json is the
  one-line mitigation and belongs to the user.
- Nothing was committed or pushed.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
