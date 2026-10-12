// Unit tests for init generator content builders — pure content checks.
import { check } from 'prettier'
import { describe, expect, it } from 'vitest'

import { buildCommitlintConfigContent } from '@/commands/init/generators/commitlint-config-content'
import { buildEslintConfigContent } from '@/commands/init/generators/eslint-config-content'
import { formatJson } from '@/commands/init/generators/format-json'
import { buildHookContent, mergeHookContent } from '@/commands/init/generators/husky-hooks-content'
import { buildLintStagedConfig } from '@/commands/init/generators/lint-staged-content'
import { mergePnpmAllowBuilds } from '@/commands/init/generators/pnpm-workspace-content'
import { buildPrettierConfigContent } from '@/commands/init/generators/prettier-config-content'
import { buildScripts } from '@/commands/init/generators/scripts-content'
import { buildFreshTsconfig, mergeTsconfigAlias } from '@/commands/init/generators/tsconfig-content'
import { buildVscodeExtensionsContent, buildVscodeSettingsContent } from '@/commands/init/generators/vscode-content'
import { getPreset } from '@/commands/init/presets/get-preset'
import { FRAMEWORK_IDS } from '@/commands/init/types'
import { addCommand, fmtCommand, localBinCommand, oneOffCommand } from '@/core/runner/pm-commands'

const prettierOptions = JSON.parse(buildPrettierConfigContent()) as Record<string, unknown>

// Generated files must already satisfy the generated prettier config, or the
// first `lint` run in a fresh project fails on prettier/prettier.
const isPrettierClean = (content: string, filepath: string): Promise<boolean> =>
	check(content, {
		...prettierOptions,
		filepath
	})

describe('buildEslintConfigContent', () => {
	it.each(FRAMEWORK_IDS)('%s config is valid, prettier-clean ESM', async (framework) => {
		expect(await isPrettierClean(buildEslintConfigContent(getPreset(framework)), 'eslint.config.mjs')).toBe(true)
	})

	it('node lints ts/js/mjs with node globals and a strict @/ alias rule', () => {
		const content = buildEslintConfigContent(getPreset('node'))

		expect(content).toContain("files: ['**/*.{ts,js,mjs}']")
		expect(content).toContain('...globals.node')
		expect(content).toContain("regex: '^\\\\.{1,2}/'")
		expect(content).not.toContain('pluginReact')
	})

	it('react/next add the react plugin pair, jsx parsing and a CSS exception to the alias rule', () => {
		for (const framework of ['react', 'next'] as const) {
			const content = buildEslintConfigContent(getPreset(framework))

			expect(content).toContain("import pluginReactHooks from 'eslint-plugin-react-hooks';")
			expect(content).toContain("'react-hooks': pluginReactHooks")
			expect(content).toContain("...pluginReactHooks.configs['recommended-latest'].rules,")
			expect(content).toContain('jsx: true')
			expect(content).toContain('...globals.browser')
			expect(content).toContain('(?!.*\\\\.css$)')
		}
	})

	it('enables type-aware promise rules through the project service', () => {
		const content = buildEslintConfigContent(getPreset('node'))

		expect(content).toContain('projectService: true')
		expect(content).toContain("'@typescript-eslint/no-floating-promises': 'error'")
	})
})

describe('buildPrettierConfigContent', () => {
	it('lists only the options that differ from Prettier defaults', () => {
		expect(prettierOptions).toEqual({
			useTabs: true,
			printWidth: 120,
			singleQuote: true,
			trailingComma: 'none',
			endOfLine: 'auto'
		})
	})
})

describe('buildCommitlintConfigContent', () => {
	it('extends config-conventional and is prettier-clean', async () => {
		const content = buildCommitlintConfigContent()

		expect(content).toContain("extends: ['@commitlint/config-conventional']")
		expect(await isPrettierClean(content, 'commitlint.config.mjs')).toBe(true)
	})
})

describe('buildLintStagedConfig', () => {
	it('lints the preset glob and root configs, formats package.json through the PM one-off runner', () => {
		const config = buildLintStagedConfig(getPreset('node'), 'pnpm', 'prettier-package-json@^2.8.0')

		expect(config).toEqual({
			'{src,test}/**/*.ts': ['eslint --fix', 'prettier --write'],
			'*.{ts,mjs}': ['eslint --fix', 'prettier --write'],
			'package.json': ['pnpm dlx prettier-package-json@^2.8.0 --use-tabs --write']
		})
	})
})

