---
id: 0060
title: The harness config defaults are review.minToolCalls 21, memory.maxChars 12800, memory.maxEntryChars 400
status: Accepted
date: 2026-11-18
supersedes: none
---

# 0060: The harness config defaults are review.minToolCalls 21, memory.maxChars 12800, memory.maxEntryChars 400

## Context

The defaults shipped so far — `review.minToolCalls: 14`, `memory.maxChars: 9600`,
`memory.maxEntryChars: 320` — fired reviews too early and capped memory too small for the memory
files real repositories accumulate. No earlier decision set these numbers; the previous plan
([261102-1045-harness-config-defaults](../plans/261102-1045-harness-config-defaults/plan.md)) chose
them without a record. The new values are measured against this repository's own harness usage.

## Decision

- `HARNESS_CONFIG_DEFAULTS` (what `init` writes) and this repository's `.harness/config.json` both
  use `review.minToolCalls: 21`, `memory.maxChars: 12800` and `memory.maxEntryChars: 400`.

> "Update harness config, review.minToolCalls: 21, memory.maxChars: 12800,
> memory.maxEntryChars: 400" (user, 2026-11-18) — the numbers. Config scope: "Cả hai" (user,
> 2026-11-18) — change both the template defaults and this repository's config.

## Options considered

| Option                            | Consequence                                              |
| --------------------------------- | -------------------------------------------------------- |
| New defaults in template and repo | Fresh installs and this repository behave the same       |
| Template only                     | This repository keeps tuning numbers no install shares   |
| Keep 14 / 9600 / 320              | Reviews fire early; memory curation churns on small caps |

## Consequences

- Easier: fewer spurious review prompts and fewer memory-size warnings on both fresh installs and
  this repository.
- Harder: an install whose live config was never edited keeps the old numbers until
  `jss-devtools harness update` merges the new defaults in.
- Enforced by: the config template test and `harness doctor` on this repository.
