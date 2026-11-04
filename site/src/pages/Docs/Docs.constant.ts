/**
 * The facts the docs area states that no other route states. A value two routes share lives in
 * `@/constants/`, so the home page and the docs area cannot drift apart.
 */

/**
 * The files `init` owns in a project it sets up. From
 * `src/commands/init/services/plan.service.ts`.
 */
export const INIT_FILES: readonly string[] = [
	'package.json',
	'tsconfig.json',
	'src/main.ts',
	'eslint.config.mjs',
	'.prettierrc.json',
	'.editorconfig',
	'.gitignore',
	'.prettierignore',
	'commitlint.config.mjs',
	'.husky/pre-commit',
	'.husky/commit-msg',
	'.vscode/settings.json',
	'.vscode/extensions.json'
];

/**
 * The presets `init` declares. From `src/commands/init/init.command.ts`: the choices are declared,
 * and only `node` is implemented.
 */
export const INIT_PRESETS: readonly { name: string; state: string }[] = [
	{
		name: 'node',
		state: 'Implemented.'
	},
	{
		name: 'react',
		state: 'Declared, not implemented yet.'
	},
	{
		name: 'rn',
		state: 'Declared, not implemented yet.'
	},
	{
		name: 'next',
		state: 'Declared, not implemented yet.'
	},
	{
		name: 'nest',
		state: 'Declared, not implemented yet.'
	}
];

/**
 * The checks `doctor` runs. From `src/commands/doctor/checks/`.
 */
export const DOCTOR_CHECKS: readonly { label: string; what: string }[] = [
	{
		label: 'Node.js',
		what: 'The running version against the floor. Fails with the version to install.'
	},
	{
		label: 'Git',
		what: 'That git is installed, with its version. Fails with the fix.'
	},
	{
		label: 'bun, pnpm, yarn, npm',
		what: 'Each package manager, probed outside any project so a project’s own field cannot change the answer.'
	}
];
