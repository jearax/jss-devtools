import semver from 'semver'

import { ResolvedSpecs } from '@/commands/init/plan/types'
import { FrameworkPreset } from '@/commands/init/presets/types'
import { InitFeatures } from '@/commands/init/types'
import { declaredDependency, isLibraryManifest } from '@/commands/init/utils/manifest'
import { fetchPackageMetadata } from '@/core/registry-client/fetch-package'
import { PackageMetadata } from '@/core/registry-client/types'

const PPJ_PKG = 'prettier-package-json'

// Shared house linter set — mirrors this repo's own devDependencies so
// generated projects lint with the same stack that generated them.
const LINTER_PACKAGES = [
	'eslint',
	'@eslint/js',
	'@typescript-eslint/parser',
	'@typescript-eslint/eslint-plugin',
	'eslint-config-prettier',
	'eslint-plugin-import-x',
	'eslint-plugin-autofix',
	'eslint-plugin-prefer-arrow-functions',
	'eslint-plugin-prettier',
	'prettier',
	'globals'
] as const

const COMMITLINT_PACKAGES = ['@commitlint/cli', '@commitlint/config-conventional'] as const

const ALWAYS_PACKAGES = ['husky', 'lint-staged', 'typescript'] as const

const stableVersionsDesc = (versions: string[]): string[] =>
	versions
		.filter((version) => semver.valid(version) !== null && semver.prerelease(version) === null)
		.sort((a, b) => semver.rcompare(a, b))

// Picked version is already a concrete semver when peer-aware; otherwise it
// falls back to 'latest'. 'latest' must NOT be wrapped in `^` — semver rejects
// `^latest`, and `pm add` would write an invalid range into the manifest.
const specFor = (name: string, version: string): string =>
	version === 'latest' ? `${name}@latest` : `${name}@^${version}`

// Two-way peer-aware pick: prefer the newest stable version whose peer ranges
// are mutually compatible — anchors chosen earlier AND any packages the picked
// version will pull in. Some scoped packages ship multiple active majors; the
// legacy 1.x stream satisfies modern peer ranges by accident, which would
// silently downgrade the dev stack.
//
// Anchor packages (typescript) are additionally constrained to a known-safe
// major range below — the eslint-ecosystem typescript plugin majors trail TS
// itself by one or two majors, and the latest TS would break install at
// `npm install` time (peer conflict), no matter how the picker orders the
// dependents.
const ANCHOR_MAX_MAJOR: Record<string, number> = {
	// @typescript-eslint/parser 8.x peers typescript <6.1.0; cap typescript at
	// the 5.x line until the eslint ecosystem catches up.
	typescript: 5
}

const pickVersion = (metadata: PackageMetadata, chosen: Record<string, string>): string => {
	const ordered = stableVersionsDesc(metadata.versions)
	const currentMajor = semver.major(ordered[0] ?? '0.0.0')

	for (const version of ordered) {
		if (semver.major(version) !== currentMajor) {
			continue
		}

		const peers = metadata.versionDocs?.[version]?.peerDependencies

		if (peers === undefined) {
			return version
		}

		const satisfied = Object.entries(peers).every(([peer, range]) => {
			const anchor = chosen[peer]

			return anchor === undefined || semver.satisfies(anchor, range, { includePrerelease: false })
		})

		if (satisfied) {
			return version
		}
	}

	return 'latest'
}

const pickAnchorVersion = (metadata: PackageMetadata, name: string): string => {
	const ordered = stableVersionsDesc(metadata.versions)
	const cap = ANCHOR_MAX_MAJOR[name]

	for (const version of ordered) {
		// Cap major to the ecosystem-safe ceiling before any peer check —
		// the anchor's own peer deps are satisfied trivially here (TS has none).
		if (cap !== undefined && semver.major(version) > cap) {
			continue
		}

		return version
	}

	return 'latest'
}

export const resolveSpecs = async (
	preset: FrameworkPreset,
	features: InitFeatures,
	manifest: Record<string, unknown>
): Promise<ResolvedSpecs> => {
	const names: string[] = [...ALWAYS_PACKAGES]

	if (features.linter) {
		names.push(...LINTER_PACKAGES, ...preset.extraEslintPlugins, ...preset.extraAtTypes)

		if (preset.needsTscAlias) {
			names.push('tsc-alias')
		}
	}

	if (features.commitlint) {
		names.push(...COMMITLINT_PACKAGES)
	}

	// User-declared packages are never re-added under any field.
	const wanted = names.filter((name) => declaredDependency(manifest, name) === undefined)

	const chosen: Record<string, string> = {}
	let offlineFallback = false

	const resolveOne = async (name: string): Promise<string> => {
		try {
			const metadata = await fetchPackageMetadata(name)
			const version = name in ANCHOR_MAX_MAJOR ? pickAnchorVersion(metadata, name) : pickVersion(metadata, chosen)

			if (version !== 'latest' && semver.valid(version) !== null) {
				chosen[name] = version
			}

			return specFor(name, version)
		} catch {
			offlineFallback = true

			return `${name}@latest`
		}
	}

	// eslint first: its major anchors every plugin's peer window.
	const ordered = [...wanted.filter((name) => name === 'eslint'), ...wanted.filter((name) => name !== 'eslint')]

	const dev: string[] = []

	for (const name of ordered) {
		dev.push(await resolveOne(name))
	}

	let ppjSpec = `${PPJ_PKG}@latest`

	if (features.linter) {
		try {
			const metadata = await fetchPackageMetadata(PPJ_PKG)
			const latest = metadata['dist-tags'] as Record<string, string> | undefined
			const version = latest?.latest ?? pickVersion(metadata, chosen)

			ppjSpec = version === 'latest' ? ppjSpec : `${PPJ_PKG}@^${version}`
		} catch {
			offlineFallback = true
		}
	}

	const runtimeNames = preset.runtimeDeps.filter((name) => declaredDependency(manifest, name) === undefined)
	const runtime: string[] = []

	for (const name of runtimeNames) {
		try {
			const metadata = await fetchPackageMetadata(name)
			const version = pickVersion(metadata, chosen)

			runtime.push(specFor(name, version))
		} catch {
			offlineFallback = true
			runtime.push(`${name}@latest`)
		}
	}

	const runtimePlacement: ResolvedSpecs['runtimePlacement'] =
		runtime.length === 0 ? 'none' : isLibraryManifest(manifest) ? 'peer+dev' : 'dependencies'

	return {
		dev,
		runtime,
		ppjSpec,
		runtimePlacement,
		offlineFallback
	}
}
