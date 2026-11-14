export const harnessOnboardSkillTemplate = `---
name: harness-onboard
description: Seed the harness knowledge of a repository the harness was just installed into, by following .harness/BOOTSTRAP.md. Run when the session-start hook reports that onboarding is pending, or when the user asks to onboard the harness.
---

# Harness onboard

\`.harness/BOOTSTRAP.md\` holds the steps for this repository; this skill holds the rules around them.

1. Ask the user whether to onboard now. If not, stop; the hook asks again next session.
2. If knowledge is shared and the repository has a remote, \`git pull\`. If
   \`.harness/BOOTSTRAP.md\` is gone afterwards, a teammate already onboarded: stop.
3. Follow \`.harness/BOOTSTRAP.md\` step by step. Read only: install nothing, start nothing, change
   no code.
4. Write what you found where the table in \`CLAUDE.md\` says, starting each file from its template.
5. Ask the user the policy questions the code cannot answer. Record a decision only with the user's
   words; code shows what the repository does, not what it must do.
6. If \`jss-devtools\` is installed, run \`jss-devtools harness doctor\` and fix what it reports.
7. Delete \`.harness/BOOTSTRAP.md\`.
8. List every file you wrote and the deletion. When knowledge is shared, tell the user to commit
   them: until that commit lands, every teammate is asked to onboard again. Never stage or commit
   yourself.

## Pitfalls

- Skip what the README or the code already says plainly; memory is for what is hard to rediscover.
- An inference about intent is a question for the user, never a decision.\n`;

export const harnessReviewSkillTemplate = `---
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

Use the table in \`CLAUDE.md\`, and start every new file from its template.

- One-line fact: merge into an existing \`.harness/MEMORY.md\` line before adding one.
- User decision: quote the user; never record your own inference.
- Procedure, the first that fits: patch the learned skill used this session; patch a learned skill
  whose trigger already covers it; add a file to that skill's \`references/\` or \`scripts/\`; create a
  class-level skill ("db-migration-rollback", not the incident).

Never edit \`harness-*\` or \`ak-*\` skills, \`.harness/templates/\`, \`.harness/bin/\` or
\`.harness/core/\`; put a correction to them in a learned skill or a memory line. Never delete a skill.

## 3. Promote what recurs

When a lesson already in memory or a skill was needed again, propose to the user, without applying
it: a rule in \`CLAUDE.md\` outside the harness block, or a test, lint rule or script when breaking it
breaks something.

## 4. Limits

- Not: one-off details, what the code plainly shows, what \`CLAUDE.md\` says, narration, dates, PR
  numbers, secrets, home paths, private names or URLs.
- When the memory guard rejects an edit for size, move the detail into a doc and leave a pointer
  line, in the same turn.

## 5. Doctor check

If \`jss-devtools\` is installed, run \`jss-devtools harness doctor\` and fix what the content check
reports.

## 6. Report

Never stage or commit. End with:

\`\`\`text
Harness review:
- memory: +1 (integration tests need DOCKER_HOST)
- skill: patched deploy-preview
- docs: none
- decision: none
- proposed: none
- files: .harness/MEMORY.md, .claude/skills/deploy-preview/SKILL.md
\`\`\`

When knowledge is shared, commit them with the work they describe, so a revert carries both. If
nothing qualifies, reply
\`Harness review: nothing to keep.\`\n`;

export const harnessCurateSkillTemplate = `---
name: harness-curate
description: Keep the harness knowledge small and true: shrink memory, merge overlapping learned skills, propose archiving idle ones, resolve conflicting decisions. Run when the Stop hook says curation is due, or when the user asks to clean up harness knowledge.
---

# Harness curate

Curation removes, merges and moves; it never adds knowledge, which is review's job. Settings are in
\`.harness/config.json\` under \`curator\` and \`memory\`.

1. If \`jss-devtools\` is installed, run \`jss-devtools harness doctor\` and read every issue.
2. **Memory**: bring \`.harness/MEMORY.md\` under 70% of \`memory.maxChars\`. For each line: keep,
   shorten, merge, move to a doc with a pointer line, or delete. Check each \`(src: ...)\` against
   its source and delete what no longer holds.
3. **Learned skills** (\`metadata.harness-origin: learned\` only): fix steps that drifted from the
   code. Then propose to the user, from \`.harness/state/skill-usage.json\`:
   - merging skills whose triggers overlap into the clearer one;
   - archiving skills not used for \`curator.archiveDays\`, unless \`harness-pinned: "true"\`.
     Apply only what the user accepts. Archiving moves the folder to \`.harness/archive/<name>/\`;
     nothing is deleted.
4. **Your own memory**: entries about this repository that a teammate would need move into
   \`.harness/MEMORY.md\` or \`.harness/docs/\`. Ask before removing them from your memory; leave
   personal entries alone.
5. **Decisions**: when two decisions in force conflict, ask the user which wins, then write a new
   decision superseding the other.
6. Never stage or commit. List every file changed, archive moves included, for the user to commit
   when knowledge is shared, with \`.harness/curator.json\`, which the Stop hook updates at the end
   of this turn: committing it tells teammates the curation is done.

## Pitfalls

- Usage is counted on this machine only; a skill idle here may be used by a teammate. Say so when
  proposing an archive.
- Never touch a skill without the learned marker.\n`;
