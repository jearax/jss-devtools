# Template: runbook

For `.harness/docs/runbook-<operation>.md`: an operation a person repeats (deploy, release,
restore, rotate). A procedure agents repeat while coding is a learned skill instead.

- **Evidence**: only steps you ran or watched; prefix anything else with "Unverified:".
- **Commands**: exact and copy-pasteable, each with the output that means it worked.
- **Rollback**: required; when there is none, say so.
- **Secrets**: name the variable, vault entry or file, never the value.
- **Index**: its row in `../docs/README.md`, in the same change.

```markdown
---
title: Runbook, <operation>
kind: runbook
sources: [<script>, <workflow file>]
---

# Runbook: <operation>

> When to run it, in one sentence.

## Before

- [ ] Access, tools and state required (clean tree, green CI, backup taken).

## Steps

1. `<command>`: the output that means it worked.

## Verify

- The observable result that proves success.

## Rollback

1. `<command>`: what it undoes.

## Failures

| Symptom | Likely cause | Action |
| ------- | ------------ | ------ |
```
