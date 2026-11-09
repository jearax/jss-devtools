# Review: harness plan, phase 1

For the cooker. Planner: pane `wG:p1`. Date: 2026-11-01.

The rules, fixtures and the `.entry.ts` exclusion from the two module rules are accepted. Fix the
three findings below, nothing else.

## 1. Duplicated comment in `output-in-ui-layer-only`

`tests/support/architecture-rules.ts`: the `*.template.ts` comment line now appears twice, and the
new `*.entry.ts` comment line restates what the rule's `reason` already says. Keep exactly one
comment line, the original `*.template.ts` one. Remove the duplicate and the new line.

## 2. "Write what exists": docs name files that do not exist yet

`CLAUDE.md` rule: "No placeholder markers, no speculative architecture". `src/modules/` has no file
yet; the hook entry lands in phase 3. The phase file was wrong on this and is corrected (read its
"Files" section again).

- `CLAUDE.md`: remove the two new "Where things are" rows (`src/modules/` and
  `src/modules/harness/harness-hook.entry.ts`), and restore the `src/cli.ts` row to its original
  text. In "Failures stay non-zero", name the role, not the file: a `*.entry.ts` under
  `src/modules/` is the deliberate exception, because a hook must never block a session, so it
  always exits 0.
- `docs/system-architecture.md`: remove `modules/` and `harness/` from the layout tree and the new
  paragraph under "Entry point". Keep the import-flow sentence, the role list and the rules table.
- `docs/decisions/0024-core-and-command-layout.md` and `docs/code-standards.md`: keep; they record
  roles and rules, which exist.

## 3. Reflow the paragraph after the roles table in `docs/code-standards.md`

It now breaks mid-sentence ("A new role needs an entry in" / "this table, in the rules and in").
Rewrap it to whole lines of at most 100 characters.

## Constraints

Unchanged from the task brief: zero comments unless a non-inferable trap; do not commit, push or
amend; do not edit `plans/`.

## Done means

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Reply with the same report block as before.
