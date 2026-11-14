// The exception to one template per file: the ignore files follow knowledge.share.
export const harnessGitignoreTemplate = (share: boolean, agentKit: boolean): string => {
	const lines = ['state/', 'update/'];

	if (!share) {
		lines.push('MEMORY.md', 'BOOTSTRAP.md', 'curator.json', 'decisions/', 'docs/', 'archive/');

		if (agentKit) {
			lines.push('plans/');
		} else {
			lines.push('plans/*', '!plans/README.md');
		}
	}

	return `${lines.join('\n')}\n`;
};

export const harnessSkillsGitignoreTemplate = `/*
!/.gitignore
!/harness-*/
!/ak-*/\n`;

export const harnessMemoryTemplate = `# Memory

Short facts about this repository, injected at every session start. Size limits are in
\`.harness/config.json\` under \`memory\`.

- One \`- \` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when there is one: \`(src: path:line)\`.
- Longer than a line: write \`.harness/docs/<topic>.md\` and leave
  \`- <fact>. See .harness/docs/<topic>.md\`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.\n`;

export const harnessDecisionsReadmeTemplate = `# Decisions

User decisions that later work must follow: the only product policy in this repository. Write one
from [\`../templates/decision.md\`](../templates/decision.md).

| #   | Title | Status | Date |
| --- | ----- | ------ | ---- |\n`;

export const harnessDocsReadmeTemplate = `# Docs

Knowledge longer than one line of [\`../MEMORY.md\`](../MEMORY.md). Pick the template from
[\`../templates/README.md\`](../templates/README.md).

| Doc | Kind | Summary |
| --- | ---- | ------- |\n`;

export const harnessPlansReadmeTemplate = (agentKit: boolean): string => {
	if (agentKit === false) {
		return `# Plans

Work that spans sessions. One file per plan; its folder is its state.

- \`active/<YYMMDD>-<slug>.md\`: in progress or blocked.
- \`completed/<YYMMDD>-<slug>.md\`: done, kept as a record, never rewritten.

Start from [\`../templates/plan.md\`](../templates/plan.md). When done, fill its Result and
\`git mv\` it to \`completed/\`. A user decision goes to \`../decisions/\`, lasting knowledge to
\`../docs/\` or \`../MEMORY.md\`.\n`;
	}

	return `# Plans

Work that spans sessions. The plan skill that owns this folder decides the layout: a plan is a
folder with its plan and its phase files.

Keep this file the index of the folder: add or remove a row in the same change as the plan.

| Plan | Status | Summary |
| ---- | ------ | ------- |\n`;
};
