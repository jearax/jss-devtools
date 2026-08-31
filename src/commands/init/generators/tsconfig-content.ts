import { FrameworkPreset } from '@/commands/init/presets/types'

export type TsconfigMergeOutcome =
	{ kind: 'write'; content: string } | { kind: 'skip'; reason: 'paths-exists' | 'solution-style' | 'unparseable' }

export const TSCONFIG_PATH = 'tsconfig.json'

export const buildFreshTsconfig = (preset: FrameworkPreset): string =>
	`${JSON.stringify(
		{
			compilerOptions: preset.tsconfigCompilerOptions,
			include: preset.tsconfigInclude,
			exclude: ['node_modules', 'dist']
		},
		null,
		'\t'
	)}\n`

// Merge-min policy: add the alias only when the file parses as plain JSON and
// has no path mapping yet. JSONC (comments/trailing commas) and solution-style
// tsconfigs (references / empty files) are left untouched — rewriting them
// would silently drop user structure. paths works standalone since TS 4.1, so
// no baseUrl is added.
export const mergeTsconfigAlias = (existingRaw: string): TsconfigMergeOutcome => {
	let parsed: Record<string, unknown>

	try {
		parsed = JSON.parse(existingRaw) as Record<string, unknown>
	} catch {
		return {
			kind: 'skip',
			reason: 'unparseable'
		}
	}

	const references = parsed.references

	if (
		(Array.isArray(references) && references.length > 0) ||
		(Array.isArray(parsed.files) && parsed.files.length === 0)
	) {
		return {
			kind: 'skip',
			reason: 'solution-style'
		}
	}

	const compilerOptions =
		typeof parsed.compilerOptions === 'object' && parsed.compilerOptions !== null
			? (parsed.compilerOptions as Record<string, unknown>)
			: {}

	if (compilerOptions.paths !== undefined) {
		return {
			kind: 'skip',
			reason: 'paths-exists'
		}
	}

	const merged: Record<string, unknown> = {
		...parsed,
		compilerOptions: {
			...compilerOptions,
			paths: {
				'@/*': ['./src/*']
			}
		}
	}

	return {
		kind: 'write',
		content: `${JSON.stringify(merged, null, '\t')}\n`
	}
}
