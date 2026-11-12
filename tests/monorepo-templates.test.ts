import { describe, expect, it } from 'vitest';

import {
	MONOREPO_PRESET_DEPENDENCIES,
	NODE_PRESET_DEPENDENCIES
} from '@/commands/init/constants/node-preset-dependency.constant';
import { appPackageJsonTemplate } from '@/commands/init/templates/app-package-json.template';
import { appTsconfigJsonTemplate } from '@/commands/init/templates/app-tsconfig-json.template';
import { eslintConfigMjsTemplate } from '@/commands/init/templates/eslint-config-mjs.template';
import { monorepoPackageJsonTemplate } from '@/commands/init/templates/monorepo-package-json.template';
import {
	pnpmWorkspaceYamlMonorepoTemplate,
	pnpmWorkspaceYamlTemplate
} from '@/commands/init/templates/pnpm-workspace-yaml.template';
import { tsconfigBaseJsonTemplate } from '@/commands/init/templates/tsconfig-base-json.template';
import { tsconfigJsonTemplate } from '@/commands/init/templates/tsconfig-json.template';
import { turboJsonTemplate } from '@/commands/init/templates/turbo-json.template';
import { PACKAGE } from '@/core/constants/package.constant';

const PROJECT_NAME = 'my-app';

const monorepoRoot = (packageManager: 'bun' | 'pnpm' | 'yarn' | 'npm'): Record<string, unknown> => {
	return JSON.parse(
		monorepoPackageJsonTemplate({
			projectName: PROJECT_NAME,
			packageManager,
			packageManagerVersion: '1.2.3',
			nodeFloor: PACKAGE.nodeFloor
		})
	) as Record<string, unknown>;
};

