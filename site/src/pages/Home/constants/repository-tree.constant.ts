// What `jss-devtools init my-app -y` (npm, the default) leaves for git to track, copied from a real
// run: the root and one level inside each folder. Deeper folders show by name only.
export type TreeNode = {
	name: string;
	children?: readonly TreeNode[];
};

export const REPOSITORY_TREE: readonly TreeNode[] = [
	{
		name: '.claude',
		children: [
			{ name: 'settings.json' },
			{
				name: 'skills',
				children: []
			}
		]
	},
	{ name: '.editorconfig' },
	{ name: '.gitignore' },
	{
		name: '.harness',
		children: [
			{ name: '.gitignore' },
			{
				name: 'bin',
				children: []
			},
			{ name: 'BOOTSTRAP.md' },
			{ name: 'config.json' },
			{
				name: 'core',
				children: []
			},
			{
				name: 'decisions',
				children: []
			},
			{
				name: 'docs',
				children: []
			},
			{ name: 'MEMORY.md' },
			{
				name: 'plans',
				children: []
			},
			{
				name: 'templates',
				children: []
			}
		]
	},
	{
		name: '.husky',
		children: [{ name: 'commit-msg' }, { name: 'pre-commit' }]
	},
	{ name: '.prettierignore' },
	{ name: '.prettierrc.json' },
	{
		name: '.vscode',
		children: [{ name: 'extensions.json' }, { name: 'settings.json' }]
	},
	{ name: 'CLAUDE.md' },
	{ name: 'commitlint.config.mjs' },
	{ name: 'eslint.config.mjs' },
	{ name: 'package-lock.json' },
	{ name: 'package.json' },
	{
		name: 'src',
		children: [{ name: 'main.ts' }]
	},
	{ name: 'tsconfig.json' }
];

export type HarnessPoint = {
	title: string;
	text: string;
};

export const HARNESS_POINTS: readonly HarnessPoint[] = [
	{
		title: 'Memory',
		text: 'One short file of facts, traps and corrections, injected into every session.'
	},
	{
		title: 'Decisions',
		text: 'The product policy, quoting the user, so an agent never guesses twice.'
	},
	{
		title: 'Plans',
		text: 'Working state and journals, owned by the planning tooling.'
	}
];
