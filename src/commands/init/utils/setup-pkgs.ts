import type { PackageManager } from 'nypm'
import { execa } from 'execa'

import { addDependency, addDevDependency } from '@/utils/package-installer'
import { PackageToInstall, SetupAnswers } from '@/commands/init/types/setup-pkgs'
import { RepoState } from '@/utils/repo-detector'
import { logger } from '@/utils/logger'
import { peerDependencies } from '../../../../package.json'

/** The declared peerDependencies range for a package (e.g. "^8.0.0"), if any. */
const peerRange = (pkgName: string): string | undefined =>
	peerDependencies[pkgName as keyof typeof peerDependencies]

let offlineWarned = false
/** Warn once when the npm registry is unreachable. */
const warnOffline = (): void => {
	if (offlineWarned) return
	offlineWarned = true
	logger.warn('⚠️  Offline: cannot reach the npm registry. Using declared version ranges.')
}

/**
 * Get latest version within a major range from npm registry.
 * Returns null on network/registry failure (offline) instead of a fake version.
 */
const fetchLatestVersion = async (pkgName: string, major: string): Promise<string | null> => {
	try {
		const { stdout } = await execa('npm', ['view', pkgName, 'version'], {
			stdio: 'pipe',
			timeout: 10000
		})
		const latestVersion = stdout.trim()

		// Check if latest version matches the major range
		const latestMajor = latestVersion.split('.')[0]
		if (latestMajor === major) {
			return latestVersion
		}

		// If latest is different major, find the last version of the requested major
		const { stdout: versionsStdout } = await execa('npm', ['view', pkgName, 'versions', '--json'], {
			stdio: 'pipe',
			timeout: 10000
		})
		const versions: string[] = JSON.parse(versionsStdout)
		const majorVersions = versions
			.filter((v) => v.startsWith(`${major}.`) && !v.includes('-'))
			.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))

		return majorVersions[0] || null
	} catch {
		// Network/registry failure → caller falls back to the declared range.
		return null
	}
}

/**
 * Cache for fetched versions to avoid redundant npm calls.
 * Null entries mean "could not resolve (offline)".
 */
const versionCache = new Map<string, string | null>()

/**
 * Resolve the exact latest version for a package within its pinned major.
 * Returns null when offline/unreachable (warns once). Cached.
 */
const resolveVersion = async (pkgName: string): Promise<string | null> => {
	const range = peerRange(pkgName)
	const major = range?.match(/\d+/)?.[0]
	if (!major) return null

	const cacheKey = `${pkgName}@${major}`
	if (versionCache.has(cacheKey)) {
		return versionCache.get(cacheKey)! ?? null
	}

	const version = await fetchLatestVersion(pkgName, major)
	versionCache.set(cacheKey, version)
	return version
}

/**
 * Build install spec (e.g. "eslint@8.57.1"). On offline, falls back to the
 * declared range (e.g. "eslint@^8.0.0") which package managers accept.
 */
export const buildPkgSpec = async (pkgName: string): Promise<string> => {
	const version = await resolveVersion(pkgName)
	if (version) return `${pkgName}@${version}`

	// Offline → use declared range.
	warnOffline()
	const range = peerRange(pkgName)
	return range ? `${pkgName}@${range}` : pkgName
}

/**
 * Full version range for package.json (e.g. "^8.57.1"). On offline, returns
 * the declared peerDependencies range (e.g. "^8.0.0").
 */
export const buildPkgRange = async (pkgName: string): Promise<string> => {
	const version = await resolveVersion(pkgName)
	if (version) return `^${version}`

	// Offline → use declared range.
	warnOffline()
	const range = peerRange(pkgName)
	return range ?? '*'
}

/** Flatten conditional package definitions into individual names. */
const flattenPackages = (pkgs: PackageToInstall[]): string[] =>
	pkgs.flatMap((pkg) => (Array.isArray(pkg.name) ? pkg.name : [pkg.name]))

/** Filter conditional packages by current answers. */
const setupConditionalPackages = (pkgs: PackageToInstall[], answers: SetupAnswers): PackageToInstall[] =>
	pkgs.filter((dep) => (dep.condition ? dep.condition(answers) : true))

export interface InstallPlanEntry {
	name: string
	spec: string // full version spec, e.g. "eslint@8.57.1"
	range: string // full version range, e.g. "^8.57.1"
	dev: boolean
}

export interface InstallPlan {
	/** Packages not yet present in package.json, ready to install/save. */
	toInstall: InstallPlanEntry[]
	/** Package names already in package.json (skipped to avoid duplicates). */
	skipped: string[]
}

