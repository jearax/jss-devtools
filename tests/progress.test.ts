import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { startSpinner } from '@/utils/progress'
import { isInteractive } from '@/utils/prompts'

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

	const setTTY = (value: boolean): void => {
		Object.defineProperty(process.stdout, 'isTTY', {
			value,
			configurable: true
		})
	}

	it('is true on a TTY outside CI', () => {
		setTTY(true)
		delete process.env['CI']

		expect(isInteractive()).toBe(true)
	})

	it('is false without a TTY', () => {
		setTTY(false)
		delete process.env['CI']

		expect(isInteractive()).toBe(false)
	})

	it('is false in CI even with a TTY', () => {
		setTTY(true)
		process.env['CI'] = 'true'

		expect(isInteractive()).toBe(false)
	})
})

describe('startSpinner', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('writes nothing in silent mode', () => {
		const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
		const sp = startSpinner('Resolving', { silent: true })

		sp.update('Resolving 1/2')
		sp.done('Resolved')
		sp.fail('Failed')

		expect(out).not.toHaveBeenCalled()
		expect(err).not.toHaveBeenCalled()
	})

	it('falls back to plain stderr lines when not interactive, keeping stdout clean', () => {
		const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
		const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
		const sp = startSpinner('Resolving')

		sp.done('Resolved')

		expect(out).not.toHaveBeenCalled()
		expect(err.mock.calls.map((call) => String(call[0])).join('')).toContain('Resolved')
	})
})
