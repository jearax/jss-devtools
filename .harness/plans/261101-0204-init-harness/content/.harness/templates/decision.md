# Template: decision

For `.harness/decisions/NNNN-<slug>.md`. Never copy this file itself there.

- **When**: the user chose something later work must follow: policy, a limit, a permission, an API
  contract, a tool or workflow rule. Code defaults, conventions and facts go to memory.
- **Source**: quote the user's own words. No quote, no decision: ask instead.
- **Redact**: the repository outlives the chat. Quote only the words that carry the decision; write
  repo-relative paths, `<url>`, `<host>`, `<customer>`, and people as their role (`[a teammate]`).
  Cut with `…`, put your own words in `[ ]`; never change the meaning or translate.
- **Number**: the next free `NNNN`, zero-padded, never reused.
- **Title**: a rule an agent can apply ("Update conflicts are decided by a human"), not a topic.
- **Immutable**: to change a decision, write a new one with `supersedes: NNNN` and set the old one's
  `status` to `Superseded by NNNN`. Redacting a quote is the only edit allowed.
- **Conflict**: when a request contradicts a decision in force, name it to the user before acting.
- **Index**: its row in `../decisions/README.md`, in the same change.
- Under ~40 lines; link code, docs and plans instead of copying them.

```markdown
---
id: NNNN
title: <rule>
status: Accepted
date: YYYY-MM-DD
supersedes: none
---

# NNNN: <rule>

## Context
The question and the constraint behind it, in two to five sentences.

## Decision
The rule, phrased so an agent can apply it.

> "<the user's words>" (user, YYYY-MM-DD)

## Options considered
| Option | Consequence |
|---|---|
| <chosen> | <why it won> |
| <rejected> | <why it lost> |

## Consequences
- Easier: ...
- Harder: ...
- Enforced by: <test, hook, check, or "review only">
```
