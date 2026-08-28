// Unit tests for uninstall failure guard, notes visibility, and PM install
// hint (uninstall-command-design phase-03). Detector, store, and exec are
// mocked — no global install or real package manager required.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import uninstallCommand from '@/commands/self/uninstall'
import { requireGlobalPM } from '@/commands/self/utils/flow'
import { detectGlobalPM, detectGlobalPMs } from '@/core/detector/global-pm'
import { execOrDryRunRemove } from '@/core/self-installer/exec'
import { getPmLedger } from '@/core/store/store'
import { logger } from '@/utils/logger'
import { PKG_INFO } from '@/utils/pkg'

vi.mock('@/core/detector/global-pm', () => ({
	detectGlobalPM: vi.fn(),
	detectGlobalPMs: vi.fn()
}))
vi.mock('@/core/store/store', () => ({
	getPmLedger: vi.fn()
}))
vi.mock('@/core/self-installer/exec', () => ({
	execOrDryRunRemove: vi.fn()
}))

const detected = {
	pm: 'pnpm' as const,
	version: '0.1.0'
}

const emptyLedger = {
	pmsSeen: [],
	lastPm: null,
	lastSeenAt: null
}

const execSuccess = {
	ok: true,
	dryRun: false,
	cmdStr: 'pnpm remove -g jss-devtools',
	pm: 'pnpm'
}

const runUninstall = async (args: Record<string, unknown>): Promise<void> => {
	await uninstallCommand.run?.({
		args,
		cmd: 'uninstall',
		rawArgs: []
	} as never)
}

const stdoutOf = (): string =>
	vi
		.mocked(process.stdout.write)
		.mock.calls.map((c) => String(c[0]))
		.join('')

const execaFailure = Object.assign(new Error('Command failed'), {
	exitCode: 1,
	shortMessage: 'Command failed with exit code 1: pnpm remove -g jss-devtools'
})

beforeEach(() => {
	vi.mocked(detectGlobalPM).mockResolvedValue(detected)
	vi.mocked(detectGlobalPMs).mockResolvedValue([detected])
	vi.mocked(getPmLedger).mockReturnValue(emptyLedger)
	vi.mocked(execOrDryRunRemove).mockResolvedValue(execSuccess as never)
})

afterEach(() => {
	process.exitCode = undefined
	vi.restoreAllMocks()
})

describe('uninstall exec-failure guard (R1)', () => {
	it.each([
		{
			name: 'execa non-zero exit',
			err: execaFailure,
			reason: 'pnpm remove -g jss-devtools'
		},
		{
			name: 'unresolvable PM command',
			err: new Error('No global_uninstall command for pnpm'),
			reason: 'No global_uninstall command'
		},
		{
			name: 'execa fail with captured stderr',
			err: Object.assign(new Error('Command failed'), {
				exitCode: 1,
				shortMessage: 'Command failed with exit code 1: pnpm remove -g jss-devtools',
				stderr: 'pnpm ERR!  Cannot remove package'
			}),
			reason: 'pnpm ERR!  Cannot remove package'
		}
	])('emits structured PM_EXEC_FAILED and exit 1 in json mode ($name)', async ({ err, reason }) => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(execOrDryRunRemove).mockRejectedValue(err)

		await runUninstall({
			yes: true,
			json: true
		})

		expect(process.exitCode).toBe(1)

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.result).toBe('error')
		expect(parsed.error.code).toBe('PM_EXEC_FAILED')
		expect(parsed.command).toBe('uninstall')
		// Rich form (SPEC_INVALID precedent): context fields present, not bare.
		expect(parsed.pm).toBe('pnpm')
		expect(parsed.current).toBe('0.1.0')
		expect(Array.isArray(parsed.notes)).toBe(true)
		expect(parsed.error.message).toContain(reason)
	})

	it('reports short human error with command context, no stack trace', async () => {
		const errSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)

		vi.mocked(execOrDryRunRemove).mockRejectedValue(execaFailure)

		await runUninstall({ yes: true })

		expect(process.exitCode).toBe(1)
		expect(errSpy).toHaveBeenCalledTimes(1)

		const msg = String(errSpy.mock.calls[0][0])

		expect(msg).toContain('pnpm remove -g jss-devtools')
		expect(msg).not.toContain('    at ')
	})

	it('captures child stdio for real-exec in json mode (machine-clean stdout)', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(execOrDryRunRemove).mockResolvedValue(execSuccess as never)

		await runUninstall({
			yes: true,
			json: true
		})

		expect(execOrDryRunRemove).toHaveBeenCalledWith('pnpm', PKG_INFO.name, false, { capture: true })
	})

	it('does not capture for dry-run even in json mode (no child runs)', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(execOrDryRunRemove).mockResolvedValue({
			...execSuccess,
			dryRun: true
		} as never)

		await runUninstall({
			yes: true,
			json: true,
			'dry-run': true
		})

		expect(execOrDryRunRemove).toHaveBeenCalledWith('pnpm', PKG_INFO.name, true, { capture: false })
	})
})

