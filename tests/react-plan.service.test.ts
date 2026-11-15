import { describe, expect, it } from 'vitest';

import { reactCreateModeEntries, reactMonorepoAppEntries } from '@/commands/init/services/react-plan.service';

import type { InitPreflight } from '@/commands/init/types/init-plan.type';

const preflight = (projectName: string): InitPreflight => {
	return {
		mode: 'create',
		targetDir: projectName,
		projectName,
		pm: 'pnpm',
		pmVersion: '11.24.0'
	};
};

describe('react plan title substitution', () => {
	it('escapes html metacharacters and leaves replacement patterns alone', () => {
		const entries = reactCreateModeEntries(preflight('a&b$&c<d>e'), { vscode: false });

		const index = entries.find((entry) => {
			return entry.path === 'index.html';
		});

		expect(index?.content).toContain('<title>a&amp;b$&amp;c&lt;d&gt;e</title>');
	});

	it('writes the plain project name when it holds nothing special', () => {
		const entries = reactMonorepoAppEntries(preflight('my-web'));

		const index = entries.find((entry) => {
			return entry.path === 'apps/react/index.html';
		});

		expect(index?.content).toContain('<title>my-web</title>');
	});
});
