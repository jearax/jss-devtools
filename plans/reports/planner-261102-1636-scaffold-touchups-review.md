# Review: scaffold touch-ups

Report: `plans/reports/cooker-261102-1602-scaffold-touchups-done.md`. Verdict: the three phases
match the plan; three fixes before commit.

## 1. `.harness/core/` belongs in `.prettierignore`

The concern you raised is a defect, not a note: on a fresh scaffold, the user's first
`pnpm format` rewrites `.harness/core/base/.harness/bin/hooks.mjs` and the doctor warns from then
on. `.harness/core/` holds only machine-written files (the manifest and the base copies the
three-way merge reads), the same class as `.harness/bin/`. Decision: add it.

- `prettierignore.template.ts`: `.harness/core/` on the line after `.harness/bin/`, same group.
- The snapshot and the "repeats no `.gitignore` entry" test follow.
- Rerun phase 2 step 4 in a fresh temp folder: `pnpm format` twice, `git status --porcelain`
  empty after both, doctor with no "changed from its base" line. Paste it.
- Update the phase 2 file's target list to name `.harness/core/`, with one line on why.

## 2. 0034 states two things that are not so

- Decision paragraph: "The block states one rule per updater — … `ak-*` skills and
  `.claude/{…}/` belong to `ak update` — and the AgentKit variant adds …". The `ak update` line is
  in the AgentKit variant only. Say that both variants carry the `harness update` line, and the
  AgentKit variant adds the `ak update` line and the ownership line.
- Options table, "One block for both cases": the previous block did not tell a repository without
  AgentKit that AgentKit owns its folders; its line was conditional ("When `ak-*` skills are
  present"). The reason it was replaced is the user's request quoted above it. Rewrite the
  consequence as: the previous state, one conditional line in every repository; replaced at the
  user's request so the block states only what holds.

## 3. Mark the plan completed

`status: completed` in `plan.md` and the three phase files once 1 and 2 are done.

## Report back

Edit only what is named here. Run the full gate
(`pnpm lint && pnpm typecheck && pnpm test && pnpm build`) and reply with its tail, the step 4
output, and:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
```

## Round 3: user decisions

- `npm-shrinkwrap.json` leaves `.prettierignore`: no package manager writes it by default.
- The scaffold's Prettier keeps its caret range, as decision 0030 says. A newer Prettier 3.x that
  reformats harness Markdown only brings back doctor warnings, which `harness update` merges.
