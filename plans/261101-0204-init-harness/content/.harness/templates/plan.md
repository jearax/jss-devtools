# Template: plan

For `.harness/plans/active/<YYMMDD>-<slug>.md`: work that spans sessions. A bounded change needs no
plan.

- **Update**: tick Progress, set Status and add Validation evidence in the same change as the work.
- **Finish**: fill Result with verified evidence, set Status to `Completed`, `git mv` the file to
  `completed/`. A blocked plan stays in `active/`.
- **Records**: never rewrite a completed plan; start a new one that links it.
- A user decision goes to `../decisions/`; lasting knowledge to `../docs/` or `../MEMORY.md`.

```markdown
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
Verified outcome, limits, follow-ups. Filled before moving to `completed/`.
```
