export type HarnessHook = {
	event: string;
	/** The tools the hook is limited to; a null matcher means every call. */
	matcher: string | null;
	note: string;
};

/**
 * The hooks the harness installs into `.claude/settings.json`, and what each one does. From
 * `src/modules/harness/constants/hook-settings.constant.ts` and the hooks in
 * `src/modules/harness/hooks/`.
 */
export const HARNESS_HOOKS: readonly HarnessHook[] = [
	{
		event: 'SessionStart',
		matcher: '`startup`, `resume`, `clear`, `compact`',
		note: 'Loads the harness memory with its character budget, the decisions in force, the index drift and the onboarding notice.'
	},
	{
		event: 'PostToolUse',
		matcher: '`Write`, `Edit`, `MultiEdit`',
		note: 'The memory guard: blocks a write to the harness memory that would break its character budget.'
	},
	{
		event: 'PostToolUse',
		matcher: null,
		note: 'The tool log: appends every tool call to the session log, with the skills the call used.'
	},
	{
		event: 'PostToolUseFailure',
		matcher: null,
		note: 'Appends the failure to the session log, with the error’s secrets redacted.'
	},
	{
		event: 'Stop',
		matcher: null,
		note: 'Prunes the old sessions, folds the session’s skill usage, and asks for onboarding, a review or a curation when one is due.'
	}
];

/**
 * What the harness tells the agent when a session starts. From
 * `src/modules/harness/hooks/session-start.hook.ts`.
 */
export const HARNESS_SESSION_CONTEXT: readonly string[] = [
	'The harness memory, and how much of its character budget is used',
	'The decision records in force',
	'The index drift, as a warning',
	'The knowledge state: shared through git, or private to this machine',
	'The onboarding notice, until the harness has been seeded'
];

/**
 * What harness knowledge covers, what each share mode keeps in git, and what private mode cannot
 * do. From `src/modules/harness/constants/harness-paths.constant.ts` and the ignore templates.
 */
export const HARNESS_KNOWLEDGE_TABLE: readonly { area: string; ignored: string; shared: string }[] = [
	{
		area: 'In git',
		ignored:
			'The `CLAUDE.md` block, `.harness/config.json`, `.harness/templates/`, `.harness/core/`, `.harness/bin/`, the `harness-*` skills, the hook entries',
		shared: 'The same, plus memory, decisions, docs, plans, the archive, `curator.json` and learned skills'
	},
	{
		area: 'A fresh clone',
		ignored: 'Starts with empty knowledge; the first session writes the seed files and asks to onboard',
		shared: "Has the team's knowledge"
	},
	{
		area: 'Teammates, a second machine',
		ignored: 'Each machine learns on its own',
		shared: 'Learn from each other through commits'
	},
	{
		area: 'Backup',
		ignored: 'None: deleting the folder loses it',
		shared: 'Git'
	}
];

/**
 * What the harness doctor content check reports, and the limits of the check. From
 * `src/modules/harness/services/health-content.service.ts` and `redaction-rules.constant.ts`.
 */
export const HARNESS_SECURITY: readonly { topic: string; detail: string }[] = [
	{
		topic: 'Hook files',
		detail:
			'`.harness/bin/` runs on every session and is compared with the copy inside the running CLI; a difference is an error until `harness update` restores it.'
	},
	{
		topic: 'Outside pull requests',
		detail:
			'Only a maintainer runs `jss-devtools harness update`; a pull request touching `.harness/bin/`, `.harness/core/` or the hook entries is refused. On GitHub, limiting pull requests to collaborators removes the case. Read the diff before checking a branch out, because the hooks run when the session starts.'
	},
	{
		topic: 'Symlinks',
		detail:
			'The harness never reads or writes through a symlink; `harness doctor` lists every one it finds under the harness paths.'
	},
	{
		topic: 'Content check',
		detail:
			'Secret-shaped values (AWS, GitHub, Slack, GitLab, npm, Stripe, Google, OpenAI-shaped keys, JWTs, private-key headers, credentials in URLs, Authorization header values, credential assignments) are errors; home paths and e-mail addresses are errors in files git would publish.'
	},
	{
		topic: 'The marker',
		detail: 'A line ending with `harness-doctor: allow` is skipped and counted in the summary.'
	},
	{
		topic: 'What it cannot catch',
		detail: 'A private name with no shape (a customer, a host in prose), and anything already pushed.'
	},
	{
		topic: 'harness-review',
		detail: 'Applies its edits without approval; the git diff is the only gate, so read the diff.'
	}
];

export type HarnessSkill = {
	skill: string;
	what: string;
};

/**
 * The skills the harness ships. From `src/modules/harness/`.
 */
export const HARNESS_SKILLS: readonly HarnessSkill[] = [
	{
		skill: 'harness-onboard',
		what: 'Fills the harness memory with what the repository is and how it works.'
	},
	{
		skill: 'harness-curate',
		what: 'Folds what the sessions learned into the memory, and prunes what is stale.'
	},
	{
		skill: 'harness-review',
		what: 'Reviews the work in the session against the decisions in force.'
	}
];

/**
 * The hooks' shared limits. From `src/modules/harness/constants/harness-limits.constant.ts` and
 * `src/modules/harness/templates/harness-config.template.ts`.
 */
export const HARNESS_LIMITS: readonly { label: string; value: string }[] = [
	{
		label: 'Memory budget',
		value: '9600 characters, 320 per entry'
	},
	{
		label: 'Hook timeout',
		value: '30 seconds'
	},
	{
		label: 'Session log',
		value: '7 days'
	},
	{
		label: 'Hook error log',
		value: '64 kB'
	}
];
