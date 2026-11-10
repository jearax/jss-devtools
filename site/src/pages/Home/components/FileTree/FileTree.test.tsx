import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { flattenTree } from '@/pages/Home/components/FileTree/file-tree.util';
import { REPOSITORY_TREE } from '@/pages/Home/constants/repository-tree.constant';

import FileTree from './FileTree';

const namesAt = (depth: number, parent?: string) => {
	return flattenTree(REPOSITORY_TREE)
		.filter((line) => {
			return line.depth === depth && (parent === undefined || line.path.startsWith(`${parent}/`));
		})
		.map((line) => {
			return line.name;
		});
};

describe('FileTree', () => {
	it('draws one line per node, under the project root', async () => {
		const screen = await render(<FileTree />);

		const lines = screen.container.querySelectorAll('[class*="line"]');

		expect(lines.length).toBe(flattenTree(REPOSITORY_TREE).length + 1);
	});

	it('lists folders before files, each by name, like an editor explorer', () => {
		expect(namesAt(0)).toEqual([
			'.claude/',
			'.harness/',
			'.husky/',
			'.vscode/',
			'src/',
			'.editorconfig',
			'.gitignore',
			'.prettierignore',
			'.prettierrc.json',
			'CLAUDE.md',
			'commitlint.config.mjs',
			'eslint.config.mjs',
			'package-lock.json',
			'package.json',
			'tsconfig.json'
		]);
		expect(namesAt(1, '.harness')).toEqual([
			'{bin,core,decisions,docs,plans,templates}/',
			'.gitignore',
			'BOOTSTRAP.md',
			'config.json',
			'MEMORY.md'
		]);
	});

	it('draws the branches as tree prints them', () => {
		const branchOf = (path: string) => {
			return flattenTree(REPOSITORY_TREE).find((line) => {
				return line.path === path;
			})?.branch;
		};

		expect(branchOf('.claude')).toBe('├── ');
		expect(branchOf('.claude/settings.json')).toBe('│   └── ');
		expect(branchOf('.harness/{bin,core,decisions,docs,plans,templates}')).toBe('│   ├── ');
		expect(branchOf('.claude/skills')).toBe('│   ├── ');
		expect(branchOf('tsconfig.json')).toBe('└── ');
	});

	it('draws the paths the decisions name, including the harness seeds', async () => {
		const screen = await render(<FileTree />);

		const text = screen.container.textContent ?? '';

		for (const name of ['eslint.config.mjs', '.harness/', 'MEMORY.md', 'config.json', 'templates}/']) {
			expect(text).toContain(name);
		}
	});
});
