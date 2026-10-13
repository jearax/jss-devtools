import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { check, resolveConfig } from 'prettier'
import { describe, expect, it } from 'vitest'

import { buildCommitlintConfigContent } from '@/commands/init/generators/commitlint-config-content'
import { buildEditorconfigContent } from '@/commands/init/generators/editorconfig-content'
import { buildEslintConfigContent } from '@/commands/init/generators/eslint-config-content'
import { formatJson } from '@/commands/init/generators/format-json'
import { buildGitignoreContent } from '@/commands/init/generators/gitignore-content'
import { buildHookContent, mergeHookContent } from '@/commands/init/generators/husky-hooks-content'
import { buildLintStagedConfig } from '@/commands/init/generators/lint-staged-content'
import { mergePnpmAllowBuilds } from '@/commands/init/generators/pnpm-workspace-content'
import { buildPrettierConfigContent } from '@/commands/init/generators/prettier-config-content'
import { buildScripts } from '@/commands/init/generators/scripts-content'
import { buildFreshTsconfig, mergeTsconfigAlias } from '@/commands/init/generators/tsconfig-content'
import { buildVscodeExtensionsContent, buildVscodeSettingsContent } from '@/commands/init/generators/vscode-content'
import { addCommand, fmtCommand, localBinCommand } from '@/core/runner/pm-commands'

// A scratch project holding only the generated .editorconfig + .prettierrc.json,
// so options resolve exactly as Prettier resolves them in a generated project.
const projectDir = mkdtempSync(join(tmpdir(), 'jss-prettier-'))

writeFileSync(join(projectDir, '.editorconfig'), buildEditorconfigContent())
writeFileSync(join(projectDir, '.prettierrc.json'), buildPrettierConfigContent())

const resolveOptions = async (filepath: string) =>
	(await resolveConfig(join(projectDir, filepath), { editorconfig: true })) ?? {}

// Generated files must already satisfy the generated formatting sources, or
// the first `lint` run in a fresh project fails on prettier/prettier.
const isPrettierClean = async (content: string, filepath: string): Promise<boolean> =>
	check(content, {
		...(await resolveOptions(filepath)),
		filepath
	})

describe('buildEslintConfigContent', () => {
	const content = buildEslintConfigContent()

	it('is valid, prettier-clean ESM', async () => {
		expect(await isPrettierClean(content, 'eslint.config.mjs')).toBe(true)
	})

	it('alphabetizes imports like import-x/order', () => {
		const modules = [...content.matchAll(/^import \w+ from '([^']+)';$/gm)].map((match) => match[1] ?? '')

		expect(modules).toEqual([...modules].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })))
	})

	it('ignores build output and agent-tool dirs', () => {
		expect(content).toContain(
			"ignores: ['dist/**', 'build/**', 'cov" + "erage/**', '.claude/**', '.agentkit/**', '.harness/**']"
		)
	})

	it('lints ts/js/mjs with node globals', () => {
		expect(content).toContain("files: ['**/*.{ts,js,mjs}']")
		expect(content).toContain('...globals.node')
	})

	it('has no type-aware, alias-only or enum-ban blocks', () => {
		expect(content).not.toContain('projectService')
		expect(content).not.toContain('no-restricted-imports')
		expect(content).not.toContain('TSEnumDeclaration')
	})
})

describe('buildPrettierConfigContent', () => {
	const jsRules = {
		semi: true,
		singleQuote: true,
		jsxSingleQuote: false,
		quoteProps: 'as-needed',
		trailingComma: 'none',
		bracketSpacing: true,
		bracketSameLine: false,
		arrowParens: 'always'
	}

	it('holds JS syntax rules and no whitespace options', () => {
		expect(JSON.parse(buildPrettierConfigContent())).toEqual(jsRules)
	})

	it('resolves whitespace from .editorconfig and syntax from .prettierrc.json', async () => {
		expect(await resolveOptions('src/index.ts')).toEqual({
			useTabs: true,
			tabWidth: 2,
			printWidth: 120,
			endOfLine: 'lf',
			...jsRules
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
	it('lints src/test and root configs, formats package.json with prettier', () => {
		expect(buildLintStagedConfig()).toEqual({
			'{src,test}/**/*.ts': ['eslint --fix', 'prettier --write'],
			'*.{ts,mjs}': ['eslint --fix', 'prettier --write'],
			'package.json': ['prettier --write']
		})
	})
})

describe('buildGitignoreContent', () => {
	it('ignores only the dependency tree', () => {
		expect(buildGitignoreContent()).toBe('node_modules/\n')
	})
})

describe('buildScripts', () => {
	it('lints and formats only src/test and root configs', () => {
		expect(buildScripts()).toEqual({
			prepare: 'husky',
			typecheck: 'tsc --noEmit',
			lint: 'eslint --no-error-on-unmatched-pattern "{src,test}/**/*.ts" "*.{ts,mjs}"',
			format: 'eslint --fix --no-error-on-unmatched-pattern "{src,test}/**/*.ts" "*.{ts,mjs}"'
		})
	})

	it('drops lint and format when the linter feature is off', () => {
		expect(Object.keys(buildScripts({ includeLinter: false }))).toEqual(['prepare', 'typecheck'])
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
		['npm', 'npx husky', 'npm i -D a@1'],
		['pnpm', 'pnpm exec husky', 'pnpm add -D a@1'],
		['yarn', 'yarn exec husky', 'yarn add -D a@1'],
		['yarn@berry', 'yarn exec husky', 'yarn add -D a@1'],
		['bun', 'bun x husky', 'bun add -D a@1']
	] as const)('%s', (agent, localBin, add) => {
		expect(fmtCommand(localBinCommand(agent, 'husky'))).toBe(localBin)
		expect(fmtCommand(addCommand(agent, ['a@1'], { dev: true }))).toBe(add)
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
	const content = buildFreshTsconfig()

	it('sets the alias, target and node types', () => {
		const tsconfig = JSON.parse(content)

		expect(tsconfig.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
		expect(tsconfig.compilerOptions.target).toBe('ES2022')
		expect(tsconfig.compilerOptions.types).toEqual(['node'])
		expect(tsconfig.exclude).toEqual(['node_modules', 'dist'])
	})

	it('is prettier-clean', async () => {
		expect(await isPrettierClean(content, 'tsconfig.json')).toBe(true)
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
				'source.fixAll.eslint': 'explicit',
				'source.organizeImports': 'never'
			}
		})
	})

	it('recommends the eslint and prettier extensions', () => {
		expect(JSON.parse(buildVscodeExtensionsContent())).toEqual({
			recommendations: ['editorconfig.editorconfig', 'dbaeumer.vscode-eslint', 'esbenp.prettier-vscode']
		})
	})

	it.each([
		['settings.json', buildVscodeSettingsContent],
		['extensions.json', buildVscodeExtensionsContent]
	])('%s is prettier-clean', async (name, build) => {
		expect(await isPrettierClean(build(), `.vscode/${name}`)).toBe(true)
	})
})
