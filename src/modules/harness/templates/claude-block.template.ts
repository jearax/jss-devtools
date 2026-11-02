const ownershipBullets = (agentKit: boolean): string => {
	const harness =
		'- Do not edit what an update replaces; put a correction in a learned skill or a memory line instead:\n' +
		'  - `harness-*` skills, `.harness/{bin,core,templates}/`: `jss-devtools harness update`.';

	if (agentKit === false) {
		return harness;
	}

	return `${harness}
  - \`ak-*\` skills, \`.claude/{hooks,rules,agents,output-styles,scripts}/\`: \`ak update\`.
- AgentKit owns \`.harness/{docs,plans}/\`: follow its skills there. It also works in \`.harness/decisions/\`.`;
};

export const harnessClaudeBlockTemplate = (agentKit: boolean): string => {
	return `<!-- HARNESS:BEGIN -->

# Repository harness

The code, tests and CI are the authority. \`.harness/\` records what agents learned about working
with them. Read an index first, then only the file the task needs.

## Where knowledge goes

| Kind                                    | Write to                                                     | Start from                       |
| --------------------------------------- | ------------------------------------------------------------ | -------------------------------- |
| Fact, trap, convention, user correction | one line in \`.harness/MEMORY.md\`                             | its header                       |
| Topic longer than a line                | \`.harness/docs/<topic>.md\`, and a memory line pointing to it | \`.harness/docs/README.md\`        |
| User decision                           | \`.harness/decisions/NNNN-<slug>.md\`, quoting the user        | \`.harness/templates/decision.md\` |
| Work spanning sessions                  | \`.harness/plans/active/<YYMMDD>-<slug>.md\`                   | \`.harness/plans/README.md\`       |
| Reusable procedure                      | \`.claude/skills/<name>/SKILL.md\`, a learned skill            | \`.harness/templates/skill.md\`    |

- Add or remove the row in the folder's \`README.md\` in the same change as the file.
- Learned skills are yours to create, patch and archive without asking; use one when it matches the
  task, patch it when it is wrong.
- Never write a secret. Name the variable or file that holds it.
${ownershipBullets(agentKit)}

## Match the process to the work

- Question, review, diagnosis: read only, answer with evidence, change nothing.
- Bounded change: read the affected code and tests, make the smallest change, run the checks.
- Work spanning sessions: a plan, as the table above says.

## Hooks

Session start injects memory and the decisions in force. When the Stop hook asks for a review, run
the \`harness-review\` skill.

## Decisions

- \`.harness/decisions/\` is the only product policy. Memory and code defaults are not policy.
- Stop and ask before a change that sets policy no decision covers (limits, permissions, API
  contracts, data retention, pricing), or when intent is unclear, recovery is hard, or the change
  weakens tests, security or compatibility. Give the options and their consequences; do not pick.
  Record the answer as a decision.
- When a request contradicts a decision, name the decision first. Never edit an accepted decision:
  write a new one that supersedes it.

## Done means proven

Claim done only with commands you ran and output you saw. Report what changed, how you checked it,
what you did not check, and what harness knowledge changed. Commit harness changes with the work;
the harness never commits.
<!-- HARNESS:END -->`;
};
