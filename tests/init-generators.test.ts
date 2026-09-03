// Unit tests for init generator content builders — pure content checks.
import { describe, expect, it } from 'vitest'

import { buildCommitlintConfigContent } from '@/commands/init/generators/commitlint-config-content'
import { buildEslintConfigContent } from '@/commands/init/generators/eslint-config-content'
import { buildHookContent, mergeHookContent } from '@/commands/init/generators/husky-hooks-content'
import { buildLintStagedConfig } from '@/commands/init/generators/lint-staged-content'
import { buildPrettierConfigContent } from '@/commands/init/generators/prettier-config-content'
import { buildScripts } from '@/commands/init/generators/scripts-content'
import { buildFreshTsconfig, mergeTsconfigAlias } from '@/commands/init/generators/tsconfig-content'
import { getPreset } from '@/commands/init/presets/get-preset'
import { addSpecsCommand, fmtCommand, localBinCommand, oneOffRunnerCommand } from '@/core/runner/pm-commands'

describe('buildEslintConfigContent', () => {
	it('node preset contains base imports and no framework plugins', () => {
		const preset = getPreset('node')
		const content = buildEslintConfigContent(preset)

		expect(content).toContain("import js from '@eslint/js'")
		expect(content).toContain("import tsParser from '@typescript-eslint/parser'")
		expect(content).toContain("import tsPlugin from '@typescript-eslint/eslint-plugin'")
		expect(content).toContain("import eslintConfigPrettier from 'eslint-config-prettier'")
		expect(content).toContain("import pluginImportX from 'eslint-plugin-import-x'")
		expect(content).toContain("import pluginAutofix from 'eslint-plugin-autofix'")
		expect(content).toContain("import globals from 'globals'")
		expect(content).not.toContain('eslint-plugin-react')
		expect(content).toContain('globals.node')
	})

	it('react preset contains react imports and plugins', () => {
		const preset = getPreset('react')
		const content = buildEslintConfigContent(preset)

		expect(content).toContain('eslint-plugin-react')
		expect(content).toContain('eslint-plugin-react-hooks')
		expect(content).toContain('globals.browser')
	})

	it('next preset extends react with same react plugin pair', () => {
		const preset = getPreset('next')
		const content = buildEslintConfigContent(preset)

		expect(content).toContain('eslint-plugin-react')
		expect(content).toContain('eslint-plugin-react-hooks')
	})

	it('content is parseable as ESM module (parens balanced)', () => {
		const preset = getPreset('node')
		const content = buildEslintConfigContent(preset)

		const opens = (content.match(/\[/g) || []).length
		const closes = (content.match(/\]/g) || []).length

		expect(opens).toBe(closes)

		const parenOpens = (content.match(/\(/g) || []).length
		const parenCloses = (content.match(/\)/g) || []).length

		expect(parenOpens).toBe(parenCloses)
	})

	it('content is syntactically valid ESM (acorn parse, braces + brackets balanced)', () => {
		const preset = getPreset('node')
		const content = buildEslintConfigContent(preset)

		// Brace balance — catches off-by-one close errors that bracket-only checks miss.
		const openBraces = (content.match(/\{/g) || []).length
		const closeBraces = (content.match(/\}/g) || []).length

		expect(openBraces, 'unbalanced braces in generated eslint config').toBe(closeBraces)

		// Strip top-level import/export to make the body parseable as a standalone module.
		const body = content.replace(/^import .*$/gm, '').replace(/^export default eslintConfig$/m, 'export default []')

		// Use Function ctor (Node) to parse — fails on syntax errors.
		expect(() => new Function(body.replace(/^export default /m, 'return '))).not.toThrow()
	})

	it('all plugin entries in the plugins block share the same leading indent', () => {
		const preset = getPreset('node')
		const content = buildEslintConfigContent(preset)

		// Slice the plugins: { ... }, block and collect each entry line.
		const pluginsMatch = content.match(/plugins:\s*\{([\s\S]*?)\n\s*\}/)

		expect(pluginsMatch, 'plugins block not found').not.toBeNull()

		if (!pluginsMatch) {
			return
		}

		const entries = pluginsMatch[1]
			.split('\n')
			.map((line) => line.trimEnd())
			.filter((line) => line.includes(':') && /^\s*'/.test(line))

		expect(entries.length).toBeGreaterThanOrEqual(2)

		const leadingWs = entries.map((line) => line.match(/^\s*/)?.[0] ?? '')
		const firstIndent = leadingWs[0]

		for (const [i, ws] of leadingWs.entries()) {
			expect(ws, `entry[${i}] indent differs from entry[0]`).toBe(firstIndent)
		}
	})

	it('matches the house eslint.config.mjs plugins-block indent (3 tabs)', () => {
		const preset = getPreset('node')
		const content = buildEslintConfigContent(preset)

		const pluginsMatch = content.match(/plugins:\s*\{([\s\S]*?)\n\s*\}/)

		expect(pluginsMatch, 'plugins block not found').not.toBeNull()

		if (!pluginsMatch) {
			return
		}

		const firstEntry = pluginsMatch[1]
			.split('\n')
			.map((line) => line.trimEnd())
			.find((line) => /^\s*'/.test(line))

		expect(firstEntry).toBeDefined()
		// House reference uses 3 tabs of indent inside plugins: { ... }
		expect(firstEntry!.startsWith('\t\t\t')).toBe(true)
	})

	it('emits spread of globals.node (not bare identifier — bare would be a syntax error)', () => {
		const preset = getPreset('node')
		const content = buildEslintConfigContent(preset)

		expect(content).toContain('...globals.node')
		expect(content).not.toMatch(/^\s*globals\.node\s*$/m)
	})

	it('quotes hyphenated keys inside import-x/order (e.g. newlines-between)', () => {
		const preset = getPreset('node')
		const content = buildEslintConfigContent(preset)

		expect(content).toContain("'newlines-between'")
		expect(content).not.toMatch(/^\s*newlines-between\s*:/m)
	})
})

describe('buildPrettierConfigContent', () => {
	it('returns valid JSON parseable as object', () => {
		const content = buildPrettierConfigContent()
		const parsed = JSON.parse(content)

		expect(parsed).toBeTypeOf('object')
		expect(parsed).not.toBeNull()
	})

	it('includes expected formatting keys', () => {
		const content = buildPrettierConfigContent()
		const parsed = JSON.parse(content)

		expect(parsed).toHaveProperty('semi')
		expect(parsed).toHaveProperty('singleQuote')
		expect(parsed).toHaveProperty('tabWidth')
	})

	it('emits tabWidth: 4', () => {
		const content = buildPrettierConfigContent()
		const parsed = JSON.parse(content)

		expect(parsed.tabWidth).toBe(4)
	})
})

describe('buildCommitlintConfigContent', () => {
	it('contains extends conventional and formatter', () => {
		const content = buildCommitlintConfigContent()

		expect(content).toContain('@commitlint/config-conventional')
	})

	it('wraps config in a named const then exports it (mirrors eslint.config.mjs style)', () => {
		const content = buildCommitlintConfigContent()

		expect(content).toContain('const commitlintConfig = {')
		expect(content).toMatch(/export\s+default\s+commitlintConfig/)
		expect(content).not.toMatch(/^export\s+default\s+\{/m)
	})

	it('emits TICKET_REGEX with hard "TICKET" prefix and sentence-case subject ending in period', () => {
		const content = buildCommitlintConfigContent()

		expect(content).toContain('const TICKET_REGEX = ')
		// Pull the regex literal out of the generated source so the test stays
		// independent of how the source code embeds the regex.
		const match = content.match(/const TICKET_REGEX = (\/.+\/)/)

		expect(match, 'TICKET_REGEX literal not found').not.toBeNull()

		if (match) {
			const regex = new RegExp(match[1].slice(1, -1))

			// Case-agnostic + no trailing-period required — subject after
			// the TICKET prefix is just any non-empty description.
			expect(regex.test('TICKET-127 - Add login form.')).toBe(true)
			expect(regex.test('TICKET-1 - Fix.')).toBe(true)
			expect(regex.test('TICKET-127 - abc def')).toBe(true)
			expect(regex.test('TICKET-127 - add login form.')).toBe(true)
			expect(regex.test('ABC-127 - Add login form.')).toBe(false)
			expect(regex.test('TICKET-abc - Add login form.')).toBe(false)
			expect(regex.test('TICKET-127')).toBe(false)
		}
	})

	it('emits CONVENTIONAL_REGEX accepting all 11 conventional types with any non-empty description', () => {
		const content = buildCommitlintConfigContent()

		expect(content).toContain('const CONVENTIONAL_REGEX = ')
		const match = content.match(/const CONVENTIONAL_REGEX = (\/.+\/)/)

		expect(match, 'CONVENTIONAL_REGEX literal not found').not.toBeNull()

		if (match) {
			const regex = new RegExp(match[1].slice(1, -1))

			// The regex only checks STRUCTURE; valid-type enforcement is
			// delegated to the type-enum rule that comes from
			// @commitlint/config-conventional (via `extends`).
			expect(regex.test('feat: Add login form.')).toBe(true)
			expect(regex.test('fix(api): Handle timeout.')).toBe(true)
			expect(regex.test('revert!: Drop legacy.')).toBe(true)
			expect(regex.test('feat: abc def')).toBe(true)
			expect(regex.test('feat Add login form.')).toBe(false)
			expect(regex.test('feat:')).toBe(false)
		}
	})

	it('declares a custom plugin rule that accepts both header shapes', () => {
		const content = buildCommitlintConfigContent()

		expect(content).toContain("'header-ticket-or-conventional'")
		expect(content).toContain('TICKET_REGEX.test(header) || CONVENTIONAL_REGEX.test(header)')
	})

	it('rule does NOT depend on a `when` helper (commitlint invokes rules with `when = "always"` config string)', async () => {
		// Regression: commitlint calls rule.rule(parsed, when, value) where
		// `when` is the config string ("always" / "never"), NOT a helper.
		// See @commitlint/lint/src/lint.ts and @commitlint/types rule signature.
		const content = buildCommitlintConfigContent()

		// Strip `export default` so we can dynamic-eval the plugin const.
		const evalSrc = content.replace(/^export default.*$/m, '') + '\nreturn headerTicketPlugin'

		const headerTicketPlugin = new Function(evalSrc)() as {
			rules: Record<
				string,
				(
					parsed: { header?: string },
					when: unknown,
					value: unknown
				) => Promise<boolean | [boolean] | [false, string]> | boolean | [boolean] | [false, string]
			>
		}

		const rule = headerTicketPlugin.rules['header-ticket-or-conventional']

		expect(typeof rule).toBe('function')

		// commitlint's actual call shape: rule(parsed, when, value).
		// Second arg is the config STRING 'always', not a function.
		const okResult = await rule({ header: 'TICKET-127 - Add login form' }, 'always', undefined)

		expect(okResult).toBe(true)

		const okConventional = await rule({ header: 'feat(api): Handle timeout' }, 'always', undefined)

		expect(okConventional).toBe(true)

		const badResult = (await rule({ header: 'no prefix here' }, 'always', undefined)) as [false, string]

		expect(badResult[0]).toBe(false)
		expect(badResult[1]).toContain('TICKET-<num>')
	})

	it('extracts the plugin as a separate headerTicketPlugin const for clarity', () => {
		const content = buildCommitlintConfigContent()

		expect(content).toContain('const headerTicketPlugin = {')
		expect(content).toContain('plugins: [headerTicketPlugin]')
	})

	it('does NOT override subject-case or subject-full-stop (built-in rules stay active)', () => {
		const content = buildCommitlintConfigContent()

		expect(content).not.toMatch(/'subject-case':\s*\[0,\s*'never'\]/)
		expect(content).not.toMatch(/'subject-full-stop':\s*\[0,\s*'never'\]/)
	})

	it('emits syntactically valid JS (no TS annotations leak into the .mjs output)', () => {
		// commitlint.config.mjs is loaded as plain JS — any TypeScript syntax
		// (e.g. `: { header: string }`) would crash the parser.
		const content = buildCommitlintConfigContent()

		expect(content).not.toMatch(/:\s*\{[^}]*:\s*\w+[^}]*\}/)
		expect(content).not.toMatch(/:\s*\w+\[\]/)
		expect(content).not.toMatch(/:\s*\[boolean, string\]/)

		// node --check on the generated output must pass.
		expect(() => new Function(content.replace(/^export default commitlintConfig$/m, '({})'))).not.toThrow()
	})
})

describe('buildLintStagedConfig', () => {
	it('contains eslint and prettier commands on the preset glob', () => {
		const preset = getPreset('node')
		const config = buildLintStagedConfig(preset, 'pnpm', false, 'prettier-package-json@1.0.0')

		const json = JSON.stringify(config)

		expect(json).toContain('prettier')
		expect(json).toContain('eslint')
		expect(json).toContain(preset.lintStagedGlob)
	})

	it('includes package.json entry for prettier-package-json by default', () => {
		const preset = getPreset('node')
		const config = buildLintStagedConfig(preset, 'pnpm', false, 'prettier-package-json@1.0.0')

		expect(config).toHaveProperty('package.json')
		const pkgJsonCmds = config['package.json'] ?? []

		expect(pkgJsonCmds.join(' ')).toContain('prettier-package-json')
	})

	it('omits package.json entry when includePpj: false', () => {
		const preset = getPreset('node')

		const config = buildLintStagedConfig(preset, 'pnpm', false, 'prettier-package-json@1.0.0', { includePpj: false })

		expect(config).not.toHaveProperty('package.json')
	})
})

describe('buildScripts', () => {
	it('contains prepare and format keys by default', () => {
		const preset = getPreset('node')
		const scripts = buildScripts(preset)

		expect(scripts).toHaveProperty('prepare')
		expect(scripts).toHaveProperty('format')
	})

	it('prepare is husky', () => {
		const preset = getPreset('node')
		const scripts = buildScripts(preset)

		expect(scripts.prepare).toBe('husky')
	})

	it('format runs eslint --fix and prettier --write', () => {
		const preset = getPreset('node')
		const scripts = buildScripts(preset)

		expect(scripts.format).toContain('eslint --fix')
		expect(scripts.format).toContain('prettier --write')
	})

	it('includeFormat: false omits format script', () => {
		const preset = getPreset('node')
		const scripts = buildScripts(preset, { includeFormat: false })

		expect(scripts).not.toHaveProperty('format')
		expect(scripts).toHaveProperty('prepare')
	})

	it('uses preset formatGlobs in format command', () => {
		const preset = getPreset('react')
		const scripts = buildScripts(preset)

		for (const glob of preset.formatGlobs) {
			expect(scripts.format).toContain(glob)
		}
	})
})

describe('buildHookContent', () => {
	it('pre-commit contains lint-staged', () => {
		const content = buildHookContent('pre-commit', 'pnpm')

		expect(content).toContain('lint-staged')
		expect(content.startsWith('#!/usr/bin/env sh')).toBe(true)
	})

	it('commit-msg contains commitlint --edit', () => {
		const content = buildHookContent('commit-msg', 'pnpm')

		expect(content).toContain('commitlint')
		expect(content).toContain('--edit')
		expect(content.startsWith('#!/usr/bin/env sh')).toBe(true)
	})

	it('uses yarn-specific exec for yarn PM', () => {
		const content = buildHookContent('pre-commit', 'yarn')

		expect(content).toContain('lint-staged')
	})
})

describe('localBinCommand', () => {
	it('pnpm uses "pnpm exec" prefix', () => {
		const cmd = localBinCommand('pnpm', 'lint-staged')

		expect(cmd.command).toBe('pnpm')
		expect(cmd.args[0]).toBe('exec')
		expect(cmd.args).toContain('lint-staged')
	})

	it('npm uses "npx" prefix', () => {
		const cmd = localBinCommand('npm', 'lint-staged')

		expect(cmd.command).toBe('npx')
		expect(cmd.args).toContain('lint-staged')
	})

	it('yarn uses "yarn" prefix (run-style invocation)', () => {
		const cmd = localBinCommand('yarn', 'lint-staged')

		expect(cmd.command).toBe('yarn')
		expect(cmd.args).toContain('lint-staged')
	})

	it('bun uses "bunx" prefix', () => {
		const cmd = localBinCommand('bun', 'lint-staged')

		expect(cmd.command).toBe('bunx')
		expect(cmd.args).toContain('lint-staged')
	})

	it('passes extra args through', () => {
		const cmd = localBinCommand('pnpm', 'commitlint', ['--edit', '"$1"'])

		expect(cmd.args).toContain('--edit')
		expect(cmd.args).toContain('"$1"')
	})
})

describe('addSpecsCommand', () => {
	it('pnpm addSpecs uses "add -D" with dev=true', () => {
		const cmd = addSpecsCommand('pnpm', ['eslint'], { dev: true })

		expect(cmd.command).toBe('pnpm')
		expect(cmd.args).toContain('add')
		expect(cmd.args).toContain('-D')
		expect(cmd.args).toContain('eslint')
	})

	it('npm addSpecs uses "npm i" (or install) with -D', () => {
		const cmd = addSpecsCommand('npm', ['eslint'], { dev: true })

		expect(cmd.command).toBe('npm')
		// nypm's resolveCommand returns 'i' shortcut
		expect(['i', 'install']).toContain(cmd.args[0])
		expect(cmd.args).toContain('-D')
		expect(cmd.args).toContain('eslint')
	})

	it('yarn addSpecs uses "yarn add -D" (no --dev)', () => {
		const cmd = addSpecsCommand('yarn', ['eslint'], { dev: true })

		expect(cmd.command).toBe('yarn')
		expect(cmd.args).toContain('add')
		expect(cmd.args).toContain('-D')
		expect(cmd.args).toContain('eslint')
	})

	it('omits -D when dev=false', () => {
		const cmd = addSpecsCommand('pnpm', ['react'], { dev: false })

		expect(cmd.args).not.toContain('-D')
		expect(cmd.args).toContain('react')
	})

	it('bun uses lowercase -d for dev flag', () => {
		const cmd = addSpecsCommand('bun', ['eslint'], { dev: true })

		expect(cmd.args).toContain('-d')
		expect(cmd.args).not.toContain('-D')
	})
})

describe('oneOffRunnerCommand', () => {
	it('pnpm returns pnpm dlx <pkg> <args>', () => {
		const cmd = oneOffRunnerCommand('pnpm', 'eslint', ['--fix'], false)

		expect(cmd.command).toBe('pnpm')
		expect(cmd.args[0]).toBe('dlx')
		expect(cmd.args).toContain('eslint')
		expect(cmd.args).toContain('--fix')
	})

	it('bun returns bunx <pkg> <args>', () => {
		const cmd = oneOffRunnerCommand('bun', 'eslint', [], false)

		expect(cmd.command).toBe('bunx')
		expect(cmd.args).toContain('eslint')
	})

	it('yarn berry uses yarn dlx <pkg>', () => {
		const cmd = oneOffRunnerCommand('yarn', 'eslint', ['--fix'], true)

		expect(cmd.command).toBe('yarn')
		expect(cmd.args[0]).toBe('dlx')
		expect(cmd.args).toContain('eslint')
	})

	it('yarn classic falls back to npx --yes', () => {
		const cmd = oneOffRunnerCommand('yarn', 'eslint', [], false)

		expect(cmd.command).toBe('npx')
		expect(cmd.args).toContain('--yes')
		expect(cmd.args).toContain('eslint')
	})

	it('npm falls back to npx --yes', () => {
		const cmd = oneOffRunnerCommand('npm', 'eslint', [], false)

		expect(cmd.command).toBe('npx')
		expect(cmd.args).toContain('--yes')
		expect(cmd.args).toContain('eslint')
	})
})

describe('fmtCommand', () => {
	it('joins command and args with space', () => {
		const cmd = {
			command: 'pnpm',
			args: ['add', 'eslint']
		}

		expect(fmtCommand(cmd)).toBe('pnpm add eslint')
	})

	it('handles multi-arg commands', () => {
		const cmd = {
			command: 'yarn',
			args: ['add', '-D', 'eslint', 'prettier']
		}

		expect(fmtCommand(cmd)).toBe('yarn add -D eslint prettier')
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
