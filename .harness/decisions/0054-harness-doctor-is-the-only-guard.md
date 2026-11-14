---
id: 0054
title: harness doctor is the only guard against publishing private content
status: Accepted
date: 2026-11-14
supersedes: none
---

# 0054: harness doctor is the only guard against publishing private content

## Context

A git hook could scan every commit for secrets and private paths, but the project's design avoids
forcing tooling on the user's repository, and the harness already ships a repository doctor.

## Decision

- No git hook and no CI gate ships with the harness. `harness doctor` is the only guard: its
  content check scans the files git would publish, plus `.claude/skills/`.
- The check reports secret-shaped values (named rules: keys and tokens for AWS, GitHub, Slack,
  GitLab, npm, Stripe, Google, OpenAI-shaped keys, JWTs, private-key headers, credentials in URLs,
  Authorization header values, credential assignments) as errors anywhere, and private content (absolute home
  paths, e-mail addresses) as errors in published files only.
- It cannot catch a private name with no shape (a customer, a host in prose) or anything already
  pushed. A line ending with `harness-doctor: allow` is skipped and counted.
- Extends [0033](./0033-harness-doctor.md).

> "thiết kế ban đầu của project là tránh rườm rà (husky không force user bắt buộc có đc)" (user,
> 2026-11-13); on the redaction upgrade: "Nhớ nâng cấp, cái tiến redaction.service.ts" (user,
> 2026-11-13)

## Options considered

| Option            | Consequence                                                                        |
| ----------------- | ---------------------------------------------------------------------------------- |
| Doctor-only guard | No forced tooling; the user runs one command before pushing                        |
| A git hook        | Catching at commit time, but every contributor's repository is modified on install |

## Consequences

- Easier: installing the harness adds no hooks to the user's git.
- Harder: nothing stops a push; the docs must say to run `harness doctor` first.
- Enforced by: the content check in `harness doctor`, and review.
