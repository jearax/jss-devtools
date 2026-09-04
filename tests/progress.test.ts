// Unit tests for the progress helper. The actual ora instance is wrapped
// behind a SpinnerHandle; we exercise the TTY/silent gating and the
// no-op fallbacks rather than asserting on rendered ANSI which is
// environment-fragile.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isInteractive, startSpinner, withSpinner } from '@/utils/progress'

const originalIsTTY = process.stdout.isTTY
const originalCI = process.env['CI']

describe('isInteractive', () => {
	let savedIsTTY: boolean | undefined
	let savedCI: string | undefined

	beforeEach(() => {
		savedIsTTY = process.stdout.isTTY
		savedCI = process.env['CI']
	})

	afterEach(() => {
		Object.defineProperty(process.stdout, 'isTTY', {
			value: savedIsTTY,
			configurable: true
		})

		if (savedCI === undefined) {
			delete process.env['CI']
		} else {
			process.env['CI'] = savedCI
		}
	})

	it('returns true on TTY without CI env', () => {
		Object.defineProperty(process.stdout, 'isTTY', {
			value: true,
			configurable: true
		})
		delete process.env['CI']

		expect(isInteractive()).toBe(true)
	})

	it('returns false without TTY', () => {
		Object.defineProperty(process.stdout, 'isTTY', {
			value: false,
			configurable: true
		})
		delete process.env['CI']

		expect(isInteractive()).toBe(false)
	})

	it('returns false in CI even with TTY', () => {
		Object.defineProperty(process.stdout, 'isTTY', {
			value: true,
			configurable: true
		})
		process.env['CI'] = 'true'

		expect(isInteractive()).toBe(false)
	})
})

describe('startSpinner', () => {
	it('silent mode produces no stdout output', async () => {
		const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

		const sp = await startSpinner('should be silent', { silent: true })

		sp.update('mid')
		sp.done('finished')
		sp.fail('failed')

		expect(writeSpy).not.toHaveBeenCalled()
		writeSpy.mockRestore()
	})

	it('updates label via handle in silent mode without throwing', async () => {
		const sp = await startSpinner('init', { silent: true })

		expect(() => {
			sp.update('hello')
			sp.done('done')
		}).not.toThrow()
	})
})

describe('withSpinner', () => {
	it('runs the fn and returns its value', async () => {
		const result = await withSpinner(
			'task',
			async () => {
				return 42
			},
			{ silent: true }
		)

		expect(result).toBe(42)
	})

	it('re-throws errors from fn after failing the spinner', async () => {
		await expect(
			withSpinner(
				'task',
				async () => {
					throw new Error('boom')
				},
				{ silent: true }
			)
		).rejects.toThrow('boom')
	})

	it('passes a SpinnerHandle into the fn so per-step updates are possible', async () => {
		const received: { hasUpdate: boolean; hasDone: boolean; hasFail: boolean } = {
			hasUpdate: false,
			hasDone: false,
			hasFail: false
		}

		await withSpinner(
			'task',
			async (handle) => {
				received.hasUpdate = typeof handle.update === 'function'
				received.hasDone = typeof handle.done === 'function'
				received.hasFail = typeof handle.fail === 'function'

				return 'ok'
			},
			{ silent: true }
		)

		expect(received).toEqual({
			hasUpdate: true,
			hasDone: true,
			hasFail: true
		})
	})
})
