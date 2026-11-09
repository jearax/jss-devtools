---
title: Dry-run apply line reads root rawArgs
date: 2026-11-03
summary: Nested commands now show their full path in the dry-run apply line via a shared root-walking helper
---

# Dry-run apply line reads root rawArgs

## What happened
The "To apply" line after --dry-run repeated only what `command.parent.rawArgs` held. Commander sets `rawArgs` on the parsed root only, so `jss-devtools harness update --dry-run -y` printed `jss-devtools` alone; `init` worked only because it sits directly under root. The duplicated helpers (`typedWordsOf`, `typedWords`) passed their unit tests because the tests faked `parent.rawArgs`.

Fix: new `src/core/utils/apply-command-line.util.ts` walks `parent` to the root, slices `rawArgs` after node+script, drops `--dry-run`, prepends `PACKAGE.name` (the bin key). Both `update.command.ts` and `init.command.ts` call it; the local helpers are deleted. Parameter typed structurally (`CommandLike`, parent accepts null|undefined) because the architecture rule forbids commander imports outside `*.command.ts`/`cli.ts`.

Tests rebuilt through a real commander tree: nested path, top-level init, empty positional quoted, space-containing positional quoted. Test trees need minimal option/argument definitions or commander calls process.exit on unknown options/excess args.

## Decision
Root-walk + structural typing over widening the commander import allowance; kept the architecture rule intact.

## Next steps
Planner reviews and commits (plan rule: no commit from cooker).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
