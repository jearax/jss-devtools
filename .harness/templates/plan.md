# Template: plan

For `.harness/plans/<YYMMDD>-<HHMM>-<slug>/plan.md`: work that spans sessions. A bounded change
needs no plan.

The AgentKit plan skill owns `.harness/plans/`: it writes the plan and its phase files and owns
their lifecycle. Follow that skill for the format; the fields below are what a plan carries.

- **Outcome**: the observable result the work must produce.
- **Context**: the decisions, docs, code and tests it depends on.
- **Scope**: what is in, what is out.
- **Approach**: the smallest coherent sequence; revised when the evidence changes it.
- **Risks**: risk, mitigation, rollback.
- **Progress**: the steps, ticked as they land.
- **Validation**: the command run, and what it showed.
- **Result**: the verified outcome, its limits and the follow-ups.
- A user decision goes to `../decisions/`; lasting knowledge to `../docs/` or `../MEMORY.md`.
