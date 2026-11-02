export const harnessTemplatesReadmeTemplate = `# Templates

Each template holds the rules and the format for one kind of file: read it before writing one.
\`jss-devtools harness update\` replaces them; do not edit them here.

| Template                                       | For                                  | Index to update          |
| ---------------------------------------------- | ------------------------------------ | ------------------------ |
| [decision.md](./decision.md)                   | \`../decisions/NNNN-<slug>.md\`        | \`../decisions/README.md\` |
| [docs/topic.md](./docs/topic.md)               | \`../docs/<topic>.md\`                 | \`../docs/README.md\`      |
| [docs/architecture.md](./docs/architecture.md) | \`../docs/architecture.md\`            | \`../docs/README.md\`      |
| [docs/runbook.md](./docs/runbook.md)           | \`../docs/runbook-<operation>.md\`     | \`../docs/README.md\`      |
| [plan.md](./plan.md)                           | \`../plans/active/<YYMMDD>-<slug>.md\` | none                     |
| [skill.md](./skill.md)                         | \`.claude/skills/<name>/SKILL.md\`     | none                     |\n`;

export const harnessDecisionTemplateTemplate = `# Template: decision

For \`.harness/decisions/NNNN-<slug>.md\`. Never copy this file itself there.

- **When**: the user chose something later work must follow: policy, a limit, a permission, an API
  contract, a tool or workflow rule. Code defaults, conventions and facts go to memory.
- **Source**: quote the user's own words. No quote, no decision: ask instead.
- **Redact**: the repository outlives the chat. Quote only the words that carry the decision; write
  repo-relative paths, \`<url>\`, \`<host>\`, \`<customer>\`, and people as their role (\`[a teammate]\`).
  Cut with \`…\`, put your own words in \`[ ]\`; never change the meaning or translate.
- **Number**: the next free \`NNNN\`, zero-padded, never reused.
- **Title**: a rule an agent can apply ("Update conflicts are decided by a human"), not a topic.
- **Immutable**: to change a decision, write a new one with \`supersedes: NNNN\` and set the old one's
  \`status\` to \`Superseded by NNNN\`. Redacting a quote is the only edit allowed.
- **Conflict**: when a request contradicts a decision in force, name it to the user before acting.
- **Index**: its row in \`../decisions/README.md\`, in the same change.
- Under ~40 lines; link code, docs and plans instead of copying them.

\`\`\`markdown
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

| Option     | Consequence   |
| ---------- | ------------- |
| <chosen>   | <why it won>  |
| <rejected> | <why it lost> |

## Consequences

- Easier: ...
- Harder: ...
- Enforced by: <test, hook, check, or "review only">
\`\`\`\n`;

export const harnessSkillTemplateTemplate = `# Template: learned skill

For \`.claude/skills/<name>/SKILL.md\`, a procedure learned in this repository.

- **When**: a multi-step procedure worked and will recur for a class of tasks, not one incident. A
  one-line fact goes to \`.harness/MEMORY.md\`.
- **Patch first**: if a learned skill covers the task, patch it instead of adding a sibling.
- **Name**: kebab-case, equal to the folder; never starting with \`ak-\` or \`harness-\`.
- **Description**: the main use case first, then the situations that should trigger it, so it does
  not fire on unrelated work. Under 1,536 characters.
- **Marker**: \`metadata.harness-origin: learned\`; \`harness-pinned: "true"\` only when curation must
  never archive it.
- **Content**: exact commands and paths; pitfalls as rules with a short reason, no stories or dates.
- Under ~100 lines, with the headings below.

\`\`\`markdown
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
\`\`\`\n`;

