// Surface tests: pure arg extraction plus direct argv-scan tests for the
// hidden `--no-<flag>` toggles (the flags themselves are intentionally
// absent from --help, so they aren't parsed through citty).
import { defineCommand, runCommand } from 'citty'
import { beforeEach, describe, expect, it } from 'vitest'

import { FRAMEWORK_IDS } from '@/commands/init/types'
import { extractInitArgs, InitArgsError, parseNoFlags } from '@/commands/init/utils/args'

describe('extractInitArgs (pure extraction)', () => {
	it('defaults: empty argv → all features on, mode flags off', () => {
		const parsed = extractInitArgs({ framework: 'node' }, [])

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

	it('mode flags extract from kebab-case keys', () => {
		const parsed = extractInitArgs(
			{
				framework: 'react',
				yes: true,
				'dry-run': true,
				json: true
			},
			[]
		)

		expect(parsed.yes).toBe(true)
		expect(parsed.dryRun).toBe(true)
		expect(parsed.json).toBe(true)
	})

	it('missing framework throws FRAMEWORK_REQUIRED listing valid values', () => {
		expect(() => extractInitArgs({}, [])).toThrowError(InitArgsError)

		try {
			extractInitArgs({}, [])
		} catch (error) {
			const err = error as InitArgsError

			expect(err.code).toBe('FRAMEWORK_REQUIRED')
			expect(err.message).toContain('node')
			expect(err.message).toContain('next')
		}
	})

	it.each(['react-native', 'vue', 'nuxt', 42])('invalid framework %p throws FRAMEWORK_INVALID', (framework) => {
		expect(() => extractInitArgs({ framework }, [])).toThrowError(InitArgsError)

		try {
			extractInitArgs({ framework }, [])
		} catch (error) {
			expect((error as InitArgsError).code).toBe('FRAMEWORK_INVALID')
		}
	})

	it('accepts every declared framework id', () => {
		for (const framework of FRAMEWORK_IDS) {
			expect(extractInitArgs({ framework }, []).framework).toBe(framework)
		}
	})
})

describe('parseNoFlags (argv scan for hidden --no-X toggles)', () => {
	it('empty argv leaves every feature on', () => {
		expect(parseNoFlags([])).toEqual({
			linter: true,
			commitlint: true,
			install: true
		})
	})

	it('each --no-X flips one feature off without touching the others', () => {
		expect(parseNoFlags(['--no-linter'])).toEqual({
			linter: false,
			commitlint: true,
			install: true
		})
		expect(parseNoFlags(['--no-commitlint'])).toEqual({
			linter: true,
			commitlint: false,
			install: true
		})
		expect(parseNoFlags(['--no-install'])).toEqual({
			linter: true,
			commitlint: true,
			install: false
		})
	})

	it('all three negations in one argv', () => {
		expect(parseNoFlags(['--no-linter', '--no-commitlint', '--no-install'])).toEqual({
			linter: false,
			commitlint: false,
			install: false
		})
	})

	it('stops scanning at the `--` separator', () => {
		expect(parseNoFlags(['--no-linter', '--', '--no-install'])).toEqual({
			linter: false,
			commitlint: true,
			install: true
		})
	})

	it('unsupported flags are ignored (no error)', () => {
		expect(parseNoFlags(['--framework', 'node', '--unknown', '--no-linter'])).toEqual({
			linter: false,
			commitlint: true,
			install: true
		})
	})

	it('extractInitArgs wires the scan: --no-linter flips features.linter off', () => {
		const parsed = extractInitArgs({ framework: 'node' }, ['--no-linter'])

		expect(parsed.features.linter).toBe(false)
		expect(parsed.features.commitlint).toBe(true)
		expect(parsed.features.install).toBe(true)
	})
})

// Probe command mirrors the real init args schema (without the hidden
// --no-* toggles — citty never sees them). runCommand feeds raw CLI argv
// through citty's parser so the captured object is exactly what the
// production run() receives from citty.
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
		}
	},
	run: ({ args }) => {
		Object.assign(captured, args)
	}
})

describe('citty parse probe (declared mode flags only)', () => {
	beforeEach(() => {
		for (const key of Object.keys(captured)) {
			delete captured[key]
		}
	})

	it('framework + mode flags parse cleanly; citty does not see the hidden flag', async () => {
		await runCommand(probeCommand, {
			rawArgs: ['--framework', 'react', '--dry-run', '--json']
		})

		expect(captured.framework).toBe('react')
		expect(captured['dry-run']).toBe(true)
		expect(captured.json).toBe(true)
		expect(captured.yes).toBe(false)
	})

	it('kebab-case flag --dry-run lands under the dry-run key', async () => {
		await runCommand(probeCommand, { rawArgs: ['--framework', 'next', '--dry-run'] })

		expect(captured['dry-run']).toBe(true)
	})
})