describe('buildScripts', () => {
	it('adds prepare, typecheck, lint and format over the preset globs', () => {
		const scripts = buildScripts(getPreset('node'))

		expect(scripts.prepare).toBe('husky')
		expect(scripts.typecheck).toBe('tsc --noEmit')
		expect(scripts.lint).toBe('eslint --no-error-on-unmatched-pattern "{src,test}/**/*.ts" "*.{ts,mjs}"')
		expect(scripts.format).toContain('prettier --write --no-error-on-unmatched-pattern')
	})

	it('drops lint and format when the linter feature is off', () => {
		const scripts = buildScripts(getPreset('node'), { includeLinter: false })

		expect(Object.keys(scripts)).toEqual(['prepare', 'typecheck'])
	})
})

describe('buildHookContent', () => {
	it('runs lint-staged and commitlint through the PM local runner', () => {
		expect(buildHookContent('pre-commit', 'pnpm')).toBe('#!/usr/bin/env sh\npnpm exec lint-staged\n')
		expect(buildHookContent('commit-msg', 'npm')).toBe('#!/usr/bin/env sh\nnpx commitlint --edit "$1"\n')
	})
})

describe('PM command mapping', () => {
	it.each([
		['npm', 'npx husky', 'npm i -D a@1', 'npx ppj@1 --write'],
		['pnpm', 'pnpm exec husky', 'pnpm add -D a@1', 'pnpm dlx ppj@1 --write'],
		['yarn', 'yarn exec husky', 'yarn add -D a@1', 'npx ppj@1 --write'],
		['yarn@berry', 'yarn exec husky', 'yarn add -D a@1', 'yarn dlx ppj@1 --write'],
		['bun', 'bun x husky', 'bun add -D a@1', 'bun x ppj@1 --write']
	] as const)('%s', (agent, localBin, add, oneOff) => {
		expect(fmtCommand(localBinCommand(agent, 'husky'))).toBe(localBin)
		expect(fmtCommand(addCommand(agent, ['a@1'], { dev: true }))).toBe(add)
		expect(fmtCommand(oneOffCommand(agent, 'ppj@1', ['--write']))).toBe(oneOff)
	})
})

describe('mergePnpmAllowBuilds', () => {
	it('creates the file when missing', () => {
		expect(mergePnpmAllowBuilds(null)).toEqual({
			kind: 'write',
			content: 'allowBuilds:\n  unrs-resolver: true\n'
		})
	})

	it('keeps an existing entry untouched', () => {
		const existing = 'allowBuilds:\n  esbuild: true\n  unrs-resolver: true\n'

		expect(mergePnpmAllowBuilds(existing)).toEqual({
			kind: 'write',
			content: existing
		})
	})

	it('inserts under an existing block map, preserving other settings', () => {
		const existing = 'allowBuilds:\n  esbuild: true\nminimumReleaseAgeExclude:\n  - vitest@5.0.3\n'

		expect(mergePnpmAllowBuilds(existing)).toEqual({
			kind: 'write',
			content: 'allowBuilds:\n  unrs-resolver: true\n  esbuild: true\nminimumReleaseAgeExclude:\n  - vitest@5.0.3\n'
		})
	})

	it('appends a block when allowBuilds is absent', () => {
		expect(mergePnpmAllowBuilds('packages:\n  - apps/*')).toEqual({
			kind: 'write',
			content: 'packages:\n  - apps/*\nallowBuilds:\n  unrs-resolver: true\n'
		})
	})

	it('skips an inline allowBuilds value', () => {
		expect(mergePnpmAllowBuilds('allowBuilds: {}\n').kind).toBe('skip')
	})
})

