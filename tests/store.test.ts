// Unit tests for the conf-backed store — isolated via JSS_DEVTOOLS_STORE_DIR
// (never touches the real user config). Degradation cases exercise the REAL
// failure layer (fs permission / corrupted JSON on get/set), not mocks —
// conf v15 performs no I/O in its constructor.
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, describe, expect, it, vi } from 'vitest'

const dirs: string[] = []

const newDir = (): string => {
	const dir = mkdtempSync(join(tmpdir(), 'jss-store-test-'))

	dirs.push(dir)

	return dir
}

const loadStore = async (dir: string) => {
	process.env.JSS_DEVTOOLS_STORE_DIR = dir
	vi.resetModules()

	return import('@/core/store/store')
}

afterAll(() => {
	for (const dir of dirs) {
		rmSync(dir, {
			recursive: true,
			force: true
		})
	}

	delete process.env.JSS_DEVTOOLS_STORE_DIR
})

describe('store (conf, isolated dir)', () => {
	it('ledger round-trips and dedupes pmsSeen', async () => {
		const store = await loadStore(newDir())

		expect(store.getPmLedger().pmsSeen).toEqual([])

		store.recordPmSeen('pnpm')
		store.recordPmSeen('pnpm')
		store.recordPmSeen('npm')

		const ledger = store.getPmLedger()

		expect(ledger.pmsSeen).toEqual(['pnpm', 'npm'])
		expect(ledger.lastPm).toBe('npm')
		expect(ledger.lastSeenAt).toBeTruthy()
	})

	it('pm override set/get/delete', async () => {
		const store = await loadStore(newDir())

		store.setPmOverride('pnpm')
		expect(store.getPmOverride()).toBe('pnpm')

		store.setPmOverride(null)
		expect(store.getPmOverride()).toBeNull()
	})
})

describe('store graceful degradation (real fs failures)', () => {
	it('permission-denied config file → stateless defaults, no throw', async () => {
		const dir = newDir()
		const store = await loadStore(dir)

		store.recordPmSeen('pnpm')

		const path = store.storePath()

		expect(path).toBeTruthy()
		chmodSync(path as string, 0o000)

		const denied = await loadStore(dir)

		// Read fails EACCES → empty-ledger fallback
		expect(denied.getPmLedger().pmsSeen).toEqual([])

		// Write fails EACCES → silent no-op
		expect(() => denied.recordPmSeen('npm')).not.toThrow()
		expect(() => denied.setPmOverride('pnpm')).not.toThrow()

		// Restore so afterAll cleanup can remove the temp dir
		chmodSync(path as string, 0o600)
	})

	it('corrupted config.json self-heals to empty (clearInvalidConfig)', async () => {
		const dir = newDir()
		const store = await loadStore(dir)

		store.recordPmSeen('pnpm')
		writeFileSync(store.storePath() as string, '{ not valid json')

		const healed = await loadStore(dir)

		expect(healed.getPmLedger().pmsSeen).toEqual([])
		expect(healed.getPmOverride()).toBeNull()
	})
})
