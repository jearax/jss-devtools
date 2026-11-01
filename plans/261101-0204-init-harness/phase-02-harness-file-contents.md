---
phase: 2
title: "Harness file contents, reviewed by the user"
status: completed
priority: P1
effort: "1d"
dependencies: []
---

# Phase 2: Harness file contents, reviewed by the user

## Goal

Write the text of every file the harness installs, short and in the user's words, and get the
user's approval file by file before any of it becomes code.

## Context

"Giữ nguyên 0013 á, còn nội dung files thì xem xét lại ... sao cho câu văn, ý, mô tả đúng thứ mình
muốn, ngắn gọn" (user, 2026-11-01). Every `.harness/` README is an index, loaded on demand
(decision log, section "Every `.harness/` README is an index"). The prototype's files under
`assets/` and the installed copies in `/Users/tandm/Desktop/test-harness` show what each file is for;
their wording is not reused as is.

## Deliverable

Plain Markdown drafts under `plans/261101-0204-init-harness/content/`, one per installed file, at
the path it will be installed to (for example `content/.harness/MEMORY.md`). There are no variant
files: a line about AgentKit is a condition in the one copy ("When `ak-*` skills are present"). No `src/` change in this phase; phase 4 turns
the approved drafts into `.template.ts` files.

| Installed path | Kind | Notes |
|---|---|---|
| `CLAUDE.md` block | block | Loaded every session: rules and the knowledge-routes table only; one conditional line for ak ownership |
| `.harness/MEMORY.md` | seed | Header rules; size limits named by their `config.json` key, not as numbers |
| `.harness/BOOTSTRAP.md` | seed | Two copies, for create mode and existing mode, holding only the steps; the onboard skill deletes it |
| `.harness/decisions/README.md` | seed | Index: purpose line, template link, empty table `# / Title / Status / Date` |
| `.harness/docs/README.md` | seed | Index: purpose line, template link, empty table; one conditional line for AgentKit |
| `.harness/plans/README.md` | managed | `active/` then `completed/` from `templates/plan.md`; one conditional line: with AgentKit its skills decide the layout |
| `.harness/templates/README.md` | managed | Index of templates and the index each one updates |
| `.harness/templates/decision.md`, `skill.md`, `plan.md`, `docs/topic.md`, `docs/architecture.md`, `docs/runbook.md` | managed | The rules for writing each kind live here, not in the READMEs |
| `.claude/skills/harness-onboard/SKILL.md` | managed | Asks before running (H1); `git pull` first; read only; writes memory and docs; runs `jss-devtools harness doctor`; deletes `BOOTSTRAP.md`; lists the files for the user to commit, never commits |
| `.claude/skills/harness-review/SKILL.md` | managed | What it may edit (design proposal section 4); K2's order patch, umbrella, support file, new; description main use case first, under 1,536 characters; never commits |
| `.claude/skills/harness-curate/SKILL.md` | managed | Proposes archives and merges; never deletes, never commits |
| `.harness/config.json` | config | Keys and defaults of design proposal section 5 |
| `.harness/.gitignore` | managed | `state/`, `update/` |

## Writing rules

- Every README: one purpose line, the template to start from, the index table. Nothing else.
- A sentence states a rule and, when it is not obvious, its reason in a clause. No narration, no
  history, no plan IDs.
- AgentKit appears only as a condition ("When `ak-*` skills are present"), never as a second copy.
- Skill descriptions name when to run them, so they do not fire on unrelated work (H9).

## Review gate

The planner sends the drafts to the user in groups (always-loaded: the `CLAUDE.md` block and
`MEMORY.md`; indexes; templates; skills; config). Phase 4 may encode only drafts the user
approved; record each approval with the user's words in the decision log.

## Validation

- Every path in the design proposal's file table has a draft.
- The `CLAUDE.md` block and `MEMORY.md` seed together stay under 6,000 characters (they load every
  session).

## Risk and rollback

Text only; nothing ships until phase 4.
