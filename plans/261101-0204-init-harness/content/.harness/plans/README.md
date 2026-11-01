# Plans

Work that spans sessions. One file per plan; its folder is its state.

- `active/<YYMMDD>-<slug>.md`: in progress or blocked.
- `completed/<YYMMDD>-<slug>.md`: done, kept as a record, never rewritten.

Start from [`../templates/plan.md`](../templates/plan.md). When done, fill its Result and
`git mv` it to `completed/`. A user decision goes to `../decisions/`, lasting knowledge to
`../docs/` or `../MEMORY.md`.

When `ak-*` skills are present, AgentKit owns this folder: follow its skills.
