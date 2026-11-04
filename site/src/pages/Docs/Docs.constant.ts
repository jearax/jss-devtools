/**
 * The facts the docs area states that no other route states. A value two routes share lives in
 * `@/constants/`, so the home page and the docs area cannot drift apart.
 */

export type SectionMeta = {
	/** The anchor the table of contents links to. */
	id: string;
	/** The heading the reader sees. */
	title: string;
};

/**
 * The metadata of one section, taken from the page's own list.
 *
 * A page asks for a section by its id and never writes the title out again, so a heading has one
 * home: the page's own constant file. The id is checked against that list at compile time, so a
 * page cannot ask for a section it does not have.
 */
export const sectionMeta = <T extends readonly SectionMeta[]>(sections: T, id: T[number]['id']): SectionMeta => {
	const found = sections.find((section) => {
		return section.id === id;
	});

	if (found === undefined) {
		throw new Error(`The page has no section named ${id}.`);
	}

	return found;
};

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
