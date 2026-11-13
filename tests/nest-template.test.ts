import { describe, expect, it } from 'vitest';

import { NEST_TEMPLATE_FILES } from '@/commands/init/constants/nest-template.constant';
import { NODE_PRESET_DEPENDENCIES } from '@/commands/init/constants/node-preset-dependency.constant';

import { readFrameworkTemplate } from '../scripts/framework-template.mjs';
import { NEST_DEPENDENCIES, NEST_DEV_DEPENDENCIES } from '../scripts/pin-helpers.mjs';

const manifest = JSON.parse(NEST_TEMPLATE_FILES['package.json']!) as {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

describe('embedded nest template', () => {
	it('equals the templates/nest folder on disk', () => {
		expect(NEST_TEMPLATE_FILES).toEqual(readFrameworkTemplate('nest'));
	});

	it('carries sorted keys and no build output, lockfile, env or agent file', () => {
		const keys = Object.keys(NEST_TEMPLATE_FILES);

		expect(keys).toEqual([...keys].sort());

		const forbidden =
			/(^|\/)(node_modules|dist|pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lock|bun\.lockb|npm-shrinkwrap\.json|\.env(?!\.example)|AGENTS\.md|\.oxlintrc\.json)(\/|$)/;

		expect(
			keys.filter((key) => {
				return forbidden.test(key);
			})
		).toEqual([]);
	});

	it('pins every nest package as a caret and duplicates no shared toolchain package', () => {
		const nestPackages = [...NEST_DEPENDENCIES, ...NEST_DEV_DEPENDENCIES];

		for (const name of NEST_DEPENDENCIES) {
			expect(manifest.dependencies?.[name]).toMatch(/^\^\d+\.\d+\.\d+$/);
		}

		for (const name of NEST_DEV_DEPENDENCIES) {
			expect(manifest.devDependencies?.[name]).toMatch(/^\^\d+\.\d+\.\d+$/);
		}

		expect(
			nestPackages.filter((name) => {
				return name in NODE_PRESET_DEPENDENCIES;
			})
		).toEqual([]);
	});

	it('keeps the shared toolchain versions out of the template manifest', () => {
		for (const name of Object.keys(NODE_PRESET_DEPENDENCIES)) {
			expect(manifest.dependencies?.[name]).toBeUndefined();
			expect(manifest.devDependencies?.[name]).toBeUndefined();
		}
	});
});