describe('uninstall notes visibility (R2)', () => {
	beforeEach(() => {
		vi.mocked(getPmLedger).mockReturnValue({
			pmsSeen: ['npm'],
			lastPm: 'npm',
			lastSeenAt: null
		})
	})

	it('prints ledger notes in human mode even with --yes', async () => {
		const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)

		await runUninstall({ yes: true })

		expect(warnSpy).toHaveBeenCalledTimes(1)
		expect(String(warnSpy.mock.calls[0][0])).toContain('Previously installed via npm')
		expect(process.exitCode).toBeUndefined()
	})

	it('keeps stdout machine-clean in json mode (notes only in payload)', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)

		await runUninstall({
			yes: true,
			json: true
		})

		expect(warnSpy).not.toHaveBeenCalled()

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.result).toBe('success')
		expect(parsed.notes.join('\n')).toContain('Previously installed via npm')
	})
})

describe('requireGlobalPM install-hint (R4)', () => {
	beforeEach(() => {
		vi.mocked(detectGlobalPM).mockResolvedValue(null)
	})

	it('prefers ledger lastPm even when it differs from pmsSeen order', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(getPmLedger).mockReturnValue({
			pmsSeen: ['pnpm', 'npm'],
			lastPm: 'pnpm',
			lastSeenAt: null
		})

		const result = await requireGlobalPM({ json: true })

		expect(result).toBeNull()
		expect(process.exitCode).toBe(1)

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.result).toBe('error')
		expect(parsed.error.code).toBe('PM_NOT_DETECTED')
		expect(parsed.error.hint).toContain('pnpm')
		expect(parsed.error.hint).toContain('jss-devtools')
	})

	it('falls back to npm when ledger has no lastPm', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

		await requireGlobalPM({ json: true })

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.error.hint).toContain('npm')
		expect(parsed.error.hint).not.toContain('pnpm')
	})

	it('degrades corrupted ledger lastPm to npm instead of throwing', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(getPmLedger).mockReturnValue({
			pmsSeen: [],
			lastPm: 'bogus-agent' as never,
			lastSeenAt: null
		})

		const result = await requireGlobalPM({ json: true })

		expect(result).toBeNull()
		expect(process.exitCode).toBe(1)

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.error.code).toBe('PM_NOT_DETECTED')
		expect(parsed.error.hint).toContain('npm')
		expect(parsed.error.hint).not.toContain('bogus')
	})

	it('prints hint as separate line in human mode', async () => {
		const errSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)

		vi.mocked(getPmLedger).mockReturnValue({
			pmsSeen: ['pnpm', 'npm'],
			lastPm: 'pnpm',
			lastSeenAt: null
		})

		const result = await requireGlobalPM({})

		expect(result).toBeNull()
		expect(errSpy).toHaveBeenCalledTimes(1)

		const msg = String(errSpy.mock.calls[0][0])

		expect(msg).toContain('not installed')
		expect(msg).toContain('Install with: pnpm')
	})
})

describe('json mode stdout purity (core exec logging routes to stderr)', () => {
	it('dry-run exec writes no log lines to stdout and cmdStr stays runnable', async () => {
		const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

		vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

		const { execOrDryRunRemove: realExec } = await vi.importActual<{
			execOrDryRunRemove: typeof execOrDryRunRemove
		}>('@/core/self-installer/exec')

		const result = await realExec('yarn', 'jss-devtools', true)

		expect(result.dryRun).toBe(true)
		expect(result.cmdStr).toBe('yarn global remove jss-devtools')
		expect(stdoutSpy).not.toHaveBeenCalled()
	})
})
