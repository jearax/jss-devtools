import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface ManifestReadResult {
	manifest: Record<string, unknown>
	raw: string
}

export const readManifest = (cwd: string): ManifestReadResult | 'missing' | 'invalid' => {
	let raw: string

	try {
		raw = readFileSync(join(cwd, 'package.json'), 'utf8')
	} catch {
		return 'missing'
	}

	try {
		return {
			manifest: JSON.parse(raw) as Record<string, unknown>,
			raw
		}
	} catch {
		return 'invalid'
	}
}

// JSON.stringify keeps insertion order, so unknown fields and their relative
// positions survive; the existing indent style (tabs from ppj --use-tabs, or
// spaces) is kept so a re-run does not churn the whole file.
export const serializeManifest = (manifest: Record<string, unknown>, original = ''): string =>
	`${JSON.stringify(manifest, null, /^\t/m.test(original) ? '\t' : 2)}\n`

export interface ScriptsPatchResult {
	manifest: Record<string, unknown>
	added: string[]
	skippedExisting: string[]
}

export const addScriptsWhenAbsent = (
	manifest: Record<string, unknown>,
	scripts: Record<string, string>
): ScriptsPatchResult => {
	const current =
		typeof manifest.scripts === 'object' && manifest.scripts !== null
			? (manifest.scripts as Record<string, unknown>)
			: {}

	const added: string[] = []
	const skippedExisting: string[] = []

	for (const [name, command] of Object.entries(scripts)) {
		if (current[name] !== undefined) {
			skippedExisting.push(name)
			continue
		}

		current[name] = command
		added.push(name)
	}

	return {
		manifest: {
			...manifest,
			scripts: current
		},
		added,
		skippedExisting
	}
}

export const setLintStagedWhenAbsent = (
	manifest: Record<string, unknown>,
	lintStaged: Record<string, string[]>
): { manifest: Record<string, unknown>; skipped: boolean } => {
	if (manifest['lint-staged'] !== undefined) {
		return {
			manifest,
			skipped: true
		}
	}

	return {
		manifest: {
			...manifest,
			'lint-staged': lintStaged
		},
		skipped: false
	}
}

const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const

/** Every dependency field is authoritative — a declared pkg is never re-added. */
export const declaredDependency = (manifest: Record<string, unknown>, pkgName: string): string | undefined => {
	for (const field of DEP_FIELDS) {
		const deps = manifest[field]

		if (typeof deps === 'object' && deps !== null) {
			const spec = (deps as Record<string, unknown>)[pkgName]

			if (typeof spec === 'string') {
				return spec
			}
		}
	}

	return undefined
}

export const isLibraryManifest = (manifest: Record<string, unknown>): boolean =>
	manifest.private !== true && (manifest.exports !== undefined || manifest.types !== undefined)
