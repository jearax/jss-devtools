// Deterministic unit tests for confirmOrCancel guard semantics — smoke tests
// can't exercise these paths when the CLI is not globally installed
// (detection fails first with PM_NOT_DETECTED).
import { afterEach, describe, expect, it, vi } from 'vitest'

import { confirmOrCancel } from '@/utils/prompts'

describe('confirmOrCancel (non-TTY — vitest pipes have no isTTY)', () => {
	afterEach(() => {
		process.exitCode = undefined
		vi.restoreAllMocks()
	})

	it('destructive without --yes refuses: returns false, exit code 1, JSON error', async () => {
		const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

		const confirmed = await confirmOrCancel(
			{
				json: true,
				destructive: true
			},
			'Uninstall jss-devtools?',
			{
				result: 'cancelled',
				message: 'Cancelled by user'
			}
		)

		expect(confirmed).toBe(false)
		expect(process.exitCode).toBe(1)

		const json = write.mock.calls.map((c) => String(c[0])).join('')

		expect(json).toContain('REQUIRES_CONFIRMATION')
		expect(json).toContain('"result": "error"')
	})

	it('destructive with --yes proceeds without prompting', async () => {
		const confirmed = await confirmOrCancel(
			{
				yes: true,
				destructive: true
			},
			'Uninstall jss-devtools?',
			{}
		)

		expect(confirmed).toBe(true)
		expect(process.exitCode).toBeUndefined()
	})

	it('non-destructive without --yes auto-proceeds in non-TTY (CI-friendly)', async () => {
		const confirmed = await confirmOrCancel({ json: true }, 'Upgrade jss-devtools?', {})

		expect(confirmed).toBe(true)
		expect(process.exitCode).toBeUndefined()
	})
})
