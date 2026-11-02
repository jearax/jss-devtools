---
title: "Harness config defaults for a medium project"
description: "Change the defaults init writes to .harness/config.json to 7 / 4800 / 300 / 10 / 7 / 14 / 28."
status: completed
priority: P2
effort: 1h
branch: main
tags: [harness, config]
blockedBy: []
blocks: []
created: 2026-11-02
---

# Harness config defaults for a medium project

## Outcome

`jss-devtools init` and `harness update` (for a missing key) write these defaults to
`.harness/config.json`:

```json
{
	"review": { "minToolCalls": 7 },
	"memory": { "maxChars": 4800, "maxEntryChars": 300 },
	"curator": { "minLearnedSkills": 10, "intervalDays": 7, "staleDays": 14, "archiveDays": 28 }
}
```

## Input

> "Chốt 7 / 4800 / 300 / 10 / 7 / 14 / 28, lên plan thôi, không giao cooker." (user, 2026-11-02)

The reasons are in the
[decision log](../261031-2325-init-harness-discussion/decision-log.md#config-defaults-for-a-medium-project-2026-11-02-supersedes-h0s-values).
The plan is written now and handed to the cooker only when the user says so.

## Phases

| #   | Phase                                                         | Depends on |
| --- | ------------------------------------------------------------- | ---------- |
| 1   | [Change the defaults](./phase-01-change-the-defaults.md)      | none       |

## Acceptance

- `HARNESS_CONFIG_DEFAULTS` in `src/modules/harness/templates/harness-config.template.ts` holds the
  new values; it stays the only home of the defaults in `src/`.
- A fresh `init` writes the new `config.json`; `harness update` on a repository with a key missing
  writes that key with its new default and leaves every existing value as it is.
- Tests that assert the shipped defaults use the new values or read `HARNESS_CONFIG_DEFAULTS`;
  tests that pass their own config keep it.
- The draft `plans/261101-0204-init-harness/content/.harness/config.json` matches.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green.

## Non-goals

- Changing any value in a repository that already has the harness installed.
- New keys or new behavior for any key.

## Timing

If this lands before the eval pilot (`~/Desktop/jss-harness-eval`, phase 3), the pilot measures
the defaults that ship; otherwise the eval report states it measured the old ones.
