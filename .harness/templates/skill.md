# Template: learned skill

For `.claude/skills/<name>/SKILL.md`, a procedure learned in this repository.

- **When**: a multi-step procedure worked and will recur for a class of tasks, not one incident. A
  one-line fact goes to `.harness/MEMORY.md`.
- **Patch first**: if a learned skill covers the task, patch it instead of adding a sibling.
- **Name**: kebab-case, equal to the folder; never starting with `ak-` or `harness-`.
- **Description**: the main use case first, then the situations that should trigger it, so it does
  not fire on unrelated work. Under 1,536 characters.
- **Marker**: `metadata.harness-origin: learned`; `harness-pinned: "true"` only when curation must
  never archive it.
- **Content**: exact commands and paths; pitfalls as rules with a short reason, no stories or dates.
- Under ~100 lines, with the headings below.

```markdown
---
name: <name>
description: <what it does>. Use when <concrete situations>.
metadata:
  harness-origin: learned
  harness-pinned: 'false'
---

# <Title>

## When to use

- Task shape, files or error text that call for it.

## Procedure

1. Step with the exact command or file.

## Pitfalls

- Rule, and why.

## Verification

- The command or observation that proves it worked.
```
