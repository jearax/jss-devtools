import semver from 'semver'

import { ResolvedSpecs } from '@/commands/init/plan/types'
import { InitFeatures } from '@/commands/init/types'
import { declaredDependency } from '@/commands/init/utils/manifest'
import { fetchPackageMetadata } from '@/core/registry-client/fetch-package'
import { PackageMetadata } from '@/core/registry-client/types'
import { startSpinner } from '@/utils/progress'

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

// @types/node backs the generated tsconfig's `types: ['node']`.
const ALWAYS_PACKAGES = ['husky', 'lint-staged', 'typescript', '@types/node'] as const

const stableVersionsDesc = (versions: string[]): string[] =>
	versions
		.filter((version) => semver.valid(version) !== null && semver.prerelease(version) === null)
		.sort((a, b) => semver.rcompare(a, b))

// Picked version is already a concrete semver when peer-aware; otherwise it
// falls back to 'latest'. 'latest' must NOT be wrapped in `^` — semver rejects
// `^latest`, and `pm add` would write an invalid range into the manifest.
const specFor = (name: string, version: string): string =>
	version === 'latest' ? `${name}@latest` : `${name}@^${version}`

// Newest stable version whose peer ranges accept the anchors chosen earlier,
// within one major: some scoped packages ship multiple active majors, and the
// legacy 1.x stream satisfies modern peer ranges by accident, which would
// silently downgrade the dev stack.
//
// Anchor packages (typescript, eslint) are additionally constrained to a
// known-safe major range below — the eslint-ecosystem plugin majors trail the
// runtime itself by one or two majors, and the latest major would break
// install at `npm install` time (peer conflict), no matter how the picker
// orders the dependents.
const ANCHOR_MAX_MAJOR: Record<string, number> = {
	// @typescript-eslint/parser 8.x peers typescript <6.1.0; cap typescript at
	// the 5.x line until the eslint ecosystem catches up.
	typescript: 5,
	// Highest major the whole house plugin set peers; raise only after the
	// plugins declare support for the next one.
	eslint: 10
}

// Packages released in lockstep with an anchor must share its major. Peer
// checks alone miss this: @eslint/js 10.0.0 declares no peers, so it passes
// against eslint 9, and npm then rejects the manifest on a plain `npm install`.
const MAJOR_LOCKSTEP: Record<string, string> = {
	'@eslint/js': 'eslint'
}

const anchorMajor = (
	anchor: string,
	chosen: Record<string, string>,
	manifest: Record<string, unknown>
): number | undefined => {
	const picked = chosen[anchor]

	if (picked !== undefined) {
		return semver.major(picked)
	}

	const declared = declaredDependency(manifest, anchor)
	const floor = declared !== undefined && semver.validRange(declared) !== null ? semver.minVersion(declared) : null

	return floor === null ? undefined : floor.major
}

const pickVersion = (metadata: PackageMetadata, chosen: Record<string, string>, major?: number): string => {
	const ordered = stableVersionsDesc(metadata.versions)
	const currentMajor = major ?? semver.major(ordered[0] ?? '0.0.0')

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
	features: InitFeatures,
	manifest: Record<string, unknown>,
	opts: { silent?: boolean } = {}
): Promise<ResolvedSpecs> => {
	const names: string[] = [...ALWAYS_PACKAGES]

	if (features.linter) {
		names.push(...LINTER_PACKAGES)
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
			const lockstep = MAJOR_LOCKSTEP[name]
			const major = lockstep === undefined ? undefined : anchorMajor(lockstep, chosen, manifest)

			const version =
				name in ANCHOR_MAX_MAJOR ? pickAnchorVersion(metadata, name) : pickVersion(metadata, chosen, major)

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

	const spinner = startSpinner(`Resolving ${ordered.length} dev package${ordered.length === 1 ? '' : 's'}`, {
		silent: opts.silent
	})

	try {
		for (let i = 0; i < ordered.length; i++) {
			const name = ordered[i] ?? ''

			spinner.update(`Resolving ${i + 1}/${ordered.length}: ${name}`)
			dev.push(await resolveOne(name))
		}

		spinner.done(`Resolved ${ordered.length} dev package${ordered.length === 1 ? '' : 's'}`)
	} catch (error) {
		spinner.fail(`Failed to resolve dev packages`)
		throw error
	}

	return {
		dev,
		offlineFallback
	}
}
