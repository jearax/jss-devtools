// Unit tests for logger stream contract: stdout carries data only, and a
// closed downstream pipe (EPIPE) must not crash a successful run.
import { afterEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/utils/logger'

describe('logger json channel', () => {
	afterEach(() => {
		process.exitCode = undefined
		vi.restoreAllMocks()
	})

	it('writes the JSON document raw to stdout (single parseable doc)', () => {
		const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

		logger.json({ result: 'success' })

		expect(write).toHaveBeenCalledTimes(1)

		const doc = JSON.parse(String(write.mock.calls[0][0]))

		expect(doc.result).toBe('success')
	})

	it('exits quietly on EPIPE from stdout (downstream pipe closed early)', () => {
		const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
		const listeners = process.stdout.listeners('error') as ((err: NodeJS.ErrnoException) => void)[]

		expect(listeners.length).toBeGreaterThan(0)

		// Invoke registered listeners directly — emitting 'error' on stdout
		// trips EventEmitter error semantics under the vitest worker.
		const epipe = Object.assign(new Error('write EPIPE'), { code: 'EPIPE' })

		expect(() => listeners.forEach((fn) => fn(epipe))).not.toThrow()
		expect(exitSpy).toHaveBeenCalledWith(0)
	})

	it('rethrows non-EPIPE stdout errors (real failures stay visible)', () => {
		const listeners = process.stdout.listeners('error') as ((err: NodeJS.ErrnoException) => void)[]

		expect(listeners.length).toBeGreaterThan(0)

		const real = new Error('real stdout failure')

		expect(() => listeners.forEach((fn) => fn(real))).toThrow('real stdout failure')
	})
})
