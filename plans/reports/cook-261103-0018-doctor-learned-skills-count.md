# Cook report: harness doctor counts learned skills in one row

Plan: `plans/261103-0018-doctor-learned-skills-count/plan.md`
Date: 2026-11-03

## What changed

- `src/commands/harness/services/doctor.service.ts`
  - `summaryRows` now pushes one row `{ label: 'Learned skills', status: 'ok', detail: String(learnedSkillNames(root).length) }` after `Decisions`, in place of the per-skill loop that printed `<name>  last used <date>`.
  - Removed the local `usageOf` helper and the `foldSkillUsage` import; nothing else in the command used them.
- `tests/harness-doctor.test.ts`
  - New describe block `harness doctor, the learned skills row`:
    - a fixture with two learned skills (both used today, so no stale warning names them) prints `Learned skills  2` and prints neither skill name;
    - a fixture with no learned skill prints `Learned skills  0`.

The learned-skill warnings from `learnedSkillIssues` are untouched; they still name the skill that needs attention. The skill-usage log and the curator are untouched.

## Verification

Full gate, from the repository root:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Result: green.

```
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
$ tsc --noEmit
$ vitest run
 Test Files  28 passed | 1 skipped (29)
      Tests  443 passed | 7 skipped (450)
$ tsdown --config tsdown.hooks.config.ts && tsdown --config tsdown.config.ts
✔ Build complete
```

The first lint run failed on the new test file (prettier line width and `object-curly-newline`); `pnpm format` fixed it and the gate was rerun from the top.

## Doctor output on a fixture with two learned skills

Fixture: a repo installed by `jss-devtools init --yes`, with `.claude/skills/find-things/SKILL.md` and `.claude/skills/spot-bugs/SKILL.md` marked `harness-origin: learned`, and a `.harness/state/skill-usage.json` that dates both to today.

```
┌   jss-devtools harness doctor 
│  ✔ Version         0.0.1
│  ✔ Memory          488/4800 chars, 5 entries
│  ✔ Decisions       0 decisions in force
│  ✔ Learned skills  2
│
└  Harness is healthy
```

Exactly one `Learned skills` row, carrying the count only.

## Notes and limitations

- No commit and no push was made; the working tree holds the change for review.
- No documentation file described the per-skill summary rows, so no docs update was needed.
- The fixture used for the doctor output above was created under `/tmp/jss-fixture` and left in place for inspection.

## Unresolved questions

None.
