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
})
