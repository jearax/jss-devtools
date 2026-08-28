// Unit tests for upgrade/update hardening: registry fetch guard, exec guard,
// stdio capture, prompt accuracy, major-bump gate, and the manual `check`
// dispatch in update. Detector, store, exec, and registry client are mocked —
// no global install, PM, or network required.
import { resolveCommand } from 'package-manager-detector'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import updateCommand from '@/commands/self/update'
import updateCheckCommand from '@/commands/self/update-check'
import upgradeCommand from '@/commands/self/upgrade'
import { detectGlobalPM, detectGlobalPMs } from '@/core/detector/global-pm'
import { PM_DISPLAY_NAMES } from '@/core/detector/pm'
import { fetchPackageMetadata } from '@/core/registry-client/fetch-package'
import { execOrDryRunInstall } from '@/core/self-installer/exec'
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
	execOrDryRunInstall: vi.fn()
}))
vi.mock('@/core/registry-client/fetch-package', () => ({
	fetchPackageMetadata: vi.fn()
}))
vi.mock('@/commands/self/update-check', () => ({
	default: { run: vi.fn() }
}))
vi.mock('@clack/prompts', () => ({
	confirm: vi.fn()
}))

const detectedNpm = {
	pm: 'npm' as const,
	version: '0.1.0'
}

const metaMajor = {
	versions: ['0.1.0', '2.0.0'],
	'dist-tags': { latest: '2.0.0' }
}

const metaMinor = {
	versions: ['0.1.0', '0.2.0'],
	'dist-tags': { latest: '0.2.0' }
}

const execSuccess = {
	ok: true,
	dryRun: false,
	cmdStr: 'npm i -g jss-devtools@2.0.0',
	pm: 'npm'
}

const emptyLedger = {
	pmsSeen: [],
	lastPm: null,
	lastSeenAt: null
}

const runUpgrade = async (args: Record<string, unknown>): Promise<void> => {
	await upgradeCommand.run?.({
		args,
		cmd: 'upgrade',
		rawArgs: []
	} as never)
}

const runUpdate = async (args: Record<string, unknown>): Promise<void> => {
	await updateCommand.run?.({
		args,
		cmd: 'update',
		rawArgs: []
	} as never)
}

const stdoutOf = (): string =>
	vi
		.mocked(process.stdout.write)
		.mock.calls.map((c) => String(c[0]))
		.join('')

// vi.spyOn getter fails when the property is absent (piped stdout in vitest) —
// define it instead; afterEach deletes it (no-op when never defined).
const asTTY = (): void => {
	Object.defineProperty(process.stdout, 'isTTY', {
		value: true,
		configurable: true
	})
}

beforeEach(() => {
	vi.mocked(detectGlobalPM).mockResolvedValue(detectedNpm)
	vi.mocked(detectGlobalPMs).mockResolvedValue([detectedNpm])
	vi.mocked(getPmLedger).mockReturnValue(emptyLedger)
	vi.mocked(execOrDryRunInstall).mockResolvedValue(execSuccess as never)
	vi.mocked(fetchPackageMetadata).mockResolvedValue(metaMajor as never)
	vi.mocked(updateCheckCommand.run as NonNullable<typeof updateCheckCommand.run>).mockResolvedValue(undefined)
})

afterEach(() => {
	delete (process.stdout as { isTTY?: boolean }).isTTY
	process.exitCode = undefined
	vi.restoreAllMocks()
})

