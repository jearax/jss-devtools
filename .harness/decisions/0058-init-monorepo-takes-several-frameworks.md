---
id: 0058
title: init --monorepo takes several frameworks, one app under apps/<framework> each
status: Accepted
date: 2026-11-16
supersedes: 0045 (one app per monorepo)
---

# 0058: init --monorepo takes several frameworks, one app under apps/<framework> each

## Context

[0045](./0045-init-monorepo-creates-a-turborepo.md) created a Turborepo with exactly one app. The
user wants one `init --monorepo` run to create several apps, and named the two community forms of a
multi-value flag: the repeated flag and the comma-separated list.

## Decision

With `--monorepo`, `--framework` takes several values, repeated (`--framework nest --framework
react`), comma-separated (`--framework nest,react`) or both mixed; each framework gets its own
`apps/<framework>`, and the root toolchain and harness are still written once. Without
`--monorepo`, `--framework` takes one value. A framework listed twice is an error; nothing is
written. The rest of 0045 stands.

> "tôi cần support cho cả 2" (user, 2026-11-16) [the repeated flag and the comma-separated form]

The user confirmed, among offered options: several values only with `--monorepo`, and a
duplicate framework is an error, not silently dropped.

## Options considered

| Option                         | Consequence                                              |
| ------------------------------ | -------------------------------------------------------- |
| Repeated and comma (chosen)    | Both community forms work, mixed in one command          |
| Duplicate is an error (chosen) | A typo stops before anything is written                  |
| Drop duplicates silently       | Rejected: one folder per framework hides the typo        |
| Several values without a repo  | Rejected: a single-app project has one place for the app |

## Consequences

- Easier: a full-stack starter (`nest,react`) is one command.
- Harder: every pair of presets shares one root toolchain and one install.
- Enforced by: `tests/init.service.test.ts`, `tests/init-plan.service.test.ts`,
  `tests/init.command.test.ts`.