export const harnessPlanTemplateTemplate = `# Template: plan

For \`.harness/plans/active/<YYMMDD>-<slug>.md\`: work that spans sessions. A bounded change needs no
plan.

- **Update**: tick Progress, set Status and add Validation evidence in the same change as the work.
- **Finish**: fill Result with verified evidence, set Status to \`Completed\`, \`git mv\` the file to
  \`completed/\`. A blocked plan stays in \`active/\`.
- **Records**: never rewrite a completed plan; start a new one that links it.
- A user decision goes to \`../decisions/\`; lasting knowledge to \`../docs/\` or \`../MEMORY.md\`.

\`\`\`markdown
# Plan: <title>

Date: YYYY-MM-DD
Status: Active | Blocked | Completed

## Outcome

The observable result this work must produce.

## Context

Links to the decisions, docs, code and tests it depends on.

## Scope

In: ...
Out: ...

## Approach

The smallest coherent sequence; revise it when evidence changes it.

## Risks

- Risk, mitigation, rollback.

## Progress

- [ ] Step.

## Validation

- Command run, and what it showed.

## Result

Verified outcome, limits, follow-ups. Filled before moving to \`completed/\`.
\`\`\`\n`;

export const harnessDocsTopicTemplateTemplate = `# Template: topic doc

For \`.harness/docs/<topic>.md\`: one area of the repository, longer than a memory line.

- **When**: a fact needs more than one line, or several memory lines describe one area. Move them
  here and leave one line in \`.harness/MEMORY.md\`: \`- <fact>. See .harness/docs/<topic>.md\`.
- **Scope**: one topic per file; extend an existing doc before adding a near-duplicate.
- **Content**: current behavior only, each claim with \`(src: path:line)\`. History, plans and
  decisions are linked, not copied.
- **Truth**: read the sources before writing; prefix a claim you could not verify with
  "Unverified:". Fix or delete a claim that no longer holds when you touch the area.
- **Index**: its row in \`../docs/README.md\`, in the same change.
- Under ~150 lines; split by sub-topic when it grows.

\`\`\`\`markdown
---
title: <topic>
kind: topic
sources: [<path>, <test path>]
---

# <Topic>

> What a teammate must know about this area, in one sentence.

## How it works

Current behavior, naming files and functions as \`path:line\`.

## Rules

- Rule, why it holds. \`(src: path:line)\`

## Traps

- What goes wrong, how it shows (exact error text), how to avoid it.

## Verify

\`\`\`bash
<command that proves the claims above still hold>
\`\`\`
\`\`\`\`\n`;

export const harnessDocsArchitectureTemplateTemplate = `# Template: architecture doc

For \`.harness/docs/architecture.md\`, the one system overview.

- **When**: onboarding a repository with code, or a change that adds, removes or rewires a
  component, a boundary or an external dependency. Update it in that change.
- **One file**: a component that outgrows its table row gets a topic doc linked from here.
- **Content**: what exists now, proven by entry points, config and tests \`(src: ...)\`. No roadmap;
  the reasons for a choice live in decisions.
- **Diagram**: a Mermaid \`flowchart LR\` only when it replaces more than a paragraph, under ~15 nodes.
- **Index**: its row in \`../docs/README.md\`.
- Under ~200 lines.

\`\`\`markdown
---
title: Architecture
kind: architecture
sources: [<entry point>, <config>]
---

# Architecture

> What the system does and for whom, in one sentence.

## Components

| Component | Path | Responsibility |
| --------- | ---- | -------------- |

## Main path

Numbered steps of the main request or job, naming the file at each step.

## Boundaries

- What must never cross a boundary, and what enforces it (test, type, lint rule, CI).

## External dependencies

| Dependency | Used for | On failure |
| ---------- | -------- | ---------- |

## Build, test, run

The exact commands, and what about them is not obvious.
\`\`\`\n`;

export const harnessDocsRunbookTemplateTemplate = `# Template: runbook

For \`.harness/docs/runbook-<operation>.md\`: an operation a person repeats (deploy, release,
restore, rotate). A procedure agents repeat while coding is a learned skill instead.

- **Evidence**: only steps you ran or watched; prefix anything else with "Unverified:".
- **Commands**: exact and copy-pasteable, each with the output that means it worked.
- **Rollback**: required; when there is none, say so.
- **Secrets**: name the variable, vault entry or file, never the value.
- **Index**: its row in \`../docs/README.md\`, in the same change.

\`\`\`markdown
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

1. \`<command>\`: the output that means it worked.

## Verify

- The observable result that proves success.

## Rollback

1. \`<command>\`: what it undoes.

## Failures

| Symptom | Likely cause | Action |
| ------- | ------------ | ------ |
\`\`\`\n`;
