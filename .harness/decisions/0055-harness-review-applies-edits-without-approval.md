---
id: 0055
title: harness-review applies its edits without approval
status: Accepted
date: 2026-11-14
supersedes: none
---

# 0055: harness-review applies its edits without approval

## Context

The review skill writes memory lines, docs, learned skills and decision records directly. The
poisoning path is real: text from a web page or a tool result can be written as a "lesson" and the
session-start hook injects it into every later session in the repository.

## Decision

- `harness-review` keeps applying its edits without approval; the git diff is the only gate. The
  skill never stages or commits, so every edit sits in the working tree for a human to read.
- Combined with [0052](./0052-hook-files-stay-in-the-repository.md): read the diff on the forge
  before checking a branch out and opening Claude Code in it, because the hooks run when the
  session starts.

> "Giữ nguyên" (user, 2026-11-13), on whether harness-review should start asking for approval

## Options considered

| Option                        | Consequence                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Edits apply, diff is the gate | The review stays fast; the human reads the diff instead of a prompt per edit |
| Approve each edit             | Slower reviews, and an approval prompt trains the user to approve blindly    |

## Consequences

- Easier: a review session finishes without round-trips.
- Harder: a poisoned lesson lands in the working tree until the diff is read and reverted.
- Enforced by: review only.
