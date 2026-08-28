import { PackageMetadata } from '@/core/registry-client/types'

const REGISTRY = 'https://registry.npmjs.org'
const TIMEOUT_MS = 10_000
const MAX_RETRIES = 1

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const fetchPackageMetadata = async (pkg: string, signal?: AbortSignal): Promise<PackageMetadata> => {
	const url = `${REGISTRY}/${encodeURIComponent(pkg)}`
	let lastError: unknown

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const controller = new AbortController()
			const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
			const externalSignal = signal

			if (externalSignal) {
				externalSignal.addEventListener('abort', () => controller.abort(), {
					once: true
				})
			}

			try {
				const res = await fetch(url, { signal: controller.signal })

				if (!res.ok) {
					throw new Error(`Registry returned ${res.status}`)
				}

				const parsed = (await res.json()) as Record<string, unknown>

				// The npm registry sends `versions` as an object keyed by
				// version — normalize to a string array so consumers see the
				// PackageMetadata shape (a raw cast here used to leak the wire
				// shape and crash version filters/includes downstream).
				const rawVersions: unknown = parsed.versions

				const versions = Array.isArray(rawVersions)
					? (rawVersions as string[])
					: Object.keys((rawVersions ?? {}) as Record<string, unknown>)

				return {
					...parsed,
					versions
				} as PackageMetadata
			} finally {
				clearTimeout(timer)
			}
		} catch (err) {
			lastError = err

			if (attempt < MAX_RETRIES) {
				await sleep(500)
			}
		}
	}

	// Error message (not String(err)) keeps "fetch failed" / "Registry returned
	// 404" readable without the "TypeError: " prefix noise.
	throw new Error(
		`Failed to fetch ${pkg} from registry: ${lastError instanceof Error ? lastError.message : String(lastError)}`
	)
}
