---
title: Retire --share-knowledge and raise the harness config defaults
date: 2026-11-18
summary: Removed the knowledge.share feature end to end; defaults now 21/12800/400; both check sequences green
---

# Retire --share-knowledge and raise the harness config defaults

## What happened

Implemented plan 261118-2103-remove-share-knowledge across all five phases. The private/shared
knowledge mode (decision 0053) is gone: the `init --share-knowledge` option, the `knowledge.share`
config key, `resolveKnowledgeShare`, `knowledgeInSync`, the doctor `Knowledge` row, the
session-start shared/private line and the private-mode seeding were all removed; harness knowledge
is ordinary tracked content and the ignore files render one variant (`state/` + `update/` only).
`mergeHarnessConfig` now leaves unknown keys (an old install's live `knowledge.share`) untouched,
so old installs keep working silently. Config defaults rose to `minToolCalls: 21`,
`maxChars: 12800`, `maxEntryChars: 400` in both `HARNESS_CONFIG_DEFAULTS` and this repo's
`.harness/config.json`. This repository ran `harness update` from the built bundle and its git
index was refreshed (`git rm -r --cached` + `git add`); only decisions 0059/0060 and the plan
folder entered the index.

Notable traps hit: dropping `.claude/skills/.gitignore` removed two plan entries (file + base
copy), so the create-mode plan-count assertions are 48, not 49; a Node heredoc generator wrote a
raw ESC byte into `transcripts.constant.ts` (JS interpreted `\u001b` at string-creation), caught
by the skill's eval-and-compare verification; and the sample onboarding decision needed a user
quote or the content check flags it.

## Decision

Decisions 0059 (supersedes 0053, quotes the user: "Bỏ hẳn key knowledge.share", "Bỏ qua key im
lặng", "Giữ nguyên plan cũ") and 0060 (21/12800/400) recorded. One judgment call: the acceptance
grep said the decision records should be the only place the term remains, but phase 3 mandates a
test asserting `--share-knowledge` is rejected, and phase 5 mandates docs matching code — so the
rejection test and three one-line compatibility notes naming the retired key (pointing at 0059)
stay. Site transcripts (doctor ×2, init ×2) re-captured per the capture-cli-transcript skill and
verified byte-equal against the capture files.

## Next steps

Planner owns commit and push (a push deploys the site image). Report:
`.harness/plans/reports/cook-261118-2137-retire-share-knowledge.md`.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
