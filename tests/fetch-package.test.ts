// Unit tests for registry-client metadata normalization: the npm registry
// sends `versions` as an object keyed by version — the client must hand every
// consumer the documented PackageMetadata shape (versions as string array).
// Global fetch is stubbed — no network access.
import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchPackageMetadata } from '@/core/registry-client/fetch-package'

const wireDoc = {
	name: 'jss-devtools',
	'dist-tags': {
		latest: '1.0.0',
		next: '0.0.52'
	},
	versions: {
		'0.0.52': {
			name: 'jss-devtools',
			version: '0.0.52'
		},
		'1.0.0': {
			name: 'jss-devtools',
			version: '1.0.0'
		}
	},
	time: { '1.0.0': '2026-07-13T06:16:51.460Z' }
}

const stubFetchWith = (doc: unknown): void => {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({
			ok: true,
			json: async () => doc
		})
	)
}

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('fetchPackageMetadata versions normalization', () => {
	it('converts the registry object-keyed versions into a string array', async () => {
		stubFetchWith(wireDoc)

		const meta = await fetchPackageMetadata('jss-devtools')

		expect(Array.isArray(meta.versions)).toBe(true)
		expect(meta.versions).toEqual(expect.arrayContaining(['0.0.52', '1.0.0']))
		expect(meta.versions).toHaveLength(2)
	})

	it('preserves dist-tags and time untouched', async () => {
		stubFetchWith(wireDoc)

		const meta = await fetchPackageMetadata('jss-devtools')

		expect(meta['dist-tags'].latest).toBe('1.0.0')
		expect(meta.time?.['1.0.0']).toBe('2026-07-13T06:16:51.460Z')
	})

	it('keeps an already-array versions field as is', async () => {
		stubFetchWith({
			...wireDoc,
			versions: ['0.1.0', '1.0.0']
		})

		const meta = await fetchPackageMetadata('jss-devtools')

		expect(meta.versions).toEqual(['0.1.0', '1.0.0'])
	})

	it('degrades a missing versions field to an empty array', async () => {
		stubFetchWith({
			name: 'jss-devtools',
			'dist-tags': { latest: '1.0.0' }
		})

		const meta = await fetchPackageMetadata('jss-devtools')

		expect(meta.versions).toEqual([])
	})
})
