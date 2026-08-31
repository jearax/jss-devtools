// Surface tests: pure arg extraction plus a citty parse probe that pins the
// `--no-<flag>` negation keying the whole flag design depends on.
import { defineCommand, runCommand } from 'citty'
import { describe, expect, it } from 'vitest'

import { FRAMEWORK_IDS } from '@/commands/init/types'
import { extractInitArgs, InitArgsError } from '@/commands/init/utils/args'

describe('extractInitArgs (pure extraction)', () => {
	it('defaults: absent feature flags stay on, mode flags off', () => {
		const parsed = extractInitArgs({ framework: 'node' })

		expect(parsed).toEqual({
			framework: 'node',
			yes: false,
			dryRun: false,
			json: false,
			features: {
				linter: true,
				commitlint: true,
				install: true
			}
		})
	})

	it('negated features parse as false', () => {
		const parsed = extractInitArgs({
			framework: 'next',
			linter: false,
			commitlint: false,
			install: false
		})

		expect(parsed.features).toEqual({
			linter: false,
			commitlint: false,
			install: false
		})
	})

	it('mode flags extract from kebab-case keys', () => {
		const parsed = extractInitArgs({
			framework: 'react',
			yes: true,
			'dry-run': true,
			json: true
		})

		expect(parsed.yes).toBe(true)
		expect(parsed.dryRun).toBe(true)
		expect(parsed.json).toBe(true)
	})

	it('missing framework throws FRAMEWORK_REQUIRED listing valid values', () => {
		expect(() => extractInitArgs({})).toThrowError(InitArgsError)

		try {
			extractInitArgs({})
		} catch (error) {
			const err = error as InitArgsError

			expect(err.code).toBe('FRAMEWORK_REQUIRED')
			expect(err.message).toContain('node')
			expect(err.message).toContain('next')
		}
	})

	it.each(['react-native', 'vue', 'nuxt', 42])('invalid framework %p throws FRAMEWORK_INVALID', (framework) => {
		expect(() => extractInitArgs({ framework })).toThrowError(InitArgsError)

		try {
			extractInitArgs({ framework })
		} catch (error) {
			expect((error as InitArgsError).code).toBe('FRAMEWORK_INVALID')
		}
	})

	it('accepts every declared framework id', () => {
		for (const framework of FRAMEWORK_IDS) {
			expect(extractInitArgs({ framework }).framework).toBe(framework)
		}
	})
})

// Probe command mirrors the real init args schema; runCommand feeds raw CLI
// argv through citty's parser so the captured object is exactly what the
// production run() receives.
const captured: Record<string, unknown> = {}

const probeCommand = defineCommand({
	meta: { name: 'init-probe' },
	args: {
		framework: {
			type: 'string',
			description: 'framework',
			required: false
		},
		yes: {
			type: 'boolean',
			description: 'yes',
			default: false
		},
		'dry-run': {
			type: 'boolean',
			description: 'dry run',
			default: false
		},
		json: {
			type: 'boolean',
			description: 'json',
			default: false
		},
		linter: {
			type: 'boolean',
			description: 'linter',
			default: true
		},
		commitlint: {
			type: 'boolean',
			description: 'commitlint',
			default: true
		},
		install: {
			type: 'boolean',
			description: 'install',
			default: true
		}
	},
	run: ({ args }) => {
		Object.assign(captured, args)
	}
})

describe('citty parse probe (negation keying)', () => {
	it('parses --no-linter into linter=false, other defaults intact', async () => {
		await runCommand(probeCommand, {
			rawArgs: ['--framework', 'node', '--no-linter']
		})

		expect(captured.framework).toBe('node')
		expect(captured.linter).toBe(false)
		expect(captured.commitlint).toBe(true)
		expect(captured.install).toBe(true)
	})

	it('parses all three negations plus mode flags at once', async () => {
		await runCommand(probeCommand, {
			rawArgs: ['--framework', 'react', '--no-linter', '--no-commitlint', '--no-install', '--dry-run', '--json']
		})

		expect(captured.framework).toBe('react')
		expect(captured.linter).toBe(false)
		expect(captured.commitlint).toBe(false)
		expect(captured.install).toBe(false)
		expect(captured['dry-run']).toBe(true)
		expect(captured.json).toBe(true)
	})

	it('kebab-case flag --dry-run lands under the dry-run key', async () => {
		await runCommand(probeCommand, { rawArgs: ['--framework', 'next', '--dry-run'] })

		expect(captured['dry-run']).toBe(true)
	})
})