describe('buildFreshTsconfig', () => {
	it('node preset: parses, paths and target', () => {
		const preset = getPreset('node')
		const content = buildFreshTsconfig(preset)

		const tsconfig = JSON.parse(content)

		expect(tsconfig.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
		expect(tsconfig.compilerOptions.target).toBe('ES2022')
	})

	it('excludes node_modules and dist', () => {
		const preset = getPreset('node')
		const content = buildFreshTsconfig(preset)

		const tsconfig = JSON.parse(content)

		expect(tsconfig.exclude).toEqual(['node_modules', 'dist'])
	})

	it('next preset: jsx preserve set in compilerOptions', () => {
		const preset = getPreset('next')
		const content = buildFreshTsconfig(preset)

		const tsconfig = JSON.parse(content)

		expect(tsconfig.compilerOptions).toHaveProperty('jsx', 'preserve')
	})

	it.each(FRAMEWORK_IDS)('%s preset output is prettier-clean', async (framework) => {
		expect(await isPrettierClean(buildFreshTsconfig(getPreset(framework)), 'tsconfig.json')).toBe(true)
	})

	it('merged alias output is prettier-clean', async () => {
		const outcome = mergeTsconfigAlias('{"compilerOptions":{"strict":true,"lib":["ES2024","DOM"]},"include":["src"]}')

		expect(outcome.kind).toBe('write')
		expect(outcome.kind === 'write' && (await isPrettierClean(outcome.content, 'tsconfig.json'))).toBe(true)
	})
})

describe('formatJson', () => {
	it('breaks a primitive array that exceeds the print width', async () => {
		const content = formatJson({ include: Array.from({ length: 12 }, (_, i) => `src/module-${i}/**/*.ts`) })

		expect(content.split('\n').length).toBeGreaterThan(4)
		expect(await isPrettierClean(content, 'tsconfig.json')).toBe(true)
	})
})

describe('mergeTsconfigAlias', () => {
	it('no-paths JSON → write with paths added + other keys preserved', () => {
		const existing = JSON.stringify({
			compilerOptions: {
				target: 'ES2022',
				module: 'commonjs'
			},
			include: ['src/**/*']
		})

		const outcome = mergeTsconfigAlias(existing)

		expect(outcome.kind).toBe('write')

		if (outcome.kind === 'write') {
			const merged = JSON.parse(outcome.content)

			expect(merged.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
			expect(merged.compilerOptions.target).toBe('ES2022')
			expect(merged.compilerOptions.module).toBe('commonjs')
			expect(merged.include).toEqual(['src/**/*'])
		}
	})

	it('paths-exists → skip', () => {
		const existing = JSON.stringify({
			compilerOptions: {
				target: 'ES2022',
				paths: { '@/*': ['./src/*'] }
			}
		})

		const outcome = mergeTsconfigAlias(existing)

		expect(outcome.kind).toBe('skip')

		if (outcome.kind === 'skip') {
			expect(outcome.reason).toBe('paths-exists')
		}
	})

	it('references → solution-style skip', () => {
		const existing = JSON.stringify({
			references: [{ path: './tsconfig.node.json' }]
		})

		const outcome = mergeTsconfigAlias(existing)

		expect(outcome.kind).toBe('skip')

		if (outcome.kind === 'skip') {
			expect(outcome.reason).toBe('solution-style')
		}
	})

	it('unparseable (JSONC comment) → skip', () => {
		const existing = `{
			// This is a JSONC comment
			"compilerOptions": {
				"target": "ES2022"
			}
		}`

		const outcome = mergeTsconfigAlias(existing)

		expect(outcome.kind).toBe('skip')

		if (outcome.kind === 'skip') {
			expect(outcome.reason).toBe('unparseable')
		}
	})
})

describe('mergeHookContent', () => {
	it('keeps user lines, drops npm test sample, single managed line, no dup shebang', () => {
		const existing = `#!/usr/bin/env sh
echo "user line 1"
npm test
echo "user line 2"
`

		const managedLine = 'pnpm exec lint-staged'
		const merged = mergeHookContent(existing, managedLine)

		const shebangCount = (merged.match(/#!\/usr\/bin\/env sh/g) || []).length

		expect(shebangCount).toBe(1)
		expect(merged).toContain('echo "user line 1"')
		expect(merged).toContain('echo "user line 2"')
		expect(merged).not.toContain('npm test')

		const managedCount = (merged.match(/pnpm exec lint-staged/g) || []).length

		expect(managedCount).toBe(1)
	})
})

describe('VS Code files', () => {
	it('settings only delegate formatting to Prettier and fixes to eslint', () => {
		expect(JSON.parse(buildVscodeSettingsContent())).toEqual({
			'editor.defaultFormatter': 'esbenp.prettier-vscode',
			'editor.formatOnSave': true,
			'editor.codeActionsOnSave': {
				'source.fixAll.eslint': 'explicit'
			}
		})
	})

	it('recommends the eslint and prettier extensions', () => {
		expect(JSON.parse(buildVscodeExtensionsContent())).toEqual({
			recommendations: ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode']
		})
	})

	it.each([
		['settings.json', buildVscodeSettingsContent],
		['extensions.json', buildVscodeExtensionsContent]
	])('%s is prettier-clean', async (name, build) => {
		expect(await isPrettierClean(build(), `.vscode/${name}`)).toBe(true)
	})
})