describe('the monorepo templates', () => {
	it('renders turbo.json exactly as the Turborepo docs and design-system shape', () => {
		expect(JSON.parse(turboJsonTemplate())).toEqual({
			$schema: 'https://turborepo.dev/schema.json',
			tasks: {
				build: {
					dependsOn: ['^build'],
					outputs: ['dist/**']
				},
				typecheck: { dependsOn: ['^build'] },
				lint: { dependsOn: ['^build'] },
				dev: {
					cache: false,
					persistent: true
				},
				'//#lint:root': {}
			}
		});
	});

	it('renders the root package.json for every manager but the pnpm one has no workspaces', () => {
		for (const packageManager of ['bun', 'pnpm', 'yarn', 'npm'] as const) {
			const manifest = monorepoRoot(packageManager);

			expect(manifest['name']).toBe(PROJECT_NAME);
			expect(manifest['version']).toBe('0.0.0');
			expect(manifest['private']).toBe(true);
			expect(manifest['type']).toBe('module');
			expect(manifest['packageManager']).toBe(`${packageManager}@1.2.3`);
			expect(manifest['engines']).toEqual({ node: `>=${PACKAGE.nodeFloor}` });

			const expectedWorkspaces = packageManager === 'pnpm' ? undefined : ['apps/*', 'packages/*'];

			expect(manifest['workspaces']).toEqual(expectedWorkspaces);
		}
	});

	it('routes the scripts through turbo and keeps the root-only lint scripts', () => {
		const manifest = monorepoRoot('npm') as { scripts: Record<string, string> };

		expect(manifest.scripts['dev']).toBe('turbo run dev');
		expect(manifest.scripts['build']).toBe('turbo run build');
		expect(manifest.scripts['typecheck']).toBe('turbo run typecheck');
		expect(manifest.scripts['lint']).toBe('turbo run lint lint:root');
		expect(manifest.scripts['lint:root']).toMatch(/^eslint "\*\.\{cjs,mjs/);
		expect(manifest.scripts['lint:fix']).toContain('apps/*/{src,test,tools,e2e}');
		expect(manifest.scripts['format']).toBe('npm run lint:fix && prettier --write .');
		expect(manifest.scripts['prepare']).toBe('husky');
	});

	it('extends lint-staged with the workspace sources and sorts every package.json', () => {
		const manifest = monorepoRoot('npm') as { 'lint-staged': Record<string, string[]> };

		expect(manifest['lint-staged']['**/package.json']).toBeDefined();
		expect(manifest['lint-staged']['**/!(package).{json,md,yml,yaml}']).toBeDefined();

		const sourcesKey = Object.keys(manifest['lint-staged']).find((key) => {
			return key.includes('apps/*/{src');
		});

		expect(sourcesKey).toBeDefined();
	});

	it('gives the root every preset devDependency plus turbo as a caret range', () => {
		const manifest = monorepoRoot('npm') as { devDependencies: Record<string, string> };

		for (const [name, version] of Object.entries(NODE_PRESET_DEPENDENCIES)) {
			expect(manifest.devDependencies[name]).toBe(`^${version}`);
		}

		for (const [name, version] of Object.entries(MONOREPO_PRESET_DEPENDENCIES)) {
			expect(manifest.devDependencies[name]).toBe(`^${version}`);
		}

		expect(Object.keys(MONOREPO_PRESET_DEPENDENCIES)).toEqual(['turbo']);
		expect(MONOREPO_PRESET_DEPENDENCIES['turbo']).toMatch(/^\d+\.\d+\.\d+$/);
	});

	it('renders the app package.json with a version yarn 1 cannot ignore', () => {
		expect(JSON.parse(appPackageJsonTemplate({ appName: '@my-app/node' }))).toEqual({
			name: '@my-app/node',
			version: '0.0.0',
			private: true,
			type: 'module',
			scripts: {
				dev: 'tsx watch src/main.ts',
				build: 'tsc && tsc-alias --resolve-full-paths',
				start: 'node dist/main.js',
				typecheck: 'tsc --noEmit',
				lint: 'eslint src'
			}
		});
	});

	it('moves the alias and output options to the app tsconfig and keeps the base shareable', () => {
		const base = JSON.parse(tsconfigBaseJsonTemplate()) as {
			compilerOptions: Record<string, unknown>;
		};

		expect(base.compilerOptions['paths']).toBeUndefined();
		expect(base.compilerOptions['rootDir']).toBeUndefined();
		expect(base.compilerOptions['outDir']).toBeUndefined();
		expect(base.compilerOptions['strict']).toBe(true);

		expect(JSON.parse(appTsconfigJsonTemplate())).toEqual({
			extends: '../../tsconfig.base.json',
			compilerOptions: {
				paths: { '@/*': ['./src/*'] },
				rootDir: 'src',
				outDir: 'dist'
			},
			include: ['src']
		});

		expect(JSON.parse(tsconfigJsonTemplate())).toEqual({
			compilerOptions: {
				...base.compilerOptions,
				paths: { '@/*': ['./src/*'] },
				rootDir: 'src',
				outDir: 'dist'
			},
			include: ['src']
		});
	});

	it('adds the workspace globs to the pnpm workspace file only in the monorepo variant', () => {
		expect(pnpmWorkspaceYamlMonorepoTemplate()).toContain('packages:\n  - apps/*\n  - packages/*');
		expect(pnpmWorkspaceYamlMonorepoTemplate()).toContain('esbuild: true');
		expect(pnpmWorkspaceYamlMonorepoTemplate()).toContain('engineStrict: true');
		expect(pnpmWorkspaceYamlTemplate()).not.toContain('packages:');
	});

	it('adds the workspace source folders to the eslint config only with the monorepo switch', () => {
		const plain = eslintConfigMjsTemplate();

		expect(plain).not.toContain('apps/*');
		expect(plain).toBe(eslintConfigMjsTemplate({}));

		const monorepo = eslintConfigMjsTemplate({ monorepo: true });

		expect(monorepo).toContain('apps/*/{src,test,tools,e2e},packages/*/{src,test,tools}');
		expect(monorepo).not.toContain('monorepoFolders');
	});
});