describe('registry fetch guard (REGISTRY_FETCH_FAILED)', () => {
	it('emits structured rich-form error and exit 1 in json mode', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(fetchPackageMetadata).mockRejectedValue(
			new Error('Failed to fetch jss-devtools from registry: fetch failed')
		)

		await runUpgrade({
			json: true,
			specVer: '2.0.0'
		})

		expect(process.exitCode).toBe(1)

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.result).toBe('error')
		expect(parsed.error.code).toBe('REGISTRY_FETCH_FAILED')
		expect(parsed.error.message).toContain('fetch failed')
		expect(parsed.command).toBe('upgrade')
		expect(parsed.pm).toBe('npm')
		expect(parsed.current).toBe('0.1.0')
		expect(parsed.spec).toBe('2.0.0')
		expect(parsed.dryRun).toBe(false)
	})

	it('reflects the requested dry-run mode in the fetch error payload', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(fetchPackageMetadata).mockRejectedValue(
			new Error('Failed to fetch jss-devtools from registry: fetch failed')
		)

		await runUpgrade({
			json: true,
			'dry-run': true
		})

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.error.code).toBe('REGISTRY_FETCH_FAILED')
		expect(parsed.dryRun).toBe(true)
	})

	it('reports short human error, no stack trace', async () => {
		const errSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)

		vi.mocked(fetchPackageMetadata).mockRejectedValue(
			new Error('Failed to fetch jss-devtools from registry: Registry returned 404')
		)

		await runUpgrade({})

		expect(process.exitCode).toBe(1)
		expect(errSpy).toHaveBeenCalledTimes(1)

		const msg = String(errSpy.mock.calls[0][0])

		expect(msg).toContain('Registry returned 404')
		expect(msg).not.toContain('    at ')
	})
})

describe('exec-failure guard (PM_EXEC_FAILED)', () => {
	it.each([
		{
			name: 'execa non-zero with captured stderr',
			err: Object.assign(new Error('Command failed'), {
				exitCode: 1,
				shortMessage: 'Command failed with exit code 1: npm i -g jss-devtools@2.0.0',
				stderr: 'npm ERR! code ETARGET'
			}),
			reason: 'npm ERR! code ETARGET'
		},
		{
			name: 'unresolvable PM command',
			err: new Error('No global command for npm'),
			reason: 'No global command'
		}
	])('emits structured rich-form error and exit 1 in json mode ($name)', async ({ err, reason }) => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(execOrDryRunInstall).mockRejectedValue(err)

		await runUpgrade({
			yes: true,
			json: true
		})

		expect(process.exitCode).toBe(1)

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.result).toBe('error')
		expect(parsed.error.code).toBe('PM_EXEC_FAILED')
		expect(parsed.error.message).toContain(reason)
		expect(parsed.command).toBe('upgrade')
		expect(parsed.pm).toBe('npm')
		expect(parsed.current).toBe('0.1.0')
		expect(parsed.target).toBe('2.0.0')
		expect(parsed.majorBump).toBe(true)
	})

	it('reports short human error, no stack trace', async () => {
		const errSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)

		vi.mocked(execOrDryRunInstall).mockRejectedValue(
			Object.assign(new Error('Command failed'), {
				exitCode: 1,
				shortMessage: 'Command failed with exit code 1: npm i -g jss-devtools@2.0.0'
			})
		)

		await runUpgrade({ yes: true })

		expect(process.exitCode).toBe(1)
		expect(errSpy).toHaveBeenCalledTimes(1)

		const msg = String(errSpy.mock.calls[0][0])

		expect(msg).toContain('npm i -g jss-devtools@2.0.0')
		expect(msg).not.toContain('    at ')
	})
})

describe('stdio capture routing', () => {
	it('captures child stdio for real-exec in json mode (machine-clean stdout)', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

		await runUpgrade({
			yes: true,
			json: true
		})

		expect(execOrDryRunInstall).toHaveBeenCalledWith('npm', PKG_INFO.name, '2.0.0', false, {
			capture: true
		})
	})

	it('does not capture for dry-run even in json mode (no child runs)', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(execOrDryRunInstall).mockResolvedValue({
			...execSuccess,
			dryRun: true
		} as never)

		await runUpgrade({
			yes: true,
			json: true,
			'dry-run': true
		})

		expect(execOrDryRunInstall).toHaveBeenCalledWith('npm', PKG_INFO.name, '2.0.0', true, {
			capture: false
		})
	})
})

