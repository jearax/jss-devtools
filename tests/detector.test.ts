// Unit tests for parallel global-PM detection (execa mocked — no real probes).
// Each test dynamic-imports the module after resetModules so the per-process
// match cache never leaks between cases.
import { execa } from 'execa'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('execa')
vi.mock('@/core/store', () => ({
	recordPmSeen: vi.fn(),
	getPmLedger: vi.fn(() => ({
		pmsSeen: [],
		lastPm: null,
		lastSeenAt: null
	}))
}))

const mockedExeca = vi.mocked(execa)

const loadDetector = async () => {
	vi.resetModules()

	return import('@/core/detector/global-pm')
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('detectGlobalPMs (parallel probe)', () => {
	it('collects all matches ranked by probe priority', async () => {
		mockedExeca.mockImplementation((async (cmd: string) => {
			if (cmd === 'pnpm') {
				return {
					stdout: JSON.stringify([
						{
							name: 'jss-devtools',
							version: '0.1.0'
						}
					]),
					exitCode: 0
				}
			}

			if (cmd === 'npm') {
				return {
					stdout: JSON.stringify({ dependencies: { 'jss-devtools@0.1.0': {} } }),
					exitCode: 0
				}
			}

			return {
				stdout: '',
				exitCode: 1
			}
		}) as never)

		const { detectGlobalPMs } = await loadDetector()
		const matches = await detectGlobalPMs('jss-devtools')

		expect(matches).toHaveLength(2)
		expect(matches[0]).toEqual({
			pm: 'pnpm',
			version: '0.1.0'
		})
		expect(matches[1]).toEqual({
			pm: 'npm',
			version: '0.1.0'
		})
	})

	it('returns empty array when no PM has the package', async () => {
		mockedExeca.mockResolvedValue({
			stdout: '',
			exitCode: 1
		} as never)

		const { detectGlobalPMs } = await loadDetector()
		const matches = await detectGlobalPMs('jss-devtools')

		expect(matches).toEqual([])
	})

	it('detectGlobalPM wrapper returns the winner only', async () => {
		mockedExeca.mockImplementation((async (cmd: string) => {
			if (cmd === 'bun') {
				return {
					stdout: 'jss-devtools@0.2.0\n',
					exitCode: 0
				}
			}

			return {
				stdout: '',
				exitCode: 1
			}
		}) as never)

		const { detectGlobalPM } = await loadDetector()
		const winner = await detectGlobalPM('jss-devtools')

		expect(winner).toEqual({
			pm: 'bun',
			version: '0.2.0'
		})
	})

	it('parses npm 11+ plain-name dependency keys with nested version', async () => {
		mockedExeca.mockImplementation((async (cmd: string) => {
			if (cmd === 'npm') {
				return {
					stdout: JSON.stringify({
						name: 'lib',
						dependencies: {
							'jss-devtools': {
								version: '0.1.0',
								overridden: false
							}
						}
					}),
					exitCode: 0
				}
			}

			return {
				stdout: '',
				exitCode: 1
			}
		}) as never)

		const { detectGlobalPM } = await loadDetector()
		const winner = await detectGlobalPM('jss-devtools')

		expect(winner).toEqual({
			pm: 'npm',
			version: '0.1.0'
		})
	})

	it('parses yarn classic NDJSON global list output', async () => {
		mockedExeca.mockImplementation((async (cmd: string) => {
			if (cmd === 'yarn') {
				return {
					stdout: [
						JSON.stringify({
							type: 'warning',
							data: 'package.json: License should be a valid SPDX license expression'
						}),
						JSON.stringify({
							type: 'progressStart',
							data: {
								id: 0,
								total: 5
							}
						}),
						JSON.stringify({
							type: 'info',
							data: '"create-vite@9.1.1" has binaries:'
						}),
						JSON.stringify({
							type: 'info',
							data: '"jss-devtools@0.1.0" has binaries:'
						})
					].join('\n'),
					exitCode: 0
				}
			}

			return {
				stdout: '',
				exitCode: 1
			}
		}) as never)

		const { detectGlobalPM } = await loadDetector()
		const winner = await detectGlobalPM('jss-devtools')

		expect(winner).toEqual({
			pm: 'yarn',
			version: '0.1.0'
		})
	})

	it('probes carry a timeout so a wedged PM cannot wedge the CLI', async () => {
		mockedExeca.mockResolvedValue({
			stdout: '',
			exitCode: 1
		} as never)

		const { detectGlobalPMs } = await loadDetector()

		await detectGlobalPMs('jss-devtools')

		expect(mockedExeca).toHaveBeenCalledWith(
			'pnpm',
			expect.anything(),
			expect.objectContaining({ timeout: expect.any(Number) })
		)
	})
})
