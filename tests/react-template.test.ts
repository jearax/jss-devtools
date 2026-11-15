import { describe, expect, it } from 'vitest';

import { NODE_PRESET_DEPENDENCIES } from '@/commands/init/constants/node-preset-dependency.constant';
import { REACT_TEMPLATE_FILES } from '@/commands/init/constants/react-template.constant';

import { readFrameworkTemplate } from '../scripts/framework-template.mjs';
import { REACT_DEPENDENCIES, REACT_DEV_DEPENDENCIES } from '../scripts/pin-helpers.mjs';

const manifest = JSON.parse(REACT_TEMPLATE_FILES['package.json']!) as {
	scripts?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

describe('embedded react template', () => {
	it('equals the templates/react folder on disk', () => {
		expect(REACT_TEMPLATE_FILES).toEqual(readFrameworkTemplate('react'));
	});

	it('carries sorted keys and no build output, lockfile, env, agent, oxlint, css or binary-image file', () => {
		const keys = Object.keys(REACT_TEMPLATE_FILES);

		expect(keys).toEqual([...keys].sort());

		const forbidden =
			/(^|\/)(node_modules|dist|pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lock|bun\.lockb|npm-shrinkwrap\.json|\.env(?!\.example)|AGENTS\.md|\.oxlintrc\.json)(\/|$)|\.css$|\.(png|jpe?g|gif|webp|ico|avif|bmp)$/;

		expect(
			keys.filter((key) => {
				return forbidden.test(key);
			})
		).toEqual([]);
	});

	it('carries no NUL byte in any embedded file', () => {
		for (const content of Object.values(REACT_TEMPLATE_FILES)) {
			expect(content.includes('\0')).toBe(false);
		}
	});

	it('pins every react package as a caret and duplicates no shared toolchain package', () => {
		const reactPackages = [...REACT_DEPENDENCIES, ...REACT_DEV_DEPENDENCIES];

		for (const name of REACT_DEPENDENCIES) {
			expect(manifest.dependencies?.[name]).toMatch(/^\^\d+\.\d+\.\d+$/);
		}

		for (const name of REACT_DEV_DEPENDENCIES) {
			expect(manifest.devDependencies?.[name]).toMatch(/^\^\d+\.\d+\.\d+$/);
		}

		expect(
			reactPackages.filter((name) => {
				return name in NODE_PRESET_DEPENDENCIES;
			})
		).toEqual([]);
	});

	it('keeps the shared toolchain and eslint-plugin-react out of the manifest', () => {
		for (const name of Object.keys(NODE_PRESET_DEPENDENCIES)) {
			expect(manifest.dependencies?.[name]).toBeUndefined();
			expect(manifest.devDependencies?.[name]).toBeUndefined();
		}

		expect(manifest.dependencies?.['eslint-plugin-react']).toBeUndefined();
		expect(manifest.devDependencies?.['eslint-plugin-react']).toBeUndefined();
	});

	it('has no test script and no test runner', () => {
		expect(manifest.scripts?.test).toBeUndefined();

		const declared = [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})];

		expect(
			declared.filter((name) => {
				return name === 'vitest' || name === 'jest' || name.startsWith('@testing-library/');
			})
		).toEqual([]);
	});
});
