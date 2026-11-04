/**
 * The CLI's real output, captured from the built CLI. Every line here was printed by
 * `jss-devtools` on a real run, with the real glyphs.
 *
 * The `init` transcript is the head of a dry run, and it is cut there on purpose: the run lists
 * fifty-two files, and the whole list would be noise. The line that says so is in the transcript.
 */
export const DOCTOR_TRANSCRIPT: readonly string[] = [
	'┌   jss-devtools doctor ',
	'│  ✔ Node.js  v24.22.0  needs >= 24.11.0',
	'│  ✔ Git      2.55.0',
	'│  ✔ bun      1.3.8',
	'│  ✔ pnpm     11.24.0',
	'│  ✔ yarn     1.22.22',
	'│  ✔ npm      11.19.1',
	'│',
	'└  Ready: Node.js, git and 4 package managers'
];

export const INIT_TRANSCRIPT: readonly string[] = [
	'┌   jss-devtools init ',
	'│',
	'◇  Changes in my-app: 52 to create',
	'│  + .claude/settings.json',
	'│  + .harness/bin/harness-hook.mjs',
	'│  + .harness/core/manifest.json',
	'│  + .harness/templates/plan.md',
	'│  + .husky/commit-msg',
	'│  + .vscode/settings.json',
	'│  + eslint.config.mjs',
	'│  + package.json',
	'│  + tsconfig.json',
	'│',
	'└  Dry run: nothing written'
];

export const HARNESS_TRANSCRIPT: readonly string[] = [
	'┌   jss-devtools harness doctor ',
	'│  ✔ Version         0.0.1',
	'│  ✔ Memory          488/4800 chars, 5 entries',
	'│  ✔ Decisions       0',
	'│  ✔ Learned skills  0',
	'│',
	'└  Harness is healthy'
];

/**
 * The terminal's own label. The transcripts are real runs, but the versions in them are the ones
 * this machine had, so the frame says so rather than presenting them as fixed output.
 */
export const TERMINAL_LABEL = 'Example output';

/**
 * The transcripts the hero switches between. Each one is a real run of the built CLI.
 */
export const HERO_TABS = [
	{
		label: 'doctor',
		command: 'jss-devtools doctor',
		lines: DOCTOR_TRANSCRIPT
	},
	{
		label: 'init --dry-run',
		command: 'jss-devtools init my-app --pm pnpm --dry-run',
		lines: INIT_TRANSCRIPT
	},
	{
		label: 'harness doctor',
		command: 'jss-devtools harness doctor',
		lines: HARNESS_TRANSCRIPT
	}
] as const;