/**
 * The full set of packages jss-devtools manages, split into always-on common
 * tools and framework/feature-conditional formatter deps. Extracted so both
 * conflict detection (full intended list) and install planning share one source.
 */
const getPackageDefinitions = (): { common: PackageToInstall[]; formatter: PackageToInstall[] } => ({
	common: [
		{ name: 'typescript', dev: true },
		{ name: 'husky', dev: true },
		{ name: 'lint-staged', dev: true }
	],
	formatter: [
		{ name: 'prettier', dev: true },
		{ name: 'eslint', dev: true },
		{ name: '@eslint/js', dev: true },
		{ name: 'globals', dev: true },
		{ name: '@typescript-eslint/parser', dev: true },
		{ name: '@typescript-eslint/eslint-plugin', dev: true },
		{ name: 'eslint-config-prettier', dev: true },
		{ name: 'eslint-plugin-autofix', dev: true },
		{ name: 'eslint-plugin-import', dev: true },
		{ name: 'eslint-plugin-prefer-arrow-functions', dev: true },
		// Framework-conditional
		{
			name: ['eslint-plugin-react', 'eslint-plugin-react-hooks', 'eslint-plugin-react-native'],
			dev: true,
			condition: (a: SetupAnswers) => ['react', 'react-native', 'nextjs'].includes(a.framework)
		},
		{
			name: '@next/eslint-plugin-next',
			dev: true,
			condition: (a: SetupAnswers) => ['nextjs'].includes(a.framework)
		},
		{
			name: ['eslint-plugin-tailwindcss', 'prettier-plugin-tailwindcss'],
			dev: true,
			condition: (a: SetupAnswers) => a.useTailwind === true
		},
		{
			name: 'eslint-plugin-storybook',
			dev: true,
			condition: (a: SetupAnswers) => a.useStorybook === true
		}
	]
})

/**
 * Resolve the full intended package list for given answers, with the range
 * jss-devtools pins (from peerDependencies). No network calls — intended for
 * conflict detection against the user's currently-installed versions.
 * Returns name → range (e.g. "eslint-plugin-react" → "^7.0.0").
 */
export const getIntendedRanges = (answers: SetupAnswers): Map<string, string> => {
	const { common, formatter } = getPackageDefinitions()
	const selected = setupConditionalPackages([...common, ...formatter], answers)
	const names = flattenPackages(selected)

	const ranges = new Map<string, string>()
	for (const name of names) {
		const range = peerDependencies[name as keyof typeof peerDependencies]
		if (range) ranges.set(name, range)
	}
	return ranges
}

/**
 * Build the dependency list for given answers, partitioned against the current
 * repo state. Already-installed packages are skipped unless listed in
 * `overwrite` (user opted to overwrite conflicting versions). Fetches latest
 * versions from the npm registry during execution.
 */
export const buildInstallPlan = async (
	answers: SetupAnswers,
	repoState: RepoState,
	overwrite: string[] = []
): Promise<InstallPlan> => {
	const { common, formatter } = getPackageDefinitions()
	const selected = setupConditionalPackages([...common, ...formatter], answers)

	const allNames = flattenPackages(selected)
	const overwriteSet = new Set(overwrite)
	const skipped: string[] = []
	const toInstall: InstallPlanEntry[] = []

	// Fetch all versions in parallel for better performance.
	// Skip already-installed packages unless the user chose to overwrite them.
	const versionPromises = allNames.map(async (name) => {
		if (repoState.installedPackages.has(name) && !overwriteSet.has(name)) {
			return null
		}
		const spec = await buildPkgSpec(name)
		const range = await buildPkgRange(name)
		return { name, spec, range, dev: true }
	})

	const results = await Promise.all(versionPromises)

	for (const result of results) {
		if (!result) continue
		toInstall.push(result)
	}

	// Fill skipped list (installed and NOT overwritten).
	for (const name of allNames) {
		if (repoState.installedPackages.has(name) && !overwriteSet.has(name)) {
			skipped.push(name)
		}
	}

	return { toInstall, skipped }
}

/**
 * Execute install via the detected package manager (Mode A: install now).
 * Runs addDependency/addDevDependency which delegate to execa with cwd set.
 */
export const executeInstall = async (plan: InstallPlan, pm: PackageManager): Promise<void> => {
	const devSpecs = plan.toInstall.filter((p) => p.dev).map((p) => p.spec)
	const prodSpecs = plan.toInstall.filter((p) => !p.dev).map((p) => p.spec)

	// Sequential awaits prevent EEXIST race in concurrent bun link operations.
	if (prodSpecs.length > 0) {
		await addDependency(prodSpecs, pm)
	}
	if (devSpecs.length > 0) {
		await addDevDependency(devSpecs, pm)
	}
}
