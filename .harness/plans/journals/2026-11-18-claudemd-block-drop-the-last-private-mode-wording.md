---
title: "CLAUDE.md block: drop the last private-mode wording"
date: 2026-11-18
summary: "Follow-up to 5c38686: rewrote the Done-means-proven block, forced a same-version harness re-render, cleaned two site share-mode leftovers"
---

# CLAUDE.md block: drop the last private-mode wording

## What happened

Commit 5c38686 retired `--share-knowledge` (decision 0059) but missed the wording in
`src/modules/harness/templates/claude-block.template.ts:91-92`: "ask for no commit" only made sense
when knowledge was gitignored. Rewrote it to "Knowledge is committed with the work it describes; the
harness itself never commits." and updated the snapshot
`tests/__snapshots__/harness-install-plan.service.test.ts.snap` by hand first — the suite then
passed unchanged, proving the hand edit matched the render byte-for-byte.

`node dist/cli.mjs harness update` refused to re-render: "Harness is up to date". The preflight
shortcut (`update-preflight.service.ts:147-157`) returns up-to-date when manifest version equals the
CLI version, no config keys are missing and the hook files match — it never diffs the CLAUDE.md
block. Same-version template changes are invisible to it. Bypassed it the way 5c38686 did, without
noticing: temporarily removed `memory.maxChars` from `.harness/config.json` so
`missingConfigKeys` went non-empty, ran `harness update --yes` (dry-run first: 3 files), and the
config-merge restored the key from defaults. The merge writes keys in `HARNESS_CONFIG_DEFAULTS`
order, so the config diff is a cosmetic key reorder, not a content change; prettier-clean
`.claude/settings.json` came back byte-identical to HEAD after the update's rewrite.

The broad grep per 0059's acceptance scope found two real leftovers in the site:
`HARNESS_SESSION_CONTEXT` still listed "The knowledge state: shared through git, or private to this
machine" (that line is gone from the session-start hook) and `HARNESS_KNOWLEDGE_TABLE`'s doc comment
still described both share modes and cited the deleted ignore templates. Fixed both in
`site/src/constants/harness.constant.ts`. Kept the `Sections.tsx` retired-key sentence and the
`init.command.test.ts` negative test — both describe current behavior.

Checks: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — 611 passed, 35 skipped; site
sequence — 131 passed. Nothing committed.

## Decision

Left the manifest-hash gap alone: `harness update` reporting up-to-date while a managed block is
stale is a product gap, but fixing it needs a policy call about what the shortcut may skip, so it
goes to next steps instead of a code change here.

## Next steps

- Consider having the preflight shortcut also compare managed-file hashes (or the block hash), so a
  same-version template change re-renders without a config-key nudge.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