describe('prompt accuracy (display name + real command)', () => {
	it.each(['npm', 'yarn'] as const)('prompt shows display name and resolveCommand string for %s', async (pm) => {
		asTTY()
		vi.mocked(detectGlobalPM).mockResolvedValue({
			pm,
			version: '0.1.0'
		})
		const { confirm } = await import('@clack/prompts')
		const confirmMock = vi.mocked(confirm).mockResolvedValue(true)

		vi.spyOn(logger, 'warn').mockImplementation(() => undefined)

		await runUpgrade({})

		// @clack confirm receives an options object — the prompt text is .message
		const call = confirmMock.mock.calls[0]?.[0] as { message?: string } | undefined
		const prompt = String(call?.message ?? '')
		const resolved = resolveCommand(pm, 'global', [`${PKG_INFO.name}@2.0.0`])

		expect(resolved).not.toBeNull()
		expect(prompt).toContain(PM_DISPLAY_NAMES[pm])
		expect(prompt).toContain(`${resolved?.command} ${resolved?.args.join(' ')}`)
		// Major-bump warning lives standalone (G5), never inside the prompt.
		expect(prompt).not.toContain('⚠️')
	})
})

describe('major-bump warning visibility', () => {
	it('prints standalone warning in human mode even with --yes', async () => {
		const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)

		await runUpgrade({ yes: true })

		expect(warnSpy).toHaveBeenCalledTimes(1)
		expect(String(warnSpy.mock.calls[0][0])).toContain('Major version bump')
	})

	it('keeps stdout machine-clean in json mode (majorBump field only)', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)

		await runUpgrade({
			yes: true,
			json: true
		})

		expect(warnSpy).not.toHaveBeenCalled()

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.result).toBe('success')
		expect(parsed.majorBump).toBe(true)
	})
})

describe('major-bump confirmation gate', () => {
	it('refuses non-TTY major upgrade without --yes (payload dryRun false)', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

		await runUpgrade({ json: true })

		expect(process.exitCode).toBe(1)
		expect(execOrDryRunInstall).not.toHaveBeenCalled()

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.result).toBe('error')
		expect(parsed.error.code).toBe('REQUIRES_CONFIRMATION')
		expect(parsed.dryRun).toBe(false)
	})

	it('auto-proceeds non-TTY minor upgrade without --yes (no regression)', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(fetchPackageMetadata).mockResolvedValue(metaMinor as never)

		await runUpgrade({ json: true })

		expect(process.exitCode).toBeUndefined()
		expect(execOrDryRunInstall).toHaveBeenCalledTimes(1)
	})

	it('passes every bump with --yes', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

		await runUpgrade({
			yes: true,
			json: true
		})

		expect(process.exitCode).toBeUndefined()
		expect(execOrDryRunInstall).toHaveBeenCalledTimes(1)
	})

	it('never gates --dry-run (preview stays free)', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		vi.mocked(execOrDryRunInstall).mockResolvedValue({
			...execSuccess,
			dryRun: true
		} as never)

		await runUpgrade({
			json: true,
			'dry-run': true
		})

		expect(process.exitCode).toBeUndefined()
		expect(execOrDryRunInstall).toHaveBeenCalledTimes(1)

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.result).toBe('dry-run')
	})
})

describe('update manual dispatch', () => {
	it('routes specVer "check" to the check handler without running the upgrade flow', async () => {
		await runUpdate({
			specVer: 'check',
			yes: true
		})

		expect(updateCheckCommand.run).toHaveBeenCalledWith({
			args: { json: false },
			rawArgs: []
		})
		expect(fetchPackageMetadata).not.toHaveBeenCalled()
		expect(execOrDryRunInstall).not.toHaveBeenCalled()
		expect(process.exitCode).toBeUndefined()
	})

	it('forwards json flag to the check handler', async () => {
		await runUpdate({
			specVer: 'check',
			json: true
		})

		expect(updateCheckCommand.run).toHaveBeenCalledWith({
			args: { json: true },
			rawArgs: []
		})
	})

	it('treats a version spec as the upgrade flow (full alias parity)', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

		await runUpdate({
			specVer: '2.0.0',
			yes: true,
			'dry-run': true,
			json: true
		})

		expect(updateCheckCommand.run).not.toHaveBeenCalled()

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.command).toBe('update')
		expect(parsed.result).toBe('dry-run')
	})

	it('reports SPEC_INVALID for an unresolvable spec instead of a raw usage dump', async () => {
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

		await runUpdate({
			specVer: 'bogus-tag',
			json: true
		})

		expect(process.exitCode).toBe(1)

		const parsed = JSON.parse(stdoutOf())

		expect(parsed.result).toBe('error')
		expect(parsed.error.code).toBe('SPEC_INVALID')
	})
})
