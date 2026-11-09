---
name: harness-review
description: Turn what this session learned into repository knowledge: memory lines, docs, learned skills and user decisions. Run when the Stop hook says a harness review is due, or when the user asks to review or remember what was learned.
---

# Harness review

Review only this session. Keep what saves a teammate's agent real time; drop the rest. Edits apply
without approval, so be precise: the git diff is the record.

## 1. Collect

- User decisions: the user chose a policy or a design.
- User corrections: the user said an approach, assumption or result was wrong.
- Dead ends: something failed and another path worked. Attribute each failure first; a subagent's
  failure is not yours.
- Procedures likely to recur for this class of task.
- Non-obvious facts: commands, variables, ordering, hidden coupling.

Keep an item only if a teammate who clones the repository would need it. A personal preference
belongs in your own memory, not the repository.

## 2. Write each item to one place

Use the table in `CLAUDE.md`, and start every new file from its template.

- One-line fact: merge into an existing `.harness/MEMORY.md` line before adding one.
- User decision: quote the user; never record your own inference.
- Procedure, the first that fits: patch the learned skill used this session; patch a learned skill
  whose trigger already covers it; add a file to that skill's `references/` or `scripts/`; create a
  class-level skill ("db-migration-rollback", not the incident).

Never edit `harness-*` or `ak-*` skills, `.harness/templates/`, `.harness/bin/` or
`.harness/core/`; put a correction to them in a learned skill or a memory line. Never delete a skill.

## 3. Promote what recurs

When a lesson already in memory or a skill was needed again, propose to the user, without applying
it: a rule in `CLAUDE.md` outside the harness block, or a test, lint rule or script when breaking it
breaks something.

## 4. Limits

- Not: one-off details, what the code plainly shows, what `CLAUDE.md` says, narration, dates, PR
  numbers, secrets, home paths, private names or URLs.
- When the memory guard rejects an edit for size, move the detail into a doc and leave a pointer
  line, in the same turn.

## 5. Report

Never stage or commit. End with:

```text
Harness review:
- memory: +1 (integration tests need DOCKER_HOST)
- skill: patched deploy-preview
- docs: none
- decision: none
- proposed: none
- files: .harness/MEMORY.md, .claude/skills/deploy-preview/SKILL.md
```

Commit them with the work they describe, so a revert carries both. If nothing qualifies, reply
`Harness review: nothing to keep.`
