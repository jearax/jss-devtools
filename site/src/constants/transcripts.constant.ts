/**
 * The CLI's real output, captured from the built CLI with `FORCE_COLOR=1`, so every line keeps the
 * ANSI colour codes the CLI printed; the terminal renders them through the design system's tokens.
 *
 * The `init` transcript is the head of a dry run, cut on purpose: the run lists fifty-three files, and
 * the whole list would be noise. The count line says how many there are; the run's `To apply` hint
 * is kept.
 */
export const INSTALL_TRANSCRIPT: readonly string[] = [
	'jss-devtools-install: downloading from https://jss-devtools.jjuidev.com/releases/latest',
	// The installer writes the bundle to the versioned home and the shim to the bin dir; the
	// message names the versioned home.
	'jss-devtools-install: installed jss-devtools 0.1.0 to ~/.jss-devtools/0.1.0'
];

export const DOCTOR_TRANSCRIPT: readonly string[] = [
	'\u001b[90m┌\u001b[39m  \u001b[7m jss-devtools doctor \u001b[27m',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Node.js  v24.22.0  \u001b[2mneeds >= 24.11.0\u001b[22m',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Git      2.55.0',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m bun      1.3.8',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m pnpm     11.24.0',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m yarn     1.22.22',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m npm      11.19.1',
	'\u001b[90m│\u001b[39m',
	'\u001b[90m└\u001b[39m  Ready: Node.js, git and 4 package managers'
];

export const INIT_TRANSCRIPT: readonly string[] = [
	'\u001b[90m┌\u001b[39m  \u001b[7m jss-devtools init \u001b[27m',
	'\u001b[90m│\u001b[39m',
	'\u001b[32m◇\u001b[39m  Changes in my-app: \u001b[32m53 to create\u001b[39m',
	'\u001b[90m│\u001b[39m  \u001b[32m+\u001b[39m \u001b[2m.claude/skills/harness-curate/\u001b[22mSKILL.md',
	'\u001b[90m│\u001b[39m  \u001b[32m+\u001b[39m \u001b[2m.claude/skills/harness-onboard/\u001b[22mSKILL.md',
	'\u001b[90m│\u001b[39m  \u001b[32m+\u001b[39m \u001b[2m.claude/skills/harness-review/\u001b[22mSKILL.md',
	'\u001b[90m│\u001b[39m  \u001b[32m+\u001b[39m \u001b[2m.claude/skills/\u001b[22m.gitignore',
	'\u001b[90m│\u001b[39m  \u001b[32m+\u001b[39m \u001b[2m.claude/\u001b[22msettings.json',
	'\u001b[90m│\u001b[39m  \u001b[32m+\u001b[39m \u001b[2m.harness/bin/\u001b[22mharness-hook.mjs',
	'\u001b[90m│\u001b[39m  \u001b[32m+\u001b[39m \u001b[2m.harness/bin/\u001b[22mhooks.mjs',
	'\u001b[90m│\u001b[39m  \u001b[32m+\u001b[39m \u001b[2m.harness/core/base/.claude/skills/harness-curate/\u001b[22mSKILL.md',
	'\u001b[90m│\u001b[39m  \u001b[32m+\u001b[39m \u001b[2m.harness/core/base/.claude/skills/harness-onboard/\u001b[22mSKILL.md',
	'\u001b[90m│\u001b[39m',
	'\u001b[90m│\u001b[39m  Assumed npm for this plan; pass --pm to pick another',
	'\u001b[90m│\u001b[39m',
	'\u001b[90m└\u001b[39m  Dry run: nothing written',
	'   To apply:',
	'     \u001b[2m$ \u001b[22m\u001b[36mjss-devtools init my-app\u001b[39m'
];

/**
 * A real `jss-devtools init my-app` in an empty folder, answering every question with its default,
 * as the terminal showed it when the run finished: replayed through a headless terminal, so the
 * install log the CLI clears is gone, with clack's one bar above the summary. The startup banner is left out like every other transcript
 * here, and the file list keeps nine of its fifty-three lines; the count line says how many.
 */
export const INIT_RUN_TRANSCRIPT: readonly string[] = [
	'\u001b[0m\u001b[90m┌\u001b[0m  \u001b[0m\u001b[7m jss-devtools init ',
	'\u001b[0m\u001b[90m│',
	'\u001b[0m\u001b[32m◇\u001b[0m  Which package manager?',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[2mnpm',
	'\u001b[0m\u001b[90m│',
	'\u001b[0m\u001b[32m◇\u001b[0m  Changes in my-app: \u001b[0m\u001b[32m53 to create',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[32m+\u001b[0m \u001b[0m\u001b[2m.claude/skills/harness-curate/\u001b[0mSKILL.md',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[32m+\u001b[0m \u001b[0m\u001b[2m.claude/skills/harness-onboard/\u001b[0mSKILL.md',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[32m+\u001b[0m \u001b[0m\u001b[2m.claude/skills/harness-review/\u001b[0mSKILL.md',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[32m+\u001b[0m \u001b[0m\u001b[2m.claude/skills/\u001b[0m.gitignore',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[32m+\u001b[0m \u001b[0m\u001b[2m.claude/\u001b[0msettings.json',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[32m+\u001b[0m \u001b[0m\u001b[2m.harness/bin/\u001b[0mharness-hook.mjs',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[32m+\u001b[0m \u001b[0m\u001b[2m.harness/bin/\u001b[0mhooks.mjs',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[32m+\u001b[0m \u001b[0m\u001b[2m.harness/core/base/.claude/skills/harness-curate/\u001b[0mSKILL.md',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[32m+\u001b[0m \u001b[0m\u001b[2m.harness/core/base/.claude/skills/harness-onboard/\u001b[0mSKILL.md',
	'\u001b[0m\u001b[90m│',
	'\u001b[0m\u001b[32m◇\u001b[0m  Write 53 files to my-app and install?',
	'\u001b[0m\u001b[90m│\u001b[0m  \u001b[0m\u001b[2mYes',
	'\u001b[0m\u001b[90m│',
	'\u001b[0m\u001b[32m◇\u001b[0m  Installing with npm',
	'\u001b[0m\u001b[90m│',
	'\u001b[0m\u001b[32m◆\u001b[0m  Installed with npm \u001b[0m\u001b[2m(11.5s)',
	'\u001b[0m\u001b[90m│',
	'\u001b[0m\u001b[35m◓\u001b[0m  Sorting package.json',
	'\u001b[0m\u001b[32m◇\u001b[0m  Sorted package.json',
	'\u001b[0m\u001b[90m│',
	'\u001b[0m\u001b[32m◇\u001b[0m  Formatted 43 files',
	'\u001b[0m\u001b[90m│',
	'\u001b[0m\u001b[90m└\u001b[0m  Next steps',
	'     The harness is installed; open Claude Code in the project folder to onboard.',
	'     \u001b[0m\u001b[2m$ \u001b[0m\u001b[36mcd my-app',
	'     \u001b[0m\u001b[2m$ \u001b[0m\u001b[36mnpm run dev'
];

export const HARNESS_TRANSCRIPT: readonly string[] = [
	'\u001b[90m┌\u001b[39m  \u001b[7m jss-devtools harness doctor \u001b[27m',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Version         0.1.0',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Hook files      match CLI 0.1.0',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Memory          488/9600 chars, 5 entries',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Decisions       0',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Learned skills  0',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Knowledge       private to this machine',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Content check   15 files checked, 0 lines allowed by marker',
	'\u001b[90m│\u001b[39m',
	'\u001b[90m└\u001b[39m  Harness is healthy'
];

/**
 * `harness doctor` in the same project after onboarding: a real run, once onboarding with sample
 * answers had added three memory lines and one decision and removed `.harness/BOOTSTRAP.md`.
 */
export const HARNESS_ONBOARDED_TRANSCRIPT: readonly string[] = [
	'\u001b[90m┌\u001b[39m  \u001b[7m jss-devtools harness doctor \u001b[27m',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Version         0.1.0',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Hook files      match CLI 0.1.0',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Memory          660/9600 chars, 8 entries',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Decisions       1',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Learned skills  0',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Knowledge       private to this machine',
	'\u001b[90m│\u001b[39m  \u001b[32m✔\u001b[39m Content check   15 files checked, 0 lines allowed by marker',
	'\u001b[90m│\u001b[39m',
	'\u001b[90m└\u001b[39m  Harness is healthy'
];

/**
 * The terminal's own label. The transcripts are real runs, but the versions in them are the ones
 * this machine had, so the frame says so rather than presenting them as fixed output.
 */
export const TERMINAL_LABEL = 'Example output';
